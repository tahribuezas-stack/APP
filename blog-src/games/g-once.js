/* KINET OS · Juego 5 · Tu once con presupuesto (mesa de fichajes sobre campo inclinado). Sin registro. */
(function () {
  'use strict';
  var BUD = 100;
  var CFG = {
    futbol: { mode: 'Once · 4-3-3', roles: ['Portero', 'Lateral izq.', 'Central', 'Central', 'Lateral der.', 'Medio', 'Mediocentro', 'Medio', 'Extremo izq.', 'Delantero', 'Extremo der.'],
      pos: [[.5, .9], [.14, .7], [.37, .74], [.63, .74], [.86, .7], [.27, .48], [.5, .53], [.73, .48], [.16, .2], [.5, .14], [.84, .2]],
      links: [[0, 2], [0, 3], [1, 2], [2, 3], [3, 4], [1, 5], [2, 6], [3, 6], [4, 7], [5, 6], [6, 7], [5, 8], [7, 10], [6, 9], [8, 9], [9, 10]], cost: function (r) { return Math.round(2 + (r - 60) * .55); } },
    baloncesto: { mode: 'Quinteto', roles: ['Base', 'Escolta', 'Alero', 'Ala-pívot', 'Pívot'], pos: [[.5, .8], [.2, .5], [.8, .5], [.3, .22], [.7, .22]],
      links: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4]], cost: function (r) { return Math.round(5 + (r - 60) * 1.1); } },
    tenis: { mode: 'Dobles', roles: ['Derecha', 'Izquierda'], pos: [[.3, .5], [.7, .5]], links: [[0, 1]], cost: function (r) { return Math.round(10 + (r - 60) * 2); } },
    running: { mode: 'Relevo 4 × 100', roles: ['1.º relevista', '2.º relevista', '3.º relevista', 'Cierre'], pos: [[.16, .78], [.38, .58], [.62, .4], [.84, .22]], links: [[0, 1], [1, 2], [2, 3]], cost: function (r) { return Math.round(5 + (r - 60) * 1.3); } }
  };
  var stage = KG.$('#kg-stage'), C, pool, pick, active, chal = null;
  try { var h = location.hash.match(/r=([\d.]+)/); if (h) chal = parseFloat(h[1]); } catch (e) {}

  function mk(sport) {
    var cf = CFG[sport], rnd0 = KG.rng(KG.hash('once-' + sport)), cs = KG.shuffle(KG.COUNTRIES, rnd0).slice(0, 5), cl = KG.shuffle(KG.CLUBS, rnd0).slice(0, 4), used = {};
    return cf.roles.map(function (role, i) {
      var rnd = KG.rng(KG.hash('slot' + sport + i)), rs = KG.shuffle([60, 64, 68, 72, 76, 80, 85, 91], rnd);
      return rs.map(function (r) { var p; do { p = KG.person(rnd); } while (used[p.full]); used[p.full] = 1; r += Math.floor(rnd() * 3) - 1; return { name: p.full, r: r, c: cf.cost(r), country: KG.pick(cs, rnd), club: KG.pick(cl, rnd), role: role }; })
        .sort(function (a, b) { return b.r - a.r; });
    });
  }
  function xy(p) { var w = 72 + (100 - 72) * p[1]; return [50 + (p[0] - .5) * w, p[1] * 100]; }

  function init() { C = CFG[KG.sport]; pool = mk(KG.sport); pick = C.roles.map(function () { return -1; }); active = 0; render(true); }
  function spent() { return pick.reduce(function (s, k, i) { return s + (k >= 0 ? pool[i][k].c : 0); }, 0); }
  function stats() {
    var n = 0, sum = 0, bonus = 0, ln = [];
    pick.forEach(function (k, i) { if (k >= 0) { n++; sum += pool[i][k].r; } });
    C.links.forEach(function (l) { var a = pick[l[0]], b = pick[l[1]]; if (a < 0 || b < 0) return; var pa = pool[l[0]][a], pb = pool[l[1]][b], v = (pa.country === pb.country ? .35 : 0) + (pa.club === pb.club ? .6 : 0); if (v) { bonus += v; ln.push([l, v]); } });
    return { n: n, avg: n ? sum / n : 0, bonus: bonus, score: n ? sum / n + bonus : 0, links: ln };
  }

  function pitch() {
    var s = KG.sport, L = 'stroke="rgba(255,255,255,.6)" stroke-width="1.3" fill="none" vector-effect="non-scaling-stroke" stroke-linejoin="round"';
    function m(x, y) { var q = xy([x / 100, y / 100]); return q[0].toFixed(2) + ',' + q[1].toFixed(2); }
    function poly(pts, extra) { return '<polyline points="' + pts.map(function (p) { return m(p[0], p[1]); }).join(' ') + '" ' + (extra || L) + '/>'; }
    function rect(x, y, w, h) { return poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]); }
    function ell(cx, cy, rx, ry, a0, a1) { var pts = [], n = 40; for (var i = 0; i <= n; i++) { var a = a0 + (a1 - a0) * i / n; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return poly(pts); }
    var T = 6.2832, W2 = 'stroke="#fff" stroke-width="2.4" fill="none" vector-effect="non-scaling-stroke"', inner;
    if (s === 'futbol') inner = rect(3, 3, 94, 94) + poly([[3, 50], [97, 50]]) + ell(50, 50, 12, 9, 0, T) + rect(26, 3, 48, 16) + rect(26, 81, 48, 16) + rect(38, 3, 24, 6) + rect(38, 91, 24, 6);
    else if (s === 'baloncesto') inner = rect(3, 3, 94, 94) + rect(34, 3, 32, 36) + poly([[12, 3], [12, 22]]) + poly([[88, 3], [88, 22]]) + ell(50, 22, 38, 34, .3, Math.PI - .3) + ell(50, 39, 12, 7, 0, T) + ell(50, 10, 3, 3, 0, T);
    else if (s === 'tenis') inner = rect(6, 3, 88, 94) + poly([[18, 3], [18, 97]]) + poly([[82, 3], [82, 97]]) + poly([[6, 50], [94, 50]], W2) + poly([[18, 26], [82, 26]]) + poly([[18, 74], [82, 74]]) + poly([[50, 26], [50, 74]]);
    else inner = rect(3, 3, 94, 94) + [22, 41, 60, 79].map(function (y) { return poly([[3, y], [97, y]]); }).join('') + poly([[86, 3], [86, 97]], W2);
    return '<svg class="of-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' + inner + '</svg>';
  }

  function render(full) {
    var st = stats(), sp = spent(), left = BUD - sp, done = st.n === C.roles.length;
    var slots = C.pos.map(function (p, i) {
      var q = xy(p), k = pick[i], pl = k >= 0 ? pool[i][k] : null, sc = .72 + .28 * p[1];
      return '<button type="button" class="of-s ' + (i === active ? 'act ' : '') + (pl ? 'full' : '') + '" data-i="' + i + '" style="left:' + q[0] + '%;top:' + q[1] + '%;--sc:' + sc + '"><span class="of-bub">' + (pl ? '<b>' + pl.r + '</b>' : '<i>+</i>') + '</span><span class="of-nm">' + (pl ? KG.esc(pl.name.split(' ').slice(-1)[0]) : C.roles[i]) + '</span>' + (pl ? '<em>' + pl.c + '</em>' : '') + '</button>';
    }).join('');
    var lines = st.links.map(function (x) { var a = xy(C.pos[x[0][0]]), b = xy(C.pos[x[0][1]]); return '<line x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '" class="' + (x[1] > .5 ? 'club' : '') + '"/>'; }).join('');
    var market = pool[active].map(function (pl, k) {
      var sel = pick[active] === k, other = sp - (pick[active] >= 0 ? pool[active][pick[active]].c : 0), afford = other + pl.c <= BUD;
      var hint = []; C.links.forEach(function (l) { var o = l[0] === active ? l[1] : l[1] === active ? l[0] : -1; if (o < 0 || pick[o] < 0) return; var po = pool[o][pick[o]]; if (po.country === pl.country) hint.push('País = ' + po.name.split(' ').slice(-1)[0]); if (po.club === pl.club) hint.push('Club = ' + po.name.split(' ').slice(-1)[0]); });
      return '<button type="button" class="of-c ' + (sel ? 'sel ' : '') + (afford ? '' : 'no') + '" data-k="' + k + '"' + (afford || sel ? '' : ' disabled') + '><span class="of-r">' + pl.r + '</span><span class="of-i"><b>' + KG.esc(pl.name) + '</b><small>' + KG.esc(pl.club) + ' · ' + KG.esc(pl.country) + '</small>' + (hint.length ? '<u>⚡ ' + KG.esc(hint.slice(0, 2).join(' · ')) + '</u>' : '') + '</span><span class="of-p">' + pl.c + '<small>pts</small></span></button>';
    }).join('');
    var html = '<div class="of"><div class="of-top"><div class="of-bud"><small class="kg-mono">Presupuesto</small><div class="of-barw"><i style="width:' + Math.max(0, left) + '%"></i></div><b>' + left + ' <span>/ ' + BUD + '</span></b></div>' +
      '<div class="of-sc"><small class="kg-mono">Nota del equipo</small><b>' + (st.n ? st.score.toFixed(1) : '—') + '</b></div><div class="of-sc"><small class="kg-mono">Química</small><b>⚡ ' + st.links.length + '</b></div></div>' +
      (chal ? '<div class="of-chal">🎯 Te reta un amigo: <b>' + chal.toFixed(1) + '</b> de nota. ¿Lo superas?</div>' : '') +
      '<div class="of-body"><div class="of-fieldw"><div class="of-field s-' + KG.sport + '"><div class="of-plane">' + pitch() + '</div><svg class="of-ln" viewBox="0 0 100 100" preserveAspectRatio="none">' + lines + '</svg>' + slots + '</div><div class="of-mode kg-mono">' + C.mode + '</div></div>' +
      '<div class="of-mk"><div class="of-mh"><small class="kg-mono">Mercado de fichajes</small><b>' + C.roles[active] + '</b></div><div class="of-list" id="of-list">' + market + '</div>' +
      '<button class="kg-btn ' + (done ? 'pri' : '') + '" id="of-done" type="button"' + (done ? '' : ' disabled') + '>' + (done ? 'Cerrar plantilla' : 'Faltan ' + (C.roles.length - st.n) + ' fichajes') + '</button></div></div></div>';
    var prev = KG.$('#of-list'), sc = prev ? prev.scrollTop : 0; stage.innerHTML = html; var nl = KG.$('#of-list'); if (nl && !full) nl.scrollTop = sc;
    KG.$$('.of-s').forEach(function (b) { b.addEventListener('click', function () { active = +b.dataset.i; render(true); }); });
    KG.$$('.of-c').forEach(function (b) { b.addEventListener('click', function () { var k = +b.dataset.k; pick[active] = pick[active] === k ? -1 : k; KG.beep(pick[active] >= 0 ? 700 : 400, .07, 'triangle', .05); var nx = pick[active] >= 0 ? pick.indexOf(-1) : active; if (nx >= 0) active = nx; render(true); }); });
    var d = KG.$('#of-done'); if (d) d.addEventListener('click', finish);
  }

  function finish() {
    var st = stats(), key = 'once_' + KG.sport, best = KG.get(key, 0), sc = Math.round(st.score * 10) / 10, rec = sc > best; if (rec) KG.set(key, sc);
    var t = sc >= 84 ? 'Dream team' : sc >= 80 ? 'Equipazo' : sc >= 76 ? 'Candidato al título' : sc >= 72 ? 'Equipo de ascenso' : 'Promesas de cantera';
    var lines = ['Media de plantilla: ' + st.avg.toFixed(1) + ' · química: +' + st.bonus.toFixed(1), 'Presupuesto gastado: ' + spent() + ' / ' + BUD];
    if (chal) lines.push(sc > chal ? '🎯 ¡Has ganado el reto (' + chal.toFixed(1) + ')!' : sc === chal ? '🎯 Empate con el reto' : '🎯 Te ganó el reto (' + chal.toFixed(1) + ')');
    lines.push(rec ? '🏆 ¡Nuevo récord!' : 'Tu récord: ' + best.toFixed(1));
    KG.sheet({ game: 'once-con-presupuesto', kicker: C.mode + ' · ' + KG.sports[KG.sport].n, big: sc.toFixed(1), bigSize: 160, title: t, lines: lines,
      tip: '<b>Truco:</b> no gastes todo en estrellas. Un par de fichajes baratos del mismo país o club pueden darte más química que un crack aislado.',
      shareText: 'Mi ' + C.mode.toLowerCase() + ' de ' + KG.sports[KG.sport].n + ' saca ' + sc.toFixed(1) + ' (' + t + '). ¿Lo superas con 100 de presupuesto?', shareUrl: location.origin + '/juegos/once-con-presupuesto.html?d=' + KG.sport + '#r=' + sc.toFixed(1),
      again: function () { init(); }, win: sc >= 72, ctaTitle: 'Gestiona tu equipo de verdad', ctaText: 'KINET te ayuda a analizar a tus jugadores y planificar entrenamientos.' });
  }
  KG.onSport(init); init();
})();
