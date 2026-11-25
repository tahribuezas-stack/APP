#!/usr/bin/env python3
"""KINET OS · generador del blog y herramientas (diseño v2).
Uso:  python3 blog-src/build.py   (desde la raíz del repo)
Lee blog-src/posts/*.html y blog-src/tools/*.html y genera /blog, /herramientas, sitemap.xml y robots.txt
"""
import kbnav, os, sys, re, glob, json, html, shutil, datetime, hashlib
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import navdata, games_build
SRC = os.path.join(ROOT, 'blog-src')
SITE = 'https://kinetos.es'
V = '23'   # versión de css/js: súbela si cambias el diseño
CATS = {
 'entrenamiento': 'Entrenamiento', 'futbol': 'Fútbol', 'tenis': 'Tenis y pádel', 'salud': 'Salud y recuperación',
 'carrera': 'Carrera deportiva', 'tecnologia': 'Tecnología y IA', 'nutricion': 'Nutrición', 'mental': 'Mente y rendimiento',
}
TCATS = {'calc': 'Calculadoras', 'plan': 'Planificadores', 'gen': 'Generadores', 'reg': 'Registros y contadores'}
ACC = {'entrenamiento': '#34D399', 'futbol': '#00FF88', 'tenis': '#FACC15', 'salud': '#FB7185', 'carrera': '#A78BFA', 'tecnologia': '#22D3EE', 'nutricion': '#FB923C', 'mental': '#C084FC',
       'calc': '#22D3EE', 'plan': '#A78BFA', 'gen': '#00FF88', 'reg': '#FACC15'}


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

def h(x): return int(hashlib.md5(x.encode()).hexdigest()[:8], 16)

ICON = ('<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" type="image/svg+xml" href="/icons/favicon.svg">'
        '<link rel="icon" type="image/png" sizes="48x48" href="/icons/favicon-48.png"><link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png">'
        '<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png"><link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#05070A">')
FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&family=Orbitron:wght@800;900&display=swap" rel="stylesheet">'

BRAND = ('<a class="brand" href="/" aria-label="KINET OS, inicio"><span class="bk" aria-hidden="true">K</span>'
         '<span class="bt"><b>KINET OS</b><small>AI PRECISION</small></span></a>')
ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>'
TICON = {
 'calc': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/></svg>',
 'plan': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
 'gen': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 5v14"/><circle cx="12" cy="12" r="2.6"/></svg>',
 'reg': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></svg>',
}


