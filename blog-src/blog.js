/* KINET OS · movimiento y utilidades del blog y las herramientas (sin dependencias) */
(function () {
  'use strict';
  var RM = false, FINE = false;
  try { RM = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  try { FINE = matchMedia('(hover:hover) and (pointer:fine)').matches; } catch (e) {}
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function ready(f) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', f); else f(); }

  ready(function () {
    /* fondo ambiental + barra de progreso */
    var bg = document.createElement('div'); bg.id = 'kb-bg'; bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = '<i class="b1"></i><i class="b2"></i><i class="b3"></i><div class="grid"></div><div class="grain"></div>';
    document.body.insertBefore(bg, document.body.firstChild);
    var pr = document.createElement('div'); pr.id = 'kb-prog'; document.body.appendChild(pr);
    var tk = false;
    function prog() { var h = document.documentElement, m = h.scrollHeight - h.clientHeight; pr.style.transform = 'scaleX(' + (m > 0 ? Math.min(1, h.scrollTop / m) : 0) + ')'; tk = false; }
    addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(prog); } }, { passive: true }); prog();

    /* botón atrás: vuelve a la página anterior si venimos de la web; si no, a la sección padre */
    $$('.kb-back').forEach(function (b) {
      b.addEventListener('click', function (e) {
        var same = false; try { same = document.referrer && new URL(document.referrer).origin === location.origin; } catch (x) {}
        if (same && history.length > 1) { e.preventDefault(); history.back(); }
      });
    });

    /* navegación: marcador deslizante */
    var nav = $('nav.top-nav');
    if (nav) {
      var ind = document.createElement('i'); ind.className = 'ind'; nav.appendChild(ind);
      var links = $$('a', nav), on = $('a.on', nav);
      var go = function (a) { if (!a) { ind.style.opacity = 0; return; } ind.style.opacity = 1; ind.style.width = a.offsetWidth + 'px'; ind.style.transform = 'translateX(' + a.offsetLeft + 'px)'; };
      go(on);
      links.forEach(function (a) { a.addEventListener('mouseenter', function () { go(a); }); });
      nav.addEventListener('mouseleave', function () { go(on); });
      addEventListener('resize', function () { go(on); });
    }

    /* aparición al hacer scroll */
    var rv = $$('.rv');
    if ('IntersectionObserver' in window && !RM) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
      rv.forEach(function (el, i) { if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', Math.min(i % 6, 5) * .06 + 's'); io.observe(el); });
    } else rv.forEach(function (el) { el.classList.add('in'); });

    /* contadores */
    $$('[data-count]').forEach(function (el) {
      var to = parseFloat(el.getAttribute('data-count')) || 0, d = 1100, t0 = 0, done = false;
      function run() { if (done) return; done = true; if (RM) { el.textContent = to; return; } t0 = performance.now(); (function f(t) { var p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * e); if (p < 1) requestAnimationFrame(f); })(t0); }
      if ('IntersectionObserver' in window) { var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { run(); o.disconnect(); } }); o.observe(el); } else run();
    });

    /* palabra rotatoria del titular */
    var rot = $('.hero .rot');
    if (rot && !RM) {
      var ws = $$('span', rot), cur = 0, w = 0; ws.forEach(function (s) { w = Math.max(w, s.offsetWidth); }); if (w) rot.style.minWidth = w + 'px';
      ws.forEach(function (s, i) { s.style.transform = i ? 'translateY(110%)' : 'none'; s.style.opacity = i ? 0 : 1; });
      setInterval(function () {
        var a = ws[cur], nx = (cur + 1) % ws.length, b = ws[nx];
        b.style.transition = 'none'; b.style.transform = 'translateY(110%)'; b.style.opacity = 0; void b.offsetWidth; b.style.transition = '';
        a.style.transform = 'translateY(-110%)'; a.style.opacity = 0; b.style.transform = 'none'; b.style.opacity = 1; cur = nx;
      }, 2600);
    }

    /* halo que acompaña al cursor + onda al pulsar (como en la app) */
    if (FINE && !RM) {
      var ring = document.createElement('div'); ring.id = 'kb-cur'; ring.setAttribute('aria-hidden', 'true'); document.body.appendChild(ring);
      var H = document.documentElement, mx = -100, my = -100, rx = -100, ry = -100, craf = 0, first = true, HOT = 'a,button,[role=button],summary,select,label,.nd,.chip,.card,.dk,.fc';
      var cloop = function () { rx += (mx - rx) * .22; ry += (my - ry) * .22; ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)'; craf = (Math.abs(mx - rx) > .1 || Math.abs(my - ry) > .1) ? requestAnimationFrame(cloop) : 0; };
      document.addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; if (first) { first = false; rx = mx; ry = my; H.classList.add('kb-cur-on'); } if (!craf) craf = requestAnimationFrame(cloop); }, { passive: true });
      document.addEventListener('mouseover', function (e) { var t = e.target; if (!t || !t.closest) return; H.classList.toggle('kb-cur-hot', !!t.closest(HOT)); H.classList.toggle('kb-cur-text', !!t.closest('input,textarea')); }, { passive: true });
      document.addEventListener('mousedown', function () { H.classList.add('kb-cur-down'); }, { passive: true });
      document.addEventListener('mouseup', function () { H.classList.remove('kb-cur-down'); }, { passive: true });
      H.addEventListener('mouseleave', function () { H.classList.remove('kb-cur-on'); });
      H.addEventListener('mouseenter', function () { if (!first) H.classList.add('kb-cur-on'); });
      document.addEventListener('pointerdown', function (e) { if (e.button) return; var p = document.createElement('div'); p.className = 'kb-pulse'; p.style.left = e.clientX + 'px'; p.style.top = e.clientY + 'px'; document.body.appendChild(p); setTimeout(function () { p.remove(); }, 750); }, { passive: true });
    }

    /* foco que sigue al cursor + inclinación suave + imanes (solo ratón) */
    if (FINE && !RM) {
      var SP = '.card,.tt,.kcard,.cta,.tool,.side-box';
      document.addEventListener('pointermove', function (e) {
        var el = e.target.closest && e.target.closest(SP); if (!el) return;
        var r = el.getBoundingClientRect(); el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      }, { passive: true });
      $$('.card,.feat').forEach(function (c) {
        var raf = 0;
        c.addEventListener('pointermove', function (e) {
          if (raf) return; raf = requestAnimationFrame(function () {
            raf = 0; var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
            c.style.transform = 'perspective(900px) translateY(-4px) rotateX(' + (-y * 4).toFixed(2) + 'deg) rotateY(' + (x * 5).toFixed(2) + 'deg)';
          });
        });
        c.addEventListener('pointerleave', function () { c.style.transform = ''; });
      });
      $$('.btn,[data-mag]').forEach(function (b) {
        b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .28).toFixed(1) + 'px)'; });
        b.addEventListener('pointerleave', function () { b.style.transform = ''; });
      });
    }

    /* índice lateral: sección activa */
    var tocA = $$('.side-box li a');
    if (tocA.length && 'IntersectionObserver' in window) {
      var map = {}; tocA.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
      var so = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { tocA.forEach(function (a) { a.classList.remove('on'); }); var a = map[e.target.id]; if (a) a.classList.add('on'); } });
      }, { rootMargin: '-20% 0px -70% 0px' });
      $$('article h2[id]').forEach(function (h) { so.observe(h); });
    }

    /* copiar enlace */
    $$('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function () {
        var u = location.href.split('#')[0], t = b.textContent;
        (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(function () { b.textContent = '✓ Copiado'; setTimeout(function () { b.textContent = t; }, 1600); }).catch(function () { prompt('Copia el enlace:', u); });
      });
    });

    /* paleta de comandos (Ctrl/⌘ + K  ·  /) */
    var pal = null, sel = 0, items = [];
    function buildPal() {
      pal = document.createElement('div'); pal.id = 'kb-pal';
      pal.innerHTML = '<div class="pal" role="dialog" aria-modal="true" aria-label="Buscar"><input type="search" placeholder="Busca artículos y herramientas…" aria-label="Buscar"><ul></ul><div class="hint"><span>↑↓ moverse</span><span>↵ abrir</span><span>esc cerrar</span></div></div>';
      document.body.appendChild(pal);
      var inp = $('input', pal);
      pal.addEventListener('mousedown', function (e) { if (e.target === pal) close(); });
      inp.addEventListener('input', render);
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') { sel = Math.min(items.length - 1, sel + 1); mark(); e.preventDefault(); }
        else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); mark(); e.preventDefault(); }
        else if (e.key === 'Enter') { var a = $$('li a', pal)[sel]; if (a) location.href = a.href; }
      });
    }
    function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
    function render() {
      var q = norm($('input', pal).value.trim()), D = window.KB_INDEX || [];
      items = D.filter(function (d) { return !q || norm(d.t + ' ' + d.d + ' ' + d.c).indexOf(q) > -1; }).slice(0, 12);
      $('ul', pal).innerHTML = items.length ? items.map(function (d) { return '<li><a href="' + d.u + '"><i style="--c:' + d.a + '"></i>' + d.t.replace(/</g, '&lt;') + '<small>' + d.c + '</small></a></li>'; }).join('') : '<li style="padding:18px;color:var(--mut)">Sin resultados</li>';
      sel = 0; mark();
    }
    function mark() { $$('li a', pal).forEach(function (a, i) { a.classList.toggle('sel', i === sel); if (i === sel) a.scrollIntoView({ block: 'nearest' }); }); }
    function open() { if (!pal) buildPal(); pal.classList.add('on'); var i = $('input', pal); i.value = ''; render(); setTimeout(function () { i.focus(); }, 30); }
    function close() { if (pal) pal.classList.remove('on'); }
    window.KBPalette = { open: open, close: close };
    document.addEventListener('keydown', function (e) {
      var tag = (e.target.tagName || '').toLowerCase(), typing = tag === 'input' || tag === 'textarea' || tag === 'select';
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); pal && pal.classList.contains('on') ? close() : open(); }
      else if (e.key === '/' && !typing) { e.preventDefault(); open(); }
      else if (e.key === 'Escape') close();
    });
    $$('[data-pal]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); open(); }); });
  });
})();
