# -*- coding: utf-8 -*-
"""Barra de navegación común de KINET OS (index, soporte, legales, blog, herramientas y juegos). Una sola fuente de verdad."""
import re, os

ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
CARET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>'
BRAND = ('<a class="brand" href="/" aria-label="KINET OS, inicio"><span class="bk" aria-hidden="true">K</span>'
         '<span class="bt"><b>KINET OS</b><small>AI PRECISION</small></span></a>')
def _i(p): return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{p}</svg>'
PRODUCT = [
    ('/#ecosistema', 'Agentes IA', 'Tu cuerpo técnico de 4 especialistas', _i('<circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6"/>')),
    ('/#card-section', 'KINET Card', 'Tu ficha verificada de deportista', _i('<rect x="4" y="3" width="16" height="18" rx="3"/><circle cx="12" cy="10" r="2.6"/><path d="M8 17c.6-2 2.2-3 4-3s3.4 1 4 3"/>')),
    ('/#vision-section', 'Vision Analytics', 'Análisis de vídeo y scouting', _i('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>')),
    ('/#analizador-section', 'Analizador y Pizarra 3D', 'Tácticas y jugadas en 3D', _i('<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>')),
    ('/#media-section', 'Media Studio', 'Pósters y vídeo con IA', _i('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5l5 2.5-5 2.5z"/>')),
]
SOFT = ('/#aprende', 'Guías y herramientas gratis', 'Calculadoras y artículos sin registro', _i('<path d="M4 5h16M4 12h16M4 19h10"/>'))

def header_html(active=''):
    def on(k): return ' class="on" aria-current="page"' if active == k else ''
    items = ''.join(f'<a href="{h}" role="menuitem"><i>{ic}</i><span><b>{t}</b><span>{d}</span></span></a>' for h, t, d, ic in PRODUCT)
    items += '<div class="kn-sep"></div>' + f'<a class="kn-soft" href="{SOFT[0]}" role="menuitem"><i>{SOFT[3]}</i><span><b>{SOFT[1]}</b><span>{SOFT[2]}</span></span></a>'
    mob = ''.join(f'<a class="sub" href="{h}">{t}</a>' for h, t, d, ic in PRODUCT) + f'<a class="sub" href="{SOFT[0]}">{SOFT[1]}</a>'
    return (f'<header class="top" id="kn-top"><div class="top-in">\n{BRAND}\n'
            f'<nav class="top-nav" aria-label="Principal"><div class="kn-dd"><button class="kn-b" type="button" aria-haspopup="true" aria-expanded="false">Producto{CARET}</button>'
            f'<div class="kn-menu" role="menu">{items}</div></div>'
            f'<a href="/#precios">Planes</a><a href="/blog/"{on("blog")}>Blog</a><a href="/soporte.html"{on("help")}>Ayuda</a></nav>\n'
            f'<a class="btn hd" href="/login.html">Acceder al sistema {ARROW}</a>\n'
            f'<button class="kn-burger" type="button" aria-label="Abrir menú" aria-expanded="false"><svg class="m" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg><svg class="x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>\n'
            f'</div><div class="kn-m" id="kn-m"><div class="kn-m-in"><div style="padding:6px 10px 2px;font:600 11px/1 \'JetBrains Mono\',monospace;letter-spacing:.14em;color:#64748B;text-transform:uppercase">Producto</div>{mob}'
            f'<a href="/#precios">Planes</a><a href="/blog/"{on("blog")}>Blog</a><a href="/soporte.html"{on("help")}>Ayuda</a></div></div></header>')

MARK = re.compile(r'<!--KBNAV-->.*?<!--/KBNAV-->', re.S)
def sync_root(root, files):
    """Sustituye el bloque <!--KBNAV-->…<!--/KBNAV--> de las páginas de la raíz por la barra común."""
    for f, act in files.items():
        p = os.path.join(root, f)
        s = open(p, encoding='utf8').read()
        if not MARK.search(s): continue
        s = MARK.sub(lambda m: '<!--KBNAV-->' + header_html(act) + '<!--/KBNAV-->', s)
        open(p, 'w', encoding='utf8').write(s)
