/* KINET OS · Juegos · núcleo común (deporte, tema, almacenamiento, sonido, efectos, tarjeta para compartir).
   Todo funciona SIN registro: lo único que se guarda (rachas, récords, deporte) vive en el navegador de cada persona. */
(function () {
  'use strict';
  var KG = window.KG = window.KG || {};

  /* ───── deportes ───── */
  KG.sports = {
    futbol: { n: 'Fútbol', c: '#00FF88', rgb: '0,255,136', ico: '<circle cx="12" cy="12" r="9"/><path d="M12 8.2l3.5 2.5-1.3 4.1H9.8L8.5 10.7z"/><path d="M12 3v5.2M20.6 9.5l-5.1 1.2M17.4 19.4l-3.2-4.6M6.6 19.4l3.2-4.6M3.4 9.5l5.1 1.2"/>' },
    baloncesto: { n: 'Baloncesto', c: '#FB923C', rgb: '251,146,60', ico: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6c3.2 3 3.2 10.8 0 12.8M18.4 5.6c-3.2 3-3.2 10.8 0 12.8"/>' },
    tenis: { n: 'Tenis y pádel', c: '#FACC15', rgb: '250,204,21', ico: '<ellipse cx="9.5" cy="9.5" rx="5.2" ry="6.4" transform="rotate(-45 9.5 9.5)"/><path d="M13.6 13.6L20 20M6.2 6.2l6.4 6.4M9 4l6.4 6.4"/><circle cx="19" cy="6" r="1.8"/>' },
    running: { n: 'Running', c: '#22D3EE', rgb: '34,211,238', ico: '<circle cx="15" cy="4.5" r="1.9"/><path d="M12.2 8.6l3 1.8-1.6 3.7 3.3 2.2.4 4.2M12.2 8.6L9 12.4l-3.2.6M13.6 14.1l-3.2 3.2-3.6.7"/>' }
  };
  KG.order = ['futbol', 'baloncesto', 'tenis', 'running'];

  /* ───── almacenamiento seguro ───── */
  KG.get = function (k, d) { try { var v = localStorage.getItem('kg_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
  KG.set = function (k, v) { try { localStorage.setItem('kg_' + k, JSON.stringify(v)); } catch (e) {} };

  /* ───── utilidades ───── */
  KG.hash = function (s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  KG.rng = function (seed) { var a = (seed >>> 0) || 1; return function () { a += 0x6D2B79F5; var t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  KG.day = function () { var d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 864e5); };
  KG.shuffle = function (arr, rnd) { rnd = rnd || Math.random; var a = arr.slice(), i, j, t; for (i = a.length - 1; i > 0; i--) { j = Math.floor(rnd() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  KG.$ = function (s, r) { return (r || document).querySelector(s); };
  KG.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  KG.el = function (tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  KG.esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  KG.RM = false;
  KG.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  KG.lerp = function (a, b, t) { return a + (b - a) * t; };

  /* ───── deporte activo y tema ───── */
  var root = null, listeners = [];
  KG.sport = KG.get('sport', 'futbol'); if (!KG.sports[KG.sport]) KG.sport = 'futbol';
  try { var q = new URLSearchParams(location.search).get('d'); if (q && KG.sports[q]) KG.sport = q; } catch (e) {}
  function applyTheme() {
    var s = KG.sports[KG.sport], r = document.documentElement;
    r.style.setProperty('--kc', s.c); r.style.setProperty('--kcr', s.rgb);
    r.setAttribute('data-sport', KG.sport);
  }
  KG.setSport = function (k, silent) {
    if (!KG.sports[k]) return; KG.sport = k; KG.set('sport', k); applyTheme();
    KG.$$('.kg-sp').forEach(function (b) { b.classList.toggle('on', b.dataset.k === k); b.setAttribute('aria-pressed', b.dataset.k === k); });
    if (!silent) listeners.forEach(function (f) { try { f(k); } catch (e) { console.error(e); } });
  };
  KG.onSport = function (f) { listeners.push(f); };
  KG.sportIcon = function (k, size) { return '<svg viewBox="0 0 24 24" width="' + (size || 18) + '" height="' + (size || 18) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + KG.sports[k].ico + '</svg>'; };
  KG.sportBar = function (host, onChange) {
    host.innerHTML = '';
    host.setAttribute('role', 'group'); host.setAttribute('aria-label', 'Elige deporte');
    KG.order.forEach(function (k) {
      var b = KG.el('button', 'kg-sp' + (k === KG.sport ? ' on' : ''), '<i>' + KG.sportIcon(k, 18) + '</i><span>' + KG.sports[k].n + '</span>');
      b.type = 'button'; b.dataset.k = k; b.setAttribute('aria-pressed', k === KG.sport);
      b.addEventListener('click', function () { if (k !== KG.sport) { KG.beep(520, .06, 'triangle', .05); KG.setSport(k); if (onChange) onChange(k); } });
      host.appendChild(b);
    });
  };
  applyTheme();

  /* ───── sonido (opcional, se puede silenciar) ───── */
  var AC = null; KG.mute = KG.get('mute', false);
  KG.setMute = function (m) { KG.mute = !!m; KG.set('mute', KG.mute); };
  KG.beep = function (f, d, type, v, slide) {
    if (KG.mute) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume();
      var o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
      o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v || .06, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + .02);
    } catch (e) {}
  };
  KG.sfx = { ok: function () { KG.beep(660, .09, 'triangle', .06); setTimeout(function () { KG.beep(990, .14, 'triangle', .06); }, 70); }, bad: function () { KG.beep(220, .2, 'sawtooth', .05, 110); }, tick: function () { KG.beep(880, .04, 'square', .025); }, win: function () { [523, 659, 784, 1047].forEach(function (f, i) { setTimeout(function () { KG.beep(f, .16, 'triangle', .06); }, i * 90); }); } };

  /* ───── efectos ───── */
  KG.burst = function (x, y, color, n) {
    if (KG.RM) return; n = n || 14; color = color || 'var(--kc)';
    var host = document.body;
    for (var i = 0; i < n; i++) {
      var p = KG.el('i', 'kg-px'); p.style.cssText = 'left:' + x + 'px;top:' + y + 'px;background:' + color + ';box-shadow:0 0 8px ' + color;
      host.appendChild(p);
      var a = Math.random() * 6.283, d = 30 + Math.random() * 70, s = 3 + Math.random() * 4;
      p.style.width = p.style.height = s + 'px';
      (function (p, a, d) {
        if (p.animate) { var an = p.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: 'translate(' + (Math.cos(a) * d - 50) + '%,' + (Math.sin(a) * d - 50) + '%) scale(.2)', opacity: 0 }], { duration: 520 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.3,1)' }); an.onfinish = function () { p.remove(); }; }
        else p.remove();
      })(p, a, d);
    }
  };
  KG.toast = function (msg) {
    var t = KG.el('div', 'kg-toast', KG.esc(msg)); document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('in'); }); setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 400); }, 2200);
  };
  KG.countTo = function (el, to, ms, fmt) {
    var t0 = performance.now(); ms = ms || 900; fmt = fmt || function (v) { return Math.round(v); };
    function f(now) { var k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(to * e); if (k < 1) requestAnimationFrame(f); } requestAnimationFrame(f);
  };

  /* ───── tarjeta para compartir (imagen 1080x1350 con la estética KINET) ───── */
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  KG.drawCard = function (o) {
    var cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1350; var c = cv.getContext('2d'), col = o.color || KG.sports[KG.sport].c, rgb = o.rgb || KG.sports[KG.sport].rgb, i;
    var bg = c.createLinearGradient(0, 0, 0, 1350); bg.addColorStop(0, '#07100f'); bg.addColorStop(1, '#04060a'); c.fillStyle = bg; c.fillRect(0, 0, 1080, 1350);
    var gl = c.createRadialGradient(540, 470, 20, 540, 470, 720); gl.addColorStop(0, 'rgba(' + rgb + ',.34)'); gl.addColorStop(1, 'rgba(' + rgb + ',0)'); c.fillStyle = gl; c.fillRect(0, 0, 1080, 1350);
    c.strokeStyle = 'rgba(255,255,255,.04)'; c.lineWidth = 1; for (i = 0; i < 1080; i += 54) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, 1350); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(1080, i); c.stroke(); }
    /* pila isométrica de losas (como en la app) */
    for (i = 2; i >= 0; i--) {
      c.save(); c.translate(540, 905 + i * 22); c.beginPath(); c.moveTo(0, -150); c.lineTo(330, 0); c.lineTo(0, 150); c.lineTo(-330, 0); c.closePath();
      c.fillStyle = i === 0 ? 'rgba(' + rgb + ',.10)' : 'rgba(' + rgb + ',.04)'; c.fill(); c.strokeStyle = 'rgba(' + rgb + ',' + (i === 0 ? .9 : .3 - i * .08) + ')'; c.lineWidth = i === 0 ? 4 : 3; c.lineJoin = 'round'; c.stroke(); c.restore();
    }
    c.fillStyle = col; rr(c, 80, 84, 74, 74, 20); c.fill(); c.fillStyle = '#000'; c.font = '900 44px Orbitron, Inter, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('K', 117, 123);
    c.textAlign = 'left'; c.fillStyle = '#fff'; c.font = '900 40px Orbitron, Inter, sans-serif'; c.fillText('KINET OS', 176, 112); c.fillStyle = col; c.font = '500 22px "JetBrains Mono", monospace'; c.fillText('JUEGOS · SIN REGISTRO', 178, 148);
    c.textAlign = 'center'; c.fillStyle = col; c.font = '700 30px "JetBrains Mono", monospace'; c.fillText((o.kicker || '').toUpperCase(), 540, 290);
    c.fillStyle = '#fff'; c.font = '900 ' + (o.bigSize || 210) + 'px Orbitron, Inter, sans-serif'; c.shadowColor = col; c.shadowBlur = 50; c.fillText(String(o.big || ''), 540, 500); c.shadowBlur = 0;
    c.fillStyle = '#e8edf4'; c.font = '800 54px Inter, sans-serif'; wrap(c, o.title || '', 540, 640, 900, 62);
    c.fillStyle = '#93a1b5'; c.font = '500 34px Inter, sans-serif'; (o.lines || []).slice(0, 4).forEach(function (l, k) { c.fillText(l, 540, 760 + k * 50); });
    if (o.grid) { c.font = '56px sans-serif'; o.grid.slice(0, 6).forEach(function (row, k) { c.fillText(row, 540, 830 + k * 70); }); }
    c.fillStyle = 'rgba(255,255,255,.72)'; c.font = '600 34px Inter, sans-serif'; c.fillText(o.cta || '¿Y tú? Juega gratis en kinetos.es/juegos', 540, 1230);
    c.fillStyle = col; c.font = '500 24px "JetBrains Mono", monospace'; c.fillText('KINETOS.ES', 540, 1284);
    return cv;
  };
  function wrap(c, t, x, y, w, lh) { var words = String(t).split(' '), line = '', yy = y; words.forEach(function (wd) { var test = line ? line + ' ' + wd : wd; if (c.measureText(test).width > w && line) { c.fillText(line, x, yy); line = wd; yy += lh; } else line = test; }); c.fillText(line, x, yy); }

  /* ───── hoja de resultado ───── */
  KG.sheet = function (o) {
    var ov = KG.el('div', 'kg-ov'), sp = KG.sports[KG.sport];
    var card = KG.el('div', 'kg-res');
    card.innerHTML = '<div class="kg-res-glow"></div><small class="kg-res-k">' + KG.esc(o.kicker || 'Resultado') + '</small>' +
      '<div class="kg-res-big" id="kg-big">0</div><h2>' + KG.esc(o.title || '') + '</h2>' +
      (o.lines && o.lines.length ? '<ul class="kg-res-l">' + o.lines.map(function (l) { return '<li>' + KG.esc(l) + '</li>'; }).join('') + '</ul>' : '') +
      (o.grid ? '<pre class="kg-res-grid">' + KG.esc(o.grid.join('\n')) + '</pre>' : '') +
      (o.tip ? '<p class="kg-res-tip">' + o.tip + '</p>' : '') +
      '<div class="kg-res-btns"><button class="kg-btn pri" data-a="share" type="button">Compartir</button><button class="kg-btn" data-a="save" type="button">Guardar imagen</button>' + (o.again ? '<button class="kg-btn" data-a="again" type="button">' + (o.againLabel || 'Jugar otra vez') + '</button>' : '') + '</div>' +
      '<a class="kg-res-cta" href="/?utm_source=juegos&utm_medium=resultado&utm_campaign=' + encodeURIComponent(o.game || 'juego') + '"><b>' + KG.esc(o.ctaTitle || 'Lleva esto a tu juego real') + '</b><span>' + KG.esc(o.ctaText || 'Cuerpo técnico de IA, KINET Card y análisis táctico. Gratis para empezar.') + '</span></a>' +
      '<button class="kg-x" type="button" aria-label="Cerrar">✕</button>';
    ov.appendChild(card); document.body.appendChild(ov); requestAnimationFrame(function () { ov.classList.add('in'); });
    var big = KG.$('#kg-big', card), num = parseFloat(o.big);
    if (!isNaN(num) && String(o.big).match(/^[\d.,]+$/)) KG.countTo(big, num, 1100, function (v) { return o.dec ? v.toFixed(o.dec) : Math.round(v); }); else big.textContent = o.big;
    if (o.win !== false) { KG.sfx.win(); var r = card.getBoundingClientRect(); KG.burst(r.left + r.width / 2, r.top + 120, sp.c, 26); }
    function close() { ov.classList.remove('in'); setTimeout(function () { ov.remove(); }, 300); }
    card.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('kg-x')) return close();
      var a = b.dataset.a;
      if (a === 'again') { close(); o.again(); return; }
      var cv = KG.drawCard({ kicker: o.kicker, big: o.shareBig || o.big, title: o.title, lines: o.shareLines || o.lines, grid: o.grid, color: sp.c, rgb: sp.rgb, bigSize: o.bigSize, cta: o.shareCta });
      cv.toBlob(function (blob) {
        var file = null; try { file = new File([blob], 'kinet-' + (o.game || 'juego') + '.png', { type: 'image/png' }); } catch (e) {}
        var text = (o.shareText || o.title) + ' · kinetos.es/juegos';
        if (a === 'share' && navigator.share) {
          var data = { title: 'KINET OS · Juegos', text: text, url: o.shareUrl || (location.origin + '/juegos/') };
          if (file && navigator.canShare && navigator.canShare({ files: [file] })) data.files = [file];
          navigator.share(data).catch(function () {});
        } else {
          if (a === 'share' && navigator.clipboard) { navigator.clipboard.writeText(text + ' ' + (o.shareUrl || '')).then(function () { KG.toast('Texto copiado'); }, function () {}); }
          var u = URL.createObjectURL(blob), l = document.createElement('a'); l.href = u; l.download = 'kinet-' + (o.game || 'juego') + '.png'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
          if (a === 'save') KG.toast('Imagen guardada');
        }
      }, 'image/png');
    });
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
    return { close: close };
  };


  /* ───── datos ficticios (personas, países, clubes) ───── */
  KG.FIRST = ['Mateo','Lucas','Hugo','Leo','Dani','Álex','Nico','Iker','Marc','Pablo','Adrián','Unai','Bruno','Sergio','Joel','Aitor','Rubén','Gael','Ismael','Omar','Lara','Noa','Carla','Mía','Alba','Irene','Sara','Julia','Lola','Aitana','Vera','Nora','Ariadna','Paula','Elsa','Triana'];
  KG.LAST = ['Aldaz','Brizuela','Cardeñosa','Dorrego','Escalona','Farelo','Galindo','Higuera','Ibarlucea','Jarama','Lanuza','Mondéjar','Narbona','Olmedo','Pedrosa','Quintanilla','Rebollo','Sarrión','Tamayo','Ugarte','Vallejo','Yagüe','Zubiaur','Arévalo','Bermejo','Casaus','Dueñas','Elvira','Fresneda','Garrote','Hontoria','Iglesuela','Jaraíz','Lorente','Marugán','Nadal','Orduña','Palomeque','Rosales','Salvatierra'];
  KG.COUNTRIES = ['España','Argentina','Brasil','Francia','Portugal','Italia','Alemania','Países Bajos','México','Colombia','Marruecos','Estados Unidos','Serbia','Croacia','Japón','Nigeria','Senegal','Uruguay'];
  KG.CLUBS = ['Atlético Brisa','CD Albatros','Real Montaña','UD Costa Norte','Racing Delta','Unión Faro','FC Aurora','Sporting Ámbar','CD Cierzo','Athletic Meseta'];
  KG.person = function (rnd) { var f = KG.FIRST[Math.floor(rnd() * KG.FIRST.length)], l = KG.LAST[Math.floor(rnd() * KG.LAST.length)]; return { first: f, last: l, full: f + ' ' + l }; };
  KG.pick = function (arr, rnd) { return arr[Math.floor((rnd || Math.random)() * arr.length)]; };

  /* ───── cabecera de juego: botón de silencio y relleno de fuentes ───── */
  KG.init = function () {
    var host = KG.$('#kg-sports'); if (host) KG.sportBar(host);
    var m = KG.$('#kg-mute');
    if (m) { var paint = function () { m.classList.toggle('off', KG.mute); m.setAttribute('aria-pressed', !KG.mute); }; paint(); m.addEventListener('click', function () { KG.setMute(!KG.mute); paint(); if (!KG.mute) KG.beep(700, .08, 'triangle', .05); }); }
    try { document.fonts && document.fonts.load('900 60px Orbitron'); } catch (e) {}
  };
  if (document.readyState !== 'loading') setTimeout(KG.init, 0); else document.addEventListener('DOMContentLoaded', KG.init);
})();
