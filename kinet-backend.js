/**
 * KINET OS // Motor Oficial de Backend & Sincronización Directa REST con Supabase (v3 Garantizado)
 * Servidor: https://bhqgsbtkwdxdxlvlcaes.supabase.co
 */
(function (window) {
  'use strict';

  const SUPABASE_URL = 'https://bhqgsbtkwdxdxlvlcaes.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_GrgL4iukPUJJyh91BdgfIQ_P0NQd6Nj';

  let sbClient = null;
  let syncTimeout = null;
  let isHydratingFromCloud = false;

  // Función auxiliar REST directa (Funciona al 100% incluso sin librería externa CDN)
  async function supabaseRestRequest(tableAndQuery, method = 'GET', bodyObj = null, upsert = false) {
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': upsert ? 'resolution=merge-duplicates,return=representation' : 'return=representation'
    };
    const options = { method, headers };
    if (bodyObj) options.body = JSON.stringify(bodyObj);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableAndQuery}`, options);
    if (!res.ok) {
      const errTxt = await res.text();
      throw new Error(`Supabase HTTP ${res.status}: ${errTxt}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  function initSupabase() {
    if (sbClient) return sbClient;
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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

  async function resolveCurrentUserId() {
    let uid = localStorage.getItem('kinet_user_id');
    if (uid && uid.length > 20) return uid;

    try {
      const rows = await supabaseRestRequest('profiles?select=id,email,full_name,handle&limit=1', 'GET');
      if (Array.isArray(rows) && rows.length > 0 && rows[0].id) {
        originalSetItem.call(localStorage, 'kinet_user_id', rows[0].id);
        return rows[0].id;
      }
    } catch (e) {
      console.warn('Aviso resolviendo ID de perfil:', e.message);
    }
    return null;
  }

  const KinetBackend = {
    getClient: initSupabase,

    // Guarda el estado del usuario en la tabla `profiles`
    async pushLocalStateToCloud() {
      try {
        const userId = await resolveCurrentUserId();
        if (!userId) return { ok: false };

        const payload = {
          id: userId,
          email: localStorage.getItem('kinet_user_email') || undefined,
          full_name: localStorage.getItem('kinet_user_name') || 'Naim Tahri Buezas',
          handle: localStorage.getItem('kinet_social_handle') || localStorage.getItem('kinet_username') || '@naimtahri',
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

        await supabaseRestRequest('profiles', 'POST', payload, true);
        console.log('☁️ KINET Cloud: Perfil sincronizado en Supabase');
        return { ok: true };
      } catch (err) {
        console.warn('⚠️ Error sincronizando perfil:', err.message);
        return { ok: false, error: err };
      }
    },

    async pullCloudStateToLocal() {
      try {
        const userId = await resolveCurrentUserId();
        if (!userId) return null;
        const rows = await supabaseRestRequest(`profiles?id=eq.${userId}&select=*`, 'GET');
        if (Array.isArray(rows) && rows[0]) {
          const prof = rows[0];
          if (prof.full_name && !localStorage.getItem('kinet_user_name')) {
            originalSetItem.call(localStorage, 'kinet_user_name', prof.full_name);
          }
          if (prof.handle && !localStorage.getItem('kinet_social_handle')) {
            originalSetItem.call(localStorage, 'kinet_social_handle', prof.handle);
          }
          return prof;
        }
      } catch (e) {}
      return null;
    },

    // PUBLICAR UN POST DIRECTAMENTE EN LA TABLA `public.posts` DE SUPABASE VÍA REST
    async createCloudPost(postObj) {
      try {
        const localSaved = JSON.parse(localStorage.getItem('kinet_saved_posts') || '[]');
        if (!localSaved.some(p => p.id === postObj.id)) {
          localSaved.unshift(postObj);
          originalSetItem.call(localStorage, 'kinet_saved_posts', JSON.stringify(localSaved.slice(0, 50)));
        }
      } catch (e) {}

      try {
        const userId = await resolveCurrentUserId();
        const insertPayload = {
          author_id: userId || null,
          author_name: postObj.author || localStorage.getItem('kinet_user_name') || 'Naim Tahri Buezas',
          author_handle: postObj.handle || localStorage.getItem('kinet_social_handle') || '@naimtahri',
          author_role: postObj.role || localStorage.getItem('kinet_active_role') || 'athlete',
          author_headline: postObj.headline || 'Perfil Verificado KINET OS',
          sport: postObj.sport || localStorage.getItem('kinet_sport') || 'Fútbol',
          mode: postObj.mode || 'post',
          content: postObj.text,
          badge: postObj.badge || 'KINET PULSE',
          reel_data: postObj.reelData || null,
          likes_count: postObj.likes || 1
        };

        const data = await supabaseRestRequest('posts', 'POST', insertPayload, false);
        console.log('✅ Post insertado en Supabase public.posts:', data);
        return { ok: true, data: Array.isArray(data) ? data[0] : data };
      } catch (err) {
        console.error('❌ Error al insertar post en Supabase:', err.message);
        return { ok: false, error: err };
      }
    },

    // LEER TODOS LOS POSTS DE LA TABLA `public.posts` VÍA REST
    async fetchCloudPosts() {
      try {
        const data = await supabaseRestRequest('posts?select=*&order=created_at.desc&limit=50', 'GET');
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.warn('Error leyendo posts de Supabase:', err.message);
        return [];
      }
    },

    // ENVIAR UN MENSAJE DIRECTO A `public.direct_messages` VÍA REST
    async sendCloudDirectMessage(receiverHandle, messageText) {
      try {
        const userId = await resolveCurrentUserId();
        const senderHandle = localStorage.getItem('kinet_social_handle') || localStorage.getItem('kinet_username') || '@naimtahri';
        const data = await supabaseRestRequest('direct_messages', 'POST', {
          sender_id: userId || null,
          sender_handle: senderHandle,
          receiver_handle: receiverHandle,
          message_text: messageText
        }, false);
        console.log('✅ DM guardado en Supabase public.direct_messages:', data);
        return { ok: true, data };
      } catch (err) {
        console.error('❌ Error enviando DM a Supabase:', err.message);
        return { ok: false, error: err };
      }
    }
  };
// ENVIAR UN MENSAJE DIRECTO A `public.direct_messages` (SIEMPRE EMPIEZA EN NO VISTO: is_read = false)
    async sendCloudDirectMessage(receiverHandle, messageText) {
      try {
        const userId = await resolveCurrentUserId();
        const senderHandle = localStorage.getItem('kinet_social_handle') || localStorage.getItem('kinet_username') || '@naimtahri';
        const data = await supabaseRestRequest('direct_messages', 'POST', {
          sender_id: userId || null,
          sender_handle: senderHandle,
          receiver_handle: receiverHandle,
          message_text: messageText,
          is_read: false,
          read_at: null
        }, false);
        return { ok: true, data: Array.isArray(data) ? data[0] : data };
      } catch (err) {
        console.error('❌ Error enviando DM a Supabase:', err.message);
        return { ok: false, error: err };
      }
    },

    // MARCAR COMO VISTOS EN SUPABASE LOS MENSAJES QUE OTRA PERSONA ME ENVIÓ A MÍ CUANDO ABRO SU CHAT
    async markDirectMessagesAsRead(otherPersonHandle) {
      try {
        const myHandle = localStorage.getItem('kinet_social_handle') || localStorage.getItem('kinet_username');
        if (!myHandle || !otherPersonHandle) return { ok: false };
        const nowIso = new Date().toISOString();
        await supabaseRestRequest(
          `direct_messages?sender_handle=eq.${encodeURIComponent(otherPersonHandle)}&receiver_handle=eq.${encodeURIComponent(myHandle)}&is_read=eq.false`,
          'PATCH',
          { is_read: true, read_at: nowIso },
          false
        );
        return { ok: true, read_at: nowIso };
      } catch (err) {
        return { ok: false, error: err };
      }
    },
  window.KinetBackend = KinetBackend;
  KinetBackend.pullCloudStateToLocal();
})(window);
