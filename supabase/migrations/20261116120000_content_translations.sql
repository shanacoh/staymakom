-- Traductions automatiques ES / RU / DE (et plus tard d'autres langues) du contenu public.
--
-- Principe : on ne crée aucune nouvelle colonne dans les fiches. Chaque texte traduit est
-- une ligne de ce tableau : « tel champ de telle fiche, dans telle langue ». Le texte anglais
-- reste la source ; son empreinte (source_hash) est gardée pour savoir si l'anglais a changé
-- depuis la traduction.
--
--  - status = 'auto'     : traduit par l'IA, peut être retraduit automatiquement.
--  - status = 'reviewed' : corrigé ou validé à la main dans le back-office, jamais écrasé.
--  - stale = true        : l'anglais a changé depuis une traduction 'reviewed' : à revoir.
--
-- Pour les champs « liste » (inclus, bon à savoir...), text contient un tableau JSON de textes.

begin;

create table if not exists public.content_translations (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  field text not null,
  locale text not null check (locale ~ '^[a-z]{2}$'),
  text text not null,
  source_hash text not null,
  status text not null default 'auto' check (status in ('auto', 'reviewed')),
  stale boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_translations_unique unique (entity_type, entity_id, field, locale)
);

create index if not exists content_translations_lookup_idx
  on public.content_translations (entity_type, entity_id, locale);

create index if not exists content_translations_stale_idx
  on public.content_translations (locale)
  where stale;

drop trigger if exists content_translations_updated_at on public.content_translations;
create trigger content_translations_updated_at
  before update on public.content_translations
  for each row execute function public.update_updated_at_column();

alter table public.content_translations enable row level security;

-- Lecture publique : le site lit ces textes sans connexion.
drop policy if exists "content_translations_public_read" on public.content_translations;
create policy "content_translations_public_read"
  on public.content_translations for select
  using (true);

-- Écriture : admins du back-office (la clé de service passe outre ces règles).
drop policy if exists "content_translations_admin_insert" on public.content_translations;
create policy "content_translations_admin_insert"
  on public.content_translations for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "content_translations_admin_update" on public.content_translations;
create policy "content_translations_admin_update"
  on public.content_translations for update to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role))
  with check (public.has_role(auth.uid(), 'admin'::app_role));

drop policy if exists "content_translations_admin_delete" on public.content_translations;
create policy "content_translations_admin_delete"
  on public.content_translations for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role));

-- Enregistre des traductions automatiques en une seule fois (tout ou rien).
-- Une ligne déjà 'reviewed' n'est JAMAIS écrasée, même si elle a été validée à la main
-- pendant que la traduction tournait : la condition est vérifiée au moment de l'écriture.
-- p_rows : [{entity_type, entity_id, field, locale, text, source_hash}, ...]
create or replace function public.save_auto_translations(p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  written integer;
begin
  with incoming as (
    select r.entity_type, r.entity_id, r.field, r.locale, r.text, r.source_hash
    from jsonb_to_recordset(p_rows)
      as r(entity_type text, entity_id uuid, field text, locale text, text text, source_hash text)
  ), upserted as (
    insert into public.content_translations as ct
      (entity_type, entity_id, field, locale, text, source_hash, status, stale)
    select entity_type, entity_id, field, locale, text, source_hash, 'auto', false
    from incoming
    on conflict (entity_type, entity_id, field, locale) do update
      set text = excluded.text,
          source_hash = excluded.source_hash,
          stale = false
      where ct.status = 'auto'
    returning 1
  )
  select count(*) into written from upserted;
  return written;
end;
$$;

-- Signale « source modifiée » sur les traductions vérifiées dont l'anglais a changé,
-- sans toucher à leur texte.
-- p_rows : [{entity_type, entity_id, field, locale, source_hash}, ...] (source_hash = empreinte actuelle de l'anglais)
create or replace function public.mark_reviewed_translations_stale(p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  marked integer;
begin
  with incoming as (
    select r.entity_type, r.entity_id, r.field, r.locale, r.source_hash
    from jsonb_to_recordset(p_rows)
      as r(entity_type text, entity_id uuid, field text, locale text, source_hash text)
  ), updated as (
    update public.content_translations ct
      set stale = true
    from incoming i
    where ct.entity_type = i.entity_type
      and ct.entity_id = i.entity_id
      and ct.field = i.field
      and ct.locale = i.locale
      and ct.status = 'reviewed'
      and ct.stale = false
      and ct.source_hash <> i.source_hash
    returning 1
  )
  select count(*) into marked from updated;
  return marked;
end;
$$;

revoke all on function public.save_auto_translations(jsonb) from public, anon, authenticated;
revoke all on function public.mark_reviewed_translations_stale(jsonb) from public, anon, authenticated;
grant execute on function public.save_auto_translations(jsonb) to service_role;
grant execute on function public.mark_reviewed_translations_stale(jsonb) to service_role;

-- Journal des passages de la traduction automatique (nuit, bouton du back-office, script initial).
create table if not exists public.content_translation_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  trigger text not null,            -- 'cron' | 'admin' | 'script'
  mode text not null,               -- 'changed' | 'all'
  filter jsonb,
  translated integer not null default 0,
  skipped integer not null default 0,
  stale_marked integer not null default 0,
  errors integer not null default 0,
  remaining integer not null default 0,
  error_details jsonb
);

alter table public.content_translation_runs enable row level security;

drop policy if exists "content_translation_runs_admin_read" on public.content_translation_runs;
create policy "content_translation_runs_admin_read"
  on public.content_translation_runs for select to authenticated
  using (public.has_role(auth.uid(), 'admin'::app_role));

commit;
