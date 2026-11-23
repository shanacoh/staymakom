-- Chantier Partenaires, prompt 4 : un seul parcours partenaire, du premier lien au go live.
--
-- Ce fichier relie ce qui existe déjà (prestataires, espace /partner, conditions, propositions,
-- journal d'activité) ; il ne recrée rien. Uniquement des AJOUTS de colonnes, de tables et de
-- fonctions. Aucune colonne existante n'est supprimée, renommée ni modifiée. Deux règles de
-- contrôle de `partner_proposals` sont élargies (un type « note » et les hôtels), sans toucher aux
-- colonnes ni aux lignes existantes.
--
-- Rien ici ne touche à HyperGuest, au calcul des prix, au checkout, au paiement, au webhook Revolut
-- ni à la confirmation d'une réservation. Un seul déclencheur est posé sur `standalone_bookings` :
-- il NOTE la politique d'annulation et la commission en vigueur au moment du paiement, dans des
-- colonnes nouvelles, et ne peut jamais bloquer l'enregistrement (toute erreur est avalée).
--
-- Sécurité (inchangée dans son principe) : un partenaire, avec ou sans compte, n'a AUCUN accès
-- direct aux tables. Tout passe par des fonctions qui vérifient qui il est et ne renvoient que ses
-- données, sans marge, majoration, prix client, email ni téléphone de client.
--
-- Le lien partenaire (sans compte) : une seule porte d'entrée, `partner_link(jeton, action, args)`,
-- qui reconnaît le prestataire par son jeton, puis appelle les fonctions partenaire existantes en
-- leur indiquant ce prestataire pour la durée de l'appel seulement (réglage local à la transaction,
-- qu'aucun navigateur ne peut poser lui-même). Seules les actions listées dans cette porte sont
-- possibles : ni signature, ni réservations, ni revenus, ni avis.

-- 1. Colonnes ajoutées ----------------------------------------------------------------------------

alter table public.providers
  add column partner_link_token text unique,
  add column partner_link_created_at timestamptz,
  add column partner_link_first_opened_at timestamptz,
  add column partner_link_last_seen_at timestamptz,
  add column golive_target_date date,
  add column hotel_agreement_at timestamptz,
  add column hg_channel_manager_at timestamptz,
  add column hg_rooms_mapped_at timestamptz,
  add column hg_test_booking_at timestamptz,
  add column commission_type text,
  add column commission_value numeric,
  add column commission_fixed_unit text,
  add column signatory_name text,
  add column signatory_title text,
  add column golive_turn_key text,
  add column golive_turn_since timestamptz,
  add constraint providers_commission_type_check check (commission_type is null or commission_type in ('percent', 'fixed')),
  add constraint providers_commission_unit_check check (commission_fixed_unit is null or commission_fixed_unit in ('per_person', 'per_booking')),
  add constraint providers_commission_shape_check check (
    (commission_type is null and commission_value is null)
    or (commission_type = 'percent' and commission_value >= 0 and commission_value <= 100)
    or (commission_type = 'fixed' and commission_value >= 0 and commission_fixed_unit is not null)),
  add constraint providers_hotel_commission_percent_check check (provider_type <> 'hotel' or commission_type is distinct from 'fixed');

comment on column public.providers.partner_link_token is
  'Lien partenaire personnel (/partner/link/<jeton>) : non devinable, révocable (vide) et régénérable depuis la fiche. Lisible par les admins seulement.';
comment on column public.providers.partner_link_first_opened_at is 'Première ouverture du lien partenaire.';
comment on column public.providers.partner_link_last_seen_at is 'Dernière visite par le lien partenaire.';
comment on column public.providers.golive_target_date is 'Date cible de mise en ligne, saisie par l''équipe et affichée au partenaire.';
comment on column public.providers.hotel_agreement_at is 'Hôtels : accord trouvé (coché dans le back-office).';
comment on column public.providers.hg_channel_manager_at is 'Hôtels : channel manager renseigné dans HyperGuest (coché dans le back-office).';
comment on column public.providers.hg_rooms_mapped_at is 'Hôtels : chambres et tarifs mappés dans HyperGuest (coché dans le back-office).';
comment on column public.providers.hg_test_booking_at is 'Hôtels : réservation test faite (cochée dans le back-office).';
comment on column public.providers.commission_type is
  'Commission convenue : percent (pourcentage) ou fixed (montant fixe). Vide tant que rien n''est convenu. Hôtels : pourcentage uniquement. commission_percent reste tenu à jour pour l''existant.';
comment on column public.providers.commission_value is 'Valeur de la commission (pourcentage ou montant).';
comment on column public.providers.commission_fixed_unit is 'Montant fixe : per_person ou per_booking.';
comment on column public.providers.signatory_name is 'Hôtels : nom du signataire du contrat.';
comment on column public.providers.signatory_title is 'Hôtels : fonction du signataire du contrat.';
comment on column public.providers.golive_turn_key is 'Interne : étape du go live en cours la dernière fois qu''elle a été calculée (sert à la relance après 3 jours).';
comment on column public.providers.golive_turn_since is 'Interne : depuis quand l''étape en cours n''a pas bougé.';

-- Reprise : une commission en pourcentage déjà saisie devient une commission de type pourcentage.
update public.providers
set commission_type = 'percent', commission_value = commission_percent
where commission_percent is not null;

alter table public.standalone_experience_internal
  add column public_price_adult numeric,
  add column public_price_child numeric,
  add column public_price_updated_at timestamptz,
  add column commission_type text,
  add column commission_value numeric,
  add column commission_fixed_unit text,
  add constraint sei_public_price_check check ((public_price_adult is null or public_price_adult >= 0) and (public_price_child is null or public_price_child >= 0)),
  add constraint sei_commission_shape_check check (
    (commission_type is null and commission_value is null and commission_fixed_unit is null)
    or (commission_type = 'percent' and commission_value >= 0 and commission_value <= 100 and commission_fixed_unit is null)
    or (commission_type = 'fixed' and commission_value >= 0 and commission_fixed_unit in ('per_person', 'per_booking')));
comment on column public.standalone_experience_internal.public_price_adult is
  'Prix public du partenaire (ce qu''il facture en direct), par adulte. Avec la commission, il donne le prix fournisseur. N''apparaît jamais sur le site.';
comment on column public.standalone_experience_internal.public_price_child is 'Prix public du partenaire, par enfant.';
comment on column public.standalone_experience_internal.commission_type is 'Commission propre à cette expérience (remplace celle du prestataire). Vide = celle du prestataire.';

alter table public.standalone_experiences
  add column min_age integer,
  add column private_groups_only boolean not null default false,
  add column free_cancellation_hours integer not null default 48,
  add constraint standalone_min_age_check check (min_age is null or (min_age >= 0 and min_age <= 99)),
  add constraint standalone_free_cancellation_hours_check check (free_cancellation_hours in (24, 48));
comment on column public.standalone_experiences.min_age is 'Règle du partenaire : âge minimum des participants (vide = aucun).';
comment on column public.standalone_experiences.private_groups_only is 'Règle du partenaire : groupes privés uniquement.';
comment on column public.standalone_experiences.free_cancellation_hours is
  'Annulation gratuite jusqu''à 48 h (par défaut) ou 24 h avant, au choix du partenaire. Le texte affiché (cancellation_policy*) suit ce choix quand le partenaire le change.';

alter table public.standalone_bookings
  add column free_cancellation_hours integer,
  add column cancellation_policy_snapshot jsonb,
  add column commission_snapshot jsonb,
  add column policy_recorded_at timestamptz;
comment on column public.standalone_bookings.cancellation_policy_snapshot is
  'Politique d''annulation (en / fr / he) en vigueur au moment du paiement. Un changement ultérieur sur la fiche ne s''applique pas à cette réservation.';
comment on column public.standalone_bookings.commission_snapshot is 'Commission en vigueur au moment du paiement.';

alter table public.partner_terms_versions
  add column kind text not null default 'experience_terms',
  add constraint partner_terms_versions_kind_check check (kind in ('experience_terms', 'hotel_contract'));
comment on column public.partner_terms_versions.kind is
  'experience_terms = conditions expériences ; hotel_contract = contrat hôtel (modèle à variables {{hotel_name}}, {{company}}, {{registration_number}}, {{address}}, {{signatory_name}}, {{signatory_title}}, {{commission}}, {{date}}).';

alter table public.partner_terms_acceptances
  add column kind text not null default 'experience_terms',
  add column signer_title text,
  add column signature_data text,
  add column authorized_to_sign boolean,
  add column commission_snapshot jsonb,
  add column contract_variables jsonb,
  add column rendered_text text,
  add column contract_pdf_path text,
  add column contract_emailed_at timestamptz;
comment on column public.partner_terms_acceptances.signature_data is 'Contrat hôtel : signature dessinée au doigt (image PNG).';
comment on column public.partner_terms_acceptances.commission_snapshot is 'Commission acceptée avec ces conditions. Si elle change ensuite, le partenaire doit accepter à nouveau.';
comment on column public.partner_terms_acceptances.rendered_text is 'Contrat hôtel : texte complet tel que signé, variables remplies.';
comment on column public.partner_terms_acceptances.contract_pdf_path is 'Contrat hôtel : PDF signé dans le stockage privé partner-contracts.';

alter table public.partner_proposals
  add column hotel_id uuid references public.hotels2 (id) on delete cascade,
  add column section text,
  add column via_link boolean not null default false;
comment on column public.partner_proposals.hotel_id is 'Proposition sur une page hôtel (au lieu d''une expérience).';
comment on column public.partner_proposals.section is 'Section de l''annonce concernée (story, photos, inclusions, practical, rooms...).';
comment on column public.partner_proposals.via_link is 'Envoyée depuis le lien partenaire, sans compte.';
create index partner_proposals_hotel_id_idx on public.partner_proposals (hotel_id);

-- Le type « note » : une demande de modification en texte libre (photos, inclusions, page hôtel),
-- appliquée à la main par l'équipe. Les propositions existantes restent valides.
alter table public.partner_proposals drop constraint partner_proposals_type_check;
alter table public.partner_proposals add constraint partner_proposals_type_check
  check (proposal_type in ('text', 'photos', 'price', 'practical_info', 'new_experience', 'note'));
alter table public.partner_proposals drop constraint partner_proposals_experience_check;
alter table public.partner_proposals add constraint partner_proposals_experience_check
  check (
    (proposal_type = 'new_experience' and experience_id is null and hotel_id is null)
    or (proposal_type = 'note' and num_nonnulls(experience_id, hotel_id) = 1)
    or (proposal_type not in ('new_experience', 'note') and experience_id is not null and hotel_id is null));

alter table public.partner_activity_log
  add column via_link boolean not null default false,
  add column hotel_id uuid references public.hotels2 (id) on delete cascade;
comment on column public.partner_activity_log.via_link is 'Action faite depuis le lien partenaire, sans compte.';

-- 2. Suivi des champs de l'annonce -----------------------------------------------------------------
-- Une petite table plutôt qu'une colonne par champ : l'état d'un champ dépend de sa valeur ACTUELLE.
-- On garde l'empreinte de la valeur confirmée (ou remplie) par le partenaire : si l'équipe modifie
-- ensuite le champ, l'empreinte ne correspond plus et le champ redevient « à confirmer ».

create table public.partner_listing_fields (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  experience_id uuid references public.standalone_experiences (id) on delete cascade,
  hotel_id uuid references public.hotels2 (id) on delete cascade,
  field_key text not null,
  confirmed_hash text,
  confirmed_at timestamptz,
  confirmed_via_link boolean not null default false,
  partner_hash text,
  partner_filled_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint partner_listing_fields_target_check check (num_nonnulls(experience_id, hotel_id) = 1)
);
comment on table public.partner_listing_fields is
  'Interne : pour chaque champ d''une annonce, ce que le partenaire a confirmé (« Ça me va ») ou rempli lui-même, sous forme d''empreinte de la valeur.';
create unique index partner_listing_fields_experience_key on public.partner_listing_fields (experience_id, field_key) where experience_id is not null;
create unique index partner_listing_fields_hotel_key on public.partner_listing_fields (hotel_id, field_key) where hotel_id is not null;
create index partner_listing_fields_provider_idx on public.partner_listing_fields (provider_id);

alter table public.partner_listing_fields enable row level security;
revoke all on table public.partner_listing_fields from anon;
grant select, insert, update, delete on table public.partner_listing_fields to authenticated;
grant all on table public.partner_listing_fields to service_role;
create policy partner_listing_fields_admin_all on public.partner_listing_fields for all to authenticated
  using (has_role(auth.uid(), 'admin'::app_role)) with check (has_role(auth.uid(), 'admin'::app_role));

-- 3. Qui est ce partenaire ? (compte OU lien) -------------------------------------------------------

-- Le prestataire désigné par le lien pendant l'appel en cours (posé uniquement par `partner_link`).
create function public.partner_link_provider_id()
returns uuid
language sql
stable
set search_path = public
as $$
  select nullif(current_setting('staymakom.partner_link_provider', true), '')::uuid
$$;

create function public.partner_in_link_mode()
returns boolean
language sql
stable
set search_path = public
as $$
  select public.partner_link_provider_id() is not null
$$;

-- Le lien passe avant le compte : un partenaire connecté qui ouvre le lien d'un autre prestataire
-- (ou un admin qui « voit comme le partenaire ») n'agit que sur le prestataire du lien.
create or replace function public.current_partner_provider_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.partner_link_provider_id() is not null then
      (select p.id from public.providers p where p.id = public.partner_link_provider_id() and p.status <> 'arrete')
    else
      (select pu.provider_id
       from public.provider_users pu
       join public.providers p on p.id = pu.provider_id
       where pu.user_id = auth.uid() and p.status <> 'arrete')
  end
$$;

create function public.partner_terms_kind(p_provider uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case when (select p.provider_type from public.providers p where p.id = p_provider) = 'hotel'
              then 'hotel_contract' else 'experience_terms' end
$$;

create function public.partner_current_terms_version_for(p_provider uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select max(v.version) from public.partner_terms_versions v
  where v.published_at is not null and v.kind = public.partner_terms_kind(p_provider)
$$;

-- Inchangée pour ses appelants : la version en vigueur, désormais pour le type de CE prestataire.
create or replace function public.partner_current_terms_version()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select public.partner_current_terms_version_for(public.current_partner_provider_id())
$$;

-- La commission convenue : celle du prestataire, et celles propres à certaines expériences.
create function public.partner_commission_of(p_provider uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'type', p.commission_type, 'value', p.commission_value, 'unit', p.commission_fixed_unit,
    'experiences', (
      select jsonb_object_agg(i.experience_id::text, jsonb_strip_nulls(jsonb_build_object(
        'type', i.commission_type, 'value', i.commission_value, 'unit', i.commission_fixed_unit)))
      from public.standalone_experience_internal i
      where i.provider_id = p.id and i.commission_type is not null)))
  from public.providers p where p.id = p_provider
$$;

create function public.partner_commission_ready(p_provider uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.commission_type is not null and p.commission_value is not null
                   from public.providers p where p.id = p_provider), false)
$$;

-- Conditions à jour : la version en vigueur est acceptée ET la commission n'a pas changé depuis.
-- (Une acceptation antérieure à ce chantier, sans commission notée, vaut pour « aucune commission ».)
create function public.partner_terms_ok(p_provider uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.providers p
    where p.id = p_provider and p.terms_version = public.partner_current_terms_version_for(p_provider)::text
  ) and coalesce((
    select coalesce(a.commission_snapshot, '{}'::jsonb)
    from public.partner_terms_acceptances a
    where a.provider_id = p_provider
    order by a.accepted_at desc limit 1), '{}'::jsonb) = coalesce(public.partner_commission_of(p_provider), '{}'::jsonb)
$$;

-- Porte d'entrée des fonctions partenaire. Le contenu (annonce, infos pratiques, règles, dispos)
-- s'ouvre dès le premier lien, avant signature : c'est un outil de vente. Les réservations, revenus,
-- avis et utilisateurs passent par `partner_require_signed`, et ne sont jamais ouverts par le lien.
-- `p_terms` est conservé pour les appels existants et n'a plus d'effet.
create or replace function public.partner_require(p_terms boolean default true)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.current_partner_provider_id();
begin
  if v_provider is null then
    raise exception 'not_partner' using errcode = '42501';
  end if;
  return v_provider;
end;
$$;

create function public.partner_require_signed()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.partner_require();
begin
  if public.partner_in_link_mode() then
    raise exception 'account_required' using errcode = '42501';
  end if;
  if not public.partner_terms_ok(v_provider) then
    raise exception 'terms_required' using errcode = '42501';
  end if;
  return v_provider;
end;
$$;

create or replace function public.partner_bookings()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select public.partner_bookings_of(public.partner_require_signed())
$$;

create or replace function public.partner_reviews()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.partner_require_signed();
begin
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', r.id,
      'experience_title', e.title, 'experience_title_fr', e.title_fr, 'experience_title_he', e.title_he,
      'customer_first_name', r.customer_first_name, 'customer_last_initial', r.customer_last_initial,
      'rating', r.rating, 'comment', r.comment, 'lang', r.lang,
      'review_date', coalesce(r.review_date, r.created_at::date),
      'staff_reply', r.staff_reply)
      order by coalesce(r.review_date, r.created_at::date) desc), '[]'::jsonb)
    from public.reviews r
    left join public.standalone_experiences e on e.id = r.standalone_experience_id
    left join public.standalone_experience_internal i on i.experience_id = r.standalone_experience_id
    where r.moderation_status = 'published'
      and (r.provider_id = v_provider or (r.provider_id is null and i.provider_id = v_provider))
  );
