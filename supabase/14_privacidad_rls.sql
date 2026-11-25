-- KINET OS · 14 · PRIVACIDAD Y PERMISOS (cierra lectura/escritura abiertas)
-- ORDEN: 1) sube el código nuevo a GitHub (v57)  2) ejecuta este SQL entero en Supabase → SQL Editor → Run.
-- Es seguro repetirlo. Qué arregla:
--   · direct_messages: antes los podía leer CUALQUIERA sin iniciar sesión. Ahora solo el remitente y el destinatario.
--   · posts: solo el autor puede borrar/crear con su identidad; los demás solo pueden tocar el contador de "me gusta".
--   · app_config: nadie escribe desde la web (solo las funciones del panel de staff).
--   · profiles: antes cualquier usuario veía el email, el plan, el correo del tutor, el estado privado (chats, etc.) de TODOS.
--     Ahora cada uno ve solo lo suyo (y el staff todo); el resto ve una vista pública con datos mínimos (profiles_public).
--   · anon (sin sesión): sin permisos de escritura salvo crear un ticket de soporte.

-- ───────── 0. Utilidades ─────────
create or replace function public.kinet_my_handle() returns text
language sql security definer set search_path = public stable as $$
  select lower(coalesce(handle,'')) from public.profiles where id::text = auth.uid()::text
$$;
revoke all on function public.kinet_my_handle() from public, anon;
grant execute on function public.kinet_my_handle() to authenticated;

-- Borra TODAS las políticas antiguas de una tabla (las creadas a mano en el panel también)
create or replace function pg_temp.kx_drop_policies(tbl regclass) returns void language plpgsql as $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = (select relname from pg_class where oid = tbl) loop
    execute format('drop policy if exists %I on %s', r.policyname, tbl::text);
  end loop;
end $$;

-- ───────── 1. Mensajes directos: solo remitente y destinatario ─────────
alter table public.direct_messages enable row level security;
select pg_temp.kx_drop_policies('public.direct_messages');
revoke all on public.direct_messages from anon, authenticated;
grant select, insert on public.direct_messages to authenticated;
grant update (is_read, read_at) on public.direct_messages to authenticated;   -- solo se puede marcar como leído
create policy dm_select on public.direct_messages for select to authenticated
  using (sender_id::text = auth.uid()::text or lower(receiver_handle) = public.kinet_my_handle());
create policy dm_insert on public.direct_messages for insert to authenticated
  with check (sender_id::text = auth.uid()::text and lower(sender_handle) = public.kinet_my_handle());   -- no se puede suplantar a otro
create policy dm_update_read on public.direct_messages for update to authenticated
  using (lower(receiver_handle) = public.kinet_my_handle()) with check (lower(receiver_handle) = public.kinet_my_handle());

-- ───────── 2. Publicaciones ─────────
alter table public.posts enable row level security;
select pg_temp.kx_drop_policies('public.posts');
revoke all on public.posts from anon, authenticated;
grant select on public.posts to anon, authenticated;
grant insert, delete on public.posts to authenticated;
grant update (likes_count) on public.posts to authenticated;                  -- el contador de "me gusta" lo actualiza cualquiera
create policy posts_select on public.posts for select to anon, authenticated using (true);
create policy posts_insert on public.posts for insert to authenticated with check (author_id::text = auth.uid()::text);
create policy posts_like   on public.posts for update to authenticated using (true) with check (true);   -- limitado por el GRANT a likes_count
create policy posts_delete on public.posts for delete to authenticated using (author_id::text = auth.uid()::text);

-- ───────── 3. Configuración pública: solo lectura desde la web ─────────
revoke insert, update, delete, truncate on public.app_config from anon, authenticated;

-- ───────── 4. Perfiles: lo privado solo para su dueño (y staff) ─────────
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (auth.uid()::text = id::text or coalesce(public.kinet_my_staff_role(), '') <> '');

-- Vista pública con datos mínimos (lo que ve el resto de usuarios en Comunidad / Analizador)
drop view if exists public.profiles_public;
create view public.profiles_public with (security_invoker = false) as
  select id, handle, full_name, avatar_url, bio, club, position, category, active_role, active_sport,
         is_verified, market_open, pinned_post_id, updated_at,
         jsonb_strip_nulls(jsonb_build_object(
           'kinet_user_avatar',        user_state->'kinet_user_avatar',
           'kinet_custom_card_stats',  user_state->'kinet_custom_card_stats',
           'kinet_followed_handles',   user_state->'kinet_followed_handles',
           'kinet_private_account',    user_state->'kinet_private_account',
           'kinet_minor_protection',   user_state->'kinet_minor_protection',
           'kinet_user_city',          user_state->'kinet_user_city'
         )) as user_state
  from public.profiles
  where coalesce(is_banned, false) = false;
revoke all on public.profiles_public from anon;
grant select on public.profiles_public to authenticated;

-- ───────── 5. Sin sesión (anon) no puede escribir nada salvo abrir un ticket de soporte ─────────
revoke insert, update, delete, truncate, references, trigger on all tables in schema public from anon;
grant insert on public.support_tickets to anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;

-- ───────── 6. Limpia claves de API/tokens que versiones anteriores subieron a la nube (ahora se quedan solo en cada dispositivo) ─────────
update public.profiles set user_state = user_state - 'kinet_gemini_api_key' - 'kinet_groq_api_key' - 'kinet_ai_api_key' - 'kinet_spotify_access_token' - 'kinet_spotify_refresh_token'
 where user_state ?| array['kinet_gemini_api_key','kinet_groq_api_key','kinet_ai_api_key','kinet_spotify_access_token','kinet_spotify_refresh_token'];

-- ───────── 7. Comprobación rápida (debe devolver 0 filas/0 permisos para anon) ─────────
-- select grantee, table_name, privilege_type from information_schema.role_table_grants
--  where table_schema='public' and grantee='anon' and privilege_type <> 'SELECT';   -- solo debe salir support_tickets/INSERT
