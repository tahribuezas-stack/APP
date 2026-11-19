/* KINET · guarda de sesión mínima (cliente). Redirige a login si no hay sesión ni modo invitado.
   Ojo: es solo UX. La seguridad real debe estar en Supabase (RLS). */
(function () {
  try {
    var ls = localStorage, q = new URLSearchParams(location.search);
    var ok = ls.getItem('kinet_logged_in') === 'true' || !!ls.getItem('kinet_user_id') ||
      ls.getItem('kinet_is_guest') === 'true' || ls.getItem('kinet_guest_session') === 'true' ||
      ls.getItem('kinet_mode') === 'guest' || q.get('guest') === 'true';
    if (!ok) location.replace('login.html');
  } catch (e) {}
})();
