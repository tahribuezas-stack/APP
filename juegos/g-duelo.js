/* KINET OS · Juego 9 · Duelo del míster online.
   Sala con código para jugar con amigos. No hay registro ni base de datos: los mensajes viajan por un canal de tiempo real
   (Supabase Realtime · broadcast) y desaparecen al instante. En este navegador no se guarda nada. */
(function () {
  'use strict';
  var stage = KG.$('#kg-stage');
  var WS = 'wss://bhqgsbtkwdxdxlvlcaes.supabase.co/realtime/v1/websocket?apikey=sb_publishable_GrgL4iukPUJJyh91BdgfIQ_P0NQd6Nj&vsn=1.0.0';
  var KEY = 'sb_publishable_GrgL4iukPUJJyh91BdgfIQ_P0NQd6Nj';
  var ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', L2S = { F: 'futbol', B: 'baloncesto', T: 'tenis', R: 'running' }, S2L = { futbol: 'F', baloncesto: 'B', tenis: 'T', running: 'R' };
  var ROUNDS = 8, ANS = 15000, MAXP = 6, HI = 3000, GONE = 10500, NEXT = 7000;
  var PAL = ['#00FF88', '#22D3EE', '#FACC15', '#FB923C', '#F472B6', '#A78BFA'];
  var MSGS = { hi: 1, go: 1, an: 1, rs: 1, en: 1, lb: 1 };

  var me = { id: rid(), n: '' }, R = null, net = null, tick = 0, hiT = 0, goneT = 0, nextT = 0, endT = 0, solo = false;

  function rid() { var s = '', i; for (i = 0; i < 8; i++) s += 'abcdefghjkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 31)]; return s; }
  function clean(s) { return String(s == null ? '' : s).replace(/<[^>]*>/g, '').replace(/[<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 14); }
  function num(v, a, b) { v = +v; if (!isFinite(v)) return a; return v < a ? a : v > b ? b : Math.round(v); }
  function newCode(sp) { var s = S2L[sp] + '-', i; for (i = 0; i < 4; i++) s += ALPHA[Math.floor(Math.random() * ALPHA.length)]; return s; }
  function normCode(v) { v = String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (v.length !== 5 || !L2S[v[0]]) return null; for (var i = 1; i < 5; i++) if (ALPHA.indexOf(v[i]) < 0) return null; return v[0] + '-' + v.slice(1); }
  function rng(seed) { return KG.rng(seed); }
  function shuf(arr, r) { var a = arr.slice(), i, j, t; for (i = a.length - 1; i > 0; i--) { j = Math.floor(r() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function root(html) { stage.innerHTML = '<div class="cr du">' + html + '</div>'; }
  function clearTimers() { clearInterval(tick); clearTimeout(nextT); clearTimeout(endT); clearInterval(hiT); clearInterval(goneT); }

  /* ───────── red: Realtime de Supabase por WebSocket (solo broadcast, sin persistencia) ───────── */
  function Net(code, onmsg, onstate) {
    var ws, hb, joined = false, closed = false, ref = 1, topic = 'realtime:kgduelo-' + code.replace('-', ''), tmo;
    function raw(o) { try { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); } catch (e) {} }
    this.send = function (m) { if (joined) raw({ topic: topic, event: 'broadcast', payload: { type: 'broadcast', event: 'm', payload: m }, ref: String(++ref) }); };
    this.close = function () { closed = true; clearInterval(hb); clearTimeout(tmo); try { if (ws) ws.close(); } catch (e) {} };
    this.open = function () {
      try { ws = new WebSocket(WS); } catch (e) { onstate('error'); return; }
      tmo = setTimeout(function () { if (!joined && !closed) { closed = true; try { ws.close(); } catch (e) {} onstate('error'); } }, 9000);
      ws.onopen = function () { raw({ topic: topic, event: 'phx_join', payload: { config: { broadcast: { self: false, ack: false }, presence: { key: '' }, private: false }, access_token: KEY }, ref: '1', join_ref: '1' }); };
      ws.onmessage = function (e) {
        if (typeof e.data !== 'string' || e.data.length > 6000) return; var m; try { m = JSON.parse(e.data); } catch (x) { return; }
        if (!m || typeof m !== 'object' || m.topic !== topic) return;
        if (m.event === 'phx_reply' && m.ref === '1' && !joined) { if (m.payload && m.payload.status === 'ok') { joined = true; clearTimeout(tmo); hb = setInterval(function () { raw({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(++ref) }); }, 25000); onstate('ok'); } else { closed = true; clearTimeout(tmo); onstate('error'); } }
        else if (m.event === 'broadcast' && m.payload && m.payload.event === 'm') onmsg(m.payload.payload);
        else if ((m.event === 'phx_error' || m.event === 'phx_close') && joined && !closed) { closed = true; onstate('lost'); }
      };
      ws.onerror = function () { if (!closed && !joined) { closed = true; clearTimeout(tmo); onstate('error'); } };
      ws.onclose = function () { if (!closed) { closed = true; clearTimeout(tmo); onstate(joined ? 'lost' : 'error'); } };
    };
  }
  function say(m) { m.id = me.id; if (net && !solo) net.send(m); }

  /* ───────── escenas ───────── */
  function lobby(msg) {
    clearTimers(); if (net) { net.close(); net = null; } R = null; solo = false;
    var sp = KG.sport, url = (function () { try { return new URLSearchParams(location.search).get('sala'); } catch (e) { return null; } })(), pre = normCode(url) || '';
    root('<div class="cr-intro"><small class="kg-mono">Online · hasta ' + MAXP + ' jugadores · sin registro</small><h2>Duelo del <em>míster</em></h2>' +
      '<p>Crea una sala, pasa el código a tus amigos y responded a la <b>misma jugada táctica</b> a la vez. Gana quien decida mejor y más rápido. <b>No se guarda nada</b>: la sala desaparece cuando salís.</p>' +
      (msg ? '<p class="du-msg">' + KG.esc(msg) + '</p>' : '') +
      '<label class="cr-name"><span class="kg-mono">Tu apodo</span><input id="du-nm" maxlength="14" placeholder="Míster" autocomplete="off"></label>' +
      '<div class="du-two"><div class="du-box"><b>Crear sala</b><small>' + KG.sports[sp].n + ' · el código incluye el deporte</small><button class="kg-btn pri" id="du-new" type="button">Crear sala</button></div>' +
      '<div class="du-box"><b>Unirme con código</b><input id="du-cd" maxlength="7" placeholder="F-K7M2" autocomplete="off" value="' + KG.esc(pre) + '"><button class="kg-btn" id="du-jn" type="button">Unirme</button></div></div>' +
      '<p class="cr-fine">Los mensajes viajan por un canal de tiempo real y no se almacenan. Quien tenga el código y tu apodo en pantalla verá tu apodo durante la partida; nada más.</p></div>');
    KG.$('#du-new').addEventListener('click', function () { me.n = clean(KG.$('#du-nm').value) || 'Míster'; create(); });
    KG.$('#du-jn').addEventListener('click', function () { var c = normCode(KG.$('#du-cd').value); if (!c) { KG.toast('El código tiene la forma F-K7M2'); return; } me.n = clean(KG.$('#du-nm').value) || 'Míster'; join(c); });
  }
  function connecting(txt) { clearTimers(); root('<div class="cr-intro"><small class="kg-mono">Conectando</small><h2>' + KG.esc(txt) + '</h2><div class="du-spin"></div></div>'); }
  function fail(code, why, canSolo) {
    clearTimers(); if (net) { net.close(); net = null; }
    root('<div class="cr-intro"><small class="kg-mono">Sin conexión</small><h2>No he podido <em>conectar</em></h2><p>' + KG.esc(why) + '</p>' +
      '<div class="du-two"><button class="kg-btn pri" id="du-re" type="button">Reintentar</button>' + (canSolo ? '<button class="kg-btn" id="du-so" type="button">Probar en solitario</button>' : '') + '<button class="kg-btn" id="du-bk" type="button">Volver</button></div></div>');
    KG.$('#du-re').addEventListener('click', function () { if (R && R.host) create(code); else if (code) join(code); else lobby(); });
    if (canSolo) KG.$('#du-so').addEventListener('click', function () { solo = true; newRoom(code || newCode(KG.sport), true); wait(); });
    KG.$('#du-bk').addEventListener('click', function () { lobby(); });
  }
  function newRoom(code, host) {
    R = { code: code, sport: L2S[code[0]], host: host, hostId: host ? me.id : null, hostSeen: Date.now(), state: 'l', players: {}, phase: 'wait', round: -1, seed: 0, N: ROUNDS, ans: {}, tot: {}, joined: Date.now(), full: false };
    R.players[me.id] = { n: me.n, seen: Date.now(), score: 0 };
    KG.setSport(R.sport, true);
  }
  function create(code0) {
    var sp = KG.sport, code = code0 || newCode(sp); connecting('Creando sala…'); newRoom(code, true);
    net = new Net(code, onmsg, function (s) {
      if (s === 'ok') { hello(); endT = setTimeout(function () { /* si nadie más es anfitrión, la sala es nuestra */ if (R && R.host && !R.clash) wait(); }, 1500); }
      else if (s === 'error') fail(code, 'El servicio de salas no responde. Comprueba tu conexión o prueba en solitario.', true);
      else if (s === 'lost') fail(code, 'Se ha perdido la conexión con la sala.', false);
    }); net.open();
  }
  function join(code) {
    connecting('Buscando sala ' + code + '…'); newRoom(code, false);
    net = new Net(code, onmsg, function (s) {
      if (s === 'ok') { hello(); endT = setTimeout(function () { if (R && !R.hostId) { lobby('No encuentro la sala ' + code + '. Comprueba el código o pide a tu amigo que la cree primero.'); } }, 3500); }
      else if (s === 'error') fail(code, 'El servicio de salas no responde. Comprueba tu conexión.', false);
      else if (s === 'lost') fail(code, 'Se ha perdido la conexión con la sala.', false);
    }); net.open();
  }
  function hello() { clearInterval(hiT); beat(); hiT = setInterval(beat, HI); clearInterval(goneT); goneT = setInterval(sweep, 1000); }
  function beat() { if (!R) return; var m = { t: 'hi', n: me.n, h: R.host ? 1 : 0, s: R.state }; if (R.host) m.ids = Object.keys(R.players).slice(0, MAXP); say(m); }
  function sweep() {
    if (!R) return; var now = Date.now(), id, ch = false;
    for (id in R.players) if (id !== me.id && now - R.players[id].seen > GONE) { delete R.players[id]; ch = true; delete R.ans[id]; }
    if (!R.host && R.hostId && now - R.hostSeen > GONE) { return fail(R.code, 'El anfitrión ha salido y la sala se ha cerrado.', false); }
    if (ch) { if (R.phase === 'wait') paintList(); if (R.host && R.phase === 'play') maybeFinish(); }
  }

  /* ───────── mensajes entrantes (todo es dato no confiable) ───────── */
  function onmsg(m) {
    if (!R || !m || typeof m !== 'object' || !MSGS[m.t] || typeof m.id !== 'string' || !/^[a-z0-9]{8}$/.test(m.id) || m.id === me.id) return;
    var now = Date.now(), p = R.players[m.id];
    if (m.t === 'hi') {
      if (!p) { if (Object.keys(R.players).length >= MAXP) return; p = R.players[m.id] = { n: 'Míster', seen: now, score: 0 }; if (R.phase === 'wait') { /* nuevo en la sala */ } }
      p.seen = now; p.n = clean(m.n) || 'Míster';
      if (m.h === 1) {
        if (!R.host && Array.isArray(m.ids)) R.hostIds = m.ids.filter(function (x) { return typeof x === 'string' && /^[a-z0-9]{8}$/.test(x); }).slice(0, MAXP);
        if (R.host && !R.clash && m.id < me.id && R.phase === 'wait') { R.clash = true; return lobby('Ese código ya estaba en uso. Crea la sala otra vez.'); }
        if (!R.host) { if (!R.hostId) { R.hostId = m.id; } if (R.hostId === m.id) { R.hostSeen = now; var was = R.state; R.state = m.s === 'p' ? 'p' : 'l'; if (!R.shown) { R.shown = true; clearTimeout(endT); if (R.state === 'p' && R.phase === 'wait') return fail(R.code, 'La partida ya ha empezado. Espera a que acabe e inténtalo de nuevo.', false); R.joined = now; wait(); setTimeout(function () { if (R && !R.host && R.phase === 'wait' && R.hostIds && R.hostIds.length >= MAXP && R.hostIds.indexOf(me.id) < 0) lobby('La sala está llena (máximo ' + MAXP + ' jugadores).'); }, 4500); } else if (R.phase === 'wait') paintList(); } }
      } else if (R.phase === 'wait') paintList();
      if (R.host && R.phase === 'wait' && Object.keys(R.players).length > 1) paintList();
      return;
    }
    if (!p) return; p.seen = now;
    if (m.t === 'an') {
      if (!R.host || R.phase !== 'play' || num(m.r, -1, 99) !== R.round || R.ans[m.id]) return;
      R.ans[m.id] = { k: num(m.k, 0, 2), ms: num(m.ms, 0, ANS) }; maybeFinish(); return;
    }
    if (m.id !== R.hostId) return; /* solo el anfitrión manda rondas, resultados y finales */
    R.hostSeen = now;
    if (m.t === 'go') { if (R.phase === 'wait' || R.phase === 'reveal') startRound(num(m.r, 0, ROUNDS - 1), num(m.seed, 1, 4294967295), num(m.N, 3, ROUNDS)); }
    else if (m.t === 'rs') { if ((R.phase === 'play' || R.phase === 'late') && num(m.r, -1, 99) === R.round) { var res = [], tot = {}, i, a; a = Array.isArray(m.p) ? m.p.slice(0, MAXP) : []; for (i = 0; i < a.length; i++) { var q = a[i]; if (Array.isArray(q) && typeof q[0] === 'string' && /^[a-z0-9]{8}$/.test(q[0])) res.push({ id: q[0], k: num(q[1], -1, 2), ms: num(q[2], 0, ANS), pts: num(q[3], 0, 400), tot: num(q[4], 0, 5000) }); } reveal(res); } }
    else if (m.t === 'en') { if (R.phase === 'reveal' || R.phase === 'play' || R.phase === 'late') podium(); }
    else if (m.t === 'lb') { R.phase = 'wait'; R.state = 'l'; R.round = -1; var id2; for (id2 in R.players) R.players[id2].score = 0; wait(); }
  }

  /* ───────── sala de espera ───────── */
  function colorOf(id) { var ids = Object.keys(R.players).sort(), i = ids.indexOf(id); return PAL[(i < 0 ? 0 : i) % PAL.length]; }
  function chip(id) { var p = R.players[id] || { n: '?' }; return '<span class="du-av" style="--c:' + colorOf(id) + '">' + KG.esc((p.n || '?')[0].toUpperCase()) + '</span>'; }
  function listHtml() {
    var ids = Object.keys(R.players).sort(function (a, b) { return a === R.hostId ? -1 : b === R.hostId ? 1 : a < b ? -1 : 1; });
    return ids.map(function (id) { var p = R.players[id]; return '<li>' + chip(id) + '<span>' + KG.esc(p.n) + (id === me.id ? ' · tú' : '') + '</span>' + (id === R.hostId ? '<em>anfitrión</em>' : '') + '</li>'; }).join('');
  }
  function paintList() { var el = KG.$('#du-pl'), n = Object.keys(R.players).length; if (el) el.innerHTML = listHtml(); var c = KG.$('#du-cnt'); if (c) c.textContent = n + ' de ' + MAXP; var b = KG.$('#du-st'); if (b) b.textContent = n < 2 ? 'Probar en solitario' : 'Empezar partida'; }
  function wait() {
    clearInterval(tick); clearTimeout(nextT); R.phase = 'wait'; R.state = 'l'; if (R.host && !R.hostId) R.hostId = me.id; if (R.host) beat();
    var url = location.origin + location.pathname + '?sala=' + R.code;
    root('<div class="cr-squad"><small class="kg-mono">Sala · ' + KG.sports[R.sport].n + '</small><h2 class="du-code">' + KG.esc(R.code) + '</h2>' +
      '<p>' + (solo ? 'Estás en modo solitario (sin conexión).' : 'Pasa este código a tus amigos o comparte el enlace. Todos juegan en <b>' + KG.sports[R.sport].n + '</b>.') + '</p>' +
      (solo ? '' : '<div class="du-two"><button class="kg-btn" id="du-cp" type="button">Copiar código</button><button class="kg-btn" id="du-sh" type="button">Compartir enlace</button></div>') +
      '<div class="du-pl"><small class="kg-mono">Jugadores · <b id="du-cnt"></b></small><ul id="du-pl"></ul></div>' +
      (R.host ? '<button class="kg-btn pri" id="du-st" type="button">Empezar partida</button><p class="cr-fine">' + ROUNDS + ' jugadas · ' + (ANS / 1000) + ' s por jugada · puntos por acertar y por rapidez.</p>' : '<p class="du-msg">Esperando a que el anfitrión empiece…</p>') +
      '<button class="kg-btn" id="du-lv" type="button">Salir de la sala</button></div>');
    paintList();
    var cp = KG.$('#du-cp'); if (cp) cp.addEventListener('click', function () { try { navigator.clipboard.writeText(R.code).then(function () { KG.toast('Código copiado'); }, function () { KG.toast(R.code); }); } catch (e) { KG.toast(R.code); } });
    var sh = KG.$('#du-sh'); if (sh) sh.addEventListener('click', function () { var tx = 'Te reto al Duelo del míster de KINET OS (' + KG.sports[R.sport].n + '). Sala ' + R.code + ': ' + url; if (navigator.share) navigator.share({ text: tx }).catch(function () {}); else { try { navigator.clipboard.writeText(tx).then(function () { KG.toast('Enlace copiado'); }, function () { KG.toast(url); }); } catch (e) { KG.toast(url); } } });
    KG.$('#du-lv').addEventListener('click', function () { lobby(); });
    var st = KG.$('#du-st'); if (st) st.addEventListener('click', hostStart);
  }

  /* ───────── partida ───────── */
  function hostStart() {
    if (!R || !R.host) return; var id, seed = (Math.random() * 4294967295 >>> 0) || 7; R.state = 'p'; R.seed = seed; R.N = ROUNDS; for (id in R.players) R.players[id].score = 0; R.tot = {};
    say({ t: 'go', r: 0, seed: seed, N: R.N }); beat(); startRound(0, seed, R.N);
  }
  function scenario(r) {
    var pool = KGC.A[R.sport].concat(KGC.D[R.sport]), ord = shuf(pool.map(function (x, i) { return i; }), rng(R.seed)), d = pool[ord[r % pool.length]], op = shuf([0, 1, 2], rng(R.seed + 7919 * (r + 1)));
    return { d: d, ord: op, atk: KGC.A[R.sport].indexOf(d) >= 0 };
  }
  function startRound(r, seed, N) {
    R.phase = 'play'; R.state = 'p'; R.round = r; R.seed = seed; R.N = N; R.ans = {}; R.mine = null; R.sc = scenario(r); R.t0 = performance.now(); clearTimeout(nextT); clearInterval(tick); clearTimeout(endT);
    var sc = R.sc, d = sc.d, letters = 'ABC';
    root('<div class="du-top"><span class="kg-mono">Jugada ' + (r + 1) + ' de ' + N + '</span><span class="du-tm" id="du-tm">' + (ANS / 1000) + '</span></div><div class="du-bar"><i id="du-br"></i></div>' +
      '<div class="cr-mm ' + (sc.atk ? 'att' : 'def') + '"><small class="kg-mono">' + (sc.atk ? 'Tu equipo ataca' : 'El rival ataca') + '</small><h3>' + KG.esc(d[0]) + '</h3><div class="cr-opts">' +
      sc.ord.map(function (oi, k) { return '<button type="button" class="cr-o" data-k="' + k + '"><i>' + letters[k] + '</i><span>' + KG.esc(d[1][oi]) + '</span></button>'; }).join('') + '</div><p class="du-wait" id="du-w"></p></div><div class="du-who" id="du-wh"></div>');
    KG.$$('.cr-o').forEach(function (b) { b.addEventListener('click', function () { answer(+b.dataset.k); }); });
    tick = setInterval(function () {
      var el = performance.now() - R.t0, left = Math.max(0, ANS - el), br = KG.$('#du-br'), tm = KG.$('#du-tm'); if (br) br.style.width = (left / ANS * 100) + '%'; if (tm) tm.textContent = Math.ceil(left / 1000);
      if (left <= 0) { clearInterval(tick); lock(); var w = KG.$('#du-w'); if (w && R.mine == null) w.textContent = 'Tiempo agotado. Esperando resultados…'; if (R.host) endT = setTimeout(finishRound, 900); else endT = setTimeout(function () { if (R && R.phase === 'play' && !R.host) { R.phase = 'late'; } }, 6000); }
    }, 100);
    paintWho();
  }
  function lock() { KG.$$('.cr-o').forEach(function (b) { b.disabled = true; }); }
  function paintWho() { var el = KG.$('#du-wh'); if (!el || !R) return; el.innerHTML = Object.keys(R.players).sort().map(function (id) { return '<span class="du-pp' + (R.ans[id] || (id === me.id && R.mine != null) ? ' ok' : '') + '">' + chip(id) + '</span>'; }).join(''); }
  function answer(k) {
    if (!R || R.phase !== 'play' || R.mine != null) return; var ms = Math.min(ANS, Math.round(performance.now() - R.t0)); R.mine = { k: k, ms: ms }; KG.beep(520, .05, 'triangle', .05);
    KG.$$('.cr-o').forEach(function (b, i) { b.disabled = true; b.classList.toggle('pick', i === k); }); var w = KG.$('#du-w'); if (w) w.textContent = 'Respuesta enviada. Esperando a los demás…';
    if (R.host) { R.ans[me.id] = { k: k, ms: ms }; maybeFinish(); } else say({ t: 'an', r: R.round, k: k, ms: ms }); paintWho();
  }
  function maybeFinish() { if (!R || !R.host || R.phase !== 'play') { return; } paintWho(); var ids = Object.keys(R.players), i; for (i = 0; i < ids.length; i++) if (!R.ans[ids[i]]) return; clearTimeout(endT); setTimeout(finishRound, 400); }
  function finishRound() {
    if (!R || !R.host || R.phase !== 'play') return; clearInterval(tick); clearTimeout(endT); var ids = Object.keys(R.players), out = [], sc = R.sc;
    ids.forEach(function (id) {
      var a = R.ans[id], pts = 0, k = -1, ms = ANS, q;
      if (a) { k = a.k; ms = a.ms; q = sc.ord[k] === 0 ? 2 : sc.ord[k] === 1 ? 1 : 0; pts = q === 2 ? 100 + Math.round((1 - ms / ANS) * 60) : q === 1 ? 35 : 0; }
      R.players[id].score += pts; out.push({ id: id, k: k, ms: ms, pts: pts, tot: R.players[id].score });
    });
    say({ t: 'rs', r: R.round, p: out.map(function (o) { return [o.id, o.k, o.ms, o.pts, o.tot]; }) }); reveal(out);
  }
  function reveal(res) {
    clearInterval(tick); clearTimeout(endT); R.phase = 'reveal'; var sc = R.sc, d = sc.d, by = {}, i, letters = 'ABC', last = R.round >= R.N - 1;
    res.forEach(function (o) { by[o.id] = o; if (!R.players[o.id]) R.players[o.id] = { n: 'Míster', seen: Date.now(), score: 0 }; R.players[o.id].score = o.tot; });
    var rank = res.slice().sort(function (a, b) { return b.tot - a.tot || b.pts - a.pts; }), mine = by[me.id];
    root('<div class="du-top"><span class="kg-mono">Jugada ' + (R.round + 1) + ' de ' + R.N + ' · resultado</span><span class="du-tm">' + (mine ? '+' + mine.pts : '') + '</span></div>' +
      '<div class="cr-mm ' + (sc.atk ? 'att' : 'def') + '"><h3>' + KG.esc(d[0]) + '</h3><div class="cr-opts">' +
      sc.ord.map(function (oi, k) { var cls = oi === 0 ? 'ok' : (mine && mine.k === k ? (oi === 1 ? 'mid' : 'bad') : ''); return '<div class="cr-o ' + cls + '"><i>' + letters[k] + '</i><span>' + KG.esc(d[1][oi]) + '</span><s class="du-pk">' + res.filter(function (o) { return o.k === k; }).map(function (o) { return chip(o.id); }).join('') + '</s></div>'; }).join('') + '</div>' +
      '<div class="cr-fb good"><b>Lo mejor:</b> ' + KG.esc(d[1][0]) + '. ' + KG.esc(d[2]) + '</div></div>' +
      '<ol class="du-rk">' + rank.map(function (o, n) { return '<li' + (o.id === me.id ? ' class="me"' : '') + '><b>' + (n + 1) + '</b>' + chip(o.id) + '<span>' + KG.esc((R.players[o.id] || {}).n || '?') + '</span><em>' + (o.k < 0 ? 'sin respuesta' : '+' + o.pts) + '</em><strong>' + o.tot + '</strong></li>'; }).join('') + '</ol>' +
      '<p class="cr-fine" id="du-nx">' + (last ? 'Última jugada. Resultado final en unos segundos…' : 'Siguiente jugada en unos segundos…') + '</p>');
    if (mine && mine.pts >= 100) KG.sfx.ok(); else KG.sfx.tick();
    if (R.host) nextT = setTimeout(function () { if (!R || R.phase !== 'reveal') return; if (last) { say({ t: 'en' }); podium(); } else { var seed = R.seed; say({ t: 'go', r: R.round + 1, seed: seed, N: R.N }); startRound(R.round + 1, seed, R.N); } }, NEXT);
  }
  function podium() {
    clearInterval(tick); clearTimeout(nextT); clearTimeout(endT); R.phase = 'end'; R.state = 'l'; var ids = Object.keys(R.players).sort(function (a, b) { return R.players[b].score - R.players[a].score || (a < b ? -1 : 1); }), win = R.players[ids[0]], mineWin = ids[0] === me.id && ids.length > 1;
    root('<div class="cr-champ on"><small class="kg-mono">Final · ' + KG.sports[R.sport].n + '</small>' + (ids.length > 0 ? '<svg class="cr-trophy" viewBox="0 0 120 140" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M34 16h52v34a26 26 0 01-52 0zM34 24H14v10a20 20 0 0020 20M86 24h20v10a20 20 0 01-20 20M60 76v26M38 124h44M46 102h28v22H46z"/></svg>' : '') +
      '<h2>' + KG.esc(win.n) + (ids.length > 1 ? ' es el <em>míster</em>' : ' · entrenamiento') + '</h2><ol class="du-rk">' + ids.map(function (id, n) { var p = R.players[id]; return '<li' + (id === me.id ? ' class="me"' : '') + '><b>' + (n + 1) + '</b>' + chip(id) + '<span>' + KG.esc(p.n) + '</span><strong>' + p.score + '</strong></li>'; }).join('') + '</ol>' +
      '<div class="du-two">' + (R.host ? '<button class="kg-btn pri" id="du-ag" type="button">Otra partida</button>' : '<p class="du-msg">El anfitrión puede empezar otra partida.</p>') + '<button class="kg-btn" id="du-ex" type="button">Salir</button></div></div>');
    KG.sfx.win(); var rr = KG.$('.cr-champ').getBoundingClientRect(); [.25, .5, .75].forEach(function (f, i) { setTimeout(function () { KG.burst(rr.left + rr.width * f, rr.top + rr.height * .3, KG.sports[R.sport].c, 30); }, i * 220); });
    var ag = KG.$('#du-ag'); if (ag) ag.addEventListener('click', function () { say({ t: 'lb' }); R.phase = 'wait'; R.round = -1; var id; for (id in R.players) R.players[id].score = 0; wait(); });
    KG.$('#du-ex').addEventListener('click', function () { lobby(); });
    if (R.host) beat();
  }

  window.addEventListener('pagehide', function () { clearInterval(hiT); if (net) net.close(); });
  KG.onSport(function () { if (!R) lobby(); });
  lobby();
})();
