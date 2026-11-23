/* KINET OS · movimiento compartido (index, soporte…)
   - Aparición suave de tarjetas y bloques al hacer scroll (con escalonado)
   - Desplazamiento con inercia para ratón con rueda (el trackpad y el táctil siguen siendo nativos)
   - Barra de progreso de lectura
   Respeta prefers-reduced-motion y no oculta nada si el navegador no soporta IntersectionObserver. */
(function () {
  'use strict';
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var doc = document.documentElement;

  /* ---------- 1. Aparición al hacer scroll ---------- */
  function setupReveal() {
    if (reduce || !('IntersectionObserver' in window)) return;
    var sel = '[data-reveal], main > section, .glass-card, .kx-reveal';
    var list = [].slice.call(document.querySelectorAll(sel));
    var picked = [];
    list.forEach(function (el) {
      if (el.id === 'hero-section' || el.closest('header, nav, #mobile-menu, .kx-no')) return;
      for (var i = 0; i < picked.length; i++) if (picked[i] !== el && picked[i].contains(el)) return;   // no animar hijos de algo ya animado
      picked.push(el);
    });
    var io = new IntersectionObserver(function (entries) {
      var visible = entries.filter(function (e) { return e.isIntersecting; });
      visible.forEach(function (e, i) {
        var el = e.target; io.unobserve(el);
        el.style.animationDelay = Math.min(i, 5) * 70 + 'ms';
        el.classList.remove('kx-pre'); el.classList.add('kx-in');
        el.addEventListener('animationend', function done(ev) {
          if (ev.target !== el) return;
          el.classList.remove('kx-in'); el.style.animationDelay = '';
          el.removeEventListener('animationend', done);
        });
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -6% 0px' });
    picked.forEach(function (el) {
      var r = el.getBoundingClientRect();
      el.classList.add('kx-pre');
      io.observe(el);
    });
    // red de seguridad: si algo no llega a verse (p.ej. impresión o pestaña en segundo plano), se muestra todo
    setTimeout(function () {
      document.querySelectorAll('.kx-pre').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < innerHeight * 1.2) { el.classList.remove('kx-pre'); }
      });
    }, 2500);
    window.addEventListener('beforeprint', function () {
      document.querySelectorAll('.kx-pre').forEach(function (el) { el.classList.remove('kx-pre'); });
    });
  }

  /* ---------- 2. Rueda con inercia ---------- */
  function setupSmoothWheel() {
    if (reduce) return;
    var coarse = false;
    try { coarse = window.matchMedia('(pointer: coarse)').matches; } catch (e) {}
    if (coarse) return;
    var cur = window.scrollY, target = cur, raf = 0, animating = false;

    function maxScroll() { return Math.max(0, doc.scrollHeight - innerHeight); }
    function canScrollInside(el, dy) {
      while (el && el !== document.body && el !== doc) {
        if (el.nodeType === 1) {
          var cs = getComputedStyle(el), oy = cs.overflowY;
          if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
            if (dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
            if (dy < 0 && el.scrollTop > 0) return true;
          }
          if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return true;
        }
        el = el.parentNode;
      }
      return false;
    }
    function frame() {
      var diff = target - cur;
      if (Math.abs(diff) < 0.6) { cur = target; window.scrollTo(0, cur); animating = false; doc.style.scrollBehavior = ''; return; }
      cur += diff * 0.14;
      window.scrollTo(0, cur);
      raf = requestAnimationFrame(frame);
    }
    function onWheel(e) {
      if (e.ctrlKey || e.defaultPrevented || e.deltaX && Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      var dy = e.deltaMode === 1 ? e.deltaY * 34 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
      if (Math.abs(dy) < 40 && e.deltaMode === 0) return;          // trackpad: ya es fluido de por sí
      if (document.body && getComputedStyle(document.body).overflow === 'hidden') return;   // modal abierto
      if (doc.scrollHeight <= innerHeight) return;
      if (canScrollInside(e.target, dy)) return;
      e.preventDefault();
      if (!animating) { cur = window.scrollY; target = cur; }
      target = Math.max(0, Math.min(maxScroll(), target + dy * 0.9));
      if (!animating) { animating = true; doc.style.scrollBehavior = 'auto'; raf = requestAnimationFrame(frame); }
    }
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', function () { if (!animating) { cur = window.scrollY; target = cur; } }, { passive: true });
    ['keydown', 'mousedown', 'touchstart'].forEach(function (ev) {
      window.addEventListener(ev, function () { if (animating) { cancelAnimationFrame(raf); animating = false; doc.style.scrollBehavior = ''; cur = target = window.scrollY; } }, { passive: true });
    });
  }

  /* ---------- 3. Barra de progreso ---------- */
  function setupProgress() {
    var bar = document.createElement('div');
    bar.className = 'kx-progress'; bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    var tick = 0;
    function upd() { tick = 0; var m = doc.scrollHeight - innerHeight; bar.style.transform = 'scaleX(' + (m > 0 ? Math.min(1, window.scrollY / m) : 0) + ')'; }
    window.addEventListener('scroll', function () { if (!tick) tick = requestAnimationFrame(upd); }, { passive: true });
    upd();
  }

  function init() { setupProgress(); setupReveal(); setupSmoothWheel(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
