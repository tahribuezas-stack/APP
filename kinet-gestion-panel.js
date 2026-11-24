/* KINET OS · Panel de gestión · núcleo (rutas, utilidades, gráficos, cajón, modal, paleta de comandos).
   Las secciones viven en kinet-gestion-a.js y kinet-gestion-b.js y se registran en KGP.sections. */
(function () {
  'use strict';
  var G = window.KinetGestion, B = window.KinetBackend;
  var KGP = window.KGP = { sections: {}, helpers: {} };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var reduce = false; try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ───────── Formato ───────── */
  var H = KGP.helpers;
  H.esc = esc; H.$ = $; H.$$ = $$;
  H.num = function (n) { n = Number(n); return isFinite(n) ? n.toLocaleString('es-ES') : '—'; };
  H.eur = function (n) { n = Number(n); return isFinite(n) ? n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: n < 10 ? 2 : 0 }) : '—'; };
  H.bytes = function (n) { n = Number(n) || 0; var u = ['B', 'KB', 'MB', 'GB', 'TB'], i = 0; while (n >= 1024 && i < 4) { n /= 1024; i++; } return n.toLocaleString('es-ES', { maximumFractionDigits: i ? 1 : 0 }) + ' ' + u[i]; };
  H.date = function (x) { if (!x) return '—'; var d = new Date(x); return isNaN(d) ? '—' : d.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }); };
  H.ago = function (x) {
    if (!x) return '—'; var s = (Date.now() - new Date(x).getTime()) / 1000; if (isNaN(s)) return '—';
    if (s < 60) return 'ahora'; if (s < 3600) return Math.floor(s / 60) + ' min'; if (s < 86400) return Math.floor(s / 3600) + ' h'; return Math.floor(s / 86400) + ' d';
  };
  H.tierChip = function (t) { t = String(t || 'free').toLowerCase(); return '<span class="chip ' + esc(t) + '">' + esc(t) + '</span>'; };
  H.debounce = function (fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; };

  /* ───────── Permisos ───────── */
  var myRole = null;
  H.role = function () { return myRole; };
  H.can = function () {
    if (myRole === 'superadmin' || myRole === 'admin') return true;
    for (var i = 0; i < arguments.length; i++) if (arguments[i] === myRole) return true;
    return false;
  };

  /* ───────── Servidor ───────── */
  H.rpc = function (fn, args) { return B.adminRpc(fn, args || {}); };
  H.run = async function (btn, fn, okMsg) {
    if (btn) btn.setAttribute('disabled', '');
    try { var r = await fn(); if (okMsg) H.toast(okMsg); return r; }
    catch (e) { H.toast((e && e.message) || 'Error', 'bad'); return undefined; }
    finally { if (btn) btn.removeAttribute('disabled'); }
  };

  /* ───────── Avisos ───────── */
  H.toast = function (msg, kind) {
    var host = $('#toasts'); if (!host) return;
    var t = document.createElement('div'); t.className = 'toast ' + (kind || ''); t.textContent = msg; host.appendChild(t);
    setTimeout(function () { t.style.transition = 'all .4s'; t.style.opacity = '0'; t.style.transform = 'translateY(10px)'; setTimeout(function () { t.remove(); }, 420); }, kind === 'bad' ? 6500 : 3600);
  };

  /* ───────── Modal propio (nada de alert/confirm del navegador) ───────── */
  H.ask = function (o) {
    return new Promise(function (resolve) {
      var m = $('#modal'), v = $('#veil');
      m.innerHTML = '<h3>' + esc(o.title || 'Confirmar') + '</h3>' + (o.text ? '<p>' + esc(o.text) + '</p>' : '') +
        (o.input ? '<div class="field"><label>' + esc(o.input.label || '') + '</label>' + (o.input.multiline ? '<textarea class="inp" id="mIn" placeholder="' + esc(o.input.placeholder || '') + '">' + esc(o.input.value || '') + '</textarea>' : '<input class="inp" id="mIn" placeholder="' + esc(o.input.placeholder || '') + '" value="' + esc(o.input.value || '') + '">') + '</div>' : '') +
        '<div class="acts"><button class="btn" id="mNo">Cancelar</button><button class="btn ' + (o.danger ? 'bad' : 'pri') + '" id="mOk">' + esc(o.ok || 'Confirmar') + '</button></div>';
      m.classList.add('on'); v.classList.add('on'); v.style.zIndex = 9099;
      var done = function (val) { m.classList.remove('on'); if (!$('#drawer').classList.contains('on')) v.classList.remove('on'); v.style.zIndex = ''; v.onclick = drawerVeil; document.removeEventListener('keydown', key); resolve(val); };
      var key = function (e) { if (e.key === 'Escape') done(null); if (e.key === 'Enter' && o.input && !o.input.multiline) $('#mOk').click(); };
      document.addEventListener('keydown', key);
      $('#mNo').onclick = function () { done(null); }; v.onclick = function () { done(null); };
      $('#mOk').onclick = function () { done(o.input ? ($('#mIn').value || '') : true); };
      var i = $('#mIn'); if (i) setTimeout(function () { i.focus(); }, 60);
    });
  };

  /* ───────── Cajón lateral ───────── */
  function drawerVeil() { H.closeDrawer(); }
  H.openDrawer = function (html) {
    var d = $('#drawer'), v = $('#veil'); d.innerHTML = html; d.classList.add('on'); d.setAttribute('aria-hidden', 'false'); v.classList.add('on'); v.onclick = drawerVeil;
    if (window.KinetFX && KinetFX.rebuild) KinetFX.rebuild(d, { children: true });
    return d;
  };
  H.closeDrawer = function () { var d = $('#drawer'); d.classList.remove('on'); d.setAttribute('aria-hidden', 'true'); if (!$('#modal').classList.contains('on')) $('#veil').classList.remove('on'); };

  /* ───────── Gráficos (SVG propio, sin librerías) ───────── */
  H.lineChart = function (pts, o) {
    o = o || {}; var W = 640, Hh = o.h || 150, P = { l: 30, r: 8, t: 10, b: 20 };
    if (!pts || !pts.length) return '<div class="empty">Sin datos todavía</div>';
    var max = Math.max.apply(null, pts.map(function (p) { return p.y; }).concat([1])), n = pts.length;
    var X = function (i) { return P.l + (n === 1 ? 0 : i * (W - P.l - P.r) / (n - 1)); }, Y = function (v) { return P.t + (Hh - P.t - P.b) * (1 - v / max); };
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(p.y).toFixed(1); }).join(' ');
    var area = d + ' L' + X(n - 1).toFixed(1) + ' ' + (Hh - P.b) + ' L' + X(0).toFixed(1) + ' ' + (Hh - P.b) + ' Z';
    var gid = 'g' + Math.random().toString(36).slice(2, 7), grid = '';
    for (var k = 0; k <= 3; k++) { var gv = max * k / 3, gy = Y(gv); grid += '<line class="gl" x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + gy + '" y2="' + gy + '"/><text x="' + (P.l - 6) + '" y="' + (gy + 3) + '" text-anchor="end">' + (gv >= 10 ? Math.round(gv) : gv.toFixed(1).replace('.0', '')) + '</text>'; }
    var step = Math.ceil(n / 7), lab = '';
    pts.forEach(function (p, i) { if (i % step === 0 || i === n - 1) lab += '<text x="' + X(i) + '" y="' + (Hh - 5) + '" text-anchor="middle">' + esc(p.x) + '</text>'; });
    var dots = pts.map(function (p, i) { return '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(p.y).toFixed(1) + '" r="10" fill="transparent"><title>' + esc(p.x) + ': ' + esc(p.t != null ? p.t : p.y) + '</title></circle>'; }).join('');
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + Hh + '" role="img">' +
      '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--role-color)" stop-opacity=".35"/><stop offset="1" stop-color="var(--role-color)" stop-opacity="0"/></linearGradient></defs>' +
      grid + lab + '<path d="' + area + '" fill="url(#' + gid + ')" style="' + (reduce ? '' : 'opacity:0;animation:kgFade .9s .5s forwards') + '"/>' +
      '<path d="' + d + '" fill="none" stroke="var(--role-color)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" pathLength="1" style="filter:drop-shadow(0 0 6px var(--role-color));' + (reduce ? '' : 'stroke-dasharray:1;stroke-dashoffset:1;animation:kgDraw 1.2s cubic-bezier(.16,1,.3,1) forwards') + '"/>' + dots + '</svg>';
  };
  H.barChart = function (pts, o) {
    o = o || {}; var W = 640, Hh = o.h || 150, P = { l: 30, r: 8, t: 10, b: 20 };
    if (!pts || !pts.length) return '<div class="empty">Sin datos todavía</div>';
    var max = Math.max.apply(null, pts.map(function (p) { return p.y; }).concat([1])), n = pts.length, bw = (W - P.l - P.r) / n;
    var grid = ''; for (var k = 0; k <= 3; k++) { var gv = max * k / 3, gy = P.t + (Hh - P.t - P.b) * (1 - gv / max); grid += '<line class="gl" x1="' + P.l + '" x2="' + (W - P.r) + '" y1="' + gy + '" y2="' + gy + '"/><text x="' + (P.l - 6) + '" y="' + (gy + 3) + '" text-anchor="end">' + (gv >= 10 ? Math.round(gv) : gv.toFixed(1).replace('.0', '')) + '</text>'; }
    var step = Math.ceil(n / 8), bars = '';
    pts.forEach(function (p, i) {
      var h = (Hh - P.t - P.b) * (p.y / max), x = P.l + i * bw + bw * .18, w = bw * .64, y = Hh - P.b - h;
      bars += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + Math.max(h, 0.5).toFixed(1) + '" rx="3" fill="var(--role-color)" fill-opacity=".85" style="' + (reduce ? '' : 'transform-origin:' + (x + w / 2).toFixed(1) + 'px ' + (Hh - P.b) + 'px;transform:scaleY(0);animation:kgGrow .8s ' + (i * 25) + 'ms cubic-bezier(.16,1,.3,1) forwards') + '"><title>' + esc(p.x) + ': ' + esc(p.t != null ? p.t : p.y) + '</title></rect>';
      if (i % step === 0 || i === n - 1) bars += '<text x="' + (x + w / 2).toFixed(1) + '" y="' + (Hh - 5) + '" text-anchor="middle">' + esc(p.x) + '</text>';
    });
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + Hh + '" role="img">' + grid + bars + '</svg>';
  };
  H.donut = function (segs) {
    var tot = segs.reduce(function (a, s) { return a + s.v; }, 0); if (!tot) return '<div class="empty">Sin datos</div>';
    var R = 52, C = 2 * Math.PI * R, off = 0, arcs = '';
    segs.forEach(function (s, i) {
      var len = C * s.v / tot;
      arcs += '<circle cx="70" cy="70" r="' + R + '" fill="none" stroke="' + s.c + '" stroke-width="16" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 70 70)" style="' + (reduce ? '' : 'opacity:0;animation:kgFade .6s ' + (i * 140) + 'ms forwards') + '"><title>' + esc(s.l) + ': ' + s.v + '</title></circle>';
      off += len;
    });
    return '<div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap"><svg viewBox="0 0 140 140" width="140" height="140" role="img"><circle cx="70" cy="70" r="' + R + '" fill="none" stroke="rgba(255,255,255,.05)" stroke-width="16"/>' + arcs + '<text x="70" y="68" text-anchor="middle" style="fill:#fff;font:900 20px Orbitron,sans-serif">' + H.num(tot) + '</text><text x="70" y="84" text-anchor="middle" style="fill:#64748B;font:9px JetBrains Mono,monospace">TOTAL</text></svg>' +
      '<div class="legend" style="flex-direction:column;gap:8px;margin:0">' + segs.map(function (s) { return '<span><i style="background:' + s.c + '"></i>' + esc(s.l) + ' · <b style="color:#fff">' + H.num(s.v) + '</b> <span class="muted">(' + Math.round(100 * s.v / tot) + '%)</span></span>'; }).join('') + '</div></div>';
  };
  H.hbars = function (items) {
    var max = Math.max.apply(null, items.map(function (i) { return i.v; }).concat([1]));
    return items.map(function (i) { return '<div class="bar-h"><span class="muted">' + esc(i.l) + '</span><div class="tr"><div class="fi" data-w="' + (100 * i.v / max).toFixed(1) + '"></div></div><b class="mono">' + esc(i.t != null ? i.t : H.num(i.v)) + '</b></div>'; }).join('');
  };
  H.animate = function (root) {
    $$('[data-count]', root).forEach(function (el) {
      var to = parseFloat(el.getAttribute('data-count')), dec = parseInt(el.getAttribute('data-dec') || '0', 10), pre = el.getAttribute('data-pre') || '', suf = el.getAttribute('data-suf') || '';
      if (!isFinite(to)) return; var fmt = function (v) { return pre + v.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; };
      if (reduce) { el.textContent = fmt(to); return; }
      var t0 = performance.now(), dur = 1000; (function f(t) { var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = fmt(to * e); if (p < 1) requestAnimationFrame(f); else el.textContent = fmt(to); })(t0);
    });
    requestAnimationFrame(function () { $$('.fi[data-w]', root).forEach(function (el) { el.style.width = el.getAttribute('data-w') + '%'; }); });
  };
  H.kpi = function (label, val, o) {
    o = o || {}; var v = (typeof val === 'number' && isFinite(val)) ? '<span data-count="' + val + '"' + (o.dec ? ' data-dec="' + o.dec + '"' : '') + (o.pre ? ' data-pre="' + o.pre + '"' : '') + (o.suf ? ' data-suf="' + o.suf + '"' : '') + '>0</span>' : esc(val == null ? '—' : val);
    return '<div class="panel kpi ' + (o.cls || '') + (o.go ? ' click' : '') + '"' + (o.go ? ' data-go="' + o.go + '"' : '') + '><div class="p-l">' + esc(label) + '</div><div class="v" style="margin-top:8px">' + v + '</div>' + (o.sub ? '<div class="d">' + esc(o.sub) + '</div>' : '') + '</div>';
  };
  H.table = function (cols, rows, o) {
    o = o || {};
    if (!rows.length) return '<div class="panel"><div class="empty">' + esc(o.empty || 'No hay nada que mostrar') + '</div></div>';
    return '<div class="tbl-wrap"><table class="tbl"><thead><tr>' + cols.map(function (c) { return '<th>' + esc(c.h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r, i) { return '<tr' + (o.click ? ' class="click" data-i="' + i + '"' : '') + '>' + cols.map(function (c) { return '<td>' + c.f(r, i) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  };
  H.head = function (tag, title, sub, actions) {
    return '<div class="ctx"><div><div class="ctx-tag">● ' + esc(tag) + '</div><h2 class="ctx-title">' + esc(title) + '</h2>' + (sub ? '<div class="ctx-sub">' + esc(sub) + '</div>' : '') + '</div>' + (actions ? '<div style="display:flex;gap:8px;flex-wrap:wrap">' + actions + '</div>' : '') + '</div>';
  };
  H.skeleton = function (n) { var s = ''; for (var i = 0; i < (n || 3); i++) s += '<div class="skel" style="margin-bottom:14px"></div>'; return s; };
  H.go = function (id) { location.hash = id; };

  /* ───────── Rutas y menú ───────── */
  var current = null, timers = [];
  H.every = function (ms, fn) { timers.push(setInterval(function () { if (!document.hidden) fn(); }, ms)); };
  function clearTimers() { timers.forEach(clearInterval); timers = []; }

  function renderNav() {
    var items = G.gestionItems(myRole), cur = (location.hash || '').replace('#', '') || 'resumen';
    var nav = $('#gnav'), html = items.map(function (it) { return G.navItemHtml(it, it.id === cur); }).join('');
    if (!nav.children.length) { nav.innerHTML = html; if (G.flipSwap && !reduce) { /* entrada con giro de iconos */ $$('.kg-flip', nav).forEach(function (f, i) { f.animate([{ transform: 'rotateY(-90deg) scale(.7)', opacity: 0 }, { transform: 'rotateY(0)', opacity: 1 }], { duration: 560, delay: 380 + i * 50, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }); }); } }
    else $$('.side-link', nav).forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === 'gestion.html#' + cur); });
    var act = $('.side-link.active', nav); if (act && act.scrollIntoView) { var nr = nav.getBoundingClientRect(), ar = act.getBoundingClientRect(); if (ar.top < nr.top || ar.bottom > nr.bottom) nav.scrollTop = act.offsetTop - nav.offsetTop - 40; } else nav.scrollTop = 0;
    $('#mnav').innerHTML = items.map(function (it) { return '<a href="#' + it.id + '" class="' + (it.id === cur ? 'active' : '') + '">' + it.icon + ' ' + esc(it.label) + '</a>'; }).join('');
  }
  async function route() {
    var id = (location.hash || '').replace('#', '') || 'resumen';
    var sec = G.SECTIONS.filter(function (s) { return s.id === id; })[0];
    if (!sec || !G.canSee(myRole, sec) || !KGP.sections[id]) { if (id !== 'resumen') { location.hash = 'resumen'; return; } }
    clearTimers(); H.closeDrawer();
    try { localStorage.setItem('kinet_last_gestion', id); } catch (e) {}
    current = id; renderNav();
    $('#tbSection').textContent = '● ' + (sec ? sec.label.toUpperCase() : 'PANEL');
    var ws = $('#ws'); ws.innerHTML = H.skeleton(3);
    var token = {}; route.token = token;
    try {
      var out = await KGP.sections[id](ws, token);
      if (route.token !== token) return;
      if (typeof out === 'string') ws.innerHTML = out;
    } catch (e) { ws.innerHTML = '<div class="panel"><div class="empty">⚠️ ' + esc((e && e.message) || 'Error al cargar') + '</div></div>'; }
    if (route.token !== token) return;
    H.animate(ws); ws.scrollTop = 0;
    $$('[data-go]', ws).forEach(function (el) { el.onclick = function () { H.go(el.getAttribute('data-go')); }; });
    if (window.KinetFX && KinetFX.rebuild) KinetFX.rebuild(ws, { children: true });
  }
  H.reload = function () { return route(); };
  KGP.isCurrent = function (token) { return route.token === token; };

  /* ───────── Paleta de comandos (Ctrl/Cmd + K) ───────── */
  var palSel = 0, palItems = [];
  function palRender(list) {
    palItems = list; palSel = 0;
    var html = '', lastG = '';
    list.forEach(function (it, i) { if (it.g !== lastG) { html += '<div class="grp">' + esc(it.g) + '</div>'; lastG = it.g; } html += '<div class="it' + (i === 0 ? ' sel' : '') + '" data-i="' + i + '"><span>' + it.icon + '</span><span>' + esc(it.label) + '</span><span class="muted sm" style="margin-left:auto">' + esc(it.hint || '') + '</span></div>'; });
    $('#palRes').innerHTML = html || '<div class="empty">Sin resultados</div>';
  }
  function palBase(q) {
    q = (q || '').toLowerCase().trim();
    return G.sectionsFor(myRole).filter(function (s) { return !q || s.label.toLowerCase().indexOf(q) >= 0 || s.id.indexOf(q) >= 0; })
      .map(function (s) { return { g: 'Ir a', icon: s.icon, label: s.label, run: function () { H.go(s.id); } }; });
  }
  var palSearch = H.debounce(async function (q) {
    var base = palBase(q);
    if (q.length >= 3 && H.can('subadmin', 'moderator', 'scout_verifier')) {
      try {
        var r = await H.rpc('admin_list_users', { p_q: q, p_tier: '', p_role: '', p_flag: '', p_limit: 6, p_offset: 0 });
        if ($('#palIn').value.trim() !== q) return;
        var us = (r.rows || []).map(function (u) { return { g: 'Usuarios', icon: '👤', label: (u.full_name || u.handle || u.email), hint: (u.handle || '') + ' · ' + (u.account_tier || 'free'), run: function () { H.openUser(u.id); } }; });
        base = base.concat(us);
      } catch (e) {}
    }
    palRender(base);
  }, 220);
  function palOpen() { $('#pal').classList.add('on'); $('#veil').classList.add('on'); $('#veil').onclick = palClose; var i = $('#palIn'); i.value = ''; palRender(palBase('')); setTimeout(function () { i.focus(); }, 40); }
  function palClose() { $('#pal').classList.remove('on'); if (!$('#drawer').classList.contains('on') && !$('#modal').classList.contains('on')) $('#veil').classList.remove('on'); $('#veil').onclick = drawerVeil; }
  function palMove(d) { var els = $$('#palRes .it'); if (!els.length) return; palSel = (palSel + d + els.length) % els.length; els.forEach(function (e, i) { e.classList.toggle('sel', i === palSel); }); els[palSel].scrollIntoView({ block: 'nearest' }); }

  /* ───────── Arranque ───────── */
  function lock(title, text, extra) {
    $('#gnav').innerHTML = ''; $('#mnav').innerHTML = '';
    $('#ws').innerHTML = '<div class="lock panel"><div class="brand-logo-icon" style="margin:0 auto 16px;width:54px;height:54px;font-size:1.5rem">K</div><h2 class="ctx-title" style="font-size:1.2rem">' + esc(title) + '</h2><p class="muted" style="margin:10px 0 18px;line-height:1.6">' + esc(text) + '</p>' + (extra || '') + '<a class="btn pri" href="app.html" style="text-decoration:none">← Volver a la app</a></div>';
  }
  async function waitSession() {
    for (var i = 0; i < 16; i++) {
      try { var c = B && B.getClient && B.getClient(); if (c && c.auth) { var r = await c.auth.getSession(); if (r && r.data && r.data.session) return r.data.session; } } catch (e) {}
      await new Promise(function (r) { setTimeout(r, 400); });
    }
    return null;
  }
  KGP.start = async function () {
    try { document.body.setAttribute('data-role', ['athlete', 'staff', 'scout'].indexOf(localStorage.getItem('kinet_active_role')) >= 0 ? localStorage.getItem('kinet_active_role') : 'athlete'); } catch (e) {}
    if (!B || !G) { lock('No se pudo cargar', 'Falta un archivo de la app. Recarga la página.'); return; }
    var sess = await waitSession();
    if (!sess) { lock('Necesitas iniciar sesión', 'Este panel solo se abre con una sesión válida de tu cuenta de equipo.', '<a class="btn" href="login.html" style="text-decoration:none;margin-right:8px">Iniciar sesión</a>'); return; }
    var r = '';
    try { r = await B.adminRpc('kinet_my_staff_role', {}); } catch (e) {
      if (/07_gestion/.test(e.message)) { lock('Falta preparar el servidor', 'Ejecuta supabase/07_gestion.sql en Supabase → SQL Editor y recarga esta página.'); return; }
      lock('No se pudo comprobar tu rango', e.message || ''); return;
    }
    r = String(r || '').toLowerCase();
    if (G.role() !== r) { try { if (r) localStorage.setItem('kinet_staff_admin_role', r); else localStorage.removeItem('kinet_staff_admin_role'); } catch (e) {} }
    if (!G.canSee(r, { roles: ['all'] }) || !r) { lock('Acceso restringido', 'Tu cuenta no tiene un rango de equipo. Si deberías tenerlo, pídeselo a la dirección.'); return; }
    myRole = r;
    $('#tbRole').textContent = (G.ROLE_NAMES[r] || r).toUpperCase();
    $('#tipRole').textContent = 'Rango: ' + (G.ROLE_NAMES[r] || r) + '. Solo ves las secciones de tu equipo. Cada acción la valida el servidor y queda en la auditoría.';
    renderNav();
    window.addEventListener('hashchange', route);
    $('#openPal').onclick = palOpen;
    $('#palIn').oninput = function () { palSearch(this.value.trim()); };
    $('#palRes').onclick = function (e) { var it = e.target.closest('.it'); if (!it) return; var x = palItems[+it.getAttribute('data-i')]; palClose(); if (x) x.run(); };
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#pal').classList.contains('on') ? palClose() : palOpen(); return; }
      if (e.key === 'Escape') { palClose(); H.closeDrawer(); }
      if ($('#pal').classList.contains('on')) {
        if (e.key === 'ArrowDown') { e.preventDefault(); palMove(1); } else if (e.key === 'ArrowUp') { e.preventDefault(); palMove(-1); }
        else if (e.key === 'Enter') { var x = palItems[palSel]; if (x) { e.preventDefault(); palClose(); x.run(); } }
      }
    });
    // Brillo que sigue al cursor en tarjetas y menú
    document.addEventListener('mousemove', function (e) {
      var el = e.target.closest && e.target.closest('.panel, .side-link'); if (!el) return;
      var b = el.getBoundingClientRect(); el.style.setProperty('--mouse-x', (e.clientX - b.left) + 'px'); el.style.setProperty('--mouse-y', (e.clientY - b.top) + 'px');
    }, { passive: true });
    route();
  };
  var st = document.createElement('style');
  st.textContent = '@keyframes kgDraw{to{stroke-dashoffset:0}}@keyframes kgFade{to{opacity:1}}@keyframes kgGrow{to{transform:scaleY(1)}}';
  document.head.appendChild(st);
})();
