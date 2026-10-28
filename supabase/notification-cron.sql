-- Bloomy · Мэдэгдлийн cron (15 минут тутам). Run after notification-center.sql.
-- Vercel Hobby runs cron jobs at most once a day, so Supabase pg_cron + pg_net
-- calls the app's route instead (free, every 15 minutes).
--
-- Before running: replace YOUR-APP-DOMAIN and YOUR_CRON_SECRET (same value as
-- the CRON_SECRET env var in Vercel). Enable pg_cron and pg_net under
-- Database → Extensions if the create statements fail.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule(jobid) from cron.job where jobname = 'bloomy-notifications';

select cron.schedule(
  'bloomy-notifications',
  '*/15 * * * *',
  $$
  select net.http_get(
    url := 'https://YOUR-APP-DOMAIN/api/cron/notifications',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_CRON_SECRET'),
    timeout_milliseconds := 30000
  );
  $$
);

-- Check runs: select * from cron.job_run_details order by start_time desc limit 10;
