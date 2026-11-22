/* ==========================================================
   KINET OS · Diccionario único de deportes (fuente de verdad)
   Evita que cada página decida por su cuenta qué deporte es y que
   "Otros Deportes" caiga por defecto en textos de fútbol.
   Uso:  KinetSport.key('Pádel / Tenis') -> 'padel'
         KinetSport.terms(sport).comp   -> 'partido' | 'combate' | 'carrera' ...
   ========================================================== */
(function () {
  'use strict';
  var T = {
    futbol: {
      athletes: 'jugadores', player: 'jugador', coach: 'Míster', squad: 'plantilla', lastMin: 'en los últimos minutos', roster: 'del equipo',
      name: 'Fútbol', icon: '⚽',
      comp: 'partido', compUp: 'PARTIDO', compCap: 'Partido', compPl: 'partidos',
      preComp: 'Pre-Partido', venue: 'campo', venueCap: 'Campo', fieldLabel: 'Pista / Campo', fieldShort: 'Campo',
      trainLoad: 'sprints repetidos', injury: 'isquios', nutriPre: 'Carga Glucógeno MD-1',
      micro: 'MD-3 · MD-2 · MD-1', teamSport: true,
      week: {
        field: ['Sesión de campo: Técnica & Transiciones', 'Sesión táctica MD-3: Presión y Finalización', 'Activación Pre-Partido & Balón Parado (MD-1)'],
        gym: ['Gimnasio: Fuerza Explosiva & Prevención Isquios (45m)', 'Gimnasio Reactivo + Sesión de Campo MD-2']
      }
    },
    baloncesto: {
      athletes: 'jugadores', player: 'jugador', coach: 'Míster', squad: 'plantilla', lastMin: 'en los últimos minutos', roster: 'del equipo',
      name: 'Baloncesto', icon: '🏀',
      comp: 'partido', compUp: 'PARTIDO', compCap: 'Partido', compPl: 'partidos',
      preComp: 'Pre-Partido', venue: 'pista', venueCap: 'Pista', fieldLabel: 'Pista / Cancha', fieldShort: 'Pista',
      trainLoad: 'saltos y cambios de ritmo', injury: 'tobillos y rodillas', nutriPre: 'Carga de carbohidratos pre-partido',
      micro: 'MD-3 · MD-2 · MD-1', teamSport: true,
      week: {
        field: ['Sesión de pista: Fundamentos & Transiciones', 'Sesión táctica: Pick & Roll y Ayudas', 'Activación Pre-Partido & Tiro (MD-1)'],
        gym: ['Gimnasio: Fuerza Explosiva & Prevención de Tobillo/Rodilla (45m)', 'Gimnasio Reactivo + Shooting Lab']
      }
    },
    padel: {
      athletes: 'jugadores', player: 'jugador', coach: 'Coach', squad: 'academia', lastMin: 'en los puntos decisivos', roster: 'del grupo',
      name: 'Pádel / Tenis', icon: '🎾',
      comp: 'partido de torneo', compUp: 'PARTIDO', compCap: 'Partido', compPl: 'partidos',
      preComp: 'Pre-Partido', venue: 'pista', venueCap: 'Pista', fieldLabel: 'Pista', fieldShort: 'Pista',
      trainLoad: 'desplazamientos y remates', injury: 'codo, hombro y muñeca', nutriPre: 'Hidratación y carbohidratos pre-partido',
      micro: 'D-3 · D-2 · D-1', teamSport: false,
      week: {
        field: ['Sesión de pista: Golpeo, Voleas & Bandeja', 'Sesión táctica: Subida en bloque y Globos', 'Activación Pre-Partido & Saque/Resto'],
        gym: ['Gimnasio: Fuerza Rotacional & Prevención de Hombro/Codo (45m)', 'Gimnasio Reactivo + Movilidad de Cadera']
      }
    },
    boxeo: {
      athletes: 'peleadores', player: 'peleador', coach: 'Coach', squad: 'equipo de esquina', lastMin: 'en los últimos asaltos', roster: 'del grupo',
      name: 'Boxeo / MMA', icon: '🥊',
      comp: 'combate', compUp: 'COMBATE', compCap: 'Combate', compPl: 'combates',
      preComp: 'Pre-Combate', venue: 'gimnasio', venueCap: 'Gimnasio', fieldLabel: 'Ring / Gimnasio', fieldShort: 'Ring',
      trainLoad: 'rounds de sparring', injury: 'manos, hombros y cuello', nutriPre: 'Control de peso y carga pre-combate',
      micro: 'Fight Camp S-4 · S-2 · Semana de combate', teamSport: false,
      week: {
        field: ['Sesión de ring: Técnica, Guardia & Combinaciones', 'Sparring controlado: Distancia y Contras', 'Activación Pre-Combate & Manoplas'],
        gym: ['Gimnasio: Fuerza Explosiva de Cadera & Cuello (45m)', 'Acondicionamiento: Intervalos y Saco']
      }
    },
    running: {
      athletes: 'corredores', player: 'corredor', coach: 'Coach', squad: 'grupo de entrenamiento', lastMin: 'en el último tramo', roster: 'del grupo',
      name: 'Running', icon: '🏃',
      comp: 'carrera', compUp: 'CARRERA', compCap: 'Carrera', compPl: 'carreras',
      preComp: 'Pre-Carrera', venue: 'pista / ruta', venueCap: 'Pista / Ruta', fieldLabel: 'Pista / Ruta', fieldShort: 'Pista',
      trainLoad: 'series y rodajes', injury: 'gemelos, periostio y tendón de Aquiles', nutriPre: 'Carga de carbohidratos pre-carrera',
      micro: 'Semana de carga · descarga · carrera', teamSport: false,
      week: {
        field: ['Series en pista: ritmo objetivo y recuperaciones', 'Tempo / umbral: bloque continuo a ritmo controlado', 'Activación Pre-Carrera: progresivos y técnica de zancada'],
        gym: ['Gimnasio: Fuerza de Pierna & Prevención de Gemelo/Aquiles (45m)', 'Fuerza reactiva + Core']
      }
    },
    otros: {
      athletes: 'deportistas', player: 'deportista', coach: 'Coach', squad: 'grupo', lastMin: 'en el tramo final', roster: 'del grupo',
      name: 'Otros Deportes', icon: '🏅',
      comp: 'competición', compUp: 'COMPETICIÓN', compCap: 'Competición', compPl: 'competiciones',
      preComp: 'Pre-Competición', venue: 'instalación', venueCap: 'Instalación', fieldLabel: 'Entreno específico', fieldShort: 'Entreno',
      trainLoad: 'cargas específicas de tu disciplina', injury: 'zonas de mayor sobrecarga de tu disciplina', nutriPre: 'Carga de energía pre-competición',
      micro: 'Microciclo de carga · descarga · competición', teamSport: false,
      week: {
        field: ['Sesión específica: técnica de tu disciplina', 'Sesión específica: trabajo de ritmo y estrategia', 'Activación Pre-Competición'],
        gym: ['Gimnasio: Fuerza General & Prevención (45m)', 'Acondicionamiento específico + Movilidad']
      }
    }
  };

  function key(raw) {
    var s = String(raw || '').toLowerCase();
    if (!s) return 'futbol';
    if (s.indexOf('running') > -1 || s.indexOf('atletismo') > -1 || s.indexOf('carrera') > -1) return 'running';
    if (s.indexOf('boxeo') > -1 || s.indexOf('mma') > -1 || s.indexOf('combate') > -1) return 'boxeo';
    if (s.indexOf('baloncesto') > -1 || s.indexOf('basket') > -1) return 'baloncesto';
    if (s.indexOf('pádel') > -1 || s.indexOf('padel') > -1 || s.indexOf('tenis') > -1) return 'padel';
    if (s.indexOf('otro') > -1) return 'otros';
    if (s.indexOf('fútbol') > -1 || s.indexOf('futbol') > -1 || s.indexOf('soccer') > -1 || s.indexOf('futsal') > -1) return 'futbol';
    return 'otros'; // deporte no catalogado: nunca asumir fútbol
  }
  function terms(raw) { return T[key(raw)]; }
  function current() {
    var s = ''; try { s = new URLSearchParams(location.search).get('sport') || localStorage.getItem('kinet_sport') || ''; } catch (e) {}
    return terms(s);
  }
  /* Deportes individuales: sustituye vocabulario de equipo (plantilla, partido, jugadores)
     por el del deporte, en textos visibles y en placeholders/títulos. Se re-aplica si la
     página repinta contenido. Uso: KinetSport.relabel(document.body, 'Running') */
  function relabel(root, raw) {
    var k = key(raw);
    if (k === 'futbol' || k === 'baloncesto') return;
    var V = T[k];
    var rules = [
      [/\bPlantilla ampliada\b/g, 'Grupo ampliado'],
      [/AUDITORÍA DE JUGADORES/g, 'AUDITORÍA DE ' + V.athletes.toUpperCase()],
      [/clips de partido/g, 'clips de ' + V.comp],
      [/\bPLANTILLA\b/g, 'GRUPO'], [/\bPlantilla\b/g, 'Grupo'], [/\bplantilla\b/g, 'grupo'],
      [/Cartel Oficial de Partido \(11 \/ Convocatoria\)/g, 'Cartel Oficial de ' + V.compCap],
      [/\bJugadas & Estrategias IA\b/g, 'Estrategias IA'],
      [/\bAsigna jugadores\b/g, 'Asigna ' + V.athletes],
      [/\bASIGNAR AL ONCE \/ EQUIPO\b/gi, 'Asignar a tu grupo'],
      [/\bAsignar al once \/ equipo\b/g, 'Asignar a tu grupo']
    ];
    function fix(str) {
      var out = str;
      for (var i = 0; i < rules.length; i++) out = out.replace(rules[i][0], rules[i][1]);
      return out;
    }
    function walk(node) {
      var w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
      var n, list = [];
      while ((n = w.nextNode())) {
        var p = n.parentElement;
        if (!p || /^(SCRIPT|STYLE|TEXTAREA|NOSCRIPT)$/.test(p.tagName)) continue;
        list.push(n);
      }
      list.forEach(function (t) { var v = fix(t.nodeValue); if (v !== t.nodeValue) t.nodeValue = v; });
      if (node.querySelectorAll) node.querySelectorAll('[placeholder],[title]').forEach(function (e) {
        ['placeholder', 'title'].forEach(function (a) {
          var v = e.getAttribute(a); if (v) { var nv = fix(v); if (nv !== v) e.setAttribute(a, nv); }
        });
      });
    }
    walk(root || document.body);
    if (window.MutationObserver && !window.__kinetRelabelObs) {
      var pending = false;
      window.__kinetRelabelObs = new MutationObserver(function () {
        if (pending) return; pending = true;
        (window.requestAnimationFrame || setTimeout)(function () { pending = false; try { walk(document.body); } catch (e) {} });
      });
      window.__kinetRelabelObs.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
  }
  window.KinetSport = { key: key, terms: terms, current: current, all: T, relabel: relabel };
})();
