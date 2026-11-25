# v36 · Dos motores de IA y precios nuevos

## Planes y límites (todo al día, se reinicia a las 00:00 h)
| | Gratis | Pro | Club & Scout |
|---|---|---|---|
| Precio | 0 € | 11,99 €/mes · 129 €/año | 39,99 €/mes · 399 €/año |
| Consultas con motor FUERTE (Gemini 2.5 Flash) | 0 | 12 | 35 |
| Consultas con motor BÁSICO (Gemini 2.5 Flash-Lite), cuando se agota el fuerte | 8 | 28 | 65 |
| Total de consultas al día | 8 | 40 | 100 |
| Soporte / comunidad / táctica (al día) | 5 / 5 / 3 | 15 / 10 / 10 | 30 / 20 / 25 |
| Vídeo IA | bonos | 90 min/mes | 300 min/mes |

Presupuesto de chat al mes = 20 % del precio con IVA (Pro 2,40 €, Club 8,00 €); gratis 0,35 €.
Techo duro = 1,15 × ese presupuesto (también en gratis). Cuando se agota el presupuesto del motor fuerte, el usuario sigue con el básico hasta su límite diario; solo se corta en el techo duro.
Coste real esperado por usuario (30 % del cupo): gratis 0,10 € · Pro 0,98 € · Club 3,14 €. Detalle en la hoja "Reparto 20 %" de "Presupuesto IA KINET".

## Qué tienes que hacer tú
1. **Redesplegar la función de IA**: `supabase functions deploy kinet-ai-chat`. No hace falta ningún SQL nuevo (si aún no lo hiciste: 05_ia_limites.sql y 09_ia_coste_real.sql).
2. **Secretos**: revisa `supabase secrets list`. Si tienes `GEMINI_MODEL_PRO`, `GEMINI_MODEL_FREE` o `GEMINI_MODEL_LITE` con un modelo caro o mal escrito, bórralos (`supabase secrets unset NOMBRE`). Sin ellos: fuerte = gemini-2.5-flash, básico = gemini-2.5-flash-lite.
3. **Probar la IA**: abre `estado.html` con tu sesión y pulsa «3 · Probar la IA ahora». Si falla, muestra el motivo exacto (clave rechazada, cuota de Google, modelo, tablas sin crear…).
4. **Stripe (modo test)** — los precios de Stripe no se pueden editar, hay que crear nuevos:
   - Producto Pro: precio recurrente 11,99 €/mes y otro de 129 €/año. Producto Club: 39,99 €/mes y 399 €/año.
   - Crea un Payment Link para cada uno de los 4 precios.
   - Pega los 4 enlaces en `kinet-api-config.js` → `stripeLinks`: `plan_pro`, `plan_pro_year`, `plan_club`, `plan_club_year`. (Conserva los de los bonos.)
   - En Supabase → secretos del webhook: `PRICE_PRO`, `PRICE_PRO_YEAR`, `PRICE_CLUB`, `PRICE_CLUB_YEAR` con los `price_...` nuevos. Cada uno admite varios separados por coma (puedes añadir los antiguos 8,99 / 29,99 para quien ya está suscrito).
   - Redesplegar: `supabase functions deploy stripe-webhook --no-verify-jwt`.
5. Quien ya pague 8,99 o 29,99 sigue pagando eso hasta que cambies su suscripción en Stripe; la web ya enseña los precios nuevos.

## Claude Haiku 5.5 (opcional, cuando tengas saldo en Anthropic)
`supabase secrets set ANTHROPIC_API_KEY=sk-ant-... CLAUDE_MODEL_PRO=claude-haiku-5-5` y redesplegar. El motor fuerte de Pro/Club pasa a Haiku 5.5 con Gemini 2.5 Flash como respaldo. Para volver, borra el secreto CLAUDE_MODEL_PRO.

## Imágenes
Hoy las genera el propio navegador con la clave del usuario, así que no te cuestan nada. Si algún día las generas desde el servidor (≈6 cts cada una), hay que añadir un tope mensual (8 Pro / 40 Club en el presupuesto) antes de activarlas.

## Medidor de uso de IA (kinet-usage.js)
Tarjeta «Uso de IA · hoy» en la barra lateral de la app, franja «IA HOY» encima de la caja del chat y un panel de detalle (potente, básico, asistentes, imágenes, vídeo y cuenta atrás hasta las 00:00 h). Se calcula con los contadores del dispositivo; el servidor aplica el límite definitivo. No aparece a invitados.
