-- Chantier Offre, prompt 4 : les infos pratiques arrivent chez le client.
-- Uniquement des AJOUTS : une colonne, deux extensions, un secret, deux petites fonctions de
-- vérification et une tâche planifiée. Rien d'existant n'est modifié.
-- Pour revenir en arrière : supprimer les 3 tâches planifiées (cron.unschedule), les 2 fonctions,
-- le secret et la colonne suffit.

-- 1. Date d'envoi du rappel de la veille ----------------------------------------------------------
-- Vide = rappel jamais envoyé. C'est cette date qui empêche tout envoi en double.
alter table public.standalone_bookings
  add column if not exists reminder_email_sent_at timestamptz;

comment on column public.standalone_bookings.reminder_email_sent_at is
  'Date d''envoi de l''email de rappel de la veille. Vide = jamais envoyé.';

-- 2. Tâches planifiées -----------------------------------------------------------------------------
-- pg_cron : l'horloge de la base (lance une commande à heure fixe).
-- pg_net : permet à la base d'appeler une fonction serveur.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- 3. Secret partagé entre la tâche planifiée et les fonctions serveur -------------------------------
-- Tiré au hasard ici même et rangé dans le coffre de la base (Vault) : personne ne le voit passer.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'internal_cron_secret') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'internal_cron_secret',
      'Secret présenté par les tâches planifiées de la base aux fonctions serveur.'
    );
  end if;
end $$;

-- Une fonction serveur demande « ce secret est-il le bon ? » sans jamais le lire.
create or replace function public.check_internal_cron_secret(candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'internal_cron_secret' and decrypted_secret = candidate
  );
$$;

revoke all on function public.check_internal_cron_secret(text) from public, anon, authenticated;
grant execute on function public.check_internal_cron_secret(text) to service_role;

-- Un aperçu d'email ne peut partir que vers l'adresse d'un admin.
create or replace function public.is_admin_email(candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles r
    join auth.users u on u.id = r.user_id
    where r.role = 'admin'::public.app_role and lower(u.email) = lower(candidate)
  );
$$;

revoke all on function public.is_admin_email(text) from public, anon, authenticated;
grant execute on function public.is_admin_email(text) to service_role;

-- 4. Rappel de la veille ---------------------------------------------------------------------------
-- La base travaille en heure UTC. 10 h en Israël = 7 h UTC en été, 8 h UTC en hiver.
-- Trois passages (7 h, 8 h, 9 h UTC) : la fonction n'agit qu'à 10 h (envoi) et 11 h (rattrapage)
-- heure d'Israël, et ignore les réservations déjà servies.
do $$
declare
  utc_hour int;
begin
  foreach utc_hour in array array[7, 8, 9] loop
    perform cron.schedule(
      format('standalone-day-before-reminder-%sh-utc', utc_hour),
      format('0 %s * * *', utc_hour),
      $cron$
      select net.http_post(
        url := 'https://uqeipzfdhyjkjzvqbkeu.supabase.co/functions/v1/send-standalone-day-before-reminder',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'internal_cron_secret')
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 60000
      );
      $cron$
    );
  end loop;
end $$;
