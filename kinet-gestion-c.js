/* KINET OS · Panel de gestión · secciones C: Finanzas (ingresos, gastos y márgenes) y Directiva (mural de ideas).
   Finanzas es una ESTIMACIÓN: parte de los usuarios de pago reales y de tus gastos fijos (editables, se guardan en este navegador).
   El mural guarda las notas en el servidor (supabase/12_directiva.sql); si todavía no está creado, funciona en local. */
(function () {
  'use strict';
  var KGP = window.KGP; if (!KGP) return;
  var H = KGP.helpers, S = KGP.sections, esc = H.esc, $ = H.$, $$ = H.$$;
  var PRICE = { pro: 11.99, club: 39.99 };

  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function n(v) { v = parseFloat(String(v).replace(',', '.')); return isFinite(v) ? v : 0; }
  var eur = function (v, d) { v = Number(v) || 0; return v.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d }); };
  var pct = function (v, d) { return (Number(v) || 0).toLocaleString('es-ES', { minimumFractionDigits: d == null ? 1 : d, maximumFractionDigits: d == null ? 1 : d }) + ' %'; };

  /* ═══════════════════════ FINANZAS ═══════════════════════ */
  var FIN_KEY = 'kinet_fin_assump';
  var FIN_DEF = {
    iva: 21, stripePct: 1.5, stripeFix: 0.25, taxPct: 20, conv: 0,
    fixed: [
      { n: 'Supabase (base de datos)', v: 0 },
      { n: 'Dominio kinetos.es', v: 0.9 },
      { n: 'Cloudflare R2 (vídeo)', v: 0 },
      { n: 'Autónomo / gestoría', v: 0 },
      { n: 'Herramientas y otros', v: 0 }
    ]
  };
  function finLoad() {
    var a; try { a = JSON.parse(lsGet(FIN_KEY, 'null')); } catch (e) { a = null; }
    a = a && typeof a === 'object' ? a : {};
    var o = JSON.parse(JSON.stringify(FIN_DEF));
    ['iva', 'stripePct', 'stripeFix', 'taxPct', 'conv'].forEach(function (k) { if (a[k] != null && isFinite(a[k])) o[k] = Number(a[k]); });
    if (Array.isArray(a.fixed) && a.fixed.length) o.fixed = a.fixed.map(function (r) { return { n: String(r.n || '').slice(0, 40), v: n(r.v) }; });
    return o;
  }
  function finSave(a) { lsSet(FIN_KEY, JSON.stringify(a)); }

  // Cálculo mensual para un nº de usuarios de pago (mezcla PRO/CLUB y coste IA por usuario)
  function calc(a, m) {
    var paid = m.pro + m.club;
    var gross = m.pro * PRICE.pro + m.club * PRICE.club;                 // lo que pagan (IVA incluido)
    var net = gross / (1 + a.iva / 100);
    var vat = gross - net;
    var stripe = paid * a.stripeFix + gross * a.stripePct / 100;
    var ai = m.ai;
    var fixed = a.fixed.reduce(function (s, r) { return s + n(r.v); }, 0) + (m.extra || 0);
    var pre = net - stripe - ai - fixed;
    var tax = Math.max(0, pre) * a.taxPct / 100;
    var post = pre - tax;
    return { paid: paid, gross: gross, net: net, vat: vat, stripe: stripe, ai: ai, fixed: fixed, pre: pre, tax: tax, post: post, margin: net > 0 ? 100 * pre / net : 0 };
  }

  S.finanzas = async function (ws) {
    var o = {}; try { o = await H.rpc('admin_overview') || {}; } catch (e) { o = {}; }
    var A = finLoad();
    var pro = Number(o.pro) || 0, club = Number(o.club) || 0, users = Number(o.users_total) || 0, aiMonth = Number(o.ai_cost_month) || 0;
    var paid0 = pro + club;
    var mixClub = paid0 ? club / paid0 : 0.2;                                   // si aún no hay pagos, supón 80 % PRO / 20 % CLUB
    var aiPerUser = users ? aiMonth / users : 0.04;                             // coste IA medio por usuario registrado
    var convReal = users ? 100 * paid0 / users : 0;

    function scenario(paidN, extra) {
      var c = A.conv > 0 ? A.conv : (convReal > 0 ? convReal : 5);              // % de usuarios que paga
      var tot = c > 0 ? paidN / (c / 100) : paidN;
      var cl = Math.round(paidN * mixClub), pr = paidN - cl;
      return calc(A, { pro: pr, club: cl, ai: aiPerUser * tot, extra: extra || 0 });
    }

    function render() {
      var real = calc(A, { pro: pro, club: club, ai: aiMonth, extra: n($('#fExtra') ? $('#fExtra').value : 0) });
      var fixedRows = A.fixed.map(function (r, i) {
        return '<div class="fin-row"><input class="inp fn" data-i="' + i + '" value="' + esc(r.n) + '" placeholder="Concepto" maxlength="40"><div class="fin-eur"><input class="inp fv" data-i="' + i + '" inputmode="decimal" value="' + esc(String(r.v).replace('.', ',')) + '"><span>€/mes</span></div><button class="btn fdel" data-i="' + i + '" title="Quitar" aria-label="Quitar gasto">✕</button></div>';
      }).join('');

      var segs = [
        { l: 'Comisión de Stripe', v: Math.max(0, real.stripe), c: '#F59E0B' },
        { l: 'IA (Gemini)', v: Math.max(0, real.ai), c: '#A855F7' },
        { l: 'Gastos fijos', v: Math.max(0, real.fixed), c: '#38BDF8' },
        { l: 'Reserva de impuestos', v: Math.max(0, real.tax), c: '#EF4444' },
        { l: 'Te queda (beneficio)', v: Math.max(0, real.post), c: '#00FF88' }
      ];
      var totSeg = segs.reduce(function (s, x) { return s + x.v; }, 0) || 1;
      var stack = '<div class="fin-stack">' + segs.map(function (s) { return s.v > 0 ? '<i style="flex:' + (s.v / totSeg).toFixed(4) + ';background:' + s.c + '" title="' + esc(s.l) + ': ' + eur(s.v) + '"></i>' : ''; }).join('') + '</div>' +
        '<div class="legend fin-leg">' + segs.map(function (s) { return '<span><i style="background:' + s.c + '"></i>' + esc(s.l) + ' · <b style="color:#fff">' + eur(s.v) + '</b></span>'; }).join('') + '</div>';

      var steps = [5, 10, 25, 50, 100, 250, 500, 1000, 2500];
      var rows = steps.map(function (k) { var s = scenario(k, real.fixed - A.fixed.reduce(function (t, r) { return t + n(r.v); }, 0)); s.k = k; return s; });
      var beK = null; for (var k2 = 1; k2 <= 20000; k2 = k2 < 200 ? k2 + 1 : k2 + 25) { if (scenario(k2, real.fixed - A.fixed.reduce(function (t, r) { return t + n(r.v); }, 0)).pre >= 0) { beK = k2; break; } }

      var cls = real.pre > 0 ? 'ok' : (real.pre < 0 ? 'bad' : '');
      ws.innerHTML = H.head('Negocio', 'Finanzas y márgenes', 'Estimación mensual de ingresos, gastos y margen a partir de tus usuarios de pago reales. Edita los gastos y los supuestos: se guardan en este navegador.',
        '<button class="btn" id="fCsv">⬇ Descargar CSV</button>') +
        '<div class="grid g4" style="margin-bottom:16px">' +
        H.kpi('Ingresos netos / mes', real.net, { suf: ' €', dec: 2, sub: 'Cobrado ' + eur(real.gross) + ' · IVA ' + eur(real.vat) }) +
        H.kpi('Gastos / mes', real.stripe + real.ai + real.fixed, { suf: ' €', dec: 2, sub: 'Stripe ' + eur(real.stripe) + ' · IA ' + eur(real.ai) + ' · Fijos ' + eur(real.fixed) }) +
        H.kpi('Beneficio antes de impuestos', real.pre, { suf: ' €', dec: 2, sub: 'Después de la reserva: ' + eur(real.post), cls: cls }) +
        H.kpi('Margen', real.margin, { suf: ' %', dec: 1, sub: paid0 + ' de pago de ' + H.num(users) + ' (' + pct(convReal) + ')', cls: cls }) + '</div>' +

        '<div class="grid g2" style="margin-bottom:16px">' +
        '<div class="panel"><div class="p-h"><span class="p-l">A dónde va cada euro (sin IVA)</span></div>' + stack +
          '<div class="muted sm" style="margin-top:10px;line-height:1.6">' + (beK ? 'Punto de equilibrio aproximado: <b style="color:#fff">' + H.num(beK) + ' usuarios de pago</b> con tus gastos y mezcla actuales.' : 'Con estos gastos no se llega al equilibrio en el rango calculado.') + ' El IVA no es tuyo: se ingresa a Hacienda.</div></div>' +
        '<div class="panel"><div class="p-h"><span class="p-l">Supuestos</span></div><div class="fin-ass">' +
          '<label>IVA incluido en el precio<div class="fin-eur"><input class="inp fa" id="aIva" inputmode="decimal" value="' + String(A.iva).replace('.', ',') + '"><span>%</span></div></label>' +
          '<label>Comisión Stripe (variable)<div class="fin-eur"><input class="inp fa" id="aSP" inputmode="decimal" value="' + String(A.stripePct).replace('.', ',') + '"><span>%</span></div></label>' +
          '<label>Comisión Stripe (fija por cobro)<div class="fin-eur"><input class="inp fa" id="aSF" inputmode="decimal" value="' + String(A.stripeFix).replace('.', ',') + '"><span>€</span></div></label>' +
          '<label>Reserva para impuestos s/ beneficio<div class="fin-eur"><input class="inp fa" id="aTax" inputmode="decimal" value="' + String(A.taxPct).replace('.', ',') + '"><span>%</span></div></label>' +
          '<label>Conversión a pago (proyecciones)<div class="fin-eur"><input class="inp fa" id="aConv" inputmode="decimal" placeholder="' + (convReal ? convReal.toFixed(1).replace('.', ',') : '5') + '" value="' + (A.conv ? String(A.conv).replace('.', ',') : '') + '"><span>%</span></div></label>' +
          '<label>Otros gastos puntuales de este mes<div class="fin-eur"><input class="inp" id="fExtra" inputmode="decimal" value="' + (lsGet('kinet_fin_extra', '0')) + '"><span>€</span></div></label>' +
        '</div></div></div>' +

        '<div class="panel" style="margin-bottom:16px"><div class="p-h"><span class="p-l">Gastos fijos mensuales</span><button class="btn" id="fAdd">+ Añadir gasto</button></div><div id="fFixed">' + fixedRows + '</div>' +
          '<div class="fin-tot"><span>Total gastos fijos</span><b>' + eur(real.fixed) + '</b></div></div>' +

        '<div class="panel" style="margin-bottom:16px"><div class="p-h"><span class="p-l">Beneficio mensual según nº de usuarios de pago</span></div>' +
          H.barChart(rows.map(function (r) { return { x: String(r.k), y: Math.max(0, r.pre), t: eur(r.pre) }; }), { h: 170 }) +
          '<div class="muted sm" style="margin:6px 0 10px">Escenarios con la mezcla PRO/CLUB y el coste de IA por usuario actuales. Las barras a 0 son meses con pérdida.</div>' +
          H.table([
            { h: 'Usuarios de pago', f: function (r) { return '<b>' + H.num(r.k) + '</b>'; } },
            { h: 'Ingresos netos', f: function (r) { return eur(r.net, 0); } },
            { h: 'Stripe', f: function (r) { return eur(r.stripe, 0); } },
            { h: 'IA', f: function (r) { return eur(r.ai, 0); } },
            { h: 'Fijos', f: function (r) { return eur(r.fixed, 0); } },
            { h: 'Beneficio', f: function (r) { return '<b style="color:' + (r.pre >= 0 ? '#00FF88' : '#EF4444') + '">' + eur(r.pre, 0) + '</b>'; } },
            { h: 'Margen', f: function (r) { return pct(r.margin, 0); } }
          ], rows) + '</div>' +

        '<div class="panel"><div class="p-h"><span class="p-l">Simulador libre</span></div>' +
          '<div class="fin-sim"><label>Usuarios de pago: <b id="sN">100</b></label><input type="range" id="sR" min="0" max="3000" step="5" value="100"></div>' +
          '<div class="grid g4" id="sOut" style="margin-top:12px"></div></div>' +
        '<div class="muted sm" style="margin-top:12px;line-height:1.6">Estimación orientativa, no es asesoramiento fiscal ni contable. Los precios son los de la web (PRO ' + eur(PRICE.pro) + ' · CLUB ' + eur(PRICE.club) + ', IVA incluido). Consulta a tu gestor para impuestos y cuotas reales.</div>';

      H.animate(ws);
      bind(real, rows);
      sim();
    }

    function sim() {
      var r = $('#sR'); if (!r) return; var k = parseInt(r.value, 10) || 0; $('#sN').textContent = H.num(k);
      var s = scenario(k, n(lsGet('kinet_fin_extra', '0')));
      $('#sOut').innerHTML = [
        ['Ingresos netos', eur(s.net, 0), ''], ['Gastos', eur(s.stripe + s.ai + s.fixed, 0), ''],
        ['Beneficio', eur(s.pre, 0), s.pre >= 0 ? 'ok' : 'bad'], ['Margen', pct(s.margin, 0), s.pre >= 0 ? 'ok' : 'bad']
      ].map(function (x) { return '<div class="panel kpi ' + x[2] + '"><div class="p-l">' + x[0] + '</div><div class="v" style="margin-top:8px">' + x[1] + '</div></div>'; }).join('');
    }

    function bind(real, rows) {
      var keep = H.debounce(function () { finSave(A); render(); }, 450);
      $$('.fa', ws).forEach(function (el) {
        el.oninput = function () {
          A.iva = Math.min(60, Math.max(0, n($('#aIva').value))); A.stripePct = Math.min(10, Math.max(0, n($('#aSP').value)));
          A.stripeFix = Math.min(5, Math.max(0, n($('#aSF').value))); A.taxPct = Math.min(60, Math.max(0, n($('#aTax').value)));
          A.conv = Math.min(100, Math.max(0, n($('#aConv').value))); keep();
        };
      });
      var ex = $('#fExtra'); if (ex) ex.oninput = H.debounce(function () { lsSet('kinet_fin_extra', String(n(ex.value))); render(); }, 450);
      $$('#fFixed .fn', ws).forEach(function (el) { el.oninput = function () { A.fixed[+el.dataset.i].n = el.value; finSave(A); }; });
      $$('#fFixed .fv', ws).forEach(function (el) { el.oninput = H.debounce(function () { A.fixed[+el.dataset.i].v = Math.max(0, n(el.value)); finSave(A); render(); }, 450); });
      $$('#fFixed .fdel', ws).forEach(function (el) { el.onclick = function () { A.fixed.splice(+el.dataset.i, 1); finSave(A); render(); }; });
      $('#fAdd').onclick = function () { if (A.fixed.length >= 20) return H.toast('Máximo 20 conceptos', 'bad'); A.fixed.push({ n: '', v: 0 }); finSave(A); render(); var l = $$('#fFixed .fn', ws); if (l.length) l[l.length - 1].focus(); };
      $('#sR').oninput = sim;
      $('#fCsv').onclick = function () {
        var L = [['Concepto', 'Importe mensual (EUR)']];
        L.push(['Ingresos cobrados (IVA incl.)', real.gross.toFixed(2)], ['IVA', real.vat.toFixed(2)], ['Ingresos netos', real.net.toFixed(2)], ['Comisión Stripe', real.stripe.toFixed(2)], ['IA', real.ai.toFixed(2)]);
        A.fixed.forEach(function (r) { L.push(['Fijo: ' + r.n, n(r.v).toFixed(2)]); });
        L.push(['Beneficio antes de impuestos', real.pre.toFixed(2)], ['Reserva impuestos', real.tax.toFixed(2)], ['Beneficio final', real.post.toFixed(2)], ['Margen %', real.margin.toFixed(1)]);
        var csv = L.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(';'); }).join('\n');
        var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })); a.download = 'kinet-finanzas-' + new Date().toISOString().slice(0, 7) + '.csv'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      };
    }

    render();
  };

  /* ═══════════════════════ DIRECTIVA · MURAL DE IDEAS ═══════════════════════ */
  var BOARD_LOCAL = 'kinet_board_local';
  var KINDS = { idea: ['💡', 'Idea'], proyecto: ['🚀', 'Proyecto'], experimento: ['🧪', 'Experimento'], locura: ['🤪', 'Locura'], urgente: ['🔥', 'Urgente'] };
  var COLORS = ['#FDE68A', '#A7F3D0', '#BAE6FD', '#FBCFE8', '#DDD6FE', '#FED7AA'];
  var STATES = [['idea', 'Idea', '💭'], ['estudiando', 'Estudiando', '🔍'], ['marcha', 'En marcha', '🏗️'], ['hecho', 'Hecho', '✅']];
  var STARTERS = [
    '¿Y si KINET tuviera un modo «abuela» con letra gigante?', 'Un botón de «Mister enfadado» que dé instrucciones a gritos (con humor)',
    'Ranking semanal de la ficha más épica de la comunidad', 'Colaboración con una marca de zapatillas para retos mensuales',
    'Un tutorial en formato videojuego con niveles y trofeos', 'Alertas de lesión que avisen con un pitido de árbitro',
    'Pegatinas animadas para los comentarios de la comunidad', 'Un «Día sin IA»: solo pizarra y bocadillo'
  ];
  var local = function () { try { return JSON.parse(lsGet(BOARD_LOCAL, '[]')) || []; } catch (e) { return []; } };
  var saveLocal = function (a) { lsSet(BOARD_LOCAL, JSON.stringify(a.slice(0, 200))); };
  var uid = function () { return 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };
  var me = function () { return (lsGet('kinet_user_name', '') || '').trim() || 'Dirección'; };
  var hash = function (s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };

  S.directiva = async function (ws) {
    var serverOk = true, ideas = [];
    try { var r = await H.rpc('admin_board_list'); ideas = Array.isArray(r) ? r : []; } catch (e) { serverOk = false; ideas = local(); }
    var kind = 'idea', color = COLORS[0], filter = 'todas', started = false;

    function save(it) {
      return (async function () {
        if (serverOk) {
          var r = await H.rpc('admin_board_save', { p_id: it.id && String(it.id)[0] !== 'l' ? it.id : null, p_title: it.title, p_body: it.body || '', p_kind: it.kind, p_color: it.color, p_status: it.status });
          return r;
        }
        var all = local(), i = all.findIndex(function (x) { return x.id === it.id; });
        if (i < 0) { it.id = uid(); it.created_at = new Date().toISOString(); it.author = me(); it.votes = []; all.unshift(it); } else all[i] = Object.assign(all[i], it);
        saveLocal(all); return all.find(function (x) { return x.id === it.id; });
      })();
    }
    async function vote(it) {
      if (serverOk) return H.rpc('admin_board_vote', { p_id: it.id });
      var all = local(), x = all.find(function (z) { return z.id === it.id; }); if (!x) return;
      x.votes = x.votes || []; var m = me(), i = x.votes.indexOf(m); if (i >= 0) x.votes.splice(i, 1); else x.votes.push(m); saveLocal(all); return x;
    }
    async function del(it) {
      if (serverOk) return H.rpc('admin_board_delete', { p_id: it.id });
      saveLocal(local().filter(function (z) { return z.id !== it.id; }));
    }
    async function reload() { try { ideas = serverOk ? (await H.rpc('admin_board_list')) || [] : local(); } catch (e) { ideas = []; } draw(); }

    function votesOf(it) { return Array.isArray(it.votes) ? it.votes.length : (Number(it.votes) || 0); }
    function mine(it) { if (!serverOk) return Array.isArray(it.votes) && it.votes.indexOf(me()) >= 0; return !!it.voted; }

    function noteHtml(it, i) {
      var k = KINDS[it.kind] || KINDS.idea, rot = ((hash(String(it.id)) % 9) - 4) * 0.7, st = STATES.filter(function (s) { return s[0] === it.status; })[0] || STATES[0];
      return '<article class="note" data-id="' + esc(it.id) + '" style="--c:' + esc(it.color || COLORS[0]) + ';--r:' + rot.toFixed(2) + 'deg;animation-delay:' + Math.min(i, 12) * 45 + 'ms">' +
        '<i class="tape"></i><div class="n-top"><span class="n-kind">' + k[0] + ' ' + k[1] + '</span><button class="n-del" data-a="del" title="Quitar nota" aria-label="Quitar nota">✕</button></div>' +
        '<h4>' + esc(it.title) + '</h4>' + (it.body ? '<p>' + esc(it.body) + '</p>' : '') +
        '<div class="n-foot"><button class="n-vote' + (mine(it) ? ' on' : '') + '" data-a="vote" title="Me gusta esta idea">🔥 <b>' + votesOf(it) + '</b></button>' +
        '<button class="n-state s-' + esc(st[0]) + '" data-a="state" title="Cambiar estado">' + st[2] + ' ' + st[1] + '</button></div>' +
        '<div class="n-by">' + esc(it.author || it.author_name || 'Dirección') + (it.created_at ? ' · ' + H.ago(it.created_at) : '') + '</div></article>';
    }

    function draw() {
      var list = ideas.filter(function (x) { return filter === 'todas' || x.status === filter; });
      list.sort(function (a, b) { return votesOf(b) - votesOf(a) || String(b.created_at || '').localeCompare(String(a.created_at || '')); });
      var cnt = function (s) { return ideas.filter(function (x) { return x.status === s; }).length; };
      ws.innerHTML = H.head('Directiva', 'Mural de ideas', 'El corcho del equipo: apunta ideas, proyectos futuros y locuras. Vota con 🔥 y mueve cada nota por su camino hasta «Hecho».',
        '<button class="btn" id="bDice">🎲 Ideas al azar</button>') +
        (serverOk ? '' : '<div class="panel" style="margin-bottom:14px;border-color:rgba(245,158,11,.5)"><div class="sm" style="line-height:1.6">📌 Mural en <b>modo local</b>: las notas solo se ven en este navegador. Ejecuta <span class="mono">supabase/12_directiva.sql</span> en Supabase para compartirlo con todo el equipo.</div></div>') +
        '<div class="panel board-add"><div class="b-row"><input class="inp" id="bTitle" maxlength="90" placeholder="Escribe la idea (ej.: «Modo abuela con letra gigante»)"><button class="btn pri" id="bPost">📌 Clavar nota</button></div>' +
        '<textarea class="inp" id="bBody" maxlength="400" rows="2" placeholder="Detalles, para qué serviría, a quién ayuda… (opcional)"></textarea>' +
        '<div class="b-row b-opts"><div class="b-kinds">' + Object.keys(KINDS).map(function (k) { return '<button type="button" class="b-chip' + (k === kind ? ' on' : '') + '" data-k="' + k + '">' + KINDS[k][0] + ' ' + KINDS[k][1] + '</button>'; }).join('') + '</div>' +
        '<div class="b-cols">' + COLORS.map(function (c) { return '<button type="button" class="b-col' + (c === color ? ' on' : '') + '" data-c="' + c + '" style="background:' + c + '" aria-label="Color"></button>'; }).join('') + '</div></div></div>' +
        '<div class="b-filter">' + [['todas', 'Todas', ideas.length]].concat(STATES.map(function (s) { return [s[0], s[2] + ' ' + s[1], cnt(s[0])]; })).map(function (f) { return '<button class="b-chip' + (f[0] === filter ? ' on' : '') + '" data-f="' + f[0] + '">' + f[1] + ' <em>' + f[2] + '</em></button>'; }).join('') + '</div>' +
        (list.length ? '<div class="cork">' + list.map(noteHtml).join('') + '</div>' :
          '<div class="cork-empty"><div style="font-size:3rem">🐙</div><b>' + (ideas.length ? 'No hay notas en esta fila' : 'El corcho está vacío y tiene hambre') + '</b><span>' + (ideas.length ? 'Prueba con otro filtro.' : 'Clava la primera idea y que empiece la fiesta.') + '</span></div>');
      bind();
    }

    function bind() {
      $$('.b-kinds .b-chip', ws).forEach(function (b) { b.onclick = function () { kind = b.dataset.k; $$('.b-kinds .b-chip', ws).forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
      $$('.b-cols .b-col', ws).forEach(function (b) { b.onclick = function () { color = b.dataset.c; $$('.b-cols .b-col', ws).forEach(function (x) { x.classList.toggle('on', x === b); }); }; });
      $$('.b-filter .b-chip', ws).forEach(function (b) { b.onclick = function () { filter = b.dataset.f; draw(); }; });
      $('#bDice').onclick = function () { var t = STARTERS[Math.floor(Math.random() * STARTERS.length)]; $('#bTitle').value = t; $('#bTitle').focus(); H.toast('Idea al azar lista: edítala o clávala tal cual 🎲'); };
      var post = async function () {
        var t = ($('#bTitle').value || '').trim(); if (t.length < 3) { H.toast('Escribe al menos unas palabras', 'bad'); $('#bTitle').focus(); return; }
        var btn = $('#bPost');
        await H.run(btn, async function () { await save({ title: t, body: ($('#bBody').value || '').trim(), kind: kind, color: color, status: 'idea' }); await reload(); confetti(['📌', '✨', '💡']); }, 'Nota clavada en el corcho 📌');
      };
      $('#bPost').onclick = post; $('#bTitle').onkeydown = function (e) { if (e.key === 'Enter') post(); };
      $$('.note', ws).forEach(function (el) {
        var it = ideas.filter(function (x) { return String(x.id) === el.dataset.id; })[0]; if (!it) return;
        el.onclick = async function (e) {
          var b = e.target.closest('[data-a]'); if (!b) return; var a = b.dataset.a;
          if (a === 'vote') { await H.run(null, async function () { await vote(it); await reload(); }); confetti(['🔥']); }
          if (a === 'state') {
            var idx = STATES.findIndex(function (s) { return s[0] === it.status; }), nx = STATES[(idx + 1) % STATES.length];
            await H.run(null, async function () { await save({ id: it.id, title: it.title, body: it.body, kind: it.kind, color: it.color, status: nx[0] }); await reload(); });
            if (nx[0] === 'hecho') { confetti(['🎉', '✅', '🏆', '🥳']); H.toast('¡Proyecto hecho! 🏆'); }
          }
          if (a === 'del') { var ok = await H.ask({ title: 'Quitar esta nota', text: '«' + it.title + '» se borrará del corcho.', ok: 'Quitar', danger: true }); if (ok) await H.run(null, async function () { await del(it); await reload(); }, 'Nota quitada'); }
        };
      });
    }

    function confetti(em) {
      if (document.documentElement.classList.contains('kx-reduce')) return;
      var host = document.createElement('div'); host.className = 'confetti'; document.body.appendChild(host);
      for (var i = 0; i < 18; i++) {
        var s = document.createElement('span'); s.textContent = em[i % em.length];
        s.style.cssText = 'left:' + (35 + Math.random() * 30) + '%;--dx:' + ((Math.random() - .5) * 420).toFixed(0) + 'px;--dr:' + ((Math.random() - .5) * 720).toFixed(0) + 'deg;animation-delay:' + (Math.random() * 120).toFixed(0) + 'ms;font-size:' + (16 + Math.random() * 14).toFixed(0) + 'px';
        host.appendChild(s);
      }
      setTimeout(function () { host.remove(); }, 1700);
    }

    draw();
  };
})();
