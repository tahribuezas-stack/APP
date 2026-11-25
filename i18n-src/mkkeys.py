#!/usr/bin/env python3
"""Genera i18n-src/keys.json (lista ordenada de cadenas en español a traducir) a partir de
   /tmp/i18n/dom.json (KinetI18n.collect() en cada pantalla) y /tmp/i18n/js.json (literales de JS)."""
import json,re,os
D=json.load(open('/tmp/i18n/dom.json'));J=json.load(open('/tmp/i18n/js.json'))
prio="index login onboarding_pro onboarding_scout_pro kinet_os_staff_coach_onboarding app cuerpo-tecnico ficha-pro perfil despacho comunidad analizador analizador2 analizador3 ojeador-live media-studio soporte tutorial fase1 estado".split()
def ok(k):
    if len(k)<3: return False
    if re.search(r'https?://|@[a-z0-9.-]+\.[a-z]{2,}|\.(png|jpg|js|css)$',k): return False
    if not re.search(r'[A-Za-zÁÉÍÓÚáéíóúñÑ]{2}',k): return False
    return True
def jsnorm(k): return re.sub(r'\d+(?:[.,]\d+)?','{#}',k)
seen={};order=[];tier={}
def add(k,kind,t):
    key=(kind,k)
    if key in seen: return
    seen[key]=len(order);order.append(key);tier[key]=t
for pg in prio:
    for k in D['pt'].get(pg,[]):
        if ok(k): add(k,'t',1)
    for k in D['ph'].get(pg,[]):
        add(k,'h',1)
for pg in D['pt']:
    for k in D['pt'][pg]:
        if ok(k): add(k,'t',1)
for pg in D['ph']:
    for k in D['ph'][pg]: add(k,'h',1)
# literales JS (tier 2) — fuera prompts de IA y textos muy largos
bad=re.compile(r'^(Eres |Responde|Actúa|Devuelve|Genera |Analiza |Redacta )|JSON|prompt|\bIA debe\b',re.I)
jsk=[]
for k,files in J.items():
    n=jsnorm(k)
    if len(n)>180 or bad.search(n) or not ok(n): continue
    jsk.append((min([prio.index(f[:-5]) if f[:-5] in prio else 99 for f in files]),n))
for _,n in sorted(jsk): add(n,'t',2)
KP=os.path.join(os.path.dirname(os.path.abspath(__file__)),'keys.json')
old=json.load(open(KP)) if os.path.exists(KP) else []   # los ids ya asignados NO cambian: solo se añaden cadenas nuevas al final
have={(o['kind'],o['k']) for o in old}
keys=list(old)
for kind,k in order:
    if (kind,k) not in have: keys.append({'id':len(keys)+1,'k':k,'kind':kind,'tier':tier[(kind,k)]})
json.dump(keys,open(KP,'w'),ensure_ascii=False,indent=0)
print('total',len(keys),'tier1',sum(1 for k in keys if k['tier']==1),'html',sum(1 for k in keys if k['kind']=='h'),'tier2',sum(1 for k in keys if k['tier']==2))
print('chars tier1',sum(len(k['k']) for k in keys if k['tier']==1))
