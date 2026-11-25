/* KINET OS · Torre de niveles · 7 niveles con rangos (Bronce → Experto). Sin registro.
   Las preguntas están en g-torre-data.js (window.KGQ). */
(function () {
  'use strict';
  var Q = window.KGQ || {};
  var RANKS = [
    { n: 'Bronce', c: '#cd7f32', r: '205,127,50' },
    { n: 'Plata', c: '#c9d2de', r: '201,210,222' },
    { n: 'Oro', c: '#fbbf24', r: '251,191,36' },
    { n: 'Platino', c: '#2dd4bf', r: '45,212,191' },
    { n: 'Diamante', c: '#60a5fa', r: '96,165,250' },
    { n: 'Leyenda', c: '#c084fc', r: '192,132,252' },
    { n: 'Experto', c: '#fb7185', r: '251,113,133' }
  ];
  /* miss = fallos permitidos · t = segundos por pregunta */
  var LV = [
    { name: 'Lo básico', miss: 2, t: 20 }, { name: 'Cultura general', miss: 2, t: 20 }, { name: 'Titular', miss: 2, t: 18 },
    { name: 'Táctico', miss: 1, t: 18 }, { name: 'Veterano', miss: 1, t: 16 }, { name: 'Élite', miss: 1, t: 16 }, { name: 'Modo experto', miss: 1, t: 15 }
  ];
  var PER = 5;
  var COACH = { futbol: 'Guardiola', baloncesto: 'Phil Jackson', tenis: 'Toni Nadal', running: 'Renato Canova' };
  var SPN = { futbol: 'fútbol', baloncesto: 'baloncesto', tenis: 'tenis y pádel', running: 'running' };
  function msg(i) {
    var sp = SPN[KG.sport] || 'deporte', co = COACH[KG.sport] || 'los grandes entrenadores';
    return [
      'Has superado la cantera: lo básico de ' + sp + ' lo tienes claro.',
      'Cultura de ' + sp + ' nivel plata: ya sabes de lo que se habla en el vestuario.',
      'Oro: reglas y cultura sólidas. Ya no eres un aficionado cualquiera.',
      'Platino: lees el juego como un entrenador de base.',
      'Diamante: te acercas a la gestión de ' + co + '.',
      'Leyenda: conoces historias que casi nadie recuerda. Banquillo de primera.',
      'Experto: el nivel casi imposible. Eres una enciclopedia de ' + sp + '.'
    ][i];
  }
  var stage = KG.$('#kg-stage'), S = null, timer = 0, nextT = 0;

  function pick(l) {
    var pool = (Q[KG.sport] || [])[l] || [];
    return KG.shuffle(pool.slice()).slice(0, PER).map(function (q) {
      var idx = KG.shuffle([0, 1, 2, 3]);
      return { q: q[0], o: idx.map(function (i) { return q[1 + i]; }), a: idx.indexOf(0), w: q[5] };
    });
  }
  function slabs() {
    var h = '';
    for (var i = 0; i < 7; i++) h += '<i class="tw-s" style="--i:' + i + ';--sc:' + RANKS[i].c + ';--scr:' + RANKS[i].r + '"><b>' + RANKS[i].n + '</b></i>';
    return h;
  }
  function ladder() {
    return '<ol class="tr-lad">' + RANKS.map(function (r, i) {
      return '<li style="--sc:' + r.c + ';--scr:' + r.r + '"><b>' + (i + 1) + '</b>' + r.n + '</li>';
    }).join('') + '</ol>';
  }
  function bestRank() { return KG.get('torre_rank_' + KG.sport, -1); }

  function intro() {
    clearTimeout(nextT); cancelAnimationFrame(timer); S = null;
    var best = KG.get('torre_' + KG.sport, 0), br = bestRank();
    stage.innerHTML = '<div class="tr tr-intro"><div class="tr-ig"><small class="kg-mono">Nivel de ' + KG.sports[KG.sport].n + ' · 7 rangos</small><h2>Sube la torre.<br><em>Llega a Experto.</em></h2>' +
      '<p>Siete niveles con cinco preguntas cada uno. Empiezas con lo más fácil y la dificultad sube: cultura, táctica, historia… Supera cada nivel para ganar su rango, de Bronce a Experto.</p>' + ladder() +
      '<div class="tr-meta"><span><b>7</b>niveles</span><span><b>' + (br >= 0 ? RANKS[br].n : '—') + '</b>tu mejor rango</span><span><b>' + (best || '—') + '</b>récord</span></div>' +
      '<button class="kg-btn pri" id="tr-go" type="button">Empezar por Bronce</button></div>' +
      '<div class="tr-tw"><div class="tw"><div class="tw-in">' + slabs() + '</div></div></div></div>';
    KG.$('#tr-go').addEventListener('click', function () { S = { lvl: 0, pts: 0, rank: -1, streak: 0, tries: 0 }; shell(); level(); });
    var tw = KG.$('.tw-in', stage);
    setTimeout(function () { KG.$$('.tw-s', tw).forEach(function (s, i) { setTimeout(function () { s.classList.add('on'); }, i * 110); }); setTimeout(function () { KG.$$('.tw-s', tw).forEach(function (s) { s.classList.remove('on'); }); }, 1700); }, 350);
  }

  function shell() {
    stage.innerHTML = '<div class="tr"><div class="tr-term" id="tr-term"></div>' +
      '<div class="tr-tw"><div class="tw"><div class="tw-in" id="tw">' + slabs() + '<u class="tw-tk" id="tw-tk"></u></div></div><div class="tr-tier"><small class="kg-mono">Rango</small><b id="tr-tier">Sin rango</b></div></div></div>';
  }
  function hearts() { var h = '', tot = LV[S.lvl].miss + 1; for (var i = 0; i < tot; i++) h += '<svg class="' + (i < S.lives ? 'on' : '') + '" viewBox="0 0 24 24"><path d="M12 21s-8-5.4-8-11a4.6 4.6 0 018-3 4.6 4.6 0 018 3c0 5.6-8 11-8 11z"/></svg>'; return h; }
  function paintTower() {
    var tw = KG.$('#tw'); if (!tw) return;
    KG.$$('.tw-s', tw).forEach(function (s, i) { s.classList.toggle('on', i <= S.rank); s.classList.toggle('cur', i === S.lvl && S.lvl > S.rank); });
    KG.$('#tw-tk').style.setProperty('--i', Math.min(6, S.lvl));
    var t = KG.$('#tr-tier'); t.textContent = S.rank >= 0 ? RANKS[S.rank].n : 'Sin rango';
    if (S.rank >= 0) { t.style.color = RANKS[S.rank].c; t.style.textShadow = '0 0 24px rgba(' + RANKS[S.rank].r + ',.8)'; } else { t.style.color = ''; t.style.textShadow = ''; }
  }
  function pips() {
    var h = ''; for (var i = 0; i < PER; i++) h += '<i class="' + (S.res[i] === 1 ? 'ok' : S.res[i] === 0 ? 'bad' : i === S.i ? 'cur' : '') + '"></i>'; return h;
  }

  function level() {
    var L = LV[S.lvl], R = RANKS[S.lvl];
    S.qs = pick(S.lvl); S.i = 0; S.ok = 0; S.lives = L.miss + 1; S.res = []; S.lock = false;
    var term = KG.$('#tr-term'); term.style.setProperty('--rc', R.c); term.style.setProperty('--rcr', R.r);
    term.innerHTML = '<div class="tr-banner"><span class="tr-bd" style="--sc:' + R.c + ';--scr:' + R.r + '">' + (S.lvl + 1) + '</span><div><small class="kg-mono">Nivel ' + (S.lvl + 1) + ' de 7 · ' + L.name + '</small><b>Objetivo: rango ' + R.n + '</b></div>' +
      '<span class="tr-pts"><b id="tr-pts">' + S.pts + '</b> pts</span></div>' +
      '<div class="tr-hd"><span class="tr-pips" id="tr-pips"></span><span class="tr-lv" id="tr-lv"></span></div>' +
      '<div class="tr-bar"><i id="tr-bar"></i></div><div class="tr-q" id="tr-q"></div><div class="tr-o" id="tr-o"></div><div class="tr-why" id="tr-why"></div>';
    paintTower(); ask();
  }

  function ask() {
    var q = S.qs[S.i], L = LV[S.lvl]; S.lock = false; S.t0 = performance.now(); S.QT = L.t;
    KG.$('#tr-lv').innerHTML = hearts(); KG.$('#tr-pips').innerHTML = pips(); KG.$('#tr-pts').textContent = S.pts;
    KG.$('#tr-q').textContent = q.q; KG.$('#tr-why').textContent = ''; KG.$('#tr-why').className = 'tr-why';
    var o = KG.$('#tr-o'); o.innerHTML = '';
    q.o.forEach(function (t, i) {
      var b = KG.el('button', 'tr-k', '<i>' + 'ABCD'[i] + '</i><span>' + KG.esc(t) + '</span>'); b.type = 'button'; b.style.setProperty('--d', i * 60 + 'ms');
      b.addEventListener('click', function () { answer(i, b); }); o.appendChild(b);
    });
    cancelAnimationFrame(timer);
    (function tick() {
      var bar = KG.$('#tr-bar'); if (!bar || !S) return;
      var k = 1 - (performance.now() - S.t0) / (S.QT * 1000);
      bar.style.transform = 'scaleX(' + Math.max(0, k) + ')'; bar.classList.toggle('lo', k < .3);
      if (k <= 0) { if (!S.lock) answer(-1); return; }
      timer = requestAnimationFrame(tick);
    })();
  }

  function answer(i, btn) {
    if (!S || S.lock) return; S.lock = true; cancelAnimationFrame(timer);
    var q = S.qs[S.i], ok = i === q.a, why = KG.$('#tr-why'), keys = KG.$$('.tr-k');
    keys.forEach(function (k, n) { k.disabled = true; if (n === q.a) k.classList.add('ok'); else if (n === i) k.classList.add('bad'); });
    var r = btn ? btn.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    if (ok) {
      var left = Math.max(0, 1 - (performance.now() - S.t0) / (S.QT * 1000));
      S.streak++; S.ok++; S.res[S.i] = 1;
      var gain = Math.round((60 + 40 * (S.lvl + 1) + left * 50) * (S.streak >= 3 ? 1.5 : 1)); S.pts += gain;
      why.textContent = '✔ ' + q.w + (S.streak >= 3 ? '  ·  Racha ×1,5' : '') + '  (+' + gain + ')'; why.className = 'tr-why ok'; KG.sfx.ok(); KG.burst(r.left + r.width / 2, r.top + r.height / 2, 'var(--kc)', 16);
    } else {
      S.streak = 0; S.lives--; S.res[S.i] = 0; why.textContent = (i < 0 ? '⏱ Se acabó el tiempo. ' : '✘ ') + q.w; why.className = 'tr-why bad'; KG.sfx.bad();
      var st = KG.$('.tr', stage); st.classList.add('shake'); setTimeout(function () { st.classList.remove('shake'); }, 450);
    }
    KG.$('#tr-lv').innerHTML = hearts(); KG.$('#tr-pips').innerHTML = pips(); KG.$('#tr-pts').textContent = S.pts;
    nextT = setTimeout(function () {
      S.i++;
      if (S.lives <= 0) levelEnd(false);
      else if (S.i >= PER) levelEnd(true);
      else ask();
    }, ok ? 1400 : 2300);
  }

  function medal(R, n) {
    return '<div class="tr-medal" style="--sc:' + R.c + ';--scr:' + R.r + '"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52"/><circle cx="60" cy="60" r="40"/><path d="M60 30l8 19 21 2-16 14 5 20-18-11-18 11 5-20-16-14 21-2z"/></svg><b>' + n + '</b></div>';
  }

  function levelEnd(pass) {
    var term = KG.$('#tr-term'), l = S.lvl, R = RANKS[l], last = l >= 6;
    if (pass) {
      S.rank = l; S.pts += 150 * (l + 1); S.tries = 0; paintTower();
      KG.sfx.win(); var tr = term.getBoundingClientRect(); KG.burst(tr.left + tr.width / 2, tr.top + 90, R.c, 30);
      term.innerHTML = '<div class="tr-end pass">' + medal(R, l + 1) + '<small class="kg-mono">Nivel ' + (l + 1) + ' superado · ' + S.ok + '/' + PER + ' aciertos</small>' +
        '<h3>Rango <em>' + R.n + '</em></h3><p>' + KG.esc(msg(l)) + '</p><div class="tr-endb">' +
        (last ? '<button class="kg-btn pri" id="tr-fin" type="button">Ver mi resultado</button>' :
          '<button class="kg-btn pri" id="tr-nx" type="button">Siguiente nivel · ' + RANKS[l + 1].n + '</button><button class="kg-btn" id="tr-fin" type="button">Plantarme aquí</button>') + '</div></div>';
      var nx = KG.$('#tr-nx'); if (nx) nx.addEventListener('click', function () { S.lvl++; level(); });
      KG.$('#tr-fin').addEventListener('click', finish);
    } else {
      S.tries++; KG.sfx.bad();
      term.innerHTML = '<div class="tr-end fail"><div class="tr-medal off"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52"/><path d="M42 42l36 36M78 42L42 78"/></svg></div>' +
        '<small class="kg-mono">Nivel ' + (l + 1) + ' no superado · ' + S.ok + '/' + PER + ' aciertos</small><h3>Casi, pero aún no</h3>' +
        '<p>' + (S.rank >= 0 ? 'Te quedas con el rango <b style="color:' + RANKS[S.rank].c + '">' + RANKS[S.rank].n + '</b>. ' : 'Todavía sin rango. ') + 'Cada intento trae preguntas distintas: vuelve a intentarlo para llegar a ' + R.n + '.</p>' +
        '<div class="tr-endb"><button class="kg-btn pri" id="tr-re" type="button">Reintentar nivel ' + (l + 1) + '</button><button class="kg-btn" id="tr-fin" type="button">Terminar</button></div></div>';
      KG.$('#tr-re').addEventListener('click', level);
      KG.$('#tr-fin').addEventListener('click', finish);
    }
  }

  function finish() {
    var sp = KG.sports[KG.sport], key = 'torre_' + KG.sport, best = KG.get(key, 0), rec = S.pts > best; if (rec) KG.set(key, S.pts);
    var br = bestRank(), newRank = S.rank > br; if (newRank) KG.set('torre_rank_' + KG.sport, S.rank);
    var title = S.rank >= 0 ? 'Rango ' + RANKS[S.rank].n : 'Aún sin rango';
    KG.sheet({
      game: 'torre-de-niveles', kicker: 'Torre de niveles · ' + sp.n, big: S.pts, title: title, bigSize: 190,
      lines: [S.rank >= 0 ? msg(S.rank) : 'Supera el nivel 1 para conseguir tu primer rango.', (S.rank + 1) + ' de 7 niveles superados', newRank ? '🏆 ¡Nuevo mejor rango!' : rec ? '🏆 ¡Nuevo récord!' : 'Tu récord: ' + best + ' pts'],
      tip: 'En KINET, tu cuerpo técnico de IA te explica las reglas y la táctica de tu deporte y adapta el entrenamiento a tu posición.',
      shareText: (S.rank >= 0 ? 'Conseguí el rango ' + RANKS[S.rank].n : 'Jugué') + ' con ' + S.pts + ' puntos en la Torre de niveles de ' + sp.n + '. ¿Llegas a Experto?', shareUrl: location.origin + '/juegos/torre-de-niveles.html?d=' + KG.sport,
      again: function () { S = { lvl: 0, pts: 0, rank: -1, streak: 0, tries: 0 }; shell(); level(); }, ctaTitle: 'Conoce a tu cuerpo técnico de IA', win: S.rank >= 1
    });
    intro();
  }

  document.addEventListener('keydown', function (e) {
    if (!S || S.lock || !KG.$('.tr-k', stage) || e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key.toLowerCase(), n = 'abcd'.indexOf(k); if (n < 0 && /^[1-4]$/.test(k)) n = +k - 1;
    var b = n >= 0 ? KG.$$('.tr-k', stage)[n] : null; if (b) { e.preventDefault(); b.click(); }
  });
  KG.onSport(function () { cancelAnimationFrame(timer); clearTimeout(nextT); intro(); });
  intro();
})();
