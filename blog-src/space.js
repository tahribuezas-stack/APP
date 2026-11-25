/* KINET OS · espacio: campo de estrellas de fondo + "viaje espacial" (warp) entre páginas. Sin dependencias.
   - Fondo: estrellas con profundidad y deriva lenta (se pausa en pestañas ocultas).
   - KBSpace.go(url, color): acelera las estrellas hasta rayas de luz, funde la página y navega; la página nueva "aterriza" frenando.
   - KBSpace.burst(color, ms): pulso de velocidad dentro de la misma página (lo usa la órbita al elegir un tema). */
(function () {
  'use strict';
  var RM = false, LOW = false;
  /* animaciones siempre activas (ver nota en nav.js) */
  try { LOW = (navigator.hardwareConcurrency || 8) <= 2 || (navigator.deviceMemory || 8) <= 2; } catch (e) {}
  var H = document.documentElement;
  var arrive = null;
  try {
    var raw = sessionStorage.getItem('kb_warp');
    if (raw) { sessionStorage.removeItem('kb_warp'); var o = JSON.parse(raw); if (o && Date.now() - o.t < 6000) arrive = o; }
  } catch (e) {}

  var cv = document.createElement('canvas');
  cv.id = 'kb-space'; cv.setAttribute('aria-hidden', 'true');
  var ctx = cv.getContext('2d', { alpha: true });
  var W = 0, Hh = 0, DPR = 1, stars = [], N = 0;
  var warp = 0, warpT = 0, flash = 0, flashT = 0, col = [0, 255, 136], colT = [0, 255, 136];
  var px = 0, py = 0, tx = 0, ty = 0, last = 0, running = false, over = false, navigating = false;

  function hex(c) {
    c = String(c || '').trim();
    var m = /^#?([0-9a-f]{6})$/i.exec(c); if (m) { var n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
    m = /^#?([0-9a-f]{3})$/i.exec(c); if (m) { var s = m[1]; return [parseInt(s[0] + s[0], 16), parseInt(s[1] + s[1], 16), parseInt(s[2] + s[2], 16)]; }
    m = /rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/i.exec(c); if (m) return [+m[1], +m[2], +m[3]];
    return [0, 255, 136];
  }
  function size() {
    DPR = Math.min(window.devicePixelRatio || 1, LOW ? 1 : 1.5);
    W = innerWidth; Hh = innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(Hh * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var want = Math.round(Math.min(220, Math.max(70, W * Hh / 9000)) * (LOW ? .5 : 1));
    if (want !== N) { N = want; stars = []; for (var i = 0; i < N; i++) stars.push(mk(true)); }
  }
  function mk(any) {
    var a = Math.random() * 6.2832, r = Math.pow(Math.random(), .7) * 1.35 + .04;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, z: any ? Math.random() * .98 + .02 : 1, h: Math.random() < .14 ? 1 : (Math.random() < .12 ? 2 : 0), tw: Math.random() * 6.28 };
  }

  function frame(now) {
    if (!running) return;
    if (!warp && !warpT && flash < .01 && last && now - last < 30) { requestAnimationFrame(frame); return; }   /* en reposo basta con ~30 fps */
    var dt = Math.min(48, now - (last || now)); last = now;
    /* suavizado hacia los objetivos */
    var k = 1 - Math.pow(.0016, dt / 1000);
    var kw = warpT > warp ? 1 - Math.pow(.0009, dt / 1000) : 1 - Math.pow(.02, dt / 1000);
    warp += (warpT - warp) * kw; flash += (flashT - flash) * (1 - Math.pow(.004, dt / 1000));
    px += (tx - px) * k; py += (ty - py) * k;
    for (var i = 0; i < 3; i++) col[i] += (colT[i] - col[i]) * k;
    if (Math.abs(warp - warpT) < .002) warp = warpT;

    ctx.clearRect(0, 0, W, Hh);
    var cx = W / 2 + px * 26, cy = Hh * .46 + py * 16, F = Math.max(W, Hh) * .62;
    var v = (.000035 + warp * warp * .0042) * dt;       /* velocidad en z */
    var streak = warp * warp * .5;
    var R = col[0] | 0, G = col[1] | 0, B = col[2] | 0;

    /* destello de color en el centro */
    if (flash > .01) {
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, Hh) * .75);
      g.addColorStop(0, 'rgba(255,255,255,' + (flash * .55).toFixed(3) + ')');
      g.addColorStop(.22, 'rgba(' + R + ',' + G + ',' + B + ',' + (flash * .42).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(' + R + ',' + G + ',' + B + ',0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh);
    }
    ctx.lineCap = 'round';
    for (var s = 0; s < stars.length; s++) {
      var st = stars[s], z0 = st.z;
      st.z -= v;
      if (st.z <= .02) { var n = mk(false); st.x = n.x; st.y = n.y; st.z = 1; st.h = n.h; z0 = st.z + v; }
      var sx = cx + st.x * F / st.z * .5 + px * (1 - st.z) * 18, sy = cy + st.y * F / st.z * .5 + py * (1 - st.z) * 10;
      if (sx < -60 || sx > W + 60 || sy < -60 || sy > Hh + 60) { if (warp > .05) { var n2 = mk(false); st.x = n2.x; st.y = n2.y; st.z = 1; } continue; }
      var depth = 1 - st.z, a = Math.min(1, depth * 1.5 + .12);
      if (!warp && !RM) a *= .72 + .28 * Math.sin(now / 900 + st.tw);
      var c = st.h === 1 ? 'rgba(' + R + ',' + G + ',' + B + ',' : (st.h === 2 ? 'rgba(160,215,255,' : 'rgba(225,238,255,');
      if (streak > .02) {
        var zt = Math.min(1, st.z + v * (4 + warp * 26)), tx2 = cx + st.x * F / zt * .5 + px * (1 - zt) * 18, ty2 = cy + st.y * F / zt * .5 + py * (1 - zt) * 10;
        ctx.strokeStyle = c + Math.min(1, a * (.55 + warp * .6)).toFixed(3) + ')'; ctx.lineWidth = .6 + depth * (1.6 + warp * 1.4);
        ctx.beginPath(); ctx.moveTo(tx2, ty2); ctx.lineTo(sx, sy); ctx.stroke();
      } else {
        var sz = .5 + depth * 1.7 * (st.h ? 1.25 : 1);
        ctx.fillStyle = c + a.toFixed(3) + ')'; ctx.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
      }
    }
    if (!document.hidden && !RM) requestAnimationFrame(frame); else running = false;
  }
  function start() { if (running) return; running = true; last = 0; requestAnimationFrame(frame); }

  function lift(on) { if (over === on) return; over = on; cv.style.zIndex = on ? '80' : '0'; }
  var liftTimer = 0;
  function setWarp(w, ms) { warpT = w; if (w > .3) { lift(true); clearTimeout(liftTimer); } else { clearTimeout(liftTimer); liftTimer = setTimeout(function () { lift(false); }, ms || 700); } start(); }

  /* ───── API ───── */
  var api = {
    burst: function (color, ms) {
      if (RM) return; colT = hex(color); flashT = .9; warpT = .55; lift(false); start();
      setTimeout(function () { flashT = 0; warpT = 0; }, ms || 520);
    },
    set: function (w) { warpT = w; start(); },
    go: function (url, color) {
      if (navigating) return; navigating = true;
      if (RM) { location.assign(url); return; }
      colT = hex(color); try { sessionStorage.setItem('kb_warp', JSON.stringify({ c: color || '#00FF88', t: Date.now() })); } catch (e) {}
      H.classList.add('kb-warp-out'); flashT = .85; setWarp(1, 0);
      setTimeout(function () { location.assign(url); }, 560);
      setTimeout(function () { if (navigating) { navigating = false; H.classList.remove('kb-warp-out'); flashT = 0; setWarp(0, 400); } }, 4200);   /* por si la navegación no llega a ocurrir */
    }
  };
  window.KBSpace = api;

  function boot() {
    document.body.insertBefore(cv, document.body.firstChild);
    size();
    var rt = 0; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 120); });
    if (matchMedia('(hover:hover) and (pointer:fine)').matches && !RM) {
      addEventListener('pointermove', function (e) { tx = e.clientX / W - .5; ty = e.clientY / Hh - .5; }, { passive: true });
    }
    if (RM) { running = true; frame(performance.now()); running = false; }
    else start();
    document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
    addEventListener('pageshow', function (e) { if (e.persisted) { navigating = false; H.classList.remove('kb-warp-out', 'kb-arriving'); flashT = 0; setWarp(0, 300); } });

    if (arrive && !RM) {            /* aterrizaje: venimos de un salto, frenamos suavemente */
      colT = hex(arrive.c); col = colT.slice(); warp = 1; warpT = 1; flash = .85; flashT = .85; lift(true);
      requestAnimationFrame(function () {
        H.classList.add('kb-arrive'); H.classList.remove('kb-arriving');
        setTimeout(function () { warpT = 0; flashT = 0; start(); liftTimer = setTimeout(function () { lift(false); }, 900); }, 90);
        setTimeout(function () { H.classList.remove('kb-arrive'); }, 1500);
      });
      start();
    } else H.classList.remove('kb-arriving');

    /* todos los enlaces internos viajan */
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
      if ((a.target && a.target !== '_self') || a.hasAttribute('download') || a.hasAttribute('data-nowarp')) return;
      var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
      if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search)) return;
      if (/\.(pdf|zip|png|jpe?g|webp|svg|xml|txt|ico|webmanifest)$/i.test(u.pathname)) return;
      e.preventDefault();
      var cs = getComputedStyle(a), c = cs.getPropertyValue('--c') || cs.getPropertyValue('--acc') || '#00FF88';
      api.go(u.href, c.trim() || '#00FF88');
    });
  }
  if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
