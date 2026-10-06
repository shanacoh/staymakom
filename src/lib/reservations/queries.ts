// Lecture des réservations pour la page unique du back-office : va chercher les quatre
// sources et les traduit dans le format commun (ReservationRow).
// Étape provisoire : cette traduction sera reprise par une vue SQL (migration 3 de la
// refonte), ce fichier ne fera alors plus que lire la vue.

import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { CHANNEL_LABELS } from "@/components/admin/BookingsGrid/columnTypes";
import { BOATS_CATEGORY_ID } from "@/lib/boatsCategory";
import type { ClientPayment, ReservationRow, ReservationStatus } from "./types";

export const RESERVATIONS_QUERY_KEY = ["admin-reservations-unified"];

const shortRef = (id: string) => id.slice(0, 4);

const isPast = (date: string | null, today: Date) =>
  !!date && differenceInCalendarDays(parseISO(date), today) < 0;

function clientPaymentOf(paymentStatus: string | null): ClientPayment {
  if (paymentStatus === "paid") return "paid";
  if (paymentStatus === "deposit_paid") return "deposit";
  if (paymentStatus === "refunded" || paymentStatus === "refund_pending") return "refunded";
  return "unpaid";
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function bookingToRow(b: any, today: Date): ReservationRow {
  const experience = b.standalone_experiences;
  const cancelled = b.status === "cancelled" || !!b.is_cancelled;
  const status: ReservationStatus = cancelled ? "annulee" : isPast(b.booking_date, today) ? "passee" : "confirmee";
  const clientPayment = clientPaymentOf(b.payment_status);
  const paidPayments = (b.standalone_booking_payments ?? [])
    .filter((p: any) => p.status === "paid")
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);
  const collected =
    clientPayment === "paid" ? Number(b.sell_price) : clientPayment === "deposit" ? paidPayments || Number(b.deposit_amount ?? 0) : 0;
  const isOnline = b.source === "online";
  const channelLabel = isOnline ? "En ligne" : b.channel ? `Manuel · ${CHANNEL_LABELS[b.channel] ?? b.channel}` : "Manuel";
  return {
    key: `booking:${b.id}`,
    id: b.id,
    source: "booking",
    ref: shortRef(b.id),
    type: b.product_type === "boat" ? "boat" : "experience",
    status,
    client: b.customer_name || "Sans nom",
    product: b.custom_experience_title || experience?.title_fr || experience?.title || "Expérience",
    partner: b.supplier_name || experience?.providers?.name || experience?.supplier_name || null,
    date: b.booking_date,
    receivedAt: null,
    pax: String(b.party_size ?? ""),
    amount: Number(b.sell_price),
    currency: b.currency || "ILS",
    collected,
    clientPayment,
    supplierCost: b.supplier_cost === null ? null : Number(b.supplier_cost),
    supplierPayment: b.supplier_payment_status === "paid" ? "paid" : "todo",
    channelKey: isOnline ? "online" : b.channel || "manual",
    channelLabel,
    isOnline,
    notes: b.internal_notes,
    sentToProviderAt: null,
    depositDue: null,
    detailPath: `/admin/standalone-bookings/${b.id}`,
  };
}

function depositDueOf(experience: any, amount: number | null): number | null {
  if (!experience || !experience.deposit_amount) return null;
  if (experience.deposit_type === "fixed") return Number(experience.deposit_amount);
  if (experience.deposit_type === "percentage" && amount !== null) {
    return Math.round((amount * Number(experience.deposit_amount)) / 100);
  }
  return null;
}

function requestToRow(r: any): ReservationRow {
  const experience = r.standalone_experiences;
  const variant = r.standalone_experience_price_variants;
  const amount = variant?.sale_price === null || variant?.sale_price === undefined ? null : Number(variant.sale_price);
  const people = (r.adults ?? 0) + (r.children ?? 0);
  return {
    key: `request:${r.id}`,
    id: r.id,
    source: "request",
    ref: shortRef(r.id),
    type: experience?.category_id === BOATS_CATEGORY_ID ? "boat" : "experience",
    status: r.status === "availability_confirmed" ? "dispo_ok" : "demande",
    client: r.customer_name || "Sans nom",
    product: experience?.title_fr || experience?.title || r.preferred_city || "Demande",
    partner: experience?.providers?.name || experience?.supplier_name || null,
    date: r.requested_date,
    receivedAt: r.created_at,
    pax: r.party_max && r.party_max !== r.adults ? `${r.adults}-${r.party_max}` : String(people),
    amount,
    currency: variant?.currency || experience?.currency || "ILS",
    collected: 0,
    clientPayment: "unpaid",
    supplierCost: null,
    supplierPayment: "none",
    channelKey: "request",
    channelLabel: r.source === "card_whatsapp" ? "Bouton WhatsApp" : "Demande site",
    isOnline: false,
    notes: r.internal_notes,
    sentToProviderAt: r.sent_to_provider_at,
    depositDue: depositDueOf(experience, amount),
    detailPath: null,
  };
}

