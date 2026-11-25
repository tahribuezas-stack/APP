/* KINET OS · App de escritorio (Windows · Mac · Linux)
   Es una ventana propia que abre https://kinetos.es: no duplica código, así que cada vez que
   publicas una mejora en la web, la app de escritorio la recibe sola. Sin acceso a Node desde la web
   (contextIsolation + sandbox), enlaces externos al navegador del sistema. */
const { app, BrowserWindow, Menu, shell, dialog, session, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');

const START_URL = 'https://kinetos.es/app.html?source=desktop';
// Dominios que pueden cargarse DENTRO de la ventana (la web, la base de datos y el cobro de Stripe).
const INSIDE = [/(^|\.)kinetos\.es$/, /(^|\.)supabase\.co$/, /(^|\.)stripe\.com$/, /(^|\.)stripe\.network$/];
// Google no permite iniciar sesión dentro de ventanas incrustadas: se avisa y se ofrece el navegador.
const GOOGLE_AUTH = /(^|\.)accounts\.google\.com$/;

nativeTheme.themeSource = 'dark';
if (!app.requestSingleInstanceLock()) { app.quit(); }

let win = null;
const stateFile = () => path.join(app.getPath('userData'), 'window-state.json');
function loadState() { try { return JSON.parse(fs.readFileSync(stateFile(), 'utf8')); } catch (e) { return {}; } }
function saveState() {
  if (!win || win.isDestroyed()) return;
  try {
    const b = win.getNormalBounds();
    fs.writeFileSync(stateFile(), JSON.stringify({ x: b.x, y: b.y, width: b.width, height: b.height, max: win.isMaximized() }));
  } catch (e) {}
}
function hostOf(u) { try { return new URL(u).hostname; } catch (e) { return ''; } }
function isInside(u) { const h = hostOf(u); return INSIDE.some(r => r.test(h)); }

function createWindow() {
  const st = loadState();
  win = new BrowserWindow({
    width: st.width || 1360, height: st.height || 860, x: st.x, y: st.y,
    minWidth: 980, minHeight: 640,
    backgroundColor: '#06080E',
    title: 'KINET OS',
    icon: path.join(__dirname, 'build', 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: true }
  });
  if (st.max) win.maximize();
  win.once('ready-to-show', () => win.show());
  win.on('close', saveState);
  win.on('closed', () => { win = null; });

  win.loadURL(START_URL);

  // Sin internet: pantalla propia con botón de reintentar.
  win.webContents.on('did-fail-load', (_e, code, _d, url, isMain) => {
    if (!isMain || code === -3) return;   // -3 = cancelada por una navegación nueva
    win.loadFile(path.join(__dirname, 'offline.html'), { query: { u: url } });
  });

  // Enlaces nuevos (target=_blank / window.open)
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (GOOGLE_AUTH.test(hostOf(url))) { avisoGoogle(); return { action: 'deny' }; }
    if (isInside(url)) return { action: 'allow' };
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  // Navegación dentro de la misma ventana
  win.webContents.on('will-navigate', (e, url) => {
    if (url.startsWith('file://')) return;
    if (GOOGLE_AUTH.test(hostOf(url))) { e.preventDefault(); avisoGoogle(); return; }
    if (!isInside(url)) { e.preventDefault(); if (/^https?:/i.test(url)) shell.openExternal(url); }
  });
}

function avisoGoogle() {
  if (!win) return;
  dialog.showMessageBox(win, {
    type: 'info', title: 'KINET OS', buttons: ['Entendido', 'Abrir en el navegador'], defaultId: 0, cancelId: 0,
    message: 'Google no permite iniciar sesión dentro de la app de escritorio.',
    detail: 'Entra con tu correo y contraseña (la misma cuenta). Si te registraste con Google, instala KINET OS desde Chrome o Edge (kinetos.es → icono ⊕ de la barra de direcciones) y ahí sí funciona el botón de Google.'
  }).then(r => { if (r.response === 1) shell.openExternal('https://kinetos.es/movil.html#pc'); });
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const tpl = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    { label: 'KINET', submenu: [
      { label: 'Inicio (Vestuario)', accelerator: 'CmdOrCtrl+H', click: () => win && win.loadURL(START_URL) },
      { label: 'Atrás', accelerator: 'Alt+Left', click: () => win && win.webContents.canGoBack() && win.webContents.goBack() },
      { label: 'Recargar', accelerator: 'CmdOrCtrl+R', click: () => win && win.webContents.reload() },
      { type: 'separator' },
      { label: 'Ayuda y soporte', click: () => shell.openExternal('https://kinetos.es/soporte.html') },
      { type: 'separator' },
      isMac ? { role: 'close' } : { role: 'quit', label: 'Salir' }
    ] },
    { label: 'Vista', submenu: [
      { role: 'resetZoom', label: 'Zoom normal' }, { role: 'zoomIn', label: 'Acercar' }, { role: 'zoomOut', label: 'Alejar' },
      { type: 'separator' }, { role: 'togglefullscreen', label: 'Pantalla completa' }
    ] },
    { role: 'editMenu' }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(tpl));
}

app.whenReady().then(() => {
  // Permisos (cámara, micrófono, notificaciones…) solo para kinetos.es
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => {
    const ok = ['media', 'notifications', 'clipboard-read', 'clipboard-sanitized-write', 'fullscreen', 'geolocation'].includes(permission);
    cb(ok && /(^|\.)kinetos\.es$/.test(hostOf(wc.getURL())));
  });
  buildMenu();
  createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });
});
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
