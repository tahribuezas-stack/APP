# KINET OS — Lo que tienes que hacer TÚ (una sola vez, en este orden)

Yo no tengo acceso a tu cuenta de Supabase, Cloudflare, Google ni Spotify, así que estas acciones solo puedes hacerlas tú.
Cada paso indica cuánto tarda y cuánto cuesta (todo es gratis salvo el uso de IA).

## 0. Seguridad urgente (2 min)
- **Revoca la clave de Gemini antigua**: aistudio.google.com → API keys → elimina la que ya estuvo en GitHub. Crea una **nueva** (la usarás en el paso 3).

## 1. Base de datos (5 min · gratis)
Supabase → **SQL Editor** → pega y ejecuta, uno a uno y en este orden, los archivos de la carpeta `supabase/`:
1. `01_seguridad.sql` (plan, minutos, rangos) — después el bloque comentado del primer superadmin con tu correo.
2. `02_soporte.sql` (tickets de soporte)
3. `03_moderacion_trafico.sql` (denuncias, palabras prohibidas)
4. `04_menores.sql` (**protección de menores en servidor**: bloquea mensajes de adultos a menores)
5. `05_ia_limites.sql` (**límites de IA y tope del 33 %** en servidor)

## 2. Stripe webhook (10 min)
Sigue `LEEME_SEGURIDAD.md` (pasos 3–5). Los Payment Links los configuramos juntos cuando quieras (lo dejamos para después, como dijiste).

## 3. IA en el servidor (10 min · gratis) — lo que blinda límites y presupuesto
Necesitas el CLI de Supabase (`npm i -g supabase`, `supabase login`, `supabase link --project-ref bhqgsbtkwdxdxlvlcaes`).
```
supabase secrets set GEMINI_API_KEY=TU_CLAVE_NUEVA
supabase functions deploy kinet-ai-chat
```
Después, en `kinet-api-config.js` cambia `edgeFunctionsDeployed: false` a `true`, sube el cambio y listo:
- la clave de Gemini ya **no está en el navegador**;
- el plan se lee de la base de datos (nadie puede ponerse Pro desde la consola);
- las consultas al día (gratis 8 · Pro 40 · Club 100, con dos motores) y el presupuesto mensual los controla el servidor (ver LEEME_v36_ia_y_precios.md);
- si Google falla, la consulta **no se descuenta**.
Opcional: `supabase secrets set GEMINI_MODEL_PRO=... GEMINI_MODEL_FREE=... GEMINI_MODEL_LITE=...` para cambiar de modelo sin tocar código.
Ajusta los costes por consulta (`cost` en la función y `costEur` en `kinet-api-config.js`) con tu factura real de Google tras la primera semana.

## 4. Verificación del tutor por correo (10 min · gratis hasta 3.000 correos/mes)
1. Crea cuenta en resend.com, verifica tu dominio (o usa `onboarding@resend.dev` para probar) y copia la API key.
2. ```
   supabase secrets set RESEND_API_KEY=... MAIL_FROM="KINET OS <no-responder@kinetos.es>" APP_URL=https://kinetos.es
   supabase functions deploy guardian-consent --no-verify-jwt
   ```
3. En `kinet-api-config.js` pon `guardianVerification: true`.
Hasta que lo actives, la app aplica todas las protecciones de menores, pero no envía el correo al tutor.

## 5. Vídeo de comunidad (15 min · gratis hasta 10 GB)
Sigue `LEEME_VIDEO_Y_MODERACION.md` §2 (Cloudflare R2 + función `video-upload-url`) y cambia `videoStorage.provider` a `'r2'`.
(Lo dejamos para después, como dijiste: mientras tanto el vídeo se queda en el dispositivo de quien lo sube.)

## 6. Spotify (10 min · gratis) — lo hacemos cuando quieras
1. developer.spotify.com/dashboard → **Create app** (nombre "KINET OS"; API: Web API).
2. **Redirect URI**: `https://kinetos.es/media-studio.html` (exactamente esa URL; si pruebas en local añade también la de local).
3. Copia el **Client ID** y pégalo en `kinet-api-config.js` → `SPOTIFY_CLIENT_ID: '...'` (o dímelo y lo pongo).
4. Mientras la app esté en "Development mode" solo pueden entrar hasta 25 usuarios que añadas en *User Management*. Para abrirla a todos hay que pedir "Extended Quota" a Spotify.

## 7. Datos legales (2 min)
Abre `legal.html`, busca `window.KINET_LEGAL` al final del archivo y rellena titular, NIF, domicilio y correo. Cuando no quede nada en amarillo, el aviso de "BORRADOR" se oculta solo. Pide a un profesional jurídico que lo revise (sobre todo menores y datos de salud).


## 7. IA de imágenes en el servidor (v44) — arregla «La clave de IA no es válida…»
Antes las imágenes se pedían a Google desde el navegador con una clave local (por eso fallaba para los usuarios). Ahora las genera la función `kinet-image`:
1. Supabase → SQL Editor → ejecuta `11_imagenes.sql`.
2. `supabase functions deploy kinet-image` (usa el mismo secreto `GEMINI_API_KEY` que `kinet-ai-chat`; si ya lo pusiste, no hace falta repetirlo).
3. Listo: el plan, el cupo diario (Pro 2 · Club 4) y el presupuesto mensual los controla el servidor, y si Google falla la imagen no se descuenta.
Si algún modelo de imagen cambia de nombre: `supabase secrets set IMAGE_MODELS="modelo1,modelo2"`.
Si Google responde 403 con tu clave, entra en aistudio.google.com y comprueba que la clave tiene acceso a los modelos de imagen (puede requerir facturación activada).

## 8. Análisis de vídeo en el servidor (v44)
`supabase functions deploy kinet-vision-lab` (mismo secreto `GEMINI_API_KEY`). El navegador manda solo 6 fotogramas pequeños; **el vídeo no se sube ni se guarda**. En el dispositivo quedan únicamente las estadísticas del análisis y una miniatura diminuta.

## 9) Mural de la Directiva (Gestión › Directiva)
1. Supabase → SQL Editor → pega y ejecuta `supabase/12_directiva.sql`.
2. Recarga Gestión. Hasta que lo hagas, el mural funciona en **modo local** (las notas solo se ven en tu navegador).
3. «Finanzas y márgenes» no necesita nada: calcula con tus usuarios de pago reales y tus gastos fijos (se guardan en el navegador).
