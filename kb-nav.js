/* KINET OS · barra común: desplegable «Producto», menú móvil y marcador deslizante. Sin dependencias. */
(function () {
  'use strict';
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function boot() {
    var nav = $('header.top nav.top-nav'); if (!nav) return;
    /* marcador deslizante */
    var ind = document.createElement('i'); ind.className = 'ind'; nav.appendChild(ind);
    var links = $$('nav.top-nav>a,nav.top-nav .kn-b', document.querySelector('header.top')), on = $('nav.top-nav>a.on', document.querySelector('header.top'));
    function go(a) { if (!a) { ind.style.opacity = 0; return; } ind.style.opacity = 1; var d = a.closest('.kn-dd') || a; ind.style.width = d.offsetWidth + 'px'; ind.style.transform = 'translateX(' + d.offsetLeft + 'px)'; }
    go(on);
    links.forEach(function (a) { a.addEventListener('mouseenter', function () { go(a); }); });
    nav.addEventListener('mouseleave', function () { go(on); });
    addEventListener('resize', function () { go(on); });
    /* desplegable */
    var dd = $('.kn-dd', nav), btn = dd && $('.kn-b', dd), t = 0;
    function set(v) { if (!dd) return; dd.classList.toggle('open', v); btn.setAttribute('aria-expanded', v ? 'true' : 'false'); }
    if (dd) {
      dd.addEventListener('mouseenter', function () { clearTimeout(t); set(true); });
      dd.addEventListener('mouseleave', function () { clearTimeout(t); t = setTimeout(function () { set(false); }, 180); });
      btn.addEventListener('click', function (e) { e.preventDefault(); set(!dd.classList.contains('open')); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
      document.addEventListener('click', function (e) { if (!dd.contains(e.target)) set(false); });
      $$('a', dd).forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
    }
    /* móvil */
    var bg = $('header.top .kn-burger'), m = $('header.top .kn-m');
    if (bg && m) {
      bg.addEventListener('click', function () { var o = !m.classList.contains('open'); m.classList.toggle('open', o); bg.setAttribute('aria-expanded', o ? 'true' : 'false'); });
      $$('a', m).forEach(function (a) { a.addEventListener('click', function () { m.classList.remove('open'); bg.setAttribute('aria-expanded', 'false'); }); });
    }
  }
  if (document.readyState !== 'loading') boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
