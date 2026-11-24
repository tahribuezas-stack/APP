/* =========================================================================
   KINET OS · Comportamiento móvil / PWA  (v42)
   - Cuerpo Técnico: el chat abierto ocupa toda la pantalla, menú ⋯ con las acciones, teclado bien gestionado.
   - Menú móvil: entrada "Gestión" para el equipo (super admin) y "Instalar KINET OS".
   - PWA: registra el service worker y gestiona la instalación (Android/Chrome: aviso nativo · iOS: guía "Añadir a inicio").
   No toca el escritorio (todo se activa solo en pantallas estrechas).
   ========================================================================= */
(function () {
  'use strict';
  if (window.__kxMobile) return; window.__kxMobile = true;

  var mqMobile = window.matchMedia ? window.matchMedia('(max-width: 960px)') : { matches: false, addEventListener: function () {} };
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function isStandalone() {
    try { return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; } catch (e) { return false; }
  }
  function isIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }

  if (isStandalone()) { try { document.documentElement.classList.add('kx-standalone'); } catch (e) {} }

  /* ───────────────────────── PWA: instalación ───────────────────────── */
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferredPrompt = e;
    try { document.dispatchEvent(new CustomEvent('kinet:install-ready')); } catch (x) {}
    refreshInstallLinks();
  });
  window.addEventListener('appinstalled', function () {
    deferredPrompt = null; try { localStorage.setItem('kinet_pwa_installed', '1'); } catch (e) {}
    refreshInstallLinks();
  });

  function sheet(html) {
    var old = document.getElementById('kx-install-sheet'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'kx-install-sheet';
    ov.style.cssText = 'position:fixed;inset:0;z-index:100010;display:flex;align-items:flex-end;justify-content:center;background:rgba(2,4,8,.72);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);font-family:Inter,system-ui,sans-serif';
    ov.innerHTML = '<div style="width:100%;max-width:520px;background:linear-gradient(180deg,#10151f,#090c13);border:1px solid rgba(var(--role-rgb,0,255,136),.45);border-bottom:0;border-radius:24px 24px 0 0;padding:14px 18px calc(20px + env(safe-area-inset-bottom,0px));color:#E2E8F0;box-shadow:0 -20px 60px rgba(0,0,0,.6);animation:kxSheetUp .35s cubic-bezier(.16,1,.3,1)">' +
      '<div style="width:38px;height:4px;border-radius:4px;background:rgba(255,255,255,.22);margin:0 auto 14px"></div>' + html + '</div>';
    var st = document.getElementById('kx-sheet-css');
    if (!st) { st = document.createElement('style'); st.id = 'kx-sheet-css'; st.textContent = '@keyframes kxSheetUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}'; document.head.appendChild(st); }
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
    var c = ov.querySelector('[data-close]'); if (c) c.onclick = function () { ov.remove(); };
    return ov;
  }
  function installApp() {
    if (isStandalone()) { sheet('<div style="font:800 .8rem Orbitron,sans-serif;color:var(--role-color,#00FF88);letter-spacing:.08em;margin-bottom:8px">YA ESTÁS EN LA APP</div><p style="font-size:.9rem;line-height:1.5;color:#CBD5E1">KINET OS ya está instalada en este dispositivo. 🎉</p><button data-close style="margin-top:14px;width:100%;min-height:46px;border-radius:14px;border:0;background:var(--role-gradient,#00FF88);color:#04060A;font-weight:800">Entendido</button>'); return; }
    if (deferredPrompt) {
      var p = deferredPrompt; deferredPrompt = null;
      try { p.prompt(); p.userChoice.then(function () { refreshInstallLinks(); }); } catch (e) {}
      return;
    }
    var steps = isIOS()
      ? ['Pulsa el botón <b>Compartir</b> <span style="font-size:1.1em">⬆️</span> de Safari (abajo en el centro).', 'Desliza y elige <b>«Añadir a pantalla de inicio»</b>.', 'Pulsa <b>Añadir</b>. Tendrás el icono de KINET OS como una app más.']
      : ['Abre el menú del navegador <b>⋮</b> (arriba a la derecha).', 'Elige <b>«Instalar aplicación»</b> o <b>«Añadir a pantalla de inicio»</b>.', 'Confirma. KINET OS aparecerá como una app con su propio icono.'];
    sheet('<div style="font:800 .8rem Orbitron,sans-serif;color:var(--role-color,#00FF88);letter-spacing:.08em;margin-bottom:6px">INSTALAR KINET OS</div>' +
      '<p style="font-size:.86rem;line-height:1.5;color:#94A3B8;margin-bottom:12px">Acceso directo en tu pantalla de inicio, a pantalla completa y sin barra del navegador.</p>' +
      '<ol style="margin:0 0 14px 18px;padding:0;font-size:.9rem;line-height:1.55;color:#E2E8F0">' + steps.map(function (s) { return '<li style="margin-bottom:6px">' + s + '</li>'; }).join('') + '</ol>' +
      '<button data-close style="width:100%;min-height:46px;border-radius:14px;border:0;background:var(--role-gradient,#00FF88);color:#04060A;font-weight:800">Entendido</button>');
  }
  window.KinetInstall = { prompt: installApp, canPrompt: function () { return !!deferredPrompt; }, isStandalone: isStandalone };

  /* ───────────────────────── Menú móvil: Gestión + Instalar ───────────────────────── */
  var ROW = 'display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:14px;font-weight:600;text-decoration:none;';
  function staffRole() { var r = String(ls('kinet_staff_admin_role') || '').toLowerCase().trim(); return /^(superadmin|admin|subadmin|moderator|scout_verifier|marketing)$/.test(r) ? r : ''; }
  function enhanceDrawer() {
    var d = document.getElementById('mobile-menu-drawer'); if (!d) return;
    var any = d.querySelector('a[id^="drawer-"]'); var list = any && any.parentElement; if (!list) return;
    list.classList.add('kx-drawer-list');

    var r = staffRole(), adm = document.getElementById('kx-drawer-admin');
    if (r && !adm) {
      adm = document.createElement('a'); adm.id = 'kx-drawer-admin'; adm.className = 'kx-admin-link'; adm.setAttribute('href', 'gestion.html');
      adm.style.cssText = ROW + 'background:rgba(var(--role-rgb),.09);border:1px solid rgba(var(--role-rgb),.55);color:var(--role-color);';
      adm.innerHTML = '<span>🛡️ Gestión (' + (r === 'superadmin' ? 'Jefe' : r === 'admin' ? 'Admin' : 'Equipo') + ')</span><span>→</span>';
      adm.addEventListener('click', function (e) { e.preventDefault(); try { localStorage.setItem('kinet_ui_mode', 'gestion'); } catch (x) {} location.href = 'gestion.html#' + (ls('kinet_last_gestion') || 'resumen'); });
      var up = document.getElementById('drawer-upgrade-pro');
      if (up) list.insertBefore(adm, up); else list.appendChild(adm);
    } else if (!r && adm) adm.remove();

    if (!document.getElementById('kx-drawer-install')) {
      var ins = document.createElement('a'); ins.id = 'kx-drawer-install'; ins.className = 'kx-install-link'; ins.setAttribute('href', '#');
      ins.style.cssText = ROW + 'background:rgba(255,255,255,.02);border:1px dashed rgba(255,255,255,.2);color:#F8FAFC;';
      ins.innerHTML = '<span>📲 Instalar la app</span><span>→</span>';
      ins.addEventListener('click', function (e) { e.preventDefault(); var dr = document.getElementById('mobile-menu-drawer'); try { if (dr) dr.style.transform = 'translateY(-100%)'; } catch (x) {} setTimeout(installApp, 120); });
      list.appendChild(ins);
    }
    refreshInstallLinks();
  }
  function refreshInstallLinks() { var el = document.getElementById('kx-drawer-install'); if (el) el.style.display = isStandalone() ? 'none' : ''; }

  /* ───────────────────────── Cuerpo Técnico: chat a pantalla completa ───────────────────────── */
  function setupChat() {
    var wrap = document.getElementById('chat-wrapper'); if (!wrap) return;
    var header = wrap.querySelector('.chat-header-bar');

    // Botón ⋯ con las acciones (Motor IA, plantilla, PDF…)
    if (header && !header.querySelector('.kx-chat-more')) {
      var more = document.createElement('button'); more.type = 'button'; more.className = 'kx-chat-more'; more.setAttribute('aria-label', 'Más acciones'); more.textContent = '⋯';
      more.addEventListener('click', function (e) { e.stopPropagation(); header.classList.toggle('kx-actions-open'); });
      header.insertBefore(more, header.lastElementChild);
      document.addEventListener('click', function (e) {
        if (!header.classList.contains('kx-actions-open')) return;
        if (e.target.closest('.btn-pdf-chat') || !e.target.closest('.chat-header-bar')) header.classList.remove('kx-actions-open');
      });
    }

    var input = document.getElementById('chat-user-input');
    var fullPh = input ? input.getAttribute('placeholder') : '';
    function sync() {
      var open = mqMobile.matches && window.innerWidth <= 850 && wrap.classList.contains('mobile-chat-active');
      document.body.classList.toggle('kx-chat-open', open);
      if (header && !open) header.classList.remove('kx-actions-open');
      if (input) input.setAttribute('placeholder', (window.innerWidth <= 850) ? 'Escribe tu mensaje…' : fullPh);
      if (open) { var box = document.getElementById('chat-messages-box'); if (box) setTimeout(function () { box.scrollTop = box.scrollHeight; }, 60); }
      fitViewport();
    }
    new MutationObserver(sync).observe(wrap, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('resize', sync);
    sync();

    // El teclado del móvil no debe tapar la caja de escritura: se ajusta a la altura visible real
    function fitViewport() {
      var vv = window.visualViewport, root = document.documentElement;
      if (!vv || !document.body.classList.contains('kx-chat-open')) { root.style.removeProperty('--kx-vv-h'); root.style.removeProperty('--kx-vv-top'); return; }
      root.style.setProperty('--kx-vv-h', Math.round(vv.height) + 'px');
      root.style.setProperty('--kx-vv-top', Math.round(vv.offsetTop) + 'px');
      var box = document.getElementById('chat-messages-box'); if (box && document.activeElement === input) box.scrollTop = box.scrollHeight;
    }
    if (window.visualViewport) { visualViewport.addEventListener('resize', fitViewport); visualViewport.addEventListener('scroll', fitViewport); }
    if (input) input.addEventListener('focus', function () { setTimeout(function () { window.scrollTo(0, 0); fitViewport(); }, 250); });

    // Botón "atrás" del móvil: cierra el chat y vuelve a la lista (en vez de salir de la página)
    var pushed = false;
    new MutationObserver(function () {
      var open = wrap.classList.contains('mobile-chat-active') && window.innerWidth <= 850;
      if (open && !pushed) { try { history.pushState({ kxChat: 1 }, ''); pushed = true; } catch (e) {} }
      if (!open) pushed = false;
    }).observe(wrap, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('popstate', function () {
      if (wrap.classList.contains('mobile-chat-active') && window.innerWidth <= 850) { try { backToChatList(); } catch (e) { wrap.classList.remove('mobile-chat-active'); } pushed = false; }
    });
  }

  /* ───────────────────────── PWA: service worker ───────────────────────── */
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    if (!/^https?:$/.test(location.protocol)) return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  /* La pastilla de IA se esconde al bajar y reaparece al subir o al parar de hacer scroll */
  function pillAutoHide() {
    var last = 0, t = null, root = document.documentElement;
    function y(e) { var el = e && e.target; return (el && el !== document && el.scrollTop !== undefined) ? el.scrollTop : (window.pageYOffset || 0); }
    document.addEventListener('scroll', function (e) {
      if (!mqMobile.matches) return;
      var cur = y(e), d = cur - last; last = cur;
      if (d > 6 && cur > 80) root.classList.add('kx-pill-hide'); else if (d < -6) root.classList.remove('kx-pill-hide');
      clearTimeout(t); t = setTimeout(function () { root.classList.remove('kx-pill-hide'); }, 1100);
    }, { passive: true, capture: true });
  }

  function boot() { pillAutoHide(); enhanceDrawer(); setupChat(); window.addEventListener('kinet:tier-synced', enhanceDrawer); window.addEventListener('kinet:cloud-synced', enhanceDrawer); setTimeout(enhanceDrawer, 1500); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  registerSW();
})();
