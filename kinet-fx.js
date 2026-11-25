/* KINET OS · capa de movimiento compartida (v22)
   1) Entrada a la app: logo que se forma y la pantalla "se derrite" revelando la interfaz, que se reconstruye pieza a pieza.
   2) Transición entre páginas: la cortina cae como goteo oscuro y, al llegar, se derrite hacia abajo.
   3) Reconstrucción al cambiar de pestaña o modo dentro de una página (Gestionar plantilla, Jugadas, ajustes…).
   4) Cursor propio, pulso al hacer clic, barra de avance, grano fino y botones magnéticos.
   Todo es opcional: sin JS, con "respetar reducir movimiento" activado o si algo falla, la app se ve y funciona igual que antes. */
(function () {
  'use strict';
  if (window.KinetFX) return;
  var doc = document.documentElement;
  var reduce = false, fine = false;
  var sysReduce = false;
  try { sysReduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  /* Por defecto las animaciones se ven SIEMPRE (muchos Windows traen "reducir movimiento" activado sin que su dueño lo sepa y eso apagaba todo).
     Quien lo necesite puede elegir en Despacho › Efectos "Respetar la preferencia de mi sistema": entonces sí se desactiva el movimiento. */
  var respectSys = false; try { respectSys = localStorage.getItem('kinet_fx_motion') === 'system'; } catch (e) {}
  reduce = respectSys && sysReduce;
  if (reduce) document.documentElement.classList.add('kx-reduce');
  try { fine = matchMedia('(hover: hover) and (pointer: fine)').matches; } catch (e) {}
  var wide = innerWidth >= 900;
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) {} return null; }
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  var path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var SHELL = /^(app|cuerpo-tecnico|ficha-pro|ojeador-live|analizador|comunidad|media-studio|despacho|perfil|gestion|estado|movil)\.html$/.test(path);
  // El marco de luz que recorre el cuadro de contenido es solo de la app (no de portada, soporte, onboarding, login, legal…)
  var FRAME = /^(app|cuerpo-tecnico|ficha-pro|ojeador-live|analizador|analizador2|analizador3|comunidad|media-studio|despacho|perfil|gestion|tutorial)\.html$/.test(path);
  var NAV_FROM = ss('kx_nav_from');   // se lee antes de que el menú lo consuma: dice desde qué opción venimos (avanzar o retroceder)
  if ((SHELL || FRAME) && path !== 'gestion.html') doc.classList.add('kx-cards');   // los cuadros se mueven igual que en Gestión
  var NOFX_PAGES = false;   // (estado.html ya usa los efectos: intro, barra LED y cuadros)
  if (NOFX_PAGES) { window.KinetFX = { rebuild: function () {}, go: function (u) { location.href = u; } }; return; }

  /* ───────── decisión temprana: ¿empezamos tapados? (antes del primer pintado, sin parpadeo) ───────── */
  var navAt = parseInt(ss('kx_cover') || '0', 10);
  var fromNav = navAt && (Date.now() - navAt) < 5000;
  var introMode = ls('kinet_fx_intro') || 'full';     // full | off
  var NOMELT = /^soporte\.html$/.test(path);   // estas páginas usan el salto espacial de la órbita (space.js), no el derretido
  var transOn = ls('kinet_fx_transitions') !== 'off' && !NOMELT;
  var needIntro = SHELL && !reduce && introMode !== 'off' && ls('kinet_logged_in') === 'true' && !ss('kx_intro');
  var softAt = parseInt(ss('kx_soft') || '0', 10);
  var softIn = !reduce && SHELL && transOn && softAt && (Date.now() - softAt) < 5000 && !fromNav && !needIntro;
  ss('kx_soft', null);
  if (softIn) { doc.classList.add('kx-soft'); setTimeout(function () { doc.classList.remove('kx-soft'); }, 3000); }   // red de seguridad
  var startCovered = !reduce && ((fromNav && transOn) || needIntro);
  if (startCovered) {
    doc.classList.add('kx-cover');
    setTimeout(function () { doc.classList.remove('kx-cover'); }, 4500);   // red de seguridad absoluta
  }
  ss('kx_cover', null);

  /* ───────── cortina: líquido oscuro con borde suave (gotas grandes y redondeadas, sin cuadrados) ───────── */
  var melt = null, liq = null, lctx = null, sweep = null, liqRaf = 0;
  var LW = 0, LH = 0, LM = 0, lobes = [], liqFill = null, liqRgb = '0,255,136';
  function ensureMelt() {
    if (melt) return melt;
    if (!document.body) return null;
    melt = document.createElement('div'); melt.id = 'kx-melt'; melt.setAttribute('aria-hidden', 'true');
    melt.innerHTML = '<canvas class="kx-liquid"></canvas>' + '<div class="kx-grid"></div><div class="kx-logo"><div class="kx-ring-wrap"><svg class="kx-ring" viewBox="0 0 120 120" aria-hidden="true"><circle class="kx-ring-bg" cx="60" cy="60" r="54"/><circle class="kx-ring-fg" cx="60" cy="60" r="54"/></svg><div class="kx-mark">K</div></div><div class="kx-word"></div><div class="kx-sub"></div><div class="kx-meter"><div class="kx-bar"><i></i></div><b class="kx-pct">000</b></div></div>';
    document.body.appendChild(melt);
    liq = melt.querySelector('.kx-liquid'); try { lctx = liq.getContext('2d'); } catch (e) { lctx = null; }
    var w = melt.querySelector('.kx-word'); 'KINET OS'.split('').forEach(function (ch, i) { var sp = document.createElement('span'); sp.textContent = ch === ' ' ? ' ' : ch; sp.style.animationDelay = (0.35 + i * 0.06) + 's'; w.appendChild(sp); });
    sweep = document.createElement('div'); sweep.id = 'kx-sweep'; sweep.innerHTML = '<i></i>'; document.body.appendChild(sweep);
    return melt;
  }
  // Prepara el lienzo y reparte unas pocas gotas anchas y suaves (3 en móvil, 5 en escritorio)
  function prepLiquid() {
    if (!liq || !lctx) return;
    LW = innerWidth; LH = innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, LW >= 900 ? 2 : 1.5);
    liq.width = Math.round(LW * dpr); liq.height = Math.round(LH * dpr);
    lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = LW >= 900 ? 5 : (LW >= 600 ? 4 : 3), seg = LW / n;
    LM = LH * (LW >= 900 ? 0.38 : 0.27);
    lobes = [];
    for (var i = 0; i < n; i++) lobes.push({ cx: seg * (i + 0.5) + (Math.random() - 0.5) * seg * 0.5, w: seg * (0.30 + Math.random() * 0.18), h: LM * (0.62 + Math.random() * 0.38), d: Math.random() * 0.18 });
    liqFill = lctx.createLinearGradient(0, 0, 0, LH); liqFill.addColorStop(0, '#0B121C'); liqFill.addColorStop(0.65, '#04060A'); liqFill.addColorStop(1, '#04060A');
    try { var r = getComputedStyle(document.body).getPropertyValue('--role-rgb').trim(); if (/^\d+\s*,\s*\d+\s*,\s*\d+$/.test(r)) liqRgb = r; } catch (e) {}
  }
  function easeIO(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  // Altura del borde del líquido en la posición x para el progreso p (0..1). Las gotas se adelantan al resto y se redondean.
  function liqEdge(x, p) {
    var base = -LM * 1.05 + (LH + LM * 1.05 + 2) * p, d = 0;
    for (var i = 0; i < lobes.length; i++) {
      var L = lobes[i], q = Math.min(1, Math.max(0, (p - L.d) / 0.82)), f = 4 * q * (1 - q);
      var u = (x - L.cx) / L.w; d += L.h * Math.exp(-u * u) * f;
    }
    return base + d + Math.sin(x / LW * 7.5 + 0.8) * LM * 0.025 * (4 * p * (1 - p));
  }
  // mode 'cover': oscuro POR ENCIMA del borde (la cortina cae). mode 'reveal': oscuro POR DEBAJO (la pantalla se derrite hacia abajo).
  function drawLiquid(p, mode) {
    if (!lctx) return;
    var c = lctx, step = LW >= 900 ? 5 : 8, x, y;
    c.clearRect(0, 0, LW, LH);
    c.beginPath();
    if (mode === 'cover') c.moveTo(0, -6); else c.moveTo(0, LH + 6);
    var xs = [], ys = [];
    for (x = 0; x < LW + step; x += step) { var xx = Math.min(x, LW); y = liqEdge(xx, p); xs.push(xx); ys.push(y); c.lineTo(xx, y); }
    if (mode === 'cover') c.lineTo(LW, -6); else c.lineTo(LW, LH + 6);
    c.closePath(); c.fillStyle = liqFill; c.fill();
    if (p > 0.001 && p < 0.999) {      // borde luminoso suave siguiendo la curva
      c.lineJoin = 'round'; c.lineCap = 'round';
      [[12, 0.07], [5, 0.16], [1.6, 0.9]].forEach(function (s2) {
        c.beginPath(); for (var i = 0; i < xs.length; i++) { if (i) c.lineTo(xs[i], ys[i]); else c.moveTo(xs[i], ys[i]); }
        c.lineWidth = s2[0]; c.strokeStyle = 'rgba(' + liqRgb + ',' + s2[1] + ')'; c.stroke();
      });
    }
  }
  function drawFull() { if (!lctx) return; lctx.clearRect(0, 0, LW, LH); lctx.fillStyle = '#04060A'; lctx.fillRect(0, 0, LW, LH); }
  function runLiquid(mode, dur) {
    return new Promise(function (res) {
      cancelAnimationFrame(liqRaf);
      var t0 = performance.now();
      (function f(now) {
        var t = Math.min(1, Math.max(0, (now - t0) / dur));
        drawLiquid(easeIO(t), mode);
        if (t < 1) liqRaf = requestAnimationFrame(f); else res();
      })(t0);
    });
  }

  // La cortina cae (salida de la página)
  function coverIn() {
    return new Promise(function (res) {
      var m = ensureMelt(); if (!m || reduce || !lctx) { res(); return; }
      prepLiquid(); drawLiquid(0, 'cover'); m.classList.add('on');
      runLiquid('cover', 620).then(function () { drawFull(); res(); });
    });
  }
  // La pantalla se derrite hacia abajo (entrada a la página)
  function meltAway(opts) {
    opts = opts || {};
    var m = ensureMelt(); if (!m) { doc.classList.remove('kx-cover'); return Promise.resolve(); }
    prepLiquid(); drawFull(); m.classList.add('on');
    doc.classList.remove('kx-cover');           // la cortina real ya tapa la pantalla
    var logo = m.querySelector('.kx-logo');
    return new Promise(function (resolve) {
      var start = function () {
        if (logo && logo.animate) logo.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(1.08)' }], { duration: 380, easing: 'ease-in', fill: 'forwards' });
        var done = function () { cancelAnimationFrame(liqRaf); m.classList.remove('on'); if (lctx) lctx.clearRect(0, 0, LW, LH); if (logo) logo.style.opacity = 0; resolve(); };
        if (lctx) runLiquid('reveal', 1250).then(done);
        else if (m.animate) { m.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, fill: 'forwards' }).onfinish = function () { done(); m.style.opacity = ''; }; }
        else done();
        setTimeout(function () { if (!opts.noRebuild) KinetFX.rebuild(null, { page: true }); }, 260);
      };
      if (opts.logo) {
        var role = ls('kinet_active_role') || 'athlete', sport = ls('kinet_sport') || '';
        var sub = m.querySelector('.kx-sub'); if (sub) sub.textContent = ({ athlete: 'Atleta', staff: 'Cuerpo técnico', scout: 'Ojeador' }[role] || 'Bienvenido') + (sport ? ' · ' + sport : '');
        var bar = m.querySelector('.kx-bar i'); if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
        if (logo) { logo.style.opacity = 1; if (logo.animate) logo.animate([{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' }); }
        // contador 000 → 100 sincronizado con el anillo
        var pct = m.querySelector('.kx-pct'), t0 = performance.now(), DURC = 1250;
        (function tick(now) { var p = Math.min(1, (now - t0) / DURC), e = 1 - Math.pow(1 - p, 3); if (pct) pct.textContent = String(Math.round(e * 100)).padStart(3, '0'); if (p < 1) requestAnimationFrame(tick); })(t0);
        var fg = m.querySelector('.kx-ring-fg'); if (fg) { fg.style.animation = 'none'; void fg.getBoundingClientRect(); fg.style.animation = ''; }
        setTimeout(start, 1500);
      } else setTimeout(start, 60);
    });
  }

  /* ───────── reconstrucción de contenido ───────── */
  var CARD_SEL = '.kinet-panel, .glass-card, .panel, .pricing-card, .setting-row, .kpi-box, .session-item, .contact-item, .legal-clause-box, .day-pill, .month-day-cell, [data-reveal], .kx-reveal';
  function visible(el) { var r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < innerHeight * 1.05; }
  // ¿avanzamos o retrocedemos en el menú? Los cuadros entran desde el lado al que vamos (como en Gestión)
  function navDir() {
    try {
      var d = JSON.parse(NAV_FROM || 'null'); if (!d || !d.h || Date.now() - d.t > 9000) return 1;
      var hrefs = [].slice.call(document.querySelectorAll('.sidebar-nav a.side-link')).map(function (a) { return String(a.getAttribute('href') || '').split('#')[0].split('?')[0].split('/').pop().toLowerCase(); });
      var x = hrefs.indexOf(d.h), y = hrefs.indexOf(path);
      return (x > -1 && y > -1 && x !== y && y < x) ? -1 : 1;
    } catch (e) { return 1; }
  }
  var lastRebuild = 0;
  function rebuild(root, o) {
    o = o || {};
    if (reduce) return;
    var now = Date.now(); if (!o.force && now - lastRebuild < 350 && !o.page) return; lastRebuild = now;
    root = root || document.querySelector('.tab-content.active, .os-workspace') || document.querySelector('main') || document.body;
    var ws = o.page ? (document.querySelector('.os-workspace') || document.querySelector('main') || document.body) : root;
    if (!SHELL && !FRAME) {   // portada, soporte, onboarding, login…: solo una subida suave de las tarjetas (sin marcos de luz)
      var soft = [].slice.call(ws.querySelectorAll(CARD_SEL)).filter(visible).slice(0, 18);
      soft.forEach(function (el, i) { if (el.animate) el.animate([{ opacity: 0, translate: '0 26px', scale: '.97' }, { opacity: 1, translate: '0 0', scale: '1' }], { duration: 780, delay: 130 + Math.min(i, 10) * 95, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' }); });
      return;
    }
    var gentle = !!o.quick;                       // cambio de pestaña dentro de la página: mismo movimiento, algo más rápido
    var dir = gentle ? 1 : navDir(), sx = innerWidth < 700 ? 24 : 56, EZ = 'cubic-bezier(.22,1,.36,1)';
    // 1) el contenido entra con un fundido corto (igual que en Gestión)
    if (!o.soft && !o.sweepOnly && o.children !== false && ws.animate) ws.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 340, easing: 'ease-out' });
    // 2) los cuadros entran deslizándose y escalonados (igual que en Gestión); los anidados no se animan dos veces
    var cards = o.sweepOnly ? [] : [].slice.call(ws.querySelectorAll(CARD_SEL)).filter(visible);
    cards = cards.filter(function (el) { return !cards.some(function (c) { return c !== el && c.contains(el); }); }).slice(0, 22);
    cards.forEach(function (el, i) {
      if (!el.animate) return;
      el.animate([{ opacity: 0, translate: (sx * dir) + 'px 0', scale: '.98' }, { opacity: 1, translate: '0 0', scale: '1' }],
        { duration: gentle ? 640 : 820, delay: (gentle ? 50 : 100) + Math.min(i, 10) * (gentle ? 60 : 85), easing: EZ, fill: 'backwards' });
    });
    if (!o.sweepOnly) [].slice.call(ws.querySelectorAll('tbody tr')).filter(visible).slice(0, 14).forEach(function (el, i) {
      if (el.animate) el.animate([{ opacity: 0, translate: '-10px 0' }, { opacity: 1, translate: '0 0' }], { duration: 560, delay: (gentle ? 200 : 340) + i * 34, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
    });
    // 3) barrido de luz: SOLO dentro del cuadro de contenido que cambia (nunca sobre el menú ni la pantalla entera)
    if (o.page || o.sweepOnly || o.soft) perimeter(ws);
  }
  // LED perimetral: un rayo de luz da la vuelta al borde de TODO el cuadro de contenido (nunca sobre el menú)
  var perim = null;
  function perimeter(box) {
    try {
      if (!FRAME || !box || !box.getBoundingClientRect || !document.body || reduce) return;
      var r = box.getBoundingClientRect();
      // Toda la zona de contenido: de borde a borde de la parte derecha, justo debajo de la barra superior (no la columna centrada del contenido)
      var om = box.closest && box.closest('.os-main'), orr = om ? om.getBoundingClientRect() : r;
      var top = Math.max(r.top, 0), left = Math.max(orr.left, 0) + 2, w = Math.min(orr.right, innerWidth) - left - 2, h = Math.min(orr.bottom, innerHeight) - top - 2;
      if (w < 120 || h < 120) return;
      if (!perim) { perim = document.createElement('div'); perim.id = 'kx-perim'; perim.setAttribute('aria-hidden', 'true'); document.body.appendChild(perim); }
      perim.style.cssText = 'left:' + left + 'px;top:' + top + 'px;width:' + w + 'px;height:' + h + 'px;opacity:0';
      if (perim.getAnimations) perim.getAnimations().forEach(function (a) { a.cancel(); });
      var an = perim.animate([{ '--kx-pa': '0deg', opacity: 0 }, { opacity: 1, offset: .12 }, { opacity: 1, offset: .85 }, { '--kx-pa': '360deg', opacity: 0 }], { duration: 1150, easing: 'cubic-bezier(.4,0,.3,1)' });
      an.onfinish = function () { perim.style.opacity = 0; };
    } catch (e) {}
  }
  function sweepIn(box) {
    try {
      var line = sweep && sweep.firstElementChild; if (!line || !line.animate || !box) return;
      var r = box.getBoundingClientRect();
      var top = Math.max(r.top, 0), bottom = Math.min(r.bottom, innerHeight), left = Math.max(r.left, 0), right = Math.min(r.right, innerWidth);
      var h = bottom - top, w = right - left; if (h < 60 || w < 60) return;
      sweep.style.cssText = 'left:' + left + 'px;top:' + top + 'px;width:' + w + 'px;height:' + h + 'px;opacity:1';
      var an = line.animate([{ transform: 'translateY(-120px)', opacity: 0 }, { opacity: .85, offset: .18 }, { transform: 'translateY(' + (h - 20) + 'px)', opacity: .7, offset: .85 }, { transform: 'translateY(' + (h + 40) + 'px)', opacity: 0 }], { duration: 900, easing: 'cubic-bezier(.45,0,.2,1)' });
      an.onfinish = function () { sweep.style.opacity = 0; };
    } catch (e) {}
  }

  // Cambio de pestaña / modo dentro de la misma página
  var TAB_SEL = '.d-tab, .tab, .minimal-mode-btn, .an-mode, [role="tab"], .m-nav-btn, [onclick*="switchTab"], [onclick*="setAnalyzerMode"], [onclick*="switchMode"], .contact-item, .kq-chip';
  function setupTabs() {
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest(TAB_SEL); if (!t) return;
      if (t.closest('#kx-melt, .kg-switch')) return;
      setTimeout(function () { rebuild(null, { quick: true, force: false }); }, 30);
    });
  }

  /* ───────── navegación con cortina ───────── */
  function isShell(p) { return /^(app|cuerpo-tecnico|ficha-pro|ojeador-live|analizador|comunidad|media-studio|despacho|perfil|gestion|estado|movil)\.html$/.test(p); }
  // Pantalla completa SOLO al entrar en la app y al cambiar entre APP y GESTIÓN. El resto (cambiar de sección) anima solo el cuadro de contenido.
  function go(url, opts) {
    opts = opts || {};
    var to0 = ''; try { to0 = (new URL(url, location.href).pathname.split('/').pop() || '').toLowerCase(); } catch (e) {}
    if (to0 === 'soporte.html' && !reduce) {   // destino con salto espacial: salimos con un fundido corto y allí aterriza la animación
      if (go.busy) return; go.busy = true; ss('kb_warp', JSON.stringify({ c: '#00FF88', t: Date.now() }));
      try { document.body.style.transition = 'opacity .28s ease'; document.body.style.opacity = '0'; } catch (e) {}
      setTimeout(function () { location.href = url; }, 280); setTimeout(function () { go.busy = false; try { document.body.style.opacity = ''; } catch (e) {} }, 3000); return;
    }
    if (reduce || !transOn || !ensureMelt()) { location.href = url; return; }
    if (go.busy) return; go.busy = true;
    setTimeout(function () { go.busy = false; }, 3000);    // por si el navegador cancela la navegación
    var to = ''; try { to = (new URL(url, location.href).pathname.split('/').pop() || '').toLowerCase(); } catch (e) {}
    var modeChange = (path === 'gestion.html') !== (to === 'gestion.html');
    var main = document.querySelector('main.os-workspace');
    var soft = !opts.full && !modeChange && SHELL && isShell(to) && main && main.animate;
    if (soft) {
      ss('kx_soft', String(Date.now()));
      // Se navega YA: el navegador mantiene la página actual en pantalla hasta que la nueva puede pintarse, así no hay hueco ni tirón.
      var outA = main.animate([{ opacity: 1, translate: '0 0' }, { opacity: .55, translate: '0 -6px' }], { duration: 160, easing: 'ease-out', fill: 'forwards' });
      setTimeout(function () { try { outA.cancel(); } catch (e) {} }, 1800);   // si la navegación se cancela, el contenido vuelve
      location.href = url;
      return;
    }
    ss('kx_cover', String(Date.now()));
    coverIn().then(function () { location.href = url; });
  }
  var pre = {};
  function prefetch(href) {
    try {
      var u = new URL(href, location.href); if (u.origin !== location.origin || !/\.html$/.test(u.pathname)) return;
      var k = u.pathname + u.search; if (pre[k]) return; pre[k] = 1;
      var l = document.createElement('link'); l.rel = 'prefetch'; l.href = u.href; l.as = 'document'; document.head.appendChild(l);
    } catch (e) {}
  }
  function setupPrefetch() {
    var c = navigator.connection || {}; if (c.saveData) return;
    ['mouseover', 'touchstart', 'focusin'].forEach(function (ev) {
      document.addEventListener(ev, function (e) { var a = e.target && e.target.closest && e.target.closest('a[href]'); if (a && /\.html/.test(a.getAttribute('href') || '')) prefetch(a.href); }, { passive: true });
    });
  }
  function setupLinks() {
    if (NOMELT) return;
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
      if (a.target && a.target !== '_self') return; if (a.hasAttribute('download') || a.hasAttribute('data-no-fx')) return;
      var h = a.getAttribute('href') || '';
      if (!h || h.charAt(0) === '#' || /^(mailto:|tel:|javascript:|data:|blob:)/i.test(h)) return;
      var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
      if (u.origin !== location.origin) return;
      if (!/\.html$|\/$/.test(u.pathname)) return;
      if (u.pathname === location.pathname && u.search === location.search) return;     // mismo documento
      e.preventDefault(); go(u.href);
    }, false);
  }

  /* ───────── cursor, pulso, progreso, magnetismo, grano ───────── */
  function setupCursor() {
    if (!fine || reduce || ls('kinet_fx_cursor') === 'off') return;
    // Solo un halo que acompaña al puntero. El puntero real del sistema se ve SIEMPRE (también sobre ventanas flotantes, menús y campos de texto).
    var ring = document.createElement('div'); ring.id = 'kx-cur-ring'; document.body.appendChild(ring);
    var mx = -100, my = -100, rx = -100, ry = -100, raf = 0, first = true;
    var HOT = 'a,button,[role="button"],[onclick],select,label,summary,.side-link,.tab,.d-tab,input[type=checkbox],input[type=radio],input[type=range],input[type=color],.contact-item,.color-swatch-btn,.sw';
    function loop() {
      rx += (mx - rx) * .22; ry += (my - ry) * .22;
      ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      raf = (Math.abs(mx - rx) > .1 || Math.abs(my - ry) > .1) ? requestAnimationFrame(loop) : 0;
    }
    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (first) { first = false; rx = mx; ry = my; doc.classList.add('kx-cur-on'); }
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('mouseover', function (e) {
      var t = e.target; if (!t || !t.closest) return;
      doc.classList.toggle('kx-cur-hot', !!t.closest(HOT));
    }, { passive: true });
    document.addEventListener('mousedown', function () { doc.classList.add('kx-cur-down'); }, { passive: true });
    document.addEventListener('mouseup', function () { doc.classList.remove('kx-cur-down'); }, { passive: true });
    document.documentElement.addEventListener('mouseleave', function () { doc.classList.remove('kx-cur-on'); });
    document.documentElement.addEventListener('mouseenter', function () { if (!first) doc.classList.add('kx-cur-on'); });
  }
  function setupPulse() {
    if (reduce || ls('kinet_fx_pulse') === 'off') return;
    document.addEventListener('pointerdown', function (e) {
      if (e.button) return; if (e.target && e.target.closest && e.target.closest('.sidebar-nav')) return; var p = document.createElement('div'); p.className = 'kx-pulse'; p.style.left = e.clientX + 'px'; p.style.top = e.clientY + 'px';
      document.body.appendChild(p); setTimeout(function () { p.remove(); }, 750);
    }, { passive: true });
  }
  function setupProgress() {
    if (ls('kinet_fx_progress') === 'off') return;
    if (!FRAME && !SHELL) return;   // la barra LED de carga/scroll es solo de la app (no portada, onboarding, soporte, login…)
    var ws = document.querySelector('.os-workspace'), om = document.querySelector('.os-main');
    var bar = document.createElement('div'); bar.id = 'kx-progress'; bar.setAttribute('aria-hidden', 'true');
    var fill = document.createElement('i'); bar.appendChild(fill); document.body.appendChild(bar);
    function room(el) { return el ? el.scrollHeight - el.clientHeight : 0; }
    function scroller() {
      if (room(ws) > 40) return ws;
      if (room(om) > 40) return om;
      var d = document.scrollingElement || doc; return room(d) > 40 ? d : null;
    }
    function upd() {
      var el = scroller();
      if (!el) { bar.classList.remove('on', 'full'); return; }
      var max = room(el), p = Math.max(0, Math.min(1, el.scrollTop / max));
      bar.classList.add('on'); bar.style.setProperty('--p', p.toFixed(4)); bar.classList.toggle('full', p > .985);
    }
    document.addEventListener('scroll', upd, { passive: true, capture: true });
    window.addEventListener('resize', upd, { passive: true });
    setInterval(function () { if (!document.hidden) upd(); }, 1500);   // el contenido llega tarde: recalcula
    setTimeout(upd, 700);   // (antes se medía al arrancar y forzaba un cálculo de layout justo durante la entrada)
  }
  /* El contenido baja con la rueda y el teclado aunque el cursor esté en los márgenes, la cabecera o fuera de la columna central */
  function setupScrollAnywhere() {
    var ws = document.querySelector('.os-workspace'), om = document.querySelector('.os-main');
    if (!ws || !om) return;
    var BLOCK = '.drawer,.modal,.pal,[class*="modal"],[class*="overlay"],[class*="drawer"],.kc,select,textarea,input,[contenteditable]';
    function target() { return ws.scrollHeight - ws.clientHeight > 4 ? ws : null; }
    om.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.defaultPrevented || !e.deltaY) return;
      var t = e.target; if (!t || ws.contains(t)) return;
      if (t.closest && t.closest(BLOCK)) return;
      var w = target(); if (!w) return;
      w.scrollTop += e.deltaY * (e.deltaMode === 1 ? 34 : e.deltaMode === 2 ? w.clientHeight : 1); e.preventDefault();
    }, { passive: false });
    document.addEventListener('keydown', function (e) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      var a = document.activeElement; if (a && a !== document.body && a !== document.documentElement) return;
      var w = target(); if (!w) return; if (document.querySelector('.modal.on,.modal.open,.pal.on,.drawer.on,.drawer.open')) return;
      var k = e.key, h = w.clientHeight;
      var d = k === 'PageDown' || (k === ' ' && !e.shiftKey) ? h * .88 : k === 'PageUp' || (k === ' ' && e.shiftKey) ? -h * .88 : k === 'ArrowDown' ? 60 : k === 'ArrowUp' ? -60 : 0;
      if (k === 'Home') { w.scrollTo({ top: 0, behavior: 'smooth' }); e.preventDefault(); return; }
      if (k === 'End') { w.scrollTo({ top: w.scrollHeight, behavior: 'smooth' }); e.preventDefault(); return; }
      if (d) { w.scrollBy({ top: d, behavior: 'smooth' }); e.preventDefault(); }
    });
  }
  /* ───────── cuadros como en Gestión: luz que sigue al cursor y onda al pulsar un botón ───────── */
  function setupCards() {
    if (!doc.classList.contains('kx-cards') || reduce) return;
    var SPOT = '.kinet-panel, .panel, .pricing-card, .side-link', seen = window.WeakSet ? new WeakSet() : null, raf = 0, ev = null;
    if (fine) document.addEventListener('mousemove', function (e) {
      ev = e; if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0; var el = ev.target && ev.target.closest && ev.target.closest(SPOT);
        for (var n = 0; el && n < 3; n++) {
          var b = el.getBoundingClientRect(); el.style.setProperty('--mouse-x', (ev.clientX - b.left) + 'px'); el.style.setProperty('--mouse-y', (ev.clientY - b.top) + 'px');
          if (seen && !seen.has(el)) {   // si la tarjeta no trae luz propia, se le pone la de Gestión
            seen.add(el);
            try { if (el.matches('.kinet-panel, .panel, .pricing-card')) { var bg = getComputedStyle(el, '::before').backgroundImage; if (!(bg && bg.indexOf('radial-gradient') > -1)) el.classList.add('kx-spot'); } } catch (x) {}
          }
          el = el.parentElement && el.parentElement.closest(SPOT);
        }
      });
    }, { passive: true });
    document.addEventListener('pointerdown', function (e) {
      var b = e.target.closest && e.target.closest('.btn, .btn-primary, .btn-secondary, .btn-danger, .mini-action-pill'); if (!b || b.disabled) return;
      var r = b.getBoundingClientRect(), s2 = Math.max(r.width, r.height) * 2;
      if (!b.__kxRip) { b.__kxRip = { pos: getComputedStyle(b).position === 'static', ov: b.style.overflow }; if (b.__kxRip.pos) b.style.position = 'relative'; b.style.overflow = 'hidden'; }
      var d = document.createElement('span'); d.className = 'kx-rip';
      d.style.cssText = 'width:' + s2 + 'px;height:' + s2 + 'px;left:' + (e.clientX - r.left - s2 / 2) + 'px;top:' + (e.clientY - r.top - s2 / 2) + 'px';
      b.appendChild(d);
      clearTimeout(b.__kxRipT);
      setTimeout(function () { d.remove(); }, 650);
      b.__kxRipT = setTimeout(function () { var st = b.__kxRip; b.__kxRip = null; if (st) { if (st.pos) b.style.position = ''; b.style.overflow = st.ov; } }, 700);
    }, { passive: true });
  }
  function setupMagnet() {
    if (!fine || reduce || ls('kinet_fx_magnet') === 'off') return;
    var cur = null;
    document.addEventListener('mousemove', function (e) {
      var b = e.target.closest && e.target.closest('.btn-primary, .brand-logo-icon, .kinet-section-info-btn');
      if (cur && cur !== b) { cur.style.translate = ''; cur = null; }
      if (!b) return; cur = b; var r = b.getBoundingClientRect();
      b.style.translate = ((e.clientX - r.left - r.width / 2) * .08).toFixed(1) + 'px ' + ((e.clientY - r.top - r.height / 2) * .12).toFixed(1) + 'px';
    }, { passive: true });
    document.addEventListener('mouseleave', function () { if (cur) { cur.style.translate = ''; cur = null; } }, true);
  }
  function setupGrain() {
    if (reduce || ls('kinet_fx_grain') === 'off') return;
    var g = document.createElement('div'); g.id = 'kx-grain'; g.setAttribute('aria-hidden', 'true'); document.body.appendChild(g);
  }


  /* ───────── luz LED perimetral + resplandor (opciones en Despacho › Tema & Personalización) ───────── */
  var LED_DEF = { style: 'cometa', speed: 'normal', intensity: 'media', color: 'rol', custom: '#00FF88', width: '2', scope: 'all', ambient: 'on' };
  var LED_SEL = '.kinet-panel, .pricing-card, .panel, .chat-container, .glass-card, .profile-hero-box, .x-post-card';
  var LED_FREE = /(^|,\s*)(\.kinet-panel|\.pricing-card|\.panel)$/;   // estas ya reservan ::after para las marcas de esquina
  // La luz solo se anima en las tarjetas que se ven en pantalla (las demás no cuestan nada)
  var ledIO = null;
  try { if ('IntersectionObserver' in window) ledIO = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('kx-vis', e.isIntersecting); }); }, { rootMargin: '40px' }); } catch (e) {}
  var firstLed = true, ledOn = false, ledMo = null, ledTimer = 0, ledSeen = (window.WeakSet ? new WeakSet() : { has: function () { return false; }, add: function () {} });
  function ledCfg(o) {
    var c = {}; Object.keys(LED_DEF).forEach(function (k) { c[k] = (o && o[k] != null) ? o[k] : (ls('kinet_led_' + k) || LED_DEF[k]); });
    return c;
  }
  var ledQueue = null, ledQi = 0, ledBusy = false;
  function ledStep() {
    // Reparte el trabajo: máx. ~5 ms por fotograma para no cortar las animaciones de entrada
    var t0 = performance.now(), n = 0;
    while (ledQueue && ledQi < ledQueue.length && n < 160) {
      var el = ledQueue[ledQi++];
      if (el.classList.contains('kx-led') || ledSeen.has(el)) continue;
      ledSeen.add(el);
      if (el.closest('#kx-melt, .kg-switch')) continue;
      var cs; try { cs = getComputedStyle(el); } catch (e) { continue; }
      if (cs.position === 'static') continue;
      var reserved = el.matches('.kinet-panel, .pricing-card, .panel');
      if (!reserved) { var a = getComputedStyle(el, '::after').content; if (a && a !== 'none' && a !== 'normal') continue; }
      el.classList.add('kx-led'); n++;
      try { var rr = parseFloat(cs.borderTopLeftRadius); el.style.setProperty('--kx-r', (isNaN(rr) ? 14 : Math.min(rr, 60)) + 'px'); } catch (e) {}
      el.style.setProperty('--kx-led-d', (-Math.random() * 6).toFixed(2) + 's');
      if (ledIO) ledIO.observe(el); else el.classList.add('kx-vis');
      if (performance.now() - t0 > 5) break;
    }
    if (ledQueue && ledQi < ledQueue.length && n < 160) requestAnimationFrame(ledStep); else ledBusy = false;
  }
  function ledTag() {
    if (!ledOn) return;
    ledQueue = document.querySelectorAll(LED_SEL); ledQi = 0;
    if (!ledBusy) { ledBusy = true; requestAnimationFrame(ledStep); }
  }
  function applyLed(override) {
    var c = ledCfg(override);
    var off = c.style === 'off';
    ledOn = !off && !reduce;
    var cl = doc.classList;
    ['kx-led-on', 'kx-led-sweep', 'kx-led-breath', 'kx-led-dual', 'kx-led-rainbow', 'kx-led-hover'].forEach(function (k) { cl.remove(k); });
    if (ledOn) {
      cl.add('kx-led-on');
      if (c.style === 'barrido') cl.add('kx-led-sweep'); else if (c.style === 'respiro') cl.add('kx-led-breath');
      if (c.color === 'dual') cl.add('kx-led-dual'); else if (c.color === 'arcoiris') cl.add('kx-led-rainbow');
      if (c.scope === 'hover') cl.add('kx-led-hover');
    }
    var sp = { lenta: '10s', normal: '6s', rapida: '3.2s' }[c.speed] || '6s'; if (c.style === 'barrido') sp = { lenta: '7s', normal: '4.5s', rapida: '2.6s' }[c.speed] || '4.5s'; if (c.style === 'respiro') sp = { lenta: '6s', normal: '4s', rapida: '2.2s' }[c.speed] || '4s';
    doc.style.setProperty('--kx-led-speed', sp);
    doc.style.setProperty('--kx-led-op', String({ suave: .5, media: .85, alta: 1 }[c.intensity] || .85));
    doc.style.setProperty('--kx-led-w', ({ '1': '1.25px', '2': '2px', '3': '3px' }[String(c.width)] || '2px'));
    if (c.color === 'custom' && /^#[0-9a-f]{6}$/i.test(c.custom)) doc.style.setProperty('--kx-led-c1', c.custom); else doc.style.removeProperty('--kx-led-c1');
    // resplandor ambiental
    var amb = document.getElementById('kx-ambient');
    if (c.ambient === 'on' && !reduce && document.body) {
      if (!amb) { amb = document.createElement('div'); amb.id = 'kx-ambient'; amb.setAttribute('aria-hidden', 'true'); document.body.appendChild(amb); }
      doc.style.setProperty('--kx-amb-op', String({ suave: .45, media: .8, alta: 1.15 }[c.intensity] || .8));
      requestAnimationFrame(function () { doc.classList.add('kx-amb-on'); });
    } else doc.classList.remove('kx-amb-on');
    if (ledOn) {
      clearTimeout(ledTimer); ledTimer = setTimeout(ledTag, firstLed ? 900 : 40); firstLed = false;   // tras la entrada de los cuadros (evita el micro-corte)
      if (!ledMo && window.MutationObserver && document.body) {
        ledMo = new MutationObserver(function () { clearTimeout(ledTimer); ledTimer = setTimeout(ledTag, 350); });
        ledMo.observe(document.body, { childList: true, subtree: true });
      }
    }
  }
  function setupLed() { try { applyLed(); } catch (e) {} window.addEventListener('storage', function (e) { if (e.key && e.key.indexOf('kinet_led_') === 0) applyLed(); }); }


  /* ───────── mensajes de chat: entrada fluida (solo los nuevos; al cambiar de chat, en cascada) ───────── */
  function setupChatMotion() {
    if (reduce || !window.MutationObserver) return;
    var SEL = '.msg-bubble, .studio-chat-msg', EASE = 'cubic-bezier(.22,1,.36,1)';
    function pop(el, delay) {
      var inc = el.classList.contains('incoming');
      el.style.animation = 'none';
      if (!el.animate) return;
      var x = inc ? -20 : 20;
      el.animate([{ opacity: 0, translate: x + 'px 14px', scale: '.94', filter: 'blur(5px) brightness(1.5)' }, { opacity: 1, translate: '0 0', scale: '1', filter: 'blur(0) brightness(1)' }],
        { duration: 620, delay: delay, easing: EASE, fill: 'backwards' });
      if (inc) {                       // el contenido de la respuesta se asienta por capas (remitente → texto → acciones)
        var k = [].slice.call(el.children).filter(function (c) { return c.nodeType === 1; }).slice(0, 6);
        k.forEach(function (c, j) { if (c.animate) c.animate([{ opacity: 0, translate: '0 7px' }, { opacity: 1, translate: '0 0' }], { duration: 460, delay: delay + 140 + j * 70, easing: EASE, fill: 'backwards' }); });
      }
    }
    function wire(box) {
      if (box.__kxc) return;
      var st = box.__kxc = { n: 0, key: null };
      function run() {
        var list = [].slice.call(box.querySelectorAll(SEL)), n = list.length, key = String(box.getAttribute('data-kx-key') || (box.dataset && box.dataset.kxKey) || '');
        var cascade = key !== st.key || n < st.n || st.n === 0;
        var from = cascade ? Math.max(0, n - 8) : st.n;
        list.forEach(function (el, i) {
          if (el.__kxDone) return; el.__kxDone = 1;
          if (i >= from) pop(el, cascade ? (i - from) * 85 : (i - from) * 110); else el.style.animation = 'none';
        });
        st.n = n; st.key = key;
      }
      new MutationObserver(function () { run(); }).observe(box, { childList: true });
      run();
    }
    function scan() { var l = document.querySelectorAll('[data-kx-chat]'); for (var i = 0; i < l.length; i++) wire(l[i]); }
    scan(); window.addEventListener('load', scan);
  }

  /* ───────── barra lateral de la app: al elegir una opción, el marcador y la píldora se deslizan desde la opción anterior ───────── */
  function setupNavGlide() {
    var nav = document.querySelector('.sidebar-nav'); if (!nav || path === 'gestion.html') return;
    var links = [].slice.call(nav.querySelectorAll('a.side-link'));
    function hp(a) { try { return new URL(a.getAttribute('href') || '', location.href).pathname.split('/').pop().toLowerCase(); } catch (e) { return ''; } }
    nav.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a.side-link'); if (!a) return;
      var act = nav.querySelector('a.side-link.active');
      ss('kx_nav_from', JSON.stringify({ h: act ? hp(act) : '', t: Date.now() }));
    }, true);
    var act = nav.querySelector('a.side-link.active'); if (!act) return;
    var from = null;
    try { var d = JSON.parse(ss('kx_nav_from') || 'null'); if (d && d.h && Date.now() - d.t < 6000) from = links.filter(function (a) { return hp(a) === d.h; })[0] || null; } catch (e) {}
    ss('kx_nav_from', null);
    if (getComputedStyle(nav).position === 'static') nav.style.position = 'relative';
    nav.style.isolation = 'isolate';
    nav.classList.add('kx-has-ind'); var ind = document.createElement('i'); ind.className = 'kx-nav-ind'; ind.setAttribute('aria-hidden', 'true'); nav.appendChild(ind);
    // El menú se termina de montar durante los primeros ms (se añaden opciones, cargan fuentes, cambia el alto de la cabecera…).
    // Antes el marcador se colocaba con las medidas de ese instante, y al asentarse el menú "saltaba" a su sitio.
    // Ahora: (1) el marcador está oculto hasta tener la posición definitiva, (2) cualquier cambio del menú lo recoloca al instante
    // (sin animar) y (3) el deslizamiento solo empieza cuando el menú lleva unos fotogramas quieto.
    function y(el) { return el.offsetTop + el.offsetHeight * .25; }
    var glide = null, revealed = false;
    function cancelGlide() { if (glide) { try { glide.cancel(); } catch (e) {} glide = null; } }
    function place() { var a = nav.querySelector('a.side-link.active'); if (!a) return; var tr = ind.style.transition; ind.style.transition = 'none'; ind.style.height = Math.max(18, a.offsetHeight * .5) + 'px'; ind.style.translate = '0 ' + y(a) + 'px'; if (revealed) ind.style.opacity = 1; void ind.offsetWidth; ind.style.transition = tr; }
    var willGlide = !!(from && from !== act && !reduce && !needIntro && act.animate && ind.animate), started = false;
    var animating = willGlide;   // mientras espera su deslizamiento, nada recoloca el marcador (si no, se veía el salto al destino)
    function sync() { if (animating) return; cancelGlide(); place(); }
    window.addEventListener('resize', sync);
    try {
      new MutationObserver(function (ms) {
        for (var i = 0; i < ms.length; i++) {
          var t = ms[i].target, own = t === ind || (t.classList && t.classList.contains('kx-nav-pill'));
          if (ms[i].type === 'childList') { var n = [].slice.call(ms[i].addedNodes).concat([].slice.call(ms[i].removedNodes)); own = n.length > 0 && n.every(function (x) { return x === ind || (x.classList && x.classList.contains('kx-nav-pill')); }); }
          if (!own) { sync(); return; }
        }
      }).observe(nav, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
    } catch (e) {}
    try { if (window.ResizeObserver) { var ro = new ResizeObserver(function () { sync(); }); ro.observe(nav); [].slice.call(nav.children).forEach(function (c) { if (c !== ind) ro.observe(c); }); } } catch (e) {}
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { sync(); }).catch(function () {});
    window.addEventListener('load', sync);
    function settle() { if (started && (!glide || glide.playState !== 'running')) animating = false; if (!animating) sync(); else if (!started) kick(); }
    setTimeout(settle, 1100); setTimeout(settle, 2600);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) setTimeout(settle, 60); });
    window.addEventListener('pageshow', function () { setTimeout(settle, 60); });
    window.addEventListener('focus', function () { setTimeout(settle, 60); });
    if (!willGlide) {   // carga normal: el marcador aparece cuando el menú ya está quieto (nunca en una posición provisional)
      var t0 = Date.now(), lastK = '', quiet = 0;
      (function waitQuiet() {
        var a = nav.querySelector('a.side-link.active'), k = a ? a.offsetTop + '/' + a.offsetHeight : '';
        quiet = k === lastK ? quiet + 1 : 0; lastK = k;
        if ((quiet >= 2 && document.readyState !== 'loading') || Date.now() - t0 > 400) { revealed = true; place(); } else requestAnimationFrame(waitQuiet);
      })();
      setTimeout(function () { if (!revealed) { revealed = true; place(); } }, 700);
      return;
    }
    // Deslizamiento desde la opción anterior: solo cuando el menú está quieto (misma posición durante 3 fotogramas, máx. ~500 ms)
    ind.style.opacity = 0;
    var tStart = Date.now(), lastY = -1, still = 0;
    function waitStable() {
      var a = nav.querySelector('a.side-link.active'); if (!a) return;
      var cy = a.offsetTop + '/' + from.offsetTop + '/' + a.offsetHeight;
      still = cy === lastY ? still + 1 : 0; lastY = cy;
      if ((still >= 3 && document.readyState !== 'loading') || Date.now() - tStart > 500) run(a); else requestAnimationFrame(waitStable);
    }
    function run(a) {
      if (started) return; started = true; animating = true;
      var y0 = y(from), y1 = y(a), h0 = Math.max(18, from.offsetHeight * .5), h1 = Math.max(18, a.offsetHeight * .5);
      var cs = getComputedStyle(a), bg = cs.backgroundColor, bd = cs.borderTopColor, sh = cs.boxShadow;
      var ghost = document.createElement('i'); ghost.className = 'kx-nav-pill'; ghost.setAttribute('aria-hidden', 'true');
      ghost.style.cssText = 'left:' + a.offsetLeft + 'px;width:' + a.offsetWidth + 'px;height:' + a.offsetHeight + 'px;border-radius:' + cs.borderTopLeftRadius + ';background:' + bg + ';border:1px solid ' + bd + ';box-shadow:' + sh + ';translate:0 ' + from.offsetTop + 'px';
      nav.appendChild(ghost);
      try { a.animate([{ backgroundColor: 'rgba(0,0,0,0)', borderColor: 'rgba(0,0,0,0)', boxShadow: '0 0 0 rgba(0,0,0,0)' }, { backgroundColor: bg, borderColor: bd, boxShadow: sh }], { duration: 420, delay: 300, easing: 'ease-out', fill: 'backwards' }); } catch (e) {}
      revealed = true; ind.style.transition = 'none'; ind.style.opacity = 1; ind.style.height = h1 + 'px'; ind.style.translate = '0 ' + y1 + 'px';
      var done = function () { animating = false; glide = null; try { ghost.remove(); } catch (e) {} place(); };
      try {
        glide = ind.animate([{ translate: '0 ' + y0 + 'px', height: h0 + 'px' }, { translate: '0 ' + y1 + 'px', height: h1 + 'px' }], { duration: 640, easing: EASE_NAV, fill: 'both' });
        glide.onfinish = glide.oncancel = done;
        var g = ghost.animate([{ translate: '0 ' + from.offsetTop + 'px', opacity: 1 }, { translate: '0 ' + a.offsetTop + 'px', opacity: 1, offset: .72 }, { translate: '0 ' + a.offsetTop + 'px', opacity: 0 }], { duration: 900, easing: EASE_NAV, fill: 'forwards' });
        g.onfinish = g.oncancel = function () { try { ghost.remove(); } catch (e) {} };
      } catch (e) { done(); }
    }
    function kick() { var a = nav.querySelector('a.side-link.active'); if (a) run(a); else { animating = false; started = true; } }
    setTimeout(function () { if (!started) kick(); }, 900);   // red de seguridad (pestaña en segundo plano: los fotogramas se pausan)
    requestAnimationFrame(waitStable);
  }
  var EASE_NAV = 'cubic-bezier(.22,1,.36,1)';

  /* ───────── arranque ───────── */
  function boot() {
    try { setupLinks(); setupPrefetch(); setupTabs(); setupCursor(); setupPulse(); setupProgress(); setupScrollAnywhere(); setupMagnet(); setupCards(); setupGrain(); setupLed(); } catch (e) {}
    try { setupChatMotion(); } catch (e) {}
    try { setupNavGlide(); } catch (e) {}
    if (startCovered) {
      try {
        ensureMelt();
        var intro = needIntro;
        if (needIntro) { ss('kx_intro', '1'); ss('kx_intro_at', String(Date.now())); }
        // Esperamos a que la página tenga contenido; si tarda, se revela igualmente (una sola vez)
        var fired = false;
        var go2 = function () { if (fired) return; fired = true; meltAway({ logo: intro }); };
        if (document.readyState === 'complete') go2(); else { window.addEventListener('load', go2, { once: true }); setTimeout(go2, intro ? 2600 : 900); }
      } catch (e) { doc.classList.remove('kx-cover'); }
    } else if (softIn) {
      try {
        ensureMelt();
        var mn = document.querySelector('main.os-workspace');
        var run = function () {
          if (run.done) return; run.done = true;
          doc.classList.remove('kx-soft');
          if (mn && mn.animate) mn.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 340, easing: 'ease-out' });
          rebuild(null, { page: true, soft: true, force: true });
        };
        // El contenido se revela en cuanto la página está montada (no se espera a fuentes ni imágenes: eso era el microtirón)
        setTimeout(function () { requestAnimationFrame(run); }, 30);
        setTimeout(run, 700);
      } catch (e) { doc.classList.remove('kx-soft'); }
    } else if (!reduce) {
      try { ensureMelt(); setTimeout(function () { rebuild(null, { page: true, soft: true }); }, 120); } catch (e) {}
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  // Volver con el botón "atrás" (caché de página): nunca debe quedarse la cortina
  window.addEventListener('pageshow', function (e) { if (e.persisted) { doc.classList.remove('kx-cover'); doc.classList.remove('kx-soft'); if (melt) { cancelAnimationFrame(liqRaf); melt.classList.remove('on'); } go.busy = false; } });

  window.KinetFX = { motion: { system: sysReduce, respect: respectSys, active: !reduce }, led: { apply: applyLed, defaults: LED_DEF }, rebuild: rebuild, go: go, coverIn: coverIn, meltAway: meltAway,
    setCursor: function (on) { try { localStorage.setItem('kinet_fx_cursor', on ? 'on' : 'off'); } catch (e) {} location.reload(); } };
})();

/* ───────── Ajuste de textos en móvil: etiquetas y desplegables que se cortaban con «…» pasan a varias líneas ───────── */
(function () {
  try {
    var s = document.createElement('style'); s.id = 'kx-fit-text';
    s.textContent = '@media (max-width:700px){' +
      '.context-tag{align-items:flex-start}' +
      '.context-tag > span{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;line-height:1.3;min-width:0}' +
      '.kinet-custom-select-trigger,.kinet-custom-dd-trigger{height:auto!important;min-height:36px;overflow:visible!important}' +
      '.kinet-custom-select-label,.kinet-custom-select-trigger > span:not([class*="arrow"]),.kinet-custom-dd-trigger > span:not([class*="arrow"]){white-space:normal!important;overflow:visible!important;text-overflow:clip!important;line-height:1.25;text-align:left;word-break:break-word}' +
      '.field-label{white-space:normal!important;line-height:1.3}' +
      '.panel-head-left{min-width:0}' +
      '.panel-head-left div{white-space:normal!important;overflow:visible!important;text-overflow:clip!important}' +
      '.minimal-mode-btn{white-space:normal!important;line-height:1.2;text-align:center}' +
      '}';
    (document.head || document.documentElement).appendChild(s);
  } catch (e) {}
})();
