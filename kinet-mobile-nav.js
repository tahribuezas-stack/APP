/* ==========================================================
   KINET OS · Navegación móvil compartida (barra inferior + menú)
   Se usa en las pizarras (analizador2 / analizador3), que antes
   no tenían menú completo en móvil. Si la página ya trae su propia
   barra inferior / drawer, solo completa lo que falte.
   ========================================================== */
(function () {
  'use strict';
  var LINKS = [
    ['app.html', 'drawer-vestuario', '⚡ Vestuario', 'HOY'],
    ['cuerpo-tecnico.html', 'drawer-cuerpo-tecnico', '🧠 Cuerpo Técnico IA', '→'],
    ['ficha-pro.html', 'drawer-ficha-pro', '🎴 Ficha & KINET Card', '→'],
    ['ojeador-live.html', 'drawer-ojeador-live', '🎬 Laboratorio Vídeo', '→'],
    ['analizador.html', 'drawer-analizador', '🏟️ Analizador & Pizarra 3D', '●'],
    ['comunidad.html', 'drawer-comunidad', '🌐 Comunidad / Red Social', '→'],
    ['media-studio.html', 'drawer-media-studio', '🎵 KINET Media Studio™', '→'],
    ['perfil.html', 'drawer-perfil', '👤 Mi Perfil', '→'],
    ['despacho.html', 'drawer-despacho', '⚙️ Despacho & Ajustes', '→']
  ];
  var NAV = [
    ['app.html', 'mob-vestuario', '⚡', 'Vestuario'],
    ['cuerpo-tecnico.html', 'mob-cuerpo-tecnico', '🧠', 'Técnicos'],
    ['ficha-pro.html', 'mob-ficha-pro', '🎴', 'Ficha'],
    ['analizador.html', 'mob-analizador', '🏟️', 'Pizarra']
  ];

  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function qp() {
    var u = new URLSearchParams(location.search);
    var role = ls('kinet_active_role') || u.get('role') || 'athlete';
    var sport = u.get('sport') || ls('kinet_sport') || '';
    return '?role=' + encodeURIComponent(role) + (sport ? '&sport=' + encodeURIComponent(sport) : '');
  }
  function go(base) { location.href = base + qp(); }
  function link(a, base) {
    a.setAttribute('href', base);
    a.addEventListener('click', function (e) { e.preventDefault(); go(base); });
  }

  function injectStyle() {
    if (document.getElementById('kinet-mobile-nav-style')) return;
    var st = document.createElement('style');
    st.id = 'kinet-mobile-nav-style';
    st.textContent =
      '.mobile-bottom-nav{display:none;position:fixed;bottom:12px;left:50%;transform:translateX(-50%);width:calc(100% - 24px);max-width:440px;background:rgba(8,11,18,.95);backdrop-filter:blur(24px);border:1px solid var(--border-subtle,rgba(255,255,255,.08));border-radius:20px;padding:6px;z-index:120;box-shadow:0 20px 40px rgba(0,0,0,.85);justify-content:space-around}' +
      '@media (max-width:960px){.mobile-bottom-nav{display:flex!important}}' +
      '.m-nav-btn{background:transparent;border:none;color:var(--text-secondary,#94A3B8);font-family:Inter,sans-serif;font-size:.62rem;font-weight:700;padding:6px 8px;border-radius:14px;display:flex;flex-direction:column;align-items:center;gap:3px;text-decoration:none;cursor:pointer;transition:.25s}' +
      '.m-nav-btn.active{color:var(--role-color);background:rgba(var(--role-rgb),.15)}';
    document.head.appendChild(st);
  }

  function buildNav() {
    var nav = document.querySelector('.mobile-bottom-nav');
    if (!nav) {
      injectStyle();
      nav = document.createElement('nav');
      nav.className = 'mobile-bottom-nav';
      NAV.forEach(function (n) {
        var a = document.createElement('a');
        a.id = n[1]; a.className = 'm-nav-btn' + (n[0] === 'analizador.html' ? ' active' : '');
        a.innerHTML = '<span style="font-size:1rem;">' + n[2] + '</span><span>' + n[3] + '</span>';
        link(a, n[0]);
        nav.appendChild(a);
      });
      document.body.appendChild(nav);
    }
    if (!nav.querySelector('[data-kinet-menu-btn]') && !nav.querySelector('[onclick*="toggleMobileDrawer"]')) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'm-nav-btn'; b.setAttribute('data-kinet-menu-btn', '1');
      b.innerHTML = '<span style="font-size:1rem;">☰</span><span>Menú</span>';
      b.addEventListener('click', function () { window.toggleMobileDrawer(); });
      nav.appendChild(b);
    }
  }

  function buildDrawer() {
    if (document.getElementById('mobile-menu-drawer')) return;
    var d = document.createElement('div');
    d.id = 'mobile-menu-drawer';
    d.setAttribute('aria-hidden', 'true');
    d.style.cssText = 'position:fixed;inset:0;background:rgba(6,8,14,.97);backdrop-filter:blur(28px);z-index:200;display:flex;flex-direction:column;padding:20px 16px;justify-content:space-between;transform:translateY(-100%);transition:transform .35s cubic-bezier(.16,1,.3,1);border-bottom:1px solid rgba(var(--role-rgb),.2);';
    var row = 'display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.07);color:#F8FAFC;text-decoration:none;font-weight:600;';
    var html = '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border-subtle);padding-bottom:12px;margin-bottom:12px;">' +
      '<div style="font-family:Orbitron,sans-serif;font-weight:900;font-size:.95rem;color:white;">KINET OS // MENÚ COMPLETO</div>' +
      '<button type="button" id="kinet-drawer-close" aria-label="Cerrar menú" style="background:none;border:none;color:white;font-size:1.3rem;cursor:pointer;">✕</button></div>' +
      '<div id="kinet-drawer-list" style="display:flex;flex-direction:column;gap:8px;overflow-y:auto;padding:4px 0;max-height:calc(100vh - 160px);"></div>' +
      '<div style="text-align:center;font-size:.65rem;color:var(--text-secondary);font-family:\'JetBrains Mono\',monospace;margin-top:10px;">KINET OS • MOBILE VIEWPORT</div>';
    d.innerHTML = html;
    var list = d.querySelector('#kinet-drawer-list');
    LINKS.forEach(function (l) {
      var a = document.createElement('a');
      a.id = l[1];
      var active = l[0] === 'analizador.html';
      a.style.cssText = active
        ? row.replace('background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.07);color:#F8FAFC;', 'background:rgba(var(--role-rgb),.15);border:1px solid var(--role-color);color:var(--role-color);')
        : row;
      a.innerHTML = '<span>' + l[2] + '</span><span>' + l[3] + '</span>';
      link(a, l[0]);
      list.appendChild(a);
    });
    var tier = (ls('kinet_account_tier') || 'free').toLowerCase();
    if (tier !== 'pro' && tier !== 'club') {
      var up = document.createElement('a');
      up.id = 'drawer-upgrade-pro';
      up.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-radius:14px;background:var(--role-gradient);color:#04060A;font-weight:900;text-decoration:none;';
      up.innerHTML = '<span>⚡ Pásate a KINET PRO</span><span>→</span>';
      up.addEventListener('click', function (e) { e.preventDefault(); location.href = 'despacho.html' + qp() + '&tab=subscription'; });
      up.setAttribute('href', 'despacho.html?tab=subscription');
      list.appendChild(up);
    }
    document.body.appendChild(d);
    d.querySelector('#kinet-drawer-close').addEventListener('click', function () { window.toggleMobileDrawer(); });
  }

  if (typeof window.toggleMobileDrawer !== 'function') {
    window.toggleMobileDrawer = function () {
      var d = document.getElementById('mobile-menu-drawer');
      if (!d) return;
      var open = d.style.transform === 'translateY(0px)';
      d.style.transform = open ? 'translateY(-100%)' : 'translateY(0px)';
      d.setAttribute('aria-hidden', open ? 'true' : 'false');
    };
  }

  function init() { buildDrawer(); buildNav(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
