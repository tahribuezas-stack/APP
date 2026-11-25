-- KINET OS · @usuario único y con cambio como máximo cada 30 días. Ejecuta en Supabase → SQL Editor. Es seguro repetirlo.
-- La web ya lo comprueba antes de guardar; esto lo garantiza en el servidor aunque alguien se salte la web.

alter table public.profiles add column if not exists handle_changed_at timestamptz;

create or replace function public.kinet_handle_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare oldh text := lower(coalesce(old.handle, '')); newh text := lower(coalesce(new.handle, ''));
begin
  if coalesce(auth.role(), '') = 'service_role' or current_setting('kinet.admin_override', true) = 'on' then
    return new;
  end if;
  -- el sello de fecha solo lo pone este trigger
  new.handle_changed_at := old.handle_changed_at;
  if newh = oldh or newh = '' then return new; end if;
  if newh in ('@kinet','@kinet_official','@kinetos','@admin','@administrador','@soporte','@support','@staff','@moderacion','@moderador','@oficial') then
    raise exception 'USUARIO_RESERVADO: ese @usuario no está disponible' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.profiles p where lower(p.handle) = newh and p.id <> new.id) then
    raise exception 'USUARIO_OCUPADO: ese @usuario ya lo usa otra persona' using errcode = 'P0001';
  end if;
  -- el primer @usuario real (desde vacío o invitado) es libre; los siguientes, cada 30 días
  if oldh <> '' and oldh not like '%invitado%' then
    if old.handle_changed_at is not null and old.handle_changed_at > now() - interval '30 days' then
      raise exception 'USUARIO_COOLDOWN: solo puedes cambiar tu @usuario cada 30 días' using errcode = 'P0001';
    end if;
    new.handle_changed_at := now();
  end if;
  return new;
end $$;

drop trigger if exists kinet_handle_guard on public.profiles;
create trigger kinet_handle_guard before update of handle on public.profiles
  for each row execute function public.kinet_handle_guard();

-- Consulta rápida (para el formulario): ¿está libre este @usuario?
create or replace function public.kinet_handle_free(h text) returns boolean
language sql security definer set search_path = public stable as $$
  select not exists (select 1 from public.profiles where lower(handle) = lower(h) and id::text <> coalesce(auth.uid()::text, ''))
$$;
revoke all on function public.kinet_handle_free(text) from public, anon;
grant execute on function public.kinet_handle_free(text) to authenticated;

-- Publicación fijada en el perfil (solo una por persona; la web guarda el id aquí para que los demás la vean)
alter table public.profiles add column if not exists pinned_post_id text;
