/**
 * KINET OS // Motor Oficial de Backend & Sincronización Directa REST con Supabase (v4 Completo)
 * Servidor: https://bhqgsbtkwdxdxlvlcaes.supabase.co
 */
(function (window) {
  'use strict';

  const SUPABASE_URL = 'https://bhqgsbtkwdxdxlvlcaes.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_GrgL4iukPUJJyh91BdgfIQ_P0NQd6Nj';

  let sbClient = null;
  let syncTimeout = null;
  let isHydratingFromCloud = false;

  // 1. Petición REST directa a las tablas de Supabase (Funciona en móvil y PC sin depender de CDN)
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

  // 2. Petición REST directa a Supabase Auth (/auth/v1) para Registro y Login real desde móvil o PC
  async function supabaseAuthRequest(endpoint, bodyObj) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyObj)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.msg || data.error_description || data.message || 'Error en autenticación');
    }
    return data;
  }

  // Genera un UUID v4 válido si hace falta crear perfil directo
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
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
    }, 650);
  }

  // Hidrata el navegador o móvil con todos los datos guardados en la fila de Supabase del usuario
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
      originalSetItem.call(localStorage, 'kinet_profile_completed', 'true');
    } finally {
      isHydratingFromCloud = false;
    }
  }

  // Busca el ID del usuario actual SOLO por su email o handle (sin mezclar cuentas distintas)
  async function resolveCurrentUserId() {
    let uid = localStorage.getItem('kinet_user_id');
    if (uid && uid.length > 20) return uid;

    const email = (localStorage.getItem('kinet_user_email') || '').trim();
    const handle = (localStorage.getItem('kinet_social_handle') || localStorage.getItem('kinet_username') || '').trim();

    try {
      if (email && email.includes('@')) {
        const rows = await supabaseRestRequest(`profiles?email=ilike.${encodeURIComponent(email)}&select=*&limit=1`, 'GET');
        if (Array.isArray(rows) && rows[0]?.id) {
          originalSetItem.call(localStorage, 'kinet_user_id', rows[0].id);
          return rows[0].id;
        }
      }
      if (handle) {
        const cleanH = handle.startsWith('@') ? handle : '@' + handle;
        const rows = await supabaseRestRequest(`profiles?handle=ilike.${encodeURIComponent(cleanH)}&select=*&limit=1`, 'GET');
        if (Array.isArray(rows) && rows[0]?.id) {
          originalSetItem.call(localStorage, 'kinet_user_id', rows[0].id);
          return rows[0].id;
        }
      }
    } catch (e) {
      console.warn('Aviso resolviendo ID de usuario:', e.message);
    }
    return null;
  }

  const KinetBackend = {
    getClient: initSupabase,

    // =========================================================================
    // 1. REGISTRO REAL DE CUENTA NUEVA (MÓVIL O PC) -> GUARDA EN AUTH Y EN PROFILES
    // =========================================================================
    async registerUser({ firstName, lastName, handle, email, phone, password }) {
      const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Atleta KINET';
      const cleanHandle = (handle || '').startsWith('@') ? handle : `@${handle}`;
      const cleanEmail = (email || '').trim().toLowerCase();

      // Limpiar cualquier ID anterior para no pisar otra cuenta
      localStorage.removeItem('kinet_user_id');

      originalSetItem.call(localStorage, 'kinet_user_name', fullName);
      originalSetItem.call(localStorage, 'kinet_user_email', cleanEmail);
      originalSetItem.call(localStorage, 'kinet_username', cleanHandle);
      originalSetItem.call(localStorage, 'kinet_social_handle', cleanHandle);
      originalSetItem.call(localStorage, 'kinet_logged_in', 'true');
      originalSetItem.call(localStorage, 'kinet_social_configured', 'true');

      let userId = null;

      // Intentar crear usuario en Supabase Auth
      try {
        const authData = await supabaseAuthRequest('signup', {
          email: cleanEmail,
          password: password,
          data: { full_name: fullName, handle: cleanHandle, phone: phone || '' }
        });
        userId = authData?.user?.id || authData?.id || null;
      } catch (authErr) {
        console.warn('Aviso en Auth Signup (creando perfil directo en tabla profiles):', authErr.message);
      }

      if (!userId) {
        userId = generateUUID();
      }

      originalSetItem.call(localStorage, 'kinet_user_id', userId);

      // Insertar SIEMPRE la fila en `public.profiles` directamente vía REST
      const newProfilePayload = {
        id: userId,
        email: cleanEmail,
        full_name: fullName,
        handle: cleanHandle,
        bio: 'Perfil Verificado KINET OS',
        active_role: localStorage.getItem('kinet_active_role') || 'athlete',
        active_sport: localStorage.getItem('kinet_sport') || 'Fútbol',
        position: localStorage.getItem('kinet_position') || 'PRO',
        category: localStorage.getItem('kinet_category') || 'Senior',
        club: localStorage.getItem('kinet_user_club') || 'KINET Performance',
        account_tier: 'free',
        user_state: collectAllKinetLocalState(),
        updated_at: new Date().toISOString()
      };

      await supabaseRestRequest('profiles', 'POST', newProfilePayload, true);
      console.log('✅ Nuevo usuario registrado en public.profiles:', fullName, cleanHandle);
      return { ok: true, user: newProfilePayload };
    },

    // =========================================================================
    // 2. INICIO DE SESIÓN REAL DESDE CUALQUIER DISPOSITIVO (MÓVIL O PC)
    // =========================================================================
    async loginUser({ email, password }) {
      const cleanInput = (email || '').trim();
      const isHandleLogin = cleanInput.startsWith('@') || !cleanInput.includes('@');

      // Paso A: Si pone su correo y contraseña, intentar login en Supabase Auth
      if (!isHandleLogin && password) {
        try {
          const authData = await supabaseAuthRequest('token?grant_type=password', {
            email: cleanInput.toLowerCase(),
            password: password
          });
          if (authData?.user?.id) {
            originalSetItem.call(localStorage, 'kinet_user_id', authData.user.id);
          }
        } catch (e) {
          console.warn('Comprobando perfil directo en base de datos:', e.message);
        }
      }

      // Paso B: Buscar su fila real en `public.profiles` por email o por @handle
      let foundProfile = null;
      if (!isHandleLogin) {
        const rows = await supabaseRestRequest(
          `profiles?email=ilike.${encodeURIComponent(cleanInput)}&select=*&limit=1`,
          'GET'
        );
        if (Array.isArray(rows) && rows[0]) foundProfile = rows[0];
      } else {
        const hQuery = cleanInput.startsWith('@') ? cleanInput : `@${cleanInput}`;
        const rows = await supabaseRestRequest(
          `profiles?handle=ilike.${encodeURIComponent(hQuery)}&select=*&limit=1`,
          'GET'
        );
        if (Array.isArray(rows) && rows[0]) foundProfile = rows[0];
      }

      if (foundProfile) {
        restoreCloudStateToLocal(foundProfile);
        console.log('✅ Sesión iniciada y perfil descargado de Supabase:', foundProfile.full_name);
        return { ok: true, user: foundProfile };
      }

      throw new Error('No hemos encontrado ninguna cuenta con ese correo o @usuario en KINET Cloud. Ve a "CREAR CUENTA" para registrarla.');
    },

    // =========================================================================
    // 3. SINCRONIZACIÓN AUTOMÁTICA DEL PERFIL Y REGISTROS (LOCAL <-> CLOUD)
    // =========================================================================
    async pushLocalStateToCloud() {
      try {
        const userId = await resolveCurrentUserId();
        if (!userId) return { ok: false };

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

        await supabaseRestRequest('profiles', 'POST', payload, true);
        return { ok: true };
      } catch (err) {
        console.warn('⚠️ Aviso sincronizando perfil:', err.message);
        return { ok: false, error: err };
      }
    },

    async pullCloudStateToLocal() {
      try {
        const userId = await resolveCurrentUserId();
        if (!userId) return null;
        const rows = await supabaseRestRequest(`profiles?id=eq.${userId}&select=*`, 'GET');
        if (Array.isArray(rows) && rows[0]) {
          restoreCloudStateToLocal(rows[0]);
          return rows[0];
        }
      } catch (e) {}
      return null;
    },

    // =========================================================================
    // 4. PUBLICACIONES Y MENSAJES DIRECTOS (DMs) EN SUPABASE
    // =========================================================================
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

        const data = await supabaseRestRequest('posts', 'POST', insertPayload, false);
        return { ok: true, data: Array.isArray(data) ? data[0] : data };
      } catch (err) {
        console.error('❌ Error al insertar post en Supabase:', err.message);
        return { ok: false, error: err };
      }
    },

    async fetchCloudPosts() {
      try {
        const data = await supabaseRestRequest('posts?select=*&order=created_at.desc&limit=50', 'GET');
        return Array.isArray(data) ? data : [];
      } catch (err) {
        return [];
      }
    },

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
        return { ok: false, error: err };
      }
    },

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

    async logoutUser() {
      await this.pushLocalStateToCloud();
      originalSetItem.call(localStorage, 'kinet_logged_in', 'false');
      localStorage.removeItem('kinet_logged_in');
      localStorage.removeItem('kinet_guest_session');
      localStorage.removeItem('kinet_user_id');
    }
  };

  window.KinetBackend = KinetBackend;
  KinetBackend.pullCloudStateToLocal();
})(window);
