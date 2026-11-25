// KINET OS · Vídeo en Cloudflare R2 (10 GB gratis, descargas sin coste).
// Una sola función con dos acciones:
//   { contentType, size }                  -> devuelve una URL firmada para SUBIR (PUT) un clip y su URL pública
//   { action: "delete", key | url }        -> borra un clip propio de R2 (y lo marca en video_uploads)
//   { action: "delete-all" }               -> borra todos los clips del usuario (para borrado de cuenta)
// Despliegue:  supabase functions deploy video-upload-url
// Secretos:    R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE (p. ej. https://videos.kinetos.es)
// Solo usuarios con sesión. Cuotas por plan en el servidor (el cliente no puede cambiarlas).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AwsClient } from "https://esm.sh/aws4fetch@1.0.20";

const ALLOWED_ORIGINS = ["https://kinetos.es", "https://www.kinetos.es", "http://localhost:8000", "http://127.0.0.1:8000"];
function cors(req: Request) {
  const o = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(o) ? o : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

const MAX_BYTES = 8 * 1024 * 1024; // por clip
// Cuotas por plan: subidas al día y almacenamiento total en bytes.
const QUOTA: Record<string, { perDay: number; totalBytes: number }> = {
  free: { perDay: 3, totalBytes: 100 * 1024 * 1024 },
  pro: { perDay: 10, totalBytes: 1024 * 1024 * 1024 },
  club: { perDay: 30, totalBytes: 5 * 1024 * 1024 * 1024 },
};

Deno.serve(async (req) => {
  const C = cors(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: C });
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...C, "Content-Type": "application/json" } });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: u } = await sb.auth.getUser();
    if (!u?.user) return json({ error: "sin-sesion" }, 401);
    const uid = u.user.id;

    const body = await req.json().catch(() => ({}));
    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const acc = Deno.env.get("R2_ACCOUNT_ID")!;
    const bucket = Deno.env.get("R2_BUCKET")!;
    const base = (Deno.env.get("R2_PUBLIC_BASE") ?? "").replace(/\/$/, "");
    const r2 = new AwsClient({ accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID")!, secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY")!, service: "s3", region: "auto" });
    const objUrl = (key: string) => `https://${acc}.r2.cloudflarestorage.com/${bucket}/${key}`;

    // ───────── BORRAR ─────────
    if (body.action === "delete" || body.action === "delete-all") {
      let keys: string[] = [];
      if (body.action === "delete-all") {
        const all = await db.from("video_uploads").select("key").eq("user_id", uid).is("deleted_at", null);
        keys = (all.data ?? []).map((r: { key: string }) => r.key).filter(Boolean);
      } else {
        let key = String(body.key ?? "");
        if (!key && body.url) key = String(body.url).replace(base + "/", "");
        // Solo se pueden borrar clips propios: la clave siempre empieza por el id del usuario.
        if (!key.startsWith(uid + "/") || key.includes("..")) return json({ error: "no-permitido" }, 403);
        keys = [key];
      }
      let deleted = 0;
      for (const key of keys) {
        const r = await r2.fetch(objUrl(key), { method: "DELETE" });
        if (r.ok || r.status === 404) {
          deleted++;
          await db.from("video_uploads").update({ deleted_at: new Date().toISOString() }).eq("user_id", uid).eq("key", key);
        }
      }
      return json({ ok: true, deleted });
    }

    // ───────── SUBIR ─────────
    const { contentType, size } = body;
    if (!/^video\/(webm|mp4)$/.test(contentType)) return json({ error: "formato" }, 400);
    if (!(size > 0) || size > MAX_BYTES) return json({ error: "tamano" }, 400);

    // Plan real leído del servidor (no del navegador)
    const prof = await db.from("profiles").select("account_tier").eq("id", uid).maybeSingle();
    const tier = ["free", "pro", "club"].includes(prof.data?.account_tier) ? prof.data.account_tier : "free";
    const quota = QUOTA[tier];

    const since = new Date(Date.now() - 86400000).toISOString();
    const day = await db.from("video_uploads").select("id", { count: "exact", head: true }).eq("user_id", uid).is("deleted_at", null).gte("created_at", since);
    if (!day.error && (day.count ?? 0) >= quota.perDay) return json({ error: "limite-diario", tier }, 429);

    const mine = await db.from("video_uploads").select("bytes").eq("user_id", uid).is("deleted_at", null);
    if (!mine.error) {
      const used = (mine.data ?? []).reduce((s: number, r: { bytes: number }) => s + (r.bytes || 0), 0);
      if (used + size > quota.totalBytes) return json({ error: "cuota-llena", tier, usedBytes: used, limitBytes: quota.totalBytes }, 413);
    }

    const ext = contentType.includes("mp4") ? "mp4" : "webm";
    const key = `${uid}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const url = new URL(objUrl(key));
    url.searchParams.set("X-Amz-Expires", "300");
    const signed = await r2.sign(new Request(url, { method: "PUT", headers: { "Content-Type": contentType } }), { aws: { signQuery: true } });

    await db.from("video_uploads").insert({ user_id: uid, key, bytes: size });
    return json({ uploadUrl: signed.url, publicUrl: `${base}/${key}`, key });
  } catch (_e) {
    return json({ error: "error" }, 500);
  }
});