end;
$$;

create or replace function public.partner_users()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.partner_require_signed();
begin
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'email', pu.email, 'last_login_at', pu.last_login_at, 'is_me', pu.user_id = auth.uid())
      order by pu.created_at), '[]'::jsonb)
    from public.provider_users pu
    where pu.provider_id = v_provider
  );
end;
$$;

create function public.partner_owns_hotel(p_provider uuid, p_hotel uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.hotel2_internal hi where hi.hotel_id = p_hotel and hi.provider_id = p_provider)
$$;

-- 4. Les champs d'une annonce ----------------------------------------------------------------------

create function public.partner_pick(p_row jsonb, p_key text, p_lang text)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select coalesce(
    nullif(nullif(p_row -> (p_key || case p_lang when 'fr' then '_fr' when 'he' then '_he' else '' end), 'null'::jsonb), '""'::jsonb),
    p_row -> p_key)
$$;

create function public.partner_is_empty(p_value jsonb)
returns boolean
language sql
immutable
set search_path = public
as $$
  select p_value is null or p_value in ('null'::jsonb, '""'::jsonb, '[]'::jsonb, '{}'::jsonb)
    or (jsonb_typeof(p_value) = 'string' and btrim(p_value #>> '{}') = '')
$$;

-- La liste des champs d'une annonce, avec leur section, s'ils sont obligatoires, et leur valeur
-- (dans la langue du prestataire). Jamais le prix client, la marge ni le prix fournisseur.
create function public.partner_listing_values(p_provider uuid, p_kind text, p_target uuid)
returns table (section text, field_key text, required boolean, value jsonb)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_lang text := coalesce((select p.language from public.providers p where p.id = p_provider), 'en');
  e jsonb;
  i jsonb;
  h jsonb;
begin
  if p_kind = 'experience' then
    select to_jsonb(x) into e from public.standalone_experiences x where x.id = p_target;
    select to_jsonb(y) into i from public.standalone_experience_internal y where y.experience_id = p_target;
    if e is null then return; end if;
    return query
    select v.section, v.field_key, v.required, v.value from (values
      ('story', 'title', true, public.partner_pick(e, 'title', v_lang)),
      ('story', 'subtitle', false, public.partner_pick(e, 'subtitle', v_lang)),
      ('story', 'long_copy', true, public.partner_pick(e, 'long_copy', v_lang)),
      ('story', 'duration', true, public.partner_pick(e, 'duration', v_lang)),
      ('photos', 'photos', true,
        (select coalesce(jsonb_agg(s.u order by s.o), '[]'::jsonb) from (
           select a.u, min(a.o) as o from (
             select e->>'hero_image' as u, 0::bigint as o
             union all
             select t.u, t.o from jsonb_array_elements_text(
               case when jsonb_typeof(e->'photos') = 'array' then e->'photos' else '[]'::jsonb end) with ordinality t(u, o)
           ) a where coalesce(a.u, '') <> '' group by a.u) s)),
      ('inclusions', 'inclusions', true,
        (select coalesce(jsonb_agg(coalesce(nullif(case v_lang when 'fr' then inc.title_fr when 'he' then inc.title_he end, ''), inc.title)
                                   order by inc.order_index), '[]'::jsonb)
         from public.standalone_experience_includes inc where inc.experience_id = p_target and inc.published)),
      ('practical', 'meeting_point', true, public.partner_pick(e, 'meeting_point', v_lang)),
      ('practical', 'address', true, public.partner_pick(e, 'address', v_lang)),
      ('practical', 'arrive_minutes_before', false, e->'arrive_minutes_before'),
      ('practical', 'access_note', false, public.partner_pick(e, 'access_note', v_lang)),
      ('practical', 'day_contact', true,
        case when coalesce(i->>'day_contact_name', '') <> '' or coalesce(i->>'day_contact_phone', '') <> ''
             then jsonb_strip_nulls(jsonb_build_object('name', i->'day_contact_name', 'phone', i->'day_contact_phone')) end),
      ('practical', 'public_price', true,
        case when i->'public_price_adult' is not null and i->'public_price_adult' <> 'null'::jsonb
             then jsonb_strip_nulls(jsonb_build_object('adult', i->'public_price_adult', 'child', nullif(i->'public_price_child', 'null'::jsonb))) end),
      ('rules', 'group_size', true, jsonb_build_object('min', e->'min_party', 'max', e->'max_party')),
      ('rules', 'min_age', false, e->'min_age'),
      ('rules', 'lead_time_days', false, e->'lead_time_days'),
      ('rules', 'available_days', true, e->'available_days'),
      ('rules', 'private_groups_only', false, e->'private_groups_only'),
      ('rules', 'know_before_you_go', false, public.partner_pick(e, 'know_before_you_go', v_lang)),
      ('rules', 'free_cancellation_hours', true, e->'free_cancellation_hours')
    ) as v(section, field_key, required, value);

  elsif p_kind = 'hotel' then
    select to_jsonb(x) into h from public.hotels2 x where x.id = p_target;
    if h is null then return; end if;
    return query
    select v.section, v.field_key, v.required, v.value from (values
      ('story', 'name', true, public.partner_pick(h, 'name', v_lang)),
      ('story', 'story', true, public.partner_pick(h, 'story', v_lang)),
      ('story', 'highlights', false, public.partner_pick(h, 'highlights', v_lang)),
      ('photos', 'photos', true,
        (select coalesce(jsonb_agg(s.u order by s.o), '[]'::jsonb) from (
           select a.u, min(a.o) as o from (
             select h->>'hero_image' as u, 0::bigint as o
             union all
             select t.u, t.o from jsonb_array_elements_text(
               case when jsonb_typeof(h->'photos') = 'array' then h->'photos' else '[]'::jsonb end) with ordinality t(u, o)
           ) a where coalesce(a.u, '') <> '' group by a.u) s)),
      ('rooms', 'description_room', false, public.partner_pick(h, 'description_room', v_lang)),
      ('practical', 'address', true, public.partner_pick(h, 'address', v_lang)),
      ('practical', 'description_location', false, public.partner_pick(h, 'description_location', v_lang)),
      ('practical', 'check_in_out', false,
        case when coalesce(h->>'check_in_time', '') <> '' or coalesce(h->>'check_out_time', '') <> ''
             then jsonb_strip_nulls(jsonb_build_object('check_in', h->'check_in_time', 'check_out', h->'check_out_time')) end)
    ) as v(section, field_key, required, value);
  end if;
end;
$$;

-- Les champs avec leur source et leur état :
--  source = partner si la valeur actuelle est celle que le partenaire a remplie, sinon staymakom ;
--  state  = confirmed (confirmée ou remplie par lui) / to_fill (obligatoire et vide) / to_confirm.
create function public.partner_listing_fields_of(p_provider uuid, p_kind text, p_target uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'section', v.section, 'key', v.field_key, 'required', v.required, 'value', v.value,
      'source', case when f.partner_hash = md5(coalesce(v.value::text, '')) then 'partner' else 'staymakom' end,
      'state', case
        when f.partner_hash = md5(coalesce(v.value::text, '')) or f.confirmed_hash = md5(coalesce(v.value::text, '')) then 'confirmed'
        when v.required and public.partner_is_empty(v.value) then 'to_fill'
        else 'to_confirm' end,
      'confirmed_at', case when f.confirmed_hash = md5(coalesce(v.value::text, '')) then f.confirmed_at end)
    ), '[]'::jsonb)
  from public.partner_listing_values(p_provider, p_kind, p_target) v
  left join public.partner_listing_fields f
    on f.field_key = v.field_key
   and ((p_kind = 'experience' and f.experience_id = p_target) or (p_kind = 'hotel' and f.hotel_id = p_target))
