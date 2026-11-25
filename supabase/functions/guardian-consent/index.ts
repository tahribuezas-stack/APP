// KINET OS · Verificación del tutor legal de un menor (14-17 años) por correo.
//  POST  (con la sesión del menor)   → envía un correo al tutor con un enlace de confirmación de un solo uso (caduca en 7 días).
//  GET ?token=...                    → el tutor pulsa el enlace: la cuenta pasa a guardian_status = 'verified'.
//
// Despliegue:  supabase functions deploy guardian-consent --no-verify-jwt   (la verificación del POST se hace dentro)
// Secretos:    RESEND_API_KEY (resend.com, plan gratuito 3.000 correos/mes), MAIL_FROM (p. ej. "KINET OS <no-responder@kinetos.es>"; para pruebas "onboarding@resend.dev"),
//              APP_URL (p. ej. https://kinetos.es)
// SQL previo:  supabase/04_menores.sql
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const enc = new TextEncoder();
const sha = async (s: string) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(s)))).map((b) => b.toString(16).padStart(2, "0")).join("");
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const page = (title: string, msg: string, status = 200) => new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><body style="margin:0;background:#04060A;color:#E2E8F0;font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:20px"><div style="max-width:460px;border:1px solid #00FF88;border-radius:16px;padding:24px"><h1 style="font-size:18px;color:#00FF88;margin:0 0 10px">${esc(title)}</h1><p style="line-height:1.5;font-size:14px;margin:0">${esc(msg)}</p></div>`, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const url = new URL(req.url);

  // --- El tutor confirma ---
  if (req.method === "GET") {
    const token = url.searchParams.get("token") ?? "";
    if (token.length < 30) return page("Enlace no válido", "Este enlace no es correcto. Pide a tu hijo/a que reenvíe la solicitud desde KINET OS.", 400);
    const h = await sha(token);
    const { data: t } = await db.from("guardian_tokens").select("*").eq("token_hash", h).maybeSingle();
    if (!t || t.used_at || new Date(t.expires_at) < new Date()) return page("Enlace caducado", "Este enlace ya se usó o ha caducado. Pide que reenvíen la solicitud desde KINET OS.", 410);
    await db.from("guardian_tokens").update({ used_at: new Date().toISOString() }).eq("id", t.id);
    await db.from("profiles").update({ guardian_status: "verified", guardian_email: t.email }).eq("id", t.user_id);   // service role: permitido por el trigger
    return page("Autorización confirmada", "Gracias. Has confirmado que has leído y autorizas el uso de KINET OS por parte del menor a tu cargo. Puedes retirar tu autorización o ejercer tus derechos escribiendo a soporte.");
  }

  // --- El menor pide que se envíe el correo ---
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
    const { data: u } = await sb.auth.getUser();
    if (!u?.user) return json({ error: "sin-sesion" }, 401);
    const { guardianEmail, guardianName } = await req.json();
    if (!/^\S+@\S+\.\S+$/.test(String(guardianEmail ?? ""))) return json({ error: "correo" }, 400);

    const { data: p } = await db.from("profiles").select("is_minor, guardian_status, full_name").eq("id", u.user.id).maybeSingle();
    if (!p?.is_minor) return json({ error: "no-menor" }, 400);
    if (p.guardian_status === "verified") return json({ ok: true, status: "verified" });

    // Máx. 3 correos por cuenta y día (evita usar la función para enviar spam)
    const since = new Date(Date.now() - 86400000).toISOString();
    const q = await db.from("guardian_tokens").select("id", { count: "exact", head: true }).eq("user_id", u.user.id).gte("created_at", since);
    if ((q.count ?? 0) >= 3) return json({ error: "limite" }, 429);

    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    await db.from("guardian_tokens").insert({ user_id: u.user.id, token_hash: await sha(token), email: guardianEmail, expires_at: new Date(Date.now() + 7 * 86400000).toISOString() });
    const link = `${Deno.env.get("SUPABASE_URL")}/functions/v1/guardian-consent?token=${token}`;
    const kid = esc(p.full_name || "un menor");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: Deno.env.get("MAIL_FROM") ?? "KINET OS <onboarding@resend.dev>", to: [guardianEmail],
        subject: "Autorización para el uso de KINET OS por un menor",
        html: `<p>Hola ${esc(String(guardianName ?? ""))},</p><p><strong>${kid}</strong> se ha registrado en <strong>KINET OS</strong> (plataforma de rendimiento deportivo con inteligencia artificial) y te ha indicado como su madre, padre o tutor legal.</p>
<p>Al ser menor de 18 años necesitamos tu autorización. Revisa las <a href="${Deno.env.get("APP_URL") ?? "https://kinetos.es"}/legal.html#menores">Condiciones y la Política de privacidad</a> y, si estás de acuerdo, confirma aquí:</p>
<p><a href="${link}" style="background:#00FF88;color:#04060A;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:bold">Autorizo el uso de KINET OS</a></p>
<p style="color:#666;font-size:12px">El enlace caduca en 7 días. Si no conoces a esta persona o no quieres autorizarlo, ignora este correo: la cuenta quedará restringida.</p>`,
      }),
    });
    if (!res.ok) return json({ error: "envio" }, 502);
    return json({ ok: true, status: "pending" });
  } catch (_e) { return json({ error: "error" }, 500); }
});
