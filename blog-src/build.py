#!/usr/bin/env python3
"""KINET OS · generador del blog y herramientas.
Uso:  python3 blog-src/build.py   (desde la raíz del repo)
Lee blog-src/posts/*.html y blog-src/tools/*.html y genera /blog, /herramientas, sitemap.xml y robots.txt
"""
import os, re, glob, json, html, shutil, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'blog-src')
SITE = 'https://kinetos.es'
CATS = {
 'entrenamiento': 'Entrenamiento', 'futbol': 'Fútbol', 'tenis': 'Tenis y pádel', 'salud': 'Salud y recuperación',
 'carrera': 'Carrera deportiva', 'tecnologia': 'Tecnología y IA', 'nutricion': 'Nutrición', 'mental': 'Mente y rendimiento',
}
TCATS = {'calc': 'Calculadoras', 'plan': 'Planificadores', 'gen': 'Generadores', 'reg': 'Registros y contadores'}

def parse(path):
    raw = open(path, encoding='utf-8').read()
    head, _, body = raw.partition('\n---\n')
    meta = {}
    for ln in head.strip().splitlines():
        if ':' in ln:
            k, v = ln.split(':', 1); meta[k.strip()] = v.strip()
    return meta, body.strip()

def utm(slug, kind='blog'):
    return f'/?utm_source={kind}&utm_medium=seo&utm_campaign={slug}'

ICON = '<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png"><link rel="apple-touch-icon" href="/icons/apple-touch-icon.png"><link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#080A0C">'
FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&family=Orbitron:wght@800;900&display=swap" rel="stylesheet">'

def header(active):
    def on(k): return ' class="on"' if active == k else ''
    return f'''<div class="bg-glow"></div>
<header class="top"><div class="top-in">
<a class="brand" href="/" aria-label="KINET OS"><i>K</i>KINET OS</a>
<nav class="top-nav" aria-label="Principal"><a href="/blog/"{on('blog')}>Blog</a><a href="/herramientas/"{on('tools')}>Herramientas gratis</a></nav>
<a class="btn sm hd" href="/?utm_source=blog&utm_medium=seo&utm_campaign=header">Abrir la app</a>
</div></header>'''

FOOTER = '''<footer class="foot"><div class="foot-in">
<div class="foot-links"><a href="/">KINET OS</a><a href="/blog/">Blog</a><a href="/herramientas/">Herramientas gratis</a><a href="/legal.html">Aviso legal y privacidad</a></div>
<p style="margin:0">Contenido con fines informativos y educativos. No sustituye el consejo de un médico, fisioterapeuta, nutricionista ni entrenador cualificado. Ante dolor, lesión o enfermedad, consulta a un profesional.</p>
<p style="margin:0">© KINET OS · kinetos.es</p>
</div></footer>'''

def seo_title(t, suffix=' | KINET OS'):
    # <title> ≤ 60 caracteres (Google recorta lo que pasa de ahí); og:title conserva el título completo
    base = t[:-len(suffix)] if t.endswith(suffix) else t
    import re as _re
    cands = [base + suffix, base, base.split(':')[0] + suffix, base.split(':')[0], _re.sub(r'\s*\([^)]*\)', '', base)]
    for c in cands:
        if len(c) <= 60 and len(c) >= 18: return c
    return base[:57].rsplit(' ', 1)[0] + '…'

def page(title, desc, path, body, active, extra_head='', og_type='website', jsonld=None, scripts=''):
    url = SITE + path
    ld = f'<script type="application/ld+json">{json.dumps(jsonld, ensure_ascii=False)}</script>' if jsonld else ''
    return f'''<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{html.escape(seo_title(title))}</title>
<meta name="description" content="{html.escape(desc, quote=True)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="{og_type}"><meta property="og:title" content="{html.escape(title, quote=True)}"><meta property="og:description" content="{html.escape(desc, quote=True)}"><meta property="og:url" content="{url}"><meta property="og:locale" content="es_ES"><meta property="og:site_name" content="KINET OS"><meta property="og:image" content="{SITE}/icons/icon-512.png">
<meta name="twitter:card" content="summary">
{ICON}{FONTS}<link rel="stylesheet" href="/blog/blog.css?v=1">{extra_head}{ld}
</head><body>
{header(active)}
<main>{body}</main>
{FOOTER}{scripts}
</body></html>'''

def slugify(t):
    t = t.lower()
    for a, b in zip('áéíóúüñ', 'aeiouun'): t = t.replace(a, b)
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')