# ───────── portadas generativas (SVG) ─────────
def art(cat, seed):
    r = h(seed); o = (r % 40) - 20
    L = 'class="ln" pathLength="1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
    if cat in ('futbol', 'gen'):
        bx, by = 330 + (r % 160) - 80, 150 + (r % 70) - 35
        return (f'<rect {L} x="60" y="46" width="520" height="244" rx="14"/><path {L} d="M320 46v244"/><circle {L} cx="320" cy="168" r="44"/>'
                f'<path {L} d="M60 108h74v120H60M580 108h-74v120h74"/><path {L} d="M60 142h30v52H60M580 142h-30v52h30"/>'
                f'<g class="fl"><circle cx="{bx}" cy="{by}" r="9" fill="currentColor"/><circle cx="{bx}" cy="{by}" r="20" fill="none" stroke="currentColor" stroke-opacity=".35"/></g>')
    if cat == 'tenis':
        return (f'<rect {L} x="110" y="40" width="420" height="256" rx="6"/><path {L} d="M110 100h420M110 236h420M320 100v136M110 168h210M320 40v256" opacity=".8"/>'
                f'<path {L} d="M150 270 C 260 40, 400 40, 500 250" stroke-dasharray=".02 .03"/><g class="fl"><circle cx="{420 + o}" cy="{96 + o // 2}" r="11" fill="currentColor"/></g>')
    if cat in ('entrenamiento', 'calc'):
        bars = ''.join(f'<rect class="ln" pathLength="1" x="{110 + i * 62}" y="{250 - hh}" width="38" height="{hh}" rx="8" fill="currentColor" fill-opacity=".16" stroke="currentColor" stroke-width="2"/>' for i, hh in enumerate([60 + (r >> (i * 3)) % 90 for i in range(8)]))
        return bars + f'<path {L} d="M100 262h470"/><path {L} d="M120 120C 200 {90 + o} 260 170 330 140S 460 60 560 {70 - o}"/>'
    if cat == 'salud':
        return (f'<path {L} d="M30 170h130l24-70 38 150 32-110 24 30h60l22-52 34 102 26-50h120" stroke-width="2.6"/><g class="fl"><circle cx="560" cy="{170 + o // 3}" r="8" fill="currentColor"/></g>'
                f'<circle {L} cx="320" cy="168" r="120" opacity=".25"/><circle {L} cx="320" cy="168" r="80" opacity=".18"/>')
    if cat in ('carrera', 'plan'):
        pts = [(70, 270), (170, 240), (260, 250), (350, 190), (440, 160), (520, 90), (590, 60)]
        pp = [(x, y + (r >> i) % 16) for i, (x, y) in enumerate(pts)]
        d = 'M' + ' L'.join(f'{x} {y}' for x, y in pp)
        dots = ''.join(f'<circle cx="{x}" cy="{y}" r="5" fill="currentColor"/>' for x, y in pp)
        return f'<path {L} d="{d}" stroke-width="2.6"/>{dots}<path {L} d="M70 290h520" opacity=".4"/><g class="fl"><path d="M590 34v34M590 34l28 10-28 10" fill="currentColor" stroke="currentColor" stroke-width="2"/></g>'
    if cat == 'tecnologia':
        ns = [(120, 90), (250, 200), (200, 260), (360, 110), (470, 220), (540, 90), (330, 250)]
        ns = [(x + (r >> i) % 20, y + (r >> (i + 2)) % 20) for i, (x, y) in enumerate(ns)]
        ln = ''.join(f'<path {L} d="M{ns[i][0]} {ns[i][1]}L{ns[j][0]} {ns[j][1]}" opacity=".55"/>' for i, j in [(0, 1), (1, 2), (1, 3), (3, 4), (4, 5), (3, 5), (4, 6), (1, 6)])
        return ln + ''.join(f'<g class="fl" style="animation-delay:-{i}s"><circle cx="{x}" cy="{y}" r="9" fill="#05070A" stroke="currentColor" stroke-width="2"/><circle cx="{x}" cy="{y}" r="3.5" fill="currentColor"/></g>' for i, (x, y) in enumerate(ns))
    if cat in ('nutricion', 'reg'):
        return (f'<circle {L} cx="320" cy="168" r="112" stroke-width="3"/><circle {L} cx="320" cy="168" r="76"/><circle {L} cx="320" cy="168" r="40"/>'
                f'<path {L} d="M320 56A112 112 0 0 1 420 218" stroke-width="10" opacity=".85"/><g class="fl"><circle cx="{470 + o}" cy="80" r="8" fill="currentColor"/></g>')
    return ''.join(f'<circle {L} cx="320" cy="168" r="{rr}" opacity="{1 - i * .17:.2f}"/>' for i, rr in enumerate([30, 62, 96, 132, 170])) + '<g class="fl"><circle cx="320" cy="168" r="8" fill="currentColor"/></g>'

def cover(cat, slug, label='', num='', uid='', wide=False):
    """Portada generativa. wide=True: el dibujo se centra entero y el fondo se prolonga a los lados (sin recortar nada)."""
    acc = ACC.get(cat, '#00FF88'); u = 'c' + str(h(slug))[:6] + uid
    if wide:
        par, bx, bw, by, bh = 'xMidYMid meet', -2400, 5440, -600, 1536
        rg = f'<radialGradient id="{u}" gradientUnits="userSpaceOnUse" cx="540" cy="20" r="520"><stop offset="0" stop-color="{acc}" stop-opacity=".34"/><stop offset="1" stop-color="{acc}" stop-opacity="0"/></radialGradient>'
    else:
        par, bx, bw, by, bh = 'xMidYMid slice', 0, 640, 0, 336
        rg = f'<radialGradient id="{u}" cx=".8" cy=".1" r="1"><stop offset="0" stop-color="{acc}" stop-opacity=".34"/><stop offset="1" stop-color="{acc}" stop-opacity="0"/></radialGradient>'
    lab = '' if wide else f'<text x="26" y="312" font-family="JetBrains Mono,monospace" font-size="13" letter-spacing="3" fill="{acc}" fill-opacity=".85">{html.escape(label.upper())}</text>'
    return (f'<svg class="cv" viewBox="0 0 640 336" preserveAspectRatio="{par}" style="color:{acc}" aria-hidden="true" focusable="false">'
            f'<defs>{rg}<pattern id="{u}p" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="#fff" fill-opacity=".09"/></pattern></defs>'
            f'<rect x="{bx}" y="{by}" width="{bw}" height="{bh}" fill="#070B10"/><rect x="{bx}" y="{by}" width="{bw}" height="{bh}" fill="url(#{u}p)"/><rect x="{bx}" y="{by}" width="{bw}" height="{bh}" fill="url(#{u})"/>'
            f'<text x="612" y="320" text-anchor="end" font-family="Orbitron,sans-serif" font-weight="900" font-size="150" fill="none" stroke="{acc}" stroke-opacity=".13" stroke-width="2">{num}</text>'
            f'<g style="filter:drop-shadow(0 0 7px {acc})">{art(cat, slug)}</g>{lab}</svg>')


