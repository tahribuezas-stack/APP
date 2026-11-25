-- KINET OS · 12 · Directiva: mural de ideas del equipo
-- Ejecuta este archivo UNA vez en Supabase › SQL Editor. Es seguro repetirlo.
-- Solo ve y escribe el equipo con rango de dirección (subadmin) o superior; los permisos los valida el servidor.

create table if not exists public.board_ideas (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid,
  author_name text,
  title       text not null check (char_length(title) between 3 and 90),
  body        text not null default '' check (char_length(body) <= 400),
  kind        text not null default 'idea' check (kind in ('idea','proyecto','experimento','locura','urgente')),
  color       text not null default '#FDE68A',
  status      text not null default 'idea' check (status in ('idea','estudiando','marcha','hecho')),
  votes       uuid[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.board_ideas enable row level security;
-- sin políticas: nadie accede directamente; todo pasa por las funciones de abajo (security definer)
revoke all on public.board_ideas from anon, authenticated;

create or replace function public.admin_board_list() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  perform public.kinet_require(array['subadmin']);
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', id, 'title', title, 'body', body, 'kind', kind, 'color', color, 'status', status,
      'author', author_name, 'created_at', created_at,
      'votes', coalesce(array_length(votes, 1), 0), 'voted', (auth.uid() = any(votes))
    ) order by created_at desc) from (select * from public.board_ideas order by created_at desc limit 300) b), '[]'::jsonb);
end $$;

create or replace function public.admin_board_save(p_id uuid, p_title text, p_body text, p_kind text, p_color text, p_status text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me_name text; r public.board_ideas;
begin
  perform public.kinet_require(array['subadmin']);
  select coalesce(nullif(handle, ''), email) into me_name from public.profiles where id::text = auth.uid()::text;
  if p_id is null then
    insert into public.board_ideas(author_id, author_name, title, body, kind, color, status)
    values (auth.uid(), me_name, left(trim(p_title), 90), left(coalesce(p_body, ''), 400),
            coalesce(nullif(p_kind, ''), 'idea'), coalesce(nullif(p_color, ''), '#FDE68A'), coalesce(nullif(p_status, ''), 'idea'))
    returning * into r;
  else
    update public.board_ideas set title = left(trim(p_title), 90), body = left(coalesce(p_body, ''), 400),
           kind = coalesce(nullif(p_kind, ''), kind), color = coalesce(nullif(p_color, ''), color),
           status = coalesce(nullif(p_status, ''), status), updated_at = now()
    where id = p_id returning * into r;
  end if;
  return to_jsonb(r) - 'votes';
end $$;

create or replace function public.admin_board_vote(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare r public.board_ideas;
begin
  perform public.kinet_require(array['subadmin']);
  update public.board_ideas
     set votes = case when auth.uid() = any(votes) then array_remove(votes, auth.uid()) else array_append(votes, auth.uid()) end
   where id = p_id returning * into r;
  return jsonb_build_object('id', r.id, 'votes', coalesce(array_length(r.votes, 1), 0));
end $$;

create or replace function public.admin_board_delete(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform public.kinet_require(array['subadmin']);
  delete from public.board_ideas where id = p_id;
  perform public.kinet_audit('board_delete', p_id::text, null);
end $$;

revoke all on function public.admin_board_list() from public, anon;
revoke all on function public.admin_board_save(uuid, text, text, text, text, text) from public, anon;
revoke all on function public.admin_board_vote(uuid) from public, anon;
revoke all on function public.admin_board_delete(uuid) from public, anon;
grant execute on function public.admin_board_list() to authenticated;
grant execute on function public.admin_board_save(uuid, text, text, text, text, text) to authenticated;
grant execute on function public.admin_board_vote(uuid) to authenticated;
grant execute on function public.admin_board_delete(uuid) to authenticated;
