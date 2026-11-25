// KINET OS · Proxy de IA seguro. Las claves (Gemini y Anthropic) viven AQUÍ (secretos), nunca en el navegador.
// Motores (v36): DOS motores. Fuerte = Gemini 3.8 Flash (Pro 12 al día, Club 35) y, al agotarse el cupo diario, BÁSICO = Gemini 3.1 Flash-Lite
// (Pro 28 más, Club 65 más). Gratis usa solo el básico (8 al día). Claude Haiku 5.5 queda preparado pero apagado: se activa poniendo
// los secretos ANTHROPIC_API_KEY y CLAUDE_MODEL_PRO=claude-haiku-5-5 (si falla o falta la clave, cae a Gemini).
// Aplica en el servidor: plan del usuario (tabla profiles), límites diarios, presupuesto mensual (20 % del precio),
// tope de tokens y recorte de entradas. El cliente no puede saltarse nada de esto.
//
// Despliegue:  supabase functions deploy kinet-ai-chat
// Secretos:    supabase secrets set GEMINI_API_KEY=AIza...   ANTHROPIC_API_KEY=sk-ant-...
//              (opcional: CLAUDE_MODEL_PRO, GEMINI_MODEL_PRO, GEMINI_MODEL_FREE, GEMINI_MODEL_LITE)
// SQL previo:  supabase/05_ia_limites.sql
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mismos valores que PLAN_LIMITS de kinet-api-config.js. daily = consultas diarias con el motor FUERTE; lite = consultas diarias extra con el motor BÁSICO
// (cuando se agota el fuerte, o cuando se agota el presupuesto mensual). Total al día = daily + lite. cost = estimación reservada por consulta (luego se
// sustituye por el coste real medido).
// AI_SHARE = % del PRECIO CON IVA que puede gastarse en chat/soporte/táctica al mes (el vídeo y las imágenes tienen su propia cuota aparte).
// 0,20 → Pro 11,99 € = 2,40 €/mes · Club 39,99 € = 8,00 €/mes. Si cambias los precios, cambia también "price" abajo.
const AI_SHARE = 0.20;
const GEM_STRONG = Deno.env.get("GEMINI_MODEL_PRO") ?? "gemini-3.8-flash";
const STRONG_MODEL = Deno.env.get("CLAUDE_MODEL_PRO") ?? GEM_STRONG;
type Plan = { price: number; daily: number; lite: number; community: number; support: number; tactical: number; maxTokens: number; model: string; fallback: string; cost: number; freeBudget?: number };
const PLANS: Record<string, Plan> = {
  free: { price: 0,     daily: 0,  lite: 8, community: 5,  support: 5,  tactical: 3,  maxTokens: 1500, model: Deno.env.get("GEMINI_MODEL_FREE") ?? "gemini-3.1-flash-lite", fallback: "gemini-3.5-flash-lite", cost: 0.0012, freeBudget: 0.35 },
  pro:  { price: 11.99, daily: 12, lite: 28, community: 10, support: 15, tactical: 10, maxTokens: 2600, model: STRONG_MODEL, fallback: "gemini-3.5-flash-lite", cost: 0.0040 },
  club: { price: 39.99, daily: 35, lite: 65, community: 20, support: 30, tactical: 25, maxTokens: 3400, model: STRONG_MODEL, fallback: "gemini-3.5-flash-lite", cost: 0.0040 },
};
const LITE = { model: Deno.env.get("GEMINI_MODEL_LITE") ?? "gemini-3.1-flash-lite", fallback: "gemini-3.5-flash-lite", maxTokens: 1100, cost: 0.0012 };
// Precios OFICIALES de Google (USD por millón de tokens; ai.google.dev/gemini-api/docs/pricing, mirados en nov-2026). [entrada, salida]
// Si cambian, solo hay que editar esta tabla, o poner un secreto PRICE_<MODELO>_IN_USD / PRICE_<MODELO>_OUT_USD (guiones y puntos → _).
const USD_EUR = (() => { const v = Number(Deno.env.get("USD_EUR")); return Number.isFinite(v) && v > 0 ? v : 0.92; })();   // prudente
const TABLE_USD: Record<string, [number, number]> = {
  "gemini-3.5-flash-lite": [0.30, 2.50],
  "gemini-3.6-flash": [1.50, 7.50],
  "gemini-3.1-flash-lite": [0.25, 1.50],
  "gemini-3.5-flash": [1.50, 9.00],
  "gemini-3-flash-preview": [0.50, 3.00],
  "gemini-2.5-flash": [0.30, 2.50],
  "gemini-2.5-flash-lite": [0.10, 0.40],
  "claude-haiku-5-5": [0.10, 0.50],   // Anthropic: 0,10 $ entrada / 0,50 $ salida hasta 100K tokens por petición (lectura de caché 0,01 $; escritura 5 min 0,125 $)
  "gemini-3.1-pro-preview": [2.00, 12.00],
  "gemini-2.5-pro": [1.25, 10.00],
};
function priceUSD(model: string, lite: boolean): [number, number] {
  const k = model.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  const eIn = Number(Deno.env.get(`PRICE_${k}_IN_USD`)), eOut = Number(Deno.env.get(`PRICE_${k}_OUT_USD`));
  if (eIn > 0 && eOut > 0) return [eIn, eOut];
  if (model === "gemini-3.8-flash") return Date.now() >= Date.parse("2027-01-01T00:00:00Z") ? [1.50, 7.50] : [0.75, 3.75];   // precio de lanzamiento hasta el 31-dic-2026
  return TABLE_USD[model] ?? (lite ? [0.30, 2.50] : [1.50, 9.00]);   // modelo desconocido: precio alto por prudencia
}
const STAFF_ROLES = ["superadmin", "admin", "subadmin"];   // el equipo puede probar sin tope (queda registrado)

