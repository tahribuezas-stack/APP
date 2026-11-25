/* KINET OS · navegador de temas del blog: órbita → dock de contenidos / engranaje → baraja de "cómo funciona". Sin dependencias. */
(function () {
  'use strict';
  var stage = document.getElementById('kbn-stage'), dEl = document.getElementById('kbn-data');
  if (!stage || !dEl) return;
  var D; try { D = JSON.parse(dEl.textContent); } catch (e) { return; }
  var T = D.topics, IT = D.items;
  var RM = false, FINE = false;
  try { RM = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  try { FINE = matchMedia('(hover:hover) and (pointer:fine)').matches; } catch (e) {}
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var LOGO = '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M30 28H40V47L57 28H71L50 50L72 72H58L40 53V72H30Z" fill="#04060A"/></svg>';
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  stage.hidden = false;
  var host = stage.parentNode; if (host && host.classList) host.classList.add('kbs-on');
  var face = function (c) { return '<i class="f ' + c + '">' + (/s/.test(c) ? LOGO : '') + '</i>'; };
  stage.innerHTML = '<div class="kbn-spot" aria-hidden="true"></div><div class="kbn-floor" aria-hidden="true"></div>' +
    '<div class="kbn-rings" aria-hidden="true"><i></i><i></i></div>' +
    '<div class="kbn-core" aria-hidden="true"><div class="cube">' + face('fs fa') + face('fs fb') + face('fs fc') + face('fs fd') + face('fe') + face('ff') + '</div><span>Elige un tema</span></div>' +
    '<div class="kbn-hint" id="kbn-hint" aria-live="polite"></div>' +
    '<div class="kbn-sel"><h3 id="kbn-t"></h3><p id="kbn-s"></p><button type="button" class="kbn-back" id="kbn-back">' + ARROW + '<span>Todos los temas</span></button></div>' +
    '<div class="kbn-dock" id="kbn-dock"></div><div class="kbn-fan" id="kbn-fan"></div>';
  var ringEls = stage.querySelectorAll('.kbn-rings i'), core = stage.querySelector('.kbn-core'), floor = stage.querySelector('.kbn-floor'), hint = document.getElementById('kbn-hint');
  var dock = document.getElementById('kbn-dock'), fan = document.getElementById('kbn-fan');
  var selT = document.getElementById('kbn-t'), selS = document.getElementById('kbn-s'), backB = document.getElementById('kbn-back');
  var HINT0 = FINE ? 'Pasa el cursor por un tema, o púlsalo' : 'Toca un tema para explorarlo';

  /* ───── nodos ───── */
  var RING = { futbol: [1, 0], tenis: [1, 1], fuerza: [1, 2], carrera: [1, 3], tools: [0, 0], how: [0, 1], cardio: [0, 2] };
  var nodes = T.map(function (tp, i) {
    var cnt = tp.how ? 'Descúbrelo' : (tp.items.length + (tp.items.length === 1 ? ' contenido' : ' contenidos'));
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'nd'; b.style.setProperty('--c', tp.c);
    b.setAttribute('aria-label', tp.n + ': ' + cnt);
    b.innerHTML = '<span class="sh"></span><span class="orb">' + tp.ico + '</span><span class="lb">' + esc(tp.n) + '<small>' + cnt + '</small></span>';
    stage.appendChild(b);
    var r = RING[tp.id] || [1, i];
    return { el: b, tp: tp, ring: r[0], idx: r[1], x: 0, y: 0, s: 0, o: 0, vx: 0, vy: 0, vs: 0, delay: 120 + i * 95 };
  });
  var perRing = [0, 0]; nodes.forEach(function (n) { perRing[n.ring]++; });
  nodes.forEach(function (n) { n.a0 = (Math.PI * 2 * n.idx / perRing[n.ring]) + n.ring * .6 - Math.PI / 2; });

  /* partículas que viajan por las órbitas (dan la sensación de profundidad) */
  var parts = [];
  for (var pi = 0; pi < 16; pi++) {
    var pe = document.createElement('i'); pe.className = 'pt'; stage.appendChild(pe);
    parts.push({ el: pe, ring: pi % 2, a0: Math.random() * 6.283, k: (.7 + Math.random() * .9) * (pi % 3 ? 1 : -1), sz: 2 + Math.random() * 2.6 });
    pe.style.setProperty('--s', parts[pi].sz + 'px'); pe.style.setProperty('--c', T[pi % T.length].c);
  }

  var W = 0, H = 0, cx = 0, cy = 0, M = false, WIDE = false, R = [];
  function layout() {
    W = stage.clientWidth; H = stage.clientHeight; M = W < 640; WIDE = W >= 1000;
    cx = WIDE ? W * .685 : W / 2; cy = M ? H * .5 + 6 : (WIDE ? H * .52 : H * .5 + 14);
    if (M) { R = [{ rx: W * .27, ry: 118 }, { rx: W * .4, ry: Math.min(H / 2 - 96, 232) }]; }
    else if (WIDE) { var o = Math.min(W * .27, 470), ro = Math.min(o * .6, H / 2 - 104); R = [{ rx: o * .5, ry: ro * .52 }, { rx: o, ry: ro }]; }
    else { var o2 = W * .38; R = [{ rx: o2 * .52, ry: 118 }, { rx: o2, ry: Math.min(H / 2 - 100, o2 * .52) }]; }
    ringEls.forEach(function (e, i) { e.style.width = R[i].rx * 2 + 'px'; e.style.height = R[i].ry * 2 + 'px'; e.style.left = cx + 'px'; e.style.top = cy + 'px'; });
    core.style.top = cy + 'px'; core.style.left = cx + 'px';
    floor.style.left = cx + 'px'; floor.style.top = (cy + R[1].ry * .55) + 'px'; floor.style.width = R[1].rx * 2.7 + 'px'; floor.style.height = R[1].rx * 2.7 + 'px';
    hint.style.left = (WIDE ? cx : W / 2) + 'px';
    stage.style.setProperty('--cx', cx + 'px'); stage.style.setProperty('--cy', cy + 'px');
  }
  layout();
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(stage); else addEventListener('resize', layout);

  /* ───── estado ───── */
  var mode = 'orbit', selNode = null, hov = null, t = 0, ts = 1, live = false, t0 = 0, last = 0, ox = 0, oy = 0, px = 0, py = 0, tilt = 0, tiltT = 0;
  var SP = [-.00021, .00013];

  function project(a, r) {      /* posición en la elipse inclinada: dep 0 = al fondo, 1 = al frente */
    var dep = (Math.sin(a) + 1) / 2, ryk = r.ry * (1 + tilt);
    return { x: cx + ox * (.5 + dep * .5) + Math.cos(a) * r.rx, y: cy + oy * (.5 + dep * .5) + Math.sin(a) * ryk, dep: dep };
  }
  function target(n, now) {
    if (!live || (!RM && now - t0 < n.delay)) return { x: cx, y: cy, s: 0, o: 0 };
    if (mode !== 'orbit') {
      if (n === selNode) return { x: W / 2, y: M ? 78 : 112, s: M ? 1.25 : 1.4, o: 1 };
      var ex = W / 2, dx = n.x - ex, dy = n.y - cy, d = Math.sqrt(dx * dx + dy * dy) || 1, far = Math.max(W, H) * .85;
      return { x: ex + dx / d * far, y: cy + dy / d * far, s: .3, o: 0 };
    }
    var a = n.a0 + t * SP[n.ring], p = project(a, R[n.ring]), dep = p.dep;
    var s = (M ? .66 : .68) + (M ? .42 : .5) * dep, o = .42 + .58 * dep, bob = RM ? 0 : Math.sin(now / 1100 + n.a0 * 2.7) * 4;
    if (hov) { if (hov === n) { s = Math.max(s, .98) * 1.22; o = 1; } else { o *= .42; } }
    return { x: p.x, y: p.y + bob, s: s, o: o, z: 4 + Math.round(dep * 12) + (hov === n ? 30 : 0), dep: dep };
  }

  function spring(n, tg, dt) {
    if (RM) { n.x = tg.x; n.y = tg.y; n.s = tg.s; n.o = tg.o; return; }
    var k = 170, d = 17;
    n.vx += ((tg.x - n.x) * k - n.vx * d) * dt; n.x += n.vx * dt;
    n.vy += ((tg.y - n.y) * k - n.vy * d) * dt; n.y += n.vy * dt;
    n.vs += ((tg.s - n.s) * k - n.vs * d) * dt; n.s += n.vs * dt;
    n.o += (tg.o - n.o) * Math.min(1, dt * 9);
  }
  function paint(n, tg) {
    var s = Math.max(0, n.s);
    n.el.style.transform = 'translate3d(' + n.x.toFixed(1) + 'px,' + n.y.toFixed(1) + 'px,0) translate(-50%,-50%) scale(' + s.toFixed(3) + ')';
    n.el.style.opacity = Math.max(0, Math.min(1, n.o)).toFixed(2);
    n.el.style.zIndex = n === selNode ? 40 : (tg.z || 1);
    n.el.style.pointerEvents = (n.o < .3 || mode !== 'orbit') ? 'none' : '';
    n.el.style.visibility = n.o < .01 && n.s < .05 ? 'hidden' : '';
  }
  function paintParts(now) {
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i], a = p.a0 + t * SP[p.ring] * p.k * 2.2, q = project(a, R[p.ring]), vis = mode === 'orbit' && live;
      p.el.style.transform = 'translate3d(' + q.x.toFixed(1) + 'px,' + q.y.toFixed(1) + 'px,0) translate(-50%,-50%) scale(' + (.5 + q.dep * .9).toFixed(2) + ')';
      p.el.style.opacity = vis ? (.18 + q.dep * .82).toFixed(2) : '0';
      p.el.style.zIndex = q.dep > .5 ? 14 : 2;
    }
  }

  function frame(now) {
    if (!running) return;
    var dt = Math.min(.033, (now - (last || now)) / 1000); var rdt = dt * 1000; last = now;
    ts += ((hov || mode !== 'orbit' ? .08 : 1) - ts) * Math.min(1, dt * 6);
    if (!RM) t += rdt * ts;
    ox += (px - ox) * .06; oy += (py - oy) * .06; tilt += (tiltT - tilt) * .06;
    stage.style.setProperty('--px', ox.toFixed(1)); stage.style.setProperty('--py', oy.toFixed(1)); stage.style.setProperty('--tl', (tilt * 100).toFixed(1));
    for (var i = 0; i < nodes.length; i++) { var n = nodes[i], tg = target(n, now); spring(n, tg, dt); paint(n, tg); }
    paintParts(now);
    var cs = mode === 'orbit' ? (live ? '1' : '0') : '0'; if (core.style.opacity !== cs) core.style.opacity = cs;
    requestAnimationFrame(frame);
  }
  var running = false;
  function start() { if (running) return; running = true; last = 0; requestAnimationFrame(frame); }

  /* ───── hover / selección ───── */
  nodes.forEach(function (n) {
    function hot(on) { if (on) { hov = n; n.el.classList.add('hot'); stage.style.setProperty('--hc', n.tp.c); hint.innerHTML = '<b style="color:' + n.tp.c + '">' + esc(n.tp.n) + '</b> · ' + esc(n.tp.sub); hint.classList.add('on'); } else { if (hov === n) hov = null; n.el.classList.remove('hot'); hint.classList.remove('on'); if (!hov) hint.innerHTML = HINT0; } }
    n.el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && mode === 'orbit') hot(true); });
    n.el.addEventListener('pointerleave', function () { hot(false); });
    n.el.addEventListener('focus', function () { if (mode === 'orbit') hot(true); });
    n.el.addEventListener('blur', function () { hot(false); });
    n.el.addEventListener('click', function () { choose(n); });
  });
  hint.innerHTML = HINT0; hint.classList.add('on');
  if (FINE) stage.addEventListener('pointermove', function (e) {
    var r = stage.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
    stage.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px'); stage.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px'); stage.classList.add('lit');
    if (!RM) { px = nx * 56; py = ny * 30; tiltT = -ny * .3; }
  }, { passive: true });
  stage.addEventListener('pointerleave', function () { px = 0; py = 0; tiltT = 0; stage.classList.remove('lit'); });

  function choose(n) {
    if (mode !== 'orbit') return;
    selNode = n; hov = null; n.el.classList.remove('hot'); n.el.classList.add('burst', 'sel', 'spin');
    var tp = n.tp; mode = tp.how ? 'how' : 'topic'; stage.dataset.mode = mode; stage.style.setProperty('--tc', tp.c);
    selT.textContent = tp.n; selS.textContent = tp.sub;
    if (tp.how) buildFan(tp); else buildDock(tp);
    var wait = RM ? 0 : 700;
    setTimeout(function () {
      stage.classList.add('open');
      requestAnimationFrame(function () { dock.classList.add('is-in'); fan.classList.add('is-in'); });
      try { backB.focus({ preventScroll: true }); } catch (e) {}
    }, wait);
    setTimeout(function () { n.el.classList.remove('burst', 'spin'); }, 1200);
    var r = stage.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) stage.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
  }
  function back() {
    if (mode === 'orbit') return;
    var n = selNode;
    dock.classList.remove('is-in'); fan.classList.remove('is-in'); stage.classList.remove('open');
    setTimeout(function () {
      mode = 'orbit'; stage.dataset.mode = 'orbit'; if (n) n.el.classList.remove('sel'); selNode = null;
      dock.innerHTML = ''; fan.innerHTML = '';
      try { n && n.el.focus({ preventScroll: true }); } catch (e) {}
    }, RM ? 0 : 380);
  }
  backB.addEventListener('click', back);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mode !== 'orbit') back(); });

  /* ───── dock ───── */
  function buildDock(tp) {
    var h = '', i = 0;
    tp.items.forEach(function (s) {
      var it = IT[s]; if (!it) return;
      h += '<a class="dk" href="' + it.u + '" style="--c:' + it.col + ';--dl:' + (i * 85) + 'ms;--r0:' + ((i % 2 ? 1 : -1) * (4 + i)) + 'deg">' +
        '<span class="dk-cv">' + it.cv + '</span><span class="dk-b"><span class="dk-k">' + (it.k === 'a' ? 'Artículo' : 'Herramienta') + '<em>' + (it.k === 'a' ? it.m + ' min' : 'Gratis') + '</em></span>' +
        '<b>' + esc(it.t) + '</b><span class="dk-d">' + esc(it.d) + '</span><span class="dk-go">' + (it.k === 'a' ? 'Leer' : 'Usar ahora') + ' ' + ARROW + '</span></span></a>';
      i++;
    });
    h += '<a class="dk dk-app" href="/?utm_source=blog&utm_medium=nav&utm_campaign=' + tp.id + '" style="--c:#00FF88;--dl:' + (i * 85) + 'ms;--r0:5deg"><span class="dk-lg">' + LOGO + '</span><b>Llévalo a la práctica</b><span class="dk-p">Cuerpo técnico de IA, KINET Card y análisis táctico. Gratis para empezar.</span><span class="dk-go">Abrir KINET OS ' + ARROW + '</span></a>';
    dock.innerHTML = h;
    dock.scrollLeft = 0;
  }
  var dcards = function () { return [].slice.call(dock.querySelectorAll('.dk')); };
  if (FINE && !RM) {
    dock.addEventListener('pointermove', function (e) {
      if (!dock.classList.contains('is-in')) return;
      dcards().forEach(function (c) {
        var r = c.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), s = 1 + .16 * Math.exp(-Math.pow(dx / 190, 2));
        c.style.scale = s.toFixed(3); c.style.translate = '0 ' + (-(s - 1) * 70).toFixed(1) + 'px';
      });
    });
    dock.addEventListener('pointerleave', function () { dcards().forEach(function (c) { c.style.scale = ''; c.style.translate = ''; }); });
  }

  /* ───── baraja (cómo funciona) ───── */
  function buildFan(tp) {
    var n = tp.how.length, step = Math.min(W >= 1000 ? 236 : 168, Math.max(M ? 26 : 46, (W - (M ? 220 : (W >= 1000 ? 300 : 240))) / (n - 1))), h = '';
    tp.how.forEach(function (c, i) {
      var m = i - (n - 1) / 2;
      h += '<a class="fc" href="' + c.u + '" style="--c:' + c.c + ';--x:' + (m * step).toFixed(1) + 'px;--r:' + (m * (M ? 3 : 7)).toFixed(1) + 'deg;--y:' + (m * m * (M ? 4 : 6)).toFixed(1) + 'px;--dl:' + (i * 90) + 'ms;z-index:' + (i + 1) + '">' +
        '<span class="fc-code">' + c.code + '</span><b>' + esc(c.t) + '</b><span class="fc-d">' + esc(c.d) + '</span><span class="dk-go">Verlo en KINET ' + ARROW + '</span></a>';
    });
    fan.innerHTML = h;
    if (!FINE) [].forEach.call(fan.querySelectorAll('.fc'), function (c) {   /* táctil: el primer toque trae la carta al frente, el segundo la abre */
      c.addEventListener('click', function (e) {
        if (c.classList.contains('top')) return;
        e.preventDefault(); [].forEach.call(fan.querySelectorAll('.fc'), function (x) { x.classList.remove('top'); }); c.classList.add('top');
      });
    });
  }

  /* ───── arranque cuando entra en pantalla ───── */
  function go() { if (live) return; live = true; t0 = performance.now(); start(); }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { go(); start(); } else { running = false; }
      });
    }, { threshold: .15 });
    io.observe(stage);
  } else go();
  document.addEventListener('visibilitychange', function () { if (document.hidden) running = false; else if (live) start(); });
})();
