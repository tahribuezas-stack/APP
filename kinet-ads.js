/* KINET · Anuncios con estética KINET (solo cuentas gratuitas e invitados; nunca en Despacho ni en Pro/Club/equipo).
   - Sin rastreo ni cookies: los anuncios son contextuales (por deporte) y no usan datos personales.
   - Siempre llevan la etiqueta «ANUNCIO» (o «PROMO KINET» si es de la propia app) y un enlace para quitarlos.
   - Para añadir un patrocinador real: pon un objeto en SPONSORS (abajo). Mientras no haya ninguno se muestran promos de KINET y el espacio «Tu marca aquí».
   Huecos:
     <div data-kinet-ad="wide"></div>                       franja larga (o dos mitades) bajo el contenido
     <div data-kinet-ad="side" data-replace="#id"></div>    tarjeta compacta de la barra lateral (sustituye a #id mientras haya anuncios)
     data-kinet-ad-chat=".outgoing"                          contenedor de chat: la tarjeta aparece bajo la última respuesta
     KinetAds.interleave(cards)                              feed de Comunidad: mezcla tarjetas-anuncio con las publicaciones */
(function () {
  'use strict';
  var ls; try { ls = window.localStorage; } catch (e) { return; }
  function g(k) { try { return ls.getItem(k) || ''; } catch (e) { return ''; } }

  /* ───────────────────────── Patrocinadores (futuros clientes) ─────────────────────────
     { id:'marca1', brand:'Marca', title:'Titular corto', text:'Una frase.', cta:'Ver oferta', url:'https://…', emoji:'🥤', tone:'#00FF88', sports:['Fútbol'] }   (sports vacío = todos) */
  var SPONSORS = [];

  var HOUSE = [
    { id: 'pro',    brand: 'KINET', title: 'KINET PRO · Cuerpo Técnico sin límites', text: 'Hasta 100 consultas potentes al día, Media Studio completo y cero anuncios. Desde 8,99 €/mes.', cta: 'Ver planes', url: 'despacho.html?tab=subscription', guestUrl: 'login.html?mode=register', emoji: '⚡', tone: '#00FF88', house: true },
    { id: 'lab',    brand: 'KINET', title: 'Descubre tu KINET Card', text: 'Sube un clip de ~1,5 min y la IA audita tu técnica y desbloquea tu carta oficial.', cta: 'Ir al Laboratorio', url: 'ojeador-live.html', emoji: '🎬', tone: '#38BDF8', house: true },
    { id: 'radar',  brand: 'KINET', title: 'Hazte visible ante ojeadores', text: 'Completa tu ficha y aparece en el Radar de clubes y ojeadores de tu deporte.', cta: 'Completar ficha', url: 'perfil.html', emoji: '📡', tone: '#A78BFA', house: true },
    { id: 'cv',     brand: 'KINET', title: 'Tu dossier deportivo en PDF', text: 'CV profesional con tu KINET Card, listo para enviar a clubes en un clic.', cta: 'Crear mi dossier', url: 'perfil.html', emoji: '📄', tone: '#F59E0B', house: true },
    { id: 'brand',  brand: 'Espacio patrocinador', title: 'Tu marca aquí', text: 'Llega a atletas, entrenadores y ojeadores de tu deporte con anuncios con estética KINET.', cta: 'Anunciarme', url: 'soporte.html', emoji: '🏷️', tone: '#00FF88', house: true, slot: true }
  ];

  /* ───────────────────────── Reglas de quién ve anuncios ───────────────────────── */
  function isGuest() {
    return g('kinet_is_guest') === 'true' || g('kinet_guest_session') === 'true' || g('kinet_mode') === 'guest' || !(g('kinet_logged_in') === 'true' || g('kinet_user_id'));
  }
  function paid() { var t = g('kinet_account_tier').toLowerCase(); return t === 'pro' || t === 'club' || g('kinet_is_pro') === 'true'; }
  function enabled() {
    if (paid() || g('kinet_staff_admin_role')) return false;
    try { if (window.KINET_FLAGS && window.KINET_FLAGS.ads_off) return false; } catch (e) {}
    return true;
  }

  /* ───────────────────────── Elección de creatividades ───────────────────────── */
  var seed = (function () { try { var n = Number(sessionStorage.getItem('kad_seed')) || 0; n++; sessionStorage.setItem('kad_seed', String(n)); return n; } catch (e) { return 1; } })();
  var picked = 0;
  function pool() {
    var sp = g('kinet_sport');
    var s = SPONSORS.filter(function (a) { return !a.sports || !a.sports.length || a.sports.indexOf(sp) >= 0; });
    // Con patrocinadores reales, mandan ellos; las promos de KINET solo rellenan huecos
    return s.length ? s.concat(HOUSE.filter(function (h) { return !h.slot; })) : HOUSE;
  }
  function next(avoid) {
    var p = pool(), i, a, tries = 0;
    do { i = (seed * 3 + picked++) % p.length; a = p[i]; tries++; } while (avoid && a.id === avoid && tries < p.length + 1);
    return a;
  }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function href(a) { return (isGuest() && a.guestUrl) ? a.guestUrl : a.url; }
  function ext(a) { return /^https?:/i.test(a.url || ''); }
  function removeHref() { return isGuest() ? 'login.html?mode=register' : 'despacho.html?tab=subscription'; }
  function tag(a) { return a.house ? (a.slot ? 'ESPACIO PATROCINADOR' : 'PROMO KINET') : 'ANUNCIO · ' + esc(a.brand).toUpperCase(); }
  function link(a, cls, label) {
    return '<a class="' + cls + '" href="' + esc(href(a)) + '"' + (ext(a) ? ' target="_blank" rel="sponsored noopener"' : '') + '>' + label + '</a>';
  }
  function tile(a, size) { return '<span class="kad-tile" style="--kad-tone:' + esc(a.tone || '#00FF88') + ';' + (size ? 'width:' + size + 'px;height:' + size + 'px;' : '') + '"><i>' + esc(a.emoji || '⚡') + '</i></span>'; }
  function why() { return '<a class="kad-rm" href="' + removeHref() + '" title="' + (isGuest() ? 'Crea tu cuenta' : 'Quita los anuncios con KINET PRO') + '">' + (isGuest() ? 'Crear cuenta' : 'Quitar anuncios') + '</a>'; }

  /* ───────────────────────── Plantillas ───────────────────────── */
  function wideCard(a, half) {
    return '<div class="kad kad-wide' + (half ? ' kad-half' : '') + '" data-kad="' + esc(a.id) + '">' + tile(a, 52) +
      '<div class="kad-body"><div class="kad-top"><span class="kad-tag">' + tag(a) + '</span>' + why() + '</div>' +
      '<div class="kad-title">' + esc(a.title) + '</div><div class="kad-text">' + esc(a.text) + '</div></div>' +
      link(a, 'kad-cta', esc(a.cta) + ' <b>→</b>') + '</div>';
  }
  function wideRow() {
    var a = next(), two = (seed + picked) % 2 === 0 && pool().length > 1;
    if (!two) return '<div class="kad-row">' + wideCard(a, false) + '</div>';
    var b = next(a.id);
    return '<div class="kad-row kad-two">' + wideCard(a, true) + wideCard(b, true) + '</div>';
  }
  function chatCard(a) {
    return '<div class="kad kad-chat" data-kad="' + esc(a.id) + '">' + tile(a, 74) +
      '<div class="kad-body"><div class="kad-top"><span class="kad-tag">' + tag(a) + '</span><span class="kad-dots">•••</span></div>' +
      '<div class="kad-title">' + esc(a.title) + '</div><div class="kad-text">' + esc(a.text) + '</div>' +
      '<div class="kad-foot">' + link(a, 'kad-cta kad-cta-sm', esc(a.cta) + ' <b>→</b>') + why() + '</div></div></div>';
  }
  function sideCard(a) {
    return '<div class="kad kad-side" data-kad="' + esc(a.id) + '"><div class="kad-top"><span class="kad-tag">' + tag(a) + '</span>' + why() + '</div>' +
      '<div class="kad-side-row">' + tile(a, 34) + '<div><div class="kad-title">' + esc(a.title) + '</div></div></div>' +
      '<div class="kad-text">' + esc(a.text) + '</div>' + link(a, 'kad-cta kad-cta-sm', esc(a.cta) + ' <b>→</b>') + '</div>';
  }
  function feedCard(a) {
    return '<div class="kad kad-feed" data-kad="' + esc(a.id) + '"><div class="kad-top"><div class="kad-feed-h">' + tile(a, 40) +
      '<div><div class="kad-feed-n">' + esc(a.brand) + '</div><div class="kad-feed-s">Patrocinado</div></div></div><span class="kad-tag">' + tag(a) + '</span></div>' +
      '<div class="kad-title kad-title-lg">' + esc(a.title) + '</div><div class="kad-text">' + esc(a.text) + '</div>' +
      '<div class="kad-foot">' + link(a, 'kad-cta', esc(a.cta) + ' <b>→</b>') + why() + '</div></div>';
  }

  /* ───────────────────────── Estilos (con la estética de los paneles de cada página) ───────────────────────── */
  function css() {
    if (document.getElementById('kad-css')) return;
    var st = document.createElement('style'); st.id = 'kad-css';
    st.textContent =
      '.kad{--kad-r:var(--kad-radius,18px);position:relative;border:1px solid var(--border-subtle,rgba(255,255,255,.08));border-radius:var(--kad-r);background:var(--bg-panel,rgba(13,17,26,.92));box-shadow:0 10px 26px rgba(0,0,0,.32);color:#E2E8F0;overflow:hidden;font-family:Inter,system-ui,sans-serif}' +
      '.kad::before{content:"";position:absolute;inset:0;background:radial-gradient(120% 140% at 0% 0%,rgba(var(--role-rgb,0,255,136),.07),transparent 55%);pointer-events:none}' +
      '.kad-tag{font:700 .54rem "JetBrains Mono",monospace;letter-spacing:.16em;color:var(--role-color,#00FF88);opacity:.95;white-space:nowrap}' +
      '.kad-rm{font:600 .56rem "JetBrains Mono",monospace;color:#64748B;text-decoration:none;letter-spacing:.04em;white-space:nowrap;transition:color .2s}.kad-rm:hover{color:#E2E8F0}' +
      '.kad-top{display:flex;align-items:center;justify-content:space-between;gap:10px;position:relative}' +
      '.kad-title{font:800 .86rem/1.25 Inter,sans-serif;color:#fff;margin-top:3px;position:relative}.kad-title-lg{font-size:.98rem;margin:10px 0 3px}' +
      '.kad-text{font:500 .74rem/1.42 Inter,sans-serif;color:#94A3B8;margin-top:2px;position:relative}' +
      '.kad-tile{flex:none;display:inline-grid;place-items:center;width:52px;height:52px;border-radius:14px;position:relative;overflow:hidden;border:1px solid color-mix(in srgb,var(--kad-tone) 55%,transparent);' +
        'background:radial-gradient(circle at 30% 25%,color-mix(in srgb,var(--kad-tone) 38%,transparent),rgba(8,12,20,.95) 72%),repeating-linear-gradient(0deg,transparent 0 7px,rgba(255,255,255,.035) 7px 8px);box-shadow:0 0 18px color-mix(in srgb,var(--kad-tone) 22%,transparent)}' +
      '.kad-tile i{font-style:normal;font-size:1.4em;filter:drop-shadow(0 0 6px color-mix(in srgb,var(--kad-tone) 60%,transparent))}' +
      '.kad-cta{display:inline-flex;align-items:center;gap:6px;flex:none;padding:8px 14px;border-radius:11px;border:1px solid rgba(var(--role-rgb,0,255,136),.5);background:rgba(var(--role-rgb,0,255,136),.1);color:var(--role-color,#00FF88);font:700 .7rem Inter,sans-serif;text-decoration:none;position:relative;transition:background .2s,box-shadow .2s,translate .2s}' +
      '.kad-cta:hover{background:rgba(var(--role-rgb,0,255,136),.2);box-shadow:0 0 16px rgba(var(--role-rgb,0,255,136),.25);translate:0 -1px}.kad-cta b{font-weight:800;transition:translate .2s}.kad-cta:hover b{translate:3px 0}' +
      '.kad-cta-sm{padding:6px 11px;font-size:.66rem;border-radius:9px}' +
      '.kad-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:9px;position:relative}' +
      /* franja larga / dos mitades: fina, del ancho de los cuadros de arriba */
      '.kad-row{display:grid;grid-template-columns:1fr;gap:var(--kad-gap,16px);margin-top:var(--kad-gap,16px);grid-column:1/-1;width:100%}.kad-row.kad-two{grid-template-columns:1fr 1fr}' +
      '.kad-wide{display:flex;align-items:center;gap:14px;padding:12px 16px;min-height:78px}.kad-wide .kad-body{flex:1;min-width:0}' +
      '.kad-wide .kad-text{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
      '.kad-half{padding:11px 14px}.kad-half .kad-cta{padding:7px 11px}.kad-half .kad-cta b{display:none}' +
      '@media(max-width:820px){.kad-row.kad-two{grid-template-columns:1fr}.kad-wide{flex-wrap:wrap}.kad-wide .kad-cta{margin-left:66px}}' +
      /* tarjeta bajo la respuesta del chat (estilo patrocinado de los asistentes) */
      '.kad-chat{display:flex;gap:14px;align-items:flex-start;padding:12px 14px;margin:12px 0 4px;max-width:520px;background:rgba(255,255,255,.025)}.kad-chat .kad-body{flex:1;min-width:0}.kad-dots{color:#475569;letter-spacing:.1em;font-size:.7rem}' +
      '.kad-chat-wrap{padding:0 10px}' +
      /* barra lateral */
      '.kad-side{padding:11px 12px;border-radius:14px}.kad-side-row{display:flex;gap:9px;align-items:center;margin:8px 0 5px;position:relative}.kad-side .kad-title{font-size:.78rem;margin:0}.kad-side .kad-text{font-size:.68rem;margin:0 0 9px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.kad-side .kad-cta{width:100%;justify-content:center}' +
      /* feed de Comunidad: parece una publicación */
      '.kad-feed{padding:15px;margin-bottom:11px}.kad-feed-h{display:flex;align-items:center;gap:10px}.kad-feed-n{font:800 .84rem Inter,sans-serif;color:#fff}.kad-feed-s{font:600 .6rem "JetBrains Mono",monospace;color:#64748B;margin-top:1px}' +
      '[data-kad-hidden]{display:none!important}@media print{.kad,.kad-row{display:none!important}}';
    document.head.appendChild(st);
  }

  /* ───────────────────────── Montaje ───────────────────────── */
  function matchRadius() {
    try {
      var p = document.querySelector('.kinet-panel'); if (!p) return;
      var cs = getComputedStyle(p), r = parseFloat(cs.borderTopLeftRadius);
      if (r) document.documentElement.style.setProperty('--kad-radius', r + 'px');
      var grid = document.querySelector('.bento-grid'); if (grid) { var gp = parseFloat(getComputedStyle(grid).rowGap || getComputedStyle(grid).gap); if (gp) document.documentElement.style.setProperty('--kad-gap', gp + 'px'); }
    } catch (e) {}
  }
  function mountSlots() {
    var slots = document.querySelectorAll('[data-kinet-ad]');
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i], kind = s.getAttribute('data-kinet-ad');
      if (s.getAttribute('data-kad-done')) continue;
      s.setAttribute('data-kad-done', '1');
      if (kind === 'wide') { s.innerHTML = wideRow(); s.classList.add('kad-slot'); }
      else if (kind === 'side') {
        var sel = s.getAttribute('data-replace'), old = sel ? document.querySelector(sel) : null;
        if (old) { old.setAttribute('data-kad-hidden', '1'); old.style.display = 'none'; }
        s.innerHTML = sideCard(next()); s.classList.add('kad-slot');
      }
    }
  }
  function attachChat(box) {
    if (box.__kadObs) { if (box.__kadPlace) box.__kadPlace(); return; }
    var need = box.getAttribute('data-kinet-ad-chat') || '', creative = null, busy = false;
    function place() {
      if (busy) return; busy = true;
      try {
        var old = box.querySelector(':scope > .kad-chat-wrap');
        if (!enabled()) { if (old) old.remove(); return; }
        if (need && !box.querySelector(need)) { if (old) old.remove(); return; }   // aún no ha preguntado nada: no hay respuesta bajo la que ir
        if (!creative) creative = next();
        var atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 140;
        if (!old) { old = document.createElement('div'); old.className = 'kad-chat-wrap'; old.innerHTML = chatCard(creative); }
        if (box.lastElementChild !== old) { box.appendChild(old); if (atBottom) box.scrollTop = box.scrollHeight; }
      } finally { busy = false; }
    }
    box.__kadPlace = place;
    box.__kadObs = new MutationObserver(function () { place(); });
    box.__kadObs.observe(box, { childList: true });
    place();
  }
  function mountChats() { var l = document.querySelectorAll('[data-kinet-ad-chat]'); for (var i = 0; i < l.length; i++) attachChat(l[i]); }

  function mount() {
    if (!enabled()) return;
    css(); matchRadius(); mountSlots(); mountChats();
  }
  function unmount() {
    var l = document.querySelectorAll('.kad-chat-wrap'); for (var i = 0; i < l.length; i++) l[i].remove();
    var sl = document.querySelectorAll('.kad-slot'); for (var k = 0; k < sl.length; k++) { sl[k].innerHTML = ''; sl[k].removeAttribute('data-kad-done'); sl[k].classList.remove('kad-slot'); }
    var h = document.querySelectorAll('[data-kad-hidden]'); for (var j = 0; j < h.length; j++) { h[j].style.display = ''; h[j].removeAttribute('data-kad-hidden'); }
  }
  function refresh() { if (enabled()) mount(); else unmount(); }

  /* Feed de Comunidad: una tarjeta tras la 2.ª publicación y luego cada 6 (solo cuentas gratuitas con sesión; los invitados no tienen red social) */
  function feedEnabled() { return enabled() && !isGuest(); }
  function interleave(cards) {
    if (!feedEnabled() || !cards || !cards.length) return (cards || []).join('');
    css(); matchRadius();
    var out = [], last = null;
    for (var i = 0; i < cards.length; i++) {
      out.push(cards[i]);
      if (i === 1 || (i > 1 && (i - 1) % 6 === 0)) { var a = next(last); last = a.id; out.push(feedCard(a)); }
    }
    if (cards.length < 2) { var b = next(last); out.push(feedCard(b)); }   // muro casi vacío: una sola tarjeta al final
    return out.join('');
  }

  window.KinetAds = { enabled: enabled, feedEnabled: feedEnabled, interleave: interleave, refresh: refresh, mount: mount, sponsors: SPONSORS };
  function boot() { mount(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  ['kinet:tier-synced', 'kinet:flags', 'kinet:cloud-synced'].forEach(function (ev) { window.addEventListener(ev, refresh); });
})();
