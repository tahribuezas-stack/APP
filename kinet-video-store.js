/* ==========================================================
   KINET OS · Vídeo ligero: compresor (máx. 20 s) + almacenamiento económico configurable
   - prepare(file)  -> recorta a 20 s, reescala (máx. 720 p) y reduce el bitrate (≈ 3 MB por clip de 20 s) en el navegador.
   - upload(blob)   -> lo envía al proveedor elegido en window.KINET_API_CONFIG.videoStorage:
        provider: 'none'      (por defecto: no se sube nada; el clip solo vive en el dispositivo)
                  'r2'        (Cloudflare R2: 10 GB gratis, sin coste de descarga; firma una Edge Function de Supabase)
                  'supabase'  (Supabase Storage: úsalo solo para pruebas; consume tu cuota de almacenamiento)
   Así el vídeo NO consume el almacenamiento de Supabase en producción. Ver supabase/LEEME_VIDEO_Y_MODERACION.md
   ========================================================== */
(function () {
  'use strict';
  if (window.KinetVideo) return;

  var MAX_SECONDS = 20;
  var PRESETS = {
    normal: { maxSide: 720, vbps: 1400000, abps: 64000 },
    ligero: { maxSide: 480, vbps: 800000, abps: 48000 }
  };

  function cfg() {
    var c = (window.KINET_API_CONFIG && window.KINET_API_CONFIG.videoStorage) || {};
    return Object.assign({ provider: 'none', bucket: 'kinet-videos', functionName: 'video-upload-url', maxMB: 8, quality: 'normal' }, c);
  }

  function loadMeta(file) {
    return new Promise(function (res, rej) {
      var v = document.createElement('video'); v.preload = 'metadata'; v.muted = true;
      v.onloadedmetadata = function () { res({ duration: v.duration, width: v.videoWidth, height: v.videoHeight, el: v }); };
      v.onerror = function () { rej(new Error('No se puede leer este vídeo. Usa MP4, MOV o WebM.')); };
      v.src = URL.createObjectURL(file);
    });
  }

  function pickMime() {
    var list = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
    for (var i = 0; i < list.length; i++) { try { if (MediaRecorder.isTypeSupported(list[i])) return list[i]; } catch (e) {} }
    return '';
  }

  // Comprime y recorta. onProgress(0..1). Devuelve { blob, mime, duration, width, height, sizeMB, trimmed }
  async function prepare(file, opts) {
    opts = opts || {};
    if (!window.MediaRecorder) throw new Error('Tu navegador no puede comprimir vídeo. Usa Chrome, Edge o Safari actualizado.');
    var q = PRESETS[opts.quality || cfg().quality] || PRESETS.normal;
    var meta = await loadMeta(file);
    var dur = Math.min(meta.duration || MAX_SECONDS, MAX_SECONDS);
    var trimmed = (meta.duration || 0) > MAX_SECONDS + 0.2;
    var scale = Math.min(1, q.maxSide / Math.max(meta.width || q.maxSide, meta.height || q.maxSide));
    var W = Math.max(2, Math.round((meta.width * scale) / 2) * 2), H = Math.max(2, Math.round((meta.height * scale) / 2) * 2);

    var v = document.createElement('video'); v.playsInline = true; v.muted = false; v.volume = 1; v.preload = 'auto';
    v.src = URL.createObjectURL(file);
    await new Promise(function (res, rej) { v.onloadeddata = res; v.onerror = function () { rej(new Error('No se puede leer este vídeo.')); }; });

    var canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
    var cx = canvas.getContext('2d');
    var stream = canvas.captureStream(30);

    // Audio sin que suene por los altavoces: WebAudio -> MediaStreamDestination
    var actx = null;
    try {
      var AC = window.AudioContext || window.webkitAudioContext; actx = new AC();
      var src = actx.createMediaElementSource(v), dest = actx.createMediaStreamDestination();
      src.connect(dest); dest.stream.getAudioTracks().forEach(function (t) { stream.addTrack(t); });
      if (actx.state === 'suspended') await actx.resume();
    } catch (e) { /* sin audio: se graba solo la imagen */ }

    var mime = pickMime();
    var rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: q.vbps, audioBitsPerSecond: q.abps } : { videoBitsPerSecond: q.vbps });
    var chunks = []; rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    var done = new Promise(function (res) { rec.onstop = res; });

    var stopped = false, raf = 0;
    function draw() {
      if (stopped) return;
      try { cx.drawImage(v, 0, 0, W, H); } catch (e) {}
      if (opts.onProgress) opts.onProgress(Math.min(1, v.currentTime / dur));
      if (v.currentTime >= dur || v.ended) { finish(); return; }
      raf = requestAnimationFrame(draw);
    }
    function finish() { if (stopped) return; stopped = true; cancelAnimationFrame(raf); try { v.pause(); } catch (e) {} try { rec.stop(); } catch (e) {} }

    rec.start(250);
    v.currentTime = 0;
    await v.play();
    raf = requestAnimationFrame(draw);
    v.onended = finish;
    await done;
    try { stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
    try { if (actx) actx.close(); } catch (e) {}
    URL.revokeObjectURL(v.src);

    var outMime = (rec.mimeType || mime || 'video/webm').split(';')[0];
    var blob = new Blob(chunks, { type: outMime });
    if (opts.onProgress) opts.onProgress(1);
    return { blob: blob, mime: outMime, duration: dur, width: W, height: H, sizeMB: +(blob.size / 1048576).toFixed(2), trimmed: trimmed };
  }

  // Sube al proveedor configurado. Devuelve { ok, url, provider } o { ok:false, reason }
  async function upload(blob, meta) {
    var c = cfg();
    if (c.provider === 'none' || !c.provider) return { ok: false, reason: 'sin-almacenamiento' };
    if (blob.size > c.maxMB * 1048576) return { ok: false, reason: 'demasiado-grande' };
    var sb = window.KinetBackend && KinetBackend.getClient ? KinetBackend.getClient() : null;
    if (!sb) return { ok: false, reason: 'sin-sesion' };
    var ext = /mp4/.test(blob.type) ? 'mp4' : 'webm';
    try {
      if (c.provider === 'r2') {
        var r = await sb.functions.invoke(c.functionName, { body: { contentType: blob.type, size: blob.size } });
        if (r.error || !r.data || !r.data.uploadUrl) {
          // La función devuelve el motivo (límite diario, cuota llena…) en el cuerpo de la respuesta de error
          var why = 'firma-rechazada';
          try { var ctx = r.error && r.error.context; var j = ctx && ctx.json ? await ctx.json() : null; if (j && j.error) why = j.error; } catch (e) {}
          return { ok: false, reason: why };
        }
        var put = await fetch(r.data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': blob.type }, body: blob });
        if (!put.ok) return { ok: false, reason: 'subida-fallida' };
        return { ok: true, url: r.data.publicUrl, key: r.data.key, provider: 'r2' };
      }
      if (c.provider === 'supabase') {
        var uid = (await sb.auth.getUser()).data.user; uid = uid && uid.id; if (!uid) return { ok: false, reason: 'sin-sesion' };
        var path = uid + '/' + Date.now() + '.' + ext;
        var up = await sb.storage.from(c.bucket).upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: false });
        if (up.error) return { ok: false, reason: 'subida-fallida' };
        return { ok: true, url: sb.storage.from(c.bucket).getPublicUrl(path).data.publicUrl, provider: 'supabase' };
      }
    } catch (e) { return { ok: false, reason: 'error' }; }
    return { ok: false, reason: 'proveedor-desconocido' };
  }

  // Borra un clip propio de R2 (por URL pública o clave). Con { all:true } borra todos los del usuario (borrado de cuenta).
  async function remove(urlOrKey, opts) {
    var c = cfg();
    if (c.provider !== 'r2') return { ok: false, reason: 'sin-almacenamiento' };
    var sb = window.KinetBackend && KinetBackend.getClient ? KinetBackend.getClient() : null;
    if (!sb) return { ok: false, reason: 'sin-sesion' };
    try {
      var body = (opts && opts.all) ? { action: 'delete-all' } : { action: 'delete', url: String(urlOrKey || '') };
      var r = await sb.functions.invoke(c.functionName, { body: body });
      if (r.error) return { ok: false, reason: 'error' };
      return { ok: true, deleted: r.data && r.data.deleted };
    } catch (e) { return { ok: false, reason: 'error' }; }
  }

  // Texto claro para el usuario según el motivo devuelto por upload()
  function reasonText(reason) {
    var m = {
      'sin-almacenamiento': 'El almacenamiento de vídeo aún no está activado en KINET OS.',
      'demasiado-grande': 'El vídeo pesa demasiado. Prueba con calidad "ligero" o un clip más corto.',
      'limite-diario': 'Has llegado al límite de vídeos de hoy para tu plan. Mañana podrás subir más, o pasa a un plan superior.',
      'cuota-llena': 'Tu espacio de vídeo está lleno. Borra algún clip antiguo o pasa a un plan superior.',
      'formato': 'Formato no admitido. Usa MP4 o WebM.',
      'sin-sesion': 'Inicia sesión para subir vídeos.'
    };
    return m[reason] || 'No se pudo subir el vídeo (' + reason + ').';
  }

  window.KinetVideo = { MAX_SECONDS: MAX_SECONDS, config: cfg, prepare: prepare, upload: upload, remove: remove, reasonText: reasonText };
})();
