-- Paiements Revolut reçus sans réservation en face : un registre, et le filet de sécurité
-- enfin lancé automatiquement.
--
-- Uniquement des AJOUTS : une table et une tâche planifiée.
-- Pour revenir en arrière : cron.unschedule('reconcile-standalone-bookings-10min') puis
-- supprimer la table revolut_unmatched_payments.

-- 1. Registre --------------------------------------------------------------------------------------
-- Une ligne par commande Revolut payée que le site n'a pu relier à aucune réservation.
-- La clé unique sur order_id garantit une seule alerte par paiement, même quand Revolut
-- prévient deux fois (paiement autorisé, puis terminé).
--   origin = 'site'      : commande créée par le site, une réservation aurait dû exister.
--   origin = 'hors_site' : lien de paiement fait à la main dans Revolut, normal qu'il n'y en ait pas.
--   status = 'a_verifier'      : en attente du passage du filet de sécurité (commandes du site).
--   status = 'alerte_envoyee'  : email envoyé à Shana.
--   status = 'rattache'        : la réservation est finalement apparue, rien à faire.
create table if not exists public.revolut_unmatched_payments (
  order_id text primary key,
  origin text not null check (origin in ('site', 'hors_site')),
  status text not null default 'a_verifier' check (status in ('a_verifier', 'alerte_envoyee', 'rattache')),
  amount numeric,
  currency text,
  description text,
  customer_name text,
  customer_email text,
  received_at timestamptz not null default now(),
  checked_at timestamptz
);

create index if not exists revolut_unmatched_payments_a_verifier_idx
  on public.revolut_unmatched_payments (received_at)
  where status = 'a_verifier';

-- Lecture et écriture réservées aux fonctions serveur (clé de service) : aucune règle d'accès
-- n'est ouverte au navigateur.
alter table public.revolut_unmatched_payments enable row level security;

-- 2. Filet de sécurité toutes les 10 minutes -------------------------------------------------------
-- Revérifie auprès de Revolut les réservations restées « en attente », et les paiements du site
-- restés sans réservation (voir reconcile-standalone-bookings).
select cron.unschedule(jobid)
from cron.job
where jobname = 'reconcile-standalone-bookings-10min';

select cron.schedule(
  'reconcile-standalone-bookings-10min',
  '*/10 * * * *',
  $cron$
  select net.http_post(
    url := 'https://uqeipzfdhyjkjzvqbkeu.supabase.co/functions/v1/reconcile-standalone-bookings',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'internal_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $cron$
);
