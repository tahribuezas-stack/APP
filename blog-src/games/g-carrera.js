/* KINET OS · Juego 8 · Modo carrera: temporada rápida (~12 min). Sin registro; nada se guarda salvo tu récord en este navegador. */
(function () {
  'use strict';
  var stage = KG.$('#kg-stage'), S = null, ROUNDS = 5, shotRaf = 0;
  function C() { return KGC.cfg[KG.sport]; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function avg(arr, idx) { var s = 0; idx.forEach(function (i) { s += arr[i].r; }); return s / idx.length; }
  function clean(s) { return String(s || '').replace(/<[^>]*>/g, '').replace(/[<>&"'`]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20); }
  function poisson(l) { var L = Math.exp(-l), k = 0, p = 1; do { k++; p *= Math.random(); } while (p > L); return k - 1; }
  function sim(rA, rB) { var m = KG.sport === 'baloncesto' ? 6 : KG.sport === 'futbol' ? 1.2 : 2.4; return [poisson(m * Math.exp((rA - rB) / 40)), poisson(m * Math.exp((rB - rA) / 40))]; }
  function fmt(n) { return KG.esc(String(n)); }

  /* ───── plantilla del rival: estrella real si la hay, si no, inventada ───── */
  function starOf(t) {
    var pool = [], db = KG.DB[KG.sport];
    Object.keys(db).forEach(function (pos) { db[pos].forEach(function (p) { if ((p.club && t.n.length > 3 && p.club.toLowerCase().indexOf(t.n.toLowerCase()) >= 0) || (!t.inv && (KG.sport === 'tenis' || KG.sport === 'running') && p.country === t.n)) pool.push(p); }); });
    if (pool.length) { pool.sort(function (a, b) { return b.r - a.r; }); return pool[0].name; }
    return KG.person(Math.random).full;
  }
  function makeOpps() {
    var c = C(), real = KG.shuffle(c.real).slice(0, 3).map(function (x) { return { n: x[0], r: x[1], inv: false }; }),
      inv = KG.shuffle(KGC.invented).slice(0, 2).map(function (n) { return { n: n, r: 62 + Math.floor(Math.random() * 11), inv: true }; }), list = real.concat(inv);
    list.sort(function (a, b) { return a.r - b.r; }); /* de menos a más difícil */
    list.forEach(function (t) { t.star = starOf(t); t.att = t.r + (Math.random() * 6 - 3); t.def = t.r + (Math.random() * 6 - 3); t.gk = t.r + (Math.random() * 8 - 4); });
    return list;
  }

  /* ───── pantallas ───── */
  function root(html, cls) { stage.innerHTML = '<div class="cr ' + (cls || '') + '">' + html + '</div>'; }
  function intro() {
    cancelAnimationFrame(shotRaf); if (window.KGP) KGP.stop(); var c = C(), best = KG.get('carrera_' + KG.sport, 0); S = { name: '', picks: [], rerolls: 1, table: null, round: 0, rec: { w: 0, d: 0, l: 0, gf: 0, ga: 0 }, score: 0 };
    root('<div class="cr-intro"><small class="kg-mono">' + c.season + ' · ' + KG.sports[KG.sport].n + '</small><h2>Tu <em>carrera</em> en 12 minutos</h2>' +
      '<p>Monta tu equipo con cartas al azar, juega <b>5 jornadas</b> contra clubes reales e inventados y pelea por la final. Cada partido se <b>juega de verdad</b>: mueves a tu jugador, pasas y chutas, y en la ocasión <b>desliza el dedo</b> para definir o para parar. Los resultados se deciden por tu criterio y tu puntería.</p>' +
      '<label class="cr-name"><span class="kg-mono">Nombre de tu equipo</span><input id="cr-nm" maxlength="20" placeholder="' + c.team + '" autocomplete="off"></label>' +
      '<div class="tr-meta"><span><b>5</b>jornadas</span><span><b>1</b>final</span><span><b>' + (best || '—') + '</b>tu récord</span></div>' +
      '<button class="kg-btn pri" id="cr-go" type="button">Elegir mi equipo</button><p class="cr-fine">Los clubes y selecciones se nombran solo como referencia. Las plantillas, valoraciones y resultados son ficticios y no oficiales.</p></div>');
    KG.$('#cr-go').addEventListener('click', function () { S.name = clean(KG.$('#cr-nm').value) || c.team; draft(0); });
  }
  function cardsFor(slot, used) {
    var c = C(), pos = c.slots[slot][1], pool = (KG.DB[KG.sport][pos] || []).filter(function (p) { return used.indexOf(p.name) < 0; }), out = [], sh = KG.shuffle(pool);
    var lg = sh.filter(function (p) { return p.leg; }), nl = sh.filter(function (p) { return !p.leg; });
    out = nl.slice(0, 3); if (Math.random() < .35 && lg.length) out[Math.floor(Math.random() * 3)] = lg[0]; return out.slice(0, 3);
  }
  function draft(i, keep) {
    var c = C(), used = S.picks.map(function (p) { return p.name; });
    if (i >= c.slots.length) return squad();
    var cards = keep || cardsFor(i, used); S.cur = cards; S.lock = false;
    root('<div class="cr-draft"><div class="cr-dh"><small class="kg-mono">Fichaje ' + (i + 1) + ' de ' + c.slots.length + '</small><h2>' + c.slots[i][0] + '</h2><p>Elige una de estas tres cartas. Una nueva carta no se repite en tu plantilla.</p></div>' +
      '<div class="cr-cards">' + cards.map(function (p, k) { return '<button type="button" class="cr-card' + (p.leg ? ' leg' : '') + '" data-k="' + k + '" style="--d:' + k * 90 + 'ms">' + (p.leg ? '<em class="cr-lg">LEYENDA</em>' : '') + '<b class="cr-r">' + p.r + '</b><strong>' + KG.esc(p.name) + '</strong><span>' + KG.esc(p.country) + (p.club ? ' · ' + KG.esc(p.club) : '') + '</span></button>'; }).join('') + '</div>' +
      '<div class="cr-dl"><div class="cr-line">' + c.slots.map(function (s, k) { return '<i class="' + (k < i ? 'd' : k === i ? 'c' : '') + '">' + (S.picks[k] ? KG.esc(S.picks[k].name.split(' ').slice(-1)[0]) : s[0].split(' ')[0]) + '</i>'; }).join('') + '</div><button type="button" class="kg-btn" id="cr-rr"' + (S.rerolls ? '' : ' disabled') + '>Cambiar cartas (' + S.rerolls + ')</button></div></div>');
    KG.$$('.cr-card').forEach(function (b) { b.addEventListener('click', function () { if (S.lock) return; S.lock = true; var p = cards[+b.dataset.k]; S.picks.push(p); KG.sfx.ok(); b.classList.add('sel'); setTimeout(function () { draft(i + 1); }, 320); }); });
    KG.$('#cr-rr').addEventListener('click', function () { if (S.rerolls > 0) { S.rerolls--; KG.sfx.tick(); draft(i); } });
  }
  function squad() {
    var c = C(), ov = Math.round(S.picks.reduce(function (a, p) { return a + p.r; }, 0) / S.picks.length);
    S.my = { r: ov, att: avg(S.picks, c.att), def: avg(S.picks, c.def), gk: S.picks[c.gk].r }; S.opps = makeOpps();
    S.table = [{ n: S.name, me: true, r: ov, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }].concat(S.opps.map(function (o) { return { n: o.n, r: o.r, o: o, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 }; }));
    root('<div class="cr-squad"><small class="kg-mono">Tu plantilla</small><h2>' + KG.esc(S.name) + ' · valoración <em>' + ov + '</em></h2><div class="cr-sq">' + S.picks.map(function (p, k) { return '<div class="cr-sp' + (p.leg ? ' leg' : '') + '"><b>' + p.r + '</b><span><strong>' + KG.esc(p.name) + '</strong><small>' + c.slots[k][0] + ' · ' + KG.esc(p.country) + '</small></span></div>'; }).join('') + '</div>' +
      '<div class="tr-meta"><span><b>' + Math.round(S.my.att) + '</b>ataque</span><span><b>' + Math.round(S.my.def) + '</b>defensa</span><span><b>' + Math.round(S.my.gk) + '</b>' + (KG.sport === 'futbol' ? 'portero' : 'clave') + '</span></div><button class="kg-btn pri" id="cr-st" type="button">Empezar la temporada</button></div>');
    KG.$('#cr-st').addEventListener('click', hub);
  }
  function sorted() { return S.table.slice().sort(function (a, b) { return b.p - a.p || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf; }); }
  function hub() {
    var c = C(), opp = S.final ? S.final : S.opps[S.round], rank = sorted();
    root('<div class="cr-hub"><div class="cr-ht"><div><small class="kg-mono">' + c.season + ' · ' + (S.final ? 'Gran final' : 'Jornada ' + (S.round + 1) + ' de ' + ROUNDS) + '</small><h2>' + (S.final ? 'La <em>final</em>' : 'Siguiente <em>rival</em>') + '</h2></div></div>' +
      '<div class="cr-opp"><b>' + KG.esc(opp.n) + '</b><span>Valoración ' + Math.round(opp.r) + (opp.inv ? ' · club inventado' : '') + '</span><small>Estrella: ' + KG.esc(opp.star) + '</small></div>' +
      '<table class="cr-tb"><thead><tr><th>#</th><th>Equipo</th><th>PJ</th><th>DG</th><th>Pts</th></tr></thead><tbody>' + rank.map(function (t, k) { return '<tr class="' + (t.me ? 'me' : '') + (k < 2 ? ' top' : '') + '"><td>' + (k + 1) + '</td><td>' + KG.esc(t.n) + '</td><td>' + (t.w + t.d + t.l) + '</td><td>' + (t.gf - t.ga) + '</td><td><b>' + t.p + '</b></td></tr>'; }).join('') + '</tbody></table><p class="cr-fine">Los dos primeros tras cinco jornadas juegan la final.</p>' +
      '<div class="cr-plan"><small class="kg-mono">Plan de partido</small><div>' + [['press', 'Ofensivo', '+5 ataque · −4 defensa'], ['bal', 'Equilibrado', 'sin cambios'], ['low', 'Defensivo', '+5 defensa · −4 ataque']].map(function (p) { return '<button type="button" class="cr-pb' + ((S.plan || 'bal') === p[0] ? ' on' : '') + '" data-p="' + p[0] + '"><b>' + p[1] + '</b><span>' + p[2] + '</span></button>'; }).join('') + '</div></div>' + '<button class="kg-btn pri" id="cr-pl" type="button">' + (S.final ? 'Jugar la final' : 'Jugar la jornada ' + (S.round + 1)) + '</button></div>');
    KG.$$('.cr-pb').forEach(function (b) { b.addEventListener('click', function () { S.plan = b.dataset.p; KG.$$('.cr-pb').forEach(function (x) { x.classList.toggle('on', x === b); }); KG.beep(520, .05, 'triangle', .04); }); });
    KG.$('#cr-pl').addEventListener('click', function () { startMatch(opp); });
  }

  /* ───── partido ───── */
  var M = null;
  function startMatch(opp) {
    var pl = S.plan || 'bal', pa = pl === 'press' ? 5 : pl === 'low' ? -4 : 0, pd = pl === 'press' ? -4 : pl === 'low' ? 5 : 0;
    M = { opp: opp, gf: 0, ga: 0, shots: 0, poss: 50 }; root('', 'cr-match'); var host = stage.querySelector('.cr');
    KGP.play({ sport: KG.sport, host: host, label: S.final ? 'Gran final' : 'Jornada ' + (S.round + 1), me: { name: S.name, att: S.my.att + pa, def: S.my.def + pd, gk: S.my.gk, r: S.my.r }, opp: { n: opp.n, att: opp.att, def: opp.def, gk: opp.gk, r: opp.r }, val: function (col) { return C().val(col); }, shot: function (mode, info, cb) { shotView(mode, info, cb); } },
      function (r) { M.gf = r.gf; M.ga = r.ga; M.shots = r.shots; M.poss = r.poss; endMatch(); });
  }
  function endMatch() {
    var res = M.gf > M.ga ? 'w' : M.gf < M.ga ? 'l' : 'd', t = S.table, me = t[0], op = t.filter(function (x) { return x.n === M.opp.n; })[0], c = C();
    if (S.final) { if (res === 'd') return shootout(); return finish(res === 'w'); }
    me.gf += M.gf; me.ga += M.ga; op.gf += M.ga; op.ga += M.gf; me.p += res === 'w' ? 3 : res === 'd' ? 1 : 0; op.p += res === 'l' ? 3 : res === 'd' ? 1 : 0; me[res]++; op[res === 'w' ? 'l' : res === 'l' ? 'w' : 'd']++;
    S.rec[res]++; S.rec.gf += M.gf; S.rec.ga += M.ga;
    /* el resto de la jornada: dos partidos simulados entre los demás equipos */
    var others = KG.shuffle(t.filter(function (x) { return !x.me && x !== op; })); for (var i = 0; i + 1 < others.length; i += 2) { var a = others[i], b = others[i + 1], sc = sim(a.r, b.r); a.gf += sc[0]; a.ga += sc[1]; b.gf += sc[1]; b.ga += sc[0]; if (sc[0] > sc[1]) { a.p += 3; a.w++; b.l++; } else if (sc[0] < sc[1]) { b.p += 3; b.w++; a.l++; } else { a.p++; b.p++; a.d++; b.d++; } }
    var word = res === 'w' ? 'Victoria' : res === 'd' ? 'Empate' : 'Derrota';
    root('<div class="cr-end"><small class="kg-mono">Final del partido · jornada ' + (S.round + 1) + '</small><div class="cr-fin ' + res + '"><span>' + KG.esc(S.name) + '</span><b>' + M.gf + ' – ' + M.ga + '</b><span>' + KG.esc(M.opp.n) + '</span></div><h2>' + word + '</h2><p>' + (KG.sport === 'running' ? 'Relevos 4×100' : KG.sport === 'tenis' ? M.shots + ' puntos jugados' : 'Posesión ' + M.poss + ' % · ' + M.shots + ' ' + (M.shots === 1 ? 'ocasión' : 'ocasiones') + ' propias') + '.</p><button class="kg-btn pri" id="cr-c" type="button">Continuar</button></div>');
    if (res === 'w') { KG.sfx.win(); } KG.$('#cr-c').addEventListener('click', function () { S.round++; if (S.round >= ROUNDS) leagueEnd(); else hub(); });
  }
  function leagueEnd() {
    var r = sorted(), pos = r.indexOf(S.table[0]);
    if (pos < 2) { var rival = r[pos === 0 ? 1 : 0]; S.final = rival.o || { n: rival.n, r: rival.r, att: rival.r, def: rival.r, gk: rival.r, star: KG.person(Math.random).full, inv: true }; if (!S.final.star) S.final.star = starOf(S.final); S.final.att = S.final.att || S.final.r; S.final.def = S.final.def || S.final.r; S.final.gk = S.final.gk || S.final.r; S.rank = pos + 1; hub(); }
    else { S.rank = pos + 1; finish(null); }
  }
  function shootout() {
    var c = C(), i = 0, me = 0, op = 0, round = 0;
    function next() {
      if (round >= 3 && me !== op && round % 1 === 0) return done();
      if (i % 2 === 0) { root('<div class="cr-end"><small class="kg-mono">Desempate</small><h2>Tanda de ' + (KG.sport === 'futbol' ? 'penaltis' : 'desempate') + '</h2><p>Tú ' + me + ' – ' + op + ' ' + KG.esc(M.opp.n) + ' · ronda ' + (round + 1) + '</p><button class="kg-btn pri" id="cr-x" type="button">' + c.shoot + ' ▸</button></div>'); KG.$('#cr-x').addEventListener('click', function () { shotView('shoot', { rating: M.opp.gk }, function (r) { if (r.out === 'gol') me++; i++; next(); }); }); }
      else { root('<div class="cr-end"><small class="kg-mono">Desempate</small><h2>Turno del rival</h2><p>Tú ' + me + ' – ' + op + ' ' + KG.esc(M.opp.n) + '</p><button class="kg-btn pri" id="cr-x" type="button">' + c.save + ' ▸</button></div>'); KG.$('#cr-x').addEventListener('click', function () { shotView('save', { rating: S.my.gk }, function (r) { if (r.out === 'gol') op++; i++; round++; next(); }); }); }
    }
    function done() { if (me === op) { round = 2; return next(); } finish(me > op); }
    next();
  }
  function finish(champ) {
    var rec = S.rec, c = C(), pts = S.table[0].p, gd = rec.gf - rec.ga, fin = S.final != null, sc = pts * 80 + gd * 20 + (champ ? 800 : fin ? 300 : 0) + Math.round((S.my.r - 60) * 5);
    sc = Math.max(0, sc); var key = 'carrera_' + KG.sport, best = KG.get(key, 0), recd = sc > best; if (recd) KG.set(key, sc);
    var title = champ ? '¡Campeón!' : fin ? 'Subcampeón' : 'Puesto ' + S.rank + ' en la liga';
    root('<div class="cr-champ' + (champ ? ' on' : '') + '">' + (champ ? '<svg class="cr-trophy" viewBox="0 0 120 140" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M34 16h52v34a26 26 0 01-52 0zM34 24H14v10a20 20 0 0020 20M86 24h20v10a20 20 0 01-20 20M60 76v26M38 124h44M46 102h28v22H46z"/></svg>' : '') + '<h2>' + title + '</h2></div>');
    if (champ) { KG.sfx.win(); var rr = KG.$('.cr-champ').getBoundingClientRect(); [.2, .4, .6, .8, .5].forEach(function (f, i) { setTimeout(function () { KG.burst(rr.left + rr.width * f, rr.top + rr.height * .4, KG.sports[KG.sport].c, 34); }, i * 220); }); }
    setTimeout(function () {
      KG.sheet({ game: 'modo-carrera', kicker: c.season + ' · ' + KG.sports[KG.sport].n, big: sc, title: title, lines: [KG.esc(S.name).replace(/&amp;/g, '&') + ': ' + rec.w + ' V · ' + rec.d + ' E · ' + rec.l + ' D', 'Diferencia ' + (gd >= 0 ? '+' : '') + gd + ' · ' + pts + ' puntos', champ ? '🏆 Has ganado la final' : fin ? 'Perdiste la final' : 'No te clasificaste para la final', recd ? '🏆 ¡Nuevo récord!' : 'Tu récord: ' + best],
        tip: '<b>Consejo:</b> la mejor decisión suele ser la que aprovecha el espacio libre y el momento del rival. Prueba otro equipo y otro deporte.', shareText: title + ' en el Modo carrera de KINET OS (' + KG.sports[KG.sport].n + ') con ' + sc + ' puntos. ¿Lo mejoras?', shareUrl: location.origin + '/juegos/modo-carrera.html?d=' + KG.sport, again: intro, againLabel: 'Nueva temporada', ctaTitle: 'Lleva esto a tu equipo real', ctaText: 'Análisis táctico y cuerpo técnico con IA para tu deporte.', win: !!champ });
    }, champ ? 2400 : 400);
  }

  /* ═════════ vista de disparo (desliza para ejecutar / para parar) ═════════ */
  function hashN(n) { var x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
  function shotView(mode, info, done) {
    cancelAnimationFrame(shotRaf); var sp = KG.sport, c = C(), host = KG.el('div', 'cr-shot', '<canvas></canvas><div class="cr-hint" id="cr-hint"></div>'), cvs = KG.$('canvas', host), g = cvs.getContext('2d'), W, H, DPR, st, ptr = null, done0 = false, col = KG.sports[KG.sport].c, rgbc = KG.sports[KG.sport].rgb;
    stage.querySelector('.cr').appendChild(host); try { stage.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (x) {}
    function size() { var b = host.getBoundingClientRect(); DPR = Math.min(2, devicePixelRatio || 1); W = Math.max(280, b.width); H = Math.round(Math.min(W * .62, innerHeight * .64)); H = Math.max(260, H); cvs.width = W * DPR; cvs.height = H * DPR; cvs.style.height = H + 'px'; g.setTransform(DPR, 0, 0, DPR, 0, 0); }
    size();
    function T() { return sp === 'futbol' ? { x: W * .2, y: H * .2, w: W * .6, h: H * .42 } : sp === 'baloncesto' ? { x: W * .3, y: H * .16, w: W * .4, h: H * .36 } : sp === 'tenis' ? { x: W * .2, y: H * .32, w: W * .6, h: H * .22 } : { x: W * .2, y: H * .26, w: W * .6, h: H * .36 }; }
    function cell(cc, r) { var t = T(); return { x: t.x + (cc + .5) * t.w / 3, y: t.y + (r ? .27 : .73) * t.h }; }
    var bx0 = function () { return W / 2; }, by0 = function () { return H * .9; };
    st = { ph: mode === 'shoot' ? 'aim' : 'wait', t: 0, gcol: [0, 1, 2][Math.floor(Math.random() * 3)], tell: Math.random() < .6, gdive: 0, ball: null, res: null, mycol: 1, swiped: false, rcol: Math.floor(Math.random() * 3), t0: performance.now() };
    var hint = KG.$('#cr-hint'); hint.textContent = mode === 'shoot' ? 'Desliza hacia el objetivo · rápido = más fuerte, pero menos preciso' : 'Desliza a izquierda, centro o derecha para ' + (sp === 'futbol' ? 'lanzarte' : sp === 'baloncesto' ? 'taponar' : sp === 'tenis' ? 'llegar a la bola' : 'cerrar el carril');
    /* entrada */
    function pointer(e) { var r = cvs.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height), t: performance.now() }; }
    cvs.addEventListener('pointerdown', function (e) { ptr = pointer(e); try { cvs.setPointerCapture(e.pointerId); } catch (x) {} e.preventDefault(); });
    cvs.addEventListener('pointerup', function (e) {
      if (!ptr) return; var p = pointer(e), dx = p.x - ptr.x, dy = p.y - ptr.y, dt = Math.max(30, p.t - ptr.t), d = Math.hypot(dx, dy), v = d / dt * 1000, t = T(); ptr = null;
      if (mode === 'shoot' && st.ph === 'aim') {
        var tx, ty, pw, row;
        if (d < 22) { tx = p.x; ty = p.y; pw = .5; row = ty < t.y + t.h * .5 ? 1 : 0; } else { var k = (by0() - t.y - t.h * .5) / Math.max(10, -dy); tx = bx0() + dx * clamp(k, 0, 6); pw = clamp(v / 1800, 0, 1); if (dy > -12) tx = bx0() + dx * 3; row = pw >= .55 ? 1 : 0; ty = cell(1, row).y; }
        shoot(tx, ty, pw, row);
      } else if (mode === 'save' && !st.swiped) { st.swiped = true; var cc = d < 22 ? (p.x < W * .38 ? 0 : p.x > W * .62 ? 2 : 1) : (dx < -26 ? 0 : dx > 26 ? 2 : 1); st.mycol = cc; st.myhigh = (d >= 22 && dy < -40); KG.beep(420, .05, 'triangle', .04); }
    });
    function shoot(tx, ty, pw, row) {
      var t = T(), col0 = clamp(Math.floor((tx - t.x) / (t.w / 3)), 0, 2), rating = info.rating, off = false;
      var miss = pw > .85 ? .26 : pw > .65 ? .1 : .04; if (tx < t.x - W * .03 || tx > t.x + t.w + W * .03 || ty < t.y - H * .04 || ty > t.y + t.h + H * .05) miss = 1; if (Math.random() < miss) off = true;
      var pRead = clamp(.16 + (rating - 70) / 160, .08, .5); if (Math.random() < pRead) st.gcol = col0;
      var gc = st.gcol, saveP = 0; if (!off) { if (gc === col0) saveP = .78 - (row ? .22 : 0) + (rating - 75) / 250 - (pw > .6 ? .1 : 0) + (pw < .25 ? .2 : 0); else if (Math.abs(gc - col0) === 1 && gc === 1) saveP = .13 + (rating - 70) / 400; }
      var saved = !off && Math.random() < clamp(saveP, 0, .95), out = off ? 'fuera' : saved ? 'parada' : 'gol';
      st.ph = 'fly'; st.t = 0; var ex = clamp(tx, t.x - W * .08, t.x + t.w + W * .08), ey = clamp(ty, t.y - H * .1, t.y + t.h + H * .08);
      if (off && ex >= t.x && ex <= t.x + t.w && ey >= t.y && ey <= t.y + t.h) { if (Math.random() < .5 && sp !== 'tenis') ey = t.y - H * .07; else ex = ex < t.x + t.w / 2 ? t.x - W * .045 : t.x + t.w + W * .045; }
      st.ball = { x0: bx0(), y0: by0(), x1: off ? ex : cell(col0, row).x, y1: off ? ey : cell(col0, row).y, T: pw > .6 ? .5 : .75 }; st.res = { out: out, col: col0 }; st.gtgt = gc; hint.textContent = '';
    }
    function launch() {
      var rating = info.rating; st.ph = 'fly'; st.t = 0; var col0 = st.rcol, row = Math.random() < .35 ? 1 : 0, miss = Math.random() < .12, cl = cell(col0, row);
      st.ball = { x0: bx0(), y0: by0(), x1: miss ? cl.x + (Math.random() < .5 ? -1 : 1) * W * .14 : cl.x, y1: miss ? cl.y - H * .1 : cl.y, T: .78 }; st.row = row; st.miss = miss; hint.textContent = '';
    }
    function resolveSave() {
      var out; if (st.miss) out = 'fuera'; else { var my = st.swiped ? st.mycol : 1, rating = info.rating, p = 0; if (my === st.rcol) p = .8 + (rating - 75) / 250 - (st.row ? .18 : 0) - (st.myhigh && !st.row ? .05 : 0); else if (Math.abs(my - st.rcol) === 1 && (my === 1)) p = .12 + (rating - 70) / 400; out = Math.random() < clamp(p, 0, .95) ? 'parada' : 'gol'; }
      st.res = { out: out, col: st.rcol };
    }
    function person(x, y, h, color, armUp, lean, racket) {
      g.save(); g.lineCap = 'round'; g.strokeStyle = color; g.fillStyle = color; g.shadowColor = color; g.shadowBlur = 14; g.lineWidth = h * .17; g.beginPath(); g.moveTo(x + lean * h * .2, y - h * .62); g.lineTo(x, y - h * .25); g.stroke(); g.lineWidth = h * .09; g.beginPath(); g.moveTo(x, y - h * .25); g.lineTo(x - h * .1, y); g.moveTo(x, y - h * .25); g.lineTo(x + h * .1, y); g.stroke();
      g.shadowBlur = 0; g.fillStyle = '#e0b08c'; g.beginPath(); g.arc(x + lean * h * .26, y - h * .74, h * .1, 0, 6.3); g.fill();
      g.strokeStyle = '#e0b08c'; g.lineWidth = h * .075; var sx = x + lean * h * .2, sy = y - h * .56, ang = armUp; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx - h * (.2 + .22 * ang) * 1, sy - h * (.12 + .32 * ang)); g.moveTo(sx, sy); g.lineTo(sx + h * (.2 + .22 * ang), sy - h * (.12 + .32 * ang)); g.stroke();
      if (sp === 'futbol') { g.fillStyle = '#f8fafc'; [-1, 1].forEach(function (s) { g.beginPath(); g.arc(sx + s * h * (.2 + .22 * ang), sy - h * (.12 + .32 * ang), h * .085, 0, 6.3); g.fill(); }); }
      if (racket) { g.strokeStyle = '#e5e7eb'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(sx + h * (.26 + .22 * ang), sy - h * (.2 + .32 * ang), h * .09, h * .12, .4, 0, 6.3); g.stroke(); }
      g.restore();
    }
    function draw(now) {
      shotRaf = requestAnimationFrame(draw); var dt = Math.min(.05, (now - (st.last || now)) / 1000); st.last = now; st.t += dt; var t = T(), i, gr;
      /* fondo */
      gr = g.createLinearGradient(0, 0, 0, H * .4); gr.addColorStop(0, '#04070d'); gr.addColorStop(1, '#101b2e'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      var rows = 6; for (var r = 0; r < rows; r++) for (i = 0; i < 44; i++) { var h1 = hashN(r * 77 + i), x = (i + (r % 2) * .5) * W / 44, y = H * .02 + r * H * .045 + Math.sin(now / 260 + h1 * 6.3) * 1.8; g.fillStyle = ['#e11d48', '#2563eb', '#f1f5f9', '#f59e0b', '#16a34a', '#7c3aed'][Math.floor(h1 * 6)]; g.globalAlpha = .55; g.fillRect(x, y, W / 44 * .8, H * .03); } g.globalAlpha = 1;
      g.fillStyle = 'rgba(2,4,8,.38)'; g.fillRect(0, 0, W, H * .3);
      if (sp === 'futbol') {
        gr = g.createLinearGradient(0, H * .3, 0, H); gr.addColorStop(0, '#0e5a2a'); gr.addColorStop(1, '#093f1d'); g.fillStyle = gr; g.fillRect(0, H * .3, W, H * .7); for (i = 0; i < 8; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.05)'; g.fillRect(0, H * .3 + i * H * .09, W, H * .09); }
        g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(W * .08, H * .62); g.lineTo(W * .92, H * .62); g.stroke();
        g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(t.x, t.y, t.w, t.h); g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 1; for (i = 0; i <= 14; i++) { g.beginPath(); g.moveTo(t.x + i * t.w / 14, t.y); g.lineTo(t.x + i * t.w / 14, t.y + t.h); g.stroke(); } for (i = 0; i <= 7; i++) { g.beginPath(); g.moveTo(t.x, t.y + i * t.h / 7); g.lineTo(t.x + t.w, t.y + i * t.h / 7); g.stroke(); }
        g.strokeStyle = '#fff'; g.lineWidth = 6; g.shadowColor = '#fff'; g.shadowBlur = 10; g.strokeRect(t.x, t.y, t.w, t.h); g.shadowBlur = 0;
      } else if (sp === 'baloncesto') {
        gr = g.createLinearGradient(0, H * .55, 0, H); gr.addColorStop(0, '#b27234'); gr.addColorStop(1, '#6e3e15'); g.fillStyle = gr; g.fillRect(0, H * .55, W, H * .45); for (i = 0; i < 20; i++) { g.fillStyle = i % 2 ? 'rgba(255,224,170,.05)' : 'rgba(40,16,0,.07)'; g.fillRect(i * W / 20, H * .55, W / 20, H * .45); }
        g.fillStyle = 'rgba(210,230,255,.18)'; g.strokeStyle = '#cbd5e1'; g.lineWidth = 3; g.fillRect(W * .33, H * .06, W * .34, H * .3); g.strokeRect(W * .33, H * .06, W * .34, H * .3); g.strokeStyle = '#fb923c'; g.strokeRect(W * .44, H * .2, W * .12, H * .12);
        g.strokeStyle = '#f97316'; g.lineWidth = 5; g.beginPath(); g.ellipse(W / 2, H * .34, W * .08, H * .026, 0, 0, 6.3); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.2; for (i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(W / 2 - W * .075 + i * W * .0187, H * .35); g.lineTo(W / 2 - W * .04 + i * W * .01, H * .46); g.stroke(); }
        g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.ellipse(W / 2, H * .9, W * .2, H * .12, 0, Math.PI, 6.3); g.stroke();
      } else if (sp === 'tenis') {
        g.fillStyle = '#14452f'; g.fillRect(0, H * .3, W, H * .7); g.fillStyle = '#1f62ad'; g.beginPath(); g.moveTo(W * .3, H * .3); g.lineTo(W * .7, H * .3); g.lineTo(W * .96, H * .94); g.lineTo(W * .04, H * .94); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 2; g.stroke();
        g.beginPath(); g.moveTo(W * .5, H * .3); g.lineTo(W * .5, H * .58); g.moveTo(W * .36, H * .42); g.lineTo(W * .64, H * .42); g.moveTo(W * .15, H * .64); g.lineTo(W * .85, H * .64); g.stroke(); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(W * .16, H * .6, W * .68, H * .05); g.strokeStyle = '#fff'; g.beginPath(); g.moveTo(W * .15, H * .6); g.lineTo(W * .85, H * .6); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,.35)'; g.setLineDash([5, 6]); g.strokeRect(t.x, t.y, t.w, t.h); g.setLineDash([]);
      } else {
        g.fillStyle = '#1b6b3a'; g.fillRect(0, H * .3, W, H * .7); g.fillStyle = '#a53428'; g.beginPath(); g.moveTo(W * .32, H * .3); g.lineTo(W * .68, H * .3); g.lineTo(W * .98, H * 1); g.lineTo(W * .02, H * 1); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2; for (i = 0; i <= 3; i++) { g.beginPath(); g.moveTo(lerpX(.32 + i * .12, .3), H * .3); g.lineTo(lerpX(.02 + i * .32, 1), H); g.stroke(); } g.fillStyle = '#fff'; g.fillRect(W * .32, H * .3, W * .36, 4);
      }
      function lerpX(a) { return W * a; }
      /* guardián */
      var gcol = mode === 'shoot' ? st.gcol : (st.swiped ? st.mycol : 1), gx = cell(gcol, 0).x, base = cell(1, 0).x, dive = 0, gy = t.y + t.h * .85, gh = H * (sp === 'baloncesto' ? .34 : sp === 'futbol' ? .3 : .3);
      if (mode === 'shoot') { if (st.ph === 'aim') { var tellK = st.t > 1.2 ? Math.min(1, (st.t - 1.2) / .6) : 0, lcol = st.tell ? st.gcol : (st.gcol + 1 + Math.floor(st.t) % 2) % 3; gx = base + (cell(lcol, 0).x - base) * .35 * tellK; } else { dive = clamp(st.t / .35, 0, 1); gx = base + (cell(st.gtgt, 0).x - base) * dive; } }
      else { if (st.ph === 'fly' || st.res) { dive = clamp((st.t - .2) / .35, 0, 1); gx = base + (cell(st.swiped ? st.mycol : 1, 0).x - base) * dive; } else { gx = base + Math.sin(now / 500) * W * .01; } }
      if (sp === 'baloncesto') gy = t.y + t.h * 1.25;
      person(gx, gy + (sp === 'futbol' ? t.h * .1 : 0), gh, mode === 'shoot' ? '#fb7185' : col, sp === 'futbol' ? .5 + .5 * dive : sp === 'baloncesto' ? .8 : .4 + .4 * dive, (gx - base) / (W * .2), sp === 'tenis');
      /* rótulos de las tres zonas */
      if ((mode === 'shoot' && st.ph === 'aim') || (mode === 'save' && !st.swiped && st.ph !== 'fly')) { for (i = 0; i < 3; i++) { var cl = cell(i, 1); g.strokeStyle = 'rgba(' + rgbc + ',.28)'; g.lineWidth = 1.5; g.setLineDash([4, 6]); g.strokeRect(t.x + i * t.w / 3 + 3, t.y + 3, t.w / 3 - 6, t.h - 6); g.setLineDash([]); } }
      /* flujo */
      var ball = null, rr = Math.max(8, W * .022);
      if (mode === 'save' && st.ph === 'wait') { if (st.t > 1.1) launch(); }
      if (st.ph === 'fly') {
        var b = st.ball, u = Math.min(1, st.t / b.T), e = u * u * (3 - 2 * u); ball = { x: b.x0 + (b.x1 - b.x0) * u, y: b.y0 + (b.y1 - b.y0) * u - Math.sin(Math.PI * u) * H * .06, r: rr * (1 - .55 * e) };
        if (u >= 1 && !st.landed) { st.landed = true; if (mode === 'save') resolveSave(); st.ph = 'res'; st.t = 0; var o = st.res.out; if (o === 'gol') { KG.sfx.ok(); } else KG.sfx.bad(); }
      } else if (st.ph === 'res') { var b2 = st.ball; ball = { x: b2.x1, y: b2.y1, r: rr * .45 }; if (st.res.out === 'parada') { ball.y += st.t * 70; ball.x += (st.res.col - 1) * st.t * 60; } }
      else ball = { x: bx0(), y: by0(), r: rr };
      var bc = sp === 'futbol' ? '#f8fafc' : sp === 'baloncesto' ? '#f97316' : sp === 'tenis' ? '#d9f24b' : col;
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(ball.x, ball.y + ball.r * 1.6, ball.r * 1.1, ball.r * .35, 0, 0, 6.3); g.fill(); g.save(); g.shadowColor = bc; g.shadowBlur = 16; g.fillStyle = bc; g.beginPath(); g.arc(ball.x, ball.y, ball.r, 0, 6.3); g.fill(); g.restore();
      if (st.ph === 'res') {
        var txt = st.res.out === 'gol' ? (sp === 'futbol' ? '¡GOL!' : sp === 'baloncesto' ? (st.res.col === 1 ? '¡CANASTA!' : '¡TRIPLE!') : '¡PUNTO!') : st.res.out === 'parada' ? (sp === 'futbol' ? '¡PARADA!' : sp === 'baloncesto' ? '¡TAPÓN!' : '¡DEVUELTO!') : '¡FUERA!';
        g.save(); g.globalAlpha = Math.min(1, st.t * 4); g.fillStyle = st.res.out === 'gol' ? (mode === 'shoot' ? col : '#fb7185') : '#fbbf24'; g.shadowColor = g.fillStyle; g.shadowBlur = 24; g.font = '900 ' + Math.round(clamp(W * .075, 28, 64)) + 'px Orbitron,Inter,sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, W / 2, H * .18); g.restore();
        if (st.t > .95 && !done0) { done0 = true; cancelAnimationFrame(shotRaf); host.classList.add('out'); setTimeout(function () { host.remove(); done(st.res); }, 220); }
      }
      if (mode === 'shoot' && st.ph === 'aim' && st.t > 7 && !done0) shoot(W / 2, T().y + T().h * .75, .3, 0);
      if (mode === 'save' && st.ph === 'fly' && !st.swiped) { g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '700 14px Inter,sans-serif'; g.textAlign = 'center'; g.fillText('¡Desliza ya!', W / 2, H * .72); }
    }
    shotRaf = requestAnimationFrame(draw);
  }

  intro(); KG.onSport(function () { intro(); });
})();
