/* KINET OS · Ventana «Abrir App» de la portada
   Explica las formas de usar KINET OS (navegador, acceso directo, tiendas) y se prepara sola
   para los enlaces de descarga que pongas en kinet-stores.js.
   Uso: KinetLaunch.open()  ·  KinetLaunch.close() */
(function () {
  'use strict';
  if (window.KinetLaunch) return;

  var ua = navigator.userAgent || '';
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/i.test(ua);
  var mobile = isIOS || isAndroid;
  var standalone = false;
  try { standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) {}

  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; refresh(); });
  window.addEventListener('appinstalled', function () { deferred = null; standalone = true; refresh(); });

  function stores() { var s = window.KINET_STORES || {}; return { play: s.play || '', appstore: s.appstore || '', apk: s.apk || '', windows: s.windows || '', mac: s.mac || '', linux: s.linux || '' }; }
  var isMac = /Mac/i.test(navigator.platform || ua) && !isIOS, isWin = /Win/i.test(navigator.platform || ua), isLinux = /Linux/i.test(navigator.platform || '') && !isAndroid;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var CSS = '' +
    '.kl-ov{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(2,4,8,.78);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);opacity:0;transition:opacity .25s;font-family:Inter,system-ui,sans-serif}' +
    '.kl-ov.on{opacity:1}' +
    '.kl-ov *{box-sizing:border-box}' +
    '.kl-box{position:relative;width:min(560px,100%);max-height:calc(100dvh - 32px);overflow:auto;border-radius:22px;padding:22px 20px 18px;background:linear-gradient(180deg,#10151f,#090c13);border:1px solid rgba(0,255,102,.4);box-shadow:0 0 50px rgba(0,255,102,.14),0 30px 80px rgba(0,0,0,.65);color:#F8FAFC;transform:translateY(18px) scale(.97);transition:transform .4s cubic-bezier(.16,1,.3,1);scrollbar-width:none}' +
    '.kl-box::-webkit-scrollbar{display:none}' +
    '.kl-ov.on .kl-box{transform:none}' +
    '.kl-x{position:absolute;top:12px;right:12px;width:34px;height:34px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:#94A3B8;font-size:1rem;cursor:pointer}' +
    '.kl-x:hover{color:#fff;border-color:rgba(0,255,102,.5)}' +
    '.kl-eye{font:700 .6rem "JetBrains Mono",monospace;letter-spacing:.18em;color:#00FF66;text-transform:uppercase;margin-bottom:6px}' +
    '.kl-h{margin:0 34px 6px 0;font:900 1.15rem Orbitron,sans-serif;letter-spacing:.04em}' +
    '.kl-p{margin:0 0 14px;color:#94A3B8;font-size:.84rem;line-height:1.55}' +
    '.kl-list{display:flex;flex-direction:column;gap:10px}' +
    '.kl-opt{position:relative;display:flex;align-items:center;gap:13px;padding:13px;border-radius:16px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.09);transition:border-color .25s,background .25s,transform .35s cubic-bezier(.16,1,.3,1)}' +
    '.kl-opt:hover{border-color:rgba(0,255,102,.4);background:rgba(0,255,102,.04);transform:translateY(-2px)}' +
    '.kl-opt.rec{border-color:rgba(0,255,102,.55);background:rgba(0,255,102,.06)}' +
    '.kl-opt.off{opacity:.62}.kl-opt.off:hover{transform:none;border-color:rgba(255,255,255,.09);background:rgba(255,255,255,.03)}' +
    '.kl-ic{flex:0 0 auto;width:44px;height:44px;border-radius:13px;display:grid;place-items:center;font-size:1.35rem;background:rgba(255,255,255,.06)}' +
    '.kl-opt.rec .kl-ic{background:linear-gradient(135deg,#00FF66,#00B359)}' +
    '.kl-tx{flex:1;min-width:0}' +
    '.kl-tx b{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:.9rem}' +
    '.kl-tx span{display:block;margin-top:2px;color:#94A3B8;font-size:.76rem;line-height:1.45}' +
    '.kl-tag{display:inline-block;padding:2px 7px;border-radius:99px;font:700 .5rem "JetBrains Mono",monospace;letter-spacing:.1em;text-transform:uppercase;background:#00FF66;color:#04060A}' +
    '.kl-tag.soon{background:rgba(245,158,11,.16);color:#FBBF24;border:1px solid rgba(245,158,11,.4)}' +
    '.kl-btns{display:flex;flex-direction:column;gap:6px;flex:0 0 auto}' +
    '.kl-b{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 13px;border-radius:11px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.05);color:#F8FAFC;font:800 .62rem Orbitron,"JetBrains Mono",sans-serif;letter-spacing:.06em;text-decoration:none;cursor:pointer;white-space:nowrap;transition:border-color .2s,box-shadow .25s,background .2s}' +
    '.kl-b:hover{border-color:#00FF66;box-shadow:0 0 16px rgba(0,255,102,.3)}' +
    '.kl-b.pri{background:linear-gradient(135deg,#00FF66,#00B359);color:#04060A;border-color:transparent}' +
    '.kl-b[disabled],.kl-b.dis{opacity:.5;cursor:not-allowed;pointer-events:none}' +
    '.kl-foot{margin-top:14px;text-align:center;font-size:.76rem;color:#94A3B8}' +
    '.kl-foot a{color:#00FF66;font-weight:700}' +
    '@media (max-width:560px){.kl-ov{align-items:flex-end;padding:0}.kl-box{border-radius:22px 22px 0 0;max-height:92dvh;padding-bottom:calc(18px + env(safe-area-inset-bottom))}.kl-opt{flex-wrap:wrap}.kl-btns{flex-direction:row;width:100%;padding-left:57px}.kl-btns .kl-b{flex:1}}' +
    '@media (prefers-reduced-motion:reduce){.kl-ov,.kl-box,.kl-opt{transition:none!important}}';

  var ov = null, last = null;

  function optHtml(o) {
    return '<div class="kl-opt' + (o.rec ? ' rec' : '') + (o.off ? ' off' : '') + '"><div class="kl-ic" aria-hidden="true">' + o.icon + '</div>' +
      '<div class="kl-tx"><b>' + esc(o.t) + (o.tag ? ' <i class="kl-tag' + (o.soon ? ' soon' : '') + '" style="font-style:normal">' + esc(o.tag) + '</i>' : '') + '</b><span>' + o.d + '</span></div>' +
      '<div class="kl-btns">' + o.btns + '</div></div>';
  }
  function build() {
    var S = stores(), list = [];
    var canInstall = !!deferred && !standalone;
    list.push({ icon: '🌐', t: 'En el navegador', rec: !mobile, tag: !mobile ? 'Recomendado' : '', d: 'Entra ahora, sin instalar nada. Ideal para probarla o usarla desde el ordenador.',
      btns: '<button class="kl-b pri" data-a="web">Abrir ahora →</button>' });
    list.push({ icon: '📲', t: 'Acceso directo en tu móvil', rec: mobile, tag: mobile ? 'Recomendado' : '', d: standalone && mobile ? 'Ya estás usando KINET OS como app instalada.' : 'Se instala desde el navegador en 1 minuto: icono propio, pantalla completa y casi sin ocupar espacio.',
      btns: (canInstall && mobile ? '<button class="kl-b pri" data-a="install">Instalar ahora</button>' : '') + '<a class="kl-b' + (canInstall && mobile ? '' : ' pri') + '" href="movil.html">Ver los pasos</a>' });
    list.push({ icon: '▶', t: 'Google Play', off: !S.play, tag: S.play ? '' : 'Próximamente', soon: !S.play, d: S.play ? 'Descárgala desde la tienda de Android.' : 'Estamos preparando la ficha en la tienda. Mientras tanto, usa el acceso directo: es la misma app.',
      btns: S.play ? '<a class="kl-b pri" href="' + esc(S.play) + '" target="_blank" rel="noopener">Descargar</a>' : '<span class="kl-b dis">Próximamente</span>' });
    list.push({ icon: '🍎', t: 'App Store (iPhone)', off: !S.appstore, tag: S.appstore ? '' : 'Próximamente', soon: !S.appstore, d: S.appstore ? 'Descárgala desde la tienda de Apple.' : 'En iPhone puedes usar ya el acceso directo desde Safari (Compartir → Añadir a pantalla de inicio).',
      btns: S.appstore ? '<a class="kl-b pri" href="' + esc(S.appstore) + '" target="_blank" rel="noopener">Descargar</a>' : '<span class="kl-b dis">Próximamente</span>' });
    var pcLinks = '';
    if (S.windows) pcLinks += '<a class="kl-b' + (isWin ? ' pri' : '') + '" href="' + esc(S.windows) + '" download rel="noopener">Windows</a>';
    if (S.mac) pcLinks += '<a class="kl-b' + (isMac ? ' pri' : '') + '" href="' + esc(S.mac) + '" download rel="noopener">Mac</a>';
    if (S.linux) pcLinks += '<a class="kl-b' + (isLinux ? ' pri' : '') + '" href="' + esc(S.linux) + '" download rel="noopener">Linux</a>';
    var pcInstall = canInstall && !mobile ? '<button class="kl-b pri" data-a="install">Instalar ahora</button>' : '';
    var pcOpt = { icon: '💻', t: 'App de ordenador', rec: false, d: standalone && !mobile ? 'Ya estás usando KINET OS como app instalada.' : (pcLinks ? 'Instálala en Windows, Mac o Linux: ventana propia, icono en el escritorio y arranque rápido.' : 'Instálala desde Chrome o Edge en 2 clics: ventana propia, icono en el escritorio y sin pestañas. Gratis.'),
      btns: pcInstall + pcLinks + '<a class="kl-b' + (pcInstall || pcLinks ? '' : ' pri') + '" href="movil.html#pc">Ver los pasos</a>' };
    if (mobile) { pcOpt.off = false; } 
    if (!mobile) list.splice(2, 0, pcOpt);
    if (S.apk) list.push({ icon: '⬇', t: 'Descarga directa (Android)', d: 'Archivo .apk para instalar sin tienda. Solo si sabes lo que haces.', btns: '<a class="kl-b" href="' + esc(S.apk) + '" download rel="noopener">Descargar .apk</a>' });
    if (mobile) list.push(pcOpt);
    return '<button class="kl-x" data-a="close" aria-label="Cerrar">✕</button>' +
      '<div class="kl-eye">Una app · todos tus dispositivos</div><h2 class="kl-h" id="kl-title">Abrir KINET OS</h2>' +
      '<p class="kl-p">Elige cómo quieres usarla. Es la <b style="color:#F8FAFC">misma app</b> en todas las opciones: tu cuenta, tu plan y tus datos se sincronizan solos.</p>' +
      '<div class="kl-list">' + list.map(optHtml).join('') + '</div>' +
      '<div class="kl-foot">¿Primera vez? <a href="movil.html">Guía paso a paso con dibujos</a></div>';
  }
  function refresh() { if (ov) { var b = ov.querySelector('.kl-box'); b.innerHTML = build(); } }

  function open() {
    if (ov) return;
    last = document.activeElement;
    if (!document.getElementById('kl-css')) { var st = document.createElement('style'); st.id = 'kl-css'; st.textContent = CSS; document.head.appendChild(st); }
    ov = document.createElement('div'); ov.className = 'kl-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-labelledby', 'kl-title');
    ov.innerHTML = '<div class="kl-box">' + build() + '</div>';
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add('on'); var f = ov.querySelector('.kl-b.pri'); if (f) f.focus(); });
    ov.addEventListener('click', function (e) {
      if (e.target === ov) return close();
      var a = e.target.closest && e.target.closest('[data-a]'); if (!a) return;
      var k = a.getAttribute('data-a');
      if (k === 'close') close();
      else if (k === 'web') { close(); if (typeof window.cambiarPagina === 'function') window.cambiarPagina('app-redirect.html'); else location.href = 'app-redirect.html'; }
      else if (k === 'install' && deferred) { var d = deferred; deferred = null; try { d.prompt(); d.userChoice.then(function () { refresh(); }); } catch (x) {} refresh(); }
    });
    document.addEventListener('keydown', onKey, true);
  }
  function onKey(e) {
    if (!ov) return;
    if (e.key === 'Escape') { e.stopPropagation(); close(); }
    if (e.key === 'Tab') {   // el foco se queda dentro de la ventana
      var f = [].slice.call(ov.querySelectorAll('button:not([disabled]),a[href]')); if (!f.length) return;
      var first = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    }
  }
  function close() {
    if (!ov) return; var o = ov; ov = null;
    document.removeEventListener('keydown', onKey, true);
    o.classList.remove('on'); setTimeout(function () { o.remove(); }, 260);
    try { if (last && last.focus) last.focus(); } catch (e) {}
  }
  window.KinetLaunch = { open: open, close: close };
})();
