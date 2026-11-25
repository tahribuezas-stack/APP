# Idiomas de KINET OS (EN · FR · DE · IT)

## Cómo funciona (resumen)
- El español es el idioma base y no se toca: con idioma "es" el motor (`kinet-i18n.js`) no hace nada.
- Con otro idioma carga `i18n/<idioma>.json` (una sola vez; luego queda en localStorage) y cambia **solo el texto** de la página
  (más placeholder / title / aria-label / alt). No toca estilos ni estructura. Después solo traduce los elementos nuevos que van apareciendo.
- Lo que no esté en el diccionario se queda en español (nunca se rompe nada).
- Selector: Despacho → General → "Idioma de la app", pie de la landing, o `?lang=en` en la URL. Se guarda en `kinet_lang` y en `kx_lang`.
- La IA (Cuerpo Técnico, KINET AI, etc.) responde en el idioma elegido (directiva añadida en `kinet-api-config.js`).
- `legal.html` se mantiene solo en español a propósito (texto legal).

## Estructura
- `kinet-i18n.js` motor · `i18n/*.json` diccionarios generados · `i18n-src/` fuentes
- `i18n-src/keys.json` lista de textos en español (id estable, solo se añaden al final)
- `i18n-src/chunks/*.txt` traducciones: `id¦en¦fr¦de¦it` (`=` = dejar igual, `{#}` = número, las claves `[H]` llevan HTML)
- `i18n-src/build.py` une chunks + keys y escribe `i18n/*.json` (avisa si falta un `{#}` o una etiqueta)

## Completar los textos pendientes con Gemini (un comando)
```
export GEMINI_API_KEY="tu_clave"        # Windows PowerShell: $env:GEMINI_API_KEY="tu_clave"
python3 i18n-src/autotranslate.py --dry  # cuenta lo pendiente, sin llamar a la API
python3 i18n-src/autotranslate.py        # traduce lo pendiente y regenera i18n/*.json
```
Se puede parar y repetir. Después: sube `i18n/` a GitHub y sube `var V = N;` en `kinet-i18n.js` (y el `?v=` del script en los HTML) para refrescar la caché.

## Añadir o corregir un texto a mano
1. Edita la línea correspondiente en `i18n-src/chunks/*.txt` (o añade un chunk nuevo) y ejecuta `python3 i18n-src/build.py`.
2. Para textos nuevos de la app: `python3 i18n-src/mkkeys.py` (solo añade al final de keys.json) y luego traduce los ids nuevos.
