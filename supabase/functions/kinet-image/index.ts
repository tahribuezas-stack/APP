// KINET OS · Generación y edición de imágenes con IA en el SERVIDOR. La clave de Google vive AQUÍ (secreto), nunca en el navegador.
// El navegador solo manda: prompt, foto (si edita), proporción. El servidor comprueba plan, cupo diario y presupuesto mensual.
//
// Despliegue:  supabase functions deploy kinet-image
// Secretos:    supabase secrets set GEMINI_API_KEY=AIza...        (el mismo que usa kinet-ai-chat; si ya lo pusiste, no repitas)
//              opcional: IMAGE_MODELS="gemini-nano-banana-2.1,gemini-3.1-flash-image,gemini-3.1-flash-lite-image"
// SQL previo:  supabase/11_imagenes.sql
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const STAFF_ROLES = ["superadmin", "admin", "subadmin"];
const AI_SHARE = 0.20, IMAGE_CEILING = 0.75;   // mismas reglas que kinet-api-config.js: las imágenes pueden gastar hasta el 75 % del 20 % del precio
// Mismos límites que PLAN_LIMITS.dailyImageGenerations del cliente
const PLANS: Record<string, { price: number; daily: number; freeBudget: number }> = {
  free: { price: 0, daily: 0, freeBudget: 0 },
  pro: { price: 11.99, daily: 2, freeBudget: 0 },
  club: { price: 39.99, daily: 4, freeBudget: 0 },
};
const MODELS = (Deno.env.get("IMAGE_MODELS") ?? "gemini-nano-banana-2.1,gemini-3.1-flash-image,gemini-3.1-flash-lite-image").split(",").map((s) => s.trim()).filter(Boolean);
const MODEL_EUR: Record<string, number> = { "gemini-nano-banana-2.1": 0.034, "gemini-3.1-flash-image": 0.065, "gemini-3.1-flash-lite-image": 0.034 };
const MAX_PROMPT = 700, MAX_IMAGE_B64 = 3_500_000;
const ASPECTS = ["1:1", "4:5", "5:4", "3:4", "4:3", "9:16", "16:9", "2:3", "3:2"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let reserved: { uid: string; cost: number } | null = null;
  const errors: string[] = [];
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: u } = await sb.auth.getUser();
    if (!u?.user) return json({ error: "sin-sesion" }, 401);
    const uid = u.user.id;

    const { data: prof } = await db.from("profiles").select("account_tier, staff_role").eq("id", uid).maybeSingle();
    const tier = (["free", "pro", "club"].includes(prof?.account_tier) ? prof!.account_tier : "free") as keyof typeof PLANS;
    const plan = PLANS[tier];
    const bypass = STAFF_ROLES.includes(String(prof?.staff_role ?? ""));

    const body = await req.json();
    const clean = String(body.prompt ?? "").trim().slice(0, MAX_PROMPT);
    const style = String(body.style ?? "").trim().slice(0, 160);
    const aspect = ASPECTS.includes(String(body.aspect)) ? String(body.aspect) : "1:1";
    const img = String(body.imageDataUrl ?? "");
    const isEdit = img.startsWith("data:image/") && img.includes(",") && img.length < MAX_IMAGE_B64;
    if (!clean && !isEdit) return json({ error: "vacio" }, 400);

    if (!bypass && plan.daily <= 0) return json({ limitReached: true, error: "Las imágenes con IA se incluyen en Pro Player y Club & Scout Pro. Con el plan gratis tienes los filtros y plantillas sin IA." }, 429);

    // Reserva atómica: cupo diario + presupuesto mensual de imágenes
    const budget = plan.price > 0 ? +(plan.price * AI_SHARE * IMAGE_CEILING).toFixed(2) : 0;
    const estimate = isEdit ? 0.07 : 0.07;   // peor caso (modelo más caro); luego se sustituye por el coste real del modelo que respondió
    const { data: r, error: rerr } = await db.rpc("kinet_img_reserve", { p_user: uid, p_limit: plan.daily, p_budget: budget, p_cost: estimate, p_bypass: bypass });
    if (rerr) return json({ error: "sin-tablas", detail: "Ejecuta supabase/11_imagenes.sql" }, 500);
    if (r?.denied) {
      return json({ limitReached: true, error: r.reason === "budget" ? "Has alcanzado el presupuesto de imágenes IA de este mes. Se renueva el día 1." : `Has alcanzado tu límite de ${plan.daily} imágenes al día. Se renueva a las 00:00 h.` }, 429);
    }
    reserved = { uid, cost: estimate };

    const key = Deno.env.get("GEMINI_API_KEY");
    if (!key) throw new Error("falta clave de IA");

    const instr = isEdit
      ? `You are a professional photo retoucher. Edit ONLY what the request asks for and leave everything else pixel-faithful to the attached photo. Request: ${clean || "professional retouch"}. ${style ? style + ". " : ""}\nSTRICT IDENTITY RULES: this is a real person. Keep the exact same face, facial features, skin tone, hair, expression, body proportions, pose, kit and camera framing. Do not beautify, slim, age, reshape or redraw the face. Do not change the number of people, hands or limbs. Only change lighting, colour grade, background or atmosphere as requested. Natural photorealistic result, no plastic skin. Do NOT add any text, letters, numbers, logos or watermarks.`
      : `${clean}. ${style ? style + ". " : ""}Render exactly the subject described as a real professional sports photograph: natural anatomy and proportions, realistic faces, correct hands with five fingers, accurate sports kit and equipment, sharp focus, natural skin texture, no distortions, no extra limbs, no warped faces. Do NOT add any text, letters, numbers, logos or watermarks anywhere in the image.`;
    const parts: Record<string, unknown>[] = [];
    if (isEdit) parts.push({ inline_data: { mime_type: img.slice(5, img.indexOf(";")) || "image/jpeg", data: img.split(",")[1] } });
    parts.push({ text: instr });

    let result: { dataUrl: string; model: string } | null = null;
    for (const m of MODELS) {
      for (const withAspect of (isEdit ? [false] : [true, false])) {
        const gen: Record<string, unknown> = { responseModalities: ["IMAGE"] };
        if (withAspect) gen.imageConfig = { aspectRatio: aspect };
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent`, {
          method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({ contents: [{ parts }], generationConfig: gen }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          errors.push(`[${m}] HTTP ${res.status} ${String(data?.error?.message ?? "").slice(0, 120)}`);
          if (res.status === 400 && withAspect) continue;
          break;
        }
        const cp = data?.candidates?.[0]?.content?.parts ?? [];
        const p = cp.find((x: Record<string, unknown>) => x.inlineData || x.inline_data) as Record<string, Record<string, string>> | undefined;
        const d = p && (p.inlineData || p.inline_data);
        if (d?.data) { result = { dataUrl: `data:${d.mimeType || d.mime_type || "image/png"};base64,${d.data}`, model: m }; break; }
        errors.push(`[${m}] sin imagen (${data?.candidates?.[0]?.finishReason ?? "?"})`);
        break;
      }
      if (result) break;
    }
    if (!result) throw new Error("sin-imagen");

    const real = (MODEL_EUR[result.model] ?? 0.05) + (isEdit ? 0.004 : 0.002);
    try { await db.rpc("kinet_img_settle", { p_user: uid, p_estimated: estimate, p_actual: +real.toFixed(5) }); } catch (_) { /* nada */ }
    reserved = null;
    return json({ ok: true, dataUrl: result.dataUrl, model: result.model, costEur: real });
  } catch (_e) {
    if (reserved) { try { await db.rpc("kinet_img_refund", { p_user: reserved.uid, p_cost: reserved.cost }); } catch (_) { /* nada */ } }
    const msg = String((_e as Error)?.message ?? _e);
    console.error("kinet-image:", msg, errors.join(" | "));
    return json({ error: "ia-no-disponible", code: msg === "falta clave de IA" ? "sin-clave" : msg === "sin-imagen" ? "proveedor" : "interno", detail: errors.length ? errors.join(" | ") : msg.slice(0, 200) }, 502);
  }
});
