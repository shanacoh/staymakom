-- Chantier Offre, étape 2 bis : protéger les informations internes.
--
-- Avant : toute fiche publiée était lisible en entier avec la clé publique du site, y compris les prix
-- fournisseur, la marge, le nom et le contact des prestataires, leurs liens de réservation et le
-- contact du jour J. La base ne sait pas cacher une colonne à certains lecteurs seulement : tant que
-- ces colonnes vivent dans la table publique, elles sont lisibles.
--
-- Après : ces colonnes quittent les tables publiques et vont dans des tables voisines, une par table
-- d'origine, lisibles et modifiables uniquement par les admins (et par les fonctions serveur, qui
-- utilisent la clé de service). Les tables publiques gardent tout le reste, à l'identique.
--
-- À appliquer en même temps que la mise en ligne du back-office qui lit ces nouvelles tables.
-- Tout se joue en une seule transaction : si un seul contrôle de comptage échoue, rien n'est changé.
-- Pour revenir en arrière : recréer les colonnes, y recopier les valeurs des tables *_internal.
begin;

-- 1. Les tables internes --------------------------------------------------------------------------

create table public.standalone_experience_internal (
  experience_id uuid primary key references public.standalone_experiences (id) on delete cascade,
  supplier_price_adult numeric default 0,
  supplier_price_child numeric default 0,
  markup_percent numeric default 0,
  supplier_name text,
  supplier_boat_name text,
  supplier_contact text,
  supplier_payment_method text,
  supplier_booking_url text,
  provider_id uuid references public.providers (id),
  booking_channel text default 'provider_request',
  day_contact_name text,
  day_contact_phone text,
  day_contact_language text,
  updated_at timestamptz not null default now(),
  constraint standalone_experience_internal_payment_method_check
    check (supplier_payment_method is null or supplier_payment_method in ('payment_link', 'bank_transfer', 'card')),
  constraint standalone_experience_internal_booking_channel_check
    check (booking_channel is null or booking_channel in ('provider_request', 'provider_website', 'provider_portal'))
);
comment on table public.standalone_experience_internal is
  'Interne (admins et serveur uniquement) : prix fournisseur, marge, prestataire, canal de réservation et contact du jour J d''une expérience. Une ligne par fiche.';
create index standalone_experience_internal_provider_id_idx on public.standalone_experience_internal (provider_id);

create table public.standalone_rate_option_internal (
  rate_option_id uuid primary key references public.standalone_rate_options (id) on delete cascade,
  supplier_price_adult numeric,
  supplier_price_child numeric,
  updated_at timestamptz not null default now()
);
comment on table public.standalone_rate_option_internal is
  'Interne (admins et serveur uniquement) : prix fournisseur d''une option tarifaire.';

create table public.standalone_price_variant_internal (
  variant_id uuid primary key references public.standalone_experience_price_variants (id) on delete cascade,
  purchase_price numeric,
  updated_at timestamptz not null default now()
);
comment on table public.standalone_price_variant_internal is
  'Interne (admins et serveur uniquement) : prix d''achat d''une variante de prix (bateaux).';

create table public.experience2_internal (
  experience_id uuid primary key references public.experiences2 (id) on delete cascade,
  experience_net_cost numeric,
  experience_cost_fixed numeric,
  experience_cost_per_person numeric,
  updated_at timestamptz not null default now()
);
comment on table public.experience2_internal is
  'Interne (admins et serveur uniquement) : ce que STAYMAKOM paie pour l''activité d''une expérience hôtel.';

create table public.hotel2_internal (
  hotel_id uuid primary key references public.hotels2 (id) on delete cascade,
  contact_email text,
  contact_phone text,
  commission_rate numeric default 18.00,
  updated_at timestamptz not null default now()
);
comment on table public.hotel2_internal is
  'Interne (admins et serveur uniquement) : contact direct et taux de commission d''un hôtel.';

-- Mêmes règles pour les cinq tables : seuls les admins lisent et écrivent. Un visiteur n'a aucun
-- droit dessus, un client connecté non admin est arrêté par la règle. Les fonctions serveur (clé de
-- service) passent au-dessus des règles : c'est par là que la confirmation de réservation lira le
-- contact du jour J pour l'envoyer au client.
do $$
declare
  t text;
