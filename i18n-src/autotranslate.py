#!/usr/bin/env python3
"""KINET OS · Autotraductor de los textos pendientes (EN / FR / DE / IT) con Gemini.

Qué hace
  1. Mira qué textos de i18n-src/keys.json todavía no están en ningún i18n-src/chunks/*.txt
  2. Los manda por lotes a Gemini (EN, FR, DE, IT a la vez) cuidando {#}, etiquetas HTML y nombres de marca
  3. Valida cada respuesta (mismos {#} y mismas etiquetas) y guarda los lotes buenos en chunks/auto_XXX.txt
  4. Al final ejecuta build.py, que regenera i18n/en.json, fr.json, de.json, it.json

Uso (desde la raíz del repo, necesitas una clave de Gemini; la gratuita de Google AI Studio vale):
    export GEMINI_API_KEY="tu_clave"          # en Windows PowerShell:  $env:GEMINI_API_KEY="tu_clave"
    python3 i18n-src/autotranslate.py
Opciones:
    --model gemini-2.5-flash      modelo a usar (por defecto gemini-2.5-flash)
    --batch 40                    textos por petición
    --limit 200                   procesar solo N textos (para probar)
    --dry                         no llama a la API: solo cuenta lo pendiente
Se puede parar y repetir: lo ya traducido no se vuelve a pedir. Si un lote falla se salta y se reintenta la próxima vez.
Después de ejecutarlo: sube la carpeta i18n/ a GitHub y sube el número V en kinet-i18n.js (para refrescar la caché).
"""
import argparse, glob, json, os, re, sys, time, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'i18n-src')
LANGS = ['en', 'fr', 'de', 'it']
SEP = '¦'

SYSTEM = (
    "Eres traductor profesional de interfaces de apps deportivas. Traduces textos de la app KINET OS "
    "(plataforma para atletas, entrenadores y ojeadores de fútbol, pádel/tenis y baloncesto) del español "
    "a inglés (en), francés (fr), alemán (de) e italiano (it).\n"
    "REGLAS ESTRICTAS:\n"
    "- Conserva EXACTAMENTE cada marcador {#} (representa un número) y en la misma cantidad.\n"
    "- Si el texto lleva HTML, conserva todas las etiquetas y atributos tal cual y traduce solo el texto visible.\n"
    "- No traduzcas marcas ni nombres propios: KINET, KINET OS, KINET Card, Vision Lab, Media Studio, Pulse, Shorts, Radar, "
    "Spotify, Supabase, Stripe, PRO, B2B, GRL, FPS, BPM, xG, VO2, SPM, ATO, etc.\n"
    "- Mantén emojis, símbolos, mayúsculas/minúsculas y puntuación inicial/final (espacios iniciales incluidos).\n"
    "- Tono: informal de 'tú' en la app (francés 'tu', alemán 'du', italiano 'tu'), conciso, de interfaz deportiva.\n"
    "- Usa terminología deportiva natural de cada idioma (p. ej. pádel: bandeja, víbora, chiquita se quedan; "
    "fútbol: ala, mediocentro, etc. con su término habitual).\n"
    "- Si un texto ya es un nombre propio, código o no necesita traducción, devuélvelo igual.\n"
    "- Responde SOLO con JSON: un array de objetos {\"id\":N,\"en\":\"..\",\"fr\":\"..\",\"de\":\"..\",\"it\":\"..\"}."
)


def load_keys():
    return {k['id']: k for k in json.load(open(os.path.join(SRC, 'keys.json'), encoding='utf-8'))}


def done_ids():
    d = set()
    for f in glob.glob(os.path.join(SRC, 'chunks', '*.txt')):
        for ln in open(f, encoding='utf-8'):
            p = ln.split(SEP, 1)[0].strip()
            if p.isdigit():
                d.add(int(p))
    return d


def is_junk(text):
    """Clases CSS, ids, rutas… no necesitan traducción."""
    toks = text.split()
    if all(re.fullmatch(r'[a-z0-9\-:\[\]{}#/.%_=]+', t) for t in toks):
        return True
    if not re.search(r'[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{3}', text):
        return True
    return False


