-- TRADUCTION INITIALE ES / RU / DE (à lancer une seule fois)
--
-- À coller dans Supabase > SQL Editor, puis « Run ».
-- Ce que ça fait :
--   1. active la traduction automatique de chaque nuit (3 h, heure d'Israël) ;
--   2. lance tout de suite la traduction de tout le contenu publié. Elle avance par passages
--      de quelques minutes qui s'enchaînent seuls jusqu'à la fin (compter environ 30 à 60 minutes).
-- Coût estimé : 10 à 15 $ (traduction + relecture native, 3 langues).
-- Sans risque si on le relance : ce qui est déjà traduit n'est pas refait.

select cron.alter_job(
  (select jobid from cron.job where jobname = 'translate-content-nightly'),
  active := true
);

select public.queue_translate_content_continuation(
  '{"mode": "changed", "continue_until_done": true}'::jsonb
);
