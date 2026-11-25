#!/usr/bin/env python3
"""Fusiona i18n-src/chunks/*.txt con keys.json y escribe i18n/<lang>.json
Formato de cada línea de un chunk:  id ¦ en ¦ fr ¦ de ¦ it     (separador ¦ ; los idiomas que falten se dejan sin traducir)
Uso: python3 i18n-src/build.py   (desde la raíz del repo)"""
import json,glob,os,re,sys
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));SRC=os.path.join(ROOT,'i18n-src')
keys={k['id']:k for k in json.load(open(os.path.join(SRC,'keys.json')))}
LANGS=['en','fr','de','it']
out={l:{'t':{},'h':{}} for l in LANGS}
done=set();problems=[]
for f in sorted(glob.glob(os.path.join(SRC,'chunks','*.txt'))):
    for n,ln in enumerate(open(f,encoding='utf-8'),1):
        ln=ln.rstrip('\n')
        if not ln.strip() or ln.startswith('#'): continue
        parts=[p.strip() for p in ln.split('¦')]
        try: i=int(parts[0])
        except: problems.append(f'{os.path.basename(f)}:{n} id inválido'); continue
        k=keys.get(i)
        if not k: problems.append(f'{os.path.basename(f)}:{n} id {i} no existe'); continue
        done.add(i)
        for j,l in enumerate(LANGS,1):
            if j>=len(parts) or not parts[j] or parts[j]=='=': continue
            tr=parts[j]
            if tr.startswith('[H]'): tr=tr[3:].lstrip()
            if k['k'].count('{#}')!=tr.count('{#}'): problems.append(f'id {i} [{l}] {{#}} no coincide'); continue
            if k['kind']=='h' and sorted(re.findall(r'</?[a-z]+',k['k']))!=sorted(re.findall(r'</?[a-z]+',tr)): problems.append(f'id {i} [{l}] etiquetas html no coinciden'); continue
            if tr!=k['k']: out[l]['h' if k['kind']=='h' else 't'][k['k']]=tr
os.makedirs(os.path.join(ROOT,'i18n'),exist_ok=True)
for l in LANGS:
    json.dump({'v':1,'t':out[l]['t'],'h':out[l]['h']},open(os.path.join(ROOT,'i18n',l+'.json'),'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
    print(l,len(out[l]['t']),'textos',len(out[l]['h']),'html',os.path.getsize(os.path.join(ROOT,'i18n',l+'.json'))//1024,'KB')
pend=[i for i in keys if i not in done]
print('traducidas',len(done),'de',len(keys),'· pendientes',len(pend),'· primer pendiente',pend[0] if pend else '-')
for p in problems[:30]: print('PROBLEMA',p)
