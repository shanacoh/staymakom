-- Refonte Réservations, migration 4 : onglet Itinéraire.
-- 1) Sur les lignes d'un dossier : le coût réel et l'état du paiement fournisseur.
-- 2) Sur le dossier : le montant convenu et le montant encaissé au moment où il est marqué
--    payé (pour gérer un acompte : encaissé inférieur au total).
-- 3) Une vue des lignes de réservation d'un dossier, et la vue des réservations mise à jour
--    pour lire ces nouvelles informations.
begin;

alter table public.dossiers_voyage_lignes add column cout_reel numeric check (cout_reel >= 0);
alter table public.dossiers_voyage_lignes
  add column paiement_fournisseur text not null default 'a_payer' check (paiement_fournisseur in ('a_payer', 'paye'));

comment on column public.dossiers_voyage_lignes.cout_reel is 'Coût réellement dû au fournisseur pour cette ligne, saisi une fois le dossier payé (cout_achat_estime reste l''estimation de départ).';
comment on column public.dossiers_voyage_lignes.paiement_fournisseur is 'a_payer | paye';

alter table public.dossiers_voyage add column montant_vente_final numeric check (montant_vente_final >= 0);
alter table public.dossiers_voyage add column montant_encaisse numeric check (montant_encaisse >= 0);
alter table public.dossiers_voyage
  add constraint dossiers_voyage_encaisse_max check (montant_encaisse is null or montant_vente_final is null or montant_encaisse <= montant_vente_final);

comment on column public.dossiers_voyage.montant_vente_final is 'Montant total convenu avec le client, saisi quand le dossier est marqué payé.';
comment on column public.dossiers_voyage.montant_encaisse is 'Montant réellement encaissé. Inférieur à montant_vente_final = acompte.';

-- Lignes de réservation d'un dossier : celles de sa version verrouillée (sinon active) qui
-- engagent un fournisseur (hébergement, activité, transport) ou qui portent un coût.
create view public.admin_reservation_dossier_lines
with (security_invoker = true) as
select
  l.id,
  d.id as dossier_id,
  l.nature,
  coalesce(ci.name, ho.name, e2.title, se.title_fr, se.title, nullif(l.texte_libre, ''), 'Ligne sans nom') as product,
  l.jour,
  l.ordre,
  (d.dates_arrivee + (l.jour - 1))::date as service_date,
  d.nb_voyageurs::text as pax,
  coalesce(d.devise, 'ILS') as currency,
  l.cout_achat_estime::numeric as cout_estime,
  l.cout_reel::numeric as cout_reel,
  l.paiement_fournisseur
from public.dossiers_voyage d
join public.dossiers_voyage_lignes l on l.version_id = coalesce(d.version_verrouillee_id, d.version_active_id)
left join public.catalogue_items ci on ci.id = l.catalogue_item_id
left join public.hotels2 ho on ho.id = l.hotel_id
left join public.experiences2 e2 on e2.id = l.experience_id
left join public.standalone_experiences se on se.id = l.standalone_experience_id
where l.nature in ('hebergement', 'activite', 'transport')
   or l.cout_reel is not null
   or l.cout_achat_estime is not null;

comment on view public.admin_reservation_dossier_lines is
  'Page Réservations, onglet Itinéraire : lignes de réservation d''un dossier de voyage (coût réel, paiement fournisseur). Lecture seule.';

-- La vue des réservations gagne deux colonnes en fin de liste : le nombre de coûts fournisseur
-- manquants et le montant restant à payer aux fournisseurs.
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
  coalesce(b.supplier_name, bp.name, ep.name, e.supplier_name) as partner,
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
left join public.providers bp on bp.id = b.provider_id
left join public.providers ep on ep.id = e.provider_id
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
  coalesce(ep.name, e.supplier_name),
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
left join public.categories c on c.id = e.category_id
left join public.providers ep on ep.id = e.provider_id
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
where d.paye_at is not null and not d.est_modele;

revoke all on public.admin_reservation_dossier_lines from anon;
grant select on public.admin_reservation_dossier_lines to authenticated;

commit;
