/* KINET OS · Sensores (pasos, GPS, pulsómetro Bluetooth, importar GPX/TCX) y seguimiento externo (Club & Scout).
   Todo funciona en el navegador, sin servidor y sin coste. Expone KinetSensors.open() y KinetSensors.openTracking(). */
(function (root) {
  'use strict';
  var LS = root.localStorage;
  function g(k, d) { try { var v = LS.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function sset(k, v) { try { LS.setItem(k, v); } catch (e) {} }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function json(k, d) { try { var v = JSON.parse(g(k, '')); return v == null ? d : v; } catch (e) { return d; } }
  function tier() { var t = String(g('kinet_account_tier', 'free')).toLowerCase(); return t === 'club' || t === 'pro' ? t : 'free'; }

  /* ------------------------------ PASOS (DeviceMotion) ------------------------------ */
  var stepState = { on: false, last: 0, mag: 9.8, handler: null };
  function stepsKey() { return 'kinet_steps_' + today(); }
  function stepsToday() { return parseInt(g(stepsKey(), '0'), 10) || 0; }
  function purgeOldSteps() {
    try { Object.keys(LS).forEach(function (k) { if (/^kinet_steps_\d{4}-\d{2}-\d{2}$/.test(k) && k !== stepsKey()) { var d = k.slice(12); var hist = json('kinet_steps_history', {}); hist[d] = parseInt(LS.getItem(k), 10) || 0; var keys = Object.keys(hist).sort().slice(-30), out = {}; keys.forEach(function (x) { out[x] = hist[x]; }); sset('kinet_steps_history', JSON.stringify(out)); LS.removeItem(k); } }); } catch (e) {}
  }
  function startSteps(cb) {
    if (stepState.on) return cb && cb(true);
    var go = function () {
      stepState.handler = function (e) {
        var a = e.accelerationIncludingGravity; if (!a) return;
        var m = Math.sqrt((a.x || 0) * (a.x || 0) + (a.y || 0) * (a.y || 0) + (a.z || 0) * (a.z || 0));
        stepState.mag = stepState.mag * 0.85 + m * 0.15;               // paso bajo
        var dev = m - stepState.mag, now = Date.now();
        if (dev > 2.2 && now - stepState.last > 330) {
          stepState.last = now; sset(stepsKey(), String(stepsToday() + 1)); sset('kinet_sensor_steps_on', '1');
          var el = document.getElementById('ks-steps'); if (el) el.textContent = stepsToday().toLocaleString('es-ES');
        }
      };
      root.addEventListener('devicemotion', stepState.handler);
      stepState.on = true; sset('kinet_sensor_steps_on', '1'); cb && cb(true);
    };
    try {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission().then(function (r) { r === 'granted' ? go() : cb && cb(false, 'Permiso denegado. Actívalo en Ajustes → Safari → Movimiento y orientación.'); }).catch(function () { cb && cb(false, 'No se pudo pedir el permiso.'); });
      } else if (typeof DeviceMotionEvent !== 'undefined' && ('ontouchstart' in root || navigator.maxTouchPoints > 0)) go();
      else cb && cb(false, 'Este dispositivo no tiene sensor de movimiento (abre KINET OS desde tu móvil).');
    } catch (e) { cb && cb(false, 'Tu navegador no permite leer el movimiento.'); }
  }
  function stopSteps() { if (stepState.handler) root.removeEventListener('devicemotion', stepState.handler); stepState.on = false; stepState.handler = null; sset('kinet_sensor_steps_on', '0'); }

  /* ------------------------------ PULSÓMETRO (Web Bluetooth) ------------------------------ */
  var hr = { dev: null, bpm: 0, samples: [] };
  async function connectHR(onBpm, done) {
    if (!navigator.bluetooth) return done && done(false, 'Tu navegador no admite Bluetooth. Usa Chrome en Android o en ordenador (en iPhone no está disponible).');
    try {
      var dev = await navigator.bluetooth.requestDevice({ filters: [{ services: ['heart_rate'] }] });
      var srv = await dev.gatt.connect(), svc = await srv.getPrimaryService('heart_rate'), ch = await svc.getCharacteristic('heart_rate_measurement');
      await ch.startNotifications();
      ch.addEventListener('characteristicvaluechanged', function (ev) {
        var v = ev.target.value, flags = v.getUint8(0), bpm = (flags & 1) ? v.getUint16(1, true) : v.getUint8(1);
        hr.bpm = bpm; hr.samples.push(bpm); if (hr.samples.length > 4000) hr.samples.shift();
        sset('kinet_hr_last', JSON.stringify({ bpm: bpm, ts: Date.now(), avg: Math.round(hr.samples.reduce(function (a, b) { return a + b; }, 0) / hr.samples.length), max: Math.max.apply(null, hr.samples.slice(-4000)) }));
        onBpm && onBpm(bpm);
      });
      hr.dev = dev; sset('kinet_sensor_hr_name', dev.name || 'Pulsómetro');
      dev.addEventListener('gattserverdisconnected', function () { onBpm && onBpm(0); });
      done && done(true, dev.name || 'Pulsómetro');
    } catch (e) { done && done(false, e && e.name === 'NotFoundError' ? 'No se eligió ningún dispositivo.' : 'No se pudo conectar. Comprueba que el pulsómetro esté encendido y emparejable.'); }
  }

  /* ------------------------------ IMPORTAR GPX / TCX ------------------------------ */
  function hav(a, b) { var R = 6371000, r = Math.PI / 180, dl = (b.lat - a.lat) * r, dn = (b.lon - a.lon) * r, x = Math.sin(dl / 2) * Math.sin(dl / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dn / 2) * Math.sin(dn / 2); return 2 * R * Math.asin(Math.sqrt(x)); }
  function parseActivity(text, name) {
    var doc = new DOMParser().parseFromString(text, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('Archivo no válido');
    var pts = [], hrs = [];
    var tp = doc.getElementsByTagName('trkpt'); var isTcx = false;
    if (!tp.length) { tp = doc.getElementsByTagName('Trackpoint'); isTcx = true; }
    for (var i = 0; i < tp.length; i++) {
      var n = tp[i], lat, lon, t, h = null;
      if (!isTcx) {
        lat = parseFloat(n.getAttribute('lat')); lon = parseFloat(n.getAttribute('lon'));
        var te = n.getElementsByTagName('time')[0]; t = te ? Date.parse(te.textContent) : NaN;
        var all = n.getElementsByTagName('*'); for (var j = 0; j < all.length; j++) if (/(^|:)hr$/i.test(all[j].nodeName)) h = parseFloat(all[j].textContent);
      } else {
        var pos = n.getElementsByTagName('Position')[0]; lat = pos ? parseFloat((pos.getElementsByTagName('LatitudeDegrees')[0] || {}).textContent) : NaN; lon = pos ? parseFloat((pos.getElementsByTagName('LongitudeDegrees')[0] || {}).textContent) : NaN;
        var tt = n.getElementsByTagName('Time')[0]; t = tt ? Date.parse(tt.textContent) : NaN;
        var hb = n.getElementsByTagName('HeartRateBpm')[0]; if (hb) h = parseFloat((hb.getElementsByTagName('Value')[0] || {}).textContent);
      }
      if (!isNaN(h) && h > 30 && h < 230) hrs.push(h);
      if (!isNaN(lat) && !isNaN(lon)) pts.push({ lat: lat, lon: lon, t: t });
    }
    if (pts.length < 2 && !hrs.length) throw new Error('El archivo no contiene recorrido');
    var dist = 0, vmax = 0;
    for (var k = 1; k < pts.length; k++) { var d = hav(pts[k - 1], pts[k]); dist += d; var dt = (pts[k].t - pts[k - 1].t) / 1000; if (dt > 0 && d / dt < 12) vmax = Math.max(vmax, d / dt * 3.6); }
    var t0 = pts.length ? pts[0].t : NaN, t1 = pts.length ? pts[pts.length - 1].t : NaN;
    var dur = (!isNaN(t0) && !isNaN(t1)) ? Math.round((t1 - t0) / 60000) : 0;
    return { id: 'act_' + Date.now(), name: String(name || 'Actividad').replace(/\.(gpx|tcx)$/i, '').slice(0, 60), date: !isNaN(t0) ? new Date(t0).toISOString().slice(0, 10) : today(), km: +(dist / 1000).toFixed(2), min: dur, vmax: +vmax.toFixed(1), hrAvg: hrs.length ? Math.round(hrs.reduce(function (a, b) { return a + b; }, 0) / hrs.length) : 0, hrMax: hrs.length ? Math.max.apply(null, hrs) : 0 };
  }
  function saveActivity(a) { var l = json('kinet_imported_activities', []); l.unshift(a); sset('kinet_imported_activities', JSON.stringify(l.slice(0, 30))); }

  /* ------------------------------ UI ------------------------------ */
  function box(id, title, inner) {
    var ov = document.getElementById(id);
    if (!ov) { ov = document.createElement('div'); ov.id = id; ov.className = 'kinet-modal-overlay'; ov.addEventListener('click', function (e) { if (e.target === ov) ov.classList.remove('open'); }); document.body.appendChild(ov); }
    ov.innerHTML = '<div class="kinet-modal-box" style="max-width:560px;max-height:88vh;display:flex;flex-direction:column;"><div class="kinet-modal-header" style="color:var(--role-color);"><span>' + title + '</span></div><div class="kinet-modal-body" style="overflow:auto;">' + inner + '</div><div class="kinet-modal-footer"><button class="btn-secondary" onclick="document.getElementById(\'' + id + '\').classList.remove(\'open\')">Cerrar</button></div></div>';
    requestAnimationFrame(function () { ov.classList.add('open'); });
    return ov;
  }
  var CARD = 'background:rgba(4,6,10,.85);border:1px solid var(--border-subtle,#1e293b);border-radius:14px;padding:12px 14px;margin-bottom:10px;';
  var H = 'font-family:\'JetBrains Mono\',monospace;font-size:.64rem;color:var(--role-color);font-weight:700;letter-spacing:.06em;display:block;margin-bottom:6px;';
  var P = 'font-size:.74rem;color:#94A3B8;line-height:1.45;margin:0 0 8px;';

  function activitiesHTML() {
    var l = json('kinet_imported_activities', []);
    if (!l.length) return '<div style="' + P + '">Aún no has importado ninguna actividad.</div>';
    return l.slice(0, 5).map(function (a) { return '<div style="display:flex;justify-content:space-between;gap:8px;font-size:.72rem;color:#E2E8F0;padding:5px 0;border-top:1px solid rgba(255,255,255,.05)"><span>' + esc(a.date) + ' · ' + esc(a.name) + '</span><span style="color:var(--role-color);font-family:\'JetBrains Mono\'">' + a.km + ' km · ' + a.min + ' min' + (a.hrAvg ? ' · ' + a.hrAvg + ' ppm' : '') + '</span></div>'; }).join('');
  }

  function open() {
    purgeOldSteps();
    var gpsOk = g('kinet_sensor_gps_ok', '') === '1', hrName = g('kinet_sensor_hr_name', '');
    var html =
      '<div style="' + CARD + '"><span style="' + H + '">🚶 PASOS Y MOVIMIENTO</span><p style="' + P + '">Cuenta tus pasos con el sensor de tu móvil. Solo suma mientras KINET OS está abierto (limitación de los navegadores).</p>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><div><span style="font:800 1.5rem \'JetBrains Mono\',monospace;color:#fff" id="ks-steps">' + stepsToday().toLocaleString('es-ES') + '</span> <span style="font-size:.7rem;color:#94A3B8">pasos hoy</span></div><button type="button" class="btn-secondary" id="ks-steps-btn" style="margin:0">' + (stepState.on ? '⏸ Pausar' : '▶ Activar contador') + '</button></div><div id="ks-steps-msg" style="font-size:.7rem;color:#F59E0B;margin-top:6px"></div></div>' +

      '<div style="' + CARD + '"><span style="' + H + '">📍 UBICACIÓN / GPS</span><p style="' + P + '">Permite a KINET OS usar el GPS de tu dispositivo para medir distancia y velocidad en tus sesiones al aire libre.</p>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><span id="ks-gps-state" style="font-size:.74rem;color:' + (gpsOk ? 'var(--role-color)' : '#94A3B8') + '">' + (gpsOk ? '✓ Permiso concedido' : 'Sin permiso todavía') + '</span><button type="button" class="btn-secondary" id="ks-gps-btn" style="margin:0">Dar permiso GPS</button></div></div>' +

      '<div style="' + CARD + '"><span style="' + H + '">❤️ PULSÓMETRO BLUETOOTH</span><p style="' + P + '">Banda pectoral o reloj que emita pulso por Bluetooth (Polar, Garmin HRM, Wahoo, Coospo…). Funciona en Chrome para Android y ordenador.</p>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px"><div><span style="font:800 1.5rem \'JetBrains Mono\',monospace;color:#fff" id="ks-bpm">' + (hr.bpm || '--') + '</span> <span style="font-size:.7rem;color:#94A3B8" id="ks-hr-name">' + (hrName ? 'ppm · ' + esc(hrName) : 'ppm') + '</span></div><button type="button" class="btn-secondary" id="ks-hr-btn" style="margin:0">Conectar pulsómetro</button></div><div id="ks-hr-msg" style="font-size:.7rem;color:#F59E0B;margin-top:6px"></div></div>' +

      '<div style="' + CARD + '"><span style="' + H + '">📥 IMPORTAR ACTIVIDAD (GARMIN · STRAVA · APPLE WATCH · COROS)</span><p style="' + P + '">Exporta tu actividad como <strong>.GPX</strong> o <strong>.TCX</strong> desde tu app (Garmin Connect, Strava, Apple Fitness, Polar Flow…) y súbela aquí: KINET calcula distancia, tiempo, velocidad máxima y pulso, y tus entrenadores IA lo tendrán en cuenta.</p>' +
      '<input type="file" id="ks-file" accept=".gpx,.tcx,application/gpx+xml,application/xml,text/xml" multiple style="width:100%;font-size:.72rem;color:#94A3B8"><div id="ks-file-msg" style="font-size:.7rem;color:#F59E0B;margin-top:6px"></div><div id="ks-acts" style="margin-top:8px">' + activitiesHTML() + '</div></div>' +

      '<div style="' + CARD + 'opacity:.9"><span style="' + H + 'color:#94A3B8">🔗 CONEXIÓN DIRECTA CON CUENTAS (EN CAMINO)</span><p style="' + P + 'margin:0">Strava, Garmin Connect, Apple Salud y Google Fit necesitan un enlace seguro con servidor (OAuth) que aún no está activo. Hasta entonces, usa la importación de arriba: es instantánea y no comparte tus claves con nadie.</p></div>';
    box('kinet-sensors-modal', '📡 SENSORES & ACTIVIDAD', html);

    var $ = function (id) { return document.getElementById(id); };
    $('ks-steps-btn').onclick = function () {
      var b = this;
      if (stepState.on) { stopSteps(); b.textContent = '▶ Activar contador'; return; }
      startSteps(function (ok, msg) { $('ks-steps-msg').textContent = ok ? '' : (msg || ''); if (ok) b.textContent = '⏸ Pausar'; });
    };
    $('ks-gps-btn').onclick = function () {
      if (!navigator.geolocation) { $('ks-gps-state').textContent = 'Tu navegador no tiene geolocalización'; return; }
      navigator.geolocation.getCurrentPosition(function () { sset('kinet_sensor_gps_ok', '1'); $('ks-gps-state').textContent = '✓ Permiso concedido'; $('ks-gps-state').style.color = 'var(--role-color)'; }, function () { $('ks-gps-state').textContent = 'Permiso denegado: actívalo en los ajustes del navegador'; $('ks-gps-state').style.color = '#F59E0B'; }, { timeout: 12000 });
    };
    $('ks-hr-btn').onclick = function () {
      $('ks-hr-msg').textContent = 'Buscando…';
      connectHR(function (b) { $('ks-bpm').textContent = b || '--'; }, function (ok, msg) { $('ks-hr-msg').textContent = ok ? '' : msg; if (ok) $('ks-hr-name').textContent = 'ppm · ' + msg; });
    };
    $('ks-file').onchange = function () {
      var files = Array.prototype.slice.call(this.files || []), done = 0, bad = 0;
      $('ks-file-msg').textContent = '';
      files.forEach(function (f) {
        if (f.size > 15 * 1024 * 1024) { bad++; return; }
        var r = new FileReader();
        r.onload = function () { try { saveActivity(parseActivity(String(r.result), f.name)); done++; } catch (e) { bad++; } finish(); };
        r.onerror = function () { bad++; finish(); };
        r.readAsText(f);
      });
      var left = files.length; function finish() { if (--left > 0) return; $('ks-acts').innerHTML = activitiesHTML(); $('ks-file-msg').textContent = (done ? '✓ ' + done + ' actividad(es) importada(s). ' : '') + (bad ? bad + ' archivo(s) no válidos (usa .gpx o .tcx de hasta 15 MB).' : ''); $('ks-file-msg').style.color = bad ? '#F59E0B' : 'var(--role-color)'; }
    };
  }

  /* ------------------------------ SEGUIMIENTO EXTERNO (Club & Scout) ------------------------------ */
  function mdLite(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/^\s*[-•*]\s+/gm, '• ').replace(/\n/g, '<br>'); }
  function trackList() { return json('kinet_tracking_list', []); }
  function saveTrack(l) { sset('kinet_tracking_list', JSON.stringify(l.slice(0, 60))); }
  function trackRows() {
    var l = trackList();
    if (!l.length) return '<div style="' + P + '">Todavía no sigues a nadie. Añade un deportista y pulsa «Actualizar» para traer lo último que haya público.</div>';
    return l.map(function (e) {
      return '<div style="' + CARD + '"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><div><strong style="color:#fff;font-size:.84rem">' + esc(e.name) + '</strong><div style="font-size:.68rem;color:#94A3B8">' + esc([e.sport, e.club].filter(Boolean).join(' · ') || 'Sin datos') + '</div></div><div style="display:flex;gap:6px;flex-shrink:0"><button type="button" class="btn-secondary" data-up="' + e.id + '" style="margin:0;padding:5px 10px">↻ Actualizar</button><button type="button" class="btn-secondary" data-del="' + e.id + '" style="margin:0;padding:5px 10px" title="Dejar de seguir">✕</button></div></div>' +
        (e.last ? '<div style="font-size:.72rem;color:#CBD5E1;line-height:1.5;margin-top:8px;border-top:1px solid rgba(255,255,255,.06);padding-top:8px">' + mdLite(e.last.text) + '<div style="font-size:.62rem;color:#64748B;margin-top:5px">Actualizado: ' + new Date(e.last.ts).toLocaleString('es-ES') + '</div></div>' : '') + '</div>';
    }).join('');
  }
  function openTracking() {
    if (tier() !== 'club') {
      box('kinet-tracking-modal', '🌐 SEGUIMIENTO EXTERNO', '<div style="' + CARD + '"><p style="' + P + '">El <strong>seguimiento de deportistas fuera de la app</strong> (club actual, minutos, resultados y noticias públicas de la prensa deportiva) es una función del plan <strong style="color:var(--role-color)">Club & Scout Pro</strong>.</p><button type="button" class="btn-primary" style="width:100%;padding:11px" onclick="document.getElementById(\'kinet-tracking-modal\').classList.remove(\'open\');if(typeof requestPlanUpgrade===\'function\')requestPlanUpgrade(\'club\')">Ver plan Club & Scout (29,99 €/mes)</button></div>');
      return;
    }
    var html = '<div style="' + CARD + '"><span style="' + H + '">➕ SEGUIR A UN DEPORTISTA</span>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px"><input id="kt-name" class="setting-input" placeholder="Nombre y apellidos" maxlength="80" style="grid-column:1/3"><input id="kt-sport" class="setting-input" placeholder="Deporte" maxlength="30"><input id="kt-club" class="setting-input" placeholder="Club (si lo sabes)" maxlength="50"></div>' +
      '<button type="button" class="btn-primary" id="kt-add" style="width:100%;padding:9px">Añadir al seguimiento</button><div id="kt-msg" style="font-size:.7rem;color:#F59E0B;margin-top:6px"></div></div>' +
      '<div id="kt-list">' + trackRows() + '</div>' +
      '<p style="font-size:.64rem;color:#64748B;line-height:1.45;margin-top:6px">Solo se busca información <strong>pública y deportiva</strong> (club, estadísticas, resultados, noticias). No se rastrean datos personales, contacto ni redes privadas, y <strong>no está disponible para menores de edad</strong>. La IA puede equivocarse o confundir homónimos: contrasta siempre con la fuente. Cada actualización consume 1 consulta de tu cupo diario.</p>';
    box('kinet-tracking-modal', '🌐 SEGUIMIENTO EXTERNO DE DEPORTISTAS', html);
    var $ = function (id) { return document.getElementById(id); };
    function bind() {
      $('kt-list').innerHTML = trackRows();
      Array.prototype.forEach.call($('kt-list').querySelectorAll('[data-del]'), function (b) { b.onclick = function () { saveTrack(trackList().filter(function (x) { return x.id !== b.getAttribute('data-del'); })); bind(); }; });
      Array.prototype.forEach.call($('kt-list').querySelectorAll('[data-up]'), function (b) {
        b.onclick = async function () {
          var id = b.getAttribute('data-up'), l = trackList(), e = l.filter(function (x) { return x.id === id; })[0]; if (!e) return;
          if (!root.KinetAPIs || !KinetAPIs.trackPublicAthlete) { $('kt-msg').textContent = 'La IA no está disponible ahora mismo.'; return; }
          b.disabled = true; b.textContent = 'Buscando…';
          var r = await KinetAPIs.trackPublicAthlete({ name: e.name, sport: e.sport, club: e.club });
          if (r && r.ok) { e.last = { text: r.text, ts: Date.now() }; saveTrack(l); } else { $('kt-msg').textContent = (r && r.error) || 'No se pudo actualizar.'; }
          bind();
        };
      });
    }
    $('kt-add').onclick = function () {
      var n = $('kt-name').value.trim(); if (n.length < 3) { $('kt-msg').textContent = 'Escribe el nombre del deportista.'; return; }
      var l = trackList(); if (l.length >= 40) { $('kt-msg').textContent = 'Has llegado al máximo de 40 deportistas en seguimiento.'; return; }
      l.unshift({ id: 'tr_' + Date.now(), name: n.slice(0, 80), sport: $('kt-sport').value.trim().slice(0, 30), club: $('kt-club').value.trim().slice(0, 50), last: null });
      saveTrack(l); $('kt-name').value = ''; $('kt-sport').value = ''; $('kt-club').value = ''; $('kt-msg').textContent = ''; bind();
    };
    bind();
  }

  // Resumen para los entrenadores IA (se añade al contexto del atleta)
  function aiSummary() {
    var parts = [], st = stepsToday(); if (st > 0) parts.push('Pasos hoy: ' + st);
    var a = json('kinet_imported_activities', [])[0]; if (a) parts.push('Última actividad importada (' + a.date + '): ' + a.km + ' km en ' + a.min + ' min' + (a.vmax ? ', vel. máx. ' + a.vmax + ' km/h' : '') + (a.hrAvg ? ', pulso medio ' + a.hrAvg : ''));
    var h = json('kinet_hr_last', null); if (h && Date.now() - h.ts < 6 * 3600 * 1000) parts.push('Pulso reciente: ' + h.bpm + ' ppm (media ' + h.avg + ', máx. ' + h.max + ')');
    return parts.join(' · ');
  }

  // Reanudar el contador si ya estaba activado y el navegador lo permite sin pedir permiso
  try { if (g('kinet_sensor_steps_on', '') === '1' && typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission !== 'function') startSteps(); } catch (e) {}

  root.KinetSensors = { open: open, openTracking: openTracking, stepsToday: stepsToday, aiSummary: aiSummary, parseActivity: parseActivity };
})(typeof window !== 'undefined' ? window : globalThis);
