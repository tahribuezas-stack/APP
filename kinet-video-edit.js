/* KINET · Editor de vídeo con IA (100 % en el navegador, coste de servidor 0).
   1) Extrae fotogramas de tus clips  2) la IA decide los mejores tramos  3) se monta el edit con canvas + MediaRecorder. */
(function () {
  'use strict';
  const MAX_CLIPS = 4;
  const MAX_CLIP_SECONDS = 180;
  const FRAMES_PER_CLIP = 6;
  const NEON = '#00FF88';

  function loadVideo(file) {
    return new Promise((resolve, reject) => {
      const v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.preload = 'auto';
      v.src = URL.createObjectURL(file);
      v.onloadedmetadata = () => resolve(v);
      v.onerror = () => reject(new Error('No se pudo leer el vídeo «' + file.name + '».'));
    });
  }

  function seek(v, t) {
    return new Promise((res) => {
      let fin = false;
      const done = () => { if (fin) return; fin = true; v.removeEventListener('seeked', done); res(); };
      v.addEventListener('seeked', done);
      v.currentTime = Math.min(Math.max(0, t), Math.max(0, (v.duration || 0) - 0.05));
      setTimeout(done, 4000);
    });
  }

  async function extractFrames(v, n) {
    const out = [];
    const c = document.createElement('canvas');
    c.width = 384; c.height = Math.max(2, Math.round(384 * (v.videoHeight / v.videoWidth)));
    const g = c.getContext('2d');
    for (let i = 0; i < n; i++) {
      const t = (v.duration * (i + 0.5)) / n;
      await seek(v, t);
      g.drawImage(v, 0, 0, c.width, c.height);
      out.push({ t, b64: c.toDataURL('image/jpeg', 0.6) });
    }
    return out;
  }

  function sanitizePlan(plan, videos) {
    const segs = [];
    plan.segments.forEach((s) => {
      const ci = Math.max(0, Math.min(videos.length - 1, parseInt(s.clip, 10) || 0));
      const dur = videos[ci].duration;
      let start = Math.max(0, Math.min(dur - 1, parseFloat(s.start) || 0));
      let end = Math.max(start + 1.2, Math.min(dur, parseFloat(s.end) || start + 3));
      if (end - start > 6) end = start + 6;
      if (end > dur) end = dur;
      if (end - start < 0.8) return;
      segs.push({
        clip: ci, start, end,
        speed: (parseFloat(s.speed) > 0 && parseFloat(s.speed) <= 1) ? parseFloat(s.speed) : 1,
        zoom: Math.max(1, Math.min(1.3, parseFloat(s.zoom) || 1)),
        caption: String(s.caption || '').slice(0, 48)
      });
    });
    if (!segs.length) throw new Error('La IA no eligió tramos válidos. Prueba con otra petición.');
    return {
      title: String(plan.title || 'MI EDIT').toUpperCase().slice(0, 28),
      subtitle: String(plan.subtitle || '').slice(0, 60),
      outro: String(plan.outro || '').slice(0, 40),
      segments: segs
    };
  }

  function wrapText(g, text, maxW) {
    const words = String(text).split(/\s+/); const lines = []; let cur = '';
    words.forEach((w) => {
      const test = cur ? cur + ' ' + w : w;
      if (g.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
    });
    if (cur) lines.push(cur);
    return lines;
  }

  function drawCard(g, W, H, title, subtitle, handle, alpha) {
    const grad = g.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#05070C'); grad.addColorStop(1, '#0B1A14');
    g.globalAlpha = 1; g.fillStyle = grad; g.fillRect(0, 0, W, H);
    g.globalAlpha = alpha; g.textAlign = 'center';
    g.fillStyle = NEON; g.font = '700 ' + Math.round(W * 0.034) + 'px monospace';
    g.fillText('K I N E T   M E D I A   S T U D I O', W / 2, H * 0.36);
    g.fillStyle = '#FFFFFF'; g.font = '900 ' + Math.round(W * 0.09) + 'px sans-serif';
    wrapText(g, title, W * 0.86).forEach((l, i) => g.fillText(l, W / 2, H * 0.47 + i * W * 0.11));
    if (subtitle) { g.fillStyle = '#CBD5E1'; g.font = '500 ' + Math.round(W * 0.04) + 'px sans-serif'; g.fillText(subtitle, W / 2, H * 0.64); }
    g.fillStyle = NEON; g.font = '700 ' + Math.round(W * 0.036) + 'px monospace'; g.fillText(handle, W / 2, H * 0.9);
    g.globalAlpha = 1;
  }

  function holdCard(g, W, H, title, subtitle, handle, ms) {
    return new Promise((resolve) => {
      const t0 = performance.now();
      const tick = () => {
        const el = performance.now() - t0;
        drawCard(g, W, H, title, subtitle, handle, Math.min(1, el / 350));
        if (el >= ms) resolve(); else requestAnimationFrame(tick);
      };
      tick();
    });
  }

  function playSegment(g, W, H, v, seg, handle, idx, total) {
    return new Promise(async (resolve) => {
      await seek(v, seg.start);
      v.playbackRate = seg.speed;
      const realMs = ((seg.end - seg.start) / seg.speed) * 1000 + 3000;
      const guard = setTimeout(() => { v.pause(); resolve(); }, realMs);
      try { await v.play(); } catch (e) {}
      const dstAR = W / H;
      const draw = () => {
        const now = v.currentTime;
        if (now >= seg.end || v.ended) { clearTimeout(guard); v.pause(); resolve(); return; }
        const srcAR = v.videoWidth / v.videoHeight;
        let sw = v.videoWidth, sh = v.videoHeight, sx = 0, sy = 0;
        if (srcAR > dstAR) { sw = sh * dstAR; sx = (v.videoWidth - sw) / 2; } else { sh = sw / dstAR; sy = (v.videoHeight - sh) / 2; }
        const prog = Math.min(1, (now - seg.start) / Math.max(0.1, seg.end - seg.start));
        const z = 1 + (seg.zoom - 1) * prog;
        const zw = sw / z, zh = sh / z;
        sx += (sw - zw) / 2; sy += (sh - zh) / 2;
        g.globalAlpha = 1;
        g.drawImage(v, sx, sy, zw, zh, 0, 0, W, H);
        const vg = g.createLinearGradient(0, H * 0.62, 0, H);
        vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.78)');
        g.fillStyle = vg; g.fillRect(0, H * 0.62, W, H * 0.38);
        g.textAlign = 'left'; g.fillStyle = NEON; g.font = '700 ' + Math.round(W * 0.032) + 'px monospace';
        g.fillText(handle, W * 0.05, H * 0.05);
        if (seg.speed < 1) { g.textAlign = 'right'; g.fillText('SLOW MO', W * 0.95, H * 0.05); }
        if (seg.caption) {
          g.textAlign = 'center'; g.fillStyle = '#FFFFFF'; g.font = '800 ' + Math.round(W * 0.055) + 'px sans-serif';
          wrapText(g, seg.caption, W * 0.86).forEach((l, i) => g.fillText(l, W / 2, H * 0.84 + i * W * 0.07));
        }
        g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(W * 0.05, H * 0.965, W * 0.9, 3);
        g.fillStyle = NEON; g.fillRect(W * 0.05, H * 0.965, W * 0.9 * ((idx + prog) / total), 3);
        const fade = Math.max(0, 1 - (now - seg.start) / 0.25);
        if (fade > 0) { g.fillStyle = 'rgba(0,0,0,' + fade.toFixed(2) + ')'; g.fillRect(0, 0, W, H); }
        requestAnimationFrame(draw);
      };
      draw();
    });
  }

  async function create({ files, prompt, targetSeconds = 30, format = 'vertical', onProgress }) {
    const say = (p, t) => { if (typeof onProgress === 'function') onProgress(p, t); };
    if (!window.KinetAPIs || typeof window.KinetAPIs.generateVideoEditPlan !== 'function') throw new Error('El motor de IA no está cargado. Recarga la página.');
    if (!window.MediaRecorder) throw new Error('Tu navegador no puede grabar vídeo. Usa Chrome, Edge o Safari actualizado.');
    const list = Array.from(files || []).slice(0, MAX_CLIPS);
    if (!list.length) throw new Error('Sube al menos un vídeo.');

    say(5, 'Leyendo tus vídeos...');
    const videos = [];
    for (const f of list) {
      const v = await loadVideo(f);
      if (v.duration > MAX_CLIP_SECONDS) throw new Error('«' + f.name + '» dura más de ' + MAX_CLIP_SECONDS / 60 + ' min. Recórtalo o sube un clip más corto.');
      videos.push(v);
    }

    const clips = [];
    for (let i = 0; i < videos.length; i++) {
      say(10 + Math.round((i / videos.length) * 25), 'Analizando clip ' + (i + 1) + ' de ' + videos.length + '...');
      clips.push({ name: list[i].name.slice(0, 40), duration: videos[i].duration, frames: await extractFrames(videos[i], FRAMES_PER_CLIP) });
    }

    say(40, 'La IA está eligiendo tus mejores jugadas...');
    const sport = localStorage.getItem('kinet_sport') || 'Fútbol';
    const raw = await window.KinetAPIs.generateVideoEditPlan({ promptText: prompt, clips, targetSeconds, sport });
    const plan = sanitizePlan(raw, videos);

    const W = format === 'horizontal' ? 960 : 540;
    const H = format === 'horizontal' ? 540 : 960;
    const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
    const g = canvas.getContext('2d');
    const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find(m => MediaRecorder.isTypeSupported(m));
    if (!mime) throw new Error('Tu navegador no admite ningún formato de grabación de vídeo.');
    const stream = canvas.captureStream(30);
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2500000 });
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    const stopped = new Promise((res) => { rec.onstop = res; });
    const handle = (localStorage.getItem('kinet_social_handle') || 'KINET').toUpperCase();

    rec.start(250);
    try {
      say(50, 'Montando el edit (mantén esta pestaña abierta)...');
      await holdCard(g, W, H, plan.title, plan.subtitle, handle, 1500);
      for (let i = 0; i < plan.segments.length; i++) {
        say(50 + Math.round((i / plan.segments.length) * 42), 'Montando tramo ' + (i + 1) + ' de ' + plan.segments.length + '...');
        await playSegment(g, W, H, videos[plan.segments[i].clip], plan.segments[i], handle, i, plan.segments.length);
      }
      await holdCard(g, W, H, plan.outro || plan.title, '', handle, 1300);
    } finally {
      rec.stop();
      await stopped;
      stream.getTracks().forEach(t => t.stop());
      videos.forEach(v => URL.revokeObjectURL(v.src));
    }
    say(100, 'Edit listo');
    const type = mime.split(';')[0];
    return { blob: new Blob(chunks, { type }), ext: type.includes('mp4') ? 'mp4' : 'webm', plan };
  }

  window.KinetVideoEdit = { create };
})();
