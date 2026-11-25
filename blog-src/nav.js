/* KINET OS · órbita de temas del blog (galaxia 3D de partículas + planetas) → dock de contenidos / baraja "cómo funciona".
   Proyección 3D real (guiñada, cabeceo, perspectiva), rotación diferencial, planetas con textura, anillos y lunas.
   Elegir un tema = salto espacial (rayas de luz) y aterrizaje en su dock. Sin dependencias. */
(function () {
  'use strict';
  var stage = document.getElementById('kbn-stage'), dEl = document.getElementById('kbn-data');
  if (!stage || !dEl) return;
  var D; try { D = JSON.parse(dEl.textContent); } catch (e) { return; }
  var T = D.topics, IT = D.items || {};
  var RM = false, FINE = false, LOW = false;
  try { RM = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  try { FINE = matchMedia('(hover:hover) and (pointer:fine)').matches; } catch (e) {}
  try { LOW = (navigator.hardwareConcurrency || 8) <= 2; } catch (e) {}
  var TAU = Math.PI * 2;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var KLOGO = '<span class="kmark" aria-hidden="true">K</span>';
  var hexRgb = function (c) { var n = parseInt(String(c).replace('#', ''), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };

  stage.hidden = false;
  var host = stage.parentNode; if (host && host.classList) host.classList.add('kbs-on');
  stage.innerHTML = '<canvas class="kbn-cv" aria-hidden="true"></canvas><div class="kbn-spot" aria-hidden="true"></div>' +
    '<div class="kbn-core" aria-hidden="true"><i class="rp"></i><i class="rp r2"></i><div class="sun">' + KLOGO + '</div><span class="cl">' + (D.coreLabel || 'Elige un tema') + '</span></div>' +
    '<div class="kbn-hint" id="kbn-hint" aria-live="polite"></div>' +
    '<div class="kbn-sel"><h3 id="kbn-t"></h3><p id="kbn-s"></p><button type="button" class="kbn-back" id="kbn-back">' + ARROW + '<span>Volver a la órbita</span></button></div>' +
    '<div class="kbn-dock" id="kbn-dock"></div><div class="kbn-fan" id="kbn-fan"></div><div class="kbn-flash" aria-hidden="true"></div>';
  var cvs = stage.querySelector('.kbn-cv'), ctx = cvs.getContext('2d');
  var core = stage.querySelector('.kbn-core'), hint = document.getElementById('kbn-hint');
  var dock = document.getElementById('kbn-dock'), fan = document.getElementById('kbn-fan');
  var selT = document.getElementById('kbn-t'), selS = document.getElementById('kbn-s'), backB = document.getElementById('kbn-back');
  var HINT0 = FINE ? 'Arrastra para girar la órbita · pasa el cursor por un planeta' : 'Desliza para girar · toca un planeta para explorarlo';

  /* ───── planetas ───── */
  var RING = { futbol: [1, 0], tenis: [1, 1], fuerza: [1, 2], carrera: [1, 3], tools: [0, 0], how: [0, 1], cardio: [0, 2], juegos: [0, 3] };
  var RINGED = { fuerza: 1, tools: 1, how: 1 }, MOONS = { futbol: 1, tenis: 1, cardio: 1, carrera: 1, how: 0 };
  var ringCount = [0, 0];
  var nodes = T.map(function (tp, i) {
    var cnt = tp.how ? 'Descúbrelo' : (tp.items ? tp.items.length + (tp.items.length === 1 ? ' contenido' : ' contenidos') : 'Abrir');
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'pl'; b.style.setProperty('--c', tp.c); b.dataset.v = i % 4; b.dataset.id = tp.id;
    b.setAttribute('aria-label', tp.n + ': ' + cnt);
    var ringed = RINGED[tp.id] || tp.ring, moon = MOONS[tp.id] || tp.moon;
    b.innerHTML = '<span class="pl-halo"></span>' + (ringed ? '<span class="pl-rg b"></span>' : '') +
      '<span class="pl-art">' + (window.KBArt ? KBArt.svg(tp.m || 'calc', tp.c) : tp.ico) + '</span>' +
      (ringed ? '<span class="pl-rg f"></span>' : '') + (moon ? '<span class="pl-moon"></span>' : '') +
      '<span class="lb">' + esc(tp.n) + '<small>' + cnt + '</small></span>';
    stage.appendChild(b);
    var r = RING[tp.id] || [tp.r === 0 ? 0 : 1, 0]; if (!RING[tp.id]) r[1] = ringCount[r[0]]++;
    return { el: b, tp: tp, moon: moon ? b.querySelector('.pl-moon') : null, ring: r[0], idx: r[1], x: 0, y: 0, s: 0, o: 0, vx: 0, vy: 0, vs: 0, delay: 140 + i * 105, ph: Math.random() * TAU, ms: .0011 + Math.random() * .0007, lo: 1 };
  });
  var perRing = [0, 0]; nodes.forEach(function (n) { perRing[n.ring]++; });
  nodes.forEach(function (n) { n.a0 = (TAU * n.idx / perRing[n.ring]) + n.ring * .7 - 1.2; n.w = n.ring ? .000115 : .00021; });

  /* ───── geometría ───── */
  var W = 0, H = 0, CW = 0, CH = 0, OX = 0, OY = 0, DPR = 1, cx = 0, cy = 0, cxT = 0, cyT = 0, M = false, WIDE = false, RMAX = 300, R = [0, 0], PS = .55, NZ = 96, F = 1500;
  var PCOL = ['rgba(210,232,255,', 'rgba(0,255,136,', 'rgba(34,211,238,', 'rgba(167,139,250,'];
  var parts = [], neb = [], sprites = [], glow = null;
  function gauss() { return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; }
  function build() {
    var N = M ? 3600 : (LOW ? 4800 : 9500); parts = [];
    for (var g = 0; g < 4; g++) parts.push([]);
    for (var i = 0; i < N; i++) {
      var kind = Math.random(), r, th, yy;
      if (kind < .62) {                                   /* brazos espirales */
        r = 24 + Math.pow(Math.random(), .58) * (RMAX - 24); th = (i % 3) / 3 * TAU + (r / RMAX) * 3.8 + gauss() * (.2 + .34 * (r / RMAX)); yy = gauss() * 20 * (1 - .65 * r / RMAX);
      } else if (kind < .85) {                            /* bulbo central */
        r = 10 + Math.pow(Math.random(), 1.5) * RMAX * .34; th = Math.random() * TAU; yy = gauss() * 46 * (1 - r / (RMAX * .4));
      } else {                                            /* polvo disperso */
        r = RMAX * (.12 + Math.random() * .88); th = Math.random() * TAU; yy = gauss() * 14;
      }
      var f = r / RMAX, gi = f < .26 ? (Math.random() < .72 ? 0 : 1) : (Math.random() < .3 ? 0 : (Math.random() < .42 ? 1 : (Math.random() < .55 ? 2 : 3)));
      parts[gi].push({ r: r, th: th, y: yy, s: (Math.random() < .05 ? 2.4 : 1) * (.55 + Math.random() * .9) * (f < .3 ? .85 : 1), a: .4 + Math.random() * .6, w: .00017 * Math.pow(RMAX / (r + 46), .82), tw: Math.random() < .12 ? Math.random() * TAU : -1 });
    }
    neb = [];
    for (var j = 0; j < (M ? 12 : 22); j++) {
      var rr = 60 + Math.random() * (RMAX - 80), tt = (j % 3) / 3 * TAU + (rr / RMAX) * 3.8 + gauss() * .25;
      neb.push({ r: rr, th: tt, c: j % 4 === 0 ? 1 : (j % 4 === 1 ? 2 : 3), z: (80 + Math.random() * 130) * (RMAX / 380), a: .06 + Math.random() * .08, w: .00017 * Math.pow(RMAX / (rr + 46), .82) });
    }
    sprites = [null, 1, 2, 3].map(function (c) {
      if (!c) return null; var s = document.createElement('canvas'); s.width = s.height = 128; var x = s.getContext('2d'), g2 = x.createRadialGradient(64, 64, 0, 64, 64, 64), cc = PCOL[c];
      g2.addColorStop(0, cc + '.9)'); g2.addColorStop(.4, cc + '.28)'); g2.addColorStop(1, cc + '0)'); x.fillStyle = g2; x.fillRect(0, 0, 128, 128); return s;
    });
    var gs = document.createElement('canvas'); gs.width = gs.height = 256; var gx = gs.getContext('2d'), gg = gx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gg.addColorStop(0, 'rgba(255,255,255,.95)'); gg.addColorStop(.08, 'rgba(210,255,235,.7)'); gg.addColorStop(.26, 'rgba(0,255,136,.2)'); gg.addColorStop(.6, 'rgba(0,180,110,.05)'); gg.addColorStop(1, 'rgba(0,255,136,0)');
    gx.fillStyle = gg; gx.fillRect(0, 0, 256, 256); glow = gs;
  }
  function layout() {
    W = stage.clientWidth; H = stage.clientHeight; if (!W || !H) return;
    M = W < 640; WIDE = W >= 1160;
    /* el lienzo es más grande que el escenario (sin bordes visibles): se extiende a todo el ancho de la ventana y 170px arriba y abajo */
    var vw = document.documentElement.clientWidth || W; OX = Math.max(0, Math.round((vw - W) / 2)); OY = M ? 90 : 170;
    CW = W + OX * 2; CH = H + OY * 2;
    DPR = Math.min(window.devicePixelRatio || 1, M ? 1.5 : 1.25, Math.sqrt((M ? 2.2e6 : 2.6e6) / (CW * CH)));
    cvs.width = Math.round(CW * DPR); cvs.height = Math.round(CH * DPR); ctx.setTransform(DPR, 0, 0, DPR, OX * DPR, OY * DPR);
    cvs.style.cssText = 'left:' + (-OX) + 'px;top:' + (-OY) + 'px;width:' + CW + 'px;height:' + CH + 'px';
    stage.style.setProperty('--ox', OX + 'px'); stage.style.setProperty('--oy', OY + 'px');
    if (M) { R[1] = Math.min(W * .4, 170); PS = .62; NZ = 47; cxT = W / 2; cyT = H * .25; }
    else if (WIDE) { R[1] = Math.min(W * .27, (H / 2 - 112) / .5, 420); PS = .5; NZ = 82; cxT = W * .675; cyT = H * .52; }
    else { R[1] = Math.min(W * .36, 300); PS = .52; NZ = 74; cxT = W / 2; cyT = H * .52; }
    R[0] = R[1] * .6; RMAX = R[1] * (M ? 1.5 : 1.42);
    stage.style.setProperty('--nz', NZ + 'px');
    if (mode === 'orbit' || mode === 'travel') { cx = cxT; cy = cyT; } else { cxT = W / 2; cyT = H * .5; }
    build(); if (!cx) { cx = cxT; cy = cyT; }
    if (RM) draw(0);
  }

  /* ───── estado ───── */
  var mode = 'orbit', selNode = null, hov = null, t = 0, ts = 1, live = false, t0 = 0, last = 0;
  var sp = null, spP = 0, yawD = 0, yawV = 0, dragging = false, mxn = 0, myn = 0, mxs = 0, mys = 0, wp = 0, wpT = 0, tint = [0, 255, 136], tintT = [0, 255, 136];
  var stride = 1, ema = 16, qT = 0, yaw = 0, pitch = .55, cY = 1, sY = 0, cP = 1, sP = 0, out = { x: 0, y: 0, k: 1, z: 0 };

  function prj(x, y, z) {
    var x1 = x * cY - z * sY, z1 = x * sY + z * cY, y1 = y * cP - z1 * sP, z2 = y * sP + z1 * cP, k = F / (F + z2);
    out.x = cx + x1 * k; out.y = cy + y1 * k; out.k = k; out.z = z2; return out;
  }

  /* ───── dibujo del campo de partículas ───── */
  function draw(now) {
    ctx.clearRect(-OX, -OY, CW, CH);
    var fade = mode === 'topic' ? .5 : 1;
    /* halo del núcleo */
    var gs = (M ? 330 : 520) * (RMAX / 380), pc = prj(0, 0, 0), gx = pc.x, gy = pc.y;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = (.9 - wp * .45) * fade; ctx.drawImage(glow, gx - gs / 2, gy - gs / 2 * (PS * 1.5 + .25), gs, gs * (PS * 1.5 + .25));
    /* nebulosas */
    for (var j = 0; j < neb.length; j++) {
      var nb = neb[j], a = nb.th + t * nb.w, q = prj(Math.cos(a) * nb.r, 0, Math.sin(a) * nb.r), sz = nb.z * q.k * 2;
      ctx.globalAlpha = nb.a * fade * (1 - wp * .6); ctx.drawImage(sprites[nb.c], q.x - sz / 2, q.y - sz / 2 * (PS * 1.4 + .3), sz, sz * (PS * 1.4 + .3));
    }
    /* partículas */
    var warp = wp > .02, X = cx, Y = cy;
    for (var g = 0; g < parts.length; g++) {
      var arr = parts[g], base = PCOL[g], sk = Math.sqrt(stride);
      if (warp) { ctx.strokeStyle = base + (.55 + wp * .35).toFixed(2) + ')'; ctx.lineWidth = 1 + wp * .9; ctx.beginPath(); } else ctx.fillStyle = base + '1)';
      for (var i = 0; i < arr.length; i += stride) {
        var p = arr[i], ang = p.th + t * p.w, cr = Math.cos(ang) * p.r, sr = Math.sin(ang) * p.r;
        var x1 = cr * cY - sr * sY, z1 = cr * sY + sr * cY, y1 = p.y * cP - z1 * sP, z2 = p.y * sP + z1 * cP, k = F / (F + z2);
        var sx = cx + x1 * k, sy = cy + y1 * k;
        if (warp) {
          var dx = sx - X, dy = sy - Y, f0 = 1 - wp * .62, f1 = 1 + wp * .35 * k;
          ctx.moveTo(X + dx * f0, Y + dy * f0); ctx.lineTo(X + dx * f1, Y + dy * f1);
        } else {
          var al = Math.min(1, p.a * 1.25) * (.38 + .62 * Math.min(1, Math.max(0, 1 - z2 / (RMAX * 1.4)))) * fade;
          if (p.tw >= 0) al *= .55 + .45 * Math.sin(now / 700 + p.tw);
          ctx.globalAlpha = al; var s = p.s * k * sk * (M ? 1.15 : 1.35); ctx.fillRect(sx - s / 2, sy - s / 2, s, s);
        }
      }
      if (warp) { ctx.globalAlpha = 1; ctx.stroke(); }
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    /* órbitas */
    if (mode === 'orbit' || mode === 'spin' || mode === 'travel') {
      var ro = (mode === 'orbit' || mode === 'spin' ? 1 - spP * .6 : 0) * (1 - wp);
      if (ro > .02) {
        for (var rg = 0; rg < 2; rg++) {
          var rad = R[rg], inc = rg ? .2 : -.12, ci = Math.cos(inc), si = Math.sin(inc), SEG = M ? 56 : 90, prevx, prevy;
          for (var sgi = 0; sgi <= SEG; sgi++) {
            var aa = sgi / SEG * TAU, ox = Math.cos(aa) * rad, oz = Math.sin(aa) * rad, qq = prj(ox, oz * si, oz * ci);
            if (sgi) { var dep = 1 - Math.min(1, Math.max(0, (qq.z + rad) / (rad * 2))); ctx.strokeStyle = 'rgba(190,255,225,' + ((.05 + dep * .17) * ro).toFixed(3) + ')'; ctx.lineWidth = .8 + dep * .9; ctx.beginPath(); ctx.moveTo(prevx, prevy); ctx.lineTo(qq.x, qq.y); ctx.stroke(); }
            prevx = qq.x; prevy = qq.y;
          }
        }
      }
    }
  }

  /* ───── planetas: posición ───── */
  function target(n, now) {
    if (!live || (!RM && now - t0 < n.delay)) return { x: cx, y: cy, s: 0, o: 0 };
    if (mode === 'travel' || mode === 'topic') {
      if (n === selNode) {
        if (mode === 'travel') return { x: cx, y: cy + 6, s: M ? 1.9 : 2.5, o: .0 + (wp > .55 ? 0 : 1), z: 60 };
        return { x: W / 2, y: M ? 78 : 104, s: M ? 1.05 : 1.22, o: 1, z: 40 };
      }
      var dx = n.x - cx, dy = n.y - cy, d = Math.sqrt(dx * dx + dy * dy) || 1, far = Math.max(W, H) * 1.1;
      return { x: cx + dx / d * far, y: cy + dy / d * far, s: .2, o: 0 };
    }
    var rad = R[n.ring], a = n.a0 + t * n.w, inc = n.ring ? .2 : -.12, oz = Math.sin(a) * rad, q = prj(Math.cos(a) * rad, oz * Math.sin(inc), oz * Math.cos(inc));
    var dep = 1 - Math.min(1, Math.max(0, (q.z + rad) / (rad * 2)));    /* 1 = cerca de la cámara */
    var s = q.k * (.78 + dep * .28), o = .5 + .5 * dep, bob = RM ? 0 : Math.sin(now / 1100 + n.ph) * 3.5;
    if (mode === 'spin') { if (n === selNode) { s *= 1 + .42 * spP; o = 1; dep = 1; } else o *= 1 - .7 * spP; }
    else if (hov) { if (hov === n) { s = Math.max(s, 1.04) * 1.2; o = 1; } else o *= .5; }
    return { x: q.x, y: q.y + bob, s: s * (NZ / 98), o: o, z: mode === 'spin' && n === selNode ? 40 : 4 + Math.round(dep * 14) + (hov === n ? 30 : 0), dep: dep };
  }
  function spring(n, tg, dt) {
    if (RM) { n.x = tg.x; n.y = tg.y; n.s = tg.s; n.o = tg.o; return; }
    var k = mode === 'travel' ? 120 : 190, d = mode === 'travel' ? 15 : 18, m = Math.ceil(dt / .0167), h = dt / m;
    for (var q = 0; q < m; q++) {
      n.vx += ((tg.x - n.x) * k - n.vx * d) * h; n.x += n.vx * h;
      n.vy += ((tg.y - n.y) * k - n.vy * d) * h; n.y += n.vy * h;
      n.vs += ((tg.s - n.s) * k - n.vs * d) * h; n.s += n.vs * h;
    }
    n.o += (tg.o - n.o) * (1 - Math.exp(-dt * (mode === 'travel' ? 12 : 8)));
  }
  function paint(n, tg, now) {
    var s = Math.max(0, n.s), st = n.el.style;
    st.transform = 'translate3d(' + n.x.toFixed(1) + 'px,' + n.y.toFixed(1) + 'px,0) translate(-50%,-50%) scale(' + s.toFixed(3) + ')';
    st.opacity = Math.max(0, Math.min(1, n.o)).toFixed(2);
    st.zIndex = n === selNode ? 40 : (tg.z || 1);
    st.pointerEvents = (n.o < .3 || mode !== 'orbit') ? 'none' : '';
    st.visibility = n.o < .01 && n.s < .05 ? 'hidden' : '';
    if (mode === 'orbit' || mode === 'spin') { var lo = tg.dep === undefined ? 1 : Math.max(0, Math.min(1, (tg.dep - .28) / .3)); if (hov === n) lo = 1; n.lo += (lo - n.lo) * .12; st.setProperty('--lo', n.lo.toFixed(2)); }
    if (n.moon) {
      var ma = now * n.ms + n.ph, mx = Math.cos(ma) * NZ * .8, my = Math.sin(ma) * NZ * .28 - 4, front = Math.sin(ma) > 0, ms = .82 + .32 * (Math.sin(ma) * .5 + .5);
      n.moon.style.transform = 'translate(' + mx.toFixed(1) + 'px,' + my.toFixed(1) + 'px) scale(' + ms.toFixed(2) + ')'; n.moon.style.zIndex = front ? 4 : 0;
    }
  }

  var running = false;
  function frame(now) {
    if (!running) return;
    var raw = now - (last || now), dt = Math.min(.12, raw / 1000), rdt = dt * 1000; last = now;
    if (window.KB_Q) stride = window.KB_Q; else if (raw > 0 && raw < 200) { ema += (raw - ema) * .06; if (now - qT > 1400) { if (ema > 26 && stride < 4) { stride++; qT = now; } else if (ema < 17.5 && stride > 1) { stride--; qT = now + 2500; } } }
    ts += ((hov || (mode !== 'orbit' && mode !== 'spin') || dragging ? .12 : (mode === 'spin' ? .25 : 1)) - ts) * (1 - Math.exp(-dt * 6));
    if (!RM) t += rdt * ts;
    if (!dragging) { yawD += yawV * rdt; yawV *= Math.pow(.0045, dt); }
    mxs += (mxn - mxs) * .06; mys += (myn - mys) * .06;
    wp += (wpT - wp) * (1 - Math.exp(-dt * (wpT > wp ? 5.2 : 3.4))); if (Math.abs(wp - wpT) < .003) wp = wpT;
    cx += (cxT - cx) * (1 - Math.exp(-dt * 3.2)); cy += (cyT - cy) * (1 - Math.exp(-dt * 3.2));
    if (sp) { var u = Math.min(1, (now - sp.t0) / sp.d); spP = u; yawD = sp.a + (sp.b - sp.a) * (1 - Math.pow(1 - u, 3)); yawV = 0; if (u >= 1) { var f = sp.done; sp = null; f(); } }
    yaw = yawD + mxs * .5; pitch = PS + (mode === 'orbit' ? -mys * .16 : 0);
    var spin = Math.sin(pitch); sP = spin; cP = Math.cos(pitch); cY = Math.cos(yaw); sY = Math.sin(yaw);
    for (var i = 0; i < nodes.length; i++) { var n = nodes[i], tg = target(n, now); spring(n, tg, dt); paint(n, tg, now); }
    draw(now);
    var co = ((mode === 'orbit' || mode === 'spin') && live) ? (1 - wp) * (1 - spP * .85) : 0, cs = Math.max(0, Math.min(1, co)).toFixed(2), q = prj(0, 0, 0);
    core.style.opacity = cs; core.style.transform = 'translate3d(' + q.x.toFixed(1) + 'px,' + q.y.toFixed(1) + 'px,0) translate(-50%,-50%)';
    stage.style.setProperty('--wp', wp.toFixed(3));
    requestAnimationFrame(frame);
  }
  function start() { if (running) return; running = true; last = 0; requestAnimationFrame(frame); }

  /* ───── interacción ───── */
  nodes.forEach(function (n) {
    function hot(on) {
      if (on) { hov = n; n.el.classList.add('hot'); stage.style.setProperty('--hc', n.tp.c); hint.innerHTML = '<b style="color:' + n.tp.c + '">' + esc(n.tp.n) + '</b> · ' + esc(n.tp.sub); hint.classList.add('on'); }
      else { if (hov === n) hov = null; n.el.classList.remove('hot'); hint.classList.remove('on'); if (!hov) { hint.innerHTML = HINT0; hint.classList.add('on'); } }
    }
    n.el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && mode === 'orbit') hot(true); });
    n.el.addEventListener('pointerleave', function () { hot(false); });
    n.el.addEventListener('focus', function () { if (mode === 'orbit') hot(true); });
    n.el.addEventListener('blur', function () { hot(false); });
    n.el.addEventListener('click', function (e) { if (justDragged) { e.preventDefault(); return; } choose(n); });
  });
  hint.innerHTML = HINT0; hint.classList.add('on');

  /* arrastrar para girar (inercia) · el ratón además inclina la cámara */
  var dragX = 0, dragId = -1, justDragged = false, lastX = 0, lastT = 0;
  stage.addEventListener('dragstart', function (e) { e.preventDefault(); });
  stage.addEventListener('pointerdown', function (e) {
    if (mode !== 'orbit' || e.button || (e.target.closest && e.target.closest('.kbn-back'))) return;
    dragging = true; dragX = e.clientX; lastX = e.clientX; lastT = performance.now(); dragId = e.pointerId; justDragged = false; yawV = 0;
  });
  addEventListener('pointermove', function (e) {
    if (dragging && e.pointerId === dragId) {
      var dx = e.clientX - lastX, now = performance.now(), dtm = Math.max(8, now - lastT);
      if (Math.abs(e.clientX - dragX) > 6) { justDragged = true; stage.classList.add('drag'); }
      if (justDragged) { yawD += dx * .0042; yawV = dx * .0042 / dtm * .7 + yawV * .3; }
      lastX = e.clientX; lastT = now;
    }
  }, { passive: true });
  function endDrag(e) { if (!dragging || (e && e.pointerId !== dragId)) return; dragging = false; stage.classList.remove('drag'); setTimeout(function () { justDragged = false; }, 60); }
  addEventListener('pointerup', endDrag); addEventListener('pointercancel', endDrag);
  if (FINE) stage.addEventListener('pointermove', function (e) {
    var r = stage.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
    stage.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px'); stage.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px'); stage.classList.add('lit');
    if (!RM) { mxn = nx * .5; myn = ny; }
  }, { passive: true });
  stage.addEventListener('pointerleave', function () { mxn = 0; myn = 0; stage.classList.remove('lit'); });

  function say(on) { if (!on) hint.classList.remove('on'); }
  function choose(n) {
    if (mode !== 'orbit') return;
    var tp = n.tp;
    if (tp.href) { n.el.classList.add('burst'); if (window.KBSpace) KBSpace.go(tp.href, tp.c); else location.assign(tp.href); return; }
    selNode = n; hov = null; n.el.classList.remove('hot'); n.el.classList.add('sel'); say(false);
    selT.textContent = tp.n; selS.textContent = tp.sub; stage.style.setProperty('--tc', tp.c);
    var r = stage.getBoundingClientRect(); if (r.top < -20 || r.bottom > innerHeight + 20) stage.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
    dragging = false; stage.classList.remove('drag'); yawV = 0;
    if (RM) return travel(tp);
    /* 1) la órbita gira hasta traer el planeta al frente (ángulo más corto) */
    var a = n.a0 + t * n.w, want = -Math.PI / 2 - a, dY = want - yawD; dY = dY - Math.round(dY / TAU) * TAU;
    mode = 'spin'; stage.dataset.mode = 'spin'; spP = 0; hint.classList.remove('on');
    sp = { a: yawD, b: yawD + dY, t0: performance.now(), d: Math.min(1000, 520 + Math.abs(dY) * 170), done: function () { travel(tp); } };
  }
  /* 2) salto espacial hacia el tema */
  function travel(tp) {
    mode = 'travel'; stage.dataset.mode = 'travel'; spP = 0;
    stage.classList.add('flash'); setTimeout(function () { stage.classList.remove('flash'); }, 900);
    if (window.KBSpace && !RM) KBSpace.burst(tp.c, 900);
    wpT = RM ? 0 : 1;
    setTimeout(function () {
      mode = 'topic'; stage.dataset.mode = 'topic'; wpT = 0; cxT = W / 2; cyT = H * .5;
      if (tp.how) buildFan(tp); else buildDock(tp);
      stage.classList.add('open');
      requestAnimationFrame(function () { requestAnimationFrame(function () { dock.classList.add('is-in'); fan.classList.add('is-in'); }); });
      try { backB.focus({ preventScroll: true }); } catch (e) {}
    }, RM ? 0 : 700);
  }
  function back() {
    if (mode !== 'topic') return;
    var n = selNode;
    dock.classList.remove('is-in'); fan.classList.remove('is-in'); stage.classList.remove('open');
    setTimeout(function () {
      mode = 'travel'; wpT = RM ? 0 : .9; if (window.KBSpace && !RM) KBSpace.burst(n ? n.tp.c : '#00FF88', 700);
      setTimeout(function () {
        mode = 'orbit'; stage.dataset.mode = 'orbit'; wpT = 0; if (n) n.el.classList.remove('sel'); selNode = null; t0 = performance.now(); hint.classList.add('on'); hint.innerHTML = HINT0;
        cxT = WIDE ? W * .675 : W / 2; cyT = M ? H * .25 : H * .52;
        dock.innerHTML = ''; fan.innerHTML = '';
        try { n && n.el.focus({ preventScroll: true }); } catch (e) {}
      }, RM ? 0 : 520);
    }, RM ? 0 : 360);
  }
  backB.addEventListener('click', back);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mode === 'topic') back(); });

  /* ───── dock ───── */
  function buildDock(tp) {
    var h = '', i = 0;
    tp.items.forEach(function (s) {
      var it = IT[s]; if (!it) return;
      h += '<a class="dk" href="' + it.u + '" style="--c:' + it.col + ';--dl:' + (i * 90) + 'ms;--r0:' + ((i % 2 ? 1 : -1) * (3 + i)) + 'deg">' +
        '<span class="dk-cv">' + it.cv + '</span><span class="dk-b"><span class="dk-k">' + (it.k === 'a' ? 'Artículo' : 'Herramienta') + '<em>' + (it.k === 'a' ? it.m + ' min' : 'Gratis') + '</em></span>' +
        '<b>' + esc(it.t) + '</b><span class="dk-d">' + esc(it.d) + '</span><span class="dk-go">' + (it.k === 'a' ? 'Leer' : 'Usar ahora') + ' ' + ARROW + '</span></span></a>';
      i++;
    });
    h += '<a class="dk dk-app" href="/?utm_source=blog&utm_medium=nav&utm_campaign=' + tp.id + '" style="--c:#00FF88;--dl:' + (i * 90) + 'ms;--r0:4deg"><span class="dk-lg">' + KLOGO + '</span><b>Llévalo a la práctica</b><span class="dk-p">Cuerpo técnico de IA, KINET Card y análisis táctico. Gratis para empezar.</span><span class="dk-go">Abrir KINET OS ' + ARROW + '</span></a>';
    dock.innerHTML = h; dock.scrollLeft = 0;
  }
  var dcards = function () { return [].slice.call(dock.querySelectorAll('.dk')); };
  if (FINE && !RM) {
    dock.addEventListener('pointermove', function (e) {
      if (!dock.classList.contains('is-in')) return;
      dcards().forEach(function (c) { var r = c.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), s = 1 + .13 * Math.exp(-Math.pow(dx / 200, 2)); c.style.scale = s.toFixed(3); c.style.translate = '0 ' + (-(s - 1) * 80).toFixed(1) + 'px'; });
    });
    dock.addEventListener('pointerleave', function () { dcards().forEach(function (c) { c.style.scale = ''; c.style.translate = ''; }); });
  }

  /* ───── baraja (cómo funciona) ───── */
  function buildFan(tp) {
    var n = tp.how.length, step = Math.min(W >= 1160 ? 250 : 170, Math.max(M ? 26 : 46, (W - (M ? 220 : (W >= 1160 ? 300 : 240))) / (n - 1))), h = '';
    tp.how.forEach(function (c, i) {
      var m = i - (n - 1) / 2;
      h += '<a class="fc" href="' + c.u + '" style="--c:' + c.c + ';--x:' + (m * step).toFixed(1) + 'px;--r:' + (m * (M ? 3 : 6)).toFixed(1) + 'deg;--y:' + (m * m * (M ? 4 : 6)).toFixed(1) + 'px;--dl:' + (i * 95) + 'ms;z-index:' + (i + 1) + '">' +
        '<span class="fc-code">' + c.code + '</span><b>' + esc(c.t) + '</b><span class="fc-d">' + esc(c.d) + '</span><span class="dk-go">Verlo en KINET ' + ARROW + '</span></a>';
    });
    fan.innerHTML = h;
    if (!FINE) [].forEach.call(fan.querySelectorAll('.fc'), function (c) {   /* táctil: el primer toque trae la carta al frente, el segundo la abre */
      c.addEventListener('click', function (e) { if (c.classList.contains('top')) return; e.preventDefault(); [].forEach.call(fan.querySelectorAll('.fc'), function (x) { x.classList.remove('top'); }); c.classList.add('top'); });
    });
  }

  /* ───── arranque ───── */
  layout();
  if ('ResizeObserver' in window) new ResizeObserver(function () { layout(); }).observe(stage); else addEventListener('resize', layout);
  function go() { if (live) return; live = true; t0 = performance.now(); stage.classList.add('live'); start(); }
  if (RM) { live = true; stage.classList.add('live'); frame0(); }
  function frame0() { running = true; last = 0; frame(performance.now()); running = false; }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { go(); if (!RM) start(); } else running = false; }); }, { threshold: .08 }).observe(stage);
  } else go();
  document.addEventListener('visibilitychange', function () { if (document.hidden) running = false; else if (live && !RM) start(); });
  window.KBOrbit = { stage: stage, get yaw() { return yawD; }, get mode() { return mode; } };
})();
