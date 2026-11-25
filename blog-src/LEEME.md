# Blog y herramientas de KINET OS — cómo añadir contenido

Todo se genera con un script. No se edita nada a mano en /blog ni /herramientas (se sobrescribe).

    python3 blog-src/build.py        # desde la raíz del repo

Genera: /blog/*.html, /blog/index.html, /herramientas/*.html, /herramientas/index.html, sitemap.xml y robots.txt.

## Añadir un artículo
Crea `blog-src/posts/<slug>.html`:

    slug: mi-articulo
    title: Título con la palabra clave (máx. ~65 caracteres)
    desc: Descripción de 140-160 caracteres.
    cat: entrenamiento      (entrenamiento, futbol, tenis, salud, carrera, tecnologia, nutricion, mental)
    date: 2026-11-25
    mins: 7
    related: otro-slug,otro-slug-2     (artículos relacionados)
    tools: calculadora-1rm             (herramientas relacionadas)
    ---
    <p>Cuerpo en HTML...</p>
    <h2>Subtítulo</h2>   (los h2 generan el índice solos)
    {{CTA:Título del bloque|Texto del bloque}}   (bloque de llamada a la app con enlace a index + UTM)
    {{TOOL:calculadora-1rm}}                      (caja que enlaza a una herramienta)
    {{POST:otro-slug|texto del enlace}}           (enlace interno a otro artículo)

El CTA final y el enlace de cabecera se añaden solos. Todos los enlaces a la app llevan `?utm_source=blog&utm_medium=seo&utm_campaign=<slug>`.

## Añadir una herramienta
Crea `blog-src/tools/<slug>.html` con cabecera (slug, title, desc, cat: calc|plan|gen|reg, related), `---`, el HTML+JS de la herramienta, `===` y el texto explicativo (SEO). Usa `KS.bind([...ids], callback)` de `tools.js` para guardar los campos en sessionStorage (se mantienen al recargar, se borran al cerrar la pestaña, nada va a la nube).

## Reglas de calidad (importantes para Google)
- Cada artículo debe aportar contenido útil y original; evita textos clonados con solo cambiar una palabra.
- No hay redirecciones automáticas a la app: solo enlaces. Las redirecciones masivas se penalizan como "doorway pages".
- Mantén el aviso de que es información orientativa en temas de salud.
- Después de subir, envía https://kinetos.es/sitemap.xml en Google Search Console.
