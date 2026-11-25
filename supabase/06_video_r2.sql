-- KINET OS · Vídeo en Cloudflare R2 — ejecutar UNA vez en Supabase → SQL Editor
-- (si no ejecutaste 03_moderacion_trafico.sql, esta tabla se crea igualmente)
create table if not exists public.video_uploads (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id    uuid not null,
  key        text,
  bytes      bigint
);
alter table public.video_uploads add column if not exists deleted_at timestamptz;
create index if not exists video_uploads_user_idx on public.video_uploads (user_id, created_at desc);
alter table public.video_uploads enable row level security;
-- Sin políticas: solo la Edge Function (service role) puede leer o escribir esta tabla.
