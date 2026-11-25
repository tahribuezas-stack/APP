-- KINET OS · 13 · Copia de seguridad automática del estado del usuario (red de seguridad contra pérdidas de datos)
-- Qué hace: antes de que se guarde un cambio en profiles.user_state, si el nuevo estado tiene MUCHAS menos claves que el anterior
-- (señal de borrado accidental), guarda una copia del estado anterior en profile_state_backups. Así siempre se puede restaurar.
-- Cómo usarlo: pegar en Supabase → SQL Editor → Run. Es seguro repetirlo. Coste: prácticamente cero.
-- Restaurar a mano:  select * from profile_state_backups where user_id = 'UUID' order by created_at desc;
--                     update profiles set user_state = (select old_state from profile_state_backups where id = N) where id = 'UUID';

create table if not exists public.profile_state_backups (
  id          bigserial primary key,
  user_id     uuid not null,
  old_state   jsonb not null,
  old_keys    int  not null,
  new_keys    int  not null,
  created_at  timestamptz not null default now()
);
alter table public.profile_state_backups enable row level security;
-- Sin políticas = nadie desde la web (anon/authenticated) puede leer ni escribir; solo el servidor (service role) y el panel de Supabase.
revoke all on public.profile_state_backups from anon, authenticated;

create or replace function public.kinet_backup_user_state() returns trigger
language plpgsql security definer set search_path = public as $$
declare o int; n int;
begin
  if old.user_state is null or jsonb_typeof(old.user_state) <> 'object' then return new; end if;
  o := (select count(*) from jsonb_object_keys(old.user_state));
  n := case when new.user_state is null or jsonb_typeof(new.user_state) <> 'object' then 0 else (select count(*) from jsonb_object_keys(new.user_state)) end;
  -- pierde 4 o más claves y al menos el 25 %: se guarda lo anterior
  if o >= 8 and (o - n) >= 4 and (o - n) >= o * 0.25 then
    insert into public.profile_state_backups(user_id, old_state, old_keys, new_keys) values (old.id, old.user_state, o, n);
    -- solo las 10 copias más recientes por usuario
    delete from public.profile_state_backups where user_id = old.id and id not in (
      select id from public.profile_state_backups where user_id = old.id order by created_at desc limit 10);
  end if;
  return new;
end $$;

drop trigger if exists trg_kinet_backup_user_state on public.profiles;
create trigger trg_kinet_backup_user_state before update of user_state on public.profiles
  for each row execute function public.kinet_backup_user_state();
