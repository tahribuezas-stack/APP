-- KINET OS · Límites de IA y presupuesto (20 % del precio) calculados en el SERVIDOR.
-- Ejecutar una vez en Supabase → SQL Editor. Después: desplegar la función `kinet-ai-chat` (ver LEEME_IA_Y_MENORES.md).

create table if not exists public.ai_usage (
  user_id  uuid not null,
  day      date not null,                       -- día en horario de Madrid (se renueva a las 00:00 h)
  strong   int  not null default 0,             -- consultas con el motor potente
  lite     int  not null default 0,             -- consultas con el motor básico
  aux      int  not null default 0,             -- asistentes auxiliares (comunidad, soporte, táctica)
  cost_eur numeric not null default 0,         -- coste estimado acumulado del día
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;
drop policy if exists ai_usage_own on public.ai_usage;
create policy ai_usage_own on public.ai_usage for select to authenticated using (auth.uid() = user_id);   -- solo lectura de lo propio

-- Reserva ATÓMICA de una consulta. Solo la llama la Edge Function (service role).
create or replace function public.kinet_ai_reserve(
  p_user uuid, p_kind text, p_daily int, p_lite int, p_aux int, p_budget numeric,
  p_cost_strong numeric, p_cost_lite numeric, p_bypass boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  d date := (now() at time zone 'Europe/Madrid')::date;
  r public.ai_usage; month_spend numeric; eng text := 'denied'; c numeric := 0;
begin
  insert into public.ai_usage(user_id, day) values (p_user, d) on conflict do nothing;
  select * into r from public.ai_usage where user_id = p_user and day = d for update;
  select coalesce(sum(cost_eur), 0) into month_spend from public.ai_usage
    where user_id = p_user and day >= date_trunc('month', d)::date;

  if p_kind = 'chat' then
    if (r.strong < p_daily and month_spend + p_cost_strong <= p_budget) or p_bypass then eng := 'strong'; c := p_cost_strong;
    elsif r.lite < p_lite then eng := 'lite'; c := p_cost_lite; end if;
  else
    if r.aux < p_aux or p_bypass then eng := 'lite'; c := p_cost_lite; end if;
  end if;

  if eng <> 'denied' then
    update public.ai_usage set
      strong = strong + (case when eng = 'strong' then 1 else 0 end),
      lite   = lite   + (case when eng = 'lite' and p_kind = 'chat' then 1 else 0 end),
      aux    = aux    + (case when p_kind <> 'chat' then 1 else 0 end),
      cost_eur = cost_eur + c
    where user_id = p_user and day = d;
  end if;
  return jsonb_build_object('engine', eng, 'cost', c,
    'strong_used', r.strong + (case when eng = 'strong' then 1 else 0 end),
    'lite_used', r.lite + (case when eng = 'lite' and p_kind = 'chat' then 1 else 0 end),
    'month_spend', round(month_spend + c, 4), 'budget', p_budget,
    'budget_exhausted', (month_spend + c) >= p_budget);
end $$;
revoke all on function public.kinet_ai_reserve(uuid, text, int, int, int, numeric, numeric, numeric, boolean) from public, anon, authenticated;

-- Devuelve la consulta si el proveedor de IA falla (el usuario no paga un error)
create or replace function public.kinet_ai_refund(p_user uuid, p_kind text, p_engine text, p_cost numeric)
returns void language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'Europe/Madrid')::date;
begin
  update public.ai_usage set
    strong = greatest(0, strong - (case when p_engine = 'strong' then 1 else 0 end)),
    lite   = greatest(0, lite   - (case when p_engine = 'lite' and p_kind = 'chat' then 1 else 0 end)),
    aux    = greatest(0, aux    - (case when p_kind <> 'chat' then 1 else 0 end)),
    cost_eur = greatest(0, cost_eur - p_cost)
  where user_id = p_user and day = d;
end $$;
revoke all on function public.kinet_ai_refund(uuid, text, text, numeric) from public, anon, authenticated;
