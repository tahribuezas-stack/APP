/* KINET OS · entrevista de bienvenida (motor compartido)
   - Conversación guiada por huecos: pregunta solo lo que falta, adaptada al deporte y al puesto.
   - Si hay IA (KinetAPIs.onboardingTurn) redacta cada turno de forma natural y extrae datos; si no, usa su banco de preguntas local.
   - Lee lo que el usuario escribe (club, ciudad, ciudad natal, lateralidad, días, horarios, partidos…) y lo deja limpio.
   - Genera el calendario semanal a partir de lo que ha contado (sin patrón por defecto) y lo deja listo para el Vestuario. */
(function (root) {
  'use strict';
  var KT = root.KinetText || { parse: function () { return {}; }, laterality: function () { return null; }, city: function (v) { return v; }, club: function (v) { return v; } };
  var DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var DAYS_UP = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  var NUM = { un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7 };
  var MONTHS = { enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9, noviembre: 10, diciembre: 11 };
  var FIELD_W = 'campo|pista|cancha|ring|ruta|calle|tartán|tartan|piscina|rodaje|sparring|entreno\\s+t[eé]cnico|t[eé]cnica|series';
  var GYM_W = 'gym|gimnasio|pesas|fuerza|sala';
  var R_NO = /^\s*(?:no|nada|ninguna?|ninguno|ning[uú]n|sin\s+\w+|no\s+(?:tengo|hay|compito|juego|me\s+duele)[^.]*|todo\s+bien|estoy\s+bien|de\s+momento\s+no|por\s+ahora\s+no)\b/i;

  function cleanPhrase(t, kind) {
    t = String(t || '').replace(/^[\s,;.:¡!¿?]+|[\s,;.]+$/g, '');
    if (kind === 'strength') t = t.replace(/^(?:lo\s+)?(?:que\s+)?mejor(?:\s+(?:de\s+mi\s+juego|se\s+me\s+da|que\s+hago))?(?:\s+es|\s+son)?\s*(?:mi|el|la|los|las)?\s*/i, '').replace(/^(?:mi\s+(?:mejor\s+)?(?:virtud|fuerte|punto\s+fuerte)\s+(?:es|son)\s+)/i, '').replace(/^(?:soy\s+(?:muy\s+)?bueno\s+(?:en|con)\s+)/i, '');
    if (kind === 'weakness') t = t.replace(/^(?:y\s+)?(?:quiero\s+|me\s+gustar[ií]a\s+|necesito\s+)?(?:mejorar|trabajar|pulir)\s+/i, '').replace(/^(?:lo\s+que\s+)?(?:me\s+)?(?:falta|cuesta)\s+(?:es\s+)?/i, '');
    t = t.replace(/^(?:mi|mis|el|la|los|las)\s+(?=\S)/i, kind === 'weakness' ? '' : '$&');
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function norm(t) { return String(t || '').toLowerCase(); }
  function num(w) { return /^\d+$/.test(w) ? parseInt(w, 10) : (NUM[w] || 0); }
  function uniq(a) { return Array.from(new Set(a)); }
  function pick(arr, seed) { return arr[Math.abs(seed | 0) % arr.length]; }

  /* ---------- vocabulario por deporte ---------- */
  var SPORTS = {
    futbol: { field: 'campo', fieldPl: 'sesiones de campo', comp: 'partido', compPl: 'partidos', place: 'club', gameQ: function (p) { return 'Hablemos de tu juego' + (p ? ' como ' + p : '') + ': ¿qué es lo que mejor se te da y qué quieres mejorar primero?'; }, latQ: '¿Eres diestro o zurdo de pierna?', inj: 'isquios, tobillo o rodilla', mom: 'una semana de partido' },
    baloncesto: { field: 'pista', fieldPl: 'sesiones de pista', comp: 'partido', compPl: 'partidos', place: 'club', gameQ: function (p) { return 'Sobre tu juego' + (p ? ' de ' + p : '') + ': ¿cuál es tu mejor arma en pista y qué punto flojo quieres trabajar primero?'; }, latQ: '¿Eres diestro o zurdo? (influye en cómo te defienden y en tu lado fuerte de ataque)', inj: 'tobillos, rodillas o espalda', mom: 'una semana de partido' },
    padel: { field: 'pista', fieldPl: 'sesiones de pista', comp: 'partido', compPl: 'partidos o torneos', place: 'club', gameQ: function (p) { return 'En la pista' + (p ? ' (' + p + ')' : '') + ': ¿qué golpe o situación se te da mejor y cuál quieres pulir primero?'; }, latQ: '¿Juegas con la derecha o con la izquierda?', inj: 'codo, hombro o muñeca', mom: 'una semana de torneo' },
    boxeo: { field: 'ring o saco', fieldPl: 'sesiones técnicas', comp: 'combate', compPl: 'combates', place: 'gimnasio', gameQ: function (p) { return 'Sobre tu estilo' + (p ? ' (' + p + ')' : '') + ': ¿cuál es tu mejor arma arriba del ring y qué quieres corregir primero?'; }, latQ: '¿Peleas ortodoxo (diestro) o zurdo?', inj: 'manos, hombros o cuello', mom: 'un campamento de combate' },
    running: { field: 'pista o ruta', fieldPl: 'sesiones de pista o rodaje', comp: 'carrera', compPl: 'carreras', place: 'club o grupo de entrenamiento', gameQ: function (p) { return 'Hablemos de tu carrera' + (p ? ' como ' + p : '') + ': ¿en qué eres más fuerte (ritmo, final, resistencia…) y qué quieres mejorar primero?'; }, latQ: '¿Eres diestro o zurdo? (solo lo uso para ajustar tu fisio y tu zancada)', inj: 'gemelos, periostio o tendón de Aquiles', mom: 'una semana de carrera' },
    otros: { field: 'entreno específico', fieldPl: 'sesiones específicas', comp: 'competición', compPl: 'competiciones', place: 'club o centro', gameQ: function () { return 'Sobre tu disciplina: ¿en qué eres más fuerte y qué quieres mejorar primero?'; }, latQ: '¿Eres diestro o zurdo?', inj: 'tus zonas de más carga', mom: 'una semana de competición' }
  };

  /* ---------- extracción local de lo que escribe el usuario ---------- */
  function parseDays(clauseText) {
    var res = [];
    var re = /\b(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bados?|domingos?)\b/g, m;
    while ((m = re.exec(clauseText))) {
      var w = m[1].replace('é', 'e').replace('á', 'a');
      var idx = w.indexOf('lun') === 0 ? 1 : w.indexOf('mar') === 0 ? 2 : w.indexOf('mie') === 0 ? 3 : w.indexOf('jue') === 0 ? 4 : w.indexOf('vie') === 0 ? 5 : w.indexOf('sab') === 0 ? 6 : 0;
      res.push({ idx: idx, pos: m.index, end: m.index + m[0].length });
    }
    return res;
  }

  function extractSchedule(text, topic) {
    var lower = norm(text), out = { fieldDays: [], gymDays: [], matchDays: [], restDays: [], fieldCount: null, gymCount: null, prefTime: '', noMatches: false, dates: [] };
    var GYM = new RegExp('\\b(?:' + GYM_W + ')\\b'), FIELD = new RegExp('\\b(?:' + FIELD_W + ')\\b');
    var MATCH = /\b(?:partidos?|competici[oó]n(?:es)?|jornada|torneos?|combates?|peleas?|carreras?|campeonato|liga|encuentros?|prueba|competir|compito|juego)\b/;
    var REST = /\b(?:descanso|libre|descanso|no\s+entreno)\b/;

    // 1) días + tipo, cláusula a cláusula
    lower.split(/[•·.;+,\n]+|\by\b(?=\s+(?:los\s+|el\s+)?(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\b[^,;.]*\b(?:partido|gym|gimnasio|campo|pista)\b)/).forEach(function (cl) {
      var hits = parseDays(cl);
      if (!hits.length) return;
      var typeOf = function (t) { return MATCH.test(t) && !GYM.test(t) ? 'match' : GYM.test(t) ? 'gym' : REST.test(t) ? 'rest' : FIELD.test(t) ? 'field' : null; };
      var prefix = cl.slice(0, hits[0].pos);
      var types = hits.map(function (h, k) { return typeOf(cl.slice(h.end, k + 1 < hits.length ? hits[k + 1].pos : cl.length)); });
      for (var k = hits.length - 1; k >= 0; k--) if (!types[k]) types[k] = (k + 1 < hits.length ? types[k + 1] : null);
      hits.forEach(function (h, k) {
        var t = types[k] || typeOf(prefix) || (topic === 'matches' ? 'match' : topic === 'schedule_days' ? null : (topic === 'schedule' ? 'field' : null));
        if (t === 'match') out.matchDays.push(h.idx); else if (t === 'gym') out.gymDays.push(h.idx); else if (t === 'rest') out.restDays.push(h.idx); else if (t === 'field') out.fieldDays.push(h.idx);
      });
    });

    // 2) cantidades: "2 días de campo", "campo 2 días", "dos de gimnasio"
    var cnt = function (kind, words) {
      var pats = [
        new RegExp('\\b(\\d|un|una|dos|tres|cuatro|cinco|seis|siete)\\s+(?:d[ií]as?|veces|sesiones)?\\s*(?:a\\s+la\\s+semana\\s+)?(?:de|en|a|para)?\\s*(?:' + words + ')\\b', 'g'),
        new RegExp('\\b(?:' + words + ')\\s*(?::|=|-)?\\s*(\\d|un|una|dos|tres|cuatro|cinco|seis|siete)\\s*(?:d[ií]as?|veces|sesiones)?\\b', 'g')
      ];
      for (var i = 0; i < pats.length; i++) { var m = pats[i].exec(lower); if (m) { var n = num(m[1]); if (n >= 0 && n <= 7) return n; } }
      return null;
    };
    out.fieldCount = cnt('field', FIELD_W);
    out.gymCount = cnt('gym', GYM_W);
    if (/\b(?:no\s+(?:hago|voy|tengo)|sin)\s+(?:al\s+)?(?:gym|gimnasio|pesas|fuerza)\b/.test(lower)) out.gymCount = 0;

    // 3) horario preferido
    var h;
    if ((h = lower.match(/\b(?:a\s+las|sobre\s+las|desde\s+las|hacia\s+las|sobre|a)\s*(\d{1,2})(?:[:.h](\d{2}))?\s*(?:h|horas)?\b(?!\s*(?:d[ií]as?|veces|sesiones|kg|cm))/)) && +h[1] >= 5 && +h[1] <= 23 && /(?:a|sobre|desde|hacia)\s+las?/.test(h[0])) {
      out.prefTime = String(h[1]).padStart(2, '0') + ':' + (h[2] || '00');
    } else if (/\b(?:por\s+la\s+|de\s+|en\s+la\s+)?(?:ma[ñn]anas?|primera\s+hora|temprano|antes\s+de\s+(?:trabajar|clase))\b/.test(lower) && (topic === 'schedule_time' || /por\s+la\s+ma[ñn]ana|de\s+ma[ñn]ana|en\s+la\s+ma[ñn]ana|temprano|primera\s+hora/.test(lower))) out.prefTime = 'mañana';
    else if (/\b(?:por\s+la\s+|de\s+|en\s+la\s+|a\s+la\s+)?tardes?\b/.test(lower) && !/\btarde\s+(?:me|te)\s+/.test(lower)) out.prefTime = 'tarde';
    else if (/\b(?:por\s+la\s+|de\s+|en\s+la\s+)?noches?\b|\bdespu[eé]s\s+de\s+(?:trabajar|clase|cenar)\b/.test(lower)) out.prefTime = 'noche';
    else if (/\bmediod[ií]a\b/.test(lower)) out.prefTime = '13:00';

    // 4) sin partidos / fecha concreta
    if (/\b(?:no\s+(?:tengo|hay|juego|compito)\s+(?:ning[uú]n\s+)?(?:partidos?|competici[oó]n(?:es)?|combates?|carreras?|torneos?)|sin\s+(?:partidos?|competici[oó]n|combates?)|no\s+compito|todav[ií]a\s+no\s+(?:tengo|hay)|fuera\s+de\s+temporada|pretemporada)\b/.test(lower) || (topic === 'matches' && R_NO.test(lower))) out.noMatches = true;
    var dm = /\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/g, d;
    while ((d = dm.exec(lower))) {
      var now = new Date(), y = now.getFullYear(), dt = new Date(y, MONTHS[d[2]], +d[1]);
      if (dt < new Date(now.getFullYear(), now.getMonth(), now.getDate())) dt = new Date(y + 1, MONTHS[d[2]], +d[1]);
      out.dates.push(dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'));
    }
    ['fieldDays', 'gymDays', 'matchDays', 'restDays'].forEach(function (k) { out[k] = uniq(out[k]); });
    return out;
  }

  /* ---------- estado ---------- */
  function emptyState() {
    return { goal: '', club: '', noClub: false, city: '', hometown: '', laterality: '', strength: '', weakness: '', fieldDays: [], gymDays: [], matchDays: [], restDays: [], matchDates: [],
      fieldCount: null, gymCount: null, prefTime: '', noMatches: false, injuries: '', injAsked: false, sleepHours: null, autoDays: false };
  }

  /* ---------- planificador de semana ---------- */
  function timesFor(pref, kind, double) {
    var p = String(pref || '');
    var map = { mañana: { field: '09:30', gym: '08:00', match: '11:00' }, tarde: { field: '19:00', gym: '17:30', match: '18:00' }, noche: { field: '20:30', gym: '19:30', match: '20:00' } };
    var hm = p.match(/^(\d{1,2}):(\d{2})$/);
    if (hm) {
      var h = +hm[1], mm = hm[2], pad = function (n) { return String(n).padStart(2, '0'); };
      if (kind === 'gym' && double) return pad(Math.max(6, h - 2)) + ':' + mm;
      return pad(h) + ':' + mm;
    }
    var base = map[p] || map.tarde;
    if (double && kind === 'gym') return base.gym;
    return base[kind];
  }

  function buildWeek(S, sport, ctx) {
    var T = (root.KinetSport && root.KinetSport.terms) ? root.KinetSport.terms(sport) : null;
    var matchDays = uniq(S.matchDays);
    var fieldDays = uniq(S.fieldDays).filter(function (d) { return matchDays.indexOf(d) < 0; });
    var gymDays = uniq(S.gymDays).filter(function (d) { return matchDays.indexOf(d) < 0; });
    var wantField = S.fieldCount != null ? S.fieldCount : (fieldDays.length || 2);
    var wantGym = S.gymCount != null ? S.gymCount : (gymDays.length || 0);
    var chosenHard = fieldDays.concat(gymDays), auto = false;

    function penalty(d, type) {
      var p = 0;
      matchDays.forEach(function (m) {
        if ((d + 1) % 7 === m) p += type === 'gym' ? 6 : 1.5;      // víspera de partido
        if ((d + 6) % 7 === m) p += 3;                              // día después: recuperar
        if ((d + 2) % 7 === m && type === 'gym') p += 0.8;
      });
      chosenHard.forEach(function (c) { if (Math.abs(c - d) === 1 || Math.abs(c - d) === 6) p += type === 'field' ? 1 : 2; if (c === d) p += 5; });
      if (d === 0) p += 0.6;                                        // domingo: ligeramente menos
      return p;
    }
    function fill(list, want, type) {
      var guard = 0;
      while (list.length < want && guard++ < 7) {
        var best = null, bp = 1e9;
        [1, 2, 3, 4, 5, 6, 0].forEach(function (d) {
          if (list.indexOf(d) >= 0 || matchDays.indexOf(d) >= 0) return;
          var pn = penalty(d, type); if (pn < bp) { bp = pn; best = d; }
        });
        if (best == null) break;
        list.push(best); chosenHard.push(best); auto = true;
      }
      return list;
    }
    fieldDays = fill(fieldDays.slice(0, 7), wantField, 'field');
    gymDays = fill(gymDays.slice(0, 7), wantGym, 'gym');

    var fieldTitles = (T && T.week && T.week.field) || ['Sesión específica de ' + sport];
    var gymTitles = (T && T.week && T.week.gym) || ['Gimnasio: fuerza y prevención'];
    var icon = (T && T.icon) || '🏅';
    var compCap = (T && T.compCap) || 'Competición';
    var focus = (S.weakness || '').replace(/^(?:quiero\s+)?mejorar\s+/i, '').trim().slice(0, 34);
    var map = {}, fi = 0, gi = 0;
    for (var d = 0; d <= 6; d++) {
      var sessions = [], isMatch = matchDays.indexOf(d) >= 0, isField = fieldDays.indexOf(d) >= 0, isGym = gymDays.indexOf(d) >= 0, dbl = isField && isGym;
      if (isMatch) sessions.push({ type: 'match', icon: '🏆', time: timesFor(S.prefTime, 'match') + ' H', title: compCap + ' oficial', agentTarget: 'tactical' });
      else {
        if (isGym) sessions.push({ type: 'gym', icon: '🏋️', time: timesFor(S.prefTime, 'gym', dbl) + ' H', title: gymTitles[gi++ % gymTitles.length], agentTarget: 'physical' });
        if (isField) sessions.push({ type: 'field', icon: icon, time: timesFor(S.prefTime, 'field') + ' H', title: fieldTitles[fi++ % fieldTitles.length] + (focus && fi % 2 === 1 ? ' · foco: ' + focus : ''), agentTarget: 'tactical' });
        if (S.restDays.indexOf(d) >= 0 && !sessions.length) sessions.push({ type: 'rest', icon: '🩹', time: 'DÍA COMPLETO', title: 'Descanso y recuperación', agentTarget: 'physio' });
      }
      map[d] = { dayIndex: d, dayName: DAYS_UP[d], sessions: sessions };
      if (sessions.length) map[d].primaryType = sessions[0].type;
    }
    var custom = {};
    uniq(S.matchDates || []).forEach(function (k) { custom[k] = [{ id: 'onb_' + k, time: timesFor(S.prefTime, 'match') + ' H', title: compCap + ' oficial', type: 'match', done: false }]; });
    return { weekly: map, custom: custom, fieldDays: fieldDays, gymDays: gymDays, matchDays: matchDays, auto: auto };
  }

  function weekSummary(plan) {
    var rows = [];
    for (var i = 0; i < 7; i++) {
      var d = (i + 1) % 7, s = plan.weekly[d].sessions;
      rows.push({ d: d, short: DAYS_UP[d].slice(0, 3), label: DAYS_UP[d], items: s });
    }
    return rows;
  }

  /* ---------- entrevista ---------- */
  function Interview(opts) {
    this.o = opts; this.sport = opts.sport || 'Fútbol'; this.key = (root.KinetSport && root.KinetSport.key) ? root.KinetSport.key(this.sport) : 'futbol';
    this.V = SPORTS[this.key] || SPORTS.otros;
    this.S = emptyState(); this.history = []; this.topic = ''; this.turn = 0; this.busy = false; this.finished = false; this.confirmRounds = 0; this.plan = null; this.ackSeed = Math.floor(Math.random() * 9);
    this.firstName = (opts.firstName || '').split(' ')[0] || '';
    this.usedAI = false;
  }
  var P = Interview.prototype;

  P.nextTopic = function () {
    var S = this.S, hasF = S.fieldCount != null || S.fieldDays.length, hasG = S.gymCount != null || S.gymDays.length;
    if (!S.goal) return 'goal';
    if (!S.club && !S.noClub) return 'club';
    if (!S.city) return 'city';
    if (!S.hometown) return 'hometown';
    if (!S.laterality) return 'laterality';
    if (!S.strength || !S.weakness) return S.strength || S.weakness ? 'game_more' : 'game';
    if (!hasF && !hasG) return 'schedule';
    if (!S.prefTime) return 'schedule_time';
    var wantDays = (S.fieldCount || 0) + (S.gymCount || 0);
    if (!S.autoDays && ((S.fieldCount && S.fieldDays.length < S.fieldCount) || (S.gymCount && S.gymDays.length < S.gymCount)) && !(S.fieldDays.length + S.gymDays.length >= wantDays && wantDays > 0)) return 'schedule_days';
    if (!S.matchDays.length && !S.noMatches && !S.matchDates.length) return 'matches';
    if (!S.injAsked) return 'injuries';
    if (S.sleepHours == null) return 'sleep';
    return this.plan && !this.planOk ? 'confirm' : (this.plan ? 'done' : 'confirm');
  };

  P.bank = function (topic) {
    var S = this.S, V = this.V, pos = this.o.position || '', nm = this.firstName;
    var q = {
      goal: (nm ? '¡Hola, ' + nm + '! ' : '¡Hola! ') + 'Soy tu entrevistador de KINET. Ya sé que compites en **' + this.sport + '**' + (this.o.category ? ' (' + this.o.category + ')' : '') + (pos ? ' como **' + pos + '**' : '') + '. Para dejarlo todo a tu medida, empecemos por lo importante: ¿qué quieres conseguir esta temporada?',
      club: '¿En qué ' + V.place + ' entrenas o compites ahora mismo? Si estás sin equipo, dímelo sin problema.',
      city: '¿Y en qué ciudad vives actualmente?',
      hometown: S.city ? '¿Eres de ' + S.city + ' de toda la vida o naciste en otra ciudad?' : '¿En qué ciudad naciste?',
      laterality: V.latQ,
      game: V.gameQ(pos),
      game_more: S.strength ? 'Perfecto, eso ya me sirve como punto fuerte. ¿Y qué es lo que más quieres mejorar primero?' : 'Entendido lo que quieres mejorar. ¿Y cuál dirías que es tu mayor virtud?',
      schedule: 'Vamos con tu semana. ¿Cuántos días puedes hacer ' + V.fieldPl + ' y cuántos de gimnasio? Si algún día ya lo tienes fijado, cuéntamelo.',
      schedule_time: '¿Y a qué hora del día te viene mejor entrenar: por la mañana, por la tarde o por la noche? Puedes darme una hora concreta si la tienes clara.',
      schedule_days: '¿Qué días te vienen mejor para esas sesiones? Si prefieres, dime «propónmelo tú» y reparto la carga de forma lógica.',
      matches: '¿Cuándo son tus ' + V.compPl + '? Dime el día fijo de la semana (p. ej. los domingos) o una fecha concreta. Si ahora no tienes, también vale.',
      injuries: '¿Tienes alguna molestia o lesión previa que el fisio IA deba vigilar (' + V.inj + ')? Si no, simplemente «ninguna».',
      sleep: 'Última: ¿cuántas horas duermes de media? Me ayuda a ajustar la carga de ' + V.mom + '.'
    };
    return q[topic] || '';
  };

  P.chipsFor = function (topic) {
    var V = this.V;
    switch (topic) {
      case 'laterality': return this.key === 'boxeo' ? ['Ortodoxo (diestro)', 'Zurdo'] : this.key === 'padel' ? ['Derecha', 'Izquierda'] : ['Diestro', 'Zurdo', 'Ambidiestro'];
      case 'schedule_time': return ['Por la mañana', 'Por la tarde', 'Por la noche'];
      case 'schedule_days': return ['Propónmelo tú'];
      case 'matches': return ['Los sábados', 'Los domingos', 'No tengo ahora'];
      case 'injuries': return ['Ninguna'];
      case 'sleep': return ['6 horas', '7 horas', '8 horas'];
      case 'club': return ['Sin equipo ahora'];
      case 'hometown': return this.S.city ? ['Soy de aquí'] : [];
      case 'confirm': return ['Sí, perfecto', 'Quiero cambiar algo'];
      default: return [];
    }
  };

  /* lectura local de cada respuesta */
  P.absorb = function (text, topic) {
    var S = this.S, t = String(text || '').trim(), low = norm(t);
    if (!t) return;
    var lat = KT.laterality ? KT.laterality(t) : null;
    if (/ortodox/.test(low)) lat = 'Diestro';
    if (/^\s*(?:derecha|derechas)\s*$/i.test(t)) lat = 'Diestro'; else if (/^\s*(?:izquierda|izquierdas)\s*$/i.test(t)) lat = 'Zurdo';
    if (lat && (topic === 'laterality' || !S.laterality)) S.laterality = lat;

    // lugares: con marcadores siempre; sin marcadores según lo que se preguntó
    var hint = topic === 'club' ? 'club' : topic === 'city' ? 'city' : topic === 'hometown' ? 'hometown' : (this.firstPlaceAnswer ? '' : '');
    var noClubSaid = /\b(?:sin\s+(?:equipo|club)|no\s+(?:tengo|juego\s+en\s+ning[uú]n)\s*(?:equipo|club)?|estoy\s+libre|ning[uú]n\s+(?:equipo|club))\b/i.test(t) || (topic === 'club' && R_NO.test(t) && t.length < 30);
    if (noClubSaid) { S.noClub = true; S.club = ''; }
    if (topic === 'hometown' && /\b(?:soy\s+de\s+aqu[ií]|nac[ií]\s+aqu[ií]|de\s+aqu[ií]|la\s+misma|igual|mismo\s+sitio|aqu[ií]\s+mismo)(?![a-záéíóúñ])/i.test(t) && S.city) S.hometown = S.city;
    else {
      var pl = KT.parse ? KT.parse(noClubSaid ? t.replace(/\b(?:sin|ning[uú]n)\s+(?:equipo|club)\b/ig, '') : t, noClubSaid && topic === 'club' ? '' : hint) : {};
      var junk = /^(?:derecha|izquierda|diestro|zurdo|ortodoxo|ambidiestro|si|s[ií]|no)$/i;
      if (pl.club && !junk.test(pl.club) && (topic === 'club' || !S.club)) { S.club = pl.club; S.noClub = false; }
      if (pl.city && !junk.test(pl.city) && (topic === 'city' || !S.city)) S.city = pl.city;
      if (pl.hometown && !junk.test(pl.hometown) && (topic === 'hometown' || !S.hometown)) S.hometown = pl.hometown;
    }

    if (topic === 'goal') S.goal = t.slice(0, 240);
    if (topic === 'game' || topic === 'game_more') {
      var m = t.match(/^(.*?)\b(?:pero|aunque|sin\s+embargo|y\s+(?:quiero\s+)?mejorar|quiero\s+mejorar|a\s+mejorar)\b\s*(.*)$/is);
      if (m && m[2].trim()) { S.strength = cleanPhrase(m[1], 'strength').slice(0, 180) || S.strength; S.weakness = cleanPhrase(m[2], 'weakness').slice(0, 180); }
      else if (topic === 'game_more') { if (!S.strength) S.strength = cleanPhrase(t, 'strength').slice(0, 180); else S.weakness = cleanPhrase(t, 'weakness').slice(0, 180); }
      else { var w = t.match(/(?:quiero\s+mejorar|mejorar|me\s+falta|me\s+cuesta|d[eé]bil(?:es)?|flojo\s+en)\s+(.*)$/is); S.strength = cleanPhrase(w ? t.slice(0, w.index) : t, 'strength').slice(0, 180) || cleanPhrase(t, 'strength').slice(0, 180); if (w && w[1].trim()) S.weakness = cleanPhrase(w[1], 'weakness').slice(0, 180); }
    }
    if (topic === 'injuries') { S.injAsked = true; S.injuries = (R_NO.test(t) && t.length < 40) ? '' : t.slice(0, 240); }
    if (topic === 'sleep') { var sh = low.match(/(\d{1,2}(?:[.,]\d)?)/); if (sh) { var v = parseFloat(sh[1].replace(',', '.')); if (v >= 3 && v <= 14) S.sleepHours = v; } }

    // horario / días / partidos
    var sc = extractSchedule(t, topic);
    var propose = /\b(?:prop[oó]n(?:e|eme|me)|t[uú]\s+(?:decide|eliges|mismo)|como\s+(?:veas|prefieras)|me\s+da\s+igual|cualquier(?:a)?|lo\s+que\s+(?:veas|digas)|organ[ií]zalo|dec[ií]de(?:lo)?)\b/i.test(low);
    if (sc.fieldDays.length) S.fieldDays = uniq(S.fieldDays.concat(sc.fieldDays));
    if (sc.gymDays.length) S.gymDays = uniq(S.gymDays.concat(sc.gymDays));
    if (sc.matchDays.length) { S.matchDays = uniq(S.matchDays.concat(sc.matchDays)); S.noMatches = false; }
    if (sc.restDays.length) S.restDays = uniq(S.restDays.concat(sc.restDays));
    if (sc.dates.length) { S.matchDates = uniq(S.matchDates.concat(sc.dates)); S.noMatches = false; }
    if (sc.fieldCount != null) S.fieldCount = sc.fieldCount;
    if (sc.gymCount != null) S.gymCount = sc.gymCount;
    if (sc.prefTime && (topic === 'schedule_time' || topic === 'schedule' || topic === 'schedule_days' || !S.prefTime)) S.prefTime = sc.prefTime;
    if (topic === 'schedule_time' && !S.prefTime) {
      if (/ma[ñn]ana|temprano/.test(low)) S.prefTime = 'mañana'; else if (/tarde/.test(low)) S.prefTime = 'tarde'; else if (/noche/.test(low)) S.prefTime = 'noche';
      else if (propose || /da\s+igual|cualquier/.test(low)) S.prefTime = 'tarde';
    }
    if (sc.noMatches) { S.noMatches = true; }
    if (topic === 'schedule' && !propose) {
      // "entreno lunes, miércoles y viernes" sin cantidades: deducirlas
      if (S.fieldCount == null && S.fieldDays.length) S.fieldCount = S.fieldDays.length;
      if (S.gymCount == null && S.gymDays.length) S.gymCount = S.gymDays.length;
      if (S.gymCount == null && (S.fieldCount != null)) S.gymCount = 0;      // solo habló de campo: sin gimnasio
      if (S.fieldCount == null && S.gymCount != null && /^(?:solo|s[oó]lo)/.test(low) === false) S.fieldCount = S.fieldCount == null ? 2 : S.fieldCount;
    }
    if (topic === 'schedule' && propose && S.fieldCount == null && S.gymCount == null) { S.fieldCount = 2; S.gymCount = 2; S.autoDays = true; }
    if (topic === 'schedule_days' && (propose || !(sc.fieldDays.length || sc.gymDays.length))) S.autoDays = true;
    if (topic === 'matches' && !S.matchDays.length && !S.matchDates.length && R_NO.test(t)) S.noMatches = true;
    if (topic === 'matches' && !S.matchDays.length && !S.matchDates.length && !S.noMatches && /\b(?:no\s+s[eé]|a[uú]n\s+no|luego|despu[eé]s|ya\s+te\s+lo\s+dir[eé])\b/i.test(low)) S.noMatches = true;
  };

  P.knownForAI = function () {
    var S = this.S;
    return { club: S.club || null, city: S.city || null, hometown: S.hometown || null, laterality: S.laterality || null, goal: S.goal ? S.goal.slice(0, 80) : null, strength: S.strength ? S.strength.slice(0, 60) : null, weakness: S.weakness ? S.weakness.slice(0, 60) : null,
      fieldDays: S.fieldDays.map(function (d) { return DAYS[d]; }), gymDays: S.gymDays.map(function (d) { return DAYS[d]; }), matchDays: S.matchDays.map(function (d) { return DAYS[d]; }), prefTime: S.prefTime || null };
  };

  /* integra lo que haya extraído la IA, con anti-alucinación (los nombres propios deben aparecer en lo escrito) */
  P.mergeAI = function (f, userText) {
    if (!f) return;
    var S = this.S, blob = norm(userText + ' ' + this.history.filter(function (m) { return m.role === 'user'; }).map(function (m) { return m.content; }).join(' '));
    var ok = function (v) { return v && blob.indexOf(norm(v)) >= 0; };
    if (f.club && !S.club && ok(f.club)) { S.club = KT.club(f.club); S.noClub = false; }
    if (f.city && !S.city && ok(f.city)) S.city = KT.city(f.city);
    if (f.hometown && !S.hometown && ok(f.hometown)) S.hometown = KT.city(f.hometown);
    if (f.laterality && !S.laterality) S.laterality = f.laterality;
    if (f.goal && !S.goal) S.goal = f.goal;
    if (f.strength && !S.strength) S.strength = f.strength;
    if (f.weakness && !S.weakness) S.weakness = f.weakness;
    if (f.injuries && !S.injuries) { S.injuries = f.injuries; S.injAsked = true; }
    if (f.sleepHours && S.sleepHours == null) S.sleepHours = f.sleepHours;
    if (f.fieldDays && f.fieldDays.length && !S.fieldDays.length) S.fieldDays = uniq(f.fieldDays);
    if (f.gymDays && f.gymDays.length && !S.gymDays.length) S.gymDays = uniq(f.gymDays);
    if (f.matchDays && f.matchDays.length && !S.matchDays.length) S.matchDays = uniq(f.matchDays);
    if (f.fieldCount != null && S.fieldCount == null) S.fieldCount = f.fieldCount;
    if (f.gymCount != null && S.gymCount == null) S.gymCount = f.gymCount;
    if (f.prefTime && !S.prefTime) S.prefTime = f.prefTime;
    if (f.noMatches && !S.matchDays.length) S.noMatches = true;
  };

  P.ack = function (topic) {
    var S = this.S, n = this.ackSeed++;
    var a = {
      goal: ['Me gusta ese objetivo.', 'Buen objetivo, lo tendré en cuenta en tu plan.', 'Perfecto, eso marca el rumbo de tu temporada.'],
      club: S.club ? ['Genial, ' + S.club + '.', 'Anotado: ' + S.club + '.'] : ['Sin problema, lo dejamos para más adelante.'],
      city: S.city ? ['Anotado, vives en ' + S.city + '.', S.city + ', apuntado.'] : [''],
      hometown: S.hometown ? ['Perfecto, ' + S.hometown + ' como ciudad natal.', 'Apuntado: natural de ' + S.hometown + '.'] : [''],
      laterality: S.laterality ? ['Vale, ' + S.laterality.toLowerCase() + '.', 'Anotado: ' + S.laterality.toLowerCase() + '.'] : [''],
      game: ['Muy útil para afinar tus entrenamientos.', 'Buena base para trabajar.'],
      game_more: ['Perfecto, ya tengo tu perfil de juego.', 'Genial, con eso afino tu plan.'],
      schedule: ['Vale, ya veo el volumen de la semana.', 'Perfecto, con eso monto tu semana.'],
      schedule_time: S.prefTime ? ['Apuntado el horario.', 'Perfecto, adapto las sesiones a esa hora.'] : [''],
      schedule_days: ['Hecho, lo tengo en cuenta.', 'Vale, lo organizo.'],
      matches: S.noMatches ? ['Sin competición por ahora, así que puedo cargar algo más la semana.'] : ['Anotado, planifico la semana alrededor de ese día.'],
      injuries: S.injuries ? ['Gracias por contármelo, el fisio IA lo vigilará.'] : ['Perfecto, sin molestias entonces.'],
      sleep: ['Gracias, ajustaré la carga a tu descanso.']
    };
    var list = a[topic] || [''];
    return pick(list, n);
  };

  P.addUser = function (text) { this.history.push({ role: 'user', content: text }); };
  P.addAI = function (text) { this.history.push({ role: 'assistant', content: text }); };

  P.delay = function (text) { return Math.min(2600, 900 + String(text || '').length * 14); };

  P.say = async function (text, chips) {
    var ui = this.o.ui;
    ui.typing(true);
    await new Promise(function (r) { setTimeout(r, this.delay(text)); }.bind(this));
    ui.typing(false);
    this.addAI(text);
    ui.say(text, chips || []);
  };

  P.start = async function () {
    this.topic = 'goal';
    this.o.ui.summary(this.S, this.progress());
    await this.say(this.bank('goal'), []);
  };

  P.progress = function () {
    var S = this.S, tot = 10, done = 0;
    [S.goal, (S.club || S.noClub), S.city, S.hometown, S.laterality, (S.strength && S.weakness), (S.fieldCount != null || S.fieldDays.length || S.gymCount != null), S.prefTime, (S.matchDays.length || S.noMatches || S.matchDates.length), (S.injAsked && S.sleepHours != null)].forEach(function (v) { if (v) done++; });
    return Math.round(done / tot * 100);
  };

  P.isYes = function (t) { return /^\s*(?:s[ií]|sip|vale|ok|okey|okay|perfecto|genial|de\s+acuerdo|me\s+cuadra|me\s+vale|me\s+gusta|bien|todo\s+bien|est[aá]\s+bien|listo|adelante|correcto|claro|guay|dale|conforme)(?![a-záéíóúñ])/i.test(t) && !/\b(?:pero|cambia|mueve|quita|pon|a[ñn]ade|no)\b/i.test(t); };

  P.handle = async function (text) {
    if (this.busy || this.finished) return;
    var t = String(text || '').trim(); if (!t) return;
    this.busy = true;
    var ui = this.o.ui, topic = this.topic;
    this.addUser(t);
    try {
      if (topic === 'confirm') { await this.handleConfirm(t); this.busy = false; return; }

      this.absorb(t, topic);
      ui.summary(this.S, this.progress());
      this.turn++;
      var nxt = this.nextTopic();
      if (nxt === 'confirm' || nxt === 'done') { await this.proposePlan(); this.busy = false; return; }

      var bankQ = this.bank(nxt), ack = this.ack(topic), reply = null, aiUsed = false;
      var ai = (root.KinetAPIs && root.KinetAPIs.onboardingTurn) ? root.KinetAPIs.onboardingTurn : null;
      if (ai) {
        ui.typing(true);
        var started = Date.now();
        var res = await ai.call(root.KinetAPIs, { role: this.o.role || 'athlete', sport: this.sport, position: this.o.position, category: this.o.category, firstName: this.firstName, known: this.knownForAI(), history: this.history, lastUser: t, nextTopic: nxt, bankQuestion: bankQ, closing: nxt === 'sleep' });
        if (res && res.reply) {
          this.mergeAI(res.fields, t);
          var again = this.nextTopic();
          if (again === nxt) { reply = res.reply; aiUsed = true; this.usedAI = true; }
          else { nxt = again; bankQ = this.bank(nxt); }
        }
        var spent = Date.now() - started;
        if (spent < 700) await new Promise(function (r) { setTimeout(r, 700 - spent); });
        ui.typing(false);
      }
      ui.summary(this.S, this.progress());
      if (nxt === 'confirm' || nxt === 'done') { await this.proposePlan(); this.busy = false; return; }
      if (!reply) reply = (ack ? ack + ' ' : '') + bankQ;
      this.topic = nxt;
      await this.say(reply, this.chipsFor(nxt));
    } catch (e) {
      try { await this.say('Perdona, me he liado un momento. ¿Puedes repetirlo?', []); } catch (e2) {}
    }
    this.busy = false;
  };

  P.proposePlan = async function () {
    this.plan = buildWeek(this.S, this.sport, this.o);
    this.topic = 'confirm';
    this.o.ui.summary(this.S, this.progress(), this.plan);
    var S = this.S, p = this.plan, V = this.V;
    var ord = function (a) { return a.slice().sort(function (x, y) { return ((x + 6) % 7) - ((y + 6) % 7); }).map(function (d) { return DAYS[d]; }).join(', ').replace(/, ([^,]*)$/, ' y $1'); };
    var f = ord(p.fieldDays), g = ord(p.gymDays), m = ord(p.matchDays);
    var tm = S.prefTime ? (/^\d/.test(S.prefTime) ? 'sobre las ' + S.prefTime : 'por la ' + S.prefTime) : 'por la tarde';
    var txt = 'Ya tengo todo. Te he montado la semana ' + (p.auto ? 'repartiendo la carga' + (p.matchDays.length ? ' alrededor de tu ' + V.comp : '') : 'con lo que me has dicho') + ': **' + V.fieldPl + '**' + (f ? ' el ' + f : '') + (g ? ', **gimnasio** el ' + g : '') + (m ? ' y **' + V.comp + '** el ' + m : '') + ', ' + tm + '. La verás en tu calendario del Vestuario. ¿Te cuadra o quieres cambiar algo?';
    await this.say(txt, this.chipsFor('confirm'));
    this.o.ui.plan && this.o.ui.plan(this.plan);
  };

  P.handleConfirm = async function (t) {
    var ui = this.o.ui;
    if (this.isYes(t) || this.confirmRounds >= 3) { return this.finish(); }
    if (/quiero\s+cambiar\s+algo|cambiar|modificar|ajustar/i.test(t) && !parseDays(norm(t)).length && t.length < 40) {
      await this.say('Dime qué ajustar, por ejemplo: «mueve el gimnasio al jueves», «el campo martes y viernes» o «los partidos son los sábados».', []);
      return;
    }
    var before = JSON.stringify([this.S.fieldDays, this.S.gymDays, this.S.matchDays, this.S.prefTime, this.S.fieldCount, this.S.gymCount]);
    var sc = extractSchedule(t, 'confirm'), S = this.S;
    // en una corrección, los días nombrados REEMPLAZAN a los del mismo tipo
    if (sc.fieldDays.length) { S.fieldDays = sc.fieldDays; S.fieldCount = sc.fieldDays.length; S.gymDays = S.gymDays.filter(function (d) { return sc.fieldDays.indexOf(d) < 0 || sc.gymDays.indexOf(d) >= 0; }); }
    if (sc.gymDays.length) { S.gymDays = sc.gymDays; S.gymCount = sc.gymDays.length; }
    if (sc.matchDays.length) { S.matchDays = sc.matchDays; S.noMatches = false; }
    if (sc.fieldCount != null) { S.fieldCount = sc.fieldCount; if (!sc.fieldDays.length) S.fieldDays = S.fieldDays.slice(0, sc.fieldCount); }
    if (sc.gymCount != null) { S.gymCount = sc.gymCount; if (!sc.gymDays.length) S.gymDays = S.gymDays.slice(0, sc.gymCount); }
    if (sc.prefTime) S.prefTime = sc.prefTime;
    if (/\bquita(?:r)?\s+(?:el\s+)?(?:gym|gimnasio)\b/i.test(t)) { S.gymDays = []; S.gymCount = 0; }
    var after = JSON.stringify([S.fieldDays, S.gymDays, S.matchDays, S.prefTime, S.fieldCount, S.gymCount]);
    this.confirmRounds++;
    if (before === after) { await this.say('No he pillado el cambio. Prueba con algo como «el gimnasio martes y jueves» o «entreno por la mañana». Si ya te vale, pulsa «Sí, perfecto».', this.chipsFor('confirm')); return; }
    this.plan = buildWeek(S, this.sport, this.o);
    ui.summary(S, this.progress(), this.plan);
    await this.say('Hecho, ya lo he movido. ¿Ahora sí te cuadra?', this.chipsFor('confirm'));
    ui.plan && ui.plan(this.plan);
  };

  P.finish = async function () {
    if (this.finished) return;
    this.finished = true;
    if (!this.plan) this.plan = buildWeek(this.S, this.sport, this.o);
    this.o.ui.summary(this.S, 100, this.plan);
    await this.say('✅ **¡Todo listo!** He guardado tus datos en el Perfil, he programado tu calendario en el Vestuario y los 4 especialistas del Cuerpo Técnico ya conocen tu caso. Pulsa abajo en **FINALIZAR REGISTRO & ACTIVAR PERFIL**.', []);
    this.o.ui.done && this.o.ui.done(this.S, this.plan);
  };

  /* guarda el calendario del onboarding en el Vestuario (aceptado: lo ha confirmado el usuario en la conversación) */
  function persistPlan(plan) {
    try {
      localStorage.setItem('kinet_weekly_schedule_map', JSON.stringify(plan.weekly));
      localStorage.setItem('kinet_schedule_accepted', '1');
      var cs = {}; try { cs = JSON.parse(localStorage.getItem('kinet_custom_sessions') || '{}') || {}; } catch (e) {}
      Object.keys(plan.custom || {}).forEach(function (k) { cs[k] = (cs[k] || []).filter(function (x) { return !/^onb_/.test(x.id || ''); }).concat(plan.custom[k]); });
      localStorage.setItem('kinet_custom_sessions', JSON.stringify(cs));
    } catch (e) {}
  }

  // Calendario a partir de un texto libre (cuerpo técnico): "entrenamos martes y jueves, gimnasio lunes, partido el sábado a las 18"
  function planFromText(text, sport, ctx) {
    var sc = extractSchedule(text || '', 'schedule');
    if (!sc.fieldDays.length && !sc.gymDays.length && !sc.matchDays.length && sc.fieldCount == null && sc.gymCount == null) return null;
    var S = { fieldDays: sc.fieldDays, gymDays: sc.gymDays, matchDays: sc.matchDays, restDays: sc.restDays, fieldCount: sc.fieldCount, gymCount: sc.gymCount, prefTime: sc.prefTime, matchDates: sc.dates || [], weakness: '' };
    return buildWeek(S, sport, ctx || {});
  }
  // Retardo natural según la longitud de la respuesta (sin bloquear)
  function thinkDelay(text) { return Math.min(1500, 650 + String(text || '').length * 7); }

  root.KinetOnboarding = { planFromText: planFromText, thinkDelay: thinkDelay, create: function (o) { return new Interview(o); }, buildWeek: buildWeek, weekSummary: weekSummary, persistPlan: persistPlan, extractSchedule: extractSchedule, DAYS: DAYS, DAYS_UP: DAYS_UP };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.KinetOnboarding;
})(typeof window !== 'undefined' ? window : globalThis);
