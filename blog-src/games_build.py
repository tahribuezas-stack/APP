"""KINET OS · generador de /juegos (sala de juegos + 10 juegos). Se llama desde build.py."""
import os, glob, shutil, html, json

GAMES = [
    {'slug': 'ojeador-de-fichas', 'n': '01', 'js': 'g-ojeo.js', 'css': 'css-ojeo.css', 'tag': 'Quiz de ojo', 'time': '1 min',
     'h1': 'Ojeador <em>de fichas</em>', 'name': 'Ojeador de fichas', 'short': 'Detecta los fallos de una ficha antes de que se acabe el tiempo.',
     'title': 'Ojeador de fichas: encuentra los fallos del jugador | KINET OS',
     'desc': 'Tienes 20 segundos para encontrar los fallos de la ficha de un jugador, como haría un ojeador. Juego gratis, sin registro, para fútbol, baloncesto, tenis y running.',
     'how': ['Elige tu deporte.', 'Se abre una ficha y empieza la cuenta atrás de 20 segundos.', 'Toca los datos que un ojeador descartaría: foto, vídeo, contacto, estadísticas, biografía…', 'Cuidado: marcar datos que estaban bien resta puntos. Al terminar verás qué detectaste, qué se te escapó y por qué importa.'],
     'seo': 'Un ojeador lee decenas de fichas al día y decide en segundos. Este juego te enseña los errores más comunes de una ficha deportiva: foto descuidada, vídeo eterno, contacto poco profesional, estadísticas sin contexto o biografías vacías. Aprende a evitarlos y crea tu ficha real en KINET.'},
    {'slug': 'torre-de-niveles', 'n': '02', 'js': 'g-reglas.js', 'deps': ['g-torre-data.js'], 'css': 'css-reglas.css', 'tag': 'Quiz de reglas', 'time': '3 min',
     'h1': 'Torre de <em>niveles</em>', 'name': 'Torre de niveles', 'short': 'Siete niveles de Bronce a Experto: reglas, cultura e historia.',
     'title': 'Torre de niveles: quiz deportivo con rangos | KINET OS',
     'desc': 'Quiz de fútbol, baloncesto, tenis y pádel y running con 7 niveles y rangos de Bronce a Experto: reglas, cultura e historia. Gratis y sin registro.',
     'how': ['Elige tu deporte.', 'Cada nivel tiene 5 preguntas y un tiempo límite por respuesta.', 'Supera el nivel para ganar su rango: Bronce, Plata, Oro, Platino, Diamante, Leyenda y Experto.', 'Cada nivel es más difícil: empiezas con lo básico y acabas en modo experto. Si fallas, reintentas con preguntas nuevas.'],
     'seo': 'Conocer bien el reglamento te hace mejor jugador y mejor entrenador. Pon a prueba tus conocimientos de fútbol, baloncesto, tenis y pádel o running y consigue tu rango, de Bronce a Experto. Puedes retar a tus amigos compartiendo tu resultado.'},
    {'slug': 'ficha-secreta', 'n': '03', 'js': 'g-ficha.js', 'css': 'css-ficha.css', 'tag': 'Reto diario', 'time': '2 min',
     'h1': 'Ficha <em>secreta</em>', 'name': 'Ficha secreta', 'short': 'Adivina al deportista misterioso del día con 6 intentos.',
     'title': 'Ficha secreta: adivina el deportista del día | KINET OS',
     'desc': 'Un deportista misterioso nuevo cada día. Tienes 6 intentos y pistas de posición, edad, altura, país y nivel. Gratis, sin registro y para cuatro deportes.',
     'how': ['Cada día hay un deportista misterioso por deporte.', 'Escribe un nombre y compara: verde acierta, ámbar se acerca, las flechas indican si es más o menos.', 'Tienes 6 intentos.', 'Comparte tu cuadrícula sin spoilers y vuelve mañana.'],
     'seo': 'Un reto diario al estilo de los juegos de adivinar: deportistas ficticios con ficha completa, para que nadie tenga ventaja por conocer a un jugador real. Cuatro deportes, una racha que se guarda en tu navegador y un resultado que puedes compartir.'},
    {'slug': 'reflejos', 'n': '04', 'js': 'g-reflejos.js', 'css': 'css-reflejos.css', 'tag': 'Arcade', 'time': '1 min',
     'h1': 'Reflejos <em>de campeón</em>', 'name': 'Reflejos', 'short': 'Un mini-juego distinto por deporte: portero, defensa, sprint y tenis.',
     'title': 'Reflejos: juego de reacción deportivo | KINET OS',
     'desc': 'Cuatro mini-juegos de reflejos: para bajo los palos como portero, tapa lanzamientos en baloncesto, reacciona al pistoletazo en running y resta en un partido de tenis. Gratis, sin registro, en móvil y ordenador.',
     'how': ['Elige tu deporte: cada uno es un juego distinto con su propio estadio.', 'Fútbol: mueve los guantes y ataja. Baloncesto: salta a tapar justo al soltar el balón, sin morder las fintas.', 'Running: espera el disparo (si sales antes, falsa salida) y pulsa rápido alternando los lados. Tenis: muévete y golpea cuando la bola entre en el aro.', 'Encadena aciertos para subir el multiplicador y bate tu récord.'],
     'seo': 'Entrena la velocidad de reacción con cuatro mini-juegos distintos: portero en fútbol, defensa de tiro en baloncesto, salida y sprint en atletismo y resto en tenis. Estadios con grada animada, controles para móvil, teclado y ratón, y dificultad que sube con el tiempo.'},
    {'slug': 'once-con-presupuesto', 'n': '05', 'js': 'g-once.js', 'deps': ['g-names.js'], 'css': 'css-once.css', 'tag': 'Estrategia', 'time': '4 min',
     'h1': 'Tu once con <em>presupuesto</em>', 'name': 'Once con presupuesto', 'short': 'Monta el mejor equipo con 100 puntos de presupuesto y reta a un amigo.',
     'title': 'Once con presupuesto: monta tu equipo y reta a un amigo | KINET OS',
     'desc': 'Elige a tus jugadores con un presupuesto limitado y consigue la mejor nota de equipo. Fútbol, baloncesto, dobles y relevos. Gratis, sin registro y con enlace para retar a un amigo.',
     'how': ['Elige tu deporte y la formación.', 'Toca un hueco del campo y elige a un jugador de la lista.', 'Cuida el presupuesto: los mejores cuestan más. Las leyendas valen todavía más, pero conectan gratis con sus vecinos.', 'Las conexiones entre jugadores (mismo país o club) suman puntos. Si no te convence el mercado, puedes renovarlo hasta 3 veces. Comparte tu equipo y reta a un amigo.'],
     'seo': 'Un juego de gestión sencillo y adictivo: poco presupuesto, muchas decisiones. Aprende a equilibrar estrellas y relleno, a respetar posiciones y a crear química en el equipo, como hace un cuerpo técnico de verdad. Los nombres son de deportistas reales a modo de referencia; las valoraciones y los precios son inventados para el juego y no tienen ninguna relación oficial.'},
    {'slug': 'adivina-la-jugada', 'n': '06', 'js': 'g-jugada.js', 'css': 'css-jugada.css', 'tag': 'Táctica', 'time': '3 min',
     'h1': 'Adivina <em>la jugada</em>', 'name': 'Adivina la jugada', 'short': 'Jugadas en vídeo táctico, 5 niveles y rangos: decide mejor que el rival.',
     'title': 'Adivina la jugada: test de táctica deportiva | KINET OS',
     'desc': 'Ves una jugada en un tablero táctico, se congela en el momento clave y eliges la mejor decisión. Cinco niveles de dificultad creciente con jugadas de varias decisiones en fútbol, baloncesto, tenis y running. Sube de rango hasta estratega. Gratis, sin registro.',
     'how': ['Elige tu deporte.', 'Mira la jugada hasta que se congele.', 'Elige la mejor entre varias opciones (A, B, C…). En los niveles altos la jugada continúa con nuevas decisiones.', 'Supera los 5 niveles y sube de rango: de aficionado a estratega.'],
     'seo': 'La táctica se aprende viendo y decidiendo. Con una sala de vídeo en miniatura, cada jugada se congela en el momento clave para que elijas la mejor opción y compruebes qué habría pasado. Así piensa un analista táctico.'},
    {'slug': 'sprint-60', 'n': '07', 'js': 'g-sprint.js', 'css': 'css-sprint.css', 'tag': 'Ritmo', 'time': '60 s',
     'h1': 'Sprint <em>de 60 segundos</em>', 'name': 'Sprint 60', 'short': 'Mantén la cadencia: toca izquierda y derecha al ritmo de las zancadas.',
     'title': 'Sprint de 60 segundos: juego de cadencia y ritmo | KINET OS',
     'desc': 'Mantén la cadencia durante 60 segundos tocando izquierda y derecha al ritmo. Corre, conduce, bota o desplázate según el deporte. Gratis y sin registro.',
     'how': ['Elige tu deporte.', 'Las marcas bajan por el carril: toca izquierda o derecha cuando lleguen a la línea.', 'La cadencia sube durante el minuto: no pierdas el ritmo.', 'Cuantos más aciertos seguidos, más rápido avanzas.'],
     'seo': 'La cadencia —los pasos o toques por minuto— es clave en carrera, conducción de balón o desplazamientos. Este minijuego de ritmo la entrena: mantén el compás, no te caigas y consigue la mayor distancia.'},
    {'slug': 'modo-carrera', 'n': '08', 'js': 'g-carrera.js', 'deps': ['g-names.js', 'g-carrera-data.js', 'g-partido.js'], 'css': 'css-carrera.css', 'tag': 'Carrera', 'time': '12 min',
     'h1': 'Modo <em>carrera</em>', 'name': 'Modo carrera', 'short': 'Monta tu equipo con cartas y juega la temporada partido a partido: controlas a tu jugador, pasas, chutas y decides desde la vista de portería.',
     'title': 'Modo carrera: gestiona tu equipo en una temporada rápida | KINET OS',
     'desc': 'Elige tu equipo con cartas al azar y juega una temporada rápida contra clubes reales e inventados: partidos jugables con intro, repeticiones y celebraciones, y definición deslizando el dedo. Fútbol, baloncesto, tenis y running. Gratis y sin registro.',
     'how': ['Elige tu deporte y ponle nombre a tu equipo.', 'Ficha a tus jugadores: cada puesto te ofrece tres cartas al azar.', 'Antes de cada partido elige tu plan (ofensivo, equilibrado o defensivo) y juégalo: arrastra para mover a tu jugador, pasa y chuta. En tenis juegas los puntos y en running corres los relevos.', 'Cuando llegue la ocasión, desliza el dedo para definir y para parar los disparos rivales. Los dos primeros de la liga juegan la final.'],
     'seo': 'Un modo carrera exprés: draft con cartas, cinco jornadas jugables, final y tanda de desempate. Elige el plan de partido, mueve a tu equipo, combina con pases y define en la vista de portería. Los clubes y las selecciones aparecen solo como referencia: plantillas, valoraciones y resultados son ficticios y no oficiales.'},
    {'slug': 'duelo-online', 'n': '09', 'js': 'g-duelo.js', 'deps': ['g-carrera-data.js'], 'css': 'css-duelo.css', 'tag': 'Online', 'time': '4 min',
     'h1': 'Duelo del <em>míster</em> online', 'name': 'Duelo del míster online', 'short': 'Crea una sala, pasa el código a tus amigos y responded a la misma jugada táctica contra reloj. Sin registro y sin guardar nada.',
     'title': 'Duelo del míster online: juega con amigos sin registro | KINET OS',
     'desc': 'Juego online gratis para jugar con amigos: crea una sala con código y decidid la mejor jugada táctica de fútbol, baloncesto, tenis o running a la vez. Sin registro y sin guardar datos.',
     'how': ['Elige tu deporte, pon un apodo y crea una sala. Te daremos un código corto (por ejemplo F-K7M2).', 'Pasa el código o el enlace a tus amigos: caben hasta seis jugadores.', 'Cada jugada aparece a la vez en todas las pantallas. Elige la mejor decisión antes de que se acabe el tiempo: acertar da puntos y ser rápido, más.', 'Tras ocho jugadas se corona al míster del grupo. Al salir, la sala desaparece y no queda nada guardado.'],
     'seo': 'Un juego multijugador sin cuentas ni base de datos: los mensajes viajan por un canal de tiempo real y no se almacenan. Solo se ve el apodo que escribas, y solo durante la partida. Las jugadas son de criterio táctico: ataque posicional, transiciones, presión, balón parado, ritmo y gestión del partido.'},
]
ICONS = {'ojeador-de-fichas': 'M10 4a6 6 0 104 10.5l5 5 1.5-1.5-5-5A6 6 0 0010 4z', 'torre-de-niveles': 'M4 18l8 4 8-4M4 13l8 4 8-4M4 8l8 4 8-4-8-4z', 'ficha-secreta': 'M5 4h14v16H5zM9 9h6M9 13h6', 'reflejos': 'M13 2L4 14h7l-1 8 9-12h-7z',
         'once-con-presupuesto': 'M3 6h18v12H3zM12 6v12M3 12h18', 'adivina-la-jugada': 'M5 19c4-2 3-7 7-9s5-4 7-5M16 5h3v3', 'sprint-60': 'M12 6v6l4 2M12 3a9 9 0 100 18 9 9 0 000-18z', 'duelo-online': 'M16 11a3 3 0 100-6 3 3 0 000 6zM8 12a3 3 0 100-6 3 3 0 000 6zM2 20v-1a4 4 0 014-4h4a4 4 0 014 4v1M16 15h2a4 4 0 014 4v1', 'modo-carrera': 'M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3'}
