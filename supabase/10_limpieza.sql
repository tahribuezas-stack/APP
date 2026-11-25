-- KINET OS · Limpieza automática de datos que ya no sirven (ahorra espacio en Supabase).
-- Ejecutar una vez en Supabase → SQL Editor.
-- NO toca nada del usuario: ni perfiles, ni publicaciones, ni mensajes, ni memoria de IA, ni planes, ni pagos.
-- Solo borra registros técnicos caducados:
--   · stripe_events          > 60 días  (solo sirve para no procesar dos veces un aviso de Stripe)
--   · ai_usage               > 70 días  (contadores diarios de IA; el presupuesto es mensual)
--   · guardian_tokens        usados o caducados desde hace > 30 días (enlaces de tutor legal)
--   · support_tickets        resueltos/descartados > 180 días
--   · content_reports        resueltos/descartados > 180 días (los nuevos y en curso NUNCA se borran)
--   · video_uploads          ya marcados como borrados > 60 días
--   · admin_audit            > 400 días (auditoría de acciones del equipo; se conserva más de un año)

create or replace function public.kinet_housekeeping() returns jsonb
language plpgsql security definer set search_path = public as $$
declare r jsonb := '{}'::jsonb; n bigint;
begin
  begin delete from public.stripe_events where created_at < now() - interval '60 days'; get diagnostics n = row_count; r := r || jsonb_build_object('stripe_events', n); exception when others then null; end;
  begin delete from public.ai_usage where day < (now() - interval '70 days')::date; get diagnostics n = row_count; r := r || jsonb_build_object('ai_usage', n); exception when others then null; end;
  begin delete from public.img_usage where day < (now() - interval '70 days')::date; get diagnostics n = row_count; r := r || jsonb_build_object('img_usage', n); exception when others then null; end;
  begin delete from public.guardian_tokens where coalesce(used_at, expires_at) < now() - interval '30 days'; get diagnostics n = row_count; r := r || jsonb_build_object('guardian_tokens', n); exception when others then null; end;
  begin delete from public.support_tickets where status in ('resuelto','descartado') and created_at < now() - interval '180 days'; get diagnostics n = row_count; r := r || jsonb_build_object('support_tickets', n); exception when others then null; end;
  begin delete from public.content_reports where status in ('resuelto','descartado') and created_at < now() - interval '180 days'; get diagnostics n = row_count; r := r || jsonb_build_object('content_reports', n); exception when others then null; end;
  begin delete from public.video_uploads where deleted_at is not null and deleted_at < now() - interval '60 days'; get diagnostics n = row_count; r := r || jsonb_build_object('video_uploads', n); exception when others then null; end;
  begin delete from public.admin_audit where created_at < now() - interval '400 days'; get diagnostics n = row_count; r := r || jsonb_build_object('admin_audit', n); exception when others then null; end;
  return r;
end $$;

-- Solo el servidor (service role / pg_cron) puede ejecutarla; ningún usuario desde la web.
revoke all on function public.kinet_housekeeping() from public, anon, authenticated;

-- Programarla cada noche a las 04:15 (hora UTC). Requiere activar la extensión en
-- Database → Extensions → pg_cron (gratis). Si no la activas, puedes lanzarla a mano: select public.kinet_housekeeping();
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('kinet_housekeeping') where exists (select 1 from cron.job where jobname = 'kinet_housekeeping');
    perform cron.schedule('kinet_housekeeping', '15 4 * * *', 'select public.kinet_housekeeping();');
  end if;
end $$;
