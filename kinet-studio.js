/* ==========================================================
   KINET Media Studio · chat creativo de imagen y vídeo (estilo ChatGPT / Gemini)
   - Crear imágenes con IA (el resultado es la imagen limpia, sin textos encima).
   - Editar fotos con IA como un fotógrafo profesional (plantillas pro / virales).
   - Filtros locales gratuitos (sin gastar IA): cine, blanco y negro, neón…
   - Editar vídeo: highlights con música sincronizada (ver kinet-video-edit.js).
   Depende de: kinet-api-config.js (KinetAPIs), kinet-video-edit.js y de las variables de página
   currentStudioFormat, activeSpotifyTrack, userManuallyLockedTrack, updateAudioIslandUI.
   ========================================================== */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var KS = { items: {}, seq: 0, busy: false, template: null, source: null, last: null, veFiles: [], veAudio: null, veStyle: 'highlight', veSeconds: 30, veFormat: 'vertical', veMusic: 'beat', veBpm: 124 };

  // ───────────── deporte → vocabulario visual ─────────────
  var SV = {
    futbol: { es: ['un balón de fútbol', 'un estadio iluminado de noche'], sport: 'football (soccer)', subject: 'a football (soccer ball)', venue: 'a packed floodlit stadium at night', action: 'a decisive strike on goal' },
    baloncesto: { es: ['un balón de baloncesto', 'un pabellón con focos'], sport: 'basketball', subject: 'a basketball', venue: 'an indoor arena with hard spotlights', action: 'a powerful dunk' },
    padel: { es: ['una pala de pádel', 'una pista de cristal de noche'], sport: 'padel and tennis', subject: 'a padel racket and ball', venue: 'a glass-walled padel court under floodlights', action: 'a smash' },
    boxeo: { es: ['unos guantes de boxeo', 'un ring bajo los focos'], sport: 'boxing and MMA', subject: 'a pair of boxing gloves', venue: 'a boxing ring under hard spotlights', action: 'a sharp combination' },
    running: { es: ['unas zapatillas de running', 'una pista de atletismo al atardecer'], sport: 'running and athletics', subject: 'a pair of running shoes', venue: 'an athletics track at golden hour', action: 'a sprint finish' },
    otros: { es: ['material deportivo', 'un recinto deportivo profesional'], sport: 'professional sport', subject: 'sports equipment', venue: 'a professional sports venue', action: 'peak action' }
  };
  function sv() {
    var k = 'futbol';
    try { k = window.KinetSport ? KinetSport.key(localStorage.getItem('kinet_sport') || 'Fútbol') : 'futbol'; } catch (e) {}
    return SV[k] || SV.otros;
  }

  // ───────────── plantillas de imagen ─────────────
  // kind: gen (crea desde texto) · edit (necesita tu foto) · local (filtro gratis)
  var IMG_TEMPLATES = [
    { id: 'press', kind: 'gen', name: 'Foto de prensa Primera División', hint: 'Describe la jugada o el sujeto', track: 'trk_1', aspect: '4:5',
      build: function (t, v) { return 'Press photograph from a top-division ' + v.sport + ' match: ' + t + '. Shot on a 70-200mm f/2.8 lens, shallow depth of field, motion frozen, crisp detail, stadium lights, agency-quality sports photography'; } },
    { id: 'hero', kind: 'gen', name: 'Póster épico cinematográfico', hint: 'Quién o qué aparece', track: 'trk_2', aspect: '4:5',
      build: function (t, v) { return 'Epic cinematic hero poster of ' + t + ' in ' + v.venue + '. Dramatic rim lighting, volumetric smoke, teal and orange colour grade, ultra detailed, movie-poster composition'; } },
    { id: 'product', kind: 'gen', name: 'Objeto en estudio (producto)', hint: 'Ej: un balón de fútbol', track: 'trk_3', aspect: '1:1',
      build: function (t) { return 'Premium studio product shot of ' + t + ' on a dark reflective surface, neon rim light, soft reflections, ultra sharp, commercial advertising photography'; } },
    { id: 'viral', kind: 'gen', name: 'Imagen viral para Reels', hint: 'La escena que quieres', track: 'trk_6', aspect: '9:16',
      build: function (t, v) { return 'Scroll-stopping vertical social media image: ' + t + '. ' + v.action + ', bold dynamic angle, saturated colours, high contrast, dramatic light, trending sports edit look'; } },
    { id: 'tunnel', kind: 'gen', name: 'Túnel de vestuarios', hint: 'Quién sale al campo', track: 'trk_4', aspect: '4:5',
      build: function (t, v) { return 'Moody photograph of ' + t + ' walking out of a stadium tunnel toward the light before a match, backlit silhouette, atmospheric haze, wide lens, ' + v.sport; } },
    { id: 'neon', kind: 'gen', name: 'Neón nocturno', hint: 'Sujeto o escena', track: 'trk_3', aspect: '4:5',
      build: function (t) { return 'Night scene of ' + t + ' lit by neon magenta and cyan lights, wet reflective ground, cyberpunk sport aesthetic, cinematic, ultra detailed'; } },
    { id: 'pro-retouch', kind: 'edit', name: 'Retoque de fotógrafo pro', hint: 'Qué quieres mejorar (opcional)', track: 'trk_1', aspect: '4:5',
      build: function (t) { return 'Professional retouch and colour grade, sharper detail, balanced exposure, rich contrast, clean skin tones, subtle vignette' + (t ? '. Also: ' + t : ''); } },
    { id: 'stadium-bg', kind: 'edit', name: 'Fondo de estadio', hint: 'Estadio o ambiente (opcional)', track: 'trk_1', aspect: '4:5',
      build: function (t, v) { return 'Place the athlete in ' + (t || v.venue) + ', matching light direction and perspective, realistic shadows, natural integration, keep the athlete untouched'; } },
    { id: 'magazine', kind: 'edit', name: 'Portada de revista deportiva', hint: 'Ambiente (opcional)', track: 'trk_2', aspect: '4:5',
      build: function (t) { return 'Transform into a premium sports magazine editorial portrait: dramatic studio lighting, deep contrast, cinematic colour grade, polished retouch' + (t ? '. ' + t : ''); } },
    { id: 'golden', kind: 'edit', name: 'Hora dorada', hint: 'Opcional', track: 'trk_5', aspect: '4:5',
      build: function (t) { return 'Relight the photo as golden hour: warm low sun, long soft shadows, golden rim light, rich warm tones' + (t ? '. ' + t : ''); } },
    { id: 'bw-ai', kind: 'edit', name: 'Blanco y negro dramático', hint: 'Opcional', track: 'trk_4', aspect: '4:5',
      build: function (t) { return 'Convert to a dramatic high-contrast black and white photograph with deep blacks, bright highlights and fine film grain' + (t ? '. ' + t : ''); } },
    { id: 'night-neon', kind: 'edit', name: 'Look neón nocturno', hint: 'Opcional', track: 'trk_3', aspect: '4:5',
      build: function (t) { return 'Re-light the photo with neon magenta and cyan accent lights at night, glossy reflections, cinematic cyberpunk sport look' + (t ? '. ' + t : ''); } }
  ];

  // ───────────── filtros locales (gratis, sin IA) ─────────────
  var FILTERS = [
    { id: 'cine', name: 'Cine', c: 1.14, s: 0.9, b: 0, shadow: [0, 22, 34], high: [34, 14, -10], vig: 0.45, grain: 0.03 },
    { id: 'bw', name: 'B/N dramático', c: 1.32, s: 0, b: -4, vig: 0.55, grain: 0.05 },
    { id: 'neon', name: 'Neón', c: 1.2, s: 1.5, b: 0, shadow: [40, 0, 70], high: [0, 40, 50], vig: 0.35, grain: 0 },
    { id: 'warm', name: 'Cálido estadio', c: 1.08, s: 1.15, b: 6, shadow: [20, 6, 0], high: [32, 18, -6], vig: 0.3, grain: 0 },
    { id: 'punch', name: 'Alto contraste', c: 1.32, s: 1.25, b: 0, vig: 0.25, grain: 0 },
    { id: 'film', name: 'Película', c: 1.04, s: 0.85, b: 8, lift: 14, shadow: [8, 10, 4], high: [20, 12, 0], vig: 0.4, grain: 0.09 }
  ];

  // ───────────── plantillas de vídeo ─────────────
  function videoStyles() { return window.KinetVideoEdit ? window.KinetVideoEdit.STYLES : {}; }

  // ───────────── util imagen ─────────────
  function loadImg(src) { return new Promise(function (res, rej) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { rej(new Error('No se pudo leer la imagen.')); }; im.src = src; }); }
  async function fit(src, maxSide, q) {
    var im = await loadImg(src), s = Math.min(1, maxSide / Math.max(im.width, im.height));
    var c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    return { url: c.toDataURL('image/jpeg', q || 0.9), w: c.width, h: c.height };
  }
  function aspectOfSelect() {
    var sel = $('aspect-ratio-select'); var m = sel && /(\d+:\d+)/.exec(sel.value || sel.options[sel.selectedIndex].text);
    return m ? m[1] : '4:5';
  }
  function today() { return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); }

  // ───────────── chat ─────────────
  function feed() { return $('studio-ai-chat-feed'); }
  function scrollFeed() { var f = feed(); if (f) f.scrollTop = f.scrollHeight; }
  function bubble(html, incoming) {
    var m = document.createElement('div');
    m.className = 'studio-chat-msg ' + (incoming === false ? 'outgoing' : 'incoming');
    m.innerHTML = html;
    feed().appendChild(m);
    if (m.querySelector('.ks-card')) feed().scrollTop = Math.max(0, m.offsetTop - feed().offsetTop - 8); else scrollFeed();
    return m;
  }
  // Compatibilidad con el resto de la página (texto plano, sin tarjeta)
  window.pushStudioChatBubble = function (text, isIncoming) {
    if (isIncoming === false) return bubble(esc(text), false);
    return bubble(esc(text).replace(/\n/g, '<br>'), true);
  };
  function typingBubble(txt) {
    return bubble('<span class="ks-dots"><i></i><i></i><i></i></span> <span style="color:#94A3B8;">' + esc(txt) + '</span>', true);
  }

  // ───────────── tarjeta de imagen ─────────────
  function addImageCard(url, meta) {
    var id = 'ks' + (++KS.seq);
    var it = KS.items[id] = { id: id, url: url, w: meta.w, h: meta.h, prompt: meta.prompt || '', note: meta.note || '' };
    KS.last = id;
    var ratio = meta.w && meta.h ? meta.w + ' / ' + meta.h : '4 / 5';
    var filters = '<button type="button" class="ks-chip on" data-f="orig" onclick="KinetStudio.applyFilter(\'' + id + '\',\'orig\')">Original</button>' + FILTERS.map(function (f) { return '<button type="button" class="ks-chip" data-f="' + f.id + '" onclick="KinetStudio.applyFilter(\'' + id + '\',\'' + f.id + '\')">' + esc(f.name) + '</button>'; }).join('');
    var m = bubble(
      (meta.text ? '<div style="margin-bottom:8px;">' + esc(meta.text) + '</div>' : '') +
      '<div class="ks-card" data-id="' + id + '">' +
        '<div class="ks-img-wrap"><img src="' + url + '" alt="Imagen creada en KINET Media Studio" draggable="false"></div>' +
        '<div class="ks-tools"><span class="ks-tools-label">FILTROS GRATIS</span>' + filters + '</div>' +
        '<div class="chat-art-actions-bar">' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
            '<button type="button" class="btn-secondary ks-btn" onclick="KinetStudio.download(\'' + id + '\')">Descargar</button>' +
            '<button type="button" class="btn-secondary ks-btn" onclick="KinetStudio.pdf(\'' + id + '\')">PDF</button>' +
            '<button type="button" class="btn-secondary ks-btn" onclick="KinetStudio.addText(\'' + id + '\')">+ Texto</button>' +
            '<button type="button" class="btn-secondary ks-btn" onclick="KinetStudio.editWithAI(\'' + id + '\')">Editar con IA</button>' +
          '</div>' +
          '<button type="button" class="btn-primary ks-btn" onclick="KinetStudio.publish(\'' + id + '\')">Publicar</button>' +
        '</div>' +
      '</div>' + (meta.after || ''), true);
    // Compatibilidad: id de la última tarjeta
    var prev = document.getElementById('latest-exportable-art-card'); if (prev) prev.removeAttribute('id');
    var w = m.querySelector('.ks-img-wrap'); if (w) w.id = 'latest-exportable-art-card';
    refreshUsage();
    return id;
  }

  // ───────────── enviar (generar / editar) ─────────────
  function setBusy(b) {
    KS.busy = b;
    var btn = $('btn-generate-image'); if (btn) { btn.disabled = b; btn.textContent = b ? 'Creando…' : (KS.source ? 'Editar' : 'Crear imagen'); }
  }

  function friendlyError(res) {
    var e = String((res && res.error) || '');
    if (/limit|límite|presupuesto|No hay clave/i.test(e) || (res && res.limitReached)) return e;
    if (/SAFETY|IMAGE_OTHER|PROHIBITED|blocked|bloque/i.test(e)) return 'La IA no ha podido crear esta imagen (puede incumplir sus normas de seguridad). Prueba con otra descripción.';
    if (/403|401|API key|clave|permission/i.test(e)) return 'La clave de IA no es válida o no tiene acceso a la generación de imágenes. Revísala en el botón «API IA» del Cuerpo Técnico.';
    if (/429|quota|exceeded/i.test(e)) return 'La IA está saturada ahora mismo. Inténtalo de nuevo en un minuto.';
    return 'No se ha podido crear la imagen. ' + e.split('\n')[0].slice(0, 160);
  }

  async function send(override) {
    if (KS.busy) return;
    var input = $('ai-prompt-input');
    var text = String(override != null ? override : (input ? input.value : '')).trim();
    var editing = !!KS.source;
    var tpl = KS.template && KS.template.kind !== 'local' && (editing ? KS.template.kind === 'edit' : KS.template.kind === 'gen' || KS.template.kind === 'edit') ? KS.template : null;
    if (!text && !(tpl && tpl.kind === 'edit' && editing)) {
      if (tpl && tpl.kind === 'edit' && !editing) { bubble('Esta plantilla edita una foto tuya. Súbela con el botón de adjuntar y pulsa Editar.', true); triggerFileSelect(); return; }
      if (input) { input.focus(); input.classList.add('ks-shake'); setTimeout(function () { input.classList.remove('ks-shake'); }, 400); }
      return;
    }
    if (!window.KinetAPIs) { bubble('El motor de IA no está cargado. Recarga la página.', true); return; }
    if (window.KinetModeration) {
      var mod = KinetModeration.checkText(text);
      if (!mod.ok) { bubble('🚫 ' + esc(mod.message), true); return; }
    }
    var q = KinetAPIs.getQuotaStatus();
    if (q.imageRemaining <= 0) {
      bubble('Has usado tus <strong>' + q.imageLimit + ' imágenes</strong> de hoy en el ' + esc(q.tierName) + '. Se renuevan a las 00:00 h. Mientras tanto puedes aplicar los <strong>filtros gratuitos</strong> a cualquier imagen.', true);
      if (!isPaidOrBonusAccount()) $('upgrade-tier-modal').classList.add('open');
      return;
    }

    var v = sv();
    var subject = text || '';
    var prompt = tpl ? tpl.build(subject || v.subject, v) : (subject || '');
    if (tpl && tpl.kind === 'gen' && !subject) subject = v.subject;
    var aspect = (tpl && !KS.aspectTouched) ? tpl.aspect : aspectOfSelect();

    // Mensaje del usuario (con miniatura si edita una foto)
    bubble((editing ? '<img src="' + KS.source.url + '" class="ks-thumb" alt=""><br>' : '') + esc(text || (tpl ? tpl.name : '')), false);
    if (input) input.value = '';
    var src = KS.source; setBusy(true);
    var tb = typingBubble(editing ? 'Editando tu foto…' : 'Creando tu imagen…');
    try {
      var res = await KinetAPIs.studioImagine({ prompt: prompt, imageDataUrl: src ? src.url : null, aspect: aspect, style: '' });
      tb.remove();
      if (!res || !res.ok) {
        bubble(esc(friendlyError(res)), true);
        if (res && res.limitReached && !isPaidOrBonusAccount()) $('upgrade-tier-modal').classList.add('open');
        return;
      }
      var f = await fit(res.dataUrl, 1536, 0.92);
      var track = '';
      
      addImageCard(f.url, { w: f.w, h: f.h, prompt: text, text: (editing ? 'Foto editada.' : 'Aquí tienes tu imagen.') + track });
      KS.source = null; KS.template = null;
      var hint = $('ks-template-hint'); if (hint) hint.style.display = 'none';
      renderSourceChip(); buildTemplates();
    } catch (e) {
      tb.remove(); bubble('Error al crear la imagen: ' + esc(e && e.message ? e.message : e), true);
    } finally { setBusy(false); refreshUsage(); }
  }

  // ───────────── foto del usuario ─────────────
  async function onFile(input) {
    if (!input.files || !input.files[0]) return;
    var file = input.files[0];
    input.value = '';
    if (file.type.indexOf('video/') === 0) {
      if (!isPaidOrBonusAccount()) { $('upgrade-tier-modal').classList.add('open'); return; }
      selectStudioFormatMode('video', true);
      openVideoEditModal(file);
      return;
    }
    if (file.type.indexOf('image/') !== 0) { bubble('Sube una imagen (JPG, PNG o WEBP) o un vídeo.', true); return; }
    var reader = new FileReader();
    reader.onload = async function (e) {
      try {
        var f = await fit(e.target.result, 1536, 0.92);
        if (window.KinetModeration) {
          var chk = await KinetModeration.checkImage(f.url);
          if (!chk.ok) { bubble('🚫 ' + esc(chk.message || 'Esta imagen no está permitida en KINET OS.'), true); return; }
        }
        KS.source = { url: f.url, name: file.name };
        hasUploadedPublicationMedia = true;
        addImageCard(f.url, { w: f.w, h: f.h, text: 'Foto cargada. Elige una plantilla de edición, aplica un filtro gratis o dime qué quieres cambiar.' });
        renderSourceChip();
        buildTemplates();
        var inp = $('ai-prompt-input'); if (inp) inp.focus();
      } catch (err) { bubble(esc(err.message || err), true); }
    };
    reader.readAsDataURL(file);
  }

  function renderSourceChip() {
    var box = $('ks-source-chip'); if (!box) return;
    if (!KS.source) { box.style.display = 'none'; box.innerHTML = ''; }
    else {
      box.style.display = 'flex';
      box.innerHTML = '<img src="' + KS.source.url + '" class="ks-thumb-sm" alt=""><span>Editando esta imagen</span><button type="button" onclick="KinetStudio.clearSource()" title="Quitar">✕</button>';
    }
    setBusy(KS.busy);
    var inp = $('ai-prompt-input');
    if (inp) inp.placeholder = KS.source ? 'Qué quieres cambiar (ej: fondo de estadio al atardecer, más contraste…)' : placeholderFor();
  }
  function placeholderFor() {
    var v = sv();
    return 'Describe la imagen que quieres (ej: ' + v.es[0] + ' en ' + v.es[1] + ')…';
  }

  // ───────────── plantillas (UI) ─────────────
  function buildTemplates() {
    var box = $('ks-template-strip'); if (!box) return;
    var mode = (typeof currentStudioFormat !== 'undefined') ? currentStudioFormat : 'image';
    var html = '';
    if (mode === 'video') {
      var S = videoStyles();
      Object.keys(S).forEach(function (k) {
        html += '<button type="button" class="ks-tpl" onclick="KinetStudio.pickVideoStyle(\'' + k + '\')"><strong>' + esc(S[k].name) + '</strong><span>' + esc(S[k].desc) + '</span></button>';
      });
    } else {
      IMG_TEMPLATES.forEach(function (t) {
        var active = KS.template && KS.template.id === t.id ? ' active' : '';
        var tag = t.kind === 'edit' ? 'EDITA TU FOTO' : 'CREA CON IA';
        html += '<button type="button" class="ks-tpl' + active + '" onclick="KinetStudio.pickTemplate(\'' + t.id + '\')"><strong>' + esc(t.name) + '</strong><span>' + tag + '</span></button>';
      });
    }
    box.innerHTML = html;
    var lbl = $('ks-template-label'); if (lbl) lbl.textContent = mode === 'video' ? 'PLANTILLAS DE EDICIÓN DE VÍDEO' : 'PLANTILLAS DE IMAGEN';
  }

  function pickTemplate(id) {
    var t = IMG_TEMPLATES.filter(function (x) { return x.id === id; })[0]; if (!t) return;
    KS.template = (KS.template && KS.template.id === id) ? null : t;   // pulsar de nuevo la desactiva
    var inp = $('ai-prompt-input');
    var hint = $('ks-template-hint');
    if (KS.template) {
      if (inp) inp.placeholder = t.hint + '…';
      if (hint) { hint.style.display = 'flex'; hint.innerHTML = '<span><strong>' + esc(t.name) + '</strong> activada · ' + (t.kind === 'edit' ? (KS.source ? 'pulsa Editar' : 'sube tu foto con el clip de adjuntar') : 'escribe el sujeto y pulsa Crear') + '</span><button type="button" onclick="KinetStudio.pickTemplate(\'' + id + '\')">✕</button>'; }
      if (t.kind === 'edit' && !KS.source) triggerFileSelect();
      if (inp) inp.focus();
    } else {
      if (hint) hint.style.display = 'none';
      renderSourceChip();
    }
    buildTemplates();
  }

  // ───────────── filtros locales ─────────────
  function clamp(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }
  async function applyFilter(id, fid) {
    var it = KS.items[id]; if (!it) return;
    if (!it.base) it.base = it.url;                       // la foto original: los filtros NUNCA se apilan unos sobre otros
    var card = document.querySelector('.ks-card[data-id="' + id + '"]');
    var mark = function (k) { if (card) Array.prototype.forEach.call(card.querySelectorAll('.ks-chip'), function (c) { c.classList.toggle('on', c.getAttribute('data-f') === k); }); };
    var setImg = function (url, w, h) {
      var old = it.url; it.url = url; if (w) { it.w = w; it.h = h; }
      var im2 = card && card.querySelector('img'); if (im2) im2.src = url;
      if (KS.source && KS.source.url === old) KS.source = { url: url, name: KS.source.name };
      renderSourceChip();
    };
    if (fid === 'orig') { setImg(it.base); mark('orig'); return; }
    var f = FILTERS.filter(function (x) { return x.id === fid; })[0]; if (!f) return;
    var im = await loadImg(it.base);
    var c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    var g = c.getContext('2d'); g.drawImage(im, 0, 0);
    var d = g.getImageData(0, 0, c.width, c.height), p = d.data;
    for (var i = 0; i < p.length; i += 4) {
      var r = p[i], gg = p[i + 1], b = p[i + 2];
      var l = 0.299 * r + 0.587 * gg + 0.114 * b;
      r = l + (r - l) * f.s; gg = l + (gg - l) * f.s; b = l + (b - l) * f.s;
      r = (r - 128) * f.c + 128 + f.b; gg = (gg - 128) * f.c + 128 + f.b; b = (b - 128) * f.c + 128 + f.b;
      var lum = (0.299 * r + 0.587 * gg + 0.114 * b) / 255;
      if (f.shadow) { var sw = Math.max(0, 1 - lum * 2); r += f.shadow[0] * sw; gg += f.shadow[1] * sw; b += f.shadow[2] * sw; }
      if (f.high) { var hw = Math.max(0, lum * 2 - 1); r += f.high[0] * hw; gg += f.high[1] * hw; b += f.high[2] * hw; }
      if (f.lift) { r = f.lift + r * (1 - f.lift / 255); gg = f.lift + gg * (1 - f.lift / 255); b = f.lift + b * (1 - f.lift / 255); }
      p[i] = clamp(r); p[i + 1] = clamp(gg); p[i + 2] = clamp(b);
    }
    g.putImageData(d, 0, 0);
    if (f.vig) {
      var grd = g.createRadialGradient(c.width / 2, c.height / 2, Math.min(c.width, c.height) * 0.35, c.width / 2, c.height / 2, Math.max(c.width, c.height) * 0.72);
      grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(0,0,0,' + f.vig + ')');
      g.fillStyle = grd; g.fillRect(0, 0, c.width, c.height);
    }
    if (f.grain) {
      var n = document.createElement('canvas'); n.width = 256; n.height = 256;
      var ng = n.getContext('2d'), nd = ng.createImageData(256, 256);
      for (var k = 0; k < nd.data.length; k += 4) { var v = 128 + (Math.random() - 0.5) * 255; nd.data[k] = nd.data[k + 1] = nd.data[k + 2] = v; nd.data[k + 3] = 255; }
      ng.putImageData(nd, 0, 0);
      g.globalAlpha = f.grain; g.globalCompositeOperation = 'overlay'; g.fillStyle = g.createPattern(n, 'repeat'); g.fillRect(0, 0, c.width, c.height);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    }
    setImg(c.toDataURL('image/jpeg', 0.92), c.width, c.height); mark(fid);
  }

  // ───────────── composición: marca de agua y texto ─────────────
  async function compose(it, opts) {
    opts = opts || {};
    var im = await loadImg(it.url);
    var c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    var g = c.getContext('2d'); g.drawImage(im, 0, 0);
    var W = c.width, H = c.height;
    var accent = getComputedStyle(document.body).getPropertyValue('--role-color').trim() || '#00FF88';
    if (opts.text) {
      var pos = opts.pos || 'bottom';
      var fs = Math.round(W * 0.075);
      g.font = '900 ' + fs + 'px Orbitron, Inter, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      var words = opts.text.toUpperCase().split(/\s+/), lines = [], cur = '';
      words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > W * 0.86 && cur) { lines.push(cur); cur = w; } else cur = t; });
      if (cur) lines.push(cur);
      lines = lines.slice(0, 4);
      var bh = lines.length * fs * 1.2 + fs, y0 = pos === 'top' ? 0 : pos === 'center' ? (H - bh) / 2 : H - bh - (opts.wm ? H * 0.06 : 0);
      var gr = g.createLinearGradient(0, y0, 0, y0 + bh);
      if (pos === 'center') { gr.addColorStop(0, 'rgba(0,0,0,0.0)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0.0)'); }
      else if (pos === 'top') { gr.addColorStop(0, 'rgba(0,0,0,0.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); }
      else { gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.78)'); }
      g.fillStyle = gr; g.fillRect(0, y0, W, bh);
      g.fillStyle = opts.color === 'accent' ? accent : '#FFFFFF';
      g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = fs * 0.2;
      lines.forEach(function (l, i) { g.fillText(l, W / 2, y0 + fs * 0.5 + (i + 0.5) * fs * 1.2); });
      g.shadowBlur = 0;
    }
    if (opts.wm) {
      var ws = Math.round(W * 0.026);
      g.font = '700 ' + ws + 'px JetBrains Mono, monospace'; g.textAlign = 'right'; g.textBaseline = 'alphabetic';
      var tw = g.measureText(opts.wm).width;
      g.fillStyle = 'rgba(4,6,10,0.7)'; g.fillRect(W - tw - ws * 2.2, H - ws * 2.6, tw + ws * 1.8, ws * 1.9);
      g.fillStyle = accent; g.fillText(opts.wm, W - ws * 1.3, H - ws * 1.2);
    }
    return c;
  }
  function wmValue() { var s = $('watermark-select'); return s ? s.value : ''; }

  function download(id) {
    var it = KS.items[id || KS.last]; if (!it) { bubble('Aún no hay ninguna imagen. Crea una primero.', true); return; }
    compose(it, { wm: wmValue() }).then(function (c) {
      c.toBlob(function (blob) {
        var url = URL.createObjectURL(blob), a = document.createElement('a');
        a.href = url; a.download = 'KINET_Studio_' + Date.now() + '.png';
        document.body.appendChild(a); a.click();
        setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1200);
      }, 'image/png');
    });
  }

  async function pdf(id) {
    var it = KS.items[id || KS.last]; if (!it) { bubble('Aún no hay ninguna imagen. Crea una primero.', true); return; }
    if (!window.jspdf) { bubble('El generador de PDF no está disponible sin conexión.', true); return; }
    var c = await compose(it, { wm: wmValue() });
    var J = window.jspdf.jsPDF, w = c.width, h = c.height;
    var doc = new J({ orientation: w > h ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
    var pw = doc.internal.pageSize.getWidth(), ph = doc.internal.pageSize.getHeight(), m = 10;
    var s = Math.min((pw - 2 * m) / w, (ph - 2 * m - 8) / h), iw = w * s, ih = h * s;
    doc.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', (pw - iw) / 2, m, iw, ih);
    doc.setFontSize(8); doc.setTextColor(120);
    doc.text('Creado con KINET Media Studio', pw / 2, ph - 6, { align: 'center' });
    doc.save('KINET_Studio_' + Date.now() + '.pdf');
  }

  // Texto sobre la imagen (opcional, a petición)
  function addText(id) {
    var it = KS.items[id]; if (!it) return;
    var ov = $('ks-text-modal');
    if (!ov) {
      ov = document.createElement('div'); ov.id = 'ks-text-modal'; ov.className = 'kinet-modal-overlay';
      ov.setAttribute('onclick', 'if(event.target===this)this.classList.remove("open")');
      ov.innerHTML = '<div class="kinet-modal-box" style="max-width:420px;"><div class="kinet-modal-header" style="color:var(--role-color);"><span>TEXTO SOBRE LA IMAGEN</span></div>' +
        '<div class="kinet-modal-body"><input id="ks-text-input" maxlength="60" autocomplete="off" placeholder="Ej: HAT-TRICK EN LA FINAL" style="width:100%;background:#060911;border:1px solid rgba(var(--role-rgb),0.35);border-radius:10px;padding:10px 12px;color:white;font-size:0.85rem;">' +
        '<div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">' +
        '<button type="button" class="preset-pill-btn" data-pos="top">Arriba</button><button type="button" class="preset-pill-btn" data-pos="center">Centro</button><button type="button" class="preset-pill-btn active" data-pos="bottom">Abajo</button>' +
        '<span style="flex:1"></span><button type="button" class="preset-pill-btn active" data-col="white">Blanco</button><button type="button" class="preset-pill-btn" data-col="accent">Color de tu rol</button></div></div>' +
        '<div class="kinet-modal-footer"><button class="btn-secondary" type="button" onclick="document.getElementById(\'ks-text-modal\').classList.remove(\'open\')">Cancelar</button><button class="btn-primary" type="button" id="ks-text-ok">Añadir</button></div></div>';
      document.body.appendChild(ov);
      ov.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-pos],button[data-col]'); if (!b) return;
        var key = b.dataset.pos ? 'data-pos' : 'data-col';
        ov.querySelectorAll('button[' + key + ']').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
      });
    }
    $('ks-text-input').value = '';
    ov.dataset.target = id; ov.classList.add('open');
    $('ks-text-ok').onclick = async function () {
      var t = $('ks-text-input').value.trim(); if (!t) return;
      if (window.KinetModeration) { var m = KinetModeration.checkText(t); if (!m.ok) { alert(m.message); return; } }
      var pos = (ov.querySelector('button[data-pos].active') || {}).dataset; var col = (ov.querySelector('button[data-col].active') || {}).dataset;
      var c = await compose(KS.items[ov.dataset.target], { text: t, pos: pos && pos.pos, color: col && col.col });
      ov.classList.remove('open');
      addImageCard(c.toDataURL('image/jpeg', 0.92), { w: c.width, h: c.height, text: 'Texto añadido. La imagen original sigue arriba.' });
    };
    setTimeout(function () { $('ks-text-input').focus(); }, 50);
  }

  function editWithAI(id) {
    var it = KS.items[id]; if (!it) return;
    KS.source = { url: it.url, name: 'imagen' };
    renderSourceChip();
    var inp = $('ai-prompt-input'); if (inp) inp.focus();
    bubble('Dime qué quieres cambiar de esta imagen, o elige una plantilla de edición.', true);
  }
  function clearSource() { KS.source = null; renderSourceChip(); }

  // ───────────── publicar ─────────────
  async function publish(id) {
    var it = KS.items[id || KS.last]; if (!it) { bubble('Aún no hay ninguna imagen. Crea una primero.', true); return; }
    if (!window.KinetBackend || typeof KinetBackend.createCloudPost !== 'function') { bubble('No se puede publicar sin conexión con la red.', true); return; }
    var capEl = $('studio-caption'); var caption = capEl ? capEl.value.trim() : '';
    if (window.KinetModeration) {
      var m = KinetModeration.checkText(caption);
      if (!m.ok) { bubble('🚫 ' + esc(m.message), true); return; }
      var rl = KinetModeration.rate('post');
      if (!rl.ok) { bubble('⏳ ' + esc(rl.message), true); return; }
      var chk = await KinetModeration.checkImage(it.url);
      if (!chk.ok) { bubble('🚫 ' + esc(chk.message || 'Esta imagen no está permitida.'), true); return; }
    }
    var c = await compose(it, { wm: wmValue() });
    var f = await fit(c.toDataURL('image/jpeg', 0.9), 1080, 0.82);
    var track = activeSpotifyTrack ? '\n♪ ' + activeSpotifyTrack.title + (activeSpotifyTrack.artist ? ' · ' + activeSpotifyTrack.artist : '') : '';
    var text = (caption || it.prompt || 'Creado en KINET Media Studio') + track;
    try {
      await KinetBackend.createCloudPost({ id: 'studio_' + Date.now(), mode: 'post', text: text, imageUrl: f.url, badge: 'MEDIA STUDIO', reelData: activeSpotifyTrack ? { spotify: { id: activeSpotifyTrack.id, title: activeSpotifyTrack.title, artist: activeSpotifyTrack.artist || '', cover: activeSpotifyTrack.cover || '' }, track: activeSpotifyTrack.title } : null, likes: 0 });
      bubble('Publicado en KINET Network™. Puedes verlo en Comunidad.', true);
      if (capEl) capEl.value = '';
    } catch (e) { bubble('No se pudo publicar ahora mismo. Inténtalo de nuevo.', true); }
  }

  // ───────────── música automática ─────────────
  function autoTrack() { if (typeof toggleAudioIslandPopover === 'function') toggleAudioIslandPopover(); }

  // ───────────── uso / límites ─────────────
  function refreshUsage() {
    var el = $('studio-usage-meter'); if (!el || !window.KinetAPIs) return;
    var q = KinetAPIs.getQuotaStatus();
    el.innerHTML = 'Imágenes hoy <strong>' + q.imageUsed + '/' + q.imageLimit + '</strong> · IA del mes <strong>' + q.budget.pct + ' %</strong>';
  }

  // ───────────── modo imagen / vídeo ─────────────
  function onModeChange(mode) { buildTemplates(); refreshUsage(); }

  // ───────────── vídeo ─────────────
  function maxSeconds() { return (window.KinetAPIs && KinetAPIs.getQuotaStatus().maxVideoEditSeconds) || 30; }
  function maxClips() { return (window.KinetAPIs && KinetAPIs.getQuotaStatus().maxVideoEditClips) || 4; }
  function veCost() { return Math.max(0.5, Math.ceil(KS.veSeconds / 30) * 0.5); }

  function pickVideoStyle(k) {
    var S = videoStyles(); if (!S[k]) return;
    KS.veStyle = k; KS.veSeconds = Math.min(S[k].seconds, maxSeconds()); KS.veFormat = S[k].format; KS.veBpm = S[k].bpm;
    var pr = $('ve-prompt'); if (pr) pr.value = S[k].prompt;
    openVideoEditModal();
  }

  function renderVeOptions() {
    var S = videoStyles(), box = $('ve-styles'); if (!box) return;
    box.innerHTML = Object.keys(S).map(function (k) { return '<button type="button" class="preset-pill-btn' + (KS.veStyle === k ? ' active' : '') + '" onclick="KinetStudio.veSet(\'style\',\'' + k + '\')">' + esc(S[k].name) + '</button>'; }).join('');
    var mx = maxSeconds();
    var secs = [15, 30, 45, 60, 90, 120].filter(function (s) { return s <= mx; });
    if (secs.indexOf(KS.veSeconds) < 0) KS.veSeconds = secs[secs.length - 1] || 15;
    $('ve-seconds').innerHTML = secs.map(function (s) { return '<button type="button" class="preset-pill-btn' + (KS.veSeconds === s ? ' active' : '') + '" onclick="KinetStudio.veSet(\'seconds\',' + s + ')">' + s + ' s</button>'; }).join('');
    $('ve-format').innerHTML = [['vertical', 'Vertical 9:16'], ['horizontal', 'Horizontal 16:9']].map(function (f) { return '<button type="button" class="preset-pill-btn' + (KS.veFormat === f[0] ? ' active' : '') + '" onclick="KinetStudio.veSet(\'format\',\'' + f[0] + '\')">' + f[1] + '</button>'; }).join('');
    $('ve-music').innerHTML = [['none', 'Sin música'], ['beat', 'Beat KINET (libre de derechos)'], ['file', 'Mi canción']].map(function (f) { return '<button type="button" class="preset-pill-btn' + (KS.veMusic === f[0] ? ' active' : '') + '" onclick="KinetStudio.veSet(\'music\',\'' + f[0] + '\')">' + f[1] + '</button>'; }).join('');
    $('ve-audio-row').style.display = KS.veMusic === 'file' ? 'flex' : 'none';
    $('ve-bpm-row').style.display = KS.veMusic === 'beat' ? 'flex' : 'none';
    $('ve-bpm').value = KS.veBpm;
    var q = KinetAPIs.getQuotaStatus();
    $('ve-limits').textContent = 'Tu plan: hasta ' + maxClips() + ' clips (máx. 3 min cada uno) y ediciones de hasta ' + mx + ' s · Esta edición cuesta ' + veCost() + ' min de ' + q.videoRemaining + ' disponibles.';
    var sp = activeSpotifyTrack ? 'Tu canción de Spotify («' + activeSpotifyTrack.title + '») se adjuntará a la publicación y sonará con el reproductor oficial de Spotify. Por derechos de autor, no se puede incrustar dentro del archivo de vídeo: este lleva el beat KINET libre de derechos o tu propio audio.' : 'Puedes adjuntar una canción de Spotify a la publicación desde la isla superior. El vídeo lleva el beat KINET libre de derechos o tu propio audio.';
    $('ve-music-note').textContent = sp;
  }
  function veSet(kind, val) {
    var S = videoStyles();
    if (kind === 'style') { KS.veStyle = val; KS.veSeconds = Math.min(S[val].seconds, maxSeconds()); KS.veFormat = S[val].format; KS.veBpm = S[val].bpm; $('ve-prompt').value = S[val].prompt; }
    if (kind === 'seconds') KS.veSeconds = val;
    if (kind === 'format') KS.veFormat = val;
    if (kind === 'music') KS.veMusic = val;
    renderVeOptions();
  }
  function openVideoEditModal(file) {
    if (!isPaidOrBonusAccount()) { $('upgrade-tier-modal').classList.add('open'); return; }
    if (file && file.type && file.type.indexOf('video/') === 0) { KS.veFiles = [file]; $('ve-file-list').textContent = file.name; }
    if (!$('ve-prompt').value) $('ve-prompt').value = videoStyles()[KS.veStyle].prompt;
    renderVeOptions();
    $('video-edit-modal').classList.add('open');
  }
  function onVideoEditFiles(inp) {
    KS.veFiles = Array.from(inp.files).slice(0, maxClips());
    $('ve-file-list').textContent = KS.veFiles.length ? KS.veFiles.map(function (f) { return f.name; }).join(' · ') : 'Ningún vídeo seleccionado';
  }
  async function onVideoEditAudio(inp) {
    var f = inp.files && inp.files[0]; if (!f) return;
    KS.veAudio = f; $('ve-audio-name').textContent = f.name + ' · analizando ritmo…';
    try { var b = await KinetVideoEdit.detectBPM(f); KS.veBpm = b; $('ve-audio-name').textContent = f.name + ' · ' + b + ' BPM detectados'; }
    catch (e) { $('ve-audio-name').textContent = f.name + ' · ' + (e.message || 'no se pudo analizar'); KS.veAudio = null; }
  }
  function setVeStatus(txt, pct) {
    $('ve-status').textContent = txt;
    if (typeof pct === 'number') $('ve-bar').style.width = pct + '%';
  }
  async function runVideoEdit() {
    var runBtn = $('ve-run');
    if (!KS.veFiles.length) { setVeStatus('Sube al menos un vídeo (máx. ' + maxClips() + ').', 0); return; }
    var prompt = $('ve-prompt').value.trim();
    if (window.KinetModeration) { var m = KinetModeration.checkText(prompt); if (!m.ok) { setVeStatus(m.message, 0); return; } }
    var cost = veCost(), q = KinetAPIs.getQuotaStatus();
    if (q.videoRemaining < cost) { setVeStatus('Te quedan ' + q.videoRemaining + ' min de vídeo y este edit cuesta ' + cost + ' min. Consigue más en Despacho.', 0); return; }
    if (KS.veMusic === 'file' && !KS.veAudio) { setVeStatus('Sube tu canción o elige otra opción de música.', 0); return; }
    runBtn.disabled = true; $('ve-result').style.display = 'none';
    try {
      var bpm = parseInt($('ve-bpm').value, 10) || KS.veBpm;
      var res = await KinetVideoEdit.create({
        files: KS.veFiles, prompt: prompt, targetSeconds: KS.veSeconds, format: KS.veFormat, style: KS.veStyle,
        audio: KS.veMusic === 'none' ? { mode: 'none' } : (KS.veMusic === 'file' ? { mode: 'file', file: KS.veAudio, bpm: KS.veBpm } : { mode: 'beat', bpm: bpm }),
        sync: true, maxClips: maxClips(), onProgress: function (p, t) { setVeStatus(t, p); }
      });
      KinetAPIs.deductVideoMinutes(cost);
      var url = URL.createObjectURL(res.blob), vid = $('ve-video');
      vid.src = url;
      var dl = $('ve-download'); dl.href = url; dl.download = 'kinet-edit-' + Date.now() + '.' + res.ext;
      $('ve-result').style.display = 'block';
      setVeStatus('Edit listo (' + cost + ' min descontados' + (res.bpm ? ' · ' + res.bpm + ' BPM' : '') + '). Se ha creado en tu dispositivo y no se sube a ningún servidor. Para publicarlo en Comunidad, los clips son de máx. 20 s.', 100);
      if (window.syncStudioAccountPermissions) syncStudioAccountPermissions();
      refreshUsage();
    } catch (e) {
      setVeStatus('⚠️ ' + (e && e.message ? e.message : e) + ' No se ha descontado ningún minuto.', 0);
    } finally { runBtn.disabled = false; }
  }

  // ───────────── estilos ─────────────
  var css = document.createElement('style');
  css.textContent =
    '.ks-card{margin-top:4px;border:1px solid rgba(var(--role-rgb),0.4);border-radius:14px;overflow:hidden;background:rgba(6,9,15,0.97);max-width:min(100%,420px);}' +
    '.ks-img-wrap{width:100%;background:rgba(255,255,255,0.03);display:flex;align-items:center;justify-content:center;padding:6px;}' +
    '.ks-img-wrap img{max-width:100%;width:auto;height:auto;max-height:min(30vh,250px);object-fit:contain;display:block;user-select:none;border-radius:10px;}' +
    '.ks-chip.on{background:rgba(var(--role-rgb),0.22)!important;border-color:var(--role-color)!important;color:#fff!important;}' +
    '.ks-tools{display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding:8px 10px;border-top:1px solid rgba(255,255,255,0.08);}' +
    '.ks-tools-label{font-family:"JetBrains Mono",monospace;font-size:0.54rem;color:var(--role-color);letter-spacing:0.08em;margin-right:2px;}' +
    '.ks-chip{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.14);color:#CBD5E1;border-radius:999px;padding:3px 10px;font-size:0.62rem;cursor:pointer;font-family:Inter,sans-serif;transition:all .15s;}' +
    '.ks-chip:hover{border-color:var(--role-color);color:var(--role-color);}' +
    '.ks-btn{padding:5px 10px !important;font-size:0.6rem !important;}' +
    '.ks-thumb{max-width:120px;max-height:120px;border-radius:8px;margin-bottom:6px;}' +
    '.ks-thumb-sm{width:26px;height:26px;border-radius:6px;object-fit:cover;}' +
    '.ks-dots{display:inline-flex;gap:3px;vertical-align:middle;}.ks-dots i{width:5px;height:5px;border-radius:50%;background:var(--role-color);animation:ksDot 1s infinite ease-in-out;}.ks-dots i:nth-child(2){animation-delay:.15s}.ks-dots i:nth-child(3){animation-delay:.3s}' +
    '@keyframes ksDot{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}' +
    '.ks-strip{display:flex;gap:8px;overflow-x:auto;padding:2px 0 6px;scrollbar-width:thin;}' +
    '.ks-tpl{flex:0 0 auto;min-width:150px;max-width:190px;text-align:left;background:rgba(255,255,255,0.03);border:1px solid var(--border-subtle);border-radius:12px;padding:8px 11px;cursor:pointer;display:flex;flex-direction:column;gap:2px;color:white;font-family:Inter,sans-serif;transition:all .18s;}' +
    '.ks-tpl strong{font-size:0.7rem;font-weight:700;}.ks-tpl span{font-family:"JetBrains Mono",monospace;font-size:0.52rem;color:#94A3B8;letter-spacing:0.05em;}' +
    '.ks-tpl:hover,.ks-tpl.active{border-color:var(--role-color);background:rgba(var(--role-rgb),0.1);}.ks-tpl.active span{color:var(--role-color);}' +
    '#ks-source-chip,#ks-template-hint{display:none;align-items:center;gap:8px;font-size:0.68rem;color:#CBD5E1;background:rgba(var(--role-rgb),0.08);border:1px solid rgba(var(--role-rgb),0.3);border-radius:10px;padding:5px 9px;margin-top:6px;justify-content:space-between;}' +
    '#ks-source-chip button,#ks-template-hint button{background:none;border:none;color:#94A3B8;cursor:pointer;font-size:0.8rem;}' +
    '.ks-shake{animation:ksShake .35s;}@keyframes ksShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}' +
    '#studio-usage-meter{font-family:"JetBrains Mono",monospace;font-size:0.62rem;color:#CBD5E1;}#studio-usage-meter strong{color:var(--role-color);}';
  document.head.appendChild(css);

  // ───────────── API pública / compatibilidad ─────────────
  window.KinetStudio = {
    send: send, onFile: onFile, pickTemplate: pickTemplate, pickVideoStyle: pickVideoStyle, applyFilter: applyFilter,
    download: download, pdf: pdf, addText: addText, editWithAI: editWithAI, clearSource: clearSource, publish: publish,
    autoTrack: autoTrack, onModeChange: onModeChange, refreshUsage: refreshUsage, buildTemplates: buildTemplates,
    openVideoEditModal: openVideoEditModal, onVideoEditFiles: onVideoEditFiles, onVideoEditAudio: onVideoEditAudio,
    veSet: veSet, runVideoEdit: runVideoEdit, _state: KS, _compose: compose
  };
  window.generateAiEdit = send;
  window.handleStudioFileSelected = onFile;
  window.downloadStudioCreationPNG = function () { download(); };
  window.downloadStudioCreationPDF = function () { pdf(); };
  window.exportAndShareCreation = function () { publish(); };
  window.openVideoEditModal = openVideoEditModal;
  window.runVideoEdit = runVideoEdit;
  window.onVideoEditFiles = onVideoEditFiles;

  function init() {
    var inp = $('ai-prompt-input'); if (inp) { inp.setAttribute('autocomplete', 'off'); inp.placeholder = placeholderFor(); }
    var as = $('aspect-ratio-select'); if (as) as.addEventListener('change', function () { KS.aspectTouched = true; });
    buildTemplates(); refreshUsage(); renderSourceChip();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
