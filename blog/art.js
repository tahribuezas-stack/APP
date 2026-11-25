/* KINET OS · ilustraciones de los planetas, en el estilo de las capas neón de la app:
   cada objeto flota sobre una plataforma isométrica de varias capas (la "pila" de losas con borde luminoso),
   con relleno oscuro tipo cristal, contorno de neón, brillos y animación suave. 2D con efecto 3D.
   API: KBArt.svg(nombre, colorAcento) -> string SVG */
(function () {
  'use strict';
  var PI = Math.PI;
  function f1(n) { return (Math.round(n * 10) / 10).toString(); }
  function hex(c) { c = String(c || '').replace('#', ''); if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]; var n = parseInt(c, 16); if (isNaN(n)) n = 0x00ff88; return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function rgb(a) { return 'rgb(' + (a[0] | 0) + ',' + (a[1] | 0) + ',' + (a[2] | 0) + ')'; }
  function mix(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
  function lt(c, k) { return rgb(mix(hex(c), [255, 255, 255], k)); }
  function dk(c, k) { return rgb(mix(hex(c), [3, 6, 10], k)); }
  var HEAD = '<svg class="art" viewBox="0 0 100 100" aria-hidden="true" focusable="false">';

  /* plataforma isométrica de 3 capas (como el campo de la referencia) */
  function platform(c, id) {
    var top = 'M50 66L90 78 50 90 10 78Z';
    return '<defs><linearGradient id="' + id + 'p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + dk(c, .55) + '"/><stop offset="1" stop-color="' + dk(c, .86) + '"/></linearGradient></defs>' +
      '<g class="a-plat">' +
      '<path d="' + top + '" transform="translate(0 9)" fill="none" stroke="' + c + '" stroke-opacity=".16" stroke-width="1.2" stroke-linejoin="round"/>' +
      '<path d="' + top + '" transform="translate(0 4.5)" fill="' + dk(c, .9) + '" fill-opacity=".7" stroke="' + c + '" stroke-opacity=".34" stroke-width="1.2" stroke-linejoin="round"/>' +
      '<path d="' + top + '" fill="url(#' + id + 'p)" stroke="' + c + '" stroke-opacity=".9" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M50 66L50 90M30 72L70 84M70 72L30 84" stroke="' + c + '" stroke-opacity=".22" stroke-width=".8"/>' +
      '<ellipse cx="50" cy="78" rx="15" ry="5" fill="none" stroke="' + c + '" stroke-opacity=".45" stroke-width="1"/></g>' +
      '<ellipse class="a-hl" cx="50" cy="78" rx="12" ry="3.6" fill="' + c + '" opacity=".35"/>';
  }
  /* envoltorio: objeto flotando sobre la plataforma (el objeto se dibuja en 0..100 y se reduce) */
  function wrap(c, id, obj, cls) {
    return HEAD + platform(c, id) +
      '<path class="a-beam" d="M50 66V74" stroke="' + c + '" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>' +
      '<g class="a-float"><g transform="translate(14.5 1) scale(.71)"' + (cls ? ' class="' + cls + '"' : '') + '>' + obj + '</g></g></svg>';
  }
  function glass(c, id) {   /* relleno oscuro tipo cristal con luz arriba-izquierda */
    return '<linearGradient id="' + id + 'f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + dk(c, .5) + '"/><stop offset=".55" stop-color="' + dk(c, .78) + '"/><stop offset="1" stop-color="' + dk(c, .9) + '"/></linearGradient>';
  }
  function stroke(c, w) { return 'stroke="' + c + '" stroke-width="' + (w || 2.4) + '" stroke-linejoin="round" stroke-linecap="round"'; }
  function rim(w) { return 'stroke="#fff" stroke-opacity=".55" stroke-width="' + (w || 1) + '" fill="none" stroke-linecap="round"'; }

  /* ───── balón ───── */
  function ball(c) {
    var cx = 50, cy = 50, R = 40, i, pat = '';
    function P(a, r) { return [cx + Math.cos(a * PI / 180) * r, cy + Math.sin(a * PI / 180) * r]; }
    function pent(ct, r, rot) { var o = []; for (var k = 0; k < 5; k++) { var a = (rot + 72 * k) * PI / 180; o.push(f1(ct[0] + Math.cos(a) * r) + ',' + f1(ct[1] + Math.sin(a) * r)); } return o.join(' '); }
    var PF = 'fill="url(#bkq)" stroke="' + lt(c, .55) + '" stroke-width="1.4" stroke-linejoin="round"';
    pat += '<polygon points="' + pent([cx, cy], 11.5, -90) + '" ' + PF + '/>';
    for (i = 0; i < 5; i++) {
      var a0 = -90 + 72 * i, V = P(a0, 11.5), M = P(a0, 24);
      pat += '<path d="M' + f1(V[0]) + ' ' + f1(V[1]) + 'L' + f1(M[0]) + ' ' + f1(M[1]) + '" stroke="' + c + '" stroke-opacity=".7" stroke-width="1.5" stroke-linecap="round" fill="none"/>';
      [a0 + 36, a0 - 36].forEach(function (an) { var q = P(an, 31); pat += '<path d="M' + f1(M[0]) + ' ' + f1(M[1]) + 'L' + f1(q[0]) + ' ' + f1(q[1]) + '" stroke="' + c + '" stroke-opacity=".7" stroke-width="1.5" stroke-linecap="round" fill="none"/>'; });
    }
    for (i = 0; i < 5; i++) {
      var an = -90 + 36 + 72 * i, ct = P(an, 43), rot = an + 180;
      pat += '<polygon points="' + pent(ct, 13, rot) + '" ' + PF + '/>';
      [1, 4].forEach(function (ix) { var a2 = (rot + 72 * ix) * PI / 180, vx = ct[0] + Math.cos(a2) * 13, vy = ct[1] + Math.sin(a2) * 13, dx = vx - cx, dy = vy - cy, l = Math.sqrt(dx * dx + dy * dy); pat += '<path d="M' + f1(vx) + ' ' + f1(vy) + 'L' + f1(cx + dx / l * (R + 2)) + ' ' + f1(cy + dy / l * (R + 2)) + '" stroke="' + c + '" stroke-opacity=".7" stroke-width="1.5" stroke-linecap="round" fill="none"/>'; });
    }
    var obj = '<defs><radialGradient id="bkw" cx=".34" cy=".28" r=".95"><stop offset="0" stop-color="' + lt(c, .82) + '"/><stop offset=".5" stop-color="' + lt(c, .5) + '"/><stop offset="1" stop-color="' + dk(c, .35) + '"/></radialGradient>' +
      '<radialGradient id="bkq" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="' + dk(c, .55) + '"/><stop offset="1" stop-color="#04070b"/></radialGradient>' +
      '<radialGradient id="bks" cx=".36" cy=".28" r=".85"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#02050a" stop-opacity=".62"/></radialGradient>' +
      '<clipPath id="bkc"><circle cx="50" cy="50" r="40"/></clipPath></defs>' +
      '<circle cx="50" cy="50" r="40" fill="url(#bkw)"/><g clip-path="url(#bkc)"><g class="a-roll"><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="22s" repeatCount="indefinite"/>' + pat + '</g></g>' +
      '<circle cx="50" cy="50" r="40" fill="url(#bks)"/>' +
      '<ellipse cx="35" cy="26" rx="13" ry="7" fill="#fff" opacity=".55" transform="rotate(-32 35 26)"/>' +
      '<circle cx="50" cy="50" r="40" fill="none" ' + stroke(c, 2.6) + '/>';
    return wrap(c, 'bk', obj);
  }

  /* ───── engranaje ───── */
  function gear(c) {
    var N = 10, pts = [], i, w = 2 * PI / N, bolts = '';
    for (i = 0; i < N; i++) { var a = i * w; [[a + w * .04, 32], [a + w * .17, 43], [a + w * .45, 43], [a + w * .58, 32]].forEach(function (p) { pts.push(f1(50 + Math.cos(p[0]) * p[1]) + ' ' + f1(50 + Math.sin(p[0]) * p[1])); }); }
    var d = 'M' + pts.join('L') + 'Z';
    for (i = 0; i < 6; i++) { var a = i * PI / 3 + .3; bolts += '<circle cx="' + f1(50 + Math.cos(a) * 20.5) + '" cy="' + f1(50 + Math.sin(a) * 20.5) + '" r="2.8" fill="' + c + '" opacity=".95"/>'; }
    var obj = '<defs>' + glass(c, 'gr') + '<radialGradient id="grh" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#02050a"/><stop offset=".85" stop-color="' + dk(c, .8) + '"/><stop offset="1" stop-color="' + c + '"/></radialGradient>' +
      '<linearGradient id="grl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + d + '" transform="translate(0 5)" fill="' + dk(c, .85) + '" stroke="' + c + '" stroke-opacity=".5" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<g class="a-spin"><animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="14s" repeatCount="indefinite"/><path d="' + d + '" fill="url(#grf)" ' + stroke(c, 2.4) + '/>' +
      '<circle cx="50" cy="50" r="27" fill="none" stroke="' + c + '" stroke-opacity=".5" stroke-width="1.2"/><circle cx="50" cy="50" r="13" fill="url(#grh)" ' + stroke(c, 1.8) + '/>' + bolts + '</g>' +
      '<path d="' + d + '" fill="url(#grl)"/>';
    return wrap(c, 'gr', obj);
  }

  /* ───── mancuerna ───── */
  function dumbbell(c) {
    function plate(x, y, w, h, hot) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="3.2" fill="' + (hot ? 'url(#dbh)' : 'url(#dbf)') + '" ' + stroke(hot ? lt(c, .35) : c, 2) + '/><rect x="' + (x + 1.4) + '" y="' + (y + 1.6) + '" width="' + (w - 2.8) + '" height="2.6" rx="1.3" fill="#fff" opacity=".35"/>'; }
    var obj = '<defs>' + glass(c, 'db') + '<linearGradient id="dbh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + lt(c, .35) + '"/><stop offset="1" stop-color="' + dk(c, .45) + '"/></linearGradient>' +
      '<linearGradient id="dbb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3f7fb"/><stop offset=".5" stop-color="#9fb0c4"/><stop offset="1" stop-color="#3b4658"/></linearGradient></defs>' +
      '<g class="a-lift"><g transform="rotate(-28 50 50)">' +
      '<rect x="12" y="45" width="76" height="10" rx="4.5" fill="url(#dbb)" ' + stroke('#dbe6f2', 1.2) + '/>' +
      plate(16, 22, 9, 56) + plate(25, 28, 8, 44, true) + plate(33, 34, 5, 32) + plate(75, 22, 9, 56) + plate(67, 28, 8, 44, true) + plate(62, 34, 5, 32) +
      '<circle cx="50" cy="50" r="1.6" fill="' + c + '"/></g></g>';
    return wrap(c, 'db', obj);
  }

  /* ───── corazón ───── */
  function heart(c) {
    var H = 'M50 90C20 68 6 50 6 32 6 17 18 7 31 7 40 7 47 12 50 21 53 12 60 7 69 7 82 7 94 17 94 32 94 50 80 68 50 90Z';
    var obj = '<defs><radialGradient id="htf" cx=".34" cy=".26" r="1"><stop offset="0" stop-color="' + lt(c, .1) + '" stop-opacity=".95"/><stop offset=".45" stop-color="' + dk(c, .35) + '"/><stop offset="1" stop-color="' + dk(c, .85) + '"/></radialGradient></defs>' +
      '<g class="a-beat"><path d="' + H + '" transform="translate(0 5)" fill="' + dk(c, .85) + '" stroke="' + c + '" stroke-opacity=".5" stroke-width="1.6"/>' +
      '<path d="' + H + '" fill="url(#htf)" ' + stroke(lt(c, .25), 2.6) + '/>' +
      '<path d="M17 28C16 20 22 14 30 14c5 0 9 3 11 7-6-2-12-1-17 3-3 2-5 4-7 4Z" fill="#fff" opacity=".5"/>' +
      '<path class="a-ecg" d="M14 50H34L40 36 48 66 55 44 60 50H86" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M14 50H34L40 36 48 66 55 44 60 50H86" fill="none" stroke="' + c + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" opacity=".28"/></g>';
    return wrap(c, 'ht', obj);
  }

  /* ───── trofeo ───── */
  function trophy(c) {
    var cup = 'M24 8H76C76 36 69 52 50 57 31 52 24 36 24 8Z', gold = '#ffd84d';
    var obj = '<defs><linearGradient id="trg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + dk(c, .5) + '"/><stop offset=".3" stop-color="' + lt(c, .1) + '"/><stop offset=".5" stop-color="' + lt(c, .6) + '"/><stop offset=".75" stop-color="' + c + '"/><stop offset="1" stop-color="' + dk(c, .6) + '"/></linearGradient>' +
      '<linearGradient id="trb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + dk(c, .45) + '"/><stop offset="1" stop-color="' + dk(c, .85) + '"/></linearGradient>' +
      '<clipPath id="trc"><path d="' + cup + '"/></clipPath></defs>' +
      '<path d="M25 16C4 14 5 42 31 46" fill="none" ' + stroke(lt(c, .2), 4.4) + '/><path d="M75 16C96 14 95 42 69 46" fill="none" ' + stroke(lt(c, .2), 4.4) + '/>' +
      '<path d="M25 16C4 14 5 42 31 46" fill="none" stroke="#05070b" stroke-opacity=".55" stroke-width="1.6"/><path d="M75 16C96 14 95 42 69 46" fill="none" stroke="#05070b" stroke-opacity=".55" stroke-width="1.6"/>' +
      '<path d="M43 56H57L59 70H41Z" fill="url(#trg)" ' + stroke(lt(c, .3), 1.6) + '/>' +
      '<rect x="35" y="69" width="30" height="7" rx="3" fill="url(#trg)" ' + stroke(lt(c, .3), 1.6) + '/>' +
      '<rect x="26" y="76" width="48" height="14" rx="3.5" fill="url(#trb)" ' + stroke(c, 2) + '/><rect x="28" y="77.6" width="44" height="3" rx="1.5" fill="#fff" opacity=".3"/><rect x="40" y="82" width="20" height="4" rx="1.5" fill="' + c + '" opacity=".6"/>' +
      '<path d="' + cup + '" fill="url(#trg)" ' + stroke(lt(c, .45), 2.2) + '/>' +
      '<ellipse cx="50" cy="8" rx="26" ry="4.6" fill="' + dk(c, .8) + '" ' + stroke(lt(c, .4), 1.6) + '/>' +
      '<polygon points="50,19 53.2,27 61.5,27.7 55.2,33.2 57.2,41.4 50,37 42.8,41.4 44.8,33.2 38.5,27.7 46.8,27" fill="#fff8d6" stroke="' + gold + '" stroke-width="1.2" stroke-linejoin="round"/>' +
      '<path d="M30 14C30 34 34 46 44 52" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2.6" stroke-linecap="round"/>' +
      '<g clip-path="url(#trc)"><rect class="a-shine" x="-24" y="0" width="12" height="70" fill="#fff" opacity=".55"/></g>';
    return wrap(c, 'tr', obj);
  }

  /* ───── calculadora ───── */
  function calc(c) {
    var keys = '', r, q, i = 0;
    for (r = 0; r < 4; r++) for (q = 0; q < 3; q++) {
      var hot = q === 2 || (r === 3 && q === 1);
      keys += '<g class="a-k" style="--kd:' + (i * .2).toFixed(2) + 's"><rect x="' + f1(27 + q * 15.4) + '" y="' + f1(43 + r * 12.2) + '" width="13" height="10" rx="3" fill="' + (hot ? 'url(#cah)' : 'url(#caf)') + '" ' + stroke(hot ? lt(c, .4) : c, 1.4) + '/><rect x="' + f1(28.4 + q * 15.4) + '" y="' + f1(44.2 + r * 12.2) + '" width="10.2" height="2.2" rx="1.1" fill="#fff" opacity=".35"/></g>'; i++;
    }
    var obj = '<defs>' + glass(c, 'ca') + '<linearGradient id="cah" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + lt(c, .5) + '"/><stop offset="1" stop-color="' + dk(c, .2) + '"/></linearGradient>' +
      '<linearGradient id="cas" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + dk(c, .8) + '"/><stop offset="1" stop-color="' + dk(c, .55) + '"/></linearGradient></defs>' +
      '<rect x="21" y="6" width="58" height="88" rx="10" transform="translate(0 5)" fill="' + dk(c, .85) + '" stroke="' + c + '" stroke-opacity=".5" stroke-width="1.6"/>' +
      '<rect x="21" y="6" width="58" height="88" rx="10" fill="url(#caf)" ' + stroke(c, 2.4) + '/>' +
      '<path d="M26 8H70C76 8 79 11 79 17V30C60 24 40 22 21 28V17C21 11 24 8 26 8Z" fill="#fff" opacity=".1"/>' +
      '<rect x="27" y="13" width="46" height="22" rx="4.5" fill="url(#cas)" ' + stroke(c, 1.6) + '/>' +
      '<text x="68" y="30.5" text-anchor="end" font-family="JetBrains Mono,ui-monospace,monospace" font-weight="700" font-size="14" fill="' + lt(c, .6) + '">100</text><rect class="a-cur" x="69.2" y="19.6" width="2" height="11" fill="' + lt(c, .6) + '"/>' + keys;
    return wrap(c, 'ca', obj);
  }

  /* ───── raqueta ───── */
  function racket(c) {
    var st = '', k, tape = '';
    for (k = -4; k <= 4; k++) st += '<path d="M' + (50 + k * 4.4) + ' 10V62" stroke="' + c + '" stroke-opacity=".55" stroke-width=".9"/>';
    for (k = -5; k <= 5; k++) st += '<path d="M26 ' + (36 + k * 4.6) + 'H74" stroke="' + c + '" stroke-opacity=".55" stroke-width=".9"/>';
    for (k = 0; k < 5; k++) tape += '<path d="M44 ' + (72 + k * 4.6) + 'L56 ' + (68 + k * 4.6) + '" stroke="' + c + '" stroke-opacity=".7" stroke-width="1.4"/>';
    var obj = '<defs>' + glass(c, 'rk') + '<clipPath id="rkc"><ellipse cx="50" cy="36" rx="22" ry="26"/></clipPath></defs>' +
      '<g class="a-swing"><g transform="rotate(-36 50 56)">' +
      '<ellipse cx="50" cy="41" rx="22" ry="26" fill="none" stroke="' + c + '" stroke-opacity=".4" stroke-width="2"/>' +
      '<ellipse cx="50" cy="36" rx="22" ry="26" fill="' + c + '" fill-opacity=".1"/><g clip-path="url(#rkc)">' + st + '</g>' +
      '<ellipse cx="50" cy="36" rx="22" ry="26" fill="none" ' + stroke(lt(c, .25), 4.4) + '/><ellipse cx="50" cy="36" rx="19.6" ry="23.6" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width=".9"/>' +
      '<path d="M31 22C35 14 43 10 50 10" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".85"/>' +
      '<path d="M39 59L50 69 61 59" fill="none" ' + stroke(lt(c, .25), 3.6) + '/>' +
      '<rect x="45" y="67" width="10" height="27" rx="3.2" fill="url(#rkf)" ' + stroke(c, 2) + '/>' + tape +
      '<rect x="43.5" y="91" width="13" height="5" rx="2.2" fill="' + dk(c, .5) + '" ' + stroke(c, 1.4) + '/></g></g>';
    return wrap(c, 'rk', obj);
  }

  /* ───── mando ───── */
  function joystick(c) {
    var obj = '<defs>' + glass(c, 'jy') + '<radialGradient id="jyb" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="' + lt(c, .7) + '"/><stop offset=".5" stop-color="' + c + '"/><stop offset="1" stop-color="' + dk(c, .5) + '"/></radialGradient></defs>' +
      '<path d="M12 74L28 62H72L88 74V84C88 88 85 90 80 90H20C15 90 12 88 12 84Z" transform="translate(0 4)" fill="' + dk(c, .85) + '" stroke="' + c + '" stroke-opacity=".5" stroke-width="1.6"/>' +
      '<path d="M12 74L28 62H72L88 74V84C88 88 85 90 80 90H20C15 90 12 88 12 84Z" fill="url(#jyf)" ' + stroke(c, 2.4) + '/>' +
      '<path d="M18 74L30 65H70" fill="none" ' + rim(1.2) + '/>' +
      '<circle cx="35" cy="77" r="3.2" fill="' + c + '" opacity=".9"/><circle cx="65" cy="77" r="3.2" fill="url(#jyb)"/><circle cx="76" cy="72" r="2.8" fill="' + lt(c, .5) + '"/>' +
      '<g class="a-stick"><path d="M50 66V30" stroke="' + dk(c, .3) + '" stroke-width="7" stroke-linecap="round"/><path d="M50 66V30" stroke="' + c + '" stroke-width="2" stroke-linecap="round" opacity=".7"/>' +
      '<circle cx="50" cy="24" r="14" fill="url(#jyb)" ' + stroke(lt(c, .3), 1.8) + '/><ellipse cx="45" cy="18" rx="5" ry="3" fill="#fff" opacity=".5"/></g>';
    return wrap(c, 'jy', obj);
  }

  var MAP = { ball: ball, gear: gear, dumbbell: dumbbell, heart: heart, trophy: trophy, calc: calc, racket: racket, joystick: joystick };
  window.KBArt = { svg: function (name, c) { return (MAP[name] || calc)(c || '#22D3EE'); } };
})();
