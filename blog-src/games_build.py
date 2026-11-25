"""KINET OS · generador de /juegos (sala de juegos + 7 juegos). Se llama desde build.py."""
import os, glob, shutil, html, json

GAMES = [
    {'slug': 'ojeador-10-segundos', 'n': '01', 'js': 'g-ojeo.js', 'css': 'css-ojeo.css', 'tag': 'Quiz de ojo', 'time': '1 min',
     'h1': 'Ojeador en <em>10 segundos</em>', 'name': 'Ojeador en 10 s', 'short': 'Detecta los fallos de una ficha antes de que se acabe el tiempo.',
     'title': 'Ojeador en 10 segundos: juego de fichas deportivas | KINET OS',
     'desc': 'Tienes 10 segundos para encontrar los fallos de la ficha de un jugador, como haría un ojeador. Juego gratis, sin registro, para fútbol, baloncesto, tenis y running.',
     'how': ['Elige tu deporte.', 'Se abre una ficha y empieza la cuenta atrás de 10 segundos.', 'Toca los datos que un ojeador descartaría: foto, vídeo, contacto, estadísticas, biografía…', 'Al terminar verás qué detectaste, qué se te escapó y por qué importa.'],
     'seo': 'Un ojeador lee decenas de fichas al día y decide en segundos. Este juego te enseña los errores más comunes de una ficha deportiva: foto descuidada, vídeo eterno, contacto poco profesional, estadísticas sin contexto o biografías vacías. Aprende a evitarlos y crea tu ficha real en KINET.'},
    {'slug': 'torre-de-niveles', 'n': '02', 'js': 'g-reglas.js', 'css': 'css-reglas.css', 'tag': 'Quiz de reglas', 'time': '3 min',
     'h1': 'Torre de <em>niveles</em>', 'name': 'Torre de niveles', 'short': 'Responde sobre reglas y sube la torre hasta llegar a Leyenda.',
     'title': 'Torre de niveles: quiz de reglas deportivas | KINET OS',
     'desc': 'Quiz de reglas de fútbol, baloncesto, tenis y pádel y running. 10 preguntas, 3 vidas y una torre que sube hasta el rango Leyenda. Gratis y sin registro.',
     'how': ['Elige tu deporte.', 'Responde 10 preguntas de dificultad creciente, con 16 segundos cada una.', 'Cada acierto sube un piso de la torre; tres aciertos seguidos duplican los puntos.', 'Tienes 3 vidas: con cada fallo pierdes una.'],
     'seo': 'Conocer bien el reglamento te hace mejor jugador y mejor entrenador. Pon a prueba tus conocimientos de fútbol, baloncesto, tenis y pádel o running y consigue tu rango, de Cantera a Leyenda. Puedes retar a tus amigos compartiendo tu resultado.'},
    {'slug': 'ficha-secreta', 'n': '03', 'js': 'g-ficha.js', 'css': 'css-ficha.css', 'tag': 'Reto diario', 'time': '2 min',
     'h1': 'Ficha <em>secreta</em>', 'name': 'Ficha secreta', 'short': 'Adivina al deportista misterioso del día con 6 intentos.',
     'title': 'Ficha secreta: adivina el deportista del día | KINET OS',
     'desc': 'Un deportista misterioso nuevo cada día. Tienes 6 intentos y pistas de posición, edad, altura, país y nivel. Gratis, sin registro y para cuatro deportes.',
     'how': ['Cada día hay un deportista misterioso por deporte.', 'Escribe un nombre y compara: verde acierta, ámbar se acerca, las flechas indican si es más o menos.', 'Tienes 6 intentos.', 'Comparte tu cuadrícula sin spoilers y vuelve mañana.'],
     'seo': 'Un reto diario al estilo de los juegos de adivinar: deportistas ficticios con ficha completa, para que nadie tenga ventaja por conocer a un jugador real. Cuatro deportes, una racha que se guarda en tu navegador y un resultado que puedes compartir.'},
    {'slug': 'reflejos', 'n': '04', 'js': 'g-reflejos.js', 'css': 'css-reflejos.css', 'tag': 'Arcade', 'time': '30 s',
     'h1': 'Reflejos <em>en perspectiva</em>', 'name': 'Reflejos', 'short': 'Intercepta lo que viene hacia ti. 30 segundos que se aceleran.',
     'title': 'Reflejos: juego de reacción deportivo | KINET OS',
     'desc': 'Juego de reflejos: portero, defensa, resto de tenis o salida de pista. 30 segundos, combos y velocidad creciente. Gratis, sin registro, en móvil y ordenador.',
     'how': ['Elige tu deporte: cambian el escenario y lo que te lanzan.', 'Toca el carril correcto (o usa A, S, D / ← ↓ →) cuando el objeto llegue a la línea.', 'No toques las trampas rojas.', 'Encadena aciertos para subir el multiplicador. Dura 30 segundos.'],
     'seo': 'Entrena la velocidad de reacción con un juego de 30 segundos. Portero en fútbol, defensa en baloncesto, devolución en tenis o salida en atletismo: la mecánica es la misma y la dificultad sube con el tiempo. Bate tu récord y reta a un amigo.'},
    {'slug': 'once-con-presupuesto', 'n': '05', 'js': 'g-once.js', 'css': 'css-once.css', 'tag': 'Estrategia', 'time': '4 min',
     'h1': 'Tu once con <em>presupuesto</em>', 'name': 'Once con presupuesto', 'short': 'Monta el mejor equipo con 100 puntos de presupuesto y reta a un amigo.',
     'title': 'Once con presupuesto: monta tu equipo y reta a un amigo | KINET OS',
     'desc': 'Elige a tus jugadores con un presupuesto limitado y consigue la mejor nota de equipo. Fútbol, baloncesto, dobles y relevos. Gratis, sin registro y con enlace para retar a un amigo.',
     'how': ['Elige tu deporte y la formación.', 'Toca un hueco del campo y elige a un jugador de la lista.', 'Cuida el presupuesto: los mejores cuestan más.', 'Las conexiones entre jugadores (mismo país o club) suman puntos. Comparte tu equipo y reta a un amigo.'],
     'seo': 'Un juego de gestión sencillo y adictivo: poco presupuesto, muchas decisiones. Aprende a equilibrar estrellas y relleno, a respetar posiciones y a crear química en el equipo, como hace un cuerpo técnico de verdad.'},
    {'slug': 'adivina-la-jugada', 'n': '06', 'js': 'g-jugada.js', 'css': 'css-jugada.css', 'tag': 'Táctica', 'time': '3 min',
     'h1': 'Adivina <em>la jugada</em>', 'name': 'Adivina la jugada', 'short': 'Mira la jugada en vídeo táctico y decide cuál es la mejor opción.',
     'title': 'Adivina la jugada: test de táctica deportiva | KINET OS',
     'desc': 'Ves una jugada en un tablero táctico, se congela en el momento clave y eliges la mejor decisión. Fútbol, baloncesto, pádel y running. Gratis, sin registro.',
     'how': ['Elige tu deporte.', 'Mira la jugada hasta que se congele.', 'Elige entre tres opciones cuál es la mejor decisión.', 'Verás el resultado de tu elección y la explicación táctica.'],
     'seo': 'La táctica se aprende viendo y decidiendo. Con una sala de vídeo en miniatura, cada jugada se congela en el momento clave para que elijas la mejor opción y compruebes qué habría pasado. Así piensa un analista táctico.'},
    {'slug': 'sprint-60', 'n': '07', 'js': 'g-sprint.js', 'css': 'css-sprint.css', 'tag': 'Ritmo', 'time': '60 s',
     'h1': 'Sprint <em>de 60 segundos</em>', 'name': 'Sprint 60', 'short': 'Mantén la cadencia: toca izquierda y derecha al ritmo de las zancadas.',
     'title': 'Sprint de 60 segundos: juego de cadencia y ritmo | KINET OS',
     'desc': 'Mantén la cadencia durante 60 segundos tocando izquierda y derecha al ritmo. Corre, conduce, bota o desplázate según el deporte. Gratis y sin registro.',
     'how': ['Elige tu deporte.', 'Las marcas bajan por el carril: toca izquierda o derecha cuando lleguen a la línea.', 'La cadencia sube durante el minuto: no pierdas el ritmo.', 'Cuantos más aciertos seguidos, más rápido avanzas.'],
     'seo': 'La cadencia —los pasos o toques por minuto— es clave en carrera, conducción de balón o desplazamientos. Este minijuego de ritmo la entrena: mantén el compás, no te caigas y consigue la mayor distancia.'},
]
ICONS = {'ojeador-10-segundos': 'M10 4a6 6 0 104 10.5l5 5 1.5-1.5-5-5A6 6 0 0010 4z', 'torre-de-niveles': 'M4 18l8 4 8-4M4 13l8 4 8-4M4 8l8 4 8-4-8-4z', 'ficha-secreta': 'M5 4h14v16H5zM9 9h6M9 13h6', 'reflejos': 'M13 2L4 14h7l-1 8 9-12h-7z',
         'once-con-presupuesto': 'M3 6h18v12H3zM12 6v12M3 12h18', 'adivina-la-jugada': 'M5 19c4-2 3-7 7-9s5-4 7-5M16 5h3v3', 'sprint-60': 'M12 6v6l4 2M12 3a9 9 0 100 18 9 9 0 000-18z'}
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
        scripts = f'<script src="/juegos/g-core.js?v={V}" defer></script><script src="/juegos/{g["js"]}?v={V}" defer></script>'
        open(os.path.join(out, g['slug'] + '.html'), 'w', encoding='utf8').write(page(g['title'], g['desc'], f"/juegos/{g['slug']}.html", body, 'games', extra_head=f'<link rel="stylesheet" href="/juegos/g.css?v={V}">', jsonld=ld, scripts=scripts, back=('/juegos/', 'Todos los juegos')))
        urls.append((f"/juegos/{g['slug']}.html", '0.7'))
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
