/* KINET OS · Juego 4 · Reflejos: un mini-juego distinto por deporte (portero, defensa, salida y sprint, resto de tenis). Sin registro. */
(function () {
  'use strict';
  var stage = KG.$('#kg-stage'), cv, ctx, W, H, DPR, raf = 0, S = null, G = null, col = '#00FF88', colr = '0,255,136', lastT = 0, now = 0, running = false, T2 = Math.PI * 2, HOLD = {};
  var TIERS = { futbol: ['Recién levantado', 'En calentamiento', 'Portero de titular', 'Muro infranqueable', 'Leyenda bajo palos'], baloncesto: ['Recién levantado', 'Defensor de banquillo', 'Defensor de rotación', 'Cerrojo de la zona', 'Mejor defensor del año'], tenis: ['Principiante', 'Raqueta de club', 'Jugador de circuito', 'Top 10 del resto', 'Número uno'], running: ['Calentando', 'Atleta de club', 'Finalista', 'Medallista', 'Leyenda de la pista'] };

  function rgb() { var cs = getComputedStyle(document.documentElement); col = cs.getPropertyValue('--kc').trim() || '#00FF88'; colr = cs.getPropertyValue('--kcr').trim() || '0,255,136'; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }
  function hash(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function rnd() { return S ? S.rnd() : Math.random(); }

  /* ───── efectos comunes ───── */
  function pop(x, y, t, c) { S.pops.push({ x: x, y: y, t: t, c: c, life: .95 }); }
  function spark(x, y, c, n, sp) { for (var i = 0; i < n; i++) { var a = rnd() * T2, v = (sp || 240) * (.35 + rnd()); S.fx.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, r: 1.5 + rnd() * 3, life: .45 + rnd() * .45, max: .9, c: c }); } }
  function cheer(v) { S.hype = clamp(S.hype + v, .2, 1); }
  function shake() { cv.classList.remove('shake'); void cv.offsetWidth; cv.classList.add('shake'); }
  function drawFx(dt) {
    S.fx = S.fx.filter(function (p) { p.life -= dt; if (p.life <= 0) return false; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, T2); ctx.fill(); ctx.globalAlpha = 1; return true; });
    S.pops = S.pops.filter(function (p) {
      p.life -= dt; if (p.life <= 0) return false; ctx.save(); ctx.globalAlpha = Math.min(1, p.life * 2.2); ctx.fillStyle = p.c; ctx.font = '800 ' + (W < 700 ? 17 : 22) + 'px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = p.c; ctx.shadowBlur = 14;
      ctx.fillText(p.t, clamp(p.x, 90, W - 90), p.y - (1 - p.life / .95) * 46); ctx.restore(); return true;
    });
  }

  /* ───── gradas animadas (cabezas que botan, banderas, flashes) ───── */
  function crowd(y0, y1, pal, big, dim) {
    var rows = Math.max(3, Math.round((y1 - y0) / (big ? 21 : 15))), bk = pal.map(function () { return []; }), flags = [], hy = S ? S.hype : .3, r, i, heads = [];
    for (r = 0; r < rows; r++) {
      var f = r / Math.max(1, rows - 1), y = y0 + (y1 - y0) * (r + .5) / rows, s = (big ? 5.5 : 3.8) + f * (big ? 5.5 : 3.8), st = s * 2.3, n = Math.ceil(W / st) + 1;
      for (i = 0; i < n; i++) {
        var id = r * 211 + i, h1 = hash(id), x = i * st + (r % 2) * st * .5 - st * .25, b = Math.sin(now / 230 + h1 * 6.28 + r * .8) * (.4 + hy * 3.8);
        bk[Math.floor(hash(id + .5) * pal.length)].push(x, y + b, s); heads.push(x, y + b - s * .75, s * .78);
        if (h1 > .987) flags.push(x, y + b, s, id);
      }
    }
    pal.forEach(function (c, k) { var a = bk[k]; ctx.fillStyle = c; ctx.beginPath(); for (var j = 0; j < a.length; j += 3) ctx.rect(a[j] - a[j + 2], a[j + 1] - a[j + 2] * .3, a[j + 2] * 2, a[j + 2] * 1.7); ctx.fill(); });
    ctx.fillStyle = '#d6a47c'; ctx.beginPath(); for (i = 0; i < heads.length; i += 3) { ctx.moveTo(heads[i] + heads[i + 2], heads[i + 1]); ctx.arc(heads[i], heads[i + 1], heads[i + 2], 0, T2); } ctx.fill();
    for (i = 0; i < flags.length; i += 4) {
      var fx = flags[i], fy = flags[i + 1], fs = flags[i + 2], fid = flags[i + 3]; ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - fs * 5); ctx.stroke();
      ctx.fillStyle = pal[fid % pal.length]; ctx.beginPath(); ctx.moveTo(fx, fy - fs * 5); for (var k = 0; k <= 4; k++) ctx.lineTo(fx + k * fs * .8, fy - fs * 5 + Math.sin(now / 150 + k + fid) * fs * .4); for (k = 4; k >= 0; k--) ctx.lineTo(fx + k * fs * .8, fy - fs * 3.4 + Math.sin(now / 150 + k + fid) * fs * .4); ctx.closePath(); ctx.fill();
    }
    var g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, 'rgba(2,4,8,.72)'); g.addColorStop(1, 'rgba(2,4,8,.1)'); ctx.fillStyle = g; ctx.fillRect(0, y0 - 4, W, y1 - y0 + 8); if (dim) { ctx.fillStyle = 'rgba(2,4,8,' + dim + ')'; ctx.fillRect(0, y0 - 4, W, y1 - y0 + 8); }
    /* flashes de cámara */
    if (S) { if (running && rnd() < .12 + hy * .5) S.fl.push({ x: rnd() * W, y: y0 + rnd() * (y1 - y0), l: .22 }); S.fl = S.fl.filter(function (q) { q.l -= .016; if (q.l <= 0) return false; ctx.globalAlpha = q.l * 4; ctx.fillStyle = '#fff'; ctx.fillRect(q.x - 1, q.y - 5, 2, 10); ctx.fillRect(q.x - 5, q.y - 1, 10, 2); ctx.globalAlpha = 1; return true; }); }
  }
  function floods(ys) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    [.1, .36, .64, .9].forEach(function (fx) { var g = ctx.createRadialGradient(W * fx, ys, 0, W * fx, ys, W * .32); g.addColorStop(0, 'rgba(255,248,225,.34)'); g.addColorStop(1, 'rgba(255,248,225,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * .8); });
    ctx.restore();
  }
  function boards(y, h, txt) {
    var bw = Math.max(110, W / 7), off = (now / 30) % (bw * 2), cs = ['#0b3b2a', '#102b4a', '#3a1230'], i;
    ctx.save(); ctx.beginPath(); ctx.rect(0, y, W, h); ctx.clip();
    for (i = -2; i < W / bw + 2; i++) { var x = i * bw - off % bw; ctx.fillStyle = cs[((i + Math.floor(off / bw)) % 3 + 3) % 3]; ctx.fillRect(x, y, bw - 2, h); ctx.fillStyle = col; ctx.font = '800 ' + Math.round(h * .5) + 'px Orbitron,Inter,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x + bw / 2, y + h / 2 + 1); }
    ctx.restore(); ctx.fillStyle = 'rgba(' + colr + ',.6)'; ctx.fillRect(0, y + h - 2, W, 2);
  }
  /* figura articulada (vista lateral) para baloncesto */
  function figure(cx, fy, h, o) {
    var face = o.face || 1, cr = o.crouch || 0, jp = o.jump || 0, ar = o.arm || 0, feet = fy - jp, hipY = feet - h * .5 + cr * h * .1, hx = cx, lw = h * .07, hand, p;
    var knX = cx + face * (h * .03 + cr * h * .09), knY = (feet + hipY) / 2 + cr * h * .03, neckX = hx + face * (o.lean || 0) * h * .06, neckY = hipY - h * .3 + cr * h * .04, shY = neckY + h * .04, i;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 16; }
    function leg(dx) { ctx.beginPath(); ctx.moveTo(cx + dx, feet); ctx.lineTo(knX + dx * .4, knY); ctx.lineTo(hx + dx * .2, hipY); ctx.stroke(); }
    ctx.strokeStyle = '#1a2230'; ctx.lineWidth = lw; leg(-face * h * .09);
    ctx.strokeStyle = o.skin || '#e0b08c'; ctx.lineWidth = lw * .55; ctx.beginPath(); ctx.moveTo(neckX - face * h * .02, shY); ctx.lineTo(neckX - face * h * .02 + face * h * .05, lerp(shY + h * .2, shY - h * .3, ar)); ctx.stroke();
    ctx.strokeStyle = o.col; ctx.lineWidth = h * .17; ctx.beginPath(); ctx.moveTo(hx, hipY - h * .02); ctx.lineTo(neckX, neckY + h * .02); ctx.stroke();
    ctx.strokeStyle = o.sh || '#111827'; ctx.lineWidth = h * .15; ctx.beginPath(); ctx.moveTo(hx, hipY + h * .02); ctx.lineTo(hx, hipY - h * .06); ctx.stroke();
    ctx.strokeStyle = '#243046'; ctx.lineWidth = lw; leg(face * h * .08);
    ctx.shadowBlur = 0; ctx.fillStyle = o.skin || '#e0b08c'; ctx.beginPath(); ctx.arc(neckX + face * h * .015, neckY - h * .08, h * .075, 0, T2); ctx.fill();
    ctx.fillStyle = '#1b1208'; ctx.beginPath(); ctx.arc(neckX, neckY - h * .1, h * .078, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
    hand = { x: neckX + face * h * (.12 + .06 * (1 - ar)), y: lerp(shY + h * .22, shY - h * .34, ar) };
    ctx.strokeStyle = o.skin || '#e0b08c'; ctx.lineWidth = lw * .6; ctx.beginPath(); ctx.moveTo(neckX + face * h * .02, shY); ctx.lineTo(hand.x, hand.y); ctx.stroke();
    ctx.fillStyle = o.skin || '#e0b08c'; ctx.beginPath(); ctx.arc(hand.x, hand.y, lw * .5, 0, T2); ctx.fill();
    ctx.restore(); return hand;
  }
  function ball2(x, y, r, spin) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(spin || 0); ctx.shadowColor = '#f97316'; ctx.shadowBlur = 10; ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(0, 0, r, 0, T2); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = '#2b1204'; ctx.lineWidth = Math.max(1.2, r * .09);
    ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke(); ctx.beginPath(); ctx.arc(-r * 1.15, 0, r * .85, -1, 1); ctx.stroke(); ctx.beginPath(); ctx.arc(r * 1.15, 0, r * .85, Math.PI - 1, Math.PI + 1); ctx.stroke(); ctx.restore();
  }
  function ball1(x, y, r, spin) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(spin || 0); ctx.shadowColor = '#fff'; ctx.shadowBlur = 12; ctx.fillStyle = '#f4f7fb'; ctx.beginPath(); ctx.arc(0, 0, r, 0, T2); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = '#1b2430';
    ctx.beginPath(); for (var i = 0; i < 5; i++) { var a = i * 1.2566 - 1.5708; ctx.lineTo(Math.cos(a) * r * .38, Math.sin(a) * r * .38); } ctx.closePath(); ctx.fill();
    for (i = 0; i < 5; i++) { var b = i * 1.2566 - 1.5708; ctx.beginPath(); ctx.arc(Math.cos(b) * r * .88, Math.sin(b) * r * .88, r * .2, 0, T2); ctx.fill(); } ctx.restore();
  }

  /* ═════════ FÚTBOL · Portero ═════════ */
  var GF = {
    dur: 30, ctl: '', hud0: ['Paradas', 'Tiempo', 'Racha'],
    intro: { role: 'Portero', h: 'Bajo <em>los palos</em>', p: 'Los balones llegan a cualquier punto del marco, con la grada rugiendo detrás. <b>Mueve los guantes</b> con el dedo, el ratón o las flechas y ataja antes de que crucen la línea.', keys: ['←', '↑', '↓', '→'], note: 'o arrastra el dedo', meta: [['30 s', 'de partido'], ['×4', 'combo máx.'], ['⭐', 'paradas al palo']] },
    init: function () { S.objs = []; S.next = .7; S.gx = W / 2; S.gy = H * .55; S.tx = S.gx; S.ty = S.gy; S.bx = W / 2; S.saves = 0; S.goals = 0; S.perf = 0; S.defl = []; S.rings = []; S.kx = 0; S.ky = 0; S.shoot = 0; },
    R: function () { return Math.max(36, Math.min(W, H) * .1); },
    update: function (dt) {
      var p = S.t / this.dur, R = this.R(), gx0 = W * .08, gx1 = W * .92, gy0 = H * .11, gy1 = H * .88;
      S.next -= dt;
      if (S.next <= 0) {
        S.next = lerp(1.05, .5, p) * (.8 + .4 * rnd()); var cx = (gx0 + gx1) / 2, tx = lerp(gx0 + (gx1 - gx0) * (.07 + .86 * rnd()), cx, .3 * (1 - p)), ty = lerp(gy0 + (gy1 - gy0) * (.1 + .78 * rnd()), (gy0 + gy1) / 2, .25 * (1 - p));
        S.objs.push({ sx: W / 2 + (rnd() - .5) * W * .22, sy: H * .46, tx: tx, ty: ty, u: 0, T: lerp(1.35, .78, p) * (.92 + .16 * rnd()), spin: rnd() * 6 }); S.shoot = .25;
        if (p > .55 && rnd() < .25) S.objs.push({ sx: W / 2 + (rnd() - .5) * W * .22, sy: H * .46, tx: lerp(gx0, gx1, rnd()), ty: lerp(gy0, gy1, .2 + .6 * rnd()), u: -.22, T: lerp(1.35, .78, p), spin: rnd() * 6 });
      }
      S.shoot = Math.max(0, S.shoot - dt);
      if (S.kx || S.ky) { S.tx = clamp(S.tx + S.kx * dt * W * 1.1, gx0, gx1); S.ty = clamp(S.ty + S.ky * dt * H * 1.1, gy0, H * .95); }
      S.gx += (S.tx - S.gx) * Math.min(1, dt * 18); S.gy += (S.ty - S.gy) * Math.min(1, dt * 18); S.bx += (S.gx - S.bx) * Math.min(1, dt * 5.5);
      S.objs = S.objs.filter(function (o) {
        o.u += dt / o.T; if (o.u < 1) return true;
        var d = Math.hypot(S.gx - o.tx, S.gy - o.ty), saved = d <= R * 1.08, perfect = d <= R * .42;
        if (saved) {
          S.saves++; S.combo++; S.best = Math.max(S.best, S.combo); if (perfect) S.perf++; var pts = (perfect ? 150 : 100) * mult(); S.score += pts; pop(o.tx, o.ty - 30, (perfect ? '¡PARADÓN! +' : 'PARADA +') + pts, perfect ? '#fff' : col); spark(o.tx, o.ty, col, perfect ? 26 : 14, 280);
          S.defl.push({ x: o.tx, y: o.ty, vx: (o.tx - S.gx) * 3 + (rnd() - .5) * 240, vy: -240 - rnd() * 160, r: H * .05, life: .75, spin: o.spin }); KG.beep(520 + Math.min(S.combo, 20) * 28, .08, 'triangle', .06); cheer(.35);
        } else { S.goals++; S.combo = 0; pop(o.tx, o.ty, '¡GOL EN CONTRA!', '#fb7185'); spark(o.tx, o.ty, '#fb7185', 22, 260); S.rings.push({ x: o.tx, y: o.ty, l: .7 }); KG.sfx.bad(); shake(); S.hype = Math.max(.2, S.hype - .25); }
        return false;
      });
      if (S.t >= this.dur) end();
    },
    draw: function (dt) {
      var hz = H * .405, gx0 = W * .08, gx1 = W * .92, gy0 = H * .11, gy1 = H * .88, R = this.R(), pw = Math.max(6, W * .013), i, g;
      g = ctx.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, '#04070d'); g.addColorStop(1, '#0d1626'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      crowd(H * .035, H * .365, ['#e11d48', '#2563eb', '#f1f5f9', '#f59e0b', '#16a34a', '#7c3aed'], true, .12); floods(H * .02);
      boards(H * .365, H * .042, 'KINET OS');
      /* césped en perspectiva */
      for (i = 0; i < 14; i++) { var ya = hz + (H - hz) * Math.pow(i / 14, 1.75), yb = hz + (H - hz) * Math.pow((i + 1) / 14, 1.75); ctx.fillStyle = i % 2 ? '#0f5a2b' : '#0b4a23'; ctx.fillRect(0, ya, W, yb - ya + 1); }
      g = ctx.createLinearGradient(0, hz, 0, H); g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.45)'); ctx.fillStyle = g; ctx.fillRect(0, hz, W, H - hz);
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; var yA = hz + (H - hz) * .62, yB = hz + (H - hz) * .2; ctx.beginPath(); ctx.moveTo(W * .22, yB); ctx.lineTo(W * .78, yB); ctx.moveTo(W * .12, yA); ctx.lineTo(W * .88, yA); ctx.moveTo(W * .22, yB); ctx.lineTo(W * .12, yA); ctx.moveTo(W * .78, yB); ctx.lineTo(W * .88, yA); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(W / 2, hz + (H - hz) * .38, 5, 2.6, 0, 0, T2); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fill();
      /* portería lejana + tirador */
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.strokeRect(W / 2 - 24, hz - 8, 48, 14); var sh = S.objs[0], shx = sh ? sh.sx : W / 2, kick = S.shoot > 0;
      ctx.lineCap = 'round'; ctx.strokeStyle = col; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(shx, hz + (H - hz) * .1 - 14); ctx.lineTo(shx, hz + (H - hz) * .1 + 4); ctx.stroke(); ctx.strokeStyle = '#1a2230'; ctx.beginPath(); ctx.moveTo(shx, hz + (H - hz) * .1 + 4); ctx.lineTo(shx - 3, hz + (H - hz) * .1 + 16); ctx.moveTo(shx, hz + (H - hz) * .1 + 4); ctx.lineTo(shx + (kick ? 9 : 3), hz + (H - hz) * .1 + (kick ? 10 : 16)); ctx.stroke(); ctx.fillStyle = '#d6a47c'; ctx.beginPath(); ctx.arc(shx, hz + (H - hz) * .1 - 19, 3.4, 0, T2); ctx.fill();
      /* balones */
      S.objs.forEach(function (o) {
        if (o.u < 0) return; var e = Math.pow(o.u, 1.55), x = lerp(o.sx, o.tx, e), y = lerp(o.sy, o.ty, e) - Math.sin(Math.PI * Math.min(1, o.u)) * H * .08, r = lerp(4, H * .06, Math.pow(o.u, 2.1));
        ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x, lerp(o.sy + 10, gy1, e), r * 1.1, r * .3, 0, 0, T2); ctx.fill();
        ctx.save(); ctx.globalAlpha = .22; for (var k = 1; k < 4; k++) { var e2 = Math.pow(Math.max(0, o.u - k * .035), 1.55); ctx.beginPath(); ctx.arc(lerp(o.sx, o.tx, e2), lerp(o.sy, o.ty, e2) - Math.sin(Math.PI * Math.max(0, o.u - k * .035)) * H * .08, lerp(4, H * .06, Math.pow(Math.max(0, o.u - k * .035), 2.1)), 0, T2); ctx.fillStyle = '#fff'; ctx.fill(); } ctx.restore();
        ball1(x, y, r, o.u * 14 + o.spin);
      });
      S.defl = S.defl.filter(function (d) { d.life -= dt; if (d.life <= 0) return false; d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 420 * dt; d.r *= .985; ball1(d.x, d.y, Math.max(3, d.r * d.life * 1.3), d.spin + d.life * 20); return true; });
      /* red: marco en primer plano */
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(gx0, gy0, gx1 - gx0, gy1 - gy0); ctx.clip('evenodd'); ctx.fillStyle = 'rgba(2,6,10,.45)'; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 1;
      for (i = -H; i < W + H; i += 16) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.moveTo(i, 0); ctx.lineTo(i - H, H); ctx.stroke(); } ctx.restore();
      S.rings = S.rings.filter(function (r) { r.l -= dt; if (r.l <= 0) return false; ctx.strokeStyle = 'rgba(251,113,133,' + r.l + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(r.x, r.y, (.7 - r.l) * 160, 0, T2); ctx.stroke(); return true; });
      ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 14; g = ctx.createLinearGradient(0, 0, 0, pw); g.addColorStop(0, '#fff'); g.addColorStop(1, '#c7d0dc'); ctx.fillStyle = g; ctx.fillRect(gx0 - pw / 2, gy0 - pw / 2, gx1 - gx0 + pw, pw); ctx.fillRect(gx0 - pw / 2, gy0 - pw / 2, pw, gy1 - gy0 + pw); ctx.fillRect(gx1 - pw / 2, gy0 - pw / 2, pw, gy1 - gy0 + pw); ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(0, gy1, W, 3);
      /* portero */
      var bx = S.bx, shY = H * .79, gl = S.gx - R * .5, gr = S.gx + R * .5;
      ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(' + colr + ',.4)'; ctx.lineWidth = R * .22; ctx.shadowColor = col; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.moveTo(bx - R * .55, shY); ctx.lineTo(gl, S.gy); ctx.moveTo(bx + R * .55, shY); ctx.lineTo(gr, S.gy); ctx.stroke(); ctx.shadowBlur = 0;
      g = ctx.createLinearGradient(0, shY, 0, H); g.addColorStop(0, col); g.addColorStop(1, '#06231a'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bx - R * .7, shY); ctx.quadraticCurveTo(bx, shY - R * .35, bx + R * .7, shY); ctx.lineTo(bx + R * .6, H + 4); ctx.lineTo(bx - R * .6, H + 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d6a47c'; ctx.beginPath(); ctx.arc(bx, shY - R * .55, R * .3, 0, T2); ctx.fill(); ctx.fillStyle = '#1b1208'; ctx.beginPath(); ctx.arc(bx, shY - R * .6, R * .31, Math.PI, T2); ctx.fill();
      ctx.strokeStyle = 'rgba(' + colr + ',' + (.28 + .15 * Math.sin(now / 180)) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(S.gx, S.gy, R, 0, T2); ctx.stroke();
      [gl, gr].forEach(function (x) { ctx.fillStyle = '#f8fafc'; ctx.shadowColor = col; ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(x, S.gy, R * .4, 0, T2); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, S.gy - R * .05, R * .4, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); });
    },
    down: function (p, e) { this.move(p, e); }, move: function (p, e) { var off = e && e.pointerType === 'touch' ? 46 : 0; S.tx = clamp(p.x, W * .08, W * .92); S.ty = clamp(p.y - off, H * .11, H * .95); },
    key: function (k, d) { var v = d ? 1 : 0; if (k === 'left') S.kx = d ? -1 : (S.kx < 0 ? 0 : S.kx); if (k === 'right') S.kx = d ? 1 : (S.kx > 0 ? 0 : S.kx); if (k === 'up') S.ky = d ? -1 : (S.ky < 0 ? 0 : S.ky); if (k === 'down') S.ky = d ? 1 : (S.ky > 0 ? 0 : S.ky); },
    hud: function () { return { l: ['Puntos', S.score], c: [Math.ceil(Math.max(0, this.dur - S.t)), 'segundos', this.dur - S.t < 6], r: ['Combo', '×' + mult()] }; },
    result: function () {
      var sc = S.score, tot = S.saves + S.goals, acc = tot ? Math.round(S.saves / tot * 100) : 0; return { score: sc, tier: sc >= 7000 ? 4 : sc >= 4500 ? 3 : sc >= 2200 ? 2 : sc >= 800 ? 1 : 0, kicker: 'Fin del partido · Portero', lines: [S.saves + ' paradas · ' + S.perf + ' paradones · ' + S.goals + ' goles encajados', 'Mejor racha: ' + S.best + ' paradas seguidas (×' + Math.min(4, 1 + Math.floor(S.best / 5)) + ')', acc + ' % de paradas'], win: sc >= 2200 };
    }
  };
  function mult() { return Math.min(4, 1 + Math.floor(S.combo / 5)); }

  /* ═════════ BALONCESTO · Defender el tiro ═════════ */
  var GB = {
    dur: 40, ctl: '<button type="button" class="rf-b big" data-k="act">TAPAR</button>', hud0: ['Tapones', 'Tiempo', 'Racha'],
    intro: { role: 'Defensor', h: 'Tapa <em>el lanzamiento</em>', p: 'El tirador se eleva para lanzar. <b>Salta a tapar justo cuando suelta el balón</b>: si saltas ante una finta, te supera; si llegas tarde, anota. Lee sus piernas.', keys: ['ESPACIO'], note: 'o toca la pantalla', meta: [['40 s', 'de partido'], ['×4', 'combo máx.'], ['3', 'tipos de jugada']] },
    init: function () { S.ph = 'drib'; S.pt = .8; S.sx = null; S.real = true; S.blk = 0; S.tp = -9; S.shots = 0; S.blocks = 0; S.read = 0; S.bit = 0; S.conc = 0; S.perf = 0; S.fly = null; S.ctr = null; S.driveX = 0; S.hoopShake = 0; S.msgT = 0; S.heldUp = false; },
    geo: function () { return { sx0: W * .27, dx: W * .44, hx: W * .86, hy: H * .27, hS: H * .36, hD: H * .43, fyS: H * .86, fyD: H * .94 }; },
    handUp: function () { var a = S.t - S.tp; return a >= .06 && a <= .44; },
    update: function (dt) {
      var p = S.t / this.dur; S.pt -= dt; S.hoopShake = Math.max(0, S.hoopShake - dt);
      var gatherT = lerp(.72, .4, p), riseT = .66, relT = .42, fakeEnd = .24;
      if (S.ph === 'drib' && S.pt <= 0) { S.ph = 'gather'; S.pt = gatherT; S.real = rnd() > lerp(.3, .48, p); S.tau = 0; }
      else if (S.ph === 'gather' && S.pt <= 0) { S.ph = 'rise'; S.tau = 0; S.rel = false; S.bitNow = false; }
      else if (S.ph === 'rise') {
        S.tau += dt;
        if (!S.real) {
          if (this.handUp() && S.tau < fakeEnd + .1) S.bitNow = true;
          if (S.tau >= fakeEnd + .22) { if (S.bitNow) { S.bit++; S.combo = 0; S.score = Math.max(0, S.score - 80); pop(this.geo().dx, H * .4, 'TE HA SUPERADO −80', '#fb7185'); KG.sfx.bad(); S.ph = 'drive'; S.pt = .85; S.driveX = 0; } else { S.read++; S.score += 40; pop(this.geo().dx, H * .4, 'FINTA LEÍDA +40', col); KG.beep(700, .06, 'triangle', .05); S.ph = 'after'; S.pt = .5; } }
        } else if (!S.rel && S.tau >= relT) {
          S.rel = true; S.shots++; var up = this.handUp(), G0 = this.geo(), f0 = S.hand || { x: G0.sx0 + G0.hS * .15, y: G0.fyS - G0.hS * 1.25 };
          if (up) {
            S.blocks++; S.combo++; S.best = Math.max(S.best, S.combo); var tc = Math.abs((S.t - S.tp) - .22) < .09, pts = (tc ? 200 : 150) * mult(); if (tc) S.perf++; S.score += pts; pop(G0.dx, H * .3, (tc ? '¡TAPÓN BRUTAL! +' : '¡TAPÓN! +') + pts, tc ? '#fff' : col); spark(G0.dx - 20, G0.fyD - G0.hD * 1.5, col, 26, 300); cheer(.5); KG.sfx.ok(); shake();
            S.fly = { kind: 'block', x: G0.dx - 14, y: G0.fyD - G0.hD * 1.5, vx: -340, vy: -120, l: 1.1 }; S.ph = 'after'; S.pt = .85;
          } else { S.fly = { kind: 'shot', u: 0, x0: f0.x, y0: f0.y, T: .95 }; S.ph = 'after'; S.pt = 1.3; S.combo = 0; S.msgT = 0; }
        }
        if (S.real && S.tau >= riseT + .1) { /* seguridad */ }
      } else if (S.ph === 'drive') { S.driveX = Math.min(1, S.driveX + dt / .5); if (S.driveX >= 1 && !S.fly) { var G1 = this.geo(); S.fly = { kind: 'lay', u: 0, x0: G1.sx0 + W * .27, y0: G1.fyS - G1.hS * 1.1, T: .5 }; } if (S.pt <= 0) { S.ph = 'after'; S.pt = .4; } }
      else if (S.ph === 'after') { if (S.real) S.tau += dt; if (S.pt <= 0) { S.ph = 'drib'; S.pt = lerp(.7, .35, p) * (.8 + .5 * rnd()); S.fly = null; S.driveX = 0; } }
      /* vuelo del balón */
      var f = S.fly;
      if (f) {
        if (f.kind === 'shot' || f.kind === 'lay') { f.u += dt / f.T; if (f.u >= 1 && !f.done) { f.done = true; S.conc++; S.hoopShake = .6; pop(this.geo().hx, this.geo().hy - 40, f.kind === 'lay' ? 'CANASTA RIVAL' : 'CANASTA RIVAL', '#fb7185'); KG.beep(300, .12, 'sawtooth', .04); S.hype = Math.max(.2, S.hype - .2); } }
        else { f.l -= dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 520 * dt; if (f.l <= 0) S.fly = null; }
      }
      if (S.t >= this.dur) end();
    },
    act: function () {
      if (S.t - S.tp < .62) return; S.tp = S.t; KG.beep(420, .05, 'square', .03);
      if (S.ph === 'drib' || S.ph === 'gather' || S.ph === 'after') { S.combo = Math.max(0, S.combo - 1); }
    },
    draw: function (dt) {
      var g0 = this.geo(), i, g, p = S.t / this.dur, fyS = g0.fyS;
      g = ctx.createLinearGradient(0, 0, 0, H * .6); g.addColorStop(0, '#05070d'); g.addColorStop(1, '#16102a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      crowd(H * .03, H * .56, ['#fb923c', '#f1f5f9', '#2563eb', '#e11d48', '#facc15', '#7c3aed'], true, .4); floods(H * .02);
      /* marcador colgante */
      var bw = Math.min(W * .34, 330), bh = H * .1, by0 = H * .16; g = ctx.createLinearGradient(0, 0, 0, bh); g.addColorStop(0, '#0e1623'); g.addColorStop(1, '#070b13'); ctx.fillStyle = g; ctx.strokeStyle = 'rgba(' + colr + ',.6)'; ctx.lineWidth = 2; ctx.fillRect(W / 2 - bw / 2, by0, bw, bh); ctx.strokeRect(W / 2 - bw / 2, by0, bw, bh);
      ctx.fillStyle = '#fff'; ctx.font = '900 ' + Math.round(bh * .5) + 'px Orbitron,Inter,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = col; ctx.shadowBlur = 10; ctx.fillText(S.blocks + '  –  ' + S.conc, W / 2, by0 + bh * .5 + 1); ctx.shadowBlur = 0; ctx.font = '700 ' + Math.round(bh * .17) + 'px Inter,sans-serif'; ctx.fillStyle = col; ctx.fillText('TAPONES   ·   CANASTAS RIVAL', W / 2, by0 + bh * .88);
      boards(H * .56, H * .05, 'KINET OS');
      /* parquet */
      g = ctx.createLinearGradient(0, H * .61, 0, H); g.addColorStop(0, '#b27234'); g.addColorStop(1, '#6e3e15'); ctx.fillStyle = g; ctx.fillRect(0, H * .61, W, H * .39);
      for (i = 0; i < 28; i++) { ctx.fillStyle = i % 2 ? 'rgba(255,224,170,.05)' : 'rgba(40,16,0,.07)'; ctx.fillRect(i * W / 28, H * .61, W / 28, H * .39); ctx.fillStyle = 'rgba(30,12,0,.16)'; ctx.fillRect(i * W / 28, H * .61, 1, H * .39); }
      g = ctx.createLinearGradient(0, H * .61, 0, H); g.addColorStop(0, 'rgba(0,0,0,.4)'); g.addColorStop(.35, 'rgba(255,255,255,.08)'); g.addColorStop(1, 'rgba(0,0,0,.35)'); ctx.fillStyle = g; ctx.fillRect(0, H * .61, W, H * .39);
      ctx.fillStyle = 'rgba(' + colr + ',.22)'; ctx.fillRect(W * .62, H * .72, W * .38, H * .2); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2.5; ctx.strokeRect(W * .62, H * .72, W * .38, H * .2); ctx.beginPath(); ctx.ellipse(W * .62, H * .82, W * .06, H * .1, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(g0.hx - W * .02, H * .82, W * .5, H * .13, 0, Math.PI * .5, Math.PI * 1.5); ctx.stroke();
      /* canasta */
      var hx = g0.hx, hy = g0.hy; ctx.fillStyle = '#6b7280'; ctx.fillRect(hx + W * .06, hy - H * .02, W * .012, H * .5); ctx.fillStyle = 'rgba(235,244,255,.95)'; ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 3; ctx.fillRect(hx + W * .02, hy - H * .16, W * .012, H * .2); ctx.fillStyle = 'rgba(190,214,240,.35)'; ctx.fillRect(hx + W * .005, hy - H * .16, W * .03, H * .2); ctx.strokeStyle = '#fb923c'; ctx.strokeRect(hx + W * .012, hy - H * .1, W * .02, H * .07);
      ctx.strokeStyle = '#f97316'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(hx - W * .02, hy, W * .035, H * .012, 0, 0, T2); ctx.stroke();
      var sh = S.hoopShake > 0 ? Math.sin(now / 30) * 4 * S.hoopShake : 0; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.2; for (i = 0; i <= 6; i++) { var nx = hx - W * .055 + i * W * .0117; ctx.beginPath(); ctx.moveTo(nx, hy + 2); ctx.lineTo(hx - W * .045 + i * W * .0083 + sh, hy + H * .085); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(hx - W * .05, hy + H * .04); ctx.lineTo(hx + W * .0, hy + H * .04); ctx.stroke();
      /* sombras */
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(g0.sx0, g0.fyS + 4, g0.hS * .3, g0.hS * .05, 0, 0, T2); ctx.fill(); ctx.beginPath(); ctx.ellipse(g0.dx, g0.fyD + 4, g0.hD * .3, g0.hD * .05, 0, 0, T2); ctx.fill();
      /* tirador */
      var o = { face: 1, col: '#e5e7eb', sh: '#334155', lean: .2 }, ph = S.ph, hand, jump = 0, bx, by, bounce;
      var sx = g0.sx0 + (ph === 'drive' || (S.fly && S.fly.kind === 'lay') ? Math.min(1, S.driveX) * W * .27 : 0);
      if (ph === 'drib') { o.crouch = .08; o.arm = .1; hand = figure(sx, fyS, g0.hS, o); bounce = Math.abs(Math.sin(now / 150)); bx = hand.x + 4; by = lerp(fyS - 8, hand.y + 6, bounce); ball2(bx, by, g0.hS * .06, now / 120); }
      else if (ph === 'gather') { var k = 1 - Math.max(0, S.pt) / lerp(.72, .4, p); o.crouch = .15 + .6 * ease(k); o.arm = .35 + .2 * k; o.lean = .5; hand = figure(sx, fyS, g0.hS, o); ball2(hand.x + 2, hand.y + 4, g0.hS * .06, 0); }
      else if (ph === 'rise') {
        var tt = S.tau, ar, cr, jj;
        if (S.real) { var m = clamp(tt / .66, 0, 1); jj = Math.sin(Math.PI * m) * g0.hS * .22; ar = ease(tt / .42) * .95 + .05; cr = Math.max(0, .75 - tt * 3); jump = jj; if (tt < .42) { o.crouch = cr; o.arm = ar; o.jump = jj; hand = figure(sx, fyS, g0.hS, o); S.hand = { x: hand.x, y: hand.y - g0.hS * .06 }; ball2(hand.x, hand.y - g0.hS * .06, g0.hS * .06, 0); } else { o.crouch = 0; o.arm = ar; o.jump = jj; figure(sx, fyS, g0.hS, o); } }
        else { var m2 = tt < .24 ? tt / .24 : Math.max(0, 1 - (tt - .24) / .22); ar = .35 + .4 * ease(m2); o.crouch = .75 * (1 - m2); o.arm = ar; o.lean = .5; hand = figure(sx, fyS, g0.hS, o); ball2(hand.x, hand.y - g0.hS * .05, g0.hS * .06, 0); }
      } else if (ph === 'drive') { o.crouch = .1; o.arm = .2; o.lean = .8; hand = figure(sx, fyS, g0.hS, o); ball2(hand.x + 2, fyS - 10 - Math.abs(Math.sin(now / 90)) * 30, g0.hS * .06, now / 90); }
      else { o.crouch = 0; o.arm = .7; o.lean = .3; if (S.fly && S.fly.kind === 'lay') { o.arm = 1; o.jump = g0.hS * .2; } else if (S.real && S.tau < .66) { o.arm = 1; o.jump = Math.sin(Math.PI * clamp(S.tau / .66, 0, 1)) * g0.hS * .22; } figure(sx, fyS, g0.hS, o); }
      /* balón en vuelo */
      var f = S.fly;
      if (f && (f.kind === 'shot' || f.kind === 'lay')) { var u = Math.min(1, f.u), x = lerp(f.x0, hx - W * .02, u), y = lerp(f.y0, hy, u) - Math.sin(Math.PI * u) * (f.kind === 'lay' ? H * .06 : H * .2); ctx.globalAlpha = f.done ? Math.max(0, 1 - (f.u - 1) * 4) : 1; ball2(x, f.done ? hy + (f.u - 1) * H * .5 : y, g0.hS * .06, u * 12); ctx.globalAlpha = 1; }
      else if (f && f.kind === 'block') { ball2(f.x, f.y, g0.hS * .06, now / 60); }
      /* defensor (tú) */
      var tA = S.t - S.tp, ua = 0, dj = 0; if (tA >= 0 && tA < .72) { ua = tA < .14 ? ease(tA / .14) : tA < .44 ? 1 : 1 - ease((tA - .44) / .28); dj = Math.sin(Math.PI * clamp(tA / .72, 0, 1)) * g0.hD * .2; }
      if (S.ph === 'drive') { ua *= .5; }
      figure(g0.dx, g0.fyD, g0.hD, { face: -1, col: col, sh: '#052e1a', arm: ua, jump: dj, crouch: ua ? 0 : .1 * Math.abs(Math.sin(now / 300)), glow: col, lean: .1 });
      if (ua > .6) { ctx.strokeStyle = 'rgba(' + colr + ',.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(g0.dx - g0.hD * .05, g0.fyD - dj - g0.hD * 1.3, g0.hD * .22, 0, T2); ctx.stroke(); }
      /* aviso de telegrafía */
      if (S.ph === 'gather' || (S.ph === 'rise' && S.tau < .2)) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '700 ' + (W < 700 ? 12 : 14) + 'px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.fillText(S.ph === 'gather' ? 'Prepara el salto…' : '¿Tira o finta?', g0.sx0 + W * .08, g0.fyS - g0.hS * 1.45); }
      /* indicador de recarga del salto */
      var cd = clamp((S.t - S.tp) / .62, 0, 1); if (cd < 1 && S.t > .5) { ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(g0.dx - 28, g0.fyD + 10, 56, 5); ctx.fillStyle = col; ctx.fillRect(g0.dx - 28, g0.fyD + 10, 56 * cd, 5); }
    },
    down: function () { this.act(); }, key: function (k, d) { if (d && k === 'act') this.act(); },
    hud: function () { return { l: ['Puntos', S.score], c: [Math.ceil(Math.max(0, this.dur - S.t)), 'segundos', this.dur - S.t < 6], r: ['Combo', '×' + mult()] }; },
    result: function () {
      var sc = S.score, tot = S.blocks + S.conc; return { score: sc, tier: sc >= 3800 ? 4 : sc >= 2400 ? 3 : sc >= 1200 ? 2 : sc >= 400 ? 1 : 0, kicker: 'Fin del partido · Defensor', lines: [S.blocks + ' tapones (' + S.perf + ' perfectos) · ' + S.conc + ' canastas encajadas', S.read + ' fintas leídas · ' + S.bit + ' veces te han superado', tot ? Math.round(S.blocks / tot * 100) + ' % de tiros taponados' : 'Sin tiros defendidos'], win: sc >= 1200 };
    }
  };

  /* ═════════ RUNNING · Salida y sprint ═════════ */
  var LV = [{ n: 'Series', D: 60, vm: 9.2 }, { n: 'Semifinal', D: 100, vm: 10.0 }, { n: 'Final', D: 150, vm: 10.8 }];
  function sprinter(x, fy, h, ph, c, pose, lab) {
    var hip, lean, lw = h * .075, neck, i, L1 = h * .26;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x, fy + 2, h * .3, h * .04, 0, 0, T2); ctx.fill();
    if (pose === 'block') { hip = { x: x, y: fy - h * .38 }; lean = 1.15; } else if (pose === 'set') { hip = { x: x, y: fy - h * .46 }; lean = .95; } else { hip = { x: x, y: fy - h * .52 + Math.abs(Math.sin(ph)) * h * .025 }; lean = .42; }
    neck = { x: hip.x + Math.sin(lean) * h * .3, y: hip.y - Math.cos(lean) * h * .3 };
    function leg(a, bend, c2) { var kx = hip.x + Math.sin(a) * L1, ky = hip.y + Math.cos(a) * L1, b = a - bend, fx = kx + Math.sin(b) * L1, fy2 = ky + Math.cos(b) * L1; ctx.strokeStyle = c2; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(hip.x, hip.y); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy2); ctx.stroke(); }
    function arm(a, c2) { var ex = neck.x + Math.sin(a) * h * .19, ey = neck.y + Math.cos(a) * h * .19, b = a + 1.25, hx = ex + Math.sin(b) * h * .17, hy = ey + Math.cos(b) * h * .17; ctx.strokeStyle = c2; ctx.lineWidth = lw * .62; ctx.beginPath(); ctx.moveTo(neck.x, neck.y + h * .02); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke(); }
    if (pose === 'run') { var a1 = Math.sin(ph) * .95, a2 = Math.sin(ph + Math.PI) * .95; leg(a2, .3 + 1.0 * Math.max(0, Math.cos(ph + Math.PI)), '#1a2230'); arm(Math.sin(ph) * 1.0, '#c4906a'); }
    else if (pose === 'set') { leg(.2, -.1, '#1a2230'); leg(.95, 1.7, '#243046'); ctx.strokeStyle = '#c4906a'; ctx.lineWidth = lw * .6; ctx.beginPath(); ctx.moveTo(neck.x, neck.y + h * .02); ctx.lineTo(neck.x + h * .05, fy); ctx.stroke(); }
    else { leg(-.5, -.1, '#1a2230'); leg(.95, 1.7, '#243046'); ctx.strokeStyle = '#c4906a'; ctx.lineWidth = lw * .6; ctx.beginPath(); ctx.moveTo(neck.x, neck.y + h * .02); ctx.lineTo(neck.x + h * .08, fy); ctx.stroke(); }
    ctx.strokeStyle = c; ctx.lineWidth = h * .15; ctx.beginPath(); ctx.moveTo(hip.x, hip.y - h * .02); ctx.lineTo(neck.x, neck.y + h * .02); ctx.stroke();
    ctx.strokeStyle = '#111827'; ctx.lineWidth = h * .14; ctx.beginPath(); ctx.moveTo(hip.x - h * .02, hip.y + h * .03); ctx.lineTo(hip.x + h * .02, hip.y - h * .04); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = '800 ' + Math.round(h * .1) + 'px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(lab, (hip.x + neck.x) / 2, (hip.y + neck.y) / 2);
    if (pose === 'run') { arm(-Math.sin(ph) * 1.0, '#e0b08c'); leg(a1, .3 + 1.0 * Math.max(0, Math.cos(ph)), '#2b3a55'); }
    ctx.fillStyle = '#e0b08c'; ctx.beginPath(); ctx.arc(neck.x + Math.sin(lean) * h * .09, neck.y - Math.cos(lean) * h * .09, h * .075, 0, T2); ctx.fill(); ctx.fillStyle = '#1b1208'; ctx.beginPath(); ctx.arc(neck.x + Math.sin(lean) * h * .07, neck.y - Math.cos(lean) * h * .1, h * .078, Math.PI * .95, Math.PI * 1.95); ctx.fill();
    ctx.restore();
  }
  function newRace(k) {
    var L = LV[k], rs = [], cs = ['#fb7185', '#fbbf24', '#60a5fa'], ci = 0, i;
    for (i = 0; i < 4; i++) { if (i === 2) rs.push({ me: true, lane: i, d: 0, v: 0, fin: 0 }); else rs.push({ lane: i, d: 0, v: 0, col: cs[ci++], rt: .16 + rnd() * .12, vm: L.vm + (rnd() - .5) * .8, fin: 0 }); }
    return { k: k, L: L, ph: 'intro', t: 0, wait: 0, tRun: 0, rs: rs, places: 0, rt: null };
  }
  var GR = {
    dur: 0, ctl: '<button type="button" class="rf-b pad" data-k="left">IZQ · A</button><button type="button" class="rf-b pad" data-k="right">DER · D</button>', noRepeat: true,
    intro: { role: 'Atleta', h: 'Pistoletazo <em>y sprint</em>', p: 'Espera el disparo y <b>reacciona al instante</b>: si sales antes, falsa salida. Después pulsa rápido, <b>alternando izquierda y derecha</b>, hasta la meta. Entre los 3 primeros pasas de ronda.', keys: ['A', 'D'], note: 'o toca los dos lados', meta: [['3', 'rondas'], ['60→150 m', 'distancia'], ['Top 3', 'pasa de ronda']] },
    init: function () { S.race = newRace(0); S.taps = 0; S.fs = 0; S.lastSide = ''; S.rts = []; S.places = []; S.dq = false; S.elim = false; S.complete = false; S.flashW = 0; S.msg = ''; S.pad = { left: 0, right: 0 }; S.smoke = []; },
    me: function () { return S.race.rs[2]; },
    step: function (dt) {
      var R = S.race; R.tRun += dt;
      R.rs.forEach(function (r) {
        if (r.me && r.fin) { r.v = Math.max(0, r.v * (1 - 3 * dt)); r.d += r.v * dt; return; }
        if (r.fin && !r.me) { r.v *= .985; r.d += r.v * dt * .6; return; }
        if (r.me) { r.v = Math.max(0, r.v - r.v * .95 * dt); } else if (R.tRun > r.rt) { var tau = R.tRun - r.rt; r.v = r.vm * (1 - Math.exp(-tau / 1.15)) * (1 + Math.sin(R.tRun * 7 + r.lane) * .015); }
        r.d += r.v * dt; if (r.d >= R.L.D && !r.fin) { R.places++; r.fin = R.places; r.tfin = R.tRun; r.d = R.L.D; if (r.me) { this.finishMe(); } }
      }, this);
    },
    finishMe: function () {
      var R = S.race, pl = R.rs[2].fin, pts = [600, 400, 250, 100][pl - 1] * (1 + .25 * R.k), rb = R.rt == null ? 0 : R.rt < .2 ? 250 : R.rt < .28 ? 150 : R.rt < .4 ? 70 : 0;
      S.score += Math.round(pts + rb); S.places.push(pl); if (R.rt != null) S.rts.push(R.rt); R.ph = 'done'; R.t = 0; R.pts = Math.round(pts + rb); R.rb = rb;
      KG.sfx[pl <= 3 ? 'ok' : 'bad'](); if (pl === 1) { cheer(.6); S.confetti = 1; } spark(W * .88, H * .6, col, 28, 340);
    },
    update: function (dt) {
      var R = S.race; R.t += dt; S.flashW = Math.max(0, S.flashW - dt * 2.2); S.pad.left = Math.max(0, S.pad.left - dt * 6); S.pad.right = Math.max(0, S.pad.right - dt * 6);
      if (R.ph === 'intro') { if (R.t > 1.6) { R.ph = 'marks'; R.t = 0; } }
      else if (R.ph === 'marks') { if (R.t > 1.2) { R.ph = 'set'; R.t = 0; R.wait = .9 + rnd() * 2; } }
      else if (R.ph === 'set') { if (R.t >= R.wait) { R.ph = 'run'; R.t = 0; R.tRun = 0; S.flashW = 1; KG.beep(70, .3, 'sawtooth', .22, 30); KG.beep(1800, .06, 'square', .1); for (var i = 0; i < 14; i++) S.smoke.push({ x: W * .06, y: H * .43, vx: 30 + rnd() * 90, vy: -20 - rnd() * 50, r: 4 + rnd() * 8, l: 1 }); } }
      else if (R.ph === 'run') { this.step(dt); }
      else if (R.ph === 'done') {
        this.step(dt);
        if (R.t > 2.7) { var pl = R.rs[2].fin; if (pl > 3) { S.elim = true; end(); } else if (R.k >= 2) { S.complete = true; end(); } else { S.race = newRace(R.k + 1); } }
      }
    },
    tap: function (side) {
      var R = S.race, me = R.rs[2]; S.pad[side] = 1;
      if (R.ph === 'marks' || R.ph === 'set') {
        S.fs++; S.score = Math.max(0, S.score - 250); KG.sfx.bad(); shake(); pop(W / 2, H * .3, '¡FALSA SALIDA! −250', '#fb7185');
        if (S.fs >= 2) { S.dq = true; end(); return; } R.ph = 'marks'; R.t = 0; return;
      }
      if (R.ph !== 'run' || me.fin) return;
      if (R.rt == null) R.rt = R.tRun;
      var alt = side !== S.lastSide; me.v = Math.min(12.5, me.v + (alt ? 1.5 : .85) + (me.v < 3 ? .8 : 0)); S.lastSide = side; S.taps++; if (S.taps % 4 === 0) KG.beep(300 + me.v * 18, .03, 'square', .02);
    },
    down: function (p) { this.tap(p.x < W / 2 ? 'left' : 'right'); },
    key: function (k, d) { if (!d) return; if (k === 'left' || k === 'right') this.tap(k); else if (k === 'act' || k === 'up' || k === 'down') this.tap(S.lastSide === 'left' ? 'right' : 'left'); },
    draw: function (dt) {
      var R = S.race, i, g, ty = H * .45, lh = H * .095, x0 = W * .13, x1 = W * .88, D = R.L.D;
      g = ctx.createLinearGradient(0, 0, 0, H * .42); g.addColorStop(0, '#04070d'); g.addColorStop(1, '#0f1a2c'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      crowd(H * .035, H * .395, ['#22d3ee', '#f1f5f9', '#e11d48', '#facc15', '#16a34a', '#2563eb'], true, .22); floods(H * .02); boards(H * .395, H * .045, 'KINET OS');
      /* pista */
      g = ctx.createLinearGradient(0, ty, 0, ty + lh * 4); g.addColorStop(0, '#b73a2e'); g.addColorStop(1, '#8e2a22'); ctx.fillStyle = g; ctx.fillRect(0, ty, W, lh * 4);
      ctx.fillStyle = '#1b6b3a'; ctx.fillRect(0, ty + lh * 4, W, H - ty - lh * 4); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, ty + lh * 4, W, 5);
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2; for (i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(0, ty + i * lh); ctx.lineTo(W, ty + i * lh); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.font = '800 ' + Math.round(lh * .5) + 'px Orbitron,Inter,sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; for (i = 0; i < 4; i++) ctx.fillText(String(i + 1), W * .02, ty + (i + .5) * lh);
      ctx.fillStyle = '#fff'; ctx.fillRect(x0 - 2, ty, 4, lh * 4);
      for (i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#111'; ctx.fillRect(x1 - 7, ty + i * lh / 2, 7, lh / 2); ctx.fillStyle = i % 2 ? '#111' : '#fff'; ctx.fillRect(x1, ty + i * lh / 2, 7, lh / 2); }
      for (var m = 0; m <= D; m += 10) { var mx = lerp(x0, x1, m / D); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(mx, ty + lh * 4 + 4); ctx.lineTo(mx, ty + lh * 4 + (m % 50 === 0 ? 16 : 9)); ctx.stroke(); if (m % 50 === 0 || m === D) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = '700 11px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.fillText(m + ' m', mx, ty + lh * 4 + 28); } }
      /* pórtico de meta con reloj */
      ctx.fillStyle = '#222b3a'; ctx.fillRect(x1 + 3, H * .29, 6, ty - H * .29); ctx.fillRect(x1 - 70, H * .29, 80, H * .075); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.strokeRect(x1 - 70, H * .29, 80, H * .075); ctx.fillStyle = '#fff'; ctx.font = '900 ' + Math.round(H * .028) + 'px Orbitron,Inter,sans-serif'; ctx.textAlign = 'center'; ctx.fillText('META', x1 - 30, H * .312); ctx.fillStyle = col; ctx.font = '700 ' + Math.round(H * .03) + 'px "JetBrains Mono",monospace'; ctx.fillText((R.tRun || 0).toFixed(2), x1 - 30, H * .342);
      /* corredores */
      var pose = R.ph === 'set' ? 'set' : (R.ph === 'intro' || R.ph === 'marks') ? 'block' : 'run';
      R.rs.forEach(function (r) {
        var x = lerp(x0, x1, r.d / D) - (r.d >= D ? 0 : 0), fy = ty + (r.lane + .93) * lh, h = lh * 1.75 * (1 + r.lane * .035), ph = r.d * 1.55 + r.lane;
        var c = r.me ? col : r.col; if (r.me && R.ph === 'run' && r.v > 5) { ctx.strokeStyle = 'rgba(255,255,255,' + Math.min(.4, r.v / 30) + ')'; ctx.lineWidth = 2; for (var k = 0; k < 5; k++) { var ly = fy - h * (.15 + k * .17), lx = x - h * .3 - ((now / 8 + k * 37) % 60); ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx - 30 - r.v * 2, ly); ctx.stroke(); } }
        if (r.me) { ctx.fillStyle = 'rgba(' + colr + ',.18)'; ctx.beginPath(); ctx.ellipse(x, fy, h * .34, h * .07, 0, 0, T2); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, fy + 1, h * .34, h * .07, 0, 0, T2); ctx.stroke(); }
        sprinter(x, fy, h, ph, c, r.fin && !r.me && r.d >= D ? 'run' : pose, r.me ? 'TÚ' : String(r.lane + 1));
        if (r.me) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, fy - h * 1.15); ctx.lineTo(x - 7, fy - h * 1.3); ctx.lineTo(x + 7, fy - h * 1.3); ctx.closePath(); ctx.fill(); }
      });
      /* juez de salida */
      var sx = W * .05, sy = ty - 2; ctx.fillStyle = '#e5e7eb'; ctx.fillRect(sx - 6, sy - lh * 1.15, 12, lh * 1.1); ctx.fillStyle = '#d6a47c'; ctx.beginPath(); ctx.arc(sx, sy - lh * 1.25, 6, 0, T2); ctx.fill(); ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, sy - lh * 1.05); ctx.lineTo(sx + 14, sy - lh * 1.5); ctx.stroke();
      if (S.flashW > .5) { ctx.fillStyle = '#fff'; ctx.shadowColor = '#fde68a'; ctx.shadowBlur = 30; ctx.beginPath(); for (i = 0; i < 8; i++) { var a = i * .785, rr = i % 2 ? 8 : 24; ctx.lineTo(sx + 14 + Math.cos(a) * rr, sy - lh * 1.5 + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; }
      S.smoke = S.smoke.filter(function (q) { q.l -= dt * .9; if (q.l <= 0) return false; q.x += q.vx * dt; q.y += q.vy * dt; ctx.fillStyle = 'rgba(220,225,235,' + q.l * .35 + ')'; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (2 - q.l), 0, T2); ctx.fill(); return true; });
      if (S.flashW > 0) { ctx.fillStyle = 'rgba(255,255,255,' + S.flashW * .3 + ')'; ctx.fillRect(0, 0, W, H); }
      /* rótulos */
      var txt = '', sub = '', cc = '#fff';
      if (R.ph === 'intro') { txt = R.L.n.toUpperCase(); sub = R.L.D + ' metros · ronda ' + (R.k + 1) + ' de 3'; } else if (R.ph === 'marks') { txt = 'A SUS PUESTOS'; } else if (R.ph === 'set') { txt = 'LISTOS…'; cc = '#fbbf24'; } else if (R.ph === 'run' && R.tRun < .6) { txt = '¡YA!'; cc = col; }
      else if (R.ph === 'done') { var pl = R.rs[2].fin; txt = pl + '.º PUESTO'; cc = pl <= 3 ? col : '#fb7185'; sub = (R.rs[2].tfin || 0).toFixed(2) + ' s' + (R.rt != null ? ' · reacción ' + Math.round(R.rt * 1000) + ' ms' : '') + ' · +' + R.pts + ' pts' + (pl > 3 ? ' · eliminado' : R.k >= 2 ? ' · ¡campeón de la final!' : ' · pasas de ronda'); }
      if (txt) { ctx.save(); ctx.globalAlpha = R.ph === 'run' ? Math.max(0, 1 - R.tRun / .6) : 1; ctx.fillStyle = cc; ctx.shadowColor = cc; ctx.shadowBlur = 24; ctx.font = '900 ' + Math.round(clamp(W * .05, 24, 54)) + 'px Orbitron,Inter,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, W / 2, H * .24); ctx.shadowBlur = 0; if (sub) { ctx.fillStyle = '#e5e7eb'; ctx.font = '700 ' + (W < 700 ? 12 : 15) + 'px Inter,sans-serif'; ctx.fillText(sub, W / 2, H * .24 + clamp(W * .045, 24, 40)); } ctx.restore(); }
      /* aviso de ritmo */
      if (R.ph === 'run' && !R.rs[2].fin && R.tRun > .5 && R.tRun < 4) { ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '700 ' + (W < 700 ? 12 : 14) + 'px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.fillText('¡Alterna izquierda y derecha para ir más rápido!', W / 2, H * .2); }
    },
    hud: function () { var R = S.race, me = R.rs[2]; return { l: ['Puntos', S.score], c: [R.tRun.toFixed(2), R.ph === 'run' || R.ph === 'done' ? 'segundos' : R.L.n + ' · ' + R.L.D + ' m', false], r: ['Velocidad', Math.round(me.v * 3.6) + ' km/h'] }; },
    result: function () {
      var sc = S.score, best = S.rts.length ? Math.min.apply(null, S.rts) : null; return { score: sc, tier: sc >= 2900 ? 4 : sc >= 1900 ? 3 : sc >= 1100 ? 2 : sc >= 500 ? 1 : 0, kicker: S.dq ? 'Descalificado · Atleta' : S.elim ? 'Eliminado · Atleta' : 'Final disputada · Atleta',
        lines: [S.dq ? 'Dos falsas salidas: descalificado' : S.elim ? 'Eliminado en ' + LV[S.race.k].n.toLowerCase() : '¡Has terminado las 3 rondas!', 'Puestos: ' + (S.places.length ? S.places.map(function (p) { return p + '.º'; }).join(' · ') : '—') + ' · ' + S.taps + ' pulsaciones', best != null ? 'Mejor reacción: ' + Math.round(best * 1000) + ' ms' + (best < .2 ? ' (¡élite!)' : '') : 'Sin reacción registrada'], win: S.complete && sc >= 1100 };
    }
  };

  /* ═════════ TENIS · Partido (resto) ═════════ */
  var REACH = .2, hz0 = .2;
  function TP(xw, zw, hg) { var d = 1 + (1 - zw) * 2.3, s = 1 / d, hn = GT.hn(); return { x: W / 2 + xw * hn * s, y: H * hz0 + H * .72 / d - (hg || 0) * hn * s, s: s }; }
  var TN = ['0', '15', '30', '40', 'GAME'];
  var GT = {
    dur: 0, noRepeat: true, ctl: '<button type="button" class="rf-b" data-k="left">◀</button><button type="button" class="rf-b big" data-k="act">GOLPEAR</button><button type="button" class="rf-b" data-k="right">▶</button>',
    intro: { role: 'Resto', h: 'Partido <em>de tenis</em>', p: 'Devuelve cada saque. <b>Mueve al jugador</b> con ratón, dedo o flechas y <b>golpea cuando la bola entre en el aro</b>. Mantén ◀ o ▶ al golpear para dirigir la bola lejos del rival. Gana el primero a 4 puntos.', keys: ['←', '→', 'ESPACIO'], note: 'o arrastra y toca', meta: [['4', 'puntos'], ['Aro', 'de timing'], ['Rally', 'cuenta']] },
    hn: function () { return Math.min(W * .44, H * .95); },
    init: function () { S.px = 0; S.ox = 0; S.pt = [0, 0]; S.state = 'serve'; S.stT = 1.2; S.ball = null; S.rally = 0; S.bestRally = 0; S.aces = 0; S.rets = 0; S.swing = 0; S.oppSw = 0; S.cd = 0; S.dir = 0; S.kdir = 0; S.tgt = null; S.over = false; S.trail = []; },
    startIn: function (serve) {
      var diff = clamp(S.rally * .05 + (S.pt[0] + S.pt[1]) * .06, 0, 1), x1 = clamp(-S.px * .6 + (rnd() * 2 - 1) * .65, -.9, .9);
      S.ball = { dir: 'in', u: 0, T: serve ? 1.25 : lerp(1.55, 1.0, diff), x0: S.ox, x1: x1, h0: .3, net: rnd() < (serve ? .04 : .07), serve: serve }; S.oppSw = .3; S.trail = []; if (serve) KG.beep(240, .07, 'triangle', .05);
    },
    point: function (who, msg) {
      var me = who === 'me'; S.pt[me ? 0 : 1]++; S.bestRally = Math.max(S.bestRally, S.rally); S.state = 'point'; S.stT = 1.5; S.ball = null;
      pop(W / 2, H * .3, msg, me ? col : '#fb7185'); if (me) { KG.sfx.ok(); cheer(.5); spark(W / 2, H * .55, col, 22, 300); } else { KG.sfx.bad(); S.hype = Math.max(.2, S.hype - .2); }
      if (S.pt[0] >= 4 || S.pt[1] >= 4) S.over = true;
    },
    swing: function () {
      if (S.cd > 0 || S.state !== 'rally') return; S.cd = .34; S.swing = .28; var b = S.ball;
      if (!b || b.dir !== 'in' || b.u < .82 || b.u > 1.1) { KG.beep(300, .04, 'square', .02); return; }
      var bx = lerp(b.x0, b.x1, Math.min(b.u, 1)), dxn = Math.abs(bx - S.px) / REACH, tq = 1 - Math.abs(b.u - .975) / .13;
      if (dxn > 1) { pop(TP(S.px, .97, .4).x, H * .6, 'LEJOS', '#fbbf24'); return; } if (tq <= 0) return;
      var q = clamp(.5 * (1 - dxn) + .5 * tq, 0, 1), held = S.dir || S.kdir, aim = held ? held * (.5 + .4 * q) : (S.ox > .1 ? -1 : S.ox < -.1 ? 1 : (rnd() < .5 ? -1 : 1)) * (.4 + .4 * q);
      aim = clamp(aim + (rnd() - .5) * .12 * (1 - q), -.92, .92); var Tout = lerp(1.15, .85, q), vOpp = .8 + .05 * (S.pt[0] + S.pt[1]) + .015 * S.rally, rOpp = .26 * (1.3 - .8 * q), travel = vOpp * Tout, oppEnd = clamp(aim, S.ox - travel, S.ox + travel), ret = Math.abs(aim - oppEnd) <= rOpp, err = q < .14 || (Math.abs(aim) > .88 && rnd() < .12);
      S.rally++; S.rets++; S.px = lerp(S.px, bx, .5); S.ball = { dir: 'out', u: 0, T: Tout, x0: bx, x1: aim, h0: .3, ox0: S.ox, ox1: oppEnd, ret: ret && !err, err: err }; S.trail = [];
      var pf = q > .8; pop(TP(bx, .97, .5).x, H * .62, pf ? '¡PERFECTO!' : q > .5 ? 'BIEN' : 'FLOJO', pf ? '#fff' : q > .5 ? col : '#fbbf24'); spark(TP(bx, .97, .3).x, TP(bx, .97, .3).y, pf ? '#fff' : col, pf ? 20 : 10, 220); KG.beep(380 + q * 300, .07, 'triangle', .06);
    },
    update: function (dt) {
      var hn = this.hn(), sp = 2.5; S.cd = Math.max(0, S.cd - dt); S.swing = Math.max(0, S.swing - dt); S.oppSw = Math.max(0, S.oppSw - dt);
      var kd = S.kdir; if (kd) S.px = clamp(S.px + kd * 2.1 * dt, -1.15, 1.15); else if (S.tgt != null) S.px += clamp(S.tgt - S.px, -sp * dt, sp * dt); S.px = clamp(S.px, -1.15, 1.15);
      if (S.state === 'serve') { S.stT -= dt; if (S.stT <= 0) { S.state = 'rally'; this.startIn(true); } }
      else if (S.state === 'point') { S.stT -= dt; if (S.stT <= 0) { if (S.over) { end(); return; } S.state = 'serve'; S.stT = 1.1; S.rally = 0; S.ox = 0; } }
      else if (S.state === 'rally' && S.ball) {
        var b = S.ball; b.u += dt / b.T; var bp = this.bpos(b); S.trail.push(bp); if (S.trail.length > 7) S.trail.shift();
        if (b.dir === 'in') { if (b.net && b.u >= .5) this.point('me', 'ERROR DEL RIVAL'); else if (b.u >= 1.14) this.point('opp', 'DEMASIADO TARDE'); }
        else { S.ox = lerp(b.ox0, b.ox1, ease(Math.min(1, b.u))); if (b.err && b.u >= .5) this.point('opp', 'A LA RED'); else if (b.u >= 1) { if (b.ret) { S.ox = b.ox1; S.rally = S.rally; this.startIn(false); } else { if (S.rally <= 1) S.aces++; this.point('me', S.rally <= 1 ? '¡WINNER!' : '¡PUNTO!'); } } }
      }
    },
    bpos: function (b) {
      var u = b.u, zw = b.dir === 'in' ? lerp(.03, .97, u) : lerp(.97, .03, u), xw = lerp(b.x0, b.x1, clamp(u, 0, 1.12)), ub = .72, h;
      if (u < ub) { var v = u / ub; h = b.h0 * (1 - v) + 2 * v * (1 - v); } else { var w = (u - ub) / (1 - ub); h = .3 * Math.sin(w * 1.4); }
      return { xw: xw, zw: clamp(zw, -.1, 1.15), h: Math.max(0, h) };
    },
    draw: function (dt) {
      var hn = this.hn(), i, g, b = S.ball;
      g = ctx.createLinearGradient(0, 0, 0, H * .4); g.addColorStop(0, '#04070d'); g.addColorStop(1, '#101d33'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      crowd(H * .03, H * .335, ['#facc15', '#f1f5f9', '#2563eb', '#e11d48', '#16a34a', '#a855f7'], false, .25); floods(H * .02); boards(H * .335, H * .05, 'KINET OS');
      ctx.fillStyle = '#12402b'; ctx.fillRect(0, H * .385, W, H * .615);
      var c1 = TP(-1.28, 0), c2 = TP(1.28, 0), c3 = TP(1.28, 1), c4 = TP(-1.28, 1); g = ctx.createLinearGradient(0, c1.y, 0, c3.y); g.addColorStop(0, '#1b4f96'); g.addColorStop(1, '#2468b8'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y); ctx.lineTo(c3.x, c3.y); ctx.lineTo(c4.x, c4.y); ctx.closePath(); ctx.fill();
      c1 = TP(-1, 0); c2 = TP(1, 0); c3 = TP(1, 1); c4 = TP(-1, 1); ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.beginPath(); ctx.moveTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y); ctx.lineTo(c3.x, c3.y); ctx.lineTo(c4.x, c4.y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
      function ln(xa, za, xb, zb) { var a = TP(xa, za), c = TP(xb, zb); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y); ctx.stroke(); }
      ln(-1, 0, 1, 0); ln(1, 0, 1, 1); ln(1, 1, -1, 1); ln(-1, 1, -1, 0); ln(-1, .23, 1, .23); ln(-1, .77, 1, .77); ln(0, .23, 0, .77); ln(-1.28, 0, -1.28, 1); ln(1.28, 0, 1.28, 1);
      /* red */
      var n1 = TP(-1.2, .5, 0), n2 = TP(1.2, .5, 0), t1 = TP(-1.2, .5, .22), t2 = TP(1.2, .5, .22), gB = ctx.createLinearGradient(0, t1.y, 0, n1.y); gB.addColorStop(0, 'rgba(235,242,255,.4)'); gB.addColorStop(1, 'rgba(235,242,255,.12)'); ctx.fillStyle = gB; ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.lineTo(t1.x, t1.y); ctx.lineTo(t2.x, t2.y); ctx.lineTo(n2.x, n2.y); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1; for (i = 0; i <= 24; i++) { var nx = -1.2 + i * .1, a = TP(nx, .5, 0), c = TP(nx, .5, .22); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y); ctx.stroke(); }
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(t1.x, t1.y); ctx.lineTo(t2.x, t2.y); ctx.stroke(); ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.lineTo(t1.x, t1.y); ctx.moveTo(n2.x, n2.y); ctx.lineTo(t2.x, t2.y); ctx.stroke();
      /* rival (lejos, de frente) */
      var op = TP(S.ox, .03, 0), oh = .44 * hn * op.s * .95, osw = S.oppSw > 0 ? Math.sin((1 - S.oppSw / .3) * 3.14) : 0;
      ctx.save(); ctx.lineCap = 'round'; ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(op.x, op.y + 1, oh * .3, oh * .05, 0, 0, T2); ctx.fill(); ctx.strokeStyle = '#1a2230'; ctx.lineWidth = oh * .09; ctx.beginPath(); ctx.moveTo(op.x - oh * .08, op.y); ctx.lineTo(op.x - oh * .05, op.y - oh * .45); ctx.moveTo(op.x + oh * .08, op.y); ctx.lineTo(op.x + oh * .05, op.y - oh * .45); ctx.stroke();
      ctx.strokeStyle = '#fb7185'; ctx.lineWidth = oh * .22; ctx.beginPath(); ctx.moveTo(op.x, op.y - oh * .45); ctx.lineTo(op.x, op.y - oh * .78); ctx.stroke(); ctx.fillStyle = '#e0b08c'; ctx.beginPath(); ctx.arc(op.x, op.y - oh * .93, oh * .1, 0, T2); ctx.fill(); ctx.strokeStyle = '#e0b08c'; ctx.lineWidth = oh * .06; var rx = op.x + oh * (.2 + osw * .25), ry = op.y - oh * (.55 + osw * .25); ctx.beginPath(); ctx.moveTo(op.x + oh * .08, op.y - oh * .74); ctx.lineTo(rx, ry); ctx.stroke(); ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = Math.max(1.5, oh * .03); ctx.beginPath(); ctx.ellipse(rx + oh * .05, ry - oh * .1, oh * .08, oh * .11, .4, 0, T2); ctx.stroke(); ctx.restore();
      /* bola */
      var drawBall = function () {
        if (!b) return; var bp = this.bpos(b), p = TP(bp.xw, bp.zw, bp.h), sh = TP(bp.xw, bp.zw, 0), r = Math.max(3.5, hn * .05 * p.s);
        S.trail.forEach(function (t, k) { var q = TP(t.xw, t.zw, t.h); ctx.fillStyle = 'rgba(217,242,75,' + (k / S.trail.length * .25) + ')'; ctx.beginPath(); ctx.arc(q.x, q.y, r * (.5 + k / S.trail.length * .5), 0, T2); ctx.fill(); });
        ctx.fillStyle = 'rgba(0,0,0,' + (.42 - bp.h * .3) + ')'; ctx.beginPath(); ctx.ellipse(sh.x, sh.y, r * 1.4, r * .5, 0, 0, T2); ctx.fill();
        ctx.save(); ctx.shadowColor = '#d9f24b'; ctx.shadowBlur = 14; ctx.fillStyle = '#d9f24b'; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, T2); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1, r * .16); ctx.beginPath(); ctx.arc(p.x - r * 1.05, p.y, r * .95, -.9, .9); ctx.stroke(); ctx.restore();
        if (b.dir === 'in' && b.u > .6 && b.u < 1.12) { var hp = TP(lerp(b.x0, b.x1, Math.min(b.u, 1)), .97, .3), kk = clamp((b.u - .6) / .375, 0, 1), inW = Math.abs(b.u - .975) < .1; ctx.strokeStyle = inW ? col : 'rgba(255,255,255,.55)'; ctx.lineWidth = inW ? 4 : 2; ctx.shadowColor = col; ctx.shadowBlur = inW ? 16 : 0; ctx.beginPath(); ctx.arc(hp.x, hp.y, lerp(70, 20, kk) * hp.s * (hn / 480 + .4), 0, T2); ctx.stroke(); ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(hp.x, hp.y, 20 * hp.s * (hn / 480 + .4), 0, T2); ctx.strokeStyle = 'rgba(' + colr + ',.5)'; ctx.lineWidth = 1.5; ctx.stroke(); }
      }.bind(this);
      var netFront = b && b.dir === 'in' ? this.bpos(b).zw < .5 : (b ? this.bpos(b).zw > .5 : false); void netFront;
      drawBall();
      /* jugador (de espaldas) */
      var pp = TP(S.px, .97, 0), ph = .44 * hn * pp.s * .95, sw = S.swing > 0 ? 1 - S.swing / .28 : 0, ang = S.swing > 0 ? lerp(-1.2, 1.2, ease(sw)) : -.5;
      ctx.save(); ctx.lineCap = 'round'; ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.beginPath(); ctx.ellipse(pp.x, pp.y + 2, ph * .32, ph * .06, 0, 0, T2); ctx.fill();
      ctx.strokeStyle = 'rgba(' + colr + ',.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(pp.x, pp.y + 2, REACH * hn * pp.s, REACH * hn * pp.s * .16, 0, 0, T2); ctx.stroke();
      ctx.strokeStyle = '#1a2230'; ctx.lineWidth = ph * .09; ctx.beginPath(); ctx.moveTo(pp.x - ph * .1, pp.y); ctx.lineTo(pp.x - ph * .06, pp.y - ph * .46); ctx.moveTo(pp.x + ph * .1, pp.y); ctx.lineTo(pp.x + ph * .06, pp.y - ph * .46); ctx.stroke();
      ctx.shadowColor = col; ctx.shadowBlur = 16; ctx.strokeStyle = col; ctx.lineWidth = ph * .26; ctx.beginPath(); ctx.moveTo(pp.x, pp.y - ph * .46); ctx.lineTo(pp.x, pp.y - ph * .8); ctx.stroke(); ctx.shadowBlur = 0; ctx.fillStyle = '#e0b08c'; ctx.beginPath(); ctx.arc(pp.x, pp.y - ph * .96, ph * .11, 0, T2); ctx.fill(); ctx.fillStyle = '#1b1208'; ctx.beginPath(); ctx.arc(pp.x, pp.y - ph * .98, ph * .115, Math.PI * 1.02, Math.PI * 1.98); ctx.fill(); ctx.beginPath(); ctx.arc(pp.x, pp.y - ph * .95, ph * .11, 0, Math.PI); ctx.fillStyle = '#1b1208'; ctx.fill();
      var sx = pp.x + ph * .13, sy = pp.y - ph * .72, ex = sx + Math.cos(ang) * ph * .38, ey = sy - Math.sin(ang) * ph * .16 - ph * .2; ctx.strokeStyle = '#e0b08c'; ctx.lineWidth = ph * .06; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = ph * .035; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + Math.cos(ang) * ph * .14, ey - ph * .1); ctx.stroke(); ctx.shadowColor = '#fff'; ctx.shadowBlur = S.swing > 0 ? 14 : 0; ctx.beginPath(); ctx.ellipse(ex + Math.cos(ang) * ph * .26, ey - ph * .2, ph * .13, ph * .17, ang * -.6, 0, T2); ctx.stroke(); ctx.restore();
      /* marcador de estado */
      if (S.state === 'serve') { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '700 ' + (W < 700 ? 13 : 16) + 'px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.fillText(S.pt[0] === 3 && S.pt[1] === 3 ? '¡PUNTO DE ORO! Prepárate para restar…' : 'Saca el rival… prepárate para restar', W / 2, H * .5); }
    },
    down: function (p, e) { if (e.pointerType === 'mouse') { this.move(p, e); this.swing(); } else { S.tch = { t: now, x: p.x, y: p.y, mv: 0 }; this.move(p, e); } },
    move: function (p, e) { var nt = clamp((p.x - W / 2) / this.hn(), -1.15, 1.15); if (S.tgt != null) { var dx = nt - S.tgt; if (Math.abs(dx) > .012) S.dir = dx > 0 ? 1 : -1; } S.tgt = nt; if (S.tch) S.tch.mv = Math.max(S.tch.mv, Math.hypot(p.x - S.tch.x, p.y - S.tch.y)); clearTimeout(S.dirT); S.dirT = setTimeout(function () { if (S) S.dir = 0; }, 160); },
    up: function (p, e) { if (S.tch && now - S.tch.t < 260 && S.tch.mv < 14) this.swing(); S.tch = null; },
    key: function (k, d) { if (k === 'left') S.kdir = d ? -1 : (S.kdir < 0 ? 0 : S.kdir); else if (k === 'right') S.kdir = d ? 1 : (S.kdir > 0 ? 0 : S.kdir); else if (d && (k === 'act' || k === 'up')) this.swing(); if (k === 'left' || k === 'right') S.tgt = null; },
    hud: function () { return { l: ['Tú', TN[Math.min(4, S.pt[0])]], c: [S.rally, 'rally', false], r: ['Rival', TN[Math.min(4, S.pt[1])]] }; },
    result: function () {
      var win = S.pt[0] > S.pt[1], sc = S.pt[0] * 200 + S.bestRally * 30 + S.aces * 120 + S.rets * 12 + (win ? 600 : 0); return { score: sc, tier: sc >= 1900 ? 4 : sc >= 1300 ? 3 : sc >= 800 ? 2 : sc >= 350 ? 1 : 0, kicker: (win ? 'Victoria' : 'Derrota') + ' · ' + S.pt[0] + '–' + S.pt[1] + ' · Tenis', lines: ['Resultado: ' + S.pt[0] + ' – ' + S.pt[1] + ' · ' + S.rets + ' devoluciones', 'Mejor rally: ' + S.bestRally + ' golpes · ' + S.aces + ' winners directos', win ? '🏆 ¡Has ganado el partido!' : 'El rival gana esta vez. ¡Revancha!'], win: win };
    }
  };

  /* ═════════ núcleo: montaje, bucle, entrada ═════════ */
  var GAMES = { futbol: GF, baloncesto: GB, running: GR, tenis: GT };
  function mount() {
    stage.innerHTML = '<div class="rf"><canvas id="rf-cv" aria-label="Zona de juego de reflejos"></canvas>' +
      '<div class="rf-hud" id="rf-hud"><div><small class="kg-mono" id="rf-ll">Puntos</small><b id="rf-lv">0</b></div><div class="rf-tm"><b id="rf-tm">30</b><small class="kg-mono" id="rf-ts">segundos</small></div><div><small class="kg-mono" id="rf-rl">Combo</small><b id="rf-rv">×1</b></div></div>' +
      '<div class="rf-ov" id="rf-ov"></div><div class="rf-ctl hid" id="rf-ctl"></div></div>';
    cv = KG.$('#rf-cv'); ctx = cv.getContext('2d'); size();
    function pt(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }; }
    cv.addEventListener('pointerdown', function (e) { if (!running || !G) return; try { cv.setPointerCapture(e.pointerId); } catch (x) {} if (G.down) G.down(pt(e), e); e.preventDefault(); });
    cv.addEventListener('pointermove', function (e) { if (!running || !G || !G.move) return; G.move(pt(e), e); });
    cv.addEventListener('pointerup', function (e) { if (!running || !G) return; if (G.up) G.up(pt(e), e); });
    cv.addEventListener('pointercancel', function () { if (S) S.tch = null; });
  }
  function size() {
    var box = cv.parentNode.getBoundingClientRect(); DPR = Math.min(2, window.devicePixelRatio || 1); W = Math.max(300, box.width);
    H = innerWidth < 700 ? Math.min(640, Math.max(440, innerHeight * .64)) : Math.max(430, Math.min(620, W * .56, innerHeight - 250)); cv.width = W * DPR; cv.height = H * DPR; cv.style.height = H + 'px'; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  addEventListener('resize', function () { if (cv) { size(); if (S && !running && G) G.init(); } });
  function setCtl() {
    var c = KG.$('#rf-ctl'); c.innerHTML = G.ctl; c.classList.toggle('hid', !G.ctl);
    KG.$$('.rf-b', c).forEach(function (b) {
      var k = b.dataset.k, on = function (e) { if (running) G.key(k, true); b.classList.add('on'); e.preventDefault(); }, off = function () { if (running) G.key(k, false); b.classList.remove('on'); };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
    });
  }
  function newState() { return { t: 0, score: 0, combo: 0, best: 0, objs: [], fx: [], pops: [], fl: [], hype: .3, rnd: KG.rng((Date.now() ^ (Math.random() * 1e9)) >>> 0) }; }
  function setHud(h) {
    var k = [h.l[0], h.l[1], h.c[0], h.c[1], h.r[0], h.r[1], h.c[2]].join('|'); if (S._hk === k) return; S._hk = k;
    KG.$('#rf-ll').textContent = h.l[0]; KG.$('#rf-lv').textContent = h.l[1]; KG.$('#rf-tm').textContent = h.c[0]; KG.$('#rf-ts').textContent = h.c[1]; KG.$('#rf-rl').textContent = h.r[0]; KG.$('#rf-rv').textContent = h.r[1]; KG.$('#rf-hud').classList.toggle('lo', !!h.c[2]);
  }
  function frame(t) {
    raf = requestAnimationFrame(frame); now = t; var dt = Math.min(.05, (t - (lastT || t)) / 1000); lastT = t; if (!S || !G) return;
    if (running) { S.t += dt; G.update(dt); }
    S.hype = Math.max(.22, S.hype - dt * .3); if (!S) return; G.draw(dt); drawFx(dt); if (running && S) setHud(G.hud());
  }
  function intro() {
    running = false; S = newState(); G.init(); var best = KG.get('reflejos_' + KG.sport, 0), I = G.intro, ov = KG.$('#rf-ov');
    KG.$('#rf-hud').classList.add('hid'); KG.$('#rf-ctl').classList.add('hid');
    ov.className = 'rf-ov on'; ov.innerHTML = '<div class="rf-card"><small class="kg-mono">Modo ' + I.role + ' · ' + KG.sports[KG.sport].n + '</small><h2>' + I.h + '</h2><p>' + I.p + '</p><div class="rf-kk">' + I.keys.map(function (k) { return '<span>' + k + '</span>'; }).join('') + '<em>' + I.note + '</em></div><div class="tr-meta">' + I.meta.map(function (m) { return '<span><b>' + m[0] + '</b>' + m[1] + '</span>'; }).join('') + '<span><b>' + (best || '—') + '</b>tu récord</span></div><button class="kg-btn pri" id="rf-go" type="button">¡A jugar!</button></div>';
    KG.$('#rf-go').addEventListener('click', countdown);
  }
  function countdown() {
    var ov = KG.$('#rf-ov'), n = 3; ov.innerHTML = '<div class="rf-cd" id="rf-cd">3</div>'; KG.sfx.tick();
    var iv = setInterval(function () { n--; if (n <= 0) { clearInterval(iv); start(); } else { var e = KG.$('#rf-cd'); e.textContent = n; KG.sfx.tick(); e.style.animation = 'none'; void e.offsetWidth; e.style.animation = ''; } }, 800);
  }
  function start() { S = newState(); G.init(); running = true; var ov = KG.$('#rf-ov'); ov.className = 'rf-ov'; ov.innerHTML = ''; KG.$('#rf-hud').classList.remove('hid'); KG.$('#rf-ctl').classList.toggle('hid', !G.ctl); }
  function end() {
    if (!running) return; running = false; var r = G.result(), key = 'reflejos_' + KG.sport, best = KG.get(key, 0), rec = r.score > best; if (rec) KG.set(key, r.score);
    KG.sheet({ game: 'reflejos', kicker: r.kicker, big: r.score, title: TIERS[KG.sport][r.tier], lines: r.lines.concat([rec ? '🏆 ¡Nuevo récord!' : 'Tu récord: ' + best]),
      tip: '<b>Dato:</b> la velocidad de reacción se entrena. Combínala con un buen calentamiento y descanso: cansado, reaccionas hasta un 20 % peor.',
      shareText: 'Hice ' + r.score + ' puntos en Reflejos (' + KG.sports[KG.sport].n + ') y soy «' + TIERS[KG.sport][r.tier] + '». ¿Me superas?', shareUrl: location.origin + '/juegos/reflejos.html?d=' + KG.sport,
      again: function () { intro(); countdown(); }, ctaTitle: 'Entrena de verdad con KINET', ctaText: 'Planes de entrenamiento y análisis con IA para tu deporte.', win: r.win });
  }
  var KM = { arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right', arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', ' ': 'act', enter: 'act' };
  addEventListener('keydown', function (e) { if (!running || !G || e.ctrlKey || e.metaKey || e.altKey) return; var k = KM[(e.key || '').toLowerCase()]; if (!k) return; if (e.repeat && G.noRepeat) { e.preventDefault(); return; } G.key(k, true); e.preventDefault(); });
  addEventListener('keyup', function (e) { if (!running || !G) return; var k = KM[(e.key || '').toLowerCase()]; if (k) G.key(k, false); });
  function choose() { G = GAMES[KG.sport]; if (cv) setCtl(); }
  mount(); rgb(); choose(); raf = requestAnimationFrame(frame); intro();
  KG.onSport(function () { rgb(); choose(); intro(); });
})();
