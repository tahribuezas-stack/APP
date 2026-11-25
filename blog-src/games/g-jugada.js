/* KINET OS · Juego 6 · Adivina la jugada (sala de vídeo táctica). Sin registro. */
(function () {
  'use strict';
  /* actor: [id, equipo, x0, y0, x1, y1]   opción: {t, to:[x,y]|'id', ok, why, stop:'id'} */
  var PL = {
    futbol: [
      { n: 'Contraataque 3 contra 2', ball: 'A1', a: [['A1', 'a', 30, 50, 60, 50], ['A2', 'a', 36, 22, 68, 24], ['A3', 'a', 36, 78, 68, 76], ['B1', 'b', 80, 44, 76, 43], ['B2', 'b', 80, 58, 77, 58]],
        o: [{ t: 'Pase a A2 por fuera arriba', to: 'A2', ok: 0, stop: 'B1', why: 'B1 cierra ese carril y corta el pase. Con 3 contra 2 el que decide tiene que fijar a un defensor antes de pasar.' }, { t: 'Pase a A3 al espacio libre', to: 'A3', ok: 1, why: 'B2 está lejos de A3. El pase al espacio libre deja al compañero con ventaja para encarar o tirar.' }, { t: 'Disparo de lejos', to: [100, 50], ok: 0, stop: 'B2', why: 'Disparar a 40 metros con compañeros libres es desperdiciar una ventaja numérica.' }] },
      { n: 'Presión alta del rival', ball: 'A1', a: [['A1', 'a', 30, 52, 40, 50], ['A2', 'a', 22, 70, 28, 66], ['A3', 'a', 52, 40, 64, 40], ['B1', 'b', 56, 56, 47, 50], ['B2', 'b', 70, 44, 66, 42]],
        o: [{ t: 'Pase largo a A3', to: 'A3', ok: 0, stop: 'B2', why: 'A3 está marcado por B2: es un pase de 50 % que, si se pierde, deja a tu equipo expuesto.' }, { t: 'Pase atrás a A2 y cambio de lado', to: 'A2', ok: 1, why: 'Al ir B1 a presionar, deja un hueco a su espalda. El pase atrás conserva el balón y rompe la presión.' }, { t: 'Regatear a B1', to: [56, 50], ok: 0, stop: 'B1', why: 'Regatear con un defensor encima y en tu campo es el riesgo más alto posible.' }] },
      { n: 'Llegada por banda', ball: 'A1', a: [['A1', 'a', 62, 14, 80, 18], ['A2', 'a', 80, 52, 90, 48], ['A3', 'a', 66, 62, 72, 58], ['B1', 'b', 92, 46, 92, 46], ['B2', 'b', 76, 40, 82, 32], ['B3', 'b', 94, 56, 94, 56]],
        o: [{ t: 'Centro al área a A2', to: 'A2', ok: 0, stop: 'B1', why: 'A2 está entre dos defensas: el centro lo ganará el rival.' }, { t: 'Pase atrás a A3, que llega libre', to: 'A3', ok: 1, why: 'Los defensas miran al balón y a A2. A3 llega desde atrás sin marca: la jugada clásica de cutback.' }, { t: 'Tiro directo desde el ángulo cerrado', to: [100, 46], ok: 0, stop: 'B3', why: 'Desde ese ángulo casi no hay portería que ver.' }] }
    ],
    baloncesto: [
      { n: 'Bloqueo y continuación', ball: 'A1', a: [['A1', 'a', 48, 50, 62, 50], ['A2', 'a', 60, 40, 66, 45], ['A3', 'a', 78, 22, 90, 12], ['B1', 'b', 56, 52, 64, 50], ['B2', 'b', 74, 44, 82, 44], ['B3', 'b', 80, 24, 85, 36]],
        o: [{ t: 'Forzar la bandeja', to: [95, 50], ok: 0, stop: 'B2', why: 'B2 espera bajo el aro: la bandeja sería taponada o muy forzada.' }, { t: 'Pase a A3 en la esquina', to: 'A3', ok: 1, why: 'B3 se ha cerrado a ayudar en la pintura y deja la esquina libre. Un pase para tiro de tres sin oposición.' }, { t: 'Tiro de media distancia con B1 encima', to: [88, 50], ok: 0, stop: 'B1', why: 'Es el tiro menos eficiente del baloncesto y con defensor encima.' }] },
      { n: 'Contraataque 2 contra 1', ball: 'A1', a: [['A1', 'a', 38, 50, 66, 50], ['A2', 'a', 40, 28, 70, 24], ['B1', 'b', 84, 40, 80, 44]],
        o: [{ t: 'Tiro de tres con B1 acercándose', to: [95, 50], ok: 0, stop: 'B1', why: 'Con ventaja de 2 contra 1 no hace falta tirar de lejos con un defensor encima.' }, { t: 'Atacar el aro y pasar cuando B1 se comprometa', to: 'A2', ok: 1, why: 'Atacar al defensor le obliga a elegir: si sale a ti, A2 anota; si no, anotas tú.' }, { t: 'Pase inmediato a A2', to: 'A2', ok: 0, stop: 'B1', why: 'Pasar demasiado pronto permite a B1 recuperar posición y cerrar a ambos.' }] },
      { n: 'Defensa en zona', ball: 'A1', a: [['A1', 'a', 62, 24, 66, 28], ['A2', 'a', 80, 50, 80, 50], ['A3', 'a', 88, 84, 90, 84], ['B1', 'b', 70, 30, 70, 32], ['B2', 'b', 78, 42, 77, 40], ['B3', 'b', 78, 60, 78, 62], ['B4', 'b', 90, 70, 88, 72]],
        o: [{ t: 'Pase a A2 en el poste alto', to: 'A2', ok: 1, why: 'A2 recibe en el hueco entre B2 y B3: ahí la zona se rompe, y desde allí puede pasar, tirar o penetrar.' }, { t: 'Pase cruzado a A3 en la otra esquina', to: 'A3', ok: 0, stop: 'B4', why: 'Un pase largo cruzado da tiempo a la defensa a rotar: B4 lo intercepta.' }, { t: 'Tiro con B1 encima', to: [92, 50], ok: 0, stop: 'B1', why: 'Sin mover la zona, el tiro sale defendido y sin ventaja.' }] }
    ],
    tenis: [
      { n: 'El rival, fuera de posición', ball: 'A1', a: [['A1', 'a', 8, 70, 18, 70], ['B1', 'b', 90, 30, 90, 20]],
        o: [{ t: 'Al lado donde corre el rival', to: [94, 18], ok: 0, stop: 'B1', why: 'Devolver al punto donde ya está el rival le regala la bola.' }, { t: 'Cruzado al otro lado, pista abierta', to: [92, 82], ok: 1, why: 'El rival está descolocado en un lado: toda la pista contraria queda abierta y no llega a tiempo.' }, { t: 'Al centro, sin ángulo', to: [92, 50], ok: 0, stop: 'B1', why: 'Una bola al centro le deja tiempo para recolocarse.' }] },
      { n: 'El rival sube a la red', ball: 'A1', a: [['A1', 'a', 8, 55, 12, 55], ['B1', 'b', 78, 50, 64, 46]],
        o: [{ t: 'Passing shot paralelo', to: [94, 12], ok: 0, stop: 'B1', why: 'Con el rival tan cerca de la red cubriendo, la línea es un tiro de alto riesgo.' }, { t: 'Globo sobre el volea', to: [94, 55], ok: 1, why: 'El rival está muy adelantado: el globo le obliga a girar y correr hacia atrás.' }, { t: 'Directo a su cuerpo', to: [66, 46], ok: 0, stop: 'B1', why: 'A su cuerpo, con la volea ya preparada, el rival decide el punto.' }] },
      { n: 'Bola corta del rival', ball: 'A1', a: [['A1', 'a', 6, 50, 56, 50], ['B1', 'b', 92, 52, 92, 50]],
        o: [{ t: 'Dejada con efecto', to: [66, 50], ok: 1, why: 'El rival está en el fondo, lejos de la red: la dejada no le da tiempo a llegar.' }, { t: 'Globo profundo', to: [96, 50], ok: 0, stop: 'B1', why: 'Con el rival en el fondo, el globo le llega fácil.' }, { t: 'Drive profundo al centro', to: [92, 50], ok: 0, stop: 'B1', why: 'Es correcto, pero al centro y a su cuerpo le permite devolver con facilidad.' }] }
    ],
    running: [
      { n: 'Último giro de 1.500 m', ball: 'A1', a: [['A1', 'a', 30, 50, 46, 50], ['B1', 'b', 40, 50, 54, 50], ['B2', 'b', 40, 60, 54, 60], ['B3', 'b', 28, 66, 42, 66]],
        o: [{ t: 'Salir por fuera ya y adelantar', to: [74, 66], ok: 0, stop: 'B2', why: 'Salir ahora por la calle 3 te hace correr más metros y gastar energía antes de tiempo.' }, { t: 'Seguir pegado, esperar el hueco en la recta', to: [70, 50], ok: 1, why: 'Estás cómodo en la cuerda y a rebufo. Esperas a la recta final para salir con fuerzas.' }, { t: 'Frenar y dejar que pasen', to: [34, 50], ok: 0, stop: 'B3', why: 'Frenar te deja atrás del grupo y sin opciones de sprint.' }] },
      { n: 'Entrega del testigo', ball: 'A1', a: [['A1', 'a', 14, 50, 40, 50], ['A2', 'a', 50, 50, 56, 50], ['B1', 'b', 34, 62, 46, 62]],
        o: [{ t: 'Gritar «¡ya!» y entregar con A2 lanzado', to: 'A2', ok: 1, why: 'Dentro de la zona y con A2 ya a velocidad, el testigo no pierde ritmo. Es la clave del relevo.' }, { t: 'Entregar antes de la zona', to: [47, 50], ok: 0, stop: 'B1', why: 'Fuera de zona el relevo es nulo: descalificación del equipo.' }, { t: 'Esperar a que A2 se detenga', to: [60, 50], ok: 0, stop: 'B1', why: 'Detenerse pierde varios segundos: se gana en la velocidad del cambio.' }] },
      { n: 'Viento de cara en el 5K', ball: 'A1', a: [['A1', 'a', 30, 50, 44, 50], ['A2', 'a', 22, 46, 38, 46], ['A3', 'a', 24, 56, 40, 56], ['B1', 'b', 16, 50, 34, 52]],
        o: [{ t: 'Tirar tú del grupo contra el viento', to: [70, 50], ok: 0, stop: 'A2', why: 'Quien va delante contra el viento gasta mucha más energía que quien se resguarda.' }, { t: 'Ponerte detrás del grupo y relevar luego', to: [34, 50], ok: 1, why: 'A rebufo se ahorra energía; después turnas con el grupo y llegas más fresco al final.' }, { t: 'Acelerar solo', to: [80, 50], ok: 0, stop: 'A3', why: 'Un ataque en solitario contra el viento y tan pronto suele acabar en desgaste.' }] }
    ]
  };
  var stage = KG.$('#kg-stage'), cv, ctx, W, H, DPR, raf = 0, S, col = '#00FF88', colr = '0,255,136', lastT = 0, TRAIL = [];

  function rgb() { var cs = getComputedStyle(document.documentElement); col = cs.getPropertyValue('--kc').trim() || '#00FF88'; colr = cs.getPropertyValue('--kcr').trim() || '0,255,136'; }
  function mount() {
    stage.innerHTML = '<div class="jg"><div class="jg-vw"><canvas id="jg-cv" aria-label="Tablero táctico"></canvas><div class="jg-rec"><i></i>REPETICIÓN TÁCTICA</div><div class="jg-nm kg-mono" id="jg-nm"></div><div class="jg-cap" id="jg-cap"></div></div><div class="jg-side" id="jg-side"></div></div>';
    cv = KG.$('#jg-cv'); ctx = cv.getContext('2d'); size();
  }
  function size() { var box = cv.parentNode.getBoundingClientRect(); DPR = Math.min(2, devicePixelRatio || 1); W = Math.max(300, box.width); H = Math.round(W * (innerWidth < 700 ? .78 : .56)); cv.width = W * DPR; cv.height = H * DPR; cv.style.height = H + 'px'; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
  addEventListener('resize', function () { if (cv) size(); });
  var VX = { futbol: 24, baloncesto: 42, tenis: 0, running: 8 };
  var VR = { running: 68 };
  var XW = function (w) { return w / ((VR[KG.sport] || 100) - (VX[KG.sport] || 0)) * W; };
  var X = function (x) { var v = VX[KG.sport] || 0; return (x - v) / ((VR[KG.sport] || 100) - v) * W; }, Y = function (y) { return y / 100 * H; };

  function court() {
    var s = KG.sport, g = ctx.createLinearGradient(0, 0, 0, H);
    var base = { futbol: ['#0c4a23', '#0a3d1d'], baloncesto: ['#6b3410', '#58290c'], tenis: ['#123a73', '#0e2e5c'], running: ['#7a1d1d', '#611616'] }[s];
    g.addColorStop(0, base[0]); g.addColorStop(1, base[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (s === 'futbol') for (var i = 0; i < 10; i += 2) { ctx.fillStyle = 'rgba(255,255,255,.035)'; ctx.fillRect(X(i * 10), 0, XW(10), H); }
    ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    var R = function (x, y, w, h) { ctx.strokeRect(X(x), Y(y), XW(w), Y(h)); };
    if (s === 'futbol') { R(3, 4, 94, 92); ctx.beginPath(); ctx.moveTo(X(50), Y(4)); ctx.lineTo(X(50), Y(96)); ctx.stroke(); ctx.beginPath(); ctx.ellipse(X(50), Y(50), XW(9), Y(16), 0, 0, 7); ctx.stroke(); R(3, 22, 16, 56); R(81, 22, 16, 56); R(3, 38, 6, 24); R(91, 38, 6, 24); }
    else if (s === 'baloncesto') { R(3, 4, 94, 92); R(60, 33, 37, 34); ctx.beginPath(); ctx.ellipse(X(60), Y(50), XW(14), Y(18), 0, -1.5708, 1.5708); ctx.stroke(); ctx.beginPath(); ctx.arc(X(94), Y(50), Math.min(XW(3), Y(5)), 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(X(97), Y(4)); ctx.lineTo(X(70), Y(4)); ctx.stroke(); ctx.beginPath(); ctx.ellipse(X(97), Y(50), XW(34), Y(40), 0, Math.PI / 2, 3 * Math.PI / 2); ctx.stroke(); }
    else if (s === 'tenis') { R(5, 8, 90, 84); R(5, 20, 90, 60); ctx.beginPath(); ctx.moveTo(X(50), Y(4)); ctx.lineTo(X(50), Y(96)); ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.moveTo(X(26), Y(20)); ctx.lineTo(X(26), Y(80)); ctx.moveTo(X(74), Y(20)); ctx.lineTo(X(74), Y(80)); ctx.moveTo(X(26), Y(50)); ctx.lineTo(X(74), Y(50)); ctx.stroke(); }
    else { for (var l = 0; l < 6; l++) { ctx.beginPath(); ctx.moveTo(0, Y(26 + l * 9)); ctx.lineTo(W, Y(26 + l * 9)); ctx.stroke(); } ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(X(80), Y(26), 3, Y(45)); }
    var v = ctx.createRadialGradient(W / 2, H / 2, H * .2, W / 2, H / 2, W * .7); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,.04)'; ctx.lineWidth = 1; for (var y = 0; y < H; y += 4) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }
  function pos(a, k) { var e = k * k * (3 - 2 * k); return [a[2] + (a[4] - a[2]) * e, a[3] + (a[5] - a[3]) * e]; }
  function act(id) { return S.play.a.filter(function (a) { return a[0] === id; })[0]; }
  function frozen(a) { return [a[4], a[5]]; }
  function ptOf(to) { return typeof to === 'string' ? frozen(act(to)) : to; }

  function frame(now) {
    raf = requestAnimationFrame(frame); var dt = Math.min(.05, (now - (lastT || now)) / 1000); lastT = now; if (!S) return;
    court(); var p = S.play, k = S.phase === 'run' ? Math.min(1, S.t / 2.4) : 1, i;
    if (S.phase === 'run') { S.t += dt; if (S.t >= 2.4) freeze(); }
    var rad = Math.max(11, Math.min(W * .035, H * .06));
    var ball;
    p.a.forEach(function (a) { var q = pos(a, k), ex = S.rev && S.rev.stop === a[0]; if (ex) { var tgt = S.rev.stopAt, m = Math.min(1, S.rev.t * 1.4); q = [q[0] + (tgt[0] - q[0]) * m, q[1] + (tgt[1] - q[1]) * m]; } a.cur = q; });
    /* flechas de opciones al congelarse */
    if (S.phase === 'pick') { var from = act(p.ball).cur; S.opts.forEach(function (o, ix) { var to = ptOf(o.to), hov = S.hover === ix; ctx.setLineDash([8, 7]); ctx.strokeStyle = hov ? col : 'rgba(255,255,255,.4)'; ctx.lineWidth = hov ? 3.5 : 2; ctx.beginPath(); ctx.moveTo(X(from[0]), Y(from[1])); ctx.lineTo(X(to[0]), Y(to[1])); ctx.stroke(); ctx.setLineDash([]); var lx = X((from[0] + to[0]) / 2), ly = Y((from[1] + to[1]) / 2); ctx.fillStyle = hov ? col : 'rgba(5,8,12,.85)'; ctx.beginPath(); ctx.arc(lx, ly, Math.max(10, rad * .75), 0, 7); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = hov ? '#04110a' : '#fff'; ctx.font = '800 ' + Math.max(10, Math.round(rad * .7)) + 'px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ABC'[ix], lx, ly + 1); }); }
    /* revelado: pase */
    if (S.phase === 'rev') {
      var o = S.rev.o, f = act(p.ball).cur, to = S.rev.end; S.rev.t = Math.min(1, S.rev.t + dt / .95); var tt = S.rev.t, bx = f[0] + (to[0] - f[0]) * tt, by = f[1] + (to[1] - f[1]) * tt;
      ctx.strokeStyle = o.ok ? '#22c55e' : '#fb7185'; ctx.lineWidth = 4; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 14; ctx.beginPath(); ctx.moveTo(X(f[0]), Y(f[1])); ctx.lineTo(X(bx), Y(by)); ctx.stroke(); ctx.shadowBlur = 0; ball = [bx, by];
      if (tt >= 1 && !S.rev.done) { S.rev.done = true; showWhy(); }
      if (tt >= 1 && !o.ok) { ctx.strokeStyle = '#fb7185'; ctx.lineWidth = 5; var ex = X(to[0]), ey = Y(to[1]); ctx.beginPath(); ctx.moveTo(ex - 10, ey - 10); ctx.lineTo(ex + 10, ey + 10); ctx.moveTo(ex + 10, ey - 10); ctx.lineTo(ex - 10, ey + 10); ctx.stroke(); }
      if (tt >= 1 && o.ok) { ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(X(to[0]), Y(to[1]), rad * 2 + 4 * Math.sin(now / 160), 0, 7); ctx.stroke(); }
    }
    p.a.forEach(function (a) {
      var q = a.cur, isA = a[1] === 'a', isC = a[0] === p.ball, x = X(q[0]), y = Y(q[1]);
      if (isC && S.phase === 'pick') { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, rad * 2 + 3 * Math.sin(now / 200), 0, 7); ctx.stroke(); }
      ctx.shadowColor = isA ? col : '#fb7185'; ctx.shadowBlur = 16; ctx.fillStyle = isA ? col : '#fb7185'; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = isA ? '#04110a' : '#1a0408'; ctx.font = '800 ' + Math.round(rad * .95) + 'px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(a[0], x, y + 1);
    });
    var c = act(p.ball).cur; if (!ball) ball = S.phase === 'run' ? [c[0] + 2.2, c[1] + 2.2] : [c[0] + 2.2, c[1] + 2.2];
    ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(X(ball[0]) + (S.phase === 'rev' ? 0 : 0), Y(ball[1]), rad * .45, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  }

  function newRound() { var arr = KG.shuffle(PL[KG.sport], Math.random).slice(0, 3); S = { plays: arr, i: 0, score: 0, ok: 0, fast: 0 }; load(); }
  function load() {
    var p = S.plays[S.i]; S.play = p; S.phase = 'run'; S.t = 0; S.rev = null; S.hover = -1;
    p.a.forEach(function (a) { a.cur = [a[2], a[3]]; });
    S.opts = KG.shuffle(p.o, Math.random);
    KG.$('#jg-nm').textContent = 'JUGADA ' + (S.i + 1) + '/3 · ' + p.n.toUpperCase();
    KG.$('#jg-cap').innerHTML = 'Mira la jugada…'; KG.$('#jg-cap').className = 'jg-cap on';
    KG.$('#jg-side').innerHTML = '<div class="jg-wait"><small class="kg-mono">Sala de vídeo · ' + KG.sports[KG.sport].n + '</small><h2>Observa la <em>jugada</em></h2><p>El vídeo se congelará en el momento clave. Fíjate en dónde están los defensores y los espacios libres.</p><div class="jg-dots">' + [0, 1, 2].map(function (k) { return '<i class="' + (k < S.i ? 'd' : k === S.i ? 'c' : '') + '"></i>'; }).join('') + '</div></div>';
  }
  function freeze() {
    S.phase = 'pick'; S.tf = performance.now(); KG.sfx.tick(); var cap = KG.$('#jg-cap'); cap.innerHTML = '<b>¡Congelado!</b> ¿Qué haces con el balón?'; cap.className = 'jg-cap on freeze';
    var side = KG.$('#jg-side'); side.innerHTML = '<div class="jg-ch"><small class="kg-mono">Tú decides · jugada ' + (S.i + 1) + '/3</small><h2>' + KG.esc(S.play.n) + '</h2><div class="jg-opts">' + S.opts.map(function (o, i) { return '<button type="button" class="jg-o" data-i="' + i + '"><i>' + 'ABC'[i] + '</i><span>' + KG.esc(o.t) + '</span></button>'; }).join('') + '</div></div>';
    KG.$$('.jg-o').forEach(function (b) { var i = +b.dataset.i; b.addEventListener('mouseenter', function () { S.hover = i; }); b.addEventListener('mouseleave', function () { S.hover = -1; }); b.addEventListener('click', function () { choose(i); }); });
  }
  function choose(i) {
    if (S.phase !== 'pick') return; var o = S.opts[i], secs = (performance.now() - S.tf) / 1000, to = ptOf(o.to), from = act(S.play.ball).cur, end = to, stopAt = null;
    if (!o.ok && o.stop) { var sa = act(o.stop); stopAt = [from[0] + (to[0] - from[0]) * .6, from[1] + (to[1] - from[1]) * .6]; end = stopAt; }
    S.phase = 'rev'; S.rev = { o: o, t: 0, end: end, stop: o.ok ? null : o.stop, stopAt: stopAt, i: i, secs: secs };
    if (o.ok) { S.ok++; var pts = 100 + (secs < 5 ? 50 : 0); if (secs < 5) S.fast++; S.score += pts; KG.sfx.ok(); } else { KG.sfx.bad(); }
    var cap = KG.$('#jg-cap'); cap.className = 'jg-cap on ' + (o.ok ? 'good' : 'bad'); cap.innerHTML = o.ok ? '<b>¡Buena decisión!</b>' : '<b>Decisión arriesgada</b>';
    KG.$$('.jg-o').forEach(function (b, k) { b.disabled = true; b.classList.toggle('pick', k === i); b.classList.toggle('ok', S.opts[k].ok === 1 || S.opts[k].ok === true); if (k === i && !o.ok) b.classList.add('bad'); });
  }
  function showWhy() {
    var o = S.rev.o, last = S.i + 1 >= 3, side = KG.$('#jg-side'), wrap = KG.$('.jg-ch');
    var good = S.opts.filter(function (x) { return x.ok; })[0];
    var box = KG.el('div', 'jg-why ' + (o.ok ? 'good' : 'bad'), '<b>' + (o.ok ? '✔ Correcto' : '✘ No era la mejor') + (S.rev.secs < 5 && o.ok ? ' · +50 por decidir rápido' : '') + '</b><p>' + KG.esc(o.why) + '</p>' + (!o.ok ? '<p class="g"><b>Mejor opción:</b> ' + KG.esc(good.t) + '. ' + KG.esc(good.why) + '</p>' : '') + '<button class="kg-btn pri" id="jg-next" type="button">' + (last ? 'Ver resultado' : 'Siguiente jugada') + '</button>');
    wrap.appendChild(box); KG.$('#jg-next').onclick = function () { if (last) end(); else { S.i++; load(); } };
  }
  function end() {
    var key = 'jugada_' + KG.sport, best = KG.get(key, 0), sc = S.score, rec = sc > best; if (rec) KG.set(key, sc);
    var t = S.ok === 3 ? 'Entrenador estratega' : S.ok === 2 ? 'Buen lector de juego' : S.ok === 1 ? 'Aprendiendo a leer el juego' : 'Toca repasar vídeos';
    KG.sheet({ game: 'adivina-la-jugada', kicker: 'Sala de vídeo · ' + KG.sports[KG.sport].n, big: sc, title: t, bigSize: 170, lines: [S.ok + ' de 3 decisiones correctas', S.fast ? S.fast + ' decididas en menos de 5 s' : 'Intenta decidir en menos de 5 s para sumar bonus', rec ? '🏆 ¡Nuevo récord!' : 'Tu récord: ' + best],
      tip: '<b>Idea clave:</b> la mejor decisión casi siempre sale de mirar primero dónde está el espacio libre y quién te lo puede dar.',
      shareText: 'Saqué ' + sc + ' puntos en Adivina la jugada (' + KG.sports[KG.sport].n + '): «' + t + '». ¿Lees mejor el juego?', shareUrl: location.origin + '/juegos/adivina-la-jugada.html?d=' + KG.sport,
      again: newRound, win: S.ok >= 2, ctaTitle: 'Analiza tu propio juego', ctaText: 'Sube un vídeo y KINET te ayuda a entender tus decisiones.' });
  }
  KG.$('#kg-stage'); mount(); rgb(); raf = requestAnimationFrame(frame); newRound();
  KG.onSport(function () { rgb(); newRound(); });
})();
