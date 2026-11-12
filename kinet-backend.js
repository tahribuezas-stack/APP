/**
 * KINET OS // Motor Central de Backend, Auth, Base de Datos & IA (Supabase + Gemini)
 */
(function (window) {
  'use strict';

  // =========================================================================
  // 1. PEGA AQUÍ TUS CREDENCIALES DE SUPABASE (Settings -> API)
  // =========================================================================
  const SUPABASE_URL = localStorage.getItem('kinet_sb_url') || 'TU_SUPABASE_URL';
  const SUPABASE_ANON_KEY = localStorage.getItem('kinet_sb_key') || 'TU_SUPABASE_ANON_KEY';

  let sbClient = null;

  function isCloudConfigured() {
    return (
      SUPABASE_URL &&
      SUPABASE_ANON_KEY &&
      SUPABASE_URL.startsWith('https://') &&
      !SUPABASE_URL.includes('TU_SUPABASE')
    );
  }

  function initSupabase() {
    if (sbClient) return sbClient;
    if (isCloudConfigured() && window.supabase && typeof window.supabase.createClient === 'function') {
      sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('⚡ KINET OS Cloud: Conectado a Supabase PostgreSQL');
    } else {
      console.log('ℹ️ KINET OS: Operando en modo LocalStorage (Configura SUPABASE_URL en kinet-backend.js para activar la nube)');
    }
    return sbClient;
  }

  // Sincroniza un perfil de la base de datos hacia las variables locales que leen tus HTML
  function syncProfileToLocalCache(profile) {
    if (!profile) return;
    if (profile.id) localStorage.setItem('kinet_user_id', profile.id);
    if (profile.email) localStorage.setItem('kinet_user_email', profile.email);
    if (profile.full_name) localStorage.setItem('kinet_user_name', profile.full_name);
    if (profile.handle) {
      localStorage.setItem('kinet_username', profile.handle);
      localStorage.setItem('kinet_social_handle', profile.handle);
    }
    if (profile.bio) localStorage.setItem('kinet_social_bio', profile.bio);
    if (profile.avatar_url) localStorage.setItem('kinet_user_avatar', profile.avatar_url);
    if (profile.active_role) {
      localStorage.setItem('kinet_active_role', profile.active_role);
      localStorage.setItem('kinet_role', profile.active_role);
    }
    if (profile.active_sport) localStorage.setItem('kinet_sport', profile.active_sport);
    if (profile.position) localStorage.setItem('kinet_position', profile.position);
    if (profile.category) localStorage.setItem('kinet_category', profile.category);
    if (profile.club) localStorage.setItem('kinet_user_club', profile.club);
    if (profile.account_tier) localStorage.setItem('kinet_account_tier', profile.account_tier);
    if (typeof profile.video_mins_used === 'number') {
      localStorage.setItem('kinet_video_mins_used', String(profile.video_mins_used));
    }
    if (typeof profile.bonus_video_mins === 'number') {
      localStorage.setItem('kinet_bonus_video_mins', String(profile.bonus_video_mins));
    }
    localStorage.setItem('kinet_logged_in', 'true');
    localStorage.setItem('kinet_social_configured', 'true');
  }

  const KinetBackend = {
    isCloudReady: isCloudConfigured,

    // REGISTRO REAL DE USUARIO EN SUPABASE AUTH + TABLA PROFILES
    async registerUser({ firstName, lastName, handle, email, phone, password }) {
      const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Atleta KINET';
      const cleanHandle = (handle || '').startsWith('@') ? handle : `@${handle}`;

      // Guardado inmediato en caché local para respuesta instantánea de la UI
      syncProfileToLocalCache({
        email,
        full_name: fullName,
        handle: cleanHandle,
        active_role: localStorage.getItem('kinet_active_role') || 'athlete',
        active_sport: localStorage.getItem('kinet_sport') || 'Fútbol'
      });

      const sb = initSupabase();
      if (!sb) {
        return { ok: true, mode: 'local', user: { email, full_name: fullName, handle: cleanHandle } };
      }

      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, handle: cleanHandle, phone: phone || '' }
        }
      });

      if (error) throw error;

      const userId = data?.user?.id;
      if (userId) {
        const newProfile = {
          id: userId,
          email,
          full_name: fullName,
          handle: cleanHandle,
          active_role: 'athlete',
          active_sport: 'Fútbol',
          account_tier: 'free'
        };
        await sb.from('profiles').upsert(newProfile);
        syncProfileToLocalCache(newProfile);
      }

      return { ok: true, mode: 'cloud', user: data.user };
    },

    // INICIO DE SESIÓN REAL CON CORREO Y CONTRASEÑA
    async loginUser({ email, password }) {
      const sb = initSupabase();
      if (!sb) {
        const rawUser = email.split('@')[0] || 'atleta';
        const existingName = localStorage.getItem('kinet_user_name') || rawUser.replace(/[._-]/g, ' ');
        syncProfileToLocalCache({
          email,
          full_name: existingName,
          handle: '@' + rawUser
        });
        return { ok: true, mode: 'local' };
      }

      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const userId = data?.user?.id;
      if (userId) {
        const { data: prof } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (prof) {
          syncProfileToLocalCache(prof);
          localStorage.setItem('kinet_profile_completed', 'true');
        } else {
          const meta = data.user.user_metadata || {};
          syncProfileToLocalCache({
            id: userId,
            email: data.user.email,
            full_name: meta.full_name || email.split('@')[0],
            handle: meta.handle || '@' + email.split('@')[0]
          });
        }
      }

      return { ok: true, mode: 'cloud', user: data.user };
    },

    // GUARDAR / ACTUALIZAR PERFIL EN LA BASE DE DATOS DESDE ONBOARDING, PERFIL O DESPACHO
    async saveUserProfile(partialData) {
      syncProfileToLocalCache(partialData);
      const sb = initSupabase();
      const userId = localStorage.getItem('kinet_user_id');
      if (!sb || !userId) return { ok: true, mode: 'local' };

      const payload = { id: userId, ...partialData };
      const { error } = await sb.from('profiles').upsert(payload);
      if (error) console.error('Error guardando perfil en Supabase:', error.message);
      return { ok: !error, error };
    },

    // CERRAR SESIÓN REAL
    async logoutUser() {
      const sb = initSupabase();
      if (sb) {
        await sb.auth.signOut();
      }
      localStorage.removeItem('kinet_logged_in');
      localStorage.removeItem('kinet_guest_session');
      localStorage.removeItem('kinet_user_id');
    }
  };

  window.KinetBackend = KinetBackend;
  document.addEventListener('DOMContentLoaded', initSupabase);
})(window);