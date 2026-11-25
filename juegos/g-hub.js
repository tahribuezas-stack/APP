/* KINET OS · Sala de juegos: carrusel 3D en anillo. Sin registro. */
(function () {
  'use strict';
  var data = JSON.parse(KG.$('#kh-data').textContent), N = data.length, ring = KG.$('#kh-ring'), info = KG.$('#kh-info'), dots = KG.$('#kh-dots'), stage = KG.$('#kh-stage');
  var S = 'stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"';
  var ART = {
    'ojeador-10-segundos': '<rect x="18" y="26" width="64" height="84" rx="8" ' + S + ' opacity=".6"/><circle cx="50" cy="52" r="10" ' + S + ' opacity=".6"/><path d="M32 86c3-12 10-16 18-16s15 4 18 16" ' + S + ' opacity=".6"/><circle cx="78" cy="78" r="24" ' + S + '/><path d="M96 96l16 16" ' + S + ' stroke-width="6"/><path d="M68 78l7 7 12-14" ' + S + '/>',
    'torre-de-niveles': '<path d="M60 100l42-18-42-18-42 18z" ' + S + ' opacity=".5"/><path d="M60 82l42-18-42-18-42 18z" ' + S + ' opacity=".75"/><path d="M60 64l42-18-42-18-42 18z" ' + S + '/><circle cx="60" cy="24" r="8" fill="currentColor" stroke="none"/><path d="M18 100v-18M102 100v-18" ' + S + ' opacity=".4"/>',
    'ficha-secreta': '<rect x="22" y="14" width="76" height="112" rx="9" ' + S + '/><circle cx="60" cy="50" r="13" ' + S + '/><path d="M36 92c3-14 12-20 24-20s21 6 24 20" ' + S + '/><rect x="34" y="104" width="52" height="9" rx="2" fill="currentColor" stroke="none" opacity=".55"/><path d="M90 20l10 10" ' + S + ' stroke-width="5"/>',
    'reflejos': '<path d="M60 20L22 124M60 20L98 124M60 20v104" ' + S + ' opacity=".5"/><circle cx="60" cy="58" r="9" ' + S + '/><circle cx="36" cy="94" r="14" ' + S + '/><circle cx="84" cy="94" r="14" fill="currentColor" stroke="none" opacity=".9"/><path d="M14 116h92" ' + S + ' stroke-width="4"/>',
    'once-con-presupuesto': '<path d="M26 22h68l14 104H12z" ' + S + ' opacity=".55"/><path d="M19 74h82" ' + S + ' opacity=".55"/><circle cx="60" cy="38" r="8" ' + S + '/><circle cx="34" cy="62" r="8" ' + S + '/><circle cx="86" cy="62" r="8" ' + S + '/><circle cx="60" cy="90" r="8" fill="currentColor" stroke="none"/><path d="M60 46v36M42 66l12 20M78 66l-12 20" ' + S + ' opacity=".8"/>',
    'adivina-la-jugada': '<circle cx="30" cy="96" r="9" ' + S + '/><circle cx="64" cy="58" r="9" ' + S + '/><circle cx="96" cy="30" r="9" fill="currentColor" stroke="none"/><path d="M38 90l18-24M72 52l16-16" ' + S + ' stroke-dasharray="3 7"/><circle cx="82" cy="94" r="9" ' + S + ' stroke="#fb7185"/><path d="M76 88l12 12M88 88l-12 12" ' + S + ' stroke="#fb7185"/>',
    'sprint-60': '<ellipse cx="42" cy="46" rx="13" ry="19" transform="rotate(-14 42 46)" ' + S + '/><ellipse cx="38" cy="78" rx="8" ry="10" ' + S + '/><ellipse cx="82" cy="78" rx="13" ry="19" transform="rotate(14 82 78)" fill="currentColor" stroke="none" opacity=".9"/><ellipse cx="86" cy="108" rx="8" ry="10" fill="currentColor" stroke="none" opacity=".9"/><path d="M16 126h88" ' + S + ' opacity=".4"/>'
  };
  var KEY = { 'ojeador-10-segundos': 'ojeo_', 'torre-de-niveles': 'torre_', 'reflejos': 'reflejos_', 'once-con-presupuesto': 'once_', 'adivina-la-jugada': 'jugada_', 'sprint-60': 'sprint_' };
  var UNIT = { 'sprint-60': ' m' };

  var w = innerWidth < 700 ? 188 : 248, step = 360 / N, R = Math.round((w / 2 + 26) / Math.tan(Math.PI / N));
  ring.innerHTML = data.map(function (g, i) {
    return '<a class="kh-c" href="/juegos/' + g.slug + '.html" data-i="' + i + '" style="--w:' + w + 'px;transform:rotateY(' + i * step + 'deg) translateZ(' + R + 'px)" aria-label="' + KG.esc(g.name) + '"><span class="kh-n">' + g.n + '</span><svg viewBox="0 0 120 140" class="kh-art" aria-hidden="true">' + (ART[g.slug] || '') + '</svg><span class="kh-t">' + KG.esc(g.tag) + '</span><b>' + KG.esc(g.name) + '</b><i class="kh-sh"></i></a>';
  }).join('');
  dots.innerHTML = data.map(function (g, i) { return '<button type="button" data-i="' + i + '" aria-label="' + KG.esc(g.name) + '"></button>'; }).join('');
  var cards = KG.$$('.kh-c', ring), rot = 0, target = 0, cur = -1, drag = null, moved = 0;

  function best(g) {
    if (g.slug === 'ficha-secreta') { var s = KG.get('ficha_streak_' + KG.sport, { n: 0, d: 0 }); return s.n && s.d >= KG.day() - 1 ? '🔥 racha de ' + s.n + ' día' + (s.n > 1 ? 's' : '') : null; }
    var v = KG.get(KEY[g.slug] + KG.sport, 0); return v ? (g.slug === 'once-con-presupuesto' ? v.toFixed(1) : v) + (UNIT[g.slug] || '') : null;
  }
  function setInfo(i) {
    if (i === cur) return; cur = i; var g = data[i], b = best(g);
    info.classList.remove('in'); void info.offsetWidth;
    info.innerHTML = '<small class="kg-mono">' + g.n + ' / 0' + N + ' · ' + KG.esc(g.tag) + ' · ' + KG.esc(g.time) + '</small><h2>' + KG.esc(g.name) + '</h2><p>' + KG.esc(g.short) + '</p><div class="kh-act"><a class="kg-btn pri" href="/juegos/' + g.slug + '.html">Jugar ahora</a><span class="kh-rec">' + (b ? 'Tu récord: <b>' + b + '</b>' : 'Aún no has jugado') + '</span></div>';
    info.classList.add('in'); KG.$$('button', dots).forEach(function (d, k) { d.classList.toggle('on', k === i); });
  }
  function frame() {
    requestAnimationFrame(frame);
    if (!drag) rot += (target - rot) * (KG.RM ? 1 : .12); else rot += (target - rot) * .35;
    ring.style.transform = 'translateZ(-' + R + 'px) rotateY(' + (-rot).toFixed(3) + 'deg)';
    var idx = ((Math.round(rot / step) % N) + N) % N; setInfo(idx);
    cards.forEach(function (c, i) { var d = Math.abs((((i * step - rot) % 360) + 540) % 360 - 180); var f = 180 - d; /* 180 = frente */ var k = Math.max(0, 1 - (180 - f) / 110); c.style.opacity = (.28 + .72 * k).toFixed(2); c.classList.toggle('front', Math.abs(180 - f) < step / 2); });
  }
  function go(i) { var k = Math.round(target / step), base = Math.floor(k / N) * N; var cand = [base + i, base + i - N, base + i + N].sort(function (a, b) { return Math.abs(a - k) - Math.abs(b - k); })[0]; target = cand * step; }
  function snap() { target = Math.round(target / step) * step; }

  stage.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, t: target }; moved = 0; });
  addEventListener('pointermove', function (e) { if (!drag) return; var dx = e.clientX - drag.x; moved = Math.max(moved, Math.abs(dx)); target = drag.t - dx / (innerWidth < 700 ? 2.2 : 3.4); });
  addEventListener('pointerup', function () { if (drag) { drag = null; snap(); } });
  ring.addEventListener('click', function (e) { var a = e.target.closest('.kh-c'); if (!a) return; if (moved > 8 || !a.classList.contains('front')) { e.preventDefault(); if (moved <= 8) go(+a.dataset.i); } });
  stage.addEventListener('wheel', function (e) { if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) { e.preventDefault(); target += (e.deltaX || e.deltaY) / 3; clearTimeout(stage._w); stage._w = setTimeout(snap, 120); } }, { passive: false });
  addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { target = Math.round(target / step) * step + step; e.preventDefault(); } else if (e.key === 'ArrowLeft') { target = Math.round(target / step) * step - step; e.preventDefault(); } else if (e.key === 'Enter' && document.activeElement === document.body) { location.href = '/juegos/' + data[cur].slug + '.html'; } });
  dots.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) go(+b.dataset.i); });
  KG.onSport(function () { cur = -1; setInfo(Math.round(target / step) % N < 0 ? 0 : ((Math.round(target / step) % N) + N) % N); });
  /* arranca desplegando el anillo */
  rot = -90; target = 0; frame();
})();
