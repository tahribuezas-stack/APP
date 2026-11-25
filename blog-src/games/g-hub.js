/* KINET OS · Sala de juegos: carrusel lateral (arrastrable, con muelle). Sin registro. */
(function () {
  'use strict';
  var data = JSON.parse(KG.$('#kh-data').textContent), N = data.length, ring = KG.$('#kh-ring'), info = KG.$('#kh-info'), dots = KG.$('#kh-dots'), stage = KG.$('#kh-stage'), play = KG.$('#khgo'), list = KG.$('#kh-list');
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


  var wrapEl = stage.parentNode, cards, pos = -2.6, target = 0, cur = -1, dir = 1, drag = null, moved = 0, last = 0, GAP = 0, CW = 0;
  ring.innerHTML = data.map(function (g, i) {
    return '<a class="kh-c" href="/juegos/' + g.slug + '.html" data-i="' + i + '" draggable="false" aria-label="' + KG.esc(g.name) + '"><span class="kh-n">' + g.n + '</span><svg viewBox="0 0 120 140" class="kh-art" aria-hidden="true">' + (ART[g.slug] || '') + '</svg><span class="kh-t">' + KG.esc(g.tag) + '</span><b>' + KG.esc(g.name) + '</b><i class="kh-sh"></i></a>';
  }).join('');
  dots.innerHTML = data.map(function (g, i) { return '<button type="button" data-i="' + i + '" aria-label="' + KG.esc(g.name) + '"></button>'; }).join('');
  list.innerHTML = data.map(function (g, i) { return '<li><button type="button" data-i="' + i + '"><em>' + g.n + '</em><span>' + KG.esc(g.name) + '</span></button></li>'; }).join('');
  cards = KG.$$('.kh-c', ring);

  function best(g) {
    if (g.slug === 'ficha-secreta') { var s = KG.get('ficha_streak_' + KG.sport, { n: 0, d: 0 }); return s.n && s.d >= KG.day() - 1 ? '🔥 racha de ' + s.n + ' día' + (s.n > 1 ? 's' : '') : null; }
    var v = KG.get(KEY[g.slug] + KG.sport, 0); return v ? (g.slug === 'once-con-presupuesto' ? v.toFixed(1) : v) + (UNIT[g.slug] || '') : null;
  }
  var ARW = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  function setInfo(i) {
    if (i === cur) return; cur = i; var g = data[i], b = best(g);
    info.classList.remove('kin', 'l', 'r'); play.classList.remove('kin'); void info.offsetWidth; info.classList.add(dir > 0 ? 'r' : 'l');
    info.innerHTML = '<small class="kg-mono">' + g.n + ' / 0' + N + ' · ' + KG.esc(g.tag) + ' · ' + KG.esc(g.time) + '</small><h2>' + KG.esc(g.name) + '</h2><p>' + KG.esc(g.short) + '</p><div class="kh-rec">' + (b ? 'Tu récord: <b>' + b + '</b>' : 'Aún no has jugado a este') + '</div>';
    play.innerHTML = '<a class="kh-go" href="/juegos/' + g.slug + '.html"><span>Jugar a ' + KG.esc(g.name) + '</span>' + ARW + '</a>';
    requestAnimationFrame(function () { info.classList.add('kin'); play.classList.add('kin'); });
    KG.$$('button', dots).forEach(function (d, k) { d.classList.toggle('on', k === i); });
    KG.$$('button', list).forEach(function (d, k) { d.classList.toggle('on', k === i); });
  }
  function measure() {
    var sw = stage.clientWidth; CW = Math.min(sw * .56, innerWidth < 700 ? 210 : 232, Math.max(150, (innerHeight - (innerWidth < 1000 ? 440 : 460)) / 1.22)); GAP = Math.min(CW * .74, (sw - CW) / 2.2);
    wrapEl.style.setProperty('--cw', CW + 'px'); wrapEl.style.setProperty('--ch', Math.round(CW * 1.22) + 'px');
  }
  function wrap(d) { return ((d + N / 2) % N + N) % N - N / 2; }
  function paint() {
    var idx = ((Math.round(pos) % N) + N) % N;
    for (var i = 0; i < N; i++) {
      var d = wrap(i - pos), a = Math.abs(d), c = cards[i];
      var x = d * GAP * (a > 1 ? 1 - Math.min(.3, (a - 1) * .12) : 1), sc = 1 - Math.min(a, 2.6) * .13, ry = Math.max(-52, Math.min(52, -d * 30)), z = -Math.min(a, 3) * 110;
      c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,' + z.toFixed(0) + 'px) rotateY(' + ry.toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ')';
      c.style.opacity = Math.max(0, 1 - Math.max(0, a - .6) * .34).toFixed(2); c.style.zIndex = 100 - Math.round(a * 10);
      c.style.visibility = a > 3.2 ? 'hidden' : '';
      c.classList.toggle('front', i === idx && Math.abs(d) < .35);
    }
    setInfo(idx);
  }
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(.1, (now - (last || now)) / 1000); last = now;
    pos += (target - pos) * (KG.RM ? 1 : 1 - Math.exp(-dt * (drag ? 22 : 8.5)));
    if (Math.abs(target - pos) < .0005) pos = target;
    paint();
  }
  function go(i) {   /* camino más corto, con deslizamiento */
    var k = Math.round(target), base = Math.round((k - i) / N) * N + i; dir = base >= k ? 1 : -1; target = base;
  }
  function step(n) { dir = n > 0 ? 1 : -1; target = Math.round(target) + n; }

  stage.addEventListener('dragstart', function (e) { e.preventDefault(); });
  stage.addEventListener('pointerdown', function (e) { if (e.button || (e.target.closest && e.target.closest('.kh-ar'))) return; drag = { x: e.clientX, t: target, px: e.clientX, pt: performance.now(), v: 0 }; moved = 0; stage.classList.add('drag'); });
  addEventListener('pointermove', function (e) {
    if (!drag) return; var dx = e.clientX - drag.x; moved = Math.max(moved, Math.abs(dx));
    if (moved > 5) { target = drag.t - dx / (GAP * .9); var now = performance.now(), dtm = Math.max(8, now - drag.pt); drag.v = drag.v * .6 + (-(e.clientX - drag.px) / (GAP * .9) / dtm) * .4; drag.px = e.clientX; drag.pt = now; dir = dx < 0 ? 1 : -1; }
  }, { passive: true });
  function endDrag() { if (!drag) return; var v = drag.v; drag = null; stage.classList.remove('drag'); if (moved > 5) target = Math.round(target + Math.max(-1.2, Math.min(1.2, v * 110))); setTimeout(function () { moved = 0; }, 30); }
  addEventListener('pointerup', endDrag); addEventListener('pointercancel', endDrag);
  ring.addEventListener('click', function (e) { var a = e.target.closest('.kh-c'); if (!a) return; if (moved > 5) { e.preventDefault(); return; } if (!a.classList.contains('front')) { e.preventDefault(); go(+a.dataset.i); } });
  KG.$('#kh-prev').addEventListener('click', function () { step(-1); }); KG.$('#kh-next').addEventListener('click', function () { step(1); });
  stage.addEventListener('wheel', function (e) { if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) { e.preventDefault(); target += (e.deltaX || e.deltaY) / 260; dir = (e.deltaX || e.deltaY) > 0 ? 1 : -1; clearTimeout(stage._w); stage._w = setTimeout(function () { target = Math.round(target); }, 140); } }, { passive: false });
  addEventListener('keydown', function (e) { if (/INPUT|TEXTAREA|SELECT/.test((e.target.tagName || ''))) return; if (e.key === 'ArrowRight') { step(1); e.preventDefault(); } else if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); } });
  dots.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) go(+b.dataset.i); });
  list.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) go(+b.dataset.i); });
  KG.onSport(function () { cur = -1; setInfo(((Math.round(target) % N) + N) % N); });
  measure(); addEventListener('resize', measure); if ('ResizeObserver' in window) new ResizeObserver(measure).observe(stage);
  paint(); requestAnimationFrame(frame);   /* entra deslizándose desde la izquierda */
})();
