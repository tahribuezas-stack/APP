/* KINET OS · Idiomas (EN / FR / DE / IT)
   - Español = idioma base: si el idioma es "es" este archivo no hace NADA (cero coste).
   - Otro idioma: carga i18n/<lang>.json (una vez, queda en localStorage) y traduce el DOM:
       1) una pasada inicial rápida (el cuerpo queda oculto ≤ unas décimas de segundo para no ver el español)
       2) después solo traduce los nodos NUEVOS que aparecen (lotes en requestAnimationFrame), nunca recorre la página entera.
   - No toca estilos ni estructura: solo cambia texto (y placeholder/title/aria-label/alt).
   - Lo que no está en el diccionario se queda en español (nunca se rompe nada).
   API: KinetI18n.lang, KinetI18n.set('en'), KinetI18n.t('texto'), KinetI18n.langs */
(function () {
  'use strict';
  var V = 3; // sube este número al actualizar los diccionarios (invalida la copia local)
  var LANGS = { es: 'Español', en: 'English', fr: 'Français', de: 'Deutsch', it: 'Italiano' };
  var NAMES_AI = { es: 'español', en: 'English', fr: 'français', de: 'Deutsch', it: 'italiano' };

  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
  function pick() {
    var m = /[?&]lang=([a-z]{2})/i.exec(location.search); if (m && LANGS[m[1].toLowerCase()]) { var l = m[1].toLowerCase(); ls('kx_lang', l); ls('kinet_lang', l); try { history.replaceState(null, '', location.pathname + location.search.replace(/([?&])lang=[a-z]{2}&?/i, '$1').replace(/[?&]$/, '') + location.hash); } catch (e) {} return l; }
    var s = ls('kinet_lang') || ls('kx_lang'); return s && LANGS[s] ? s : 'es';
  }
  var lang = pick();
  var api = window.KinetI18n = { lang: lang, langs: LANGS, aiName: NAMES_AI[lang] || 'español', t: function (s) { return s; }, ready: false };
  api.set = function (l) { if (!LANGS[l]) return; ls('kx_lang', l); ls('kinet_lang', l); location.reload(); };
  document.documentElement.setAttribute('data-lang', lang);
  if (lang === 'es') { api.ready = true; return; }
  document.documentElement.lang = lang;

  /* ── ocultar hasta la primera pasada (con salvavidas) ── */
  var hide = document.createElement('style'); hide.id = 'kx-i18n-hide'; hide.textContent = 'html{visibility:hidden!important}';
  (document.head || document.documentElement).appendChild(hide);
  var unhid = false;
  function unhide() { if (unhid) return; unhid = true; var h = document.getElementById('kx-i18n-hide'); if (h) h.remove(); }
  setTimeout(unhide, 900);

  var D = null, H = null; // D: texto → traducción · H: html → traducción
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1, SVG: 1, CANVAS: 1, IFRAME: 1, OPTION_: 1 };
  var INLINE = { B: 1, STRONG: 1, I: 1, EM: 1, U: 1, SPAN: 1, SMALL: 1, BR: 1, MARK: 1, SUP: 1, SUB: 1, A: 1 };
  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  var seen = new WeakSet();

  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }
  function lookup(s) { // s ya normalizado
    var r = D[s]; if (r !== undefined) return r;
    if (/\d/.test(s)) {
      var nums = [], k = s.replace(/\d+(?:[.,]\d+)?/g, function (m) { nums.push(m); return '{#}'; });
      r = D[k]; if (r !== undefined) { var i = 0; return r.replace(/\{#\}/g, function () { return nums[i++] || ''; }); }
    }
    return undefined;
  }
  api.t = function (s) { if (!D || !s) return s; var n = norm(String(s)); var r = lookup(n); return r === undefined ? s : r; };

  function simpleInline(el) { // contenido mixto con solo etiquetas de formato, sin ids ni manejadores
    var kids = el.children, i, c, a;
    for (i = 0; i < kids.length; i++) {
      c = kids[i];
      if (!INLINE[c.tagName] || c.id || c.children.length > 2) return false;
      for (a = 0; a < c.attributes.length; a++) { var n = c.attributes[a].name; if (n !== 'class' && n !== 'style' && !(c.tagName === 'A' && n === 'href')) return false; }
    }
    return true;
  }
  function text(n) {
    var raw = n.nodeValue; if (!raw || raw.length < 2) return;
    var s = norm(raw); if (!s || !/[A-Za-zÁÉÍÓÚáéíóúñÑ¿¡]/.test(s)) return;
    var r = lookup(s); if (r === undefined || r === s) return;
    var lead = /^\s/.test(raw) ? ' ' : '', trail = /\s$/.test(raw) ? ' ' : '';
    n.nodeValue = lead + r + trail;
  }
  function attrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var v = el.getAttribute(ATTRS[i]); if (!v || v.length < 3) continue;
      var r = lookup(norm(v)); if (r !== undefined) el.setAttribute(ATTRS[i], r);
    }
    if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit') && el.value) { var rv = lookup(norm(el.value)); if (rv !== undefined) el.value = rv; }
  }
  function walk(root) {
    if (!D || !root) return;
    var t = root.nodeType;
    if (t === 3) { var p = root.parentNode; if (p && !SKIP[p.tagName]) text(root); return; }
    if (t !== 1 || SKIP[root.tagName] || root.hasAttribute('data-no-i18n') || root.getAttribute('translate') === 'no') return;
    elWalk(root);
  }
  function elWalk(el) {
    if (SKIP[el.tagName] || el.hasAttribute('data-no-i18n') || el.getAttribute('translate') === 'no') return;
    if (el.attributes.length) attrs(el);
    var hasText = false, hasEl = false, c = el.firstChild;
    for (; c; c = c.nextSibling) { if (c.nodeType === 3) { if (/\S/.test(c.nodeValue)) hasText = true; } else if (c.nodeType === 1) hasEl = true; }
    if (hasText && hasEl && H && simpleInline(el)) {
      var r = H[norm(el.innerHTML)];
      if (r !== undefined) { el.innerHTML = r; return; }
    }
    for (c = el.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) text(c); else if (c.nodeType === 1) elWalk(c);
    }
  }

  /* ── observador: solo nodos añadidos, en lotes ── */
  var queue = [], scheduled = false, mo = null;
  function flush() {
    scheduled = false; var q = queue; queue = [];
    for (var i = 0; i < q.length; i++) { var n = q[i]; if (n.isConnected || n.nodeType === 3 && n.parentNode) walk(n); }
  }
  function schedule() { if (!scheduled) { scheduled = true; (window.requestAnimationFrame || setTimeout)(flush); } }
  function observe() {
    if (mo || !window.MutationObserver) return;
    mo = new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var m = list[i];
        if (m.type === 'childList') { for (var j = 0; j < m.addedNodes.length; j++) { var a = m.addedNodes[j]; if (a.nodeType === 1 || a.nodeType === 3) queue.push(a); } }
        else if (m.type === 'attributes') queue.push(m.target);
        else if (m.type === 'characterData') queue.push(m.target);
      }
      if (queue.length) schedule();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  function first() {
    if (!D) { unhide(); return; }
    var t0 = performance.now();
    walk(document.body || document.documentElement);
    var ti = document.querySelector('title'); if (ti) { var r = lookup(norm(ti.textContent)); if (r !== undefined) ti.textContent = r; }
    var md = document.querySelector('meta[name="description"]'); if (md) { var d = lookup(norm(md.content)); if (d !== undefined) md.content = d; }
    observe(); api.ready = true; api.ms = performance.now() - t0; unhide();
    try { window.dispatchEvent(new CustomEvent('kinet:i18n', { detail: { lang: lang } })); } catch (e) {}
  }
  function setDict(obj) { D = obj.t || {}; H = obj.h || {}; }
  function load(cb) {
    var key = 'kx_i18n_' + lang, cached = ls(key);
    if (cached) { try { var o = JSON.parse(cached); if (o && o.v === V) { setDict(o); return cb(); } } catch (e) {} }
    var url = 'i18n/' + lang + '.json?v=' + V;
    fetch(url).then(function (r) { return r.json(); }).then(function (o) { setDict(o); try { o.v = V; ls(key, JSON.stringify(o)); } catch (e) {} cb(); }).catch(function () { cb(); });
  }
  var domReady = document.readyState !== 'loading', loaded = false;
  function go() { if (domReady && loaded) first(); }
  load(function () { loaded = true; go(); });
  if (!domReady) document.addEventListener('DOMContentLoaded', function () { domReady = true; go(); });

  /* ── herramienta para extraer las cadenas (solo desarrollo): KinetI18n.collect() ── */
  api.collect = function () {
    var T = {}, Hh = {};
    (function rec(el) {
      if (SKIP[el.tagName] || el.hasAttribute('data-no-i18n')) return;
      ATTRS.forEach(function (a) { var v = el.getAttribute && el.getAttribute(a); if (v && v.length > 2 && /[A-Za-záéíóúñ]{3}/.test(v)) T[norm(v)] = 1; });
      var hasText = false, hasEl = false, c = el.firstChild;
      for (; c; c = c.nextSibling) { if (c.nodeType === 3) { if (/\S/.test(c.nodeValue)) hasText = true; } else if (c.nodeType === 1) hasEl = true; }
      if (hasText && hasEl && simpleInline(el)) { Hh[norm(el.innerHTML)] = 1; }
      for (c = el.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) { var s = norm(c.nodeValue); if (s.length > 1 && /[A-Za-zÁÉÍÓÚáéíóúñÑ]{2}/.test(s) && !/^[\W\d_]+$/.test(s)) T[s.replace(/\d+(?:[.,]\d+)?/g, '{#}')] = 1; }
        else if (c.nodeType === 1) rec(c);
      }
    })(document.body);
    return { t: Object.keys(T), h: Object.keys(Hh) };
  };
})();
