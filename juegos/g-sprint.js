/* KINET OS · Juego 7 · Sprint de 60 segundos (cadencia: carril izquierdo/derecho al ritmo). Sin registro. */
(function () {
  'use strict';
  var DUR = 60, TRAVEL = 1.45, GOOD = .13, PERF = .055;
  var SK = {
    futbol: { v: 'Conducción de balón', u: 'toques', bands: ['#0b3d1f', '#0e4a26'] },
    baloncesto: { v: 'Bote y desplazamiento', u: 'botes', bands: ['#4a2308', '#5a2d0c'] },
    tenis: { v: 'Juego de piernas', u: 'pasos', bands: ['#0d2b4a', '#10365c'] },
    running: { v: 'Zancada en pista', u: 'zancadas', bands: ['#4a1414', '#5a1a1a'] }
  };
  var stage = KG.$('#kg-stage'), cv, ctx, W, H, DPR, raf = 0, S, running = false, col, colr, lastT = 0;
  function rgb() { var cs = getComputedStyle(document.documentElement); col = cs.getPropertyValue('--kc').trim() || '#00FF88'; colr = cs.getPropertyValue('--kcr').trim() || '0,255,136'; }

  function mount() {
    stage.innerHTML = '<div class="sp"><canvas id="sp-cv" aria-label="Pista de ritmo"></canvas>' +
      '<div class="sp-hud" id="sp-hud"><div><small class="kg-mono">Metros</small><b id="sp-m">0</b></div><div class="sp-bpm"><b id="sp-b">120</b><small class="kg-mono">pasos/min</small></div><div><small class="kg-mono">Racha</small><b id="sp-c">0</b></div></div>' +
      '<div class="sp-stam" id="sp-stam"><i id="sp-sf"></i></div><div class="sp-t" id="sp-t"></div><div class="sp-ov" id="sp-ov"></div></div>';
    cv = KG.$('#sp-cv'); ctx = cv.getContext('2d'); size();
    cv.addEventListener('pointerdown', function (e) { if (!running) return; var r = cv.getBoundingClientRect(); press((e.clientX - r.left) < r.width / 2 ? 0 : 1); e.preventDefault(); });
  }
  function size() { var box = cv.parentNode.getBoundingClientRect(); DPR = Math.min(2, devicePixelRatio || 1); W = Math.max(300, box.width); H = innerWidth < 700 ? Math.min(640, Math.max(460, innerHeight * .66)) : Math.max(460, Math.min(620, innerHeight - 250)); cv.width = W * DPR; cv.height = H * DPR; cv.style.height = H + 'px'; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
  addEventListener('resize', function () { if (cv) size(); });

  function geo() { var tw = Math.min(W * .94, 520); return { x0: W / 2 - tw / 2, tw: tw, lw: tw / 2, hy: H * .8, top: 0 }; }
  function bpmAt(t) { return 120 + 70 * Math.min(1, t / DUR); }

  function bg(now) {
    var g = geo(), sk = SK[KG.sport]; ctx.fillStyle = '#04070c'; ctx.fillRect(0, 0, W, H);
    var spd = S ? bpmAt(S.t) / 60 * 130 : 100, off = ((S ? S.t : now / 1000) * spd) % 120;
    for (var y = -120 + off; y < H; y += 120) { ctx.fillStyle = sk.bands[0]; ctx.globalAlpha = .55; ctx.fillRect(0, y, W, 60); ctx.fillStyle = sk.bands[1]; ctx.fillRect(0, y + 60, W, 60); } ctx.globalAlpha = 1;
    var sh = ctx.createLinearGradient(0, 0, 0, H); sh.addColorStop(0, 'rgba(4,7,12,.95)'); sh.addColorStop(.5, 'rgba(4,7,12,.35)'); sh.addColorStop(1, 'rgba(4,7,12,.8)'); ctx.fillStyle = sh; ctx.fillRect(0, 0, W, H);
    /* pista */
    ctx.fillStyle = 'rgba(6,10,16,.88)'; ctx.fillRect(g.x0, 0, g.tw, H); ctx.strokeStyle = 'rgba(' + colr + ',.6)'; ctx.lineWidth = 2; ctx.strokeRect(g.x0, -2, g.tw, H + 4);
    ctx.strokeStyle = 'rgba(' + colr + ',.25)'; ctx.setLineDash([10, 12]); ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([]);
    /* pulso del compás */
    var beat = S ? S.pulse : 0; if (beat > 0) { ctx.fillStyle = 'rgba(' + colr + ',' + (beat * .16) + ')'; ctx.fillRect(g.x0, 0, g.tw, H); S.pulse = Math.max(0, beat - .05); }
    /* huellas guía */
    for (var l = 0; l < 2; l++) { var cx = g.x0 + g.lw * (l + .5), a = S && S.lane[l] > 0 ? S.lane[l] : 0; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.shadowColor = col; ctx.shadowBlur = 14 + a * 20; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(cx - g.lw * .42, g.hy - 24, g.lw * .84, 48, 16) : ctx.rect(cx - g.lw * .42, g.hy - 24, g.lw * .84, 48); ctx.stroke(); ctx.shadowBlur = 0; if (a > 0) { ctx.fillStyle = 'rgba(' + S.laneC[l] + ',' + (a * .3) + ')'; ctx.fill(); S.lane[l] = Math.max(0, a - .07); }
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.font = '700 12px "JetBrains Mono",monospace'; ctx.textAlign = 'center'; ctx.fillText(l ? 'DERECHA · D / →' : 'IZQUIERDA · A / ←', cx, g.hy + 52); }
  }
  function drawMark(m) {
    var g = geo(), y = g.hy - (m.time - S.t) / TRAVEL * g.hy, cx = g.x0 + g.lw * (m.l + .5), w = g.lw * .84, hh = 48;
    if (y < -40) return; ctx.save(); ctx.translate(cx, y); ctx.shadowColor = col; ctx.shadowBlur = 20; ctx.fillStyle = 'rgba(' + colr + ',.85)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-w / 2, -hh / 2, w, hh, 16) : ctx.rect(-w / 2, -hh / 2, w, hh); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#04110a'; ctx.beginPath(); ctx.ellipse(m.l ? 8 : -8, -6, 9, 13, m.l ? .3 : -.3, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(m.l ? -6 : 6, 9, 7, 9, 0, 0, 7); ctx.fill(); ctx.restore();
  }

  function frame(now) {
    raf = requestAnimationFrame(frame); var dt = Math.min(.05, (now - (lastT || now)) / 1000); lastT = now; bg(now);
    if (S) {
      if (running) tick(dt);
      S.marks.forEach(drawMark);
      S.pops = S.pops.filter(function (p) { p.life -= dt; if (p.life <= 0) return false; ctx.globalAlpha = Math.min(1, p.life * 3); ctx.fillStyle = p.c; ctx.font = '800 18px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.shadowColor = p.c; ctx.shadowBlur = 10; ctx.fillText(p.t, p.x, p.y - (1 - p.life / .7) * 40); ctx.shadowBlur = 0; ctx.globalAlpha = 1; return true; });
      S.fx = S.fx.filter(function (p) { p.life -= dt; if (p.life <= 0) return false; p.x += p.vx * dt; p.y += p.vy * dt; ctx.globalAlpha = p.life / .6; ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, 3, 3); ctx.globalAlpha = 1; return true; });
    }
  }
  function newS() { return { t: -1.2, marks: [], nextBeat: 0, nextIdx: 0, lastL: 1, stam: 100, hits: 0, miss: 0, perf: 0, combo: 0, best: 0, m: 0, pulse: 0, lane: [0, 0], laneC: ['255,255,255', '255,255,255'], pops: [], fx: [], rnd: KG.rng(Date.now()), beatsDone: 0 }; }

  function tick(dt) {
    S.t += dt; var g = geo();
    /* generar marcas por adelantado */
    while (S.nextBeat < S.t + TRAVEL + .2 && S.nextBeat < DUR) {
      var p = S.nextBeat / DUR, l = S.lastL ? 0 : 1; if (p > .25 && S.rnd() < .16) l = S.lastL; S.lastL = l; S.marks.push({ l: l, time: S.nextBeat, hit: false });
      S.nextBeat += 60 / bpmAt(Math.max(0, S.nextBeat));
    }
    S.marks = S.marks.filter(function (m) { if (!m.hit && S.t - m.time > GOOD) { S.miss++; S.combo = 0; S.stam = Math.max(0, S.stam - 12); KG.beep(160, .12, 'sawtooth', .05); pop(m.l, 'FALLO', '#fb7185'); m.hit = true; } return !(m.hit && S.t - m.time > GOOD); });
    S.marks.forEach(function (m) { if (!m.hit && Math.abs(S.t - m.time) < .02) S.pulse = 1; });
    var left = Math.max(0, DUR - Math.max(0, S.t)); KG.$('#sp-b').textContent = Math.round(bpmAt(Math.max(0, S.t))); KG.$('#sp-m').textContent = Math.round(S.m); KG.$('#sp-c').textContent = S.combo; KG.$('#sp-sf').style.width = S.stam + '%'; KG.$('#sp-sf').classList.toggle('lo', S.stam < 35);
    KG.$('#sp-t').textContent = Math.ceil(left) + ' s'; KG.$('#sp-hud').classList.toggle('lo', left < 6);
    if (S.t >= DUR + .3 || S.stam <= 0) end(S.stam <= 0);
  }
  function pop(l, t, c) { var g = geo(); S.pops.push({ x: g.x0 + g.lw * (l + .5), y: g.hy - 40, t: t, c: c, life: .7 }); }
  function press(l) {
    if (S.t < -.2) return; S.lane[l] = 1; var best = null;
    S.marks.forEach(function (m) { if (m.l === l && !m.hit && Math.abs(S.t - m.time) < GOOD * 1.2 && (!best || Math.abs(S.t - m.time) < Math.abs(S.t - best.time))) best = m; });
    var g = geo(), cx = g.x0 + g.lw * (l + .5);
    if (!best) { S.combo = 0; S.stam = Math.max(0, S.stam - 5); S.laneC[l] = '251,113,133'; pop(l, 'TROPIEZO', '#fb7185'); KG.beep(200, .08, 'square', .04); return; }
    best.hit = true; var err = Math.abs(S.t - best.time), perf = err < PERF; S.hits++; S.combo++; S.best = Math.max(S.best, S.combo); if (perf) S.perf++;
    S.stam = Math.min(100, S.stam + 1.2); S.m += (perf ? 1.9 : 1.4) * (1 + Math.min(.5, S.combo / 80)); S.laneC[l] = perf ? '255,255,255' : colr; pop(l, perf ? 'PERFECTO' : 'BIEN', perf ? '#fff' : col);
    for (var i = 0; i < (perf ? 18 : 9); i++) { var a = Math.random() * 6.28, v = 60 + Math.random() * 200; S.fx.push({ x: cx, y: g.hy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, life: .6, c: col }); }
    KG.beep(380 + (l ? 90 : 0) + Math.min(S.combo, 30) * 6, .05, 'triangle', .05);
  }

  function intro() {
    running = false; S = null; var best = KG.get('sprint_' + KG.sport, 0), sk = SK[KG.sport];
    KG.$('#sp-hud').classList.add('hid'); KG.$('#sp-stam').classList.add('hid'); KG.$('#sp-t').classList.add('hid');
    var ov = KG.$('#sp-ov'); ov.className = 'sp-ov on';
    ov.innerHTML = '<div class="rf-card"><small class="kg-mono">' + sk.v + ' · ' + KG.sports[KG.sport].n + '</small><h2>Mantén <em>la cadencia</em></h2><p>Las huellas bajan por la pista: pulsa el carril izquierdo o derecho justo cuando lleguen a la línea. El ritmo sube de 120 a 190 pasos/min. Si te quedas sin energía, te caes.</p><div class="rf-kk"><span>A</span><span>D</span><em>o ← →, o toca cada mitad</em></div><div class="tr-meta"><span><b>60 s</b>de ritmo</span><span><b>190</b>pasos/min</span><span><b>' + (best ? best + ' m' : '—') + '</b>tu récord</span></div><button class="kg-btn pri" id="sp-go" type="button">¡A correr!</button></div>';
    KG.$('#sp-go').addEventListener('click', start);
  }
  function start() {
    var ov = KG.$('#sp-ov'); ov.className = 'sp-ov'; ov.innerHTML = '<div class="rf-cd" id="sp-cd">3</div>'; var n = 3; KG.sfx.tick(); S = newS(); S.t = -9;
    var iv = setInterval(function () { n--; if (n <= 0) { clearInterval(iv); ov.innerHTML = ''; S.t = -1.2; running = true; ['#sp-hud', '#sp-stam', '#sp-t'].forEach(function (s) { KG.$(s).classList.remove('hid'); }); } else { var e = KG.$('#sp-cd'); e.textContent = n; e.style.animation = 'none'; void e.offsetWidth; e.style.animation = ''; KG.sfx.tick(); } }, 800);
  }
  function end(fall) {
    if (!running) return; running = false; var key = 'sprint_' + KG.sport, best = KG.get(key, 0), m = Math.round(S.m), rec = m > best; if (rec) KG.set(key, m);
    var tot = S.hits + S.miss, acc = tot ? Math.round(S.hits / tot * 100) : 0, t = fall ? 'Te quedaste sin energía' : m >= 130 ? 'Velocista de élite' : m >= 90 ? 'Cadencia de profesional' : m >= 50 ? 'Buen ritmo' : 'Calentando motores';
    KG.sheet({ game: 'sprint-60', kicker: 'Sprint 60 · ' + KG.sports[KG.sport].n, big: m, title: t, bigSize: 190, dec: 0,
      lines: [S.hits + ' ' + SK[KG.sport].u + ' · ' + S.perf + ' perfectos · ' + acc + ' % de precisión', 'Mejor racha: ' + S.best, rec ? '🏆 ¡Nuevo récord! (metros)' : 'Tu récord: ' + best + ' m'],
      tip: '<b>Dato:</b> la cadencia óptima al correr ronda los 170–190 pasos por minuto. Entrenarla mejora la eficiencia y reduce el impacto en las articulaciones.',
      shareText: 'Recorrí ' + m + ' metros en el Sprint de 60 s (' + KG.sports[KG.sport].n + '). ¿Mantienes la cadencia?', shareUrl: location.origin + '/juegos/sprint-60.html?d=' + KG.sport,
      again: function () { intro(); start(); }, ctaTitle: 'Analiza tu carrera con KINET', ctaText: 'Sube tu técnica y recibe un plan de entrenamiento con IA.', win: m >= 50 });
  }
  addEventListener('keydown', function (e) { if (!running) return; var k = e.key.toLowerCase(), m = { a: 0, arrowleft: 0, d: 1, arrowright: 1 }[k]; if (m != null) { press(m); e.preventDefault(); } });
  mount(); rgb(); raf = requestAnimationFrame(frame); intro();
  KG.onSport(function () { rgb(); intro(); });
})();
