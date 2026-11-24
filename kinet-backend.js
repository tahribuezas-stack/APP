/**
 * KINET OS // Motor Oficial de Backend & Sincronización Directa REST con Supabase (v6.2 Zero-Leak Auth Token Isolation)
 * Servidor: https://bhqgsbtkwdxdxlvlcaes.supabase.co
 */
(function (window) {
  'use strict';
  // ZERO-FLASH GLOBAL: Sobrescribe body[data-role] antes de que el navegador pinte el <body>
  (function injectZeroFlashStyleImmediately() {
    try {
      const isReset = localStorage.getItem('kinet_theme_color_reset') === 'true';
      const savedAccent = isReset ? null : (localStorage.getItem('kinet_custom_accent_override') || localStorage.getItem('kinet_accent_color'));
      const rainbowOn = localStorage.getItem('kinet_rainbow_mode') === 'true';
      if (savedAccent && savedAccent.startsWith('#') && !rainbowOn) {
        const clean = savedAccent.replace('#', '');
        const num = parseInt(clean, 16);
        if (!isNaN(num)) {
          const r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
          let st = document.getElementById('kinet-zero-flash-override');
          if (!st) {
            st = document.createElement('style');
            st.id = 'kinet-zero-flash-override';
            (document.head || document.documentElement).appendChild(st);
          }
          st.textContent = `
            :root, html, body, body[data-role="athlete"], body[data-role="staff"], body[data-role="scout"] {
              --role-color: ${savedAccent} !important;
              --role-rgb: ${r}, ${g}, ${b} !important;
              --role-glow: rgba(${r}, ${g}, ${b}, 0.42) !important;
              --role-gradient: linear-gradient(135deg, ${savedAccent} 0%, rgba(${r},${g},${b},0.75) 100%) !important;
            }
          `;
        }
      }
    } catch (e) {}
  })();

  const SUPABASE_URL = 'https://bhqgsbtkwdxdxlvlcaes.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_GrgL4iukPUJJyh91BdgfIQ_P0NQd6Nj';

  let sbClient = null;
  let syncTimeout = null;
  let isHydratingFromCloud = false;
  let initialCloudPullFinished = false;
  let dmPollingInterval = null;
  let lastKnownMessageSignature = -1;
  let lastUnreadCount = 0;

  const originalSetItem = localStorage.setItem;
  const originalRemoveItem = localStorage.removeItem;

  // Identificador de ESTE dispositivo (no se sincroniza): permite saber si un cambio vino de otro dispositivo
  let deviceId = '';
  try {
    deviceId = localStorage.getItem('kinet_device_id') || '';
    if (!deviceId) { deviceId = 'dev_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); originalSetItem.call(localStorage, 'kinet_device_id', deviceId); }
  } catch (e) { deviceId = 'dev_' + Math.random().toString(36).slice(2, 10); }
  let remoteChecking = false;
  let lastPullChanged = [];
  let lastPullWriter = null;

  // =========================================================================
  // 1. VALIDADOR INTELIGENTE DE SESIÓN REAL / PRO VS INVITADO (NUNCA BLOQUEA CUENTAS PRO)
  // =========================================================================
  function isStrictlyAuthenticatedUser() {
    try {
      if (new URLSearchParams(window.location.search).get('guest') === 'true') {
        return false;
      }
    } catch (e) {}

    const tier = (localStorage.getItem('kinet_account_tier') || '').toLowerCase();
    const isProOrClub = tier === 'pro' || tier === 'club' || localStorage.getItem('kinet_is_pro') === 'true';
    const token = localStorage.getItem('kinet_auth_session_token');
    const uid = localStorage.getItem('kinet_user_id');
    const email = (localStorage.getItem('kinet_user_email') || '').trim();
    const name = (localStorage.getItem('kinet_user_name') || '').trim();
    const handle = (localStorage.getItem('kinet_social_handle') || localStorage.getItem('kinet_username') || '').trim();
    const loggedInFlag = localStorage.getItem('kinet_logged_in') === 'true';

    const hasRealUserData =
      isProOrClub ||
      Boolean(token) ||
      (email && email.includes('@')) ||
      (uid && uid.length > 15) ||
      (loggedInFlag && name && !name.toLowerCase().includes('invitado') && !handle.toLowerCase().includes('invitado'));

    if (hasRealUserData) {
      if (localStorage.getItem('kinet_is_guest') === 'true' || localStorage.getItem('kinet_guest_session') === 'true' || localStorage.getItem('kinet_mode') === 'guest') {
        localStorage.removeItem('kinet_is_guest');
        localStorage.removeItem('kinet_guest_session');
        originalSetItem.call(localStorage, 'kinet_mode', 'pro');
      }
      if (!token) {
        originalSetItem.call(localStorage, 'kinet_auth_session_token', 'auth_' + (uid || 'pro') + '_' + Date.now());
      }
      if (!loggedInFlag) {
        originalSetItem.call(localStorage, 'kinet_logged_in', 'true');
      }
      return true;
    }

    return false;
  }

  function isGuestSessionActive() {
    return !isStrictlyAuthenticatedUser();
  }

  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('guest') === 'true') {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('kinet_') || k.startsWith('sb-') || k.includes('supabase')) {
          localStorage.removeItem(k);
        }
      });
      originalSetItem.call(localStorage, 'kinet_is_guest', 'true');
      originalSetItem.call(localStorage, 'kinet_guest_session', 'true');
      originalSetItem.call(localStorage, 'kinet_mode', 'guest');
      originalSetItem.call(localStorage, 'kinet_account_tier', 'free');
      originalSetItem.call(localStorage, 'kinet_user_name', 'Atleta Invitado');
      originalSetItem.call(localStorage, 'kinet_social_handle', '@invitado_kinet');
    }
  } catch (e) {}

  async function supabaseRestRequest(tableAndQuery, method = 'GET', bodyObj = null, upsert = false) {
    const accessToken = await getAccessToken();
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${accessToken || SUPABASE_ANON_KEY}`,
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

  // Token de la sesión real de Supabase (necesario para que RLS identifique al usuario)
  async function getAccessToken() {
    try {
      const c = initSupabase();
      if (c && c.auth) {
        const { data } = await c.auth.getSession();
        return (data && data.session && data.session.access_token) || null;
      }
    } catch (e) {}
    return null;
  }

  // El plan, los minutos bonus y el rango de staff los decide SIEMPRE el servidor.
  async function syncPrivilegedFromServer() {
    try {
      if (!isStrictlyAuthenticatedUser()) return null;
      if (!(await getAccessToken())) return null;
      const uid = localStorage.getItem('kinet_user_id');
      if (!uid) return null;
      const rows = await supabaseRestRequest(`profiles?id=eq.${encodeURIComponent(uid)}&select=account_tier,bonus_video_mins,staff_role&limit=1`, 'GET');
      const row = Array.isArray(rows) && rows[0];
      if (!row) return null;
      const prevTier = (localStorage.getItem('kinet_account_tier') || 'free').toLowerCase();
      const tier = ['pro', 'club'].includes(String(row.account_tier).toLowerCase()) ? String(row.account_tier).toLowerCase() : 'free';
      originalSetItem.call(localStorage, 'kinet_account_tier', tier);
      originalSetItem.call(localStorage, 'kinet_is_pro', tier === 'free' ? 'false' : 'true');
      if (row.staff_role) originalSetItem.call(localStorage, 'kinet_staff_admin_role', row.staff_role);
      else localStorage.removeItem('kinet_staff_admin_role');

      const server = Math.min(595, Math.max(0, parseFloat(row.bonus_video_mins) || 0));
      const local = parseFloat(localStorage.getItem('kinet_bonus_video_mins'));
      const seen = parseFloat(localStorage.getItem('kinet_bonus_server_seen'));
      let next = server;
      // Si el servidor no cambió desde la última sincronización y el usuario gastó minutos, se registra el gasto (solo puede bajar).
      if (!isNaN(seen) && seen === server && !isNaN(local) && local < server) {
        try { await supabaseRestRequest(`profiles?id=eq.${encodeURIComponent(uid)}`, 'PATCH', { bonus_video_mins: local }); next = local; } catch (e) {}
      }
      originalSetItem.call(localStorage, 'kinet_bonus_video_mins', String(next));
      originalSetItem.call(localStorage, 'kinet_bonus_server_seen', String(next));
      if (prevTier !== tier && sessionStorage.getItem('kinet_tier_reloaded') !== tier) {
        sessionStorage.setItem('kinet_tier_reloaded', tier);
        keepIntroAcrossReload();
        location.reload();
        return { tier, bonus: next };
      }
      try { decorateRoleChip(); window.dispatchEvent(new CustomEvent('kinet:tier-synced', { detail: { tier } })); } catch (e) {}
      return { tier, bonus: next };
    } catch (e) { return null; }
  }
  window.addEventListener('load', () => setTimeout(() => { syncPrivilegedFromServer(); }, 900));

  // Chip de la cabecera: "ATLETA · FREE / PRO / CLUB". El plan sale del servidor (account_tier), no de una etiqueta fija.
  function decorateRoleChip() {
    const el = document.getElementById('topbar-role-title');
    if (!el) return;
    const raw = String(el.textContent || '').trim();
    const base = raw.replace(/\s*[·•]\s*(FREE|PRO|CLUB)$/i, '').replace(/\s+PRO$/i, '').trim();
    if (!/^ATLETA$/i.test(base)) return;                      // los demás roles ya llevan etiqueta larga
    const t = String(localStorage.getItem('kinet_account_tier') || 'free').toLowerCase();
    const tier = (t === 'pro' || t === 'club') ? t.toUpperCase() : 'FREE';
    const next = base.toUpperCase() + ' · ' + tier;
    el.title = 'Rol: atleta · Plan: ' + tier;
    if (raw !== next) el.textContent = next;
  }
  function watchRoleChip() {
    const el = document.getElementById('topbar-role-title');
    if (!el) return;
    decorateRoleChip();
    try { new MutationObserver(() => decorateRoleChip()).observe(el, { childList: true, characterData: true, subtree: true }); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchRoleChip); else watchRoleChip();
  window.addEventListener('load', () => setTimeout(decorateRoleChip, 300));

  // Escape de HTML para todo contenido escrito por usuarios (evita XSS almacenado)
  window.kinetEsc = function (v) {
    return String(v === null || v === undefined ? '' : v).replace(/[&<>"'`]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[c];
    });
  };
  // Los @usuarios solo pueden contener letras, números, _ . - y @ (seguro también dentro de onclick)
  window.kinetHandle = function (v) {
    return String(v === null || v === undefined ? '' : v).replace(/[^\w@.\-]/g, '');
  };

  function initSupabase() {
    if (sbClient) return sbClient;
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return sbClient;
  }

  // Claves temporales (traspasos entre pantallas, avisos, OAuth a medias): no tienen sentido en la nube ni en otros dispositivos
  const TEMP_KEY_RE = /^kinet_(hk_day|media_studio_auto_|vision_lab_import_target|spotify_(verifier|return)|sync_toast_at|sync_reload_at|lite_notice|pending_stripe_item)/;
  function collectAllKinetLocalState() {
    const state = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (
        k &&
        k.startsWith('kinet_') &&
        k !== 'kinet_sb_key' &&
        k !== 'kinet_saved_posts' &&
        k !== 'kinet_is_guest' &&
        k !== 'kinet_guest_session' &&
        k !== 'kinet_auth_session_token' &&
        k !== 'kinet_staff_admin_role' &&
        k !== 'kinet_device_id' &&
        k !== 'kinet_sync_base' &&
        k !== 'kinet_sync_seen' &&
        k !== 'kinet_sync_writer' &&
        !TEMP_KEY_RE.test(k)
      ) {
        const val = localStorage.getItem(k);
        if (val && val.length < 600000) {
          state[k] = val;
        }
      }
    }
    return state;
  }


  // =========================================================================
  // SINCRONIZACIÓN ENTRE DISPOSITIVOS (v2): cada dispositivo sube SOLO lo que cambió desde la última sincronización
  // y baja lo que cambió en otros, sin pisar ediciones locales pendientes. La base de comparación son huellas (hash) por clave.
  // =========================================================================
  const SYNC_SKIP = {
    kinet_sb_key: 1, kinet_saved_posts: 1, kinet_is_guest: 1, kinet_guest_session: 1, kinet_auth_session_token: 1,
    kinet_staff_admin_role: 1, kinet_device_id: 1, kinet_sync_base: 1, kinet_sync_seen: 1, kinet_sync_writer: 1,
    kinet_account_tier: 1, kinet_is_pro: 1, kinet_ct_inflight: 1,   // plan: lo decide solo el servidor
    // Mensajes de un solo uso entre pantallas: NUNCA deben viajar a la nube (si no, al recargar se repiten)
    kinet_pending_question: 1, kinet_target_agent: 1, kinet_pending_dm_broadcast: 1, kinet_ct_consumed: 1,
    kinet_hk_day: 1, kinet_media_studio_auto_prompt: 1, kinet_media_studio_auto_preset: 1, kinet_vision_lab_import_target: 1,
    kinet_spotify_verifier: 1, kinet_spotify_return: 1, kinet_sync_toast_at: 1, kinet_sync_reload_at: 1, kinet_lite_notice: 1, kinet_pending_stripe_item: 1
  };
  const CHANGE_IGNORE = {
    kinet_auth_session_token: 1, kinet_avatar_updated_at: 1, kinet_unread_dm_count: 1, kinet_mode: 1, kinet_logged_in: 1,
    kinet_account_tier: 1, kinet_is_pro: 1, kinet_bonus_video_mins: 1, kinet_video_mins_used: 1, kinet_user_id: 1,
    kinet_sync_base: 1, kinet_sync_seen: 1, kinet_sync_writer: 1, kinet_staff_admin_role: 1, kinet_device_id: 1,
    kinet_social_configured: 1, kinet_profile_completed: 1, kinet_official_welcome_read: 1, kinet_ct_inflight: 1,
    kinet_pending_question: 1, kinet_target_agent: 1, kinet_pending_dm_broadcast: 1, kinet_ct_consumed: 1,
    kinet_hk_day: 1, kinet_media_studio_auto_prompt: 1, kinet_media_studio_auto_preset: 1, kinet_vision_lab_import_target: 1,
    kinet_spotify_verifier: 1, kinet_spotify_return: 1, kinet_sync_toast_at: 1, kinet_sync_reload_at: 1, kinet_lite_notice: 1, kinet_pending_stripe_item: 1
  };
  function hashStr(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) { h = ((h << 5) + h + str.charCodeAt(i)) | 0; }
    return str.length + ':' + (h >>> 0).toString(36);
  }
  function currentSyncHashes() {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith('kinet_') || SYNC_SKIP[k]) continue;
      const v = localStorage.getItem(k);
      if (v && String(v).trim() !== '' && v.length < 600000) out[k] = hashStr(v);
    }
    return out;
  }
  function getSyncBase() {
    try { const b = JSON.parse(localStorage.getItem('kinet_sync_base') || 'null'); return (b && typeof b === 'object') ? b : null; } catch (e) { return null; }
  }
  function setSyncBase(obj) { try { originalSetItem.call(localStorage, 'kinet_sync_base', JSON.stringify(obj)); } catch (e) {} }
  function unsyncedLocalKeys() {
    const base = getSyncBase(); const set = new Set();
    if (!base) return set;
    const now = currentSyncHashes();
    Object.keys(now).forEach((k) => { if (base[k] !== now[k]) set.add(k); });
    return set;
  }

  // La sesión real (Supabase) manda: si el perfil guardado en este navegador no es el de la sesión, se limpia todo resto de otra cuenta.
  async function ensureSessionIdentity() {
    try {
      const c = initSupabase();
      if (!c || !c.auth) return;
      const { data } = await c.auth.getSession();
      const sess = data && data.session;
      if (!sess || !sess.user || !sess.user.id) return;
      const sid = sess.user.id;
      const uid = localStorage.getItem('kinet_user_id');
      if (uid && uid !== sid) {
        Object.keys(localStorage).forEach((k) => { if (k.startsWith('kinet_') && k !== 'kinet_device_id') originalRemoveItem.call(localStorage, k); });
        originalSetItem.call(localStorage, 'kinet_user_id', sid);
        if (sess.user.email) originalSetItem.call(localStorage, 'kinet_user_email', sess.user.email);
        originalSetItem.call(localStorage, 'kinet_logged_in', 'true');
        originalSetItem.call(localStorage, 'kinet_auth_session_token', 'auth_' + sid + '_' + Date.now());
      }
    } catch (e) {}
  }

  function showSyncToast() {
    try {
      if (document.getElementById('kinet-sync-toast') || !document.body) return;
      const t = document.createElement('div');
      t.id = 'kinet-sync-toast';
      t.setAttribute('role', 'status');
      t.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:92px;z-index:99999;display:flex;gap:10px;align-items:center;max-width:92vw;padding:10px 14px;border-radius:12px;background:rgba(8,12,20,.96);border:1px solid var(--role-color,#00FF88);color:#E2E8F0;font:600 12px/1.3 Inter,system-ui,sans-serif;box-shadow:0 6px 28px rgba(0,0,0,.55)';
      t.innerHTML = '<span>🔄 Tus datos se actualizaron desde otro dispositivo</span><button type="button" style="background:var(--role-color,#00FF88);color:#04060A;border:0;border-radius:8px;padding:6px 10px;font-weight:800;cursor:pointer">Actualizar</button>';
      t.querySelector('button').onclick = function () { location.reload(); };
      document.body.appendChild(t);
      setTimeout(function () { try { t.remove(); } catch (e) {} }, 15000);
    } catch (e) {}
  }

  // Si la página se recarga justo al entrar (sincronización inicial), la animación de entrada se retoma en la nueva carga.
  function keepIntroAcrossReload() {
    try {
      const at = parseInt(sessionStorage.getItem('kx_intro_at') || '0', 10);
      if (at && Date.now() - at < 8000) { sessionStorage.removeItem('kx_intro'); sessionStorage.setItem('kx_cover', String(Date.now())); }
    } catch (e) {}
  }
  function onRemoteChanged(reason) {
    try {
      refreshDOMAvatarsAndProfileUI();
      applyGlobalSidebarEnhancements();
      // Si el último en escribir fue ESTE dispositivo (otra pantalla de la app), no hay nada "de otro dispositivo": ni recarga ni aviso.
      if (lastPullWriter && lastPullWriter === deviceId) return;
      // La página puede declarar que ya aplicó el cambio en vivo (p. ej. chats) llamando a preventDefault(): sin recarga ni aviso.
      const handled = !window.dispatchEvent(new CustomEvent('kinet:remote-update', { detail: { changed: lastPullChanged.slice() }, cancelable: true }));
      if (handled) return;
      const ae = document.activeElement;
      const typing = !!(ae && (/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) || ae.isContentEditable));
      const busy = !!document.querySelector('.ai-thinking-eta-card');
      const last = parseInt(sessionStorage.getItem('kinet_sync_reload_at') || '0', 10);
      const canReload = !typing && !busy && (Date.now() - last > 30000);
      if ((reason === 'load' || reason === 'resume') && canReload) {
        sessionStorage.setItem('kinet_sync_reload_at', String(Date.now()));
        keepIntroAcrossReload();
        location.reload();
        return;
      }
      // Como mucho un aviso cada 3 minutos: si el otro dispositivo escribe sin parar, no se satura la pantalla.
      const lastToast = parseInt(sessionStorage.getItem('kinet_sync_toast_at') || '0', 10);
      if (Date.now() - lastToast < 180000) return;
      sessionStorage.setItem('kinet_sync_toast_at', String(Date.now()));
      showSyncToast();
    } catch (e) {}
  }

  async function checkRemoteChange(reason) {
    if (remoteChecking || !initialCloudPullFinished || !isStrictlyAuthenticatedUser()) return;
    remoteChecking = true;
    try {
      const uid = localStorage.getItem('kinet_user_id');
      if (!uid || uid.length < 16) return;
      const rows = await supabaseRestRequest(`profiles?id=eq.${encodeURIComponent(uid)}&select=updated_at,account_tier,writer:user_state->>kinet_sync_writer&limit=1`, 'GET');
      const r = Array.isArray(rows) && rows[0];
      if (!r) return;
      const localTier = (localStorage.getItem('kinet_account_tier') || 'free').toLowerCase();
      const srvTier = ['pro', 'club'].includes(String(r.account_tier).toLowerCase()) ? String(r.account_tier).toLowerCase() : 'free';
      if (localTier !== srvTier) { try { await syncPrivilegedFromServer(); } catch (e) {} }
      const seen = localStorage.getItem('kinet_sync_seen');
      if (r.updated_at && r.updated_at === seen) return;
      if (r.writer && r.writer === deviceId) { if (r.updated_at) originalSetItem.call(localStorage, 'kinet_sync_seen', r.updated_at); return; }
      await KinetBackend.pullCloudStateToLocal();
      if (lastPullChanged.length) onRemoteChanged(reason);
    } catch (e) {
    } finally { remoteChecking = false; }
  }

  // Interceptar localStorage.setItem para que los Onboardings NO puedan activar kinet_logged_in si el usuario es Invitado
  localStorage.setItem = function (key, value) {
    if (key === 'kinet_logged_in' && value === 'true') {
      if (localStorage.getItem('kinet_is_guest') === 'true' || !localStorage.getItem('kinet_auth_session_token')) {
        return;
      }
    }
    originalSetItem.apply(this, arguments);
    if ((key === 'kinet_custom_accent_override' || key === 'kinet_accent_color') && value && String(value).startsWith('#')) {
      originalRemoveItem.call(localStorage, 'kinet_theme_color_reset');
    }
    if (key === 'kinet_user_avatar' && value) {
      originalSetItem.call(localStorage, 'kinet_avatar_updated_at', String(Date.now()));
      refreshDOMAvatarsAndProfileUI();
    }
    if (key === 'kinet_unread_dm_count' || key === 'kinet_official_welcome_read') {
      updateGlobalCommunityExclamationBadge();
    }
    if (!isHydratingFromCloud && initialCloudPullFinished && key && key.startsWith('kinet_') && isStrictlyAuthenticatedUser()) {
      scheduleCloudSync();
    }
  };

  localStorage.removeItem = function (key) {
    originalRemoveItem.apply(this, arguments);
    if (!isHydratingFromCloud && initialCloudPullFinished && key && key.startsWith('kinet_') && isStrictlyAuthenticatedUser()) {
      scheduleCloudSync();
    }
  };

  function scheduleCloudSync() {
    if (!initialCloudPullFinished || !isStrictlyAuthenticatedUser()) return;
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      KinetBackend.pushLocalStateToCloud();
    }, 500);
  }

  // "Config. Red Social": solo para invitados (incentivo para crear cuenta) o cuentas que NO han configurado nada.
  // En cuanto existe cualquier dato mínimo de perfil, no vuelve a aparecer (editar sigue en Mi Perfil).
  function profileLooksConfigured() {
    const g = (k) => (localStorage.getItem(k) || '').trim();
    if (g('kinet_social_configured') === 'true' || g('kinet_profile_completed') === 'true') return true;
    if (g('kinet_user_name') && g('kinet_user_name') !== 'Atleta Invitado' && g('kinet_user_name') !== 'Usuario KINET') return true;
    return !!(g('kinet_user_avatar') || g('kinet_social_bio') || g('kinet_user_club'));
  }
  function syncSocialConfigLinks() {
    try {
      const hide = isStrictlyAuthenticatedUser() && profileLooksConfigured();
      document.querySelectorAll('#nav-config-social, #drawer-config-social').forEach((el) => { el.style.display = hide ? 'none' : ''; });
    } catch (e) {}
  }
  window.KinetSocialLinks = { refresh: syncSocialConfigLinks, configured: profileLooksConfigured };
  window.addEventListener('kinet:cloud-synced', syncSocialConfigLinks);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncSocialConfigLinks); else syncSocialConfigLinks();
  setTimeout(syncSocialConfigLinks, 1200);

  function scrubHardcodedHtmlPlaceholdersForGuest() {
    if (isStrictlyAuthenticatedUser()) return;
    const guestName = localStorage.getItem('kinet_user_name') || 'Atleta Invitado';
    const guestHandle = localStorage.getItem('kinet_social_handle') || '@invitado_kinet';

    document.querySelectorAll('#my-social-name, #modal-composer-name, [data-kinet-user-name], #sidebar-user-name').forEach((el) => {
      if (el.textContent && (el.textContent.toUpperCase().includes('NAIM') || el.textContent.trim().toUpperCase() === 'ATLETA KINET' || el.textContent.trim() === '')) {
        el.textContent = guestName.toUpperCase();
      }
    });
    document.querySelectorAll('#my-social-handle, [data-kinet-user-handle], #sidebar-user-handle').forEach((el) => {
      if (el.textContent && (el.textContent.toLowerCase().includes('naim') || el.textContent.trim() === '@usuario' || el.textContent.trim() === '')) {
        el.textContent = guestHandle;
      }
    });
    document.querySelectorAll('#my-social-avatar, #composer-user-avatar, #setup-preview-avatar, #modal-composer-avatar').forEach((el) => {
      if (el.textContent && el.textContent.trim() === 'NT') {
        el.textContent = 'AI';
        el.style.backgroundImage = 'none';
      }
    });
  }

  function refreshDOMAvatarsAndProfileUI() {
    try {
      if (!isStrictlyAuthenticatedUser()) {
        scrubHardcodedHtmlPlaceholdersForGuest();
        return;
      }
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


  // Une dos copias de un chat de IA: deja los mensajes de la nube y añade al final los que solo estaban en este dispositivo.
  function mergeChatStates(cloudStr, localStr) {
    try {
      const c = JSON.parse(cloudStr), l = JSON.parse(localStr);
      if (!c || typeof c !== 'object' || !l || typeof l !== 'object') return cloudStr;
      const sig = (m) => String((m && m.sender) || '') + '|' + String((m && m.time) || '') + '|' + String((m && m.text) || '').slice(0, 240);
      Object.keys(l).forEach((agent) => {
        const la = l[agent];
        if (!la || typeof la !== 'object') return;
        if (!c[agent]) { c[agent] = la; return; }
        const cm = Array.isArray(c[agent].messages) ? c[agent].messages : (c[agent].messages = []);
        const have = new Set(cm.map(sig));
        (Array.isArray(la.messages) ? la.messages : []).forEach((m) => { if (!have.has(sig(m))) { cm.push(m); have.add(sig(m)); } });
      });
      return JSON.stringify(c);
    } catch (e) { return cloudStr; }
  }

  function restoreCloudStateToLocal(profileRow) {
    if (!profileRow || !profileRow.id) return;
    isHydratingFromCloud = true;
    const unsynced = unsyncedLocalKeys();
    const setSynced = (k, v) => { if (!unsynced.has(k)) originalSetItem.call(localStorage, k, v); };
    const baseBefore = getSyncBase();
    try {
      localStorage.removeItem('kinet_is_guest');
      localStorage.removeItem('kinet_guest_session');
      originalSetItem.call(localStorage, 'kinet_mode', 'pro');
      originalSetItem.call(localStorage, 'kinet_auth_session_token', 'auth_' + profileRow.id + '_' + Date.now());

      const cloudState = profileRow.user_state || {};
      if (cloudState.kinet_theme_color_reset === 'true' || (!cloudState.kinet_custom_accent_override && !cloudState.kinet_accent_color)) {
        originalRemoveItem.call(localStorage, 'kinet_custom_accent_override');
        originalRemoveItem.call(localStorage, 'kinet_accent_color');
        originalSetItem.call(localStorage, 'kinet_theme_color_reset', 'true');
        const zf = document.getElementById('kinet-zero-flash-override');
        if (zf) zf.remove();
        if (localStorage.getItem('kinet_rainbow_mode') !== 'true') {
          [document.documentElement, document.body].forEach(el => {
            if (!el) return;
            el.style.removeProperty('--role-color');
            el.style.removeProperty('--role-rgb');
            el.style.removeProperty('--role-glow');
            el.style.removeProperty('--role-gradient');
          });
        }
      }
      Object.keys(cloudState).forEach((k) => {
        if (k === 'kinet_custom_accent_override' || k === 'kinet_accent_color') {
          if (cloudState.kinet_theme_color_reset === 'true') return;
        }
        if (k !== 'kinet_is_guest' && k !== 'kinet_guest_session' && cloudState[k] !== null && cloudState[k] !== undefined && String(cloudState[k]).trim() !== '') {
          if (k === 'kinet_user_name' && (cloudState[k] === 'Usuario KINET' || cloudState[k] === 'Atleta Invitado')) {
            return;
          }
          if (!unsynced.has(k) && !SYNC_SKIP[k]) {
            let val = String(cloudState[k]);
            // Primera sincronización de este dispositivo: los chats de IA que solo existen aquí se FUSIONAN con los de la nube (no se pierde nada)
            if (!baseBefore && /^kinet_staff_chats_v\d+_/.test(k)) {
              const loc = localStorage.getItem(k);
              if (loc && loc !== val) val = mergeChatStates(val, loc);
            }
            originalSetItem.call(localStorage, k, val);
          }
        }
      });
      // Claves borradas en otro dispositivo: se borran aquí si no tenemos cambios locales pendientes en ellas
      if (baseBefore) {
        Object.keys(baseBefore).forEach((k) => {
          if (!(k in cloudState) && !unsynced.has(k) && !SYNC_SKIP[k]) originalRemoveItem.call(localStorage, k);
        });
      }

      originalSetItem.call(localStorage, 'kinet_user_id', profileRow.id);
      if (profileRow.email) originalSetItem.call(localStorage, 'kinet_user_email', profileRow.email);
      if (profileRow.full_name && profileRow.full_name !== 'Atleta Invitado') {
        setSynced('kinet_user_name', profileRow.full_name);
      }
      if (profileRow.handle && !profileRow.handle.includes('invitado')) {
        setSynced('kinet_username', profileRow.handle);
        setSynced('kinet_social_handle', profileRow.handle);
      }
      if (profileRow.bio) setSynced('kinet_social_bio', profileRow.bio);

      const cloudAvatar = profileRow.avatar_url || cloudState.kinet_user_avatar;
      if (cloudAvatar && cloudAvatar.length > 12) {
        setSynced('kinet_user_avatar', cloudAvatar);
      }

      if (profileRow.active_role) {
        setSynced('kinet_active_role', profileRow.active_role);
        setSynced('kinet_role', profileRow.active_role);
      }
      if (profileRow.active_sport) setSynced('kinet_sport', profileRow.active_sport);
      if (profileRow.position && profileRow.position !== 'Por asignar') setSynced('kinet_position', profileRow.position);
      if (profileRow.category) setSynced('kinet_category', profileRow.category);
      if (profileRow.club) setSynced('kinet_user_club', profileRow.club);
      const resolvedTier = String(profileRow.account_tier || 'free').toLowerCase().trim();
      originalSetItem.call(localStorage, 'kinet_account_tier', resolvedTier);
      originalSetItem.call(localStorage, 'kinet_is_pro', (resolvedTier === 'pro' || resolvedTier === 'club') ? 'true' : 'false');

      if (typeof profileRow.bonus_video_mins === 'number' && !isNaN(profileRow.bonus_video_mins)) {
        const cappedBonus = Math.min(595, Math.max(0, profileRow.bonus_video_mins));
        originalSetItem.call(localStorage, 'kinet_bonus_video_mins', String(cappedBonus));
      }
      if (typeof profileRow.video_mins_used === 'number' && !isNaN(profileRow.video_mins_used)) {
        originalSetItem.call(localStorage, 'kinet_video_mins_used', String(Math.max(0, profileRow.video_mins_used)));
      }

      const rawStaffRole = String(
        profileRow.staff_role ||
        profileRow.admin_role ||
        profileRow.employee_role ||
        cloudState.supabase_staff_role ||
        ''
      ).toLowerCase().trim();
      const validStaffRoles = ['superadmin', 'subadmin', 'moderator', 'scout_verifier', 'marketing', 'admin'];
      if (validStaffRoles.includes(rawStaffRole)) {
        originalSetItem.call(localStorage, 'kinet_staff_admin_role', rawStaffRole);
      } else {
        localStorage.removeItem('kinet_staff_admin_role');
      }

      originalSetItem.call(localStorage, 'kinet_logged_in', 'true');
      originalSetItem.call(localStorage, 'kinet_social_configured', 'true');
      originalSetItem.call(localStorage, 'kinet_profile_completed', 'true');
      // Nueva base de comparación: solo las claves que ya coinciden con la nube
      try {
        const nb = {}; const nowH = currentSyncHashes(); const cs = profileRow.user_state || {};
        Object.keys(nowH).forEach((k) => { if (k in cs && String(cs[k]) === localStorage.getItem(k)) nb[k] = nowH[k]; });
        // claves que vienen de columnas del perfil (no de user_state) y están alineadas
        const cols = { kinet_user_name: profileRow.full_name, kinet_social_handle: profileRow.handle, kinet_username: profileRow.handle, kinet_social_bio: profileRow.bio, kinet_user_avatar: profileRow.avatar_url, kinet_active_role: profileRow.active_role, kinet_role: profileRow.active_role, kinet_sport: profileRow.active_sport, kinet_position: profileRow.position, kinet_category: profileRow.category, kinet_user_club: profileRow.club };
        Object.keys(cols).forEach((k) => { if (nowH[k] && cols[k] != null && String(cols[k]) === localStorage.getItem(k)) nb[k] = nowH[k]; });
        unsynced.forEach((k) => { delete nb[k]; });
        setSyncBase(nb);
        if (profileRow.updated_at) originalSetItem.call(localStorage, 'kinet_sync_seen', profileRow.updated_at);
      } catch (e) {}
    } finally {
      isHydratingFromCloud = false;
      refreshDOMAvatarsAndProfileUI();
      applyGlobalSidebarEnhancements();
    }
  }

  async function resolveCurrentUserId() {
    if (!isStrictlyAuthenticatedUser()) return null;
    const uid = localStorage.getItem('kinet_user_id');
    return (uid && uid.length > 15) ? uid : null;
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
        @keyframes pageEnter {
            from { opacity: 0; transform: translateY(10px) scale(0.992); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes kinetPanelCascade {
            from { opacity: 0; transform: translateY(14px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .os-workspace,
          main.workspace,
          .analyzer-workspace {
            animation: pageEnter 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
          }
          .os-workspace .kinet-panel,
          .os-workspace .kinet-network-toolbar {
            animation: kinetPanelCascade 0.48s cubic-bezier(0.16, 1, 0.3, 1) backwards;
          }
          .os-workspace .bento-grid > div:nth-child(1) .kinet-panel { animation-delay: 0.04s; }
          .os-workspace .bento-grid > div:nth-child(2) .kinet-panel { animation-delay: 0.09s; }
          .os-workspace .bento-grid > div:nth-child(3) .kinet-panel { animation-delay: 0.14s; }
          .os-workspace .bento-grid > div:nth-child(4) .kinet-panel { animation-delay: 0.18s; }
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
      const isProOrClub = isStrictlyAuthenticatedUser() && (tier === 'pro' || tier === 'club');
      document.querySelectorAll('[data-pro-upsell], #sidebar-pro-btn, #nav-upgrade-pro, #drawer-upgrade-pro').forEach((el) => {
        if (isProOrClub) {
          el.style.setProperty('display', 'none', 'important');
        } else {
          el.style.removeProperty('display');
        }
      });
    } catch (e) {}
  }

  const KinetBackend = {
    getClient: initSupabase,
    syncPrivilegedFromServer,
    compressAvatar: compressAvatarDataUrl,
    refreshUI: refreshDOMAvatarsAndProfileUI,
    updateCommunityBadge: updateGlobalCommunityExclamationBadge,
    isGuest: isGuestSessionActive,

    canUploadVideo() {
      if (!isStrictlyAuthenticatedUser()) return false;
      const tier = (localStorage.getItem('kinet_account_tier') || 'free').toLowerCase();
      const bonusMins = parseFloat(localStorage.getItem('kinet_bonus_video_mins') || '0');
      return tier === 'pro' || tier === 'club' || bonusMins > 0;
    },

    getStaffAdminRole() {
      if (!isStrictlyAuthenticatedUser()) return null;
      const r = (localStorage.getItem('kinet_staff_admin_role') || '').toLowerCase().trim();
      const valid = ['superadmin', 'subadmin', 'moderator', 'scout_verifier', 'marketing', 'admin'];
      return valid.includes(r) ? r : null;
    },

    hasStaffPermission(requiredScope = 'any') {
      const role = this.getStaffAdminRole();
      if (!role) return false;
      if (role === 'superadmin' || role === 'admin') return true;
      if (role === 'subadmin') return requiredScope !== 'owner_only';
      if (requiredScope === 'any') return true;
      return role === requiredScope;
    },

    async adminUpdateUserAccount({ targetEmailOrHandle, accountTier, bonusVideoMins, staffRole }) {
      if (!this.hasStaffPermission('subadmin')) {
        throw new Error('Acceso denegado: se requiere rango de Jefe (superadmin) o Subjefe (subadmin).');
      }
      const q = String(targetEmailOrHandle || '').trim();
      if (!q) throw new Error('Indica el correo o @handle del usuario.');
      // La validación real del rango la hace el servidor (función admin_update_user).
      await supabaseRestRequest('rpc/admin_update_user', 'POST', {
        target: q,
        tier: (accountTier === undefined || accountTier === null) ? null : String(accountTier).toLowerCase().trim(),
        bonus: (bonusVideoMins === undefined || bonusVideoMins === null || isNaN(parseFloat(bonusVideoMins))) ? null : parseFloat(bonusVideoMins),
        staff: (staffRole === undefined) ? null : String(staffRole || '').toLowerCase().trim()
      });
      return { ok: true };
    },

    async adminFetchAllProfiles(limit = 100) {
      if (!this.hasStaffPermission('any')) throw new Error('Se requiere rango de Staff en Supabase.');
      const rows = await supabaseRestRequest(`profiles?select=*&order=updated_at.desc&limit=${limit}`, 'GET');
      return Array.isArray(rows) ? rows : [];
    },

    async adminDeleteCloudPost(postId) {
      if (!this.hasStaffPermission('any')) throw new Error('Se requiere permiso de Moderación o Admin.');
      const cleanId = String(postId || '').replace(/^sb_/, '');
      if (cleanId && !cleanId.startsWith('u_')) {
        await supabaseRestRequest(`posts?id=eq.${encodeURIComponent(cleanId)}`, 'DELETE');
      }
      try {
        const localSaved = JSON.parse(localStorage.getItem('kinet_saved_posts') || '[]');
        const filtered = localSaved.filter(p => String(p.id) !== String(postId) && String(p.id) !== cleanId);
        originalSetItem.call(localStorage, 'kinet_saved_posts', JSON.stringify(filtered));
      } catch (e) {}
      return { ok: true };
    },

    // Configuración pública de la app (anuncio, mantenimiento, interruptores). Se puede leer sin sesión.
    async fetchPublicConfig() {
      try { return await supabaseRestRequest('app_config?select=key,value,updated_at', 'GET'); } catch (e) { return null; }
    },

    // Estado de moderación de la cuenta propia (si falta el SQL 07, devuelve null y no pasa nada).
    async fetchOwnModeration() {
      try {
        if (!isStrictlyAuthenticatedUser()) return null;
        const uid = localStorage.getItem('kinet_user_id');
        if (!uid) return null;
        const rows = await supabaseRestRequest(`profiles?id=eq.${encodeURIComponent(uid)}&select=is_banned,ban_reason&limit=1`, 'GET');
        return (Array.isArray(rows) && rows[0]) || null;
      } catch (e) { return null; }
    },

    // Llamada genérica a una función de gestión del servidor (el servidor valida tu rango en cada llamada).
    async adminRpc(fn, args) {
      if (!/^[a-z_]+$/.test(String(fn || ''))) throw new Error('Función no válida');
      try {
        return await supabaseRestRequest('rpc/' + fn, 'POST', args || {});
      } catch (e) {
        let m = String((e && e.message) || e);
        const j = m.match(/\{.*\}/s);
        if (j) { try { const o = JSON.parse(j[0]); m = o.message || o.hint || m; } catch (x) {} }
        if (/Could not find the function|PGRST202|404/.test(m)) m = 'Falta ejecutar supabase/07_gestion.sql en Supabase.';
        throw new Error(m);
      }
    },

    async adminToggleBanUser(targetEmailOrHandle, isBanned = true, reason = 'Incumplimiento de normas de KINET Network') {
      if (!this.hasStaffPermission('any')) throw new Error('Se requiere permiso de Moderación o Admin.');
      const q = String(targetEmailOrHandle || '').trim();
      if (!q) throw new Error('Indica el correo o @handle del usuario.');
      await this.adminRpc('admin_set_ban', { p_target: q, p_banned: !!isBanned, p_reason: isBanned ? reason : null });
      return { ok: true, banned: isBanned, user: q };
    },

    async adminVerifyScoutOrClub(targetEmailOrHandle, isVerified = true) {
      if (!this.hasStaffPermission('any')) throw new Error('Se requiere permiso de Verificador o Admin.');
      const q = String(targetEmailOrHandle || '').trim();
      if (!q) throw new Error('Indica el correo o @handle del usuario.');
      await this.adminRpc('admin_set_verified', { p_target: q, p_verified: !!isVerified });
      return { ok: true, verified: isVerified, user: q };
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
      originalSetItem.call(localStorage, 'kinet_guest_session', 'true');
      originalSetItem.call(localStorage, 'kinet_mode', 'guest');
      originalSetItem.call(localStorage, 'kinet_account_tier', 'free');
      originalSetItem.call(localStorage, 'kinet_user_name', 'Atleta Invitado');
      originalSetItem.call(localStorage, 'kinet_social_handle', '@invitado_kinet');
    },

    async registerUser({ firstName, lastName, handle, email, phone, password, birthDate, fromSession, authUserId, consents }) {
      localStorage.removeItem('kinet_is_guest');
      localStorage.removeItem('kinet_guest_session');
      originalSetItem.call(localStorage, 'kinet_mode', 'pro');

      const fullName = `${firstName || ''} ${lastName || ''}`.trim() || 'Atleta KINET';
      const cleanHandle = (handle || '').startsWith('@') ? handle : `@${handle}`;
      const cleanEmail = (email || '').trim().toLowerCase();

      localStorage.removeItem('kinet_user_id');
      localStorage.removeItem('kinet_user_avatar');

      let userId = null;
      if (fromSession && authUserId) {
        userId = authUserId; // usuario ya autenticado por Google/OTP: no se crea contraseña
      } else {
        let authData = null;
        try {
          const meta = { full_name: fullName, handle: cleanHandle, phone: phone || '', birth_date: birthDate || '', consents: consents || null };
          const sbs = initSupabase();
          if (sbs && sbs.auth) {
            const r = await sbs.auth.signUp({ email: cleanEmail, password: password, options: { data: meta } });
            if (r.error) throw r.error;
            authData = r.data;
          } else {
            authData = await supabaseAuthRequest('signup', { email: cleanEmail, password: password, data: meta });
          }
        } catch (authErr) {
          throw new Error((authErr && authErr.message) || 'No se pudo crear la cuenta. Inténtalo de nuevo.');
        }
        userId = authData?.user?.id || authData?.id || null;
        if (!userId) throw new Error('No se pudo crear la cuenta (el servidor no devolvió usuario).');
      }

      if (consents) { try { originalSetItem.call(localStorage, 'kinet_consents', JSON.stringify(consents)); } catch (e) {} }
      originalSetItem.call(localStorage, 'kinet_user_id', userId);
      originalSetItem.call(localStorage, 'kinet_auth_session_token', 'auth_' + userId + '_' + Date.now());
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

      const newProfilePayload = {
        id: userId,
        email: cleanEmail,
        full_name: fullName,
        handle: cleanHandle,
        bio: '',
        active_role: localStorage.getItem('kinet_active_role') || 'athlete',
        active_sport: localStorage.getItem('kinet_sport') || 'Fútbol',
        position: localStorage.getItem('kinet_position') || 'Por asignar',
        category: localStorage.getItem('kinet_category') || 'Senior',
        club: localStorage.getItem('kinet_user_club') || 'Independiente',
        account_tier: 'free',
        user_state: collectAllKinetLocalState(),
        updated_at: new Date().toISOString()
      };

      try { await supabaseRestRequest('profiles', 'POST', newProfilePayload, true); } catch (e) { /* si Supabase exige confirmar el correo, el perfil lo crea el trigger del servidor */ }
      initialCloudPullFinished = true;
      return { ok: true, user: newProfilePayload };
    },

    async loginUser({ email, password }) {
      const cleanInput = (email || '').trim();
      const isHandleLogin = cleanInput.startsWith('@') || !cleanInput.includes('@');

      let foundProfile = null;
      let authedUserId = null;
      let lookupEmail = cleanInput;
      const sbc = (window.KinetBackend && window.KinetBackend.getClient) ? window.KinetBackend.getClient() : null;

      if (password) {
        if (isHandleLogin) {
          const hq = cleanInput.startsWith('@') ? cleanInput : `@${cleanInput}`;
          let hEmail = '';
          try { const r = await supabaseRestRequest('rpc/email_from_handle', 'POST', { h: hq }); hEmail = (typeof r === 'string') ? r : ''; } catch (e) {}
          if (!hEmail) {
            try {
              const hrows = await supabaseRestRequest(`profiles?handle=ilike.${encodeURIComponent(hq)}&select=email&limit=1`, 'GET');
              hEmail = (Array.isArray(hrows) && hrows[0] && hrows[0].email) ? hrows[0].email : '';
            } catch (e) {}
          }
          lookupEmail = hEmail;
          if (!lookupEmail) throw new Error('Usuario o contraseña incorrectos.');
        }
        let authData = null;
        try {
          if (sbc && sbc.auth) {
            const r = await sbc.auth.signInWithPassword({ email: lookupEmail.toLowerCase(), password: password });
            if (!r.error && r.data && r.data.user) authData = { user: r.data.user };
          } else {
            authData = await supabaseAuthRequest('token?grant_type=password', { email: lookupEmail.toLowerCase(), password: password });
          }
        } catch (e) {}
        if (!authData || !authData.user || !authData.user.id) throw new Error('Usuario o contraseña incorrectos.');
        authedUserId = authData.user.id;
      } else {
        let sess = null;
        try { const r = sbc && sbc.auth ? await sbc.auth.getSession() : null; sess = r && r.data && r.data.session; } catch (e) {}
        if (!sess || !sess.user) throw new Error('Verifica tu identidad con contraseña, código o Google para entrar.');
        authedUserId = sess.user.id;
        lookupEmail = (sess.user.email || '').toLowerCase();
      }
      // Si en este navegador había OTRA cuenta, se borra todo resto suyo antes de cargar la nueva (nunca se mezclan perfiles)
      try {
        const prevUid = localStorage.getItem('kinet_user_id');
        if (prevUid && prevUid !== authedUserId) {
          Object.keys(localStorage).forEach((k) => { if (k.startsWith('kinet_') && k !== 'kinet_device_id') originalRemoveItem.call(localStorage, k); });
        }
      } catch (e) {}
      originalSetItem.call(localStorage, 'kinet_user_id', authedUserId);
      try {
        const prow = await supabaseRestRequest(`profiles?id=eq.${authedUserId}&select=*&limit=1`, 'GET');
        if (Array.isArray(prow) && prow[0]) foundProfile = prow[0];
      } catch (e) {}
      if (!foundProfile && lookupEmail) {
        const erows = await supabaseRestRequest(`profiles?email=ilike.${encodeURIComponent(lookupEmail)}&select=*&order=updated_at.desc&limit=1`, 'GET');
        if (Array.isArray(erows) && erows[0]) foundProfile = erows[0];
      }

      if (foundProfile) {
        restoreCloudStateToLocal(foundProfile);
        initialCloudPullFinished = true;
        return { ok: true, user: foundProfile };
      }

      throw new Error('No hemos encontrado ninguna cuenta con ese correo o @usuario en KINET Cloud. Ve a "CREAR CUENTA" para registrarla.');
    },

    async updateProfileAvatar(fileOrDataUrl) {
      if (!isStrictlyAuthenticatedUser()) return { ok: false, skippedGuest: true };
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

    // ── @usuario: único y con cambio como máximo cada 30 días (el servidor lo vuelve a comprobar con 08_usuario.sql) ──
    HANDLE_RESERVED: ['@kinet', '@kinet_official', '@kinetos', '@admin', '@administrador', '@soporte', '@support', '@staff', '@moderacion', '@moderador', '@oficial', '@invitado_kinet'],
    HANDLE_COOLDOWN_DAYS: 30,
    handleCooldownInfo() {
      const raw = localStorage.getItem('kinet_handle_changed_at');
      const t = raw ? Date.parse(raw) : NaN;
      if (isNaN(t)) return { locked: false, daysLeft: 0, next: null };
      const next = t + this.HANDLE_COOLDOWN_DAYS * 86400000;
      const left = next - Date.now();
      return left > 0 ? { locked: true, daysLeft: Math.ceil(left / 86400000), next: new Date(next) } : { locked: false, daysLeft: 0, next: null };
    },
    async requestHandleChange(rawHandle, opts) {
      const apply = !(opts && opts.checkOnly);
      let h = String(rawHandle || '').trim().replace(/\s+/g, '');
      if (!h) return { ok: false, reason: 'empty', message: 'Escribe un @usuario.' };
      if (!h.startsWith('@')) h = '@' + h;
      const current = (localStorage.getItem('kinet_social_handle') || localStorage.getItem('kinet_username') || '').trim();
      if (current && current.toLowerCase() === h.toLowerCase()) return { ok: true, unchanged: true, handle: current };
      if (!/^@[a-zA-Z0-9_.]{3,20}$/.test(h)) return { ok: false, reason: 'format', message: 'El usuario debe tener entre 3 y 20 caracteres: letras, números, punto o guion bajo.' };
      if (this.HANDLE_RESERVED.includes(h.toLowerCase())) return { ok: false, reason: 'taken', message: 'Ese usuario está reservado. Elige otro.' };
      const cur = current.toLowerCase();
      const placeholder = !cur || cur.includes('invitado');
      const cd = this.handleCooldownInfo();
      if (!placeholder && cd.locked) {
        return { ok: false, reason: 'cooldown', daysLeft: cd.daysLeft, message: 'Solo puedes cambiar tu @usuario una vez cada 30 días. Podrás hacerlo de nuevo en ' + cd.daysLeft + (cd.daysLeft === 1 ? ' día.' : ' días.') };
      }
      try {
        const me = await resolveCurrentUserId();
        const esc = h.replace(/_/g, '\\_');
        const rows = await supabaseRestRequest('profiles?handle=ilike.' + encodeURIComponent(esc) + '&select=id,handle&limit=5', 'GET');
        const taken = Array.isArray(rows) && rows.some((r) => String(r.handle || '').toLowerCase() === h.toLowerCase() && String(r.id) !== String(me));
        if (taken) return { ok: false, reason: 'taken', message: 'Ese @usuario ya lo usa otra persona. Prueba con otro.' };
      } catch (e) { /* sin red: lo volverá a comprobar el servidor */ }
      if (apply) {
        originalSetItem.call(localStorage, 'kinet_social_handle', h);
        originalSetItem.call(localStorage, 'kinet_username', h);
        originalSetItem.call(localStorage, 'kinet_user_handle', h);
        if (!placeholder) originalSetItem.call(localStorage, 'kinet_handle_changed_at', new Date().toISOString());
      }
      return { ok: true, handle: h, changed: true };
    },

    // ── Publicación fijada (una sola). Se guarda en local (sincroniza entre dispositivos) y, si existe la columna, en el perfil público ──
    getPinnedPost() { return localStorage.getItem('kinet_pinned_post') || ''; },
    async setPinnedPost(postId) {
      if (postId) localStorage.setItem('kinet_pinned_post', String(postId)); else localStorage.removeItem('kinet_pinned_post');
      try {
        const uid = await resolveCurrentUserId();
        if (uid && isStrictlyAuthenticatedUser()) await supabaseRestRequest('profiles?id=eq.' + encodeURIComponent(uid), 'PATCH', { pinned_post_id: postId ? String(postId) : null });
      } catch (e) { /* aún sin la columna (08_usuario.sql): queda guardado solo en tus dispositivos */ }
    },
    async getPinnedPostFor(handle) {
      try {
        const esc = String(handle || '').replace(/_/g, '\\_');
        const rows = await supabaseRestRequest('profiles?handle=ilike.' + encodeURIComponent(esc) + '&select=handle,pinned_post_id&limit=5', 'GET');
        const r = Array.isArray(rows) && rows.find((x) => String(x.handle || '').toLowerCase() === String(handle || '').toLowerCase());
        return (r && r.pinned_post_id) || '';
      } catch (e) { return ''; }
    },

    async pushLocalStateToCloud() {
      try {
        if (!isStrictlyAuthenticatedUser()) {
          return { ok: false, skippedGuest: true };
        }

        const currentName = (localStorage.getItem('kinet_user_name') || '').trim();
        const currentHandle = (localStorage.getItem('kinet_social_handle') || localStorage.getItem('kinet_username') || '').trim();

        if (
          !currentName ||
          currentName.toUpperCase().includes('INVITADO') ||
          !currentHandle ||
          currentHandle.toLowerCase().includes('invitado')
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
        const base = getSyncBase();
        // Sin base de comparación y con perfil ya existente en la nube: antes hay que bajar la nube (si no, un dispositivo con datos viejos la pisaría)
        if (existingRow && !base) {
          await KinetBackend.pullCloudStateToLocal();
          if (!getSyncBase()) return { ok: false, needsPull: true };
          return KinetBackend.pushLocalStateToCloud();
        }
        const nowHashes = currentSyncHashes();
        const changed = [], removed = [];
        Object.keys(nowHashes).forEach((k) => { if (!base || base[k] !== nowHashes[k]) changed.push(k); });
        if (base) Object.keys(base).forEach((k) => { if (!(k in nowHashes)) removed.push(k); });
        if (existingRow && !changed.length && !removed.length) return { ok: true, noChange: true };
        const has = (...ks) => !existingRow || ks.some((k) => changed.includes(k));

        const safeMergedState = { ...cloudPrevState };
        changed.forEach((k) => {
          const val = localStorage.getItem(k);
          if (val !== null && val !== undefined && String(val).trim() !== '' && !String(val).includes('invitado_')) safeMergedState[k] = val;
        });
        removed.forEach((k) => { delete safeMergedState[k]; });
        safeMergedState.kinet_sync_writer = deviceId;

        // Color de acento: solo se toca si ESTE dispositivo lo cambió
        const themeTouched = changed.concat(removed).some((k) => k === 'kinet_theme_color_reset' || k === 'kinet_custom_accent_override' || k === 'kinet_accent_color');
        if (!existingRow || themeTouched) {
          if (localStorage.getItem('kinet_theme_color_reset') === 'true' || (!localStorage.getItem('kinet_custom_accent_override') && !localStorage.getItem('kinet_accent_color'))) {
            delete safeMergedState.kinet_custom_accent_override;
            delete safeMergedState.kinet_accent_color;
            safeMergedState.kinet_theme_color_reset = 'true';
          } else {
            delete safeMergedState.kinet_theme_color_reset;
          }
        }

        const payload = { id: userId, user_state: safeMergedState, updated_at: new Date().toISOString() };
        if (has('kinet_user_email') && (localStorage.getItem('kinet_user_email') || (existingRow && existingRow.email))) payload.email = localStorage.getItem('kinet_user_email') || existingRow.email;
        if (has('kinet_user_name')) payload.full_name = currentName;
        else if (!existingRow) payload.full_name = currentName;
        if (has('kinet_social_handle', 'kinet_username')) payload.handle = currentHandle;
        if (has('kinet_user_avatar')) payload.avatar_url = avatarData;
        if (has('kinet_social_bio')) payload.bio = localStorage.getItem('kinet_social_bio') || '';
        if (has('kinet_active_role', 'kinet_role')) payload.active_role = localStorage.getItem('kinet_active_role') || (existingRow && existingRow.active_role) || 'athlete';
        if (has('kinet_sport')) payload.active_sport = localStorage.getItem('kinet_sport') || (existingRow && existingRow.active_sport) || 'Fútbol';
        if (has('kinet_position')) payload.position = localStorage.getItem('kinet_position') || (existingRow && existingRow.position) || 'Por asignar';
        if (has('kinet_user_category', 'kinet_category')) payload.category = localStorage.getItem('kinet_user_category') || localStorage.getItem('kinet_category') || (existingRow && existingRow.category) || 'Senior';
        if (has('kinet_user_club')) payload.club = localStorage.getItem('kinet_user_club') || (existingRow && existingRow.club) || '';
        if (!existingRow) payload.account_tier = 'free';   // el plan real lo pone el servidor
        if (has('kinet_video_mins_used')) payload.video_mins_used = parseFloat(localStorage.getItem('kinet_video_mins_used') || '0');
        if (has('kinet_bonus_video_mins')) payload.bonus_video_mins = parseFloat(localStorage.getItem('kinet_bonus_video_mins') || '0');

        const saved = await supabaseRestRequest('profiles', 'POST', payload, true);
        // Actualizar la base solo con lo que se acaba de subir
        const nb = { ...(base || {}) };
        changed.forEach((k) => { nb[k] = nowHashes[k]; });
        removed.forEach((k) => { delete nb[k]; });
        setSyncBase(nb);
        const savedRow = Array.isArray(saved) && saved[0];
        originalSetItem.call(localStorage, 'kinet_sync_seen', (savedRow && savedRow.updated_at) || payload.updated_at);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err };
      }
    },

    async pullCloudStateToLocal() {
      try {
        if (!isStrictlyAuthenticatedUser()) {
          scrubHardcodedHtmlPlaceholdersForGuest();
          initialCloudPullFinished = true;
          return null;
        }

        await ensureSessionIdentity();
        const userId = await resolveCurrentUserId();
        if (!userId) {
          initialCloudPullFinished = true;
          return null;
        }

        const rows = await supabaseRestRequest(`profiles?id=eq.${userId}&select=*`, 'GET');
        if (Array.isArray(rows) && rows[0]) {
          const before = currentSyncHashes();
          restoreCloudStateToLocal(rows[0]);
          const after = currentSyncHashes();
          const keys = {}; Object.keys(before).concat(Object.keys(after)).forEach((k) => { keys[k] = 1; });
          lastPullChanged = Object.keys(keys).filter((k) => before[k] !== after[k] && !CHANGE_IGNORE[k]);
          lastPullWriter = (rows[0].user_state && rows[0].user_state.kinet_sync_writer) || null;
          initialCloudPullFinished = true;
          window.dispatchEvent(new CustomEvent('kinet:cloud-synced', { detail: rows[0] }));
          // Datos que solo existen en este dispositivo: se suben
          try { const b = getSyncBase() || {}; if (Object.keys(after).some((k) => !(k in b))) scheduleCloudSync(); } catch (e) {}
          return rows[0];
        }
      } catch (e) {}
      initialCloudPullFinished = true;
      return null;
    },

    async createCloudPost(postObj) {
      if (!isStrictlyAuthenticatedUser()) {
        return { ok: false, error: new Error('Los invitados no pueden publicar en la nube.') };
      }
      if (postObj && (postObj.mode === 'reel' || postObj.mode === 'reels' || postObj.isVideo || postObj.videoUrl) && !this.canUploadVideo()) {
        return {
          ok: false,
          proRequired: true,
          error: new Error('La subida de vídeos y KINET Shorts en alta definición es exclusiva para miembros KINET PRO / Club o con Bono de Vídeo activo.')
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
          author_headline: (postObj.headline && !/^Perfil Verificado KINET OS/i.test(postObj.headline)) ? postObj.headline : '',
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
      if (!isStrictlyAuthenticatedUser()) return { ok: false };
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
      if (!isStrictlyAuthenticatedUser()) return [];
      try {
        const rawHandle = (localStorage.getItem('kinet_social_handle') || localStorage.getItem('kinet_username') || '').trim();
        if (!rawHandle || rawHandle.includes('invitado')) return [];
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
      if (!isStrictlyAuthenticatedUser()) return { ok: false };
      try {
        const userId = await resolveCurrentUserId();
        const rawSender = localStorage.getItem('kinet_social_handle') || localStorage.getItem('kinet_username') || '@kinet_user';
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
      if (!isStrictlyAuthenticatedUser()) return { ok: false };
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
          if (document.hidden || !isStrictlyAuthenticatedUser()) return;
          const rawMy = (localStorage.getItem('kinet_social_handle') || localStorage.getItem('kinet_username') || '').trim();
          if (!rawMy || rawMy.includes('invitado')) return;
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
      if (isStrictlyAuthenticatedUser()) {
        await this.pushLocalStateToCloud();
      }
      try {
        const sb = initSupabase();
        if (sb && sb.auth) await sb.auth.signOut();
      } catch (e) {}
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('kinet_') || k.startsWith('sb-') || k.includes('supabase')) {
          localStorage.removeItem(k);
        }
      });
    }
  };

  window.KinetBackend = KinetBackend;
  // Ayuda visual junto al campo @usuario (cada 30 días y único)
  window.KinetHandleUI = {
    attach(inputId) {
      const el = document.getElementById(inputId);
      if (!el || KinetBackend.isGuest && KinetBackend.isGuest()) return;
      let n = document.getElementById(inputId + '-rule');
      if (!n) { n = document.createElement('div'); n.id = inputId + '-rule'; n.style.cssText = "font-family:'JetBrains Mono',monospace;font-size:.58rem;margin-top:5px;line-height:1.4;letter-spacing:.02em"; el.insertAdjacentElement('afterend', n); }
      const cd = KinetBackend.handleCooldownInfo();
      const cur = (localStorage.getItem('kinet_social_handle') || '').toLowerCase();
      const free = !cur || cur.includes('invitado');
      if (cd.locked && !free) {
        el.readOnly = true; el.dataset.kxLocked = '1'; el.style.opacity = '.6'; el.style.cursor = 'not-allowed';
        n.style.color = '#F59E0B'; n.textContent = '🔒 Podrás cambiar tu @usuario en ' + cd.daysLeft + (cd.daysLeft === 1 ? ' día' : ' días') + ' (' + cd.next.toLocaleDateString('es-ES') + ').';
      } else {
        if (el.dataset.kxLocked) { el.readOnly = false; el.style.opacity = ''; el.style.cursor = ''; }
        n.style.color = '#94A3B8'; n.textContent = 'Único en KINET · solo se puede cambiar una vez cada 30 días.';
      }
    },
    flash(inputId, msg) {
      const n = document.getElementById(inputId + '-rule'); const el = document.getElementById(inputId);
      if (n) { n.style.color = '#F87171'; n.textContent = '⚠ ' + msg; }
      if (el) { el.animate([{ translate: '0 0' }, { translate: '-6px 0' }, { translate: '6px 0' }, { translate: '-4px 0' }, { translate: '0 0' }], { duration: 320 }); el.focus(); }
    }
  };

  KinetBackend.pullCloudStateToLocal().then(() => {
    refreshDOMAvatarsAndProfileUI();
    applyGlobalSidebarEnhancements();
    KinetBackend.startRealtimeDMPolling(3500);
    if (lastPullChanged.length) onRemoteChanged('load');
  });

  // Sincronización en vivo: al volver a la app, al recuperar conexión y cada 20 s con la pestaña visible
  window.addEventListener('focus', () => {
    if (isStrictlyAuthenticatedUser()) {
      checkRemoteChange('resume');
    } else {
      scrubHardcodedHtmlPlaceholdersForGuest();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkRemoteChange('resume');
    } else if (isStrictlyAuthenticatedUser() && initialCloudPullFinished) {
      if (syncTimeout) { clearTimeout(syncTimeout); syncTimeout = null; }
      KinetBackend.pushLocalStateToCloud();
    }
  });
  window.addEventListener('pagehide', () => {
    if (isStrictlyAuthenticatedUser() && initialCloudPullFinished && syncTimeout) { clearTimeout(syncTimeout); syncTimeout = null; KinetBackend.pushLocalStateToCloud(); }
  });
  window.addEventListener('online', () => { checkRemoteChange('resume'); });
  setInterval(() => { if (!document.hidden) checkRemoteChange('poll'); }, 20000);

  // "Config. Red Social" se ve SIEMPRE. Si no hay cuenta (invitado), pulsarlo lleva a crear una: es el incentivo para registrarse.
  document.addEventListener('click', (ev) => {
    try {
      const a = ev.target && ev.target.closest && ev.target.closest('#nav-config-social, #drawer-config-social');
      if (!a || isStrictlyAuthenticatedUser()) return;
      ev.preventDefault(); ev.stopImmediatePropagation();
      location.href = 'login.html?mode=register&reason=social';
    } catch (e) {}
  }, true);

  document.addEventListener('DOMContentLoaded', () => {
    refreshDOMAvatarsAndProfileUI();
    applyGlobalSidebarEnhancements();
    scrubHardcodedHtmlPlaceholdersForGuest();
  });
})(window);

// =========================================================================
// INTERCEPTOR GLOBAL DE BOTONES "ENTRAR COMO INVITADO" EN INDEX.HTML, LOGIN.HTML Y FASE1.HTML
// =========================================================================
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a, button').forEach((btn) => {
    const txt = (btn.textContent || '').toUpperCase();
    if (txt.includes('ENTRAR COMO INVITADO') || txt.includes('MODO INVITADO')) {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.KinetBackend && typeof window.KinetBackend.resetAndStartCleanGuestSession === 'function') {
          await window.KinetBackend.resetAndStartCleanGuestSession();
        }
        window.location.href = 'fase1.html?guest=true';
      }, true);
    }
  });

  // Bloqueo de Comunidad para Invitados
  const pageKey = (window.location.pathname || '').toLowerCase();
  if (pageKey.includes('comunidad') && window.KinetBackend && window.KinetBackend.isGuest()) {
    const overlay = document.createElement('div');
    overlay.id = 'kinet-guest-social-lock';
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 2147483646;
      background: rgba(5, 7, 12, 0.94); backdrop-filter: blur(22px);
      display: flex; align-items: center; justify-content: center; padding: 20px;
    `;
    overlay.innerHTML = `
      <div style="max-width:440px;width:100%;background:#0B0F17;border:1.5px solid var(--role-color,#00FF88);border-radius:24px;padding:28px 24px;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,0.95),0 0 35px rgba(var(--role-rgb,0,255,136),0.22);">
        <div style="width:54px;height:54px;border-radius:16px;background:rgba(var(--role-rgb,0,255,136),0.14);border:1px solid var(--role-color,#00FF88);display:flex;align-items:center;justify-content:center;font-size:1.6rem;margin:0 auto 14px auto;">🔒</div>
        <h2 style="font-family:'Orbitron',sans-serif;font-weight:900;font-size:1.1rem;color:#FFF;margin-bottom:8px;">RED SOCIAL EXCLUSIVA PARA CUENTAS REGISTRADAS</h2>
        <p style="font-family:'Inter',sans-serif;font-size:0.8rem;color:#94A3B8;line-height:1.5;margin-bottom:20px;">
          Estás navegando en <strong>Modo Invitado</strong>. Para tener perfil público en KINET Network™, publicar en Pulse o usar Mensajes Directos, inicia sesión o crea tu cuenta gratuita.
        </p>
        <div style="display:flex;gap:10px;justify-content:center;">
          <a href="app.html" style="flex:1;padding:11px 14px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.14);color:#FFF;font-family:'Orbitron',sans-serif;font-size:0.7rem;font-weight:700;text-decoration:none;">← Volver a Vestuario</a>
          <a href="login.html" style="flex:1.2;padding:11px 14px;border-radius:12px;background:var(--role-gradient,linear-gradient(135deg,#00FF88,#00B359));color:#04060A;font-family:'Orbitron',sans-serif;font-size:0.7rem;font-weight:900;text-decoration:none;">Crear Cuenta / Login →</a>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }
});
