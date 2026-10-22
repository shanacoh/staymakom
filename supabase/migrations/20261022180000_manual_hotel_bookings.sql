-- Réservations v2, lot 2 : réservations d'hôtel saisies à la main (WhatsApp, téléphone...).
--
-- Une réservation d'hôtel saisie par l'équipe peut viser un hôtel hors catalogue (nom en texte
-- libre), avoir un coût encore inconnu, et suit maintenant le paiement de l'hôtel, comme une
-- réservation d'expérience. Les réservations synchronisées depuis HyperGuest ne changent pas.

begin;

-- 1. Nouvelles informations sur la réservation d'hôtel ------------------------------------------

alter table public.bookings_hg
  add column hotel_name text,
  add column supplier_payment_status text not null default 'pending'
    check (supplier_payment_status in ('pending', 'paid')),
  add column supplier_paid_at date,
  -- Une saisie à la main nomme toujours son hôtel : choisi dans le catalogue, ou écrit en clair.
  add constraint bookings_hg_manual_hotel_named
    check (source <> 'manual_admin' or hotel_id is not null or nullif(trim(hotel_name), '') is not null);

comment on column public.bookings_hg.hotel_name is
  'Nom de l''hôtel quand il n''est pas dans le catalogue (saisie à la main). Sinon vide : le nom vient de hotels2.';
comment on column public.bookings_hg.supplier_payment_status is
  'Paiement de l''hôtel par Staymakom (saisie à la main) : pending = à payer, paid = payé.';
comment on column public.bookings_hg.supplier_paid_at is
  'Date du paiement de l''hôtel par Staymakom.';

-- Coût encore inconnu à la saisie : vide plutôt que 0, pour que la page le signale « à saisir ».
alter table public.bookings_hg alter column net_price drop not null;

-- 2. La vue des réservations lit ces informations ------------------------------------------------
-- Reprise à l'identique de la vue en place (migration 20261008140000), sauf le bloc des hôtels :
-- nom de l'hôtel hors catalogue, encaissé selon le paiement, coût à saisir et paiement de l'hôtel
-- pour les saisies à la main.

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

-- Réservations d'hôtel. Une réservation saisie à la main suit son coût et le paiement de
-- l'hôtel ; une réservation synchronisée (HyperGuest) n'a pas de fournisseur à payer ici.
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
  coalesce(ho.name, nullif(h.hotel_name, ''), 'Hôtel') || ' · ' || h.nights::text || case when h.nights > 1 then ' nuits' else ' nuit' end,
  coalesce(ho.name, nullif(h.hotel_name, '')),
  h.checkin,
  null::timestamptz,
  h.party_size::text,
  h.sell_price::numeric,
  coalesce(h.currency, 'ILS'),
  case h.payment_status
    when 'paid' then h.sell_price
    when 'deposit_paid' then coalesce(h.paid_amount, 0)
    when 'refunded' then coalesce(h.paid_amount, 0)
    when 'refund_pending' then coalesce(h.paid_amount, 0)
    else 0
  end::numeric,
  case h.payment_status
    when 'paid' then 'paid'
    when 'deposit_paid' then 'deposit'
    when 'refunded' then 'refunded'
    when 'refund_pending' then 'refunded'
    else 'unpaid'
  end,
  h.net_price::numeric,
  case
    when h.source <> 'manual_admin' then 'none'
    when h.supplier_payment_status = 'paid' then 'paid'
    else 'todo'
  end,
  case when h.source = 'manual_admin' then coalesce(h.channel, 'manual') else 'online' end,
  h.source,
  (h.source <> 'manual_admin'),
  h.internal_notes,
  null::timestamptz,
  null::numeric,
  case when h.source = 'manual_admin' and h.net_price is null then 1 else 0 end,
  case
    when h.source = 'manual_admin' and h.supplier_payment_status <> 'paid' then h.net_price
  end::numeric
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

commit;
