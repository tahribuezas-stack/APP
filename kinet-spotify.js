/* KINET OS · Spotify real (sin catálogos inventados).
   - Conectar tu cuenta con PKCE (no necesita servidor ni secreto): búsqueda y «canciones guardadas».
   - Sin conectar: pega el enlace de una canción de Spotify.
   - La canción se muestra con el reproductor oficial de Spotify (embed): suena Spotify, no un audio nuestro.
   Requisitos de configuración (solo el equipo, una vez): crear una app en developer.spotify.com, copiar su Client ID en
   KINET_API_CONFIG.SPOTIFY_CLIENT_ID (o localStorage 'kinet_spotify_client_id') y añadir como Redirect URI la URL de media-studio.html. */
(function (root) {
  'use strict';
  var LS = root.localStorage;
  var AUTH = 'https://accounts.spotify.com/authorize', TOKEN = 'https://accounts.spotify.com/api/token', API = 'https://api.spotify.com/v1';
  function g(k) { try { return LS.getItem(k) || ''; } catch (e) { return ''; } }
  function s(k, v) { try { LS.setItem(k, v); } catch (e) {} }
  function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function clientId() { return String((root.KINET_API_CONFIG && root.KINET_API_CONFIG.SPOTIFY_CLIENT_ID) || g('kinet_spotify_client_id') || '').trim(); }
  function redirectUri() { return root.location.origin + root.location.pathname; }
  function b64url(buf) { var b = ''; new Uint8Array(buf).forEach(function (x) { b += String.fromCharCode(x); }); return btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function rand(n) { var a = new Uint8Array(n); crypto.getRandomValues(a); return b64url(a.buffer).slice(0, n); }

  function saveTokens(t) {
    s('kinet_spotify_access', t.access_token);
    if (t.refresh_token) s('kinet_spotify_refresh', t.refresh_token);
    s('kinet_spotify_exp', String(Date.now() + (t.expires_in || 3600) * 1000 - 30000));
  }
  function isConnected() { return !!(g('kinet_spotify_access') || g('kinet_spotify_refresh')); }
  function disconnect() { ['kinet_spotify_access', 'kinet_spotify_refresh', 'kinet_spotify_exp', 'kinet_spotify_user'].forEach(function (k) { try { LS.removeItem(k); } catch (e) {} }); }

  async function connect() {
    var cid = clientId();
    if (!cid) throw new Error('no-client');
    var verifier = rand(96), challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
    try { sessionStorage.setItem('kinet_spotify_verifier', verifier); sessionStorage.setItem('kinet_spotify_return', root.location.href.split('?')[0]); } catch (e) {}
    var q = new URLSearchParams({ client_id: cid, response_type: 'code', redirect_uri: redirectUri(), scope: 'user-library-read', code_challenge_method: 'S256', code_challenge: challenge });
    root.location.href = AUTH + '?' + q.toString();
  }
  // Al volver de Spotify (?code=...)
  async function handleCallback() {
    var p = new URLSearchParams(root.location.search), code = p.get('code'), verifier = '';
    try { verifier = sessionStorage.getItem('kinet_spotify_verifier') || ''; } catch (e) {}
    if (p.get('error') && /spotify/i.test(document.referrer || 'spotify')) { root.history.replaceState({}, '', redirectUri()); return { ok: false, error: p.get('error') }; }
    if (!code || !verifier) return null;
    try {
      var r = await fetch(TOKEN, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: clientId(), grant_type: 'authorization_code', code: code, redirect_uri: redirectUri(), code_verifier: verifier }) });
      var t = await r.json(); if (!r.ok) throw new Error(t.error_description || 'Error de Spotify');
      saveTokens(t); try { sessionStorage.removeItem('kinet_spotify_verifier'); } catch (e) {}
      root.history.replaceState({}, '', redirectUri());
      return { ok: true };
    } catch (e) { root.history.replaceState({}, '', redirectUri()); return { ok: false, error: e.message }; }
  }
  async function token() {
    var exp = parseInt(g('kinet_spotify_exp') || '0', 10), acc = g('kinet_spotify_access');
    if (acc && Date.now() < exp) return acc;
    var rt = g('kinet_spotify_refresh'); if (!rt) return acc || '';
    try {
      var r = await fetch(TOKEN, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: clientId(), grant_type: 'refresh_token', refresh_token: rt }) });
      var t = await r.json(); if (!r.ok) throw new Error('refresh');
      saveTokens(t); return t.access_token;
    } catch (e) { disconnect(); return ''; }
  }
  async function api(path) {
    var tk = await token(); if (!tk) throw new Error('no-token');
    var r = await fetch(API + path, { headers: { Authorization: 'Bearer ' + tk } });
    if (r.status === 401) { disconnect(); throw new Error('no-token'); }
    if (!r.ok) throw new Error('spotify-' + r.status);
    return r.json();
  }
  function mapTrack(t) { return { id: t.id, title: t.name, artist: (t.artists || []).map(function (a) { return a.name; }).join(', '), cover: (t.album && t.album.images && (t.album.images[2] || t.album.images[0]) || {}).url || '', url: 'https://open.spotify.com/track/' + t.id }; }
  async function search(q) { var d = await api('/search?type=track&limit=8&q=' + encodeURIComponent(q)); return ((d.tracks && d.tracks.items) || []).map(mapTrack); }
  async function saved() { var d = await api('/me/tracks?limit=20'); return (d.items || []).map(function (i) { return mapTrack(i.track); }); }

  function parseLink(txt) {
    var m = /(?:open\.spotify\.com\/(?:intl-[a-z]{2}\/)?track\/|spotify:track:)([A-Za-z0-9]{22})/.exec(String(txt || ''));
    return m ? m[1] : '';
  }
  // Metadatos de un enlace pegado (oEmbed público de Spotify; si falla, se guarda solo con el id)
  async function fromLink(txt) {
    var id = parseLink(txt); if (!id) return null;
    var url = 'https://open.spotify.com/track/' + id, out = { id: id, title: 'Canción de Spotify', artist: '', cover: '', url: url };
    try { var r = await fetch('https://open.spotify.com/oembed?url=' + encodeURIComponent(url)); if (r.ok) { var d = await r.json(); if (d.title) out.title = d.title; if (d.thumbnail_url) out.cover = d.thumbnail_url; } } catch (e) {}
    return out;
  }
  function embed(id, compact) {
    if (!/^[A-Za-z0-9]{22}$/.test(String(id || ''))) return '';
    return '<iframe title="Spotify" style="border:0;border-radius:12px;width:100%;height:' + (compact ? 80 : 152) + 'px;" src="https://open.spotify.com/embed/track/' + id + '?utm_source=generator&theme=0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>';
  }

  root.KinetSpotify = { clientId: clientId, redirectUri: redirectUri, isConnected: isConnected, connect: connect, disconnect: disconnect, handleCallback: handleCallback, search: search, saved: saved, parseLink: parseLink, fromLink: fromLink, embed: embed, esc: esc };
})(typeof window !== 'undefined' ? window : globalThis);
