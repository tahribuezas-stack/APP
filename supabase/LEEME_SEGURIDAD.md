# Puesta en marcha (en este orden)
1. Sube el código nuevo de la app (ya usa la sesión real de Supabase).
2. Supabase → SQL Editor → pega y ejecuta `01_seguridad.sql`. Después ejecuta el bloque comentado del primer superadmin con tu correo.
3. `supabase functions deploy stripe-webhook --no-verify-jwt` y añade los secretos indicados en `index.ts`.
4. Stripe → Developers → Webhooks → URL de la función; eventos: `checkout.session.completed` y `customer.subscription.deleted`.
5. En tus Payment Links pon como URL de éxito `https://TU-DOMINIO/despacho.html?checkout=success`.
6. **Revoca la clave de Gemini antigua**: aistudio.google.com → API keys → eliminar. Con eso queda inutilizada aunque siga en el historial de git.

Qué queda protegido: plan, minutos bonus, rango de staff y perfiles ajenos. Qué NO: el consumo mensual de minutos sigue contándose en el navegador; para blindarlo hay que mover las llamadas a la IA a una Edge Function.
