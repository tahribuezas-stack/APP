/**
 * KINET OS // Motor Oficial de Backend & Sincronización Automática con Supabase (v2 Blindado)
 * Servidor: https://bhqgsbtkwdxdxlvlcaes.supabase.co
 */
(function (window) {
  'use strict';

  const SUPABASE_URL = 'https://bhqgsbtkwdxdxlvlcaes.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_GrgL4iukPUJJyh91BdgfIQ_P0NQd6Nj';

  let sbClient = null;
  let syncTimeout = null;
  let isHydratingFromCloud = false;

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
    }, 600);
  }

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
      originalSetItem.call(localStorage, 'kinet_logged_in', 'true');
      originalSetItem.call(localStorage, 'kinet_social_configured', 'true');
    } finally {
      isHydratingFromCloud = false;
    }
  }

  // Resuelve el UUID del usuario actual buscando por sesión, email o handle en Supabase
  async function resolveCurrentUserId() {
    let uid = localStorage.getItem('kinet_user_id');
    if (uid && uid.length > 20) return uid;

    const sb = initSupabase();
    if (!sb) return null;

    try {
      const { data: sData } = await sb.auth.getSession();
      if (sData?.session?.user?.id) {
        uid = sData.session.user.id;
        originalSetItem.call(localStorage, 'kinet_user_id', uid);
        return uid;
      }

      const email = localStorage.getItem('kinet_user_email');
      const handle = localStorage.getItem('kinet_social_handle') || localStorage.getItem('kinet_username');

      if (email) {
        const { data: profByEmail } = await sb.from('profiles').select('id').eq('email', email).maybeSingle();
        if (profByEmail?.id) {
          originalSetItem.call(localStorage, 'kinet_user_id', profByEmail.id);
          return profByEmail.id;
        }
      }
      if (handle) {
        const { data: profByHandle } = await sb.from('profiles').select('id').eq('handle', handle).maybeSingle();
        if (profByHandle?.id) {
          originalSetItem.call(localStorage, 'kinet_user_id', profByHandle.id);
          return profByHandle.id;
        }
      }

      // Si solo hay 1 perfil en la tabla (tu cuenta), vincularlo automáticamente
      const { data: anyProf } = await sb.from('profiles').select('id, email, full_name, handle').limit(1).maybeSingle();
      if (anyProf?.id) {
        originalSetItem.call(localStorage, 'kinet_user_id', anyProf.id);
        return anyProf.id;
      }
    } catch (e) {
      console.warn('Error resolviendo user_id:', e);
    }
    return null;
  }

  const KinetBackend = {
    getClient: initSupabase,
    resolveUserId: resolveCurrentUserId,

    async pushLocalStateToCloud() {
      const sb = initSupabase();
      if (!sb) return { ok: false, reason: 'no_sb' };

      const userId = await resolveCurrentUserId();
      if (!userId) return { ok: false, reason: 'no_user_id' };

      const payload = {
        id: userId,
        email: localStorage.getItem('kinet_user_email') || undefined,
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
      console.log('☁️ KINET Cloud: Perfil y user_state guardados en Supabase');
      return { ok: true };
    },

    async pullCloudStateToLocal() {
      const sb = initSupabase();
      if (!sb) return null;

      const userId = await resolveCurrentUserId();
      if (!userId) return null;

      const { data: prof, error } = await sb.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (!error && prof) {
        restoreCloudStateToLocal(prof);
        return prof;
      }
      return null;
    },

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
      if (!sb) throw new Error('Cargando conexión con Supabase...');

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

    async loginUser({ email, password }) {
      const sb = initSupabase();
      if (!sb) throw new Error('Cargando conexión con Supabase...');

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

    // PUBLICAR UN POST O SHORT EN SUPABASE (FUNCIONA INCLUSO SIN UUID ACTIVO)
    async createCloudPost(postObj) {
      // 1. Guardar siempre copia inmediata en localStorage para que jamás se borre al recargar
      try {
        const localSaved = JSON.parse(localStorage.getItem('kinet_saved_posts') || '[]');
        if (!localSaved.some(p => p.id === postObj.id)) {
          localSaved.unshift(postObj);
          originalSetItem.call(localStorage, 'kinet_saved_posts', JSON.stringify(localSaved.slice(0, 50)));
        }
      } catch (e) {}

      // 2. Enviar a la tabla `public.posts` de Supabase
      let sb = initSupabase();
      if (!sb) {
        await new Promise(r => ensureSupabaseLibraryLoaded(r));
        sb = initSupabase();
      }
      if (!sb) return { ok: false, reason: 'no_sb' };

      const userId = await resolveCurrentUserId();

      const insertPayload = {
        author_id: userId || null,
        author_name: postObj.author || localStorage.getItem('kinet_user_name') || 'Atleta KINET',
        author_handle: postObj.handle || localStorage.getItem('kinet_social_handle') || '@kinet_pro',
        author_role: postObj.role || localStorage.getItem('kinet_active_role') || 'athlete',
        author_headline: postObj.headline || 'Perfil Verificado KINET OS',
        sport: postObj.sport || localStorage.getItem('kinet_sport') || 'Fútbol',
        mode: postObj.mode || 'post',
        content: postObj.text,
        badge: postObj.badge || 'KINET PULSE',
        reel_data: postObj.reelData || null,
        likes_count: postObj.likes || 1
      };

      const { data, error } = await sb.from('posts').insert(insertPayload).select().single();
      if (error) {
        console.error('❌ Error insertando post en Supabase:', error.message);
        return { ok: false, error };
      }
      console.log('✅ Post guardado en tabla public.posts de Supabase:', data);
      return { ok: true, data };
    },

    async fetchCloudPosts() {
      let sb = initSupabase();
      if (!sb) {
        await new Promise(r => ensureSupabaseLibraryLoaded(r));
        sb = initSupabase();
      }
      if (!sb) return [];

      const { data, error } = await sb
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !data) return [];
      return data;
    },

    // ENVIAR MENSAJE DIRECTO (DM) EN SUPABASE + GUARDADO LOCAL INMEDIATO
    async sendCloudDirectMessage(receiverHandle, messageText) {
      let sb = initSupabase();
      if (!sb) {
        await new Promise(r => ensureSupabaseLibraryLoaded(r));
        sb = initSupabase();
      }
      if (!sb) return { ok: false };

      const userId = await resolveCurrentUserId();
      const senderHandle = localStorage.getItem('kinet_social_handle') || localStorage.getItem('kinet_username') || '@kinet_user';

      const { data, error } = await sb.from('direct_messages').insert({
        sender_id: userId || null,
        sender_handle: senderHandle,
        receiver_handle: receiverHandle,
        message_text: messageText
      }).select().single();

      if (error) {
        console.error('❌ Error enviando DM a Supabase:', error.message);
      } else {
        console.log('✅ DM guardado en tabla public.direct_messages de Supabase:', data);
      }
      return { ok: !error, data, error };
    },

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

  ensureSupabaseLibraryLoaded(() => {
    initSupabase();
    KinetBackend.pullCloudStateToLocal();
  });
})(window);
