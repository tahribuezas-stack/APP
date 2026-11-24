/* KINET OS · Panel de gestión · secciones B: marketing, IA, vídeo, regulación, equipo, auditoría, estado del sistema, pruebas. */
(function () {
  'use strict';
  var KGP = window.KGP, H = KGP.helpers, S = KGP.sections, esc = H.esc, $ = H.$, $$ = H.$$;
  var Gs = function () { return window.KinetGestion; };
  var B = function () { return window.KinetBackend; };
  var PRICE = { pro: 11.99, club: 39.99 };

  async function loadCfg() {
    var rows = await B().fetchPublicConfig(); var c = { announcement: {}, maintenance: {}, flags: {} }, up = {};
    (rows || []).forEach(function (r) { if (r && r.key in c) { c[r.key] = r.value || {}; up[r.key] = r.updated_at; } });
    c._up = up; return c;
  }
  function sw(id, on) { return '<label class="sw"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + '><span></span></label>'; }

  /* ═════════ MARKETING ═════════ */
  S.marketing = async function (ws) {
    var cfg = await loadCfg(), a = cfg.announcement || {};
    var sign = []; try { sign = await H.rpc('admin_signups_by_day', { p_days: 30 }); } catch (e) {}
    var o = await H.rpc('admin_overview');
    var total30 = sign.reduce(function (s, d) { return s + d.n; }, 0), best = sign.reduce(function (m, d) { return d.n > m.n ? d : m; }, { n: 0, day: '—' });
    var paid = (o.pro || 0) + (o.club || 0);
    var plantillas = [
      { t: 'Oferta PRO', text: 'Esta semana: prueba KINET PRO y desbloquea vídeo con IA, KINET Card y más.', level: 'promo', link: 'despacho.html#subscription' },
      { t: 'Nueva función', text: 'Novedad en KINET OS: ya puedes probar lo último desde el Vestuario.', level: 'info', link: 'app.html' },
      { t: 'Mantenimiento', text: 'Esta noche haremos mejoras en KINET OS. Podrías notar cortes breves.', level: 'warn', link: '' },
      { t: 'Comunidad', text: 'Comparte tu mejor jugada de la semana en Comunidad.', level: 'info', link: 'comunidad.html' }
    ];
    ws.innerHTML = H.head('Crecimiento', 'Marketing', 'Anuncios dentro de la app y métricas de captación. Un anuncio aparece como una tarjeta flotante que cada persona puede cerrar.', '') +
      '<div class="grid g4" style="margin-bottom:16px">' + H.kpi('Altas 30 días', total30, { sub: 'Mejor día: ' + String(best.day).slice(5) + ' (' + best.n + ')' }) + H.kpi('Altas 7 días', o.new_7d || 0) + H.kpi('Conversión a pago', o.users_total ? 100 * paid / o.users_total : 0, { dec: 1, suf: ' %' }) + H.kpi('Activos 7 días', o.active_7d || 0, { sub: o.users_total ? Math.round(100 * (o.active_7d || 0) / o.users_total) + ' % de la base' : '' }) + '</div>' +
      '<div class="grid g2"><div class="panel"><div class="p-h"><span class="p-l">Anuncio en la app</span>' + sw('aOn', a.enabled) + '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">' + plantillas.map(function (p, i) { return '<button class="btn sm" data-tp="' + i + '">' + esc(p.t) + '</button>'; }).join('') + '</div>' +
      '<div class="field" style="margin-bottom:10px"><label>Texto (máx. 220)</label><textarea class="inp" id="aText" maxlength="220">' + esc(a.text || '') + '</textarea></div>' +
      '<div class="row"><div class="field"><label>Tipo</label><select data-kinet-select style="width:100%" class="inp" id="aLevel"><option value="info">Información</option><option value="promo">Promoción</option><option value="warn">Aviso</option></select></div>' +
      '<div class="field"><label>Público</label><select data-kinet-select style="width:100%" class="inp" id="aAud"><option value="all">Todos</option><option value="free">Solo Free</option><option value="paid">Solo de pago</option><option value="pro">Solo PRO</option><option value="club">Solo CLUB</option></select></div></div>' +
      '<div class="row" style="margin-top:10px"><div class="field" style="flex:2 1 200px"><label>Enlace (opcional, p. ej. comunidad.html)</label><input class="inp" id="aLink" value="' + esc(a.link || '') + '"></div>' +
      '<div class="field"><label>Caduca (opcional)</label><input class="inp" id="aUntil" type="datetime-local"></div></div>' +
      '<div style="display:flex;gap:8px;margin-top:14px"><button class="btn pri" id="aSave">Publicar</button><button class="btn" id="aOff">Retirar anuncio</button></div>' +
      '<div class="muted sm" style="margin-top:10px">Última publicación: ' + H.date(cfg._up.announcement) + '</div></div>' +
      '<div class="panel"><div class="p-h"><span class="p-l">Vista previa</span></div><div id="aPrev"></div>' +
      '<div class="p-h" style="margin-top:20px"><span class="p-l">Altas por día</span></div>' + H.barChart(sign.map(function (d) { return { x: String(d.day).slice(8, 10), y: d.n }; }), { h: 130 }) + '</div></div>';
    $('#aLevel').value = a.level || 'info'; $('#aAud').value = a.audience || 'all';
    if (a.until) { try { var d = new Date(a.until); $('#aUntil').value = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); } catch (e) {} }
    var prev = function () {
      var lv = $('#aLevel').value, t = $('#aText').value.trim() || 'Aquí verás cómo queda tu anuncio…';
      $('#aPrev').innerHTML = '<div class="ann-prev ' + (lv === 'warn' ? 'warn' : lv === 'promo' ? 'promo' : '') + '"><span>' + (lv === 'warn' ? '⚠️' : lv === 'promo' ? '✨' : '📣') + '</span><span>' + esc(t) + '</span>' + ($('#aLink').value.trim() ? '<b style="color:var(--role-color);white-space:nowrap">Ver →</b>' : '') + '<span class="muted">✕</span></div>';
    };
    ['aText', 'aLevel', 'aLink'].forEach(function (i) { $('#' + i).oninput = prev; $('#' + i).onchange = prev; }); prev();
    $$('[data-tp]').forEach(function (b) { b.onclick = function () { var p = plantillas[+b.getAttribute('data-tp')]; $('#aText').value = p.text; $('#aLevel').value = p.level; $('#aLink').value = p.link; prev(); }; });
    var publish = function (btn, enabled) {
      var text = $('#aText').value.trim(); if (enabled && !text) { H.toast('Escribe el texto del anuncio', 'warn'); return; }
      var link = $('#aLink').value.trim(); if (link && !/^(https?:\/\/|[a-z0-9_\-]+\.html)/i.test(link)) { H.toast('El enlace debe ser https://… o una página como comunidad.html', 'warn'); return; }
      var until = $('#aUntil').value ? new Date($('#aUntil').value).toISOString() : '';
      H.run(btn, async function () { await H.rpc('admin_set_config', { p_key: 'announcement', p_value: { enabled: enabled, text: text, level: $('#aLevel').value, link: link, audience: $('#aAud').value, until: until } }); try { sessionStorage.removeItem('kinet_cfg_cache'); } catch (e) {} H.reload(); }, enabled ? 'Anuncio publicado' : 'Anuncio retirado');
    };
    $('#aSave').onclick = function () { publish(this, true); }; $('#aOff').onclick = function () { publish(this, false); };
    $('#aOn').onchange = function () { publish(null, this.checked); };
  };

  /* ═════════ IA Y COSTES ═════════ */
  S.ia = async function (ws) {
    var r = await H.rpc('admin_ai_usage', { p_days: 30 }), o = await H.rpc('admin_overview');
    var days = r.by_day || [], top = r.top_month || [];
    var sum = function (k) { return days.reduce(function (a, d) { return a + Number(d[k] || 0); }, 0); };
    var cost = sum('cost'), calls = sum('strong') + sum('lite') + sum('aux');
    var revenue = (o.pro || 0) * PRICE.pro + (o.club || 0) * PRICE.club;
    var pctRev = revenue ? 100 * (o.ai_cost_month || 0) / revenue : 0;
    ws.innerHTML = H.head('Inteligencia artificial', 'IA y costes', 'Consumo por día y por usuario. Regla del proyecto: la IA no debe superar el 33 % de lo que paga cada suscriptor.', '') +
      '<div class="grid g4" style="margin-bottom:16px">' + H.kpi('Coste del mes', o.ai_cost_month || 0, { suf: ' €', dec: 2, sub: 'Hoy ' + H.eur(o.ai_cost_today || 0) }) + H.kpi('Consultas (30 días)', calls, { sub: 'Potente ' + H.num(sum('strong')) + ' · Básica ' + H.num(sum('lite')) + ' · Aux. ' + H.num(sum('aux')) }) + H.kpi('Coste (30 días)', cost, { suf: ' €', dec: 2 }) +
      H.kpi('% sobre ingreso teórico', pctRev, { dec: 1, suf: ' %', sub: 'Tope fijado: 20 %', cls: pctRev > 20 ? 'bad' : pctRev > 15 ? 'warn' : 'ok' }) + '</div>' +
      '<div class="grid g2" style="margin-bottom:16px"><div class="panel"><div class="p-h"><span class="p-l">Consultas por día</span></div>' + H.barChart(days.map(function (d) { return { x: String(d.day).slice(8, 10), y: (d.strong || 0) + (d.lite || 0) + (d.aux || 0) }; })) + '</div>' +
      '<div class="panel"><div class="p-h"><span class="p-l">Coste por día (€)</span></div>' + H.lineChart(days.map(function (d) { return { x: String(d.day).slice(8, 10), y: Number(d.cost || 0), t: H.eur(d.cost) }; })) + '</div></div>' +
      '<div class="p-h"><span class="p-l">Mayores consumos del mes</span></div>' +
      H.table([
        { h: 'Usuario', f: function (u) { return '<b>' + esc(u.handle || '—') + '</b><div class="muted sm">' + esc(u.email || '') + '</div>'; } }, { h: 'Plan', f: function (u) { return H.tierChip(u.tier); } },
        { h: 'Consultas', f: function (u) { return H.num(u.calls); } }, { h: 'Coste', f: function (u) { return H.eur(u.cost); } },
        { h: 'vs. 20 % del precio', f: function (u) { var pr = PRICE[u.tier]; if (!pr) return '<span class="muted sm">sin plan de pago</span>'; var p = 100 * Number(u.cost) / (pr * 0.20); return '<span class="chip ' + (p > 100 ? 'ban' : p > 75 ? 'nuevo' : 'resuelto') + '">' + Math.round(p) + ' % del tope</span>'; } }
      ], top, { empty: 'Todavía no hay consumo registrado este mes' }) +
      '<div class="muted sm" style="margin-top:12px;line-height:1.6">El tope se calcula sobre el precio con IVA para que sea una referencia rápida. El límite real lo aplica la función <span class="mono">kinet-ai-chat</span> en el servidor.</div>';
  };

  /* ═════════ VÍDEO Y ALMACENAJE ═════════ */
  S.video = async function (ws) {
    var r = await H.rpc('admin_video_stats'), t = r.total || {}, days = r.by_day || [], top = r.top || [];
    var cfg = (window.KINET_API_CONFIG && KINET_API_CONFIG.videoStorage) || {};
    var GB = 1024 * 1024 * 1024, free = 10 * GB, pct = 100 * (t.bytes || 0) / free;
    ws.innerHTML = H.head('Almacenaje', 'Vídeo y R2', 'Uso del almacenamiento de vídeo en Cloudflare R2 y de quién lo consume.', '<a class="btn" style="text-decoration:none" target="_blank" rel="noopener" href="https://dash.cloudflare.com/">Abrir Cloudflare ↗</a>') +
      '<div class="grid g4" style="margin-bottom:16px">' + H.kpi('Archivos', t.files || 0, { sub: H.num(t.deleted || 0) + ' borrados' }) + H.kpi('Espacio usado', H.bytes(t.bytes || 0), { sub: 'Capa gratuita R2: 10 GB' }) + H.kpi('% de la capa gratuita', pct, { dec: 1, suf: ' %', cls: pct > 80 ? 'bad' : pct > 50 ? 'warn' : 'ok' }) + H.kpi('Límite por vídeo', (cfg.maxMB || 8) + ' MB', { sub: 'Proveedor: ' + (cfg.provider || '—') }) + '</div>' +
      '<div class="grid g2" style="margin-bottom:16px"><div class="panel"><div class="p-h"><span class="p-l">Subidas · últimos 14 días</span></div>' + H.barChart(days.map(function (d) { return { x: String(d.day).slice(8, 10), y: d.files, t: d.files + ' · ' + H.bytes(d.bytes) }; })) + '</div>' +
      '<div class="panel"><div class="p-h"><span class="p-l">Cuotas por plan</span></div>' + H.hbars([{ l: 'Free', v: 3, t: '3/día · 100 MB' }, { l: 'PRO', v: 10, t: '10/día · 1 GB' }, { l: 'CLUB', v: 30, t: '30/día · 5 GB' }]) + '<div class="muted sm" style="margin-top:10px;line-height:1.6">Las cuotas las impone la función <span class="mono">video-upload-url</span>. Para cambiarlas hay que editar esa función en Supabase.</div></div></div>' +
      '<div class="p-h"><span class="p-l">Mayores usuarios de almacenamiento</span></div>' +
      H.table([{ h: 'Usuario', f: function (u) { return '<b>' + esc(u.handle || '—') + '</b><div class="muted sm">' + esc(u.email || '') + '</div>'; } }, { h: 'Plan', f: function (u) { return H.tierChip(u.tier); } }, { h: 'Vídeos', f: function (u) { return H.num(u.files); } }, { h: 'Espacio', f: function (u) { return H.bytes(u.bytes); } }], top, { empty: 'Aún no se ha subido ningún vídeo' });
  };

  /* ═════════ REGULACIÓN DE LA APP ═════════ */
  var FLAGS = [
    { k: 'video_uploads_off', t: 'Pausar subida de vídeos', d: 'Nadie puede subir vídeos nuevos (los ya subidos se siguen viendo). Útil si R2 va mal o hay abuso.' },
    { k: 'ai_chat_off', t: 'Pausar el chat con la IA', d: 'El Cuerpo Técnico IA muestra un aviso en lugar de responder. Útil si hay un problema de costes o de proveedor.' },
    { k: 'ads_off', t: 'Ocultar todos los anuncios', d: 'Apaga los anuncios para cuentas gratuitas e invitados. Útil si un patrocinador falla o mientras se prueba la app.' },
    { k: 'community_readonly', t: 'Comunidad en solo lectura', d: 'Se puede ver la comunidad pero no publicar ni comentar. Útil durante una incidencia de moderación.' }
  ];
  S.config = async function (ws) {
    var cfg = await loadCfg(), m = cfg.maintenance || {}, fl = cfg.flags || {};
    ws.innerHTML = H.head('Control', 'Regulación de la app', 'Interruptores que cambian el comportamiento de KINET OS al instante, sin subir código. Los usuarios los reciben en menos de un minuto.', '<button class="btn" id="cfgRel">↻ Aplicar aquí ahora</button>') +
      '<div class="grid g2"><div class="panel"><div class="p-h"><span class="p-l">Modo mantenimiento</span>' + sw('mOn', m.enabled) + '</div>' +
      '<div class="muted sm" style="line-height:1.6;margin-bottom:12px">Bloquea la app para todos menos el equipo. Login, legal y soporte siguen accesibles. Tú sigues entrando con normalidad.</div>' +
      '<div class="field"><label>Mensaje para los usuarios</label><textarea class="inp" id="mMsg" maxlength="240">' + esc(m.message || 'Estamos mejorando KINET OS. Vuelve en unos minutos.') + '</textarea></div>' +
      '<div style="margin-top:12px"><button class="btn pri" id="mSave">Guardar mensaje</button></div><div class="muted sm" style="margin-top:8px">Última modificación: ' + H.date(cfg._up.maintenance) + '</div></div>' +
      '<div class="panel"><div class="p-h"><span class="p-l">Interruptores de funciones</span></div>' +
      FLAGS.map(function (f) { return '<div class="set"><div><b>' + esc(f.t) + '</b><small>' + esc(f.d) + '</small></div>' + sw('f_' + f.k, fl[f.k]) + '</div>'; }).join('') +
      '<div class="muted sm" style="margin-top:12px">Última modificación: ' + H.date(cfg._up.flags) + '</div></div></div>' +
      '<div class="panel" style="margin-top:16px"><div class="p-h"><span class="p-l">Configuración en vivo (lo que ven los usuarios)</span></div><div class="pre" id="cfgRaw"></div></div>';
    $('#cfgRaw').textContent = JSON.stringify({ announcement: cfg.announcement, maintenance: cfg.maintenance, flags: cfg.flags }, null, 2);
    var saveM = function (btn, on) {
      H.run(btn, async function () { await H.rpc('admin_set_config', { p_key: 'maintenance', p_value: { enabled: on, message: $('#mMsg').value.trim() || 'Estamos mejorando KINET OS. Vuelve en unos minutos.' } }); try { sessionStorage.removeItem('kinet_cfg_cache'); } catch (e) {} }, on ? 'Mantenimiento ACTIVADO' : 'Mantenimiento desactivado');
    };
    $('#mSave').onclick = function () { saveM(this, $('#mOn').checked); };
    $('#mOn').onchange = async function () {
      var on = this.checked, self = this;
      if (on) { var ok = await H.ask({ title: 'Activar mantenimiento', text: 'Todos los usuarios (menos el equipo) verán una pantalla de mantenimiento hasta que lo desactives.', ok: 'Activar', danger: true }); if (!ok) { self.checked = false; return; } }
      saveM(null, on);
    };
    FLAGS.forEach(function (f) {
      $('#f_' + f.k).onchange = function () {
        var next = Object.assign({}, fl); next[f.k] = this.checked; if (!this.checked) delete next[f.k]; fl = next;
        H.run(null, async function () { await H.rpc('admin_set_config', { p_key: 'flags', p_value: next }); try { sessionStorage.removeItem('kinet_cfg_cache'); } catch (e) {} }, f.t + (this.checked ? ': ACTIVADO' : ': desactivado'));
      };
    });
    $('#cfgRel').onclick = async function () { await Gs().reloadConfig(); H.toast('Configuración aplicada en este dispositivo'); };
  };

  /* ═════════ EQUIPO Y RANGOS ═════════ */
  S.equipo = async function (ws) {
    var team = await H.rpc('admin_team');
    var G = Gs(), names = G.ROLE_NAMES;
    var matrix = [['Panel general', 'todos'], ['Usuarios (ver y abrir ficha)', 'dirección · moderación · verificación'], ['Cambiar plan, minutos y rangos', 'dirección'], ['Suspender cuentas', 'dirección · moderación'], ['Borrar publicaciones y palabras', 'dirección · moderación'], ['Soporte y denuncias', 'dirección · moderación'], ['Verificar scouts y clubes', 'dirección · verificación'], ['Anuncios', 'dirección · marketing'], ['IA, vídeo, regulación, auditoría', 'dirección']];
    ws.innerHTML = H.head('Organización', 'Equipo y rangos', 'Quién tiene acceso al panel y a qué. El jefe y los administradores lo ven todo.', '') +
      '<div class="grid g2" style="margin-bottom:16px"><div class="panel"><div class="p-h"><span class="p-l">Dar o quitar un rango</span></div>' +
      '<div class="field" style="margin-bottom:10px"><label>Correo o @usuario</label><input class="inp" id="eT" placeholder="nombre@correo.com"></div>' +
      '<div class="field"><label>Rango</label><select data-kinet-select style="width:100%" class="inp" id="eR"><option value="moderator">Moderación</option><option value="scout_verifier">Verificación B2B</option><option value="marketing">Marketing</option><option value="subadmin">Dirección (subadmin)</option>' + (H.can('superadmin') ? '<option value="superadmin">Jefe (superadmin)</option>' : '') + '<option value="">— Quitar rango —</option></select></div>' +
      '<div style="margin-top:14px"><button class="btn pri" id="eGo">Aplicar</button></div><div class="muted sm" style="margin-top:10px;line-height:1.6">La persona verá el conmutador APP / GESTIÓN la próxima vez que abra la app.</div></div>' +
      '<div class="panel"><div class="p-h"><span class="p-l">Qué puede hacer cada equipo</span></div>' + matrix.map(function (m) { return '<div class="set"><b style="font-weight:600;font-size:.8rem">' + esc(m[0]) + '</b><span class="muted sm" style="text-align:right">' + esc(m[1]) + '</span></div>'; }).join('') + '</div></div>' +
      '<div class="p-h"><span class="p-l">Equipo actual (' + team.length + ')</span></div>' +
      H.table([
        { h: 'Persona', f: function (u) { return '<b>' + esc(u.full_name || '—') + '</b><div class="muted sm">' + esc(u.handle || '') + ' · ' + esc(u.email || '') + '</div>'; } },
        { h: 'Rango', f: function (u) { return '<span class="chip team">' + esc(names[u.staff_role] || u.staff_role) + '</span>'; } },
        { h: 'Última act.', f: function (u) { return '<span class="muted sm">' + H.ago(u.updated_at) + '</span>'; } },
        { h: '', f: function (u) { return '<button class="btn sm" data-o="' + esc(u.id) + '">Abrir ficha</button>'; } }
      ], team, { empty: 'Todavía no hay equipo' });
    $$('#ws [data-o]').forEach(function (b) { b.onclick = function () { H.openUser(b.getAttribute('data-o')); }; });
    $('#eGo').onclick = async function () {
      var t = $('#eT').value.trim(), r = $('#eR').value; if (!t) { H.toast('Indica el correo o @usuario', 'warn'); return; }
      var ok = await H.ask({ title: r ? 'Dar rango' : 'Quitar rango', text: r ? 'Se dará el rango «' + (names[r] || r) + '» a ' + t + '.' : 'Se quitará el rango de equipo a ' + t + '.', ok: 'Confirmar', danger: !r });
      if (!ok) return; H.run(this, async function () { await H.rpc('admin_update_user', { target: t, tier: null, bonus: null, staff: r }); H.reload(); }, 'Rango actualizado');
    };
  };

  /* ═════════ AUDITORÍA ═════════ */
  var auF = '';
  S.auditoria = async function (ws) {
    var rows = await H.rpc('admin_audit_list', { p_limit: 150, p_action: auF });
    var groups = [['', 'Todo'], ['user.', 'Usuarios'], ['report.', 'Denuncias'], ['ticket.', 'Tickets'], ['post.', 'Publicaciones'], ['term.', 'Palabras'], ['config.', 'Configuración']];
    ws.innerHTML = H.head('Trazabilidad', 'Auditoría', 'Registro de todo lo que hace el equipo desde el panel: quién, cuándo y sobre qué. No se puede editar ni borrar desde la app.', '') +
      '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">' + groups.map(function (g) { return '<button class="btn sm' + (g[0] === auF ? ' pri' : '') + '" data-f="' + g[0] + '">' + g[1] + '</button>'; }).join('') + '</div>' +
      H.table([
        { h: 'Cuándo', f: function (r) { return '<span class="muted sm">' + H.date(r.created_at) + '</span>'; } },
        { h: 'Quién', f: function (r) { return esc(r.actor_email || '—') + '<div class="muted sm">' + esc(r.actor_role || '') + '</div>'; } },
        { h: 'Acción', f: function (r) { return '<span class="chip">' + esc(r.action) + '</span>'; } },
        { h: 'Sobre', f: function (r) { return '<span class="sm">' + esc(r.target || '—') + '</span>'; } },
        { h: 'Detalle', f: function (r) { return '<span class="mono muted" style="font-size:.64rem;word-break:break-all">' + esc(r.detail ? JSON.stringify(r.detail).slice(0, 140) : '') + '</span>'; } }
      ], rows, { empty: 'Aún no hay actividad registrada' });
    $$('#ws [data-f]').forEach(function (b) { b.onclick = function () { auF = b.getAttribute('data-f'); H.reload(); }; });
  };

  /* ═════════ ESTADO DEL SISTEMA ═════════ */
  S.salud = async function (ws) {
    ws.innerHTML = H.head('Diagnóstico', 'Estado del sistema', 'Comprobaciones en vivo desde este dispositivo.', '<a class="btn" href="estado.html" target="_blank" rel="noopener" style="text-decoration:none">🌐 Página de estado (estado.html) ↗</a><button class="btn" id="shRe">↻ Repetir</button>') + '<div class="grid g2" id="shGrid"></div>';
    var checks = [], push = function (st, t, d) { checks.push({ st: st, t: t, d: d }); };
    var c = B().getClient && B().getClient(), t0 = performance.now(), ok = true;
    try { await B().fetchPublicConfig(); var ms = Math.round(performance.now() - t0); push(ms < 700 ? 'ok' : 'warn', 'Base de datos (Supabase)', 'Responde en ' + ms + ' ms'); } catch (e) { push('bad', 'Base de datos (Supabase)', 'No responde'); }
    try { var s = await c.auth.getSession(); var exp = s.data.session && s.data.session.expires_at; push(s.data.session ? 'ok' : 'bad', 'Sesión', s.data.session ? 'Activa · caduca ' + H.date(exp * 1000) : 'Sin sesión'); } catch (e) { push('bad', 'Sesión', 'Error'); }
    try { var ov = await H.rpc('admin_overview'); push('ok', 'SQL de gestión (07_gestion.sql)', 'Instalado y respondiendo'); push(ov.users_total != null ? 'ok' : 'warn', 'Tabla de perfiles', H.num(ov.users_total) + ' cuentas'); push(ov.terms != null ? 'ok' : 'warn', 'Moderación (03_moderacion_trafico.sql)', ov.terms != null ? ov.terms + ' palabras bloqueadas' : 'No encontrada'); push(ov.ai_cost_month != null ? 'ok' : 'warn', 'Límites de IA (05_ia_limites.sql)', ov.ai_cost_month != null ? 'Registrando consumo' : 'No encontrada'); push(ov.video_bytes != null ? 'ok' : 'warn', 'Vídeo R2 (06_video_r2.sql)', ov.video_bytes != null ? 'Registrando subidas' : 'No encontrada'); } catch (e) { push('bad', 'SQL de gestión', e.message); }
    try { await H.rpc('kinet_handle_free', { h: '@kinet_comprobacion' }); push('ok', 'SQL de usuario (08_usuario.sql)', 'Instalado: @usuario único y cambio cada 30 días activos'); } catch (e) { push('warn', 'SQL de usuario (08_usuario.sql)', 'No instalado todavía: ejecútalo en Supabase → SQL Editor'); }
    var cfg = (window.KINET_API_CONFIG || {}), vs = cfg.videoStorage || {};
    push(vs.provider === 'r2' ? 'ok' : 'warn', 'Almacenamiento de vídeo', vs.provider === 'r2' ? 'Cloudflare R2 · bucket ' + (vs.bucket || '—') : 'Sin configurar');
    push(cfg.edgeFunctionsDeployed ? 'ok' : 'warn', 'IA en el servidor (Edge Function)', cfg.edgeFunctionsDeployed ? 'Activada' : 'No marcada como desplegada');
    try { var sc = [].slice.call(document.scripts).map(function (x) { return (x.src.match(/kinet-backend\.js\?v=(\d+)/) || [])[1]; }).filter(Boolean)[0]; push('ok', 'Versión del código', sc ? 'v' + sc : 'desconocida'); } catch (e) {}
    push(navigator.onLine ? 'ok' : 'bad', 'Conexión de este dispositivo', navigator.onLine ? 'En línea' : 'Sin conexión');
    try { var bytes = 0; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); bytes += (k.length + (localStorage.getItem(k) || '').length) * 2; } push(bytes < 3.5e6 ? 'ok' : 'warn', 'Datos locales', H.bytes(bytes) + ' de ~5 MB en este navegador'); } catch (e) {}
    $('#shGrid').innerHTML = checks.map(function (x) { return '<div class="panel" style="padding:16px"><div style="display:flex;gap:12px;align-items:center"><span class="dot ' + x.st + '"></span><div><b style="font-size:.84rem">' + esc(x.t) + '</b><div class="muted sm" style="margin-top:2px">' + esc(x.d) + '</div></div></div></div>'; }).join('');
    $('#shRe').onclick = function () { H.reload(); };
  };

  /* ═════════ PRUEBAS (MODO DIOS) ═════════ */
  S.pruebas = async function (ws) {
    var email = localStorage.getItem('kinet_user_email') || '', tier = (localStorage.getItem('kinet_account_tier') || 'free').toLowerCase();
    ws.innerHTML = H.head('Sandbox', 'Pruebas (Modo Dios)', 'Cambia TU plan y tus minutos para probar la app como cualquier usuario. Se guarda en el servidor, así que no vuelve atrás al recargar.', '') +
      '<div class="grid g2"><div class="panel"><div class="p-h"><span class="p-l">Mi plan</span>' + H.tierChip(tier) + '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-p="free">Free</button><button class="btn" data-p="pro">PRO</button><button class="btn" data-p="club">CLUB</button></div>' +
      '<div class="muted sm" style="margin-top:12px;line-height:1.6">Tras cambiar, la app se recarga con el plan nuevo en todos tus dispositivos.</div></div>' +
      '<div class="panel"><div class="p-h"><span class="p-l">Mis minutos de vídeo</span></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-m="0">0</button><button class="btn" data-m="45">45</button><button class="btn" data-m="150">150</button><button class="btn" data-m="595">Máx 595</button></div></div></div>' +
      '<div class="grid g2" style="margin-top:16px"><div class="panel"><div class="p-h"><span class="p-l">Saltar de rol (mantiene tus datos)</span></div><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn" style="text-decoration:none;color:#00FF88;border-color:#00FF88" href="despacho.html?asrole=athlete">⚡ Atleta</a><a class="btn" style="text-decoration:none;color:#F59E0B;border-color:#F59E0B" href="despacho.html?asrole=staff">🧠 Staff</a><a class="btn" style="text-decoration:none;color:#3B82F6;border-color:#3B82F6" href="despacho.html?asrole=scout">📡 Scout</a></div><div class="muted sm" style="margin-top:12px;line-height:1.6">Te lleva al Despacho y cambia al perfil elegido.</div></div>' +
      '<div class="panel"><div class="p-h"><span class="p-l">Carta IA y chat del día</span></div><button class="btn" id="btnCardReset">🔓 Desbloquear Carta IA + resetear chat 00:00h</button><div class="muted sm" style="margin-top:12px;line-height:1.6">Marca tu KINET Card como descubierta y pone a 0 el contador diario del Cuerpo Técnico IA (solo en este dispositivo).</div></div></div>' +
      '<div class="panel" style="margin-top:16px"><div class="p-h"><span class="p-l">Atajos</span></div><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn" style="text-decoration:none" href="despacho.html">Despacho & Ajustes</a><a class="btn" style="text-decoration:none" href="estado.html">Estado de sincronización</a><a class="btn" style="text-decoration:none" href="app.html?staff=1">Ver la app como usuario</a></div></div>';
    var cr = $('#btnCardReset'); if (cr) cr.onclick = function () { var sp = (localStorage.getItem('kinet_sport') || 'Fútbol').toLowerCase(); localStorage.setItem('kinet_card_discovered_' + sp, 'true'); localStorage.setItem('kinet_ai_daily_used', '0'); H.toast('Carta IA desbloqueada y chat reseteado'); };
    $$('#ws [data-p]').forEach(function (b) { b.onclick = function () { H.run(b, async function () { await H.rpc('admin_update_user', { target: email, tier: b.getAttribute('data-p'), bonus: null, staff: null }); try { await B().syncPrivilegedFromServer(); } catch (e) {} H.reload(); }, 'Plan cambiado a ' + b.getAttribute('data-p').toUpperCase()); }; });
    $$('#ws [data-m]').forEach(function (b) { b.onclick = function () { H.run(b, async function () { await H.rpc('admin_update_user', { target: email, tier: null, bonus: +b.getAttribute('data-m'), staff: null }); try { await B().syncPrivilegedFromServer(); } catch (e) {} }, 'Minutos fijados en ' + b.getAttribute('data-m')); }; });
  };
})();
