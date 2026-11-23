/* KINET OS · Multiequipo (Club & Scout Pro).
   Cada equipo tiene su propia plantilla, formación, banquillo, jugadas, rival y preseleccionados.
   El equipo "principal" usa las claves de siempre (sin sufijo), así que nada de lo ya guardado cambia.
   Uso: KinetTeams.key(sport) → 'futbol' | 'futbol__t3ab12' (para componer las claves de localStorage). */
(function (root) {
  'use strict';
  var LS = root.localStorage;
  var MAX_CLUB_TEAMS = 12;
  var SCOPED = ['kinet_custom_players_', 'kinet_shortlist_', 'kinet_calibrated_overrides_', 'kinet_full_board_state_', 'kinet_staff_bench_slots_', 'kinet_saved_tactics_', 'kinet_rival_cfg_'];
  function g(k) { try { return LS.getItem(k); } catch (e) { return null; } }
  function s(k, v) { try { LS.setItem(k, v); } catch (e) {} }
  function sp(sport) { return String(sport || g('kinet_sport') || 'Fútbol').toLowerCase(); }
  function isClub() { var t = String(g('kinet_account_tier') || 'free').toLowerCase().trim(); return t === 'club'; }
  function list(sport) { var a = []; try { a = JSON.parse(g('kinet_teams_' + sp(sport)) || '[]'); } catch (e) {} return Array.isArray(a) ? a.filter(function (t) { return t && t.id && t.name; }) : []; }
  function mainName() { return g('kinet_team_main_name') || 'Equipo principal'; }
  function all(sport) { return [{ id: 'main', name: mainName() }].concat(list(sport)); }
  function activeId(sport) {
    var id = g('kinet_active_team_' + sp(sport)) || 'main';
    if (!isClub()) return 'main';                                    // sin plan Club solo existe el equipo principal
    return all(sport).some(function (t) { return t.id === id; }) ? id : 'main';
  }
  function suffix(sport) { var id = activeId(sport); return id === 'main' ? '' : '__' + id; }
  function key(sport) { return sp(sport) + suffix(sport); }
  function activeName(sport) { var id = activeId(sport); var t = all(sport).filter(function (x) { return x.id === id; })[0]; return t ? t.name : mainName(); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function clean(n) { return String(n || '').replace(/\s+/g, ' ').trim().slice(0, 32); }

  function add(sport, name) {
    if (!isClub()) return { ok: false, error: 'plan' };
    name = clean(name); if (name.length < 2) return { ok: false, error: 'nombre' };
    var l = list(sport); if (l.length + 1 >= MAX_CLUB_TEAMS) return { ok: false, error: 'max' };
    if (all(sport).some(function (t) { return t.name.toLowerCase() === name.toLowerCase(); })) return { ok: false, error: 'repetido' };
    var id = 't' + Math.random().toString(36).slice(2, 8);
    l.push({ id: id, name: name }); s('kinet_teams_' + sp(sport), JSON.stringify(l));
    return { ok: true, id: id };
  }
  function rename(sport, id, name) {
    name = clean(name); if (name.length < 2) return false;
    if (id === 'main') { s('kinet_team_main_name', name); return true; }
    var l = list(sport); l.forEach(function (t) { if (t.id === id) t.name = name; }); s('kinet_teams_' + sp(sport), JSON.stringify(l)); return true;
  }
  function remove(sport, id) {
    if (id === 'main') return false;
    var base = sp(sport), suf = '__' + id;
    SCOPED.forEach(function (p) { try { LS.removeItem(p + base + suf); } catch (e) {} });
    s('kinet_teams_' + base, JSON.stringify(list(sport).filter(function (t) { return t.id !== id; })));
    if (g('kinet_active_team_' + base) === id) s('kinet_active_team_' + base, 'main');
    return true;
  }
  function switchTo(sport, id) { s('kinet_active_team_' + sp(sport), id); try { if (root.KinetBackend && root.KinetBackend.pushLocalStateToCloud) root.KinetBackend.pushLocalStateToCloud(); } catch (e) {} root.location.reload(); }

  function mount(elOrId, sport) {
    var host = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId; if (!host) return;
    var club = isClub();
    host.style.position = 'relative'; host.style.display = 'inline-block';
    host.innerHTML = '<button type="button" class="kinet-team-btn" style="background:rgba(var(--role-rgb,0,255,136),.08);border:1px solid rgba(var(--role-rgb,0,255,136),.45);color:var(--role-color,#00FF88);border-radius:999px;padding:4px 11px;font:700 .68rem \'JetBrains Mono\',monospace;cursor:pointer;white-space:nowrap">🏟️ ' + esc(activeName(sport)) + ' ▾</button>';
    var btn = host.querySelector('.kinet-team-btn');
    var pop = document.getElementById('kinet-team-pop');
    if (pop) pop.remove();
    pop = document.createElement('div'); pop.id = 'kinet-team-pop'; pop.hidden = true;
    pop.style.cssText = 'position:fixed;z-index:100000;width:270px;max-width:90vw;background:#0B0F16;border:1px solid rgba(0,255,136,.5);border-radius:14px;padding:10px;box-shadow:0 12px 40px rgba(0,0,0,.7);text-align:left;font-family:Inter,system-ui,sans-serif;color:#E2E8F0';
    document.body.appendChild(pop);
    function place() { var r = btn.getBoundingClientRect(); var w = Math.min(270, window.innerWidth * 0.9); pop.style.top = (r.bottom + 6) + 'px'; pop.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w)) + 'px'; }
    function render(msg) {
      var act = activeId(sport), items = club ? all(sport) : all(sport).slice(0, 1);
      pop.innerHTML = '<div style="font:700 .6rem monospace;letter-spacing:.08em;color:#94A3B8;text-transform:uppercase;margin-bottom:6px">Tus equipos' + (club ? ' (' + items.length + '/' + MAX_CLUB_TEAMS + ')' : '') + '</div>' +
        items.map(function (t) { return '<button type="button" data-id="' + t.id + '" style="display:flex;width:100%;justify-content:space-between;align-items:center;gap:8px;background:' + (t.id === act ? 'rgba(var(--role-rgb,0,255,136),.14)' : 'transparent') + ';border:1px solid ' + (t.id === act ? 'rgba(var(--role-rgb,0,255,136),.5)' : '#1E293B') + ';border-radius:9px;padding:7px 9px;color:#E2E8F0;font-size:.78rem;cursor:pointer;margin-bottom:5px"><span>' + esc(t.name) + '</span>' + (t.id === act ? '<span style="color:var(--role-color,#00FF88)">●</span>' : '') + '</button>'; }).join('') +
        (club ? '<div style="display:flex;gap:6px;margin-top:6px"><input class="kt-new" maxlength="32" placeholder="Nuevo equipo (ej. Juvenil A)" autocomplete="off" data-lpignore="true" style="flex:1;min-width:0;background:#12161C;border:1px solid #1E293B;border-radius:8px;padding:6px 8px;color:#fff;font-size:.74rem"><button type="button" class="kt-add" style="border:0;border-radius:8px;background:var(--role-color,#00FF88);color:#04060A;font-weight:800;padding:0 10px;cursor:pointer">＋</button></div>' +
          '<div style="display:flex;gap:6px;margin-top:8px"><button type="button" class="kt-ren" style="flex:1;border:1px solid #334155;background:transparent;color:#CBD5E1;border-radius:8px;padding:5px;font-size:.68rem;cursor:pointer">Renombrar</button>' + (act !== 'main' ? '<button type="button" class="kt-del" style="flex:1;border:1px solid #7F1D1D;background:transparent;color:#FCA5A5;border-radius:8px;padding:5px;font-size:.68rem;cursor:pointer">Eliminar</button>' : '') + '</div>'
          : '<div style="font-size:.7rem;line-height:1.4;color:#94A3B8;margin-top:6px;border-top:1px solid #1E293B;padding-top:8px">🔒 Gestiona varios equipos (cada uno con su plantilla, formación y jugadas) con <a href="despacho.html" style="color:var(--role-color,#00FF88);font-weight:700">Club &amp; Scout Pro</a>.</div>') +
        '<div class="kt-msg" style="font-size:.68rem;color:#F87171;min-height:14px;margin-top:6px">' + esc(msg || '') + '</div>';
      Array.prototype.forEach.call(pop.querySelectorAll('button[data-id]'), function (b) { b.onclick = function () { if (b.dataset.id !== act) switchTo(sport, b.dataset.id); }; });
      var a = pop.querySelector('.kt-add'), n = pop.querySelector('.kt-new');
      if (a) { var go = function () { var r = add(sport, n.value); if (!r.ok) return render({ plan: 'Necesitas el plan Club & Scout Pro.', nombre: 'Escribe un nombre (mín. 2 letras).', max: 'Has llegado al máximo de equipos.', repetido: 'Ya existe un equipo con ese nombre.' }[r.error]); switchTo(sport, r.id); }; a.onclick = go; n.onkeydown = function (e) { if (e.key === 'Enter') go(); }; }
      var rn = pop.querySelector('.kt-ren'); if (rn) rn.onclick = function () { var nn = root.prompt('Nuevo nombre del equipo', activeName(sport)); if (nn !== null && rename(sport, act, nn)) { render(); btn.innerHTML = '🏟️ ' + esc(activeName(sport)) + ' ▾'; } };
      var dl = pop.querySelector('.kt-del'); if (dl) dl.onclick = function () { if (root.confirm('¿Eliminar "' + activeName(sport) + '" con su plantilla, formación y jugadas? No se puede deshacer.')) { remove(sport, act); root.location.reload(); } };
    }
    btn.onclick = function (e) { e.stopPropagation(); if (pop.hidden) { render(); place(); pop.hidden = false; } else pop.hidden = true; };
    document.addEventListener('click', function (e) { if (!host.contains(e.target) && !pop.contains(e.target)) pop.hidden = true; });
  }

  root.KinetTeams = { key: key, suffix: suffix, list: list, all: all, activeId: activeId, activeName: activeName, add: add, rename: rename, remove: remove, mount: mount, max: MAX_CLUB_TEAMS, isClub: isClub };
})(window);
