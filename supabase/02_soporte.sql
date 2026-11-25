-- KINET OS · Tickets de soporte (formulario "Contacto directo" de soporte.html).
-- Ejecuta este SQL en Supabase → SQL Editor. Los tickets los lees tú en Table Editor → support_tickets.
-- Cualquiera (con o sin sesión) puede CREAR un ticket; nadie puede leerlos desde la app (solo tú, desde el panel).

create table if not exists public.support_tickets (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  user_id     uuid default auth.uid(),
  name        text not null check (char_length(name)  between 1 and 120),
  email       text not null check (char_length(email) between 5 and 200 and email like '%@%'),
  reason      text not null check (char_length(reason) between 1 and 120),
  message     text not null check (char_length(message) between 5 and 4000),
  page        text,
  user_agent  text check (user_agent is null or char_length(user_agent) <= 300),
  status      text not null default 'nuevo'
);

alter table public.support_tickets enable row level security;
drop policy if exists support_tickets_insert on public.support_tickets;
create policy support_tickets_insert on public.support_tickets
  for insert to anon, authenticated
  with check (status = 'nuevo' and (user_id is null or user_id = auth.uid()));
-- Sin políticas de select/update/delete: solo el service role (tú, desde el panel) puede leer y gestionar.
