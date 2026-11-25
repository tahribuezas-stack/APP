/* KINET OS · utilidades comunes de herramientas. Persistencia: sessionStorage (se conserva al recargar, se borra al cerrar la pestaña). Nada va a la nube. */
window.KS = {
  get: function (k, d) { try { var v = sessionStorage.getItem('kt_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set: function (k, v) { try { sessionStorage.setItem('kt_' + k, JSON.stringify(v)); } catch (e) {} },
  del: function (k) { try { sessionStorage.removeItem('kt_' + k); } catch (e) {} },
  bind: function (ids, onchange) {
    var st = KS.get('form:' + location.pathname, {});
    ids.forEach(function (id) {
      var el = document.getElementById(id); if (!el) return;
      if (st[id] !== undefined) { if (el.type === 'checkbox') el.checked = !!st[id]; else el.value = st[id]; }
      var h = function () { var s = KS.get('form:' + location.pathname, {}); s[id] = el.type === 'checkbox' ? el.checked : el.value; KS.set('form:' + location.pathname, s); onchange && onchange(); };
      el.addEventListener('input', h); el.addEventListener('change', h);
    });
    onchange && onchange();
  },
  clear: function () { KS.del('form:' + location.pathname); }
};
