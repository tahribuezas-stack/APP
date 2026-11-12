/**
 * KINET OS // Motor Oficial de Backend & Sincronización Automática con Supabase
 * Servidor: https://bhqgsbtkwdxdxlvlcaes.supabase.co
 */
(function (window) {
  'use strict';

  const SUPABASE_URL = 'https://bhqgsbtkwdxdxlvlcaes.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_GrgL4iukPUJJyh91BdgfIQ_P0NQd6Nj';

  let sbClient = null;
  let syncTimeout = null;
  let isHydratingFromCloud = false;

  // 1. Cargar automáticamente la librería de Supabase si el HTML actual no la tiene en el <head>
  function ensureSupabaseLibraryLoaded(callback) {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      callback();
      return;
    }
    const existingScript = document.querySelector('script[src*="supabase-js"]');
    if (existingScript) {
      existingScript.addEventListener('load', callback);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = callback;
    document.head.appendChild(script);
  }

  function initSupabase() {
    if (sbClient) return sbClient;
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('⚡ KINET OS Cloud: Conectado en vivo a Supabase (bhqgsbtkwdxdxlvlcaes)');
    }
    return sbClient;
  }

  // Recopila todas las variables kinet_* de localStorage para guardarlas en la cuenta del usuario
  function collectAllKinetLocalState() {
    const state = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('kinet_') && k !== 'kinet_sb_key') {
        state[k] = localStorage.getItem(k);
      }
    }
    return state;
  }

  // Restaura desde la nube todas las variables kinet_* del usuario en localStorage
  function restoreCloudStateToLocal(profileRow) {
    if (!profileRow) return;
    isHydratingFromCloud = true;
    try {
      const cloudState = profileRow.user_state || {};
      Object.keys(cloudState).forEach((k) => {
        if (cloudState[k] !== null && cloudState[k] !== undefined) {
          originalSetItem.call(localStorage, k, String(cloudState[k]));
        }
      });

      if (profileRow.id) originalSetItem.call(localStorage, 'kinet_user_id', profileRow.id);
      if (profileRow.email) originalSetItem.call(localStorage, 'kinet_user_email', profileRow.email);
      if (profileRow.full_name) originalSetItem.call(localStorage, 'kinet_user_name', profileRow.full_name);
      if (profileRow.handle) {
        originalSetItem.call(localStorage, 'kinet_username', profileRow.handle);
        originalSetItem.call(localStorage, 'kinet_social_handle', profileRow.handle);
      }
      if (profileRow.bio) originalSetItem.call(localStorage, 'kinet_social_bio', profileRow.bio);
      if (profileRow.avatar_url) originalSetItem.call(localStorage, 'kinet_user_avatar', profileRow.avatar_url);
      if (profileRow.active_role) {
        originalSetItem.call(localStorage, 'kinet_active_role', profileRow.active_role);
        originalSetItem.call(localStorage, 'kinet_role', profileRow.active_role);
      }
      if (profileRow.active_sport) originalSetItem.call(localStorage, 'kinet_sport', profileRow.active_sport);
      if (profileRow.position) originalSetItem.call(localStorage, 'kinet_position', profileRow.position);
      if (profileRow.category) originalSetItem.call(localStorage, 'kinet_category', profileRow.category);
      if (profileRow.club) originalSetItem.call(localStorage, 'kinet_user_club', profileRow.club);
      if (profileRow.account_tier) originalSetItem.call(localStorage, 'kinet_account_tier', profileRow.account_tier);
      if (typeof profileRow.video_mins_used === 'number') {
        originalSetItem.call(localStorage, 'kinet_video_mins_used', String(profileRow.video_mins_used));
      }
      if (typeof profileRow.bonus_video_mins === 'number') {
        originalSetItem.call(localStorage, 'kinet_bonus_video_mins', String(profileRow.bonus_video_mins));
      }
      originalSetItem.call(localStorage, 'kinet_logged_in', 'true');
      originalSetItem.call(localStorage, 'kinet_social_configured', 'true');
    } finally {
      isHydratingFromCloud = false;
    }
  }

  // 2. INTERCEPTOR AUTOMÁTICO DE LOCALSTORAGE:
  // Cada vez que cualquier archivo HTML hace localStorage.setItem('kinet_...', ...),
  // se sincroniza automáticamente con la fila del usuario en Supabase.
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function (key, value) {
    originalSetItem.apply(this, arguments);
    if (!isHydratingFromCloud && key && key.startsWith('kinet_')) {
      scheduleCloudSync();
    }
  };

  function scheduleCloudSync() {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      KinetBackend.pushLocalStateToCloud();
    }, 650);
  }

  const KinetBackend = {
    getClient: initSupabase,

    // Empuja todo el estado actual del usuario a la tabla `profiles` de Supabase
    async pushLocalStateToCloud() {
      const sb = initSupabase();
      const userId = localStorage.getItem('kinet_user_id');
      if (!sb || !userId) return { ok: false, reason: 'no_session' };

      const payload = {
        id: userId,
        email: localStorage.getItem('kinet_user_email') || null,
        full_name: localStorage.getItem('kinet_user_name') || 'Atleta KINET',
        handle: localStorage.getItem('kinet_social_handle') || localStorage.getItem('kinet_username') || '@kinet_pro',
        avatar_url: localStorage.getItem('kinet_user_avatar') || null,
        bio: localStorage.getItem('kinet_social_bio') || 'Perfil Verificado KINET OS',
        active_role: localStorage.getItem('kinet_active_role') || 'athlete',
        active_sport: localStorage.getItem('kinet_sport') || 'Fútbol',
        position: localStorage.getItem('kinet_position') || 'PRO',
        category: localStorage.getItem('kinet_category') || 'Senior',
        club: localStorage.getItem('kinet_user_club') || 'KINET Performance',
        account_tier: localStorage.getItem('kinet_account_tier') || 'free',
        video_mins_used: parseFloat(localStorage.getItem('kinet_video_mins_used') || '0'),
        bonus_video_mins: parseFloat(localStorage.getItem('kinet_bonus_video_mins') || '0'),
        user_state: collectAllKinetLocalState(),
        updated_at: new Date().toISOString()
      };

      const { error } = await sb.from('profiles').upsert(payload);
      if (error) {
        console.warn('⚠️ KINET Cloud Sync Aviso:', error.message);
        return { ok: false, error };
      }
      console.log('☁️ KINET Cloud: Registros de usuario sincronizados en Supabase');
      return { ok: true };
    },

    // Descarga los datos más recientes del usuario al abrir cualquier página
    async pullCloudStateToLocal() {
      const sb = initSupabase();
      if (!sb) return null;

      const { data: sessionData } = await sb.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return null;

      originalSetItem.call(localStorage, 'kinet_user_id', user.id);
      const { data: prof, error } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (!error && prof) {
        restoreCloudStateToLocal(prof);
        return prof;
      }
      return null;
    },

    // REGISTRO REAL EN SUPABASE AUTH + CREACIÓN DE FILA EN TABLA PROFILES
    async registerUser({ firstName, lastName, handle, email, phone, password }) {
      const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Atleta KINET';
      const cleanHandle = (handle || '').startsWith('@') ? handle : `@${handle}`;

      originalSetItem.call(localStorage, 'kinet_user_name', fullName);
      originalSetItem.call(localStorage, 'kinet_user_email', email);
      originalSetItem.call(localStorage, 'kinet_username', cleanHandle);
      originalSetItem.call(localStorage, 'kinet_social_handle', cleanHandle);
      originalSetItem.call(localStorage, 'kinet_logged_in', 'true');
      originalSetItem.call(localStorage, 'kinet_social_configured', 'true');

      const sb = initSupabase();
      if (!sb) throw new Error('El SDK de Supabase aún se está cargando. Inténtalo de nuevo en 1 segundo.');

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
        originalSetItem.call(localStorage, 'kinet_user_id', userId);
        await this.pushLocalStateToCloud();
      }

      return { ok: true, user: data.user };
    },

    // LOGIN REAL EN SUPABASE AUTH + DESCARGA DE TODOS LOS REGISTROS DEL USUARIO
    async loginUser({ email, password }) {
      const sb = initSupabase();
      if (!sb) throw new Error('El SDK de Supabase aún se está cargando.');

      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const userId = data?.user?.id;
      if (userId) {
        originalSetItem.call(localStorage, 'kinet_user_id', userId);
        const { data: prof } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (prof) {
          restoreCloudStateToLocal(prof);
        } else {
          const meta = data.user.user_metadata || {};
          originalSetItem.call(localStorage, 'kinet_user_name', meta.full_name || email.split('@')[0]);
          originalSetItem.call(localStorage, 'kinet_user_email', email);
          originalSetItem.call(localStorage, 'kinet_social_handle', meta.handle || '@' + email.split('@')[0]);
          originalSetItem.call(localStorage, 'kinet_logged_in', 'true');
          await this.pushLocalStateToCloud();
        }
      }

      return { ok: true, user: data.user };
    },

    // PUBLICAR UN POST O SHORT REAL EN LA TABLA `posts` DE SUPABASE
    async createCloudPost(postObj) {
      const sb = initSupabase();
      const userId = localStorage.getItem('kinet_user_id');
      if (!sb || !userId) return { ok: false };

      const { data, error } = await sb.from('posts').insert({
        author_id: userId,
        author_name: postObj.author,
        author_handle: postObj.handle,
        author_role: postObj.role || 'athlete',
        author_headline: postObj.headline || '',
        sport: postObj.sport || 'Fútbol',
        mode: postObj.mode || 'post',
        content: postObj.text,
        badge: postObj.badge || 'KINET PULSE',
        reel_data: postObj.reelData || null,
        likes_count: postObj.likes || 1
      }).select().single();

      return { ok: !error, data, error };
    },

    // LEER PUBLICACIONES REALES DE LA COMUNIDAD EN SUPABASE
    async fetchCloudPosts() {
      const sb = initSupabase();
      if (!sb) return [];
      const { data, error } = await sb
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error || !data) return [];
      return data;
    },

    // ENVIAR UN MENSAJE DIRECTO (DM) REAL A OTRO USUARIO
    async sendCloudDirectMessage(receiverHandle, messageText) {
      const sb = initSupabase();
      const userId = localStorage.getItem('kinet_user_id');
      const senderHandle = localStorage.getItem('kinet_social_handle') || '@kinet_user';
      if (!sb || !userId) return { ok: false };

      const { error } = await sb.from('direct_messages').insert({
        sender_id: userId,
        sender_handle: senderHandle,
        receiver_handle: receiverHandle,
        message_text: messageText
      });
      return { ok: !error, error };
    },

    // CERRAR SESIÓN Y LIMPIAR ESTADO LOCAL
    async logoutUser() {
      await this.pushLocalStateToCloud();
      const sb = initSupabase();
      if (sb) await sb.auth.signOut();
      originalSetItem.call(localStorage, 'kinet_logged_in', 'false');
      localStorage.removeItem('kinet_logged_in');
      localStorage.removeItem('kinet_guest_session');
      localStorage.removeItem('kinet_user_id');
    }
  };

  window.KinetBackend = KinetBackend;

  // Al cargar cualquier página de la app, inicializa Supabase y sincroniza
  ensureSupabaseLibraryLoaded(() => {
    initSupabase();
    KinetBackend.pullCloudStateToLocal();
  });
})(window);
