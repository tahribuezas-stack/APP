/* KINET · guarda de sesión mínima (cliente) + REGLAS DE MENORES.
   Ojo: la guarda es solo UX. La seguridad real está en Supabase (RLS, triggers y Edge Functions: ver /supabase). */
(function () {
  var ls;
  try { ls = localStorage; } catch (e) { return; }
  try {
    var q = new URLSearchParams(location.search);
    var ok = ls.getItem('kinet_logged_in') === 'true' || !!ls.getItem('kinet_user_id') ||
      ls.getItem('kinet_is_guest') === 'true' || ls.getItem('kinet_guest_session') === 'true' ||
      ls.getItem('kinet_mode') === 'guest' || q.get('guest') === 'true';
    if (!ok) { location.replace('login.html'); return; }
  } catch (e) {}

  /* ------------------------------------------------------------------------------------------
     MENORES DE EDAD (< 18).  Edad mínima de la plataforma: 14 años (art. 7 LOPDGDD).
     Esto aplica automáticamente lo que prometen las Condiciones (legal.html §6):
       · cuenta privada, fuera de KINET Radar y sin ciudad ni club visibles;
       · sin uso de datos anonimizados ni publicidad personalizada;
       · sin mensajes directos de adultos (el servidor lo impide: supabase/04_menores.sql);
       · pagos solo con autorización expresa del tutor;
       · la IA no recomienda suplementos, cargas máximas ni control de peso.
     ------------------------------------------------------------------------------------------ */
  function g(k) { try { return ls.getItem(k) || ''; } catch (e) { return ''; } }
  function ageFrom(d) {
    if (!d) return null; var b = new Date(d); if (isNaN(b)) return null;
    var n = new Date(), a = n.getFullYear() - b.getFullYear(), m = n.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && n.getDate() < b.getDate())) a--; return a;
  }
  function currentAge() {
    var a = ageFrom(g('kinet_user_birthdate') || g('kinet_birth_date'));
    if (a === null) { var n = parseInt(g('kinet_age_years_direct') || g('kinet_age') || '', 10); if (n > 0 && n < 110) a = n; }
    if (a === null) { try { var c = JSON.parse(g('kinet_consents') || 'null'); if (c && c.minor === true) a = 17; } catch (e) {} }
    return a;
  }
  var Minors = {
    age: currentAge,
    isMinor: function () { var a = currentAge(); return a !== null && a < 18; },
    isUnder14: function () { var a = currentAge(); return a !== null && a < 14; },
    // Ajustes que un menor NO puede desactivar
    enforce: function () {
      if (!Minors.isMinor()) return false;
      var set = function (k, v) { try { if (ls.getItem(k) !== v) ls.setItem(k, v); } catch (e) {} };
      set('kinet_minor_protection', 'true');
      set('kinet_private_account', 'true');
      set('kinet_market_open', 'false');
      set('kinet_open_to_offers', 'false');
      set('kinet_anon_data', 'false');
      set('kinet_hide_city_club', 'true');
      set('kinet_personalized_ads', 'false');
      return true;
    },
    // Aviso estándar cuando un menor intenta saltarse una protección
    blockedNotice: function (what) {
      Minors.notice('🛡️ Protección de menores', (what || 'Esta opción') + ' está desactivada en cuentas de menores de 18 años para protegerte. Cuando cumplas 18 podrás cambiarla.');
    },
    notice: function (title, html) {
      try {
        var old = document.getElementById('kinet-minor-notice'); if (old) old.remove();
        var d = document.createElement('div'); d.id = 'kinet-minor-notice'; d.setAttribute('role', 'alertdialog');
        d.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;background:rgba(2,4,8,.72);padding:16px;font-family:Inter,system-ui,sans-serif';
        d.innerHTML = '<div style="max-width:420px;width:100%;background:#0B0F16;border:1px solid #F59E0B;border-radius:16px;padding:18px;color:#E2E8F0;box-shadow:0 0 30px rgba(245,158,11,.2)"><div style="font:800 12px/1.2 monospace;letter-spacing:.08em;color:#F59E0B;text-transform:uppercase;margin-bottom:8px">' + title + '</div><div style="font-size:13px;line-height:1.5">' + html + '</div><button type="button" style="margin-top:14px;width:100%;padding:10px;border-radius:10px;border:0;background:#F59E0B;color:#04060A;font-weight:800;cursor:pointer">Entendido</button></div>';
        d.querySelector('button').onclick = function () { d.remove(); };
        (document.body || document.documentElement).appendChild(d);
      } catch (e) {}
    },
    // Pago de un menor: solo con autorización expresa del tutor (Promise<boolean>)
    guardianPaymentGate: function () {
      return new Promise(function (resolve) {
        if (!Minors.isMinor()) return resolve(true);
        var d = document.createElement('div'); d.style.cssText = 'position:fixed;inset:0;z-index:100001;display:flex;align-items:center;justify-content:center;background:rgba(2,4,8,.78);padding:16px;font-family:Inter,system-ui,sans-serif';
        d.innerHTML = '<div style="max-width:440px;width:100%;background:#0B0F16;border:1px solid #F59E0B;border-radius:16px;padding:18px;color:#E2E8F0">' +
          '<div style="font:800 12px monospace;letter-spacing:.08em;color:#F59E0B;text-transform:uppercase;margin-bottom:8px">🛡️ Pago de un menor de edad</div>' +
          '<p style="font-size:13px;line-height:1.5;margin:0 0 10px">Tienes menos de 18 años. Las suscripciones y bonos solo pueden contratarse con <strong>la autorización expresa de tu madre, padre o tutor legal y con su tarjeta</strong>.</p>' +
          '<label style="display:flex;gap:8px;align-items:flex-start;font-size:12px;line-height:1.4;cursor:pointer"><input type="checkbox" id="kg-ok" style="margin-top:2px"> <span>Soy el padre, madre o tutor legal y <strong>autorizo este pago</strong> con mi tarjeta.</span></label>' +
          '<div style="display:flex;gap:8px;margin-top:14px"><button type="button" id="kg-no" style="flex:1;padding:10px;border-radius:10px;border:1px solid #334155;background:transparent;color:#E2E8F0;cursor:pointer">Cancelar</button><button type="button" id="kg-yes" style="flex:1;padding:10px;border-radius:10px;border:0;background:#F59E0B;color:#04060A;font-weight:800;cursor:pointer">Continuar</button></div></div>';
        document.body.appendChild(d);
        d.querySelector('#kg-no').onclick = function () { d.remove(); resolve(false); };
        d.querySelector('#kg-yes').onclick = function () { if (!d.querySelector('#kg-ok').checked) return; d.remove(); resolve(true); };
      });
    }
  };
  window.KinetMinors = Minors;
  try { Minors.enforce(); } catch (e) {}

  /* ------------------------------------------------------------------------------------------
     PUERTA DE EDAD + CONSENTIMIENTOS para quien entra con Google (o es anterior a las casillas).
     ------------------------------------------------------------------------------------------ */
  function needsGate() {
    if (window.top !== window) return false;   // dentro del tutorial (iframe) no se pregunta
    if (g('kinet_is_guest') === 'true' || g('kinet_guest_session') === 'true' || g('kinet_mode') === 'guest') return false;
    if (!(g('kinet_logged_in') === 'true' || g('kinet_user_id'))) return false;
    // Ya confirmado alguna vez en este dispositivo para esta cuenta (clave fuera de la sincronización: nada la borra)
    if (g('kx_age_ok') && g('kx_age_ok') === (g('kinet_user_id') || 'x')) return false;
    try { var c = JSON.parse(g('kinet_consents') || 'null'); if (c && c.terms && c.age14 && (g('kinet_user_birthdate') || g('kinet_birth_date'))) { markAgeOk(); return false; } } catch (e) {}
    return true;
  }
  function markAgeOk() { try { ls.setItem('kx_age_ok', g('kinet_user_id') || 'x'); } catch (e) {} }
  // ¿La cuenta ya dio edad y consentimientos al registrarse (o en otro dispositivo)? Se mira en los datos de la cuenta antes de preguntar.
  function restoreFromAccount() {
    return new Promise(function (resolve) {
      try {
        var sb = window.KinetBackend && KinetBackend.getClient && KinetBackend.getClient();
        if (!sb || !sb.auth || !sb.auth.getSession) return resolve(false);
        sb.auth.getSession().then(function (r) {
          var u = r && r.data && r.data.session && r.data.session.user, m = (u && u.user_metadata) || {};
          var bd = m.birth_date || m.birthdate || '', c = m.consents;
          if (bd && c && c.terms && c.age14) {
            try { ls.setItem('kinet_user_birthdate', bd); ls.setItem('kinet_birth_date', bd); ls.setItem('kinet_consents', JSON.stringify(c)); } catch (e) {}
            markAgeOk(); try { Minors.enforce(); } catch (e) {} return resolve(true);
          }
          resolve(false);
        }).catch(function () { resolve(false); });
      } catch (e) { resolve(false); }
    });
  }
  function openGate() {
    if (document.getElementById('kinet-age-gate')) return;
    var d = document.createElement('div'); d.id = 'kinet-age-gate';
    d.style.cssText = 'position:fixed;inset:0;z-index:100002;overflow:auto;background:rgba(2,4,8,.92);display:flex;align-items:flex-start;justify-content:center;padding:18px;font-family:Inter,system-ui,sans-serif';
    var inp = 'width:100%;box-sizing:border-box;background:#12161C;border:1px solid #1E293B;border-radius:10px;padding:9px 11px;color:#fff;font-size:13px';
    var chk = 'display:flex;gap:8px;align-items:flex-start;font-size:12px;line-height:1.4;color:#CBD5E1;cursor:pointer;margin-top:8px';
    d.innerHTML = '<div style="margin:auto;max-width:460px;width:100%;background:#0B0F16;border:1px solid #00FF88;border-radius:18px;padding:20px;color:#E2E8F0">' +
      '<div style="font:800 12px monospace;letter-spacing:.08em;color:#00FF88;text-transform:uppercase">Un último paso</div>' +
      '<h2 style="font:800 18px Orbitron,Inter,sans-serif;margin:6px 0 8px;color:#fff">Confirma tu edad y las condiciones</h2>' +
      '<p style="font-size:12px;line-height:1.5;margin:0 0 12px;color:#94A3B8">Necesitamos tu fecha de nacimiento para proteger a los menores y cumplir la ley. Solo tardas medio minuto.</p>' +
      '<label style="font-size:11px;color:#94A3B8">Fecha de nacimiento</label><input type="date" id="ag-birth" style="' + inp + '">' +
      '<div id="ag-guardian" style="display:none;margin-top:10px;border:1px solid rgba(245,158,11,.4);border-radius:12px;padding:10px;background:rgba(245,158,11,.05)"><div style="font:700 10px monospace;color:#F59E0B;text-transform:uppercase;margin-bottom:6px">Menor de 18 años · autorización de madre, padre o tutor</div>' +
        '<label style="' + chk + ';margin-top:0"><input type="checkbox" id="ag-gok" style="margin-top:2px"> <span>Mi madre, padre o tutor legal ha leído y autoriza las Condiciones y la Política de privacidad.</span></label>' +
        '<input type="text" id="ag-gname" placeholder="Nombre del tutor/a" style="' + inp + ';margin-top:8px"><input type="email" id="ag-gmail" placeholder="Correo del tutor/a" style="' + inp + ';margin-top:6px"></div>' +
      '<label style="' + chk + '"><input type="checkbox" id="ag-terms" style="margin-top:2px"> <span>He leído y acepto las <a href="condiciones.html" target="_blank" style="color:#00FF88">Condiciones de uso</a> y la <a href="privacidad.html" target="_blank" style="color:#00FF88">Política de privacidad</a>.</span></label>' +
      '<label style="' + chk + '"><input type="checkbox" id="ag-ai" style="margin-top:2px"> <span>Entiendo que la IA ofrece orientación deportiva, no diagnóstico médico, y acepto el tratamiento de mis datos de salud para personalizarla.</span></label>' +
      '<label style="' + chk + '"><input type="checkbox" id="ag-age" style="margin-top:2px"> <span>Confirmo que tengo 14 años o más.</span></label>' +
      '<div id="ag-err" style="color:#F87171;font-size:12px;min-height:16px;margin-top:8px"></div>' +
      '<button type="button" id="ag-go" style="width:100%;margin-top:6px;padding:11px;border-radius:12px;border:0;background:#00FF88;color:#04060A;font-weight:800;cursor:pointer">Continuar</button>' +
      '<button type="button" id="ag-out" style="width:100%;margin-top:8px;padding:9px;border-radius:12px;border:1px solid #334155;background:transparent;color:#94A3B8;cursor:pointer;font-size:12px">Cerrar sesión</button></div>';
    document.body.appendChild(d);
    var $ = function (id) { return d.querySelector('#' + id); };
    var pre = g('kinet_user_birthdate') || g('kinet_birth_date'); if (pre) $('ag-birth').value = pre;
    $('ag-birth').max = new Date().toISOString().slice(0, 10);
    var upd = function () { var a = ageFrom($('ag-birth').value); $('ag-guardian').style.display = (a !== null && a >= 0 && a < 18) ? 'block' : 'none'; };
    $('ag-birth').addEventListener('input', upd); $('ag-birth').addEventListener('change', upd); upd();
    $('ag-out').onclick = function () {
      try { if (window.KinetBackend && KinetBackend.logoutUser) { KinetBackend.logoutUser().then(function () { location.href = 'login.html'; }); return; } } catch (e) {}
      location.href = 'login.html';
    };
    $('ag-go').onclick = function () {
      var err = function (t) { $('ag-err').textContent = t; };
      var bd = $('ag-birth').value, a = ageFrom(bd);
      if (a === null || a < 0 || a > 110) return err('Revisa tu fecha de nacimiento.');
      if (a < 14) return err('Para usar KINET OS necesitas tener 14 años o más. Pide a tu familia que te acompañe cuando los cumplas.');
      if (!$('ag-terms').checked) return err('Debes aceptar las Condiciones y la Política de privacidad.');
      if (!$('ag-ai').checked) return err('Debes aceptar el aviso sobre la IA y los datos de salud.');
      if (!$('ag-age').checked) return err('Confirma que tienes 14 años o más.');
      var guardian = null;
      if (a < 18) {
        var gn = $('ag-gname').value.trim(), gm = $('ag-gmail').value.trim();
        if (!$('ag-gok').checked || gn.length < 3 || !/^\S+@\S+\.\S+$/.test(gm)) return err('Por ser menor de 18 años necesitamos la autorización de tu tutor: marca la casilla e indica su nombre y correo.');
        guardian = { name: gn, email: gm };
      }
      var consents = { terms: true, privacy: true, ai_health: true, age14: true, minor: a < 18, guardian: guardian, anon_data: false, marketing: false, version: '2026-11', ts: new Date().toISOString(), via: 'age-gate' };
      try { ls.setItem('kinet_user_birthdate', bd); ls.setItem('kinet_birth_date', bd); ls.setItem('kinet_consents', JSON.stringify(consents)); } catch (e) {}
      try {
        var sb = window.KinetBackend && KinetBackend.getClient && KinetBackend.getClient();
        if (sb && sb.auth && sb.auth.updateUser) sb.auth.updateUser({ data: { consents: consents, birthdate: bd } });
        if (window.KinetBackend && KinetBackend.pushLocalStateToCloud) KinetBackend.pushLocalStateToCloud();
      } catch (e) {}
      markAgeOk(); Minors.enforce();
      d.remove();
    };
  }
  // Verificación del tutor por correo (solo si el equipo ha desplegado supabase/functions/guardian-consent y activado KINET_API_CONFIG.guardianVerification)
  function requestGuardianEmail() {
    try {
      var cfg = window.KINET_API_CONFIG || {};
      if (cfg.guardianVerification !== true || window.top !== window) return;
      var c = JSON.parse(g('kinet_consents') || 'null');
      if (!c || !c.minor || !c.guardian || !c.guardian.email) return;
      if (g('kinet_guardian_requested') === c.guardian.email) return;
      var sb = window.KinetBackend && KinetBackend.getClient && KinetBackend.getClient();
      if (!sb) return;
      sb.auth.getSession().then(function (r) {
        var tk = r && r.data && r.data.session && r.data.session.access_token; if (!tk) return;
        fetch((cfg.SUPABASE_URL || '') + '/functions/v1/guardian-consent', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tk, apikey: (sb.supabaseKey || '') }, body: JSON.stringify({ guardianEmail: c.guardian.email, guardianName: c.guardian.name }) })
          .then(function (x) { if (x.ok) ls.setItem('kinet_guardian_requested', c.guardian.email); }).catch(function () {});
      });
    } catch (e) {}
  }
  setTimeout(requestGuardianEmail, 5000);

  function startGate() {
    if (!needsGate()) return;
    // Espera un momento a que la sincronización de la nube traiga sus consentimientos (otro dispositivo)
    var done = false, go = function () {
      if (done) return; done = true;
      if (!needsGate()) return;
      restoreFromAccount().then(function (ok) { if (!ok && needsGate()) openGate(); });
    };
    // Si la sincronización trae los consentimientos mientras el aviso está abierto, se cierra solo
    window.addEventListener('kinet:cloud-synced', function () {
      setTimeout(function () {
        Minors.enforce();
        if (!needsGate()) { var o = document.getElementById('kinet-age-gate'); if (o) o.remove(); }
        go();
      }, 200);
    });
    setTimeout(go, 6000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startGate); else startGate();
})();
