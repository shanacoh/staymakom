-- Tâches planifiées du blog automatique (25/11/2026).
-- 1. Rédaction : chaque jour à 05:00 heure d'Israël. pg_cron tourne en UTC et Israël est à
--    UTC+2 (hiver) ou UTC+3 (été) : la tâche se déclenche à 02:00 et 03:00 UTC, et la fonction
--    ne travaille que si l'heure d'Israël est 05 (une seule génération par jour, garantie par
--    l'index unique de journal_generation_runs).
-- 2. Publication : toutes les 15 minutes, les articles programmés dont l'heure est passée sont
--    publiés (si l'interrupteur « Publication automatique » est allumé), puis signalés à Bing.
-- Les deux tâches sont créées EN PAUSE : elles s'allument quand le site (back-office, page
-- « Rejeter ») est en ligne, avec : select cron.alter_job(jobid, active := true) ...

select cron.schedule(
  'journal-generate-daily',
  '0 2,3 * * *',
  $$
  select net.http_post(
    url := 'https://uqeipzfdhyjkjzvqbkeu.supabase.co/functions/v1/generate-journal-article',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'internal_cron_secret')),
    body := '{"only_at_israel_hour": 5}'::jsonb,
    timeout_milliseconds := 60000);
  $$
);

select cron.schedule('journal-publish-due', '*/15 * * * *', $$ select public.journal_publish_due(); $$);

select cron.alter_job(jobid, active := false) from cron.job where jobname in ('journal-generate-daily', 'journal-publish-due');
