# KINET OS · App móvil: qué está hecho y qué te toca a ti

> Resumen en una frase: **ya puedes usar KINET OS como app en cualquier móvil (gratis, hoy)**.
> Subirla a Google Play es opcional, cuesta 25 € una vez y tarda unas 3 semanas por una norma de Google (ver paso B).

---

## ✅ Ya hecho por mí (no tienes que tocar nada)

| Qué | Dónde |
|---|---|
| App instalable (PWA): nombre, colores, iconos, accesos directos | `manifest.webmanifest`, `sw.js`, `icons/` |
| **Guía para usuarios** con dibujos (iPhone, Android, Samsung, PC) y primeros pasos | `movil.html` (enlazada desde Despacho › General y desde "Instalar la app") |
| **Ventana "Abrir App"** en la portada: navegador / acceso directo / Google Play / App Store | `kinet-launch.js` (botón verde de abajo en `index.html`) |
| **Sitio único para los enlaces de tienda** (ahora vacíos → muestran «Próximamente») | `kinet-stores.js` |
| Recursos de la ficha de Google Play listos para subir | carpeta `tienda/` (icono, gráfico, 6 capturas, textos) |
| **App de ordenador (PC/Mac/Linux)**: instalable desde Chrome/Edge (gratis, ya funciona) + proyecto Electron para instaladores `.exe/.dmg/.AppImage` | `escritorio/`, `.github/workflows/build-escritorio.yml`, `manifest.webmanifest` (capturas de instalación en `icons/shots/`) |
| Plantilla de verificación de dominio para la app de Play | `.well-known/assetlinks.json` (vacío, se rellena en el paso B5) |

### Sobre los iconos (tu duda)
**No tienes que hacer nada.** Ya existen y están bien:
- `icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` (para Android) y `apple-touch-icon.png` (iPhone).
- Para Google Play he preparado `tienda/play-icono-512.png` (512×512, sin transparencia, que es lo que pide la tienda).

---

## A) Lo que puedes hacer HOY (gratis, 0 minutos de trámites)

1. Sube el zip a GitHub como siempre y haz recarga fuerte.
2. Abre `kinetos.es` en tu móvil y sigue **movil.html** (o pulsa «Abrir App» en la portada → «Acceso directo»).
3. Comparte el enlace `kinetos.es/movil.html` con quien quiera instalarla.

Con esto ya tienes: icono propio, pantalla completa, sin barra del navegador y actualizaciones automáticas.

---

## B) Publicar en Google Play (opcional)

**Coste:** 25 USD, pago único. **Tiempo realista:** ~3 semanas (casi todo es esperar).

