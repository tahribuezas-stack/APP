/* ==========================================================
   KINET OS · CV deportivo profesional
   Genera un CV de una página (A4) con foto de perfil, estilo editorial (sin cajas de "informe").
   Uso:  KinetCV.open(profile)   -> abre la vista del CV y lanza "Guardar como PDF" / imprimir
         KinetCV.fromLocal()     -> arma el perfil del usuario desde localStorage
   profile = { name, handle, sport, role, position, club, category, city, hometown, age, anthro, laterality,
               bio, tmUrl, vidUrl, avatar, grl, stats[6], statLabels[6], marketOpen, clips }
   ========================================================== */
(function () {
  'use strict';
  if (window.KinetCV) return;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function initials(n) { var p = String(n || '').trim().split(/\s+/); return ((p[0] || 'K')[0] + (p.length > 1 ? p[1][0] : '')).toUpperCase(); }
  function safeUrl(u) { u = String(u || '').trim(); if (!u) return ''; if (!/^https?:\/\//i.test(u)) u = 'https://' + u; try { return new URL(u).href; } catch (e) { return ''; } }
  function shortUrl(u) { return String(u).replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, ''); }

  var ROLE = {
    athlete: { label: 'Deportista', accent: '#00B368' },
    staff: { label: 'Entrenador / Cuerpo técnico', accent: '#D97706' },
    scout: { label: 'Ojeador / Dirección deportiva', accent: '#2563EB' }
  };

  var STAT_LABELS = {
    'Fútbol': ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'], 'Baloncesto': ['PTS', '3PT', 'AST', 'REB', 'DEF', 'ATH'],
    'Boxeo / MMA': ['PWR', 'SPD', 'STA', 'DEF', 'CHN', 'IQ'], 'Pádel / Tenis': ['SRV', 'VOL', 'BND', 'DEF', 'SPD', 'MNT'],
    'Running': ['VO2', 'PAC', 'CAD', 'STA', 'REC', 'MNT'], 'Otros Deportes': ['VEL', 'FZA', 'TEC', 'RES', 'TAC', 'MEN']
  };
  function canonSport(raw) {
    try { if (window.KinetSport) { var n = KinetSport.terms(raw).name; return n; } } catch (e) {}
    return raw || 'Fútbol';
  }

  function fromLocal() {
    var sport = ls('kinet_sport') || 'Fútbol';
    var stats = null; try { var a = JSON.parse(ls('kinet_custom_card_stats') || 'null'); if (Array.isArray(a) && a.length === 6) stats = a; } catch (e) {}
    var labels = STAT_LABELS[canonSport(sport)] || null;
    var bio = ls('kinet_social_bio') || ls('kinet_user_bio') || '';
    if (/^Perfil Verificado KINET OS/i.test(bio)) bio = '';
    var h = ls('kinet_height') || '', w = ls('kinet_weight') || '';
    var avatar = ls('kinet_user_avatar') || '';
    if (avatar === 'null' || avatar === 'undefined' || avatar.length < 12) avatar = '';
    var age = ls('kinet_age') || ls('kinet_age_years_direct') || '';
    var bd = ls('kinet_user_birthdate') || ls('kinet_birth_date');
    if (bd) { var b = new Date(bd); if (!isNaN(b)) { var n = new Date(), y = n.getFullYear() - b.getFullYear(); if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) y--; if (y > 4 && y < 100) age = String(y); } }
    var clips = 0; try { clips = (JSON.parse(ls('kinet_vision_clean_sessions_' + String(sport).toLowerCase()) || '[]') || []).length; } catch (e) {}
    return {
      name: ls('kinet_user_name') || 'Usuario KINET', handle: ls('kinet_social_handle') || '', sport: sport,
      role: ls('kinet_active_role') || 'athlete', position: ls('kinet_position') || '', club: ls('kinet_user_club') || '',
      category: ls('kinet_user_category') || '', city: ls('kinet_user_city') || '', hometown: ls('kinet_user_hometown') || '',
      age: age, anthro: (h && w) ? (h + ' · ' + w) : (ls('kinet_user_anthropometry') || ''), laterality: ls('kinet_user_laterality') || '',
      bio: bio, tmUrl: ls('kinet_user_transfermarkt') || '', vidUrl: ls('kinet_user_videolink') || '', avatar: avatar,
      grl: stats ? Math.round(stats.reduce(function (x, y) { return x + y; }, 0) / 6) : null, stats: stats, statLabels: labels,
      marketOpen: ls('kinet_market_open') !== 'false', clips: clips
    };
  }

  function row(label, val) {
    if (!val) return '';
    return '<div class="kv"><span>' + esc(label) + '</span><b>' + esc(val) + '</b></div>';
  }

  function build(p) {
    var role = ROLE[p.role] || ROLE.athlete;
    var pos = (p.position && !/^pro$|por asignar/i.test(p.position)) ? p.position : '';
    var headline = [p.sport, pos].filter(Boolean).join('  ·  ');
    var tm = safeUrl(p.tmUrl), vid = safeUrl(p.vidUrl);
    var bio = String(p.bio || '').trim();
    if (!bio) {
      bio = (pos ? pos : role.label) + (p.sport ? ' de ' + p.sport : '') + (p.club ? ', actualmente en ' + p.club : '') + (p.category ? ' (' + p.category + ')' : '') + (p.city ? '. Residente en ' + p.city : '') + '.';
    }
    var photo = p.avatar
      ? '<img class="photo" src="' + esc(p.avatar) + '" alt="" onerror="this.style.visibility=\'hidden\'">'
      : '<div class="photo ph">' + esc(initials(p.name)) + '</div>';

    var statsHtml = '';
    if (p.stats && p.stats.length === 6) {
      var labels = (p.statLabels && p.statLabels.length === 6) ? p.statLabels : (STAT_LABELS[canonSport(p.sport)] || ['1', '2', '3', '4', '5', '6']);
      statsHtml = '<div class="grl"><b>' + esc(p.grl) + '</b><span>VALORACIÓN KINET CARD</span></div>' +
        p.stats.map(function (v, i) {
          var pct = Math.max(0, Math.min(100, ((+v - 40) / 59) * 100));
          return '<div class="bar"><span>' + esc(labels[i]) + '</span><i><u style="width:' + pct.toFixed(0) + '%"></u></i><em>' + esc(v) + '</em></div>';
        }).join('');
    } else {
      statsHtml = '<div class="muted">KINET Card pendiente de calibrar.</div>';
    }

    var links = '';
    if (tm) links += '<a href="' + esc(tm) + '">' + esc(shortUrl(tm)) + '</a><small>Ficha oficial</small>';
    if (vid) links += '<a href="' + esc(vid) + '">' + esc(shortUrl(vid)) + '</a><small>Vídeo / highlights</small>';

    var data = [
      row('Demarcación / especialidad', pos), row('Club / entidad', p.club), row('Categoría / nivel', p.category),
      row('Ciudad actual', p.city), row('Ciudad natal', p.hometown), row('Edad', p.age ? p.age + ' años' : ''),
      row('Altura · peso', p.anthro), row('Lateralidad', p.laterality)
    ].join('');

    var today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

    return '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>CV · ' + esc(p.name) + '</title>' +
      '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Orbitron:wght@700;900&display=swap" rel="stylesheet">' +
      '<style>' +
      '@page{size:A4;margin:0}*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
      'html,body{margin:0;background:#E5E7EB;font-family:Inter,Helvetica,Arial,sans-serif;color:#1F2937}' +
      '.bar-top{position:sticky;top:0;z-index:5;display:flex;gap:10px;justify-content:center;align-items:center;padding:10px;background:#0B1220;color:#CBD5E1;font-size:13px}' +
      '.bar-top button{background:' + role.accent + ';color:#fff;border:0;border-radius:8px;padding:8px 16px;font-weight:700;cursor:pointer;font-family:inherit}' +
      '.page{width:210mm;min-height:297mm;margin:14px auto;background:#fff;display:grid;grid-template-columns:68mm 1fr;box-shadow:0 8px 30px rgba(0,0,0,.18)}' +
      '.side{background:#0B1220;color:#E2E8F0;padding:14mm 8mm 10mm 9mm;display:flex;flex-direction:column;gap:7mm}' +
      '.photo{width:42mm;height:42mm;border-radius:50%;object-fit:cover;display:block;margin:0 auto;border:1.2mm solid ' + role.accent + ';background:#16213A}' +
      '.photo.ph{display:flex;align-items:center;justify-content:center;font-family:Orbitron,sans-serif;font-weight:900;font-size:30pt;color:' + role.accent + '}' +
      '.side h4{margin:0 0 2.2mm;font-size:7.4pt;letter-spacing:.2em;color:' + role.accent + ';text-transform:uppercase;font-weight:700;border-bottom:.25mm solid rgba(255,255,255,.14);padding-bottom:1.6mm}' +
      '.side a{display:block;color:#fff;font-size:8.2pt;text-decoration:none;word-break:break-all;font-weight:600}.side small{display:block;color:#94A3B8;font-size:7pt;margin:.4mm 0 2.6mm}' +
      '.side p{margin:0 0 1.6mm;font-size:8.4pt;line-height:1.35}.side .lbl{color:#94A3B8;font-size:7pt;display:block}' +
      '.grl{display:flex;align-items:baseline;gap:3mm;margin-bottom:3mm}.grl b{font-family:Orbitron,sans-serif;font-size:26pt;color:#fff;line-height:1}.grl span{font-size:6.8pt;letter-spacing:.14em;color:#94A3B8}' +
      '.bar{display:grid;grid-template-columns:11mm 1fr 7mm;align-items:center;gap:2mm;margin-bottom:1.8mm;font-size:7.6pt}.bar span{color:#CBD5E1;font-weight:600}' +
      '.bar i{display:block;height:1.6mm;border-radius:1mm;background:rgba(255,255,255,.12);overflow:hidden}.bar u{display:block;height:100%;background:' + role.accent + ';border-radius:1mm}.bar em{font-style:normal;text-align:right;color:#fff;font-weight:700}' +
      '.muted{color:#94A3B8;font-size:8pt}' +
      '.brand{margin-top:auto;display:flex;align-items:center;gap:2.4mm;font-family:Orbitron,sans-serif;font-weight:900;letter-spacing:.16em;font-size:8pt;color:#fff}' +
      '.brand b{width:7mm;height:7mm;border-radius:2mm;background:' + role.accent + ';color:#04060A;display:flex;align-items:center;justify-content:center;font-size:9pt;letter-spacing:0}' +
      '.main{padding:15mm 13mm 12mm 12mm}' +
      '.main h1{font-family:Orbitron,sans-serif;font-weight:900;font-size:23pt;line-height:1.1;margin:0 0 2mm;color:#0B1220;letter-spacing:.01em}' +
      '.main .hl{font-size:10.5pt;font-weight:700;color:' + role.accent + ';letter-spacing:.04em;margin-bottom:1.5mm}.main .hd{font-size:8.6pt;color:#6B7280}' +
      '.rule{height:.6mm;width:22mm;background:' + role.accent + ';margin:5mm 0 6mm}' +
      '.main h2{font-size:8.4pt;letter-spacing:.22em;text-transform:uppercase;color:#0B1220;margin:7mm 0 3mm;padding-bottom:1.6mm;border-bottom:.3mm solid #D1D5DB;font-weight:800}' +
      '.main p{font-size:9.6pt;line-height:1.6;margin:0;color:#374151}' +
      '.kv{display:grid;grid-template-columns:48mm 1fr;gap:4mm;padding:2.1mm 0;border-bottom:.2mm solid #EEF0F3;font-size:9.2pt}.kv span{color:#6B7280}.kv b{font-weight:600;color:#111827}' +
      '.avail{display:inline-block;margin-top:1mm;font-size:9pt;font-weight:700;color:#065F46;background:#D1FAE5;border-radius:99px;padding:1.2mm 4mm}.avail.no{color:#92400E;background:#FEF3C7}' +
      '.foot{margin-top:10mm;font-size:7.4pt;color:#9CA3AF}' +
      '@media print{html,body{background:#fff;margin:0}.bar-top{display:none}.page{margin:0;box-shadow:none;width:210mm;height:296mm;min-height:0;overflow:hidden;page-break-after:avoid}}' +
      '@media screen and (max-width:820px){.page{width:100%;grid-template-columns:1fr}.main{padding:10mm}}' +
      '</style></head><body>' +
      '<div class="bar-top"><span>Vista previa del CV</span><button onclick="window.print()">Descargar PDF</button><span style="opacity:.7">En el cuadro de impresión elige «Guardar como PDF»</span></div>' +
      '<div class="page">' +
        '<aside class="side">' + photo +
          '<div><h4>Contacto</h4>' + (p.handle ? '<p><span class="lbl">Usuario KINET</span>' + esc(p.handle) + '</p>' : '') + (p.city ? '<p><span class="lbl">Ubicación</span>' + esc(p.city) + '</p>' : '') + '</div>' +
          (links ? '<div><h4>Enlaces</h4>' + links + '</div>' : '') +
          '<div><h4>KINET Card</h4>' + statsHtml + '</div>' +
          '<div class="brand"><b>K</b>KINET OS</div>' +
        '</aside>' +
        '<main class="main">' +
          '<h1>' + esc(p.name) + '</h1>' +
          '<div class="hl">' + esc(headline || role.label) + '</div>' +
          '<div class="hd">' + esc(role.label) + (p.club ? ' · ' + esc(p.club) : '') + '</div>' +
          '<div class="rule"></div>' +
          '<h2 style="margin-top:0">Perfil</h2><p>' + esc(bio) + '</p>' +
          (data ? '<h2>Datos deportivos</h2>' + data : '') +
          '<h2>Disponibilidad</h2><span class="avail' + (p.marketOpen === false ? ' no' : '') + '">' + (p.marketOpen === false ? 'Contrato en vigor' : 'Abierto a ofertas y pruebas') + '</span>' +
          (p.clips ? '<h2>Análisis de vídeo</h2><p>' + esc(p.clips) + ' sesión(es) de vídeo analizadas con KINET Vision Lab.</p>' : '') +
          '<div class="foot">Documento generado desde KINET OS el ' + esc(today) + '. Los datos son los declarados por el usuario' + (p.clips ? ' y los analizados en la plataforma' : '') + '.</div>' +
        '</main>' +
      '</div>' +
      '<script>window.addEventListener("load",function(){setTimeout(function(){try{window.print()}catch(e){}},700)})<\/script>' +
      '</body></html>';
  }

  function open(profile) {
    var p = profile || fromLocal();
    var w = window.open('', '_blank', 'width=960,height=1100');
    if (!w) { alert('Tu navegador ha bloqueado la ventana del CV. Permite las ventanas emergentes para este sitio e inténtalo de nuevo.'); return null; }
    w.document.open(); w.document.write(build(p)); w.document.close();
    return w;
  }

  window.KinetCV = { open: open, build: build, fromLocal: fromLocal };
})();
