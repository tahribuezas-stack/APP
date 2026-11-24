/* KINET OS · Medidor de uso de IA
 * - Tarjeta limpia en la barra lateral de toda la app (anillo + barras que se vacían a medida que gastas consultas)
 * - Franja en el chat del Cuerpo Técnico (encima de la caja de texto)
 * - Panel de detalle (clic en cualquiera de los dos): potente / básico, asistentes, imágenes, vídeo y cuenta atrás hasta las 00:00 h
 * Lee los contadores de KinetAPIs.getQuotaStatus() y se refresca solo (evento "kinet:usage", sincronización con la nube, pestaña visible).
 * Respeta prefers-reduced-motion. No bloquea nada: si falta el motor de IA o es invitado, no se muestra. */
(function () {
  'use strict';
  if (window.__kxUsage) return; window.__kxUsage = true;

  var CSS = '' +
  '.kx-us-card{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:11px;width:100%;padding:10px 12px;border-radius:14px;cursor:pointer;position:relative;overflow:hidden;' +
    'background:linear-gradient(135deg,rgba(var(--role-rgb,0,255,136),.10),rgba(8,11,16,.92) 62%);border:1px solid rgba(var(--role-rgb,0,255,136),.32);' +
    'transition:transform .35s cubic-bezier(.2,.8,.2,1),border-color .3s,box-shadow .35s;animation:kxUsIn .7s cubic-bezier(.2,.8,.2,1) both}' +
  '.kx-us-card:hover{transform:translateY(-1px);border-color:rgba(var(--role-rgb,0,255,136),.7);box-shadow:0 0 22px rgba(var(--role-rgb,0,255,136),.2)}' +
  '.kx-us-card:focus-visible,.kx-us-strip:focus-visible{outline:2px solid var(--role-color,#00FF88);outline-offset:2px}' +
  '.kx-us-card::after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.07) 50%,transparent 60%);transform:translateX(-120%);animation:kxUsShine 6.5s ease-in-out 1.2s infinite;pointer-events:none}' +
  '.kx-us-ring{position:relative;width:44px;height:44px;flex:0 0 44px}' +
  '.kx-us-ring svg{width:44px;height:44px;transform:rotate(-90deg);overflow:visible}' +
  '.kx-us-ring circle{fill:none;stroke-width:4;stroke-linecap:round}' +
  '.kx-us-ring .trk{stroke:rgba(255,255,255,.09)}' +
  '.kx-us-ring .val{stroke:var(--kx-us-c,var(--role-color,#00FF88));filter:drop-shadow(0 0 4px var(--kx-us-c,var(--role-color,#00FF88)));transition:stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1),stroke .4s}' +
  '.kx-us-ring b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:800 .8rem/1 "JetBrains Mono",ui-monospace,monospace;color:#fff}' +
  '.kx-us-info{min-width:0;flex:1;display:flex;flex-direction:column;gap:4px}' +
  '.kx-us-t{font:800 .56rem/1 "JetBrains Mono",ui-monospace,monospace;letter-spacing:.12em;color:var(--kx-us-c,var(--role-color,#00FF88));text-transform:uppercase}' +
  '.kx-us-sub{font:600 .7rem/1.25 Inter,system-ui,sans-serif;color:#CBD5E1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '.kx-us-bars{display:flex;gap:4px;height:4px}' +
  '.kx-us-bars span{position:relative;display:block;height:100%;border-radius:4px;background:rgba(255,255,255,.09);overflow:hidden}' +
  '.kx-us-bars i,.kx-us-seg i,.kx-us-row .bar i{display:block;height:100%;width:0;border-radius:inherit;background:var(--kx-us-c,var(--role-color,#00FF88));box-shadow:0 0 8px var(--kx-us-c,var(--role-color,#00FF88));transition:width 1.1s cubic-bezier(.2,.8,.2,1),background .4s}' +
  '.kx-us-chev{font-size:1rem;color:rgba(255,255,255,.4);transition:transform .3s,color .3s}.kx-us-card:hover .kx-us-chev{transform:translateX(3px);color:var(--role-color,#00FF88)}' +
  '.kx-us-hero.low{--kx-us-c:#F59E0B}.kx-us-hero.out{--kx-us-c:#EF4444}' +
  '.kx-us-card.low{--kx-us-c:#F59E0B}.kx-us-card.out{--kx-us-c:#EF4444;animation:kxUsIn .7s cubic-bezier(.2,.8,.2,1) both,kxUsPulse 2.4s ease-in-out infinite}' +
  /* franja del chat */
  '.kx-us-strip{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:10px;width:100%;padding:7px 14px;cursor:pointer;border-top:1px solid rgba(var(--role-rgb,0,255,136),.14);background:rgba(8,11,16,.55);' +
    'font:700 .6rem/1 "JetBrains Mono",ui-monospace,monospace;color:#94A3B8;letter-spacing:.06em;animation:kxUsRise .6s cubic-bezier(.2,.8,.2,1) both;transition:background .3s}' +
  '.kx-us-strip:hover{background:rgba(var(--role-rgb,0,255,136),.07)}' +
  '.kx-us-strip .lbl{color:var(--kx-us-c,var(--role-color,#00FF88));letter-spacing:.14em;white-space:nowrap}' +
  '.kx-us-seg{flex:1;display:flex;gap:3px;height:5px;min-width:60px}' +
  '.kx-us-seg span{display:block;height:100%;border-radius:5px;background:rgba(255,255,255,.09);overflow:hidden}' +
  '.kx-us-strip .num{color:#E2E8F0;white-space:nowrap}.kx-us-strip .num b{color:#fff}' +
  '.kx-us-chip{padding:4px 8px;border-radius:999px;border:1px solid rgba(var(--role-rgb,0,255,136),.35);color:var(--role-color,#00FF88);background:rgba(var(--role-rgb,0,255,136),.08);white-space:nowrap;font-size:.54rem;letter-spacing:.08em;animation:kxUsPop .45s cubic-bezier(.2,.8,.2,1) both}' +
  '.kx-us-chip.warn{color:#F59E0B;border-color:rgba(245,158,11,.45);background:rgba(245,158,11,.1)}.kx-us-chip.bad{color:#FCA5A5;border-color:rgba(239,68,68,.5);background:rgba(239,68,68,.1)}' +
  '.kx-us-strip.low{--kx-us-c:#F59E0B}.kx-us-strip.out{--kx-us-c:#EF4444}' +
  /* panel */
  '.kx-us-ov{position:fixed;inset:0;z-index:99990;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(2,4,8,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);opacity:0;pointer-events:none;transition:opacity .3s}' +
  '.kx-us-ov.open{opacity:1;pointer-events:auto}' +
  '.kx-us-box{width:min(440px,100%);max-height:92vh;overflow:auto;border-radius:20px;padding:20px 20px 16px;background:linear-gradient(160deg,rgba(var(--role-rgb,0,255,136),.10),rgba(8,11,16,.98) 46%);border:1px solid rgba(var(--role-rgb,0,255,136),.45);box-shadow:0 0 50px rgba(var(--role-rgb,0,255,136),.18),0 20px 60px rgba(0,0,0,.6);' +
    'transform:translateY(16px) scale(.96);opacity:0;transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .35s}' +
  '.kx-us-ov.open .kx-us-box{transform:none;opacity:1}' +
  '.kx-us-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}' +
  '.kx-us-head h3{margin:0;font:900 .84rem/1.1 Orbitron,"JetBrains Mono",sans-serif;letter-spacing:.08em;color:#fff}' +
  '.kx-us-head .plan{font:800 .56rem/1 "JetBrains Mono",monospace;letter-spacing:.1em;color:var(--role-color,#00FF88);border:1px solid rgba(var(--role-rgb,0,255,136),.4);border-radius:999px;padding:4px 9px}' +
  '.kx-us-x{all:unset;cursor:pointer;color:#94A3B8;font-size:1.1rem;padding:2px 6px;border-radius:8px}.kx-us-x:hover{color:#fff;background:rgba(255,255,255,.08)}' +
  '.kx-us-hero{display:flex;align-items:center;gap:16px;margin-bottom:14px;padding:14px;border-radius:16px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07)}' +
  '.kx-us-hero .kx-us-ring{width:84px;height:84px;flex-basis:84px}.kx-us-hero .kx-us-ring svg{width:84px;height:84px}.kx-us-hero .kx-us-ring circle{stroke-width:5}.kx-us-hero .kx-us-ring b{font-size:1.5rem}' +
  '.kx-us-hero .txt{min-width:0}.kx-us-hero .big{font:800 1rem/1.2 Inter,system-ui,sans-serif;color:#fff}.kx-us-hero .sm{font:500 .76rem/1.4 Inter,system-ui,sans-serif;color:#94A3B8;margin-top:3px}' +
  '.kx-us-rows{display:flex;flex-direction:column;gap:11px}' +
  '.kx-us-row{opacity:0;transform:translateY(8px);animation:kxUsRise .5s cubic-bezier(.2,.8,.2,1) forwards}' +
  '.kx-us-row .top{display:flex;justify-content:space-between;gap:8px;font:600 .74rem/1.2 Inter,system-ui,sans-serif;color:#E2E8F0;margin-bottom:5px}' +
  '.kx-us-row .top em{font-style:normal;font:700 .66rem/1.2 "JetBrains Mono",monospace;color:#94A3B8}.kx-us-row .top em b{color:#fff}' +
  '.kx-us-row .bar{height:5px;border-radius:5px;background:rgba(255,255,255,.09);overflow:hidden}' +
  '.kx-us-row.low{--kx-us-c:#F59E0B}.kx-us-row.out{--kx-us-c:#EF4444}' +
  '.kx-us-note{margin-top:14px;padding:10px 12px;border-radius:12px;font:500 .72rem/1.5 Inter,system-ui,sans-serif;color:#94A3B8;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06)}.kx-us-note strong{color:#E2E8F0}' +
  '.kx-us-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px;flex-wrap:wrap}' +
  '.kx-us-clock{font:700 .66rem/1.3 "JetBrains Mono",monospace;color:#94A3B8}.kx-us-clock b{color:#fff;letter-spacing:.06em}' +
  '.kx-us-cta{display:inline-flex;align-items:center;gap:6px;padding:9px 14px;border-radius:12px;text-decoration:none;font:900 .66rem/1 Orbitron,"JetBrains Mono",sans-serif;letter-spacing:.06em;color:#04060A;background:var(--role-gradient,var(--role-color,#00FF88));transition:transform .25s,box-shadow .25s}' +
  '.kx-us-cta:hover{transform:translateY(-1px);box-shadow:0 0 18px rgba(var(--role-rgb,0,255,136),.5)}' +
  '@keyframes kxUsIn{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}' +
  '@keyframes kxUsRise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
  '@keyframes kxUsPop{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:none}}' +
  '@keyframes kxUsShine{0%,70%{transform:translateX(-120%)}100%{transform:translateX(120%)}}' +
  '@keyframes kxUsPulse{0%,100%{box-shadow:0 0 0 rgba(239,68,68,0)}50%{box-shadow:0 0 18px rgba(239,68,68,.35)}}' +
  '@media (max-width:640px){.kx-us-strip{padding:7px 10px;gap:8px}.kx-us-strip .lbl{display:none}.kx-us-hero{flex-direction:column;text-align:center}}' +
  '@media (prefers-reduced-motion:reduce){.kx-us-card,.kx-us-strip,.kx-us-row,.kx-us-chip,.kx-us-box{animation:none!important;transition:none!important;opacity:1;transform:none}.kx-us-card::after{display:none}.kx-us-ring .val,.kx-us-bars i,.kx-us-seg i,.kx-us-row .bar i{transition:none!important}}';

  var cards = [], strips = [], panel = null, clockT = null, lastTotal = {}, built = false;

  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function reduce() { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function isGuest() {
    try { if (window.KinetBackend && KinetBackend.isGuest && KinetBackend.isGuest()) return true; } catch (e) {}
    return ls('kinet_is_guest') === 'true' || ls('kinet_logged_in') !== 'true';
  }
  function getQ() { try { return (window.KinetAPIs && KinetAPIs.getQuotaStatus) ? KinetAPIs.getQuotaStatus() : null; } catch (e) { return null; } }
  function frac(rem, lim) { return lim > 0 ? Math.max(0, Math.min(1, rem / lim)) : 0; }
  function state(rem, lim) { return rem <= 0 ? 'out' : (lim > 0 && rem / lim <= 0.2) ? 'low' : ''; }
  function setState(el, st) { el.classList.remove('low', 'out'); if (st) el.classList.add(st); }
  function planName(t) { return t === 'club' ? 'CLUB & SCOUT' : t === 'pro' ? 'PRO PLAYER' : 'GRATIS'; }

  function countTo(el, to, key) {
    var from = lastTotal[key] == null ? 0 : lastTotal[key]; lastTotal[key] = to;
    if (reduce() || from === to) { el.textContent = to; return; }
    var t0 = performance.now(), d = 650;
    (function step(t) { var k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); })(t0);
  }
  var C = 2 * Math.PI * 18;   // circunferencia del anillo pequeño (r = 18 en un viewBox de 44)

  function ringHTML() { return '<div class="kx-us-ring"><svg viewBox="0 0 44 44"><circle class="trk" cx="22" cy="22" r="18"/><circle class="val" cx="22" cy="22" r="18" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + C.toFixed(2) + '"/></svg><b data-n>0</b></div>'; }
  function setRing(root, f) { var v = root.querySelector('.val'); if (v) requestAnimationFrame(function () { requestAnimationFrame(function () { v.style.strokeDashoffset = (C * (1 - f)).toFixed(2); }); }); }

  /* ---------- datos derivados ---------- */
  function model(q) {
    var total = q.chatLimit, rem = q.chatRemaining, sl = q.strongLimit || 0, sr = Math.min(q.strongRemaining || 0, rem);
    var bl = Math.max(0, total - sl), br = Math.max(0, rem - sr);
    return { total: total, rem: rem, sl: sl, sr: sr, bl: bl, br: br, st: state(rem, total), engine: q.engine };
  }

  /* ---------- tarjeta de la barra lateral ---------- */
  function buildCard() {
    var host = document.querySelector('.sidebar-bottom-section');
    if (!host || host.querySelector('.kx-us-card')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'kx-us-card'; b.setAttribute('aria-label', 'Ver mi uso de IA');
    b.innerHTML = ringHTML() + '<div class="kx-us-info"><div class="kx-us-t">Uso de IA · hoy</div><div class="kx-us-sub" data-sub>—</div><div class="kx-us-bars"><span data-s1><i></i></span><span data-s2><i></i></span></div></div><span class="kx-us-chev">›</span>';
    b.addEventListener('click', openPanel);
    host.insertBefore(b, host.firstChild); cards.push(b);
  }
  function paintCard(b, q) {
    if (q.isStaff) {
      b.classList.remove('low', 'out'); b.querySelector('[data-n]').textContent = '∞'; b.querySelector('[data-sub]').textContent = 'Equipo KINET · sin límite';
      b.querySelector('[data-s1]').style.display = b.querySelector('[data-s2]').style.display = 'none'; setRing(b, 1); return;
    }
    var m = model(q); setState(b, m.st);
    countTo(b.querySelector('[data-n]'), m.rem, 'card');
    var sub = m.sl > 0 ? (m.sr + ' potentes · ' + m.br + ' básicas') : (m.rem + ' de ' + m.total + ' consultas');
    if (m.rem <= 0) sub = 'Agotado · vuelve a las 00:00';
    b.querySelector('[data-sub]').textContent = sub;
    setRing(b, frac(m.rem, m.total));
    var s1 = b.querySelector('[data-s1]'), s2 = b.querySelector('[data-s2]');
    s1.style.display = m.sl > 0 ? '' : 'none'; s1.style.flex = String(Math.max(1, m.sl)); s2.style.flex = String(Math.max(1, m.bl));
    s1.firstChild.style.width = (frac(m.sr, m.sl) * 100) + '%'; s2.firstChild.style.width = (frac(m.br, m.bl) * 100) + '%';
  }

  /* ---------- franja del chat ---------- */
  function buildStrip() {
    var bar = document.querySelector('.chat-input-bar');
    if (!bar || document.querySelector('.kx-us-strip')) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'kx-us-strip'; b.setAttribute('aria-label', 'Ver el detalle de mi uso de IA');
    b.innerHTML = '<span class="lbl">IA HOY</span><div class="kx-us-seg"><span data-s1><i></i></span><span data-s2><i></i></span></div><span class="num"><b data-n>0</b> / <span data-t>0</span></span><span class="kx-us-chip" data-chip style="display:none"></span>';
    b.addEventListener('click', openPanel);
    bar.parentNode.insertBefore(b, bar); strips.push(b);
  }
  function paintStrip(b, q) {
    var chip = b.querySelector('[data-chip]');
    if (q.isStaff) { b.querySelector('[data-n]').textContent = '∞'; b.querySelector('[data-t]').textContent = '∞'; chip.style.display = ''; chip.className = 'kx-us-chip'; chip.textContent = 'EQUIPO'; return; }
    var m = model(q); setState(b, m.st);
    countTo(b.querySelector('[data-n]'), m.rem, 'strip'); b.querySelector('[data-t]').textContent = m.total;
    var s1 = b.querySelector('[data-s1]'), s2 = b.querySelector('[data-s2]');
    s1.style.display = m.sl > 0 ? '' : 'none'; s1.style.flex = String(Math.max(1, m.sl)); s2.style.flex = String(Math.max(1, m.bl));
    s1.firstChild.style.width = (frac(m.sr, m.sl) * 100) + '%'; s2.firstChild.style.width = (frac(m.br, m.bl) * 100) + '%';
    var txt = '', cls = 'kx-us-chip';
    if (m.rem <= 0) { txt = 'AGOTADO · 00:00 H'; cls += ' bad'; }
    else if (m.sl > 0 && m.sr <= 0) { txt = 'MOTOR BÁSICO'; cls += ' warn'; }
    else if (m.rem <= 3) { txt = 'TE QUEDAN ' + m.rem; cls += ' warn'; }
    else if (m.sl > 0) { txt = m.sr + ' POTENTES'; }
    if (chip.getAttribute('data-k') !== txt) { chip.setAttribute('data-k', txt); chip.className = cls; chip.textContent = txt; chip.style.display = txt ? '' : 'none'; chip.style.animation = 'none'; void chip.offsetWidth; chip.style.animation = ''; }
  }

  /* ---------- panel ---------- */
  function buildPanel() {
    if (panel) return panel;
    var ov = document.createElement('div'); ov.className = 'kx-us-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Mi uso de IA');
    ov.innerHTML = '<div class="kx-us-box"><div class="kx-us-head"><h3>TU USO DE IA</h3><div style="display:flex;gap:8px;align-items:center"><span class="plan" data-plan></span><button type="button" class="kx-us-x" aria-label="Cerrar">✕</button></div></div>' +
      '<div class="kx-us-hero">' + ringHTML() + '<div class="txt"><div class="big" data-big></div><div class="sm" data-sm></div></div></div>' +
      '<div class="kx-us-rows" data-rows></div><div class="kx-us-note" data-note></div>' +
      '<div class="kx-us-foot"><div class="kx-us-clock">Se renueva a las <b>00:00 h</b> · faltan <b data-clock>--:--:--</b></div><a class="kx-us-cta" data-cta href="despacho.html?tab=subscription" style="display:none"></a></div></div>';
    document.body.appendChild(ov); panel = ov;
    ov.addEventListener('click', function (e) { if (e.target === ov) closePanel(); });
    ov.querySelector('.kx-us-x').addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov.classList.contains('open')) closePanel(); });
    return ov;
  }
  function row(label, rem, lim, unit, i) {
    var st = state(rem, lim);
    return '<div class="kx-us-row ' + st + '" style="animation-delay:' + (120 + i * 70) + 'ms"><div class="top"><span>' + esc(label) + '</span><em><b>' + rem + '</b> de ' + lim + (unit ? ' ' + unit : '') + '</em></div><div class="bar"><i data-w="' + (frac(rem, lim) * 100).toFixed(1) + '"></i></div></div>';
  }
  function paintPanel(q) {
    var p = buildPanel(), tier = q.tier;
    p.querySelector('[data-plan]').textContent = planName(tier);
    var rows = p.querySelector('[data-rows]'), note = p.querySelector('[data-note]'), cta = p.querySelector('[data-cta]');
    if (q.isStaff) {
      p.querySelector('[data-n]').textContent = '∞'; p.querySelector('[data-big]').textContent = 'Equipo KINET · sin límite'; p.querySelector('[data-sm]').textContent = 'Tu cuenta de equipo no tiene tope; el uso queda registrado.';
      rows.innerHTML = ''; note.style.display = 'none'; cta.style.display = 'none'; setRing(p, 1); return;
    }
    note.style.display = '';
    var m = model(q), list = [], i = 0;
    if (m.sl > 0) list.push(row('Chat · motor potente', m.sr, m.sl, '', i++));
    list.push(row(m.sl > 0 ? 'Chat · motor básico (al agotar el potente)' : 'Chat · motor básico', m.br, m.bl, '', i++));
    list.push(row('Asistente de soporte', Math.max(0, q.supportLimit - q.supportUsed), q.supportLimit, '', i++));
    list.push(row('Asistente de la comunidad', q.communityBotRemaining, q.communityBotLimit, '', i++));
    list.push(row('Pizarra táctica IA', Math.max(0, q.tacticalLimit - q.tacticalUsed), q.tacticalLimit, '', i++));
    if (q.imageLimit > 0) list.push(row('Imágenes IA', q.imageRemaining, q.imageLimit, '', i++));
    if (q.videoTotal > 0) list.push(row('Vídeo IA (plan + bonos)', Math.round(q.videoRemaining), Math.round(q.videoTotal), 'min', i++));
    rows.innerHTML = list.join('');
    var big = m.rem <= 0 ? 'Has agotado las consultas de hoy' : m.rem + (m.rem === 1 ? ' consulta disponible hoy' : ' consultas disponibles hoy');
    var sm = m.sl > 0 ? (m.sr > 0 ? 'Ahora responde el motor potente. Cuando se agote seguirás con el básico hasta tus ' + m.total + ' diarias.' : (m.rem > 0 ? 'Ya has gastado el motor potente de hoy: sigues con el básico, más breve y rápido.' : 'Tu cupo se renueva a las 00:00 h.')) : (m.rem > 0 ? 'Tu plan responde con el motor básico, rápido y sin coste extra.' : 'Tu cupo se renueva a las 00:00 h.');
    p.querySelector('[data-big]').textContent = big; p.querySelector('[data-sm]').textContent = sm;
    note.innerHTML = '<strong>Cómo funciona:</strong> el motor potente da respuestas más largas y profundas; el básico es más breve. El cupo es diario y se reinicia a las 00:00 h. Las imágenes y el vídeo tienen su propio cupo.';
    p.querySelector('.kx-us-hero').className = 'kx-us-hero ' + m.st;
    countTo(p.querySelector('[data-n]'), m.rem, 'panel');
    var up = tier === 'free' ? { t: 'Pasar a Pro · 50 consultas al día', k: 1 } : tier === 'pro' ? { t: 'Subir a Club · 125 al día', k: 1 } : null;
    if (up) { cta.style.display = ''; cta.textContent = up.t + ' →'; } else cta.style.display = 'none';
    setRing(p, frac(m.rem, m.total));
    requestAnimationFrame(function () { requestAnimationFrame(function () { [].forEach.call(rows.querySelectorAll('.bar i'), function (el) { el.style.width = el.getAttribute('data-w') + '%'; }); }); });
  }
  function tickClock() {
    if (!panel) return; var el = panel.querySelector('[data-clock]'); if (!el) return;
    var n = new Date(), m = new Date(n); m.setHours(24, 0, 0, 0); var t = Math.max(0, Math.floor((m - n) / 1000));
    el.textContent = [Math.floor(t / 3600), Math.floor(t % 3600 / 60), t % 60].map(function (v) { return String(v).padStart(2, '0'); }).join(':');
  }
  function openPanel() {
    var q = getQ(); if (!q) return;
    lastTotal.panel = 0; paintPanel(q);
    var p = buildPanel(); p.classList.add('open'); tickClock(); clearInterval(clockT); clockT = setInterval(tickClock, 1000);
    var x = p.querySelector('.kx-us-x'); if (x) x.focus({ preventScroll: true });
  }
  function closePanel() { if (!panel) return; panel.classList.remove('open'); clearInterval(clockT); }

  /* ---------- refresco ---------- */
  function refresh() {
    var q = getQ(); if (!q) return;
    cards.forEach(function (c) { paintCard(c, q); });
    strips.forEach(function (s) { paintStrip(s, q); });
    if (panel && panel.classList.contains('open')) paintPanel(q);
  }
  var pend = false;
  function soon() { if (pend) return; pend = true; setTimeout(function () { pend = false; refresh(); }, 60); }

  function mount() {
    if (built) return;
    if (isGuest() || !window.KinetAPIs || !KinetAPIs.getQuotaStatus) return;
    built = true;
    var st = document.createElement('style'); st.id = 'kx-usage-css'; st.textContent = CSS; document.head.appendChild(st);
    buildCard(); buildStrip();
    if (!cards.length && !strips.length) return;
    refresh();
    window.addEventListener('kinet:usage', soon); window.addEventListener('kinet:cloud-synced', soon); window.addEventListener('storage', soon);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) soon(); });
    setInterval(soon, 30000);
  }
  function boot() { mount(); if (!built) { var n = 0, iv = setInterval(function () { mount(); if (built || ++n > 12) clearInterval(iv); }, 500); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.KinetUsage = { open: openPanel, close: closePanel, refresh: refresh };
})();
