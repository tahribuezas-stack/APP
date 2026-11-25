# -*- coding: utf-8 -*-
"""Datos y dibujos del navegador de temas de la portada del blog (órbita → dock / engranaje → baraja)."""
import json, math, html

def _pts(cx, cy, r, n, a0=-90):
    return ' '.join(f'{cx + r * math.cos(math.radians(a0 + 360 / n * i)):.1f},{cy + r * math.sin(math.radians(a0 + 360 / n * i)):.1f}' for i in range(n))

def _ball():
    pen = _pts(32, 32, 8, 5)
    spokes = ''.join(f'<path d="M{32 + 8 * math.cos(math.radians(-90 + 72 * i)):.1f} {32 + 8 * math.sin(math.radians(-90 + 72 * i)):.1f}L{32 + 22 * math.cos(math.radians(-90 + 72 * i)):.1f} {32 + 22 * math.sin(math.radians(-90 + 72 * i)):.1f}"/>' for i in range(5))
    return f'<g class="i-ball"><circle cx="32" cy="32" r="22"/><polygon points="{pen}" fill="currentColor" fill-opacity=".3"/>{spokes}</g>'

def _racket():
    cx, cy, rx, ry = 32, 24, 13, 17
    v = ''.join(f'<path d="M{cx + d} {cy - ry * math.sqrt(1 - (d / rx) ** 2):.1f}V{cy + ry * math.sqrt(1 - (d / rx) ** 2):.1f}"/>' for d in (-7, 0, 7))
    hz = ''.join(f'<path d="M{cx - rx * math.sqrt(1 - (d / ry) ** 2):.1f} {cy + d}H{cx + rx * math.sqrt(1 - (d / ry) ** 2):.1f}"/>' for d in (-9, 0, 9))
    return (f'<g class="i-racket"><g transform="rotate(-32 32 32)"><ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}"/>{v}{hz}'
            f'<path d="M32 41V55" stroke-width="4.5"/><path d="M30 55h4" stroke-width="5"/></g></g><circle class="i-tball" cx="50" cy="48" r="5" fill="currentColor"/>')

def _dumbbell():
    return ('<g class="i-db"><path d="M14 32H50" stroke-width="3.4"/>'
            '<rect x="9" y="21" width="7" height="22" rx="2.5"/><rect x="16" y="25" width="5" height="14" rx="1.5"/>'
            '<rect x="43" y="25" width="5" height="14" rx="1.5"/><rect x="48" y="21" width="7" height="22" rx="2.5"/></g>')

def _heart():
    return ('<g class="i-heart"><path d="M32 53C10 38 9 19 21 15.5C27 13.8 31 17 32 20C33 17 37 13.8 43 15.5C55 19 54 38 32 53Z"/></g>'
            '<path class="i-ecg" pathLength="1" d="M13 34H24L28 25L33 43L38 30L41 34H51"/>')

def _trophy():
    return ('<g class="i-tr"><path d="M20 11H44V26C44 34 38.5 40 32 40C25.5 40 20 34 20 26Z"/>'
            '<path d="M20 15H12C12 25 16 30 21 30"/><path d="M44 15H52C52 25 48 30 43 30"/><path d="M32 40V49"/><rect x="21" y="49" width="22" height="7" rx="2.5"/>'
            f'<polygon class="i-star" points="{_pts(32, 25, 6, 5)}" fill="currentColor" fill-opacity=".5"/></g>')

def _calc():
    keys = ''.join(f'<circle class="i-key" style="animation-delay:{(r * 3 + c) * .11:.2f}s" cx="{23 + c * 9}" cy="{33 + r * 8}" r="2.4" fill="currentColor"/>' for r in range(3) for c in range(3))
    return f'<g class="i-calc"><rect x="13" y="7" width="38" height="50" rx="7"/><rect x="19" y="13" width="26" height="10" rx="2.5" fill="currentColor" fill-opacity=".25"/>{keys}</g>'

def _gear():
    n, ro, ri = 8, 25, 19
    p = []
    for i in range(n):
        b = 360 / n * i
        for ang, r in ((b - 13, ri), (b - 8.5, ro), (b + 8.5, ro), (b + 13, ri)):
            p.append(f'{32 + r * math.cos(math.radians(ang)):.1f},{32 + r * math.sin(math.radians(ang)):.1f}')
    return f'<g class="i-gear"><polygon points="{" ".join(p)}" stroke-linejoin="round"/><circle cx="32" cy="32" r="8"/><circle cx="32" cy="32" r="2.5" fill="currentColor"/></g>'

ICONS = {'ball': _ball(), 'racket': _racket(), 'dumbbell': _dumbbell(), 'heart': _heart(), 'trophy': _trophy(), 'calc': _calc(), 'gear': _gear()}

def icon(name):
    return f'<svg class="ic ic-{name}" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">{ICONS[name]}</svg>'

