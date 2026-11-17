-- Langue de la page d'où vient une demande ou une réservation (17/11/2026).
--
-- client_locale = langue du site au moment de la demande : en, fr, he, et aussi es, ru, de
-- (pages traduites automatiquement). À ne pas confondre avec preferred_lang (langue des emails,
-- limitée à en / fr / he) : un client venu d'une page russe reçoit ses emails en anglais, mais
-- le back-office affiche un badge « RU » sur sa demande.
--
-- Rempli par : process-standalone-payment (réservations d'expériences), process-booking
-- (réservations d'hôtel), submit-tailor-made-request (demandes sur-mesure) et le site
-- lui-même pour les demandes de disponibilité (bateaux compris). Vide pour les anciennes lignes.
-- La vue admin_reservations reprend la définition en production au 17/11/2026, avec cette
-- seule colonne ajoutée à la fin de chaque partie.

begin;

alter table public.standalone_bookings
  add column if not exists client_locale text
  check (client_locale in ('en', 'fr', 'he', 'es', 'ru', 'de'));

alter table public.standalone_experience_requests
  add column if not exists client_locale text
  check (client_locale in ('en', 'fr', 'he', 'es', 'ru', 'de'));

alter table public.bookings_hg
  add column if not exists client_locale text
  check (client_locale in ('en', 'fr', 'he', 'es', 'ru', 'de'));

alter table public.dossiers_voyage
  add column if not exists client_locale text
  check (client_locale in ('en', 'fr', 'he', 'es', 'ru', 'de'));

create or replace view public.admin_reservations
with (security_invoker = true) as
 WITH today AS (
         SELECT (now() AT TIME ZONE 'Asia/Jerusalem'::text)::date AS d
        )
 SELECT 'booking'::text AS source,
    b.id,
    "left"(b.id::text, 4) AS ref,
    b.product_type AS type,
        CASE
            WHEN b.status = 'cancelled'::text OR COALESCE(b.is_cancelled, false) THEN 'annulee'::text
            WHEN b.booking_date < t.d THEN 'passee'::text
            ELSE 'confirmee'::text
        END AS status,
    COALESCE(NULLIF(b.customer_name, ''::text), 'Sans nom'::text) AS client,
    COALESCE(b.custom_experience_title, e.title_fr, e.title, 'Expérience'::text) AS product,
    COALESCE(b.supplier_name, bp.name, ep.name, ei.supplier_name) AS partner,
    b.booking_date AS service_date,
    NULL::timestamp with time zone AS received_at,
    b.party_size::text AS pax,
    b.sell_price::numeric AS amount,
    COALESCE(b.currency, 'ILS'::text) AS currency,
        CASE
            WHEN b.payment_status = 'paid'::text THEN b.sell_price
            WHEN b.payment_status = 'deposit_paid'::text THEN COALESCE(NULLIF(pay.paid, 0::numeric), b.deposit_amount, 0::numeric)
            ELSE 0::numeric
        END AS collected,
        CASE b.payment_status
            WHEN 'paid'::text THEN 'paid'::text
            WHEN 'deposit_paid'::text THEN 'deposit'::text
            WHEN 'refunded'::text THEN 'refunded'::text
            WHEN 'refund_pending'::text THEN 'refunded'::text
            ELSE 'unpaid'::text
        END AS client_payment,
    b.supplier_cost::numeric AS supplier_cost,
        CASE
            WHEN b.supplier_payment_status = 'paid'::text THEN 'paid'::text
            ELSE 'todo'::text
        END AS supplier_payment,
        CASE
            WHEN b.source = 'online'::text THEN 'online'::text
            ELSE COALESCE(b.channel, 'manual'::text)
        END AS channel_key,
    b.source AS origin,
    b.source = 'online'::text AS is_online,
    b.internal_notes AS notes,
    b.supplier_booking_requested_at AS sent_to_provider_at,
    NULL::numeric AS deposit_due,
        CASE
            WHEN b.supplier_cost IS NULL THEN 1
            ELSE 0
        END AS missing_costs,
        CASE
            WHEN b.supplier_payment_status = 'paid'::text THEN NULL::numeric
            ELSE b.supplier_cost
        END AS supplier_due,
    COALESCE(b.provider_id, ei.provider_id) AS provider_id,
    b.refund_amount::numeric AS refund_amount,
        CASE b.payment_status
            WHEN 'refund_pending'::text THEN 'todo'::text
            WHEN 'refunded'::text THEN 'done'::text
            ELSE 'none'::text
        END AS refund_status,
    b.refund_method,
    b.deposit_kept AS kept_amount,
    b.supplier_refund_status,
    b.supplier_refund_amount,
    b.supplier_refund_status = 'avoir'::text AND b.supplier_credit_used_on IS NULL AS supplier_credit_open,
    NULLIF(b.customer_phone, ''::text) AS phone,
    NULL::integer AS nights,
    b.supplier_booked_at AS booked_with_provider_at,
    b.client_locale
   FROM standalone_bookings b
     CROSS JOIN today t
     LEFT JOIN standalone_experiences e ON e.id = b.standalone_experience_id
     LEFT JOIN standalone_experience_internal ei ON ei.experience_id = e.id
     LEFT JOIN providers bp ON bp.id = b.provider_id
     LEFT JOIN providers ep ON ep.id = ei.provider_id
     LEFT JOIN LATERAL ( SELECT sum(p.amount) AS paid
           FROM standalone_booking_payments p
          WHERE p.booking_id = b.id AND p.status = 'paid'::text) pay ON true
  WHERE b.status <> 'pending'::text
UNION ALL
 SELECT 'request'::text AS source,
    r.id,
    "left"(r.id::text, 4) AS ref,
        CASE
            WHEN c.slug = 'bateaux'::text THEN 'boat'::text
            ELSE 'experience'::text
        END AS type,
        CASE
            WHEN r.status = 'availability_confirmed'::text THEN 'dispo_ok'::text
            ELSE 'demande'::text
        END AS status,
    COALESCE(NULLIF(r.customer_name, ''::text), 'Sans nom'::text) AS client,
    COALESCE(e.title_fr, e.title, r.preferred_city, 'Demande'::text) AS product,
    COALESCE(ep.name, ei.supplier_name) AS partner,
    r.requested_date AS service_date,
    r.created_at AS received_at,
        CASE
            WHEN r.party_max IS NOT NULL AND r.party_max <> r.adults THEN (r.adults::text || '-'::text) || r.party_max::text
            ELSE (r.adults + r.children)::text
        END AS pax,
    v.sale_price::numeric AS amount,
    COALESCE(v.currency, e.currency, 'ILS'::text) AS currency,
    0::numeric AS collected,
    'unpaid'::text AS client_payment,
    NULL::numeric AS supplier_cost,
    'none'::text AS supplier_payment,
    'request'::text AS channel_key,
    COALESCE(r.source, 'form'::text) AS origin,
    false AS is_online,
    r.internal_notes AS notes,
    r.sent_to_provider_at,
        CASE
            WHEN e.deposit_type = 'fixed'::text AND e.deposit_amount > 0::numeric THEN e.deposit_amount
            WHEN e.deposit_type = 'percentage'::text AND e.deposit_amount > 0::numeric AND v.sale_price IS NOT NULL THEN round(v.sale_price * e.deposit_amount / 100::numeric)
            ELSE NULL::numeric
        END AS deposit_due,
    0 AS missing_costs,
    NULL::numeric AS supplier_due,
    NULL::uuid AS provider_id,
    NULL::numeric AS refund_amount,
    'none'::text AS refund_status,
    NULL::text AS refund_method,
    NULL::numeric AS kept_amount,
    'none'::text AS supplier_refund_status,
    NULL::numeric AS supplier_refund_amount,
    false AS supplier_credit_open,
    NULLIF(r.customer_phone, ''::text) AS phone,
    NULL::integer AS nights,
    NULL::timestamp with time zone AS booked_with_provider_at,
    r.client_locale
   FROM standalone_experience_requests r
     LEFT JOIN standalone_experiences e ON e.id = r.experience_id
     LEFT JOIN standalone_experience_internal ei ON ei.experience_id = e.id
     LEFT JOIN categories c ON c.id = e.category_id
     LEFT JOIN providers ep ON ep.id = ei.provider_id
     LEFT JOIN standalone_experience_price_variants v ON v.id = r.price_variant_id
  WHERE r.status = ANY (ARRAY['new'::text, 'sent_to_provider'::text, 'contacted'::text, 'availability_confirmed'::text])
UNION ALL
 SELECT 'hotel'::text AS source,
    h.id,
    COALESCE(h.hg_booking_id, "left"(h.id::text, 4)) AS ref,
    'hotel'::text AS type,
        CASE
            WHEN h.status = 'cancelled'::text OR h.is_cancelled THEN 'annulee'::text
            WHEN h.checkout < t.d THEN 'passee'::text
            ELSE 'confirmee'::text
        END AS status,
    COALESCE(NULLIF(h.customer_name, ''::text), 'Sans nom'::text) AS client,
    ((COALESCE(ho.name, NULLIF(h.hotel_name, ''::text), 'Hôtel'::text) || ' · '::text) || h.nights::text) ||
        CASE
            WHEN h.nights > 1 THEN ' nuits'::text
            ELSE ' nuit'::text
        END AS product,
    COALESCE(ho.name, NULLIF(h.hotel_name, ''::text)) AS partner,
    h.checkin AS service_date,
    NULL::timestamp with time zone AS received_at,
    h.party_size::text AS pax,
    h.sell_price AS amount,
    COALESCE(h.currency, 'ILS'::text) AS currency,
        CASE h.payment_status
            WHEN 'paid'::text THEN h.sell_price
            WHEN 'deposit_paid'::text THEN COALESCE(h.paid_amount, 0::numeric)
            WHEN 'refunded'::text THEN COALESCE(h.paid_amount, 0::numeric)
            WHEN 'refund_pending'::text THEN COALESCE(h.paid_amount, 0::numeric)
            ELSE 0::numeric
        END AS collected,
        CASE h.payment_status
            WHEN 'paid'::text THEN 'paid'::text
            WHEN 'deposit_paid'::text THEN 'deposit'::text
            WHEN 'refunded'::text THEN 'refunded'::text
            WHEN 'refund_pending'::text THEN 'refunded'::text
            ELSE 'unpaid'::text
        END AS client_payment,
    h.net_price AS supplier_cost,
        CASE
            WHEN h.source <> 'manual_admin'::text THEN 'none'::text
            WHEN h.supplier_payment_status = 'paid'::text THEN 'paid'::text
            ELSE 'todo'::text
        END AS supplier_payment,
        CASE
            WHEN h.source = 'manual_admin'::text THEN COALESCE(h.channel, 'manual'::text)
            ELSE 'online'::text
        END AS channel_key,
    h.source AS origin,
    h.source <> 'manual_admin'::text AS is_online,
    h.internal_notes AS notes,
    NULL::timestamp with time zone AS sent_to_provider_at,
    NULL::numeric AS deposit_due,
        CASE
            WHEN h.source = 'manual_admin'::text AND h.net_price IS NULL THEN 1
            ELSE 0
        END AS missing_costs,
        CASE
            WHEN h.source = 'manual_admin'::text AND h.supplier_payment_status <> 'paid'::text THEN h.net_price
            ELSE NULL::numeric
        END AS supplier_due,
    NULL::uuid AS provider_id,
    h.refund_amount,
        CASE h.payment_status
            WHEN 'refund_pending'::text THEN 'todo'::text
            WHEN 'refunded'::text THEN 'done'::text
            ELSE 'none'::text
        END AS refund_status,
    h.refund_method,
    h.deposit_kept AS kept_amount,
    h.supplier_refund_status,
    h.supplier_refund_amount,
    h.supplier_refund_status = 'avoir'::text AND h.supplier_credit_used_on IS NULL AS supplier_credit_open,
    NULLIF(h.customer_phone, ''::text) AS phone,
    h.nights,
    NULL::timestamp with time zone AS booked_with_provider_at,
    h.client_locale
   FROM bookings_hg h
     CROSS JOIN today t
     LEFT JOIN hotels2 ho ON ho.id = h.hotel_id
  WHERE h.status <> ALL (ARRAY['pending'::text, 'failed'::text])
UNION ALL
 SELECT 'dossier'::text AS source,
    d.id,
    COALESCE(d.reference, "left"(d.id::text, 4)) AS ref,
    'itinerary'::text AS type,
        CASE
            WHEN COALESCE(d.dates_depart, d.dates_arrivee) < t.d THEN 'passee'::text
            ELSE 'confirmee'::text
        END AS status,
    COALESCE(NULLIF(d.client_nom, ''::text), d.nom_destinataire) AS client,
        CASE
            WHEN d.page_sur_mesure IS NOT NULL THEN 'Page sur mesure · '::text || d.nom_destinataire
            ELSE 'Itinéraire sur mesure'::text
        END AS product,
    NULL::text AS partner,
    d.dates_arrivee AS service_date,
    NULL::timestamp with time zone AS received_at,
    d.nb_voyageurs::text AS pax,
    COALESCE(d.montant_vente_final, ver.prix_total_vente) AS amount,
    COALESCE(d.devise, 'ILS'::text) AS currency,
    COALESCE(d.montant_encaisse, d.montant_vente_final, ver.prix_total_vente, 0::numeric) AS collected,
        CASE
            WHEN COALESCE(d.montant_encaisse, d.montant_vente_final, ver.prix_total_vente, 0::numeric) >= COALESCE(d.montant_vente_final, ver.prix_total_vente, 0::numeric) THEN 'paid'::text
            WHEN COALESCE(d.montant_encaisse, 0::numeric) > 0::numeric THEN 'deposit'::text
            ELSE 'unpaid'::text
        END AS client_payment,
        CASE
            WHEN li.total > 0 AND li.missing = 0 THEN li.cost
            ELSE NULL::numeric
        END AS supplier_cost,
        CASE
            WHEN COALESCE(li.total, 0::bigint) = 0 THEN 'none'::text
            WHEN li.unpaid > 0 THEN 'todo'::text
            ELSE 'paid'::text
        END AS supplier_payment,
    'dossier'::text AS channel_key,
    'dossier'::text AS origin,
    false AS is_online,
    NULL::text AS notes,
    NULL::timestamp with time zone AS sent_to_provider_at,
    NULL::numeric AS deposit_due,
    COALESCE(li.missing, 0::bigint)::integer AS missing_costs,
    li.due AS supplier_due,
    NULL::uuid AS provider_id,
    NULL::numeric AS refund_amount,
    'none'::text AS refund_status,
    NULL::text AS refund_method,
    NULL::numeric AS kept_amount,
    'none'::text AS supplier_refund_status,
    NULL::numeric AS supplier_refund_amount,
    false AS supplier_credit_open,
    NULLIF(d.telephone, ''::text) AS phone,
    NULL::integer AS nights,
    NULL::timestamp with time zone AS booked_with_provider_at,
    d.client_locale
   FROM dossiers_voyage d
     CROSS JOIN today t
     LEFT JOIN dossiers_voyage_versions ver ON ver.id = COALESCE(d.version_verrouillee_id, d.version_active_id)
     LEFT JOIN LATERAL ( SELECT count(*) AS total,
            count(*) FILTER (WHERE l.cout_reel IS NULL) AS missing,
            count(*) FILTER (WHERE l.paiement_fournisseur = 'a_payer'::text) AS unpaid,
            sum(l.cout_reel) AS cost,
            sum(l.cout_reel) FILTER (WHERE l.paiement_fournisseur = 'a_payer'::text) AS due
           FROM admin_reservation_dossier_lines l
          WHERE l.dossier_id = d.id) li ON true
  WHERE d.paye_at IS NOT NULL AND NOT d.est_modele
UNION ALL
 SELECT 'dossier'::text AS source,
    d.id,
    COALESCE(d.reference, "left"(d.id::text, 4)) AS ref,
    'itinerary'::text AS type,
    'demande_sur_mesure'::text AS status,
    d.nom_destinataire AS client,
    'Sur-mesure · '::text || COALESCE(NULLIF(d.demande_formulaire ->> 'type_sejour_autre'::text, ''::text),
        CASE d.demande_formulaire ->> 'type_sejour'::text
            WHEN 'trip_sur_mesure'::text THEN 'Trip sur-mesure'::text
            WHEN 'romantic_getaway'::text THEN 'Romantic Getaway'::text
            WHEN 'proposal'::text THEN 'Proposal'::text
            WHEN 'celebration'::text THEN 'Celebration'::text
            WHEN 'friends_group'::text THEN 'Friends & Group'::text
            ELSE NULL::text
        END, NULLIF(d.demande_formulaire ->> 'occasion'::text, ''::text), 'à préciser'::text) AS product,
    NULL::text AS partner,
    d.dates_arrivee AS service_date,
    d.created_at AS received_at,
    d.nb_voyageurs::text AS pax,
    NULL::numeric AS amount,
    COALESCE(d.devise, 'EUR'::text) AS currency,
    0::numeric AS collected,
    'unpaid'::text AS client_payment,
    NULL::numeric AS supplier_cost,
    'none'::text AS supplier_payment,
    'tailor_made'::text AS channel_key,
    'formulaire_site'::text AS origin,
    false AS is_online,
    NULL::text AS notes,
    NULL::timestamp with time zone AS sent_to_provider_at,
    NULL::numeric AS deposit_due,
    0 AS missing_costs,
    NULL::numeric AS supplier_due,
    NULL::uuid AS provider_id,
    NULL::numeric AS refund_amount,
    'none'::text AS refund_status,
    NULL::text AS refund_method,
    NULL::numeric AS kept_amount,
    'none'::text AS supplier_refund_status,
    NULL::numeric AS supplier_refund_amount,
    false AS supplier_credit_open,
    NULLIF(d.telephone, ''::text) AS phone,
    NULL::integer AS nights,
    NULL::timestamp with time zone AS booked_with_provider_at,
    d.client_locale
   FROM dossiers_voyage d
  WHERE d.statut = 'demande_sur_mesure'::text AND d.paye_at IS NULL AND NOT d.est_modele AND NOT d.archive;

commit;