# ───────── estructura común ─────────
def seo_title(t, suffix=' | KINET OS'):
    base = t[:-len(suffix)] if t.endswith(suffix) else t
    cands = [base + suffix, base, base.split(':')[0] + suffix, base.split(':')[0], re.sub(r'\s*\([^)]*\)', '', base)]
    for c in cands:
        if 18 <= len(c) <= 60: return c
    return base[:57].rsplit(' ', 1)[0] + '…'

def header(active, back=None):
    return kbnav.header_html(active)

FOOTER = f'''<footer class="foot"><div class="foot-in">
<div class="fb">{BRAND}<p>El sistema operativo del deportista: cuerpo técnico de IA, KINET Card, análisis táctico 3D y comunidad. Gratis para empezar.</p></div>
<div><h4>Explora</h4><a href="/blog/">Blog</a><a href="/herramientas/">Herramientas gratis</a><a href="/juegos/">Juegos</a><a href="/">KINET OS</a></div>
<div><h4>Ayuda</h4><a href="/soporte.html">Centro de ayuda</a><a href="/privacidad.html">Política de privacidad</a><a href="/condiciones.html">Condiciones</a><a href="/legal.html">Aviso legal</a></div>
<div class="foot-legal"><p>Contenido con fines informativos y educativos. No sustituye el consejo de un médico, fisioterapeuta, nutricionista ni entrenador cualificado. Ante dolor, lesión o enfermedad, consulta a un profesional.</p><p>© KINET OS · kinetos.es</p></div>
</div></footer>'''

def backbar(back):
    if not back or back[0] in ('/', '/blog/') and back[1] == 'Inicio': return ''
    narrow = ' nr' if back[0] == '/herramientas/' else ''
    return f'<div class="kb-backbar{narrow}"><a class="kb-back" href="{back[0]}" aria-label="{back[2] if len(back) > 2 else back[1]}">{BACK}<span>{back[1]}</span></a></div>'