# slugs de artículos y herramientas por tema
TOPICS = [
    {'id': 'futbol', 'n': 'Fútbol', 'c': '#00FF88', 'ico': 'ball', 'sub': 'Semana de entrenamiento, fuerza para delanteros y tu once en imagen.',
     'items': ['microciclo-semanal-futbolista', 'rutina-gimnasio-delanteros', 'generador-alineacion', 'ficha-deportiva-ojeadores']},
    {'id': 'tenis', 'n': 'Tenis y pádel', 'c': '#FACC15', 'ico': 'racket', 'sub': 'Hombro, rotación y piernas explosivas, con tus cargas y tus zonas de pulso.',
     'items': ['rutina-fuerza-tenistas', 'calculadora-1rm', 'zonas-frecuencia-cardiaca']},
    {'id': 'fuerza', 'n': 'Fuerza', 'c': '#FB923C', 'ico': 'dumbbell', 'sub': 'Rutinas por deporte y la calculadora para saber cuánto cargar.',
     'items': ['rutina-gimnasio-delanteros', 'rutina-fuerza-tenistas', 'calculadora-1rm']},
    {'id': 'cardio', 'n': 'Cardio y pulso', 'c': '#FB7185', 'ico': 'heart', 'sub': 'Entrena a la intensidad correcta: guía y calculadora de zonas.',
     'items': ['zonas-frecuencia-cardiaca-guia', 'zonas-frecuencia-cardiaca']},
    {'id': 'carrera', 'n': 'Carrera deportiva', 'c': '#A78BFA', 'ico': 'trophy', 'sub': 'Que los ojeadores te lean: ficha deportiva y presentación de tu equipo.',
     'items': ['ficha-deportiva-ojeadores', 'generador-alineacion']},
    {'id': 'tools', 'n': 'Herramientas', 'c': '#22D3EE', 'ico': 'calc', 'sub': 'Calculadoras y generadores gratis. Se abren al instante y sin registro.', 'items': '*tools'},
    {'id': 'how', 'n': 'Cómo funciona', 'c': '#E2E8F0', 'ico': 'gear', 'sub': 'Así funciona KINET OS por dentro.', 'how': True},
]

HOW = [
    {'code': 'IA', 't': 'Cuerpo Técnico IA', 'd': 'Cuatro especialistas de IA que se pasan tu caso entre sí: preguntas y recibes un plan, no una respuesta suelta.', 'u': '/?utm_source=blog&utm_medium=nav&utm_campaign=how-ia#ecosistema', 'c': '#00FF88'},
    {'code': '3D', 't': 'Analizador y plantilla 3D', 'd': 'Analiza a tus jugadores y monta la plantilla sobre una pizarra táctica en 3D.', 'u': '/?utm_source=blog&utm_medium=nav&utm_campaign=how-3d#analizador-section', 'c': '#22D3EE'},
    {'code': 'CARD', 't': 'KINET Card', 'd': 'Tu carta de jugador, con rareza y diseño propios, lista para compartir.', 'u': '/?utm_source=blog&utm_medium=nav&utm_campaign=how-card#card-section', 'c': '#FACC15'},
    {'code': 'NET', 't': 'KINET Network', 'd': 'La red social deportiva: Pulse, Shorts y Radar para que te encuentren.', 'u': '/?utm_source=blog&utm_medium=nav&utm_campaign=how-net#vision-section', 'c': '#A78BFA'},
    {'code': 'STU', 't': 'Media Studio', 'd': 'Crea pósters e imágenes con tu marca para publicar en un par de toques.', 'u': '/?utm_source=blog&utm_medium=nav&utm_campaign=how-studio#media-section', 'c': '#FB7185'},
]


def build(posts, tools, cats, tcats, acc_map, cover, mins_default='6'):
    """Devuelve (html_sección, json_datos)."""
    items = {}
    for s, m in posts.items():
        a = acc_map.get(m['cat'], '#00FF88')
        items[s] = {'k': 'a', 't': m['title'], 'd': m['desc'], 'u': f'/blog/{s}.html', 'col': a, 'cat': cats.get(m['cat'], 'Artículo'),
                    'm': m.get('mins', mins_default), 'cv': cover(m['cat'], s, cats.get(m['cat'], ''), '', 'k')}
    for s, t in tools.items():
        a = acc_map.get(t['cat'], '#22D3EE')
        items[s] = {'k': 't', 't': t['title'], 'd': t['desc'], 'u': f'/herramientas/{s}.html', 'col': a, 'cat': tcats.get(t['cat'], 'Herramienta'),
                    'cv': cover(t['cat'], s, tcats.get(t['cat'], ''), '', 'k')}
    topics = []
    for tp in TOPICS:
        o = {'id': tp['id'], 'n': tp['n'], 'c': tp['c'], 'sub': tp['sub'], 'ico': icon(tp['ico'])}
        if tp.get('how'):
            o['how'] = HOW
        else:
            sl = list(tools) if tp['items'] == '*tools' else [x for x in tp['items'] if x in items]
            if not sl:
                continue
            o['items'] = sl
        topics.append(o)
    data = {'items': items, 'topics': topics}
    js = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
    sec = ('<div class="kbn-stage" id="kbn-stage" data-mode="orbit" hidden></div>'
           f'<script type="application/json" id="kbn-data">{js}</script>')
    return sec
