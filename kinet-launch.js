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

  /* ───── estilo de la ventana (mismo lenguaje visual que el blog: espacial, limpio y con movimiento lento) ───── */
  var CSS = [
    '.kl-ov{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:18px;background:radial-gradient(ellipse 60% 50% at 50% 40%,rgba(0,255,136,.10),transparent 70%),rgba(3,5,9,.82);-webkit-backdrop-filter:blur(14px) saturate(1.2);backdrop-filter:blur(14px) saturate(1.2);opacity:0;transition:opacity .6s cubic-bezier(.16,1,.3,1);font-family:Inter,system-ui,sans-serif;color:#E8EDF4}',
    '.kl-ov.on{opacity:1}.kl-ov *{box-sizing:border-box}',
    '.kl-box{position:relative;width:min(600px,100%);max-height:calc(100dvh - 36px);overflow:auto;border-radius:28px;padding:30px 26px 22px;background:linear-gradient(165deg,rgba(18,26,38,.96),rgba(7,10,16,.98));border:1px solid rgba(0,255,136,.28);box-shadow:0 40px 120px -30px rgba(0,0,0,.95),0 0 90px rgba(0,255,136,.12);transform:translateY(26px) scale(.965);opacity:0;transition:transform .9s cubic-bezier(.16,1,.3,1),opacity .6s ease;scrollbar-width:none}',
    '.kl-box::-webkit-scrollbar{display:none}',
    '.kl-box::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background-image:radial-gradient(rgba(255,255,255,.07) 1px,transparent 1.2px);background-size:22px 22px;-webkit-mask-image:radial-gradient(ellipse 80% 55% at 50% 0%,#000,transparent 75%);mask-image:radial-gradient(ellipse 80% 55% at 50% 0%,#000,transparent 75%)}',
    '.kl-box::after{content:"";position:absolute;left:50%;top:-120px;width:420px;height:240px;margin-left:-210px;border-radius:50%;pointer-events:none;background:radial-gradient(closest-side,rgba(0,255,136,.22),transparent);filter:blur(10px)}',
    '.kl-ov.on .kl-box{transform:none;opacity:1}',
    '.kl-x{position:absolute;z-index:2;top:16px;right:16px;width:38px;height:38px;border-radius:12px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:#94A3B8;cursor:pointer;display:grid;place-items:center;transition:color .25s,border-color .25s,transform .5s cubic-bezier(.16,1,.3,1)}',
    '.kl-x svg{width:16px;height:16px}.kl-x:hover{color:#fff;border-color:rgba(0,255,136,.55);transform:rotate(90deg)}',
    '.kl-head{position:relative;z-index:1}',
    '.kl-eye{display:inline-flex;align-items:center;gap:8px;font:700 .62rem "JetBrains Mono",monospace;letter-spacing:.2em;color:#00FF88;text-transform:uppercase;margin-bottom:12px}',
    '.kl-eye::before{content:"";width:6px;height:6px;border-radius:50%;background:#00FF88;box-shadow:0 0 10px #00FF88;animation:klb 2.4s ease-in-out infinite}@keyframes klb{50%{opacity:.35}}',
    '.kl-h{margin:0 46px 8px 0;font:900 1.7rem/1.1 Orbitron,sans-serif;letter-spacing:.01em;color:#fff}',
    '.kl-p{margin:0 0 20px;color:#93A1B5;font-size:.9rem;line-height:1.65;max-width:46ch}',
    '.kl-list{position:relative;z-index:1;display:flex;flex-direction:column;gap:11px}',
    '.kl-opt{--mx:50%;--my:50%;position:relative;display:flex;align-items:center;gap:15px;padding:15px 16px;border-radius:20px;background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.08);overflow:hidden;opacity:0;transform:translateY(16px);transition:border-color .4s,background .4s,transform .7s cubic-bezier(.16,1,.3,1),opacity .7s ease,box-shadow .5s}',
    '.kl-ov.on .kl-opt{opacity:1;transform:none;transition-delay:calc(var(--i,0)*85ms + 200ms),calc(var(--i,0)*85ms + 200ms),calc(var(--i,0)*85ms + 200ms),calc(var(--i,0)*85ms + 200ms),0s}',
    '.kl-opt::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .4s;background:radial-gradient(260px circle at var(--mx) var(--my),rgba(0,255,136,.14),transparent 70%)}',
    '.kl-opt:hover{border-color:rgba(0,255,136,.4);background:rgba(0,255,136,.035);transform:translateY(-3px)!important;box-shadow:0 18px 40px -22px rgba(0,255,136,.5);transition-delay:0s!important}.kl-opt:hover::after{opacity:1}',
    '.kl-opt.rec{border-color:rgba(0,255,136,.5);background:linear-gradient(120deg,rgba(0,255,136,.09),rgba(0,255,136,.02));box-shadow:0 0 40px -12px rgba(0,255,136,.35)}',
    '.kl-opt.off{opacity:.55}.kl-ov.on .kl-opt.off{opacity:.55}.kl-opt.off:hover{transform:none!important;border-color:rgba(255,255,255,.08);background:rgba(255,255,255,.025);box-shadow:none}',
    '.kl-ic{flex:0 0 auto;width:48px;height:48px;border-radius:15px;display:grid;place-items:center;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#B6C2D2;transition:transform .6s cubic-bezier(.16,1,.3,1)}',
    '.kl-ic svg{width:23px;height:23px}.kl-opt:hover .kl-ic{transform:scale(1.08) rotate(-4deg)}',
    '.kl-opt.rec .kl-ic{background:linear-gradient(135deg,#00FF88,#00B359);border-color:transparent;color:#04110A;box-shadow:0 0 26px rgba(0,255,136,.45)}',
    '.kl-tx{flex:1;min-width:0}',
    '.kl-tx b{display:flex;align-items:center;gap:9px;flex-wrap:wrap;font-size:.98rem;font-weight:700;color:#fff}',
    '.kl-tx span{display:block;margin-top:3px;color:#93A1B5;font-size:.8rem;line-height:1.5}',
    '.kl-tag{display:inline-block;padding:3px 8px;border-radius:99px;font:700 .54rem "JetBrains Mono",monospace;letter-spacing:.12em;text-transform:uppercase;background:rgba(0,255,136,.16);color:#00FF88;border:1px solid rgba(0,255,136,.4)}',
    '.kl-tag.soon{background:rgba(245,158,11,.12);color:#FBBF24;border-color:rgba(245,158,11,.4)}',
    '.kl-btns{display:flex;flex-direction:column;gap:7px;flex:0 0 auto}',
    '.kl-b{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:40px;padding:0 16px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.04);color:#F1F5F9;font:700 .72rem Inter,system-ui,sans-serif;letter-spacing:.02em;text-decoration:none;cursor:pointer;white-space:nowrap;overflow:hidden;transition:border-color .3s,box-shadow .4s,transform .5s cubic-bezier(.16,1,.3,1),background .3s}',
    '.kl-b:hover{border-color:#00FF88;box-shadow:0 0 22px rgba(0,255,136,.28);transform:translateY(-1px)}',
    '.kl-b.pri{background:linear-gradient(135deg,#00FF88,#00B359);color:#04110A;border-color:transparent;font-weight:800;box-shadow:0 0 24px rgba(0,255,136,.28),inset 0 1px 0 rgba(255,255,255,.35)}',
    '.kl-b.pri::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.55) 50%,transparent 70%);transform:translateX(-120%);transition:transform .8s cubic-bezier(.16,1,.3,1)}.kl-b.pri:hover::after{transform:translateX(120%)}',
    '.kl-b[disabled],.kl-b.dis{opacity:.45;cursor:not-allowed;pointer-events:none}',
    '.kl-foot{position:relative;z-index:1;margin-top:18px;text-align:center;font-size:.8rem;color:#93A1B5}',
    '.kl-foot a{color:#00FF88;font-weight:700;text-decoration:none;border-bottom:1px solid rgba(0,255,136,.35);transition:border-color .3s}.kl-foot a:hover{border-color:#00FF88}',
    '@media (max-width:560px){.kl-ov{align-items:flex-end;padding:0}.kl-box{border-radius:26px 26px 0 0;max-height:92dvh;padding:26px 18px calc(20px + env(safe-area-inset-bottom))}.kl-h{font-size:1.4rem}.kl-opt{flex-wrap:wrap}.kl-btns{flex-direction:row;width:100%;padding-left:63px}.kl-btns .kl-b{flex:1}}'
  ].join('');

  var ov = null, last = null;

  function optHtml(o, i) {
    return '<div style="--i:' + i + '" class="kl-opt' + (o.rec ? ' rec' : '') + (o.off ? ' off' : '') + '"><div class="kl-ic" aria-hidden="true">' + o.icon + '</div>' +
      '<div class="kl-tx"><b>' + esc(o.t) + (o.tag ? ' <i class="kl-tag' + (o.soon ? ' soon' : '') + '" style="font-style:normal">' + esc(o.tag) + '</i>' : '') + '</b><span>' + o.d + '</span></div>' +
      '<div class="kl-btns">' + o.btns + '</div></div>';
  }
  function build() {
    var S = stores(), list = [];
    var canInstall = !!deferred && !standalone;
    list.push({ icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 3.9 5.7 3.9 9s-1.3 6.3-3.9 9c-2.6-2.7-3.9-5.7-3.9-9S9.4 5.7 12 3z"/></svg>', t: 'En el navegador', rec: !mobile, tag: !mobile ? 'Recomendado' : '', d: 'Entra ahora, sin instalar nada. Ideal para probarla o usarla desde el ordenador.',
      btns: '<button class="kl-b pri" data-a="web">Abrir ahora →</button>' });
    list.push({ icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2.5" width="10" height="19" rx="2.6"/><path d="M11 18.5h2"/></svg>', t: 'Acceso directo en tu móvil', rec: mobile, tag: mobile ? 'Recomendado' : '', d: standalone && mobile ? 'Ya estás usando KINET OS como app instalada.' : 'Se instala desde el navegador en 1 minuto: icono propio, pantalla completa y casi sin ocupar espacio.',
      btns: (canInstall && mobile ? '<button class="kl-b pri" data-a="install">Instalar ahora</button>' : '') + '<a class="kl-b' + (canInstall && mobile ? '' : ' pri') + '" href="movil.html">Ver los pasos</a>' });
    list.push({ icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4.5v15l12-7.5z"/></svg>', t: 'Google Play', off: !S.play, tag: S.play ? '' : 'Próximamente', soon: !S.play, d: S.play ? 'Descárgala desde la tienda de Android.' : 'Estamos preparando la ficha en la tienda. Mientras tanto, usa el acceso directo: es la misma app.',
      btns: S.play ? '<a class="kl-b pri" href="' + esc(S.play) + '" target="_blank" rel="noopener">Descargar</a>' : '<span class="kl-b dis">Próximamente</span>' });
    list.push({ icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7c-1.6-1.8-4.8-1.2-5.8 1.4-1.2 3 .6 8 2.6 10 1 1 2 .8 3.2.2 1.2.6 2.2.8 3.2-.2 1.2-1.2 2.4-3.5 2.6-5.3-2.2-.8-3.2-3.6-1.4-5.4-1-1.2-2.6-1.2-3.8-.2"/><path d="M12 7c0-1.6.8-3 2.4-3.6"/></svg>', t: 'App Store (iPhone)', off: !S.appstore, tag: S.appstore ? '' : 'Próximamente', soon: !S.appstore, d: S.appstore ? 'Descárgala desde la tienda de Apple.' : 'En iPhone puedes usar ya el acceso directo desde Safari (Compartir → Añadir a pantalla de inicio).',
      btns: S.appstore ? '<a class="kl-b pri" href="' + esc(S.appstore) + '" target="_blank" rel="noopener">Descargar</a>' : '<span class="kl-b dis">Próximamente</span>' });
    var pcLinks = '';
    if (S.windows) pcLinks += '<a class="kl-b' + (isWin ? ' pri' : '') + '" href="' + esc(S.windows) + '" download rel="noopener">Windows</a>';
    if (S.mac) pcLinks += '<a class="kl-b' + (isMac ? ' pri' : '') + '" href="' + esc(S.mac) + '" download rel="noopener">Mac</a>';
    if (S.linux) pcLinks += '<a class="kl-b' + (isLinux ? ' pri' : '') + '" href="' + esc(S.linux) + '" download rel="noopener">Linux</a>';
    var pcInstall = canInstall && !mobile ? '<button class="kl-b pri" data-a="install">Instalar ahora</button>' : '';
    var pcOpt = { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8 20h8M12 16.5V20"/></svg>', t: 'App de ordenador', rec: false, d: standalone && !mobile ? 'Ya estás usando KINET OS como app instalada.' : (pcLinks ? 'Instálala en Windows, Mac o Linux: ventana propia, icono en el escritorio y arranque rápido.' : 'Instálala desde Chrome o Edge en 2 clics: ventana propia, icono en el escritorio y sin pestañas. Gratis.'),
      btns: pcInstall + pcLinks + '<a class="kl-b' + (pcInstall || pcLinks ? '' : ' pri') + '" href="movil.html#pc">Ver los pasos</a>' };
    if (mobile) { pcOpt.off = false; } 
    if (!mobile) list.splice(2, 0, pcOpt);
    if (S.apk) list.push({ icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>', t: 'Descarga directa (Android)', d: 'Archivo .apk para instalar sin tienda. Solo si sabes lo que haces.', btns: '<a class="kl-b" href="' + esc(S.apk) + '" download rel="noopener">Descargar .apk</a>' });
    if (mobile) list.push(pcOpt);
    return '<button class="kl-x" data-a="close" aria-label="Cerrar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<div class="kl-head"><div class="kl-eye">Una app · todos tus dispositivos</div><h2 class="kl-h" id="kl-title">Abrir KINET OS</h2>' +
      '<p class="kl-p">Elige cómo quieres usarla. Es la <b style="color:#F8FAFC">misma app</b> en todas las opciones: tu cuenta, tu plan y tus datos se sincronizan solos.</p></div>' +
      '<div class="kl-list">' + list.map(function (o, i) { return optHtml(o, i); }).join('') + '</div>' +
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
    ov.addEventListener('pointermove', function (e) {
      var o = e.target.closest && e.target.closest('.kl-opt'); if (!o) return; var r = o.getBoundingClientRect();
      o.style.setProperty('--mx', (e.clientX - r.left) + 'px'); o.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
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
