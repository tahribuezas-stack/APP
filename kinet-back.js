/* KINET OS · "Volver" a Gestión.
   Si llegas a Estado / Perfil / Despacho desde Gestión, los botones de volver y el logo te devuelven a Gestión (a la sección en la que estabas).
   Si llegas desde la app normal, no cambia nada. */
(function () {
  'use strict';
  var KEY = 'kinet_from_gestion';
  var TARGETS = /(^|\/)(estado|perfil|despacho)\.html/;
  var onGestion = /(^|\/)gestion\.html$/.test(location.pathname);
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function section() { try { return localStorage.getItem('kinet_last_gestion') || 'resumen'; } catch (e) { return 'resumen'; } }
  function dest() { return 'gestion.html#' + section(); }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href') || '';
    if (onGestion) {
      if (TARGETS.test(h) && !/[?&]from=gestion/.test(h)) {
        ss(KEY, '1');
        a.setAttribute('href', h + (h.indexOf('?') > -1 ? '&' : '?') + 'from=gestion'); // por si se abre en otra pestaña
      }
      return;
    }
    // Navegar a otra pantalla que no es de esta familia = ya no vienes de Gestión
    if (!TARGETS.test(h) && !/gestion\.html/.test(h) && h.charAt(0) !== '#' && !/^javascript:/i.test(h)) ss(KEY, null);
  }, true);

  if (onGestion) { try { if (/[?&]from=gestion/.test(location.search)) history.replaceState(null, '', location.pathname + location.hash); } catch (e) {} ss(KEY, null); return; }

  if (/[?&]from=gestion/.test(location.search)) ss(KEY, '1');
  function apply() {
    if (ss(KEY) !== '1') return;
    var d = dest();
    // Estado del servicio
    var b = document.querySelector('.top a.back'); if (b) b.setAttribute('href', d);
    // Perfil / Despacho: logo de la barra y de móvil
    ['brand-logo-desktop', 'brand-logo-mobile'].forEach(function (id) { var el = document.getElementById(id); if (el) el.setAttribute('href', d); });
    // Perfil / Despacho: acceso "Volver a Gestión" en el menú, con el mismo estilo que el resto
    var nav = document.querySelector('.sidebar-nav');
    if (nav && !document.getElementById('kb-back')) {
      var l = document.createElement('a'); l.id = 'kb-back'; l.className = 'side-link'; l.href = d;
      l.innerHTML = '<span class="side-link-left"><span>←</span> <span>Volver a Gestión</span></span><span style="font-size:.7rem;opacity:.5;">→</span>';
      nav.insertBefore(l, nav.firstChild);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
  window.addEventListener('load', apply); // por si kinet-gestion.js reconstruye el menú
})();