MUTE = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path class="w" d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11"/><path class="x" d="M17 9l5 6M22 9l-5 6"/></svg>')


def build(ROOT, SRC, V, page, BACK, ARROW):
    out = os.path.join(ROOT, 'juegos'); os.makedirs(out, exist_ok=True)
    gdir = os.path.join(SRC, 'games')
    # css (base + de cada juego + sala) y js
    css = open(os.path.join(gdir, 'css-base.css'), encoding='utf8').read()
    for f in sorted(glob.glob(os.path.join(gdir, 'css-*.css'))):
        if os.path.basename(f) != 'css-base.css': css += '\n' + open(f, encoding='utf8').read()
    open(os.path.join(out, 'g.css'), 'w', encoding='utf8').write(css)
    for f in glob.glob(os.path.join(gdir, '*.js')): shutil.copy(f, os.path.join(out, os.path.basename(f)))
    urls = [('/juegos/', '0.8')]
    for g in GAMES:
        if not os.path.exists(os.path.join(gdir, g['js'])): continue
        others = ''.join(f'<a href="/juegos/{o["slug"]}.html"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="{ICONS[o["slug"]]}"/></svg>{html.escape(o["name"])}</a>' for o in GAMES if o['slug'] != g['slug'] and os.path.exists(os.path.join(gdir, o['js'])))
        body = f'''<div class="kg" id="kg" data-game="{g['slug']}">
<div class="kg-top"><div class="kg-ttl"><small>Juego {g['n']} · sin registro</small><h1>{g['h1']}</h1></div>
<div class="kg-ctl"><div class="kg-sports" id="kg-sports"></div><button class="kg-mute" id="kg-mute" type="button" aria-label="Sonido">{MUTE}</button></div></div>
<div class="kg-stage" id="kg-stage"><noscript><p style="padding:40px;text-align:center">Activa JavaScript para jugar.</p></noscript></div>
<section class="kg-how"><h2>Cómo se juega</h2><ol>{''.join('<li>' + html.escape(s) + '</li>' for s in g['how'])}</ol><p>{html.escape(g['seo'])}</p>
<div class="kg-more"><a href="/juegos/">Todos los juegos</a>{others}</div></section></div>'''
        ld = {"@context": "https://schema.org", "@type": "VideoGame", "name": g['name'], "description": g['desc'], "url": f"https://kinetos.es/juegos/{g['slug']}.html", "inLanguage": "es", "applicationCategory": "Game", "operatingSystem": "Web", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"}}
        scripts = f'<script src="/juegos/g-core.js?v={V}" defer></script>' + ''.join(f'<script src="/juegos/{d}?v={V}" defer></script>' for d in g.get('deps', [])) + f'<script src="/juegos/{g["js"]}?v={V}" defer></script>'
        open(os.path.join(out, g['slug'] + '.html'), 'w', encoding='utf8').write(page(g['title'], g['desc'], f"/juegos/{g['slug']}.html", body, 'games', extra_head=f'<link rel="stylesheet" href="/juegos/g.css?v={V}">', jsonld=ld, scripts=scripts, back=('/juegos/', 'Todos los juegos')))
        urls.append((f"/juegos/{g['slug']}.html", '0.7'))
    # URL antigua del Ojeador (10 s) -> nueva
    open(os.path.join(out, 'ojeador-10-segundos.html'), 'w', encoding='utf8').write('<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Ojeador de fichas | KINET OS</title><meta name="robots" content="noindex"><link rel="canonical" href="https://kinetos.es/juegos/ojeador-de-fichas.html"><meta http-equiv="refresh" content="0;url=/juegos/ojeador-de-fichas.html"><script>location.replace("/juegos/ojeador-de-fichas.html"+location.search)</script></head><body><a href="/juegos/ojeador-de-fichas.html">Ir al Ojeador de fichas</a></body></html>')
    # sala de juegos
    avail = [g for g in GAMES if os.path.exists(os.path.join(gdir, g['js']))]
    data = json.dumps([{k: g[k] for k in ('slug', 'n', 'name', 'short', 'tag', 'time')} for g in avail], ensure_ascii=False).replace('</', '<\\/')
    AR_L = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>'; AR_R = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'
    hub = f'''<div class="kh" id="kh"><aside class="kh-side"><small class="kh-tag">Juegos KINET · sin registro</small><h1><span>Entrena</span> <em>jugando</em></h1><p>Quizzes y juegos cortos para mejorar tu ojo táctico, tus reflejos y tu ritmo. Elige tu deporte y entra: sin cuenta, sin descargas.</p><ol class="kh-list" id="kh-list"></ol></aside>
<section class="kh-main"><div class="kh-wrap"><div class="kh-stage" id="kh-stage"><div class="kh-ring" id="kh-ring"></div></div><button class="kh-ar l" id="kh-prev" type="button" aria-label="Juego anterior">{AR_L}</button><button class="kh-ar r" id="kh-next" type="button" aria-label="Juego siguiente">{AR_R}</button><div class="kh-dots" id="kh-dots" role="tablist"></div></div>
<div class="kg-ctl"><div class="kg-sports" id="kg-sports"></div><button class="kg-mute" id="kg-mute" type="button" aria-label="Sonido">{MUTE}</button></div>
<div class="khgo" id="khgo"></div><div class="kh-info" id="kh-info"></div></section>
<script type="application/json" id="kh-data">{data}</script></div>'''
    ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": "Juegos deportivos gratis", "url": "https://kinetos.es/juegos/", "inLanguage": "es"}
    scripts = f'<script src="/juegos/g-core.js?v={V}" defer></script><script src="/juegos/g-hub.js?v={V}" defer></script>'
    open(os.path.join(out, 'index.html'), 'w', encoding='utf8').write(page('Juegos deportivos gratis, sin registro | KINET OS', 'Quizzes y juegos cortos para deportistas y entrenadores: ojo de ojeador, reglas, reflejos, táctica y ritmo. Fútbol, baloncesto, tenis y pádel y running. Sin registro.', '/juegos/', hub, 'games', extra_head=f'<link rel="stylesheet" href="/juegos/g.css?v={V}">', jsonld=ld, scripts=scripts))
    return urls
