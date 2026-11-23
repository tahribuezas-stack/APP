/* ==========================================================
   KINET OS · Moderación de contenido y control de tráfico (coste 0)
   Capas:
   1) Texto: filtro de pornografía, insultos/odio, amenazas (normaliza tildes, leetspeak y separadores).
   2) Imagen / vídeo: clasificador NSFW que corre EN EL NAVEGADOR (TensorFlow.js + nsfwjs, se descarga solo
      cuando alguien sube una imagen o un vídeo). No cuesta nada y la imagen no sale del dispositivo.
   3) Tráfico: límites de publicaciones y mensajes por tiempo y por plan (además del límite en servidor: supabase/03_moderacion_trafico.sql).
   4) Denuncias: botón "Reportar" que guarda en content_reports (revisión humana/IA desde el panel).
   API: KinetModeration.checkText(text) -> {ok, reason, message}
        KinetModeration.checkImage(fileOrDataUrl) -> Promise<{ok, reason, message, unchecked}>
        KinetModeration.checkVideoFrames(videoEl|blobUrl) -> Promise<{ok,...}>
        KinetModeration.rate(kind) -> {ok, waitSec, message}       kind: 'post' | 'dm' | 'comment'
        KinetModeration.report({type, targetId, handle, text, reason}) -> Promise<{ok}>
   ========================================================== */
