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
  /* desplazamiento fluido hacia las secciones (menú, botones y enlaces #ancla de la misma página) */
  (function () {
    var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, raf = 0;
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } document.documentElement.classList.remove('kb-scrolling'); }
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) { addEventListener(ev, stop, { passive: true }); });
    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function go(y, dur) {
      stop(); var y0 = scrollY, d = y - y0;
      if (RM || Math.abs(d) < 2) { scrollTo({ top: y, behavior: 'instant' }); return; }
      var t0 = null; document.documentElement.classList.add('kb-scrolling'); if (window.KHReveal) KHReveal(y + innerHeight);
      (function f(t) {
        if (t0 === null) t0 = t; var k = Math.min(1, (t - t0) / dur);
        scrollTo({ top: y0 + d * ease(k), left: 0, behavior: 'instant' });
        if (k < 1) raf = requestAnimationFrame(f); else { raf = 0; setTimeout(function () { if (!raf) document.documentElement.classList.remove('kb-scrolling'); }, 300); }
      })(performance.now());
    }
    function target(a) {
      var h = a.getAttribute('href') || ''; if (h.charAt(0) === '#' && h.length > 1) return h.slice(1);
      try { var u = new URL(a.href, location.href); if (u.origin === location.origin && u.hash.length > 1 && (u.pathname === location.pathname || (u.pathname === '/index.html' && location.pathname === '/') || (u.pathname === '/' && location.pathname === '/index.html'))) return decodeURIComponent(u.hash.slice(1)); } catch (e) {}
      return null;
    }
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]'); if (!a || a.target === '_blank') return;
      var id = target(a), el = id && document.getElementById(id); if (!el) return;
      e.preventDefault();
      var hd = document.querySelector('header.top'), off = (hd ? hd.offsetHeight : 0) + 8;
      var y = el.getBoundingClientRect().top + scrollY - off;
      y = Math.max(0, Math.min(y, document.documentElement.scrollHeight - innerHeight));
      go(y, Math.max(800, Math.min(2800, 550 + Math.abs(y - scrollY) * .42)));
      try { history.replaceState(null, '', '#' + id); } catch (er) {}
    });
  })();
})();
