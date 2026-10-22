-- Réservations v2, lot 3 : l'onglet Itinéraire montre tous les dossiers de voyage.
--
-- Jusqu'ici l'onglet ne montrait que les dossiers payés. Il montre maintenant tous les dossiers
-- (archivés et modèles compris), rangés en Convertis / En cours / Collab / Modèles / Non convertis,
-- plus les pages-itinéraire faites sur mesure dans le code du site (Celine30, Happy Birthday Mom...),
-- qui n'étaient dans aucune liste : chacune devient un dossier marqué « page sur mesure ».

begin;

-- 1. Nouvelles informations sur le dossier ------------------------------------------------------

alter table public.dossiers_voyage
  add column perdu_motif text
    check (perdu_motif in ('prix', 'client_ne_repond_plus', 'a_reserve_ailleurs', 'v0_test', 'autre')),
  add column perdu_note text,
  add column page_sur_mesure text unique
    check (page_sur_mesure ~ '^/[A-Za-z0-9-]+$'),
  add column client_nom text;

comment on column public.dossiers_voyage.perdu_motif is
  'Motif d''un dossier non converti (classé à la main depuis la page Réservations).';
comment on column public.dossiers_voyage.page_sur_mesure is
  'Chemin d''une page-itinéraire écrite dans le code du site (ex. /happy-birthday-mom). Un tel dossier n''est qu''un repère pour la page Réservations : il n''a ni proposition ni carnet, et n''apparaît pas dans l''espace Itinéraires.';
comment on column public.dossiers_voyage.client_nom is
  'Nom du client quand le nom du dossier ne le dit pas (ex. dossier « Happy Birthday Mom », client Josh Sirota).';

-- 2. Vue de l'onglet Itinéraire -------------------------------------------------------------------
-- Une ligne par dossier. Le groupe suit l'ordre : payé, modèle, collab, non converti, en cours.

create view public.admin_itineraries
with (security_invoker = true) as
select
  d.id,
  coalesce(d.reference, left(d.id::text, 4)) as ref,
  d.nom_destinataire as nom,
  coalesce(nullif(d.client_nom, ''), l.name, nullif(trim(concat_ws(' ', l.first_name, l.last_name)), ''), d.email, d.telephone) as client,
  d.created_at,
  d.dates_arrivee,
  d.dates_depart,
  d.nb_voyageurs,
  d.objectif,
  d.statut,
  d.archive,
  d.est_modele,
  case
    when d.paye_at is not null then 'converti'
    when d.est_modele then 'modele'
    when d.objectif = 'collab' then 'collab'
    when d.archive or d.statut in ('termine', 'perdu') then 'non_converti'
    else 'en_cours'
  end as groupe,
  d.nb_ouvertures,
  d.derniere_ouverture_at,
  d.envoye_at,
  d.paye_at,
  case when d.paye_at is not null then coalesce(d.montant_vente_final, ver.prix_total_vente) end::numeric as montant,
  coalesce(d.montant_encaisse, d.montant_vente_final, ver.prix_total_vente)::numeric as encaisse,
  ver.prix_total_vente::numeric as prix_propose,
  coalesce(d.devise, 'ILS') as devise,
  d.token_public,
  d.page_sur_mesure,
  d.perdu_motif,
  d.perdu_note
from public.dossiers_voyage d
left join public.leads l on l.id = d.lead_id
left join public.dossiers_voyage_versions ver on ver.id = coalesce(d.version_verrouillee_id, d.version_active_id);

comment on view public.admin_itineraries is
  'Onglet Itinéraire de la page Réservations : tous les dossiers de voyage, demandes sur-mesure, archivés et modèles compris, avec leur groupe.';

-- 3. La vue des réservations nomme le client et la page d'un dossier payé -----------------------
-- Reprise à l'identique de la vue en place (migration 20261022180000), sauf le bloc des dossiers
-- payés : client = client_nom s'il est connu, produit = « Page sur mesure · nom » pour une page.

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
  coalesce(nullif(d.client_nom, ''), d.nom_destinataire),
  case when d.page_sur_mesure is not null then 'Page sur mesure · ' || d.nom_destinataire else 'Itinéraire sur mesure' end,
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

