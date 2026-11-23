/* ==========================================================
   KINET OS · Indicador "escribiendo…" en mensajes directos (como Instagram)
   Usa Supabase Realtime Broadcast (incluido en el plan gratuito, no guarda nada en la base de datos).
   Un canal por pareja de usuarios: solo se abre mientras la conversación está abierta.
   API: KinetTyping.open(myHandle, peerHandle, onPeerTyping(bool))   (llamar al abrir / cambiar de chat)
        KinetTyping.notify(true|false)                               (llamar al teclear / al enviar)
        KinetTyping.close()
   ========================================================== */
(function () {
  'use strict';
  if (window.KinetTyping) return;
  var ch = null, me = '', peer = '', lastSent = 0, peerTimer = null, cb = null;

  function norm(h) { return String(h || '').toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, ''); }
  function client() { try { return window.KinetBackend && KinetBackend.getClient ? KinetBackend.getClient() : null; } catch (e) { return null; } }

  function close() {
    clearTimeout(peerTimer);
    if (ch) { try { var sb = client(); if (sb && sb.removeChannel) sb.removeChannel(ch); } catch (e) {} }
    ch = null; me = ''; peer = ''; cb = null;
  }

  function open(myHandle, peerHandle, onPeerTyping) {
    var a = norm(myHandle), b = norm(peerHandle);
    if (ch && me === a && peer === b) { cb = onPeerTyping; return true; }
    close();
    var sb = client();
    if (!sb || !sb.channel || !a || !b || a === b) return false;
    me = a; peer = b; cb = onPeerTyping;
    try {
      ch = sb.channel('typing:' + [a, b].sort().join('~'), { config: { broadcast: { self: false } } });
      ch.on('broadcast', { event: 'typing' }, function (m) {
        var p = (m && m.payload) || {};
        if (norm(p.from) !== peer) return;
        clearTimeout(peerTimer);
        if (cb) cb(!!p.typing);
        if (p.typing) peerTimer = setTimeout(function () { if (cb) cb(false); }, 5000);   // si deja de teclear sin avisar
      });
      ch.subscribe();
      return true;
    } catch (e) { ch = null; return false; }
  }

  function notify(isTyping) {
    if (!ch) return;
    var now = Date.now();
    if (isTyping && now - lastSent < 2500) return;     // máx. 1 aviso cada 2,5 s
    lastSent = now;
    try { ch.send({ type: 'broadcast', event: 'typing', payload: { from: me, typing: !!isTyping } }); } catch (e) {}
  }

  window.KinetTyping = { open: open, notify: notify, close: close };
})();
