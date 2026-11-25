// KINET OS · Análisis de vídeo por IA (Vision Lab) en el SERVIDOR. La clave de Google vive AQUÍ, no en el navegador.
// El navegador extrae unos pocos fotogramas pequeños del clip y los envía junto al prompt; el VÍDEO NO SE SUBE NI SE GUARDA.
// Cuenta como consulta de IA "con visión" (límite diario + presupuesto mensual, igual que el chat). Los minutos de vídeo se descuentan en el cliente/BD.
//
// Despliegue:  supabase functions deploy kinet-vision-lab
// Secretos:    GEMINI_API_KEY (el mismo de kinet-ai-chat). Opcional: GEMINI_MODEL_VISION
// SQL previo:  supabase/05_ia_limites.sql
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const STAFF_ROLES = ["superadmin", "admin", "subadmin"];
const AI_SHARE = 0.20;
const PLANS: Record<string, { price: number; daily: number; lite: number; aux: number; cost: number }> = {
  free: { price: 0, daily: 0, lite: 8, aux: 3, cost: 0.0065 },
  pro: { price: 11.99, daily: 12, lite: 28, aux: 10, cost: 0.0065 },
  club: { price: 39.99, daily: 35, lite: 65, aux: 25, cost: 0.0065 },
};
const MODELS = [Deno.env.get("GEMINI_MODEL_VISION") ?? "gemini-3.8-flash", "gemini-3.5-flash", "gemini-3.1-flash-lite"];
const MAX_FRAMES = 8, MAX_FRAME_B64 = 400_000, MAX_PROMPT = 9000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let reserved: { uid: string; kind: string; engine: string; cost: number } | null = null;
  const errors: string[] = [];
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: u } = await sb.auth.getUser();
    if (!u?.user) return json({ error: "sin-sesion" }, 401);
    const uid = u.user.id;

    const { data: prof } = await db.from("profiles").select("account_tier, staff_role, bonus_video_mins").eq("id", uid).maybeSingle();
    const tier = (["free", "pro", "club"].includes(prof?.account_tier) ? prof!.account_tier : "free") as keyof typeof PLANS;
    const plan = PLANS[tier];
    const bypass = STAFF_ROLES.includes(String(prof?.staff_role ?? ""));
    // El análisis de vídeo es de pago: plan Pro/Club o bono de minutos activo
    if (!bypass && tier === "free" && !(Number(prof?.bonus_video_mins) > 0)) {
      return json({ limitReached: true, error: "El análisis de vídeo por IA requiere Pro Player, Club & Scout o un bono de minutos." }, 429);
    }

    const body = await req.json();
    const systemPrompt = String(body.systemPrompt ?? "").slice(0, MAX_PROMPT);
    const userPrompt = String(body.userPrompt ?? "").slice(0, 1500);
    const frames: string[] = (Array.isArray(body.framesBase64) ? body.framesBase64 : []).slice(0, MAX_FRAMES)
      .map((f: unknown) => String(f ?? "")).filter((f: string) => f.length > 100 && f.length < MAX_FRAME_B64);
    if (!systemPrompt.trim() || !frames.length) return json({ error: "vacio" }, 400);

    const budget = plan.price > 0 ? +(plan.price * AI_SHARE).toFixed(2) : 0.35;
    const { data: rsv, error: rerr } = await db.rpc("kinet_ai_reserve", {
      p_user: uid, p_kind: "chat", p_daily: plan.daily, p_lite: plan.lite, p_aux: plan.aux,
      p_budget: budget, p_cost_strong: plan.cost, p_cost_lite: plan.cost, p_bypass: bypass,
    });
    if (rerr) return json({ error: "sin-tablas", detail: "Ejecuta supabase/05_ia_limites.sql" }, 500);
    if (rsv.engine === "denied") return json({ limitReached: true, error: "limite", reply: "Has alcanzado tu límite de consultas de IA de hoy. Se reinicia a las 00:00 h." }, 429);
    reserved = { uid, kind: "chat", engine: rsv.engine, cost: rsv.cost };

    const key = Deno.env.get("GEMINI_API_KEY");
    if (!key) throw new Error("falta clave de IA");
    const parts: Record<string, unknown>[] = frames.map((f) => ({
      inline_data: { mime_type: f.startsWith("data:") ? f.slice(5, f.indexOf(";")) || "image/jpeg" : "image/jpeg", data: f.includes(",") ? f.split(",")[1] : f },
    }));
    parts.push({ text: userPrompt || "Analiza estos fotogramas." });

    let parsed: Record<string, unknown> | null = null;
    for (const m of MODELS) {
      for (let attempt = 0; attempt < 2 && !parsed; attempt++) {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
          method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] }, contents: [{ role: "user", parts }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 1800, responseMimeType: "application/json" },
          }),
        });
        if (!r.ok) {
          let msg = ""; try { msg = String((await r.json())?.error?.message ?? "").slice(0, 120); } catch (_) { /* nada */ }
          errors.push(`${m}: HTTP ${r.status} ${msg}`);
          if ([429, 500, 502, 503, 504].includes(r.status) && attempt === 0) { await new Promise((s) => setTimeout(s, 900)); continue; }
          break;
        }
        const d = await r.json();
        const text = (d?.candidates?.[0]?.content?.parts ?? []).filter((p: { thought?: boolean; text?: string }) => !p.thought && typeof p.text === "string").map((p: { text: string }) => p.text).join("").replace(/```json|```/g, "").trim();
        try { parsed = JSON.parse(text); } catch (_) { errors.push(`${m}: JSON no válido`); }
      }
      if (parsed) break;
    }
    if (!parsed) throw new Error("sin-respuesta");
    reserved = null;
    return json({ ok: true, framesAnalyzed: frames.length, ...parsed });
  } catch (_e) {
    if (reserved) { try { await db.rpc("kinet_ai_refund", { p_user: reserved.uid, p_kind: reserved.kind, p_engine: reserved.engine, p_cost: reserved.cost }); } catch (_) { /* nada */ } }
    const msg = String((_e as Error)?.message ?? _e);
    console.error("kinet-vision-lab:", msg, errors.join(" | "));
    return json({ error: "ia-no-disponible", code: msg === "falta clave de IA" ? "sin-clave" : "proveedor", detail: errors.length ? errors.join(" | ") : msg.slice(0, 200) }, 502);
  }
});
