/* KINET OS · portada: aparición lenta y escalonada de las tarjetas al hacer scroll (misma sensación que el blog). */
(function () {
  'use strict';
  if (!('IntersectionObserver' in window)) return;
  var SEL = '#aprende .head,#aprende .col>b,#aprende .t,#aprende .p,#ecosistema .glass-card,#card-section>.glass-card,#vision-section>.glass-card,#analizador-section>.glass-card,#media-section>.glass-card,#plans-grid>.glass-card,#que-es>*';
  function boot() {
    var els = [].slice.call(document.querySelectorAll(SEL)), seen = new Map();
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; io.unobserve(e.target);
        var el = e.target; el.classList.add('kh-show');
        setTimeout(function () { el.classList.remove('kh-rv', 'kh-show'); el.style.removeProperty('--d'); }, 2600);
      });
    }, { rootMargin: '0px 0px -9% 0px', threshold: .1 });
    els.forEach(function (el) {
      var p = el.parentElement, n = seen.get(p) || 0; seen.set(p, n + 1);
      el.style.setProperty('--d', Math.min(n, 6) * .12 + 's'); el.classList.add('kh-rv'); io.observe(el);
    });
  }
  if (document.readyState !== 'loading') boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
