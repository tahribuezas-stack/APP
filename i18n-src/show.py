import json,sys
keys=json.load(open('i18n-src/keys.json'));a,b=int(sys.argv[1]),int(sys.argv[2])
for k in keys:
    if a<=k['id']<=b: print(f"{k['id']}¦{'[H] ' if k['kind']=='h' else ''}{k['k']}")
