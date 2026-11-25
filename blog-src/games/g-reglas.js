/* KINET OS · Juego 5 · Torre de niveles (quiz de reglas por deporte). Sin registro. */
(function () {
  'use strict';
  var Q = {
    futbol: [
      ['¿Cuántos jugadores tiene cada equipo en el campo, portero incluido?', ['9', '10', '11', '12'], 2, 1, 'Cada equipo juega con 11 en el campo (mínimo 7 para poder empezar o continuar).'],
      ['¿Cuánto dura un partido de fútbol 11 sin prórroga?', ['80 minutos', '90 minutos', '100 minutos', '120 minutos'], 1, 1, 'Dos partes de 45 minutos, más el tiempo añadido que decide el árbitro.'],
      ['El balón sale entero por la línea de banda. ¿Qué se señala?', ['Córner', 'Saque de meta', 'Saque de banda', 'Falta indirecta'], 2, 1, 'Saque de banda para el equipo contrario al último que tocó el balón.'],
      ['¿Con qué se reanuda el juego después de un gol?', ['Saque de centro', 'Saque de meta', 'Balón a tierra', 'Falta directa'], 0, 1, 'El equipo que ha encajado el gol saca desde el centro del campo.'],
      ['¿Desde dónde se lanza un córner?', ['Del punto de penalti', 'Del arco de la esquina', 'Del borde del área', 'De la línea de banda'], 1, 1, 'Se lanza desde el cuarto de círculo de la esquina por la que salió el balón.'],
      ['¿A qué distancia de la línea de gol está el punto de penalti?', ['9 metros', '10 metros', '11 metros', '12 metros'], 2, 2, 'El punto de penalti está a 11 metros de la línea de gol.'],
      ['¿Hay fuera de juego en un saque de banda?', ['Sí, siempre', 'Sí, si es en campo rival', 'No, nunca', 'Solo con VAR'], 2, 2, 'No hay fuera de juego directo en saque de banda, saque de meta ni córner.'],
      ['¿Cuántas amarillas en el mismo partido significan la expulsión?', ['1', '2', '3', '4'], 1, 2, 'La segunda amarilla equivale a una roja y el jugador se va del partido.'],
      ['Un defensa toca el balón con la mano a propósito dentro de su área. ¿Qué se señala?', ['Saque de banda', 'Falta indirecta', 'Penalti', 'Balón a tierra'], 2, 2, 'Mano deliberada dentro del área = penalti (y, según el caso, tarjeta).'],
      ['En un tiro libre, ¿a qué distancia mínima del balón debe colocarse la barrera?', ['5 metros', '7 metros', '9,15 metros', '11 metros'], 2, 3, '9,15 m (10 yardas) de distancia mínima hasta que se golpea el balón.'],
      ['¿Cuándo se castiga a un jugador por fuera de juego?', ['Cuando está en su campo', 'Si está más cerca de la línea de meta rival que el balón y el penúltimo rival, y participa en la jugada', 'Si recibe el balón de un saque de banda', 'Siempre que esté por delante del balón'], 1, 3, 'Debe estar en campo rival, por delante del balón y del penúltimo adversario, y participar en la jugada.'],
      ['Un compañero cede el balón con el pie al portero a propósito. ¿Puede cogerlo con las manos?', ['Sí, siempre', 'No: falta indirecta', 'Solo dentro del área pequeña', 'Sí, si lo avisa'], 1, 3, 'Si la cesión es voluntaria con el pie, el portero no puede cogerla: tiro libre indirecto.'],
      ['¿Qué medidas puede tener el largo de un campo en partidos internacionales?', ['De 90 a 100 m', 'De 100 a 110 m', 'De 110 a 120 m', 'Siempre 105 m'], 1, 3, 'En partidos internacionales el largo es de 100 a 110 m y el ancho de 64 a 75 m.'],
      ['¿Quién decide el tiempo añadido al final de cada parte?', ['El cuarto árbitro', 'El entrenador local', 'El árbitro', 'El delegado del partido'], 2, 2, 'El árbitro calcula las pérdidas de tiempo; el cuarto árbitro solo muestra el cartel.']
    ],
    baloncesto: [
      ['¿Cuántos jugadores de cada equipo hay en pista?', ['4', '5', '6', '7'], 1, 1, 'Cinco por equipo en pista.'],
      ['¿Cuántos puntos vale un tiro libre?', ['1', '2', '3', '4'], 0, 1, 'Cada tiro libre convertido vale 1 punto.'],
      ['¿Cuántos puntos vale un tiro desde detrás de la línea de triple?', ['1', '2', '3', '4'], 2, 1, 'Los tiros desde fuera de la línea de 6,75 m valen 3.'],
      ['¿Cuántos segundos tiene un equipo para lanzar a canasta (reloj de posesión FIBA)?', ['14', '20', '24', '30'], 2, 1, '24 segundos de posesión (14 si hay rebote ofensivo según reglamento FIBA).'],
      ['Si el balón toca la línea lateral, ¿qué pasa?', ['Sigue en juego', 'Está fuera', 'Se repite', 'Salto entre dos'], 1, 1, 'La línea forma parte de fuera: el balón o el jugador que la tocan están fuera.'],
      ['¿Qué es "pasos" (viaje)?', ['Pasar el balón largo', 'Dar más de dos pasos sin botar', 'Botar con las dos manos', 'Salir del campo'], 1, 2, 'Moverse con el balón sin botar más allá de los pasos permitidos.'],
      ['¿Cuántas faltas personales descalifican a un jugador en FIBA?', ['4', '5', '6', '7'], 1, 2, 'Con 5 faltas el jugador queda eliminado del partido (6 en la NBA).'],
      ['¿Cuántos segundos puede estar un atacante en la zona restringida (la "pintura")?', ['2', '3', '4', '5'], 1, 2, 'Más de 3 segundos seguidos en la zona restringida es violación.'],
      ['¿Cuánto dura cada cuarto en competición FIBA?', ['8 minutos', '10 minutos', '12 minutos', '15 minutos'], 1, 2, 'Cuatro cuartos de 10 minutos (la NBA usa 12).'],
      ['¿Qué es un "doble"?', ['Dos puntos seguidos', 'Reanudar el bote con las dos manos o tras parar', 'Marcar a dos jugadores', 'Pedir dos tiempos muertos'], 1, 2, 'Botar con las dos manos a la vez, o volver a botar después de haber parado el bote.'],
      ['¿Cuántos segundos tiene un equipo para pasar del campo propio al contrario?', ['5', '8', '10', '12'], 1, 3, 'Ocho segundos para cruzar la línea central (regla de campo atrás en FIBA).'],
      ['Falta sobre un jugador que lanza un triple y falla. ¿Cuántos tiros libres lanza?', ['1', '2', '3', '4'], 2, 3, 'Tres tiros libres cuando la falta es en acto de tiro de tres puntos fallado.'],
      ['En FIBA, ¿con qué falta de equipo del cuarto empiezan los tiros libres por falta de equipo?', ['Con la 3.ª', 'Con la 4.ª', 'Con la 5.ª', 'Con la 7.ª'], 2, 3, 'Desde la 5.ª falta de equipo en el cuarto, las faltas defensivas se penalizan con tiros libres.'],
      ['¿Qué es una falta técnica?', ['Un contacto fuerte', 'Una infracción de conducta antideportiva sin contacto', 'Una violación de pasos', 'Un fallo del reloj'], 1, 3, 'Sanciona conducta antideportiva (protestas, insultos, etc.) con tiro libre y posesión.']
    ],
    tenis: [
      ['¿Cuál es la secuencia de puntos en un juego de tenis?', ['1, 2, 3, 4', '15, 30, 40', '10, 20, 30', '5, 10, 15'], 1, 1, '15, 30, 40 y juego (con ventaja si se llega a 40 iguales).'],
      ['¿Cómo se llama el 0 en tenis?', ['Cero', 'Love', 'Nada', 'Net'], 1, 1, 'En inglés, "love".'],
      ['¿Cuántos juegos hacen falta, por regla general, para ganar un set?', ['4', '5', '6', '8'], 2, 1, 'Seis juegos con dos de diferencia (o tie-break).'],
      ['Si falla el primer saque, ¿qué ocurre?', ['Se pierde el punto', 'Tiene segundo saque', 'Se repite el punto', 'Saca el rival'], 1, 1, 'Hay un segundo saque; si también falla, es doble falta.'],
      ['¿Cuántos jugadores juegan un partido de dobles?', ['2', '3', '4', '6'], 2, 1, 'Dos parejas, cuatro jugadores en pista.'],
      ['En pádel, ¿cómo se debe sacar?', ['Por encima de la cabeza', 'Por debajo de la cintura tras un bote', 'Sin bote, con volea', 'Contra la pared'], 1, 1, 'El saque se hace tras un bote y golpeando por debajo de la cintura.'],
      ['¿Qué es un "break"?', ['Un descanso', 'Ganar el juego al saque del rival', 'Un punto de partido', 'Un error no forzado'], 1, 2, 'Romper el saque: ganar un juego cuando el rival sirve.'],
      ['¿Qué es una "dejada"?', ['Un golpe potente', 'Un golpe suave que cae cerca de la red', 'Un saque flojo', 'Dejar pasar la bola'], 1, 2, 'Golpe corto y con poca velocidad que muere cerca de la red.'],
      ['En pádel, la bola ya ha botado en tu campo. ¿Puede rebotar en la pared y devolverla?', ['No', 'Sí, es la "bajada de pared"', 'Solo en el saque', 'Solo si es dobles mixtos'], 1, 2, 'Sí: tras botar en tu campo puede tocar la pared y la puedes golpear.'],
      ['¿Qué significa "ventaja"?', ['Empate a 30', 'Un punto más tras llegar a 40 iguales', 'Un juego extra', 'Cambio de lado'], 1, 2, 'Tras 40-40, quien gana el siguiente punto tiene ventaja; si gana otro, gana el juego.'],
      ['¿Cuánto mide una pista de pádel?', ['10 × 5 m', '20 × 10 m', '24 × 12 m', '18 × 9 m'], 1, 3, '20 metros de largo por 10 de ancho.'],
      ['¿Cómo se juega normalmente un tie-break?', ['Al mejor de 3 puntos', 'Hasta 7 puntos con diferencia de 2', 'Hasta 10 sin diferencia', 'Hasta 5 puntos'], 1, 3, 'Se gana con 7 puntos y al menos 2 de diferencia.'],
      ['En muchos circuitos de pádel, ¿qué es el "punto de oro"?', ['El último punto del set', 'El punto decisivo a 40-40, sin ventaja', 'Un punto doble', 'El saque ganador'], 1, 3, 'A 40-40 se juega un único punto decisivo, sin ventaja.'],
      ['¿Qué es un "ace"?', ['Un saque que el rival no toca', 'Una doble falta', 'Una volea', 'Un globo'], 0, 2, 'Saque ganador que el rival no llega a tocar.']
    ],
    running: [
      ['¿Cuántos metros mide una vuelta a una pista de atletismo estándar?', ['200', '300', '400', '500'], 2, 1, 'Una vuelta a la pista son 400 metros.'],
      ['¿Qué distancia tiene un maratón?', ['40 km', '42,195 km', '45 km', '50 km'], 1, 1, '42,195 kilómetros.'],
      ['¿Qué mide la cadencia al correr?', ['Los kilómetros por hora', 'Los pasos por minuto', 'El pulso', 'La altura del salto'], 1, 1, 'Cadencia = pasos por minuto.'],
      ['¿Para qué sirve el calentamiento antes de correr?', ['Para gastar energía', 'Para subir la temperatura y preparar músculos y articulaciones', 'Para correr más lento', 'No sirve para nada'], 1, 1, 'Prepara el cuerpo y reduce el riesgo de molestias.'],
      ['¿Cuántos kilómetros es un 10K?', ['5', '10', '15', '21'], 1, 1, 'Diez kilómetros.'],
      ['¿Qué es un "negative split"?', ['Correr con calambres', 'La segunda mitad más rápida que la primera', 'Un parón en carrera', 'Una cuesta abajo'], 1, 2, 'Terminar más rápido de lo que empezaste.'],
      ['¿Qué es un fartlek?', ['Un tipo de calzado', 'Un juego de ritmos con cambios de intensidad', 'Un test de VO2', 'Una carrera de 5 km'], 1, 2, 'Entrenamiento con cambios de ritmo libres durante una carrera continua.'],
      ['¿Qué zona de frecuencia cardíaca se usa para construir base aeróbica?', ['Zona 1 solo', 'Zona 2', 'Zona 5', 'Todas por igual'], 1, 2, 'La zona 2 es la base: ritmo cómodo, el que permite hablar.'],
      ['La "regla del 10 %" aconseja…', ['Correr el 10 % de la semana', 'No subir más de un 10 % el volumen semanal', 'Descansar un 10 %', 'Beber un 10 % más'], 1, 2, 'Subir la carga de forma gradual reduce el riesgo de lesión.'],
      ['¿Cuánto mide una media maratón?', ['20 km', '21,0975 km', '25 km', '30 km'], 1, 2, '21,0975 km, la mitad de un maratón.'],
      ['¿Qué es una "serie" en el entrenamiento en pista?', ['Una carrera larga', 'Una repetición de una distancia a ritmo fuerte con recuperación', 'Un calentamiento', 'Una carrera por equipos'], 1, 2, 'Por ejemplo, 6 × 400 m con 1 minuto de recuperación.'],
      ['¿Qué es el VO2 máx?', ['La velocidad máxima', 'El máximo oxígeno que el cuerpo puede usar por minuto', 'La frecuencia cardíaca máxima', 'La capacidad pulmonar'], 1, 3, 'Es la cantidad máxima de oxígeno que puedes consumir, indicador de capacidad aeróbica.'],
      ['¿Qué es el umbral de lactato, a grandes rasgos?', ['El ritmo de paseo', 'La intensidad a partir de la cual el lactato se acumula más rápido de lo que se elimina', 'El pulso en reposo', 'El final del calentamiento'], 1, 3, 'Por encima de ese ritmo la fatiga llega mucho más rápido.'],
      ['¿Qué es el "tapering"?', ['Aumentar la carga la semana de carrera', 'Reducir la carga los días previos a una competición', 'Un tipo de estiramiento', 'Un test de campo'], 1, 3, 'Bajar volumen antes de competir para llegar descansado.']
    ]
  };
  var TIERS = ['Cantera', 'Juvenil', 'Amateur', 'Semipro', 'Profesional', 'Élite', 'Leyenda'];
  function tierOf(n) { return n >= 10 ? 6 : n >= 9 ? 5 : n >= 8 ? 4 : n >= 7 ? 3 : n >= 5 ? 2 : n >= 3 ? 1 : 0; }
  var stage = KG.$('#kg-stage'), S = null, timer = 0, QT = 16;

  function pick() {
    var pool = Q[KG.sport], out = [];
    [[1, 4], [2, 3], [3, 3]].forEach(function (d) {
      var p = KG.shuffle(pool.filter(function (q) { return q[3] === d[0]; })).slice(0, d[1]); out = out.concat(p);
    });
    return out.map(function (q) {
      var idx = KG.shuffle([0, 1, 2, 3]);
      return { q: q[0], o: idx.map(function (i) { return q[1][i]; }), a: idx.indexOf(q[2]), d: q[3], w: q[4] };
    });
  }
  function slabs() { var h = ''; for (var i = 0; i < 10; i++) h += '<i class="tw-s" style="--i:' + i + '"><b>' + (i + 1) + '</b></i>'; return h; }
  function intro() {
    var best = KG.get('torre_' + KG.sport, 0);
    stage.innerHTML = '<div class="tr tr-intro"><div class="tr-ig"><small class="kg-mono">Nivel de reglas · ' + KG.sports[KG.sport].n + '</small><h2>Sube la torre.<br><em>Llega a Leyenda.</em></h2>' +
      '<p>10 preguntas, 3 vidas y 16 segundos por respuesta. Cada acierto sube un piso; los pisos altos puntúan más.</p>' +
      '<div class="tr-meta"><span><b>10</b>preguntas</span><span><b>3</b>vidas</span><span><b>' + (best || '—') + '</b>tu récord</span></div>' +
      '<button class="kg-btn pri" id="tr-go" type="button">Empezar</button></div>' +
      '<div class="tr-tw"><div class="tw"><div class="tw-in">' + slabs() + '</div></div></div></div>';
    KG.$('#tr-go').addEventListener('click', start);
    var tw = KG.$('.tw-in', stage); setTimeout(function () { KG.$$('.tw-s', tw).forEach(function (s, i) { setTimeout(function () { s.classList.add('on'); }, i * 70); }); setTimeout(function () { KG.$$('.tw-s', tw).forEach(function (s) { s.classList.remove('on'); }); }, 1500); }, 300);
  }
  function start() {
    S = { qs: pick(), i: 0, ok: 0, lives: 3, pts: 0, streak: 0, lock: false };
    stage.innerHTML = '<div class="tr">' +
      '<div class="tr-term"><div class="tr-hd"><span class="kg-mono" id="tr-n"></span><span class="tr-lv" id="tr-lv"></span><span class="tr-pts"><b id="tr-pts">0</b> pts</span></div>' +
      '<div class="tr-bar"><i id="tr-bar"></i></div><div class="tr-q" id="tr-q"></div><div class="tr-o" id="tr-o"></div><div class="tr-why" id="tr-why"></div></div>' +
      '<div class="tr-tw"><div class="tw"><div class="tw-in" id="tw">' + slabs() + '<u class="tw-tk" id="tw-tk"></u></div></div><div class="tr-tier"><small class="kg-mono">Rango</small><b id="tr-tier">' + TIERS[0] + '</b></div></div></div>';
    ask();
  }
  function hearts() { var h = ''; for (var i = 0; i < 3; i++) h += '<svg class="' + (i < S.lives ? 'on' : '') + '" viewBox="0 0 24 24"><path d="M12 21s-8-5.4-8-11a4.6 4.6 0 018-3 4.6 4.6 0 018 3c0 5.6-8 11-8 11z"/></svg>'; return h; }
  function paintTower() {
    var tw = KG.$('#tw'); KG.$$('.tw-s', tw).forEach(function (s, i) { s.classList.toggle('on', i < S.ok); s.classList.toggle('cur', i === S.ok); });
    KG.$('#tw-tk').style.setProperty('--i', S.ok);
    KG.$('#tr-tier').textContent = TIERS[tierOf(S.ok)];
  }
  function ask() {
    var q = S.qs[S.i]; S.lock = false; S.t0 = performance.now();
    KG.$('#tr-n').textContent = 'Pregunta ' + (S.i + 1) + '/10 · ' + ['', 'Calentamiento', 'Titular', 'Élite'][q.d];
    KG.$('#tr-lv').innerHTML = hearts(); KG.$('#tr-pts').textContent = S.pts;
    KG.$('#tr-q').textContent = q.q; KG.$('#tr-why').textContent = ''; KG.$('#tr-why').className = 'tr-why';
    var o = KG.$('#tr-o'); o.innerHTML = '';
    q.o.forEach(function (t, i) {
      var b = KG.el('button', 'tr-k', '<i>' + 'ABCD'[i] + '</i><span>' + KG.esc(t) + '</span>'); b.type = 'button'; b.style.setProperty('--d', i * 60 + 'ms');
      b.addEventListener('click', function () { answer(i, b); }); o.appendChild(b);
    });
    paintTower(); cancelAnimationFrame(timer);
    (function tick(now) {
      var k = 1 - (performance.now() - S.t0) / (QT * 1000), bar = KG.$('#tr-bar'); if (!bar) return;
      bar.style.transform = 'scaleX(' + Math.max(0, k) + ')'; bar.classList.toggle('lo', k < .3);
      if (k <= 0) { if (!S.lock) answer(-1); return; }
      timer = requestAnimationFrame(tick);
    })();
  }
  function answer(i, btn) {
    if (S.lock) return; S.lock = true; cancelAnimationFrame(timer);
    var q = S.qs[S.i], ok = i === q.a, why = KG.$('#tr-why'), keys = KG.$$('.tr-k');
    keys.forEach(function (k, n) { k.disabled = true; if (n === q.a) k.classList.add('ok'); else if (n === i) k.classList.add('bad'); });
    var r = btn ? btn.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    if (ok) {
      var left = Math.max(0, 1 - (performance.now() - S.t0) / (QT * 1000));
      S.streak++; S.ok++; var gain = Math.round((100 * q.d + left * 60) * (S.streak >= 3 ? 2 : 1)); S.pts += gain;
      why.textContent = '✔ ' + q.w + (S.streak >= 3 ? '  ·  Racha ×2' : '') + '  (+' + gain + ')'; why.className = 'tr-why ok'; KG.sfx.ok(); KG.burst(r.left + r.width / 2, r.top + r.height / 2, 'var(--kc)', 16);
      KG.$('.tw', stage).classList.add('up'); setTimeout(function () { KG.$('.tw', stage).classList.remove('up'); }, 600);
    } else {
      S.streak = 0; S.lives--; why.textContent = (i < 0 ? '⏱ Se acabó el tiempo. ' : '✘ ') + q.w; why.className = 'tr-why bad'; KG.sfx.bad();
      var st = KG.$('.tr', stage); st.classList.add('shake'); setTimeout(function () { st.classList.remove('shake'); }, 450);
    }
    paintTower(); KG.$('#tr-lv').innerHTML = hearts(); KG.$('#tr-pts').textContent = S.pts;
    setTimeout(function () { S.i++; if (S.lives <= 0 || S.i >= S.qs.length) finish(); else ask(); }, ok ? 1500 : 2300);
  }
  function finish() {
    var n = S.ok, t = tierOf(n), key = 'torre_' + KG.sport, best = KG.get(key, 0), rec = S.pts > best; if (rec) KG.set(key, S.pts);
    KG.$('#tr-tier').textContent = TIERS[t];
    KG.sheet({
      game: 'torre-de-niveles', kicker: 'Rango alcanzado · ' + KG.sports[KG.sport].n, big: S.pts, title: TIERS[t], bigSize: 190,
      lines: [n + ' de 10 aciertos', S.lives > 0 ? 'Torre completada con ' + S.lives + ' vida' + (S.lives > 1 ? 's' : '') : 'Eliminado en el piso ' + (S.ok + 1), rec ? '🏆 ¡Nuevo récord!' : 'Tu récord: ' + best + ' pts'],
      tip: 'En KINET, tu cuerpo técnico de IA te explica las reglas y la táctica de tu deporte y adapta el entrenamiento a tu posición.',
      shareText: 'Llegué a ' + TIERS[t] + ' con ' + S.pts + ' puntos en la Torre de niveles de ' + KG.sports[KG.sport].n + '. ¿Me superas?', shareUrl: location.origin + '/juegos/torre-de-niveles.html?d=' + KG.sport,
      again: function () { start(); }, ctaTitle: 'Conoce a tu cuerpo técnico de IA', win: t >= 2
    });
  }
  KG.onSport(function () { cancelAnimationFrame(timer); intro(); });
  intro();
})();
