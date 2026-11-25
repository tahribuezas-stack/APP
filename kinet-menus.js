/* KINET OS · Posición segura de los desplegables personalizados (.kinet-custom-select-wrap)
   Al abrirse, el menú se recoloca para no salirse de la pantalla: se alinea al lado que quepa,
   sube si abajo no hay sitio y limita su altura al espacio disponible. */
(function () {
  'use strict';
  if (window.__kinetMenusLoaded) return; window.__kinetMenusLoaded = true;
  var st = document.createElement('style');
  st.textContent =
    '.kinet-custom-select-menu{max-width:min(310px,calc(100vw - 16px))!important;overscroll-behavior:contain}' +
    '.kinet-custom-select-wrap.menu-right .kinet-custom-select-menu{left:auto!important;right:0!important}' +
    '.kinet-custom-select-wrap.menu-left .kinet-custom-select-menu{left:0!important;right:auto!important}' +
    '.kinet-custom-select-wrap.menu-up .kinet-custom-select-menu{top:auto!important;bottom:calc(100% + 6px)!important;transform-origin:bottom center}';
  (document.head || document.documentElement).appendChild(st);

  function place(wrap) {
    var m = wrap.querySelector('.kinet-custom-select-menu');
    if (!m) return;
    wrap.classList.remove('menu-up', 'menu-left', 'menu-right');
    m.style.maxHeight = ''; m.style.maxWidth = '';
    var vw = document.documentElement.clientWidth, vh = window.innerHeight;
    var t = wrap.getBoundingClientRect(), r = m.getBoundingClientRect();
    if (r.right > vw - 8) { wrap.classList.add('menu-right'); r = m.getBoundingClientRect(); }
    if (r.left < 8) {
      wrap.classList.remove('menu-right'); wrap.classList.add('menu-left'); r = m.getBoundingClientRect();
      if (r.right > vw - 8) { wrap.classList.remove('menu-left'); wrap.classList.add('menu-right'); r = m.getBoundingClientRect();
        if (r.left < 8) m.style.maxWidth = Math.max(160, r.right - 8) + 'px'; }
    }
    var below = vh - t.bottom - 10, above = t.top - 10, need = Math.min(270, m.scrollHeight + 12);
    if (need > below && above > below) { wrap.classList.add('menu-up'); m.style.maxHeight = Math.max(120, Math.min(270, above - 6)) + 'px'; }
    else { m.style.maxHeight = Math.max(120, Math.min(270, below - 6)) + 'px'; }
  }

  new MutationObserver(function (list) {
    list.forEach(function (rec) {
      var el = rec.target;
      if (el.classList && el.classList.contains('kinet-custom-select-wrap') && el.classList.contains('open') && !(rec.oldValue || '').split(' ').includes('open')) {
        requestAnimationFrame(function () { place(el); });
      }
    });
  }).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
})();
