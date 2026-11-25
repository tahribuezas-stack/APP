-- KINET OS · Panel de GESTIÓN (superadmin y equipos). Ejecuta en Supabase → SQL Editor. Es seguro repetirlo.
-- Todo lo que hace el panel pasa por estas funciones: el SERVIDOR comprueba tu rango (staff_role) en cada llamada.
-- Rangos: superadmin / admin (todo) · subadmin (dirección) · moderator (moderación y soporte)
--         scout_verifier (verificación B2B) · marketing (anuncios y campañas)

-- ───────── 0. Columnas y tablas nuevas ─────────
alter table public.profiles add column if not exists is_banned boolean not null default false;
alter table public.profiles add column if not exists ban_reason text;
alter table public.profiles add column if not exists is_verified boolean not null default false;

create table if not exists public.app_config (
  key        text primary key check (char_length(key) between 2 and 60),
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
alter table public.app_config enable row level security;
drop policy if exists app_config_read on public.app_config;
create policy app_config_read on public.app_config for select to anon, authenticated using (true);   -- solo configuración PÚBLICA (anuncio, mantenimiento, interruptores). Nunca guardes secretos aquí.

create table if not exists public.admin_audit (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  actor_id    uuid,
  actor_email text,
  actor_role  text,
  action      text not null,
  target      text,
  detail      jsonb
);
create index if not exists admin_audit_created_idx on public.admin_audit (created_at desc);
alter table public.admin_audit enable row level security;   -- sin políticas: solo se lee con admin_audit_list()

-- Los campos de moderación no los puede tocar el propio usuario (igual que el plan y el rango).
create or replace function public.kinet_protect_profile() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') = 'service_role' or current_setting('kinet.admin_override', true) = 'on' then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.account_tier := 'free'; new.bonus_video_mins := 0; new.staff_role := null; new.stripe_customer_id := null;
    new.is_banned := false; new.ban_reason := null; new.is_verified := false;
  else
    new.account_tier := old.account_tier; new.staff_role := old.staff_role; new.stripe_customer_id := old.stripe_customer_id;
    new.is_banned := old.is_banned; new.ban_reason := old.ban_reason; new.is_verified := old.is_verified;
    if new.bonus_video_mins > old.bonus_video_mins then new.bonus_video_mins := old.bonus_video_mins; end if;
  end if;
  return new;
end $$;

-- ───────── 1. Utilidades de permisos y auditoría ─────────
create or replace function public.kinet_my_staff_role() returns text
language sql security definer set search_path = public stable as $$
  select lower(coalesce(staff_role, '')) from public.profiles where id::text = auth.uid()::text
$$;
revoke all on function public.kinet_my_staff_role() from public, anon;
grant execute on function public.kinet_my_staff_role() to authenticated;

create or replace function public.kinet_require(roles text[]) returns text
language plpgsql security definer set search_path = public as $$
declare me text := public.kinet_my_staff_role();
begin
  if me in ('superadmin', 'admin') then return me; end if;
  if me = any(roles) then return me; end if;
  raise exception 'Acceso denegado' using errcode = '42501';
end $$;
revoke all on function public.kinet_require(text[]) from public, anon;
grant execute on function public.kinet_require(text[]) to authenticated;

create or replace function public.kinet_audit(p_action text, p_target text, p_detail jsonb default null) returns void
language plpgsql security definer set search_path = public as $$
declare em text;
begin
  select email into em from public.profiles where id::text = auth.uid()::text;
  insert into public.admin_audit(actor_id, actor_email, actor_role, action, target, detail)
  values (auth.uid(), em, public.kinet_my_staff_role(), p_action, p_target, p_detail);
end $$;
revoke all on function public.kinet_audit(text, text, jsonb) from public, anon, authenticated;

create or replace function public.kinet_find_user(p_target text) returns uuid
language sql security definer set search_path = public stable as $$
  select id from public.profiles
  where lower(email) = lower(p_target)
     or lower(handle) = lower(case when p_target like '@%' then p_target else '@' || p_target end)
     or id::text = p_target
  limit 1
$$;
revoke all on function public.kinet_find_user(text) from public, anon, authenticated;

-- ───────── 2. admin_update_user (la de siempre, ahora con auditoría) ─────────
create or replace function public.admin_update_user(target text, tier text default null, bonus numeric default null, staff text default null)
returns void language plpgsql security definer set search_path = public as $$
declare me text; uid uuid;
begin
  select staff_role into me from public.profiles where id::text = auth.uid()::text;
  if coalesce(me,'') not in ('superadmin','admin','subadmin') then raise exception 'Acceso denegado'; end if;
  if staff = 'superadmin' and coalesce(me,'') not in ('superadmin','admin') then raise exception 'Solo el jefe puede dar superadmin'; end if;
  if tier is not null and tier not in ('free','pro','club') then raise exception 'Plan no válido'; end if;
  if staff is not null and staff <> '' and staff not in ('superadmin','admin','subadmin','moderator','scout_verifier','marketing') then raise exception 'Rango no válido'; end if;
  perform set_config('kinet.admin_override', 'on', true);
  update public.profiles set
    account_tier = coalesce(tier, account_tier),
    bonus_video_mins = least(595, greatest(0, coalesce(bonus, bonus_video_mins))),
    staff_role = case when staff is null then staff_role when staff = '' then null else staff end,
    updated_at = now()
  where lower(email) = lower(target)
     or lower(handle) = lower(case when target like '@%' then target else '@' || target end);
  perform public.kinet_audit('user.update', target, jsonb_build_object('tier', tier, 'bonus', bonus, 'staff', staff));
end $$;
revoke all on function public.admin_update_user(text, text, numeric, text) from public, anon;
grant execute on function public.admin_update_user(text, text, numeric, text) to authenticated;

-- ───────── 3. Resumen general ─────────
create or replace function public.admin_overview() returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb := '{}'::jsonb; v jsonb; d date := (now() at time zone 'Europe/Madrid')::date;
begin
  perform public.kinet_require(array['subadmin','moderator','scout_verifier','marketing']);
  begin
    select jsonb_build_object(
      'users_total', count(*),
      'free', count(*) filter (where coalesce(account_tier,'free') = 'free'),
      'pro', count(*) filter (where account_tier = 'pro'),
      'club', count(*) filter (where account_tier = 'club'),
      'athlete', count(*) filter (where coalesce(active_role,'athlete') = 'athlete'),
      'staff', count(*) filter (where active_role = 'staff'),
      'scout', count(*) filter (where active_role = 'scout'),
      'banned', count(*) filter (where is_banned),
      'verified', count(*) filter (where is_verified),
      'minors', count(*) filter (where coalesce((to_jsonb(p)->>'is_minor')::boolean,false)),
      'team', count(*) filter (where coalesce(staff_role,'') <> ''),
      'active_24h', count(*) filter (where updated_at > now() - interval '24 hours'),
      'active_7d', count(*) filter (where updated_at > now() - interval '7 days'),
      'new_7d', count(*) filter (where (to_jsonb(p)->>'created_at')::timestamptz > now() - interval '7 days'),
      'new_30d', count(*) filter (where (to_jsonb(p)->>'created_at')::timestamptz > now() - interval '30 days')
    ) into v from public.profiles p;
    r := r || v;
  exception when others then null; end;
  begin r := r || jsonb_build_object('tickets_new', (select count(*) from public.support_tickets where status = 'nuevo')); exception when others then null; end;
  begin r := r || jsonb_build_object('reports_new', (select count(*) from public.content_reports where status = 'nuevo')); exception when others then null; end;
  begin r := r || jsonb_build_object('terms', (select count(*) from public.blocked_terms)); exception when others then null; end;
  begin execute 'select count(*) from public.posts where created_at > now() - interval ''24 hours''' into v; r := r || jsonb_build_object('posts_24h', v); exception when others then null; end;
  begin execute 'select count(*) from public.posts' into v; r := r || jsonb_build_object('posts_total', v); exception when others then null; end;
  begin
    select jsonb_build_object('videos_24h', count(*) filter (where created_at > now() - interval '24 hours' and deleted_at is null),
                              'videos_total', count(*) filter (where deleted_at is null),
                              'video_bytes', coalesce(sum(bytes) filter (where deleted_at is null), 0)) into v from public.video_uploads;
    r := r || v;
  exception when others then null; end;
  begin
    select jsonb_build_object('ai_today', coalesce(sum(strong + lite + aux), 0), 'ai_cost_today', coalesce(sum(cost_eur), 0)) into v from public.ai_usage where day = d;
    r := r || v;
    select jsonb_build_object('ai_cost_month', coalesce(sum(cost_eur), 0)) into v from public.ai_usage where day >= date_trunc('month', d)::date;
    r := r || v;
  exception when others then null; end;
  return r;
end $$;
revoke all on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated;

create or replace function public.admin_signups_by_day(p_days int default 30) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  perform public.kinet_require(array['subadmin','moderator','scout_verifier','marketing']);
  select coalesce(jsonb_agg(jsonb_build_object('day', g.day, 'n', coalesce(c.n, 0)) order by g.day), '[]'::jsonb) into v
  from (select generate_series(((now() at time zone 'Europe/Madrid')::date - (least(greatest(p_days,1),180) - 1)), (now() at time zone 'Europe/Madrid')::date, interval '1 day')::date as day) g
  left join (
    select ((to_jsonb(p)->>'created_at')::timestamptz at time zone 'Europe/Madrid')::date as day, count(*) as n
    from public.profiles p where to_jsonb(p)->>'created_at' is not null group by 1
  ) c on c.day = g.day;
  return v;
end $$;
revoke all on function public.admin_signups_by_day(int) from public, anon;
grant execute on function public.admin_signups_by_day(int) to authenticated;

-- ───────── 4. Usuarios ─────────
create or replace function public.admin_list_users(p_q text default '', p_tier text default '', p_role text default '', p_flag text default '', p_limit int default 40, p_offset int default 0) returns jsonb
language plpgsql security definer set search_path = public as $$
declare tot int; rows jsonb; q text := '%' || lower(coalesce(p_q, '')) || '%';
begin
  perform public.kinet_require(array['subadmin','moderator','scout_verifier']);
  select count(*) into tot from public.profiles p
   where (p_q = '' or lower(coalesce(email,'')) like q or lower(coalesce(handle,'')) like q or lower(coalesce(full_name,'')) like q or lower(coalesce(club,'')) like q)
     and (p_tier = '' or coalesce(account_tier,'free') = p_tier)
     and (p_role = '' or coalesce(active_role,'athlete') = p_role)
     and (p_flag = '' or (p_flag = 'banned' and is_banned) or (p_flag = 'verified' and is_verified) or (p_flag = 'team' and coalesce(staff_role,'') <> '') or (p_flag = 'minor' and coalesce((to_jsonb(p)->>'is_minor')::boolean,false)));
  select coalesce(jsonb_agg(x), '[]'::jsonb) into rows from (
    select jsonb_build_object('id', id, 'email', email, 'full_name', full_name, 'handle', handle, 'active_role', active_role,
      'active_sport', active_sport, 'account_tier', coalesce(account_tier,'free'), 'bonus_video_mins', bonus_video_mins,
      'staff_role', staff_role, 'club', club, 'updated_at', updated_at, 'created_at', to_jsonb(p)->>'created_at',
      'is_banned', is_banned, 'ban_reason', ban_reason, 'is_verified', is_verified, 'is_minor', coalesce((to_jsonb(p)->>'is_minor')::boolean,false)) as x
    from public.profiles p
    where (p_q = '' or lower(coalesce(email,'')) like q or lower(coalesce(handle,'')) like q or lower(coalesce(full_name,'')) like q or lower(coalesce(club,'')) like q)
      and (p_tier = '' or coalesce(account_tier,'free') = p_tier)
      and (p_role = '' or coalesce(active_role,'athlete') = p_role)
      and (p_flag = '' or (p_flag = 'banned' and is_banned) or (p_flag = 'verified' and is_verified) or (p_flag = 'team' and coalesce(staff_role,'') <> '') or (p_flag = 'minor' and coalesce((to_jsonb(p)->>'is_minor')::boolean,false)))
    order by updated_at desc nulls last
    limit least(greatest(p_limit,1),200) offset greatest(p_offset,0)
  ) s;
  return jsonb_build_object('total', tot, 'rows', rows);
end $$;
revoke all on function public.admin_list_users(text, text, text, text, int, int) from public, anon;
grant execute on function public.admin_list_users(text, text, text, text, int, int) to authenticated;

create or replace function public.admin_user_detail(p_target text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare u uuid := public.kinet_find_user(p_target); r jsonb; ai jsonb := '[]'::jsonb; vids jsonb := '{}'::jsonb; reps int := 0;
begin
  perform public.kinet_require(array['subadmin','moderator','scout_verifier']);
  if u is null then raise exception 'Usuario no encontrado'; end if;
  select to_jsonb(p) - 'user_state' into r from public.profiles p where id = u;
  begin select coalesce(jsonb_agg(to_jsonb(a) order by a.day desc), '[]'::jsonb) into ai from (select day, strong, lite, aux, cost_eur from public.ai_usage where user_id = u order by day desc limit 14) a; exception when others then null; end;
  begin select jsonb_build_object('n', count(*) filter (where deleted_at is null), 'bytes', coalesce(sum(bytes) filter (where deleted_at is null), 0)) into vids from public.video_uploads where user_id = u; exception when others then null; end;
  begin select count(*) into reps from public.content_reports where lower(target_handle) = lower(coalesce(r->>'handle','')); exception when others then null; end;
  return jsonb_build_object('profile', r, 'ai', ai, 'videos', vids, 'reports_against', reps);
end $$;
revoke all on function public.admin_user_detail(text) from public, anon;
grant execute on function public.admin_user_detail(text) to authenticated;

create or replace function public.admin_set_ban(p_target text, p_banned boolean, p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := public.kinet_find_user(p_target);
begin
  perform public.kinet_require(array['subadmin','moderator']);
  if u is null then raise exception 'Usuario no encontrado'; end if;
  if (select coalesce(staff_role,'') from public.profiles where id = u) in ('superadmin','admin') then raise exception 'No se puede suspender a un jefe'; end if;
  perform set_config('kinet.admin_override', 'on', true);
  update public.profiles set is_banned = p_banned, ban_reason = case when p_banned then left(coalesce(p_reason,'Incumplimiento de normas'), 300) else null end, updated_at = now() where id = u;
  perform public.kinet_audit(case when p_banned then 'user.ban' else 'user.unban' end, p_target, jsonb_build_object('reason', p_reason));
end $$;
revoke all on function public.admin_set_ban(text, boolean, text) from public, anon;
grant execute on function public.admin_set_ban(text, boolean, text) to authenticated;

create or replace function public.admin_set_verified(p_target text, p_verified boolean) returns void
language plpgsql security definer set search_path = public as $$
declare u uuid := public.kinet_find_user(p_target);
begin
  perform public.kinet_require(array['subadmin','scout_verifier']);
  if u is null then raise exception 'Usuario no encontrado'; end if;
  perform set_config('kinet.admin_override', 'on', true);
  update public.profiles set is_verified = p_verified, updated_at = now() where id = u;
  perform public.kinet_audit(case when p_verified then 'user.verify' else 'user.unverify' end, p_target, null);
end $$;
revoke all on function public.admin_set_verified(text, boolean) from public, anon;
grant execute on function public.admin_set_verified(text, boolean) to authenticated;

-- ───────── 5. Soporte y denuncias ─────────
create or replace function public.admin_list_tickets(p_status text default '', p_limit int default 60) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  perform public.kinet_require(array['subadmin','moderator']);
  select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc), '[]'::jsonb) into v
  from (select id, created_at, name, email, reason, message, page, status from public.support_tickets
        where p_status = '' or status = p_status order by created_at desc limit least(greatest(p_limit,1),200)) t;
  return v;
end $$;
revoke all on function public.admin_list_tickets(text, int) from public, anon;
grant execute on function public.admin_list_tickets(text, int) to authenticated;

create or replace function public.admin_set_ticket(p_id bigint, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.kinet_require(array['subadmin','moderator']);
  if p_status not in ('nuevo','en_curso','resuelto','descartado') then raise exception 'Estado no válido'; end if;
  update public.support_tickets set status = p_status where id = p_id;
  perform public.kinet_audit('ticket.' || p_status, p_id::text, null);
end $$;
revoke all on function public.admin_set_ticket(bigint, text) from public, anon;
grant execute on function public.admin_set_ticket(bigint, text) to authenticated;

create or replace function public.admin_list_reports(p_status text default '', p_limit int default 60) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  perform public.kinet_require(array['subadmin','moderator']);
  select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc), '[]'::jsonb) into v
  from (select id, created_at, target_type, target_id, target_handle, excerpt, reason, status from public.content_reports
        where p_status = '' or status = p_status order by created_at desc limit least(greatest(p_limit,1),200)) t;
  return v;
