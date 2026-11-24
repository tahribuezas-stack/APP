/* KINET OS · Gestión (capa compartida)
   1) Conmutador APP / GESTIÓN en el menú izquierdo (solo cuentas de equipo) con giro animado de iconos.
   2) Configuración remota pública: anuncio, modo mantenimiento e interruptores (flags) que se regulan desde el panel.
   3) Aviso de cuenta suspendida.
   Los permisos reales los valida SIEMPRE el servidor (supabase/07_gestion.sql); aquí solo se decide qué se muestra. */
(function () {
  'use strict';
  if (window.KinetGestion) return;

  var reduce = false;
  try { reduce = localStorage.getItem('kinet_fx_motion') === 'system' && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ───────── Secciones del panel y qué rango ve cada una ───────── */
  var SECTIONS = [
    { id: 'resumen',      icon: '📊', label: 'Panel general',        tag: 'HOY',  roles: ['all'] },
    { id: 'usuarios',     icon: '👥', label: 'Usuarios',             roles: ['subadmin', 'moderator', 'scout_verifier'] },
    { id: 'planes',       icon: '💳', label: 'Planes y minutos',     roles: ['subadmin'] },
    { id: 'moderacion',   icon: '🛡️', label: 'Moderación',           roles: ['subadmin', 'moderator'] },
    { id: 'soporte',      icon: '🎧', label: 'Soporte',              roles: ['subadmin', 'moderator'] },
    { id: 'verificacion', icon: '✅', label: 'Verificación B2B',     roles: ['subadmin', 'scout_verifier'] },
    { id: 'marketing',    icon: '📣', label: 'Marketing',            roles: ['subadmin', 'marketing'] },
    { id: 'ia',           icon: '🧠', label: 'IA y costes',          roles: ['subadmin'] },
    { id: 'video',        icon: '🎬', label: 'Vídeo y almacenaje',   roles: ['subadmin'] },
    { id: 'config',       icon: '🎛️', label: 'Regulación de la app', roles: ['subadmin'] },
    { id: 'equipo',       icon: '🧑‍💼', label: 'Equipo y rangos',      roles: ['subadmin'] },
    { id: 'auditoria',    icon: '🧾', label: 'Auditoría',            roles: ['subadmin'] },
    { id: 'salud',        icon: '🩺', label: 'Estado del sistema',   roles: ['subadmin'] },
    { id: 'pruebas',      icon: '🧪', label: 'Pruebas (Modo Dios)',  roles: ['subadmin'] }
  ];
  var APP_LINKS = [
    { href: 'app.html', icon: '⚡', label: 'Vestuario', tag: 'HOY' },
    { href: 'cuerpo-tecnico.html', icon: '🧠', label: 'Cuerpo Técnico IA' },
    { href: 'ficha-pro.html', icon: '🎴', label: 'Ficha & KINET Card' },
    { href: 'ojeador-live.html', icon: '🎬', label: 'Laboratorio Vídeo' },
    { href: 'analizador.html', icon: '🏟️', label: 'Analizador & Pizarra 3D' },
    { href: 'comunidad.html', icon: '🌐', label: 'Comunidad / Red Social' },
    { href: 'media-studio.html', icon: '🎵', label: 'KINET Media Studio™' }
  ];
  var ROLE_NAMES = {
    superadmin: 'Jefe (superadmin)', admin: 'Administrador', subadmin: 'Dirección (subadmin)',
    moderator: 'Moderación', scout_verifier: 'Verificación B2B', marketing: 'Marketing'
  };
  var VALID = ['superadmin', 'admin', 'subadmin', 'moderator', 'scout_verifier', 'marketing'];

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function role() {
    var r = String(lsGet('kinet_staff_admin_role') || '').toLowerCase().trim();
    return VALID.indexOf(r) >= 0 ? r : null;
  }
  function canSee(r, sec) {
    if (!r) return false;
    if (r === 'superadmin' || r === 'admin') return true;
    return sec.roles.indexOf('all') >= 0 || sec.roles.indexOf(r) >= 0;
  }
  function sectionsFor(r) { return SECTIONS.filter(function (s) { return canSee(r, s); }); }
  function mode() { return lsGet('kinet_ui_mode') === 'gestion' ? 'gestion' : 'app'; }
  function onGestionPage() { return /(^|\/)gestion\.html$/.test(location.pathname); }

  /* ───────── Estilos del conmutador ───────── */
  function injectCss() {
    if (document.getElementById('kg-css')) return;
    var st = document.createElement('style'); st.id = 'kg-css';
    st.textContent = [
      '.kg-switch{position:relative;display:grid;grid-template-columns:1fr 1fr;margin:6px 0 4px;padding:3px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid var(--border-subtle,rgba(255,255,255,.08));flex-shrink:0;isolation:isolate}',
      '.kg-switch button{position:relative;z-index:1;border:0;background:transparent;color:var(--text-secondary,#94A3B8);font:800 .66rem/1 "JetBrains Mono",monospace;letter-spacing:.16em;padding:10px 0;border-radius:11px;cursor:pointer;transition:color .3s ease}',
      '.kg-switch button.on{color:#04060A}',
      '.kg-switch .kg-thumb{position:absolute;z-index:0;top:3px;bottom:3px;left:3px;width:calc(50% - 3px);border-radius:11px;background:var(--role-gradient,linear-gradient(135deg,#00FF88,#00B359));box-shadow:0 0 18px var(--role-glow,rgba(0,255,136,.4));transition:transform .5s cubic-bezier(.65,0,.2,1)}',
      '.kg-switch[data-mode="gestion"] .kg-thumb{transform:translateX(100%)}',
      '.kg-flip{display:inline-block;transform-origin:50% 50%;backface-visibility:hidden}',
      '.kg-rolechip{font:700 .54rem/1 "JetBrains Mono",monospace;letter-spacing:.18em;color:var(--role-color,#00FF88);text-transform:uppercase;margin:0 0 6px 4px;opacity:.85}',
      /* anuncio */
      '.kg-ann{position:fixed;left:50%;bottom:22px;transform:translate(-50%,160%);z-index:99990;display:flex;gap:12px;align-items:center;max-width:min(720px,92vw);padding:10px 14px 10px 16px;border-radius:14px;background:rgba(8,12,20,.94);border:1px solid var(--role-color,#00FF88);color:#E2E8F0;font:600 12.5px/1.4 Inter,system-ui,sans-serif;box-shadow:0 10px 40px rgba(0,0,0,.6),0 0 26px rgba(var(--role-rgb,0,255,136),.18);backdrop-filter:blur(14px);transition:transform .7s cubic-bezier(.16,1,.3,1)}',
      '.kg-ann.in{transform:translate(-50%,0)}','@media(max-width:960px){.kg-ann{bottom:96px}}',
      '.kg-ann.warn{border-color:#F59E0B}.kg-ann.promo{border-color:#A855F7}',
      '.kg-ann a{color:var(--role-color,#00FF88);font-weight:800;text-decoration:none;white-space:nowrap}',
      '.kg-ann button{background:none;border:0;color:#94A3B8;font-size:15px;cursor:pointer;padding:2px 4px}',
      /* mantenimiento y suspensión */
      '.kg-wall{position:fixed;inset:0;z-index:99995;display:flex;align-items:center;justify-content:center;padding:24px;background:radial-gradient(circle at 50% 0,rgba(var(--role-rgb,0,255,136),.14),transparent 60%),#04060A;color:#E2E8F0;font-family:Inter,system-ui,sans-serif;text-align:center}',
      '.kg-wall .box{max-width:460px}.kg-wall h2{font:900 1.3rem Orbitron,sans-serif;margin:14px 0 8px;color:#fff}.kg-wall p{color:#94A3B8;line-height:1.55;font-size:.92rem}',
      '.kg-wall .mark{width:58px;height:58px;border-radius:18px;margin:0 auto;display:flex;align-items:center;justify-content:center;font:900 1.6rem Orbitron,sans-serif;color:#04060A;background:var(--role-gradient,linear-gradient(135deg,#00FF88,#00B359));box-shadow:0 0 30px var(--role-glow,rgba(0,255,136,.4))}',
      '.kg-wall a,.kg-wall button{display:inline-block;margin-top:18px;padding:11px 18px;border-radius:12px;border:1px solid var(--role-color,#00FF88);background:transparent;color:var(--role-color,#00FF88);font:800 .8rem Inter,sans-serif;cursor:pointer;text-decoration:none}'
    ].join('');
    document.head.appendChild(st);
  }

  /* ───────── Conmutador APP / GESTIÓN ───────── */
  function navItemHtml(it, active) {
    return '<a href="' + esc(it.href) + '" class="side-link' + (active ? ' active' : '') + '" data-kg="1">' +
      '<span class="side-link-left"><span class="kg-ic"><span class="kg-flip">' + it.icon + '</span></span> <span>' + esc(it.label) + '</span></span>' +
      (it.tag ? '<span style="font-size:0.65rem;font-family:\'JetBrains Mono\',monospace;">' + esc(it.tag) + '</span>' : '<span style="font-size:0.7rem;opacity:0.5;">→</span>') + '</a>';
  }
  function gestionItems(r) {
    return sectionsFor(r).map(function (s) { return { href: 'gestion.html#' + s.id, icon: s.icon, label: s.label, tag: s.tag, id: s.id }; });
  }
  function currentSectionId() { return (location.hash || '').replace('#', '') || 'resumen'; }

  function nav2(u) { try { if (window.KinetFX && KinetFX.go) { KinetFX.go(u); return; } } catch (e) {} location.href = u; }
  var originalNavHtml = null;
  function flipSwap(nav, html, afterIn) {
    var icons = [].slice.call(nav.querySelectorAll('.kg-flip, .side-link-left > span:first-child'));
    if (reduce || !nav.animate) { nav.innerHTML = html; if (afterIn) afterIn(); return; }
    var out = 0;
    icons.forEach(function (ic, i) {
      ic.style.display = 'inline-block';
      ic.animate([{ transform: 'rotateY(0deg) scale(1)', opacity: 1 }, { transform: 'rotateY(90deg) scale(.7)', opacity: 0 }],
        { duration: 220, delay: i * 38, easing: 'cubic-bezier(.55,0,.8,.4)', fill: 'forwards' });
      out = Math.max(out, 220 + i * 38);
    });
    [].slice.call(nav.querySelectorAll('.side-link')).forEach(function (l, i) {
      l.animate([{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: 'translateX(-10px)' }], { duration: 200, delay: i * 30, easing: 'ease-in', fill: 'forwards' });
    });
    setTimeout(function () {
      nav.innerHTML = html;
      [].slice.call(nav.querySelectorAll('.side-link')).forEach(function (l, i) {
        l.animate([{ opacity: 0, transform: 'translateX(12px)' }, { opacity: 1, transform: 'translateX(0)' }], { duration: 340, delay: i * 34, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
        var f = l.querySelector('.kg-flip');
        if (f) f.animate([{ transform: 'rotateY(-90deg) scale(.7)', opacity: 0 }, { transform: 'rotateY(0deg) scale(1)', opacity: 1 }], { duration: 420, delay: 60 + i * 38, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
      });
      if (afterIn) setTimeout(afterIn, 520 + icons.length * 38);
    }, out + 40);
  }

  function buildSwitch(host, nav, r) {
    if (host.querySelector('.kg-switch')) return;
    var m = onGestionPage() ? 'gestion' : 'app';
    var wrap = document.createElement('div');
    wrap.innerHTML = '<div class="kg-rolechip">Equipo · ' + esc((ROLE_NAMES[r] || r)) + '</div>' +
      '<div class="kg-switch" data-mode="' + m + '" role="tablist" aria-label="Cambiar entre la app y la gestión"><span class="kg-thumb"></span>' +
      '<button type="button" role="tab" data-m="app" class="' + (m === 'app' ? 'on' : '') + '">APP</button>' +
      '<button type="button" role="tab" data-m="gestion" class="' + (m === 'gestion' ? 'on' : '') + '">GESTIÓN</button></div>';
    var chip = wrap.firstChild, sw = wrap.lastChild;
    host.insertBefore(sw, nav); host.insertBefore(chip, sw);
    sw.addEventListener('click', function (ev) {
      var b = ev.target.closest('button[data-m]'); if (!b) return;
      var to = b.getAttribute('data-m'); if (to === sw.getAttribute('data-mode')) return;
      sw.setAttribute('data-mode', to);
      [].forEach.call(sw.querySelectorAll('button'), function (x) { x.classList.toggle('on', x === b); });
      lsSet('kinet_ui_mode', to);
      if (to === 'gestion') {
        if (onGestionPage()) { flipSwap(nav, gestionItems(r).map(function (it) { return navItemHtml(it, it.id === currentSectionId()); }).join('')); return; }
        flipSwap(nav, gestionItems(r).map(function (it) { return navItemHtml(it, it.id === 'resumen'); }).join(''), function () { nav2('gestion.html#' + (lsGet('kinet_last_gestion') || 'resumen')); });
      } else {
        var last = sessionStorage.getItem('kinet_last_app') || 'app.html';
        var html = APP_LINKS.map(function (it) { return navItemHtml(it, last.indexOf(it.href) === 0); }).join('');
        flipSwap(nav, html, function () { nav2(last); });
      }
    });
  }

  function setupSidebar() {
    var r = role(); if (!r) return;
    var side = document.querySelector('.os-sidebar'); if (!side) return;
    var host = side.querySelector('.sidebar-top-section'); var nav = side.querySelector('.sidebar-nav');
    if (!host || !nav) return;
    injectCss();
    if (!onGestionPage()) { try { sessionStorage.setItem('kinet_last_app', location.pathname.split('/').pop() + location.search); } catch (e) {} }
    buildSwitch(host, nav, r);
    if (onGestionPage()) {
      // La propia página de gestión pinta su menú (lo hace gestion.html con KinetGestion.renderNav)
    }
  }

  /* ───────── Configuración remota ───────── */
  var CONFIG = { announcement: null, maintenance: null, flags: {} };
  function applyFlags() {
    window.KINET_FLAGS = CONFIG.flags || {};
    try {
      var d = document.documentElement;
      Object.keys(window.KINET_FLAGS).forEach(function (k) { if (/^[a-z0-9_]+$/.test(k)) d.setAttribute('data-flag-' + k.replace(/_/g, '-'), window.KINET_FLAGS[k] ? 'on' : 'off'); });
    } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('kinet:flags', { detail: window.KINET_FLAGS })); } catch (e) {}
  }
  function hashOf(s) { var h = 0; s = String(s || ''); for (var i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return String(h >>> 0); }
  function showAnnouncement(a) {
    try {
      if (!a || !a.enabled || !String(a.text || '').trim()) return;
      if (a.until && Date.parse(a.until) && Date.parse(a.until) < Date.now()) return;
      var aud = a.audience || 'all', tier = String(lsGet('kinet_account_tier') || 'free').toLowerCase();
      if (aud !== 'all' && aud !== tier && !(aud === 'paid' && (tier === 'pro' || tier === 'club'))) return;
      var key = 'kinet_ann_dismissed_' + hashOf(a.text + '|' + (a.link || ''));
      if (lsGet(key)) return;
      if (document.getElementById('kg-ann') || !document.body) return;
      injectCss();
      var el = document.createElement('div'); el.id = 'kg-ann'; el.className = 'kg-ann ' + (a.level === 'warn' ? 'warn' : a.level === 'promo' ? 'promo' : '');
      el.setAttribute('role', 'status');
      var link = a.link && /^(https?:\/\/|[a-z0-9_\-]+\.html)/i.test(a.link) ? '<a href="' + esc(a.link) + '">Ver →</a>' : '';
      el.innerHTML = '<span>' + (a.level === 'warn' ? '⚠️' : a.level === 'promo' ? '✨' : '📣') + '</span><span>' + esc(a.text) + '</span>' + link + '<button type="button" aria-label="Cerrar">✕</button>';
      el.querySelector('button').onclick = function () { lsSet(key, '1'); el.classList.remove('in'); setTimeout(function () { el.remove(); }, 700); };
      document.body.appendChild(el);
      setTimeout(function () { el.classList.add('in'); }, 600);
    } catch (e) {}
  }
  function showMaintenance(m) {
    try {
      if (!m || !m.enabled) return;
      if (role() || onGestionPage() || /(^|\/)(login|estado|legal|soporte)\.html$/.test(location.pathname) || /[?&]staff=1/.test(location.search)) return;
      if (document.getElementById('kg-maint') || !document.body) return;
      injectCss();
      var w = document.createElement('div'); w.id = 'kg-maint'; w.className = 'kg-wall';
      w.innerHTML = '<div class="box"><div class="mark">K</div><h2>Mantenimiento</h2><p>' + esc(m.message || 'Estamos mejorando KINET OS. Vuelve en unos minutos.') + '</p><a href="soporte.html">Contactar con soporte</a></div>';
      document.body.appendChild(w);
    } catch (e) {}
  }
  function showBanned(reason) {
    try {
      if (role() || document.getElementById('kg-ban') || !document.body) return;
      injectCss();
      var w = document.createElement('div'); w.id = 'kg-ban'; w.className = 'kg-wall';
      w.innerHTML = '<div class="box"><div class="mark">K</div><h2>Cuenta suspendida</h2><p>' + esc(reason || 'Tu cuenta está suspendida por incumplir las normas de KINET OS.') + '</p><p>Si crees que es un error, escríbenos desde soporte.</p><a href="soporte.html">Contactar con soporte</a> <button type="button" id="kg-ban-out">Cerrar sesión</button></div>';
      document.body.appendChild(w);
      document.getElementById('kg-ban-out').onclick = function () {
        try { var c = window.KinetBackend && KinetBackend.getClient && KinetBackend.getClient(); if (c && c.auth) c.auth.signOut(); } catch (e) {}
        try { localStorage.removeItem('kinet_logged_in'); localStorage.removeItem('kinet_auth_session_token'); } catch (e) {}
        location.href = 'login.html';
      };
    } catch (e) {}
  }

  async function loadConfig(force) {
    try {
      if (!window.KinetBackend || !KinetBackend.fetchPublicConfig) return;
      var cached = null;
      try { cached = JSON.parse(sessionStorage.getItem('kinet_cfg_cache') || 'null'); } catch (e) {}
      if (!force && cached && Date.now() - cached.t < 60000) { CONFIG = cached.c; }
      else {
        var rows = await KinetBackend.fetchPublicConfig();
        if (Array.isArray(rows)) {
          var c = { announcement: null, maintenance: null, flags: {} };
          rows.forEach(function (r) { if (r && r.key in c) c[r.key] = r.value; });
          CONFIG = c;
          try { sessionStorage.setItem('kinet_cfg_cache', JSON.stringify({ t: Date.now(), c: c })); } catch (e) {}
        }
      }
      applyFlags(); showAnnouncement(CONFIG.announcement); showMaintenance(CONFIG.maintenance);
    } catch (e) {}
  }
  async function checkBanned() {
    try {
      if (!window.KinetBackend || !KinetBackend.fetchOwnModeration) return;
      var m = await KinetBackend.fetchOwnModeration();
      if (m && m.is_banned) showBanned(m.ban_reason);
    } catch (e) {}
  }

  function boot() {
    setupSidebar();
    window.addEventListener('kinet:tier-synced', setupSidebar);
    window.addEventListener('kinet:cloud-synced', setupSidebar);
    setTimeout(function () { loadConfig(false); checkBanned(); }, 1100);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.KinetGestion = {
    SECTIONS: SECTIONS, APP_LINKS: APP_LINKS, ROLE_NAMES: ROLE_NAMES, role: role, canSee: canSee, sectionsFor: sectionsFor, mode: mode,
    gestionItems: gestionItems, navItemHtml: navItemHtml, flipSwap: flipSwap, injectCss: injectCss, esc: esc,
    reloadConfig: function () { return loadConfig(true); },
    flag: function (name, def) { var f = window.KINET_FLAGS || {}; return name in f ? !!f[name] : !!def; },
    config: function () { return CONFIG; }
  };
})();