$$;

-- Note des champs comme remplis par le partenaire (empreinte de leur valeur actuelle).
create function public.partner_mark_filled(p_provider uuid, p_kind text, p_target uuid, p_keys text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v record;
begin
  for v in select * from public.partner_listing_values(p_provider, p_kind, p_target) where field_key = any (p_keys) loop
    if p_kind = 'experience' then
      insert into public.partner_listing_fields (provider_id, experience_id, field_key, partner_hash, partner_filled_at)
      values (p_provider, p_target, v.field_key, md5(coalesce(v.value::text, '')), now())
      on conflict (experience_id, field_key) where experience_id is not null
      do update set partner_hash = excluded.partner_hash, partner_filled_at = now(), updated_at = now();
    else
      insert into public.partner_listing_fields (provider_id, hotel_id, field_key, partner_hash, partner_filled_at)
      values (p_provider, p_target, v.field_key, md5(coalesce(v.value::text, '')), now())
      on conflict (hotel_id, field_key) where hotel_id is not null
      do update set partner_hash = excluded.partner_hash, partner_filled_at = now(), updated_at = now();
    end if;
  end loop;
end;
$$;

-- 5. Le go live ------------------------------------------------------------------------------------

-- L'annonce sur laquelle porte le go live : pour une expérience, la plus récente pas encore en ligne
-- (sinon la plus récente en ligne) ; pour un hôtel, sa page.
create function public.partner_golive_target(p_provider uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when p.provider_type = 'hotel' then
    (select jsonb_build_object('kind', 'hotel', 'id', h.id, 'slug', h.slug, 'status', h.status::text,
                               'title', h.name, 'title_he', h.name_he, 'title_fr', h.name_fr)
     from public.hotel2_internal hi join public.hotels2 h on h.id = hi.hotel_id
     where hi.provider_id = p.id and h.status <> 'archived'
     order by (h.status = 'published'), h.created_at desc limit 1)
  else
    (select jsonb_build_object('kind', 'experience', 'id', e.id, 'slug', e.slug, 'status', e.status,
                               'title', e.title, 'title_he', e.title_he, 'title_fr', e.title_fr)
     from public.standalone_experience_internal i join public.standalone_experiences e on e.id = i.experience_id
     where i.provider_id = p.id and e.status <> 'archived'
     order by (e.status = 'published'), e.created_at desc limit 1)
  end
  from public.providers p where p.id = p_provider
$$;

-- Les étapes, calculées à partir des données (aucune case à cocher côté partenaire). Chaque étape
-- dit qui doit agir. L'étape en cours est la première non faite ; c'est « votre tour » quand c'est
-- au partenaire d'agir.
create function public.partner_golive_of(p_provider uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  p public.providers;
  v_target jsonb := public.partner_golive_target(p_provider);
  v_kind text;
  v_id uuid;
  v_fields jsonb := '[]'::jsonb;
  v_steps jsonb := '[]'::jsonb;
  v_today text := (now() at time zone 'Asia/Jerusalem')::date::text;
  v_commission boolean := public.partner_commission_ready(p_provider);
  v_contract_ready boolean;
  v_terms_ok boolean := public.partner_terms_ok(p_provider);
  e public.standalone_experiences;
  h public.hotels2;
  v_photos int;
  v_reviewed boolean;
  v_current jsonb;
  v_total int;
  v_team int;
  v_for_you int;
begin
  select * into p from public.providers where id = p_provider;
  if not found then return null; end if;
  v_kind := coalesce(v_target->>'kind', case when p.provider_type = 'hotel' then 'hotel' else 'experience' end);
  v_id := (v_target->>'id')::uuid;
  if v_id is not null then
    v_fields := public.partner_listing_fields_of(p_provider, v_kind, v_id);
  end if;

  -- « Relue » : plus aucun champ « à confirmer » (les champs vides relèvent des infos pratiques).
  v_reviewed := v_id is not null and not exists (
    select 1 from jsonb_array_elements(v_fields) f where f->>'state' = 'to_confirm');
  -- Les conditions sont signables quand la commission est saisie et un texte publié (pas un brouillon).
  v_contract_ready := v_commission and exists (
    select 1 from public.partner_terms_versions t
    where t.version = public.partner_current_terms_version_for(p_provider)
      and btrim(t.text_en) not in ('', 'À coller', 'À rédiger'));

  if v_kind = 'experience' then
    if v_id is not null then select * into e from public.standalone_experiences where id = v_id; end if;
    select count(*) into v_photos from jsonb_array_elements(coalesce(
      (select f->'value' from jsonb_array_elements(v_fields) f where f->>'key' = 'photos'), '[]'::jsonb));

    v_steps := jsonb_build_array(
      jsonb_build_object('key', 'prepared', 'actor', 'staymakom',
        'done', v_id is not null and coalesce(btrim(e.title), '') <> '' and coalesce(btrim(e.long_copy), '') <> ''
                and coalesce(btrim(e.duration), '') <> '' and v_photos > 0),
      jsonb_build_object('key', 'reviewed', 'actor', 'partner', 'done', v_reviewed),
      jsonb_build_object('key', 'practical', 'actor', 'partner',
        'subtasks', jsonb_build_array(
          jsonb_build_object('key', 'meeting_point', 'done', exists (select 1 from jsonb_array_elements(v_fields) f where f->>'key' = 'meeting_point' and not public.partner_is_empty(f->'value'))),
          jsonb_build_object('key', 'public_price', 'done', exists (select 1 from jsonb_array_elements(v_fields) f where f->>'key' = 'public_price' and not public.partner_is_empty(f->'value'))),
          jsonb_build_object('key', 'day_contact', 'done', exists (select 1 from jsonb_array_elements(v_fields) f where f->>'key' = 'day_contact' and not public.partner_is_empty(f->'value'))),
          jsonb_build_object('key', 'photos', 'done', v_photos >= 3))),
      jsonb_build_object('key', 'terms', 'actor', case when v_contract_ready then 'partner' else 'staymakom' end,
        'done', v_terms_ok and p.terms_version is not null, 'waiting_commission', not v_commission),
      jsonb_build_object('key', 'dates', 'actor', 'partner',
        'done', v_id is not null and case
          when e.availability_mode = 'whitelist' then exists (
            select 1 from jsonb_array_elements_text(case when jsonb_typeof(e.whitelisted_dates) = 'array' then e.whitelisted_dates else '[]'::jsonb end) d
            where d >= v_today)
          else jsonb_typeof(e.available_days) = 'array' and jsonb_array_length(e.available_days) > 0
               and (e.availability_end_date is null or e.availability_end_date::text >= v_today)
          end),
      jsonb_build_object('key', 'online', 'actor', 'staymakom', 'done', v_id is not null and e.status = 'published'));
    -- Infos pratiques faites quand toutes les sous-tâches le sont.
    v_steps := jsonb_set(v_steps, '{2,done}', to_jsonb(not exists (
      select 1 from jsonb_array_elements(v_steps->2->'subtasks') s where not (s->>'done')::boolean)));
  else
    if v_id is not null then select * into h from public.hotels2 where id = v_id; end if;
    v_steps := jsonb_build_array(
      jsonb_build_object('key', 'agreement', 'actor', 'staymakom', 'done', p.hotel_agreement_at is not null),
      jsonb_build_object('key', 'prepared', 'actor', 'staymakom',
        'done', v_id is not null and coalesce(btrim(h.name), '') <> '' and coalesce(btrim(h.story), '') <> ''
                and (coalesce(h.hero_image, '') <> '' or coalesce(array_length(h.photos, 1), 0) > 0)),
      jsonb_build_object('key', 'reviewed', 'actor', 'partner', 'done', v_reviewed),
      jsonb_build_object('key', 'contract', 'actor', case when v_contract_ready then 'partner' else 'staymakom' end,
        'done', v_terms_ok and p.terms_version is not null, 'waiting_commission', not v_commission),
      jsonb_build_object('key', 'hyperguest', 'actor', 'staymakom',
        'done', p.hg_channel_manager_at is not null and p.hg_rooms_mapped_at is not null and p.hg_test_booking_at is not null,
        'subtasks', jsonb_build_array(
          jsonb_build_object('key', 'channel_manager', 'done', p.hg_channel_manager_at is not null),
          jsonb_build_object('key', 'rooms_mapped', 'done', p.hg_rooms_mapped_at is not null),
          jsonb_build_object('key', 'test_booking', 'done', p.hg_test_booking_at is not null))),
      jsonb_build_object('key', 'online', 'actor', 'staymakom', 'done', v_id is not null and h.status::text = 'published'));
  end if;

  select s into v_current from jsonb_array_elements(v_steps) s where not (s->>'done')::boolean limit 1;
  select count(*),
         count(*) filter (where f->>'source' = 'staymakom' and not public.partner_is_empty(f->'value')),
         count(*) filter (where f->>'state' <> 'confirmed')
  into v_total, v_team, v_for_you
  from jsonb_array_elements(v_fields) f;

  return jsonb_build_object(
    'kind', v_kind,
    'target', v_target,
    'steps', v_steps,
    'current_step', v_current->>'key',
    'my_turn', coalesce(v_current->>'actor' = 'partner', false),
    'target_date', p.golive_target_date,
    'counts', jsonb_build_object('total', v_total, 'prepared_by_team', v_team, 'for_you', v_for_you),
    'commission', public.partner_commission_of(p_provider),
    'commission_ready', v_commission);
end;
$$;

-- Le go live, avec « depuis quand l'étape en cours n'a pas bougé » (pour la relance).
create function public.partner_golive_with_turn(p_provider uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_golive jsonb := public.partner_golive_of(p_provider);
  v_key text := coalesce(v_golive->>'current_step', 'done') || ':' || case when (v_golive->>'my_turn')::boolean then 'partner' else 'staymakom' end;
  v_since timestamptz;
begin
  update public.providers
  set golive_turn_key = v_key, golive_turn_since = now()
  where id = p_provider and golive_turn_key is distinct from v_key;
  select golive_turn_since into v_since from public.providers where id = p_provider;
  return v_golive || jsonb_build_object('turn_since', v_since);
end;
$$;

-- 6. Fonctions partenaire (compte ou lien) ---------------------------------------------------------

create function public.partner_golive()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.partner_golive_with_turn(public.partner_require())
$$;

create function public.partner_check_target(p_provider uuid, p_kind text, p_target uuid)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_target is null
     or (p_kind = 'experience' and not public.partner_owns_experience(p_provider, p_target, true))
     or (p_kind = 'hotel' and not public.partner_owns_hotel(p_provider, p_target))
     or p_kind not in ('experience', 'hotel') then
    raise exception 'not_found' using errcode = '42501';
  end if;
end;
$$;

-- L'aperçu d'une annonce : le contenu à afficher (comme la page publique, sans aucun prix client)
-- et l'état de chaque champ.
create function public.partner_listing(p_kind text, p_target uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.partner_require();
  v_content jsonb;
begin
  perform public.partner_check_target(v_provider, p_kind, p_target);

  if p_kind = 'experience' then
    select jsonb_build_object(
      'id', e.id, 'slug', e.slug, 'status', e.status,
      'title', e.title, 'title_fr', e.title_fr, 'title_he', e.title_he,
      'subtitle', e.subtitle, 'subtitle_fr', e.subtitle_fr, 'subtitle_he', e.subtitle_he,
      'long_copy', e.long_copy, 'long_copy_fr', e.long_copy_fr, 'long_copy_he', e.long_copy_he,
      'duration', e.duration, 'duration_fr', e.duration_fr, 'duration_he', e.duration_he,
      'hero_image', e.hero_image, 'photos', coalesce(e.photos, '[]'::jsonb),
      'city', e.city, 'city_fr', e.city_fr, 'city_he', e.city_he,
      'region', e.region, 'region_fr', e.region_fr, 'region_he', e.region_he, 'region_id', e.region_id,
      'address', e.address, 'address_fr', e.address_fr, 'address_he', e.address_he, 'hide_exact_address', e.hide_exact_address,
      'latitude', e.latitude, 'longitude', e.longitude) || jsonb_build_object(
      'min_party', e.min_party, 'max_party', e.max_party, 'lead_time_days', e.lead_time_days,
      'has_time_slots', e.has_time_slots, 'time_slots', e.time_slots, 'session_labels', e.session_labels,
      'available_days', e.available_days, 'blocked_dates', e.blocked_dates, 'availability_end_date', e.availability_end_date,
      'availability_mode', e.availability_mode, 'whitelisted_dates', e.whitelisted_dates,
      'schedule_note', e.schedule_note, 'schedule_note_fr', e.schedule_note_fr, 'schedule_note_he', e.schedule_note_he,
      'access_note', e.access_note, 'access_note_fr', e.access_note_fr, 'access_note_he', e.access_note_he,
      'meeting_point', e.meeting_point, 'meeting_point_fr', e.meeting_point_fr, 'meeting_point_he', e.meeting_point_he,
      'know_before_you_go', e.know_before_you_go, 'know_before_you_go_fr', e.know_before_you_go_fr, 'know_before_you_go_he', e.know_before_you_go_he,
      'arrive_minutes_before', e.arrive_minutes_before,
      'languages', e.languages, 'practical_info', e.practical_info, 'essentials_private_on_request', e.essentials_private_on_request,
      'cancellation_policy', e.cancellation_policy, 'cancellation_policy_fr', e.cancellation_policy_fr, 'cancellation_policy_he', e.cancellation_policy_he) || jsonb_build_object(
      'category_id', e.category_id,
      'min_age', e.min_age, 'private_groups_only', e.private_groups_only, 'free_cancellation_hours', e.free_cancellation_hours,
      'public_price', jsonb_build_object('adult', i.public_price_adult, 'child', i.public_price_child),
      'currency', coalesce(e.currency, 'ILS'),
      'day_contact', jsonb_build_object('name', i.day_contact_name, 'phone', i.day_contact_phone, 'language', i.day_contact_language),
      'includes', (
        select coalesce(jsonb_agg(jsonb_build_object('id', inc.id, 'title', inc.title, 'title_fr', inc.title_fr, 'title_he', inc.title_he,
                                                     'icon_url', inc.icon_url) order by inc.order_index), '[]'::jsonb)
        from public.standalone_experience_includes inc where inc.experience_id = e.id and inc.published))
    into v_content
    from public.standalone_experiences e
    left join public.standalone_experience_internal i on i.experience_id = e.id
    where e.id = p_target;
  else
    select jsonb_build_object(
      'id', h.id, 'slug', h.slug, 'status', h.status::text,
      'name', h.name, 'name_fr', h.name_fr, 'name_he', h.name_he,
      'story', h.story, 'story_fr', h.story_fr, 'story_he', h.story_he,
      'highlights', h.highlights, 'highlights_fr', h.highlights_fr, 'highlights_he', h.highlights_he,
      'amenities', h.amenities, 'amenities_fr', h.amenities_fr, 'amenities_he', h.amenities_he,
      'address', h.address, 'address_fr', h.address_fr, 'address_he', h.address_he,
      'city', h.city, 'city_fr', h.city_fr, 'city_he', h.city_he,
      'region', h.region, 'region_fr', h.region_fr, 'region_he', h.region_he, 'region_id', h.region_id,
      'latitude', h.latitude, 'longitude', h.longitude,
      'hero_image', h.hero_image, 'photos', to_jsonb(coalesce(h.photos, array[]::text[]))) || jsonb_build_object(
      'description_room', h.description_room, 'description_room_fr', h.description_room_fr, 'description_room_he', h.description_room_he,
      'description_location', h.description_location, 'description_location_fr', h.description_location_fr, 'description_location_he', h.description_location_he,
      'star_rating', h.star_rating, 'property_type', h.property_type, 'number_of_rooms', h.number_of_rooms,
      'check_in_time', h.check_in_time, 'check_out_time', h.check_out_time,
      'room_capacities', h.room_capacities, 'hyperguest_facilities', h.hyperguest_facilities,
      'cancellation_policy', h.cancellation_policy, 'min_stay', h.min_stay, 'max_stay', h.max_stay,
      'extra_conditions', h.extra_conditions, 'supported_cards', h.supported_cards)
    into v_content
    from public.hotels2 h where h.id = p_target;
  end if;

  return jsonb_build_object(
    'kind', p_kind,
    'content', v_content,
    'fields', public.partner_listing_fields_of(v_provider, p_kind, p_target),
    'pending_notes', (
      select coalesce(jsonb_agg(jsonb_build_object('id', pr.id, 'section', pr.section, 'type', pr.proposal_type, 'created_at', pr.created_at)
                                order by pr.created_at desc), '[]'::jsonb)
      from public.partner_proposals pr
      where pr.provider_id = v_provider and pr.status = 'pending'
        and ((p_kind = 'experience' and pr.experience_id = p_target) or (p_kind = 'hotel' and pr.hotel_id = p_target))));
end;
$$;

-- « Ça me va » sur une section : chaque champ de la section (sauf un champ obligatoire vide, qui
-- reste « à remplir ») est confirmé avec sa valeur actuelle.
create function public.partner_confirm_section(p_kind text, p_target uuid, p_section text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.partner_require();
  v_link boolean := public.partner_in_link_mode();
  v record;
  v_keys text[] := '{}';
begin
  perform public.partner_check_target(v_provider, p_kind, p_target);
  for v in select * from public.partner_listing_values(v_provider, p_kind, p_target) where section = p_section loop
    continue when v.required and public.partner_is_empty(v.value);
    v_keys := v_keys || v.field_key;
    if p_kind = 'experience' then
      insert into public.partner_listing_fields (provider_id, experience_id, field_key, confirmed_hash, confirmed_at, confirmed_via_link)
      values (v_provider, p_target, v.field_key, md5(coalesce(v.value::text, '')), now(), v_link)
      on conflict (experience_id, field_key) where experience_id is not null
      do update set confirmed_hash = excluded.confirmed_hash, confirmed_at = now(), confirmed_via_link = v_link, updated_at = now();
    else
      insert into public.partner_listing_fields (provider_id, hotel_id, field_key, confirmed_hash, confirmed_at, confirmed_via_link)
      values (v_provider, p_target, v.field_key, md5(coalesce(v.value::text, '')), now(), v_link)
      on conflict (hotel_id, field_key) where hotel_id is not null
      do update set confirmed_hash = excluded.confirmed_hash, confirmed_at = now(), confirmed_via_link = v_link, updated_at = now();
    end if;
  end loop;

  if cardinality(v_keys) = 0 then
    raise exception 'nothing_to_confirm';
  end if;

  insert into public.partner_activity_log (provider_id, user_id, experience_id, hotel_id, action, after)
  values (v_provider, auth.uid(), case when p_kind = 'experience' then p_target end, case when p_kind = 'hotel' then p_target end,
          'confirm_section', jsonb_build_object('section', p_section, 'fields', to_jsonb(v_keys)));

  return public.partner_listing_fields_of(v_provider, p_kind, p_target);
end;
$$;

-- « Proposer une modification » en texte libre (photos, inclusions, page hôtel). Passe par la table
-- des propositions existante : rien n'arrive sur le site sans validation de l'équipe.
create function public.partner_submit_note(p_kind text, p_target uuid, p_section text, p_text text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.partner_require();
  v_text text := left(btrim(coalesce(p_text, '')), 4000);
  v_lang text;
  v_id uuid;
begin
  perform public.partner_check_target(v_provider, p_kind, p_target);
  if length(v_text) < 2 then
    raise exception 'no_change';
  end if;
  if coalesce(p_section, '') not in ('story', 'photos', 'inclusions', 'practical', 'rules', 'rooms') then
    raise exception 'invalid_section';
  end if;
  if (select count(*) from public.partner_proposals where provider_id = v_provider and status = 'pending') >= 30 then
    raise exception 'too_many_pending_proposals';
  end if;
  v_lang := coalesce((select p.language from public.providers p where p.id = v_provider and p.language in ('he', 'en', 'fr')), 'en');

  insert into public.partner_proposals (provider_id, experience_id, hotel_id, proposal_type, section, lang, proposed, current, note, created_by)
  values (v_provider, case when p_kind = 'experience' then p_target end, case when p_kind = 'hotel' then p_target end,
          'note', p_section, v_lang, jsonb_build_object('section', p_section, 'text', v_text), '{}'::jsonb, v_text, auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

-- Textes de la politique d'annulation (mêmes phrases que les modèles du back-office).
create function public.partner_cancellation_texts(p_hours integer)
returns jsonb
language sql
immutable
set search_path = public
as $$
  select case p_hours
    when 24 then jsonb_build_object(
      'en', 'Free cancellation up to 24 hours before the experience.',
      'fr', 'Annulation gratuite jusqu''à 24 h avant l''expérience.',
      'he', 'ביטול חינם עד 24 שעות לפני החוויה.')
    else jsonb_build_object(
      'en', 'Free cancellation up to 48 hours before the experience.',
      'fr', 'Annulation gratuite jusqu''à 48 h avant l''expérience.',
      'he', 'ביטול חינם עד 48 שעות לפני החוויה.')
  end
$$;

-- Les règles non négociables du partenaire : appliquées tout de suite (comme les dispos), tracées,
-- et l'équipe est prévenue. Elles réutilisent les champs existants de la fiche (participants,
-- délai, jours ouverts, « à savoir ») : les jours fermés alimentent les disponibilités existantes.
create function public.partner_set_rules(p_experience_id uuid, p_rules jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.partner_require();
  v_lang text;
  v_before jsonb;
  v_after jsonb;
  v_min int;
  v_max int;
  v_age int;
  v_lead int;
  v_days jsonb;
  v_private boolean;
  v_know text;
  v_hours int;
  v_texts jsonb;
  v_changed text[];
begin
  if not public.partner_owns_experience(v_provider, p_experience_id, true) then
    raise exception 'not_found' using errcode = '42501';
  end if;
  if p_rules is null or jsonb_typeof(p_rules) <> 'object' then
    raise exception 'invalid_rules';
  end if;
  v_lang := coalesce((select p.language from public.providers p where p.id = v_provider and p.language in ('he', 'en', 'fr')), 'en');

  select jsonb_build_object(
    'min_party', e.min_party, 'max_party', e.max_party, 'min_age', e.min_age, 'lead_time_days', e.lead_time_days,
    'available_days', e.available_days, 'private_groups_only', e.private_groups_only,
    'know_before_you_go', to_jsonb(coalesce(case v_lang when 'fr' then e.know_before_you_go_fr when 'he' then e.know_before_you_go_he else e.know_before_you_go end, '')),
    'free_cancellation_hours', e.free_cancellation_hours)
  into v_before
  from public.standalone_experiences e where e.id = p_experience_id for update;

  v_min := case when coalesce(p_rules->>'min_party', '') ~ '^\d{1,3}$' then (p_rules->>'min_party')::int else (v_before->>'min_party')::int end;
  v_max := case when coalesce(p_rules->>'max_party', '') ~ '^\d{1,3}$' then (p_rules->>'max_party')::int else (v_before->>'max_party')::int end;
  if v_min < 1 or v_max < v_min or v_max > 500 then
    raise exception 'invalid_group_size';
  end if;
  v_age := case
    when p_rules ? 'min_age' and coalesce(p_rules->>'min_age', '') = '' then null
    when coalesce(p_rules->>'min_age', '') ~ '^\d{1,2}$' then (p_rules->>'min_age')::int
    else (v_before->>'min_age')::int end;
  v_lead := case when coalesce(p_rules->>'lead_time_days', '') ~ '^\d{1,2}$' then least((p_rules->>'lead_time_days')::int, 60)
                 else (v_before->>'lead_time_days')::int end;
  if p_rules ? 'available_days' then
    select coalesce(jsonb_agg(n order by n), '[]'::jsonb) into v_days
    from (select distinct d::int as n
          from jsonb_array_elements_text(case when jsonb_typeof(p_rules->'available_days') = 'array' then p_rules->'available_days' else '[]'::jsonb end) d
          where d ~ '^[1-7]$') s;
  else
    v_days := v_before->'available_days';
  end if;
  v_private := coalesce((p_rules->>'private_groups_only')::boolean, (v_before->>'private_groups_only')::boolean);
  v_know := case when p_rules ? 'know_before_you_go' then nullif(left(btrim(coalesce(p_rules->>'know_before_you_go', '')), 2000), '') end;
  v_hours := case when coalesce(p_rules->>'free_cancellation_hours', '') in ('24', '48') then (p_rules->>'free_cancellation_hours')::int
                  else (v_before->>'free_cancellation_hours')::int end;

  update public.standalone_experiences e
  set min_party = v_min,
      max_party = v_max,
      min_age = v_age,
      lead_time_days = v_lead,
      available_days = v_days,
      private_groups_only = v_private,
      free_cancellation_hours = v_hours
  where e.id = p_experience_id;

  if p_rules ? 'know_before_you_go' then
    execute format('update public.standalone_experiences set %I = $1 where id = $2', public.partner_col('know_before_you_go', v_lang))
      using v_know, p_experience_id;
  end if;

  -- Le texte affiché sur la fiche et dans le mail de confirmation suit le choix 24 h / 48 h.
  if v_hours is distinct from (v_before->>'free_cancellation_hours')::int then
    v_texts := public.partner_cancellation_texts(v_hours);
    update public.standalone_experiences
    set cancellation_policy = v_texts->>'en', cancellation_policy_fr = v_texts->>'fr', cancellation_policy_he = v_texts->>'he'
    where id = p_experience_id;
  end if;

  select jsonb_build_object(
    'min_party', e.min_party, 'max_party', e.max_party, 'min_age', e.min_age, 'lead_time_days', e.lead_time_days,
    'available_days', e.available_days, 'private_groups_only', e.private_groups_only,
    'know_before_you_go', to_jsonb(coalesce(case v_lang when 'fr' then e.know_before_you_go_fr when 'he' then e.know_before_you_go_he else e.know_before_you_go end, '')),
    'free_cancellation_hours', e.free_cancellation_hours)
  into v_after
  from public.standalone_experiences e where e.id = p_experience_id;

  select coalesce(array_agg(k), '{}') into v_changed
  from jsonb_object_keys(v_after) k where v_after->k is distinct from v_before->k;

  if cardinality(v_changed) > 0 then
    insert into public.partner_activity_log (provider_id, user_id, experience_id, action, before, after)
    values (v_provider, auth.uid(), p_experience_id, 'rules',
            (select jsonb_object_agg(k, v_before->k) from unnest(v_changed) k),
            (select jsonb_object_agg(k, v_after->k) from unnest(v_changed) k));
  end if;
  -- Le partenaire a rempli ses règles : elles sont « remplies par le partenaire », même inchangées.
  perform public.partner_mark_filled(v_provider, 'experience', p_experience_id,
    array['group_size', 'min_age', 'lead_time_days', 'available_days', 'private_groups_only', 'know_before_you_go', 'free_cancellation_hours']);

  return v_after;
end;
$$;

-- Son prix public (ce qu'il facture en direct) : il ne va jamais sur le site. L'équipe en déduit le
-- prix fournisseur avec la commission ; le prix fournisseur, lui, n'est jamais écrit d'ici.
create function public.partner_set_public_price(p_experience_id uuid, p_adult text, p_child text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.partner_require();
  v_adult numeric := public.partner_clean_price(replace(btrim(coalesce(p_adult, '')), ',', '.'));
  v_child numeric := public.partner_clean_price(replace(btrim(coalesce(p_child, '')), ',', '.'));
  v_before jsonb;
  v_after jsonb;
begin
  if not public.partner_owns_experience(v_provider, p_experience_id, true) then
    raise exception 'not_found' using errcode = '42501';
  end if;
  if v_adult is null or v_adult <= 0 then
    raise exception 'invalid_price';
  end if;
  select jsonb_build_object('adult', i.public_price_adult, 'child', i.public_price_child) into v_before
  from public.standalone_experience_internal i where i.experience_id = p_experience_id for update;

  update public.standalone_experience_internal
  set public_price_adult = v_adult, public_price_child = v_child, public_price_updated_at = now()
  where experience_id = p_experience_id
  returning jsonb_build_object('adult', public_price_adult, 'child', public_price_child) into v_after;

  if v_before is distinct from v_after then
    insert into public.partner_activity_log (provider_id, user_id, experience_id, action, before, after)
    values (v_provider, auth.uid(), p_experience_id, 'public_price', v_before, v_after);
  end if;
  perform public.partner_mark_filled(v_provider, 'experience', p_experience_id, array['public_price']);
  return v_after;
end;
$$;

-- 7. Session, conditions, contrat hôtel ------------------------------------------------------------

create function public.partner_render_contract(p_text text, p_vars jsonb)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  v_text text := coalesce(p_text, '');
  k text;
begin
  for k in select jsonb_object_keys(coalesce(p_vars, '{}'::jsonb)) loop
    v_text := replace(v_text, '{{' || k || '}}', coalesce(p_vars->>k, ''));
  end loop;
  return v_text;
end;
$$;

create function public.partner_commission_label(p_commission jsonb)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when p_commission->>'type' = 'percent' then
      case when p_commission->>'value' like '%.%' then rtrim(rtrim(p_commission->>'value', '0'), '.') else p_commission->>'value' end || '%'
    when p_commission->>'type' = 'fixed' then (p_commission->>'value') || ' ILS ' ||
      case p_commission->>'unit' when 'per_person' then 'per person' else 'per booking' end
  end
$$;

-- Les variables du contrat hôtel, à partir de la fiche prestataire et de sa page hôtel.
create function public.partner_contract_variables(p_provider uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'hotel_name', coalesce((select h.name from public.hotel2_internal hi join public.hotels2 h on h.id = hi.hotel_id
                            where hi.provider_id = p.id order by h.created_at limit 1), p.name),
    'company', coalesce(p.legal_name, ''),
    'registration_number', coalesce(p.tax_id, ''),
    'address', coalesce(p.address, ''),
    'signatory_name', coalesce(p.signatory_name, p.contact_name, ''),
    'signatory_title', coalesce(p.signatory_title, ''),
    'commission', coalesce(public.partner_commission_label(public.partner_commission_of(p.id)), ''),
    'date', to_char((now() at time zone 'Asia/Jerusalem')::date, 'DD/MM/YYYY'))
  from public.providers p where p.id = p_provider
$$;

-- La session de l'espace : complétée du type de conditions, de la commission et du contrat hôtel.
create or replace function public.partner_session()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.partner_require(false);
  v_version integer := public.partner_current_terms_version_for(v_provider);
  v_kind text := public.partner_terms_kind(v_provider);
  v_result jsonb;
begin
  update public.provider_users
  set last_login_at = now()
  where user_id = auth.uid() and (last_login_at is null or last_login_at < now() - interval '5 minutes');

  select jsonb_build_object(
    'provider', jsonb_build_object(
      'id', p.id, 'name', p.name, 'provider_type', p.provider_type, 'language', p.language,
      'contact_name', p.contact_name, 'email', p.email, 'whatsapp', p.whatsapp,
      'legal_name', p.legal_name, 'tax_id', p.tax_id, 'address', p.address,
      'day_contact_name', p.day_contact_name, 'day_contact_whatsapp', p.day_contact_whatsapp,
      'day_contact_language', p.day_contact_language,
      'signatory_name', p.signatory_name, 'signatory_title', p.signatory_title,
      'golive_target_date', p.golive_target_date),
    'user_email', (select pu.email from public.provider_users pu where pu.user_id = auth.uid()),
    'terms', jsonb_build_object(
      'kind', v_kind,
      'current_version', v_version,
      'display_version', (select count(*) from public.partner_terms_versions x where x.kind = v_kind and x.version <= v_version),
      'must_accept', not public.partner_terms_ok(p.id),
      'accepted_version', p.terms_version,
      'accepted_at', p.terms_accepted_at,
      'signer_name', (select a.signer_name from public.partner_terms_acceptances a
                      where a.provider_id = p.id order by a.accepted_at desc limit 1),
      'last_acceptance_id', (select a.id from public.partner_terms_acceptances a
                             where a.provider_id = p.id order by a.accepted_at desc limit 1),
      'last_contract_pdf', (select a.contract_pdf_path is not null from public.partner_terms_acceptances a
                            where a.provider_id = p.id order by a.accepted_at desc limit 1),
      'commission', public.partner_commission_of(p.id),
      'commission_label', public.partner_commission_label(public.partner_commission_of(p.id)),
      'commission_ready', public.partner_commission_ready(p.id),
      'text_he', t.text_he, 'text_en', t.text_en, 'text_fr', t.text_fr,
      'published_at', t.published_at),
    'contract_variables', case when v_kind = 'hotel_contract' then public.partner_contract_variables(p.id) end,
    'link_mode', public.partner_in_link_mode())
  into v_result
  from public.providers p
  left join public.partner_terms_versions t on t.version = v_version
  where p.id = v_provider;

  return v_result;
end;
$$;

-- Chaque acceptation note la commission convenue et son type. Impossible tant que la commission
-- n'est pas saisie par l'équipe. Le contrat hôtel exige une signature (fonction suivante).
create function public.partner_terms_acceptances_prepare()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.partner_commission_ready(new.provider_id) then
    raise exception 'commission_missing';
  end if;
  new.kind := coalesce((select v.kind from public.partner_terms_versions v where v.version = new.version), 'experience_terms');
  if new.kind = 'hotel_contract' and (new.signature_data is null or not coalesce(new.authorized_to_sign, false)) then
    raise exception 'signature_required';
  end if;
  new.commission_snapshot := coalesce(public.partner_commission_of(new.provider_id), '{}'::jsonb);
  return new;
end;
$$;

create trigger partner_terms_acceptances_prepare
  before insert on public.partner_terms_acceptances
  for each row execute function public.partner_terms_acceptances_prepare();

-- Signature du contrat hôtel : ses informations (modifiables, elles mettent à jour sa fiche), nom,
-- fonction, signature au doigt, « je suis autorisé à signer ». Compte obligatoire (pas par le lien).
create function public.partner_sign_contract(
  p_version integer, p_signer_name text, p_signer_title text, p_signature text, p_authorized boolean, p_company jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.partner_require();
  v_current integer := public.partner_current_terms_version_for(v_provider);
  v_name text := left(btrim(coalesce(p_signer_name, '')), 200);
  v_title text := left(btrim(coalesce(p_signer_title, '')), 200);
  v_headers jsonb := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  v_now timestamptz := now();
  v_vars jsonb;
  v_text text;
  v_id uuid;
begin
  if public.partner_in_link_mode() then
    raise exception 'account_required' using errcode = '42501';
  end if;
  if public.partner_terms_kind(v_provider) <> 'hotel_contract' then
    raise exception 'not_a_hotel';
  end if;
  if v_current is null or p_version is distinct from v_current then
    raise exception 'terms_version_outdated';
  end if;
  if length(v_name) < 2 or length(v_title) < 2 then
    raise exception 'signer_required';
  end if;
  if not coalesce(p_authorized, false) then
    raise exception 'authorization_required';
  end if;
  if p_signature is null or p_signature !~ '^data:image/png;base64,[A-Za-z0-9+/=]+$' or length(p_signature) > 400000 then
    raise exception 'signature_required';
  end if;

  -- Ses informations mettent à jour sa fiche.
  update public.providers p set
    legal_name = coalesce(nullif(left(btrim(p_company->>'company'), 200), ''), p.legal_name),
    tax_id = coalesce(nullif(left(btrim(p_company->>'registration_number'), 60), ''), p.tax_id),
    address = coalesce(nullif(left(btrim(p_company->>'address'), 400), ''), p.address),
    signatory_name = v_name,
    signatory_title = v_title
  where p.id = v_provider;

  v_vars := public.partner_contract_variables(v_provider);
  select public.partner_render_contract(t.text_en, v_vars) into v_text from public.partner_terms_versions t where t.version = v_current;

  insert into public.partner_terms_acceptances (
    provider_id, user_id, version, signer_name, signer_title, signature_data, authorized_to_sign,
    contract_variables, rendered_text, accepted_at, ip_address, user_agent)
  values (
    v_provider, auth.uid(), v_current, v_name, v_title, p_signature, true, v_vars, v_text, v_now,
    nullif(btrim(split_part(coalesce(v_headers->>'x-forwarded-for', ''), ',', 1)), ''),
    left(v_headers->>'user-agent', 500))
  returning id into v_id;

  update public.providers set terms_accepted_at = v_now, terms_version = v_current::text where id = v_provider;

  return jsonb_build_object('acceptance_id', v_id, 'session', public.partner_session());
end;
$$;

-- Son contrat signé (pour le profil) : la liste de ses acceptations, sans la signature elle-même.
create function public.partner_contracts()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.partner_require();
begin
  if public.partner_in_link_mode() then
    raise exception 'account_required' using errcode = '42501';
  end if;
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', a.id, 'kind', a.kind, 'version', a.version, 'signer_name', a.signer_name, 'signer_title', a.signer_title,
      'accepted_at', a.accepted_at, 'has_pdf', a.contract_pdf_path is not null,
      'commission_label', public.partner_commission_label(a.commission_snapshot))
      order by a.accepted_at desc), '[]'::jsonb)
    from public.partner_terms_acceptances a where a.provider_id = v_provider);
end;
$$;

-- 8. La porte du lien partenaire -------------------------------------------------------------------

create function public.partner_link(p_token text, p_action text, p_args jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider uuid;
  v_result jsonb;
  v_args jsonb := coalesce(p_args, '{}'::jsonb);
begin
  if p_token is null or p_token !~ '^[a-f0-9]{48,64}$' then
    raise exception 'invalid_link' using errcode = '42501';
  end if;
  select p.id into v_provider from public.providers p where p.partner_link_token = p_token and p.status <> 'arrete';
  if v_provider is null then
    raise exception 'invalid_link' using errcode = '42501';
  end if;

  -- Pour la durée de cet appel uniquement (réglage local à la transaction).
  perform set_config('staymakom.partner_link_provider', v_provider::text, true);

  update public.providers
  set partner_link_first_opened_at = coalesce(partner_link_first_opened_at, now()),
      partner_link_last_seen_at = now()
  where id = v_provider and (partner_link_last_seen_at is null or partner_link_last_seen_at < now() - interval '1 minute');

  case p_action
    when 'session' then v_result := public.partner_session();
    when 'golive' then v_result := public.partner_golive();
    when 'experiences' then v_result := public.partner_experiences();
    when 'experience' then v_result := public.partner_experience((v_args->>'id')::uuid);
    when 'listing' then v_result := public.partner_listing(v_args->>'kind', (v_args->>'id')::uuid);
    when 'confirm_section' then
      v_result := public.partner_confirm_section(v_args->>'kind', (v_args->>'id')::uuid, v_args->>'section');
    when 'submit_note' then
      v_result := to_jsonb(public.partner_submit_note(v_args->>'kind', (v_args->>'id')::uuid, v_args->>'section', v_args->>'text'));
    when 'submit_proposal' then
      if v_args->>'type' not in ('text', 'practical_info') then
        raise exception 'invalid_proposal';
      end if;
      v_result := to_jsonb(public.partner_submit_proposal((v_args->>'id')::uuid, v_args->>'type', v_args->'proposed', v_args->>'note'));
    when 'proposals' then v_result := public.partner_proposals();
    when 'set_rules' then v_result := public.partner_set_rules((v_args->>'id')::uuid, v_args->'rules');
    when 'set_public_price' then
      v_result := public.partner_set_public_price((v_args->>'id')::uuid, v_args->>'adult', v_args->>'child');
    when 'set_day_contact' then
      perform public.partner_set_day_contact((v_args->>'id')::uuid, v_args->>'name', v_args->>'phone', v_args->>'language');
      v_result := 'null'::jsonb;
    when 'set_availability' then
      v_result := public.partner_set_availability((v_args->>'id')::uuid, v_args->'availability');
    when 'set_language' then
      if coalesce(v_args->>'language', '') not in ('he', 'en', 'fr') then
        raise exception 'invalid_language';
      end if;
      v_result := public.partner_update_profile(jsonb_build_object('language', v_args->>'language'));
    else
      raise exception 'unknown_action';
  end case;

  perform set_config('staymakom.partner_link_provider', '', true);
  return v_result;
end;
$$;

-- 9. Traces automatiques ---------------------------------------------------------------------------

-- Tout ce qui est fait par le lien est marqué comme tel (propositions et journal).
create function public.partner_mark_via_link()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.partner_in_link_mode() then
    new.via_link := true;
  end if;
  return new;
end;
$$;

create trigger partner_proposals_mark_via_link before insert on public.partner_proposals
  for each row execute function public.partner_mark_via_link();
create trigger partner_activity_log_mark_via_link before insert on public.partner_activity_log
  for each row execute function public.partner_mark_via_link();

-- Ce que le partenaire applique lui-même devient « rempli par le partenaire » dans le suivi des champs.
create function public.partner_activity_mark_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.experience_id is not null then
    if new.action = 'day_contact' then
      perform public.partner_mark_filled(new.provider_id, 'experience', new.experience_id, array['day_contact']);
    elsif new.action = 'availability' then
      perform public.partner_mark_filled(new.provider_id, 'experience', new.experience_id, array['available_days']);
    end if;
  end if;
  if new.action = 'rules' then
    perform public.partner_notify('rules_changed', new.id);
  end if;
  return null;
end;
$$;

create trigger partner_activity_mark_fields after insert on public.partner_activity_log
  for each row execute function public.partner_activity_mark_fields();

-- Une proposition acceptée par l'équipe : les champs qu'elle a changés sont « remplis par le partenaire ».
create function public.partner_proposal_accepted_mark_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' and old.status = 'pending' and new.experience_id is not null
     and new.proposal_type in ('text', 'practical_info', 'photos') then
    perform public.partner_mark_filled(new.provider_id, 'experience', new.experience_id,
      case when new.proposal_type = 'photos' then array['photos']
           else array(select jsonb_object_keys(new.proposed)) end);
  end if;
  return null;
end;
$$;

create trigger partner_proposal_accepted_mark_fields after update of status on public.partner_proposals
  for each row execute function public.partner_proposal_accepted_mark_fields();

-- La commission en pourcentage reste recopiée dans l'ancienne colonne, lue par l'existant.
create function public.providers_sync_commission_percent()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.commission_type is null and new.commission_percent is not null then
      new.commission_type := 'percent';
      new.commission_value := new.commission_percent;
    else
      new.commission_percent := case when new.commission_type = 'percent' then new.commission_value end;
    end if;
  elsif new.commission_type is distinct from old.commission_type
     or new.commission_value is distinct from old.commission_value then
    new.commission_percent := case when new.commission_type = 'percent' then new.commission_value end;
  elsif new.commission_percent is distinct from old.commission_percent then
    -- Ancien chemin (pourcentage saisi directement) : on le reprend comme commission en pourcentage.
    new.commission_type := case when new.commission_percent is not null then 'percent' end;
    new.commission_value := new.commission_percent;
    new.commission_fixed_unit := null;
  end if;
  return new;
end;
$$;

create trigger providers_sync_commission_percent before insert or update on public.providers
  for each row execute function public.providers_sync_commission_percent();

-- Au paiement, la réservation garde la politique d'annulation et la commission du moment.
-- Ce déclencheur n'écrit que dans ses propres colonnes et ne peut jamais bloquer l'enregistrement.
create function public.standalone_bookings_record_policy()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    if new.policy_recorded_at is null
       and new.payment_status in ('paid', 'deposit_paid')
       and new.standalone_experience_id is not null then
      select e.free_cancellation_hours,
             jsonb_strip_nulls(jsonb_build_object('en', e.cancellation_policy, 'fr', e.cancellation_policy_fr, 'he', e.cancellation_policy_he))
      into new.free_cancellation_hours, new.cancellation_policy_snapshot
      from public.standalone_experiences e where e.id = new.standalone_experience_id;

      select coalesce(
               case when i.commission_type is not null then jsonb_strip_nulls(jsonb_build_object(
                 'type', i.commission_type, 'value', i.commission_value, 'unit', i.commission_fixed_unit, 'scope', 'experience')) end,
               case when p.commission_type is not null then jsonb_strip_nulls(jsonb_build_object(
                 'type', p.commission_type, 'value', p.commission_value, 'unit', p.commission_fixed_unit, 'scope', 'provider')) end)
      into new.commission_snapshot
      from public.standalone_experience_internal i
      left join public.providers p on p.id = coalesce(new.provider_id, i.provider_id)
      where i.experience_id = new.standalone_experience_id;

      new.policy_recorded_at := now();
    end if;
  exception when others then
    raise warning 'standalone_bookings_record_policy : %', sqlerrm;
  end;
  return new;
end;
$$;

create trigger standalone_bookings_record_policy
  before insert or update of payment_status on public.standalone_bookings
  for each row execute function public.standalone_bookings_record_policy();

-- 10. Back-office ----------------------------------------------------------------------------------

create function public.admin_require()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'admin_only' using errcode = '42501';
  end if;
end;
$$;

create function public.admin_partner_link_regenerate(p_provider_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
begin
  perform public.admin_require();
  update public.providers
  set partner_link_token = v_token, partner_link_created_at = now()
  where id = p_provider_id;
  if not found then raise exception 'not_found'; end if;
  return v_token;
end;
$$;

create function public.admin_partner_link_revoke(p_provider_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_require();
  update public.providers set partner_link_token = null where id = p_provider_id;
end;
$$;

-- Ce que l'équipe voit sur la fiche : le même go live que le partenaire, et le tableau des champs.
create function public.admin_partner_golive(p_provider_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_golive jsonb;
begin
  perform public.admin_require();
  v_golive := public.partner_golive_with_turn(p_provider_id);
  return v_golive || jsonb_build_object(
    'fields', case when v_golive->'target'->>'id' is not null
                   then public.partner_listing_fields_of(p_provider_id, v_golive->>'kind', (v_golive->'target'->>'id')::uuid)
                   else '[]'::jsonb end,
    'experiences', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', e.id, 'title', coalesce(e.title_fr, e.title), 'status', e.status,
        'public_price_adult', i.public_price_adult, 'public_price_child', i.public_price_child,
        'supplier_price_adult', i.supplier_price_adult, 'supplier_price_child', i.supplier_price_child,
        'commission_type', i.commission_type, 'commission_value', i.commission_value, 'commission_fixed_unit', i.commission_fixed_unit,
        'currency', coalesce(e.currency, 'ILS'))
        order by e.created_at desc), '[]'::jsonb)
      from public.standalone_experience_internal i join public.standalone_experiences e on e.id = i.experience_id
      where i.provider_id = p_provider_id and e.status <> 'archived'));
end;
$$;

-- Prix fournisseur déduit : prix public moins commission. Vide quand ce n'est pas calculable
-- (commission par réservation, ou rien de saisi).
create function public.partner_derived_supplier_price(p_public numeric, p_type text, p_value numeric, p_unit text)
returns numeric
language sql
immutable
set search_path = public
as $$
  select case
    when p_public is null or p_type is null or p_value is null then null
    when p_type = 'percent' then round(p_public * (1 - p_value / 100), 2)
    when p_type = 'fixed' and p_unit = 'per_person' then greatest(p_public - p_value, 0)
  end
$$;

-- Prix public et commission propre d'une expérience. Le prix fournisseur en découle s'il est vide ;
-- s'il est déjà saisi et ne correspond pas, il n'est PAS écrasé (« à vérifier »), sauf demande expresse.
create function public.admin_set_experience_commercials(
  p_experience_id uuid, p_public_adult numeric, p_public_child numeric,
  p_commission_type text, p_commission_value numeric, p_commission_unit text, p_apply_supplier boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  i public.standalone_experience_internal;
  p public.providers;
  v_type text;
  v_value numeric;
  v_unit text;
  v_adult numeric;
  v_child numeric;
begin
  perform public.admin_require();
  update public.standalone_experience_internal
  set public_price_adult = p_public_adult,
      public_price_child = p_public_child,
      commission_type = nullif(p_commission_type, ''),
      commission_value = case when nullif(p_commission_type, '') is not null then p_commission_value end,
      commission_fixed_unit = case when p_commission_type = 'fixed' then p_commission_unit end
  where experience_id = p_experience_id
  returning * into i;
  if not found then raise exception 'not_found'; end if;

  select * into p from public.providers where id = i.provider_id;
  v_type := coalesce(i.commission_type, p.commission_type);
  v_value := case when i.commission_type is not null then i.commission_value else p.commission_value end;
  v_unit := case when i.commission_type is not null then i.commission_fixed_unit else p.commission_fixed_unit end;
  v_adult := public.partner_derived_supplier_price(i.public_price_adult, v_type, v_value, v_unit);
  v_child := public.partner_derived_supplier_price(i.public_price_child, v_type, v_value, v_unit);

  if v_adult is not null and (p_apply_supplier or coalesce(i.supplier_price_adult, 0) = 0) then
    update public.standalone_experience_internal
    set supplier_price_adult = v_adult,
        supplier_price_child = coalesce(v_child, supplier_price_child)
    where experience_id = p_experience_id
    returning * into i;
  end if;

  return jsonb_build_object(
    'derived_adult', v_adult, 'derived_child', v_child,
    'supplier_price_adult', i.supplier_price_adult, 'supplier_price_child', i.supplier_price_child,
    'to_check', v_adult is not null and i.supplier_price_adult is distinct from v_adult);
end;
$$;

-- Publication des conditions par type. Le brouillon d'un type (jamais publié, jamais accepté) est
-- publié tel quel ; sinon une nouvelle version est créée.
create function public.admin_publish_partner_terms(p_kind text, p_text_he text, p_text_en text, p_text_fr text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_version integer;
begin
  perform public.admin_require();
  if p_kind not in ('experience_terms', 'hotel_contract') then
    raise exception 'invalid_kind';
  end if;
  lock table public.partner_terms_versions in share row exclusive mode;
  select v.version into v_version from public.partner_terms_versions v
  where v.kind = p_kind and v.published_at is null
    and not exists (select 1 from public.partner_terms_acceptances a where a.version = v.version)
  order by v.version desc limit 1;
  if v_version is not null then
    update public.partner_terms_versions
    set text_he = coalesce(p_text_he, ''), text_en = coalesce(p_text_en, ''), text_fr = coalesce(p_text_fr, ''), published_at = now()
    where version = v_version;
    return v_version;
  end if;
  select coalesce(max(version), 0) + 1 into v_version from public.partner_terms_versions;
  insert into public.partner_terms_versions (version, kind, text_he, text_en, text_fr, published_at)
  values (v_version, p_kind, coalesce(p_text_he, ''), coalesce(p_text_en, ''), coalesce(p_text_fr, ''), now());
  return v_version;
end;
$$;

-- L'ancienne signature (conditions expériences) reste disponible pour l'écran existant.
create or replace function public.admin_publish_partner_terms(p_text_he text, p_text_en text, p_text_fr text)
returns integer
language sql
security definer
set search_path = public
as $$
  select public.admin_publish_partner_terms('experience_terms', p_text_he, p_text_en, p_text_fr)
$$;

-- Le contrat hôtel, version 1 : un brouillon « À coller », non publié (aucun hôtel ne peut signer
-- tant que le texte n'est pas collé et publié depuis le back-office).
insert into public.partner_terms_versions (version, kind, text_he, text_en, text_fr, published_at)
select coalesce(max(version), 0) + 1, 'hotel_contract', 'À coller', 'À coller', 'À coller', null
from public.partner_terms_versions;

-- Accepter une proposition « note » ne modifie rien automatiquement : l'équipe l'applique à la main.
create or replace function public.admin_review_partner_proposal(p_id uuid, p_decision text, p_comment text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.partner_proposals;
  v_key text;
  v_text text;
  v_new_id uuid;
  v_slug text;
begin
  if not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'admin_only' using errcode = '42501';
  end if;
  if p_decision not in ('accepted', 'rejected') then
    raise exception 'invalid_decision';
  end if;

  select * into r from public.partner_proposals where id = p_id for update;
  if not found then
    raise exception 'not_found';
  end if;
  if r.status <> 'pending' then
    raise exception 'already_reviewed';
  end if;

  if p_decision = 'accepted' then
    if r.proposal_type = 'note' then
      null; -- demande en texte libre : appliquée à la main par l'équipe
    elsif r.proposal_type in ('text', 'practical_info') then
      foreach v_key in array public.partner_proposal_keys(r.proposal_type) loop
        continue when not (r.proposed ? v_key);
        if v_key = 'arrive_minutes_before' then
          update public.standalone_experiences
          set arrive_minutes_before = (r.proposed->>v_key)::int
          where id = r.experience_id;
        else
          execute format('update public.standalone_experiences set %I = nullif($1, '''') where id = $2',
                         public.partner_col(v_key, r.lang))
            using r.proposed->>v_key, r.experience_id;
        end if;
      end loop;

    elsif r.proposal_type = 'photos' then
      update public.standalone_experiences e
      set photos = (
            select coalesce(jsonb_agg(u), '[]'::jsonb)
            from (
              select u, min(ord) as first_ord
              from jsonb_array_elements_text(
                (case when jsonb_typeof(e.photos) = 'array' then e.photos else '[]'::jsonb end) || (r.proposed->'photos')
              ) with ordinality as t(u, ord)
              group by u
              order by first_ord
            ) s),
          hero_image = coalesce(nullif(e.hero_image, ''), r.proposed->'photos'->>0)
      where e.id = r.experience_id;

    elsif r.proposal_type = 'price' then
      update public.standalone_experience_internal i
      set supplier_price_adult = coalesce((r.proposed->>'supplier_price_adult')::numeric, i.supplier_price_adult),
          supplier_price_child = coalesce((r.proposed->>'supplier_price_child')::numeric, i.supplier_price_child),
          supplier_price_changed_at = now()
      where i.experience_id = r.experience_id;

    elsif r.proposal_type = 'new_experience' then
      v_new_id := gen_random_uuid();
      v_text := r.proposed->>'title';
      v_slug := btrim(regexp_replace(lower(v_text), '[^a-z0-9]+', '-', 'g'), '-');
      v_slug := 'proposition-' || case when v_slug = '' then 'partenaire' else left(v_slug, 60) end || '-' || left(v_new_id::text, 6);

      insert into public.standalone_experiences (id, slug, status, title, long_copy, duration, address, photos, hero_image)
      values (v_new_id, v_slug, 'draft', v_text, r.proposed->>'description', r.proposed->>'duration',
              r.proposed->>'location', coalesce(r.proposed->'photos', '[]'::jsonb), r.proposed->'photos'->>0);

      if r.lang <> 'en' then
        execute format(
          'update public.standalone_experiences set %I = $1, %I = $2, %I = $3, %I = $4 where id = $5',
          public.partner_col('title', r.lang), public.partner_col('long_copy', r.lang),
          public.partner_col('duration', r.lang), public.partner_col('address', r.lang))
          using v_text, r.proposed->>'description', r.proposed->>'duration', r.proposed->>'location', v_new_id;
      end if;

      insert into public.standalone_experience_internal (experience_id, provider_id, supplier_price_adult, supplier_price_child)
      values (v_new_id, r.provider_id,
              coalesce((r.proposed->>'supplier_price_adult')::numeric, 0),
              (r.proposed->>'supplier_price_child')::numeric)
      on conflict (experience_id) do update
        set provider_id = excluded.provider_id,
            supplier_price_adult = excluded.supplier_price_adult,
            supplier_price_child = excluded.supplier_price_child;
    end if;
  end if;

  update public.partner_proposals
  set status = p_decision,
      admin_comment = nullif(btrim(coalesce(p_comment, '')), ''),
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      created_experience_id = v_new_id
  where id = p_id;

  return jsonb_build_object('status', p_decision, 'created_experience_id', v_new_id);
end;
$$;

-- Ses propositions : avec le nom de l'hôtel et la section pour une « note ».
create or replace function public.partner_proposals()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_provider uuid := public.partner_require();
begin
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', pr.id, 'experience_id', pr.experience_id, 'hotel_id', pr.hotel_id,
      'experience_title', coalesce(e.title, h.name), 'experience_title_fr', coalesce(e.title_fr, h.name_fr, h.name),
      'experience_title_he', coalesce(e.title_he, h.name_he, h.name),
      'proposal_type', pr.proposal_type, 'section', pr.section, 'lang', pr.lang, 'proposed', pr.proposed, 'current', pr.current,
      'note', pr.note, 'status', pr.status, 'admin_comment', pr.admin_comment,
      'created_at', pr.created_at, 'reviewed_at', pr.reviewed_at)
      order by pr.created_at desc), '[]'::jsonb)
    from public.partner_proposals pr
    left join public.standalone_experiences e on e.id = pr.experience_id
    left join public.hotels2 h on h.id = pr.hotel_id
    where pr.provider_id = v_provider
  );
end;
$$;

-- 11. Stockage privé des contrats signés ------------------------------------------------------------
-- Un compartiment à part, privé : les compartiments existants sont publics (photos), sauf celui des
-- billets clients, qu'on ne mélange pas avec des contrats. Seuls les admins y lisent et y déposent
-- (la signature STAYMAKOM) ; les PDF sont écrits et servis par la fonction serveur `partner-contract`.
insert into storage.buckets (id, name, public) values ('partner-contracts', 'partner-contracts', false)
on conflict (id) do nothing;

create policy partner_contracts_admin_select on storage.objects for select to authenticated
  using (bucket_id = 'partner-contracts' and public.has_role(auth.uid(), 'admin'::public.app_role));
create policy partner_contracts_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'partner-contracts' and public.has_role(auth.uid(), 'admin'::public.app_role));
create policy partner_contracts_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'partner-contracts' and public.has_role(auth.uid(), 'admin'::public.app_role));
create policy partner_contracts_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'partner-contracts' and public.has_role(auth.uid(), 'admin'::public.app_role));

-- 12. Droits d'exécution ---------------------------------------------------------------------------
-- Par défaut, personne. Puis : le lien pour tous (il vérifie le jeton), les fonctions partenaire pour
-- les connectés (elles vérifient qui ils sont), les fonctions admin pour les connectés (elles
-- vérifient le rôle admin).

do $$
declare
  f text;
begin
  foreach f in array array[
    'partner_link_provider_id()', 'partner_in_link_mode()', 'partner_terms_kind(uuid)',
    'partner_current_terms_version_for(uuid)', 'partner_commission_of(uuid)', 'partner_commission_ready(uuid)',
    'partner_terms_ok(uuid)', 'partner_require_signed()', 'partner_owns_hotel(uuid, uuid)',
    'partner_pick(jsonb, text, text)', 'partner_is_empty(jsonb)', 'partner_listing_values(uuid, text, uuid)',
    'partner_listing_fields_of(uuid, text, uuid)', 'partner_mark_filled(uuid, text, uuid, text[])',
    'partner_golive_target(uuid)', 'partner_golive_of(uuid)', 'partner_golive_with_turn(uuid)',
    'partner_check_target(uuid, text, uuid)', 'partner_cancellation_texts(integer)',
    'partner_render_contract(text, jsonb)', 'partner_commission_label(jsonb)', 'partner_contract_variables(uuid)',
    'partner_terms_acceptances_prepare()', 'partner_mark_via_link()', 'partner_activity_mark_fields()',
    'partner_proposal_accepted_mark_fields()', 'providers_sync_commission_percent()',
    'standalone_bookings_record_policy()', 'admin_require()', 'partner_derived_supplier_price(numeric, text, numeric, text)',
    'partner_golive()', 'partner_listing(text, uuid)', 'partner_confirm_section(text, uuid, text)',
    'partner_submit_note(text, uuid, text, text)', 'partner_set_rules(uuid, jsonb)',
    'partner_set_public_price(uuid, text, text)', 'partner_sign_contract(integer, text, text, text, boolean, jsonb)',
    'partner_contracts()', 'partner_link(text, text, jsonb)',
    'admin_partner_link_regenerate(uuid)', 'admin_partner_link_revoke(uuid)', 'admin_partner_golive(uuid)',
    'admin_set_experience_commercials(uuid, numeric, numeric, text, numeric, text, boolean)',
    'admin_publish_partner_terms(text, text, text, text)'
  ] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
  end loop;

  foreach f in array array[
    'partner_golive()', 'partner_listing(text, uuid)', 'partner_confirm_section(text, uuid, text)',
    'partner_submit_note(text, uuid, text, text)', 'partner_set_rules(uuid, jsonb)',
    'partner_set_public_price(uuid, text, text)', 'partner_sign_contract(integer, text, text, text, boolean, jsonb)',
    'partner_contracts()',
    'admin_partner_link_regenerate(uuid)', 'admin_partner_link_revoke(uuid)', 'admin_partner_golive(uuid)',
    'admin_set_experience_commercials(uuid, numeric, numeric, text, numeric, text, boolean)',
    'admin_publish_partner_terms(text, text, text, text)'
  ] loop
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;

  execute 'grant execute on function public.partner_link(text, text, jsonb) to anon, authenticated';
end $$;