end $$;
revoke all on function public.admin_list_reports(text, int) from public, anon;
grant execute on function public.admin_list_reports(text, int) to authenticated;

create or replace function public.admin_set_report(p_id bigint, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.kinet_require(array['subadmin','moderator']);
  if p_status not in ('nuevo','en_curso','resuelto','descartado') then raise exception 'Estado no válido'; end if;
  update public.content_reports set status = p_status where id = p_id;
  perform public.kinet_audit('report.' || p_status, p_id::text, null);
end $$;
revoke all on function public.admin_set_report(bigint, text) from public, anon;
grant execute on function public.admin_set_report(bigint, text) to authenticated;

-- ───────── 6. Palabras prohibidas ─────────
create or replace function public.admin_blocked_terms() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform public.kinet_require(array['subadmin','moderator']);
  return coalesce((select jsonb_agg(term order by term) from public.blocked_terms), '[]'::jsonb);
end $$;
revoke all on function public.admin_blocked_terms() from public, anon;
grant execute on function public.admin_blocked_terms() to authenticated;

create or replace function public.admin_set_term(p_term text, p_add boolean) returns void
language plpgsql security definer set search_path = public as $$
declare t text := lower(trim(coalesce(p_term,'')));
begin
  perform public.kinet_require(array['subadmin','moderator']);
  if char_length(t) < 3 or char_length(t) > 60 then raise exception 'La palabra debe tener entre 3 y 60 caracteres'; end if;
  if p_add then insert into public.blocked_terms(term) values (t) on conflict do nothing;
  else delete from public.blocked_terms where term = t; end if;
  perform public.kinet_audit(case when p_add then 'term.add' else 'term.remove' end, t, null);
end $$;
revoke all on function public.admin_set_term(text, boolean) from public, anon;
grant execute on function public.admin_set_term(text, boolean) to authenticated;

-- ───────── 7. Publicaciones de la comunidad ─────────
create or replace function public.admin_recent_posts(p_limit int default 40) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  perform public.kinet_require(array['subadmin','moderator']);
  execute 'select coalesce(jsonb_agg(x), ''[]''::jsonb) from (select id::text as id, author_handle, left(coalesce(content,''''), 400) as content, created_at from public.posts order by created_at desc limit $1) x'
    into v using least(greatest(p_limit,1),100);
  return v;
exception when undefined_table then return '[]'::jsonb;
end $$;
revoke all on function public.admin_recent_posts(int) from public, anon;
grant execute on function public.admin_recent_posts(int) to authenticated;

create or replace function public.admin_delete_post(p_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.kinet_require(array['subadmin','moderator']);
  execute 'delete from public.posts where id::text = $1' using p_id;
  perform public.kinet_audit('post.delete', p_id, null);
end $$;
revoke all on function public.admin_delete_post(text) from public, anon;
grant execute on function public.admin_delete_post(text) to authenticated;

-- ───────── 8. IA y vídeo ─────────
create or replace function public.admin_ai_usage(p_days int default 14) returns jsonb
language plpgsql security definer set search_path = public as $$
declare byday jsonb; top jsonb;
begin
  perform public.kinet_require(array['subadmin']);
  select coalesce(jsonb_agg(x order by (x->>'day')), '[]'::jsonb) into byday from (
    select jsonb_build_object('day', day, 'strong', sum(strong), 'lite', sum(lite), 'aux', sum(aux), 'cost', round(sum(cost_eur)::numeric, 4), 'users', count(*)) as x
    from public.ai_usage where day >= (now() at time zone 'Europe/Madrid')::date - (least(greatest(p_days,1),90) - 1) group by day) s;
  select coalesce(jsonb_agg(x), '[]'::jsonb) into top from (
    select jsonb_build_object('email', p.email, 'handle', p.handle, 'tier', coalesce(p.account_tier,'free'), 'calls', sum(a.strong + a.lite + a.aux), 'cost', round(sum(a.cost_eur)::numeric, 4)) as x
    from public.ai_usage a join public.profiles p on p.id = a.user_id
    where a.day >= date_trunc('month', (now() at time zone 'Europe/Madrid')::date)::date
    group by p.email, p.handle, p.account_tier order by sum(a.cost_eur) desc limit 15) s;
  return jsonb_build_object('by_day', byday, 'top_month', top);
end $$;
revoke all on function public.admin_ai_usage(int) from public, anon;
grant execute on function public.admin_ai_usage(int) to authenticated;

create or replace function public.admin_video_stats() returns jsonb
language plpgsql security definer set search_path = public as $$
declare byday jsonb; top jsonb; tot jsonb;
begin
  perform public.kinet_require(array['subadmin']);
  select jsonb_build_object('files', count(*) filter (where deleted_at is null), 'bytes', coalesce(sum(bytes) filter (where deleted_at is null), 0), 'deleted', count(*) filter (where deleted_at is not null)) into tot from public.video_uploads;
  select coalesce(jsonb_agg(x order by (x->>'day')), '[]'::jsonb) into byday from (
    select jsonb_build_object('day', created_at::date, 'files', count(*), 'bytes', coalesce(sum(bytes),0)) as x
    from public.video_uploads where created_at > now() - interval '14 days' and deleted_at is null group by created_at::date) s;
  select coalesce(jsonb_agg(x), '[]'::jsonb) into top from (
    select jsonb_build_object('email', p.email, 'handle', p.handle, 'tier', coalesce(p.account_tier,'free'), 'files', count(*), 'bytes', coalesce(sum(v.bytes),0)) as x
    from public.video_uploads v join public.profiles p on p.id = v.user_id where v.deleted_at is null
    group by p.email, p.handle, p.account_tier order by sum(v.bytes) desc nulls last limit 15) s;
  return jsonb_build_object('total', tot, 'by_day', byday, 'top', top);
end $$;
revoke all on function public.admin_video_stats() from public, anon;
grant execute on function public.admin_video_stats() to authenticated;

-- ───────── 9. Configuración remota de la app (anuncios, mantenimiento, interruptores) ─────────
create or replace function public.admin_set_config(p_key text, p_value jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_key = 'announcement' then perform public.kinet_require(array['subadmin','marketing']);
  elsif p_key in ('maintenance', 'flags', 'copy') then perform public.kinet_require(array['subadmin']);
  else raise exception 'Clave de configuración no válida'; end if;
  insert into public.app_config(key, value, updated_at, updated_by) values (p_key, coalesce(p_value, '{}'::jsonb), now(), auth.uid())
  on conflict (key) do update set value = excluded.value, updated_at = now(), updated_by = auth.uid();
  perform public.kinet_audit('config.' || p_key, p_key, p_value);
end $$;
revoke all on function public.admin_set_config(text, jsonb) from public, anon;
grant execute on function public.admin_set_config(text, jsonb) to authenticated;

-- ───────── 10. Equipo y auditoría ─────────
create or replace function public.admin_team() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform public.kinet_require(array['subadmin']);
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'email', email, 'handle', handle, 'full_name', full_name, 'staff_role', staff_role, 'updated_at', updated_at) order by staff_role, email)
                   from public.profiles where coalesce(staff_role,'') <> ''), '[]'::jsonb);
end $$;
revoke all on function public.admin_team() from public, anon;
grant execute on function public.admin_team() to authenticated;

create or replace function public.admin_audit_list(p_limit int default 100, p_action text default '') returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform public.kinet_require(array['subadmin']);
  return coalesce((select jsonb_agg(to_jsonb(a) order by a.created_at desc) from (
    select id, created_at, actor_email, actor_role, action, target, detail from public.admin_audit
    where p_action = '' or action like p_action || '%' order by created_at desc limit least(greatest(p_limit,1),300)) a), '[]'::jsonb);
end $$;
revoke all on function public.admin_audit_list(int, text) from public, anon;
grant execute on function public.admin_audit_list(int, text) to authenticated;

-- ───────── 11. Suspendidos: no pueden publicar ni escribir mensajes (aunque se salten la web) ─────────
create or replace function public.kinet_block_banned() returns trigger
language plpgsql security definer set search_path = public as $$
declare h text;
begin
  if tg_table_name = 'posts' then h := lower(coalesce(new.author_handle, '')); else h := lower(coalesce(new.sender_handle, '')); end if;
  if h <> '' and exists (select 1 from public.profiles where lower(handle) = h and is_banned) then
    raise exception 'Tu cuenta está suspendida' using errcode = 'P0001';
  end if;
  return new;
end $$;
do $$ begin
  if to_regclass('public.posts') is not null then
    drop trigger if exists kinet_block_banned_posts on public.posts;
    create trigger kinet_block_banned_posts before insert on public.posts for each row execute function public.kinet_block_banned();
  end if;
  if to_regclass('public.direct_messages') is not null then
    drop trigger if exists kinet_block_banned_dm on public.direct_messages;
    create trigger kinet_block_banned_dm before insert on public.direct_messages for each row execute function public.kinet_block_banned();
  end if;
end $$;

-- Valores iniciales de configuración (solo si no existen)
insert into public.app_config(key, value) values
  ('announcement', '{"enabled":false,"text":"","level":"info","link":"","audience":"all"}'),
  ('maintenance',  '{"enabled":false,"message":"Estamos mejorando KINET OS. Vuelve en unos minutos."}'),
  ('flags',        '{}')
on conflict do nothing;
