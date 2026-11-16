-- Traduction automatique ES / RU / DE : passage chaque nuit à partir de 3 h, heure d'Israël.
--
-- La base ne connaît que l'heure UTC, et Israël est à UTC+2 l'hiver, UTC+3 l'été. La tâche est
-- donc lancée toutes les 20 minutes entre 00:00 et 01:40 UTC ; la fonction ignore les passages
-- avant 3 h heure d'Israël (paramètre only_after_israel_hour). Concrètement :
--   - l'hiver : passages utiles à 3 h 00, 3 h 20 et 3 h 40 ;
--   - l'été : passages utiles de 3 h 00 à 4 h 40.
-- Le premier passage traduit ce qui a changé ; les suivants finissent ce qui resterait (une
-- fonction s'arrête au bout de quelques minutes) ou ne font rien.
--
-- Pour revenir en arrière : select cron.unschedule('translate-content-nightly');

select cron.schedule(
  'translate-content-nightly',
  '*/20 0-1 * * *',
  $cron$
  select net.http_post(
    url := 'https://uqeipzfdhyjkjzvqbkeu.supabase.co/functions/v1/translate-content',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'internal_cron_secret')
    ),
    body := '{"mode": "changed", "only_after_israel_hour": 3}'::jsonb,
    timeout_milliseconds := 400000
  );
  $cron$
);
