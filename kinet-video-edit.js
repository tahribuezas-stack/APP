/* KINET · Editor de vídeo con IA (100 % en el navegador, coste de servidor 0).
   1) Extrae fotogramas de tus clips  2) la IA decide los mejores tramos según el ESTILO elegido
   3) se monta el edit con canvas + MediaRecorder, con música sincronizada (beat KINET libre de derechos o tu propia canción).
   Los cortes se alinean al ritmo (BPM) y los golpes de zoom/flash caen sobre el beat. */
(function () {
  'use strict';
  const MAX_CLIP_SECONDS = 180;
  const FRAMES_PER_CLIP = 6;
  const NEON = '#00FF88';

  const STYLES = {
    highlight: { name: 'Highlight clásico', desc: 'Las mejores jugadas con rótulos y cierre de marca.', seconds: 30, format: 'vertical', bpm: 124, minSeg: 2, maxSeg: 6, grade: 'punch', letterbox: false, flash: true, punch: false, intro: true, outro: true, beat: 'drive',
      prompt: 'Highlight con mis mejores jugadas, ordenadas de menos a más espectaculares, con la mejor al final' },
    viral: { name: 'Viral rápido', desc: 'Cortes muy rápidos con golpes de zoom al ritmo. Ideal para Reels.', seconds: 15, format: 'vertical', bpm: 140, minSeg: 1, maxSeg: 2.2, grade: 'punch', letterbox: false, flash: true, punch: true, intro: false, outro: true, beat: 'drive',
      prompt: 'Edit viral de 15 segundos con cortes rápidos, empezando por la mejor jugada para enganchar' },
    cine: { name: 'Cinematográfico', desc: 'Planos largos, cámara lenta, barras de cine y color de película.', seconds: 30, format: 'horizontal', bpm: 96, minSeg: 3, maxSeg: 7, grade: 'cine', letterbox: true, flash: false, punch: false, intro: true, outro: true, beat: 'soft',
      prompt: 'Pieza cinematográfica con cámara lenta en las jugadas clave y ritmo pausado' },
    recap: { name: 'Resumen de partido', desc: 'Recorrido cronológico con los momentos importantes.', seconds: 60, format: 'horizontal', bpm: 108, minSeg: 3, maxSeg: 6, grade: null, letterbox: false, flash: false, punch: false, intro: true, outro: true, beat: 'drive',
      prompt: 'Resumen cronológico del partido con los momentos más importantes y un rótulo corto en cada uno' },
    skills: { name: 'Mejores jugadas (cámara lenta)', desc: 'Cada jugada clave con repetición en cámara lenta.', seconds: 30, format: 'vertical', bpm: 128, minSeg: 2, maxSeg: 5, grade: 'punch', letterbox: false, flash: true, punch: true, intro: false, outro: true, beat: 'drive', slow: true,
      prompt: 'Mis mejores jugadas, cada una con su repetición en cámara lenta en el momento clave' }
  };

  const GRADES = {
    punch: { c: 1.14, s: 1.22, b: 1.0 },
    cine: { c: 1.12, s: 0.88, b: 0.97 }
  };
  const FILTER_OK = (function () { try { return 'filter' in document.createElement('canvas').getContext('2d'); } catch (e) { return false; } })();

  // ───────────────────────── utilidades de vídeo ─────────────────────────
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

  function sleep(ms) { return new Promise((r) => setTimeout(r, Math.max(0, ms))); }

  // ───────────────────────── plan de edición ─────────────────────────
  function sanitizePlan(plan, videos, st, targetSeconds) {
    const segs = [];
    let total = 0;
    plan.segments.forEach((s) => {
      const ci = Math.max(0, Math.min(videos.length - 1, parseInt(s.clip, 10) || 0));
      const dur = videos[ci].duration;
      const speed = (parseFloat(s.speed) > 0 && parseFloat(s.speed) <= 1) ? parseFloat(s.speed) : 1;
      let start = Math.max(0, Math.min(dur - 1, parseFloat(s.start) || 0));
      let end = Math.max(start + st.minSeg, Math.min(dur, parseFloat(s.end) || start + 3));
      if (end - start > st.maxSeg * speed + 0.01) end = start + st.maxSeg * speed;
      if (end > dur) end = dur;
      if (end - start < 0.8) return;
      const real = (end - start) / speed;
      if (total + real > targetSeconds + 1.5) return;
      total += real;
      segs.push({ clip: ci, start, end, speed, zoom: Math.max(1, Math.min(1.3, parseFloat(s.zoom) || 1)), caption: String(s.caption || '').slice(0, 48) });
    });
    if (!segs.length) throw new Error('La IA no eligió tramos válidos. Prueba con otra petición.');
    return {
      title: String(plan.title || 'MI EDIT').toUpperCase().slice(0, 28),
      subtitle: String(plan.subtitle || '').slice(0, 60),
      outro: String(plan.outro || '').slice(0, 40),
      segments: segs
    };
  }

  // Ajusta la duración real de cada tramo a un múltiplo de beat (≥ 2 beats) para que los cortes caigan sobre el ritmo.
  function quantizeToBeat(plan, videos, bpm) {
    const beat = 60 / bpm;
    plan.segments.forEach((s) => {
      const real = (s.end - s.start) / s.speed;
      const q = Math.max(2, Math.round(real / beat)) * beat;
      let end = s.start + q * s.speed;
      const dur = videos[s.clip].duration;
      if (end > dur) { s.start = Math.max(0, dur - q * s.speed); end = dur; }
      s.end = end;
      s.real = Math.max(0.5, (s.end - s.start) / s.speed);
    });
    plan.segments.forEach((s) => { if (!s.real) s.real = (s.end - s.start) / s.speed; });
  }

  // ───────────────────────── audio: BPM, beat libre de derechos, canción del usuario ─────────────────────────
  function estimateBPM(buf) {
    try {
      const sr = buf.sampleRate, data = buf.getChannelData(0);
      const maxSamples = Math.min(data.length, sr * 40);
      const hop = 512, n = Math.floor(maxSamples / hop);
      const env = new Float32Array(n);
      for (let i = 0; i < n; i++) { let e = 0; for (let j = 0; j < hop; j += 4) { const x = data[i * hop + j] || 0; e += x * x; } env[i] = Math.sqrt(e / (hop / 4)); }
      const onset = new Float32Array(n);
      for (let i = 1; i < n; i++) onset[i] = Math.max(0, env[i] - env[i - 1]);
      const fps = sr / hop;
      let best = 0, bestLag = 0;
      for (let bpm = 70; bpm <= 180; bpm += 0.5) {
        const lag = Math.round((60 / bpm) * fps);
        let sum = 0;
        for (let i = lag; i < n; i++) sum += onset[i] * onset[i - lag];
        sum /= (n - lag);
        if (sum > best) { best = sum; bestLag = bpm; }
      }
      let b = bestLag || 120;
      while (b < 85) b *= 2;
      while (b > 170) b /= 2;
      return Math.round(b);
    } catch (e) { return 120; }
  }

  async function decodeFile(actx, file) {
    const ab = await file.arrayBuffer();
    return await new Promise((res, rej) => actx.decodeAudioData(ab, res, () => rej(new Error('No se pudo leer el archivo de audio. Prueba con MP3, WAV o M4A.'))));
  }

  function bestOffset(buf, seconds) {
    const sr = buf.sampleRate, d = buf.getChannelData(0), win = Math.floor(sr);
    const secs = Math.floor(d.length / win);
    if (secs <= seconds + 1) return 0;
    const e = [];
    for (let i = 0; i < secs; i++) { let s = 0; for (let j = 0; j < win; j += 8) { const x = d[i * win + j]; s += x * x; } e.push(s); }
    let best = 0, bestS = -1;
    for (let i = 0; i + seconds <= secs; i++) { let s = 0; for (let k = 0; k < seconds; k++) s += e[i + k]; if (s > bestS) { bestS = s; best = i; } }
    return best;
  }

  // Beat sintetizado a medida (kick, caja, hi-hat, bajo): libre de derechos, al BPM pedido.
  async function renderBeat(bpm, seconds, kind) {
    const sr = 44100, len = Math.ceil(sr * seconds);
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const ctx = new OAC(1, len, sr);
    const beat = 60 / bpm, soft = kind === 'soft';
    const noise = ctx.createBuffer(1, sr, sr), nd = noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    const master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    const bassNotes = [43.65, 43.65, 51.91, 38.89];   // F1 F1 Ab1 Eb1
    const total = Math.floor(seconds / beat);
    for (let b = 0; b < total; b++) {
      const t = b * beat, step = b % 4;
      if (!soft || step === 0 || step === 2) {   // kick
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.setValueAtTime(155, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
        g.gain.setValueAtTime(soft ? 0.7 : 1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.32);
      }
      if (step === 1 || step === 3) {   // caja / clap
        const s = ctx.createBufferSource(); s.buffer = noise;
        const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.8;
        const g = ctx.createGain(); g.gain.setValueAtTime(soft ? 0.25 : 0.55, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
        s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * 0.5); s.stop(t + 0.2);
      }
      if (!soft) {   // hi-hats a corcheas
        for (let h = 0; h < 2; h++) {
          const th = t + h * beat / 2;
          const s = ctx.createBufferSource(); s.buffer = noise;
          const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7500;
          const g = ctx.createGain(); g.gain.setValueAtTime(h ? 0.12 : 0.2, th); g.gain.exponentialRampToValueAtTime(0.001, th + 0.05);
          s.connect(f); f.connect(g); g.connect(master); s.start(th, Math.random() * 0.5); s.stop(th + 0.06);
        }
      }
      // bajo (cambia cada compás)
      const note = bassNotes[Math.floor(b / 4) % bassNotes.length];
      if (step === 0 || step === 2) {
        const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
        o.type = 'sawtooth'; o.frequency.value = note * (soft ? 1 : 2); lp.type = 'lowpass'; lp.frequency.value = soft ? 260 : 420;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(soft ? 0.25 : 0.32, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + beat * 1.8);
        o.connect(lp); lp.connect(g); g.connect(master); o.start(t); o.stop(t + beat * 1.9);
      }
      // pad suave sobre cada compás
      if (step === 0) {
        [1, 1.19, 1.5].forEach((r) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.type = 'triangle'; o.frequency.value = note * 8 * r;
          g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(soft ? 0.05 : 0.025, t + 0.4); g.gain.linearRampToValueAtTime(0.0001, t + beat * 4);
          o.connect(g); g.connect(master); o.start(t); o.stop(t + beat * 4.05);
        });
      }
    }
    return await ctx.startRendering();
  }

  // ───────────────────────── dibujo ─────────────────────────
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

  function playSegment(g, W, H, v, seg, handle, idx, total, st, beatSec) {
    return new Promise(async (resolve) => {
      await seek(v, seg.start);
      v.playbackRate = seg.speed;
      const realMs = ((seg.end - seg.start) / seg.speed) * 1000 + 3000;
      const guard = setTimeout(() => { v.pause(); resolve(); }, realMs);
      try { await v.play(); } catch (e) {}
      const dstAR = W / H;
      const grade = st.grade && GRADES[st.grade];
      const bar = st.letterbox ? Math.round(H * 0.11) : 0;
      const t0 = performance.now();
      const draw = () => {
        const now = v.currentTime;
        if (now >= seg.end || v.ended) { clearTimeout(guard); v.pause(); resolve(); return; }
        const el = (performance.now() - t0) / 1000;
        const srcAR = v.videoWidth / v.videoHeight;
        let sw = v.videoWidth, sh = v.videoHeight, sx = 0, sy = 0;
        if (srcAR > dstAR) { sw = sh * dstAR; sx = (v.videoWidth - sw) / 2; } else { sh = sw / dstAR; sy = (v.videoHeight - sh) / 2; }
        const prog = Math.min(1, (now - seg.start) / Math.max(0.1, seg.end - seg.start));
        let z = 1 + (seg.zoom - 1) * prog;
        if (st.punch && beatSec) { const ph = (el % beatSec) / beatSec; z += 0.05 * Math.pow(1 - ph, 2.2); }
        const zw = sw / z, zh = sh / z;
        sx += (sw - zw) / 2; sy += (sh - zh) / 2;
        g.globalAlpha = 1;
        if (grade && FILTER_OK) g.filter = 'contrast(' + grade.c + ') saturate(' + grade.s + ') brightness(' + grade.b + ')';
        g.drawImage(v, sx, sy, zw, zh, 0, 0, W, H);
        if (FILTER_OK) g.filter = 'none';
        const vg = g.createLinearGradient(0, H * 0.62, 0, H);
        vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.78)');
        g.fillStyle = vg; g.fillRect(0, H * 0.62, W, H * 0.38);
        if (bar) { g.fillStyle = '#000'; g.fillRect(0, 0, W, bar); g.fillRect(0, H - bar, W, bar); }
        g.textAlign = 'left'; g.fillStyle = NEON; g.font = '700 ' + Math.round(W * 0.032) + 'px monospace';
        g.fillText(handle, W * 0.05, bar + H * 0.05);
        if (seg.speed < 1) { g.textAlign = 'right'; g.fillText('SLOW MO', W * 0.95, bar + H * 0.05); }
        if (seg.caption) {
          g.textAlign = 'center'; g.fillStyle = '#FFFFFF'; g.font = '800 ' + Math.round(W * 0.055) + 'px sans-serif';
          wrapText(g, seg.caption, W * 0.86).forEach((l, i) => g.fillText(l, W / 2, H * 0.84 - bar * 0.4 + i * W * 0.07));
        }
        g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(W * 0.05, H * 0.965 - bar * 0.5, W * 0.9, 3);
        g.fillStyle = NEON; g.fillRect(W * 0.05, H * 0.965 - bar * 0.5, W * 0.9 * ((idx + prog) / total), 3);
        // Transición: flash blanco sobre el beat (o fundido simple)
        if (st.flash) {
          const f = Math.max(0, 1 - el / 0.16);
          if (f > 0) { g.fillStyle = 'rgba(255,255,255,' + (0.55 * f).toFixed(2) + ')'; g.fillRect(0, 0, W, H); }
        } else {
          const fade = Math.max(0, 1 - el / 0.3);
          if (fade > 0) { g.fillStyle = 'rgba(0,0,0,' + fade.toFixed(2) + ')'; g.fillRect(0, 0, W, H); }
        }
        requestAnimationFrame(draw);
      };
      draw();
    });
  }

  // ───────────────────────── montaje ─────────────────────────
  // opts: { files, prompt, targetSeconds, format, style: 'highlight'|..., audio: {mode:'none'|'beat'|'file', file, bpm}, sync, maxClips, onProgress }
  async function create(opts) {
    const { files, prompt, format = 'vertical', onProgress } = opts;
    const st = Object.assign({}, STYLES[opts.style] || STYLES.highlight);
    const targetSeconds = opts.targetSeconds || st.seconds;
    const audio = opts.audio || { mode: 'none' };
    const say = (p, t) => { if (typeof onProgress === 'function') onProgress(p, t); };
    if (!window.KinetAPIs || typeof window.KinetAPIs.generateVideoEditPlan !== 'function') throw new Error('El motor de IA no está cargado. Recarga la página.');
    if (!window.MediaRecorder) throw new Error('Tu navegador no puede grabar vídeo. Usa Chrome, Edge o Safari actualizado.');
    const list = Array.from(files || []).slice(0, opts.maxClips || 4);
    if (!list.length) throw new Error('Sube al menos un vídeo.');

    say(4, 'Leyendo tus vídeos...');
    const videos = [];
    for (const f of list) {
      const v = await loadVideo(f);
      if (v.duration > MAX_CLIP_SECONDS) throw new Error('«' + f.name + '» dura más de ' + MAX_CLIP_SECONDS / 60 + ' min. Recórtalo o sube un clip más corto.');
      videos.push(v);
    }

    // Audio: se prepara antes de gastar IA, para fallar rápido si el archivo no vale
    let actx = null, dest = null, audioBuf = null, bpm = 0, audioOffset = 0;
    if (audio.mode === 'file' || audio.mode === 'beat') {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) throw new Error('Tu navegador no admite audio avanzado.');
      actx = new AC();
      if (actx.state === 'suspended') { try { await actx.resume(); } catch (e) {} }
      if (audio.mode === 'file') {
        say(8, 'Analizando tu canción...');
        audioBuf = await decodeFile(actx, audio.file);
        bpm = audio.bpm || estimateBPM(audioBuf);
      } else {
        bpm = Math.max(70, Math.min(180, audio.bpm || st.bpm));
      }
    }

    const clips = [];
    for (let i = 0; i < videos.length; i++) {
      say(12 + Math.round((i / videos.length) * 24), 'Analizando clip ' + (i + 1) + ' de ' + videos.length + '...');
      clips.push({ name: list[i].name.slice(0, 40), duration: videos[i].duration, frames: await extractFrames(videos[i], FRAMES_PER_CLIP) });
    }

    say(40, 'La IA está eligiendo tus mejores jugadas...');
    const sport = localStorage.getItem('kinet_sport') || 'Fútbol';
    const raw = await window.KinetAPIs.generateVideoEditPlan({
      promptText: prompt || st.prompt, clips, targetSeconds, sport,
      style: st.name + ' — ' + st.desc + (st.slow ? ' Usa cámara lenta (speed 0.5) en la jugada clave de cada tramo.' : ''), bpm: bpm || 0
    });
    const plan = sanitizePlan(raw, videos, st, targetSeconds);
    const sync = opts.sync !== false && bpm > 0;
    if (sync) quantizeToBeat(plan, videos, bpm); else plan.segments.forEach((s) => { s.real = (s.end - s.start) / s.speed; });
    const beatSec = bpm ? 60 / bpm : 0;
    const introSec = st.intro ? (sync ? Math.max(1, 2 * beatSec * 1) : 1.5) : 0;
    const outroSec = st.outro ? (sync ? Math.max(1.2, 2 * beatSec) : 1.3) : 0;
    const totalSec = introSec + plan.segments.reduce((a, s) => a + s.real, 0) + outroSec;

    if (audio.mode === 'beat') { say(46, 'Componiendo el beat a ' + bpm + ' BPM...'); audioBuf = await renderBeat(bpm, Math.ceil(totalSec) + 2, st.beat); }
    else if (audio.mode === 'file') audioOffset = bestOffset(audioBuf, Math.ceil(totalSec));

    const W = format === 'horizontal' ? 960 : 540;
    const H = format === 'horizontal' ? 540 : 960;
    const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
    const g = canvas.getContext('2d');
    const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find(m => MediaRecorder.isTypeSupported(m));
    if (!mime) throw new Error('Tu navegador no admite ningún formato de grabación de vídeo.');
    const stream = canvas.captureStream(30);
    let srcNode = null;
    if (actx && audioBuf) {
      dest = actx.createMediaStreamDestination();
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      const gain = actx.createGain(); gain.gain.value = 0.9;
      gain.gain.setValueAtTime(0.9, Math.max(0, actx.currentTime + totalSec - 1.2));
      gain.gain.linearRampToValueAtTime(0.0001, actx.currentTime + totalSec);
      srcNode = actx.createBufferSource(); srcNode.buffer = audioBuf; srcNode.connect(gain); gain.connect(dest);
    }
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2500000, audioBitsPerSecond: 128000 });
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    const stopped = new Promise((res) => { rec.onstop = res; });
    const handle = (localStorage.getItem('kinet_social_handle') || 'KINET').toUpperCase();

    rec.start(250);
    const t0 = performance.now();
    if (srcNode) srcNode.start(0, audioOffset);
    let target = 0;
    try {
      say(50, 'Montando el edit (mantén esta pestaña abierta)...');
      if (introSec) { await holdCard(g, W, H, plan.title, plan.subtitle, handle, introSec * 1000); target += introSec; await sleep(t0 + target * 1000 - performance.now()); }
      for (let i = 0; i < plan.segments.length; i++) {
        say(50 + Math.round((i / plan.segments.length) * 42), 'Montando tramo ' + (i + 1) + ' de ' + plan.segments.length + '...');
        await playSegment(g, W, H, videos[plan.segments[i].clip], plan.segments[i], handle, i, plan.segments.length, st, beatSec);
        target += plan.segments[i].real;
        const wait = t0 + target * 1000 - performance.now();
        if (wait > 0 && wait < 1500) await sleep(wait);   // realinea con la rejilla de beats
      }
      if (outroSec) await holdCard(g, W, H, plan.outro || plan.title, '', handle, outroSec * 1000);
    } finally {
      try { if (srcNode) srcNode.stop(); } catch (e) {}
      rec.stop();
      await stopped;
      stream.getTracks().forEach(t => t.stop());
      try { if (actx) actx.close(); } catch (e) {}
      videos.forEach(v => URL.revokeObjectURL(v.src));
    }
    say(100, 'Edit listo');
    const type = mime.split(';')[0];
    return { blob: new Blob(chunks, { type }), ext: type.includes('mp4') ? 'mp4' : 'webm', plan, bpm, seconds: Math.round(totalSec) };
  }

  // Estima el BPM de un archivo de audio (para mostrarlo antes de crear el edit)
  async function detectBPM(file) {
    const AC = window.AudioContext || window.webkitAudioContext;
    const a = new AC();
    try { const buf = await decodeFile(a, file); return estimateBPM(buf); } finally { try { a.close(); } catch (e) {} }
  }

  window.KinetVideoEdit = { create, detectBPM, STYLES };
})();
