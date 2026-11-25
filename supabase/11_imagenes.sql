-- KINET OS · Cupo y presupuesto de IMÁGENES en el servidor (lo usa la función kinet-image).
-- Ejecutar una vez en Supabase → SQL Editor. Después: supabase functions deploy kinet-image

create table if not exists public.img_usage (
  user_id  uuid not null,
  day      date not null,
  n        int  not null default 0,
  cost_eur numeric not null default 0,
  primary key (user_id, day)
);
alter table public.img_usage enable row level security;
drop policy if exists img_usage_own on public.img_usage;
create policy img_usage_own on public.img_usage for select to authenticated using (auth.uid() = user_id);

-- Reserva atómica: respeta el cupo diario y el presupuesto mensual de imágenes. Solo la llama la Edge Function (service role).
create or replace function public.kinet_img_reserve(p_user uuid, p_limit int, p_budget numeric, p_cost numeric, p_bypass boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'Europe/Madrid')::date; used int; spent numeric;
begin
  insert into public.img_usage (user_id, day) values (p_user, d) on conflict do nothing;
  select n into used from public.img_usage where user_id = p_user and day = d for update;
  if not p_bypass then
    if used >= p_limit then return jsonb_build_object('denied', true, 'reason', 'daily'); end if;
    select coalesce(sum(cost_eur), 0) into spent from public.img_usage where user_id = p_user and day >= date_trunc('month', d)::date;
    if spent + p_cost > p_budget then return jsonb_build_object('denied', true, 'reason', 'budget'); end if;
  end if;
  update public.img_usage set n = n + 1, cost_eur = cost_eur + p_cost where user_id = p_user and day = d;
  return jsonb_build_object('denied', false, 'used', used + 1);
end $$;

create or replace function public.kinet_img_settle(p_user uuid, p_estimated numeric, p_actual numeric) returns void
language sql security definer set search_path = public as $$
  update public.img_usage set cost_eur = greatest(0, cost_eur - p_estimated + p_actual)
  where user_id = p_user and day = (now() at time zone 'Europe/Madrid')::date;
$$;

-- Si Google falla, la imagen NO se descuenta
create or replace function public.kinet_img_refund(p_user uuid, p_cost numeric) returns void
language sql security definer set search_path = public as $$
  update public.img_usage set n = greatest(0, n - 1), cost_eur = greatest(0, cost_eur - p_cost)
  where user_id = p_user and day = (now() at time zone 'Europe/Madrid')::date;
$$;

revoke all on function public.kinet_img_reserve(uuid, int, numeric, numeric, boolean) from public, anon, authenticated;
revoke all on function public.kinet_img_settle(uuid, numeric, numeric) from public, anon, authenticated;
revoke all on function public.kinet_img_refund(uuid, numeric) from public, anon, authenticated;
