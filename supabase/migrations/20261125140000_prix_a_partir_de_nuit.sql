-- Prix « à partir de » des expériences avec hôtel, recalculé chaque semaine pour Google
-- (option 2 validée par Shana le 25/11/2026). La fiche calcule ce prix en direct chez le
-- visiteur ; la version préparée pour Google lit ces colonnes, remplies chaque semaine par la
-- fonction compute-experience-from-prices avec exactement la même méthode.
-- Colonnes d'affichage uniquement : ni réservation ni paiement ne les lisent.

alter table public.experiences2
  add column if not exists from_price_ils numeric,
  add column if not exists from_price_checkin date,
  add column if not exists from_price_computed_at timestamptz;

comment on column public.experiences2.from_price_ils is
  'Prix « à partir de » (ILS, 1 nuit) calculé chaque nuit comme sur la fiche ; lu par la version Google (api/_seo). Affichage seulement.';
comment on column public.experiences2.from_price_checkin is
  'Date d''arrivée la moins chère trouvée lors du dernier calcul de from_price_ils.';
comment on column public.experiences2.from_price_computed_at is
  'Moment du dernier calcul de from_price_ils.';

-- UNE FOIS PAR SEMAINE (choix de Shana du 25/11/2026, pour limiter les recherches HyperGuest) :
-- la nuit du dimanche au lundi, de 2 h à 5 h heure d'Israël (lundi 00:00 à 02:55 UTC), toutes
-- les 5 minutes ; chaque passage recalcule UNE fiche (la plus ancienne pas encore faite ce
-- jour-là). Une seule à la fois car HyperGuest limite le rythme des appels venant du serveur.
-- Pour revenir en arrière : select cron.unschedule('experience-from-prices-weekly');
select cron.schedule(
  'experience-from-prices-weekly',
  '*/5 0-2 * * 1',
  $cron$
  select net.http_post(
    url := 'https://uqeipzfdhyjkjzvqbkeu.supabase.co/functions/v1/compute-experience-from-prices',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'internal_cron_secret')
    ),
    body := '{"limit": 1}'::jsonb,
    timeout_milliseconds := 400000
  );
  $cron$
);
