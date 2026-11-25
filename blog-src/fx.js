/* KINET OS · efectos comunes (blog, herramientas, juegos). Sin dependencias.
   - Luz que sigue al cursor (página + tarjetas). Sin cursor: la luz de las tarjetas deriva sola y sigue al dedo.
   - Titulares palabra a palabra y títulos de sección que aparecen al entrar en pantalla.
   - Entrada de página suave cuando no llegas con el salto espacial. */
(function () {
  'use strict';
  var RM = false, FINE = false, H = document.documentElement;
  /* animaciones siempre activas (ver nota en nav.js) */
  try { FINE = matchMedia('(hover:hover) and (pointer:fine)').matches; } catch (e) {}
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* entrada: solo si no llega el salto espacial (esa animación ya aterriza la página) */
  if (!RM && !H.classList.contains('kb-arriving')) { H.classList.add('fx-enter'); setTimeout(function () { H.classList.remove('fx-enter'); }, 1400); }

  /* titulares palabra a palabra */
  function split(el) {
    var i = 0;
    (function walk(n) {
      [].slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var parts = c.nodeValue.split(/(\s+)/), f = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { f.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'), s = document.createElement('i'); w.className = 'fx-w'; s.style.setProperty('--i', Math.min(i++, 14)); s.textContent = p; w.appendChild(s); f.appendChild(w);
          });
          c.parentNode.replaceChild(f, c);
        } else if (c.nodeType === 1 && !/^(SCRIPT|STYLE|SVG|BR)$/i.test(c.tagName)) walk(c);
      });
    })(el);
  }
  function boot() {
    if (!RM) {
      $$('main h1').slice(0, 3).forEach(function (h) {
        if (h.dataset.fx) return; h.dataset.fx = 1; var lab = h.textContent.trim(); h.setAttribute('aria-label', lab); split(h); h.classList.add('fx-split');
        requestAnimationFrame(function () { requestAnimationFrame(function () { h.classList.add('fx-go'); }); });
        setTimeout(function () { h.classList.add('fx-done'); }, 1900);
      });
      /* títulos de sección y textos de apoyo */
      var rv = $$('main h2, main .lead, .kg-how li, .foot h4').filter(function (e) { return !e.closest('.kbn-stage,.fx-split'); });
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('fx-in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
        rv.forEach(function (el, i) { el.classList.add('fx-rv'); el.style.setProperty('--fxd2', (el.matches('li') ? (i % 4) * .07 : 0) + 's'); io.observe(el); });
      }
    }
    /* luz de tarjetas */
    var SEL = 'a.card,.tool,.cta,.stat,.note,.kh-info,.kh-c,.dk,.fc,.kg-how,.pn a,.related a.card,.cards .card' + (window.KB_FX_SEL ? ',' + window.KB_FX_SEL : '');
    var targets = [];
    function arm(el) {
      if (el.dataset.fxl) return; el.dataset.fxl = 1;
      var cs = getComputedStyle(el); if (cs.position === 'static') el.classList.add('fx-t'); else el.classList.add('fx-t');
      var g = document.createElement('i'); g.className = 'fx-gl'; g.setAttribute('aria-hidden', 'true'); el.appendChild(g);
      var acc = cs.getPropertyValue('--acc') || cs.getPropertyValue('--c') || cs.getPropertyValue('--kc'); if (acc && acc.trim()) el.style.setProperty('--fxa', acc.trim());
      el.style.setProperty('--fxd', (-(targets.length % 7) * .9).toFixed(1) + 's'); targets.push(el);
    }
    function scan() { $$(SEL).forEach(function (el) { if (!el.closest('.kbn-stage') || el.matches('.dk,.fc')) arm(el); }); }
    scan(); [600, 1800].forEach(function (d) { setTimeout(scan, d); });
    if ('MutationObserver' in window) { var mt = 0; new MutationObserver(function () { clearTimeout(mt); mt = setTimeout(scan, 250); }).observe(document.querySelector('main') || document.body, { childList: true, subtree: true }); }

    if (FINE && !RM) {
      var cur = document.createElement('div'); cur.className = 'fx-cur'; cur.setAttribute('aria-hidden', 'true'); document.body.appendChild(cur);
      var px = 0, py = 0, raf = 0, lastEl = null;
      addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return; px = e.clientX; py = e.clientY;
        if (!raf) raf = requestAnimationFrame(function () {
          raf = 0; cur.style.transform = 'translate3d(' + px + 'px,' + py + 'px,0)'; cur.classList.add('on');
          var t = document.elementFromPoint(px, py), c = t && t.closest && t.closest('.fx-t');
          if (c !== lastEl) { if (lastEl) lastEl.classList.remove('fx-hot'); lastEl = c; var a = c && c.style.getPropertyValue('--fxa'); cur.style.setProperty('--fxc', a ? a.trim() : '#00FF88'); }
          if (c) { var r = c.getBoundingClientRect(); c.style.setProperty('--sx', (px - r.left).toFixed(0) + 'px'); c.style.setProperty('--sy', (py - r.top).toFixed(0) + 'px'); }
        });
      }, { passive: true });
      document.addEventListener('pointerleave', function () { cur.classList.remove('on'); });
    } else if (!RM) {
      if ('IntersectionObserver' in window) {
        var vio = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('fx-vis', e.isIntersecting); }); }, { threshold: .15 });
        var obs = function () { targets.forEach(function (t) { if (!t._fxo) { t._fxo = 1; vio.observe(t); } }); }; obs(); setInterval(obs, 1500);
      }
      addEventListener('pointerdown', function (e) {
        var c = e.target.closest && e.target.closest('.fx-t'); if (!c) return; var r = c.getBoundingClientRect();
        c.style.setProperty('--sx', (e.clientX - r.left).toFixed(0) + 'px'); c.style.setProperty('--sy', (e.clientY - r.top).toFixed(0) + 'px'); c.classList.add('fx-touch');
        clearTimeout(c._ft); c._ft = setTimeout(function () { c.classList.remove('fx-touch'); }, 1100);
      }, { passive: true });
    }

    /* desplazamiento suave con inercia para la rueda del ratón (el touchpad y el táctil ya son suaves) */
    if (FINE) {
      var tgt = null, sc = 0, sraf = 0;
      var tick = function () {
        sc += (tgt - sc) * .13;
        if (Math.abs(tgt - sc) < .6) { sc = tgt; window.scrollTo({ top: sc, behavior: 'instant' }); sraf = 0; tgt = null; return; }
        window.scrollTo({ top: sc, behavior: 'instant' }); sraf = requestAnimationFrame(tick);
      };
      addEventListener('wheel', function (e) {
        if (e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
        if (e.deltaMode === 0 && Math.abs(e.deltaY) < 40) return;
        for (var el = e.target; el && el !== document.body && el.nodeType === 1; el = el.parentElement) {
          if (el.scrollHeight > el.clientHeight + 2) { var oy = getComputedStyle(el).overflowY; if (oy === 'auto' || oy === 'scroll') return; }
        }
        var dy = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY, max = H.scrollHeight - innerHeight;
        if (max <= 0) return; e.preventDefault();
        if (tgt === null) { sc = window.scrollY; tgt = sc; }
        tgt = Math.max(0, Math.min(max, tgt + dy * 1.1)); if (!sraf) sraf = requestAnimationFrame(tick);
      }, { passive: false });
      addEventListener('scroll', function () { if (!sraf) tgt = null; }, { passive: true });
    }
  }
  if (document.body) boot(); else document.addEventListener('DOMContentLoaded', boot);
})();
