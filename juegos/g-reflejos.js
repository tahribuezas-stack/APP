/* KINET OS · Juego 4 · Reflejos en perspectiva (arcade canvas, 3 carriles). Sin registro. */
(function () {
  'use strict';
  var DUR = 30, HIT_T = .86;
  var SK = {
    futbol:     { role: 'Portero', obj: 'Balones', dec: 'Tarjeta roja' },
    baloncesto: { role: 'Defensor', obj: 'Pases', dec: 'Falta' },
    tenis:      { role: 'Resto', obj: 'Bolas', dec: 'Doble falta' },
    running:    { role: 'Salida', obj: 'Pulsos de salida', dec: 'Falsa salida' }
  };
  var stage = KG.$('#kg-stage'), cv, ctx, W, H, DPR, raf = 0, S, col = '#00FF88', colr = '0,255,136', lastT = 0, running = false;

  function rgb() { var cs = getComputedStyle(document.documentElement); col = cs.getPropertyValue('--kc').trim() || '#00FF88'; colr = cs.getPropertyValue('--kcr').trim() || '0,255,136'; }

  function mount() {
    stage.innerHTML = '<div class="rf"><canvas id="rf-cv" aria-label="Zona de juego de reflejos"></canvas>' +
      '<div class="rf-hud" id="rf-hud"><div><small class="kg-mono">Puntos</small><b id="rf-sc">0</b></div><div class="rf-tm"><b id="rf-tm">30</b><small class="kg-mono">segundos</small></div><div><small class="kg-mono">Combo</small><b id="rf-cb">×1</b></div></div>' +
      '<div class="rf-ov" id="rf-ov"></div>' +
      '<div class="rf-keys" id="rf-keys"><button type="button" data-l="0">A</button><button type="button" data-l="1">S</button><button type="button" data-l="2">D</button></div></div>';
    cv = KG.$('#rf-cv'); ctx = cv.getContext('2d'); size();
    var tap = function (e) { if (!running) return; var r = cv.getBoundingClientRect(), x = ((e.touches ? e.touches[0].clientX : e.clientX) - r.left) / r.width; press(Math.min(2, Math.max(0, Math.floor(x * 3)))); e.preventDefault(); };
    cv.addEventListener('pointerdown', tap);
    KG.$$('#rf-keys button').forEach(function (b) { b.addEventListener('pointerdown', function (e) { if (running) press(+b.dataset.l); e.preventDefault(); }); });
  }
  function size() {
    var box = cv.parentNode.getBoundingClientRect(); DPR = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(300, box.width); H = innerWidth < 700 ? Math.min(620, Math.max(430, innerHeight * .62)) : Math.max(420, Math.min(600, W * .56, innerHeight - 260));
    cv.width = W * DPR; cv.height = H * DPR; cv.style.height = H + 'px'; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  addEventListener('resize', function () { if (cv) size(); });

  /* geometría en perspectiva */
  function hz() { return H * .2; }
  function yAt(t) { return hz() + (H - hz()) * Math.pow(t, 1.7); }
  function sc(t) { return .12 + .88 * Math.pow(t, 1.7); }
  function xAt(l, t) { return W / 2 + (l - 1) * (W * .3) * sc(t) / 1; }

  function drawBg(time) {
    var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#04070c'); g.addColorStop(.2, '#071019'); g.addColorStop(1, '#03050a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var gl = ctx.createRadialGradient(W / 2, hz(), 0, W / 2, hz(), W * .6); gl.addColorStop(0, 'rgba(' + colr + ',.38)'); gl.addColorStop(1, 'rgba(' + colr + ',0)'); ctx.fillStyle = gl; ctx.fillRect(0, 0, W, H * .6);
    /* estrellas */
    ctx.fillStyle = 'rgba(255,255,255,.5)'; for (var i = 0; i < 40; i++) { var sx = (i * 97.3) % W, sy = (i * 53.1) % (hz() - 6); ctx.globalAlpha = .25 + .5 * Math.abs(Math.sin(time / 900 + i)); ctx.fillRect(sx, sy, 1.5, 1.5); } ctx.globalAlpha = 1;
    /* suelo: líneas horizontales en movimiento */
    var off = (time / 1000 * (S ? S.speed : .5)) % 1;
    ctx.strokeStyle = 'rgba(' + colr + ',.28)'; ctx.lineWidth = 1;
    for (var k = 0; k < 14; k++) { var t = (k + off) / 14, y = yAt(t); ctx.globalAlpha = .15 + t * .6; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } ctx.globalAlpha = 1;
    /* carriles */
    for (var l = 0; l < 4; l++) { var lx = (l - 1.5); ctx.strokeStyle = 'rgba(' + colr + ',.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(W / 2 + lx * W * .3 * .12, hz()); ctx.lineTo(W / 2 + lx * W * .3, H); ctx.stroke(); }
    /* línea de golpeo */
    var y1 = yAt(HIT_T), a = xAt(0, HIT_T) - W * .3 * sc(HIT_T) * .5, b = xAt(2, HIT_T) + W * .3 * sc(HIT_T) * .5;
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.shadowColor = col; ctx.shadowBlur = 18; ctx.beginPath(); ctx.moveTo(a, y1); ctx.lineTo(b, y1); ctx.stroke(); ctx.shadowBlur = 0;
    /* resplandor de carril al pulsar */
    if (S) for (var q = 0; q < 3; q++) { var f = S.flash[q]; if (f > 0) { var cl = S.flashC[q]; ctx.fillStyle = 'rgba(' + cl + ',' + (f * .4) + ')'; ctx.beginPath(); ctx.moveTo(xAt(q, 0) - W * .3 * sc(0) * .5, hz()); ctx.lineTo(xAt(q, 0) + W * .3 * sc(0) * .5, hz()); ctx.lineTo(xAt(q, 1) + W * .3 * .5, H); ctx.lineTo(xAt(q, 1) - W * .3 * .5, H); ctx.fill(); S.flash[q] = Math.max(0, f - .06); } }
    /* "portero" / jugador: marcador de carril activo */
    var tx = S ? S.me : 1; var px = xAt(tx, 1); ctx.fillStyle = 'rgba(' + colr + ',.12)'; ctx.beginPath(); ctx.ellipse(px, H - 18, W * .1, 10, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(px, H - 18, W * .1, 10, 0, 0, 7); ctx.stroke();
  }

  function drawObj(o) {
    var t = o.t, x = xAt(o.l, t), y = yAt(t), r = 8 + 40 * sc(t) * (H / 600 + .35) * (W < 700 ? .8 : 1);
    ctx.save(); ctx.translate(x, y - r * .2);
    if (o.d) { /* trampa roja */
      ctx.shadowColor = '#fb7185'; ctx.shadowBlur = 20; ctx.fillStyle = '#7f1d2d'; ctx.strokeStyle = '#fb7185'; ctx.lineWidth = Math.max(2, r * .1);
      ctx.beginPath(); for (var i = 0; i < 8; i++) { var an = i * Math.PI / 4 + t * 3, rr = i % 2 ? r * .62 : r; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0; ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2, r * .14); ctx.beginPath(); ctx.moveTo(-r * .3, -r * .3); ctx.lineTo(r * .3, r * .3); ctx.moveTo(r * .3, -r * .3); ctx.lineTo(-r * .3, r * .3); ctx.stroke();
    } else drawSport(r, t);
    ctx.restore();
  }
  function drawSport(r, t) {
    var s = KG.sport; ctx.shadowColor = col; ctx.shadowBlur = 22;
    if (s === 'futbol') { ctx.fillStyle = '#f4f7fb'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = '#1b2430'; poly(0, 0, r * .36, 5, t * 4); ctx.fill(); for (var i = 0; i < 5; i++) { var a = i * 1.2566 + t * 4; ctx.beginPath(); ctx.arc(Math.cos(a) * r * .86, Math.sin(a) * r * .86, r * .17, 0, 7); ctx.fill(); } }
    else if (s === 'baloncesto') { ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = '#2b1204'; ctx.lineWidth = Math.max(1.5, r * .07); ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke(); ctx.beginPath(); ctx.arc(-r * 1.15, 0, r * .85, -1, 1); ctx.stroke(); ctx.beginPath(); ctx.arc(r * 1.15, 0, r * .85, Math.PI - 1, Math.PI + 1); ctx.stroke(); }
    else if (s === 'tenis') { ctx.fillStyle = '#d9f24b'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1.5, r * .09); ctx.beginPath(); ctx.arc(-r * 1.1, 0, r * .95, -.9, .9); ctx.stroke(); ctx.beginPath(); ctx.arc(r * 1.1, 0, r * .95, Math.PI - .9, Math.PI + .9); ctx.stroke(); }
    else { ctx.strokeStyle = col; ctx.lineWidth = Math.max(3, r * .18); ctx.beginPath(); ctx.arc(0, 0, r * .9, 0, 7); ctx.stroke(); ctx.shadowBlur = 0; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-r * .3, -r * .45); ctx.lineTo(r * .5, 0); ctx.lineTo(-r * .3, r * .45); ctx.closePath(); ctx.fill(); }
    ctx.shadowBlur = 0;
  }
  function poly(x, y, r, n, rot) { ctx.beginPath(); for (var i = 0; i < n; i++) { var a = rot + i * 6.2832 / n - 1.5708; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); }

  function frame(now) {
    raf = requestAnimationFrame(frame); var dt = Math.min(.05, (now - (lastT || now)) / 1000); lastT = now;
    drawBg(now);
    if (S && running) update(dt);
    if (S) {
      S.objs.forEach(drawObj);
      S.fx = S.fx.filter(function (p) { p.life -= dt; if (p.life <= 0) return false; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); ctx.globalAlpha = 1; return true; });
      S.pops = S.pops.filter(function (p) { p.life -= dt; if (p.life <= 0) return false; ctx.globalAlpha = Math.min(1, p.life * 2.2); ctx.fillStyle = p.c; ctx.font = '800 ' + (W < 700 ? 18 : 22) + 'px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.shadowColor = p.c; ctx.shadowBlur = 12; ctx.fillText(p.t, p.x, p.y - (1 - p.life / .9) * 40); ctx.shadowBlur = 0; ctx.globalAlpha = 1; return true; });
    }
  }

  function newState() { return { t: 0, score: 0, combo: 0, best: 0, hits: 0, miss: 0, perf: 0, dec: 0, objs: [], fx: [], pops: [], next: .6, speed: .62, me: 1, flash: [0, 0, 0], flashC: ['255,255,255', '255,255,255', '255,255,255'], rnd: KG.rng(Date.now()) }; }

  function update(dt) {
    S.t += dt; var p = S.t / DUR; S.speed = .62 + .6 * p; /* t por segundo */
    S.next -= dt; if (S.next <= 0) { S.next = Math.max(.34, .85 - .5 * p) * (.75 + S.rnd() * .5); var d = S.rnd() < .18 + .08 * p; S.objs.push({ l: Math.floor(S.rnd() * 3), t: 0, d: d, done: false }); if (p > .5 && S.rnd() < .2) S.objs.push({ l: Math.floor(S.rnd() * 3), t: -.06, d: false, done: false }); }
    S.objs.forEach(function (o) { o.t += S.speed * dt * (o.t < 0 ? 1 : 1); });
    S.objs = S.objs.filter(function (o) {
      if (o.t > 1.08) { if (!o.d && !o.done) { S.miss++; S.combo = 0; pop(o.l, 'FALLO', '#fb7185'); KG.sfx.bad(); } return false; } return !o.done;
    });
    var left = Math.max(0, DUR - S.t); KG.$('#rf-tm').textContent = Math.ceil(left); KG.$('#rf-sc').textContent = S.score; KG.$('#rf-cb').textContent = '×' + mult();
    KG.$('#rf-hud').classList.toggle('lo', left < 6);
    if (left <= 0) end();
  }
  function mult() { return Math.min(4, 1 + Math.floor(S.combo / 5)); }
  function pop(l, t, c) { S.pops.push({ x: xAt(l, HIT_T), y: yAt(HIT_T) - 50, t: t, c: c, life: .9, max: .9 }); }
  function burst(l, c, n) { var x = xAt(l, HIT_T), y = yAt(HIT_T); for (var i = 0; i < n; i++) { var a = Math.random() * 6.28, v = 80 + Math.random() * 240; S.fx.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, r: 1.5 + Math.random() * 3, life: .5 + Math.random() * .4, max: .9, c: c }); } }

  function press(l) {
    S.me = l; var best = null;
    S.objs.forEach(function (o) { if (o.l === l && !o.done && o.t > .68 && o.t < 1.06 && (!best || Math.abs(o.t - HIT_T) < Math.abs(best.t - HIT_T))) best = o; });
    if (!best) { S.flash[l] = .5; S.flashC[l] = '255,255,255'; S.combo = Math.max(0, S.combo - 1); return; }
    best.done = true;
    if (best.d) { S.dec++; S.score = Math.max(0, S.score - 150); S.combo = 0; S.flash[l] = 1; S.flashC[l] = '251,113,133'; pop(l, '−150 ' + SK[KG.sport].dec.toUpperCase(), '#fb7185'); burst(l, '#fb7185', 22); KG.sfx.bad(); KG.$('#rf-cv').classList.remove('shake'); void cv.offsetWidth; cv.classList.add('shake'); return; }
    var err = Math.abs(best.t - HIT_T), perfect = err < .045; S.combo++; S.best = Math.max(S.best, S.combo); S.hits++; if (perfect) S.perf++;
    var pts = (perfect ? 150 : 100) * mult(); S.score += pts; S.flash[l] = 1; S.flashC[l] = colr; pop(l, (perfect ? 'PERFECTO +' : '+') + pts, perfect ? '#fff' : col); burst(l, col, perfect ? 26 : 14);
    KG.beep(520 + Math.min(S.combo, 20) * 28, .08, 'triangle', .06);
  }

  function intro() {
    running = false; S = null; var best = KG.get('reflejos_' + KG.sport, 0), k = SK[KG.sport];
    KG.$('#rf-hud').classList.add('hid'); KG.$('#rf-keys').classList.add('hid');
    KG.$('#rf-ov').className = 'rf-ov on'; KG.$('#rf-ov').innerHTML = '<div class="rf-card"><small class="kg-mono">Modo ' + k.role + ' · ' + KG.sports[KG.sport].n + '</small><h2>Intercepta <em>lo que viene</em></h2><p>' + k.obj + ' por tres carriles. Toca el carril cuando crucen la línea. <b>No</b> toques lo rojo (' + k.dec.toLowerCase() + ').</p><div class="rf-kk"><span>A</span><span>S</span><span>D</span><em>o ← ↓ →</em></div><div class="tr-meta"><span><b>30 s</b>de partido</span><span><b>×4</b>combo máx.</span><span><b>' + (best || '—') + '</b>tu récord</span></div><button class="kg-btn pri" id="rf-go" type="button">¡A jugar!</button></div>';
    KG.$('#rf-go').addEventListener('click', countdown);
  }
  function countdown() {
    var ov = KG.$('#rf-ov'), n = 3; ov.innerHTML = '<div class="rf-cd" id="rf-cd">3</div>'; KG.sfx.tick();
    var iv = setInterval(function () { n--; if (n <= 0) { clearInterval(iv); start(); } else { KG.$('#rf-cd').textContent = n; KG.sfx.tick(); var e = KG.$('#rf-cd'); e.style.animation = 'none'; void e.offsetWidth; e.style.animation = ''; } }, 800);
  }
  function start() { S = newState(); running = true; KG.$('#rf-ov').className = 'rf-ov'; KG.$('#rf-ov').innerHTML = ''; KG.$('#rf-hud').classList.remove('hid'); KG.$('#rf-keys').classList.remove('hid'); }
  function end() {
    running = false; var key = 'reflejos_' + KG.sport, best = KG.get(key, 0), rec = S.score > best; if (rec) KG.set(key, S.score);
    var sc = S.score, t = sc >= 7000 ? 'Leyenda de los reflejos' : sc >= 4500 ? 'Muro infranqueable' : sc >= 2200 ? 'Reflejos de titular' : sc >= 800 ? 'En calentamiento' : 'Recién levantado';
    var tot = S.hits + S.miss, acc = tot ? Math.round(S.hits / tot * 100) : 0;
    KG.sheet({ game: 'reflejos', kicker: 'Fin del partido · ' + KG.sports[KG.sport].n, big: sc, title: t,
      lines: [S.hits + ' aciertos · ' + S.perf + ' perfectos · ' + acc + ' % de precisión', 'Mejor combo: ×' + Math.min(4, 1 + Math.floor(S.best / 5)) + ' (' + S.best + ' seguidos)', rec ? '🏆 ¡Nuevo récord!' : 'Tu récord: ' + best],
      tip: '<b>Dato:</b> la velocidad de reacción se entrena. Combínala con un buen calentamiento y descanso: cansado, reaccionas hasta un 20 % peor.',
      shareText: 'Hice ' + sc + ' puntos en Reflejos (' + KG.sports[KG.sport].n + ') y soy «' + t + '». ¿Me superas?', shareUrl: location.origin + '/juegos/reflejos.html?d=' + KG.sport,
      again: function () { intro(); countdown(); }, ctaTitle: 'Entrena de verdad con KINET', ctaText: 'Planes de entrenamiento y análisis con IA para tu deporte.', win: sc >= 2200 });
  }

  addEventListener('keydown', function (e) { if (!running) return; var m = { a: 0, s: 1, d: 2, arrowleft: 0, arrowdown: 1, arrowright: 2 }[e.key.toLowerCase()]; if (m != null) { press(m); e.preventDefault(); } });
  mount(); rgb(); raf = requestAnimationFrame(frame); intro();
  KG.onSport(function () { rgb(); intro(); });
})();