begin
  foreach t in array array[
    'standalone_experience_internal', 'standalone_rate_option_internal',
    'standalone_price_variant_internal', 'experience2_internal', 'hotel2_internal'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
    execute format('grant all on table public.%I to service_role', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (has_role(auth.uid(), ''admin''::app_role)) with check (has_role(auth.uid(), ''admin''::app_role))',
      t || '_admin_all', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.update_updated_at_column()',
      t || '_set_updated_at', t);
  end loop;
end $$;

-- 2. Recopie des valeurs --------------------------------------------------------------------------
-- Une ligne interne par ligne d'origine, sans exception : le comptage ci-dessous compare tout.

insert into public.standalone_experience_internal
  (experience_id, supplier_price_adult, supplier_price_child, markup_percent, supplier_name,
   supplier_boat_name, supplier_contact, supplier_payment_method, supplier_booking_url, provider_id,
   booking_channel, day_contact_name, day_contact_phone, day_contact_language)
select id, supplier_price_adult, supplier_price_child, markup_percent, supplier_name,
       supplier_boat_name, supplier_contact, supplier_payment_method, supplier_booking_url, provider_id,
       booking_channel, day_contact_name, day_contact_phone, day_contact_language
from public.standalone_experiences;

insert into public.standalone_rate_option_internal (rate_option_id, supplier_price_adult, supplier_price_child)
select id, supplier_price_adult, supplier_price_child from public.standalone_rate_options;

insert into public.standalone_price_variant_internal (variant_id, purchase_price)
select id, purchase_price from public.standalone_experience_price_variants;

insert into public.experience2_internal (experience_id, experience_net_cost, experience_cost_fixed, experience_cost_per_person)
select id, experience_net_cost, experience_cost_fixed, experience_cost_per_person from public.experiences2;

insert into public.hotel2_internal (hotel_id, contact_email, contact_phone, commission_rate)
select id, contact_email, contact_phone, commission_rate from public.hotels2;

-- Contrôle avant/après : autant de lignes de chaque côté, et pas une seule valeur différente.
-- Au moindre écart, la migration s'arrête et rien n'est modifié.
do $$
declare
  n_src bigint;
  n_dst bigint;
  n_diff bigint;
begin
  select count(*) into n_src from public.standalone_experiences;
  select count(*) into n_dst from public.standalone_experience_internal;
  select count(*) into n_diff
  from public.standalone_experiences s
  left join public.standalone_experience_internal i on i.experience_id = s.id
  where i.experience_id is null
     or (s.supplier_price_adult, s.supplier_price_child, s.markup_percent, s.supplier_name, s.supplier_boat_name,
         s.supplier_contact, s.supplier_payment_method, s.supplier_booking_url, s.provider_id, s.booking_channel,
         s.day_contact_name, s.day_contact_phone, s.day_contact_language)
        is distinct from
        (i.supplier_price_adult, i.supplier_price_child, i.markup_percent, i.supplier_name, i.supplier_boat_name,
         i.supplier_contact, i.supplier_payment_method, i.supplier_booking_url, i.provider_id, i.booking_channel,
         i.day_contact_name, i.day_contact_phone, i.day_contact_language);
  if n_src <> n_dst or n_diff > 0 then
    raise exception 'standalone_experiences : % lignes, % recopiées, % écarts', n_src, n_dst, n_diff;
  end if;

  select count(*) into n_src from public.standalone_rate_options;
  select count(*) into n_dst from public.standalone_rate_option_internal;
  select count(*) into n_diff
  from public.standalone_rate_options s
  left join public.standalone_rate_option_internal i on i.rate_option_id = s.id
  where i.rate_option_id is null
     or (s.supplier_price_adult, s.supplier_price_child) is distinct from (i.supplier_price_adult, i.supplier_price_child);
  if n_src <> n_dst or n_diff > 0 then
    raise exception 'standalone_rate_options : % lignes, % recopiées, % écarts', n_src, n_dst, n_diff;
  end if;

  select count(*) into n_src from public.standalone_experience_price_variants;
  select count(*) into n_dst from public.standalone_price_variant_internal;
  select count(*) into n_diff
  from public.standalone_experience_price_variants s
  left join public.standalone_price_variant_internal i on i.variant_id = s.id
  where i.variant_id is null or s.purchase_price is distinct from i.purchase_price;
  if n_src <> n_dst or n_diff > 0 then
    raise exception 'price_variants : % lignes, % recopiées, % écarts', n_src, n_dst, n_diff;
  end if;

  select count(*) into n_src from public.experiences2;
  select count(*) into n_dst from public.experience2_internal;
  select count(*) into n_diff
  from public.experiences2 s
  left join public.experience2_internal i on i.experience_id = s.id
  where i.experience_id is null
     or (s.experience_net_cost, s.experience_cost_fixed, s.experience_cost_per_person)
        is distinct from (i.experience_net_cost, i.experience_cost_fixed, i.experience_cost_per_person);
  if n_src <> n_dst or n_diff > 0 then
    raise exception 'experiences2 : % lignes, % recopiées, % écarts', n_src, n_dst, n_diff;
  end if;

  select count(*) into n_src from public.hotels2;
  select count(*) into n_dst from public.hotel2_internal;
  select count(*) into n_diff
  from public.hotels2 s
  left join public.hotel2_internal i on i.hotel_id = s.id
  where i.hotel_id is null
     or (s.contact_email, s.contact_phone, s.commission_rate)
        is distinct from (i.contact_email, i.contact_phone, i.commission_rate);
  if n_src <> n_dst or n_diff > 0 then
    raise exception 'hotels2 : % lignes, % recopiées, % écarts', n_src, n_dst, n_diff;
  end if;
end $$;

-- 3. La vue des réservations lit le prestataire dans la table interne ---------------------------
-- Reprise à l'identique de la vue en place, à deux détails près : le nom du fournisseur et le
-- prestataire lié viennent maintenant de standalone_experience_internal (alias « ei »).

create or replace view public.admin_reservations
with (security_invoker = true) as
with today as (
  select (now() at time zone 'Asia/Jerusalem')::date as d
)
-- Réservations d'expérience et de bateau. Un paiement en ligne jamais abouti (pending) n'en est pas une.
select
  'booking'::text as source,
  b.id,
  left(b.id::text, 4) as ref,
  b.product_type as type,
  case
    when b.status = 'cancelled' or coalesce(b.is_cancelled, false) then 'annulee'
    when b.booking_date < t.d then 'passee'
    else 'confirmee'
  end as status,
  coalesce(nullif(b.customer_name, ''), 'Sans nom') as client,
  coalesce(b.custom_experience_title, e.title_fr, e.title, 'Expérience') as product,
  coalesce(b.supplier_name, bp.name, ep.name, ei.supplier_name) as partner,
  b.booking_date as service_date,
  null::timestamptz as received_at,
  b.party_size::text as pax,
  b.sell_price::numeric as amount,
  coalesce(b.currency, 'ILS') as currency,
  case
    when b.payment_status = 'paid' then b.sell_price
    when b.payment_status = 'deposit_paid' then coalesce(nullif(pay.paid, 0), b.deposit_amount, 0)
    else 0
  end::numeric as collected,
  case b.payment_status
    when 'paid' then 'paid'
    when 'deposit_paid' then 'deposit'
    when 'refunded' then 'refunded'
    when 'refund_pending' then 'refunded'
    else 'unpaid'
  end as client_payment,
  b.supplier_cost::numeric as supplier_cost,
  case when b.supplier_payment_status = 'paid' then 'paid' else 'todo' end as supplier_payment,
  case when b.source = 'online' then 'online' else coalesce(b.channel, 'manual') end as channel_key,
  b.source as origin,
  (b.source = 'online') as is_online,
  b.internal_notes as notes,
  null::timestamptz as sent_to_provider_at,
  null::numeric as deposit_due,
  case when b.supplier_cost is null then 1 else 0 end as missing_costs,
  case when b.supplier_payment_status = 'paid' then null else b.supplier_cost end::numeric as supplier_due
from public.standalone_bookings b
cross join today t
left join public.standalone_experiences e on e.id = b.standalone_experience_id
left join public.standalone_experience_internal ei on ei.experience_id = e.id
left join public.providers bp on bp.id = b.provider_id
left join public.providers ep on ep.id = ei.provider_id
left join lateral (
  select sum(p.amount) as paid
  from public.standalone_booking_payments p
  where p.booking_id = b.id and p.status = 'paid'
) pay on true
where b.status <> 'pending'

union all

-- Demandes en cours. Une demande convertie a laissé la place à sa réservation,
-- une demande fermée n'en est plus une.
select
  'request',
  r.id,
  left(r.id::text, 4),
  case when c.slug = 'bateaux' then 'boat' else 'experience' end,
  case when r.status = 'availability_confirmed' then 'dispo_ok' else 'demande' end,
  coalesce(nullif(r.customer_name, ''), 'Sans nom'),
  coalesce(e.title_fr, e.title, r.preferred_city, 'Demande'),
  coalesce(ep.name, ei.supplier_name),
  r.requested_date,
  r.created_at,
  case
    when r.party_max is not null and r.party_max <> r.adults then r.adults::text || '-' || r.party_max::text
    else (r.adults + r.children)::text
  end,
  v.sale_price::numeric,
  coalesce(v.currency, e.currency, 'ILS'),
  0::numeric,
  'unpaid',
  null::numeric,
  'none',
  'request',
  coalesce(r.source, 'form'),
  false,
  r.internal_notes,
  r.sent_to_provider_at,
  case
    when e.deposit_type = 'fixed' and e.deposit_amount > 0 then e.deposit_amount
    when e.deposit_type = 'percentage' and e.deposit_amount > 0 and v.sale_price is not null
      then round(v.sale_price * e.deposit_amount / 100)
    else null
  end::numeric,
  0,
  null::numeric
from public.standalone_experience_requests r
left join public.standalone_experiences e on e.id = r.experience_id
left join public.standalone_experience_internal ei on ei.experience_id = e.id
left join public.categories c on c.id = e.category_id
left join public.providers ep on ep.id = ei.provider_id
left join public.standalone_experience_price_variants v on v.id = r.price_variant_id
where r.status in ('new', 'sent_to_provider', 'contacted', 'availability_confirmed')

union all

-- Réservations d'hôtel.
select
  'hotel',
  h.id,
  coalesce(h.hg_booking_id, left(h.id::text, 4)),
  'hotel',
  case
    when h.status = 'cancelled' or h.is_cancelled then 'annulee'
    when h.checkout < t.d then 'passee'
    else 'confirmee'
  end,
  coalesce(nullif(h.customer_name, ''), 'Sans nom'),
  coalesce(ho.name, 'Hôtel') || ' · ' || h.nights::text || case when h.nights > 1 then ' nuits' else ' nuit' end,
  ho.name,
  h.checkin,
  null::timestamptz,
  h.party_size::text,
  h.sell_price::numeric,
  coalesce(h.currency, 'ILS'),
  coalesce(h.paid_amount, case when h.payment_status = 'paid' then h.sell_price else 0 end)::numeric,
  case h.payment_status
    when 'paid' then 'paid'
    when 'deposit_paid' then 'deposit'
    when 'refunded' then 'refunded'
    when 'refund_pending' then 'refunded'
    else 'unpaid'
  end,
  h.net_price::numeric,
  'none',
  case when h.source = 'manual_admin' then coalesce(h.channel, 'manual') else 'online' end,
  h.source,
  (h.source <> 'manual_admin'),
  h.internal_notes,
  null::timestamptz,
  null::numeric,
  0,
  null::numeric
from public.bookings_hg h
cross join today t
left join public.hotels2 ho on ho.id = h.hotel_id
where h.status not in ('pending', 'failed')

union all

-- Dossiers de voyage payés : une ligne par dossier, comptée une seule fois.
-- Montant = montant convenu au paiement, sinon prix de la version. Le coût fournisseur est la
-- somme des coûts réels de ses lignes de réservation, connu seulement quand toutes sont saisies.
select
  'dossier',
  d.id,
  coalesce(d.reference, left(d.id::text, 4)),
  'itinerary',
  case when coalesce(d.dates_depart, d.dates_arrivee) < t.d then 'passee' else 'confirmee' end,
  d.nom_destinataire,
  'Itinéraire sur mesure',
  null::text,
  d.dates_arrivee,
  null::timestamptz,
  d.nb_voyageurs::text,
  coalesce(d.montant_vente_final, ver.prix_total_vente)::numeric,
  coalesce(d.devise, 'ILS'),
  coalesce(d.montant_encaisse, d.montant_vente_final, ver.prix_total_vente, 0)::numeric,
  case
    when coalesce(d.montant_encaisse, d.montant_vente_final, ver.prix_total_vente, 0)
         >= coalesce(d.montant_vente_final, ver.prix_total_vente, 0) then 'paid'
    when coalesce(d.montant_encaisse, 0) > 0 then 'deposit'
    else 'unpaid'
  end,
  case when li.total > 0 and li.missing = 0 then li.cost end::numeric,
  case when coalesce(li.total, 0) = 0 then 'none' when li.unpaid > 0 then 'todo' else 'paid' end,
  'dossier',
  'dossier',
  false,
  null::text,
  null::timestamptz,
  null::numeric,
  coalesce(li.missing, 0)::int,
  li.due::numeric
from public.dossiers_voyage d
cross join today t
left join public.dossiers_voyage_versions ver on ver.id = coalesce(d.version_verrouillee_id, d.version_active_id)
left join lateral (
  select
    count(*) as total,
    count(*) filter (where l.cout_reel is null) as missing,
    count(*) filter (where l.paiement_fournisseur = 'a_payer') as unpaid,
    sum(l.cout_reel) as cost,
    sum(l.cout_reel) filter (where l.paiement_fournisseur = 'a_payer') as due
  from public.admin_reservation_dossier_lines l
  where l.dossier_id = d.id
) li on true
where d.paye_at is not null and not d.est_modele

union all

-- Demandes de voyage sur mesure reçues par le formulaire du site : pas encore de prix, pas
-- encore de fournisseur. « Produit » = le type de séjour choisi par le client.
select
  'dossier',
  d.id,
  coalesce(d.reference, left(d.id::text, 4)),
  'itinerary',
  'demande_sur_mesure',
  d.nom_destinataire,
  'Sur-mesure · ' || coalesce(
    nullif(d.demande_formulaire->>'type_sejour_autre', ''),
    case d.demande_formulaire->>'type_sejour'
      when 'trip_sur_mesure' then 'Trip sur-mesure'
      when 'romantic_getaway' then 'Romantic Getaway'
      when 'proposal' then 'Proposal'
      when 'celebration' then 'Celebration'
      when 'friends_group' then 'Friends & Group'
    end,
    nullif(d.demande_formulaire->>'occasion', ''),
    'à préciser'),
  null::text,
  d.dates_arrivee,
  d.created_at,
  d.nb_voyageurs::text,
  null::numeric,
  coalesce(d.devise, 'EUR'),
  0::numeric,
  'unpaid',
  null::numeric,
  'none',
  'tailor_made',
  'formulaire_site',
  false,
  null::text,
  null::timestamptz,
  null::numeric,
  0,
  null::numeric
from public.dossiers_voyage d
where d.statut = 'demande_sur_mesure' and d.paye_at is null and not d.est_modele and not d.archive;

-- 4. Les colonnes quittent les tables publiques -------------------------------------------------
-- Le déclencheur de date de modification ne réagit pas à un retrait de colonne : les fiches ne
-- paraissent pas « modifiées aujourd'hui ».

alter table public.standalone_experiences
  drop column supplier_price_adult,
  drop column supplier_price_child,
  drop column markup_percent,
  drop column supplier_name,
  drop column supplier_boat_name,
  drop column supplier_contact,
  drop column supplier_payment_method,
  drop column supplier_booking_url,
  drop column provider_id,
  drop column booking_channel,
  drop column day_contact_name,
  drop column day_contact_phone,
  drop column day_contact_language;

alter table public.standalone_rate_options
  drop column supplier_price_adult,
  drop column supplier_price_child;

alter table public.standalone_experience_price_variants
  drop column purchase_price;

alter table public.experiences2
  drop column experience_net_cost,
  drop column experience_cost_fixed,
  drop column experience_cost_per_person;

alter table public.hotels2
  drop column contact_email,
  drop column contact_phone,
  drop column commission_rate;

-- 5. Présentations par mood : uniquement celles des expériences publiées -------------------------
-- L'ancienne règle suivait tout ce que le visiteur pouvait lire dans standalone_experiences, donc
-- aussi les fiches « vitrine » non publiées. Les admins gardent leur accès complet par leur règle.
drop policy standalone_mood_presentations_public_read on public.standalone_experience_mood_presentations;

create policy standalone_mood_presentations_public_read
  on public.standalone_experience_mood_presentations
  for select
  using (
    exists (
      select 1 from public.standalone_experiences e
      where e.id = standalone_experience_mood_presentations.experience_id
        and e.status = 'published'
    )
  );

commit;
