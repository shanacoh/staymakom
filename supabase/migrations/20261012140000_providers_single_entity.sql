-- Chantier Partenaires, étape 1 : une seule entité Prestataire.
--
-- Le prestataire (celui qui réalise vraiment l'expérience, l'hôtel ou la sortie bateau) existait en
-- plusieurs morceaux qui ne se parlaient pas. On garde la table `providers` et on la complète, puis
-- on pose un lien vers elle partout où il manquait. Rien n'est supprimé, renommé ni modifié : on ne
-- fait qu'ajouter des colonnes, toutes dans des tables réservées aux admins.
--
-- Sauvegarde faite juste avant, dans le schéma `backup_20261012` (copies des 9 tables concernées).
-- Pour revenir en arrière : retirer les colonnes ajoutées ici, les deux déclencheurs et leurs
-- fonctions, puis supprimer le prestataire « Citrus & Salt ».
begin;

-- 1. Ce qu'un prestataire contient -----------------------------------------------------------------

alter table public.providers
  add column provider_type text not null default 'experience',
  add column status text not null default 'prospect',
  add column region_id uuid references public.regions (id) on delete set null,
  add column address text,
  add column contact_name text,
  add column day_contact_name text,
  add column day_contact_whatsapp text,
  add column day_contact_language text,
  add column commission_percent numeric,
  add column booking_channel text,
  add column booking_url text,
  add column legal_name text,
  add column tax_id text,
  add column terms_accepted_at timestamptz,
  add column terms_version text,
  add column crm_contact_id text,
  add constraint providers_provider_type_check
    check (provider_type in ('experience', 'hotel', 'boat', 'other')),
  add constraint providers_status_check
    check (status in ('prospect', 'en_discussion', 'signe', 'actif', 'en_pause', 'arrete')),
  add constraint providers_day_contact_language_check
    check (day_contact_language is null or day_contact_language in ('he', 'en', 'fr')),
  add constraint providers_commission_percent_check
    check (commission_percent is null or (commission_percent >= 0 and commission_percent <= 100)),
  add constraint providers_booking_channel_check
    check (booking_channel is null or booking_channel in ('hyperguest', 'provider_website', 'whatsapp', 'email', 'partner_portal'));

comment on table public.providers is
  'Interne (admins et serveur uniquement) : le prestataire, entité unique du back-office. Celui qui réalise vraiment l''expérience, l''hôtel ou la sortie bateau. Jamais visible côté client.';
comment on column public.providers.provider_type is 'experience, hotel, boat, other.';
comment on column public.providers.status is 'prospect, en_discussion, signe, actif, en_pause, arrete. Pilote is_active (faux pour en_pause et arrete).';
comment on column public.providers.language is 'Langue de communication : he, en, fr.';
comment on column public.providers.contact_name is 'Nom du contact principal (son email et son WhatsApp sont dans email et whatsapp).';
comment on column public.providers.day_contact_name is 'Contact du jour J par défaut : sert quand l''expérience n''a pas le sien.';
comment on column public.providers.commission_percent is 'Commission STAYMAKOM en %, saisie à la main. Vide = pas encore renseignée.';
comment on column public.providers.booking_channel is 'Canal de réservation par défaut : hyperguest, provider_website, whatsapp, email, partner_portal. Celui de l''expérience reste prioritaire.';
comment on column public.providers.booking_url is 'Lien du site de réservation du prestataire (canal provider_website).';
comment on column public.providers.legal_name is 'Facturation : raison sociale.';
comment on column public.providers.tax_id is 'Facturation : numéro fiscal. Pas de coordonnées bancaires ici.';
comment on column public.providers.terms_accepted_at is 'Date et heure d''acceptation des conditions partenaires (remplie par l''espace partenaire).';
comment on column public.providers.terms_version is 'Version des conditions partenaires acceptée (remplie par l''espace partenaire).';
comment on column public.providers.crm_contact_id is 'Identifiant du contact dans le CRM (autre base), pour une liaison future.';

create index providers_region_id_idx on public.providers (region_id);
create index providers_status_idx on public.providers (status);

-- `is_active` reste en place et suit le statut : un prestataire en pause ou arrêté n'est plus actif.
create function public.providers_sync_is_active()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.is_active := new.status not in ('en_pause', 'arrete');
  return new;
end;
$$;

-- 2. Reprise des 5 prestataires bateaux (avant de poser le déclencheur, pour partir de is_active) ----

update public.providers
set provider_type = 'boat',
    status = case when is_active then 'actif' else 'en_pause' end
where status = 'prospect' and provider_type = 'experience';

create trigger providers_sync_is_active
  before insert or update of status on public.providers
  for each row execute function public.providers_sync_is_active();