const isClaude = (m: string) => m.startsWith("claude-");
const MAX_SYSTEM = 26000, MAX_USER = 6000, MAX_HIST = 6, MAX_HIST_CHARS = 3000, MAX_IMAGE_B64 = 2_000_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
  let reserved: { uid: string; kind: string; engine: string; cost: number } | null = null;
  let lastErrors: string[] = [];
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  try {
    // 1) Usuario autenticado
    const auth = req.headers.get("Authorization") ?? "";
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: u } = await sb.auth.getUser();
    if (!u?.user) return json({ error: "sin-sesion" }, 401);
    const uid = u.user.id;

    // 2) Plan REAL (solo lo cambia Stripe/staff desde el servidor)
    const { data: prof } = await db.from("profiles").select("account_tier, staff_role").eq("id", uid).maybeSingle();
    const tier = (["free", "pro", "club"].includes(prof?.account_tier) ? prof!.account_tier : "free") as keyof typeof PLANS;
    const plan = PLANS[tier];
    const bypass = STAFF_ROLES.includes(String(prof?.staff_role ?? ""));
    const budget = plan.price > 0 ? +(plan.price * AI_SHARE).toFixed(2) : (plan.freeBudget ?? 0.35);

    // 3) Entrada saneada
    const body = await req.json();
    const agentId = String(body.agentId ?? "group");
    const kind = agentId === "community" ? "community" : agentId === "support" ? "support" : agentId === "tactical" ? "tactical" : "chat";
    const wantsJson = agentId === "json" || agentId === "tactical" || body.responseMimeType === "application/json";
    const systemPrompt = String(body.systemPrompt ?? "").slice(0, MAX_SYSTEM);
    const userMessage = String(body.userMessage ?? "").slice(0, MAX_USER);
    if (!userMessage.trim()) return json({ error: "vacio" }, 400);
    const history = (Array.isArray(body.chatHistory) ? body.chatHistory : []).slice(-MAX_HIST)
      .map((m: { role?: string; content?: string }) => ({ role: m.role === "user" ? "user" : "model", text: String(m.content ?? "").slice(0, MAX_HIST_CHARS) }))
      .filter((m: { text: string }) => m.text.trim());
    let imgPart: Record<string, unknown> | null = null;
    const img = String(body.imageDataUrl ?? "");
    if (img.startsWith("data:image/") && img.includes(",") && img.length < MAX_IMAGE_B64) {
      imgPart = { inline_data: { mime_type: img.slice(5, img.indexOf(";")) || "image/jpeg", data: img.split(",")[1] } };
    }

    // 3b) Techo duro de gasto (1,3 × el presupuesto): el motor básico sigue funcionando cuando se agota el presupuesto del fuerte, pero nunca más allá de este techo
    if (!bypass) {
      try {
        const first = new Date(); first.setUTCDate(1); const since = first.toISOString().slice(0, 10);
        const { data: rows } = await db.from("ai_usage").select("cost_eur").eq("user_id", uid).gte("day", since);
        const spent = (rows ?? []).reduce((a: number, r: { cost_eur: number }) => a + Number(r.cost_eur || 0), 0);
        if (spent >= budget * 1.15) return json({ limitReached: true, error: "limite", reply: tier === "free" ? "Has agotado la IA gratuita de este mes. Se renueva el día 1; con Pro tienes mucha más." : "Has agotado la IA incluida en tu plan este mes. Se renueva el día 1." }, 429);
      } catch (_) { /* si no se puede leer, se sigue: la reserva normal sigue protegiendo */ }
    }

    // 4) Reserva atómica de consulta (límite diario + presupuesto mensual)
    const { data: rsv, error: rerr } = await db.rpc("kinet_ai_reserve", {
      p_user: uid, p_kind: kind === "chat" ? "chat" : kind,
      p_daily: plan.daily, p_lite: plan.lite,
      p_aux: kind === "community" ? plan.community : kind === "support" ? plan.support : plan.tactical,
      p_budget: budget, p_cost_strong: plan.cost * (imgPart ? 1.8 : 1), p_cost_lite: LITE.cost, p_bypass: bypass,
    });
    if (rerr) return json({ error: "sin-tablas", detail: "Ejecuta supabase/05_ia_limites.sql" }, 500);
    if (rsv.engine === "denied") {
      const exhausted = rsv.budget_exhausted && tier !== "free";
      return json({
        limitReached: true, error: "limite",
        reply: exhausted
          ? "Has agotado el presupuesto de IA potente de este mes y el cupo del motor básico de hoy. Se renueva el día 1 y a las 00:00 h."
          : tier === "free"
            ? `Has usado tus ${plan.lite} consultas gratuitas de hoy. Se renuevan a las 00:00 h. Con Pro tienes ${PLANS.pro.daily + PLANS.pro.lite} al día y el motor potente.`
            : `Has alcanzado tu límite diario de ${plan.daily + plan.lite} consultas. Se reinicia a las 00:00 h.`,
      }, 429);
    }
    reserved = { uid, kind, engine: rsv.engine, cost: rsv.cost };

    // 5) Llamada a Gemini (la clave solo existe aquí)
    const key = Deno.env.get("GEMINI_API_KEY");
    const claudeKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key && !claudeKey) throw new Error("falta clave de IA");
    const lite = rsv.engine === "lite";
    const cfg = lite ? LITE : plan;
    const maxTokens = Math.min(Number(body.maxTokens) || cfg.maxTokens, Math.round(cfg.maxTokens * 1.5));

    const turns: { role: string; parts: Record<string, unknown>[] }[] = [];
    for (const m of history) {
      const last = turns[turns.length - 1];
      if (last && last.role === m.role) (last.parts[0] as { text: string }).text += "\n" + m.text; else turns.push({ role: m.role, parts: [{ text: m.text }] });
    }
    while (turns.length && turns[0].role !== "user") turns.shift();
    if (turns.length && turns[turns.length - 1].role === "user") turns.pop();
    const userParts: Record<string, unknown>[] = [{ text: userMessage }]; if (imgPart) userParts.push(imgPart);
    turns.push({ role: "user", parts: userParts });

    const usage = { inp: 0, out: 0, eur: 0 };   // tokens y € REALES consumidos (incluye reintentos y el modelo que respondió)
    const callClaude = async (model: string, tokens: number) => {
      if (!claudeKey) return { ok: false as const };
      const msgs: { role: string; content: unknown }[] = turns.map((t) => ({ role: t.role === "model" ? "assistant" : "user", content: t.parts.map((p) => (p as { text?: string }).text ?? "").filter(Boolean).join("\n") }));
      if (imgPart) {   // la última entrada (la del usuario) lleva la imagen
        const ip = (imgPart as { inline_data: { mime_type: string; data: string } }).inline_data;
        const mt = ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(ip.mime_type) ? ip.mime_type : "image/jpeg";
        const last = msgs[msgs.length - 1];
        last.content = [{ type: "image", source: { type: "base64", media_type: mt, data: ip.data } }, { type: "text", text: String(last.content) }];
      }
      const sys = wantsJson ? systemPrompt + "\n\nResponde SOLO con JSON válido, sin texto antes ni después y sin bloques de código." : systemPrompt;
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "content-type": "application/json", "x-api-key": claudeKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model, max_tokens: Math.round(tokens * 1.3), temperature: 0.62, system: [{ type: "text", text: sys, cache_control: { type: "ephemeral" } }], messages: msgs }),
      });
      if (!r.ok) return { ok: false as const };
      const d = await r.json();
      let text = (d?.content ?? []).filter((b: { type?: string }) => b.type === "text").map((b: { text: string }) => b.text).join("").trim();
      if (wantsJson) text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
      const u = d?.usage ?? {};
      const fresh = Number(u.input_tokens) || 0, cread = Number(u.cache_read_input_tokens) || 0, cwrite = Number(u.cache_creation_input_tokens) || 0, tout = Number(u.output_tokens) || 0;
      usage.inp += fresh + cread + cwrite; usage.out += tout;
      const pu = priceUSD(model, lite); usage.eur += ((fresh + cread * 0.1 + cwrite * 1.25) * pu[0] + tout * pu[1]) / 1_000_000 * USD_EUR;
      return { ok: true as const, text, truncated: d?.stop_reason === "max_tokens" };
    };
    const noThink = new Set<string>();
    const errors: string[] = [];   // qué falló y por qué (sin claves): sale en la respuesta de error para poder diagnosticar
    const callOnce = async (model: string, tokens: number) => {
      if (isClaude(model)) return await callClaude(model, tokens);
      if (!key) { errors.push(`${model}: falta el secreto GEMINI_API_KEY`); return { ok: false as const }; }
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] }, contents: turns,
          generationConfig: { temperature: 0.62, maxOutputTokens: tokens, ...(wantsJson ? { responseMimeType: "application/json" } : {}),
            // 2.5 Flash "piensa" por defecto y esos tokens se cobran como salida: se limita (256) para que el coste real se parezca al presupuestado; el Lite no piensa.
            ...(noThink.has(model) ? {} : model === "gemini-3.8-flash" ? { thinkingConfig: { thinkingLevel: "low" } } : model === "gemini-2.5-flash" ? { thinkingConfig: { thinkingBudget: 256 } } : model.startsWith("gemini-2.5-flash-lite") ? { thinkingConfig: { thinkingBudget: 0 } } : {}) },
        }),
      });
      if (!r.ok) {
        let msg = ""; try { msg = String((await r.json())?.error?.message ?? "").slice(0, 160); } catch (_) { /* nada */ }
        errors.push(`${model}: HTTP ${r.status}${msg ? " · " + msg : ""}`);
        if (r.status === 400 && /thinking/i.test(msg) && !noThink.has(model)) { noThink.add(model); return await callOnce(model, tokens); }   // el modelo no admite ese ajuste de razonamiento: se repite sin él
        return { ok: false as const, status: r.status };
      }
      const d = await r.json(); const c = d?.candidates?.[0];
      const text = (c?.content?.parts ?? []).filter((p: { thought?: boolean; text?: string }) => !p.thought && typeof p.text === "string").map((p: { text: string }) => p.text).join("").trim();
      const um = d?.usageMetadata ?? {};
      usage.inp += Number(um.promptTokenCount) || 0;
      const tin = Number(um.promptTokenCount) || 0, tout = (Number(um.candidatesTokenCount) || 0) + (Number(um.thoughtsTokenCount) || 0);   // los tokens de "pensar" también se cobran
      usage.out += tout;
      const cached = Math.min(tin, Number(um.cachedContentTokenCount) || 0);   // la parte repetida del prompt la cobra Google ~90 % más barata
      const pu = priceUSD(model, lite); usage.eur += (((tin - cached) + cached * 0.1) * pu[0] + tout * pu[1]) / 1_000_000 * USD_EUR;
      return { ok: true as const, text, truncated: c?.finishReason === "MAX_TOKENS" };
    };
    // Un fallo pasajero de Google (429 por ráfagas, 500, 503) se reintenta una vez tras una pausa corta antes de cambiar de modelo
    const call = async (model: string, tokens: number) => {
      let out = await callOnce(model, tokens) as { ok: boolean; status?: number; text?: string; truncated?: boolean };
      if (!out.ok && [429, 500, 502, 503, 504].includes(Number(out.status))) { await new Promise((res) => setTimeout(res, 900)); out = await callOnce(model, tokens) as typeof out; }
      return out as { ok: boolean; text?: string; truncated?: boolean };
    };
    const trim = (t: string) => { const i = Math.max(t.lastIndexOf(".\n"), t.lastIndexOf(". "), t.lastIndexOf("?"), t.lastIndexOf("!"), t.lastIndexOf("\n- "), t.lastIndexOf("\n\n")); return i > t.length * 0.5 ? t.slice(0, i + 1).trim() : t; };

    let reply = "";
    // Cadena de modelos: el del plan, su respaldo y, como último recurso, otros modelos vigentes, para que un secreto con un nombre de modelo mal puesto no deje sin IA a nadie
    for (const model of [...new Set([cfg.model, cfg.fallback, "gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-2.5-flash-lite"])]) {
      let out = await call(model, maxTokens);
      if (out.ok && out.truncated) { const again = await call(model, maxTokens * 2); if (again.ok && again.text) out = again; }  // si se corta, reintenta con más margen
      if (out.ok && out.text) { reply = out.truncated && !wantsJson ? trim(out.text) : out.text; break; }
    }
    if (!reply) { lastErrors = errors.slice(-4); throw new Error("sin-respuesta"); }
    // Coste REAL medido: sustituye la estimación fija reservada al empezar. Si aún no has ejecutado 09_ia_coste_real.sql, se ignora sin romper nada.
    if (usage.inp + usage.out > 0) {
      const real = usage.eur;
      try { await db.rpc("kinet_ai_settle", { p_user: uid, p_estimated: rsv.cost, p_actual: +real.toFixed(6), p_in: usage.inp, p_out: usage.out }); } catch (_) { /* nada */ }
    }
    reserved = null;
    return json({
      reply, engine: rsv.engine, remaining: { strong: Math.max(0, plan.daily - rsv.strong_used), total: Math.max(0, plan.daily + plan.lite - rsv.strong_used - rsv.lite_used), budgetExhausted: rsv.budget_exhausted },
    });
  } catch (_e) {
    // El proveedor falló: se devuelve la consulta para que el usuario no pague un error
    if (reserved) { try { await db.rpc("kinet_ai_refund", { p_user: reserved.uid, p_kind: reserved.kind, p_engine: reserved.engine, p_cost: reserved.cost }); } catch (_) { /* nada */ } }
    console.error("kinet-ai-chat:", String((_e as Error)?.message ?? _e), lastErrors.join(" | "));
    const msg = String((_e as Error)?.message ?? _e);
    return json({ error: "ia-no-disponible", code: msg === "falta clave de IA" ? "sin-clave" : msg === "sin-respuesta" ? "proveedor" : "interno", detail: lastErrors.length ? lastErrors.join(" | ") : msg.slice(0, 200) }, 502);
  }
});
