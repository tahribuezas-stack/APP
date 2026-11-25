-- KINET OS · Coste de IA REAL (medido por tokens) en lugar de una estimación fija por consulta.
-- Ejecutar una vez en Supabase → SQL Editor. Después, volver a desplegar la función `kinet-ai-chat` (supabase/functions/kinet-ai-chat/index.ts).
-- Hasta que se despliegue, todo sigue funcionando con la estimación anterior.

alter table public.ai_usage add column if not exists tokens_in  bigint not null default 0;
alter table public.ai_usage add column if not exists tokens_out bigint not null default 0;
alter table public.ai_usage add column if not exists real_calls int    not null default 0;   -- consultas cuyo coste ya es medido, no estimado

-- La llama solo la Edge Function (service role) al terminar cada consulta: cambia el coste estimado por el real.
create or replace function public.kinet_ai_settle(p_user uuid, p_estimated numeric, p_actual numeric, p_in int, p_out int)
returns void language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'Europe/Madrid')::date;
begin
  update public.ai_usage set
    cost_eur   = greatest(0, cost_eur - coalesce(p_estimated, 0) + coalesce(p_actual, 0)),
    tokens_in  = tokens_in  + greatest(0, coalesce(p_in, 0)),
    tokens_out = tokens_out + greatest(0, coalesce(p_out, 0)),
    real_calls = real_calls + 1
  where user_id = p_user and day = d;
end $$;
revoke all on function public.kinet_ai_settle(uuid, numeric, numeric, int, int) from public, anon, authenticated;
