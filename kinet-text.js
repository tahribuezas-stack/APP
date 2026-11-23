/* KINET OS · texto libre → datos limpios (ciudad, club, ciudad natal, lateralidad)
   KinetText.city('madrid') -> 'Madrid'   KinetText.club('soy del real madrid') -> 'Real Madrid'
   KinetText.parse('soy del real madrid, vivo en madrid y soy diestro', hint) -> { club, city, hometown, laterality }
   Sin dependencias: sirve igual en el onboarding, el perfil y los chats. */
(function (root) {
  'use strict';
  var LOWER = { de: 1, del: 1, la: 1, las: 1, los: 1, el: 1, y: 1, e: 1, en: 1, da: 1, do: 1, dos: 1, das: 1, i: 1, d: 1, l: 1 };
  var UPPER = { fc: 1, cd: 1, ud: 1, cf: 1, rc: 1, sd: 1, ad: 1, cb: 1, bm: 1, cp: 1, rcd: 1, rfef: 1, ac: 1, as: 1, sc: 1, ca: 1, cr: 1, pm: 1, mma: 1, usa: 1, uk: 1, ee: 1, uu: 1, ii: 1, iii: 1 };

  function squash(t) { return String(t == null ? '' : t).replace(/\s+/g, ' ').replace(/^[\s,.;:¡!¿?"'()\-–—]+|[\s,.;:¡!¿?"'()\-–—]+$/g, ''); }

  function titleCase(t) {
    t = squash(t);
    if (!t) return '';
    return t.toLowerCase().split(' ').map(function (w, i) {
      // "o'neill", "san-sebastián"
      return w.split(/([-'’./])/).map(function (p, j) {
        if (!p || /[-'’./]/.test(p)) return p;
        var bare = p.replace(/\./g, '');
        if (UPPER[bare]) return bare.toUpperCase();
        if (i > 0 && j === 0 && LOWER[p]) return p;
        return p.charAt(0).toUpperCase() + p.slice(1);
      }).join('');
    }).join(' ');
  }

  var PLACES = {};
  'Cádiz,Málaga,Almería,Córdoba,Jaén,León,Castellón,Alcalá de Henares,Ávila,Logroño,Santander,Pamplona,Vitoria-Gasteiz,San Sebastián,Bilbao,A Coruña,La Coruña,Lugo,Ourense,Pontevedra,Vigo,Gijón,Oviedo,Avilés,Zaragoza,Huesca,Teruel,Lleida,Tarragona,Girona,Barcelona,Hospitalet de Llobregat,Badalona,Sabadell,Terrassa,Mataró,Valencia,Alicante,Elche,Murcia,Cartagena,Albacete,Ciudad Real,Cuenca,Guadalajara,Toledo,Talavera de la Reina,Madrid,Móstoles,Alcorcón,Getafe,Leganés,Fuenlabrada,Alcobendas,Torrejón de Ardoz,Parla,Salamanca,Zamora,Valladolid,Palencia,Burgos,Soria,Segovia,Cáceres,Badajoz,Mérida,Sevilla,Huelva,Granada,Jerez de la Frontera,Algeciras,Marbella,Melilla,Ceuta,Las Palmas de Gran Canaria,Santa Cruz de Tenerife,Palma de Mallorca,Ibiza,Lisboa,Oporto,Bogotá,Medellín,Asunción,Perú,México,Ciudad de México,Panamá,Santiago de Chile,Concepción,Quito,Tegucigalpa,Mérida,Maracaibo,Caracas,Berlín,París,Londres,Marrakech,Tánger,Tetuán,Nador,Casablanca,Dakar'.split(',').forEach(function (c) { PLACES[c.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()] = c; });
  function fixPlace(t) { var k = String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); return PLACES[k] || t; }

  var FILLER_START = /^(?:(?:pues|bueno|mira|vale|eh+|ah+|hola|jaja+|yo|actualmente|ahora(?:\s+mismo)?|ahora|de\s+momento)\s+)+/i;
  var LAT = /\b(?:soy\s+|es\s+)?(zurd[oa]s?|diestr[oa]s?|ambidiestr[oa]s?|ambidextr[oa]s?)\b/i;

  function laterality(t) {
    var m = String(t || '').match(LAT);
    if (!m) return null;
    var w = m[1].toLowerCase();
    return /^zurd/.test(w) ? 'Zurdo' : /^ambi/.test(w) ? 'Ambidiestro' : 'Diestro';
  }
  function stripLat(t) { return String(t || '').replace(/[,;]?\s*(?:y\s+)?(?:soy\s+|es\s+)?(?:zurd[oa]s?|diestr[oa]s?|ambidiestr[oa]s?|ambidextr[oa]s?)(?:\s+de\s+(?:pierna|mano|pie))?\b/ig, ''); }
  function cut(t) { return String(t || '').split(/\s*(?:,|;|\.\s|\.$|\by\b\s+(?=(?:vivo|resido|nac|soy|juego|entreno|estoy|mi|me)\b)|\bpero\b|\baunque\b|\bdonde\b|\bque\b)\s*/i)[0]; }

  function city(t) {
    t = squash(stripLat(t)).replace(FILLER_START, '');
    t = t.replace(/^(?:(?:vivo|resido|estoy|me\s+encuentro|trabajo|entreno)\s+(?:ahora\s+)?(?:actualmente\s+)?(?:en|por)|(?:mi\s+)?ciudad(?:\s+actual|\s+natal)?(?:\s+es)?|(?:soy|nac[ií]|nacido|natural|vengo|crec[ií])\s+(?:de|en)|en|de|por|desde)\s+/i, '');
    t = cut(t).replace(/^(?:la\s+ciudad\s+de|el\s+pueblo\s+de|la\s+localidad\s+de)\s+/i, '');
    return fixPlace(titleCase(t)).slice(0, 40);
  }

  function initials(t) { return String(t || '').replace(/\b([A-Za-z])\.([A-Za-z])\.?/g, '$1$2'); }
  function club(t) {
    t = squash(stripLat(initials(t))).replace(FILLER_START, '');
    t = t.replace(/^(?:(?:soy|somos|era|fui|estoy|estamos)\s+(?:jugador\s+|socio\s+|canterano\s+|fan\s+)?(?:del|de\s+la|de\s+los|de\s+las|de|en\s+el|en\s+la|en)|(?:juego|jugamos|entreno|entrenamos|compito|ficho|fichado|milito|estoy\s+jugando|estoy\s+entrenando)\s+(?:actualmente\s+)?(?:por|con|en|para)(?:\s+el|\s+la|\s+los|\s+las)?|mi\s+(?:club|equipo|gimnasio|academia|escuela)(?:\s+actual)?(?:\s+es)?(?:\s+el|\s+la)?|(?:club|equipo|gimnasio|academia)(?:\s+actual)?\s+es(?:\s+el|\s+la)?|en\s+el|en\s+la|en|con\s+el|con\s+la|con|del|de\s+la)\s+/i, '');
    t = cut(t).replace(/^(?:el|la)\s+(?=(?:club|real|atl[eé]tico|deportivo|c\.?d|u\.?d|f\.?c|c\.?f|a\.?d|s\.?d)\b)/i, '');
    t = t.replace(/^(?:el|la)\s+(?=(\S+)$)/i, function (m, rest) { return fixPlace(rest) !== rest || PLACES[String(rest).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()] ? '' : m; });
    t = titleCase(t).split(' ').map(function (w) { var f = fixPlace(w); return f; }).join(' ');
    // ciudad de varias palabras al inicio (p. ej. "Alcala de Henares CD")
    t = t.replace(/^(\S+(?:\s+(?:de|del|la|las|los)\s+\S+){1,3})/, function (m) { return fixPlace(m); });
    return t.slice(0, 50);
  }

  // ¿"soy de X" es club (con artículo: del/de la) o ciudad natal (de + ciudad)?
  function parse(text, hint) {
    var out = { club: '', city: '', hometown: '', laterality: laterality(text) };
    var src = squash(initials(String(text || '')));
    if (!src) return out;
    var low = src.toLowerCase();

    // 1) frases con marcador explícito
    var re = {
      hometown: /(?:nac[ií]\s+en|nacido\s+en|natural\s+de|ciudad\s+natal(?:\s+es)?|vengo\s+de|soy\s+originari[oa]\s+de|crec[ií]\s+en|de\s+origen)\s+([^,;.]+?)(?=\s*(?:,|;|\.|\by\b|\bpero\b|$))/i,
      city: /(?:vivo\s+(?:ahora\s+)?en|resido\s+en|vivimos\s+en|actualmente\s+(?:vivo\s+)?en|ahora\s+vivo\s+en|me\s+mud[eé]\s+a|ciudad\s+actual(?:\s+es)?)\s+([^,;.]+?)(?=\s*(?:,|;|\.|\by\b|\bpero\b|$))/i,
      club: /(?:juego\s+(?:actualmente\s+)?(?:en|con|para)(?:\s+el|\s+la)?|entreno\s+(?:actualmente\s+)?(?:en|con)(?:\s+el|\s+la)?|ficho\s+por(?:\s+el)?|milito\s+en(?:\s+el)?|compito\s+(?:en|con|para)(?:\s+el)?|(?:soy|somos)\s+(?:jugador\s+|socio\s+|canterano\s+)?(?:del|de\s+la)|mi\s+(?:club|equipo|gimnasio|academia)(?:\s+actual)?\s+es(?:\s+el|\s+la)?|(?:club|equipo|gimnasio|academia)(?:\s+actual)?\s*(?:es|:)\s*(?:el|la)?|estoy\s+en\s+(?:el|la))\s+([^,;.]+?)(?=\s*(?:,|;|\.|\by\b(?=\s+(?:vivo|resido|nac|soy|juego|entreno|estoy|mi|me)\b)|\bpero\b|\bdonde\b|$))/i
    };
    var m;
    if ((m = src.match(re.hometown))) out.hometown = city(stripLat(m[1]));
    if ((m = src.match(re.city))) out.city = city(stripLat(m[1]));
    if ((m = src.match(re.club))) out.club = club(stripLat(m[1]));

    // 2) "soy de Madrid" (sin artículo) = ciudad natal, salvo que ya haya club con "del"
    if (!out.hometown && (m = src.match(/\bsoy\s+de\s+([^,;.]+?)(?=\s*(?:,|;|\.|\by\b|\bpero\b|$))/i)) && !/^(?:la|las|los|el)\b/i.test(m[1])) {
      var cand = city(stripLat(m[1]));
      if (cand && cand.toLowerCase() !== out.city.toLowerCase()) out.hometown = cand;
    }

    // 3) respuesta corta sin marcadores → depende de lo que se preguntó
    var hasMarkers = out.club || out.city || out.hometown;
    if (!hasMarkers && hint) {
      var bare = stripLat(src);
      if (hint === 'city') out.city = city(bare);
      else if (hint === 'hometown') out.hometown = city(bare);
      else if (hint === 'club') out.club = club(bare);
      else if (hint === 'place') {
        // "Madrid" / "Entreno en X, vivo en Y": varias cláusulas separadas por coma
        var parts = bare.split(/\s*[,;]\s*/).filter(Boolean);
        if (parts.length >= 2) { out.club = club(parts[0]); out.city = city(parts[1]); if (parts[2]) out.hometown = city(parts[2]); }
        else out.club = club(bare);
      }
    }
    return out;
  }

  root.KinetText = { titleCase: titleCase, city: city, club: club, laterality: laterality, stripLat: stripLat, parse: parse, squash: squash, person: titleCase };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.KinetText;
})(typeof window !== 'undefined' ? window : this);