def page(title, desc, path, body, active, extra_head='', og_type='website', jsonld=None, scripts='', back=None):
    url = SITE + path
    ld = f'<script type="application/ld+json">{json.dumps(jsonld, ensure_ascii=False)}</script>' if jsonld else ''
    return f'''<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">
<script>try{{var w=sessionStorage.getItem('kb_warp');if(w&&Date.now()-JSON.parse(w).t<6000){{document.documentElement.classList.add('kb-arriving');setTimeout(function(){{document.documentElement.classList.remove('kb-arriving')}},2400)}}}}catch(e){{}}</script>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{html.escape(seo_title(title))}</title>
<meta name="description" content="{html.escape(desc, quote=True)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="{og_type}"><meta property="og:title" content="{html.escape(title, quote=True)}"><meta property="og:description" content="{html.escape(desc, quote=True)}"><meta property="og:url" content="{url}"><meta property="og:locale" content="es_ES"><meta property="og:site_name" content="KINET OS"><meta property="og:image" content="{SITE}/icons/og-kinet.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:image" content="{SITE}/icons/og-kinet.png">
<meta name="twitter:card" content="summary_large_image">
{ICON}{FONTS}<link rel="stylesheet" href="/blog/blog.css?v={V}"><link rel="stylesheet" href="/blog/fx.css?v={V}"><link rel="stylesheet" href="/kb-nav.css?v={V}">{extra_head}{ld}
<script src="/kb-nav.js?v={V}" defer></script><script src="/blog/kb-index.js?v={V}" defer></script><script src="/blog/space.js?v={V}" defer></script><script src="/blog/blog.js?v={V}" defer></script><script src="/blog/fx.js?v={V}" defer></script>
</head><body>
{header(active, back)}
{backbar(back)}<main>{body}</main>
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
    return body, heads

def cta(slug, title=None, text=None, kind='blog'):
    title = title or 'Prueba KINET OS gratis'
    text = text or 'Tu cuerpo técnico de IA (preparador físico, nutricionista, fisio y psicólogo deportivo), tu KINET Card y el análisis de partidos, en una sola app. Empieza gratis, sin tarjeta.'
    return f'<aside class="cta led rv"><b>{html.escape(title)}</b><p>{text}</p><div class="row"><a class="btn" href="{utm(slug, kind)}">Abrir KINET OS gratis {ARROW}</a><a class="btn ghost" href="/herramientas/">Ver herramientas gratis</a></div></aside>'

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
    body = re.sub(r'\{\{POST:([a-z0-9-]+)\|([^}]+)\}\}', lambda m: f'<a href="/blog/{m.group(1)}.html">{m.group(2)}</a>', body)
    return body

def post_card(m, i=0, mini=False):
    acc = ACC.get(m['cat'], '#00FF88')
    cv = '' if mini else '<span class="cvbox">' + cover(m['cat'], m['slug'], CATS.get(m['cat'], ''), f'{i + 1:02d}') + '</span>'
    return (f'<a class="card rv{" mini" if mini else ""}" style="--acc:{acc}" data-cat="{m["cat"]}" data-t="{html.escape((m["title"] + " " + m["desc"]).lower(), quote=True)}" href="/blog/{m["slug"]}.html">{cv}'
            f'<div class="cb"><span class="k">{CATS.get(m["cat"], "")}<em>{m.get("mins", "6")} min</em></span><h3>{html.escape(m["title"])}</h3><p>{html.escape(m["desc"])}</p><span class="go">Leer artículo {ARROW}</span></div></a>')

def tool_card(s, t):
    acc = ACC.get(t['cat'], '#22D3EE')
    return (f'<a class="tt rv" style="--acc:{acc}" href="/herramientas/{s}.html"><span class="ico">{TICON.get(t["cat"], TICON["calc"])}</span>'
            f'<span class="tx"><b>{html.escape(t["title"])}</b><span class="d">{html.escape(t["desc"])}</span><span class="tag">Gratis · sin registro</span></span></a>')

def tool_tile(s, t, i=0):
    acc = ACC.get(t['cat'], '#22D3EE')
    return (f'<a class="tile rv" style="--acc:{acc}" href="/herramientas/{s}.html"><span class="cvbox">{cover(t["cat"], s, TCATS.get(t["cat"], ""), f"{i + 1:02d}")}</span>'
            f'<div class="tb"><span class="tag">{TCATS.get(t["cat"], "")}<i>Gratis</i></span><h3>{html.escape(t["title"])}</h3><p>{html.escape(t["desc"])}</p><span class="go">Usar ahora {ARROW}</span></div></a>')

def d_fmt(d):
    y, m, dd = d.split('-'); meses = 'enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split()
    return f'{int(dd)} de {meses[int(m)-1]} de {y}'

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
    shutil.copy(os.path.join(SRC, 'blog.js'), os.path.join(ROOT, 'blog', 'blog.js'))
    shutil.copy(os.path.join(SRC, 'nav.css'), os.path.join(ROOT, 'blog', 'nav.css'))
    shutil.copy(os.path.join(SRC, 'nav.js'), os.path.join(ROOT, 'blog', 'nav.js'))
    shutil.copy(os.path.join(SRC, 'space.js'), os.path.join(ROOT, 'blog', 'space.js'))
    shutil.copy(os.path.join(SRC, 'fx.js'), os.path.join(ROOT, 'blog', 'fx.js'))
    shutil.copy(os.path.join(SRC, 'fx.css'), os.path.join(ROOT, 'blog', 'fx.css'))
    shutil.copy(os.path.join(SRC, 'art.js'), os.path.join(ROOT, 'blog', 'art.js'))
    shutil.copy(os.path.join(SRC, 'tools.js'), os.path.join(ROOT, 'herramientas', 'tools.js'))
    urls = [('/', '1.0'), ('/blog/', '0.8'), ('/herramientas/', '0.8'), ('/soporte.html', '0.4')]
    items = sorted(posts.values(), key=lambda x: x['date'], reverse=True)

    # índice de búsqueda (paleta de comandos)
    idx = [{'t': m['title'], 'd': m['desc'], 'c': CATS.get(m['cat'], 'Artículo'), 'u': f'/blog/{m["slug"]}.html', 'a': ACC.get(m['cat'], '#00FF88')} for m in items]
    idx += [{'t': t['title'], 'd': t['desc'], 'c': 'Herramienta', 'u': f'/herramientas/{s}.html', 'a': ACC.get(t['cat'], '#22D3EE')} for s, t in tools.items()]
    idx += [{'t': 'Abrir KINET OS', 'd': 'app cuerpo técnico ia', 'c': 'App', 'u': '/', 'a': '#00FF88'}]
    open(os.path.join(ROOT, 'blog', 'kb-index.js'), 'w', encoding='utf-8').write('window.KB_INDEX=' + json.dumps(idx, ensure_ascii=False) + ';')


    # ───── sección de la landing (index.html) ─────
    ICON = {'calculadora-1rm': '🏋️', 'zonas-frecuencia-cardiaca': '❤️‍🔥', 'generador-alineacion': '⚽'}
    tl = ''
    for s_, t_ in tools.items():
        c_ = ACC.get(t_['cat'], '#22D3EE')
        tl += (f'          <a class="t" style="--c:{c_}" href="herramientas/{s_}.html"><span class="free">GRATIS</span><div class="ic">{ICON.get(s_, "🧮")}</div>'
               f'<strong>{html.escape(t_["title"].split(" · ")[0])}</strong><span>{html.escape(t_["desc"][:92].rsplit(" ", 1)[0])}…</span><em>Usar ahora →</em></a>\n')
    pl = ''
    for i_, m_ in enumerate(items[:5]):
        c_ = ACC.get(m_['cat'], '#00FF88')
        pl += (f'          <a class="p" style="--c:{c_}" href="blog/{m_["slug"]}.html"><i class="n" style="font-style:normal">{i_ + 1:02d}</i>'
               f'<div><strong>{html.escape(m_["title"])}</strong><small>{CATS.get(m_["cat"], "Artículo")}</small></div><span class="ar">→</span></a>\n')
    _gb = games_build
    gl = ''
    for g_ in _gb.GAMES:
        if not os.path.exists(os.path.join(SRC, 'games', g_['js'])): continue
        gl += (f'          <a class="p" style="--c:#22D3EE" href="juegos/{g_["slug"]}.html"><i class="n" style="font-style:normal">{g_["n"]}</i>'
               f'<div><strong>{html.escape(g_["name"])}</strong><small>{html.escape(g_["tag"])} · {html.escape(g_["time"])}</small></div><span class="ar">→</span></a>\n')
    sec = open(os.path.join(SRC, 'home-section.html'), encoding='utf-8').read().replace('{{TOOLS}}', tl).replace('{{POSTS}}', pl).replace('{{GAMES}}', gl)
    ip = os.path.join(ROOT, 'index.html'); ih = open(ip, encoding='utf-8').read()
    a_, b_ = '<!--KB-HOME-START-->', '<!--KB-HOME-END-->'
    if a_ in ih and b_ in ih:
        ih = ih[:ih.index(a_) + len(a_)] + '\n' + sec + '\n    ' + ih[ih.index(b_):]
        open(ip, 'w', encoding='utf-8').write(ih)

    # ───── artículos ─────
    order = [m['slug'] for m in items]
    for n, (slug, m) in enumerate(sorted(posts.items(), key=lambda kv: order.index(kv[0]))):
        body, heads = add_toc(m['body'])
        body = render_tokens(body, slug, tools)
        rel = [s for s in m.get('related', '').replace(' ', '').split(',') if s in posts]
        rel_t = [s for s in m.get('tools', '').replace(' ', '').split(',') if s in tools]
        rel_html = ''
        if rel or rel_t:
            cards = ''.join(post_card(posts[s], order.index(s)) for s in rel) + ''.join(tool_card(s, tools[s]) for s in rel_t)
            rel_html = f'<section class="related"><h2>Sigue leyendo</h2><div class="cards">{cards}</div></section>'
        d = m['date']; acc = ACC.get(m['cat'], '#00FF88'); cname = CATS.get(m['cat'], '')
        ld = {"@context": "https://schema.org", "@type": "Article", "headline": m['title'], "description": m['desc'], "datePublished": d, "dateModified": d,
              "inLanguage": "es", "mainEntityOfPage": f"{SITE}/blog/{slug}.html", "author": {"@type": "Organization", "name": "KINET OS"},
              "publisher": {"@type": "Organization", "name": "KINET OS", "logo": {"@type": "ImageObject", "url": f"{SITE}/icons/icon-512.png"}}}
        bc = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "KINET OS", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog/"},
            {"@type": "ListItem", "position": 3, "name": m['title'], "item": f"{SITE}/blog/{slug}.html"}]}
        toc_links = ''.join(f'<li><a href="#{i}">{html.escape(t)}</a></li>' for i, t in heads)
        toc_side = f'<div class="side-box"><b class="t">En este artículo</b><ol>{toc_links}</ol></div>' if len(heads) >= 3 else ''
        toc_m = f'<details class="toc-m"><summary>En este artículo</summary><div class="side-box" style="border:0;padding:0;background:none"><ol>{toc_links}</ol></div></details>' if len(heads) >= 3 else ''
        pv = items[order.index(slug) - 1] if order.index(slug) > 0 else None
        nx = items[order.index(slug) + 1] if order.index(slug) < len(items) - 1 else None
        pn = ''
        if pv or nx:
            pn = '<nav class="pn" aria-label="Más artículos">' + (f'<a href="/blog/{pv["slug"]}.html"><small>← Más reciente</small><b>{html.escape(pv["title"])}</b></a>' if pv else '<span></span>') + (f'<a href="/blog/{nx["slug"]}.html"><small>Anterior →</small><b>{html.escape(nx["title"])}</b></a>' if nx else '<span></span>') + '</nav>'
        main_html = f'''<div class="layout" style="--acc:{acc}">
