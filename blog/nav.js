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
  stage.innerHTML = '<div class="kbn-rings" aria-hidden="true"><i></i><i></i></div>' +
    '<div class="kbn-core" aria-hidden="true"><b>' + LOGO + '</b><span>Elige un tema</span></div>' +
    '<div class="kbn-sel"><h3 id="kbn-t"></h3><p id="kbn-s"></p><button type="button" class="kbn-back" id="kbn-back">' + ARROW + '<span>Todos los temas</span></button></div>' +
    '<div class="kbn-dock" id="kbn-dock"></div><div class="kbn-fan" id="kbn-fan"></div>';
  var ringEls = stage.querySelectorAll('.kbn-rings i'), core = stage.querySelector('.kbn-core');
  var dock = document.getElementById('kbn-dock'), fan = document.getElementById('kbn-fan');
  var selT = document.getElementById('kbn-t'), selS = document.getElementById('kbn-s'), backB = document.getElementById('kbn-back');

  /* ───── nodos ───── */
  var RING = { futbol: [1, 0], tenis: [1, 1], fuerza: [1, 2], carrera: [1, 3], tools: [0, 0], how: [0, 1], cardio: [0, 2] };
  var nodes = T.map(function (tp, i) {
    var cnt = tp.how ? 'Descúbrelo' : (tp.items.length + (tp.items.length === 1 ? ' contenido' : ' contenidos'));
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'nd'; b.style.setProperty('--c', tp.c);
    b.setAttribute('aria-label', tp.n + ': ' + cnt);
    b.innerHTML = '<span class="orb">' + tp.ico + '</span><span class="lb">' + esc(tp.n) + '<small>' + cnt + '</small></span>';
    stage.appendChild(b);
    var r = RING[tp.id] || [1, i];
    return { el: b, tp: tp, ring: r[0], idx: r[1], x: 0, y: 0, s: 0, o: 0, vx: 0, vy: 0, vs: 0, delay: 120 + i * 95 };
  });
  var perRing = [0, 0]; nodes.forEach(function (n) { perRing[n.ring]++; });
  nodes.forEach(function (n) { n.a0 = (Math.PI * 2 * n.idx / perRing[n.ring]) + n.ring * .6 - Math.PI / 2; });

  var W = 0, H = 0, cx = 0, cy = 0, M = false, R = [];
  function layout() {
    W = stage.clientWidth; H = stage.clientHeight; M = W < 640; cx = W / 2; cy = H / 2 + (M ? 18 : 10);
    if (M) { R = [{ rx: W * .27, ry: 122 }, { rx: W * .4, ry: Math.min(H / 2 - 92, 236) }]; }
    else { R = [{ rx: Math.min(W * .2, 200), ry: 120 }, { rx: Math.min(W * .4, 440), ry: Math.min(H / 2 - 78, 236) }]; }
    ringEls.forEach(function (e, i) { e.style.width = R[i].rx * 2 + 'px'; e.style.height = R[i].ry * 2 + 'px'; e.style.top = cy + 'px'; });
    core.style.top = cy + 'px';
  }
  layout();
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(stage); else addEventListener('resize', layout);

  /* ───── estado ───── */
  var mode = 'orbit', selNode = null, hov = null, t = 0, ts = 1, live = false, t0 = 0, last = 0, ox = 0, oy = 0, px = 0, py = 0;
  var SP = [-.00021, .00013];

  function target(n, now) {
    if (!live || (!RM && now - t0 < n.delay)) return { x: cx, y: cy, s: 0, o: 0 };
    if (mode !== 'orbit') {
      if (n === selNode) return { x: cx, y: M ? 70 : 88, s: M ? 1.3 : 1.5, o: 1 };
      var dx = n.x - cx, dy = n.y - cy, d = Math.sqrt(dx * dx + dy * dy) || 1, far = Math.max(W, H) * .85;
      return { x: cx + dx / d * far, y: cy + dy / d * far, s: .3, o: 0 };
    }
    var a = n.a0 + t * SP[n.ring], r = R[n.ring], dep = (Math.sin(a) + 1) / 2;
    var s = (M ? .82 : .86) + .22 * dep, o = 1;
    if (hov) { if (hov === n) { s *= 1.22; } else { o = .5; } }
    return { x: cx + ox + Math.cos(a) * r.rx, y: cy + oy + Math.sin(a) * r.ry, s: s, o: o, z: Math.round(dep * 10) + (hov === n ? 30 : 0) };
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
    n.el.style.pointerEvents = (n.o < .35 || mode !== 'orbit') ? 'none' : '';
    n.el.style.visibility = n.o < .01 && n.s < .05 ? 'hidden' : '';
  }

  function frame(now) {
    if (!running) return;
    var dt = Math.min(.033, (now - (last || now)) / 1000); var rdt = dt * 1000; last = now;
    ts += ((hov || mode !== 'orbit' ? .08 : 1) - ts) * Math.min(1, dt * 6);
    if (!RM) t += rdt * ts;
    ox += (px - ox) * .05; oy += (py - oy) * .05;
    for (var i = 0; i < nodes.length; i++) { var n = nodes[i], tg = target(n, now); spring(n, tg, dt); paint(n, tg); }
    core.style.opacity = mode === 'orbit' ? (live ? '1' : '0') : '0';
    requestAnimationFrame(frame);
  }
  var running = false;
  function start() { if (running) return; running = true; last = 0; requestAnimationFrame(frame); }

  /* ───── hover / selección ───── */
  nodes.forEach(function (n) {
    n.el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && mode === 'orbit') { hov = n; n.el.classList.add('hot'); } });
    n.el.addEventListener('pointerleave', function () { if (hov === n) hov = null; n.el.classList.remove('hot'); });
    n.el.addEventListener('focus', function () { if (mode === 'orbit') { hov = n; n.el.classList.add('hot'); } });
    n.el.addEventListener('blur', function () { if (hov === n) hov = null; n.el.classList.remove('hot'); });
    n.el.addEventListener('click', function () { choose(n); });
  });
  if (FINE && !RM) stage.addEventListener('pointermove', function (e) {
    var r = stage.getBoundingClientRect(); px = ((e.clientX - r.left) / r.width - .5) * 26; py = ((e.clientY - r.top) / r.height - .5) * 16;
  }, { passive: true });
  stage.addEventListener('pointerleave', function () { px = 0; py = 0; });

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
        '<b>' + esc(it.t) + '</b><span class="dk-go">' + (it.k === 'a' ? 'Leer' : 'Usar ahora') + ' ' + ARROW + '</span></span></a>';
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
    var n = tp.how.length, step = Math.min(168, Math.max(M ? 26 : 46, (W - (M ? 220 : 240)) / (n - 1))), h = '';
    tp.how.forEach(function (c, i) {
      var m = i - (n - 1) / 2;
      h += '<a class="fc" href="' + c.u + '" style="--c:' + c.c + ';--x:' + (m * step).toFixed(1) + 'px;--r:' + (m * (M ? 3 : 7)).toFixed(1) + 'deg;--y:' + (m * m * (M ? 4 : 9)).toFixed(1) + 'px;--dl:' + (i * 90) + 'ms;z-index:' + (i + 1) + '">' +
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
