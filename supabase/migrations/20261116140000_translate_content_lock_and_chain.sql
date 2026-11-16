-- Traduction automatique : verrou et enchaînement des passages.
--
-- 1. begin_content_translation_run : ouvre une ligne de journal pour un passage. Pour un passage
--    sur tout le site (exclusif), refuse d'en ouvrir un second si un autre est en cours depuis
--    moins de 10 minutes : deux passages simultanés traduiraient (et factureraient) deux fois les
--    mêmes textes. Le contrôle et l'écriture se font sous un verrou, en une seule opération.
-- 2. queue_translate_content_continuation : relance la fonction translate-content depuis la base
--    (appel non bloquant), pour finir un gros travail en plusieurs passages successifs.
-- 3. La tâche de nuit enchaîne ses passages jusqu'à la fin ; elle est créée EN PAUSE : c'est le
--    lancement de la traduction initiale (docs/traductions/traduction-initiale.sql) qui l'active.

create or replace function public.begin_content_translation_run(
  p_trigger text,
  p_mode text,
  p_filter jsonb,
  p_exclusive boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if p_exclusive then
    perform pg_advisory_xact_lock(hashtext('content_translation_run'));
    if exists (
      select 1 from public.content_translation_runs
      where finished_at is null
        and started_at > now() - interval '10 minutes'
        and coalesce(filter->>'entity_id', '') = ''
    ) then
      return null;
    end if;
  end if;
  insert into public.content_translation_runs (trigger, mode, filter)
  values (p_trigger, p_mode, p_filter)
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.queue_translate_content_continuation(p_body jsonb)
returns bigint
language sql
security definer
set search_path = public
as $$
  select net.http_post(
    url := 'https://uqeipzfdhyjkjzvqbkeu.supabase.co/functions/v1/translate-content',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'internal_cron_secret')
    ),
    body := p_body,
    timeout_milliseconds := 400000
  );
$$;

revoke all on function public.begin_content_translation_run(text, text, jsonb, boolean) from public, anon, authenticated;
revoke all on function public.queue_translate_content_continuation(jsonb) from public, anon, authenticated;
grant execute on function public.begin_content_translation_run(text, text, jsonb, boolean) to service_role;
grant execute on function public.queue_translate_content_continuation(jsonb) to service_role;

-- Tâche de nuit : un seul passage à 3 h (heure d'Israël) qui s'enchaîne jusqu'à la fin.
-- Les passages suivants (toutes les 20 min jusqu'à 01:40 UTC) servent de filet si un enchaînement
-- s'est interrompu ; le verrou les empêche de doubler un passage en cours.
select cron.alter_job(
  (select jobid from cron.job where jobname = 'translate-content-nightly'),
  command := $cron$
  select public.queue_translate_content_continuation(
    '{"mode": "changed", "only_after_israel_hour": 3, "continue_until_done": true}'::jsonb
  );
  $cron$,
  active := false
);
