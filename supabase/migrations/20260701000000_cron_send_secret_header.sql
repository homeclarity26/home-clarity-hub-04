-- Make the pg_cron schedule authenticate itself to the (now-guarded)
-- generate-proactive-alerts edge function.
--
-- The function now requires the x-supabase-cron-secret header (see
-- supabase/functions/_shared/cron-auth.ts). Without this reschedule the daily
-- job would start getting 403s and alerts would silently stop.
--
-- PREREQUISITES (set once in the Supabase project, NOT in this migration —
-- secrets never live in git):
--   1. Function secret:  CRON_SECRET = <a long random value>
--        supabase secrets set CRON_SECRET=...
--   2. DB setting so pg_cron can read the same value:
--        ALTER DATABASE postgres SET app.settings.cron_secret = '<same value>';
--      (also ensure app.settings.supabase_url is set, as the existing schedule
--       already relies on it.)

-- Reschedule by re-registering the job under the same name. cron.schedule
-- upserts on job name, so this replaces the previous command.
SELECT cron.schedule(
  'generate-proactive-alerts-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/generate-proactive-alerts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-supabase-cron-secret', current_setting('app.settings.cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