<div class="head">
<div class="crumbs"><a href="/">KINET OS</a> › <a href="/blog/">Blog</a> › {cname}</div>
<span class="kicker">{cname}</span>
<h1>{html.escape(m['title'])}</h1>
<div class="meta"><span>📅 {d_fmt(d)}</span><span>⏱ {m.get('mins', '6')} min de lectura</span><span>✍ Equipo KINET OS</span></div>
<div class="art-hero led">{cover(m['cat'], slug, cname, f'{order.index(slug) + 1:02d}', 'w', True)}</div>
</div>
<article>
<p class="lead">{m['desc']}</p>
{toc_m}
{body}
{cta(slug)}
<div class="byline"><span class="bk" aria-hidden="true">K</span><div><b>Equipo KINET OS</b>Preparadores, analistas y desarrolladores que construyen el sistema operativo del deportista.</div></div>
{pn}
{rel_html}
</article>
<aside class="side">{toc_side}
<div class="side-box side-cta"><b class="t">KINET OS</b><p>Convierte esta guía en un plan real con tu cuerpo técnico de IA.</p><a class="btn sm" style="width:100%" href="{utm(slug)}">Probar gratis {ARROW}</a></div>
<div class="side-box"><b class="t">Compartir</b><div class="sharebtn"><button type="button" data-copy>Copiar enlace</button><a href="https://wa.me/?text={html.escape(m['title'], quote=True)}%20{SITE}/blog/{slug}.html" target="_blank" rel="noopener">WhatsApp</a></div></div>
</aside>
</div>'''
        out = page(m['title'] + ' | KINET OS', m['desc'], f'/blog/{slug}.html', main_html, 'blog', og_type='article', jsonld=[ld, bc], back=('/blog/', 'Volver a la órbita', 'Volver a la órbita del blog'))
        open(os.path.join(ROOT, 'blog', slug + '.html'), 'w', encoding='utf-8').write(out)
        urls.append((f'/blog/{slug}.html', '0.7'))

    # ───── índice del blog ─────
    used = [c for c in CATS if any(m['cat'] == c for m in items)]
    chips = '<button class="chip on" data-c="">Todo</button>' + ''.join(f'<button class="chip" style="--acc:{ACC[c]}" data-c="{c}">{CATS[c]}</button>' for c in used)
    first = items[0]
    feat = (f'<a class="feat led rv" style="--acc:{ACC.get(first["cat"], "#00FF88")}" href="/blog/{first["slug"]}.html"><span class="cvbox">{cover(first["cat"], first["slug"], CATS.get(first["cat"], ""), "01")}</span>'
            f'<div class="fb"><span class="kicker" style="width:max-content">Último · {CATS.get(first["cat"], "")}</span><h2>{html.escape(first["title"])}</h2><p>{html.escape(first["desc"])}</p><span class="go">Leer ahora {ARROW}</span></div></a>')
    rest = items[1:]
    cards = ''.join(post_card(m, i + 1) for i, m in enumerate(rest))
    tcards = ''.join(tool_card(s, t) for s, t in tools.items())
    ticker = ''.join(f'<span>{c}</span>' for c in ['Fuerza', 'Táctica', 'Recuperación', 'Nutrición', 'Mentalidad', 'Carrera deportiva', 'Datos', 'IA aplicada'] * 2)
    nav = navdata.build(posts, tools, CATS, TCATS, ACC, cover)
    blog_main = f'''<div class="wrap wide">
