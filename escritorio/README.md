# KINET OS · App de escritorio

Ventana propia (Electron) que abre `https://kinetos.es`. No tiene código duplicado: cuando publicas una mejora
en la web, la app de escritorio la recibe sola. Solo hay que recompilar si cambias `main.js` o el icono.

## Compilar sin instalar nada (recomendado)
1. Sube el repo a GitHub con la carpeta `.github` incluida (ojo: en Mac es una carpeta oculta; se ve con Cmd+Shift+.).
2. GitHub → **Actions** → *Instaladores de escritorio* → **Run workflow**. Tarda ~10 min.
3. En **Releases** aparece «escritorio-latest» con `KINET-OS-Setup.exe`, `KINET-OS.dmg` y `KINET-OS.AppImage`.
4. Copia esas URLs en `kinet-stores.js` (`windows`, `mac`, `linux`), por ejemplo
   `https://github.com/TU_USUARIO/TU_REPO/releases/download/escritorio-latest/KINET-OS-Setup.exe`.

## Compilar en tu ordenador
```
cd escritorio
npm install
npm start        # prueba la app
npm run dist     # genera los instaladores en escritorio/dist (solo el de tu sistema)
```

## Cosas que debes saber
- **Sin firmar:** Windows mostrará «SmartScreen» (Más información → Ejecutar de todos modos) y macOS pedirá
  clic derecho → Abrir. Quitarlo cuesta dinero (certificado de código ≈ 100-400 €/año; Apple Developer 99 USD/año).
- **Google:** el botón «Entrar con Google» no funciona dentro de ventanas incrustadas (política de Google). En la app
  de escritorio se avisa y se pide entrar con correo; la instalación desde Chrome/Edge (⊕) sí lo permite.
- Alternativa gratis y sin avisos: instalar desde Chrome/Edge (icono ⊕ en la barra de direcciones).