-- 4. Données ------------------------------------------------------------------------------------

-- Doublon « SURPRISE PÈRE-FILLE MÉDECINE EN POCHE » (deux dossiers identiques du 26/07, jamais
-- ouverts) : le plus récent part à la corbeille de la page Réservations, d'où il se restaure.
do $$
declare
  v_ids uuid[];
begin
  select array_agg(id order by created_at, id) into v_ids
  from public.dossiers_voyage
  where nom_destinataire = 'SURPRISE PÈRE-FILLE MÉDECINE EN POCHE' and nb_ouvertures = 0 and paye_at is null;
  if array_length(v_ids, 1) = 2 then
    perform public.delete_reservations(jsonb_build_array(jsonb_build_object('source', 'dossier', 'id', v_ids[2])));
  end if;
end $$;

-- Page « Rebeca » : livrable du dossier sur-mesure TM-1006 déjà existant.
update public.dossiers_voyage set page_sur_mesure = '/rebeca' where reference = 'TM-1006' and page_sur_mesure is null;

-- Les autres pages-itinéraire du site, chacune comme un dossier. Seule celle de Josh a été payée ;
-- Carrie est une collab ; les autres n'ont pas été converties (motif à préciser par Shana).
insert into public.dossiers_voyage
  (nom_destinataire, client_nom, page_sur_mesure, destinataire_type, objectif, canal_origine, statut, archive,
   created_at, dates_arrivee, dates_depart, devise, paye_at, montant_vente_final, montant_encaisse)
values
  ('ITINÉRAIRES AJ', null, '/itineraries-AJ', 'client', 'vente', 'saisie_manuelle', 'perdu', true,
   '2026-05-15 12:00+03', null, null, 'ILS', null, null, null),
  ('CELINE 30', 'Céline', '/Celine30', 'client', 'vente', 'saisie_manuelle', 'perdu', true,
   '2026-06-09 12:00+03', null, null, 'ILS', null, null, null),
  ('VOTRE ITINÉRAIRE', null, '/votre-itineraire', 'client', 'vente', 'saisie_manuelle', 'perdu', true,
   '2026-07-01 12:00+03', null, null, 'ILS', null, null, null),
  ('ITINÉRAIRE TSFAT', 'Dan & Susana', '/itineraire-tsfat', 'client', 'vente', 'saisie_manuelle', 'perdu', true,
   '2026-08-20 12:00+03', null, null, 'ILS', null, null, null),
  ('HAPPY BIRTHDAY MOM', 'Josh Sirota', '/happy-birthday-mom', 'client', 'vente', 'whatsapp', 'paye', false,
   '2026-08-23 12:00+03', '2026-08-24', '2026-08-24', 'USD', '2026-08-24 12:00+03', 150, 150),
  ('NOS ESCAPADES (NP)', null, '/NP', 'client', 'vente', 'saisie_manuelle', 'perdu', true,
   '2026-09-08 12:00+03', null, null, 'ILS', null, null, null),
  ('SÉJOUR COLLINES DE JÉRUSALEM (EL)', null, '/EL', 'client', 'vente', 'saisie_manuelle', 'perdu', true,
   '2026-09-16 12:00+03', null, null, 'EUR', null, null, null),
  ('CARRIE SAFED', 'Carrie', '/carrie-safed', 'influenceur', 'collab', 'saisie_manuelle', 'envoye', false,
   '2026-10-06 12:00+03', null, null, 'ILS', null, null, null),
  ('LAURA MER MORTE', 'Laura', '/laura-mer-morte', 'client', 'vente', 'saisie_manuelle', 'perdu', true,
   '2026-10-07 12:00+03', '2026-10-09', '2026-10-11', 'ILS', null, null, null)
on conflict (page_sur_mesure) do nothing;

commit;
