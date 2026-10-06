-- Refonte Réservations, migration 3 : deux « feuilles récapitulatives » en lecture seule.
-- Elles ne copient aucune donnée : elles lisent les tables d'origine à chaque consultation.
-- security_invoker : la vue applique les droits de la personne connectée (les règles d'accès
-- des tables d'origine), elle n'ouvre donc aucun accès supplémentaire.
begin;

-- 1) Une ligne par réservation, quelle que soit sa table d'origine, dans un format commun.
--    « Aujourd'hui » est pris à l'heure d'Israël pour le statut « Passée ».
create view public.admin_reservations
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
  null::numeric as deposit_due
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
  end::numeric
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
  null::numeric
from public.bookings_hg h
cross join today t
left join public.hotels2 ho on ho.id = h.hotel_id
where h.status not in ('pending', 'failed')

union all

-- Dossiers de voyage payés : une ligne par dossier, comptée une seule fois.
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
  ver.prix_total_vente::numeric,
  coalesce(d.devise, 'ILS'),
  coalesce(ver.prix_total_vente, 0)::numeric,
  'paid',
  ver.prix_total_achat::numeric,
  'none',
  'dossier',
  'dossier',
  false,
  null::text,
  null::timestamptz,
  null::numeric
from public.dossiers_voyage d
cross join today t
left join public.dossiers_voyage_versions ver on ver.id = coalesce(d.version_verrouillee_id, d.version_active_id)
where d.paye_at is not null and not d.est_modele;

comment on view public.admin_reservations is
  'Page Réservations du back-office : une ligne par réservation (expérience, bateau, demande en cours, hôtel, dossier de voyage payé). Lecture seule.';

-- 2) Paiements en ligne non aboutis : une ligne par client et par expérience, tentatives regroupées.
--    « failed » = paiement échoué ; « unfinished » = paiement commencé et pas terminé depuis plus de 24 h.
--    « converted » = une réservation confirmée existe ensuite pour le même client (email ou téléphone).
create view public.admin_unfinished_payments
with (security_invoker = true) as
with attempts as (
  select
    lower(b.customer_email) as customer_email,
    b.standalone_experience_id as experience_id,
    (array_agg(b.customer_name order by b.created_at desc))[1] as client,
    (array_agg(b.customer_phone order by b.created_at desc) filter (where b.customer_phone is not null))[1] as customer_phone,
    array_remove(array_agg(distinct b.customer_phone), null) as phones,
    max(b.custom_experience_title) as custom_title,
    count(*)::int as attempts,
    max(b.sell_price)::numeric as amount,
    max(coalesce(b.currency, 'ILS')) as currency,
    max(b.booking_date) as service_date,
    min(b.created_at) as first_attempt_at,
    max(b.created_at) as last_attempt_at,
    case when bool_or(b.payment_status = 'failed') then 'failed' else 'unfinished' end as kind
  from public.standalone_bookings b
  where b.status = 'pending'
    and (b.payment_status = 'failed' or b.created_at < now() - interval '24 hours')
  group by lower(b.customer_email), b.standalone_experience_id
)
select
  a.customer_email,
  a.experience_id,
  a.client,
  a.customer_phone,
  coalesce(e.title_fr, e.title, a.custom_title, 'Expérience') as product,
  a.attempts,
  a.amount,
  a.currency,
  a.service_date,
  a.last_attempt_at,
  a.kind,
  exists (
    select 1
    from public.standalone_bookings c
    where c.status = 'confirmed'
      and not coalesce(c.is_cancelled, false)
      and c.created_at >= a.first_attempt_at
      and (lower(c.customer_email) = a.customer_email or c.customer_phone = any (a.phones))
  ) as converted
from attempts a
left join public.standalone_experiences e on e.id = a.experience_id;

comment on view public.admin_unfinished_payments is
  'Page Réservations du back-office, puce « Paiements non aboutis » : tentatives de paiement en ligne regroupées par client et par expérience. Lecture seule.';

revoke all on public.admin_reservations from anon;
revoke all on public.admin_unfinished_payments from anon;
grant select on public.admin_reservations to authenticated;
grant select on public.admin_unfinished_payments to authenticated;

commit;