<section class="kbs" id="kb-nav" aria-label="Explorar por tema">
<div class="kbs-intro hero">
<span class="kicker">KINET LAB · Blog de rendimiento</span>
<h1>Entrena mejor,<br><span class="rot"><span>rinde más.</span><span>decide mejor.</span><span>crece rápido.</span></span></h1>
<p class="lead">Guías prácticas de entrenamiento, recuperación, táctica y carrera deportiva para jugadores, entrenadores y ojeadores. Sin humo, con herramientas gratis para aplicarlas hoy.</p>
<div class="stats"><div class="stat"><b data-count="{len(items)}">0</b><span>Guías</span></div><div class="stat"><b data-count="{len(tools)}">0</b><span>Herramientas gratis</span></div><div class="stat"><b><i>0</i> €</b><span>Sin registro</span></div></div>
<div class="kbs-cta"><a class="btn" href="#kb-list">Ver todas las guías {ARROW}</a><a class="btn ghost" href="/herramientas/">Herramientas gratis</a></div>
</div>
{nav}
</section>
<div class="filters" id="kb-list">
<div class="finder"><input id="q" class="search" type="search" placeholder="Buscar guías… o pulsa /" aria-label="Buscar artículos" autocomplete="off"><a class="btn ghost" href="/herramientas/">Herramientas gratis {ARROW}</a></div>
<div class="chips" id="chips">{chips}</div>
<div class="ticker" aria-hidden="true"><div><span>{ticker}</span><span>{ticker}</span></div></div>
</div>
<div id="fe">{feat}</div>
<div class="cards" id="list">{cards}</div>
<p class="empty" id="none">No hay guías con ese filtro. Prueba otra categoría.</p>
<div class="sec-h"><h2>Herramientas gratis</h2><a class="all" href="/herramientas/">Ver todas {ARROW}</a></div>
<div class="tstrip">{tcards}</div>
{cta('blog-home')}
</div>
<script>(function(){{var c='',q='',cards=[].slice.call(document.querySelectorAll('#list .card')),fe=document.getElementById('fe'),fc='{first["cat"]}',ft=document.querySelector('#fe .feat');function f(){{var n=0;cards.forEach(function(e){{var ok=(!c||e.dataset.cat===c)&&(!q||e.dataset.t.indexOf(q)>-1);e.style.display=ok?'':'none';if(ok)n++}});var fo=(!c||fc===c)&&(!q||{json.dumps((first["title"] + " " + first["desc"]).lower(), ensure_ascii=False)}.indexOf(q)>-1);fe.style.display=fo?'':'none';document.getElementById('none').style.display=(n||fo)?'none':'block'}}
document.getElementById('q').addEventListener('input',function(e){{q=e.target.value.toLowerCase().trim();f()}});
document.getElementById('chips').addEventListener('click',function(e){{var b=e.target.closest('.chip');if(!b)return;[].forEach.call(document.querySelectorAll('.chip'),function(x){{x.classList.remove('on')}});b.classList.add('on');c=b.dataset.c;f()}})}})();</script>'''
    ld = {"@context": "https://schema.org", "@type": "Blog", "name": "Blog KINET OS", "url": SITE + "/blog/", "inLanguage": "es"}
    open(os.path.join(ROOT, 'blog', 'index.html'), 'w', encoding='utf-8').write(page('Blog de rendimiento deportivo | KINET OS', 'Guías prácticas de entrenamiento, recuperación, táctica y carrera deportiva para jugadores, entrenadores y ojeadores, con herramientas gratis.', '/blog/', blog_main, 'blog', extra_head=f'<link rel="stylesheet" href="/blog/nav.css?v={V}"><noscript><style>.kbn{{display:none}}</style></noscript>', scripts=f'<script src="/blog/art.js?v={V}" defer></script><script src="/blog/nav.js?v={V}" defer></script>', jsonld=ld, back=('/', 'Inicio')))

    # ───── herramientas ─────
    for slug, t in tools.items():
        art_html, heads = add_toc(render_tokens(t['article'], slug, tools, 'herramienta'))
        rel = [s for s in t.get('related', '').replace(' ', '').split(',') if s in posts]
        rel_html = ''
        if rel:
            cards = ''.join(post_card(posts[s], order.index(s)) for s in rel)
            rel_html = f'<section class="related"><h2>Te puede interesar</h2><div class="cards">{cards}</div></section>'
        acc = ACC.get(t['cat'], '#22D3EE')
        toc_links = ''.join(f'<li><a href="#{i}">{html.escape(x)}</a></li>' for i, x in heads)
        toc_side = f'<div class="side-box"><b class="t">Cómo funciona</b><ol>{toc_links}</ol></div>' if len(heads) >= 3 else ''
        main_html = f'''<div class="layout" style="--acc:{acc}">
