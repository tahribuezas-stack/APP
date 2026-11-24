/* KINET OS · Panel de gestión · secciones A: resumen, usuarios, planes, moderación, soporte, verificación. */
(function () {
  'use strict';
  var KGP = window.KGP, H = KGP.helpers, S = KGP.sections, esc = H.esc, $ = H.$, $$ = H.$$;
  var PRICE = { pro: 11.99, club: 39.99 };

  /* ═════════ PANEL GENERAL ═════════ */
  S.resumen = async function (ws, token) {
    var o = await H.rpc('admin_overview');
    var sign = []; try { sign = await H.rpc('admin_signups_by_day', { p_days: 30 }); } catch (e) {}
    var att = '';
    function alertRow(cls, ico, txt, go) { return '<div class="alert ' + cls + '" data-go="' + go + '"><span>' + ico + '</span><span>' + txt + '</span><span style="margin-left:auto" class="muted">→</span></div>'; }
    if (o.tickets_new > 0 && H.can('subadmin', 'moderator')) att += alertRow('warn', '🎧', '<b>' + o.tickets_new + '</b> ticket' + (o.tickets_new > 1 ? 's' : '') + ' de soporte sin atender', 'soporte');
    if (o.reports_new > 0 && H.can('subadmin', 'moderator')) att += alertRow('bad', '🚩', '<b>' + o.reports_new + '</b> denuncia' + (o.reports_new > 1 ? 's' : '') + ' pendiente' + (o.reports_new > 1 ? 's' : '') + ' de revisar', 'moderacion');
    if (o.banned > 0 && H.can('subadmin', 'moderator', 'scout_verifier')) att += alertRow('', '🚫', '<b>' + o.banned + '</b> cuenta' + (o.banned > 1 ? 's' : '') + ' suspendida' + (o.banned > 1 ? 's' : ''), 'usuarios');
    if (!att) att = '<div class="alert ok"><span>✅</span><span>Todo al día: no hay nada pendiente.</span></div>';
    var paid = (o.pro || 0) + (o.club || 0), conv = o.users_total ? 100 * paid / o.users_total : 0;
    var quick = G().sectionsFor(H.role()).filter(function (s) { return s.id !== 'resumen'; }).slice(0, 8).map(function (s) { return '<button class="btn" data-go="' + s.id + '">' + s.icon + ' ' + esc(s.label) + '</button>'; }).join('');
    var kp = '';
    kp += H.kpi('Usuarios totales', o.users_total || 0, { sub: '+' + H.num(o.new_7d || 0) + ' esta semana · +' + H.num(o.new_30d || 0) + ' en 30 días', go: H.can('subadmin', 'moderator', 'scout_verifier') ? 'usuarios' : '' });
    kp += H.kpi('Activos 24 h', o.active_24h || 0, { sub: H.num(o.active_7d || 0) + ' en 7 días' });
    kp += H.kpi('De pago', paid, { sub: 'PRO ' + (o.pro || 0) + ' · CLUB ' + (o.club || 0) + ' · conversión ' + conv.toFixed(1).replace('.', ',') + ' %', cls: 'ok' });
    kp += H.kpi('Pendientes', (o.tickets_new || 0) + (o.reports_new || 0), { sub: (o.tickets_new || 0) + ' tickets · ' + (o.reports_new || 0) + ' denuncias', cls: ((o.tickets_new || 0) + (o.reports_new || 0)) ? 'warn' : '' });
    kp += H.kpi('Publicaciones 24 h', o.posts_24h == null ? '—' : o.posts_24h, { sub: H.num(o.posts_total || 0) + ' en total' });
    kp += H.kpi('Vídeos en R2', o.videos_total == null ? '—' : o.videos_total, { sub: H.bytes(o.video_bytes || 0) + ' · ' + (o.videos_24h || 0) + ' hoy' });
    kp += H.kpi('Consultas IA hoy', o.ai_today == null ? '—' : o.ai_today, { sub: 'Coste hoy ' + H.eur(o.ai_cost_today || 0) });
    kp += H.kpi('Coste IA del mes', o.ai_cost_month == null ? '—' : o.ai_cost_month, { pre: '', suf: ' €', dec: 2, sub: 'Ingreso teórico ' + H.eur((o.pro || 0) * PRICE.pro + (o.club || 0) * PRICE.club) + '/mes' });
    return H.head('Resumen', 'Panel general', 'Vista rápida de cómo va KINET OS ahora mismo. Se actualiza solo cada minuto.', '<button class="btn" id="rfr">↻ Actualizar</button>') +
      '<div class="grid g4" style="margin-bottom:16px">' + kp + '</div>' +
      '<div class="grid g2" style="margin-bottom:16px"><div class="panel"><div class="p-h"><span class="p-l">Altas · últimos 30 días</span></div>' + H.lineChart((sign || []).map(function (d) { return { x: String(d.day).slice(8, 10) + '/' + String(d.day).slice(5, 7), y: d.n }; })) + '</div>' +
      '<div class="panel"><div class="p-h"><span class="p-l">Planes</span></div>' + H.donut([{ l: 'Free', v: Math.max(0, o.free || 0), c: '#64748B' }, { l: 'PRO', v: o.pro || 0, c: '#00FF88' }, { l: 'CLUB', v: o.club || 0, c: '#F59E0B' }]) +
      '<div class="p-h" style="margin-top:18px"><span class="p-l">Perfiles</span></div>' + H.hbars([{ l: 'Atletas', v: o.athlete || 0 }, { l: 'Staff', v: o.staff || 0 }, { l: 'Scouts', v: o.scout || 0 }]) + '</div></div>' +
      '<div class="grid g2"><div class="panel"><div class="p-h"><span class="p-l">Requiere atención</span></div>' + att + '</div>' +
      '<div class="panel"><div class="p-h"><span class="p-l">Accesos rápidos</span></div><div style="display:flex;flex-wrap:wrap;gap:8px">' + quick + '</div>' +
      '<div class="p-h" style="margin-top:18px"><span class="p-l">Salud de la cuenta</span></div><div class="muted sm" style="line-height:1.8">Verificados: <b style="color:#fff">' + (o.verified || 0) + '</b> · Menores: <b style="color:#fff">' + (o.minors || 0) + '</b> · Equipo: <b style="color:#fff">' + (o.team || 0) + '</b> · Palabras bloqueadas: <b style="color:#fff">' + (o.terms == null ? '—' : o.terms) + '</b></div></div></div>';
  };
  function G() { return window.KinetGestion; }
  document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'rfr') H.reload();
  });

  /* ═════════ USUARIOS ═════════ */
  var U = { q: '', tier: '', role: '', flag: '', off: 0, lim: 30, rows: [] };
  S.usuarios = async function (ws) {
    var canEdit = H.can('subadmin');
    ws.innerHTML = H.head('Cuentas', 'Usuarios', 'Busca, filtra y abre la ficha de cualquier cuenta. Todo cambio queda registrado en la auditoría.', '') +
      '<div class="panel" style="margin-bottom:16px"><div class="row">' +
      '<div class="field" style="flex:2 1 240px"><label>Buscar</label><input class="inp" id="uq" placeholder="Correo, @usuario, nombre o club" value="' + esc(U.q) + '"></div>' +
      '<div class="field"><label>Plan</label><select data-kinet-select style="width:100%" class="inp" id="ut"><option value="">Todos</option><option value="free">Free</option><option value="pro">PRO</option><option value="club">CLUB</option></select></div>' +
      '<div class="field"><label>Perfil</label><select data-kinet-select style="width:100%" class="inp" id="ur"><option value="">Todos</option><option value="athlete">Atleta</option><option value="staff">Staff</option><option value="scout">Scout</option></select></div>' +
      '<div class="field"><label>Estado</label><select data-kinet-select style="width:100%" class="inp" id="uf"><option value="">Todos</option><option value="banned">Suspendidos</option><option value="verified">Verificados</option><option value="team">Equipo</option><option value="minor">Menores</option></select></div>' +
      '</div></div><div id="ulist">' + H.skeleton(2) + '</div>';
    $('#ut').value = U.tier; $('#ur').value = U.role; $('#uf').value = U.flag;
    var load = async function () {
      var box = $('#ulist'); if (!box) return;
      try {
        var r = await H.rpc('admin_list_users', { p_q: U.q, p_tier: U.tier, p_role: U.role, p_flag: U.flag, p_limit: U.lim, p_offset: U.off });
        U.rows = r.rows || [];
        var pages = Math.max(1, Math.ceil((r.total || 0) / U.lim)), pg = Math.floor(U.off / U.lim) + 1;
        box.innerHTML = '<div class="muted sm" style="margin-bottom:10px">' + H.num(r.total) + ' resultado' + (r.total === 1 ? '' : 's') + '</div>' +
          H.table([
            { h: 'Usuario', f: function (u) { return '<b>' + esc(u.full_name || '—') + '</b><div class="muted sm">' + esc(u.handle || '') + '</div>'; } },
            { h: 'Correo', f: function (u) { return '<span class="sm">' + esc(u.email || '—') + '</span>'; } },
            { h: 'Plan', f: function (u) { return H.tierChip(u.account_tier); } },
            { h: 'Perfil · deporte', f: function (u) { return esc(u.active_role || 'athlete') + '<div class="muted sm">' + esc(u.active_sport || '') + '</div>'; } },
            { h: 'Estado', f: function (u) { return (u.is_banned ? '<span class="chip ban">suspendido</span> ' : '') + (u.is_verified ? '<span class="chip ver">verificado</span> ' : '') + (u.staff_role ? '<span class="chip team">' + esc(u.staff_role) + '</span> ' : '') + (u.is_minor ? '<span class="chip">menor</span>' : ''); } },
            { h: 'Última act.', f: function (u) { return '<span class="muted sm">' + H.ago(u.updated_at) + '</span>'; } }
          ], U.rows, { click: true, empty: 'Ningún usuario coincide con el filtro' }) +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px"><button class="btn sm" id="upv"' + (U.off <= 0 ? ' disabled' : '') + '>← Anterior</button><span class="muted sm">Página ' + pg + ' de ' + pages + '</span><button class="btn sm" id="unx"' + (pg >= pages ? ' disabled' : '') + '>Siguiente →</button></div>';
        $$('#ulist tbody tr').forEach(function (tr) { tr.onclick = function () { H.openUser(U.rows[+tr.getAttribute('data-i')].id); }; });
        $('#upv').onclick = function () { U.off = Math.max(0, U.off - U.lim); load(); };
        $('#unx').onclick = function () { U.off += U.lim; load(); };
        if (window.KinetFX && KinetFX.rebuild) KinetFX.rebuild(box, { children: true, quick: true });
      } catch (e) { box.innerHTML = '<div class="panel"><div class="empty">⚠️ ' + esc(e.message) + '</div></div>'; }
    };
    var reset = function () { U.off = 0; load(); };
    $('#uq').oninput = H.debounce(function () { U.q = this.value.trim(); reset(); }, 280);
    $('#ut').onchange = function () { U.tier = this.value; reset(); };
    $('#ur').onchange = function () { U.role = this.value; reset(); };
    $('#uf').onchange = function () { U.flag = this.value; reset(); };
    load();
  };

  H.openUser = async function (idOrTarget) {
    H.openDrawer('<div class="skel" style="height:140px;margin-bottom:12px"></div><div class="skel"></div>');
    var d;
    try { d = await H.rpc('admin_user_detail', { p_target: idOrTarget }); } catch (e) { H.openDrawer('<p class="muted">⚠️ ' + esc(e.message) + '</p><button class="btn" onclick="KGP.helpers.closeDrawer()">Cerrar</button>'); return; }
    var p = d.profile || {}, canPlan = H.can('subadmin'), canBan = H.can('subadmin', 'moderator'), canVer = H.can('subadmin', 'scout_verifier');
    var target = p.email || p.handle || p.id;
    var ai = (d.ai || []), aiTot = ai.reduce(function (a, x) { return a + (x.strong || 0) + (x.lite || 0) + (x.aux || 0); }, 0), aiCost = ai.reduce(function (a, x) { return a + Number(x.cost_eur || 0); }, 0);
    var html = '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><div><div class="p-l">Ficha de cuenta</div><h3 class="ctx-title" style="font-size:1.25rem;margin-top:6px">' + esc(p.full_name || 'Sin nombre') + '</h3><div class="muted sm">' + esc(p.handle || '') + ' · ' + esc(p.email || '') + '</div></div><button class="btn sm" onclick="KGP.helpers.closeDrawer()">✕</button></div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:14px 0">' + H.tierChip(p.account_tier) + (p.is_banned ? '<span class="chip ban">suspendido</span>' : '') + (p.is_verified ? '<span class="chip ver">verificado</span>' : '') + (p.staff_role ? '<span class="chip team">' + esc(p.staff_role) + '</span>' : '') + (p.is_minor ? '<span class="chip">menor</span>' : '') + '</div>' +
      (p.is_banned ? '<div class="alert bad" style="cursor:default"><span>🚫</span><span>Motivo: ' + esc(p.ban_reason || '—') + '</span></div>' : '') +
      '<div class="panel" style="margin-bottom:12px;padding:14px"><div class="grid g2" style="gap:10px;font-size:.78rem">' +
      '<div><span class="muted">Perfil</span><br><b>' + esc(p.active_role || 'athlete') + '</b></div><div><span class="muted">Deporte</span><br><b>' + esc(p.active_sport || '—') + '</b></div>' +
      '<div><span class="muted">Club</span><br><b>' + esc(p.club || '—') + '</b></div><div><span class="muted">Minutos bonus</span><br><b>' + H.num(p.bonus_video_mins || 0) + '</b></div>' +
      '<div><span class="muted">Alta</span><br><b>' + H.date(p.created_at) + '</b></div><div><span class="muted">Última actividad</span><br><b>' + H.date(p.updated_at) + '</b></div>' +
      '<div><span class="muted">Vídeos en R2</span><br><b>' + H.num((d.videos || {}).n || 0) + ' · ' + H.bytes((d.videos || {}).bytes || 0) + '</b></div><div><span class="muted">Denuncias recibidas</span><br><b>' + H.num(d.reports_against || 0) + '</b></div>' +
      '<div><span class="muted">IA (14 días)</span><br><b>' + H.num(aiTot) + ' consultas</b></div><div><span class="muted">Coste IA (14 días)</span><br><b>' + H.eur(aiCost) + '</b></div></div></div>' +
      (ai.length ? '<div class="panel" style="margin-bottom:12px;padding:14px"><div class="p-l" style="margin-bottom:8px">Uso de IA por día</div>' + H.barChart(ai.slice().reverse().map(function (x) { return { x: String(x.day).slice(8, 10), y: (x.strong || 0) + (x.lite || 0) + (x.aux || 0) }; }), { h: 110 }) + '</div>' : '');
    if (canPlan) {
      html += '<div class="panel" style="margin-bottom:12px;padding:14px"><div class="p-l" style="margin-bottom:10px">Plan, minutos y rango</div><div class="row">' +
        '<div class="field"><label>Plan</label><select data-kinet-select style="width:100%" class="inp" id="dPlan"><option value="free">Free</option><option value="pro">PRO</option><option value="club">CLUB</option></select></div>' +
        '<div class="field"><label>Minutos bonus (0–595)</label><input class="inp" id="dMin" type="number" min="0" max="595" value="' + (Number(p.bonus_video_mins) || 0) + '"></div>' +
        '<div class="field"><label>Rango de equipo</label><select data-kinet-select style="width:100%" class="inp" id="dStaff"><option value="">Sin rango</option><option value="moderator">Moderación</option><option value="scout_verifier">Verificación B2B</option><option value="marketing">Marketing</option><option value="subadmin">Dirección (subadmin)</option>' + (H.can('superadmin') ? '<option value="superadmin">Jefe (superadmin)</option>' : '') + '</select></div></div>' +
        '<div style="margin-top:12px"><button class="btn pri" id="dSave">Guardar cambios</button></div></div>';
    }
    html += '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      (canBan ? (p.is_banned ? '<button class="btn" id="dUnban">✓ Reactivar cuenta</button>' : '<button class="btn bad" id="dBan">🚫 Suspender cuenta</button>') : '') +
      (canVer ? '<button class="btn" id="dVer">' + (p.is_verified ? 'Quitar verificación' : '✓ Verificar B2B') + '</button>' : '') +
      '<button class="btn" id="dCopy">Copiar correo</button></div>';
    var dr = H.openDrawer(html);
    if (canPlan) {
      $('#dPlan', dr).value = p.account_tier || 'free'; $('#dStaff', dr).value = p.staff_role || '';
      $('#dSave', dr).onclick = function () {
        var b = this;
        H.run(b, async function () {
          var min = Math.min(595, Math.max(0, parseFloat($('#dMin', dr).value) || 0));
          await H.rpc('admin_update_user', { target: target, tier: $('#dPlan', dr).value, bonus: min, staff: $('#dStaff', dr).value });
          H.openUser(idOrTarget);
        }, 'Cuenta actualizada');
      };
    }
    var ban = $('#dBan', dr); if (ban) ban.onclick = async function () {
      var why = await H.ask({ title: 'Suspender cuenta', text: 'La persona no podrá usar la app ni publicar. Indica el motivo (lo verá ella).', input: { label: 'Motivo', placeholder: 'Ej.: spam reiterado', value: 'Incumplimiento de las normas de KINET OS' }, ok: 'Suspender', danger: true });
      if (why === null) return;
      H.run(ban, async function () { await H.rpc('admin_set_ban', { p_target: target, p_banned: true, p_reason: why }); H.openUser(idOrTarget); }, 'Cuenta suspendida');
    };
    var unban = $('#dUnban', dr); if (unban) unban.onclick = function () { H.run(unban, async function () { await H.rpc('admin_set_ban', { p_target: target, p_banned: false, p_reason: null }); H.openUser(idOrTarget); }, 'Cuenta reactivada'); };
    var ver = $('#dVer', dr); if (ver) ver.onclick = function () { H.run(ver, async function () { await H.rpc('admin_set_verified', { p_target: target, p_verified: !p.is_verified }); H.openUser(idOrTarget); }, p.is_verified ? 'Verificación retirada' : 'Cuenta verificada'); };
    $('#dCopy', dr).onclick = function () { try { navigator.clipboard.writeText(p.email || ''); H.toast('Correo copiado'); } catch (e) { H.toast('No se pudo copiar', 'warn'); } };
  };

  /* ═════════ PLANES Y MINUTOS ═════════ */
  S.planes = async function (ws) {
    var o = await H.rpc('admin_overview');
    var pro = o.pro || 0, club = o.club || 0, mrr = pro * PRICE.pro + club * PRICE.club;
    var lst = await H.rpc('admin_list_users', { p_q: '', p_tier: '', p_role: '', p_flag: '', p_limit: 100, p_offset: 0 });
    var paidRows = (lst.rows || []).filter(function (u) { return u.account_tier === 'pro' || u.account_tier === 'club'; });
    ws.innerHTML = H.head('Negocio', 'Planes y minutos', 'Ingresos teóricos según el plan asignado, concesiones manuales y minutos de vídeo. Los cobros reales los ves en Stripe.', '') +
      '<div class="grid g4" style="margin-bottom:16px">' + H.kpi('Ingreso mensual teórico', mrr, { pre: '', suf: ' €', dec: 2, sub: 'PRO ' + pro + ' × 11,99 € + CLUB ' + club + ' × 39,99 €', cls: 'ok' }) +
      H.kpi('Usuarios PRO', pro, {}) + H.kpi('Usuarios CLUB', club, {}) + H.kpi('Conversión a pago', o.users_total ? 100 * (pro + club) / o.users_total : 0, { dec: 1, suf: ' %', sub: 'Sobre ' + H.num(o.users_total || 0) + ' cuentas' }) + '</div>' +
      '<div class="grid g2" style="margin-bottom:16px"><div class="panel"><div class="p-h"><span class="p-l">Conceder plan o minutos</span></div>' +
      '<div class="row"><div class="field" style="flex:2 1 200px"><label>Correo o @usuario</label><input class="inp" id="pTarget" placeholder="nombre@correo.com"></div>' +
      '<div class="field"><label>Plan</label><select data-kinet-select style="width:100%" class="inp" id="pPlan"><option value="">No cambiar</option><option value="free">Free</option><option value="pro">PRO</option><option value="club">CLUB</option></select></div>' +
      '<div class="field"><label>Minutos</label><input class="inp" id="pMin" type="number" min="0" max="595" placeholder="No cambiar"></div></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn sm" data-m="45">+45</button><button class="btn sm" data-m="150">+150</button><button class="btn sm" data-m="400">+400</button><button class="btn sm" data-m="595">Máx 595</button><button class="btn sm" data-m="0">0</button></div>' +
      '<div style="margin-top:14px"><button class="btn pri" id="pGo">Aplicar</button></div></div>' +
      '<div class="panel"><div class="p-h"><span class="p-l">Bonos de vídeo</span></div>' + H.hbars([{ l: 'Bono Partido', v: 45, t: '45 min · 1,99 €' }, { l: 'Pack Temporada', v: 150, t: '150 min · 3,99 €' }, { l: 'Club & Academia', v: 400, t: '400 min · 7,99 €' }]) +
      '<div class="muted sm" style="margin-top:12px;line-height:1.6">El monedero máximo por cuenta es de 595 minutos (45 + 150 + 400). Precios para miembros PRO; los usuarios Free pagan el doble.</div></div></div>' +
      '<div class="p-h"><span class="p-l">Cuentas de pago (' + paidRows.length + ')</span></div>' +
      H.table([
        { h: 'Usuario', f: function (u) { return '<b>' + esc(u.full_name || '—') + '</b><div class="muted sm">' + esc(u.email || '') + '</div>'; } },
        { h: 'Plan', f: function (u) { return H.tierChip(u.account_tier); } },
        { h: 'Minutos', f: function (u) { return H.num(u.bonus_video_mins || 0); } },
        { h: 'Equipo', f: function (u) { return u.staff_role ? '<span class="chip team">' + esc(u.staff_role) + '</span>' : '<span class="muted">—</span>'; } },
        { h: 'Act.', f: function (u) { return '<span class="muted sm">' + H.ago(u.updated_at) + '</span>'; } }
      ], paidRows, { click: true, empty: 'Todavía no hay cuentas de pago' });
    $$('#ws tbody tr').forEach(function (tr) { tr.onclick = function () { H.openUser(paidRows[+tr.getAttribute('data-i')].id); }; });
    $$('#ws [data-m]').forEach(function (b) { b.onclick = function () { $('#pMin').value = b.getAttribute('data-m'); }; });
    $('#pGo').onclick = function () {
      var t = $('#pTarget').value.trim(); if (!t) { H.toast('Indica el correo o @usuario', 'warn'); return; }
      var tier = $('#pPlan').value, mv = $('#pMin').value;
      if (!tier && mv === '') { H.toast('Elige un plan o unos minutos', 'warn'); return; }
      H.run(this, async function () { await H.rpc('admin_update_user', { target: t, tier: tier || null, bonus: mv === '' ? null : Math.min(595, Math.max(0, parseFloat(mv) || 0)), staff: null }); }, 'Cambios aplicados a ' + t);
    };
  };

  /* ═════════ MODERACIÓN ═════════ */
  var modTab = 'reports';
  S.moderacion = async function (ws) {
    ws.innerHTML = H.head('Comunidad', 'Moderación', 'Denuncias, publicaciones recientes y palabras bloqueadas. El filtro de palabras se aplica en el servidor aunque alguien se salte la web.', '') +
      '<div class="tabs" id="mt"><button class="tab" data-t="reports">🚩 Denuncias</button><button class="tab" data-t="posts">💬 Publicaciones</button><button class="tab" data-t="terms">🔤 Palabras bloqueadas</button></div><div id="mbody"></div>';
    var draw = async function () {
      $$('#mt .tab').forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-t') === modTab); });
      var box = $('#mbody'); box.innerHTML = H.skeleton(2);
      try { await MOD[modTab](box); } catch (e) { box.innerHTML = '<div class="panel"><div class="empty">⚠️ ' + esc(e.message) + '</div></div>'; }
      if (window.KinetFX && KinetFX.rebuild) KinetFX.rebuild(box, { children: true, quick: true });
    };
    $$('#mt .tab').forEach(function (t) { t.onclick = function () { modTab = t.getAttribute('data-t'); draw(); }; });
    draw();
  };
  async function banAuthor(handle) {
    if (!handle) return;
    var why = await H.ask({ title: 'Suspender a ' + handle, text: 'No podrá publicar ni usar la app. Indica el motivo.', input: { label: 'Motivo', value: 'Incumplimiento de las normas de KINET OS' }, ok: 'Suspender', danger: true });
    if (why === null) return;
    return H.run(null, function () { return H.rpc('admin_set_ban', { p_target: handle, p_banned: true, p_reason: why }); }, handle + ' suspendido');
  }
  var MOD = {
    reports: async function (box) {
      var st = MOD._st || 'nuevo';
      var rows = await H.rpc('admin_list_reports', { p_status: st, p_limit: 80 });
      box.innerHTML = '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">' + ['nuevo', 'en_curso', 'resuelto', 'descartado', ''].map(function (s) { return '<button class="btn sm' + (s === st ? ' pri' : '') + '" data-s="' + s + '">' + (s ? s.replace('_', ' ') : 'todas') + '</button>'; }).join('') + '</div>' +
        H.table([
          { h: 'Fecha', f: function (r) { return '<span class="muted sm">' + H.date(r.created_at) + '</span>'; } },
          { h: 'Qué', f: function (r) { return esc(r.target_type) + '<div class="muted sm">' + esc(r.target_handle || '') + '</div>'; } },
          { h: 'Motivo', f: function (r) { return esc(r.reason) + (r.excerpt ? '<div class="muted sm" style="max-width:340px">“' + esc(r.excerpt) + '”</div>' : ''); } },
          { h: 'Estado', f: function (r) { return '<span class="chip ' + esc(r.status) + '">' + esc(String(r.status).replace('_', ' ')) + '</span>'; } },
          { h: 'Acciones', f: function (r) { return '<div style="display:flex;gap:6px;flex-wrap:wrap">' + ['en_curso', 'resuelto', 'descartado'].filter(function (x) { return x !== r.status; }).map(function (x) { return '<button class="btn sm" data-r="' + r.id + '" data-v="' + x + '">' + x.replace('_', ' ') + '</button>'; }).join('') + (r.target_handle ? '<button class="btn sm bad" data-b="' + esc(r.target_handle) + '">Suspender</button>' : '') + '</div>'; } }
        ], rows, { empty: 'No hay denuncias en este estado 🎉' });
      $$('[data-s]', box).forEach(function (b) { b.onclick = function () { MOD._st = b.getAttribute('data-s'); MOD.reports(box); }; });
      $$('[data-r]', box).forEach(function (b) { b.onclick = function () { H.run(b, async function () { await H.rpc('admin_set_report', { p_id: +b.getAttribute('data-r'), p_status: b.getAttribute('data-v') }); await MOD.reports(box); }, 'Denuncia actualizada'); }; });
      $$('[data-b]', box).forEach(function (b) { b.onclick = function () { banAuthor(b.getAttribute('data-b')); }; });
    },
    posts: async function (box) {
      var rows = await H.rpc('admin_recent_posts', { p_limit: 40 });
      box.innerHTML = H.table([
        { h: 'Fecha', f: function (r) { return '<span class="muted sm">' + H.date(r.created_at) + '</span>'; } },
        { h: 'Autor', f: function (r) { return esc(r.author_handle || '—'); } },
        { h: 'Contenido', f: function (r) { return '<div style="max-width:460px;white-space:pre-wrap">' + esc(r.content || '(sin texto)') + '</div>'; } },
        { h: 'Acciones', f: function (r) { return '<div style="display:flex;gap:6px"><button class="btn sm bad" data-d="' + esc(r.id) + '">Borrar</button>' + (r.author_handle ? '<button class="btn sm" data-b="' + esc(r.author_handle) + '">Suspender autor</button>' : '') + '</div>'; } }
      ], rows, { empty: 'Aún no hay publicaciones' });
      $$('[data-d]', box).forEach(function (b) { b.onclick = async function () { var ok = await H.ask({ title: 'Borrar publicación', text: 'Se elimina de la comunidad para todos. No se puede deshacer.', ok: 'Borrar', danger: true }); if (!ok) return; H.run(b, async function () { await H.rpc('admin_delete_post', { p_id: b.getAttribute('data-d') }); await MOD.posts(box); }, 'Publicación borrada'); }; });
      $$('[data-b]', box).forEach(function (b) { b.onclick = function () { banAuthor(b.getAttribute('data-b')); }; });
    },
    terms: async function (box) {
      var t = await H.rpc('admin_blocked_terms');
      box.innerHTML = '<div class="panel"><div class="p-h"><span class="p-l">Palabras bloqueadas (' + t.length + ')</span></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">' +
        t.map(function (x) { return '<span class="chip" style="font-size:.7rem;padding:5px 6px 5px 12px">' + esc(x) + ' <button class="btn sm" data-x="' + esc(x) + '" style="padding:1px 7px;border-radius:99px">✕</button></span>'; }).join('') + '</div>' +
        '<div class="row"><div class="field" style="flex:2 1 220px"><label>Añadir palabra o expresión</label><input class="inp" id="tNew" placeholder="mínimo 3 letras"></div><button class="btn pri" id="tAdd">Añadir</button></div>' +
        '<div class="muted sm" style="margin-top:12px;line-height:1.6">Bloquea publicaciones y mensajes que contengan la expresión (sin distinguir mayúsculas). Úsalo con cuidado: una palabra corta puede bloquear palabras legítimas.</div></div>';
      $('#tAdd', box).onclick = function () { var v = $('#tNew', box).value.trim(); if (!v) return; H.run(this, async function () { await H.rpc('admin_set_term', { p_term: v, p_add: true }); await MOD.terms(box); }, 'Palabra añadida'); };
      $$('[data-x]', box).forEach(function (b) { b.onclick = function () { H.run(b, async function () { await H.rpc('admin_set_term', { p_term: b.getAttribute('data-x'), p_add: false }); await MOD.terms(box); }, 'Palabra eliminada'); }; });
    }
  };

  /* ═════════ SOPORTE ═════════ */
  var tkSt = 'nuevo';
  S.soporte = async function (ws) {
    var rows = await H.rpc('admin_list_tickets', { p_status: tkSt, p_limit: 80 });
    ws.innerHTML = H.head('Atención', 'Soporte', 'Tickets del formulario de contacto. Cambia su estado o responde por correo.', '') +
      '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">' + ['nuevo', 'en_curso', 'resuelto', 'descartado', ''].map(function (s) { return '<button class="btn sm' + (s === tkSt ? ' pri' : '') + '" data-s="' + s + '">' + (s ? s.replace('_', ' ') : 'todos') + '</button>'; }).join('') + '</div>' +
      (rows.length ? rows.map(function (t) {
        var subj = encodeURIComponent('Re: ' + t.reason + ' · KINET OS'), body = encodeURIComponent('Hola ' + (t.name || '') + ',\n\nGracias por escribirnos.\n\n');
        return '<div class="panel" style="margin-bottom:12px"><div class="p-h"><div><b>' + esc(t.name) + '</b> <span class="muted sm">· ' + esc(t.email) + '</span><div class="muted sm">' + H.date(t.created_at) + ' · ' + esc(t.reason) + (t.page ? ' · ' + esc(t.page) : '') + '</div></div><span class="chip ' + esc(t.status) + '">' + esc(String(t.status).replace('_', ' ')) + '</span></div>' +
          '<div style="white-space:pre-wrap;font-size:.84rem;line-height:1.55;margin-bottom:12px">' + esc(t.message) + '</div><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn sm pri" style="text-decoration:none" href="mailto:' + esc(t.email) + '?subject=' + subj + '&body=' + body + '">✉ Responder por correo</a>' +
          ['en_curso', 'resuelto', 'descartado'].filter(function (x) { return x !== t.status; }).map(function (x) { return '<button class="btn sm" data-t="' + t.id + '" data-v="' + x + '">' + x.replace('_', ' ') + '</button>'; }).join('') + '</div></div>';
      }).join('') : '<div class="panel"><div class="empty">No hay tickets en este estado 🎉</div></div>');
    $$('#ws [data-s]').forEach(function (b) { b.onclick = function () { tkSt = b.getAttribute('data-s'); H.reload(); }; });
    $$('#ws [data-t]').forEach(function (b) { b.onclick = function () { H.run(b, async function () { await H.rpc('admin_set_ticket', { p_id: +b.getAttribute('data-t'), p_status: b.getAttribute('data-v') }); H.reload(); }, 'Ticket actualizado'); }; });
  };

  /* ═════════ VERIFICACIÓN B2B ═════════ */
  S.verificacion = async function (ws) {
    var r = await H.rpc('admin_list_users', { p_q: '', p_tier: '', p_role: 'scout', p_flag: '', p_limit: 100, p_offset: 0 });
    var st = await H.rpc('admin_list_users', { p_q: '', p_tier: '', p_role: 'staff', p_flag: '', p_limit: 100, p_offset: 0 });
    var all = (r.rows || []).concat(st.rows || []);
    var pend = all.filter(function (u) { return !u.is_verified; }), ok = all.filter(function (u) { return u.is_verified; });
    var tbl = function (rows, verified) {
      return H.table([
        { h: 'Cuenta', f: function (u) { return '<b>' + esc(u.full_name || '—') + '</b><div class="muted sm">' + esc(u.handle || '') + ' · ' + esc(u.email || '') + '</div>'; } },
        { h: 'Perfil', f: function (u) { return esc(u.active_role); } }, { h: 'Club', f: function (u) { return esc(u.club || '—'); } }, { h: 'Plan', f: function (u) { return H.tierChip(u.account_tier); } },
        { h: '', f: function (u) { return '<button class="btn sm ' + (verified ? '' : 'pri') + '" data-v="' + esc(u.id) + '" data-on="' + (verified ? 0 : 1) + '">' + (verified ? 'Quitar' : '✓ Verificar') + '</button>'; } }
      ], rows, { empty: verified ? 'Aún no hay cuentas verificadas' : 'No hay cuentas pendientes' });
    };
    ws.innerHTML = H.head('B2B', 'Verificación de scouts y staff', 'Concede o retira el sello oficial. Comprueba antes la identidad y el club por un canal fiable (web del club, LinkedIn, llamada).', '') +
      '<div class="grid g3" style="margin-bottom:16px">' + H.kpi('Pendientes', pend.length, { cls: pend.length ? 'warn' : '' }) + H.kpi('Verificados', ok.length, { cls: 'ok' }) + H.kpi('Cuentas B2B', all.length) + '</div>' +
      '<div class="p-h"><span class="p-l">Pendientes de verificar</span></div>' + tbl(pend, false) + '<div class="p-h" style="margin-top:22px"><span class="p-l">Verificadas</span></div>' + tbl(ok, true);
    $$('#ws [data-v]').forEach(function (b) { b.onclick = function () { H.run(b, async function () { await H.rpc('admin_set_verified', { p_target: b.getAttribute('data-v'), p_verified: b.getAttribute('data-on') === '1' }); H.reload(); }, 'Hecho'); }; });
  };
})();
