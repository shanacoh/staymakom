-- Étape 1 du chantier "Dossier de voyage" : fusion Itinéraires + Dossier swipe.
-- Crée l'objet central dossiers_voyage (remplace dossiers / itineraries / itinerary_requests
-- comme source de vérité des futurs dossiers), importe le contenu de la bibliothèque swipe
-- (table "propositions") dans le Catalogue, et bascule les dossiers existants + les fonctions
-- techniques du swipe (RPC, triggers) vers dossiers_voyage, sans rien casser côté liens déjà
-- envoyés aux clients.
--
-- Volontairement non fait ici : la table "propositions" et "swipe_categories" ne sont PAS
-- supprimées dans cette migration (sécurité : le contenu riche multilingue — description,
-- titre EN/HE — n'a pas encore de colonne équivalente sur catalogue_items, donc la carte
-- Explorer continue de lire "propositions" pour son contenu tant que ce travail n'est pas fait).
-- Leur suppression définitive interviendra à une étape ultérieure, une fois validé avec Shana.

-- ============================================================
-- 1. Table centrale : dossiers_voyage
-- ============================================================
create table public.dossiers_voyage (
  id uuid primary key default gen_random_uuid(),
  reference text,

  destinataire_type text not null default 'client' check (destinataire_type in ('client','influenceur')),
  nom_destinataire text not null,
  email text,
  telephone text,
  langue text check (langue in ('fr','en','he')),
  lead_id uuid references public.leads(id) on delete set null,

  objectif text not null default 'vente' check (objectif in ('vente','collab')),
  point_depart text not null default 'proposition' check (point_depart in ('explorer','proposition')),
  canal_origine text not null default 'saisie_manuelle' check (canal_origine in ('whatsapp','email','formulaire_site','saisie_manuelle')),
  contenu_brut_recu text,

  dates_arrivee date,
  dates_depart date,
  nb_voyageurs int,
  budget_estime numeric,
  devise text default 'ILS',
  regions text[],
  brief_data jsonb not null default '{}'::jsonb,
  brief_valide_par_shana boolean not null default false,

  -- réglages d'affichage de l'étape Explorer (repris tels quels de l'ancien module swipe)
  afficher_prix boolean not null default false,
  trier_par_categorie boolean not null default false,
  message_intro text,
  message_intro_en text,
  message_intro_he text,
  noms_participants text[],
  ordre_categories uuid[],

  token_public text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),

  statut text not null default 'nouvelle_demande' check (statut in (
    'nouvelle_demande','brief','en_preparation','envoye','retours',
    'paye','collab_confirme','confirme','en_voyage','termine','perdu'
  )),
  statut_lecture text check (statut_lecture in ('envoye','vu','termine')),

  version_active_id uuid,
  version_verrouillee_id uuid,

  est_modele boolean not null default false,
  modele_source_id uuid references public.dossiers_voyage(id) on delete set null,
  archive boolean not null default false,

  premiere_ouverture_at timestamptz,
  derniere_ouverture_at timestamptz,
  nb_ouvertures int not null default 0,
  envoye_at timestamptz,
  retours_recus_at timestamptz,
  paye_at timestamptz,

  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.dossiers_voyage is 'Objet central du chantier "Dossier de voyage" : remplace dossiers (swipe) + itineraries + itinerary_requests.';

alter table public.dossiers_voyage enable row level security;

create policy dossiers_voyage_admin_all on public.dossiers_voyage
  for all using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 2. Versions : R1, R2...
-- ============================================================
create table public.dossiers_voyage_versions (
  id uuid primary key default gen_random_uuid(),
  dossier_id uuid not null references public.dossiers_voyage(id) on delete cascade,
  numero int not null,
  label text,
  cree_par uuid references auth.users(id),
  cree_depuis_version_id uuid references public.dossiers_voyage_versions(id),
  statut text not null default 'brouillon' check (statut in ('brouillon','envoyee','verrouillee','archivee')),
  prix_total_vente numeric,
  prix_total_achat numeric,
  note_interne text,
  created_at timestamptz not null default now(),
  unique (dossier_id, numero)
);

alter table public.dossiers_voyage
  add constraint dossiers_voyage_version_active_fkey
    foreign key (version_active_id) references public.dossiers_voyage_versions(id) on delete set null,
  add constraint dossiers_voyage_version_verrouillee_fkey
    foreign key (version_verrouillee_id) references public.dossiers_voyage_versions(id) on delete set null;

alter table public.dossiers_voyage_versions enable row level security;

create policy dossiers_voyage_versions_admin_all on public.dossiers_voyage_versions
  for all using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 3. Lignes du programme (Composer)
-- ============================================================
create table public.dossiers_voyage_lignes (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.dossiers_voyage_versions(id) on delete cascade,
  jour int not null,
  ordre int not null default 0,
  nature text not null check (nature in ('hebergement','restaurant','activite','transport','lieu_a_visiter','autre')),

  origine text not null default 'ia' check (origine in ('impose_shana','demande_client','ia')),
  verrouillee_regeneration boolean not null default false,

  catalogue_item_id uuid references public.catalogue_items(id) on delete set null,
  hotel_id uuid references public.hotels2(id) on delete set null,
  experience_id uuid references public.experiences2(id) on delete set null,
  standalone_experience_id uuid references public.standalone_experiences(id) on delete set null,
  texte_libre text,

  casher boolean,
  fiche_jamais_formalisee boolean not null default false,
  alerte_a_contacter boolean not null default false,

  cout_achat_estime numeric,
  prix_vente_estime numeric,
  consigne_regeneration text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dossiers_voyage_lignes enable row level security;

create policy dossiers_voyage_lignes_admin_all on public.dossiers_voyage_lignes
  for all using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 4. Retours client sur une proposition
-- ============================================================
create table public.dossiers_voyage_retours (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.dossiers_voyage_versions(id) on delete cascade,
  ligne_id uuid references public.dossiers_voyage_lignes(id) on delete cascade,
  reaction text check (reaction in ('jaime','mitige','non')),
  commentaire text,
  created_at timestamptz not null default now()
);

alter table public.dossiers_voyage_retours enable row level security;

create policy dossiers_voyage_retours_admin_all on public.dossiers_voyage_retours
  for all using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 5. Couche teaser sur les fiches Catalogue (étape Proposition)
-- ============================================================
create table public.catalogue_item_teasers (
  catalogue_item_id uuid primary key references public.catalogue_items(id) on delete cascade,
  nom_code text not null,
  nom_code_en text,
  nom_code_he text,
  description_sensorielle text,
  description_sensorielle_en text,
  description_sensorielle_he text,
  visuel_url text,
  secteur_libelle text,
  secteur_rayon_km numeric not null default 15,
  secteur_latitude numeric,
  secteur_longitude numeric,
  statut text not null default 'brouillon' check (statut in ('brouillon','pret')),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.catalogue_item_teasers enable row level security;

create policy catalogue_item_teasers_admin_all on public.catalogue_item_teasers
  for all using (has_role(auth.uid(), 'admin'::app_role))
  with check (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================
-- 6. Catalogue : absorbe le packaging commercial de l'ex-bibliothèque swipe
-- ============================================================
alter table public.catalogue_items
  add column photo_url text,
  add column prix_achat numeric,
  add column prix_client numeric,
  add column commission_pourcentage numeric,
  add column mode_reservation text check (mode_reservation in ('reservable_en_ligne','demande_necessaire')),
  add column lien_reservation text,
  add column legacy_proposition_id uuid; -- traçabilité de la migration, retirable plus tard

comment on column public.catalogue_items.legacy_proposition_id is 'Référence vers l''ancienne table propositions (bibliothèque swipe) dont cette fiche est issue, le cas échéant. Colonne de traçabilité, à retirer une fois la migration validée.';

-- ============================================================
-- 7. Réservations : NE PAS TOUCHER ICI.
--    Le lien inverse "quelle ligne de dossier a généré cette réservation" (colonne
--    dossier_voyage_ligne_id sur bookings_hg / standalone_bookings) est repoussé à
--    l'étape 8 du plan (Paiement → Réservations → Carnet de voyage), pour ne jamais
--    toucher aux tables du flux HyperGuest/Revolut tant que ce n'est pas explicitement
--    nécessaire et validé.
-- ============================================================

-- ============================================================
-- 8. Avis clients : le patron review_requests accepte désormais les dossiers de voyage
-- ============================================================
alter table public.review_requests
  drop constraint review_requests_booking_type_check;

alter table public.review_requests
  add constraint review_requests_booking_type_check
    check (booking_type = any (array['standalone_bookings','bookings_hg','dossiers_voyage']));

-- ============================================================
-- 9. Migration de contenu : propositions (bibliothèque swipe) → catalogue_items
--    (photo + prix uniquement ; description/traductions restent pour l'instant
--    dans l'ancienne table "propositions", voir note en tête de fichier)
-- ============================================================

-- 9a. Si une fiche Catalogue existe déjà pour le même hôtel/expérience/expérience standalone,
--     on complète cette fiche plutôt que d'en créer une nouvelle.
update public.catalogue_items ci
set photo_url = p.photo_url,
    prix_achat = p.prix_achat,
    prix_client = p.prix_client,
    commission_pourcentage = p.commission_pourcentage,
    mode_reservation = p.mode_reservation,
    lien_reservation = p.lien_reservation,
    legacy_proposition_id = p.id
from public.propositions p
where ci.legacy_proposition_id is null
  and (
    (p.hotel_id is not null and ci.hotel_id = p.hotel_id)
    or (p.experience_id is not null and ci.experience_id = p.experience_id)
    or (p.standalone_experience_id is not null and ci.standalone_experience_id = p.standalone_experience_id)
  );

-- 9b. Sinon, on crée une nouvelle fiche Catalogue à partir de la proposition.
insert into public.catalogue_items (
  name, nature, place_type, city, region, address,
  hotel_id, experience_id, standalone_experience_id,
  photo_url, prix_achat, prix_client, commission_pourcentage, mode_reservation, lien_reservation,
  tags, source, commercial_status, legacy_proposition_id
)
select
  p.titre,
  'inspiration',
  case
    when p.hotel_id is not null then 'hebergement'
    when p.experience_id is not null or p.standalone_experience_id is not null then 'activite'
    else 'autre'
  end,
  p.ville, p.region, p.adresse,
  p.hotel_id, p.experience_id, p.standalone_experience_id,
  p.photo_url, p.prix_achat, p.prix_client, p.commission_pourcentage, p.mode_reservation, p.lien_reservation,
  coalesce(p.tags, '{}'), 'manuel', 'partenaire', p.id
from public.propositions p
where not exists (select 1 from public.catalogue_items ci where ci.legacy_proposition_id = p.id);

-- 9c. On garde la correspondance ancienne proposition → fiche Catalogue sur dossier_propositions,
--     pour que les futures étapes (Composer, Explorer nouvelle version) puissent s'appuyer dessus.
alter table public.dossier_propositions
  add column catalogue_item_id uuid references public.catalogue_items(id) on delete set null;

update public.dossier_propositions dp
set catalogue_item_id = ci.id
from public.propositions p
join public.catalogue_items ci on ci.legacy_proposition_id = p.id
where dp.proposition_id = p.id;

-- ============================================================
-- 10. Migration des dossiers existants : dossiers → dossiers_voyage (même id, même lien)
-- ============================================================
insert into public.dossiers_voyage (
  id, destinataire_type, nom_destinataire, objectif, point_depart, canal_origine,
  afficher_prix, trier_par_categorie, message_intro, message_intro_en, message_intro_he,
  noms_participants, ordre_categories,
  token_public, statut, statut_lecture, premiere_ouverture_at, archive,
  created_at, updated_at
)
select
  d.id, 'client', d.nom_client, 'vente', 'explorer', 'saisie_manuelle',
  d.afficher_prix, d.trier_par_categorie, d.message_intro, d.message_intro_en, d.message_intro_he,
  d.noms_participants, d.ordre_categories,
  d.token_public,
  case when d.statut_lecture = 'termine' then 'retours' else 'envoye' end,
  d.statut_lecture, d.premiere_ouverture_at, false,
  d.created_at, d.updated_at
from public.dossiers d;

-- ============================================================
-- 11. Bascule des tables de liaison du swipe vers dossiers_voyage
-- ============================================================
alter table public.dossier_propositions
  drop constraint dossier_propositions_dossier_id_fkey,
  add constraint dossier_propositions_dossier_id_fkey
    foreign key (dossier_id) references public.dossiers_voyage(id) on delete cascade;

alter table public.participants
  drop constraint participants_dossier_id_fkey,
  add constraint participants_dossier_id_fkey
    foreign key (dossier_id) references public.dossiers_voyage(id) on delete cascade;

-- ============================================================
-- 12. Bascule des fonctions techniques du swipe (RPC + triggers) vers dossiers_voyage
--     Le contenu des cartes (titre/description/traductions) continue de venir de
--     "propositions" pour l'instant (voir note en tête de fichier).
-- ============================================================

create or replace function public.swipe_get_dossier_by_token(p_token text)
returns table(dossier_id uuid, nom_client text, afficher_prix boolean, statut text, trier_par_categorie boolean, message_intro text, message_intro_en text, message_intro_he text, noms_participants text[], ordre_categories uuid[])
language sql
stable security definer
set search_path to 'public'
as $function$
  select id, nom_destinataire, afficher_prix, statut, trier_par_categorie, message_intro, message_intro_en, message_intro_he, noms_participants, ordre_categories
  from public.dossiers_voyage
  where token_public = p_token;
$function$;

create or replace function public.swipe_get_participants_by_token(p_token text)
returns table(participant_id uuid, prenom text)
language sql
stable security definer
set search_path to 'public'
as $function$
  select p.id, p.prenom
  from public.participants p
  join public.dossiers_voyage d on d.id = p.dossier_id
  where d.token_public = p_token
  order by p.created_at;
$function$;

create or replace function public.swipe_get_or_create_participant(p_token text, p_prenom text)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_dossier_id uuid;
  v_participant_id uuid;
begin
  select id into v_dossier_id from public.dossiers_voyage where token_public = p_token;
  if v_dossier_id is null then
    raise exception 'Dossier introuvable';
  end if;

  select id into v_participant_id
  from public.participants
  where dossier_id = v_dossier_id and lower(prenom) = lower(p_prenom)
  limit 1;

  if v_participant_id is null then
    insert into public.participants (dossier_id, prenom)
    values (v_dossier_id, p_prenom)
    returning id into v_participant_id;
  end if;

  return v_participant_id;
end;
$function$;

create or replace function public.swipe_get_deck_by_token(p_token text)
returns table(dossier_proposition_id uuid, ordre integer, titre text, titre_en text, titre_he text, description text, description_en text, description_he text, photo_url text, nom_hotel text, nom_hotel_en text, nom_hotel_he text, ville text, ville_en text, ville_he text, categorie_id uuid, categorie_nom text, categorie_nom_en text, categorie_nom_he text, categorie_ordre integer, prix_client numeric)
language sql
stable security definer
set search_path to 'public'
as $function$
  select
    dp.id,
    dp.ordre,
    pr.titre, pr.titre_en, pr.titre_he,
    pr.description, pr.description_en, pr.description_he,
    pr.photo_url,
    pr.nom_hotel, pr.nom_hotel_en, pr.nom_hotel_he,
    pr.ville, pr.ville_en, pr.ville_he,
    c.id, c.nom, c.nom_en, c.nom_he, c.ordre,
    case when d.afficher_prix then pr.prix_client else null end
  from public.dossier_propositions dp
  join public.dossiers_voyage d on d.id = dp.dossier_id
  join public.propositions pr on pr.id = dp.proposition_id
  left join public.swipe_categories c on c.id = pr.categorie_id
  where d.token_public = p_token
  order by dp.ordre;
$function$;

create or replace function public.swipe_upsert_swipe(p_token text, p_participant_id uuid, p_dossier_proposition_id uuid, p_valeur boolean)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_dossier_id uuid;
begin
  select id into v_dossier_id from public.dossiers_voyage where token_public = p_token;
  if v_dossier_id is null then
    raise exception 'Dossier introuvable';
  end if;

  if not exists (
    select 1 from public.participants where id = p_participant_id and dossier_id = v_dossier_id
  ) then
    raise exception 'Participant invalide pour ce dossier';
  end if;

  if not exists (
    select 1 from public.dossier_propositions where id = p_dossier_proposition_id and dossier_id = v_dossier_id
  ) then
    raise exception 'Proposition invalide pour ce dossier';
  end if;

  insert into public.swipes (dossier_proposition_id, participant_id, valeur)
  values (p_dossier_proposition_id, p_participant_id, p_valeur)
  on conflict (dossier_proposition_id, participant_id)
  do update set valeur = excluded.valeur;
end;
$function$;

create or replace function public.swipe_cancel_swipe(p_token text, p_participant_id uuid, p_dossier_proposition_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_dossier_id uuid;
begin
  select id into v_dossier_id from public.dossiers_voyage where token_public = p_token;
  if v_dossier_id is null then
    raise exception 'Dossier introuvable';
  end if;

  delete from public.swipes
  where participant_id = p_participant_id
    and dossier_proposition_id = p_dossier_proposition_id
    and exists (
      select 1 from public.participants where id = p_participant_id and dossier_id = v_dossier_id
    );
end;
$function$;

create or replace function public.swipe_set_coup_de_coeur(p_token text, p_participant_id uuid, p_dossier_proposition_id uuid, p_valeur boolean)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_dossier_id uuid;
begin
  select id into v_dossier_id from public.dossiers_voyage where token_public = p_token;
  if v_dossier_id is null then
    raise exception 'Dossier introuvable';
  end if;

  update public.swipes s
  set coup_de_coeur = p_valeur
  from public.participants p
  where s.participant_id = p.id
    and p.id = p_participant_id
    and p.dossier_id = v_dossier_id
    and s.dossier_proposition_id = p_dossier_proposition_id;
end;
$function$;

create or replace function public.swipe_mark_dossier_vu()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  update public.dossiers_voyage
  set
    statut_lecture = case when statut_lecture = 'envoye' then 'vu' else statut_lecture end,
    premiere_ouverture_at = coalesce(premiere_ouverture_at, now()),
    derniere_ouverture_at = now(),
    nb_ouvertures = nb_ouvertures + 1
  where id = new.dossier_id;
  return new;
end;
$function$;

create or replace function public.swipe_refresh_statut_lecture()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_dossier_id uuid;
  v_nb_propositions integer;
  v_nb_participants integer;
  v_tous_termines boolean;
begin
  select dp.dossier_id into v_dossier_id
  from public.dossier_propositions dp
  where dp.id = coalesce(new.dossier_proposition_id, old.dossier_proposition_id);

  select count(*) into v_nb_propositions
  from public.dossier_propositions
  where dossier_id = v_dossier_id;

  select count(*) into v_nb_participants
  from public.participants
  where dossier_id = v_dossier_id;

  if v_nb_propositions = 0 or v_nb_participants = 0 then
    return coalesce(new, old);
  end if;

  select not exists (
    select 1
    from public.participants p
    where p.dossier_id = v_dossier_id
      and (
        select count(*) from public.swipes s
        join public.dossier_propositions dp on dp.id = s.dossier_proposition_id
        where s.participant_id = p.id and dp.dossier_id = v_dossier_id
      ) < v_nb_propositions
  ) into v_tous_termines;

  update public.dossiers_voyage
  set statut_lecture = case when v_tous_termines then 'termine' else 'vu' end
  where id = v_dossier_id and statut_lecture <> 'envoye';

  return coalesce(new, old);
end;
$function$;