<div class="head">
<div class="crumbs"><a href="/">KINET OS</a> › <a href="/herramientas/">Herramientas</a> › {TCATS.get(t['cat'], '')}</div>
<span class="kicker">Herramienta gratis · sin registro</span>
<h1>{html.escape(t['title'])}</h1>
<p class="lead" style="max-width:760px">{t['desc']}</p>
<div class="tool led" id="tool"><div class="tool-bar"><span class="dots"><i></i><i></i><i></i></span><span>KINET·TOOL // {html.escape(slug.replace('-', '_'))}</span><span class="st">LISTO</span></div>
<div class="tool-body">{t['tool']}
<div class="tool-cta"><p><b style="color:#fff">¿Quieres que tu cuerpo técnico de IA use este resultado?</b><br>Guárdalo en tu perfil y recibe un plan personalizado.</p><a class="btn sm" href="{utm(slug, 'herramienta')}">Abrir KINET OS {ARROW}</a></div>
<p class="privacy">🔒 Tus datos se guardan solo en esta pestaña del navegador: se conservan si recargas y se borran al cerrarla. No se envían a ningún servidor.</p></div></div>
</div>
<article>
{art_html}
{cta(slug, kind='herramienta')}
{rel_html}
</article>
<aside class="side">{toc_side}
<div class="side-box side-cta"><b class="t">KINET OS</b><p>Más de 4 agentes de IA para entrenar, comer y recuperarte mejor.</p><a class="btn sm" style="width:100%" href="{utm(slug, 'herramienta')}">Probar gratis {ARROW}</a></div>
<div class="side-box"><b class="t">Más herramientas</b><div class="sharebtn" style="flex-direction:column"><a href="/herramientas/">Ver todas</a><a href="/blog/">Leer el blog</a></div></div>
</aside>
</div>'''
        ld = {"@context": "https://schema.org", "@type": "WebApplication", "name": t['title'], "description": t['desc'], "url": f"{SITE}/herramientas/{slug}.html",
              "applicationCategory": "HealthApplication", "operatingSystem": "Web", "inLanguage": "es", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "EUR"},
              "publisher": {"@type": "Organization", "name": "KINET OS"}}
        out = page(t['title'] + ' gratis | KINET OS', t['desc'], f'/herramientas/{slug}.html', main_html, 'tools', jsonld=ld, extra_head='<script src="/herramientas/tools.js?v=2"></script>', back=('/herramientas/', 'Volver a la órbita', 'Volver a las herramientas'))
        open(os.path.join(ROOT, 'herramientas', slug + '.html'), 'w', encoding='utf-8').write(out)
        urls.append((f'/herramientas/{slug}.html', '0.8'))

    cats = {}
    for s, t in tools.items(): cats.setdefault(t['cat'], []).append(s)
    sections = ''
    for c in TCATS:
        if c in cats:
            sections += f'<h2>{TCATS[c]}</h2><div class="tiles">' + ''.join(tool_tile(s, tools[s], n) for n, s in enumerate(cats[c])) + '</div>'
    nav_hub = navdata.build_hub(tools, ACC)
    hub = f'''<div class="wrap wide"><section class="kbs hub" id="kb-nav" aria-label="Elige una herramienta">