(function () {
  'use strict';
  if (window.KinetModeration) return;

  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // ---------- 1) TEXTO ----------
  // Se normaliza: minúsculas, sin tildes, leetspeak (0→o, 1→i, 3→e, 4→a, 5→s, @→a, $→s) y se quitan separadores entre letras (p.u.t.a).
  function normalize(t) {
    var s = String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    s = s.replace(/[0]/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e').replace(/[4@]/g, 'a').replace(/[5$]/g, 's').replace(/7/g, 't');
    s = s.replace(/(?<=\b\w)[\s._\-*]+(?=\w\b)/g, '');            // p u t a / p.u.t.a
    s = s.replace(/(.)\1{2,}/g, '$1$1');                            // aaaaa -> aa
    return s;
  }
  var RULES = [
    { id: 'sexual', msg: 'No se permite contenido pornográfico o sexual explícito.',
      re: /\b(porno\w*|porn|xxx|hentai|sexo\s+explicit\w*|follar|follando|follame|folladas?|polla|pollas|mamada|mamadas|verga|chocho|coito|sexting|nudes?|escort|webcam\s+sexo|culo\s+gratis|pack\s+de\s+fotos\s+intimas?)\b/ },
    { id: 'odio', msg: 'No se permiten insultos, discriminación ni lenguaje de odio.',
      re: /\b(maricon\w*|sudaca\w*|moro\s+de\s+mierda|negro\s+de\s+mierda|gitano\s+de\s+mierda|panchito|mongol\w*|retrasad[oa]s?|subnormal\w*|nazi\w*|puto\s+(moro|negro|gitano|judio|gay)|sucio\s+(moro|negro|gitano|judio))\b/ },
    { id: 'insulto', msg: 'No se permiten insultos ni ataques personales.',
      re: /\b(hij[oa]s?\s+de\s+(la\s+)?(gran\s+)?put[oa]|hdp|hijueputa|gilipollas|capullo|cabron\w*\s+de\s+mierda|zorra|puta|puto\s+\w+\s+de\s+mierda|imbecil|estupid[oa]|inutil\s+de\s+mierda|basura\s+humana|ojala\s+te\s+mueras|muerete|matate|suicidate)\b/ },
    { id: 'amenaza', msg: 'No se permiten amenazas.',
      re: /\b(te\s+voy\s+a\s+(matar|reventar|partir\s+la\s+cara|destrozar|pegar\s+una\s+paliza)|vas\s+a\s+morir|te\s+(matare|reventare|encontrare\s+y)|voy\s+a\s+ir\s+a\s+por\s+ti)\b/ }
  ];
  function checkText(text) {
    var raw = String(text || '');
    if (!raw.trim()) return { ok: true };
    if (/\bx{3,}\b/i.test(raw)) return { ok: false, reason: 'sexual', message: RULES[0].msg + ' Revisa tu texto antes de publicarlo.' };
    var n = normalize(raw);
    for (var i = 0; i < RULES.length; i++) {
      if (RULES[i].re.test(n)) return { ok: false, reason: RULES[i].id, message: RULES[i].msg + ' Revisa tu texto antes de publicarlo.' };
    }
    return { ok: true };
  }

  // ---------- 2) IMAGEN / VÍDEO ----------
  var TF_URL = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
  var NSFW_URLS = [
    'https://cdn.jsdelivr.net/npm/nsfwjs@4.2.1/dist/browser/nsfwjs.min.js',
    'https://unpkg.com/nsfwjs@4.2.1/dist/browser/nsfwjs.min.js'
  ];
  var modelPromise = null;
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = src; s.async = true;
      s.onload = res; s.onerror = function () { rej(new Error('no carga ' + src)); };
      document.head.appendChild(s);
    });
  }
  function getModel() {
    if (modelPromise) return modelPromise;
    modelPromise = (async function () {
      if (!window.tf) await loadScript(TF_URL);
      if (!window.nsfwjs) {
        var lastErr;
        for (var i = 0; i < NSFW_URLS.length && !window.nsfwjs; i++) { try { await loadScript(NSFW_URLS[i]); } catch (e) { lastErr = e; } }
        if (!window.nsfwjs) throw lastErr || new Error('nsfwjs no disponible');
      }
      return await window.nsfwjs.load();
    })().catch(function (e) { modelPromise = null; throw e; });
    return modelPromise;
  }
  function toImageEl(src) {
    return new Promise(function (res, rej) {
      var img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = function () { res(img); }; img.onerror = function () { rej(new Error('imagen no legible')); };
      if (src instanceof Blob) img.src = URL.createObjectURL(src); else img.src = String(src);
    });
  }
  function verdict(preds) {
    var p = {}; (preds || []).forEach(function (x) { p[x.className] = x.probability; });
    var porn = (p.Porn || 0), hentai = (p.Hentai || 0), sexy = (p.Sexy || 0);
    if (porn >= 0.55 || hentai >= 0.7 || (porn + hentai) >= 0.7 || sexy >= 0.9) return false;
    return true;
  }
  var BLOCK_IMG = { ok: false, reason: 'imagen_explicita', message: 'La imagen parece contener contenido sexual explícito y no se puede subir.' };

  async function checkImage(src) {
    try {
      var model = await getModel();
      var img = await toImageEl(src);
      var preds = await model.classify(img, 5);
      return verdict(preds) ? { ok: true } : BLOCK_IMG;
    } catch (e) {
      // Sin clasificador (sin conexión o bloqueado): se deja pasar pero marcada para revisión en el servidor.
      return { ok: true, unchecked: true };
    }
  }

  async function checkVideoFrames(videoSrc) {
    try {
      var v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.crossOrigin = 'anonymous';
      v.src = (videoSrc instanceof Blob) ? URL.createObjectURL(videoSrc) : String(videoSrc);
      await new Promise(function (res, rej) { v.onloadeddata = res; v.onerror = function () { rej(new Error('vídeo no legible')); }; setTimeout(function () { rej(new Error('timeout')); }, 15000); });
      var model = await getModel();
      var dur = isFinite(v.duration) && v.duration > 0 ? v.duration : 1;
      var times = [0.08, 0.3, 0.55, 0.8].map(function (f) { return Math.min(dur - 0.05, Math.max(0, dur * f)); });
      var c = document.createElement('canvas'); c.width = 224; c.height = 224; var cx = c.getContext('2d');
      for (var i = 0; i < times.length; i++) {
        await new Promise(function (res) { v.onseeked = res; v.currentTime = times[i]; setTimeout(res, 2500); });
        cx.drawImage(v, 0, 0, c.width, c.height);
        var preds = await model.classify(c, 5);
        if (!verdict(preds)) return { ok: false, reason: 'video_explicito', message: 'El vídeo parece contener contenido sexual explícito y no se puede subir.' };
      }
      return { ok: true };
    } catch (e) { return { ok: true, unchecked: true }; }
  }

  // ---------- 3) TRÁFICO ----------
  var LIMITS = {
    // [máximo, ventana en segundos] por plan
    post: { free: [6, 3600], pro: [20, 3600], club: [40, 3600], label: 'publicaciones' },
    comment: { free: [30, 3600], pro: [90, 3600], club: [150, 3600], label: 'comentarios' },
    dm: { free: [20, 60], pro: [30, 60], club: [40, 60], label: 'mensajes' }
  };
  function tier() { var t = (ls('kinet_account_tier') || 'free').toLowerCase(); return (t === 'pro' || t === 'club') ? t : 'free'; }
  function rate(kind) {
    var L = LIMITS[kind]; if (!L) return { ok: true };
    var cfg = L[tier()], max = cfg[0], win = cfg[1] * 1000, key = 'kinet_rate_' + kind, now = Date.now(), arr = [];
    try { arr = (JSON.parse(ls(key) || '[]') || []).filter(function (t) { return now - t < win; }); } catch (e) { arr = []; }
    if (arr.length >= max) {
      var wait = Math.ceil((win - (now - arr[0])) / 1000);
      return { ok: false, waitSec: wait, message: 'Has alcanzado el límite de ' + L.label + ' (' + max + ' cada ' + (cfg[1] >= 3600 ? 'hora' : 'minuto') + '). Inténtalo de nuevo en ' + (wait >= 90 ? Math.ceil(wait / 60) + ' min' : wait + ' s') + '.' };
    }
    arr.push(now); lsSet(key, JSON.stringify(arr));
    return { ok: true };
  }

  // ---------- 4) DENUNCIAS ----------
  async function report(r) {
    r = r || {};
    var row = {
      target_type: String(r.type || 'post').slice(0, 20), target_id: String(r.targetId || '').slice(0, 80),
      target_handle: String(r.handle || '').slice(0, 60), excerpt: String(r.text || '').slice(0, 400),
      reason: String(r.reason || 'otro').slice(0, 60)
    };
    try {
      var sb = window.KinetBackend && KinetBackend.getClient ? KinetBackend.getClient() : null;
      if (sb) { var res = await sb.from('content_reports').insert(row); if (!res.error) return { ok: true }; }
    } catch (e) {}
    // Sin servidor: se guarda en cola local y se reenvía cuando haya conexión
    try { var q = JSON.parse(ls('kinet_report_queue') || '[]'); q.push(row); lsSet('kinet_report_queue', JSON.stringify(q.slice(-30))); } catch (e) {}
    return { ok: true, queued: true };
  }
  async function flushReportQueue() {
    try {
      var q = JSON.parse(ls('kinet_report_queue') || '[]'); if (!q.length) return;
      var sb = window.KinetBackend && KinetBackend.getClient ? KinetBackend.getClient() : null; if (!sb) return;
      var res = await sb.from('content_reports').insert(q); if (!res.error) lsSet('kinet_report_queue', '[]');
    } catch (e) {}
  }
  setTimeout(flushReportQueue, 6000);

  var REPORT_REASONS = ['Pornografía o contenido sexual', 'Insultos o acoso', 'Odio o discriminación', 'Amenazas', 'Suplantación de identidad', 'Spam o estafa', 'Otro'];
  function reportDialog(info) {
    info = info || {};
    var old = document.getElementById('kinet-report-dlg'); if (old) old.remove();
    var d = document.createElement('div'); d.id = 'kinet-report-dlg';
    d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(2,4,8,.78);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Inter,sans-serif';
    d.innerHTML = '<div style="width:100%;max-width:380px;background:#0B1019;border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:18px;color:#E2E8F0">' +
      '<div style="font-weight:800;font-size:.95rem;margin-bottom:4px">Reportar contenido</div>' +
      '<div style="font-size:.74rem;color:#94A3B8;margin-bottom:12px">Elige el motivo. Lo revisamos y retiramos lo que incumpla las normas.</div>' +
      REPORT_REASONS.map(function (r) { return '<button type="button" data-r="' + r + '" style="display:block;width:100%;text-align:left;margin-bottom:6px;padding:9px 12px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03);color:#E2E8F0;font-size:.78rem;cursor:pointer">' + r + '</button>'; }).join('') +
      '<button type="button" data-r="" style="margin-top:4px;padding:8px 12px;border-radius:10px;border:0;background:transparent;color:#94A3B8;font-size:.74rem;cursor:pointer">Cancelar</button></div>';
    d.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (e.target === d) { d.remove(); return; } if (!b) return;
      var reason = b.getAttribute('data-r'); if (!reason) { d.remove(); return; }
      report({ type: info.type, targetId: info.targetId, handle: info.handle, text: info.text, reason: reason }).then(function () {
        d.querySelector('div').innerHTML = '<div style="font-weight:800;margin-bottom:6px">Gracias</div><div style="font-size:.78rem;color:#94A3B8">Hemos recibido tu aviso y lo revisaremos.</div>';
        setTimeout(function () { d.remove(); }, 1600);
      });
    });
    document.body.appendChild(d);
  }

  window.KinetModeration = { checkText: checkText, checkImage: checkImage, checkVideoFrames: checkVideoFrames, rate: rate, report: report, reportDialog: reportDialog, _normalize: normalize };
})();