-- 3. Liaisons : un lien vers le prestataire là où il manquait ------------------------------------

alter table public.hotel2_internal
  add column provider_id uuid references public.providers (id);
comment on column public.hotel2_internal.provider_id is 'Le prestataire (de type hôtel) qui tient cet hôtel.';
create index hotel2_internal_provider_id_idx on public.hotel2_internal (provider_id);

alter table public.experience2_internal
  add column provider_id uuid references public.providers (id);
comment on column public.experience2_internal.provider_id is
  'Prestataire de l''activité quand ce n''est pas l''hôtel. Vide = le prestataire de l''hôtel.';
create index experience2_internal_provider_id_idx on public.experience2_internal (provider_id);

alter table public.catalogue_items
  add column provider_id uuid references public.providers (id) on delete set null;
comment on column public.catalogue_items.provider_id is 'Le prestataire derrière ce lieu du catalogue.';
create index catalogue_items_provider_id_idx on public.catalogue_items (provider_id);

alter table public.offer_must_haves
  add column provider_id uuid references public.providers (id) on delete set null;
comment on column public.offer_must_haves.provider_id is
  'Prestataire envisagé ou retenu (peut être un prospect). Le texte libre `partner` reste à côté.';
create index offer_must_haves_provider_id_idx on public.offer_must_haves (provider_id);

-- 4. Prestataire principal d'une expérience à plusieurs prestataires (bateaux) --------------------
-- Le prestataire principal d'une expérience est `standalone_experience_internal.provider_id`.
-- Quand l'expérience a une liste de prestataires, celui marqué « principal » dans la liste fait foi :
-- à chaque écriture de la liste, on recopie son prestataire sur la fiche, dans la même opération.
create function public.standalone_suppliers_sync_primary_provider()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_experience_id uuid := coalesce(new.experience_id, old.experience_id);
  v_provider_id uuid;
begin
  select s.provider_id into v_provider_id
  from public.standalone_experience_suppliers s
  where s.experience_id = v_experience_id and s.is_primary and s.provider_id is not null
  order by s.sort_order
  limit 1;

  if v_provider_id is not null then
    insert into public.standalone_experience_internal (experience_id, provider_id)
    values (v_experience_id, v_provider_id)
    on conflict (experience_id) do update set provider_id = excluded.provider_id
    where public.standalone_experience_internal.provider_id is distinct from excluded.provider_id;
  end if;
  return null;
end;
$$;

create trigger standalone_suppliers_sync_primary_provider
  after insert or delete or update of is_primary, provider_id on public.standalone_experience_suppliers
  for each row execute function public.standalone_suppliers_sync_primary_provider();

-- 5. Rattachements automatiques, uniquement sans ambiguïté -----------------------------------------
-- Un nom de fournisseur saisi en texte libre n'est relié que s'il est exactement le nom d'un
-- prestataire existant, et d'un seul. On ne crée jamais un prestataire en devinant son nom.

update public.standalone_experience_suppliers s
set provider_id = p.id
from public.providers p
where s.provider_id is null
  and btrim(s.supplier_name) = p.name
  and (select count(*) from public.providers p2 where p2.name = p.name) = 1;

update public.standalone_experience_internal i
set provider_id = p.id
from public.providers p
where i.provider_id is null
  and nullif(btrim(i.supplier_name), '') = p.name
  and (select count(*) from public.providers p2 where p2.name = p.name) = 1;

-- 6. Le seul prestataire créé : Citrus & Salt ------------------------------------------------------

do $$
declare
  v_region_id uuid;
  v_experience_id uuid;
  v_provider_id uuid;
begin
  select id into strict v_region_id from public.regions where slug = 'tel-aviv';
  select id into strict v_experience_id from public.standalone_experiences where slug = 'cooking-class-citrus-salt-tel-aviv';

  select id into v_provider_id from public.providers where name = 'Citrus & Salt';
  if v_provider_id is null then
    insert into public.providers (name, provider_type, status, region_id)
    values ('Citrus & Salt', 'experience', 'actif', v_region_id)
    returning id into v_provider_id;
  end if;

  insert into public.standalone_experience_internal (experience_id, provider_id)
  values (v_experience_id, v_provider_id)
  on conflict (experience_id) do update set provider_id = excluded.provider_id;
end $$;

-- 7. Sécurité : rien de tout cela n'est lisible par un visiteur ------------------------------------
-- Ces deux tables étaient déjà protégées par leur règle (admins uniquement). On retire en plus le
-- droit d'accès de base du visiteur non connecté, comme pour les autres tables internes.
revoke all on table public.providers from anon;
revoke all on table public.standalone_experience_suppliers from anon;

commit;
