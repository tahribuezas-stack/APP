-- KINET OS · Protección de menores en el SERVIDOR (no se puede saltar desde el navegador).
-- Ejecutar una vez en Supabase → SQL Editor, después de 01_seguridad.sql.
--
-- Qué hace:
--  1) Guarda en `profiles` si la cuenta es de un menor (se rellena desde user_state/consents).
--  2) Impide que una cuenta ADULTA envíe mensajes directos a un menor.
--  3) Impide que un menor escriba a cuentas de ojeador/staff adultas (lo gestiona su tutor).
--  4) Marca como "pendiente" el consentimiento del tutor (para verificarlo por correo: ver functions/guardian-consent).

alter table public.profiles add column if not exists is_minor boolean not null default false;
alter table public.profiles add column if not exists birthdate date;
alter table public.profiles add column if not exists guardian_status text not null default 'none';   -- none | pending | verified
alter table public.profiles add column if not exists guardian_email text;

-- Calcula is_minor en el servidor a partir de la fecha de nacimiento (el usuario no puede decir "soy adulto" sin fecha).
create or replace function public.kinet_sync_minor() returns trigger
language plpgsql security definer set search_path = public as $$
declare bd date; us jsonb;
begin
  us := coalesce(new.user_state, '{}'::jsonb);
  begin bd := nullif(us->>'kinet_user_birthdate','')::date; exception when others then bd := null; end;
  if bd is not null then new.birthdate := bd; end if;
  if new.birthdate is not null then
    new.is_minor := (date_part('year', age(new.birthdate)) < 18);
  elsif (us->>'kinet_minor_protection') = 'true' then
    new.is_minor := true;
  end if;
  -- el usuario no puede marcarse como verificado: solo la función guardian-consent (service role)
  if coalesce(auth.role(),'') <> 'service_role' then
    if tg_op = 'UPDATE' then new.guardian_status := old.guardian_status;
    else new.guardian_status := case when new.is_minor then 'pending' else 'none' end; end if;
    if new.is_minor and new.guardian_status = 'none' then new.guardian_status := 'pending'; end if;
  end if;
  return new;
end $$;
drop trigger if exists kinet_sync_minor on public.profiles;
create trigger kinet_sync_minor before insert or update on public.profiles
for each row execute function public.kinet_sync_minor();

-- Mensajes directos: adultos ↔ menores
create or replace function public.kinet_guard_dm() returns trigger
language plpgsql security definer set search_path = public as $$
declare s record; r record;
begin
  if coalesce(auth.role(),'') = 'service_role' then return new; end if;
  select is_minor, active_role into s from public.profiles where id::text = auth.uid()::text;
  select is_minor, active_role into r from public.profiles where lower(handle) = lower(new.receiver_handle) or lower('@'||handle) = lower(new.receiver_handle) limit 1;
  if r is null then return new; end if;                                   -- bot de soporte u otros no registrados
  if coalesce(r.is_minor,false) and not coalesce(s.is_minor,false) then
    raise exception 'Protección de menores: no se admiten mensajes directos de adultos a cuentas de menores' using errcode = 'P0001';
  end if;
  if coalesce(s.is_minor,false) and not coalesce(r.is_minor,false) and coalesce(r.active_role,'') in ('scout','staff') then
    raise exception 'Protección de menores: los mensajes con ojeadores y entrenadores adultos los gestiona tu tutor' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists kinet_guard_dm on public.direct_messages;
create trigger kinet_guard_dm before insert on public.direct_messages
for each row execute function public.kinet_guard_dm();

-- Tokens de verificación del tutor (los usa la función guardian-consent; sin políticas = solo service role)
create table if not exists public.guardian_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  token_hash text not null unique,
  email text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now()
);
alter table public.guardian_tokens enable row level security;
