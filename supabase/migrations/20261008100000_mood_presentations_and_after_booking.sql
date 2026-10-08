-- Chantier Offre, étape 2 : présentation par mood, infos « après la réservation », canal de réservation.
-- Uniquement des AJOUTS : une table et des colonnes facultatives. Aucune colonne existante n'est
-- modifiée, renommée ni supprimée, et aucune fiche existante n'est à migrer.
-- Pour revenir en arrière : supprimer la table et les colonnes ajoutées ici suffit.

-- 1. Présentations par mood ----------------------------------------------------------------------
-- Le mood principal d'une fiche est `standalone_experiences.category_id` : sa présentation, ce sont
-- les colonnes de la fiche elle-même (title, subtitle, long_copy, hero_image). Cette table ne
-- contient que les versions personnalisées des AUTRES moods cochés (`category_ids`). Un mood sans
-- ligne ici affiche la présentation principale.
create table public.standalone_experience_mood_presentations (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.standalone_experiences (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  title text,
  title_fr text,
  title_he text,
  subtitle text,
  subtitle_fr text,
  subtitle_he text,
  long_copy text,
  long_copy_fr text,
  long_copy_he text,
  -- Une photo choisie parmi celles de la fiche (couverture ou galerie).
  cover_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint standalone_experience_mood_presentations_unique unique (experience_id, category_id)
);

comment on table public.standalone_experience_mood_presentations is
  'Version personnalisée (titre, accroche, description, photo de couverture) d''une expérience pour un mood non principal. Une seule ligne par couple expérience + mood.';

create trigger standalone_experience_mood_presentations_set_updated_at
  before update on public.standalone_experience_mood_presentations
  for each row execute function public.update_updated_at_column();

alter table public.standalone_experience_mood_presentations enable row level security;

-- Lecture : exactement les mêmes fiches que celles que le visiteur a le droit de lire
-- (la sous-requête passe par les règles de lecture de `standalone_experiences`).
create policy standalone_mood_presentations_public_read
  on public.standalone_experience_mood_presentations
  for select
  using (
    exists (
      select 1 from public.standalone_experiences e
      where e.id = standalone_experience_mood_presentations.experience_id
    )
  );

create policy standalone_mood_presentations_admin_all
  on public.standalone_experience_mood_presentations
  for all
  using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

-- 2. Après la réservation ------------------------------------------------------------------------
-- Infos pratiques envoyées au client une fois la réservation faite. Toutes facultatives.
alter table public.standalone_experiences
  add column if not exists meeting_point text,
  add column if not exists meeting_point_fr text,
  add column if not exists meeting_point_he text,
  add column if not exists arrive_minutes_before integer,
  add column if not exists know_before_you_go text,
  add column if not exists know_before_you_go_fr text,
  add column if not exists know_before_you_go_he text,
  add column if not exists day_contact_name text,
  add column if not exists day_contact_phone text,
  add column if not exists day_contact_language text,
  add column if not exists contingency_note text,
  add column if not exists contingency_note_fr text,
  add column if not exists contingency_note_he text;

alter table public.standalone_experiences
  add constraint standalone_experiences_arrive_minutes_before_check
  check (arrive_minutes_before is null or arrive_minutes_before >= 0);

comment on column public.standalone_experiences.meeting_point is 'Après la réservation : point de rendez-vous (EN).';
comment on column public.standalone_experiences.arrive_minutes_before is 'Après la réservation : arriver X minutes avant.';
comment on column public.standalone_experiences.know_before_you_go is 'Après la réservation : à savoir (chaussures, eau, tenue...) (EN).';
comment on column public.standalone_experiences.day_contact_name is 'Après la réservation : contact le jour J (nom).';
comment on column public.standalone_experiences.contingency_note is 'Après la réservation : météo ou imprévu (EN).';

-- 3. Canal de réservation ------------------------------------------------------------------------
-- Information interne (comment STAYMAKOM réserve chez le prestataire), jamais affichée au client.
alter table public.standalone_experiences
  add column if not exists booking_channel text;

alter table public.standalone_experiences
  add constraint standalone_experiences_booking_channel_check
  check (booking_channel is null or booking_channel in ('provider_request', 'provider_website', 'provider_portal'));

comment on column public.standalone_experiences.booking_channel is
  'Interne : provider_request (demande au prestataire), provider_website (site du prestataire), provider_portal (portail prestataire, à venir).';

-- Pré-remplissage : « site du prestataire » si la fiche a un lien de réservation, sinon « demande au
-- prestataire ». Le déclencheur de date de modification est suspendu le temps du remplissage, pour
-- que les fiches ne paraissent pas « modifiées aujourd'hui » alors que rien d'éditorial n'a changé.
alter table public.standalone_experiences disable trigger trg_standalone_experiences_updated_at;

update public.standalone_experiences
set booking_channel = case
  when coalesce(btrim(supplier_booking_url), '') <> '' then 'provider_website'
  else 'provider_request'
end
where booking_channel is null;

alter table public.standalone_experiences enable trigger trg_standalone_experiences_updated_at;

alter table public.standalone_experiences
  alter column booking_channel set default 'provider_request';
