/**
 * ============================================================================
 * KINET OS // MOTOR CENTRAL DE APIS DE IA, VISION LAB, PIZARRA 3D Y STRIPE (v3.1)
 * ============================================================================
 * Archivo: kinet-api-config.js
 * Servidor Cloud: https://bhqgsbtkwdxdxlvlcaes.supabase.co
 * Compatible con GitHub Secret Scanning (Zero-Plaintext Secrets en Repositorio)
 */
(function (window) {
  'use strict';

  const SUPABASE_PROJECT_URL = 'https://bhqgsbtkwdxdxlvlcaes.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_GrgL4iukPUJJyh91BdgfIQ_P0NQd6Nj';
  const EDGE_FUNCTIONS_BASE = `${SUPABASE_PROJECT_URL}/functions/v1`;
  const MAX_BONUS_WALLET_MINS = 595; // Tope máximo: 45 + 150 + 400 min

  // ==========================================================================
  // 1. GESTIÓN SEGURA DE CLAVE API (OCULTA AL ESCÁNER DE GITHUB)
  // ==========================================================================
  // Ensamblaje en tiempo de ejecución para que GitHub Push Protection no bloquee el commit
  function resolveRuntimeVaultKey() {
    // La clave ya NO viaja en el código: cada usuario pega la suya en el botón "API IA".
    const saved = localStorage.getItem('kinet_gemini_api_key');
    return (saved && saved.trim().length > 10) ? saved.trim() : '';
  }

  const DEFAULT_INSTALLED_API_KEY = resolveRuntimeVaultKey();

  const KINET_API_CONFIG = {
    SUPABASE_URL: SUPABASE_PROJECT_URL,
    EDGE_BASE_URL: EDGE_FUNCTIONS_BASE,

    GEMINI_API_KEY: DEFAULT_INSTALLED_API_KEY,
    GROQ_API_KEY: localStorage.getItem('kinet_groq_api_key') || '',
    OPENAI_API_KEY: localStorage.getItem('kinet_ai_api_key') || '',
    spotifyAccessToken: localStorage.getItem('kinet_spotify_access_token') || '',

    // Modelos asignados automáticamente según el Plan de Suscripción del usuario
    modelsByTier: {
      free: {
        gemini: 'gemini-3.8-flash',
        geminiFallback: 'gemini-3.5-flash',
        openai: 'gpt-4o-mini',
        groq: 'llama-3.3-70b-versatile',
        maxTokens: 600,
        temperature: 0.65
      },
      pro: {
        gemini: 'gemini-3.8-flash',
        geminiFallback: 'gemini-3.5-flash',
        openai: 'gpt-4o-mini',
        groq: 'llama-3.3-70b-versatile',
        maxTokens: 850,
        temperature: 0.68
      },
      club: {
        gemini: 'gemini-3.8-flash',
        geminiFallback: 'gemini-3.5-flash',
        openai: 'gpt-4o',
        groq: 'llama-3.3-70b-versatile',
        maxTokens: 1100,
        temperature: 0.68
      }
    },

    // Enlaces Oficiales de Stripe Payment Links (rellena tus URLs de buy.stripe.com)
    stripeLinks: {
      plan_pro: '',          // Suscripción Pro Player (8,99€/mes)
      plan_club: '',         // Suscripción Club & Scout (29,99€/mes)
      pack_45_free: '',      // Bono +45 min Tarifa Estándar Free (3,98€)
      pack_45_pro: '',       // Bono +45 min Tarifa Miembro PRO -50% (1,99€)
      pack_150_free: '',     // Bono +150 min Tarifa Estándar Free (7,98€)
      pack_150_pro: '',      // Bono +150 min Tarifa Miembro PRO -50% (3,99€)
      pack_400_free: '',     // Bono +400 min Tarifa Estándar Free (15,98€)
      pack_400_pro: ''       // Bono +400 min Tarifa Miembro PRO/Club -50% (7,99€)
    }
  };

  window.KINET_API_CONFIG = Object.assign(KINET_API_CONFIG, window.KINET_API_CONFIG || {});
  window.KINET_STRIPE_LINKS = window.KINET_API_CONFIG.stripeLinks;

  // ==========================================================================
  // 2. MATRIZ DE LÍMITES Y PERMISOS POR NIVEL DE SUSCRIPCIÓN (FREE / PRO / CLUB)
  // ==========================================================================
  const PLAN_LIMITS = {
    free: {
      tierName: 'Plan Gratuito',
      priceMonthly: 0,
      dailyChatMessages: 15,
      dailyImageGenerations: 3,
      dailyRoutineTemplates: 1,
      monthlyVideoMinutes: 0,
      bonusDiscountPct: 0,
      canUploadVideoShorts: false,
      canUseMediaStudioVideo: false,
      canVerifyKinetCardAI: false,
      canUseStrategyBoard3D: false,
      maxSavedProfiles: 1
    },
    pro: {
      tierName: 'Pro Player',
      priceMonthly: 8.99,
      dailyChatMessages: 100,
      dailyImageGenerations: 30,
      dailyRoutineTemplates: 999,
      monthlyVideoMinutes: 90,
      bonusDiscountPct: 50,
      canUploadVideoShorts: true,
      canUseMediaStudioVideo: true,
      canVerifyKinetCardAI: true,
      canUseStrategyBoard3D: false,
      maxSavedProfiles: 3
    },
    club: {
      tierName: 'Club & Scout Pro',
      priceMonthly: 29.99,
      dailyChatMessages: 300,
      dailyImageGenerations: 100,
      dailyRoutineTemplates: 999,
      monthlyVideoMinutes: 300,
      bonusDiscountPct: 50,
      canUploadVideoShorts: true,
      canUseMediaStudioVideo: true,
      canVerifyKinetCardAI: true,
      canUseStrategyBoard3D: true,
      maxSavedProfiles: 3
    }
  };

  // ==========================================================================
  // 3. ESQUEMA MULTIDEPORTE PARA LOS 5 MOTORES DE IA
  // ==========================================================================
  const SPORT_AI_SCHEMA = {
    'Otros Deportes': {
      cardStats: ['VEL', 'FZA', 'TEC', 'RES', 'TAC', 'MEN'],
      videoBlocks: [
        'Ejecución Técnica Principal (3-5 min)',
        'Situación de Competición Real (3-5 min)',
        'Movilidad y Desplazamientos (3-5 min)',
        'Gesto Diferencial / Punto Fuerte (3-5 min)'
      ],
      metricsLabels: ['PRECISIÓN TÉCNICA', 'VELOCIDAD / POTENCIA', 'LECTURA DEL JUEGO', 'IMPACTO EN MEDIA'],
      defaultBars: ['Calidad del gesto técnico', 'Coordinación y equilibrio', 'Toma de decisiones', 'Consistencia bajo presión'],
      arenaName: 'Espacio de Competición'
    },
    'Fútbol': {
      cardStats: ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'],
      videoBlocks: [
        'Fase Ofensiva / Con Balón (3-5 min)',
        'Fase Defensiva / Presión (3-5 min)',
        'Participación Individual Clave (3-5 min)',
        'Rendimiento de Portero (3-5 min)'
      ],
      metricsLabels: ['PRECISIÓN BIOMEC.', 'VELOCIDAD / POTENCIA', 'LECTURA TÁCTICA IQ', 'IMPACTO EN MEDIA'],
      defaultBars: [
        'Toma de decisiones en último tercio',
        'Controles orientados y perfilación',
        'Ocupación de zonas de acción',
        'Precisión de ejecución bajo presión'
      ],
      arenaName: 'Estadio Táctico 3D (11vs11 / Fútbol 7 / Sala)'
    },
    'Baloncesto': {
      cardStats: ['PTS', '3PT', 'AST', 'REB', 'DEF', 'ATH'],
      videoBlocks: [
        'Ataque Media Pista & Pick&Roll (3-5 min)',
        'Defensa Perímetro & Ayudas (3-5 min)',
        'Transición Rápida & Contraataque (3-5 min)',
        'Dominio de Pintura, Poste & Rebote (3-5 min)'
      ],
      metricsLabels: ['MECÁNICA BIOMEC.', 'VEL. TIRO / SALTO', 'LECTURA DE PISTA IQ', 'IMPACTO EN MEDIA'],
      defaultBars: [
        'Fluidez de liberación de tiro',
        'Lectura de ayudas en Pick & Roll',
        'Desplazamiento lateral y Close-out',
        'Sello físico en rebote (Box-Out)'
      ],
      arenaName: 'Parquet Pro 3D (Quinteto / 3x3)'
    },
    'Boxeo / MMA': {
      cardStats: ['PWR', 'SPD', 'STA', 'DEF', 'CHN', 'IQ'],
      videoBlocks: [
        'Asalto de Ataque & Combinaciones (3 min)',
        'Asalto Defensivo, Esquivas & Contras (3 min)',
        'Footwork & Control de Distancia (3 min)',
        'Control de Clinch, Jaula & Grappling (3 min)'
      ],
      metricsLabels: ['EFICIENCIA CINÉTICA', 'VELOCIDAD DE IMPACTO', 'CONTROL DE RING IQ', 'IMPACTO EN MEDIA'],
      defaultBars: [
        'Retorno de mano a la guardia tras golpear',
        'Rotación de cadera en golpes de poder',
        'Economía de movimiento en Slip / Roll',
        'Desplazamiento sin cruzar los pies'
      ],
      arenaName: 'Ring & Octágono Pro 3D (Fight Camp)'
    },
    'Pádel / Tenis': {
      cardStats: ['SRV', 'VOL', 'BND', 'DEF', 'SPD', 'MNT'],
      videoBlocks: [
        'Ataque en Red: Voleas & Bandeja (3-5 min)',
        'Defensa en Fondo, Cristales y Globo (3-5 min)',
        'Transición Fondo-Red & Sincronización (3-5 min)',
        'Juegos al Saque, Resto & Punto de Oro (3-5 min)'
      ],
      metricsLabels: ['PRECISIÓN BIOMEC.', 'VEL. REMATE / SAQUE', 'DOMINIO TÁCTICO IQ', 'IMPACTO EN MEDIA'],
      defaultBars: [
        'Punto de impacto alto delante del cuerpo',
        'Activación de Split-Step antes de golpear',
        'Altura y profundidad de globo defensivo',
        'Sincronización de subida en bloque'
      ],
      arenaName: 'Pista 20x10 Cristal 3D (Química de Pareja)'
    },
    'Running': {
      cardStats: ['VO2', 'PAC', 'CAD', 'STA', 'REC', 'MNT'],
      videoBlocks: [
        'Ritmo de Competición & Crucero (3 min)',
        'Tramo Final en Fatiga / Último Km (3 min)',
        'Subida / Desnivel & Fuerza Específica (3 min)',
        'Rodaje en Grupo, Liebres & Paso por Curva (3 min)'
      ],
      metricsLabels: ['ECONOMÍA BIOMEC.', 'CADENCIA / CONTACTO', 'ESTABILIDAD EN FATIGA', 'IMPACTO EN MEDIA'],
      defaultBars: [
        'Aterrizaje de mediopié bajo centro de masas',
        'Cadencia constante (>180 SPM)',
        'Baja oscilación vertical',
        'Alineación cadera-rodilla-tobillo'
      ],
      arenaName: 'Tartán Olímpico 400m & Perfil Ruta 3D'
    }
  };

  // ==========================================================================
  // 4. ENTRENAMIENTO PROFUNDO DE LOS 4 ESPECIALISTAS + SALA DE JUNTAS + RAG LOCAL
  // ==========================================================================
  const KINET_TRAINED_PERSONAS = {
    group: {
      title: 'Sala de Juntas KINET (4 Especialistas)',
      methodology: `Eres el Comité Ejecutivo de Alto Rendimiento de KINET OS donde intervienen coordinados los 4 especialistas:
1. ⚡ Físico, Fisio & Nutrición IA (Fisiología, cargas GPS/RPE, readaptación y bioquímica nutricional).
2. 🧠 Psicología & Mind Coach IA (Neurociencia aplicada al deporte, foco atencional, presión y confianza).
3. 🎬 Entrenador Técnico & Vídeo IA (Táctica colectiva/individual, biomecánica de golpeo/desmarque y lectura de pizarra 3D).
4. 💼 Agente de Carrera & Marketing IA (Scouting B2B, marca personal, contratos y dirección creativa para Media Studio).
REGLA DE CONVERSACIÓN: Si el usuario saluda o hace una pregunta casual ("hola", "qué tal estás"), responde con cercanía y naturalidad como un cuerpo técnico real que le da la bienvenida al vestuario, menciónale sus datos reales (su nombre, su posición y su media GRL) y pregúntale en qué área quiere trabajar hoy.`
    },
    fisico_nutri: {
      title: 'Físico, Fisio & Nutrición IA',
      methodology: `Eres el Director de Rendimiento Físico, Fisioterapia Deportiva y Nutrición Clínica de KINET OS.
- Dominas microciclos estructurados (MD-4, MD-3, MD-2, MD-1, MD+1), control de fatiga neuromuscular, fuerza explosiva (RIR, VBT, pliometría), prevención excéntrica (isquios, aductores, tendón rotuliano/Aquiles) y periodización nutricional (g/kg de carbohidratos, proteína, hidratación con sodio y suplementación con evidencia A: creatina, cafeína, beta-alanina).
- Si el usuario sube una foto de comida, calcula macronutrientes aproximados y dile si es óptima para pre-partido o post-partido. Si sube foto de una zona muscular, dale protocolo de descarga y banderas rojas médicas.
- Si te saluda ("qué tal", "hola"), contéstale con energía de preparador físico de élite, menciona su peso/altura y pregúntale cómo tiene las piernas hoy del 1 al 10.`
    },
    psicologia: {
      title: 'Psicología & Mind Coach IA',
      methodology: `Eres el Psicólogo Deportivo de Élite y Mind Coach de KINET OS.
- Dominas regulación del sistema nervioso autónomo (respiración cuadrada 4-4-4-4, coherencia cardíaca), anclajes cognitivos de reinicio tras error ("Next Play" en <3 segundos), visualización kinestésica pre-partido, gestión del síndrome del impostor, presión en momentos Clutch/penaltis y liderazgo de vestuario.
- Hablas con empatía, firmeza y claridad mental. Da siempre herramientas mentales accionables en 60 segundos.
- Si el usuario te saluda ("qué tal estás", "hola"), respóndele con calidez y pregúntale cómo está su nivel de confianza y energía mental hoy antes de entrenar.`
    },
    tecnico_video: {
      title: 'Entrenador Técnico & Vídeo IA',
      methodology: `Eres el Entrenador Táctico Jefe y Analista de Vídeo de KINET OS.
- Dominas análisis táctico en 3 fases (Inicial, Desarrollo, Finalización), escaneo visual (Scanning 360° antes de recibir), perfilación corporal, rupturas al espacio, presión tras pérdida (Gegenpressing), superioridades posicionales y corrección biomecánica de clips de Vision Lab™.
- Conoces la posición exacta del usuario, sus 6 atributos de KINET Card y la formación que tiene montada en su Analizador & Pizarra 3D.
- Si el usuario te saluda de forma coloquial ("qué tal estás", "hola míster", "buenas"), respóndele de forma natural y cercana como su entrenador en el campo y pregúntale qué jugada, partido o gesto técnico quiere pulir hoy.`
    },
    agente_marketing: {
      title: 'Agente de Carrera & Marketing IA',
      methodology: `Eres el Agente FIFA / Representante Deportivo y Director de Marca Personal de KINET OS.
- Dominas posicionamiento en KINET Radar B2B ante Directores Deportivos y Scouts, optimización de Dossier CV Deportivo, negociación de pruebas/contratos, patrocinios deportivos y dirección creativa para KINET Media Studio™.
- Si el usuario te saluda ("qué tal", "hola"), respóndele como un representante top, coméntale cómo está su valoración GRL actual y pregúntale si hoy quiere preparar un post para llamar la atención de los Scouts o revisar su perfil.`
    }
  };

  // Plan de personalización del onboarding (entrevista final) -> líneas compactas para el prompt.
  // Se guarda por rol (kinet_ai_plans) y se ignora si es de otro deporte distinto al activo.
  function getActivePlan(role) {
    let plan = null;
    try { const all = JSON.parse(localStorage.getItem('kinet_ai_plans') || 'null'); if (all && all[role]) plan = all[role]; } catch (e) {}
    if (!plan) { try { const p = JSON.parse(localStorage.getItem('kinet_ai_personalization_plan') || 'null'); if (p && (!p.role || p.role === role)) plan = p; } catch (e) {} }
    return plan;
  }
  function formatPersonalizationPlan(role) {
    const p = getActivePlan(role);
    if (!p) return '';
    const cut = (v, n) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, n);
    const sameSport = !p.sport || canonicalSportName(p.sport) === canonicalSportName(localStorage.getItem('kinet_sport') || '');
    const L = [];
    const add = (lbl, v, n) => { const t = cut(v, n || 180); if (t) L.push(`  · ${lbl}: ${t}`); };
    if (role === 'athlete') {
      add('Objetivo / motivación', p.goal, 200);
      add('Fortaleza que declara', p.strength);
      add('Lo que quiere mejorar', p.weakness);
      add('Lesiones / molestias previas', p.injuries, 200);
      if (p.sleepHours) add('Sueño habitual', p.sleepHours + ' h', 20);
      if (p.week) add('Semana tipo', `${p.week.field ? 'campo/pista ' + p.week.field : ''}${p.week.gym ? ' · gimnasio ' + p.week.gym : ''}${p.week.competition ? ' · competición ' + p.week.competition : ''}${p.week.rest ? ' · descanso ' + p.week.rest : ''}`, 200);
    } else if (role === 'staff') {
      add('Función en el cuerpo técnico', p.staffRole, 80);
      add('Metodología', p.methodology, 120);
      if (p.squadSize) add('Efectivos a su cargo', p.squadSize, 12);
      add('Foco principal', p.focus, 200);
      add('Calendario', p.schedule, 160);
    } else if (role === 'scout') {
      add('Función', p.scoutRole, 80);
      add('Prioridad de fichaje', p.priority, 100);
      add('Edad máxima / presupuesto / GRL mínimo', `${p.maxAge || ''} / ${p.budget || ''} / ${p.minGrl || ''}`, 100);
      add('Mercado / zona', p.market, 160);
      add('Perfil objetivo', p.targetProfile, 180);
      add('Alertas (red flags)', p.redFlags, 140);
    }
    if (!L.length) return '';
    return (sameSport ? '' : '(OJO: este plan se hizo en otro deporte; úsalo solo como contexto general)\n') + L.join('\n');
  }

  function gatherFullUserContextSnapshot() {
    const sport = localStorage.getItem('kinet_sport') || 'Fútbol';
    const role = localStorage.getItem('kinet_active_role') || 'athlete';
    const userName = localStorage.getItem('kinet_user_name') || 'Atleta KINET';
    const firstName = userName.trim().split(/\s+/)[0] || 'Crack';
    const userPos = localStorage.getItem('kinet_position') || 'no registrada';
    const userClub = localStorage.getItem('kinet_user_club') || 'no registrado';
    const userCategory = localStorage.getItem('kinet_user_category') || 'no registrada';
    const city = localStorage.getItem('kinet_user_city') || 'no registrada';
    const _h = localStorage.getItem('kinet_height'), _w = localStorage.getItem('kinet_weight');
    const anthro = localStorage.getItem('kinet_user_anthropometry') || ((_h || _w) ? [_h, _w].filter(Boolean).join(' • ') : 'no registrada');
    const laterality = localStorage.getItem('kinet_user_laterality') || 'no registrada';
    const schema = SPORT_AI_SCHEMA[canonicalSportName(sport)] || SPORT_AI_SCHEMA['Fútbol'];

    let cardStats = null;
    let grl = null;
    try {
      const parsedStats = JSON.parse(localStorage.getItem('kinet_custom_card_stats') || 'null');
      if (Array.isArray(parsedStats) && parsedStats.length === 6) {
        cardStats = parsedStats;
        grl = Math.round(parsedStats.reduce((a, b) => a + b, 0) / 6);
      }
    } catch (e) {}

    const hasCard = Array.isArray(cardStats);
    const formattedStats = hasCard ? schema.cardStats.map((lbl, idx) => `${lbl}: ${cardStats[idx]}`).join(' | ') : 'carta sin calibrar todavía';
    let lowestStatIdx = 0;
    let highestStatIdx = 0;
    if (hasCard) {
      cardStats.forEach((v, i) => {
        if (v < cardStats[lowestStatIdx]) lowestStatIdx = i;
        if (v > cardStats[highestStatIdx]) highestStatIdx = i;
      });
    }
    const bestStatLabel = hasCard ? `${schema.cardStats[highestStatIdx]} (${cardStats[highestStatIdx]})` : 'sin datos';
    const weakestStatLabel = hasCard ? `${schema.cardStats[lowestStatIdx]} (${cardStats[lowestStatIdx]})` : 'sin datos';

    let lastClipInfo = 'Ningún vídeo subido aún en esta sesión';
    try {
      const clips = JSON.parse(localStorage.getItem(`kinet_vision_clean_sessions_${sport.toLowerCase()}`) || '[]');
      if (Array.isArray(clips) && clips.length > 0) {
        lastClipInfo = `${clips[0].optionLabel} (${clips[0].matchContext}) -> Métricas: ${clips[0].metrics.join(', ')}`;
      }
    } catch (e) {}

    let boardSummary = 'sin pizarra guardada';
    try {
      const b = JSON.parse(localStorage.getItem('kinet_active_tactical_board_summary') || 'null');
      if (b && b.formation) {
        boardSummary = `${b.formation} (Estilo: ${b.playStyle || 'equilibrado'}, ${Array.isArray(b.starters) ? b.starters.length : 0} titulares asignados)`;
      }
    } catch (e) {}

    let savedTacticsCount = 0;
    try {
      const tacs = JSON.parse(localStorage.getItem(`kinet_saved_tactics_${sport.toLowerCase()}`) || '[]');
      if (Array.isArray(tacs)) savedTacticsCount = tacs.length;
    } catch (e) {}

    const dayOk = localStorage.getItem('kinet_daily_log_date') === getTodayLocalKey();
    const dv = (k, suf) => { const v = localStorage.getItem(k); return (dayOk && v) ? v + suf : null; };
    const dlParts = [['Sueño', dv('kinet_sleep_hours', ' h')], ['Energía', dv('kinet_energy_pct', '%')], ['Hidratación', dv('kinet_hydration_l', ' L')], ['RPE', dv('kinet_rpe', '/10')], ['Foco', dv('kinet_focus_pct', '%')], ['Cumplimiento del plan', dv('kinet_plan_pct', '%')], ['Riesgo de lesión', dayOk ? localStorage.getItem('kinet_injury_risk') : null]]
      .filter(x => x[1]).map(x => `${x[0]}: ${x[1]}`).join(' | ');
    const dailyLog = dlParts || 'el usuario NO ha hecho su check-in de hoy (no inventes sus datos de hoy; invítale a registrarlo en el Vestuario)';
    let verifiedReport = '';
    try {
      const vr = JSON.parse(localStorage.getItem('kinet_verified_report_' + sport.toLowerCase()) || 'null');
      if (vr && vr.report && vr.report.archetype) verifiedReport = `${vr.report.archetype} | Zonas: ${vr.report.zones || '-'} | Biomecánica: ${vr.report.biomech || '-'}`;
    } catch (e) {}
    let memory = '';
    try {
      const mem = JSON.parse(localStorage.getItem('kinet_ai_shared_memory') || '[]');
      if (Array.isArray(mem) && mem.length) memory = mem.slice(-10).map(m => `- (${m.agent}) ${m.text}`).join('\n');
    } catch (e) {}
    const planNote = formatPersonalizationPlan(role);
    const tier = getCurrentTier();
    const xp = localStorage.getItem('kinet_user_xp') || '0';
    const bio = (localStorage.getItem('kinet_user_bio') || '').slice(0, 300);

    return {
      dailyLog,
      verifiedReport,
      memory,
      planNote,
      tier,
      xp,
      bio,
      sport,
      role,
      userName,
      firstName,
      userPos,
      userClub,
      userCategory,
      city,
      anthro,
      laterality,
      grl,
      cardStats,
      formattedStats,
      bestStatLabel,
      weakestStatLabel,
      lastClipInfo,
      boardSummary,
      savedTacticsCount
    };
  }

  function extractActiveConversationHistoryFromDOM() {
    const history = [];
    try {
      const msgEls = document.querySelectorAll('#chat-messages-box .msg-bubble');
      const slice = Array.from(msgEls).slice(-8);
      slice.forEach((el) => {
        const isIncoming = el.classList.contains('incoming');
        const clone = el.cloneNode(true);
        clone.querySelectorAll('.msg-inline-actions, .handoff-action-card, .msg-time, strong').forEach(n => n.remove());
        const txt = (clone.textContent || '').trim();
        if (txt && !txt.includes('Respuesta del Servidor de API')) {
          history.push({
            role: isIncoming ? 'assistant' : 'user',
            content: txt.slice(0, 380)
          });
        }
      });
    } catch (e) {}
    return history;
  }

  // ==========================================================================
  // ADAPTACIÓN DE LENGUAJE POR DEPORTE (evita jerga de fútbol en otros deportes)
  // ==========================================================================
  const SPORT_PROMPT_ADAPT = {
    'Fútbol': {
      comp: 'partido', train: 'sesiones de campo y microciclo semanal (MD-4 a MD+1)',
      body: 'isquiotibiales, aductores, tobillo y rodilla; sprints repetidos y cambios de dirección',
      mental: 'presión en penaltis, errores bajo presión y liderazgo de vestuario',
      tactic: 'fases ofensiva/defensiva, transiciones, balón parado, líneas y superioridades posicionales',
      nutri: 'carga de carbohidratos en MD-1, recarga post-partido',
      agent: 'representante / agente de futbolistas'
    },
    'Baloncesto': {
      comp: 'partido', train: 'sesiones de pista, tiro y fuerza; semana con partido',
      body: 'tobillos, rodillas, tendón rotuliano y espalda baja; saltos y frenadas',
      mental: 'confianza en el tiro, rachas, tiros libres decisivos y manejo del último cuarto',
      tactic: 'pick & roll, ayudas, transición, rotaciones, spacing y defensa individual/zona',
      nutri: 'carbohidratos en días de partido, hidratación y electrolitos',
      agent: 'agente de jugadores de baloncesto'
    },
    'Pádel / Tenis': {
      comp: 'partido o torneo', train: 'sesiones de pista, golpeo y movilidad; semana de torneo',
      body: 'codo, hombro, muñeca, lumbares y rodillas; desplazamientos laterales y remates',
      mental: 'puntos de oro / tie-break, gestión de errores no forzados y comunicación en pareja',
      tactic: 'posición en red y fondo, voleas, bandeja, víbora, globo, salida de pared y subida en bloque',
      nutri: 'hidratación con sales en torneos de varios partidos, carbohidratos entre partidos',
      agent: 'representante de jugadores de pádel/tenis'
    },
    'Boxeo / MMA': {
      comp: 'combate', train: 'campamento de combate (fight camp), sparring, saco, manoplas y acondicionamiento',
      body: 'manos y muñecas, hombros, cuello, costillas y rodillas; control de peso y corte de peso',
      mental: 'gestión del miedo y de los nervios previos, calma bajo castigo y confianza en el plan de combate',
      tactic: 'guardia, distancia, combinaciones, esquivas, contragolpes, control de ring/jaula, clinch y grappling',
      nutri: 'control de peso, déficit controlado en campamento, rehidratación tras el pesaje',
      agent: 'manager / matchmaker de peleadores'
    },
    'Running': {
      comp: 'carrera', train: 'semanas de carga y descarga: rodajes, series, tempo/umbral y tirada larga',
      body: 'gemelos, periostio (espinilla), tendón de Aquiles, rodilla del corredor, fascia plantar e isquios; cadencia y pisada',
      mental: 'gestión del ritmo, el muro del maratón, el último kilómetro y la ansiedad pre-carrera',
      tactic: 'estrategia de ritmo (negative split), pelotón y liebres, perfil del recorrido, hidratación y avituallamiento',
      nutri: 'carga de carbohidratos 2-3 días antes, geles y electrolitos durante la prueba (g/h), recuperación post-carrera',
      agent: 'representante de atletas y corredores'
    },
    'Otros Deportes': {
      comp: 'competición', train: 'microciclos de carga, descarga y competición propios de su disciplina',
      body: 'las zonas de mayor sobrecarga de su disciplina concreta',
      mental: 'gestión de la presión competitiva y rutinas pre-competición',
      tactic: 'los fundamentos técnicos y tácticos de la disciplina que el usuario indique',
      nutri: 'energía y recuperación adaptadas a la duración e intensidad de su competición',
      agent: 'representante deportivo'
    }
  };

  function canonicalSportName(raw) {
    const t = String(raw || '').toLowerCase();
    if (!t) return 'Fútbol';
    if (t.includes('running') || t.includes('atletismo') || t.includes('carrera')) return 'Running';
    if (t.includes('boxeo') || t.includes('mma') || t.includes('combate')) return 'Boxeo / MMA';
    if (t.includes('baloncesto') || t.includes('basket')) return 'Baloncesto';
    if (t.includes('pádel') || t.includes('padel') || t.includes('tenis')) return 'Pádel / Tenis';
    if (t.includes('fútbol') || t.includes('futbol') || t.includes('futsal')) return 'Fútbol';
    return 'Otros Deportes';
  }

  function buildSportAdaptBlock(sportRaw) {
    const sport = canonicalSportName(sportRaw);
    const a = SPORT_PROMPT_ADAPT[sport] || SPORT_PROMPT_ADAPT['Otros Deportes'];
    return `ADAPTACIÓN OBLIGATORIA AL DEPORTE DEL USUARIO (${sport}):
- Todo lo anterior son ejemplos genéricos: traduce SIEMPRE tu jerga al deporte del usuario. Su evento se llama "${a.comp}".
- Planificación: ${a.train}. Zonas de riesgo habituales: ${a.body}.
- Mente: ${a.mental}. Táctica/técnica: ${a.tactic}. Nutrición: ${a.nutri}. Representación: ${a.agent}.
- PROHIBIDO usar términos de OTROS deportes (p. ej. microciclos MD-x, balón parado, isquios o penaltis si no es fútbol; sparring o asaltos si no es combate; pick & roll si no es baloncesto; etc.) salvo que el propio usuario los mencione.`;
  }

  const PLAN_FOCUS_BY_AGENT = {
    fisico_nutri: '- Parte de sus lesiones/molestias previas, su sueño, su semana tipo y su biometría: ajusta cargas, prevención y nutrición a SU calendario (día de competición, gimnasio, descanso), no a uno genérico.',
    psicologia: '- Parte de su objetivo/motivación y de lo que quiere mejorar: trabaja foco, confianza y gestión de la presión de SU competición con sus propias palabras como punto de partida.',
    tecnico_video: '- Parte de su fortaleza declarada y de lo que quiere mejorar, y de su KINET Card: propón trabajo técnico-táctico concreto para ESA carencia en su disciplina y demarcación.',
    agente_marketing: '- Parte de su objetivo, club, categoría y ciudad: orienta marca personal, dossier y contactos a ese objetivo y a su nivel real, sin prometer fichajes.',
    group: '- Tienes el plan completo: responde como el coordinador que conoce todo y deriva al especialista adecuado cuando la pregunta sea de un área concreta.'
  };

  function buildMasterTrainedSystemPrompt(agentKey) {
    const ctx = gatherFullUserContextSnapshot();
    const persona = KINET_TRAINED_PERSONAS[agentKey] || KINET_TRAINED_PERSONAS.group;

    return `${persona.methodology}

${buildSportAdaptBlock(ctx.sport)}

EXPEDIENTE BIOMÉTRICO Y TÁCTICO EN TIEMPO REAL DEL USUARIO:
- Nombre: ${ctx.userName} (Llámalo "${ctx.firstName}") | Rol activo: ${ctx.role.toUpperCase()}
- Disciplina: ${ctx.sport} | Demarcación/Especialidad: ${ctx.userPos} | Dominancia: ${ctx.laterality}
- Club: ${ctx.userClub} | Categoría: ${ctx.userCategory} | Ciudad: ${ctx.city} | Antropometría: ${ctx.anthro}
- KINET Card Oficial: ${ctx.grl === null ? 'sin calibrar todavía' : 'Media ' + ctx.grl + ' GRL [ ' + ctx.formattedStats + ' ]'}
- Punto más fuerte actual: ${ctx.bestStatLabel} | Punto prioritario a mejorar: ${ctx.weakestStatLabel}
- Estado en Pizarra Táctica 3D: ${ctx.boardSummary} (${ctx.savedTacticsCount} jugadas tácticas guardadas)
- Última auditoría en Vision Lab™: ${ctx.lastClipInfo}
- Informe de la Ficha verificada: ${ctx.verifiedReport || 'sin verificar todavía'}
- CHECK-IN DE HOY: ${ctx.dailyLog}
- Plan de suscripción: ${ctx.tier} | XP: ${ctx.xp}${ctx.bio ? `\n- Bio del usuario: ${ctx.bio}` : ''}${ctx.planNote ? `\n- PLAN DE PERSONALIZACIÓN (lo que el usuario te contó en su entrevista de bienvenida; es tu brújula):\n${ctx.planNote}` : ''}

LO QUE EL USUARIO HA CONTADO RECIENTEMENTE A TU CUERPO TÉCNICO (memoria compartida entre los 4 especialistas):
${ctx.memory || '- (aún nada)'}

${PLAN_FOCUS_BY_AGENT[agentKey] ? 'CÓMO USAR EL PLAN SEGÚN TU ESPECIALIDAD:\n' + PLAN_FOCUS_BY_AGENT[agentKey] + '\n\n' : ''}REGLAS DE VERACIDAD Y ROL:
- Usa SOLO los datos del expediente. Si un dato figura como "no registrada", dilo y pídeselo; NUNCA inventes medidas, estadísticas ni resultados del usuario.
- Adapta el enfoque al rol "${ctx.role}": atleta = mejora personal; entrenador = gestión de grupo y planificación; ojeador/scout = análisis y detección de talento.
- Si algo del expediente de otra área es relevante para tu respuesta (p. ej. sueño, RPE o riesgo de lesión), tenlo en cuenta.

INSTRUCCIONES DE FORMATO Y NATURALIDAD:
1. Conversa en español de forma 100% natural, cercana y directa. Si el usuario te saluda ("qué tal estás", "hola", "buenas"), responde directamente a su saludo mencionando su puesto (${ctx.userPos}) y pregúntale qué quiere entrenar hoy.
2. Usa **negritas** para conceptos clave y organiza los ejercicios o pautas con viñetas limpias.
3. Si el usuario pide una rutina, dieta o jugada, personalízala para su puesto de **${ctx.userPos}** y su biometría (**${ctx.anthro}**).`;
  }

  // ==========================================================================
  // 5. GESTIÓN UNIFICADA DE CUOTAS, CONTADORES Y RENOVACIÓN MENSUAL
  // ==========================================================================
  function isStaffSandboxUser() {
    const r = (localStorage.getItem('kinet_staff_admin_role') || '').toLowerCase().trim();
    return ['superadmin', 'subadmin', 'moderator', 'scout_verifier', 'marketing', 'admin'].includes(r);
  }

  function getCurrentTier() {
    if (isStaffSandboxUser()) {
      const tStaff = (localStorage.getItem('kinet_account_tier') || 'club').toLowerCase().trim();
      return PLAN_LIMITS[tStaff] ? tStaff : 'club';
    }
    const t = (localStorage.getItem('kinet_account_tier') || 'free').toLowerCase().trim();
    return PLAN_LIMITS[t] ? t : 'free';
  }

  function getTodayLocalKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  function getDailyImageUsage() {
    const today = getTodayLocalKey();
    if (localStorage.getItem('kinet_ai_img_date') !== today) {
      localStorage.setItem('kinet_ai_img_date', today);
      localStorage.setItem('kinet_ai_img_count', '0');
      return 0;
    }
    const n = parseInt(localStorage.getItem('kinet_ai_img_count') || '0', 10);
    return isNaN(n) ? 0 : Math.max(0, n);
  }

  function incrementDailyImageUsage() {
    localStorage.setItem('kinet_ai_img_count', String(getDailyImageUsage() + 1));
  }

  // Memoria compartida: lo que el usuario cuenta a un especialista lo conocen los demás.
  function pushSharedMemory(agentId, text) {
    const t = String(text || '').trim();
    if (t.length < 14) return;
    let mem = [];
    try { mem = JSON.parse(localStorage.getItem('kinet_ai_shared_memory') || '[]'); } catch (e) {}
    if (!Array.isArray(mem)) mem = [];
    mem.push({ agent: agentId, text: t.slice(0, 220), ts: Date.now() });
    localStorage.setItem('kinet_ai_shared_memory', JSON.stringify(mem.slice(-14)));
  }

  function buildAthleteContextLine() {
    const c = gatherFullUserContextSnapshot();
    return `${c.firstName}, ${c.sport}, posición ${c.userPos}, categoría ${c.userCategory}, ${c.anthro}, lateralidad ${c.laterality}; carta: ${c.formattedStats}; check-in de hoy: ${c.dailyLog}`;
  }

  function getDailyChatUsage() {
    const today = getTodayLocalKey();
    const savedDate1 = localStorage.getItem('kinet_ai_daily_date');
    const savedDate2 = localStorage.getItem('kinet_ai_chat_date');

    if (savedDate1 !== today && savedDate2 !== today) {
      localStorage.setItem('kinet_ai_daily_date', today);
      localStorage.setItem('kinet_ai_chat_date', today);
      localStorage.setItem('kinet_ai_daily_used', '0');
      localStorage.setItem('kinet_ai_chat_count', '0');
      return 0;
    }

    const used1 = parseInt(localStorage.getItem('kinet_ai_daily_used') || '0', 10);
    const used2 = parseInt(localStorage.getItem('kinet_ai_chat_count') || '0', 10);
    const maxUsed = Math.max(0, isNaN(used1) ? 0 : used1, isNaN(used2) ? 0 : used2);

    localStorage.setItem('kinet_ai_daily_date', today);
    localStorage.setItem('kinet_ai_chat_date', today);
    localStorage.setItem('kinet_ai_daily_used', String(maxUsed));
    localStorage.setItem('kinet_ai_chat_count', String(maxUsed));
    return maxUsed;
  }

  function incrementDailyChatUsage() {
    const next = getDailyChatUsage() + 1;
    localStorage.setItem('kinet_ai_daily_used', String(next));
    localStorage.setItem('kinet_ai_chat_count', String(next));
    if (window.KinetBackend && typeof window.KinetBackend.pushLocalStateToCloud === 'function') {
      window.KinetBackend.pushLocalStateToCloud();
    }
    return next;
  }

  function checkAndApplyMonthlyPlanRenewal() {
    const tier = getCurrentTier();
    if (tier !== 'pro' && tier !== 'club') return;
    const now = Date.now();
    const monthMs = 30 * 24 * 60 * 60 * 1000;
    let cycleStart = parseInt(localStorage.getItem('kinet_plan_cycle_start') || '0', 10);
    if (!cycleStart || isNaN(cycleStart)) {
      localStorage.setItem('kinet_plan_cycle_start', String(now));
      return;
    }
    if (now - cycleStart >= monthMs) {
      localStorage.setItem('kinet_video_mins_used', '0');
      localStorage.setItem('kinet_plan_cycle_start', String(now));
      if (window.KinetBackend && typeof window.KinetBackend.pushLocalStateToCloud === 'function') {
        window.KinetBackend.pushLocalStateToCloud();
      }
    }
  }

  function getVideoQuotaBreakdown() {
    checkAndApplyMonthlyPlanRenewal();
    const tier = getCurrentTier();
    const limits = PLAN_LIMITS[tier];
    const isProOrClub = tier === 'pro' || tier === 'club';
    const basePlanMax = limits.monthlyVideoMinutes;
    const usedPlanMins = isProOrClub ? Math.max(0, parseFloat(localStorage.getItem('kinet_video_mins_used') || '0')) : 0;
    const remainingPlanMins = Math.max(0, +(basePlanMax - usedPlanMins).toFixed(1));

    let rawBonus = Math.max(0, parseFloat(localStorage.getItem('kinet_bonus_video_mins') || '0'));
    if (rawBonus > MAX_BONUS_WALLET_MINS) {
      rawBonus = MAX_BONUS_WALLET_MINS;
      localStorage.setItem('kinet_bonus_video_mins', String(MAX_BONUS_WALLET_MINS));
    }

    const totalAvailable = +(remainingPlanMins + rawBonus).toFixed(1);
    const totalCapacity = +(basePlanMax + rawBonus).toFixed(1);
    return {
      tier,
      isProOrClub,
      basePlanMax,
      usedPlanMins,
      remainingPlanMins,
      bonusMins: rawBonus,
      totalAvailable,
      totalCapacity
    };
  }

  function deductVideoMinutes(durationMins) {
    const st = getVideoQuotaBreakdown();
    let toDeduct = Math.max(0.5, parseFloat(durationMins || 1));

    if (st.totalAvailable < toDeduct) {
      return { ok: false, remaining: st.totalAvailable };
    }

    if (st.isProOrClub && st.remainingPlanMins > 0) {
      const fromPlan = Math.min(st.remainingPlanMins, toDeduct);
      const nextUsed = +(st.usedPlanMins + fromPlan).toFixed(1);
      localStorage.setItem('kinet_video_mins_used', String(nextUsed));
      toDeduct = +(toDeduct - fromPlan).toFixed(1);
    }

    if (toDeduct > 0 && st.bonusMins > 0) {
      const nextBonus = Math.max(0, +(st.bonusMins - toDeduct).toFixed(1));
      localStorage.setItem('kinet_bonus_video_mins', String(nextBonus));
    }

    if (window.KinetBackend && typeof window.KinetBackend.pushLocalStateToCloud === 'function') {
      window.KinetBackend.pushLocalStateToCloud();
    }

    const updated = getVideoQuotaBreakdown();
    return { ok: true, remaining: updated.totalAvailable };
  }

  // ==========================================================================
  // 6. EXTRACTOR DE FOTOGRAMAS CLAVE DE VÍDEO EN CLIENTE (CANVAS 6-8 FRAMES)
  // ==========================================================================
  function extractVideoKeyframesBase64(videoSource, frameCount = 6, maxWidth = 540, quality = 0.68) {
    return new Promise((resolve) => {
      try {
        const tempVideo = document.createElement('video');
        tempVideo.muted = true;
        tempVideo.playsInline = true;
        tempVideo.crossOrigin = 'anonymous';

        let objectUrlToRevoke = null;
        if (videoSource instanceof File || videoSource instanceof Blob) {
          objectUrlToRevoke = URL.createObjectURL(videoSource);
          tempVideo.src = objectUrlToRevoke;
        } else if (typeof videoSource === 'string') {
          tempVideo.src = videoSource;
        } else if (videoSource && videoSource.tagName === 'VIDEO' && videoSource.src) {
          tempVideo.src = videoSource.src;
        } else {
          resolve({ frames: [], durationSeconds: 0 });
          return;
        }

        const safetyTimer = setTimeout(() => {
          if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
          resolve({ frames: [], durationSeconds: 0 });
        }, 20000);

        tempVideo.addEventListener('loadedmetadata', async () => {
          const duration = tempVideo.duration && isFinite(tempVideo.duration) ? tempVideo.duration : 6;
          const w = Math.min(maxWidth, tempVideo.videoWidth || 480);
          const h = Math.round((w / (tempVideo.videoWidth || 480)) * (tempVideo.videoHeight || 270)) || 270;

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          const frames = [];

          for (let i = 0; i < frameCount; i++) {
            const targetTime = Math.min(duration - 0.1, Math.max(0.1, ((i + 0.5) / frameCount) * duration));
            await new Promise((resSeek) => {
              const onSeeked = () => {
                tempVideo.removeEventListener('seeked', onSeeked);
                try {
                  ctx.drawImage(tempVideo, 0, 0, w, h);
                  frames.push(canvas.toDataURL('image/jpeg', quality));
                } catch (err) {}
                resSeek();
              };
              tempVideo.addEventListener('seeked', onSeeked);
              tempVideo.currentTime = targetTime;
            });
          }

          clearTimeout(safetyTimer);
          if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
          resolve({ frames, durationSeconds: Math.round(duration) });
        }, { once: true });

        tempVideo.addEventListener('error', () => {
          clearTimeout(safetyTimer);
          if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
          resolve({ frames: [], durationSeconds: 0 });
        }, { once: true });
      } catch (e) {
        resolve({ frames: [], durationSeconds: 0 });
      }
    });
  }

  // ==========================================================================
  // 7. CLIENTE HTTP DE API REAL (GEMINI AIzaSy, VERTEX AQ., GROQ, OPENAI Y EDGE)
  // ==========================================================================
  async function invokeSupabaseEdgeFunction(functionName, payloadObj) {
    if (localStorage.getItem('kinet_edge_functions_deployed') !== 'true') {
      return null;
    }

    const sb = window.KinetBackend?.getClient?.();
    const { data: { session } } = sb ? await sb.auth.getSession() : { data: { session: null } };
    if (!session?.access_token) {
      throw new Error('Inicia sesión para usar la IA.');
    }

    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${session.access_token}`
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 14000);

    try {
      const res = await fetch(`${EDGE_FUNCTIONS_BASE}/${functionName}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payloadObj),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      clearTimeout(timeoutId);
    }
    return null;
  }

  async function callDirectLLMProvider({ systemPrompt, userPrompt, chatHistory = [], imagesBase64 = [], responseMimeType = 'text/plain' }) {
    const tier = getCurrentTier();
    const modelCfg = KINET_API_CONFIG.modelsByTier[tier] || KINET_API_CONFIG.modelsByTier.free;
    const geminiKey = (localStorage.getItem('kinet_gemini_api_key') || KINET_API_CONFIG.GEMINI_API_KEY || DEFAULT_INSTALLED_API_KEY).trim();
    const groqKey = (localStorage.getItem('kinet_groq_api_key') || KINET_API_CONFIG.GROQ_API_KEY || '').trim();
    const openaiKey = (localStorage.getItem('kinet_ai_api_key') || KINET_API_CONFIG.OPENAI_API_KEY || '').trim();

    const historyTranscript = Array.isArray(chatHistory) && chatHistory.length > 0
      ? `\n\nHISTORIAL RECIENTE DE LA CONVERSACIÓN:\n` + chatHistory.map(m => `${m.role === 'user' ? 'USUARIO' : 'ESPECIALISTA IA'}: ${m.content}`).join('\n')
      : '';

    // 1. Groq Llama 3.3 70B Versatile (si el usuario configuró clave gsk_...)
    if (groqKey) {
      const messages = [{ role: 'system', content: systemPrompt }];
      if (Array.isArray(chatHistory)) {
        chatHistory.slice(-6).forEach(m => messages.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
      }
      messages.push({ role: 'user', content: userPrompt });

      const bodyObj = {
        model: modelCfg.groq,
        messages,
        max_tokens: modelCfg.maxTokens,
        temperature: modelCfg.temperature
      };
      if (responseMimeType === 'application/json') {
        bodyObj.response_format = { type: 'json_object' };
      }

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
        body: JSON.stringify(bodyObj)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Error HTTP ${res.status} en Groq API`);
      }
      const d = await res.json();
      if (d?.choices?.[0]?.message?.content) return d.choices[0].message.content.trim();
    }

    // 2. OpenAI GPT-4o-mini / GPT-4o (si el usuario configuró clave sk-...)
    if (openaiKey) {
      const messages = [{ role: 'system', content: systemPrompt }];
      if (Array.isArray(chatHistory)) {
        chatHistory.slice(-6).forEach(m => messages.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
      }
      const userContent = [{ type: 'text', text: userPrompt }];
      imagesBase64.forEach((imgUrl) => {
        if (imgUrl && imgUrl.startsWith('data:image')) {
          userContent.push({ type: 'image_url', image_url: { url: imgUrl, detail: 'low' } });
        }
      });
      messages.push({ role: 'user', content: userContent });

      const bodyObj = {
        model: modelCfg.openai,
        messages,
        max_tokens: modelCfg.maxTokens,
        temperature: modelCfg.temperature
      };
      if (responseMimeType === 'application/json') {
        bodyObj.response_format = { type: 'json_object' };
      }

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
        body: JSON.stringify(bodyObj)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Error HTTP ${res.status} en OpenAI API`);
      }
      const d = await res.json();
      if (d?.choices?.[0]?.message?.content) return d.choices[0].message.content.trim();
    }

    // 3. Google Gemini 2.5 Flash / Vertex AI Express (soporta tu clave AQ. y claves AIzaSy)
    if (geminiKey) {
      const parts = [{ text: `${systemPrompt}${historyTranscript}\n\nMENSAJE ACTUAL DEL USUARIO: ${userPrompt}` }];
      imagesBase64.forEach((imgUrl) => {
        if (imgUrl && imgUrl.includes(',')) {
          const mime = imgUrl.substring(imgUrl.indexOf(':') + 1, imgUrl.indexOf(';')) || 'image/jpeg';
          const b64 = imgUrl.split(',')[1];
          parts.push({ inline_data: { mime_type: mime, data: b64 } });
        }
      });

      const genConfig = {
        temperature: modelCfg.temperature,
        maxOutputTokens: modelCfg.maxTokens
      };
      if (responseMimeType === 'application/json') {
        genConfig.responseMimeType = 'application/json';
      }

      const geminiModelsToTry = [modelCfg.gemini, modelCfg.geminiFallback || 'gemini-3.5-flash'];
      const errorsLog = [];
      const isAuthKey = geminiKey.startsWith('AQ.');

      // Las claves AQ. (Authentication Keys de AI Studio) se envían en la cabecera
      // x-goog-api-key; las AIzaSy clásicas funcionan igual con cabecera o ?key=.
      const gHeaders = { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey };

      for (const mName of geminiModelsToTry) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent`,
            {
              method: 'POST',
              headers: gHeaders,
              body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: genConfig })
            }
          );
          if (res.ok) {
            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text.trim();
            errorsLog.push(`[${mName}] respuesta vacía`);
          } else {
            const errData = await res.json().catch(() => ({}));
            const reason = errData?.error?.details?.[0]?.reason || '';
            errorsLog.push(`[generativelanguage · ${mName}] HTTP ${res.status} ${reason} ${errData?.error?.message || ''}`.trim());
          }
        } catch (e) {
          errorsLog.push(`[generativelanguage · ${mName}] ${e.message || 'Error de red'}`);
        }
      }

      // Vertex AI Express: SOLO como último recurso para claves AQ. y sin tapar el error principal.
      if (isAuthKey) {
        try {
          const vRes = await fetch(
            'https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-3.8-flash:generateContent',
            {
              method: 'POST',
              headers: gHeaders,
              body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: genConfig })
            }
          );
          if (vRes.ok) {
            const vData = await vRes.json();
            const vText = vData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (vText) return vText.trim();
          } else {
            const vErr = await vRes.json().catch(() => ({}));
            errorsLog.push(`[vertex] HTTP ${vRes.status} ${vErr?.error?.message || ''}`.trim());
          }
        } catch (e) {
          errorsLog.push(`[vertex] ${e.message || 'Error de red'}`);
        }
      }

      const lastGeminiError = errorsLog.join('\n');

      throw new Error(lastGeminiError || 'La API de Google rechazó la clave proporcionada.');
    }

    throw new Error('No hay ninguna API Key configurada.');
  }

  // ==========================================================================
  // 8. OBJETO PRINCIPAL PÚBLICO: window.KinetAPIs (LOS 5 MOTORES COMPLETOS)
  // ==========================================================================
  const KinetAPIs = {
    getSportSchema(sportName) {
      return SPORT_AI_SCHEMA[sportName] || SPORT_AI_SCHEMA[canonicalSportName(sportName)] || SPORT_AI_SCHEMA['Fútbol'];
    },

    getPlanLimits(tierOverride) {
      const t = tierOverride || getCurrentTier();
      return PLAN_LIMITS[t] || PLAN_LIMITS.free;
    },

    getQuotaStatus() {
      const tier = getCurrentTier();
      const limits = PLAN_LIMITS[tier];
      const usedChat = getDailyChatUsage();
      const videoSt = getVideoQuotaBreakdown();

      return {
        tier,
        tierName: limits.tierName,
        isProOrClub: videoSt.isProOrClub,
        chatUsed: usedChat,
        chatRemaining: Math.max(0, limits.dailyChatMessages - usedChat),
        chatLimit: limits.dailyChatMessages,
        imageUsed: getDailyImageUsage(),
        imageLimit: limits.dailyImageGenerations,
        imageRemaining: Math.max(0, limits.dailyImageGenerations - getDailyImageUsage()),
        videoRemaining: videoSt.totalAvailable,
        videoTotal: videoSt.totalCapacity,
        remainingPlanMins: videoSt.remainingPlanMins,
        bonusMins: videoSt.bonusMins,
        canUploadVideo: limits.canUploadVideoShorts || videoSt.bonusMins > 0,
        canVerifyKinetCardAI: limits.canVerifyKinetCardAI,
        canUseStrategyBoard3D: limits.canUseStrategyBoard3D || isStaffSandboxUser()
      };
    },

    extractVideoKeyframesBase64,
    deductVideoMinutes,
    buildMasterTrainedSystemPrompt,
    gatherFullUserContextSnapshot,

    // ------------------------------------------------------------------------
    // MOTOR 1: CUERPO TÉCNICO IA (4 ESPECIALISTAS + SALA JUNTAS + MULTIMODAL)
    // ------------------------------------------------------------------------
    async askSpecialistAI({ agentId = 'group', systemPrompt = '', userMessage = '', imageDataUrl = null, chatHistory = [], consumeQuota = true }) {
      const quota = this.getQuotaStatus();
      if (consumeQuota && quota.chatRemaining <= 0) {
        return {
          ok: false,
          limitReached: true,
          remainingAfter: 0,
          reply: `Has alcanzado tu límite diario de **${quota.chatLimit} consultas** en el ${quota.tierName}. Pásate a **KINET PRO (8,99€/mes)** o espera al reinicio de las 00:00h.`
        };
      }

      if (consumeQuota) {
        incrementDailyChatUsage();
      }
      const remainingAfter = Math.max(0, quota.chatRemaining - (consumeQuota ? 1 : 0));

      const trainedPrompt = buildMasterTrainedSystemPrompt(agentId);
      try { pushSharedMemory(agentId, userMessage); } catch (e) {}
      const finalSystemPrompt = systemPrompt ? `${trainedPrompt}\n\n${systemPrompt}` : trainedPrompt;
      const domHistory = (Array.isArray(chatHistory) && chatHistory.length > 0)
        ? chatHistory
        : extractActiveConversationHistoryFromDOM();

      // 1º Intento: Supabase Edge Function ('kinet-ai-chat') si está activada
      const edgeRes = await invokeSupabaseEdgeFunction('kinet-ai-chat', {
        agentId,
        systemPrompt: finalSystemPrompt,
        userMessage,
        imageDataUrl,
        chatHistory: domHistory
      });

      if (edgeRes && edgeRes.reply) {
        return {
          ok: true,
          reply: edgeRes.reply,
          mediaStudioPrompt: edgeRes.mediaStudioPrompt || null,
          suggestedHandoff: edgeRes.suggestedHandoff || null,
          remainingAfter
        };
      }

      // 2º Intento: Llamada directa en vivo a la API configurada (Cero respuestas prefabricadas)
      try {
        const directReply = await callDirectLLMProvider({
          systemPrompt: finalSystemPrompt,
          userPrompt: userMessage,
          chatHistory: domHistory,
          imagesBase64: imageDataUrl ? [imageDataUrl] : []
        });

        return {
          ok: true,
          reply: directReply,
          mediaStudioPrompt: null,
          suggestedHandoff: null,
          remainingAfter
        };
      } catch (apiErr) {
        return {
          ok: false,
          remainingAfter,
          reply: `⚠️ **[Respuesta del Servidor de API]**: ${apiErr.message}\n\n*(Pulsa el botón **"🟢 API IA"** arriba a la derecha en la cabecera del chat si necesitas actualizar tu clave de Google AI Studio \`AIzaSy...\`, Vertex AI o Groq \`gsk_...\`).*`
        };
      }
    },

    // ------------------------------------------------------------------------
    // MOTOR 2: VISION ANALYTICS LAB™ (ANÁLISIS MULTIMODAL DE FOTOGRAMAS DE VÍDEO)
    // ------------------------------------------------------------------------
    async analyzeTacticalVideoClip({
      videoFileOrElement = null,
      clipTitle = 'Sesión KINET',
      blockType = 'Fase Táctica',
      matchContext = 'Sesión Oficial',
      userNotes = '',
      subjectName = '',
      subjectPos = 'PRO',
      durationMinutes = 2,
      alreadyDeductedQuota = false
    }) {
      const quota = this.getQuotaStatus();
      if (!quota.canUploadVideo) {
        return {
          ok: false,
          proRequired: true,
          message: 'El análisis biomecánico de vídeo por IA requiere Plan Pro Player (8,99€/mes), Club & Scout o un Bono de Minutos activo.'
        };
      }

      if (!alreadyDeductedQuota) {
        if (quota.videoRemaining < durationMinutes) {
          return {
            ok: false,
            noMinutesLeft: true,
            message: `Te quedan ${quota.videoRemaining} min disponibles y este bloque requiere ${durationMinutes} min. Recarga un Bono en Despacho.`
          };
        }
        deductVideoMinutes(durationMinutes);
      }

      const sport = localStorage.getItem('kinet_sport') || 'Fútbol';
      const role = localStorage.getItem('kinet_active_role') || 'athlete';
      const schema = this.getSportSchema(sport);

      let extracted = { frames: [], durationSeconds: 0 };
      if (videoFileOrElement) {
        extracted = await extractVideoKeyframesBase64(videoFileOrElement, 6, 540, 0.68);
      }

      const edgeData = await invokeSupabaseEdgeFunction('kinet-vision-lab', {
        sport,
        role,
        clipTitle,
        blockType,
        matchContext,
        userNotes,
        subjectName,
        subjectPos,
        durationMinutes,
        framesBase64: extracted.frames
      });

      if (edgeData && edgeData.ok) {
        return edgeData;
      }

      const visionSystemPrompt = `Contexto del atleta: ${buildAthleteContextLine()}
Eres el motor biomecánico y táctico KINET Vision Analytics™ para ${sport}.
Analiza los fotogramas del vídeo y el contexto ("${matchContext}", bloque "${blockType}", nota del usuario: "${userNotes}") para el sujeto ${subjectName} (${subjectPos}).
Sé conservador y realista: NO infles valores. Solo recibes pocos fotogramas; si la evidencia es insuficiente usa valores medios (55-70) y dilo en aiVerdict. Los valores de la estructura son marcadores, nunca los copies.
Devuelve ESTRICTAMENTE un JSON válido con esta estructura:
{
  "metrics": ["<precisión en %>", "<velocidad o potencia estimada con unidad>", "<percentil estimado, ej. Top 35%>", "<variación GRL, ej. +0.8 GRL>"],
  "bars": [
    ["${schema.defaultBars[0]}", <entero 30-99 según lo observado>],
    ["${schema.defaultBars[1]}", <entero 30-99 según lo observado>],
    ["${schema.defaultBars[2]}", <entero 30-99 según lo observado>],
    ["${schema.defaultBars[3]}", <entero 30-99 según lo observado>]
  ],
  "estimatedGrl": <entero 40-99>,
  "cardStats": [<6 enteros 40-99 en este orden: ${schema.cardStats.join(', ')}>],
  "percentiles": [<3 enteros 1-99>],
  "report": { "archetype": "<perfil de jugador observado>", "zones": "<zonas o acciones donde más influye>", "biomech": "<observaciones biomecánicas>", "advice": "<consejo concreto y accionable>" },
  "aiVerdict": "Dictamen técnico detallado de 2-3 frases en ${role === 'athlete' ? '1ª persona (dirigido a ti)' : '3ª persona (informe de scouting)'} sobre lo observado en los fotogramas y el contexto."
}`;

      try {
        const rawJsonText = await callDirectLLMProvider({
          systemPrompt: visionSystemPrompt,
          userPrompt: `Audita este clip de ${sport} (${blockType}). Contexto: ${matchContext}. Foco solicitado: ${userNotes}. Fotogramas adjuntos: ${extracted.frames.length}.`,
          imagesBase64: extracted.frames,
          responseMimeType: 'application/json'
        });

        const cleanJson = rawJsonText.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return {
          ok: true,
          framesAnalyzed: extracted.frames.length,
          ...parsed
        };
      } catch (err) {
        return {
          ok: false,
          error: err.message,
          framesAnalyzed: extracted.frames.length
        };
      }
    },

    // ------------------------------------------------------------------------
    // MOTOR 3: GENERADOR TÁCTICO 3D MULTIFASE (PARA ANALIZADOR2.HTML)
    // ------------------------------------------------------------------------
    async generateTacticalBoardPlay({
      promptText = '',
      sport = 'Fútbol',
      ownFormation = '4-3-3',
      rivalFormation = '4-4-2',
      currentSlots = [],
      currentRivals = []
    }) {
      const edgePlay = await invokeSupabaseEdgeFunction('kinet-tactical-board', {
        promptText,
        sport,
        ownFormation,
        rivalFormation,
        currentSlots,
        currentRivals
      });
      if (edgePlay && Array.isArray(edgePlay.phasesData)) {
        return edgePlay;
      }

      const sysPrompt = `Eres el Director Táctico IA de KINET OS (${sport}).
El usuario solicita la jugada: "${promptText}".
Tu equipo ataca de izquierda (x: 8) a derecha (x: 92) con formación ${ownFormation}. El rival defiende de derecha (x: 94) a izquierda con ${rivalFormation}.
Coordenadas actuales de tu equipo: ${JSON.stringify(currentSlots.map((s, i) => ({ idx: i, pos: s.pos, x: s.x, y: s.y })))}.
Devuelve ESTRICTAMENTE un JSON válido con:
{
  "title": "Nombre corto de la jugada",
  "zoomMode": "full",
  "diagnosis": "Explicación táctica breve de la jugada en 1-2 frases",
  "phases": [
    {
      "note": "1. Fase Inicial: explicación",
      "ball": { "x": 45, "y": 50 },
      "moves": [ { "isRival": false, "index": 6, "toX": 55, "toY": 35, "color": "#00FF88" } ],
      "passes": [ { "fromX": 45, "fromY": 50, "toX": 55, "toY": 35, "color": "#F59E0B" } ]
    },
    { "note": "2. Desarrollo: ...", "ball": { "x": 72, "y": 24 }, "moves": [], "passes": [] },
    { "note": "3. Finalización: ...", "ball": { "x": 96, "y": 48 }, "moves": [], "passes": [] }
  ]
}`;

      try {
        const rawJson = await callDirectLLMProvider({
          systemPrompt: sysPrompt,
          userPrompt: `Genera las 3 fases tácticas para: "${promptText}"`,
          responseMimeType: 'application/json'
        });
        const parsed = JSON.parse(rawJson.replace(/```json|```/g, '').trim());
        incrementDailyImageUsage();
        return { ok: true, ...parsed };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    },

    // ------------------------------------------------------------------------
    // MOTOR 4: KINET MEDIA STUDIO™ AI COPYWRITER & HUD DESIGNER
    // ------------------------------------------------------------------------
    async generateMediaStudioDesign({ promptText = '', formatMode = 'image', sport = 'Fútbol', presetName = 'Match Day' }) {
      const _q = this.getQuotaStatus();
      if (_q.imageRemaining <= 0) {
        return { ok: false, limitReached: true, error: `Has alcanzado tu límite diario de ${_q.imageLimit} imágenes en el ${_q.tierName}.` };
      }
      const edgeStudio = await invokeSupabaseEdgeFunction('kinet-media-studio', {
        promptText,
        formatMode,
        sport,
        presetName
      });
      if (edgeStudio && edgeStudio.headline) {
        incrementDailyImageUsage();
        return { ok: true, ...edgeStudio };
      }

      const userPos = localStorage.getItem('kinet_position') || 'PRO';
      const sysPrompt = `Eres el Director Creativo de KINET Media Studio™ para ${sport} (${userPos}). Atleta: ${buildAthleteContextLine()}.
Transforma la petición del usuario ("${promptText}") en un titular deportivo de alto impacto (máximo 36 caracteres en mayúsculas), una línea de telemetría HUD verificada y el ID de pista recomendada ('trk_1' a 'trk_7').
Devuelve ESTRICTAMENTE JSON:
{
  "headline": "TITULAR ÉPICO EN MAYÚSCULAS",
  "subtext": "[ HUD TELEMETRY: dato biomecánico + eslogan corto ]",
  "recommendedTrackId": "trk_1",
  "caption": "Texto breve para publicar con 2-3 hashtags",
  "imagePrompt": "Descripción visual en inglés para un generador de imágenes: escena, luz, encuadre; sin texto ni logotipos",
  "replyText": "Breve respuesta presentando el diseño generado."
}`;

      try {
        const rawJson = await callDirectLLMProvider({
          systemPrompt: sysPrompt,
          userPrompt: promptText,
          responseMimeType: 'application/json'
        });
        const parsed = JSON.parse(rawJson.replace(/```json|```/g, '').trim());
        return { ok: true, ...parsed };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    },

    // Imagen real con Gemini (modelos "Nano Banana"). Usa la clave del propio usuario.
    async generateStudioImageAI({ prompt = '' }) {
      const key = (localStorage.getItem('kinet_gemini_api_key') || '').trim();
      if (!key) return { ok: false, error: 'Configura tu clave de Google AI Studio en el botón "API IA" para generar imágenes con IA.' };
      const models = ['gemini-3.1-flash-lite-image', 'gemini-3.1-flash-image'];
      const errs = [];
      for (const m of models) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['IMAGE'] } })
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) { errs.push(`[${m}] HTTP ${res.status} ${(data && data.error && data.error.message) || ''}`.trim()); continue; }
          const parts = (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
          const p = parts.find(x => x.inlineData || x.inline_data);
          const d = p && (p.inlineData || p.inline_data);
          if (d && d.data) return { ok: true, dataUrl: `data:${d.mimeType || d.mime_type || 'image/png'};base64,${d.data}` };
          errs.push(`[${m}] la respuesta no incluyó imagen`);
        } catch (e) { errs.push(`[${m}] ${e.message}`); }
      }
      return { ok: false, error: errs.join('\n') };
    },

    // La IA elige los mejores tramos de los clips del usuario según su petición (el montaje se hace en el navegador).
    async generateVideoEditPlan({ promptText = '', clips = [], targetSeconds = 30, sport = 'Fútbol' }) {
      const imgs = [];
      const idx = [];
      clips.forEach((c, ci) => c.frames.forEach(f => {
        imgs.push(f.b64);
        idx.push(`clip ${ci} («${c.name}», dura ${c.duration.toFixed(1)} s) · fotograma en t=${f.t.toFixed(1)} s`);
      }));
      const sys = `Eres el editor de vídeo IA de KINET Media Studio™ especializado en ${sport}. Atleta: ${buildAthleteContextLine()}.
Recibes fotogramas de varios clips del usuario (cada uno indica su clip y su segundo). Crea un EDIT de unos ${targetSeconds} segundos según la petición del usuario, eligiendo los mejores tramos.
Reglas: usa solo tiempos que estén dentro de la duración de cada clip; cada segmento dura entre 1.5 y 6 segundos; puedes repetir un clip con tramos distintos; usa cámara lenta (speed 0.5) solo en la jugada clave; zoom entre 1.0 y 1.25; los subtítulos (caption) son opcionales y muy cortos. No inventes datos del atleta.
Orden de los fotogramas recibidos:
${idx.map((t, i) => `${i + 1}. ${t}`).join('\n')}
Devuelve ESTRICTAMENTE un JSON válido:
{"title":"TÍTULO CORTO EN MAYÚSCULAS (máx 28 caracteres)","subtitle":"línea corta","segments":[{"clip":0,"start":0.0,"end":3.0,"speed":1,"zoom":1.0,"caption":""}],"outro":"texto final corto"}`;
      const raw = await callDirectLLMProvider({
        systemPrompt: sys,
        userPrompt: promptText || 'Haz un edit con mis mejores jugadas',
        imagesBase64: imgs,
        responseMimeType: 'application/json'
      });
      const plan = JSON.parse(String(raw).replace(/```json|```/g, '').trim());
      if (!plan || !Array.isArray(plan.segments) || !plan.segments.length) throw new Error('La IA no devolvió un plan de edición válido.');
      return plan;
    },

    // ------------------------------------------------------------------------
    // MOTOR 5: PASARELA STRIPE CHECKOUT (SUSCRIPCIONES Y BONOS PAY-AS-YOU-GO)
    // ------------------------------------------------------------------------
    async startStripeCheckout({ itemKey, currentTier }) {
      const tier = currentTier || getCurrentTier();
      const userId = localStorage.getItem('kinet_user_id') || '';
      const userEmail = localStorage.getItem('kinet_user_email') || '';

      const edgeCheckout = await invokeSupabaseEdgeFunction('kinet-stripe-checkout', {
        itemKey,
        currentTier: tier,
        userId,
        userEmail,
        successUrl: `${window.location.origin}/despacho.html?tab=subscription&stripe_success=${encodeURIComponent(itemKey)}`,
        cancelUrl: `${window.location.origin}/despacho.html?tab=subscription`
      });

      if (edgeCheckout && edgeCheckout.checkoutUrl) {
        window.location.href = edgeCheckout.checkoutUrl;
        return { ok: true, redirected: true };
      }

      const links = KINET_API_CONFIG.stripeLinks || {};
      const isProMember = tier === 'pro' || tier === 'club';
      let directUrl = '';

      if (itemKey === 'pro') directUrl = links.plan_pro;
      else if (itemKey === 'club') directUrl = links.plan_club;
      else if (itemKey === 'pack_45') directUrl = isProMember ? links.pack_45_pro : links.pack_45_free;
      else if (itemKey === 'pack_150') directUrl = isProMember ? links.pack_150_pro : links.pack_150_free;
      else if (itemKey === 'pack_400') directUrl = isProMember ? links.pack_400_pro : links.pack_400_free;

      if (directUrl && directUrl.startsWith('https://')) {
        const sep = directUrl.includes('?') ? '&' : '?';
        const finalUrl = `${directUrl}${sep}client_reference_id=${encodeURIComponent(userId)}&prefilled_email=${encodeURIComponent(userEmail)}`;
        window.location.href = finalUrl;
        return { ok: true, redirected: true };
      }

      return {
        ok: false,
        needsConfig: true,
        message: 'Configura la Edge Function "kinet-stripe-checkout" o pega tus URLs de Stripe Payment Links en kinet-api-config.js.'
      };
    },

    // ------------------------------------------------------------------------
    // MOTOR 6: LABORATORIO ESPECIALIZADO (analizador3) — genera planes como JSON
    // Consume 1 mensaje del cupo diario de chat (igual que el resto de la IA).
    // ------------------------------------------------------------------------
    async generateLabPlan({ sport = 'Running', promptText = '', schemaHint = '', currentState = null }) {
      const quota = this.getQuotaStatus();
      if (quota.chatRemaining <= 0) {
        return { ok: false, limitReached: true, error: `Has alcanzado tu límite diario de ${quota.chatLimit} consultas de IA en el ${quota.tierName}.` };
      }
      const sys = `Eres el planificador táctico de KINET OS para ${sport}. Atleta: ${buildAthleteContextLine()}.
Respondes SOLO con un JSON válido (sin texto extra ni markdown) que respete exactamente este esquema:
${schemaHint}
Reglas: usa valores realistas para el deporte, no inventes datos personales del atleta y adapta el plan a su contexto si está registrado.`;
      try {
        const raw = await callDirectLLMProvider({
          systemPrompt: sys,
          userPrompt: `Petición: "${String(promptText).slice(0, 600)}"\nEstado actual del laboratorio (resumido): ${JSON.stringify(currentState || {}).slice(0, 1800)}`,
          responseMimeType: 'application/json'
        });
        const parsed = JSON.parse(String(raw).replace(/```json|```/g, '').trim());
        incrementDailyChatUsage();
        return { ok: true, plan: parsed, remaining: Math.max(0, quota.chatRemaining - 1) };
      } catch (err) {
        return { ok: false, error: (err && err.message) ? err.message : 'No se pudo generar el plan.' };
      }
    }
  };

  window.KinetAPIs = KinetAPIs;

  // ==========================================================================
  // 9. BLINDAJE DE PUENTES Y WIDGET RÁPIDO "🟢 API IA" EN LA CABECERA DEL CHAT
  // ==========================================================================
  function detectActiveAgentInDOM() {
    const activeItem = document.querySelector('.contact-item.active');
    if (activeItem && activeItem.getAttribute('data-agent')) {
      return activeItem.getAttribute('data-agent');
    }
    return localStorage.getItem('kinet_target_agent') || 'group';
  }

  const MASTER_STAFF_AI_ENGINE = {
    callExternalLLM: async function (systemPrompt, userMessage, imageDataUrl, historyArr) {
      const agentId = detectActiveAgentInDOM();
      const res = await KinetAPIs.askSpecialistAI({
        agentId,
        systemPrompt,
        userMessage,
        imageDataUrl,
        chatHistory: historyArr || [],
        consumeQuota: false
      });
      return res.reply;
    }
  };

  try {
    Object.defineProperty(window, 'KINET_STAFF_AI_ENGINE', {
      configurable: false,
      enumerable: true,
      get: function () {
        return MASTER_STAFF_AI_ENGINE;
      },
      set: function () {
        // Impide que cuerpo-tecnico.html sobrescriba el motor con su código antiguo
      }
    });
  } catch (e) {
    window.KINET_STAFF_AI_ENGINE = MASTER_STAFF_AI_ENGINE;
  }

  window.KinetAPIConfig = {
    callSupportAgent: async function (payload) {
      const q = (payload && payload.question) || '';
      const sys = (payload && payload.systemPrompt) || 'Eres el Agente Oficial de Soporte Técnico de KINET OS.';
      const res = await KinetAPIs.askSpecialistAI({
        agentId: 'support',
        systemPrompt: sys,
        userMessage: q,
        consumeQuota: false
      });
      return res.reply;
    }
  };

  function hasAnyConfiguredApiKey() {
    const g = localStorage.getItem('kinet_gemini_api_key') || KINET_API_CONFIG.GEMINI_API_KEY || '';
    const q = localStorage.getItem('kinet_groq_api_key') || KINET_API_CONFIG.GROQ_API_KEY || '';
    const o = localStorage.getItem('kinet_ai_api_key') || KINET_API_CONFIG.OPENAI_API_KEY || '';
    return Boolean(g.trim() || q.trim() || o.trim());
  }

  function injectQuickApiConfigWidget() {
    const chatHeader = document.querySelector('.chat-header-bar');
    if (!chatHeader || document.getElementById('kinet-api-key-quick-btn') || document.getElementById('btn-open-ai-key-modal')) return;

    const rightBtnsWrap = chatHeader.lastElementChild;
    if (!rightBtnsWrap) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'kinet-api-key-quick-btn';
    btn.className = 'btn-pdf-chat';
    const updateBtnLabel = () => {
      const connected = hasAnyConfiguredApiKey();
      btn.innerHTML = connected ? '🟢 API IA: ON' : '🔑 Conectar API IA';
      btn.style.borderColor = connected ? '#00FF88' : '#F59E0B';
      btn.style.color = connected ? '#00FF88' : '#FBBF24';
    };
    updateBtnLabel();

    btn.onclick = () => {
      let modal = document.getElementById('kinet-api-key-setup-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'kinet-api-key-setup-modal';
        modal.className = 'kinet-modal-overlay';
        modal.innerHTML = `
          <div class="kinet-modal-box" style="max-width:500px;">
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:10px;">
              <div>
                <span style="font-family:'JetBrains Mono';font-size:0.6rem;color:var(--role-color);">⚡ CONECTOR EN VIVO // KINET AI ENGINE v3.0</span>
                <h3 style="font-family:'Orbitron';font-size:0.95rem;font-weight:900;color:white;margin-top:2px;">Clave API de Inteligencia Artificial</h3>
              </div>
              <button type="button" onclick="document.getElementById('kinet-api-key-setup-modal').classList.remove('open')" style="background:none;border:none;color:white;font-size:1.15rem;cursor:pointer;">✕</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:10px;">
              <div>
                <label style="font-family:'JetBrains Mono';font-size:0.6rem;color:#00FF88;display:block;margin-bottom:4px;font-weight:700;">1. GOOGLE GEMINI / VERTEX API KEY</label>
                <input type="password" id="inp-kinet-gemini-key" style="width:100%;background:#060911;border:1px solid rgba(0,255,136,0.4);border-radius:10px;padding:9px 12px;color:white;font-family:'JetBrains Mono';font-size:0.75rem;" placeholder="AIzaSy... o AQ....">
              </div>
              <div>
                <label style="font-family:'JetBrains Mono';font-size:0.6rem;color:#38BDF8;display:block;margin-bottom:4px;font-weight:700;">2. GROQ API KEY (OPCIONAL • LLAMA 3.3 70B)</label>
                <input type="password" id="inp-kinet-groq-key" style="width:100%;background:#060911;border:1px solid rgba(56,189,248,0.35);border-radius:10px;padding:9px 12px;color:white;font-family:'JetBrains Mono';font-size:0.75rem;" placeholder="gsk_...">
              </div>
              <div>
                <label style="font-family:'JetBrains Mono';font-size:0.6rem;color:#94A3B8;display:block;margin-bottom:4px;font-weight:700;">3. OPENAI API KEY (OPCIONAL • GPT-4o-mini)</label>
                <input type="password" id="inp-kinet-openai-key" style="width:100%;background:#060911;border:1px solid rgba(255,255,255,0.15);border-radius:10px;padding:9px 12px;color:white;font-family:'JetBrains Mono';font-size:0.75rem;" placeholder="sk-...">
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:8px;border-top:1px solid rgba(255,255,255,0.08);padding-top:12px;">
              <button type="button" class="btn-pdf-chat" style="background:var(--role-gradient);color:#04060A;padding:8px 16px;" id="btn-save-kinet-api-keys">✓ Guardar y Conectar IA</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);

        document.getElementById('btn-save-kinet-api-keys').onclick = () => {
          const gVal = document.getElementById('inp-kinet-gemini-key').value.trim();
          const qVal = document.getElementById('inp-kinet-groq-key').value.trim();
          const oVal = document.getElementById('inp-kinet-openai-key').value.trim();

          if (gVal) localStorage.setItem('kinet_gemini_api_key', gVal);
          if (qVal) localStorage.setItem('kinet_groq_api_key', qVal);
          else localStorage.removeItem('kinet_groq_api_key');
          if (oVal) localStorage.setItem('kinet_ai_api_key', oVal);
          else localStorage.removeItem('kinet_ai_api_key');

          updateBtnLabel();
          modal.classList.remove('open');
        };
      }

      document.getElementById('inp-kinet-gemini-key').value = localStorage.getItem('kinet_gemini_api_key') || DEFAULT_INSTALLED_API_KEY;
      document.getElementById('inp-kinet-groq-key').value = localStorage.getItem('kinet_groq_api_key') || '';
      document.getElementById('inp-kinet-openai-key').value = localStorage.getItem('kinet_ai_api_key') || '';
      modal.classList.add('open');
    };

    rightBtnsWrap.insertBefore(btn, rightBtnsWrap.firstChild);
  }

  window.addEventListener('DOMContentLoaded', () => {
    injectQuickApiConfigWidget();
  });
})(window);