def add_toc(body):
    heads = []
    def rep(m):
        txt = re.sub('<[^>]+>', '', m.group(1)); i = slugify(txt)
        heads.append((i, txt)); return f'<h2 id="{i}">{m.group(1)}</h2>'
    body = re.sub(r'<h2>(.*?)</h2>', rep, body, flags=re.S)
    toc = ''
    if len(heads) >= 3:
        toc = '<nav class="toc" aria-label="Índice"><b>En este artículo</b><ol>' + ''.join(f'<li><a href="#{i}">{html.escape(t)}</a></li>' for i, t in heads) + '</ol></nav>'
    return body, toc

def cta(slug, title=None, text=None, kind='blog'):
    title = title or 'Prueba KINET OS gratis'
    text = text or 'Tu cuerpo técnico de IA (preparador físico, nutricionista, fisio y psicólogo deportivo), tu KINET Card y el análisis de partidos, en una sola app. Empieza gratis, sin tarjeta.'
    return f'<aside class="cta"><b>{html.escape(title)}</b><p>{text}</p><div class="row"><a class="btn" href="{utm(slug, kind)}">Abrir KINET OS gratis</a><a class="btn ghost" href="/herramientas/">Ver herramientas gratis</a></div></aside>'

def render_tokens(body, slug, tools, kind='blog'):
    def c(m):
        if m.group(1):
            t, _, x = m.group(1)[1:].partition('|'); return cta(slug, t, x or None, kind)
        return cta(slug, kind=kind)
    body = re.sub(r'\{\{CTA(:[^}]*)?\}\}', c, body)
    def t(m):
        s = m.group(1)
        if s in tools:
            return f'<div class="note"><b>Herramienta gratis:</b> <a href="/herramientas/{s}.html">{html.escape(tools[s]["title"])}</a> — {html.escape(tools[s]["desc"])}</div>'
        return ''
    body = re.sub(r'\{\{TOOL:([a-z0-9-]+)\}\}', t, body)
    def l(m):
        s = m.group(1)
        return f'<a href="/blog/{s}.html">{m.group(2)}</a>'
    body = re.sub(r'\{\{POST:([a-z0-9-]+)\|([^}]+)\}\}', l, body)
    return body

