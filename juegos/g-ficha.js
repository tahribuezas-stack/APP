/* KINET OS · Juego 3 · Ficha secreta (expediente clasificado, reto diario). Sin registro. */
(function () {
  'use strict';
  var MAXG = 6;
  var SCH = {
    futbol:     { c1: ['Posición', ['Portero', 'Defensa', 'Medio', 'Delantero']], c5: ['Pie', ['Derecho', 'Izquierdo']], h: { Portero: 188, Defensa: 184, Medio: 178, Delantero: 180 } },
    baloncesto: { c1: ['Posición', ['Base', 'Escolta', 'Alero', 'Ala-pívot', 'Pívot']], c5: ['Mano', ['Diestro', 'Zurdo']], h: { Base: 186, Escolta: 193, Alero: 199, 'Ala-pívot': 205, 'Pívot': 211 } },
    tenis:      { c1: ['Estilo', ['Fondo', 'Ofensivo', 'Saque-volea', 'Defensivo']], c5: ['Mano', ['Diestro', 'Zurdo']], h: { Fondo: 183, Ofensivo: 187, 'Saque-volea': 189, Defensivo: 177 } },
    running:    { c1: ['Prueba', ['100 m', '400 m', '800 m', '1.500 m', '5 K', 'Maratón']], c5: ['Terreno', ['Pista', 'Asfalto', 'Montaña']], h: { '100 m': 184, '400 m': 181, '800 m': 178, '1.500 m': 176, '5 K': 172, 'Maratón': 170 } }
  };
  var stage = KG.$('#kg-stage'), P = [], T, G, mode, sel = -1, sug = [];

  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function build(sport) {
    var S = SCH[sport], rnd = KG.rng(KG.hash('ficha-' + sport)), seen = {}, out = [], guard = 0;
    while (out.length < 520 && guard++ < 4000) {
      var p = KG.person(rnd); if (seen[p.full]) continue; seen[p.full] = 1;
      var pos = KG.pick(S.c1[1], rnd), age = 17 + Math.floor(rnd() * 20), h = Math.round(S.h[pos] + (rnd() - .5) * 14), media = 62 + Math.floor(rnd() * 34);
      out.push({ name: p.full, v: [pos, age, h, KG.pick(KG.COUNTRIES, rnd), KG.pick(S.c5[1], rnd), media] });
    } return out;
  }
  var LAB = function () { var S = SCH[KG.sport]; return [S.c1[0], 'Edad', 'Altura', 'País', S.c5[0], 'Media']; };
  var FMT = [function (x) { return x; }, function (x) { return x + ' años'; }, function (x) { return (x / 100).toFixed(2).replace('.', ',') + ' m'; }, function (x) { return x; }, function (x) { return x; }, function (x) { return x; }];
  var TOL = [0, 2, 5, 0, 0, 5];
  function cmp(g, t) {
    return g.v.map(function (x, i) {
      var y = t.v[i]; if (x === y) return { s: 'g', a: '' };
      if (typeof x === 'number') { var d = Math.abs(x - y); return { s: d <= TOL[i] ? 'y' : 'n', a: y > x ? '↑' : '↓' }; }
      return { s: 'n', a: '' };
    });
  }

  function load() {
    P = build(KG.sport); var key = 'ficha_' + KG.sport + '_' + KG.day();
    if (mode === 'free') { T = KG.pick(P); G = []; }
    else { T = P[KG.hash('t' + KG.sport + KG.day()) % P.length]; G = KG.get(key, []).map(function (n) { return P.filter(function (p) { return p.name === n; })[0]; }).filter(Boolean); }
    draw();
  }
  function over() { return G.length && (G[G.length - 1] === T || G.length >= MAXG); }
  function won() { return G.length && G[G.length - 1] === T; }

  function draw() {
    var lab = LAB(), found = lab.map(function (_, i) { return G.some(function (g) { return g.v[i] === T.v[i]; }); }), fin = over();
    var left = '<aside class="fs-file"><div class="fs-stamp">' + (fin ? (won() ? 'DESCLASIFICADO' : 'CASO CERRADO') : 'CLASIFICADO') + '</div><small class="kg-mono">Expediente KN-' + (1000 + KG.hash(T.name + KG.sport) % 9000) + '</small>' +
      '<div class="fs-sil"><svg viewBox="0 0 120 140" aria-hidden="true"><circle cx="60" cy="44" r="26"/><path d="M12 140c3-34 22-52 48-52s45 18 48 52z"/></svg><i class="fs-scan"></i></div>' +
      '<div class="fs-name">' + (fin ? KG.esc(T.name) : '<span class="fs-red"></span>') + '</div>' +
      '<ul class="fs-attr">' + lab.map(function (l, i) { return '<li class="' + (found[i] || fin ? 'on' : '') + '"><span>' + l + '</span><b>' + (found[i] || fin ? KG.esc(FMT[i](T.v[i])) : '<i class="fs-red"></i>') + '</b></li>'; }).join('') + '</ul></aside>';
    var rows = G.map(function (g, gi) {
      var c = cmp(g, T); return '<div class="fs-row"><div class="fs-gn">' + KG.esc(g.name) + '</div><div class="fs-tiles">' + c.map(function (x, i) { return '<div class="fs-t ' + x.s + (gi === G.length - 1 && G.fresh ? ' fl' : '') + '" style="--d:' + (i * 130) + 'ms"><small>' + lab[i] + '</small><b>' + KG.esc(FMT[i](g.v[i])) + '</b>' + (x.a ? '<em>' + x.a + '</em>' : '') + '</div>'; }).join('') + '</div></div>';
    }).join('');
    for (var e = G.length; e < MAXG; e++) rows += '<div class="fs-row empty"><div class="fs-gn">Intento ' + (e + 1) + '</div><div class="fs-tiles">' + lab.map(function () { return '<div class="fs-t"></div>'; }).join('') + '</div></div>';
    var streak = KG.get('ficha_streak_' + KG.sport, { n: 0, d: 0 });
    var right = '<div class="fs-main"><div class="fs-hd"><div><small class="kg-mono">' + (mode === 'free' ? 'Partida libre' : 'Reto del día') + ' · ' + KG.sports[KG.sport].n + '</small><b>' + G.length + '/' + MAXG + ' intentos</b></div>' +
      '<div class="fs-st"><span>🔥 ' + (streak.d >= KG.day() - 1 ? streak.n : 0) + '</span></div></div>' +
      '<div class="fs-legend"><span class="g">Acierto</span><span class="y">Cerca</span><span class="n">Fallo</span><span class="ar">↑ ↓ es más / menos</span></div>' +
      (fin ? '' : '<div class="fs-in"><input id="fs-q" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Escribe un nombre o apellido… (' + P.length + ' jugadores)" aria-label="Nombre del jugador"><div class="fs-sug" id="fs-sug" role="listbox"></div></div>') +
      '<div class="fs-rows">' + rows + '</div>' +
      (fin ? '<div class="fs-end"><button class="kg-btn pri" id="fs-res" type="button">Ver resultado</button><button class="kg-btn" id="fs-free" type="button">Partida libre</button>' + (mode === 'free' ? '<button class="kg-btn" id="fs-day" type="button">Volver al reto del día</button>' : '') + '</div>' :
        '') + '</div>';
    stage.innerHTML = '<div class="fs">' + left + right + '</div>';
    if (fin) { KG.$('#fs-res').onclick = result; KG.$('#fs-free').onclick = function () { mode = 'free'; load(); }; var d = KG.$('#fs-day'); if (d) d.onclick = function () { mode = 'day'; load(); }; }
    else wire();
    G.fresh = false;
  }

  function wire() {
    var q = KG.$('#fs-q'), box = KG.$('#fs-sug');
    function render() {
      var v = norm(q.value.trim()), used = {}; G.forEach(function (g) { used[g.name] = 1; });
      sug = v.length < 1 ? [] : P.filter(function (p) { return !used[p.name] && norm(p.name).indexOf(v) >= 0; }).slice(0, 12);
      if (sel >= sug.length) sel = sug.length - 1;
      box.innerHTML = sug.map(function (p, i) { return '<button type="button" role="option" class="' + (i === sel ? 'on' : '') + '" data-i="' + i + '"><b>' + KG.esc(p.name) + '</b><span>' + KG.esc(p.v[0] + ' · ' + p.v[3]) + '</span></button>'; }).join('');
      box.classList.toggle('open', sug.length > 0);
      var on = box.querySelector('.on'); if (on && on.scrollIntoView) { var t = on.offsetTop, h = on.offsetHeight; if (t < box.scrollTop) box.scrollTop = t; else if (t + h > box.scrollTop + box.clientHeight) box.scrollTop = t + h - box.clientHeight; }
    }
    q.addEventListener('input', function () { sel = 0; render(); });
    q.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { sel = Math.min(sug.length - 1, sel + 1); render(); e.preventDefault(); } else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); render(); e.preventDefault(); }
      else if (e.key === 'Enter') { var p = sug[Math.max(0, sel)]; if (p) pick(p); }
    });
    box.addEventListener('pointerdown', function (e) { var b = e.target.closest('button'); if (b) { pick(sug[+b.dataset.i]); e.preventDefault(); } });
    if (!KG.RM && innerWidth > 800) q.focus({ preventScroll: true });
  }

  function pick(p) {
    G.push(p); G.fresh = true; sel = -1;
    if (mode !== 'free') KG.set('ficha_' + KG.sport + '_' + KG.day(), G.map(function (g) { return g.name; }));
    var c = cmp(p, T), ok = c.every(function (x) { return x.s === 'g'; }); KG.beep(ok ? 880 : 360, .1, 'triangle', .05);
    draw();
    if (over()) { if (mode !== 'free') streak(won()); setTimeout(function () { if (won()) { KG.sfx.win(); var r = KG.$('.fs-file').getBoundingClientRect(); KG.burst(r.left + r.width / 2, r.top + 90, 'var(--kc)', 30); } else KG.sfx.bad(); result(); }, 950); }
  }
  function streak(w) { var k = 'ficha_streak_' + KG.sport, s = KG.get(k, { n: 0, d: 0 }); if (s.d === KG.day()) return; s = w ? { n: (s.d === KG.day() - 1 ? s.n : 0) + 1, d: KG.day() } : { n: 0, d: KG.day() }; KG.set(k, s); }

  function result() {
    var w = won(), lab = LAB(), n = G.length, grid = G.map(function (g) { return cmp(g, T).map(function (x) { return x.s === 'g' ? '🟩' : x.s === 'y' ? '🟨' : '⬛'; }).join(''); });
    var s = KG.get('ficha_streak_' + KG.sport, { n: 0 });
    KG.sheet({ game: 'ficha-secreta', kicker: (mode === 'free' ? 'Partida libre' : 'Ficha secreta #' + (KG.day() - 20000)) + ' · ' + KG.sports[KG.sport].n, big: w ? n + '/' + MAXG : 'X/' + MAXG, bigSize: 150, grid: grid,
      title: w ? (n <= 2 ? 'Ojeador legendario' : n <= 4 ? 'Buen ojo' : 'Por los pelos') + ': era ' + T.name : 'Era ' + T.name,
      lines: [w ? 'Lo has descubierto en ' + n + ' intento' + (n > 1 ? 's' : '') : 'Mañana habrá una ficha nueva', mode !== 'free' && w ? '🔥 Racha: ' + s.n + ' día' + (s.n === 1 ? '' : 's') : ''].filter(Boolean),
      tip: '<b>Pista de ojeador:</b> primero busca posición y país; con la media y la edad cierras el círculo.',
      shareText: 'Ficha secreta (' + KG.sports[KG.sport].n + '): ' + (w ? n + '/' + MAXG : 'X/' + MAXG) + '\n' + grid.join('\n') + '\n', shareUrl: location.origin + '/juegos/ficha-secreta.html?d=' + KG.sport,
      again: function () { mode = 'free'; load(); }, win: w, ctaTitle: 'Crea tu propia ficha de jugador', ctaText: 'Presenta tus datos como un profesional con KINET.' });
  }

  mode = 'day'; KG.onSport(function () { sel = -1; load(); }); load();
})();
