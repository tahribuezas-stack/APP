-- KINET OS · Moderación, denuncias y control de tráfico (servidor).
-- Ejecuta en Supabase → SQL Editor. Es seguro ejecutarlo más de una vez.
-- Capas: (1) el navegador ya filtra texto/imagen/vídeo y limita ritmo; (2) este SQL lo aplica en el servidor
-- aunque alguien se salte la web; (3) las denuncias llegan a content_reports para que las revises tú.

-- ───────── 1. Denuncias de usuarios ─────────
create table if not exists public.content_reports (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  reporter_id   uuid default auth.uid(),
  target_type   text not null check (char_length(target_type) between 1 and 20),
  target_id     text check (target_id is null or char_length(target_id) <= 80),
  target_handle text check (target_handle is null or char_length(target_handle) <= 60),
  excerpt       text check (excerpt is null or char_length(excerpt) <= 400),
  reason        text not null check (char_length(reason) between 1 and 60),
  status        text not null default 'nuevo'
);
alter table public.content_reports enable row level security;
drop policy if exists content_reports_insert on public.content_reports;
create policy content_reports_insert on public.content_reports
  for insert to authenticated
  with check (status = 'nuevo' and (reporter_id is null or reporter_id = auth.uid()));
-- Sin políticas de select/update/delete: solo tú (service role) las lees en Table Editor → content_reports.

-- ───────── 2. Palabras prohibidas (editable desde el panel, sin tocar código) ─────────
create table if not exists public.blocked_terms (
  term text primary key check (char_length(term) between 3 and 60)
);
alter table public.blocked_terms enable row level security;   -- nadie lo lee desde la app
insert into public.blocked_terms(term) values
  ('porn'),('pornografia'),('xvideos'),('xnxx'),('pornhub'),('onlyfans'),('hentai'),('desnudos'),('sexo explicito')
on conflict do nothing;

-- ───────── 3. Filtro y límite de ritmo en el servidor ─────────
create or replace function public.kinet_guard_text() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  body text; who text; lim int; win interval; n int; t record; tbl text := tg_table_name;
begin
  if tbl = 'posts' then
    body := coalesce(new.content, '');
    who := lower(coalesce(new.author_handle, '')); lim := 20; win := interval '1 hour';
  else
    body := coalesce(new.message_text, '');
    who := lower(coalesce(new.sender_handle, '')); lim := 40; win := interval '5 minutes';
  end if;

  -- reel_data puede llevar una imagen en base64: no la analizamos como texto, solo limitamos su tamaño
  if tbl = 'posts' and char_length(coalesce(new.reel_data::text, '')) > 3000000 then
    raise exception 'Contenido demasiado grande' using errcode = 'P0001';
  end if;

  for t in select term from public.blocked_terms loop
    if position(t.term in lower(left(body, 20000))) > 0 then
      raise exception 'Contenido no permitido en KINET OS' using errcode = 'P0001';
    end if;
  end loop;

  if who <> '' then
    if tbl = 'posts' then
      select count(*) into n from public.posts where lower(author_handle) = who and created_at > now() - win;
    else
      select count(*) into n from public.direct_messages where lower(sender_handle) = who and created_at > now() - win;
    end if;
    if n >= lim then raise exception 'Demasiado ritmo: espera unos minutos' using errcode = 'P0001'; end if;
  end if;
  return new;
end $$;

do $$ begin
  if to_regclass('public.posts') is not null then
    drop trigger if exists kinet_guard_posts on public.posts;
    create trigger kinet_guard_posts before insert on public.posts for each row execute function public.kinet_guard_text();
  end if;
  if to_regclass('public.direct_messages') is not null then
    drop trigger if exists kinet_guard_dm on public.direct_messages;
    create trigger kinet_guard_dm before insert on public.direct_messages for each row execute function public.kinet_guard_text();
  end if;
end $$;
-- Columnas usadas (las mismas que escribe kinet-backend.js): posts.content / reel_data / author_handle · direct_messages.message_text / sender_handle.

-- ───────── 4. Registro de subidas de vídeo (límite diario por usuario en la Edge Function) ─────────
create table if not exists public.video_uploads (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id    uuid not null,
  key        text,
  bytes      bigint
);
alter table public.video_uploads enable row level security;   -- solo la Edge Function (service role) lo usa
