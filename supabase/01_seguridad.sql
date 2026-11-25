-- KINET OS · Seguridad de perfiles, plan y minutos.
-- ORDEN: 1) despliega el código nuevo  2) ejecuta este SQL  3) despliega la función stripe-webhook.

alter table public.profiles add column if not exists account_tier text not null default 'free';
alter table public.profiles add column if not exists bonus_video_mins numeric not null default 0;
alter table public.profiles add column if not exists staff_role text;
alter table public.profiles add column if not exists stripe_customer_id text;

create table if not exists public.stripe_events (id text primary key, created_at timestamptz default now());
alter table public.stripe_events enable row level security;   -- sin políticas: solo la función (service role)

alter table public.profiles enable row level security;
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
drop policy if exists profiles_delete on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (true);
create policy profiles_insert on public.profiles for insert to authenticated with check (auth.uid()::text = id::text);
create policy profiles_update on public.profiles for update to authenticated using (auth.uid()::text = id::text) with check (auth.uid()::text = id::text);
create policy profiles_delete on public.profiles for delete to authenticated using (auth.uid()::text = id::text);

-- El usuario NUNCA puede cambiar su plan, su rango ni subirse minutos (solo gastarlos).
create or replace function public.kinet_protect_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') = 'service_role' or current_setting('kinet.admin_override', true) = 'on' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.account_tier := 'free'; new.bonus_video_mins := 0; new.staff_role := null; new.stripe_customer_id := null;
  else
    new.account_tier := old.account_tier; new.staff_role := old.staff_role; new.stripe_customer_id := old.stripe_customer_id;
    if new.bonus_video_mins > old.bonus_video_mins then new.bonus_video_mins := old.bonus_video_mins; end if;
  end if;
  return new;
end $$;
drop trigger if exists kinet_protect_profile on public.profiles;
create trigger kinet_protect_profile before insert or update on public.profiles
for each row execute function public.kinet_protect_profile();

-- Crea el perfil automáticamente al registrarse (funciona aunque Supabase exija confirmar el correo).
create or replace function public.kinet_handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, handle)
  values (new.id, lower(new.email), coalesce(new.raw_user_meta_data->>'full_name',''), new.raw_user_meta_data->>'handle')
  on conflict do nothing;
  return new;
end $$;
drop trigger if exists kinet_on_auth_user_created on auth.users;
create trigger kinet_on_auth_user_created after insert on auth.users
for each row execute function public.kinet_handle_new_user();

-- Login por @usuario sin dejar la tabla abierta a usuarios anónimos.
create or replace function public.email_from_handle(h text) returns text
language sql security definer set search_path = public stable as $$
  select email from public.profiles where lower(handle) = lower(h) limit 1
$$;
grant execute on function public.email_from_handle(text) to anon, authenticated;

-- Panel de staff: la validación del rango se hace aquí, en el servidor.
create or replace function public.admin_update_user(target text, tier text default null, bonus numeric default null, staff text default null)
returns void language plpgsql security definer set search_path = public as $$
declare me text;
begin
  select staff_role into me from public.profiles where id::text = auth.uid()::text;
  if coalesce(me,'') not in ('superadmin','admin','subadmin') then raise exception 'Acceso denegado'; end if;
  if staff = 'superadmin' and coalesce(me,'') not in ('superadmin','admin') then raise exception 'Solo el jefe puede dar superadmin'; end if;
  if tier is not null and tier not in ('free','pro','club') then raise exception 'Plan no válido'; end if;
  perform set_config('kinet.admin_override', 'on', true);
  update public.profiles set
    account_tier = coalesce(tier, account_tier),
    bonus_video_mins = least(595, greatest(0, coalesce(bonus, bonus_video_mins))),
    staff_role = case when staff is null then staff_role when staff = '' then null else staff end,
    updated_at = now()
  where lower(email) = lower(target)
     or lower(handle) = lower(case when target like '@%' then target else '@' || target end);
end $$;
revoke all on function public.admin_update_user(text, text, numeric, text) from public, anon;
grant execute on function public.admin_update_user(text, text, numeric, text) to authenticated;

-- PRIMER SUPERADMIN (ejecútalo tú, una vez, cambiando el correo):
-- begin;
-- select set_config('kinet.admin_override','on',true);
-- update public.profiles set staff_role = 'superadmin' where lower(email) = lower('TU_CORREO@ejemplo.com');
-- commit;
