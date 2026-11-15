/**
 * KINET OS // Motor Oficial de Backend & Sincronización Directa REST con Supabase (v5.8 Cloud Auto-Recovery & Safe Sync)
 * Servidor: https://bhqgsbtkwdxdxlvlcaes.supabase.co
 */
(function (window) {
  'use strict';

  const SUPABASE_URL = 'https://bhqgsbtkwdxdxlvlcaes.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_GrgL4iukPUJJyh91BdgfIQ_P0NQd6Nj';

  let sbClient = null;
  let syncTimeout = null;
  let isHydratingFromCloud = false;
  let initialCloudPullFinished = false;
  let dmPollingInterval = null;
  let lastKnownMessageSignature = -1;
  let lastUnreadCount = 0;

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
      if (k && k.startsWith('kinet_') && k !== 'kinet_sb_key' && k !== 'kinet_saved_posts' && k !== 'kinet_is_guest') {
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
    if (key === 'kinet_unread_dm_count' || key === 'kinet_official_welcome_read') {
      updateGlobalCommunityExclamationBadge();
    }
    if (!isHydratingFromCloud && initialCloudPullFinished && key && key.startsWith('kinet_') && localStorage.getItem('kinet_is_guest') !== 'true') {
      scheduleCloudSync();
    }
  };

  function scheduleCloudSync() {
    if (!initialCloudPullFinished || localStorage.getItem('kinet_is_guest') === 'true') return;
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      KinetBackend.pushLocalStateToCloud();
    }, 500);
  }

  function refreshDOMAvatarsAndProfileUI() {
    try {
      const avatarUrl = localStorage.getItem('kinet_user_avatar');
      const userName = localStorage.getItem('kinet_user_name');
      const userHandle = localStorage.getItem('kinet_social_handle') || localStorage.getItem('kinet_username');

      if (avatarUrl && (avatarUrl.startsWith('data:image') || avatarUrl.startsWith('http'))) {
        const avatarSelectors = [
          '#sidebar-avatar-img',
          '#profile-avatar-img',
          '#profile-avatar-box',
          '#setup-avatar-preview',
          '#setup-preview-avatar',
          '#composer-avatar-img',
          '#composer-user-avatar',
          '#modal-composer-avatar',
          '#my-social-avatar',
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
            const safeAv = avatarUrl.replace(/'/g, '%27').replace(/"/g, '%22');
            el.style.backgroundImage = `url('${safeAv}')`;
            el.style.backgroundSize = 'cover';
            el.style.backgroundPosition = 'center';
            const initChild = el.querySelector('#profile-initials-txt');
            if (initChild) initChild.style.display = 'none';
            else if (!el.children.length) el.textContent = '';
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

  function restoreCloudStateToLocal(profileRow) {
    if (!profileRow) return;
    isHydratingFromCloud = true;
    try {
      originalSetItem.call(localStorage, 'kinet_is_guest', 'false');
      localStorage.removeItem('kinet_is_guest');

      const cloudState = profileRow.user_state || {};
      Object.keys(cloudState).forEach((k) => {
        if (k !== 'kinet_is_guest' && cloudState[k] !== null && cloudState[k] !== undefined && String(cloudState[k]).trim() !== '') {
          if (k === 'kinet_user_name' && (cloudState[k] === 'NAIM T' || cloudState[k] === 'Usuario KINET' || cloudState[k] === 'Atleta Invitado')) {
            return;
          }
          originalSetItem.call(localStorage, k, String(cloudState[k]));
        }
      });

      if (profileRow.id) originalSetItem.call(localStorage, 'kinet_user_id', profileRow.id);
      if (profileRow.email) originalSetItem.call(localStorage, 'kinet_user_email', profileRow.email);
      if (profileRow.full_name && profileRow.full_name !== 'NAIM T' && profileRow.full_name !== 'Atleta Invitado') {
        originalSetItem.call(localStorage, 'kinet_user_name', profileRow.full_name);
      }
      if (profileRow.handle && profileRow.handle !== '@naimt_pro') {
        originalSetItem.call(localStorage, 'kinet_username', profileRow.handle);
        originalSetItem.call(localStorage, 'kinet_social_handle', profileRow.handle);
      }
      if (profileRow.bio) originalSetItem.call(localStorage, 'kinet_social_bio', profileRow.bio);

      const cloudAvatar = profileRow.avatar_url || cloudState.kinet_user_avatar;
      if (cloudAvatar && cloudAvatar.length > 12) {
        originalSetItem.call(localStorage, 'kinet_user_avatar', cloudAvatar);
      }

      if (profileRow.active_role) {
        originalSetItem.call(localStorage, 'kinet_active_role', profileRow.active_role);
        originalSetItem.call(localStorage, 'kinet_role', profileRow.active_role);
      }
      if (profileRow.active_sport) originalSetItem.call(localStorage, 'kinet_sport', profileRow.active_sport);
      if (profileRow.position && profileRow.position !== 'Por asignar') originalSetItem.call(localStorage, 'kinet_position', profileRow.position);
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
    if (localStorage.getItem('kinet_is_guest') === 'true') return null;

    let uid = localStorage.getItem('kinet_user_id');
    const email = (localStorage.getItem('kinet_user_email') || '').trim();
    const handle = (localStorage.getItem('kinet_social_handle') || localStorage.getItem('kinet_username') || '').trim();
    const userName = (localStorage.getItem('kinet_user_name') || '').trim();

    try {
      if (email && email.includes('@')) {
        const rows = await supabaseRestRequest(`profiles?email=ilike.${encodeURIComponent(email)}&select=*&order=updated_at.desc&limit=1`, 'GET');
        if (Array.isArray(rows) && rows[0]?.id) {
          originalSetItem.call(localStorage, 'kinet_user_id', rows[0].id);
          return rows[0].id;
        }
      }
      if (handle && handle !== '@naimt_pro' && handle !== '@invitado_kinet' && handle !== '@usuariokinet_pro') {
        const cleanH = handle.startsWith('@') ? handle : '@' + handle;
        const rows = await supabaseRestRequest(`profiles?handle=ilike.${encodeURIComponent(cleanH)}&select=*&order=updated_at.desc&limit=1`, 'GET');
        if (Array.isArray(rows) && rows[0]?.id) {
          originalSetItem.call(localStorage, 'kinet_user_id', rows[0].id);
          return rows[0].id;
        }
      }
      if (userName && userName !== 'NAIM T' && userName !== 'Usuario KINET' && userName !== 'Atleta Invitado') {
        const rows = await supabaseRestRequest(`profiles?full_name=ilike.${encodeURIComponent(userName)}&select=*&order=updated_at.desc&limit=1`, 'GET');
        if (Array.isArray(rows) && rows[0]?.id) {
          originalSetItem.call(localStorage, 'kinet_user_id', rows[0].id);
          return rows[0].id;
        }
      }
    } catch (e) {}
    if (uid && uid.length > 20) return uid;
    return null;
  }

  function updateGlobalCommunityExclamationBadge() {
    try {
      const unreadDms = parseInt(localStorage.getItem('kinet_unread_dm_count') || '0', 10);
      const officialRead = localStorage.getItem('kinet_official_welcome_read') === 'true';
      const totalUnread = unreadDms + (officialRead ? 0 : 1);

      document.querySelectorAll('.kinet-notif-exclaim, #sidebar-comunidad-notif, #drawer-comunidad-notif').forEach((el) => {
        if (totalUnread > 0) {
          el.classList.remove('read-empty');
          el.textContent = '!';
          el.title = `${totalUnread} notificación(es) sin leer en Comunidad`;
        } else {
          el.classList.add('read-empty');
          el.textContent = '';
          el.title = 'Comunidad al día';
        }
      });

      const topBadge = document.getElementById('topbar-unread-badge');
      if (topBadge) {
        topBadge.textContent = String(totalUnread);
        topBadge.style.display = totalUnread > 0 ? 'inline-block' : 'none';
      }
    } catch (e) {}
  }

  function applyRotating10HourSidebarTip() {
    try {
      const tipBox = document.querySelector('.sidebar-ai-tip-box');
      if (!tipBox) return;
      const textEl = tipBox.querySelector('.sidebar-ai-tip-text');
      if (!textEl) return;

      const sport = localStorage.getItem('kinet_sport') || 'Fútbol';
      const bucket10h = Math.floor(Date.now() / (10 * 3600 * 1000));
      const path = (window.location.pathname || '').toLowerCase();

      const tipsByPage = {
        perfil: [
          `Mantén actualizados tu club, categoría y enlaces de vídeo para destacar en el radar de ${sport}.`,
          `Tus datos biométricos y posición se sincronizan al instante con tu KINET Card y el Analizador 3D.`
        ],
        vestuario: [
          `Registra tu carga y descanso hoy para que el Cuerpo Técnico IA ajuste tu sesión de ${sport}.`,
          `Revisa tus métricas del día antes de entrenar y consulta cualquier molestia al especialista IA.`
        ],
        default: [
          `Sincronización Cloud activa para ${sport}. Tus avances se actualizan en tiempo real entre móvil y PC.`,
          `Utiliza el Laboratorio de Vídeo y la Pizarra 3D para analizar tu rendimiento y compararte en 1vs1.`
        ]
      };

      let pool = tipsByPage.default;
      if (path.includes('perfil')) pool = tipsByPage.perfil;
      else if (path.includes('app.html')) pool = tipsByPage.vestuario;

      if (path.includes('perfil')) {
        textEl.textContent = pool[bucket10h % pool.length];
      }
    } catch (e) {}
  }

  function applyGlobalSidebarEnhancements() {
    try {
      if (!document.getElementById('kinet-global-sidebar-v5-style')) {
        const style = document.createElement('style');
        style.id = 'kinet-global-sidebar-v5-style';
        style.textContent = `
          .os-sidebar .sidebar-top-section {
            display: flex !important;
            flex-direction: column !important;
            flex: 1 1 auto !important;
            min-height: 0 !important;
          }
          aside.sidebar nav,
          .os-sidebar .sidebar-nav,
          .sidebar-nav,
          .nav-links {
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            flex: 1 1 auto !important;
            gap: 8px !important;
            padding: 8px 0 !important;
          }
          .os-sidebar .sidebar-bottom-section,
          .sidebar-bottom-section {
            display: flex !important;
            flex-direction: column !important;
            gap: 8px !important;
            padding-top: 10px !important;
            flex-shrink: 0 !important;
          }
          .os-sidebar .sidebar-ai-tip-box,
          .sidebar-ai-tip-box {
            height: 86px !important;
            min-height: 86px !important;
            max-height: 86px !important;
            padding: 8px 11px !important;
            margin-bottom: 2px !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
          }
          .sidebar-ai-tip-text {
            font-size: 0.68rem !important;
            line-height: 1.28 !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 4 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          .os-sidebar .side-link,
          .sidebar-nav .side-link,
          .sidebar-bottom-section .side-link {
            height: 44px !important;
            min-height: 44px !important;
            max-height: 44px !important;
            width: 100% !important;
            padding: 10px 14px !important;
            font-size: 0.83rem !important;
            border-radius: 14px !important;
            margin-bottom: 0 !important;
            flex-shrink: 0 !important;
            box-sizing: border-box !important;
          }
          @keyframes kinetExclaimPulseGlobal {
            0%, 100% { transform: scale(1); box-shadow: 0 0 10px var(--role-glow, rgba(0,255,136,0.4)); }
            50% { transform: scale(1.12); box-shadow: 0 0 18px var(--role-color, #00FF88); }
          }
          .kinet-notif-exclaim {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 20px !important;
            height: 20px !important;
            border-radius: 7px !important;
            background: var(--role-gradient, linear-gradient(135deg, #00FF88, #00B359)) !important;
            color: #04060A !important;
            font-family: 'Inter', sans-serif !important;
            font-size: 0.72rem !important;
            font-weight: 900 !important;
            animation: kinetExclaimPulseGlobal 2.2s infinite ease-in-out !important;
            line-height: 1 !important;
          }
          .kinet-notif-exclaim.read-empty {
            background: rgba(255, 255, 255, 0.08) !important;
            color: rgba(255, 255, 255, 0.4) !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            animation: none !important;
            box-shadow: none !important;
            width: 8px !important;
            height: 8px !important;
            border-radius: 50% !important;
            font-size: 0 !important;
          }
        `;
        document.head.appendChild(style);
      }

      document.querySelectorAll('a[href*="comunidad.html"]:not([href*="setup=true"])').forEach((comLink) => {
        const leftGroup = comLink.querySelector('.side-link-left');
        if (leftGroup) {
          leftGroup.innerHTML = '<span>🌐</span> <span>Comunidad / Red Social</span>';
        }
        let badge = comLink.querySelector(':scope > .kinet-notif-exclaim');
        if (!badge) {
          const rightSpan = comLink.querySelector(':scope > span:last-child');
          if (rightSpan && !rightSpan.classList.contains('side-link-left')) {
            rightSpan.className = 'kinet-notif-exclaim read-empty';
            rightSpan.textContent = '';
            badge = rightSpan;
          }
        }
      });

      updateGlobalCommunityExclamationBadge();
      applyRotating10HourSidebarTip();

      const labLinks = document.querySelectorAll('.sidebar-nav a[href*="ojeador-live.html"], #mobile-menu-drawer a[href*="ojeador-live.html"]');
      const currentPath = (window.location.pathname || '').toLowerCase();

      labLinks.forEach((link) => {
        const leftSpan = link.querySelector('.side-link-left');
        if (leftSpan) {
          leftSpan.innerHTML = '<span>🎬</span> <span>Laboratorio Vídeo</span>';
        }
        const parentNav = link.parentElement;
        if (parentNav && !parentNav.querySelector('a[href*="analizador.html"]')) {
          const analyzerLink = link.cloneNode(true);
          analyzerLink.id = 'nav-analizador-injected';
          analyzerLink.setAttribute('href', 'analizador.html');
          analyzerLink.classList.remove('active');
          if (currentPath.includes('analizador.html')) {
            analyzerLink.classList.add('active');
          }
          const aLeft = analyzerLink.querySelector('.side-link-left');
          if (aLeft) {
            aLeft.innerHTML = '<span>🏟️</span> <span>Analizador & Pizarra 3D</span>';
          } else {
            analyzerLink.innerHTML = '<span>🏟️ Analizador & Pizarra 3D</span><span>→</span>';
          }
          const rightIndicator = analyzerLink.querySelector(':scope > span:last-child');
          if (rightIndicator && !rightIndicator.classList.contains('side-link-left')) {
            rightIndicator.className = '';
            rightIndicator.style.cssText = 'font-size:0.7rem;opacity:0.5;';
            rightIndicator.textContent = currentPath.includes('analizador.html') ? '●' : '→';
          }
          link.insertAdjacentElement('afterend', analyzerLink);
        }
      });

      const tier = (localStorage.getItem('kinet_account_tier') || 'free').toLowerCase();
      const isProOrClub = tier === 'pro' || tier === 'club' || localStorage.getItem('kinet_is_pro') === 'true';
      document.querySelectorAll('[data-pro-upsell], #sidebar-pro-btn, #nav-upgrade-pro, #drawer-upgrade-pro').forEach((el) => {
        if (isProOrClub) el.style.setProperty('display', 'none', 'important');
      });
    } catch (e) {}
  }

  const KinetBackend = {
    getClient: initSupabase,
    compressAvatar: compressAvatarDataUrl,
    refreshUI: refreshDOMAvatarsAndProfileUI,
    updateCommunityBadge: updateGlobalCommunityExclamationBadge,

    canUploadVideo() {
      const tier = (localStorage.getItem('kinet_account_tier') || 'free').toLowerCase();
      return tier === 'pro' || tier === 'club' || localStorage.getItem('kinet_is_pro') === 'true';
    },

    getVideoCompressionConfig() {
      return {
        targetFps: 30,
        minFps: 24,
        maxClipSeconds: 300,
        maxShortSizeMB: 4.5,
        proOnly: true
      };
    },

    async resetAndStartCleanGuestSession() {
      try {
        const sb = initSupabase();
        if (sb && sb.auth) await sb.auth.signOut();
      } catch (e) {}

      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('kinet_') || k.startsWith('sb-') || k.includes('supabase')) {
          localStorage.removeItem(k);
        }
      });
      sessionStorage.clear();

      originalSetItem.call(localStorage, 'kinet_is_guest', 'true');
      originalSetItem.call(localStorage, 'kinet_account_tier', 'free');
      originalSetItem.call(localStorage, 'kinet_user_name', 'Atleta Invitado');
      originalSetItem.call(localStorage, 'kinet_social_handle', '@invitado_kinet');
    },

    async registerUser({ firstName, lastName, handle, email, phone, password, birthDate }) {
      localStorage.removeItem('kinet_is_guest');
      const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Atleta KINET';
      const cleanHandle = (handle || '').startsWith('@') ? handle : `@${handle}`;
      const cleanEmail = (email || '').trim().toLowerCase();

      localStorage.removeItem('kinet_user_id');
      localStorage.removeItem('kinet_user_avatar');

      originalSetItem.call(localStorage, 'kinet_user_name', fullName);
      originalSetItem.call(localStorage, 'kinet_user_email', cleanEmail);
      originalSetItem.call(localStorage, 'kinet_username', cleanHandle);
      originalSetItem.call(localStorage, 'kinet_social_handle', cleanHandle);
      if (birthDate) {
        originalSetItem.call(localStorage, 'kinet_birth_date', birthDate);
        originalSetItem.call(localStorage, 'kinet_user_birthdate', birthDate);
      }
      originalSetItem.call(localStorage, 'kinet_logged_in', 'true');
      originalSetItem.call(localStorage, 'kinet_social_configured', 'true');

      let userId = null;
      try {
        const authData = await supabaseAuthRequest('signup', {
          email: cleanEmail,
          password: password,
          data: { full_name: fullName, handle: cleanHandle, phone: phone || '', birth_date: birthDate || '' }
        });
        userId = authData?.user?.id || authData?.id || null;
      } catch (authErr) {}

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
        position: localStorage.getItem('kinet_position') || 'Por asignar',
        category: localStorage.getItem('kinet_category') || 'Senior',
        club: localStorage.getItem('kinet_user_club') || 'Independiente',
        account_tier: 'free',
        user_state: collectAllKinetLocalState(),
        updated_at: new Date().toISOString()
      };

      await supabaseRestRequest('profiles', 'POST', newProfilePayload, true);
      initialCloudPullFinished = true;
      return { ok: true, user: newProfilePayload };
    },

    async loginUser({ email, password }) {
      localStorage.removeItem('kinet_is_guest');
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

    async updateProfileAvatar(fileOrDataUrl) {
      const compressed = await compressAvatarDataUrl(fileOrDataUrl);
      if (!compressed) return { ok: false };
      originalSetItem.call(localStorage, 'kinet_user_avatar', compressed);
      originalSetItem.call(localStorage, 'kinet_avatar_updated_at', String(Date.now()));
      originalSetItem.call(localStorage, 'kinet_logged_in', 'true');
      refreshDOMAvatarsAndProfileUI();
      initialCloudPullFinished = true;
      await this.pushLocalStateToCloud();
      window.dispatchEvent(new CustomEvent('kinet:avatar-updated', { detail: { avatar_url: compressed } }));
      return { ok: true, avatar_url: compressed };
    },

    async pushLocalStateToCloud() {
      try {
        if (localStorage.getItem('kinet_is_guest') === 'true') {
          return { ok: false, skippedGuest: true };
        }
        if (localStorage.getItem('kinet_logged_in') !== 'true') {
          return { ok: false, skippedUnauthenticatedWindow: true };
        }

        const currentName = (localStorage.getItem('kinet_user_name') || '').trim();
        const currentHandle = (localStorage.getItem('kinet_social_handle') || localStorage.getItem('kinet_username') || '').trim();

        const forbiddenNames = ['NAIM T', 'USUARIO KINET', 'ATLETA INVITADO', 'ATLETA KINET', ''];
        const forbiddenHandles = ['@naimt_pro', '@usuariokinet_pro', '@invitado_kinet', '@kinet_pro', ''];

        if (
          forbiddenNames.includes(currentName.toUpperCase()) ||
          forbiddenHandles.includes(currentHandle.toLowerCase())
        ) {
          return { ok: false, skippedDefaultPlaceholder: true };
        }

        const userId = await resolveCurrentUserId();
        if (!userId) return { ok: false };

        let avatarData = localStorage.getItem('kinet_user_avatar') || null;
        if (avatarData && avatarData.length > 150000) {
          avatarData = await compressAvatarDataUrl(avatarData);
          if (avatarData) originalSetItem.call(localStorage, 'kinet_user_avatar', avatarData);
        }

        let existingRow = null;
        try {
          const existing = await supabaseRestRequest(`profiles?id=eq.${userId}&select=*&limit=1`, 'GET');
          if (Array.isArray(existing) && existing[0]) {
            existingRow = existing[0];
            if ((!avatarData || avatarData.length < 20) && existingRow.avatar_url) {
              avatarData = existingRow.avatar_url;
              originalSetItem.call(localStorage, 'kinet_user_avatar', avatarData);
            }
          }
        } catch (e) {}

        const cloudPrevState = (existingRow && existingRow.user_state) ? existingRow.user_state : {};
        const localNowState = collectAllKinetLocalState();

        const safeMergedState = { ...cloudPrevState };
        Object.keys(localNowState).forEach((k) => {
          const val = localNowState[k];
          if (val !== null && val !== undefined && String(val).trim() !== '' && val !== 'NAIM T' && val !== '@naimt_pro') {
            safeMergedState[k] = val;
          }
        });

        const payload = {
          id: userId,
          email: localStorage.getItem('kinet_user_email') || (existingRow && existingRow.email) || undefined,
          full_name: currentName,
          handle: currentHandle,
          avatar_url: avatarData,
          bio: localStorage.getItem('kinet_social_bio') || (existingRow && existingRow.bio) || 'Perfil Verificado KINET OS',
          active_role: localStorage.getItem('kinet_active_role') || (existingRow && existingRow.active_role) || 'athlete',
          active_sport: localStorage.getItem('kinet_sport') || (existingRow && existingRow.active_sport) || 'Fútbol',
          position: localStorage.getItem('kinet_position') || (existingRow && existingRow.position) || 'Por asignar',
          category: localStorage.getItem('kinet_user_category') || localStorage.getItem('kinet_category') || (existingRow && existingRow.category) || 'Senior',
          club: localStorage.getItem('kinet_user_club') || (existingRow && existingRow.club) || 'KINET Performance',
          account_tier: localStorage.getItem('kinet_account_tier') || (existingRow && existingRow.account_tier) || 'free',
          video_mins_used: parseFloat(localStorage.getItem('kinet_video_mins_used') || '0'),
          bonus_video_mins: parseFloat(localStorage.getItem('kinet_bonus_video_mins') || '0'),
          user_state: safeMergedState,
          updated_at: new Date().toISOString()
        };

        await supabaseRestRequest('profiles', 'POST', payload, true);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err };
      }
    },

// 1. CORTAFUEGOS ESTRICTO: Si no ha iniciado sesión explícitamente en este navegador (kinet_logged_in === 'true'), NO descarga nada en Incógnito
    async pullCloudStateToLocal() {
      try {
        if (localStorage.getItem('kinet_is_guest') === 'true' || localStorage.getItem('kinet_logged_in') !== 'true') {
          initialCloudPullFinished = true;
          return null;
        }

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

    // 2. INICIAR SESIÓN CON GOOGLE (Abre la ventana emergente centrada con tus cuentas de Gmail)
    async loginWithGooglePopup() {
      localStorage.removeItem('kinet_is_guest');
      const sb = initSupabase();
      const redirectUrl = window.location.origin + '/login.html?oauth=google_callback';
      const oauthUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}&prompt=select_account`;

      const width = 500, height = 620;
      const left = Math.max(0, Math.round((window.screen.width - width) / 2));
      const top = Math.max(0, Math.round((window.screen.height - height) / 2));

      const popup = window.open(
        oauthUrl,
        'KinetGoogleAuthPopup',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
      );

      if (!popup) {
        // Si el navegador bloquea popups, redirigir en la misma pestaña con selector de cuenta Google
        window.location.href = oauthUrl;
        return;
      }

      return new Promise((resolve, reject) => {
        const timer = setInterval(async () => {
          try {
            if (popup.closed) {
              clearInterval(timer);
              if (sb && sb.auth) {
                const { data } = await sb.auth.getSession();
                if (data?.session?.user) {
                  await this.syncGoogleUserToProfile(data.session.user);
                  resolve({ ok: true, user: data.session.user });
                  return;
                }
              }
              resolve({ ok: false, closedByUser: true });
            }
          } catch (err) {}
        }, 600);
      });
    },

    async syncGoogleUserToProfile(googleUser) {
      if (!googleUser) return null;
      const email = (googleUser.email || '').toLowerCase();
      const meta = googleUser.user_metadata || {};
      const fullName = meta.full_name || meta.name || email.split('@')[0] || 'Atleta KINET';
      const avatar = meta.avatar_url || meta.picture || null;
      const cleanHandle = `@${fullName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16)}`;

      originalSetItem.call(localStorage, 'kinet_logged_in', 'true');
      localStorage.removeItem('kinet_is_guest');

      const existing = await supabaseRestRequest(`profiles?email=ilike.${encodeURIComponent(email)}&select=*&limit=1`, 'GET');
      if (Array.isArray(existing) && existing[0]) {
        restoreCloudStateToLocal(existing[0]);
        return existing[0];
      }

      const newId = googleUser.id || generateUUID();
      originalSetItem.call(localStorage, 'kinet_user_id', newId);
      originalSetItem.call(localStorage, 'kinet_user_email', email);
      originalSetItem.call(localStorage, 'kinet_user_name', fullName);
      originalSetItem.call(localStorage, 'kinet_social_handle', cleanHandle);
      if (avatar) originalSetItem.call(localStorage, 'kinet_user_avatar', avatar);

      const newRow = {
        id: newId,
        email,
        full_name: fullName,
        handle: cleanHandle,
        avatar_url: avatar,
        active_role: 'athlete',
        active_sport: 'Fútbol',
        account_tier: 'free',
        user_state: collectAllKinetLocalState(),
        updated_at: new Date().toISOString()
      };
      await supabaseRestRequest('profiles', 'POST', newRow, true);
      return newRow;
    },

    // 3. INICIAR SESIÓN CON CÓDIGO SMS (OTP al teléfono móvil)
    async sendSmsOtpCode(phoneNumber) {
      const cleanPhone = String(phoneNumber || '').replace(/\s+/g, '').trim();
      if (!cleanPhone || cleanPhone.length < 9) {
        throw new Error('Introduce un número de teléfono móvil válido con prefijo (ej: +34 600 000 000).');
      }
      const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+34${cleanPhone}`;
      await supabaseAuthRequest('otp', {
        phone: formattedPhone,
        create_user: true
      });
      return { ok: true, phone: formattedPhone };
    },

    async verifySmsOtpCode(phoneNumber, tokenCode) {
      const cleanPhone = String(phoneNumber || '').replace(/\s+/g, '').trim();
      const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+34${cleanPhone}`;
      const cleanToken = String(tokenCode || '').trim();

      const data = await supabaseAuthRequest('verify', {
        type: 'sms',
        phone: formattedPhone,
        token: cleanToken
      });

      localStorage.removeItem('kinet_is_guest');
      originalSetItem.call(localStorage, 'kinet_logged_in', 'true');
      if (data?.user?.id) {
        originalSetItem.call(localStorage, 'kinet_user_id', data.user.id);
        await this.pullCloudStateToLocal();
      }
      return { ok: true, data };
    },

    // 4. RECUPERAR CONTRASEÑA POR CORREO ELECTRÓNICO
    async sendPasswordResetEmail(emailAddress) {
      const cleanEmail = String(emailAddress || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        throw new Error('Introduce tu correo electrónico registrado para enviarte el enlace de recuperación.');
      }
      await supabaseAuthRequest('recover', {
        email: cleanEmail
      });
      return { ok: true };
    },

    async createCloudPost(postObj) {
      if (postObj && (postObj.mode === 'reel' || postObj.mode === 'reels' || postObj.isVideo || postObj.videoUrl) && !this.canUploadVideo()) {
        return {
          ok: false,
          proRequired: true,
          error: new Error('La subida de vídeos y KINET Shorts (24-30 FPS) es exclusiva para miembros KINET PRO / Club.')
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

          lastUnreadCount = unreadMsgs.length;
          originalSetItem.call(localStorage, 'kinet_unread_dm_count', String(lastUnreadCount));
          updateGlobalCommunityExclamationBadge();

          const stateSignature = messages.map((m) => `${m.id}:${m.is_read ? 1 : 0}`).join('|');
          if (lastKnownMessageSignature !== stateSignature) {
            const isNewArrival = lastKnownMessageSignature !== -1;
            lastKnownMessageSignature = stateSignature;
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
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('kinet_') || k.startsWith('sb-')) localStorage.removeItem(k);
      });
    }
  };

  window.KinetBackend = KinetBackend;

  KinetBackend.pullCloudStateToLocal().then(() => {
    refreshDOMAvatarsAndProfileUI();
    applyGlobalSidebarEnhancements();
    KinetBackend.startRealtimeDMPolling(3500);
  });

  window.addEventListener('focus', () => {
    KinetBackend.pullCloudStateToLocal();
  });

  document.addEventListener('DOMContentLoaded', () => {
    refreshDOMAvatarsAndProfileUI();
    applyGlobalSidebarEnhancements();
  });
})(window);

// =========================================================================
// CANDADO ANTI-USO COMPARTIDO: ROL ACTIVO ÚNICO EN TODOS LOS DISPOSITIVOS + IDENTIDAD RAÍZ ÚNICA
// =========================================================================
(function initSingleActiveRoleAndIdentityLock() {
  let myDeviceId = sessionStorage.getItem('kinet_device_instance_id');
  if (!myDeviceId) {
    myDeviceId = 'dev_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now();
    sessionStorage.setItem('kinet_device_instance_id', myDeviceId);
  }

  function normalizeRoleStrict(val) {
    if (!val) return 'athlete';
    const v = String(val).toLowerCase().trim();
    if (v === 'staff' || v.includes('entrenador') || v.includes('coach') || v.includes('staff')) return 'staff';
    if (v === 'scout' || v.includes('scout') || v.includes('director') || v.includes('ojeador')) return 'scout';
    return 'athlete';
  }

  function enforceSinglePersonIdentityAcrossRoles() {
    const masterName = localStorage.getItem('kinet_user_name');
    if (!masterName || masterName === 'NAIM T' || masterName === 'Usuario KINET' || masterName === 'Atleta Invitado') return;
    const masterBirth = localStorage.getItem('kinet_user_birthdate');
    const masterAvatar = localStorage.getItem('kinet_user_avatar');
    const masterHandle = localStorage.getItem('kinet_social_handle');

    try {
      const rawDb = localStorage.getItem('kinet_profiles_db');
      if (!rawDb) return;
      const db = JSON.parse(rawDb);
      let modified = false;

      ['athlete', 'staff', 'scout'].forEach((rKey) => {
        if (db[rKey] && typeof db[rKey] === 'object') {
          if (masterName && db[rKey].name && db[rKey].name !== masterName) {
            db[rKey].name = masterName;
            modified = true;
          }
          if (masterBirth && db[rKey].birthdate && db[rKey].birthdate !== masterBirth) {
            db[rKey].birthdate = masterBirth;
            modified = true;
          }
          if (masterAvatar && db[rKey].avatar !== masterAvatar) {
            db[rKey].avatar = masterAvatar;
            modified = true;
          }
          if (masterHandle && db[rKey].handle && db[rKey].handle !== masterHandle) {
            db[rKey].handle = masterHandle;
            modified = true;
          }
        }
      });

      if (modified) {
        localStorage.setItem('kinet_profiles_db', JSON.stringify(db));
      }
    } catch (e) {}
  }

  function showRoleSyncLockToast(newRoleKey, newSportName) {
    const roleNames = {
      athlete: 'ATLETA PRO',
      staff: 'ENTRENADOR / STAFF',
      scout: 'DIRECTOR DEPORTIVO / SCOUT'
    };
    let toast = document.getElementById('kinet-role-lock-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'kinet-role-lock-toast';
      toast.style.cssText = `
        position: fixed;
        top: 18px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2147483647;
        background: rgba(8, 12, 22, 0.98);
        border: 1.5px solid var(--role-color, #00FF88);
        color: #FFFFFF;
        padding: 12px 20px;
        border-radius: 14px;
        font-family: 'Orbitron', sans-serif;
        font-size: 0.72rem;
        font-weight: 800;
        box-shadow: 0 20px 50px rgba(0,0,0,0.92), 0 0 30px rgba(0,255,136,0.3);
        display: flex;
        align-items: center;
        gap: 10px;
        text-align: center;
      `;
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span>🔒</span> <span>ROL SINCRONIZADO EN TODOS TUS DISPOSITIVOS: <strong>${roleNames[newRoleKey] || 'ATLETA PRO'}</strong> (${(newSportName || 'Fútbol').toUpperCase()})</span>`;
  }

  function forceApplyGlobalRoleState(cloudRole, cloudSport) {
    const targetRole = normalizeRoleStrict(cloudRole);
    const currentDomRole = normalizeRoleStrict(document.body?.getAttribute('data-role') || localStorage.getItem('kinet_active_role'));
    const targetSport = cloudSport || localStorage.getItem('kinet_sport') || 'Fútbol';

    localStorage.setItem('kinet_active_role', targetRole);
    localStorage.setItem('kinet_role', targetRole);
    if (cloudSport) localStorage.setItem('kinet_sport', targetSport);
    enforceSinglePersonIdentityAcrossRoles();

    const url = new URL(window.location.href);
    const urlRole = url.searchParams.get('role');

    if (currentDomRole !== targetRole || (urlRole && normalizeRoleStrict(urlRole) !== targetRole)) {
      showRoleSyncLockToast(targetRole, targetSport);
      if (document.body) document.body.setAttribute('data-role', targetRole);

      setTimeout(() => {
        url.searchParams.set('role', targetRole);
        url.searchParams.set('sport', targetSport);
        window.location.replace(url.toString());
      }, 650);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    enforceSinglePersonIdentityAcrossRoles();

    const urlRoleParam = new URLSearchParams(window.location.search).get('role');
    const lastKnownRole = localStorage.getItem('kinet_last_synced_cloud_role');
    if (urlRoleParam) {
      const cleanUrlRole = normalizeRoleStrict(urlRoleParam);
      if (lastKnownRole && cleanUrlRole !== lastKnownRole) {
        localStorage.setItem('kinet_active_role', cleanUrlRole);
        localStorage.setItem('kinet_role', cleanUrlRole);
        localStorage.setItem('kinet_last_synced_cloud_role', cleanUrlRole);
        localStorage.setItem('kinet_role_updated_at', String(Date.now()));
        localStorage.setItem('kinet_active_device_id', myDeviceId);
        if (window.KinetBackend && typeof window.KinetBackend.pushLocalStateToCloud === 'function') {
          window.KinetBackend.pushLocalStateToCloud();
        }
      }
    }
  });

  window.addEventListener('storage', (e) => {
    if (e.key === 'kinet_active_role' && e.newValue) {
      const newRole = normalizeRoleStrict(e.newValue);
      const currentDomRole = normalizeRoleStrict(document.body?.getAttribute('data-role'));
      if (newRole !== currentDomRole) {
        forceApplyGlobalRoleState(newRole, localStorage.getItem('kinet_sport'));
      }
    }
    if (e.key === 'kinet_user_name' || e.key === 'kinet_profiles_db') {
      enforceSinglePersonIdentityAcrossRoles();
    }
  });

  async function pollCloudActiveRoleLock() {
    if (localStorage.getItem('kinet_is_guest') === 'true') return;
    if (!window.KinetBackend || typeof window.KinetBackend.getClient !== 'function') return;
    const sb = window.KinetBackend.getClient();
    if (!sb) return;

    try {
      const myEmail = localStorage.getItem('kinet_user_email');
      const myUserId = localStorage.getItem('kinet_user_id');
      if (!myEmail && !myUserId) return;

      let query = sb.from('profiles').select('active_role, active_sport, full_name, user_state, updated_at');
      if (myUserId) query = query.eq('id', myUserId);
      else query = query.eq('email', myEmail);

      const { data, error } = await query.maybeSingle();
      if (error || !data) return;

      if (data.full_name && data.full_name.trim() && data.full_name !== 'NAIM T') {
        localStorage.setItem('kinet_user_name', data.full_name.trim());
        enforceSinglePersonIdentityAcrossRoles();
      }

      const cloudRole = normalizeRoleStrict(
        (data.user_state && data.user_state.kinet_active_role) || data.active_role || 'athlete'
      );
      const cloudSport = (data.user_state && data.user_state.kinet_sport) || data.active_sport || localStorage.getItem('kinet_sport') || 'Fútbol';
      const cloudRoleTs = parseInt((data.user_state && data.user_state.kinet_role_updated_at) || '0', 10);
      const localRoleTs = parseInt(localStorage.getItem('kinet_role_updated_at') || '0', 10);
      const currentLocalRole = normalizeRoleStrict(localStorage.getItem('kinet_active_role'));

      localStorage.setItem('kinet_last_synced_cloud_role', cloudRole);

      if (cloudRole !== currentLocalRole && cloudRoleTs >= localRoleTs) {
        localStorage.setItem('kinet_role_updated_at', String(cloudRoleTs));
        forceApplyGlobalRoleState(cloudRole, cloudSport);
      }
    } catch (err) {}
  }

  window.addEventListener('kinet:cloud-synced', () => {
    enforceSinglePersonIdentityAcrossRoles();
    pollCloudActiveRoleLock();
  });

  setInterval(pollCloudActiveRoleLock, 6000);

  if (window.KinetBackend) {
    window.KinetBackend.switchGlobalAccountRole = async function (newRoleKey, newSportOpt) {
      const cleanRole = normalizeRoleStrict(newRoleKey);
      const cleanSport = newSportOpt || localStorage.getItem('kinet_sport') || 'Fútbol';
      const nowTs = Date.now();

      localStorage.setItem('kinet_active_role', cleanRole);
      localStorage.setItem('kinet_role', cleanRole);
      localStorage.setItem('kinet_sport', cleanSport);
      localStorage.setItem('kinet_last_synced_cloud_role', cleanRole);
      localStorage.setItem('kinet_role_updated_at', String(nowTs));
      localStorage.setItem('kinet_active_device_id', myDeviceId);

      enforceSinglePersonIdentityAcrossRoles();

      if (typeof window.KinetBackend.pushLocalStateToCloud === 'function') {
        await window.KinetBackend.pushLocalStateToCloud();
      }
      forceApplyGlobalRoleState(cleanRole, cleanSport);
    };
  }
})();
// =========================================================================
// CONTROL DE NAVEGACIÓN LIMPIA EN INDEX.HTML, FASE1.HTML Y MODO INVITADO
// =========================================================================
window.addEventListener('DOMContentLoaded', () => {
  const path = (window.location.pathname || '').toLowerCase();

  // 1. Si estamos en index.html, asegurar que "INICIAR SESIÓN EN KINET" vaya a login.html y "ENTRAR COMO INVITADO" limpie la sesión antes de ir a fase1.html
  if (path.endsWith('index.html') || path === '/' || path === '') {
    document.querySelectorAll('a, button').forEach((btn) => {
      const txt = (btn.textContent || '').toUpperCase();
      if (txt.includes('ENTRAR COMO INVITADO') || txt.includes('MODO INVITADO')) {
        btn.onclick = async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (window.KinetBackend && typeof window.KinetBackend.resetAndStartCleanGuestSession === 'function') {
            await window.KinetBackend.resetAndStartCleanGuestSession();
          }
          window.location.href = 'fase1.html?guest=true';
        };
      } else if (txt.includes('INICIAR SESIÓN') || txt.includes('INICIAR SESION')) {
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.location.href = 'login.html';
        };
      }
    });
  }

  // 2. Si estamos en fase1.html (Selección de Perfil Operativo), que los botones "← Volver" y "Salir" devuelvan SIEMPRE a index.html / login.html y NUNCA a app.html si entraste como Invitado
  if (path.includes('fase1')) {
    const isGuestUrl = new URLSearchParams(window.location.search).get('guest') === 'true';
    if (isGuestUrl && window.KinetBackend && localStorage.getItem('kinet_is_guest') !== 'true') {
      window.KinetBackend.resetAndStartCleanGuestSession();
    }

    document.querySelectorAll('a, button').forEach((btn) => {
      const txt = (btn.textContent || '').trim().toLowerCase();
      if (txt.includes('volver')) {
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          // Si es invitado o no ha iniciado sesión, volver siempre a la portada index.html (nunca a app.html)
          if (localStorage.getItem('kinet_is_guest') === 'true' || localStorage.getItem('kinet_logged_in') !== 'true') {
            window.location.href = 'index.html';
          } else {
            window.location.href = 'despacho.html';
          }
        };
      } else if (txt.includes('salir')) {
        btn.onclick = async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (window.KinetBackend && typeof window.KinetBackend.logoutUser === 'function') {
            await window.KinetBackend.logoutUser();
          }
          window.location.href = 'index.html';
        };
      }
    });
  }
});
// =========================================================================
// MOTOR GLOBAL v5.9: ZERO-FLASH COLOR + MEMORIA DE PESTAÑA/SCROLL + CANDADO INVITADO EN COMUNIDAD + RESET PASSWORD
// =========================================================================
(function initKinetGlobalFixesV59() {
  // 1. APLICACIÓN SÍNCRONA INSTANTÁNEA DEL COLOR DE DESPACHO (0ms, SIN MICRO-PESTAÑEO)
  function applyInstantZeroFlashTheme() {
    try {
      const savedAccent = localStorage.getItem('kinet_custom_accent_override') || localStorage.getItem('kinet_accent_color');
      const rainbowOn = localStorage.getItem('kinet_rainbow_mode') === 'true';
      if (savedAccent && savedAccent.startsWith('#') && !rainbowOn) {
        const clean = savedAccent.replace('#', '');
        const num = parseInt(clean, 16);
        if (!isNaN(num)) {
          const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
          const root = document.documentElement;
          root.style.setProperty('--role-color', savedAccent, 'important');
          root.style.setProperty('--role-rgb', `${r}, ${g}, ${b}`, 'important');
          root.style.setProperty('--role-glow', `rgba(${r}, ${g}, ${b}, 0.42)`, 'important');
          root.style.setProperty('--role-gradient', `linear-gradient(135deg, ${savedAccent} 0%, rgba(${r},${g},${b},0.75) 100%)`, 'important');
          if (document.body) {
            document.body.style.setProperty('--role-color', savedAccent);
            document.body.style.setProperty('--role-rgb', `${r}, ${g}, ${b}`);
            document.body.style.setProperty('--role-glow', `rgba(${r}, ${g}, ${b}, 0.42)`);
            document.body.style.setProperty('--role-gradient', `linear-gradient(135deg, ${savedAccent} 0%, rgba(${r},${g},${b},0.75) 100%)`);
          }
        }
      }
    } catch (e) {}
  }
  applyInstantZeroFlashTheme();
  document.addEventListener('DOMContentLoaded', applyInstantZeroFlashTheme);

  // 2. EVITAR SALTOS DE SCROLL AL RECARGAR Y RECORDAR LA SUB-PESTAÑA ACTIVA (EJ: SUSCRIPCIONES EN DESPACHO)
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  const pageKey = (window.location.pathname || 'index').toLowerCase();

  window.addEventListener('beforeunload', () => {
    const ws = document.querySelector('.os-workspace');
    const scrollY = ws ? ws.scrollTop : window.scrollY;
    sessionStorage.setItem(`kinet_scroll_${pageKey}`, String(scrollY));
  });

  window.addEventListener('DOMContentLoaded', () => {
    // Restaurar sub-pestaña de Despacho si se recargó la página
    if (pageKey.includes('despacho')) {
      const savedTab = new URLSearchParams(window.location.search).get('tab') || sessionStorage.getItem('kinet_despacho_active_tab');
      if (savedTab && typeof window.switchDespachoTab === 'function') {
        setTimeout(() => window.switchDespachoTab(savedTab), 40);
      }
      document.querySelectorAll('[onclick*="switchDespachoTab"], [data-tab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const m = (btn.getAttribute('onclick') || '').match(/['"]([^'"]+)['"]/);
          const tabId = (m && m[1]) || btn.getAttribute('data-tab');
          if (tabId) {
            sessionStorage.setItem('kinet_despacho_active_tab', tabId);
            const u = new URL(window.location.href);
            u.searchParams.set('tab', tabId);
            history.replaceState(null, '', u.toString());
          }
        });
      });
    }

    // Restaurar posición limpia de scroll
    const savedScroll = parseInt(sessionStorage.getItem(`kinet_scroll_${pageKey}`) || '0', 10);
    if (savedScroll > 0) {
      setTimeout(() => {
        const ws = document.querySelector('.os-workspace');
        if (ws) ws.scrollTop = savedScroll;
        else window.scrollTo(0, savedScroll);
      }, 60);
    }

    // 3. BLOQUEO ESTRICTO DE COMUNIDAD / RED SOCIAL PARA MODO INVITADO (SIN CUENTA NI CORREO)
    const isGuest = localStorage.getItem('kinet_is_guest') === 'true' || localStorage.getItem('kinet_guest_session') === 'true';
    if (isGuest && pageKey.includes('comunidad')) {
      const overlay = document.createElement('div');
      overlay.id = 'kinet-guest-social-lock';
      overlay.style.cssText = `
        position: fixed; inset: 0; z-index: 2147483646;
        background: rgba(5, 7, 12, 0.92); backdrop-filter: blur(22px);
        display: flex; align-items: center; justify-content: center; padding: 20px;
      `;
      overlay.innerHTML = `
        <div style="max-width:440px;width:100%;background:#0B0F17;border:1.5px solid var(--role-color,#00FF88);border-radius:24px;padding:28px 24px;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,0.95),0 0 35px rgba(var(--role-rgb,0,255,136),0.22);">
          <div style="width:54px;height:54px;border-radius:16px;background:rgba(var(--role-rgb,0,255,136),0.14);border:1px solid var(--role-color,#00FF88);display:flex;align-items:center;justify-content:center;font-size:1.6rem;margin:0 auto 14px auto;">🔒</div>
          <h2 style="font-family:'Orbitron',sans-serif;font-weight:900;font-size:1.1rem;color:#FFF;margin-bottom:8px;">RED SOCIAL EXCLUSIVA PARA CUENTAS REGISTRADAS</h2>
          <p style="font-family:'Inter',sans-serif;font-size:0.8rem;color:#94A3B8;line-height:1.5;margin-bottom:20px;">
            Estás navegando en <strong>Modo Invitado</strong> (sin correo electrónico). Para tener perfil público en KINET Network™, publicar en Pulse, subir Shorts o enviar Mensajes Directos, inicia sesión o crea tu cuenta gratuita.
          </p>
          <div style="display:flex;gap:10px;justify-content:center;">
            <a href="app.html" style="flex:1;padding:11px 14px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);color:#FFF;font-family:'Orbitron',sans-serif;font-size:0.7rem;font-weight:700;text-decoration:none;">← Volver a Vestuario</a>
            <a href="login.html" style="flex:1.2;padding:11px 14px;border-radius:12px;background:var(--role-gradient,linear-gradient(135deg,#00FF88,#00B359));color:#04060A;font-family:'Orbitron',sans-serif;font-size:0.7rem;font-weight:900;text-decoration:none;">Crear Cuenta / Login →</a>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    // 4. MODAL AUTOMÁTICO DE "ESTABLECER NUEVA CONTRASEÑA" CUANDO VUELVES DEL LINK DEL CORREO DE SUPABASE
    const hash = window.location.hash || '';
    if (hash.includes('type=recovery') || new URLSearchParams(window.location.search).get('reset_password') === 'true') {
      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:rgba(4,6,10,0.92);backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center;padding:16px;';
      modal.innerHTML = `
        <div style="max-width:410px;width:100%;background:#0B0F17;border:1.5px solid #00FF88;border-radius:22px;padding:24px;color:#FFF;font-family:'Inter',sans-serif;">
          <h3 style="font-family:'Orbitron',sans-serif;font-weight:900;font-size:0.95rem;color:#00FF88;margin-bottom:6px;">🔑 ESTABLECER NUEVA CONTRASEÑA</h3>
          <p style="font-size:0.76rem;color:#94A3B8;margin-bottom:14px;">Escribe tu nueva contraseña segura para actualizar tu cuenta de KINET OS:</p>
          <input type="password" id="kinet-new-pass-in" placeholder="Nueva contraseña (mín. 6 caracteres)" style="width:100%;padding:10px 12px;border-radius:10px;background:#12161C;border:1px solid #262D37;color:#FFF;font-size:0.8rem;margin-bottom:12px;outline:none;">
          <button id="kinet-save-new-pass-btn" style="width:100%;padding:11px;border-radius:11px;background:#00FF88;color:#04060A;font-family:'Orbitron',sans-serif;font-weight:900;font-size:0.74rem;border:none;cursor:pointer;">GUARDAR NUEVA CONTRASEÑA</button>
        </div>
      `;
      document.body.appendChild(modal);
      document.getElementById('kinet-save-new-pass-btn').onclick = async () => {
        const newPass = document.getElementById('kinet-new-pass-in').value;
        if (!newPass || newPass.length < 6) {
          alert('La contraseña debe tener al menos 6 caracteres.');
          return;
        }
        try {
          const sb = window.KinetBackend && window.KinetBackend.getClient ? window.KinetBackend.getClient() : null;
          if (sb && sb.auth) await sb.auth.updateUser({ password: newPass });
          modal.remove();
          history.replaceState(null, '', window.location.pathname);
          alert('✓ Contraseña actualizada correctamente.');
        } catch (e) {
          modal.remove();
        }
      };
    }
  });
})();
