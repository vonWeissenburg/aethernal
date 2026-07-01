-- ============================================================
-- AETHERNAL — Cron-Job für den Scheduler (EINMALIG ausführen)
-- ------------------------------------------------------------
-- Voraussetzung: Migration 20260622_scheduler.sql ist eingespielt
-- (pg_cron + pg_net aktiv) und die Edge Function ist deployed.
--
-- Vor dem Ausführen die zwei Platzhalter ersetzen:
--   <PROJECT_REF>  → deine Supabase Project-Ref (z. B. abcd1234)
--   <CRON_SECRET>  → exakt dasselbe Secret wie in der Function
--
-- Zeitplan: täglich 06:00 UTC = 08:00 Europe/Vienna (Sommerzeit).
-- Hinweis: pg_cron rechnet in UTC. Im Winter (MEZ) entspricht 06:00 UTC = 07:00
-- Wiener Zeit. Wer fix 08:00 lokal will, müsste saisonal umstellen — für einen
-- täglichen Versand ist die Stunde Differenz unkritisch.
-- ============================================================

select
  cron.schedule(
    'aethernal-send-due-messages',         -- Job-Name (eindeutig)
    '0 6 * * *',                           -- täglich 06:00 UTC
    $$
    select net.http_post(
      url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-due-messages',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer <CRON_SECRET>'
      ),
      body    := '{}'::jsonb
    );
    $$
  );

-- Job prüfen:        select * from cron.job;
-- Job-Historie:      select * from cron.job_run_details order by start_time desc limit 10;
-- Job entfernen:     select cron.unschedule('aethernal-send-due-messages');
