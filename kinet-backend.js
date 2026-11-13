/**
 * KINET OS // Motor Oficial de Backend & Sincronización Directa REST con Supabase (v5.5 Full Real-Time, Avatar Lock & Global UI)
 * Servidor: https://bhqgsbtkwdxdxlvlcaes.supabase.co
 */
(function (window) {
  'use strict';

  const SUPABASE_URL = 'https://bhqgsbtkwdxdxlvlcaes.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_GrgL4iukPUJJyh91BdgfIQ_P0NQd6Nj';

  let sbClient = null;
  let syncTimeout = null;
  let isHydratingFromCloud = false;
  let initialCloudPullFinished = false; // Evita que la caché vieja del móvil machaque la nube antes de descargar
  let dmPollingInterval = null;
  let lastKnownMessageCount = -1;
  let lastUnreadCount = 0;

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

  // 2. Petición REST directa a Supabase Auth (/auth/v1)
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

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Comprime cualquier foto de perfil a un tamaño ligero (260x260 JPEG) para que sincronice al instante entre PC y Móvil en Supabase
  function compressAvatarDataUrl(fileOrDataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        const maxDim = 260;
        let w = img.width || 260;
        let h = img.height || 260;
        if (w > h) {
          if (w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
        } else {
          if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = function () {
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : null);
      };
      if (typeof fileOrDataUrl === 'string') {
        img.src = fileOrDataUrl;
      } else if (fileOrDataUrl instanceof Blob) {
        const reader = new FileReader();
        reader.onload = (e) => { img.src = e.target.result; };
        reader.readAsDataURL(fileOrDataUrl);
      }
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
      // No duplicamos posts gigantes ni imágenes pesadas dentro de user_state si ya van en avatar_url
      if (k && k.startsWith('kinet_') && k !== 'kinet_sb_key' && k !== 'kinet_saved_posts') {
        const val = localStorage.getItem(k);
        if (val && val.length < 180000) {
          state[k] = val;
        }
      }
    }
    return state;
  }

  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function (key, value) {
    originalSetItem.apply(this, arguments);
    if (key === 'kinet_user_avatar' && value) {
      originalSetItem.call(localStorage, 'kinet_avatar_updated_at', String(Date.now()));
      refreshDOMAvatarsAndProfileUI();
    }
    if (!isHydratingFromCloud && initialCloudPullFinished && key && key.startsWith('kinet_')) {
      scheduleCloudSync();
    }
  };

  function scheduleCloudSync() {
    if (!initialCloudPullFinished) return;
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      KinetBackend.pushLocalStateToCloud();
    }, 500);
  }

  // Repinta automáticamente todas las fotos de perfil, nombres y @handles visibles en la pantalla actual (Móvil y PC)
  function refreshDOMAvatarsAndProfileUI() {
    try {
      const avatarUrl = localStorage.getItem('kinet_user_avatar');
      const userName = localStorage.getItem('kinet_user_name');
      const userHandle = localStorage.getItem('kinet_social_handle') || localStorage.getItem('kinet_username');

      if (avatarUrl && (avatarUrl.startsWith('data:image') || avatarUrl.startsWith('http'))) {
        const avatarSelectors = [
          '#sidebar-avatar-img',
          '#profile-avatar-img',
          '#setup-avatar-preview',
          '#composer-avatar-img',
          '#my-card-avatar',
          '#header-user-avatar',
          '.current-user-avatar-img',
          '[data-kinet-user-avatar]'
        ];
        document.querySelectorAll(avatarSelectors.join(',')).forEach((el) => {
          if (el.tagName === 'IMG') {
            el.src = avatarUrl;
            el.style.display = 'block';
          } else {
            el.style.backgroundImage = `url(${avatarUrl})`;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
          }
        });
      }

      if (userName) {
        document.querySelectorAll('[data-kinet-user-name], #sidebar-user-name').forEach((el) => {
          el.textContent = userName;
        });
      }
      if (userHandle) {
        document.querySelectorAll('[data-kinet-user-handle], #sidebar-user-handle').forEach((el) => {
          el.textContent = userHandle.startsWith('@') ? userHandle : `@${userHandle}`;
        });
      }
    } catch (e) {}
  }

  // Hidrata el móvil o PC dando SIEMPRE prioridad absoluta a los datos y foto de perfil de Supabase Cloud
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

      // Unificar foto de perfil entre móvil y PC: la foto de la base de datos sobrescribe SIEMPRE la caché local antigua
      const cloudAvatar = profileRow.avatar_url || cloudState.kinet_user_avatar;
      if (cloudAvatar) {
        originalSetItem.call(localStorage, 'kinet_user_avatar', cloudAvatar);
      }

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
      refreshDOMAvatarsAndProfileUI();
      applyGlobalSidebarEnhancements();
    }
  }

  async function resolveCurrentUserId() {
    let uid = localStorage.getItem('kinet_user_id');
    const email = (localStorage.getItem('kinet_user_email') || '').trim();
    const handle = (localStorage.getItem('kinet_social_handle') || localStorage.getItem('kinet_username') || '').trim();

    try {
      // Si hay email o handle, buscamos primero por ellos para garantizar que móvil y PC apunten al MISMO registro exacto
      if (email && email.includes('@')) {
        const rows = await supabaseRestRequest(`profiles?email=ilike.${encodeURIComponent(email)}&select=*&order=updated_at.desc&limit=1`, 'GET');
        if (Array.isArray(rows) && rows[0]?.id) {
          originalSetItem.call(localStorage, 'kinet_user_id', rows[0].id);
          return rows[0].id;
        }
      }
      if (handle) {
        const cleanH = handle.startsWith('@') ? handle : '@' + handle;
        const rows = await supabaseRestRequest(`profiles?handle=ilike.${encodeURIComponent(cleanH)}&select=*&order=updated_at.desc&limit=1`, 'GET');
        if (Array.isArray(rows) && rows[0]?.id) {
          originalSetItem.call(localStorage, 'kinet_user_id', rows[0].id);
          return rows[0].id;
        }
      }
    } catch (e) {
      console.warn('Aviso resolviendo ID de usuario:', e.message);
    }
    if (uid && uid.length > 20) return uid;
    return null;
  }

  // 3. Centrado Vertical de la Barra Lateral + Inyección de la nueva sección "Analizador & Pizarra 3D" en todas las pantallas
  function applyGlobalSidebarEnhancements() {
    try {
      if (!document.getElementById('kinet-global-sidebar-v5-style')) {
        const style = document.createElement('style');
        style.id = 'kinet-global-sidebar-v5-style';
        style.textContent = `
          /* Centrar verticalmente las opciones de navegación del menú lateral en todas las páginas */
          aside.sidebar nav,
          .sidebar-nav,
          .nav-links,
          aside nav.flex-1 {
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            flex: 1 1 auto !important;
            gap: 6px !important;
            padding-top: 12px !important;
            padding-bottom: 12px !important;
          }
          .kinet-dm-unread-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 18px;
            height: 18px;
            padding: 0 5px;
            border-radius: 999px;
            background: #10B981;
            color: #05080F;
            font-size: 10px;
            font-weight: 800;
            margin-left: 6px;
            box-shadow: 0 0 10px rgba(16,185,129,0.55);
            animation: kinetPulseBadge 1.8s infinite;
          }
          @keyframes kinetPulseBadge {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.12); }
          }
        `;
        document.head.appendChild(style);
      }

      // Renombrar ojeador-live.html a "Laboratorio Vídeo" e inyectar "Analizador & Pizarra" (analizador.html) si aún no está
      const labLinks = document.querySelectorAll('a[href*="ojeador-live.html"]');
      const currentPath = (window.location.pathname || '').toLowerCase();

      labLinks.forEach((link) => {
        const isMobileBar = Boolean(link.closest('.mobile-bottom-nav, .bottom-nav, nav.fixed.bottom-0'));
        if (!isMobileBar) {
          // Actualizar etiqueta de Laboratorio para dejar claro que es de Vídeo
          if (link.textContent.includes('Ojeador') || link.textContent.includes('Laboratorio')) {
            const iconSpan = link.querySelector('span, i, svg');
            if (!iconSpan) {
              link.innerHTML = '🎬 <span>Laboratorio Vídeo</span>';
            }
          }

          // Inyectar botón de "Analizador & Pizarra 3D" justo debajo si no existe
          const parentNav = link.parentElement;
          if (parentNav && !parentNav.querySelector('a[href*="analizador.html"]')) {
            const analyzerLink = link.cloneNode(true);
            analyzerLink.setAttribute('href', 'analizador.html');
            analyzerLink.classList.remove('active', 'bg-emerald-500/10', 'text-emerald-400', 'border-emerald-500/30');
            if (currentPath.includes('analizador.html')) {
              analyzerLink.classList.add('active');
            }
            analyzerLink.innerHTML = link.innerHTML
              .replace(/Ojeador\s*&?\s*Laboratorio|Laboratorio\s*de\s*V[íi]deo|Laboratorio\s*V[íi]deo|Ojeador\s*Live/gi, 'Analizador & Pizarra 3D')
              .replace(/🎬|🔭|📡|🧪/g, '🏟️');
            if (!analyzerLink.textContent.includes('Analizador')) {
              analyzerLink.innerHTML = '🏟️ <span>Analizador & Pizarra 3D</span>';
            }
            link.insertAdjacentElement('afterend', analyzerLink);
          }
        }
      });

      // Ocultar botón KINET PRO si el usuario ya es PRO o CLUB
      const tier = (localStorage.getItem('kinet_account_tier') || 'free').toLowerCase();
      const isProOrClub = tier === 'pro' || tier === 'club' || localStorage.getItem('kinet_is_pro') === 'true';
      document.querySelectorAll('[data-pro-upsell], #sidebar-pro-btn, .pro-upgrade-banner').forEach((el) => {
        el.style.display = isProOrClub ? 'none' : '';
      });
    } catch (e) {}
  }

  const KinetBackend = {
    getClient: initSupabase,
    compressAvatar: compressAvatarDataUrl,
    refreshUI: refreshDOMAvatarsAndProfileUI,

    // Validador global Freemium: Fotos para Gratis, Vídeos (normalizados a 24-30 FPS) exclusivos para cuentas PRO / Club
    canUploadVideo() {
      const tier = (localStorage.getItem('kinet_account_tier') || 'free').toLowerCase();
      return tier === 'pro' || tier === 'club' || localStorage.getItem('kinet_is_pro') === 'true';
    },

    getVideoCompressionConfig() {
      return {
        targetFps: 30,
        minFps: 24,
        maxClipSeconds: 300, // 5 min por bloque táctico
        maxShortSizeMB: 4.5,
        proOnly: true
      };
    },

    async registerUser({ firstName, lastName, handle, email, phone, password }) {
      const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Atleta KINET';
      const cleanHandle = (handle || '').startsWith('@') ? handle : `@${handle}`;
      const cleanEmail = (email || '').trim().toLowerCase();

      localStorage.removeItem('kinet_user_id');
      localStorage.removeItem('kinet_user_avatar');

      originalSetItem.call(localStorage, 'kinet_user_name', fullName);
      originalSetItem.call(localStorage, 'kinet_user_email', cleanEmail);
      originalSetItem.call(localStorage, 'kinet_username', cleanHandle);
      originalSetItem.call(localStorage, 'kinet_social_handle', cleanHandle);
      originalSetItem.call(localStorage, 'kinet_logged_in', 'true');
      originalSetItem.call(localStorage, 'kinet_social_configured', 'true');

      let userId = null;
      try {
        const authData = await supabaseAuthRequest('signup', {
          email: cleanEmail,
          password: password,
          data: { full_name: fullName, handle: cleanHandle, phone: phone || '' }
        });
        userId = authData?.user?.id || authData?.id || null;
      } catch (authErr) {
        console.warn('Aviso en Auth Signup:', authErr.message);
      }

      if (!userId) userId = generateUUID();
      originalSetItem.call(localStorage, 'kinet_user_id', userId);

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
      initialCloudPullFinished = true;
      return { ok: true, user: newProfilePayload };
    },

    async loginUser({ email, password }) {
      const cleanInput = (email || '').trim();
      const isHandleLogin = cleanInput.startsWith('@') || !cleanInput.includes('@');

      if (!isHandleLogin && password) {
        try {
          const authData = await supabaseAuthRequest('token?grant_type=password', {
            email: cleanInput.toLowerCase(),
            password: password
          });
          if (authData?.user?.id) {
            originalSetItem.call(localStorage, 'kinet_user_id', authData.user.id);
          }
        } catch (e) {}
      }

      let foundProfile = null;
      if (!isHandleLogin) {
        const rows = await supabaseRestRequest(
          `profiles?email=ilike.${encodeURIComponent(cleanInput)}&select=*&order=updated_at.desc&limit=1`,
          'GET'
        );
        if (Array.isArray(rows) && rows[0]) foundProfile = rows[0];
      } else {
        const hQuery = cleanInput.startsWith('@') ? cleanInput : `@${cleanInput}`;
        const rows = await supabaseRestRequest(
          `profiles?handle=ilike.${encodeURIComponent(hQuery)}&select=*&order=updated_at.desc&limit=1`,
          'GET'
        );
        if (Array.isArray(rows) && rows[0]) foundProfile = rows[0];
      }

      if (foundProfile) {
        restoreCloudStateToLocal(foundProfile);
        initialCloudPullFinished = true;
        return { ok: true, user: foundProfile };
      }

      throw new Error('No hemos encontrado ninguna cuenta con ese correo o @usuario en KINET Cloud. Ve a "CREAR CUENTA" para registrarla.');
    },

    // Método directo para cambiar foto de perfil en cualquier dispositivo y forzar su subida inmediata a Supabase
    async updateProfileAvatar(fileOrDataUrl) {
      const compressed = await compressAvatarDataUrl(fileOrDataUrl);
      if (!compressed) return { ok: false };
      originalSetItem.call(localStorage, 'kinet_user_avatar', compressed);
      originalSetItem.call(localStorage, 'kinet_avatar_updated_at', String(Date.now()));
      refreshDOMAvatarsAndProfileUI();
      initialCloudPullFinished = true;
      await this.pushLocalStateToCloud();
      window.dispatchEvent(new CustomEvent('kinet:avatar-updated', { detail: { avatar_url: compressed } }));
      return { ok: true, avatar_url: compressed };
    },

    async pushLocalStateToCloud() {
      try {
        const userId = await resolveCurrentUserId();
        if (!userId) return { ok: false };

        let avatarData = localStorage.getItem('kinet_user_avatar') || null;
        if (avatarData && avatarData.length > 150000) {
          avatarData = await compressAvatarDataUrl(avatarData);
          if (avatarData) originalSetItem.call(localStorage, 'kinet_user_avatar', avatarData);
        }

        // Si este dispositivo no tiene avatar local pero en la nube ya había uno, no lo borramos con null
        if (!avatarData) {
          try {
            const existing = await supabaseRestRequest(`profiles?id=eq.${userId}&select=avatar_url&limit=1`, 'GET');
            if (Array.isArray(existing) && existing[0]?.avatar_url) {
              avatarData = existing[0].avatar_url;
              originalSetItem.call(localStorage, 'kinet_user_avatar', avatarData);
            }
          } catch (e) {}
        }

        const payload = {
          id: userId,
          email: localStorage.getItem('kinet_user_email') || undefined,
          full_name: localStorage.getItem('kinet_user_name') || 'Atleta KINET',
          handle: localStorage.getItem('kinet_social_handle') || localStorage.getItem('kinet_username') || '@kinet_pro',
          avatar_url: avatarData,
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
        return { ok: false, error: err };
      }
    },

    async pullCloudStateToLocal() {
      try {
        const userId = await resolveCurrentUserId();
        if (!userId) {
          initialCloudPullFinished = true;
          return null;
        }
        const rows = await supabaseRestRequest(`profiles?id=eq.${userId}&select=*`, 'GET');
        if (Array.isArray(rows) && rows[0]) {
          restoreCloudStateToLocal(rows[0]);
          initialCloudPullFinished = true;
          window.dispatchEvent(new CustomEvent('kinet:cloud-synced', { detail: rows[0] }));
          return rows[0];
        }
      } catch (e) {}
      initialCloudPullFinished = true;
      return null;
    },

    async createCloudPost(postObj) {
      // Bloqueo de seguridad Freemium: vídeos solo en cuentas PRO o Club
      if (postObj && (postObj.mode === 'reel' || postObj.isVideo || postObj.videoUrl) && !this.canUploadVideo()) {
        return {
          ok: false,
          proRequired: true,
          error: new Error('La subida de vídeos y KINET Shorts (24-30 FPS) es exclusiva para miembros KINET PRO / Club. En el plan gratuito puedes publicar fotos y telemetría.')
        };
      }

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
          likes_count: typeof postObj.likes === 'number' ? postObj.likes : 0
        };

        const data = await supabaseRestRequest('posts', 'POST', insertPayload, false);
        return { ok: true, data: Array.isArray(data) ? data[0] : data };
      } catch (err) {
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

    async updateCloudPostLikes(sbPostId, newLikesCount) {
      try {
        const cleanId = String(sbPostId || '').replace(/^sb_/, '');
        if (!cleanId || cleanId.startsWith('u_') || cleanId.startsWith('kinet_')) return { ok: false };
        await supabaseRestRequest(`posts?id=eq.${encodeURIComponent(cleanId)}`, 'PATCH', {
          likes_count: Math.max(0, newLikesCount)
        }, false);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err };
      }
    },

    // Obtener todos los DMs del usuario actual (enviados y recibidos) ordenados cronológicamente
    async fetchCloudDirectMessages() {
      try {
        const rawHandle = (localStorage.getItem('kinet_social_handle') || localStorage.getItem('kinet_username') || '').trim();
        if (!rawHandle) return [];
        const myHandle = rawHandle.startsWith('@') ? rawHandle : `@${rawHandle}`;
        const encoded = encodeURIComponent(myHandle);
        const rows = await supabaseRestRequest(
          `direct_messages?or=(sender_handle.ilike.${encoded},receiver_handle.ilike.${encoded})&select=*&order=created_at.asc&limit=250`,
          'GET'
        );
        return Array.isArray(rows) ? rows : [];
      } catch (err) {
        return [];
      }
    },

    async sendCloudDirectMessage(receiverHandle, messageText) {
      try {
        const userId = await resolveCurrentUserId();
        const rawSender = localStorage.getItem('kinet_social_handle') || localStorage.getItem('kinet_username') || '@naimtahri';
        const senderHandle = rawSender.startsWith('@') ? rawSender : `@${rawSender}`;
        const cleanReceiver = (receiverHandle || '').startsWith('@') ? receiverHandle : `@${receiverHandle}`;

        const data = await supabaseRestRequest('direct_messages', 'POST', {
          sender_id: userId || null,
          sender_handle: senderHandle,
          receiver_handle: cleanReceiver,
          message_text: messageText,
          is_read: false,
          read_at: null
        }, false);

        const createdMsg = Array.isArray(data) ? data[0] : data;
        window.dispatchEvent(new CustomEvent('kinet:dm-sent', { detail: createdMsg }));
        return { ok: true, data: createdMsg };
      } catch (err) {
        return { ok: false, error: err };
      }
    },

    async markDirectMessagesAsRead(otherPersonHandle) {
      try {
        // Respetar ajuste de privacidad de confirmación de lectura ('Visto')
        if (localStorage.getItem('kinet_privacy_read_receipts') === 'false') {
          return { ok: true, skippedByPrivacy: true };
        }
        const rawMy = localStorage.getItem('kinet_social_handle') || localStorage.getItem('kinet_username');
        if (!rawMy || !otherPersonHandle) return { ok: false };
        const myHandle = rawMy.startsWith('@') ? rawMy : `@${rawMy}`;
        const cleanOther = otherPersonHandle.startsWith('@') ? otherPersonHandle : `@${otherPersonHandle}`;
        const nowIso = new Date().toISOString();

        await supabaseRestRequest(
          `direct_messages?sender_handle=ilike.${encodeURIComponent(cleanOther)}&receiver_handle=ilike.${encodeURIComponent(myHandle)}&is_read=eq.false`,
          'PATCH',
          { is_read: true, read_at: nowIso },
          false
        );
        return { ok: true, read_at: nowIso };
      } catch (err) {
        return { ok: false, error: err };
      }
    },

    // Motor de escucha en tiempo real (cada 3.5 seg) para mensajes directos sin recargar la página
    startRealtimeDMPolling(intervalMs = 3500) {
      if (dmPollingInterval) clearInterval(dmPollingInterval);

      const pollFn = async () => {
        try {
          if (document.hidden) return;
          const rawMy = (localStorage.getItem('kinet_social_handle') || localStorage.getItem('kinet_username') || '').trim();
          if (!rawMy) return;
          const myHandleLower = (rawMy.startsWith('@') ? rawMy : `@${rawMy}`).toLowerCase();

          const messages = await this.fetchCloudDirectMessages();
          const unreadMsgs = messages.filter(
            (m) => String(m.receiver_handle || '').toLowerCase() === myHandleLower && !m.is_read
          );

          // Actualizar contadores globales de mensajes no leídos en botones de DMs
          lastUnreadCount = unreadMsgs.length;
          localStorage.setItem('kinet_unread_dm_count', String(lastUnreadCount));

          document.querySelectorAll('[data-dm-unread-badge], #dm-unread-count-badge, #mobile-dm-badge').forEach((badge) => {
            if (lastUnreadCount > 0) {
              badge.textContent = String(lastUnreadCount);
              badge.style.display = 'inline-flex';
            } else {
              badge.style.display = 'none';
            }
          });

          // Si el número de mensajes o estados de lectura cambió, avisar en vivo a comunidad.html
          const stateSignature = messages.map((m) => `${m.id}:${m.is_read ? 1 : 0}`).join('|');
          if (lastKnownMessageCount !== stateSignature) {
            const isNewArrival = lastKnownMessageCount !== -1;
            lastKnownMessageCount = stateSignature;
            window.dispatchEvent(
              new CustomEvent('kinet:dm-realtime-update', {
                detail: {
                  messages,
                  unreadCount: lastUnreadCount,
                  unreadMessages: unreadMsgs,
                  isNewArrival
                }
              })
            );
          }
        } catch (e) {}
      };

      pollFn();
      dmPollingInterval = setInterval(pollFn, intervalMs);
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

  // Ejecutar descarga prioritaria desde Supabase y activar mejoras de UI + DMs en tiempo real
  KinetBackend.pullCloudStateToLocal().then(() => {
    refreshDOMAvatarsAndProfileUI();
    applyGlobalSidebarEnhancements();
    KinetBackend.startRealtimeDMPolling(3500);
  });

  // Al volver a enfocar la pestaña en el móvil o en el PC, refrescar foto y mensajes al instante
  window.addEventListener('focus', () => {
    KinetBackend.pullCloudStateToLocal();
  });

  document.addEventListener('DOMContentLoaded', () => {
    refreshDOMAvatarsAndProfileUI();
    applyGlobalSidebarEnhancements();
  });
})(window);
