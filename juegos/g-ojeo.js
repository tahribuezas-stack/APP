/* KINET OS · Juego 1 · Ojeador de fichas (escáner de fichas). Sin registro. */
(function () {
  'use strict';
  var T = 20, ROUNDS = 3, FLAWS = [3, 4, 5];
  /* cada módulo: [etiqueta, texto correcto, texto con fallo, consejo] */
  var SP = {
    futbol: { pos: ['Extremo derecho · pie derecho', 'Portero, delantero, central y mediapunta (polivalente)'], stat: ['24/25 · Juvenil A · 27 PJ · 9 goles · 6 asistencias', 'Muchos goles y asistencias esta temporada'], bio: ['Extremo veloz, bueno en el 1 contra 1 y con llegada. Busco un club con proyecto de cantera.', 'Soy el mejor, lo doy todo, un crack total. Ficha por mí ya.'], phys: ['1,76 m · 66 kg · 30 m en 4,3 s · salto 38 cm', 'Altura 2,31 m · Peso 41 kg · «muy rápido»'] },
    baloncesto: { pos: ['Escolta · diestro', 'Base, alero, ala-pívot y pívot (hago de todo)'], stat: ['24/25 · Cadete · 18 PJ · 14,2 pts · 6,1 reb · 3,4 ast', 'Máximo anotador de mi liga, muy bueno'], bio: ['Escolta de buen tiro exterior y defensa activa. Busco un equipo que trabaje la formación.', 'Nadie me para, soy un crack del baloncesto. Contratadme.'], phys: ['1,88 m · 74 kg · salto vertical 62 cm', 'Altura 2,31 m · Peso 41 kg · «salto de locos»'] },
    tenis: { pos: ['Jugador de fondo · diestro, revés a dos manos', 'Fondo, red, saque-volea y defensa: todo a la vez'], stat: ['Ranking regional sub-16: n.º 12 · 18 victorias y 6 derrotas en 24/25', 'Ganador de muchísimos torneos importantes'], bio: ['Jugador de fondo regular, buen resto y mentalidad competitiva. Busco academia con calendario.', 'El mejor jugador de mi zona, imbatible. Hablad conmigo.'], phys: ['1,82 m · 70 kg · test de saque 168 km/h', 'Altura 2,31 m · Peso 41 kg · «saque brutal»'] },
    running: { pos: ['Mediofondista 400 / 800 m', 'Corredor de 100 m, 5K, maratón y obstáculos'], stat: ['400 m: 53,8 s (pista, 03/2025) · 800 m: 2:04,1 (05/2025)', 'Muy rápido, la mejor marca de mi club'], bio: ['Mediofondista con buen final. Busco un grupo de entrenamiento con seguimiento técnico.', 'Soy una máquina, nadie corre como yo. Entrenadme.'], phys: ['1,74 m · 60 kg · FC reposo 48 · test Cooper 3.100 m', 'Altura 2,31 m · Peso 41 kg · «vuelo»'] }
  };
  var COMMON = {
    foto: ['Foto', 'Foto de cuerpo entero con la equipación del club y fondo limpio', 'Selfie en el espejo, borrosa, con gafas de sol y un filtro', 'La foto es lo primero que ve un ojeador: cuerpo entero, equipación y buena luz.'],
    vid: ['Vídeo', 'Vídeo de 90 s con tus mejores acciones y el minuto de cada una', 'Vídeo de 14 minutos sin cortar, sin saber quién eres en la imagen', 'Entre 60 y 120 s: empieza por tu mejor acción y señala quién eres.'],
    con: ['Contacto', 'mateo.aldaz@correo.es · Tutor: 600 123 456', 'pichichi_2009_xx@hotmail.com', 'Un contacto serio y, si eres menor, el de tu tutor legal.'],
    tray: ['Trayectoria', 'CD Albatros (2019–25) · Selección provincial sub-15 (2024)', 'Campeón de todo con equipos muy importantes', 'Concreta club, años y competición. Los adjetivos no se pueden comprobar.']
  };
  var KEYS = ['foto', 'pos', 'phys', 'stat', 'tray', 'vid', 'con', 'bio'];
  var LABEL = { pos: 'Posición', phys: 'Físico', stat: 'Estadísticas', bio: 'Biografía' };
  var TIPS = { pos: 'Una posición principal y, como mucho, una secundaria. Quien juega en todo no destaca en nada.', phys: 'Datos creíbles y medibles. Si algo es imposible, el ojeador desconfía de toda la ficha.', stat: 'Estadísticas siempre con temporada, equipo y competición. Sin contexto, no valen.', bio: 'Dos líneas con hechos: quién eres como jugador y qué buscas. Sin autobombo.' };
  var stage = KG.$('#kg-stage'), R, raf = 0;

  function ficha(rnd, nFlaws) {
    var sp = SP[KG.sport], p = KG.person(rnd), age = 14 + Math.floor(rnd() * 5);
    var bad = KG.shuffle(KEYS, rnd).slice(0, nFlaws), m = {};
    KEYS.forEach(function (k) {
      var isBad = bad.indexOf(k) >= 0, t, tip, lab;
      if (COMMON[k]) { lab = COMMON[k][0]; t = COMMON[k][isBad ? 2 : 1]; tip = COMMON[k][3]; if (k === 'con') t = t.replace('mateo.aldaz', (p.first + '.' + p.last).toLowerCase().replace(/[áéíóú]/g, function (c) { return 'aeiou'['áéíóú'.indexOf(c)]; })); }
      else { lab = LABEL[k]; t = sp[k][isBad ? 1 : 0]; tip = TIPS[k]; }
      m[k] = { k: k, lab: lab, t: t, bad: isBad, tip: tip };
    });
    return { name: p.full, age: age, id: 'KN-' + (1000 + Math.floor(rnd() * 8999)), m: m, nBad: nFlaws };
  }

  function intro() {
    var best = KG.get('ojeo_' + KG.sport, 0);
    stage.innerHTML = '<div class="oj oj-intro"><div class="oj-ig"><small class="kg-mono">Modo ojeador · ' + KG.sports[KG.sport].n + '</small><h2>Tienes <em>20 segundos</em><br>por ficha.</h2><p>Un ojeador lee decenas de fichas al día. Detecta los datos que le harían descartar a un jugador antes de que termine la cuenta atrás.</p>' +
      '<div class="tr-meta"><span><b>3</b>fichas</span><span><b>20 s</b>cada una</span><span><b>' + (best || '—') + '</b>tu récord</span></div><button class="kg-btn pri" id="oj-go" type="button">Empezar a ojear</button></div>' +
      '<div class="oj-demo" aria-hidden="true"><div class="oj-scanbox"><i></i><b></b><span>ESCANEANDO FICHA…</span></div></div></div>';
    KG.$('#oj-go').addEventListener('click', function () { R = { i: 0, score: 0, hit: 0, tot: 0, fp: 0, missTips: {} }; round(); });
  }

  function round() {
    var seed = KG.hash(KG.sport + Date.now() + R.i), f = ficha(KG.rng(seed), FLAWS[R.i]); R.f = f; R.flag = {}; R.state = 'ready';
    var mods = KEYS.map(function (k) { var o = f.m[k]; return '<button class="oj-m" type="button" data-k="' + k + '" style="grid-area:' + k + '"><small>' + o.lab + '</small>' + (k === 'foto' ? '<span class="oj-ph"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="22" r="10"/><path d="M12 56c2-12 10-18 20-18s18 6 20 18"/></svg></span>' : '') + '<span class="oj-t">' + KG.esc(o.t) + '</span><em class="oj-fl">⚑</em><i class="oj-res"></i></button>'; }).join('');
    stage.innerHTML = '<div class="oj"><div class="oj-hud"><div><small class="kg-mono">Ficha ' + (R.i + 1) + '/' + ROUNDS + ' · ' + f.id + '</small><b class="oj-nm">' + KG.esc(f.name) + ' <span>· ' + f.age + ' años</span></b></div>' +
      '<div class="oj-fi"><span class="kg-mono">Marcados</span><b id="oj-cnt">0</b></div>' +
      '<div class="oj-ring"><svg viewBox="0 0 60 60"><circle class="bg" cx="30" cy="30" r="26"/><circle class="fg" id="oj-fg" cx="30" cy="30" r="26"/></svg><b id="oj-sec">' + T + '</b></div></div>' +
      '<div class="oj-dos" id="oj-dos">' + mods + '<div class="oj-laser"></div><div class="oj-cv c1"></div><div class="oj-cv c2"></div><div class="oj-cv c3"></div><div class="oj-cv c4"></div>' +
      '<div class="oj-cover" id="oj-cover"><div><small class="kg-mono">Ficha lista</small><h2>Ficha ' + (R.i + 1) + ' de ' + ROUNDS + '</h2><p>Hay ' + f.nBad + ' fallos. Toca lo que un ojeador descartaría. Ojo: cada falsa alarma resta puntos.</p><button class="kg-btn pri" id="oj-start" type="button">Mostrar ficha · ' + T + ' s</button></div></div></div>' +
      '<div class="oj-bt"><span class="oj-msg" id="oj-msg">Toca los datos sospechosos para marcarlos.</span><button class="kg-btn" id="oj-end" type="button" disabled>Enviar informe</button></div></div>';
    KG.$('#oj-start').addEventListener('click', go);
    KG.$$('.oj-m').forEach(function (b) { b.addEventListener('click', function () { if (R.state !== 'play') return; var k = b.dataset.k; R.flag[k] = !R.flag[k]; b.classList.toggle('flag', R.flag[k]); KG.beep(R.flag[k] ? 740 : 520, .05, 'triangle', .05); KG.$('#oj-cnt').textContent = Object.keys(R.flag).filter(function (x) { return R.flag[x]; }).length; }); });
    KG.$('#oj-end').addEventListener('click', function () { finishRound(true); });
  }

  function go() {
    R.state = 'play'; KG.$('#oj-cover').classList.add('off'); KG.$('#oj-dos').classList.add('scan'); KG.$('#oj-end').disabled = false; KG.sfx.tick();
    R.t0 = performance.now(); var fg = KG.$('#oj-fg'), sec = KG.$('#oj-sec'), C = 2 * Math.PI * 26; fg.style.strokeDasharray = C;
    (function tick() {
      var left = T - (performance.now() - R.t0) / 1000; if (R.state !== 'play') return;
      fg.style.strokeDashoffset = C * (1 - Math.max(0, left) / T); sec.textContent = Math.max(0, Math.ceil(left)); KG.$('.oj-ring').classList.toggle('lo', left < 4.2);
      if (left <= 0) return finishRound(false);
      raf = requestAnimationFrame(tick);
    })();
  }

  function finishRound(early) {
    if (R.state !== 'play') return; R.state = 'done'; cancelAnimationFrame(raf);
    var left = Math.max(0, T - (performance.now() - R.t0) / 1000), hit = 0, fp = 0, miss = [], f = R.f;
    KEYS.forEach(function (k) {
      var b = KG.$('.oj-m[data-k="' + k + '"]'), o = f.m[k], fl = !!R.flag[k], res = KG.$('.oj-res', b);
      if (o.bad && fl) { hit++; b.classList.add('hit'); res.textContent = '✔ Fallo detectado'; }
      else if (o.bad && !fl) { miss.push(o); b.classList.add('miss'); res.textContent = '✘ Se te escapó'; }
      else if (!o.bad && fl) { fp++; b.classList.add('fp'); res.textContent = '≈ Estaba bien'; }
      else b.classList.add('okm');
    });
    var pts = hit * 120 - fp * 100 + (early && hit === f.nBad && !fp ? Math.round(left * 10) : 0); pts = Math.max(0, pts);
    var nFl = hit + fp, spam = nFl >= f.nBad + 3;
    R.score += pts; R.hit += hit; R.tot += f.nBad; R.fp += fp; miss.forEach(function (o) { R.missTips[o.tip] = 1; });
    KG.$('#oj-dos').classList.remove('scan'); KG.$('#oj-dos').classList.add('done');
    if (hit === f.nBad && !fp) { KG.sfx.ok(); var r = KG.$('#oj-dos').getBoundingClientRect(); KG.burst(r.left + r.width / 2, r.top + r.height / 2, 'var(--kc)', 24); } else KG.sfx.bad();
    var msg = KG.$('#oj-msg'); msg.innerHTML = '<b>' + hit + '/' + f.nBad + '</b> fallos detectados' + (fp ? ' · ' + fp + ' falsa' + (fp > 1 ? 's' : '') + ' alarma' + (fp > 1 ? 's' : '') : '') + ' · <b>+' + pts + '</b>' + (spam ? '<br><i>Marcarlo casi todo no es ojear: cada falsa alarma resta 100 puntos.</i>' : miss.length ? '<br><i>' + KG.esc(miss[0].tip) + '</i>' : '');
    var end = KG.$('#oj-end'); end.disabled = false; end.textContent = R.i + 1 >= ROUNDS ? 'Ver informe final' : 'Siguiente ficha'; end.classList.add('pri');
    end.replaceWith(end.cloneNode(true)); KG.$('#oj-end').addEventListener('click', function () { R.i++; if (R.i >= ROUNDS) final(); else round(); });
  }

  function final() {
    var key = 'ojeo_' + KG.sport, best = KG.get(key, 0), rec = R.score > best; if (rec) KG.set(key, R.score);
    var pct = Math.round(Math.max(0, R.hit - R.fp * 0.85) / R.tot * 100), t = pct >= 92 ? 'Director deportivo' : pct >= 75 ? 'Ojeador senior' : pct >= 50 ? 'Ojeador' : pct >= 25 ? 'Ojeador junior' : 'Aún sin ojo clínico';
    var tips = Object.keys(R.missTips).slice(0, 2);
    KG.sheet({
      game: 'ojeador-de-fichas', kicker: 'Informe de ojeo · ' + KG.sports[KG.sport].n, big: R.score, title: t, bigSize: 190,
      lines: [R.hit + ' de ' + R.tot + ' fallos detectados · precisión neta ' + pct + ' %', R.fp ? R.fp + ' falsa' + (R.fp > 1 ? 's' : '') + ' alarma' + (R.fp > 1 ? 's' : '') + ' (restan puntos)' : 'Sin falsas alarmas', rec ? '🏆 ¡Nuevo récord!' : 'Tu récord: ' + best],
      tip: tips.length ? '<b>Para tu ficha real:</b> ' + KG.esc(tips[0]) : '<b>Para tu ficha real:</b> cuida foto, vídeo, contacto y datos con contexto. Así te lee un ojeador.',
      shareText: 'Soy «' + t + '» en el juego Ojeador de fichas de KINET: ' + pct + ' % de precisión. ¿Y tú?', shareUrl: location.origin + '/juegos/ojeador-de-fichas.html?d=' + KG.sport,
      again: function () { R = { i: 0, score: 0, hit: 0, tot: 0, fp: 0, missTips: {} }; round(); }, ctaTitle: 'Crea tu ficha deportiva real', ctaText: 'La ficha PRO de KINET te ayuda a presentar foto, vídeo y datos como le gusta a un ojeador.', win: pct >= 50
    });
  }
  KG.onSport(function () { cancelAnimationFrame(raf); intro(); });
  intro();
})();
