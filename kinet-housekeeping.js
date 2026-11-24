/* KINET OS · Limpieza diaria silenciosa (ahorra espacio en el dispositivo).
   Una vez al día (la primera vez que se abre la app tras las 00:00) borra SOLO restos temporales:
   avisos de traspaso entre pantallas que nunca se llegaron a usar, claves de enlaces a medias y copias antiguas en caché.
   NUNCA toca: perfil, ficha, plan, cuotas, ajustes, memoria de la IA, publicaciones guardadas, chats ni nada del usuario. */
(function () {
  'use strict';
  if (window.__kinetHK) return; window.__kinetHK = 1;
  var TEMP_LOCAL = ['kinet_media_studio_auto_prompt', 'kinet_media_studio_auto_preset', 'kinet_pending_question', 'kinet_target_agent',
    'kinet_pending_dm_broadcast', 'kinet_vision_lab_import_target', 'kinet_spotify_verifier', 'kinet_spotify_return',
    'kinet_sync_toast_at', 'kinet_sync_reload_at'];
  var TEMP_SESSION = ['kinet_cfg_cache', 'kinet_tier_reloaded'];
  function dayKey() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function run() {
    try {
      var today = dayKey(), last = localStorage.getItem('kinet_hk_day');
      if (last === today) return;
      if (last) { // no se limpia en la primera visita de la historia, solo al cambiar de día
        TEMP_LOCAL.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
        TEMP_SESSION.forEach(function (k) { try { sessionStorage.removeItem(k); } catch (e) {} });
      }
      localStorage.setItem('kinet_hk_day', today);
    } catch (e) {}
  }
  if (window.requestIdleCallback) requestIdleCallback(run, { timeout: 4000 }); else setTimeout(run, 2500);
})();