def main():
    posts = {}
    for p in sorted(glob.glob(os.path.join(SRC, 'posts', '*.html'))):
        m, b = parse(p); m['body'] = b; posts[m['slug']] = m
    tools = {}
    for p in sorted(glob.glob(os.path.join(SRC, 'tools', '*.html'))):
        m, b = parse(p)
        tool_html, _, article = b.partition('\n===\n')
        m['tool'] = tool_html; m['article'] = article; tools[m['slug']] = m

    os.makedirs(os.path.join(ROOT, 'blog'), exist_ok=True)
    os.makedirs(os.path.join(ROOT, 'herramientas'), exist_ok=True)
    shutil.copy(os.path.join(SRC, 'blog.css'), os.path.join(ROOT, 'blog', 'blog.css'))
    shutil.copy(os.path.join(SRC, 'tools.js'), os.path.join(ROOT, 'herramientas', 'tools.js'))
    urls = [('/', '1.0'), ('/blog/', '0.8'), ('/herramientas/', '0.8'), ('/soporte.html', '0.4')]

    # artículos
    for slug, m in posts.items():
        body, toc = add_toc(m['body'])
        body = render_tokens(body, slug, tools)
        rel = [s for s in m.get('related', '').replace(' ', '').split(',') if s in posts]
        rel_t = [s for s in m.get('tools', '').replace(' ', '').split(',') if s in tools]
        rel_html = ''
        if rel or rel_t:
            cards = ''.join(f'<a class="card" href="/blog/{s}.html"><span class="k">{CATS.get(posts[s]["cat"], "")}</span><h3>{html.escape(posts[s]["title"])}</h3><p>{html.escape(posts[s]["desc"])}</p><span class="go">Leer →</span></a>' for s in rel)
            cards += ''.join(f'<a class="card" href="/herramientas/{s}.html"><span class="k">Herramienta gratis</span><h3>{html.escape(tools[s]["title"])}</h3><p>{html.escape(tools[s]["desc"])}</p><span class="go">Usar ahora →</span></a>' for s in rel_t)
            rel_html = f'<section class="related"><h2>Sigue leyendo</h2><div class="cards">{cards}</div></section>'
        d = m['date']
        ld = {"@context": "https://schema.org", "@type": "Article", "headline": m['title'], "description": m['desc'], "datePublished": d, "dateModified": d,
              "inLanguage": "es", "mainEntityOfPage": f"{SITE}/blog/{slug}.html", "author": {"@type": "Organization", "name": "KINET OS"},
              "publisher": {"@type": "Organization", "name": "KINET OS", "logo": {"@type": "ImageObject", "url": f"{SITE}/icons/icon-512.png"}}}
        bc = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "KINET OS", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog/"},
            {"@type": "ListItem", "position": 3, "name": m['title'], "item": f"{SITE}/blog/{slug}.html"}]}
        main_html = f'''<article class="wrap">
<div class="crumbs"><a href="/">KINET OS</a> › <a href="/blog/">Blog</a> › {CATS.get(m['cat'], '')}</div>
<div class="kicker">{CATS.get(m['cat'], '')}</div>
<h1>{html.escape(m['title'])}</h1>
<div class="meta"><span>{d_fmt(d)}</span><span>{m.get('mins', '6')} min de lectura</span><span>Por el equipo de KINET OS</span></div>
<p class="lead">{m['desc']}</p>
{toc}
{body}
{cta(slug)}
{rel_html}
</article>'''
        out = page(m['title'] + ' | KINET OS', m['desc'], f'/blog/{slug}.html', main_html, 'blog', og_type='article', jsonld=[ld, bc])
        open(os.path.join(ROOT, 'blog', slug + '.html'), 'w', encoding='utf-8').write(out)
        urls.append((f'/blog/{slug}.html', '0.7'))

    # índice blog
    items = sorted(posts.values(), key=lambda x: x['date'], reverse=True)
    cards = ''.join(f'<a class="card" data-cat="{m["cat"]}" data-t="{html.escape((m["title"] + " " + m["desc"]).lower(), quote=True)}" href="/blog/{m["slug"]}.html"><span class="k">{CATS.get(m["cat"], "")}</span><h3>{html.escape(m["title"])}</h3><p>{html.escape(m["desc"])}</p><span class="go">Leer →</span></a>' for m in items)
    used = [c for c in CATS if any(m['cat'] == c for m in items)]
    chips = '<button class="chip on" data-c="">Todo</button>' + ''.join(f'<button class="chip" data-c="{c}">{CATS[c]}</button>' for c in used)
    tcards = ''.join(f'<a class="card" href="/herramientas/{s}.html"><span class="k">Gratis · sin registro</span><h3>{html.escape(t["title"])}</h3><p>{html.escape(t["desc"])}</p><span class="go">Usar ahora →</span></a>' for s, t in tools.items())
    blog_main = f'''<div class="wrap wide">
<div class="kicker">Blog KINET OS</div>
<h1>Entrena mejor, rinde más, gestiona tu carrera</h1>
<p class="lead" style="max-width:720px">Guías prácticas de entrenamiento, recuperación, táctica y carrera deportiva para jugadores, entrenadores y ojeadores. Sin humo, con herramientas gratis para aplicarlas hoy.</p>
<input id="q" class="search" type="search" placeholder="Buscar artículos…" aria-label="Buscar artículos">
<div class="chips" id="chips">{chips}</div>
<div class="cards" id="list">{cards}</div>
<p id="none" style="display:none;color:var(--mut)">No hay artículos con ese filtro.</p>
<h2>Herramientas gratis</h2>
<div class="cards">{tcards}</div>
{cta('blog-home')}
</div>
<script>(function(){{var c='',q='',cards=[].slice.call(document.querySelectorAll('#list .card'));function f(){{var n=0;cards.forEach(function(e){{var ok=(!c||e.dataset.cat===c)&&(!q||e.dataset.t.indexOf(q)>-1);e.style.display=ok?'':'none';if(ok)n++}});document.getElementById('none').style.display=n?'none':''}}
document.getElementById('q').addEventListener('input',function(e){{q=e.target.value.toLowerCase().trim();f()}});
document.getElementById('chips').addEventListener('click',function(e){{var b=e.target.closest('.chip');if(!b)return;[].forEach.call(document.querySelectorAll('.chip'),function(x){{x.classList.remove('on')}});b.classList.add('on');c=b.dataset.c;f()}})}})();</script>'''
    ld = {"@context": "https://schema.org", "@type": "Blog", "name": "Blog KINET OS", "url": SITE + "/blog/", "inLanguage": "es"}
    open(os.path.join(ROOT, 'blog', 'index.html'), 'w', encoding='utf-8').write(page('Blog de rendimiento deportivo | KINET OS', 'Guías prácticas de entrenamiento, recuperación, táctica y carrera deportiva para jugadores, entrenadores y ojeadores, con herramientas gratis.', '/blog/', blog_main, 'blog', jsonld=ld))

    # herramientas
    for slug, t in tools.items():
        art, toc = add_toc(render_tokens(t['article'], slug, tools, 'herramienta'))
        rel = [s for s in t.get('related', '').replace(' ', '').split(',') if s in posts]
        rel_html = ''
        if rel:
            cards = ''.join(f'<a class="card" href="/blog/{s}.html"><span class="k">{CATS.get(posts[s]["cat"], "")}</span><h3>{html.escape(posts[s]["title"])}</h3><p>{html.escape(posts[s]["desc"])}</p><span class="go">Leer →</span></a>' for s in rel)
            rel_html = f'<section class="related"><h2>Te puede interesar</h2><div class="cards">{cards}</div></section>'
        main_html = f'''<div class="wrap">
<div class="crumbs"><a href="/">KINET OS</a> › <a href="/herramientas/">Herramientas</a> › {TCATS.get(t['cat'], '')}</div>
<div class="kicker">Herramienta gratis · sin registro</div>
<h1>{html.escape(t['title'])}</h1>
<p class="lead">{t['desc']}</p>
<div class="tool" id="tool">{t['tool']}
<p class="privacy">🔒 Tus datos se guardan solo en esta pestaña del navegador: se conservan si recargas la página y se borran al cerrarla. No se envían a ningún servidor.</p></div>
{art}
{cta(slug, kind='herramienta')}
{rel_html}
</div>'''
        ld = {"@context": "https://schema.org", "@type": "WebApplication", "name": t['title'], "description": t['desc'], "url": f"{SITE}/herramientas/{slug}.html",
              "applicationCategory": "HealthApplication", "operatingSystem": "Web", "inLanguage": "es", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"},
              "publisher": {"@type": "Organization", "name": "KINET OS"}}
        out = page(t['title'] + ' gratis | KINET OS', t['desc'], f'/herramientas/{slug}.html', main_html, 'tools', jsonld=ld, extra_head='<script src="/herramientas/tools.js?v=1"></script>')
        open(os.path.join(ROOT, 'herramientas', slug + '.html'), 'w', encoding='utf-8').write(out)
        urls.append((f'/herramientas/{slug}.html', '0.8'))

    cats = {}
    for s, t in tools.items(): cats.setdefault(t['cat'], []).append(s)
    sections = ''
    for c in TCATS:
        if c in cats:
            sections += f'<h2>{TCATS[c]}</h2><div class="cards">' + ''.join(f'<a class="card" href="/herramientas/{s}.html"><span class="k">Gratis · sin registro</span><h3>{html.escape(tools[s]["title"])}</h3><p>{html.escape(tools[s]["desc"])}</p><span class="go">Usar ahora →</span></a>' for s in cats[c]) + '</div>'
    hub = f'''<div class="wrap wide"><div class="kicker">KINET OS</div><h1>Herramientas gratis para deportistas</h1>
<p class="lead" style="max-width:720px">Calculadoras, planificadores y generadores sin registro ni coste. Funcionan en tu navegador: lo que escribes se mantiene al recargar y se borra al cerrar la pestaña.</p>
{sections}{cta('herramientas-home', kind='herramienta')}</div>'''
    ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": "Herramientas gratis para deportistas", "url": SITE + "/herramientas/", "inLanguage": "es"}
    open(os.path.join(ROOT, 'herramientas', 'index.html'), 'w', encoding='utf-8').write(page('Herramientas gratis para deportistas | KINET OS', 'Calculadoras, planificadores y generadores gratis para deportistas y entrenadores. Sin registro: tus datos no salen de tu navegador.', '/herramientas/', hub, 'tools', jsonld=ld))

    today = datetime.date.today().isoformat()
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'<url><loc>{SITE}{u}</loc><lastmod>{today}</lastmod><priority>{p}</priority></url>\n' for u, p in urls) + '</urlset>\n'
    open(os.path.join(ROOT, 'sitemap.xml'), 'w').write(sm)
    open(os.path.join(ROOT, 'robots.txt'), 'w').write(f'User-agent: *\nAllow: /\nDisallow: /admin.html\nDisallow: /gestion.html\nDisallow: /despacho.html\n\nSitemap: {SITE}/sitemap.xml\n')
    print(f'OK · {len(posts)} artículos · {len(tools)} herramientas · {len(urls)} URLs')

def d_fmt(d):
    y, m, dd = d.split('-'); meses = 'enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split()
    return f'{int(dd)} de {meses[int(m)-1]} de {y}'

if __name__ == '__main__':
    main()
