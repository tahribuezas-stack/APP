// Webhook de Stripe: es lo ÚNICO que concede planes y minutos bonus.
// Despliegue: supabase functions deploy stripe-webhook --no-verify-jwt
// Secretos: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PRICE_PRO, PRICE_CLUB, PRICE_PRO_YEAR, PRICE_CLUB_YEAR
//           (cada uno admite varios price_ separados por comas, p. ej. los precios antiguos de quien ya estaba suscrito),
//           BONUS_PRICES='{"price_xxx":15,"price_yyy":60}'  (price id -> minutos)
import Stripe from "https://esm.sh/stripe@14?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const clean = (v?: string | null) => (v ?? "").trim().replace(/^["']|["']$/g, "");   // quita espacios y comillas pegadas por error
const stripe = new Stripe(clean(Deno.env.get("STRIPE_SECRET_KEY")), { apiVersion: "2023-10-16" });
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  const whsec = clean(Deno.env.get("STRIPE_WEBHOOK_SECRET"));
  // Diagnóstico claro en Logs (nunca se escribe el secreto)
  if (!whsec) { console.error("FALTA el secreto STRIPE_WEBHOOK_SECRET"); return new Response("Falta STRIPE_WEBHOOK_SECRET", { status: 500 }); }
  if (!whsec.startsWith("whsec_")) { console.error("STRIPE_WEBHOOK_SECRET no empieza por whsec_ (copiaste otra clave)"); return new Response("STRIPE_WEBHOOK_SECRET incorrecto", { status: 500 }); }
  if (!sig) { console.error("Petición sin cabecera stripe-signature (no viene de Stripe)"); return new Response("Sin firma", { status: 400 }); }
  console.log("Webhook recibido de Stripe, comprobando firma…");
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, whsec, undefined, cryptoProvider);
  } catch (e) {
    console.error(`Firma no válida. whsec guardado: empieza por ${whsec.slice(0, 10)}… y mide ${whsec.length} caracteres (uno real mide ~38). Cabecera de Stripe recibida: ${sig.slice(0, 24)}… Detalle: ${(e as Error).message}`);
    return new Response("Firma no válida", { status: 400 });
  }

  console.log("Firma OK. Evento:", event.type);
  const seen = await db.from("stripe_events").insert({ id: event.id });
  if (seen.error) {
    if (!/duplicate|unique|23505/i.test(seen.error.message + (seen.error.code ?? ""))) {
      console.error("Tabla stripe_events:", seen.error.message);   // "relation does not exist" → falta ejecutar 01_seguridad.sql
      return new Response("error de base de datos", { status: 500 });   // 500 para que Stripe reintente en vez de perder el pago
    }
    return new Response("ya procesado", { status: 200 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const uid = s.client_reference_id;
    if (!uid || s.payment_status === "unpaid") return new Response("sin usuario", { status: 200 });
    const items = await stripe.checkout.sessions.listLineItems(s.id);
    const priceIds = items.data.map((i) => i.price?.id).filter(Boolean) as string[];
    const bonusMap = JSON.parse(Deno.env.get("BONUS_PRICES") || "{}");
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (s.customer) patch.stripe_customer_id = String(s.customer);

    const ids = (...names: string[]) => names.flatMap((n) => (Deno.env.get(n) || "").split(",").map((x) => x.trim()).filter(Boolean));
    const clubIds = ids("PRICE_CLUB", "PRICE_CLUB_YEAR"), proIds = ids("PRICE_PRO", "PRICE_PRO_YEAR");
    if (priceIds.some((p) => clubIds.includes(p))) patch.account_tier = "club";
    else if (priceIds.some((p) => proIds.includes(p))) patch.account_tier = "pro";

    const mins = priceIds.reduce((t, p) => t + (Number(bonusMap[p]) || 0), 0);
    if (mins > 0) {
      const { data } = await db.from("profiles").select("bonus_video_mins").eq("id", uid).single();
      patch.bonus_video_mins = Math.min(595, (Number(data?.bonus_video_mins) || 0) + mins);
    }
    await db.from("profiles").update(patch).eq("id", uid);
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    await db.from("profiles").update({ account_tier: "free", updated_at: new Date().toISOString() }).eq("stripe_customer_id", String(sub.customer));
  }
  return new Response("ok", { status: 200 });
});
