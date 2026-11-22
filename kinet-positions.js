(function (window) {
  'use strict';

  const POSITION_TABLE = [
    // Fútbol
    { code: 'POR', sport: 'Fútbol', label: 'Portero (POR)', short: 'POR', analizador1: 'POR', analizador2: 'POR', aliases: ['portero', 'por', 'gk', 'goalkeeper', 'arquero'] },
    { code: 'DFC', sport: 'Fútbol', label: 'Defensa Central (DFC)', short: 'DFC', analizador1: 'DFC', analizador2: 'DFC', aliases: ['defensa central', 'dfc', 'central', 'cb'] },
    { code: 'LI',  sport: 'Fútbol', label: 'Lateral Izquierdo (LI)', short: 'LI', analizador1: 'LI', analizador2: 'LI', aliases: ['lateral izquierdo', 'carrilero izquierdo', 'li', 'cai', 'lb'] },
    { code: 'LD',  sport: 'Fútbol', label: 'Lateral Derecho (LD)', short: 'LD', analizador1: 'LD', analizador2: 'LD', aliases: ['lateral derecho', 'carrilero derecho', 'ld', 'cad', 'rb'] },
    { code: 'MCD', sport: 'Fútbol', label: 'Mediocentro Defensivo (MCD)', short: 'MCD', analizador1: 'MCD', analizador2: 'MCD', aliases: ['mediocentro defensivo', 'pivote', 'mcd', 'cdm'] },
    { code: 'MC',  sport: 'Fútbol', label: 'Mediocentro (MC)', short: 'MC', analizador1: 'MC', analizador2: 'MC', aliases: ['mediocentro', 'interior', 'mc', 'cm'] },
    { code: 'MCO', sport: 'Fútbol', label: 'Mediapunta (MCO)', short: 'MCO', analizador1: 'MCO', analizador2: 'MCO', aliases: ['mediapunta', 'mco', 'cam', 'enganche'] },
    { code: 'EI',  sport: 'Fútbol', label: 'Extremo Izquierdo (EI)', short: 'EI', analizador1: 'EI', analizador2: 'EI', aliases: ['extremo izquierdo', 'ei', 'lw'] },
    { code: 'ED',  sport: 'Fútbol', label: 'Extremo Derecho (ED)', short: 'ED', analizador1: 'ED', analizador2: 'ED', aliases: ['extremo derecho', 'ed', 'rw'] },
    { code: 'SD',  sport: 'Fútbol', label: 'Segundo Delantero (SD)', short: 'SD', analizador1: 'MCO', analizador2: 'MCO', aliases: ['segundo delantero', 'sd', 'media punta', 'second striker'] },
    { code: 'DC',  sport: 'Fútbol', label: 'Delantero Centro (DC)', short: 'DC', analizador1: 'DC', analizador2: 'DC', aliases: ['delantero', 'delantero centro', 'dc', 'st', '9'] },

    // Baloncesto
    { code: 'PG', sport: 'Baloncesto', label: 'Base (PG)', short: 'PG', analizador1: 'BASE (PG)', analizador2: 'PG', aliases: ['base', 'playmaker', 'pg', 'point guard', 'base (pg)'] },
    { code: 'SG', sport: 'Baloncesto', label: 'Escolta (SG)', short: 'SG', analizador1: 'ESCOLTA (SG)', analizador2: 'SG', aliases: ['escolta', 'combo guard', 'sg', 'shooting guard', 'escolta (sg)'] },
    { code: 'SF', sport: 'Baloncesto', label: 'Alero (SF)', short: 'SF', analizador1: 'ALERO (SF)', analizador2: 'SF', aliases: ['alero', '3&d', 'sf', 'small forward', 'alero (sf)'] },
    { code: 'PF', sport: 'Baloncesto', label: 'Ala-Pívot (PF)', short: 'PF', analizador1: 'ALA-PÍVOT (PF)', analizador2: 'PF', aliases: ['ala-pívot', 'ala-pivot', 'stretch 4', 'pf', 'power forward', 'ala-pívot (pf)'] },
    { code: 'C',  sport: 'Baloncesto', label: 'Pívot (C)', short: 'C', analizador1: 'PÍVOT (C)', analizador2: 'C', aliases: ['pívot (c)', 'pivot (c)', 'center', 'pívot', 'pivot', 'c'] },

    { code: '3X3', sport: 'Baloncesto', label: 'Especialista 3x3 Polivalente', short: '3X3', analizador1: 'ALERO (SF)', analizador2: 'SF', aliases: ['especialista 3x3', '3x3', 'especialista 3x3 polivalente'] },

    // Pádel / Tenis
    { code: 'AMBOS',      sport: 'Pádel / Tenis', label: 'Polivalente (Drive / Revés)', short: 'POLIV.', analizador1: 'DRIVE', analizador2: 'DRIVE', aliases: ['polivalente ambos lados', 'polivalente', 'ambos lados'] },
    { code: 'REVES',      sport: 'Pádel / Tenis', label: 'Revés', short: 'REVÉS', analizador1: 'REVÉS', analizador2: 'REVÉS', aliases: ['revés', 'reves'] },
    { code: 'DRIVE',      sport: 'Pádel / Tenis', label: 'Drive', short: 'DRIVE', analizador1: 'DRIVE', analizador2: 'DRIVE', aliases: ['drive'] },
    { code: 'INDIVIDUAL', sport: 'Pádel / Tenis', label: 'Individual', short: 'INDIV', analizador1: 'INDIVIDUAL', analizador2: 'INDIV', aliases: ['individual', 'indiv', 'tenis', 'all-court', 'fondo de pista'] },

    // Combate
    { code: 'ESTILISTA',      sport: 'Combate', label: 'Estilista (Out-Boxer)', short: 'ESTILISTA', analizador1: 'ESTILISTA', analizador2: 'ESTILISTA', aliases: ['estilista', 'out-boxer'] },
    { code: 'FAJADOR',        sport: 'Combate', label: 'Fajador / KO (Swarmer)', short: 'FAJADOR', analizador1: 'FAJADOR / KO', analizador2: 'FAJADOR / KO', aliases: ['fajador', 'swarmer', 'ko', 'pegador', 'striker'] },
    { code: 'CONTRAATACANTE', sport: 'Combate', label: 'Contraatacante', short: 'CONTRA', analizador1: 'CONTRAATACANTE', analizador2: 'CONTRAATACANTE', aliases: ['contraatacante', 'counter-puncher'] },
    { code: 'GRAPPLER',       sport: 'Combate', label: 'Grappler / MMA', short: 'GRAPPLER', analizador1: 'GRAPPLER / MMA', analizador2: 'GRAPPLER / MMA', aliases: ['grappler', 'wrestler', 'mma', 'bjj', 'sumision', 'peleador completo', 'well-rounded'] },

    // Running
    { code: 'VELOCISTA',   sport: 'Running', label: 'Velocista / Pista', short: 'VELOCISTA', analizador1: 'VELOCISTA / PISTA', analizador2: 'VELOCISTA / PISTA', aliases: ['velocista', 'velocidad', '100m', '200m', '400m'] },
    { code: 'MEDIO_FONDO', sport: 'Running', label: 'Medio Fondo', short: 'M.FONDO', analizador1: 'FONDO / MARATÓN', analizador2: 'FONDO / MARATÓN', aliases: ['medio fondo', '800m', '1500m'] },
    { code: 'FONDO',       sport: 'Running', label: 'Fondo / Maratón', short: 'FONDO', analizador1: 'FONDO / MARATÓN', analizador2: 'FONDO / MARATÓN', aliases: ['fondo', 'maratón', 'maraton', 'maratoniano', 'media maraton',  '5k', '10k', 'ruta'] },
    { code: 'TRAIL',       sport: 'Running', label: 'Trail / Montaña', short: 'TRAIL', analizador1: 'TRAIL / MONTAÑA', analizador2: 'TRAIL / MONTAÑA', aliases: ['trail', 'montaña', 'montana'] },
    { code: 'OPOSITOR',   sport: 'Running', label: 'Opositor / Pruebas Físicas', short: 'OPOS.', analizador1: 'FONDO / MARATÓN', analizador2: 'FONDO / MARATÓN', aliases: ['opositor', 'pruebas fisicas'] },
    { code: 'PACER',       sport: 'Running', label: 'Liebre (Pacer)', short: 'PACER', analizador1: 'LIEBRE (PACER)', analizador2: 'LIEBRE (PACER)', aliases: ['liebre', 'pacer'] }
  ];

  function cleanStr(s) {
    return String(s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function resolvePosition(raw) {
    const rawStr = String(raw || '').trim();
    if (!rawStr) return null;
    // 1. Código exacto entre paréntesis: "Base Director / Playmaker (PG)" -> "PG"
    const paren = rawStr.match(/\(([A-Z0-9]{1,4})\)/i);
    if (paren) {
      const hit = POSITION_TABLE.find(p => p.code === paren[1].toUpperCase());
      if (hit) return hit;
    }
    // 2. Código exacto
    const upper = rawStr.toUpperCase();
    const byCode = POSITION_TABLE.find(p => p.code === upper || p.short === upper);
    if (byCode) return byCode;
    // 3. Roles de cuerpo técnico / ojeadores: no son demarcaciones, se dejan tal cual
    const norm = cleanStr(rawStr);
    if (/\b(entrenador|coach|fisio|nutricion|psicolog|director|scout|agente|analista|preparador|secretario|medico)/.test(norm)) return null;
    // 4. Alias exacto (cualquier longitud)
    const exact = POSITION_TABLE.find(p => p.aliases.some(a => norm === cleanStr(a)));
    if (exact) return exact;
    // 5. Alias como palabra completa dentro del texto (sólo alias de 5+ letras, para no confundir "por" con "portero")
    const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return POSITION_TABLE.find(p => p.aliases.some(a => {
      const c = cleanStr(a);
      return c.length >= 5 && new RegExp('(^|[^a-z0-9])' + esc(c) + '($|[^a-z0-9])').test(norm);
    })) || null;
  }

  window.KinetPositions = {
    TABLE: POSITION_TABLE,
    toCode: (raw) => resolvePosition(raw)?.code || String(raw || 'PRO').trim().toUpperCase(),
    toLabel: (raw) => resolvePosition(raw)?.label || String(raw || 'PRO').trim(),
    toScreenFormat: (raw, screen) => {
      const p = resolvePosition(raw);
      if (!p) return String(raw || 'PRO').trim();
      return p[screen] || p.short; // screen: 'analizador1' | 'analizador2' | 'label' | 'short' | 'code'
    },
    samePosition: (a, b) => {
      const ca = resolvePosition(a)?.code;
      const cb = resolvePosition(b)?.code;
      return Boolean(ca && cb && ca === cb);
    }
  };
})(window);