function hotelToRow(h: any, today: Date): ReservationRow {
  const cancelled = h.status === "cancelled" || !!h.is_cancelled;
  const status: ReservationStatus = cancelled ? "annulee" : isPast(h.checkout, today) ? "passee" : "confirmee";
  const clientPayment = clientPaymentOf(h.payment_status);
  const isOnline = h.source !== "manual_admin";
  const collected =
    h.paid_amount !== null && h.paid_amount !== undefined
      ? Number(h.paid_amount)
      : clientPayment === "paid"
        ? Number(h.sell_price)
        : 0;
  const hotelName = h.hotels2?.name || "Hôtel";
  return {
    key: `hotel:${h.id}`,
    id: h.id,
    source: "hotel",
    ref: h.hg_booking_id || shortRef(h.id),
    type: "hotel",
    status,
    client: h.customer_name || "Sans nom",
    product: `${hotelName} · ${h.nights} nuit${h.nights > 1 ? "s" : ""}`,
    partner: hotelName,
    date: h.checkin,
    receivedAt: null,
    pax: String(h.party_size ?? ""),
    amount: Number(h.sell_price),
    currency: h.currency || "ILS",
    collected,
    clientPayment,
    supplierCost: h.net_price === null ? null : Number(h.net_price),
    supplierPayment: "none",
    channelKey: isOnline ? "online" : h.channel || "manual",
    channelLabel: isOnline ? "En ligne" : h.channel ? `Manuel · ${CHANNEL_LABELS[h.channel] ?? h.channel}` : "Manuel",
    isOnline,
    notes: h.internal_notes,
    sentToProviderAt: null,
    depositDue: null,
    detailPath: `/admin/reservations/${h.id}`,
  };
}

// Dossier de voyage payé : une seule ligne, comptée une seule fois. Ses lignes enfants
// (coût réel, paiement fournisseur) arrivent avec le lot Itinéraire.
function dossierToRow(d: any, versionPrices: Map<string, any>, today: Date): ReservationRow {
  const version = versionPrices.get(d.version_verrouillee_id ?? d.version_active_id);
  const amount = version?.prix_total_vente === null || version?.prix_total_vente === undefined ? null : Number(version.prix_total_vente);
  return {
    key: `dossier:${d.id}`,
    id: d.id,
    source: "dossier",
    ref: d.reference || shortRef(d.id),
    type: "itinerary",
    status: isPast(d.dates_depart ?? d.dates_arrivee, today) ? "passee" : "confirmee",
    client: d.nom_destinataire,
    product: "Itinéraire sur mesure",
    partner: null,
    date: d.dates_arrivee,
    receivedAt: null,
    pax: d.nb_voyageurs ? String(d.nb_voyageurs) : "",
    amount,
    currency: d.devise || "ILS",
    collected: amount ?? 0,
    clientPayment: "paid",
    supplierCost: version?.prix_total_achat === null || version?.prix_total_achat === undefined ? null : Number(version.prix_total_achat),
    supplierPayment: "none",
    channelKey: "dossier",
    channelLabel: "Dossier",
    isOnline: false,
    notes: null,
    sentToProviderAt: null,
    depositDue: null,
    detailPath: `/admin/dossiers/${d.id}`,
  };
}

async function fetchReservationRows(): Promise<ReservationRow[]> {
  const today = new Date();
  const db = supabase as any;

  const [bookings, requests, hotels, dossiers] = await Promise.all([
    // Un paiement en ligne jamais abouti (status « pending ») n'est pas une réservation.
    db
      .from("standalone_bookings")
      .select(
        "*, standalone_experiences(title, title_fr, supplier_name, category_id, providers(name)), standalone_booking_payments(amount, status)",
      )
      .neq("status", "pending"),
    // Une demande convertie a laissé la place à sa réservation, une demande fermée n'en est plus une.
    db
      .from("standalone_experience_requests")
      .select(
        "id, customer_name, requested_date, adults, children, party_max, status, internal_notes, created_at, source, preferred_city, sent_to_provider_at, standalone_experiences(title, title_fr, currency, category_id, supplier_name, deposit_type, deposit_amount, providers(name)), standalone_experience_price_variants(sale_price, currency)",
      )
      .in("status", ["new", "sent_to_provider", "contacted", "availability_confirmed"]),
    db.from("bookings_hg").select("*, hotels2(id, name)").not("status", "in", "(pending,failed)"),
    db
      .from("dossiers_voyage")
      .select("id, reference, nom_destinataire, dates_arrivee, dates_depart, nb_voyageurs, devise, version_verrouillee_id, version_active_id")
      .not("paye_at", "is", null)
      .eq("est_modele", false),
  ]);

  for (const result of [bookings, requests, hotels, dossiers]) {
    if (result.error) throw result.error;
  }

  const versionIds = (dossiers.data as any[])
    .map((d) => d.version_verrouillee_id ?? d.version_active_id)
    .filter(Boolean);
  const versionPrices = new Map<string, any>();
  if (versionIds.length > 0) {
    const { data, error } = await db
      .from("dossiers_voyage_versions")
      .select("id, prix_total_vente, prix_total_achat")
      .in("id", versionIds);
    if (error) throw error;
    for (const version of data as any[]) versionPrices.set(version.id, version);
  }

  const rows: ReservationRow[] = [
    ...(requests.data as any[]).map(requestToRow),
    ...(bookings.data as any[]).map((b) => bookingToRow(b, today)),
    ...(hotels.data as any[]).map((h) => hotelToRow(h, today)),
    ...(dossiers.data as any[]).map((d) => dossierToRow(d, versionPrices, today)),
  ];

  // Du plus récent au plus ancien ; une demande sans date précise se classe à sa date de réception.
  const sortDate = (row: ReservationRow) => row.date ?? row.receivedAt?.slice(0, 10) ?? "";
  return rows.sort((a, b) => sortDate(b).localeCompare(sortDate(a)));
}

export function useReservationRows() {
  return useQuery({ queryKey: RESERVATIONS_QUERY_KEY, queryFn: fetchReservationRows });
}
