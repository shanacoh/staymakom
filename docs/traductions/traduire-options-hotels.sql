-- Traduit en espagnol, russe et allemand les options payantes des hôtels (table hotel2_extras :
-- « Late Check-out », « Wine in Room »...), ajoutées à la carte des traductions le 17/11/2026.
-- À lancer UNE fois, après le déploiement de translate-content. Seuls les textes manquants sont
-- traduits (mode « changed »), les autres textes des hôtels déjà traduits ne sont pas repayés.
-- Le passage se relance seul jusqu'à la fin, sous le plafond de 2 $ (suivi : docs/traductions/suivi.sql).
select net.http_post(
  url := 'https://uqeipzfdhyjkjzvqbkeu.supabase.co/functions/v1/translate-content',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'internal_cron_secret')
  ),
  body := jsonb_build_object(
    'mode', 'changed',
    'entity_type', 'hotel2',
    'locales', jsonb_build_array('es', 'ru', 'de'),
    'continue_until_done', true,
    'trigger', 'script'
  ),
  timeout_milliseconds := 400000
) as demande_envoyee;
