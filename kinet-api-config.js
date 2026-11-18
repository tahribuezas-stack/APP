/**
 * ============================================================================
 * KINET OS // MOTOR CENTRAL DE APIS DE IA, VISION LAB, PIZARRA 3D Y STRIPE (v2.0)
 * ============================================================================
 * Archivo: kinet-api-config.js
 * Servidor Cloud: https://bhqgsbtkwdxdxlvlcaes.supabase.co
 *
 * Incluye los 5 Motores Conectados:
 *  1. Cuerpo Técnico IA + Soporte Técnico (Multimodal Texto + Imagen + Handoff)
 *  2. Vision Analytics Lab™ (Extractor Canvas de 8 Fotogramas Clave + Calibración KINET Card)
 *  3. Generador Táctico 3D Multifase (JSON de Fases 1, 2 y 3 para analizador2.html)
 *  4. KINET Media Studio™ AI Copywriter & HUD Generator (+ Puente Spotify API)
 *  5. Pasarela Stripe Checkout & Gestión Unificada de Suscripciones (Free / Pro / Club)
 */
(function (window) {
  'use strict';

  const SUPABASE_PROJECT_URL = 'https://bhqgsbtkwdxdxlvlcaes.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_GrgL4iukPUJJyh91BdgfIQ_P0NQd6Nj';
  const EDGE_FUNCTIONS_BASE = `${SUPABASE_PROJECT_URL}/functions/v1`;
  const MAX_BONUS_WALLET_MINS = 595; // Tope máximo: 45 + 150 + 400 min

  // ==========================================================================
  // 1. CONFIGURACIÓN GLOBAL DE ENDPOINTS, STRIPE LINKS Y CLAVES DE DESARROLLO
  // ==========================================================================
  // NOTA DE SEGURIDAD: En producción deja las API Keys vacías aquí y guárdalas
  // en Supabase -> Edge Functions -> Secrets (GEMINI_API_KEY, STRIPE_SECRET_KEY).
  const KINET_API_CONFIG = {
    SUPABASE_URL: SUPABASE_PROJECT_URL,
    EDGE_BASE_URL: EDGE_FUNCTIONS_BASE,

    // Claves opcionales solo para pruebas locales rápidas (o leídas de localStorage)
    GEMINI_API_KEY: '',
    GROQ_API_KEY: '',
    OPENAI_API_KEY: '',
    spotifyAccessToken: '',

    // Modelos asignados automáticamente según el Plan de Suscripción
    modelsByTier: {
      free: {
        gemini: 'gemini-2.5-flash-lite',
        openai: 'gpt-4o-mini',
        groq: 'llama-3.1-8b-instant',
        maxTokens: 380,
        temperature: 0.6
      },
      pro: {
        gemini: 'gemini-2.5-flash',
        openai: 'gpt-4o-mini',
        groq: 'llama-3.3-70b-versatile',
        maxTokens: 650,
        temperature: 0.65
      },
      club: {
        gemini: 'gemini-2.5-flash',
        openai: 'gpt-4o',
        groq: 'llama-3.3-70b-versatile',
        maxTokens: 900,
        temperature: 0.65
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
      dailyChatMessages: 250,
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
      dailyChatMessages: 600,
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
    'Fútbol': {
      cardStats: ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'],
      videoBlocks: ['Fase Ofensiva / Con Balón (3-5 min)', 'Fase Defensiva / Presión (3-5 min)', 'Participación Individual Clave (3-5 min)', 'Rendimiento de Portero (3-5 min)'],
      metricsLabels: ['PRECISIÓN BIOMEC.', 'VELOCIDAD / POTENCIA', 'LECTURA TÁCTICA IQ', 'IMPACTO EN MEDIA'],
      defaultBars: ['Toma de decisiones en último tercio', 'Controles orientados y perfilación', 'Ocupación de zonas de acción', 'Precisión de ejecución bajo presión'],
      arenaName: 'Estadio Táctico 3D (11vs11 / Fútbol 7 / Sala)'
    },
    'Baloncesto': {
      cardStats: ['PTS', '3PT', 'AST', 'REB', 'DEF', 'ATH'],
      videoBlocks: ['Ataque Media Pista & Pick&Roll (3-5 min)', 'Defensa Perímetro & Ayudas (3-5 min)', 'Transición Rápida & Contraataque (3-5 min)', 'Dominio de Pintura, Poste & Rebote (3-5 min)'],
      metricsLabels: ['MECÁNICA BIOMEC.', 'VEL. TIRO / SALTO', 'LECTURA DE PISTA IQ', 'IMPACTO EN MEDIA'],
      defaultBars: ['Fluidez de liberación de tiro', 'Lectura de ayudas en Pick & Roll', 'Desplazamiento lateral y Close-out', 'Sello físico en rebote (Box-Out)'],
      arenaName: 'Parquet Pro 3D (Quinteto / 3x3)'
    },
    'Boxeo / MMA': {
      cardStats: ['PWR', 'SPD', 'STA', 'DEF', 'CHN', 'IQ'],
      videoBlocks: ['Asalto de Ataque & Combinaciones (3 min)', 'Asalto Defensivo, Esquivas & Contras (3 min)', 'Footwork & Control de Distancia (3 min)', 'Control de Clinch, Jaula & Grappling (3 min)'],
      metricsLabels: ['EFICIENCIA CINÉTICA', 'VELOCIDAD DE IMPACTO', 'CONTROL DE RING IQ', 'IMPACTO EN MEDIA'],
      defaultBars: ['Retorno de mano a la guardia tras golpear', 'Rotación de cadera en golpes de poder', 'Economía de movimiento en Slip / Roll', 'Desplazamiento sin cruzar los pies'],
      arenaName: 'Ring & Octágono Pro 3D (Fight Camp)'
    },
    'Pádel / Tenis': {
      cardStats: ['SRV', 'VOL', 'BND', 'DEF', 'SPD', 'MNT'],
      videoBlocks: ['Ataque en Red: Voleas & Bandeja (3-5 min)', 'Defensa en Fondo, Cristales y Globo (3-5 min)', 'Transición Fondo-Red & Sincronización (3-5 min)', 'Juegos al Saque, Resto & Punto de Oro (3-5 min)'],
      metricsLabels: ['PRECISIÓN BIOMEC.', 'VEL. REMATE / SAQUE', 'DOMINIO TÁCTICO IQ', 'IMPACTO EN MEDIA'],
      defaultBars: ['Punto de impacto alto delante del cuerpo', 'Activación de Split-Step antes de golpear', 'Altura y profundidad de globo defensivo', 'Sincronización de subida en bloque'],
      arenaName: 'Pista 20x10 Cristal 3D (Química de Pareja)'
    },
    'Running': {
      cardStats: ['VO2', 'PAC', 'CAD', 'STA', 'REC', 'MNT'],
      videoBlocks: ['Ritmo de Competición & Crucero (3 min)', 'Tramo Final en Fatiga / Último Km (3 min)', 'Subida / Desnivel & Fuerza Específica (3 min)', 'Rodaje en Grupo, Liebres & Paso por Curva (3 min)'],
      metricsLabels: ['ECONOMÍA BIOMEC.', 'CADENCIA / CONTACTO', 'ESTABILIDAD EN FATIGA', 'IMPACTO EN MEDIA'],
      defaultBars: ['Aterrizaje de mediopié bajo centro de masas', 'Cadencia constante (>180 SPM)', 'Baja oscilación vertical', 'Alineación cadera-rodilla-tobillo'],
      arenaName: 'Tartán Olímpico 400m & Perfil Ruta 3D'
    }
  };

  // ==========================================================================
  // 4. GESTIÓN UNIFICADA DE CUOTAS, CONTADORES Y RENOVACIÓN MENSUAL
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

  // Unifica kinet_ai_daily_used (usado en cuerpo-tecnico.html) y kinet_ai_chat_count
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
  // 5. CLIENTE HTTP PARA SUPABASE EDGE FUNCTIONS + FALLBACK DIRECTO A LLM
  // ==========================================================================
  async function invokeSupabaseEdgeFunction(functionName, payloadObj) {
    const userId = localStorage.getItem('kinet_user_id') || '';
    const tier = getCurrentTier();
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'x-kinet-user-id': userId,
      'x-kinet-tier': tier
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);

    try {
      const res = await fetch(`${EDGE_FUNCTIONS_BASE}/${functionName}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...payloadObj, userId, tier }),
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

  // Llamada multimodal directa (Gemini / Groq / OpenAI) si hay API Key configurada
  async function callDirectLLMProvider({ systemPrompt, userPrompt, imagesBase64 = [], responseMimeType = 'text/plain' }) {
    const tier = getCurrentTier();
    const modelCfg = KINET_API_CONFIG.modelsByTier[tier] || KINET_API_CONFIG.modelsByTier.free;
    const geminiKey = KINET_API_CONFIG.GEMINI_API_KEY || localStorage.getItem('kinet_gemini_api_key') || '';
    const groqKey = KINET_API_CONFIG.GROQ_API_KEY || localStorage.getItem('kinet_groq_api_key') || '';
    const openaiKey = KINET_API_CONFIG.OPENAI_API_KEY || localStorage.getItem('kinet_ai_api_key') || '';

    // 1. Google Gemini 2.5 Flash / Flash-Lite (Soporta Texto + Múltiples Fotogramas + JSON Schema)
    if (geminiKey) {
      try {
        const parts = [{ text: `${systemPrompt}\n\n${userPrompt}` }];
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

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelCfg.gemini}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts }], generationConfig: genConfig })
          }
        );
        if (res.ok) {
          const data = await res.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text.trim();
        }
      } catch (e) {}
    }

    // 2. OpenAI GPT-4o-mini / GPT-4o
    if (openaiKey) {
      try {
        const userContent = [{ type: 'text', text: userPrompt }];
        imagesBase64.forEach((imgUrl) => {
          if (imgUrl && imgUrl.startsWith('data:image')) {
            userContent.push({ type: 'image_url', image_url: { url: imgUrl, detail: 'low' } });
          }
        });

        const bodyObj = {
          model: modelCfg.openai,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ],
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
        if (res.ok) {
          const d = await res.json();
          if (d?.choices?.[0]?.message?.content) return d.choices[0].message.content.trim();
        }
      } catch (e) {}
    }

    // 3. Groq Llama 3.3 70B Versatile
    if (groqKey) {
      try {
        const bodyObj = {
          model: modelCfg.groq,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
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
        if (res.ok) {
          const d = await res.json();
          if (d?.choices?.[0]?.message?.content) return d.choices[0].message.content.trim();
        }
      } catch (e) {}
    }

    return null;
  }

  // ==========================================================================
  // 6. EXTRACTOR DE FOTOGRAMAS CLAVE DE VÍDEO EN CLIENTE (CANVAS 8 FRAMES)
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
        }, 7500);

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
  // 7. OBJETO PRINCIPAL PÚBLICO: window.KinetAPIs
  // ==========================================================================
  const KinetAPIs = {
    getSportSchema(sportName) {
      return SPORT_AI_SCHEMA[sportName] || SPORT_AI_SCHEMA['Fútbol'];
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

      const sport = localStorage.getItem('kinet_sport') || 'Fútbol';
      const role = localStorage.getItem('kinet_active_role') || 'athlete';
      const userName = localStorage.getItem('kinet_user_name') || 'Atleta KINET';
      const userPos = localStorage.getItem('kinet_position') || 'PRO';

      const finalSystemPrompt = systemPrompt ||
        `Eres el especialista (${agentId}) del Cuerpo Técnico de Élite de KINET OS para ${sport}. Usuario: ${userName} (${role.toUpperCase()} • ${userPos}). Responde en español con pautas clínicas, biomecánicas o tácticas concretas, estructuradas con viñetas claras.`;

      // 1º Intento: Supabase Edge Function ('kinet-ai-chat')
      const edgeRes = await invokeSupabaseEdgeFunction('kinet-ai-chat', {
        agentId,
        sport,
        role,
        userName,
        userPos,
        systemPrompt: finalSystemPrompt,
        userMessage,
        imageDataUrl,
        chatHistory: chatHistory.slice(-6)
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

      // 2º Intento: Llamada directa a proveedor LLM si hay API Key configurada
      const directReply = await callDirectLLMProvider({
        systemPrompt: finalSystemPrompt,
        userPrompt: userMessage,
        imagesBase64: imageDataUrl ? [imageDataUrl] : []
      });

      if (directReply) {
        return {
          ok: true,
          reply: directReply,
          mediaStudioPrompt: null,
          suggestedHandoff: null,
          remainingAfter
        };
      }

      return {
        ok: true,
        reply: null, // Permite que cuerpo-tecnico.html use su generador contextual enriquecido si aún no hay API Key
        remainingAfter
      };
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

      // Extraer hasta 6 fotogramas reales del vídeo subido
      let extracted = { frames: [], durationSeconds: 0 };
      if (videoFileOrElement) {
        extracted = await extractVideoKeyframesBase64(videoFileOrElement, 6, 540, 0.68);
      }

      // 1º Intento: Supabase Edge Function ('kinet-vision-lab')
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

      // 2º Intento: Gemini 2.5 Flash Vision directo con los 6 fotogramas extraídos
      const visionSystemPrompt = `Eres el motor biomecánico y táctico KINET Vision Analytics™ para ${sport}.
Analiza los fotogramas del vídeo y el contexto ("${matchContext}", bloque "${blockType}", nota del usuario: "${userNotes}") para el sujeto ${subjectName} (${subjectPos}).
Devuelve ESTRICTAMENTE un JSON válido con esta estructura:
{
  "metrics": ["95.4%", "33.9 km/h", "Top 4%", "+1.6 GRL"],
  "bars": [
    ["${schema.defaultBars[0]}", 93],
    ["${schema.defaultBars[1]}", 91],
    ["${schema.defaultBars[2]}", 89],
    ["${schema.defaultBars[3]}", 92]
  ],
  "estimatedGrl": 90,
  "cardStats": [91, 89, 88, 92, 87, 90],
  "aiVerdict": "Dictamen técnico detallado de 2-3 frases en ${role === 'athlete' ? '1ª persona (dirigido a ti)' : '3ª persona (informe de scouting)'} sobre lo observado en los fotogramas y el contexto."
}`;

      const rawJsonText = await callDirectLLMProvider({
        systemPrompt: visionSystemPrompt,
        userPrompt: `Audita este clip de ${sport} (${blockType}). Contexto: ${matchContext}. Foco solicitado: ${userNotes}. Fotogramas adjuntos: ${extracted.frames.length}.`,
        imagesBase64: extracted.frames,
        responseMimeType: 'application/json'
      });

      if (rawJsonText) {
        try {
          const cleanJson = rawJsonText.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          if (parsed && Array.isArray(parsed.metrics) && parsed.aiVerdict) {
            return {
              ok: true,
              framesAnalyzed: extracted.frames.length,
              ...parsed
            };
          }
        } catch (e) {}
      }

      return { ok: true, fallbackUsed: true, framesAnalyzed: extracted.frames.length };
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
      // 1º Intento: Edge Function ('kinet-tactical-board')
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

      // 2º Intento: LLM directo pidiendo coordenadas de las 3 fases
      const sysPrompt = `Eres el Director Táctico IA de KINET OS (${sport}).
El usuario solicita la jugada: "${promptText}".
Tu equipo ataca de izquierda (x: 8) a derecha (x: 92) con formación ${ownFormation}. El rival defiende de derecha (x: 94) a izquierda con ${rivalFormation}.
Coordenadas actuales de tu equipo: ${JSON.stringify(currentSlots.map((s, i) => ({ idx: i, pos: s.pos, x: s.x, y: s.y })))}.
Devuelve ESTRICTAMENTE un JSON válido con:
{
  "title": "Nombre corto de la jugada",
  "zoomMode": "full" | "right" | "left",
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

      const rawJson = await callDirectLLMProvider({
        systemPrompt: sysPrompt,
        userPrompt: `Genera las 3 fases tácticas para: "${promptText}"`,
        responseMimeType: 'application/json'
      });

      if (rawJson) {
        try {
          const parsed = JSON.parse(rawJson.replace(/```json|```/g, '').trim());
          if (parsed && Array.isArray(parsed.phases) && parsed.phases.length === 3) {
            return { ok: true, ...parsed };
          }
        } catch (e) {}
      }

      return { ok: false, fallbackToPreset: true };
    },

    // ------------------------------------------------------------------------
    // MOTOR 4: KINET MEDIA STUDIO™ AI COPYWRITER & HUD DESIGNER
    // ------------------------------------------------------------------------
    async generateMediaStudioDesign({ promptText = '', formatMode = 'image', sport = 'Fútbol', presetName = 'Match Day' }) {
      const edgeStudio = await invokeSupabaseEdgeFunction('kinet-media-studio', {
        promptText,
        formatMode,
        sport,
        presetName
      });
      if (edgeStudio && edgeStudio.headline) {
        return { ok: true, ...edgeStudio };
      }

      const userPos = localStorage.getItem('kinet_position') || 'PRO';
      const sysPrompt = `Eres el Director Creativo de KINET Media Studio™ para ${sport} (${userPos}).
Transforma la petición del usuario ("${promptText}") en un titular deportivo de alto impacto (máximo 36 caracteres en mayúsculas), una línea de telemetría HUD verificada y el ID de pista recomendada ('trk_1' a 'trk_7').
Devuelve ESTRICTAMENTE JSON:
{
  "headline": "TITULAR ÉPICO EN MAYÚSCULAS",
  "subtext": "[ HUD TELEMETRY: dato biomecánico + eslogan corto ]",
  "recommendedTrackId": "trk_1",
  "replyText": "Breve respuesta presentando el diseño generado."
}`;

      const rawJson = await callDirectLLMProvider({
        systemPrompt: sysPrompt,
        userPrompt: promptText,
        responseMimeType: 'application/json'
      });

      if (rawJson) {
        try {
          const parsed = JSON.parse(rawJson.replace(/```json|```/g, '').trim());
          if (parsed && parsed.headline) {
            return { ok: true, ...parsed };
          }
        } catch (e) {}
      }

      return {
        ok: true,
        headline: promptText.slice(0, 38).toUpperCase(),
        subtext: `[ ESTILO IA & HUD (${formatMode.toUpperCase()} • ${sport.toUpperCase()}): "${promptText}" ]`,
        recommendedTrackId: 'trk_1',
        replyText: `Aquí tienes la pieza masterizada para "${promptText}":`
      };
    },

    // ------------------------------------------------------------------------
    // MOTOR 5: PASARELA STRIPE CHECKOUT (SUSCRIPCIONES Y BONOS PAY-AS-YOU-GO)
    // ------------------------------------------------------------------------
    async startStripeCheckout({ itemKey, currentTier }) {
      const tier = currentTier || getCurrentTier();
      const userId = localStorage.getItem('kinet_user_id') || '';
      const userEmail = localStorage.getItem('kinet_user_email') || '';

      // 1º Intento: Crear sesión dinámica de Stripe Checkout mediante Supabase Edge Function
      const edgeCheckout = await invokeSupabaseEdgeFunction('kinet-stripe-checkout', {
        itemKey, // 'pro' | 'club' | 'pack_45' | 'pack_150' | 'pack_400'
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

      // 2º Intento: Payment Links directos configurados en KINET_API_CONFIG.stripeLinks
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
    }
  };

  window.KinetAPIs = KinetAPIs;

  // ==========================================================================
  // 8. PUENTES DE COMPATIBILIDAD AUTOMÁTICA CON TODOS TUS ARCHIVOS HTML
  // ==========================================================================
  // Puente 1: cuerpo-tecnico.html usa window.KINET_STAFF_AI_ENGINE.callExternalLLM(...)
  window.KINET_STAFF_AI_ENGINE = {
    callExternalLLM: async function (systemPrompt, userMessage, imageDataUrl) {
      const res = await KinetAPIs.askSpecialistAI({
        agentId: localStorage.getItem('kinet_target_agent') || 'group',
        systemPrompt,
        userMessage,
        imageDataUrl,
        consumeQuota: false // cuerpo-tecnico.html ya descuenta 1 mensaje en processSpecialistReply
      });
      return res && res.reply ? res.reply : null;
    }
  };

  // Puente 2: comunidad.html y soporte.html usan window.KinetAPIConfig.callSupportAgent(...)
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
      return res && res.reply ? res.reply : null;
    }
  };
})(window);
