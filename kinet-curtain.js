/* KINET · Cortina de transición táctica 3D (solo dentro del cuadro de contenido).
   API: KinetCurtain.fill(opts) · .show(opts) · .hide() · opts = { icon, title, sub } */
(function () {
    'use strict';
    var T0 = (window.performance && performance.now) ? performance.now() : 0;
    var MIN_SHOW_MS = 950;      // la cortina de llegada se ve como mínimo este tiempo
    var FAILSAFE_MS = 5000;     // si algo falla, nunca se queda pegada
    var leaveTimer = null;

    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

    function markup(o) {
        o = o || {};
        return '' +
            '<div class="kc-grid"></div><div class="kc-scan"></div>' +
            '<i class="kc-corner tl"></i><i class="kc-corner tr"></i><i class="kc-corner bl"></i><i class="kc-corner br"></i>' +
            '<div class="kc-stage">' +
              '<div class="kc-scene">' +
                '<div class="kc-pitch">' +
                  '<i class="kc-ln mid"></i><i class="kc-ln circ"></i><i class="kc-ln boxl"></i><i class="kc-ln boxr"></i>' +
                  '<svg class="kc-route" viewBox="0 0 260 150" aria-hidden="true"><path d="M40 75 L100 32 L150 108 L214 62 L40 75"/></svg>' +
                  '<b class="kc-dot d1" style="left:40px;top:75px"></b>' +
                  '<b class="kc-dot d2" style="left:100px;top:32px"></b>' +
                  '<b class="kc-dot d3" style="left:150px;top:108px"></b>' +
                  '<b class="kc-dot d4" style="left:214px;top:62px"></b>' +
                  '<b class="kc-dot rv" style="left:78px;top:98px"></b>' +
                  '<b class="kc-dot rv" style="left:128px;top:52px"></b>' +
                  '<b class="kc-dot rv" style="left:186px;top:100px"></b>' +
                  '<div class="kc-ballw"><span class="kc-ballsh"></span><span class="kc-ball"></span></div>' +
                '</div>' +
                '<div class="kc-glow"></div><div class="kc-float-sh"></div>' +
                '<div class="kc-float"><div class="kc-coin" id="curtain-icon">' + esc(o.icon || '📋') + '</div></div>' +
              '</div>' +
              '<div class="kc-title" id="curtain-title">' + esc(o.title || '') + '</div>' +
              '<div class="kc-sub" id="curtain-sub">' + esc(o.sub || '') + '</div>' +
              '<div class="kc-bar"><i></i></div>' +
            '</div>';
    }

    function host() { return document.querySelector('.os-main') || document.body; }

    function bindTilt(el) {
        if (el.__kcTilt) return; el.__kcTilt = true;
        var raf = 0;
        el.addEventListener('pointermove', function (e) {
            if (raf) return;
            raf = requestAnimationFrame(function () {
                raf = 0;
                var r = el.getBoundingClientRect();
                var nx = ((e.clientX - r.left) / r.width - .5) * 2;
                var ny = ((e.clientY - r.top) / r.height - .5) * 2;
                el.style.setProperty('--kcry', (nx * 9).toFixed(2) + 'deg');
                el.style.setProperty('--kcrx', (-ny * 7).toFixed(2) + 'deg');
            });
        });
    }

    function ensure() {
        var el = document.getElementById('kinet-funny-curtain');
        if (!el) {
            el = document.createElement('div');
            el.id = 'kinet-funny-curtain';
            el.className = 'kc';
            el.innerHTML = markup();
            host().appendChild(el);
        } else if (!el.classList.contains('kc')) {
            el.className = 'kc';
        }
        if (!el.querySelector('.kc-stage')) el.innerHTML = markup();
        // dentro del cuadro de contenido, no a pantalla completa
        var h = document.querySelector('.os-main');
        if (h && el.parentNode !== h) h.appendChild(el);
        el.onclick = function () { KC.hide(true); };
        bindTilt(el);
        return el;
    }

    function setText(el, o) {
        o = o || {};
        var t = el.querySelector('#curtain-title'), s = el.querySelector('#curtain-sub'), i = el.querySelector('#curtain-icon');
        if (t && o.title != null) t.textContent = o.title;
        if (s && o.sub != null) s.textContent = o.sub;
        if (i && o.icon) i.textContent = o.icon;
    }

    // Continuidad entre páginas: la cortina de salida anota la hora; la de llegada
    // adelanta todas sus animaciones ese tiempo, así NO se reinicia ni se corta.
    var STAMP = 'kinet_curtain_t';
    function stamp(o) {
        var c = '', rgb = '';
        try { var cs = getComputedStyle(document.body); c = cs.getPropertyValue('--role-color').trim(); rgb = cs.getPropertyValue('--role-rgb').trim(); } catch (e) {}
        try { sessionStorage.setItem(STAMP, JSON.stringify({ t: Date.now(), o: o || {}, c: c, rgb: rgb })); } catch (e) {}
    }
    function peek() {
        try {
            var r = JSON.parse(sessionStorage.getItem(STAMP) || 'null');
            if (r && r.t && Date.now() - r.t >= 0 && Date.now() - r.t <= 4500) return r;
        } catch (e) {}
        return null;
    }
    function resume(el) {
        var r = peek(), t = r ? r.t : 0;
        try { sessionStorage.removeItem(STAMP); } catch (e) {}
        var dt = Date.now() - t;
        if (!t) return;
        try {
            void el.offsetWidth;
            el.getAnimations({ subtree: true }).forEach(function (a) {
                try { a.currentTime = dt; } catch (e) {}
            });
        } catch (e) {}
    }

    var KC = {
        markup: markup,
        // Cortina ya visible al cargar la página (llamar justo después del <div id="kinet-funny-curtain">)
        fill: function (o) {
            var el = document.getElementById('kinet-funny-curtain');
            if (!el) return;
            el.className = 'kc kc-on';
            var prev = peek();
            // mismo mensaje que mostró la página anterior: la cortina continúa, no se "repite" con otro texto
            if (prev && prev.o && (prev.o.title || prev.o.sub)) o = prev.o;
            el.innerHTML = markup(o);
            // mismo color de rol que la página anterior (si no, parpadea verde→ámbar al cargar)
            if (prev && prev.c) { el.style.setProperty('--role-color', prev.c); if (prev.rgb) el.style.setProperty('--role-rgb', prev.rgb); }
            resume(el);
            el.onclick = function () { KC.hide(true); };
            bindTilt(el);
            document.addEventListener('DOMContentLoaded', function () {
                ensure();
                setTimeout(function () { KC.hide(true); }, FAILSAFE_MS);
            });
        },
        show: function (o) {
            var el = ensure();
            clearTimeout(leaveTimer);
            setText(el, o);
            el.classList.remove('curtain-hidden', 'kc-leaving', 'curtain-exit-active');
            el.classList.remove('kc-on'); void el.offsetWidth; el.classList.add('kc-on');
            stamp(o);
            return el;
        },
        hide: function (force) {
            var el = document.getElementById('kinet-funny-curtain');
            if (!el || el.classList.contains('curtain-hidden')) return;
            var wait = 0;
            if (!force && window.performance && performance.now) wait = Math.max(0, MIN_SHOW_MS - (performance.now() - T0));
            clearTimeout(leaveTimer);
            leaveTimer = setTimeout(function () {
                el.classList.remove('curtain-exit-active');
                el.classList.add('kc-leaving');
                leaveTimer = setTimeout(function () {
                    el.classList.add('curtain-hidden');
                    el.classList.remove('kc-on', 'kc-leaving');
                    el.style.removeProperty('--role-color'); el.style.removeProperty('--role-rgb');
                }, 430);
            }, wait);
        }
    };
    window.KinetCurtain = KC;
})();