### Lo que tienes que saber ANTES de pagar
1. **Norma de Google para cuentas personales nuevas** (creadas después del 13/11/2023): antes de poder publicar hay que hacer una **prueba cerrada con al menos 12 testers que se mantengan apuntados 14 días seguidos**. Fuente oficial: [Ayuda de Play Console](https://support.google.com/googleplay/android-developer/answer/14151465). Si abres la cuenta como **organización/empresa** (hace falta número D-U-N-S) no se aplica.
2. **Pagos:** KINET OS vende suscripciones con Stripe. Google exige su propio sistema de pago (Google Play Billing) para vender contenido digital *dentro* de apps de Play. Antes de publicar, lee «Política de pagos de Google Play». Opciones: (a) publicar la app en Play solo con el plan gratis y sin botones de pago dentro, y que se suscriban desde la web; o (b) integrar Play Billing (PWABuilder lo soporta, pero es más trabajo). Decídelo antes de subir.
3. **Menores:** tu app permite 14–17 años con autorización del tutor. En la ficha elige público objetivo **«13+»** o **«18+»** según lo que quieras y responde con sinceridad al cuestionario (ver `textos-ficha-play.md`).

### Pasos
- [ ] **B1.** Crea la cuenta en https://play.google.com/console (25 USD, verificación de identidad con DNI y teléfono).
- [ ] **B2.** Entra en https://www.pwabuilder.com, escribe `https://kinetos.es`, pulsa **Package for stores → Android**. Id del paquete sugerido: `es.kinetos.app`. Descarga el `.zip`: trae el archivo `.aab`, tu **clave de firma** y las instrucciones. **Guarda la clave y su contraseña en 2 sitios (si la pierdes no puedes actualizar la app).**
- [ ] **B3.** En Play Console: *Crear app* → sube el `.aab` a **Pruebas cerradas** → añade 12+ testers (amigos, tu club…) por correo → que acepten y se queden 14 días.
- [ ] **B4.** Rellena la ficha con lo de la carpeta `tienda/`:
  - Icono: `play-icono-512.png` · Gráfico destacado: `play-grafico-destacado-1024x500.png` · Capturas: `capturas-telefono/` (mínimo 2, he dejado 6)
  - Textos, categoría, política de privacidad (`https://kinetos.es/legal.html`), seguridad de los datos y clasificación: todo en `textos-ficha-play.md`
  - URL para pedir el borrado de cuenta: `https://kinetos.es/despacho.html` (Despacho › Privacidad › Eliminar cuenta)
- [ ] **B5.** **Quitar la barra del navegador dentro de la app.** En Play Console → *Integridad de la app* → copia la huella **SHA-256** del certificado de firma. Pégala en `.well-known/assetlinks.json` con este formato (cambia solo la huella) y sube el archivo a GitHub:
  ```json
  [{
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": { "namespace": "android_app", "package_name": "es.kinetos.app", "sha256_cert_fingerprints": ["AA:BB:...:ZZ"] }
  }]
  ```
  Compruébalo abriendo `https://kinetos.es/.well-known/assetlinks.json`.
- [ ] **B6.** Cuando hayan pasado los 14 días: *Solicitar acceso a producción* → Google revisa (días) → publicada.
- [ ] **B7.** Pega el enlace de tu app en **`kinet-stores.js`** (`play: 'https://play.google.com/store/apps/details?id=es.kinetos.app'`), sube el archivo y el botón «Próximamente» de la portada y de la guía se activa solo.

---

## C-bis) App de ordenador (PC · Mac · Linux)
**Opción 1 – gratis y ya funcionando (recomendada):** abre `kinetos.es` en Chrome o Edge → icono **⊕** a la derecha de la barra de direcciones → *Instalar*. Se abre en su propia ventana, con icono en el escritorio, y se actualiza sola. Además mantiene «Entrar con Google». Guía con dibujos: `kinetos.es/movil.html#pc` (también desde «Abrir App» → «App de ordenador»).

**Opción 2 – instaladores clásicos (.exe / .dmg / .AppImage), también gratis:**
1. Sube el repo a GitHub **incluyendo la carpeta oculta `.github`** (en Mac se ve con Cmd+Shift+.; si arrastras la carpeta a la web de GitHub, comprueba que `.github/workflows/build-escritorio.yml` aparece en el repo).
2. GitHub → **Actions** → *Instaladores de escritorio* → **Run workflow** (~10 min).
3. En **Releases → escritorio-latest** estarán los tres archivos. Pega sus enlaces en `kinet-stores.js` (`windows`, `mac`, `linux`) y los botones de «Abrir App» y de `movil.html` se activan solos.
- Van **sin firmar**: Windows mostrará SmartScreen («Más información → Ejecutar de todos modos») y macOS pedirá clic derecho → Abrir. Quitarlo cuesta dinero (certificados ≈ 100-400 €/año; Apple Developer 99 USD/año).
- «Entrar con Google» **no funciona** dentro de la app de escritorio (Google lo prohíbe en ventanas incrustadas): avisa y hay que entrar con correo. Con la opción 1 sí funciona.
- No he podido compilar ni probar los instaladores en mi entorno (sin red para descargar Electron): la primera ejecución del workflow es la prueba real. Si falla, pásame el log.

---

## C) App Store (iPhone): mi recomendación es **no hacerlo todavía**
- Cuesta **99 USD al año** y necesitas un Mac para generar el proyecto.
- Apple suele **rechazar webs "envueltas"** sin funciones propias de la app, y exige **compras dentro de la app** (Stripe no vale).
- En iPhone ya funciona el acceso directo desde Safari (explicado en `movil.html`). Revisa esto cuando tengas usuarios que lo pidan.

---

## D) Lista rápida de lo que te toca (en orden)
1. [ ] Subir este zip y recargar.
2. [ ] Instalar tú la app en tu móvil con `movil.html` y comprobar que va bien.
3. [ ] Decidir: ¿Play ahora o más adelante? (si lo haces: paso B, empezando por decidir lo de los pagos).
4. [ ] Cuando tengas enlace de tienda (o de los instaladores de PC): rellenar `kinet-stores.js`.
4b. [ ] PC: instalar desde Chrome/Edge para probar (opción 1) y, si quieres instaladores, lanzar el workflow (opción 2).
5. [ ] Antes de la verificación de marca de Google: rellenar el hueco pendiente de `legal.html`.

## Acceso a Gestión como super admin (sin cambios)
El rango sale del servidor (`profiles.staff_role`). Si no aparece «Gestión»: ejecuta `supabase/01_seguridad.sql` y `supabase/07_gestion.sql` una vez, luego
`update public.profiles set staff_role = 'superadmin' where lower(email) = lower('TU_CORREO@ejemplo.com');`,
cierra sesión y vuelve a entrar. En móvil: Menú → **🛡️ Gestión (Jefe)**; en escritorio: conmutador APP / GESTIÓN.
