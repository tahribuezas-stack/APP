# Vídeo ligero y moderación — qué hacer una sola vez

## 1. Moderación y denuncias (5 min, gratis)
1. Supabase → SQL Editor → pega y ejecuta `supabase/03_moderacion_trafico.sql`.
2. Las denuncias aparecen en **Table Editor → content_reports**. Marca `status` = `revisado` cuando las atiendas.
3. Para añadir palabras prohibidas sin tocar código: **Table Editor → blocked_terms → Insert row**.
4. Capas activas: filtro de texto en el navegador (+ lista editable en servidor), detector de imágenes NSFW en el navegador
   (se carga la primera vez que alguien sube una foto; si no carga, la imagen queda «sin comprobar» y se puede denunciar),
   límite de ritmo (20 publicaciones/hora, 40 mensajes/5 min) en navegador **y** servidor, y botón 🚩 Reportar en cada publicación ajena.
5. Moderación IA real (revisar cada imagen con un modelo de pago) no está activada: costaría dinero por imagen.
   Si más adelante la quieres, se añade en una Edge Function sin cambiar la app.

## 2. Vídeo de comunidad (máx. 20 s)
La app **ya comprime en el navegador** (720 p, ≈3 MB por clip de 20 s) y recorta a 20 s. Falta decidir **dónde se guarda**:

| Opción | Coste | Cuándo |
|---|---|---|
| `none` (por defecto) | 0 € | El clip solo vive en el dispositivo de quien lo sube. Nada consume Supabase. |
| `r2` (recomendado) | 10 GB gratis y descargas sin coste | Producción. ≈ 3.000 clips de 3 MB caben gratis. |
| `supabase` | Gasta tu cuota (1 GB gratis) | Solo para probar. |

### Activar Cloudflare R2
1. Cloudflare → R2 → crear bucket `kinet-videos`.
2. Bucket → Settings → **Custom Domains** → `videos.kinetos.es` (si el dominio está en Cloudflare) o activar el dominio `r2.dev` para pruebas.
3. Bucket → Settings → **CORS Policy**: permite `PUT` y `GET` desde `https://kinetos.es`, cabecera `Content-Type`.
4. R2 → Manage API tokens → token con permiso *Object Read & Write* solo sobre `kinet-videos`.
5. Supabase → SQL Editor → ejecutar `supabase/06_video_r2.sql`.
6. Supabase → Edge Functions → `video-upload-url` (código en `supabase/functions/video-upload-url/index.ts`) con los secretos
   `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_BASE`.
7. En `kinet-api-config.js` cambia `videoStorage.provider` de `'none'` a `'r2'`.

Límites en la función (por plan, se leen del servidor): Free 3 subidas/día y 100 MB en total · Pro 10/día y 1 GB · Club 30/día y 5 GB. Máx. 8 MB por clip.
Borrar una publicación con vídeo borra también el archivo de R2.