def clean(s):
    return s.replace(SEP, '/').replace('\r', ' ').replace('\n', ' ')


def tags(s):
    return sorted(re.findall(r'</?[a-zA-Z]+', s))


def call_gemini(model, key, items):
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}'
    payload = {
        'systemInstruction': {'parts': [{'text': SYSTEM}]},
        'contents': [{'role': 'user', 'parts': [{'text': json.dumps(items, ensure_ascii=False)}]}],
        'generationConfig': {'temperature': 0.2, 'responseMimeType': 'application/json'},
    }
    req = urllib.request.Request(url, json.dumps(payload).encode('utf-8'), {'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = json.loads(r.read().decode('utf-8'))
    txt = data['candidates'][0]['content']['parts'][0]['text']
    return json.loads(txt)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', default='gemini-2.5-flash')
    ap.add_argument('--batch', type=int, default=40)
    ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--dry', action='store_true')
    a = ap.parse_args()

    keys = load_keys()
    done = done_ids()
    pend = [i for i in sorted(keys) if i not in done]
    junk = [i for i in pend if is_junk(keys[i]['k'])]
    todo = [i for i in pend if i not in set(junk)]
    print(f'Pendientes: {len(pend)} (de ellos {len(junk)} no necesitan traducción) → a traducir: {len(todo)}')
    chunks_dir = os.path.join(SRC, 'chunks')
    if junk and not a.dry:  # los marcamos como "sin cambios" para que no vuelvan a salir
        with open(os.path.join(chunks_dir, 'auto_000_sin_traducir.txt'), 'a', encoding='utf-8') as f:
            for i in junk:
                f.write(f'{i}{SEP}={SEP}={SEP}={SEP}=\n')
    if a.dry:
        return
    key = os.environ.get('GEMINI_API_KEY', '').strip()
    if not key:
        sys.exit('Falta GEMINI_API_KEY (export GEMINI_API_KEY="tu_clave").')
    if a.limit:
        todo = todo[:a.limit]

    n_ok = n_bad = 0
    for b in range(0, len(todo), a.batch):
        ids = todo[b:b + a.batch]
        items = [{'id': i, 'es': keys[i]['k']} for i in ids]
        res = None
        for attempt in range(4):
            try:
                res = call_gemini(a.model, key, items)
                break
            except (urllib.error.URLError, urllib.error.HTTPError, KeyError, ValueError, json.JSONDecodeError) as e:
                wait = 4 * (attempt + 1)
                print(f'  lote {b // a.batch + 1}: error ({e}); reintento en {wait}s')
                time.sleep(wait)
        if not isinstance(res, list):
            print(f'  lote {b // a.batch + 1}: saltado'); continue
        by = {int(r.get('id', -1)): r for r in res if isinstance(r, dict)}
        lines = []
        for i in ids:
            r, es = by.get(i), keys[i]['k']
            if not r:
                n_bad += 1; continue
            row = [str(i)]
            ok = True
            for l in LANGS:
                tr = clean(str(r.get(l, '')).strip())
                if not tr or tr == es:
                    row.append('='); continue
                if tr.count('{#}') != es.count('{#}') or (keys[i]['kind'] == 'h' and tags(tr) != tags(es)):
                    ok = False; break
                row.append(tr)
            if ok:
                lines.append(SEP.join(row))
            else:
                n_bad += 1
        if lines:
            name = os.path.join(chunks_dir, f'auto_{int(time.time())}_{b // a.batch + 1:03d}.txt')
            open(name, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
            n_ok += len(lines)
        print(f'  lote {b // a.batch + 1}/{(len(todo) + a.batch - 1) // a.batch}: {len(lines)} guardados')
        time.sleep(1.0)
    print(f'Listo: {n_ok} traducidos, {n_bad} rechazados por validación (se reintentan al repetir).')
    os.system(f'{sys.executable} "{os.path.join(SRC, "build.py")}"')


if __name__ == '__main__':
    main()
