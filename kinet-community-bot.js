/* ==========================================================
   KINET OS · KINET AI — Asistente de la Comunidad
   Botón flotante + panel de chat que responde dudas sobre KINET OS,
   dudas deportivas y ayuda para publicaciones.
   Usa KinetAPIs.askCommunityBot (kinet-api-config.js): cuota diaria propia,
   prompt ligero (solo rol, deporte y plan; NO envía datos biométricos).
   API pública: window.KinetCommunityBot { open, close, ask, askAboutPost }
   ========================================================== */
(function () {
  'use strict';
  if (window.KinetCommunityBot) return;

  var HIST_KEY = 'kinet_cbot_hist';
  var MAX_HIST = 20;
  var state = { open: false, busy: false, history: [], postCtx: null, postLabel: '' };
  var el = {};

  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // Markdown mínimo y seguro: se escapa TODO el HTML primero y solo después se aplican **negrita**, `código`, viñetas y saltos.
  function md(text) {
    var t = esc(text).replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>').replace(/`([^`\n]+)`/g, '<code>$1</code>');
    var lines = t.split(/\r?\n/), out = [], inList = false;
    lines.forEach(function (ln) {
      var m = ln.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
      if (m) { if (!inList) { out.push('<ul>'); inList = true; } out.push('<li>' + m[1] + '</li>'); }
      else { if (inList) { out.push('</ul>'); inList = false; } out.push(ln.trim() ? '<p>' + ln + '</p>' : ''); }
    });
    if (inList) out.push('</ul>');
    return out.join('');
  }

  function role() { return (ls('kinet_active_role') || 'athlete').toLowerCase(); }
  function sport() {
    var s = ls('kinet_sport') || '';
    try { if (window.KinetSport && KinetSport.current) { var c = KinetSport.current(); if (c && c.name) return c.name; } } catch (e) {}
    return s || 'tu deporte';
  }
  function api() { return window.KinetAPIs && typeof window.KinetAPIs.askCommunityBot === 'function' ? window.KinetAPIs : null; }

  function loadHist() {
    try { var h = JSON.parse(sessionStorage.getItem(HIST_KEY) || '[]'); if (Array.isArray(h)) state.history = h.slice(-MAX_HIST); } catch (e) { state.history = []; }
  }
  function saveHist() {
    try { sessionStorage.setItem(HIST_KEY, JSON.stringify(state.history.slice(-MAX_HIST))); } catch (e) {}
  }

  function injectStyle() {
    if (document.getElementById('kinet-cbot-style')) return;
    var st = document.createElement('style');
    st.id = 'kinet-cbot-style';
    st.textContent =
      '.kcb-fab{position:fixed;right:22px;bottom:22px;z-index:125;display:flex;align-items:center;gap:9px;padding:11px 16px 11px 12px;border-radius:99px;border:1px solid var(--role-color,#00FF88);background:rgba(8,11,18,.94);color:#fff;font-family:Inter,sans-serif;font-weight:800;font-size:.76rem;cursor:pointer;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 10px 30px rgba(0,0,0,.75),0 0 22px rgba(var(--role-rgb,0,255,136),.28);transition:transform .2s,box-shadow .2s}' +
      '.kcb-fab:hover{transform:translateY(-2px);box-shadow:0 14px 34px rgba(0,0,0,.8),0 0 30px rgba(var(--role-rgb,0,255,136),.45)}' +
      '.kcb-fab-ico{width:30px;height:30px;border-radius:10px;background:var(--role-gradient,linear-gradient(135deg,#00FF88,#00B359));color:#04060A;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0}' +
      '.kcb-fab-dot{width:7px;height:7px;border-radius:50%;background:var(--role-color,#00FF88);box-shadow:0 0 8px var(--role-color,#00FF88);animation:kcbPulse 2s infinite}' +
      '@keyframes kcbPulse{0%,100%{opacity:1}50%{opacity:.35}}' +
      '.kcb-panel{position:fixed;right:22px;bottom:22px;z-index:126;width:384px;max-width:calc(100vw - 16px);height:min(590px,calc(100vh - 44px));height:min(590px,calc(100dvh - 44px));display:none;flex-direction:column;border-radius:20px;border:1px solid rgba(var(--role-rgb,0,255,136),.5);background:rgba(9,13,22,.985);backdrop-filter:blur(26px);-webkit-backdrop-filter:blur(26px);box-shadow:0 26px 64px rgba(0,0,0,.92),0 0 34px rgba(var(--role-rgb,0,255,136),.18);overflow:hidden;font-family:Inter,sans-serif;color:#E2E8F0}' +
      '.kcb-panel.kcb-open{display:flex;animation:kcbIn .26s cubic-bezier(.16,1,.3,1) forwards}' +
      '@keyframes kcbIn{0%{opacity:0;transform:translateY(14px) scale(.97)}100%{opacity:1;transform:none}}' +
      '.kcb-head{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.07);background:rgba(var(--role-rgb,0,255,136),.06)}' +
      '.kcb-head .kcb-fab-ico{width:34px;height:34px}' +
      '.kcb-title{font-family:Orbitron,sans-serif;font-weight:800;font-size:.8rem;color:#fff;letter-spacing:.04em;line-height:1.1}' +
      '.kcb-sub{font-size:.62rem;color:#94A3B8;margin-top:2px}' +
      '.kcb-quota{margin-left:auto;font-family:"JetBrains Mono",monospace;font-size:.58rem;font-weight:700;padding:3px 8px;border-radius:99px;border:1px solid rgba(var(--role-rgb,0,255,136),.45);color:var(--role-color,#00FF88);white-space:nowrap}' +
      '.kcb-ib{background:transparent;border:1px solid rgba(255,255,255,.1);color:#94A3B8;width:28px;height:28px;border-radius:8px;cursor:pointer;font-size:.8rem;display:flex;align-items:center;justify-content:center;flex-shrink:0}' +
      '.kcb-ib:hover{color:#fff;border-color:var(--role-color,#00FF88)}' +
      '.kcb-body{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:14px;display:flex;flex-direction:column;gap:10px}' +
      '.kcb-msg{max-width:88%;padding:9px 12px;border-radius:14px;font-size:.78rem;line-height:1.5;word-wrap:break-word;overflow-wrap:anywhere}' +
      '.kcb-msg p{margin:0 0 6px}.kcb-msg p:last-child{margin-bottom:0}.kcb-msg ul{margin:4px 0 6px;padding-left:18px}.kcb-msg li{margin-bottom:2px}.kcb-msg code{background:rgba(255,255,255,.08);padding:1px 5px;border-radius:5px;font-family:"JetBrains Mono",monospace;font-size:.72rem}' +
      '.kcb-msg.bot{align-self:flex-start;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.07);border-top-left-radius:4px}' +
      '.kcb-msg.user{align-self:flex-end;background:var(--role-gradient,linear-gradient(135deg,#00FF88,#00B359));color:#04060A;font-weight:600;border-top-right-radius:4px}' +
      '.kcb-msg.err{border-color:rgba(239,68,68,.45);color:#FCA5A5}' +
      '.kcb-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px}' +
      '.kcb-chip{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.12);color:#CBD5E1;font-family:Inter,sans-serif;font-size:.68rem;font-weight:600;padding:6px 10px;border-radius:99px;cursor:pointer;text-align:left;transition:.18s}' +
      '.kcb-chip:hover{border-color:var(--role-color,#00FF88);color:var(--role-color,#00FF88);background:rgba(var(--role-rgb,0,255,136),.08)}' +
      '.kcb-typing{align-self:flex-start;display:flex;gap:4px;padding:11px 14px;border-radius:14px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.07)}' +
      '.kcb-typing i{width:6px;height:6px;border-radius:50%;background:var(--role-color,#00FF88);opacity:.35;animation:kcbDot 1.1s infinite}.kcb-typing i:nth-child(2){animation-delay:.18s}.kcb-typing i:nth-child(3){animation-delay:.36s}' +
      '@keyframes kcbDot{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-3px)}}' +
      '.kcb-ctx{display:none;align-items:center;gap:8px;margin:0 12px;padding:6px 10px;border-radius:10px;background:rgba(var(--role-rgb,0,255,136),.08);border:1px solid rgba(var(--role-rgb,0,255,136),.3);font-size:.64rem;color:#CBD5E1}' +
      '.kcb-ctx.on{display:flex}.kcb-ctx span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.kcb-ctx button{background:none;border:none;color:#94A3B8;cursor:pointer;font-size:.8rem}' +
      '.kcb-foot{padding:10px 12px 8px;border-top:1px solid rgba(255,255,255,.07)}' +
      '.kcb-row{display:flex;gap:8px;align-items:flex-end}' +
      '.kcb-input{flex:1;min-width:0;resize:none;max-height:96px;min-height:38px;background:rgba(4,6,10,.85);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:9px 12px;color:#F8FAFC;font-family:Inter,sans-serif;font-size:.8rem;line-height:1.35;outline:none}' +
      '.kcb-input:focus{border-color:var(--role-color,#00FF88);box-shadow:0 0 12px rgba(var(--role-rgb,0,255,136),.2)}' +
      '.kcb-send{width:38px;height:38px;border-radius:12px;border:none;background:var(--role-gradient,linear-gradient(135deg,#00FF88,#00B359));color:#04060A;font-weight:900;font-size:1rem;cursor:pointer;flex-shrink:0}' +
      '.kcb-send:disabled{opacity:.45;cursor:not-allowed}' +
      '.kcb-note{margin-top:7px;font-size:.56rem;color:#64748B;line-height:1.35;text-align:center}' +
      '@media (max-width:960px){.kcb-fab{right:12px;bottom:88px}.kcb-fab-txt{display:none}.kcb-fab{padding:9px}' +
      '.kcb-panel{right:8px;left:8px;bottom:8px;width:auto;max-width:none;height:min(78vh,640px);height:min(78dvh,640px);border-radius:18px}.kcb-input{font-size:16px}}' +
      '@media (prefers-reduced-motion:reduce){.kcb-panel.kcb-open,.kcb-fab-dot,.kcb-typing i{animation:none}}';
    document.head.appendChild(st);
  }

  function chipsForUser() {
    var sp = sport(), r = role(), list = ['¿Cómo funciona la KINET Card?', '¿Qué incluye cada plan?', 'Ayúdame a escribir mi primera publicación'];
    if (r === 'staff') list.push('Ideas para una sesión de ' + sp, '¿Cómo uso la Pizarra 3D?');
    else if (r === 'scout') list.push('¿Qué debo mirar al ojear en ' + sp + '?', '¿Cómo contacto con talentos?');
    else list.push('¿Cómo destaco ante ojeadores en ' + sp + '?', 'Calentamiento recomendado en ' + sp);
    return list.slice(0, 5);
  }

  function build() {
    if (el.fab) return;
    injectStyle();
    var fab = document.createElement('button');
    fab.type = 'button'; fab.className = 'kcb-fab'; fab.id = 'kcb-fab';
    fab.setAttribute('aria-label', 'Abrir KINET AI, asistente de la comunidad');
    fab.innerHTML = '<span class="kcb-fab-ico">🤖</span><span class="kcb-fab-txt">Pregunta a KINET AI</span><span class="kcb-fab-dot"></span>';
    fab.addEventListener('click', function () { open(); });

    var panel = document.createElement('section');
    panel.className = 'kcb-panel'; panel.id = 'kcb-panel';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'KINET AI, asistente de la comunidad');
    panel.innerHTML =
      '<div class="kcb-head"><span class="kcb-fab-ico">🤖</span><div><div class="kcb-title">KINET AI</div><div class="kcb-sub">Asistente de la Comunidad</div></div>' +
      '<span class="kcb-quota" id="kcb-quota" title="Preguntas disponibles hoy"></span>' +
      '<button type="button" class="kcb-ib" id="kcb-clear" title="Nueva conversación" aria-label="Nueva conversación">↺</button>' +
      '<button type="button" class="kcb-ib" id="kcb-close" title="Cerrar" aria-label="Cerrar">✕</button></div>' +
      '<div class="kcb-body" id="kcb-body" aria-live="polite"></div>' +
      '<div class="kcb-ctx" id="kcb-ctx"><span id="kcb-ctx-txt"></span><button type="button" id="kcb-ctx-x" aria-label="Quitar publicación">✕</button></div>' +
      '<div class="kcb-foot"><div class="kcb-row"><textarea class="kcb-input" id="kcb-input" rows="1" maxlength="500" placeholder="Escribe tu duda…" aria-label="Escribe tu pregunta"></textarea>' +
      '<button type="button" class="kcb-send" id="kcb-send" aria-label="Enviar">➤</button></div>' +
      '<div class="kcb-note">IA: puede equivocarse. No sustituye a un profesional sanitario ni a tu entrenador. Para planes personalizados usa tu Cuerpo Técnico IA.</div></div>';
    document.body.appendChild(fab);
    document.body.appendChild(panel);
    el = { fab: fab, panel: panel, body: panel.querySelector('#kcb-body'), input: panel.querySelector('#kcb-input'), send: panel.querySelector('#kcb-send'),
           quota: panel.querySelector('#kcb-quota'), ctx: panel.querySelector('#kcb-ctx'), ctxTxt: panel.querySelector('#kcb-ctx-txt') };

    panel.querySelector('#kcb-close').addEventListener('click', close);
    panel.querySelector('#kcb-clear').addEventListener('click', function () { state.history = []; saveHist(); clearPost(); render(); });
    panel.querySelector('#kcb-ctx-x').addEventListener('click', clearPost);
    el.send.addEventListener('click', function () { submit(); });
    el.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); }
    });
    el.input.addEventListener('input', autoGrow);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.open) close(); });
    updateQuota();
  }

  function autoGrow() {
    el.input.style.height = 'auto';
    el.input.style.height = Math.min(96, el.input.scrollHeight) + 'px';
  }

  function updateQuota() {
    if (!el.quota) return;
    var a = api(), q = null;
    try { q = a && a.getQuotaStatus ? a.getQuotaStatus() : null; } catch (e) {}
    el.quota.textContent = q ? (q.communityBotRemaining + '/' + q.communityBotLimit + ' hoy') : '';
  }

  function addMsg(kind, html, raw) {
    var d = document.createElement('div');
    d.className = 'kcb-msg ' + kind;
    d.innerHTML = html;
    if (raw) d.setAttribute('data-raw', '1');
    el.body.appendChild(d);
    el.body.scrollTop = el.body.scrollHeight;
    return d;
  }

  function render() {
    el.body.innerHTML = '';
    var first = (ls('kinet_user_name') || '').trim().split(/\s+/)[0].replace(/[*`<>]/g, '');
    var greet = '¡Hola' + (first && first !== 'Usuario' ? ', ' + first : '') + '! Soy **KINET AI**. Puedo ayudarte con dudas sobre KINET OS, con preguntas de **' + sport() + '** y con tus publicaciones. ¿Qué necesitas?';
    addMsg('bot', md(greet));
    if (!state.history.length) {
      var wrap = document.createElement('div'); wrap.className = 'kcb-chips';
      chipsForUser().forEach(function (c) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'kcb-chip'; b.textContent = c;
        b.addEventListener('click', function () { ask(c); });
        wrap.appendChild(b);
      });
      el.body.appendChild(wrap);
    }
    state.history.forEach(function (m) { addMsg(m.role === 'user' ? 'user' : 'bot', m.role === 'user' ? esc(m.content) : md(m.content)); });
    el.body.scrollTop = el.body.scrollHeight;
  }

  function setBusy(b) {
    state.busy = b; el.send.disabled = b; el.input.disabled = b;
    var t = el.body.querySelector('.kcb-typing');
    if (b && !t) { t = document.createElement('div'); t.className = 'kcb-typing'; t.innerHTML = '<i></i><i></i><i></i>'; el.body.appendChild(t); el.body.scrollTop = el.body.scrollHeight; }
    if (!b && t) t.remove();
  }

  function clearPost() {
    state.postCtx = null; state.postLabel = '';
    if (el.ctx) el.ctx.classList.remove('on');
  }
  function setPost(text, label) {
    state.postCtx = String(text || '').slice(0, 900);
    state.postLabel = label || 'publicación';
    el.ctxTxt.textContent = '📎 Sobre: ' + state.postLabel;
    el.ctx.classList.add('on');
  }

  function submit() {
    var v = (el.input.value || '').trim();
    if (!v) return;
    el.input.value = ''; autoGrow();
    ask(v);
  }

  function ask(question) {
    if (state.busy) return;
    build(); if (!state.open) open();
    var q = String(question || '').trim();
    if (!q) return;
    var chips = el.body.querySelector('.kcb-chips'); if (chips) chips.remove();
    addMsg('user', esc(q));
    var a = api();
    if (!a) { addMsg('bot err', md('El asistente no está disponible ahora mismo. Recarga la página e inténtalo de nuevo.')); return; }
    var hist = state.history.slice();
    setBusy(true);
    a.askCommunityBot({ question: q, history: hist, postContext: state.postCtx }).then(function (res) {
      setBusy(false);
      var reply = (res && res.reply) || 'No he podido responder. Inténtalo de nuevo.';
      addMsg(res && res.ok ? 'bot' : 'bot err', md(reply));
      if (res && res.ok) {
        state.history.push({ role: 'user', content: q }, { role: 'assistant', content: reply });
        state.history = state.history.slice(-MAX_HIST); saveHist();
      }
      updateQuota();
      if (el.input && !el.input.disabled) el.input.focus();
    }).catch(function (err) {
      setBusy(false);
      addMsg('bot err', md('⚠️ Algo ha fallado al contactar con la IA. Inténtalo de nuevo en unos segundos.'));
      try { console.warn('[KINET AI]', err); } catch (e) {}
    });
  }

  function open() {
    build();
    if (!state.open) {
      state.open = true;
      loadHist(); render(); updateQuota();
      el.panel.classList.add('kcb-open');
      el.fab.style.display = 'none';
    }
    setTimeout(function () { try { el.input.focus(); } catch (e) {} }, 60);
  }
  function close() {
    if (!el.panel) return;
    state.open = false;
    el.panel.classList.remove('kcb-open');
    el.fab.style.display = '';
    try { el.fab.focus(); } catch (e) {}
  }

  // Botón "🤖 Preguntar a la IA" de cada publicación: abre el panel con la publicación como contexto y la pregunta lista (sin enviarla)
  function askAboutPost(btn) {
    build(); open();
    var card = btn && btn.closest ? btn.closest('.social-post-card') : null;
    var text = '', author = '';
    if (card) {
      var p = card.querySelector('p'); text = p ? p.textContent.trim() : '';
      var a = card.querySelector('.post-author-bar span span'); author = a ? a.textContent.trim() : '';
    }
    if (!text) { clearPost(); return; }
    setPost(text, (author ? author + ': ' : '') + text.slice(0, 44) + (text.length > 44 ? '…' : ''));
    el.input.value = '¿Qué opinas de esta publicación? Explícame lo importante y cómo podría responder.';
    autoGrow();
    try { el.input.focus(); el.input.select(); } catch (e) {}
  }

  window.KinetCommunityBot = { open: open, close: close, ask: ask, askAboutPost: askAboutPost };
  function init() { build(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
