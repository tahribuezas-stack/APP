/* ==========================================================
   KINET OS · Desplegables propios (sustituyen al menú nativo del navegador)
   El menú nativo de <select> sale blanco/azul, ilegible sobre el tema oscuro
   y no se puede estilar. Este script lo reemplaza, sin cambiar el <select>
   original (sigue siendo la fuente de verdad: value, onchange, etc.).
   Se aplica a:  select.setting-select  y  select[data-kinet-select]
   Re-sincroniza solo si otro script cambia el value / las opciones.
   ========================================================== */
(function () {
  'use strict';
  var SEL = 'select.setting-select, select[data-kinet-select]';
  var openWrap = null;

  function injectStyle() {
    if (document.getElementById('kinet-select-style')) return;
    var st = document.createElement('style');
    st.id = 'kinet-select-style';
    st.textContent =
      /* respaldo si algo sigue siendo nativo: opciones oscuras */
      'select option,select optgroup{background:#0B1018;color:#F8FAFC}' +
      '.ks-wrap{position:relative;display:inline-block;min-width:190px;max-width:100%;flex-shrink:0;margin-left:auto;user-select:none;-webkit-user-select:none}' +
      '.ks-wrap.ks-block{display:block;width:100%;margin-left:0}' +
      '.ks-trigger{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;background:rgba(4,6,10,.85);border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:8px 13px;color:#F8FAFC;font-family:Inter,sans-serif;font-size:.82rem;font-weight:600;cursor:pointer;outline:none;transition:border-color .2s,box-shadow .2s,background .2s;text-align:left;min-height:38px}' +
      '.ks-trigger:hover,.ks-trigger:focus-visible,.ks-wrap.ks-open .ks-trigger{border-color:var(--role-color,#00FF88);box-shadow:0 0 14px rgba(var(--role-rgb,0,255,136),.22);background:rgba(var(--role-rgb,0,255,136),.07)}' +
      '.ks-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}' +
      '.ks-arrow{flex-shrink:0;font-size:.62rem;color:var(--role-color,#00FF88);transition:transform .25s ease}' +
      '.ks-wrap.ks-open .ks-arrow{transform:rotate(180deg)}' +
      '.ks-wrap.ks-disabled{opacity:.5;pointer-events:none}' +
      '.ks-menu{position:fixed;z-index:100000;display:none;box-sizing:border-box;background:rgba(9,13,22,.985);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid rgba(var(--role-rgb,0,255,136),.55);border-radius:13px;padding:5px;box-shadow:0 22px 48px rgba(0,0,0,.95),0 0 26px rgba(var(--role-rgb,0,255,136),.22);overflow-y:auto;overscroll-behavior:contain}' +
      '.ks-menu.ks-show{display:block;animation:ksDrop .22s cubic-bezier(.16,1,.3,1) forwards}' +
      '@keyframes ksDrop{0%{opacity:0;transform:translateY(-6px) scale(.97)}100%{opacity:1;transform:translateY(0) scale(1)}}' +
      '.ks-opt{padding:9px 12px;border-radius:9px;font-family:Inter,sans-serif;font-size:.8rem;font-weight:600;color:#CBD5E1;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:2px;transition:background .15s,color .15s,transform .15s}' +
      '.ks-opt:last-child{margin-bottom:0}' +
      '.ks-opt:hover,.ks-opt.ks-active{background:rgba(var(--role-rgb,0,255,136),.15);color:#fff;transform:translateX(2px)}' +
      '.ks-opt.ks-selected{background:var(--role-gradient,linear-gradient(135deg,#00FF88,#00cc6a));color:#04060A;font-weight:800;box-shadow:0 0 12px var(--role-glow,rgba(0,255,136,.35))}' +
      '.ks-opt.ks-disabled{opacity:.4;pointer-events:none}' +
      '@media (max-width:640px){.ks-wrap{min-width:0;width:100%;margin-left:0}.ks-opt{padding:11px 12px;font-size:.86rem}}';
    document.head.appendChild(st);
  }

  function closeMenu() {
    if (!openWrap) return;
    var m = openWrap._ksMenu;
    openWrap.classList.remove('ks-open');
    if (m) { m.classList.remove('ks-show'); }
    openWrap = null;
  }

  function place(wrap) {
    var trg = wrap._ksTrigger, menu = wrap._ksMenu;
    var r = trg.getBoundingClientRect();
    var vh = window.innerHeight, vw = window.innerWidth;
    var width = Math.max(r.width, 190);
    width = Math.min(width, vw - 16);
    var left = Math.min(Math.max(8, r.right - width), vw - width - 8);
    menu.style.width = width + 'px';
    menu.style.left = left + 'px';
    menu.style.maxHeight = '';
    var need = Math.min(menu.scrollHeight + 12, 320);
    var below = vh - r.bottom - 12, above = r.top - 12;
    if (below >= need || below >= above) {
      menu.style.top = (r.bottom + 6) + 'px'; menu.style.bottom = 'auto';
      menu.style.maxHeight = Math.max(120, Math.min(320, below)) + 'px';
    } else {
      menu.style.bottom = (vh - r.top + 6) + 'px'; menu.style.top = 'auto';
      menu.style.maxHeight = Math.max(120, Math.min(320, above)) + 'px';
    }
  }

  function sync(sel) {
    var wrap = sel._ksWrap; if (!wrap) return;
    var idx = sel.selectedIndex;
    var cur = sel.options[idx] || sel.options[0];
    wrap._ksLabel.textContent = cur ? cur.textContent : '';
    wrap.classList.toggle('ks-disabled', !!sel.disabled);
    var menu = wrap._ksMenu;
    menu.innerHTML = '';
    Array.prototype.forEach.call(sel.options, function (opt, i) {
      var d = document.createElement('div');
      d.className = 'ks-opt' + (i === idx ? ' ks-selected' : '') + (opt.disabled ? ' ks-disabled' : '');
      d.setAttribute('role', 'option');
      d.setAttribute('data-idx', i);
      d.innerHTML = '<span></span>' + (i === idx ? '<span>●</span>' : '');
      d.firstChild.textContent = opt.textContent;
      d.addEventListener('mousedown', function (e) { e.preventDefault(); });
      d.addEventListener('click', function (e) {
        e.stopPropagation();
        choose(sel, i);
      });
      menu.appendChild(d);
    });
  }

  function choose(sel, i) {
    var changed = sel.selectedIndex !== i;
    sel.selectedIndex = i;
    closeMenu();
    sync(sel);
    if (changed) sel.dispatchEvent(new Event('change', { bubbles: true }));
    if (sel._ksWrap) sel._ksWrap._ksTrigger.focus();
  }

  function openFor(sel) {
    var wrap = sel._ksWrap;
    if (openWrap && openWrap !== wrap) closeMenu();
    sync(sel);
    wrap.classList.add('ks-open');
    wrap._ksMenu.classList.add('ks-show');
    place(wrap);
    openWrap = wrap;
    var selected = wrap._ksMenu.querySelector('.ks-selected');
    if (selected && selected.scrollIntoView) { try { selected.scrollIntoView({ block: 'nearest' }); } catch (e) {} }
  }

  function enhance(sel) {
    if (sel._ksWrap || sel.multiple || sel.size > 1) return;
    var wrap = document.createElement('div');
    wrap.className = 'ks-wrap';
    var st = sel.getAttribute('style') || '';
    if (/width\s*:\s*100%/.test(st)) wrap.classList.add('ks-block');
    var trg = document.createElement('button');
    trg.type = 'button'; trg.className = 'ks-trigger';
    trg.setAttribute('aria-haspopup', 'listbox');
    trg.innerHTML = '<span class="ks-label"></span><span class="ks-arrow">▾</span>';
    var menu = document.createElement('div');
    menu.className = 'ks-menu'; menu.setAttribute('role', 'listbox');
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    wrap.appendChild(trg);
    document.body.appendChild(menu);
    sel.style.display = 'none';
    sel.setAttribute('aria-hidden', 'true'); sel.tabIndex = -1;
    wrap._ksTrigger = trg; wrap._ksMenu = menu; wrap._ksLabel = trg.firstChild;
    sel._ksWrap = wrap;
    menu._ksSel = sel;

    trg.addEventListener('click', function (e) {
      e.stopPropagation();
      if (wrap.classList.contains('ks-open')) closeMenu(); else openFor(sel);
    });
    trg.addEventListener('keydown', function (e) {
      var k = e.key, n = sel.options.length;
      if (k === 'Escape') { closeMenu(); return; }
      if (k === 'ArrowDown' || k === 'ArrowUp') {
        e.preventDefault();
        var step = k === 'ArrowDown' ? 1 : -1, i = sel.selectedIndex;
        if (!wrap.classList.contains('ks-open')) { openFor(sel); return; }
        i = Math.min(n - 1, Math.max(0, i + step));
        sel.selectedIndex = i; sync(sel);
        var el = menu.querySelector('.ks-selected'); if (el && el.scrollIntoView) { try { el.scrollIntoView({ block: 'nearest' }); } catch (x) {} }
      } else if (k === 'Enter' || k === ' ') {
        e.preventDefault();
        if (wrap.classList.contains('ks-open')) { closeMenu(); sel.dispatchEvent(new Event('change', { bubbles: true })); }
        else openFor(sel);
      }
    });

    // Si otro script cambia value / selectedIndex del <select>, el desplegable se actualiza
    ['value', 'selectedIndex'].forEach(function (prop) {
      var d = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, prop);
      if (!d || !d.set) return;
      try {
        Object.defineProperty(sel, prop, {
          configurable: true,
          get: function () { return d.get.call(this); },
          set: function (v) { d.set.call(this, v); sync(this); }
        });
      } catch (e) {}
    });
    // opciones añadidas/quitadas/seleccionadas por script
    if (window.MutationObserver) {
      new MutationObserver(function () { sync(sel); }).observe(sel, { childList: true, subtree: true, attributes: true, attributeFilter: ['selected', 'disabled'] });
    }
    sel.addEventListener('change', function () { sync(sel); });
    sync(sel);
  }

  function scan(root) {
    injectStyle();
    (root || document).querySelectorAll(SEL).forEach(enhance);
  }

  document.addEventListener('click', function (e) {
    if (openWrap && !openWrap.contains(e.target) && !(openWrap._ksMenu && openWrap._ksMenu.contains(e.target))) closeMenu();
  });
  window.addEventListener('resize', closeMenu);
  window.addEventListener('scroll', function (e) {
    if (openWrap && !(openWrap._ksMenu && openWrap._ksMenu.contains(e.target))) closeMenu();
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  function init() {
    scan(document);
    // selects que aparezcan después (modales, paneles dinámicos)
    if (window.MutationObserver) {
      var pend = false;
      new MutationObserver(function () {
        if (pend) return; pend = true;
        (window.requestAnimationFrame || setTimeout)(function () { pend = false; scan(document); });
      }).observe(document.body, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.KinetSelect = { scan: scan, close: closeMenu, refresh: function (sel) { if (sel && sel._ksWrap) sync(sel); } };
})();
