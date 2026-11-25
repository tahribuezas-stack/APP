/* KINET OS · Modo carrera · motor del partido jugable (intro cinemática, juego en directo, repeticiones y celebraciones).
   Fútbol y baloncesto: campo visto desde arriba. Running: relevos 4×100. Tenis: puntos jugados en pista (usa la vista de disparo). */
(function () {
  'use strict';
  var raf = 0, G = null;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function stop() { cancelAnimationFrame(raf); raf = 0; if (G && G.off) G.off(); G = null; }
  var OPPC = { futbol: '#f43f5e', baloncesto: '#60a5fa', tenis: '#fb7185', running: '#f43f5e' };
  var CFG = {
    futbol: { W: 1000, H: 600, spd: 190, range: 380, form: [[.2, .5], [.4, .24], [.4, .76], [.62, .5]], T: 72, n: 4 },
    baloncesto: { W: 940, H: 520, spd: 205, range: 340, form: [[.3, .5], [.52, .22], [.52, .78]], T: 72, n: 3 }
  };

  /* ───────── estructura común: marcador + lienzo + controles ───────── */
  function mount(o, kind) {
    var c = KG.sports[o.sport].c, host = o.host, ctl = '';
    if (kind === 'team') ctl = '<div class="pt-ctl"><button type="button" class="pt-b" id="pt-pass"><b>PASE</b><small>Espacio</small></button><button type="button" class="pt-b big" id="pt-shoot"><b>' + (o.sport === 'futbol' ? 'TIRO' : 'LANZAR') + '</b><small>Enter</small></button></div>';
    if (kind === 'race') ctl = '<div class="pt-ctl"><button type="button" class="pt-b big" id="pt-run"><b>¡CORRE!</b><small>toca / espacio rápido</small></button><button type="button" class="pt-b" id="pt-pass"><b>TESTIGO</b><small>Enter</small></button></div>';
    host.innerHTML = '<div class="pt"><div class="cr-bd"><div class="cr-tm me"><span>' + KG.esc(o.me.name) + '</span><b id="pt-a">0</b></div><div class="cr-mid"><small class="kg-mono" id="pt-clk"></small></div><div class="cr-tm"><b id="pt-b">0</b><span>' + KG.esc(o.opp.n) + '</span></div></div><div class="pt-cv"><canvas></canvas></div>' + ctl + '</div>';
    var cv = KG.$('canvas', host), g = cv.getContext('2d'), cf = CFG[o.sport] || { W: 1000, H: 520 };
    var S = { o: o, cv: cv, g: g, cf: cf, c: c, rgb: KG.sports[o.sport].rgb, oc: OPPC[o.sport], gf: 0, ga: 0, shots: 0, own: 0, tt: 0, mode: 'intro', t: 0, pause: false, iv: { x: 0, y: 0 }, keys: {}, joy: null, W: cf.W, H: cf.H, DPR: 1, off: null, acts: {} };
    function size() { var w = cv.parentNode.clientWidth || 800, ratio = S.H / S.W, lim = Math.max(260, innerHeight * .6), h = w * ratio; if (kind === 'team' && w < 560) { h = Math.min(w * .9, lim); } else if (h > lim) { w = lim / ratio; h = lim; } cv.style.width = w + 'px'; cv.style.height = h + 'px'; S.DPR = Math.min(2, devicePixelRatio || 1); cv.width = Math.round(w * S.DPR); cv.height = Math.round(h * S.DPR); S.sc = w / S.W; S.zoom = kind === 'team' && w < 560 ? 1.8 : 1; S.vh = h / S.sc / S.zoom; S.bg = null; }
    size(); S.size = size; window.addEventListener('resize', size);
    function kd(e) { var k = e.key.toLowerCase(); if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'enter'].indexOf(k) >= 0) e.preventDefault(); S.keys[k] = 1; if (e.repeat) return; if (k === ' ' || k === 'j') S.acts.pass = 1; if (k === 'enter' || k === 'k' || k === 'l') S.acts.shoot = 1; if (kind === 'race' && k !== 'enter') S.acts.run = 1; }
    function ku(e) { S.keys[e.key.toLowerCase()] = 0; }
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    function pt(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / S.sc, y: (e.clientY - r.top) / S.sc }; }
    cv.addEventListener('pointerdown', function (e) { if (S.mode === 'intro') { if (S.t > .9) S.skip = 1; return; } var p = pt(e); S.joy = { ox: p.x, oy: p.y, x: p.x, y: p.y }; if (kind === 'race') S.acts.run = 1; try { cv.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); });
    cv.addEventListener('pointermove', function (e) { if (S.joy) { var p = pt(e); S.joy.x = p.x; S.joy.y = p.y; } });
    function up() { S.joy = null; } cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    [['#pt-pass', 'pass'], ['#pt-shoot', 'shoot'], ['#pt-run', 'run']].forEach(function (a) { var b = KG.$(a[0], host); if (b) b.addEventListener('pointerdown', function (e) { e.preventDefault(); S.acts[a[1]] = 1; }); });
    S.off = function () { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('resize', size); };
    S.board = function () { var a = KG.$('#pt-a'), b = KG.$('#pt-b'); if (a) a.textContent = S.gf; if (b) b.textContent = S.ga; };
    S.clock = function (t) { var e = KG.$('#pt-clk'); if (e) e.textContent = t; };
    S.bump = function (id) { var e = KG.$(id); if (e) { e.classList.remove('pulse'); void e.offsetWidth; e.classList.add('pulse'); } };
    S.banner = function (txt, sub, cls, ms, cb, burst) {
      var h = KG.el('div', 'cr-goal ' + cls, '<div><b>' + KG.esc(txt) + '</b><span>' + KG.esc(sub) + '</span></div>'); host.querySelector('.pt').appendChild(h);
      if (burst) { var r = h.getBoundingClientRect(); [.3, .5, .7].forEach(function (f, i) { setTimeout(function () { KG.burst(r.left + r.width * f, r.top + r.height * .45, c, 26); }, i * 160); }); }
      setTimeout(function () { h.classList.add('out'); setTimeout(function () { h.remove(); if (cb) cb(); }, 300); }, ms);
    };
    return S;
  }

  /* ───────── intro cinemática ───────── */
  function drawIntro(S, t) {
    var g = S.g, W = S.W, H = S.H, o = S.o, c = S.c, i, k;
    g.setTransform(S.DPR * S.sc, 0, 0, S.DPR * S.sc, 0, 0);
    var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#03060b'); gr.addColorStop(1, '#0e1a2a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    /* focos que barren el estadio */
    for (i = 0; i < 5; i++) { var a = Math.sin(t * .9 + i * 1.3) * .5, x0 = W * (.1 + i * .2), bg = g.createLinearGradient(x0, 0, x0 + a * 500, H); bg.addColorStop(0, 'rgba(' + S.rgb + ',.34)'); bg.addColorStop(1, 'rgba(' + S.rgb + ',0)'); g.fillStyle = bg; g.beginPath(); g.moveTo(x0 - 18, 0); g.lineTo(x0 + 18, 0); g.lineTo(x0 + a * 500 + 120, H); g.lineTo(x0 + a * 500 - 120, H); g.closePath(); g.fill(); }
    /* gradas */
    for (k = 0; k < 4; k++) for (i = 0; i < 46; i++) { var h = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; h -= Math.floor(h); g.fillStyle = 'rgba(' + (h < .33 ? '255,90,120' : h < .66 ? '90,140,255' : '255,214,90') + ',' + (.07 + .1 * Math.max(0, Math.sin(t * 3 + i + k))) + ')'; g.fillRect(i * W / 46 + 2, H - 70 + k * 16, W / 46 - 5, 11); }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    var u = Math.min(1, t / .9); g.globalAlpha = u; g.fillStyle = c; g.shadowColor = c; g.shadowBlur = 24; g.font = '900 ' + Math.round(H * .075) + 'px Orbitron,Inter,sans-serif'; g.fillText(o.label.toUpperCase(), W / 2, H * .14 - (1 - u) * 20); g.shadowBlur = 0; g.globalAlpha = 1;
    if (t > .9) {
      var e = Math.min(1, (t - .9) / .6), ease = 1 - Math.pow(1 - e, 3), py = H * .46, ph = H * .2;
      function panel(x, w, col, name, sub, dirx) { g.save(); g.translate(dirx * (1 - ease) * 700, 0); g.fillStyle = 'rgba(8,14,22,.92)'; g.strokeStyle = col; g.lineWidth = 3; g.shadowColor = col; g.shadowBlur = 22; g.beginPath(); g.rect(x, py - ph / 2, w, ph); g.fill(); g.stroke(); g.shadowBlur = 0; g.fillStyle = '#fff'; g.font = '800 ' + Math.round(H * .052) + 'px Inter,sans-serif'; g.fillText(name.length > 18 ? name.slice(0, 17) + '…' : name, x + w / 2, py - ph * .1); g.fillStyle = col; g.font = '700 ' + Math.round(H * .03) + 'px "JetBrains Mono",monospace'; g.fillText(sub, x + w / 2, py + ph * .27); g.restore(); }
      panel(W * .05, W * .38, c, o.me.name, 'VALORACIÓN ' + Math.round(o.me.r), -1); panel(W * .57, W * .38, S.oc, o.opp.n, 'VALORACIÓN ' + Math.round(o.opp.r), 1);
      var vs = Math.max(0, Math.min(1, (t - 1.35) / .25)); g.save(); g.translate(W / 2, py); g.scale(.3 + vs * 1.1 - Math.max(0, vs - 1) * .1, .3 + vs * 1.1); g.globalAlpha = vs; g.fillStyle = '#fff'; g.shadowColor = '#fff'; g.shadowBlur = 20; g.font = '900 ' + Math.round(H * .09) + 'px Orbitron,Inter,sans-serif'; g.fillText('VS', 0, 0); g.restore();
    }
    if (t > 2.2) { var n = 3 - Math.floor((t - 2.2) / .5), f = ((t - 2.2) % .5) / .5; g.save(); g.globalAlpha = 1 - f * .6; g.fillStyle = '#fff'; g.shadowColor = c; g.shadowBlur = 40; g.font = '900 ' + Math.round(H * (.2 + .1 * (1 - f))) + 'px Orbitron,Inter,sans-serif'; g.fillText(n > 0 ? n : '¡YA!', W / 2, H * .76); g.restore(); if (n !== S.lastN) { S.lastN = n; KG.beep(n > 0 ? 440 : 880, .12, 'square', .06); } }
  }

  /* ───────── fútbol y baloncesto: partido jugable desde arriba ───────── */
  function team(S) {
    var cf = S.cf, ps = [], t, i; for (t = 0; t < 2; t++) for (i = 0; i < cf.form.length; i++) { var f = cf.form[i]; ps.push({ t: t, i: i, bx: (t ? 1 - f[0] : f[0]) * cf.W, by: f[1] * cf.H, x: 0, y: 0, vx: 0, vy: 0, fx: t ? -1 : 1, fy: 0, stun: 0, run: 0 }); }
    S.oppShotCd = 10; S.ps = ps; S.ball = { x: cf.W / 2, y: cf.H / 2, vx: 0, vy: 0, owner: null, target: null, noPick: null, noT: 0 };
  }
  function reset(S, poss) {
    var cf = S.cf; S.ps.forEach(function (p) { p.x = p.bx; p.y = p.by; p.vx = p.vy = 0; p.stun = 0; }); var mine = S.ps.filter(function (p) { return p.t === poss; }), pick = mine[mine.length - 1], dir = poss ? -1 : 1;
    pick.x = cf.W / 2 - dir * 36; pick.y = cf.H / 2; S.ball.owner = pick; S.ball.vx = S.ball.vy = 0; S.ball.target = null; S.freeze = .9; S.aiT = .6; S.hist = []; S.act = null;
  }
  function bgTeam(S) {
    var cf = S.cf, sp = S.o.sport, cv = document.createElement('canvas'), k = S.sc * Math.min(2, devicePixelRatio || 1) * (S.zoom || 1), g, i; cv.width = Math.round(cf.W * k); cv.height = Math.round(cf.H * k); g = cv.getContext('2d'); g.scale(k, k);
    g.fillStyle = '#05080e'; g.fillRect(0, 0, cf.W, cf.H);
    for (i = 0; i < 60; i++) { var h = Math.sin(i * 91.7) * 43758.5; h -= Math.floor(h); g.fillStyle = 'rgba(' + (h < .33 ? '255,90,120' : h < .66 ? '90,140,255' : '255,214,90') + ',.16)'; g.fillRect(i * cf.W / 60 + 2, 3, cf.W / 60 - 4, 9); g.fillRect(i * cf.W / 60 + 2, cf.H - 12, cf.W / 60 - 4, 9); }
    var m = 18;
    if (sp === 'futbol') {
      for (i = 0; i < 12; i++) { g.fillStyle = i % 2 ? '#10653a' : '#0d5a33'; g.fillRect(m + i * (cf.W - 2 * m) / 12, m, (cf.W - 2 * m) / 12 + 1, cf.H - 2 * m); }
      g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 3; g.strokeRect(m, m, cf.W - 2 * m, cf.H - 2 * m); g.beginPath(); g.moveTo(cf.W / 2, m); g.lineTo(cf.W / 2, cf.H - m); g.stroke(); g.beginPath(); g.arc(cf.W / 2, cf.H / 2, 70, 0, 6.3); g.stroke();
      [0, 1].forEach(function (s) { var x = s ? cf.W - m : m, d = s ? -1 : 1; g.strokeRect(s ? x - 150 : x, cf.H / 2 - 130, 150, 260); g.strokeRect(s ? x - 55 : x, cf.H / 2 - 65, 55, 130); g.beginPath(); g.arc(x + d * 105, cf.H / 2, 50, d > 0 ? -1 : Math.PI - 1, d > 0 ? 1 : Math.PI + 1); g.stroke(); });
    } else {
      for (i = 0; i < 14; i++) { g.fillStyle = i % 2 ? '#b7752f' : '#ad6c28'; g.fillRect(m + i * (cf.W - 2 * m) / 14, m, (cf.W - 2 * m) / 14 + 1, cf.H - 2 * m); }
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.strokeRect(m, m, cf.W - 2 * m, cf.H - 2 * m); g.beginPath(); g.moveTo(cf.W / 2, m); g.lineTo(cf.W / 2, cf.H - m); g.stroke(); g.beginPath(); g.arc(cf.W / 2, cf.H / 2, 62, 0, 6.3); g.stroke();
      [0, 1].forEach(function (s) { var hx = s ? cf.W - 48 : 48, d = s ? -1 : 1; g.fillStyle = 'rgba(255,90,30,.18)'; g.fillRect(s ? cf.W - m - 190 : m, cf.H / 2 - 80, 190, 160); g.strokeRect(s ? cf.W - m - 190 : m, cf.H / 2 - 80, 190, 160); g.beginPath(); g.arc(hx, cf.H / 2, 235, d > 0 ? -1.12 : Math.PI - 1.12, d > 0 ? 1.12 : Math.PI + 1.12); g.stroke(); g.strokeStyle = '#f97316'; g.lineWidth = 5; g.beginPath(); g.arc(hx + d * 14, cf.H / 2, 14, 0, 6.3); g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.moveTo(hx - d * 4, cf.H / 2 - 30); g.lineTo(hx - d * 4, cf.H / 2 + 30); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; });
    }
    return cv;
  }
  function inRange(S, p) { return Math.hypot(S.cf.W - p.x, S.cf.H / 2 - p.y) <= S.cf.range; }
  function moveTo(p, tx, ty, sp, dt) { var dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy), k = clamp(10 * dt, 0, 1); if (d < 4) { p.vx *= 1 - k; p.vy *= 1 - k; } else { var s = sp * clamp(d / 70, .3, 1); p.vx += (dx / d * s - p.vx) * k; p.vy += (dy / d * s - p.vy) * k; } }
  function pass(S, from, tgt) { var b = S.ball, dx = tgt.x - from.x, dy = tgt.y - from.y, d = Math.hypot(dx, dy) || 1, sp = 560; b.owner = null; b.vx = dx / d * sp; b.vy = dy / d * sp; b.target = tgt; b.noPick = from; b.noT = .22; S.passT = .6; KG.beep(300, .05, 'triangle', .05); }
  function stepTeam(S, dt) {
    var o = S.o, cf = S.cf, ps = S.ps, b = S.ball, i, p, sMe = cf.spd * (1 + clamp((o.me.r - o.opp.r) / 260, -.12, .12)), sOp = cf.spd * .93 * (1 + clamp((o.opp.r - o.me.r) / 260, -.12, .12));
    if (S.freeze > 0) { S.freeze -= dt; return; }
    S.t += dt; if (b.owner) { if (b.owner.t === 0) S.own += dt; S.tt += dt; }
    if (b.noT > 0) b.noT -= dt; if (S.passT > 0) S.passT -= dt; if (S.oppShotCd > 0) S.oppShotCd -= dt;
    ps.forEach(function (q) { if (q.stun > 0) q.stun -= dt; });
    /* jugador controlado */
    var kx = (S.keys.arrowright || S.keys.d ? 1 : 0) - (S.keys.arrowleft || S.keys.a || S.keys.q ? 1 : 0), ky = (S.keys.arrowdown || S.keys.s ? 1 : 0) - (S.keys.arrowup || S.keys.w || S.keys.z ? 1 : 0), ix = kx, iy = ky;
    if (S.joy) { var jx = S.joy.x - S.joy.ox, jy = S.joy.y - S.joy.oy, jd = Math.hypot(jx, jy), mx = 70; if (jd > 6) { ix = jx / Math.max(jd, mx * .5) ; iy = jy / Math.max(jd, mx * .5); var l = Math.hypot(ix, iy); if (l > 1) { ix /= l; iy /= l; } if (jd > mx) { S.joy.ox += jx / jd * (jd - mx); S.joy.oy += jy / jd * (jd - mx); } } }
    var il = Math.hypot(ix, iy); if (il > 1) { ix /= il; iy /= il; } S.iv = { x: ix, y: iy };
    var mine = ps.filter(function (q) { return q.t === 0; }), opp = ps.filter(function (q) { return q.t === 1; });
    if (b.owner && b.owner.t === 0) S.act = b.owner; else { var ref = b.target && b.target.t === 0 ? b.target : b, best = null, bd = 1e9; mine.forEach(function (q) { var d = Math.hypot(q.x - ref.x, q.y - ref.y); if (d < bd) { bd = d; best = q; } }); if (!S.act || !S.actHold || S.actHold <= 0) { if (!S.act || S.act !== best && Math.hypot(S.act.x - ref.x, S.act.y - ref.y) > bd + 30) { S.act = best; S.actHold = .3; } } else S.actHold -= dt; }
    var act = S.act;
    /* IA de compañeros y rivales */
    var meOwn = b.owner && b.owner.t === 0, opOwn = b.owner && b.owner.t === 1, loose = !b.owner;
    ps.forEach(function (q) {
      var sp = q.t ? sOp : sMe * .92, tx = q.bx, ty = q.by;
      if (q === act) { if (q.stun > 0) sp *= .35; q.vx += (ix * sMe * (q.stun > 0 ? .35 : 1) - q.vx) * clamp(12 * dt, 0, 1); q.vy += (iy * sMe * (q.stun > 0 ? .35 : 1) - q.vy) * clamp(12 * dt, 0, 1); if (il > .1) { q.fx = ix / il; q.fy = iy / il; } return; }
      var dirA = q.t ? -1 : 1, mate = q.t ? opp : mine, foe = q.t ? mine : opp;
      if (b.owner === q) {
        /* rival con balón: regatea hacia nuestra portería */
        var tgx = q.t ? 30 : cf.W - 30, tgy = cf.H / 2 + Math.sin(S.t * 1.4 + q.i) * cf.H * .18, rx = 0, ry = 0;
        foe.forEach(function (f) { var d = Math.hypot(f.x - q.x, f.y - q.y); if (d < 110) { rx += (q.x - f.x) / d * (110 - d); ry += (q.y - f.y) / d * (110 - d); } });
        var vx = tgx - q.x, vy = tgy - q.y, vl = Math.hypot(vx, vy) || 1; vx = vx / vl * 100 + rx * 1.4; vy = vy / vl * 100 + ry * 1.4; var ll = Math.hypot(vx, vy) || 1; q.vx += (vx / ll * sp * .86 - q.vx) * clamp(8 * dt, 0, 1); q.vy += (vy / ll * sp * .86 - q.vy) * clamp(8 * dt, 0, 1); q.fx = q.vx / (Math.hypot(q.vx, q.vy) || 1); q.fy = q.vy / (Math.hypot(q.vx, q.vy) || 1); return;
      }
      if (b.owner && b.owner.t === q.t) { var ow = b.owner; tx = clamp(ow.x + dirA * (110 + q.i * 28), 70, cf.W - 70); ty = q.by + (ow.y - cf.H / 2) * .25; if (q.i === 0) tx = ow.x - dirA * 60; }
      else if (opOwn !== !!q.t && b.owner) { /* defendemos */ var ow2 = b.owner, nearest = true; mate.forEach(function (m2) { if (m2 !== q && Math.hypot(m2.x - ow2.x, m2.y - ow2.y) < Math.hypot(q.x - ow2.x, q.y - ow2.y)) nearest = false; }); if (nearest) { tx = ow2.x + (q.t ? -1 : 1) * -10; ty = ow2.y; sp *= 1.02; } else { tx = q.bx + (ow2.x - q.bx) * .38; ty = q.by + (ow2.y - q.by) * .38; } }
      else if (loose) { var nn = true; mate.forEach(function (m2) { if (m2 !== q && Math.hypot(m2.x - b.x, m2.y - b.y) < Math.hypot(q.x - b.x, q.y - b.y)) nn = false; }); if (nn || (b.target === q)) { tx = b.x + b.vx * .25; ty = b.y + b.vy * .25; } }
      if (q.stun > 0) sp *= .4; moveTo(q, tx, ty, sp, dt); if (Math.hypot(q.vx, q.vy) > 20) { var vv = Math.hypot(q.vx, q.vy); q.fx = q.vx / vv; q.fy = q.vy / vv; }
    });
    ps.forEach(function (q) { q.x = clamp(q.x + q.vx * dt, 26, cf.W - 26); q.y = clamp(q.y + q.vy * dt, 26, cf.H - 26); });
    /* balón */
    if (b.owner) { var ow3 = b.owner; b.x = ow3.x + ow3.fx * 17; b.y = ow3.y + ow3.fy * 17; b.vx = b.vy = 0; }
    else { b.x += b.vx * dt; b.y += b.vy * dt; var fr = Math.pow(.45, dt * 1.6); b.vx *= fr; b.vy *= fr; if (b.target && S.passT > 0) { var tdx = b.target.x - b.x, tdy = b.target.y - b.y, td = Math.hypot(tdx, tdy) || 1, sp2 = Math.hypot(b.vx, b.vy); b.vx += (tdx / td * sp2 - b.vx) * clamp(3 * dt, 0, 1); b.vy += (tdy / td * sp2 - b.vy) * clamp(3 * dt, 0, 1); }
      if (b.x < 26 || b.x > cf.W - 26) { b.vx *= -.6; b.x = clamp(b.x, 26, cf.W - 26); } if (b.y < 26 || b.y > cf.H - 26) { b.vy *= -.6; b.y = clamp(b.y, 26, cf.H - 26); }
      var bestP = null, bdp = 1e9; ps.forEach(function (q) { if (q.stun > 0 || (q === b.noPick && b.noT > 0)) return; var d = Math.hypot(q.x - b.x, q.y - b.y), reach = (b.target === q ? 26 : 21); if (d < reach && d < bdp && Math.hypot(b.vx, b.vy) < 640) { bdp = d; bestP = q; } }); if (bestP) { b.owner = bestP; b.target = null; if (bestP.t === 0) S.act = bestP; } }
    /* entradas y robos */
    if (b.owner) { var car = b.owner, foes = car.t ? mine : opp, defR = car.t ? o.me.def : o.opp.def, attR = car.t ? o.opp.att : o.me.att;
      foes.forEach(function (f) { if (b.owner !== car || f.stun > 0 || car.stun > .01) return; var d = Math.hypot(f.x - car.x, f.y - car.y); if (d < 28) { var pr = clamp(.85 * (car.t ? o.me.def / o.opp.att : o.opp.def / o.me.att), .35, 1.6) * (f === act ? 1.7 : 1); if (Math.random() < pr * dt * 2.2) { b.owner = f; car.stun = .7; car.vx = -car.fx * 60; car.vy = -car.fy * 60; if (f.t === 0) S.act = f; KG.beep(180, .07, 'sawtooth', .04); S.tipT = .01; } } }); }
    /* acciones del jugador */
    if (S.acts.pass) { S.acts.pass = 0; if (b.owner && b.owner.t === 0) { var c0 = b.owner, bt = null, bs = -1e9; mine.forEach(function (m3) { if (m3 === c0) return; var dx = m3.x - c0.x, dy = m3.y - c0.y, d = Math.hypot(dx, dy); if (d < 40) return; var al = il > .2 ? (dx * ix + dy * iy) / d : (dx > 0 ? 1 : .2); var sc = al * 220 - d * .25 + (m3.x - c0.x) * .12; if (sc > bs) { bs = sc; bt = m3; } }); if (bt) pass(S, c0, bt); } }
    if (S.acts.shoot) { S.acts.shoot = 0; if (b.owner && b.owner.t === 0) { if (inRange(S, b.owner)) return shootMine(S); S.tip = 'Demasiado lejos: avanza o pasa'; S.tipT = 1.4; } }
    /* ataque rival */
    if (b.owner && b.owner.t === 1) { S.aiT -= dt; if (S.aiT <= 0) { S.aiT = .4; var q1 = b.owner, d1 = Math.hypot(q1.x - 0, q1.y - cf.H / 2); if (d1 <= cf.range * .8 && S.oppShotCd <= 0 && Math.random() < clamp(.22 * o.opp.att / o.me.def, .08, .4)) { S.oppShotCd = 13; return shootOpp(S); } var near = mine.some(function (m4) { return Math.hypot(m4.x - q1.x, m4.y - q1.y) < 60; }); if (near && Math.random() < .35) { var tt = null, ts = 1e9; opp.forEach(function (m5) { if (m5 === q1) return; var sc = m5.x + Math.abs(m5.y - cf.H / 2) * .2 - Math.hypot(m5.x - q1.x, m5.y - q1.y) * .0; if (Math.hypot(m5.x - q1.x, m5.y - q1.y) > 70 && sc < ts) { ts = sc; tt = m5; } }); if (tt) pass(S, q1, tt); } } }
    if (S.tipT > 0) { S.tipT -= dt; if (S.tipT <= 0) S.tip = ''; }
    S.hist.push({ p: ps.map(function (q) { return [q.x, q.y, q.fx, q.fy]; }), b: [b.x, b.y] }); if (S.hist.length > 96) S.hist.shift();
    var left = Math.max(0, cf.T - S.t); S.clock(S.o.sport === 'futbol' ? Math.min(90, Math.floor(S.t / cf.T * 90)) + '′' : 'C' + Math.min(4, 1 + Math.floor(S.t / cf.T * 4)) + ' · ' + Math.ceil(left) + 's');
    if (S.t >= cf.T) endTeam(S);
  }
  function shootMine(S) { S.pause = true; S.mode = 'shot'; KG.beep(240, .08, 'square', .06); S.o.shot('shoot', { rating: S.o.opp.gk }, function (res) { S.pause = false; S.shots++; if (res.out === 'gol') { S.gf += S.o.val(res.col); S.board(); S.bump('#pt-a'); replay(S, res, 0); } else { S.tip = res.out === 'parada' ? '¡Paradón del rival!' : '¡Fuera!'; S.tipT = 1.4; reset(S, 1); S.mode = 'play'; } }); }
  function shootOpp(S) { S.pause = true; S.mode = 'shot'; S.o.shot('save', { rating: S.o.me.gk }, function (res) { S.pause = false; if (res.out === 'gol') { S.ga += S.o.val(res.col); S.board(); S.bump('#pt-b'); S.banner(S.o.sport === 'futbol' ? 'GOL RIVAL' : 'CANASTA RIVAL', S.o.opp.n + ' · ' + S.gf + ' – ' + S.ga, 'theirs', 1300, function () { reset(S, 0); S.mode = 'play'; }); KG.sfx.bad(); } else { S.tip = '¡Defendido!'; S.tipT = 1.4; KG.sfx.ok(); reset(S, 0); S.mode = 'play'; } }); }
  function replay(S, res, who) {
    S.mode = 'replay'; S.ri = 0; S.rh = S.hist.slice(-84); KG.sfx.win();
    S.afterReplay = function () { S.banner(S.o.sport === 'futbol' ? '¡GOOOL!' : res.col === 1 ? '¡CANASTA!' : '¡TRIPLE!', S.o.me.name + ' · ' + S.gf + ' – ' + S.ga, 'mine', 1500, function () { reset(S, 1); S.mode = 'play'; }, true); S.mode = 'wait'; };
  }
  function endTeam(S) { if (S.mode === 'end') return; S.mode = 'end'; S.pause = true; KG.sfx.tick(); S.banner('FINAL', S.o.me.name + ' ' + S.gf + ' – ' + S.ga + ' ' + S.o.opp.n, S.gf > S.ga ? 'mine' : 'theirs', 1500, function () { var d = S.done; stop(); d({ gf: S.gf, ga: S.ga, shots: S.shots, poss: Math.round(S.own / Math.max(1, S.tt) * 100) }); }, S.gf > S.ga); }
  function drawTeam(S, st, repl) {
    var g = S.g, cf = S.cf, k = S.sc * S.DPR, ps = st.ps, b = st.ball, i;
    var z = S.zoom || 1, fx = repl ? st.sb[0] : b.x, fy = repl ? st.sb[1] : b.y, tcx = clamp(fx - cf.W / (2 * z), 0, cf.W - cf.W / z), tcy = clamp(fy - S.vh / 2, 0, Math.max(0, cf.H - S.vh)); if (S.cx == null || z === 1) { S.cx = z === 1 ? 0 : tcx; S.cy = z === 1 ? 0 : tcy; } else { S.cx += (tcx - S.cx) * .14; S.cy += (tcy - S.cy) * .14; }
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#05080e'; g.fillRect(0, 0, S.cv.width, S.cv.height); if (!S.bg) S.bg = bgTeam(S); g.setTransform(k * z, 0, 0, k * z, -S.cx * k * z, -S.cy * k * z); g.drawImage(S.bg, 0, 0, cf.W, cf.H);
    /* porterías / aros resplandecientes */
    g.save(); g.shadowBlur = 24; g.shadowColor = S.c; g.fillStyle = S.c; if (S.o.sport === 'futbol') { g.fillRect(cf.W - 18, cf.H / 2 - 66, 6, 132); g.shadowColor = S.oc; g.fillStyle = S.oc; g.fillRect(12, cf.H / 2 - 66, 6, 132); } else { g.beginPath(); g.arc(cf.W - 62, cf.H / 2, 17, 0, 6.3); g.strokeStyle = S.c; g.lineWidth = 4; g.stroke(); g.shadowColor = S.oc; g.beginPath(); g.arc(62, cf.H / 2, 17, 0, 6.3); g.strokeStyle = S.oc; g.stroke(); } g.restore();
    var order = ps.map(function (p, ix) { return { p: p, ix: ix }; }).sort(function (a, c2) { return a.p.y - c2.p.y; });
    order.forEach(function (e) {
      var p = repl ? { x: st.sp[e.ix][0], y: st.sp[e.ix][1], fx: st.sp[e.ix][2], fy: st.sp[e.ix][3], t: e.p.t, i: e.p.i } : e.p, col = p.t ? S.oc : S.c, act = !repl && S.act === e.p;
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(p.x, p.y + 9, 15, 6, 0, 0, 6.3); g.fill();
      g.save(); g.shadowColor = col; g.shadowBlur = act ? 26 : 12; g.fillStyle = col; g.beginPath(); g.arc(p.x, p.y, 14, 0, 6.3); g.fill(); g.restore();
      g.fillStyle = 'rgba(5,10,16,.85)'; g.beginPath(); g.arc(p.x, p.y, 9.5, 0, 6.3); g.fill(); g.fillStyle = '#fff'; g.font = '800 11px Inter,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.i + 1, p.x, p.y + .5);
      g.strokeStyle = col; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(p.x + p.fx * 12, p.y + p.fy * 12); g.lineTo(p.x + p.fx * 19, p.y + p.fy * 19); g.stroke();
      if (act) { g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.beginPath(); g.arc(p.x, p.y, 21 + Math.sin(S.t * 8) * 1.5, 0, 6.3); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(p.x, p.y - 34); g.lineTo(p.x - 6, p.y - 44); g.lineTo(p.x + 6, p.y - 44); g.closePath(); g.fill(); }
    });
    var bx = repl ? st.sb[0] : b.x, by = repl ? st.sb[1] : b.y, bc = S.o.sport === 'futbol' ? '#fff' : '#f97316';
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(bx, by + 7, 8, 3.5, 0, 0, 6.3); g.fill(); g.save(); g.shadowColor = bc; g.shadowBlur = 14; g.fillStyle = bc; g.beginPath(); g.arc(bx, by, 7.5, 0, 6.3); g.fill(); g.restore(); g.strokeStyle = S.o.sport === 'futbol' ? '#0b1018' : '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(bx, by, 7.5, 0, 6.3); g.stroke();
    g.setTransform(k, 0, 0, k, 0, 0);
    if (!repl) {
      var hasB = b.owner && b.owner.t === 0, rng = hasB && inRange(S, b.owner);
      var sb = KG.$('#pt-shoot', S.o.host); if (sb) sb.classList.toggle('hot', !!rng);
      if (S.joy) { g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3; g.beginPath(); g.arc(S.joy.ox, S.joy.oy, 46, 0, 6.3); g.stroke(); g.fillStyle = 'rgba(255,255,255,.5)'; var jx = S.joy.x - S.joy.ox, jy = S.joy.y - S.joy.oy, jl = Math.hypot(jx, jy) || 1, m = Math.min(jl, 46); g.beginPath(); g.arc(S.joy.ox + jx / jl * m, S.joy.oy + jy / jl * m, 18, 0, 6.3); g.fill(); }
      if (S.freeze > 0 && S.t < 1) { g.fillStyle = '#fff'; g.font = '900 38px Orbitron,Inter,sans-serif'; g.textAlign = 'center'; g.fillText('Arrastra para moverte', cf.W / 2, cf.H / 2 - 90); g.font = '600 22px Inter,sans-serif'; g.fillStyle = S.c; g.fillText('Llega al área y pulsa ' + (S.o.sport === 'futbol' ? 'TIRO' : 'LANZAR') + ' · PASE para combinar', cf.W / 2, cf.H / 2 - 52); }
      if (S.tip) { g.fillStyle = 'rgba(5,10,16,.8)'; g.fillRect(cf.W / 2 - 230, cf.H - 72, 460, 38); g.fillStyle = '#fff'; g.font = '700 20px Inter,sans-serif'; g.textAlign = 'center'; g.fillText(S.tip, cf.W / 2, cf.H - 52); }
    } else {
      var a = .5 + .5 * Math.sin(S.ri * .3); g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(0, 0, cf.W, 46); g.fillRect(0, cf.H - 46, cf.W, 46); g.fillStyle = 'rgba(255,255,255,' + (.7 + .3 * a) + ')'; g.font = '900 26px Orbitron,Inter,sans-serif'; g.textAlign = 'left'; g.fillText('● REPETICIÓN', 28, 26);
      var vg = g.createRadialGradient(cf.W / 2, cf.H / 2, cf.H * .3, cf.W / 2, cf.H / 2, cf.W * .6); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = vg; g.fillRect(0, 0, cf.W, cf.H);
    }
  }
  function playTeam(o, done) {
    var S = mount(o, 'team'); G = S; S.done = done; team(S); reset(S, 0); S.freeze = 0; S.t = 0; S.hist = []; S.clock(o.sport === 'futbol' ? '0′' : 'C1'); S.board(); var last = 0, tm = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame); if (!G) return; var dt = Math.min(.033, (now - (last || now)) / 1000); last = now; tm += dt;
      if (S.mode === 'intro') { S.t += dt; drawIntro(S, S.t); if (S.t > 3.2 || S.skip) { S.mode = 'play'; S.t = 0; S.hist = []; reset(S, 0); S.freeze = 1.1; KG.sfx.ok(); } return; }
      if (S.mode === 'play') { stepTeam(S, dt); if (S.mode === 'play') { var live = { ps: S.ps, ball: S.ball }; drawTeam(S, live, false); if (S.freeze > 0) { /* saque */ } } else if (S.mode === 'end') drawTeam(S, { ps: S.ps, ball: S.ball }, false); }
      else if (S.mode === 'replay') { S.ri += .5; var fi = Math.min(S.rh.length - 1, Math.floor(S.ri)); drawTeam(S, { ps: S.ps, ball: S.ball, sp: S.rh[fi].p, sb: S.rh[fi].b }, true); if (S.ri >= S.rh.length + 6) { S.afterReplay(); } }
      else if (S.mode === 'shot' || S.mode === 'wait' || S.mode === 'end') drawTeam(S, { ps: S.ps, ball: S.ball }, false);
    }
    raf = requestAnimationFrame(frame);
  }

  /* ───────── running: relevos 4×100 ───────── */
  function playRace(o, done) {
    var S = mount(o, 'race'); G = S; S.done = done; S.W = 1000; S.H = 440; S.size(); var cv = S.cv, g = S.g, c = S.c, leg = 0, me = { d: 0, v: 0 }, ai = { d: 0, v: 0, vt: 0 }, won = 0, lost = 0, t = 0, last = 0, st = 'intro', pend = 0, msg = '', msgT = 0, lane = [{ y: 150, col: S.oc }, { y: 290, col: c }], L = 100, shownTip = true, flash = 0;
    function aiLeg() { ai.vt = 12.2 + (o.opp.r - 60) / 6 + (Math.random() * 2 - 1); }
    function newLeg() { me.d = 0; ai.d = 0; ai.v = 0; aiLeg(); }
    me.vmax = 13.5 + (o.me.r - 60) / 6; S.clock('Tramo 1 de 4'); newLeg();
    function exchange(q) { /* q: 1 limpio, 0 mal */ var lead = me.d >= ai.d; if (lead) won++; else lost++; S.gf = won; S.ga = lost; S.board(); S.bump(lead ? '#pt-a' : '#pt-b'); leg++; if (leg >= 4) { st = 'end'; S.banner('FINAL', o.me.name + ' ' + won + ' – ' + lost + ' ' + o.opp.n + ' · tramos', won > lost ? 'mine' : 'theirs', 1600, function () { stop(); done({ gf: won, ga: lost, shots: 4, poss: 50 }); }, won > lost); return; } S.clock('Tramo ' + (leg + 1) + ' de 4'); var carry = q === 1 ? Math.min(me.v, 7) : 0; var aiv = ai.v; me.d = 0; me.v = carry; ai.d = 0; ai.v = Math.min(aiv, 7); aiLeg(); msg = q === 1 ? '¡Relevo perfecto!' : q === 0 ? '¡Testigo flojo! Pierdes ritmo' : ''; msgT = 1.3; }
    function frame(now) {
      raf = requestAnimationFrame(frame); if (!G) return; var dt = Math.min(.033, (now - (last || now)) / 1000); last = now; t += dt;
      if (st === 'intro') { drawIntro(S, t); if (t > 3.2 || S.skip) { st = 'run'; KG.sfx.ok(); S.acts = {}; msg = 'Toca rápido para correr · TESTIGO en la zona verde'; msgT = 3; } return; }
      if (st === 'run') {
        if (S.acts.run) { S.acts.run = 0; me.v = Math.min(me.vmax, me.v + 1.5); }
        me.v *= Math.pow(.5, dt * 1.1); ai.v += (ai.vt - ai.v) * clamp(2.2 * dt, 0, 1); me.d += me.v * dt; ai.d += ai.v * dt;
        if (S.acts.pass) { S.acts.pass = 0; if (me.d >= L - 16 && me.d <= L + 4) { me.v = Math.min(me.vmax, me.v + 1.5); exchange(1); } else if (me.d > 25) { me.v *= .4; exchange(0); } }
        else if (me.d > L + 6) { me.v *= .3; exchange(0); }
        if (ai.d >= L) { ai.d = L; ai.v = Math.min(ai.v, 11); }
      }
      /* dibujo */
      g.setTransform(S.DPR * S.sc, 0, 0, S.DPR * S.sc, 0, 0); var W = 1000, H = 440, i, j;
      g.fillStyle = '#05080e'; g.fillRect(0, 0, W, H); for (i = 0; i < 60; i++) { var h = Math.sin(i * 91.7) * 43758.5; h -= Math.floor(h); g.fillStyle = 'rgba(' + (h < .33 ? '255,90,120' : h < .66 ? '90,140,255' : '255,214,90') + ',.18)'; g.fillRect(i * W / 60 + 2, 8, W / 60 - 4, 16); g.fillRect(i * W / 60 + 2, H - 26, W / 60 - 4, 16); }
      g.fillStyle = '#9c3a2b'; g.fillRect(40, 60, W - 80, H - 120); for (i = 0; i < 4; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.08)'; g.fillRect(40 + i * (W - 80) / 4, 60, (W - 80) / 4, H - 120); }
      g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.strokeRect(40, 60, W - 80, H - 120); g.beginPath(); g.moveTo(40, 220); g.lineTo(W - 40, 220); g.stroke();
      var seg = (W - 80) / 4; for (i = 1; i < 4; i++) { g.fillStyle = 'rgba(0,255,136,.12)'; g.fillRect(40 + i * seg - 16, 60, 16, H - 120); g.strokeStyle = 'rgba(255,255,255,.5)'; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(40 + i * seg, 60); g.lineTo(40 + i * seg, H - 60); g.stroke(); g.setLineDash([]); }
      g.fillStyle = '#fff'; g.fillRect(W - 44, 60, 6, H - 120); g.font = '700 16px "JetBrains Mono",monospace'; g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,.7)'; ['SALIDA', 'CAMBIO 1', 'CAMBIO 2', 'CAMBIO 3', 'META'].forEach(function (s, k) { g.fillText(s, 40 + k * seg + (k === 4 ? -30 : 0) + (k === 0 ? 34 : 0), 48); });
      function runner(x, y, col, v, wait, big, tt) { var sw = Math.sin(tt * (4 + v * .9)) * (wait ? 0 : 1); g.save(); g.shadowColor = col; g.shadowBlur = big ? 22 : 8; g.lineCap = 'round'; g.strokeStyle = col; g.lineWidth = big ? 7 : 5; g.beginPath(); g.moveTo(x - 4, y - 14); g.lineTo(x - 4 - sw * 14, y + 14); g.moveTo(x + 4, y - 14); g.lineTo(x + 4 + sw * 14, y + 14); g.stroke(); g.fillStyle = col; g.beginPath(); g.ellipse(x, y - 14, big ? 14 : 11, big ? 11 : 9, 0, 0, 6.3); g.fill(); g.fillStyle = '#e0b08c'; g.beginPath(); g.arc(x + 8, y - 22, big ? 7 : 6, 0, 6.3); g.fill(); g.restore(); }
      for (j = 0; j < 2; j++) { var ly = lane[j].y; for (i = 0; i < 4; i++) { var x0 = 40 + i * seg, act = i === leg, pos = j ? me : ai, x; if (i < leg) x = x0 + seg - 10; else if (act) x = x0 + 10 + pos.d / L * (seg - 20); else x = x0 + 12; var isMe = j === 1; runner(x + (act ? 0 : 0), ly, lane[j].col, act ? pos.v : 0, !act || (st !== 'run'), isMe && act, t + j); if (act && isMe && st === 'run') { g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 20, ly - 8, 4, 0, 6.3); g.fill(); } } }
      /* barra de velocidad y zona de testigo */
      g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(40, H - 46, W - 80, 12); g.fillStyle = c; g.fillRect(40, H - 46, (W - 80) * clamp(me.v / me.vmax, 0, 1), 12);
      if (st === 'run' && me.d >= L - 16 && me.d <= L + 4) { flash += dt; g.fillStyle = 'rgba(0,255,136,' + (.5 + .5 * Math.sin(flash * 25)) + ')'; g.font = '900 34px Orbitron,Inter,sans-serif'; g.textAlign = 'center'; g.fillText('¡TESTIGO!', W / 2, 200); }
      if (msgT > 0) { msgT -= dt; g.fillStyle = 'rgba(5,10,16,.8)'; g.fillRect(W / 2 - 300, H - 92, 600, 38); g.fillStyle = '#fff'; g.font = '700 20px Inter,sans-serif'; g.textAlign = 'center'; g.fillText(msg, W / 2, H - 72); }
    }
    raf = requestAnimationFrame(frame);
  }

  /* ───────── tenis: puntos jugados en pista ───────── */
  function playTennis(o, done) {
    var S = mount(o, 'tennis'); G = S; S.done = done; S.W = 1000; S.H = 440; S.size(); var t = 0, last = 0, st = 'intro', n = 0, N = 8, wait = false;
    S.clock('Punto 1 de ' + N);
    function point() {
      if (n >= N) { st = 'end'; S.banner('FINAL', o.me.name + ' ' + S.gf + ' – ' + S.ga + ' ' + o.opp.n, S.gf > S.ga ? 'mine' : 'theirs', 1500, function () { stop(); done({ gf: S.gf, ga: S.ga, shots: N, poss: 50 }); }, S.gf > S.ga); return; }
      var atk = n % 2 === 0; S.clock('Punto ' + (n + 1) + ' de ' + N); S.banner(atk ? 'TU SAQUE' : 'RESTA', atk ? 'Desliza para colocar el golpe' : 'Desliza hacia donde va la bola', atk ? 'mine' : 'theirs', 1000, function () {
        o.shot(atk ? 'shoot' : 'save', { rating: atk ? o.opp.gk : o.me.gk }, function (r) { if (atk && r.out === 'gol') { S.gf++; S.board(); S.bump('#pt-a'); KG.sfx.win(); } else if (!atk && r.out === 'gol') { S.ga++; S.board(); S.bump('#pt-b'); } else if (atk && r.out !== 'gol') { /* punto para el rival si falla */ if (r.out === 'fuera') { S.ga++; S.board(); S.bump('#pt-b'); } } else if (!atk && r.out === 'fuera') { S.gf++; S.board(); S.bump('#pt-a'); } n++; setTimeout(point, 250); });
      });
    }
    function frame(now) { raf = requestAnimationFrame(frame); if (!G) return; var dt = Math.min(.033, (now - (last || now)) / 1000); last = now; t += dt;
      if (st === 'intro') { drawIntro(S, t); if (t > 3.2 || S.skip) { st = 'play'; point(); } return; }
      var g = S.g, W = 1000, H = 440; g.setTransform(S.DPR * S.sc, 0, 0, S.DPR * S.sc, 0, 0); g.fillStyle = '#04070d'; g.fillRect(0, 0, W, H); var gr = g.createLinearGradient(0, H * .3, 0, H); gr.addColorStop(0, '#14452f'); gr.addColorStop(1, '#0b2a1e'); g.fillStyle = gr; g.fillRect(0, H * .3, W, H * .7);
      g.fillStyle = '#1f62ad'; g.beginPath(); g.moveTo(W * .3, H * .3); g.lineTo(W * .7, H * .3); g.lineTo(W * .96, H * .94); g.lineTo(W * .04, H * .94); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 3; g.stroke(); g.beginPath(); g.moveTo(W * .5, H * .3); g.lineTo(W * .5, H * .62); g.moveTo(W * .36, H * .45); g.lineTo(W * .64, H * .45); g.stroke(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(W * .16, H * .62, W * .68, H * .05);
      for (var i = 0; i < 60; i++) { var h = Math.sin(i * 91.7) * 43758.5; h -= Math.floor(h); g.fillStyle = 'rgba(' + (h < .33 ? '255,90,120' : h < .66 ? '90,140,255' : '255,214,90') + ',.2)'; g.fillRect(i * W / 60 + 2, 8, W / 60 - 4, 16); }
    }
    raf = requestAnimationFrame(frame);
  }

  window.KGP = {
    stop: stop,
    play: function (o, done) { stop(); var sp = o.sport; if (sp === 'running') playRace(o, done); else if (sp === 'tenis') playTennis(o, done); else playTeam(o, done); }
  };
})();