<div class="kbs-intro hero"><span class="kicker">KINET LAB · Herramientas</span>
<h1>Resultados en<br><span class="gr">5 segundos</span>.<br>Sin registro.</h1>
<p class="lead">Calculadoras, planificadores y generadores para deportistas y entrenadores. Todo funciona en tu navegador: lo que escribes no sale de tu dispositivo.</p>
<div class="stats"><div class="stat"><b data-count="{len(tools)}">0</b><span>Herramientas</span></div><div class="stat"><b><i>0</i> €</b><span>Para siempre</span></div><div class="stat"><b>100<i>%</i></b><span>Privado</span></div></div></div>
{nav_hub}
</section>
{sections}
<div class="sec-h"><h2>Aprende a usarlas</h2><a class="all" href="/blog/">Ir al blog {ARROW}</a></div>
<div class="cards">{''.join(post_card(m, i) for i, m in enumerate(items[:3]))}</div>
{cta('herramientas-home', kind='herramienta')}</div>'''
    ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": "Herramientas gratis para deportistas", "url": SITE + "/herramientas/", "inLanguage": "es"}
    open(os.path.join(ROOT, 'herramientas', 'index.html'), 'w', encoding='utf-8').write(page('Herramientas gratis para deportistas | KINET OS', 'Calculadoras, planificadores y generadores gratis para deportistas y entrenadores. Sin registro: tus datos no salen de tu navegador.', '/herramientas/', hub, 'tools', jsonld=ld, back=('/', 'Inicio'), extra_head=f'<link rel="stylesheet" href="/blog/nav.css?v={V}">', scripts=f'<script src="/blog/art.js?v={V}" defer></script><script src="/blog/nav.js?v={V}" defer></script>'))

    urls += games_build.build(ROOT, SRC, V, page, BACK, ARROW)
    urls += [('/privacidad.html', 0.3), ('/condiciones.html', 0.3)]
    today = datetime.date.today().isoformat()
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'<url><loc>{SITE}{u}</loc><lastmod>{today}</lastmod><priority>{p}</priority></url>\n' for u, p in urls) + '</urlset>\n'
    open(os.path.join(ROOT, 'sitemap.xml'), 'w').write(sm)
    kbnav.sync_root(ROOT, {'index.html': '', 'soporte.html': 'help', 'legal.html': '', 'privacidad.html': '', 'condiciones.html': ''})
    open(os.path.join(ROOT, 'robots.txt'), 'w').write(f'User-agent: *\nAllow: /\nDisallow: /admin.html\nDisallow: /gestion.html\nDisallow: /despacho.html\n\nSitemap: {SITE}/sitemap.xml\n')
    print(f'OK · {len(posts)} artículos · {len(tools)} herramientas · {len(urls)} URLs')


if __name__ == '__main__':
    main()
