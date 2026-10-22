// Écritures déclenchées par les boutons « Prochaine action » de la page Réservations.
// Chaque fonction fait une seule modification, et la conditionne à l'état attendu de la
// ligne : si quelqu'un d'autre l'a déjà traitée entre-temps, rien n'est écrasé.

import { supabase } from "@/integrations/supabase/client";
import { addDays, format, parseISO } from "date-fns";
import { STANDALONE_EXPERIENCE_INTERNAL } from "@/lib/internalFields";
import type { DossierLostReason, LostReason } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
const db = supabase as any;

function assertChanged(data: unknown[] | null, message: string) {
  if (!data || data.length === 0) throw new Error(message);
}

const ALREADY_HANDLED = "Cette ligne a déjà été modifiée. Recharge la liste.";

/** Demande complète, avec sa fiche et son prestataire (pour le message WhatsApp et la conversion). */
export async function fetchRequestForAction(requestId: string) {
  const { data, error } = await db
    .from("standalone_experience_requests")
    .select(
      "id, experience_id, customer_name, customer_email, customer_phone, requested_date, adults, children, party_max, message, internal_notes, status, source, desired_time_period, desired_time_value, requested_duration_minutes, preferred_city, sent_to_provider_at, provider_responded_at, standalone_experiences(title)",
    )
    .eq("id", requestId)
    .single();
  if (error) throw error;
  const request = data as any;
  // Le nom du bateau côté prestataire et le prestataire lié sont rangés à part, réservés aux admins.
  if (request.standalone_experiences && request.experience_id) {
    const { data: internal, error: internalError } = await db
      .from(STANDALONE_EXPERIENCE_INTERNAL.table)
      .select("supplier_boat_name, providers(name, whatsapp)")
      .eq(STANDALONE_EXPERIENCE_INTERNAL.key, request.experience_id)
      .maybeSingle();
    if (internalError) throw internalError;
    request.standalone_experiences = {
      ...request.standalone_experiences,
      supplier_boat_name: internal?.supplier_boat_name ?? null,
      providers: internal?.providers ?? null,
    };
  }
  return request;
}

export async function markRequestSentToProvider(requestId: string) {
  const { data, error } = await db
    .from("standalone_experience_requests")
    .update({ status: "sent_to_provider", sent_to_provider_at: new Date().toISOString() })
    .eq("id", requestId)
    .is("sent_to_provider_at", null)
    .select("id");
  if (error) throw error;
  // Déjà marquée envoyée (second clic) : ce n'est pas une erreur.
  return (data as unknown[]).length > 0;
}

/** Réponse du prestataire : disponible (la demande passe en « Dispo OK ») ou non (archivée « Pas de dispo »). */
export async function recordProviderAnswer(requestId: string, available: boolean) {
  const { data, error } = await db
    .from("standalone_experience_requests")
    .update({
      ...(available ? { status: "availability_confirmed" } : { status: "closed", lost_reason: "pas_de_dispo" }),
      provider_responded_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .in("status", ["new", "sent_to_provider", "contacted"])
    .select("id");
  if (error) throw error;
  assertChanged(data, ALREADY_HANDLED);
}

const ACTIVE_REQUEST_STATUSES = ["new", "sent_to_provider", "contacted", "availability_confirmed"];

/** Sort une demande du flux sans la supprimer : elle part dans les Archives avec son motif. */
export async function archiveRequest(requestId: string, reason: LostReason, note: string | null) {
  const { data, error } = await db
    .from("standalone_experience_requests")
    .update({ status: "closed", lost_reason: reason, lost_note: note })
    .eq("id", requestId)
    .in("status", ACTIVE_REQUEST_STATUSES)
    .select("id");
  if (error) throw error;
  assertChanged(data, ALREADY_HANDLED);
}

/**
 * Remet une demande archivée dans le flux, comme une demande toute neuve : le motif, la date de
 * sortie et l'envoi au prestataire sont effacés (la base efface les deux premiers d'elle-même).
 * Une demande convertie ne se réouvre pas : sa réservation existe.
 */
export async function reopenRequest(requestId: string) {
  const { data, error } = await db
    .from("standalone_experience_requests")
    .update({ status: "new", sent_to_provider_at: null, provider_responded_at: null })
    .eq("id", requestId)
    .eq("status", "closed")
    .select("id");
  if (error) throw error;
  assertChanged(data, ALREADY_HANDLED);
}

export async function linkRequestToBooking(requestId: string, bookingId: string) {
  const { error } = await db.rpc("link_request_to_booking", { p_request_id: requestId, p_booking_id: bookingId });
  if (error) throw error;
}

export interface BookingContact {
  customer_name: string;
  customer_phone: string | null;
  title: string;
}

export async function fetchBookingContact(bookingId: string): Promise<BookingContact> {
  const { data, error } = await db
    .from("standalone_bookings")
    .select("customer_name, customer_phone, custom_experience_title, standalone_experiences(title)")
    .eq("id", bookingId)
    .single();
  if (error) throw error;
  return {
    customer_name: data.customer_name,
    customer_phone: data.customer_phone,
    title: data.custom_experience_title || data.standalone_experiences?.title || "",
  };
}

export interface BalanceLink {
  checkoutUrl: string;
  amount: number;
  currency: string;
}

/**
 * Lien de paiement du solde. Réutilise le lien déjà créé et pas encore payé s'il porte le bon
 * montant, sinon en demande un nouveau à la fonction existante `create-booking-payment-link`
 * (qui calcule elle-même le reste à payer).
 */
export async function getOrCreateBalanceLink(bookingId: string, expectedAmount: number): Promise<BalanceLink> {
  const { data: existing, error: existingError } = await db
    .from("standalone_booking_payments")
    .select("amount, currency, checkout_url")
    .eq("booking_id", bookingId)
    .eq("kind", "balance")
    .eq("status", "pending")
    .not("checkout_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(1);
  if (existingError) throw existingError;
  const reusable = (existing as any[])[0];
  if (reusable && Number(reusable.amount) === expectedAmount) {
    return { checkoutUrl: reusable.checkout_url, amount: Number(reusable.amount), currency: reusable.currency };
  }

  const { data, error } = await supabase.functions.invoke("create-booking-payment-link", {
    body: { booking_id: bookingId, kind: "balance" },
  });
  if (error) throw new Error((error as any).context?.body?.error || error.message);
  if (!data?.success) throw new Error(data?.error || "Échec de la création du lien");
  return { checkoutUrl: data.checkout_url, amount: Number(data.amount), currency: data.currency };
}

/** Encaissement confirmé à la main. Jamais sur une réservation en ligne : là, c'est Revolut qui décide. */
export async function markClientPaid(bookingId: string) {
  const { data, error } = await db
    .from("standalone_bookings")
    .update({ payment_status: "paid" })
    .eq("id", bookingId)
    .eq("source", "manual_admin")
    .in("payment_status", ["pending", "deposit_paid"])
    .select("id");
  if (error) throw error;
  assertChanged(data, ALREADY_HANDLED);
}

export async function saveSupplierCost(bookingId: string, cost: number) {
  const { data, error } = await db.from("standalone_bookings").update({ supplier_cost: cost }).eq("id", bookingId).select("id");
  if (error) throw error;
  assertChanged(data, "Réservation introuvable.");
}

export async function markSupplierPaid(bookingId: string) {
  const { data, error } = await db
    .from("standalone_bookings")
    .update({ supplier_payment_status: "paid" })
    .eq("id", bookingId)
    .eq("supplier_payment_status", "pending")
    .not("supplier_cost", "is", null)
    .select("id");
  if (error) throw error;
  assertChanged(data, ALREADY_HANDLED);
}

/**
 * Hôtel saisi à la main : encaissement (ou solde) confirmé, l'encaissé rejoint le prix total.
 * Jamais sur une réservation synchronisée : là, c'est le paiement en ligne qui décide.
 */
export async function markHotelClientPaid(bookingId: string, total: number) {
  const { data, error } = await db
    .from("bookings_hg")
    .update({ payment_status: "paid", paid_amount: total, paid_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("source", "manual_admin")
    .in("payment_status", ["unpaid", "deposit_paid"])
    .select("id");
  if (error) throw error;
  assertChanged(data, ALREADY_HANDLED);
}

/** Coût de l'hôtel saisi à la main ; la commission enregistrée suit. */
export async function saveHotelSupplierCost(bookingId: string, cost: number, sellPrice: number) {
  const { data, error } = await db
    .from("bookings_hg")
    .update({ net_price: cost, commission_amount: sellPrice - cost })
    .eq("id", bookingId)
    .eq("source", "manual_admin")
    .select("id");
  if (error) throw error;
  assertChanged(data, "Réservation introuvable.");
}

export async function markHotelSupplierPaid(bookingId: string) {
  const { data, error } = await db
    .from("bookings_hg")
    .update({ supplier_payment_status: "paid", supplier_paid_at: new Date().toISOString().slice(0, 10) })
    .eq("id", bookingId)
    .eq("source", "manual_admin")
    .eq("supplier_payment_status", "pending")
    .not("net_price", "is", null)
    .select("id");
  if (error) throw error;
  assertChanged(data, ALREADY_HANDLED);
}

const CANCELLABLE_TABLES: Partial<Record<string, string>> = { booking: "standalone_bookings", hotel: "bookings_hg" };

/**
 * Enregistre l'annulation d'une réservation (remboursement client, côté prestataire), en une
 * seule modification de la ligne. Le contenu vient de `buildCancellationPatch`.
 */
export async function saveCancellation(source: string, rowId: string, patch: Record<string, unknown>) {
  const table = CANCELLABLE_TABLES[source];
  if (!table) throw new Error("Cette ligne ne s'annule pas ici");
  const { data, error } = await db.from(table).update(patch).eq("id", rowId).select("id");
  if (error) throw error;
  assertChanged(data, "Réservation introuvable. Recharge la liste.");
}

/** Utilise un avoir prestataire sur une nouvelle réservation : l'avoir se ferme, la réservation le note. */
export async function applySupplierCredit(creditBookingId: string, targetBookingId: string) {
  const { error } = await db.rpc("use_supplier_credit", { p_credit_booking_id: creditBookingId, p_target_booking_id: targetBookingId });
  if (error) throw error;
}

/** Marque une ligne « à vérifier », ou change sa note. */
export async function flagRow(source: string, rowId: string, note: string | null) {
  const { error } = await db.from("reservation_flags").upsert({ source, row_id: rowId, note }, { onConflict: "source,row_id" });
  if (error) throw error;
}

/** Retire le marquage « à vérifier ». */
export async function unflagRow(source: string, rowId: string) {
  const { error } = await db.from("reservation_flags").delete().eq("source", source).eq("row_id", rowId);
  if (error) throw error;
}

/** Écrit la modification d'une cellule de la grille de Saisie (une cellule = une écriture). */
export async function saveCellUpdate(table: string, rowId: string, patch: Record<string, unknown>) {
  const { data, error } = await db.from(table).update(patch).eq("id", rowId).select("id");
  if (error) throw error;
  assertChanged(data, "Ligne introuvable. Recharge la liste.");
}

export type NewRowType = "experience" | "boat" | "hotel";

/**
 * Ligne vide du bas de la grille : dès qu'un nom est tapé, la réservation est créée, du type
 * choisi juste à côté. Elle démarre « Confirmée », paiement client « Non payé », à la date du
 * jour, et se complète ensuite cellule par cellule. Un hôtel démarre « à préciser » pour une nuit.
 */
export async function createBookingFromGrid(customerName: string, today: string, type: NewRowType = "experience") {
  if (type === "hotel") {
    const { error } = await db.from("bookings_hg").insert({
      hg_booking_id: `MANUAL-${crypto.randomUUID()}`,
      hotel_name: "Hôtel à préciser",
      customer_name: customerName,
      checkin: today,
      checkout: format(addDays(parseISO(today), 1), "yyyy-MM-dd"),
      nights: 1,
      party_size: 1,
      sell_price: 0,
      net_price: null,
      commission_amount: 0,
      currency: "ILS",
      status: "confirmed",
      payment_status: "unpaid",
      is_cancelled: false,
      source: "manual_admin",
    });
    if (error) throw error;
    return;
  }
  const { error } = await db.from("standalone_bookings").insert({
    customer_name: customerName,
    customer_email: "",
    // La base exige une fiche liée ou un titre : titre vide en attendant le choix du produit.
    custom_experience_title: "",
    product_type: type,
    booking_date: today,
    party_size: 1,
    sell_price: 0,
    currency: "ILS",
    status: "confirmed",
    payment_status: "pending",
    supplier_payment_status: "pending",
    source: "manual_admin",
  });
  if (error) throw error;
}

// Ce qu'une copie reprend de la ligne d'origine : le produit, la date, le prix et le prestataire.
// Le client, ses coordonnées, les paiements et tout ce qui touche à une annulation repartent à zéro.
const BOOKING_COPIED = [
  "standalone_experience_id",
  "custom_experience_title",
  "product_type",
  "booking_date",
  "time_slot",
  "party_size",
  "adults_count",
  "children_count",
  "sell_price",
  "currency",
  "supplier_cost",
  "provider_id",
  "supplier_name",
  "channel",
  "custom_regulations",
  "custom_address",
  "rate_option",
  "extras",
];
const HOTEL_COPIED = [
  "hotel_id",
  "hotel_name",
  "experience_id",
  "checkin",
  "checkout",
  "nights",
  "party_size",
  "room_code",
  "room_name",
  "board_type",
  "rate_plan",
  "sell_price",
  "net_price",
  "commission_amount",
  "currency",
  "channel",
];

/** Duplique une réservation saisie (même produit, même date, même prix) pour un autre client. */
export async function duplicateReservation(source: string, rowId: string, copyName: string) {
  const table = source === "hotel" ? "bookings_hg" : source === "booking" ? "standalone_bookings" : null;
  if (!table) throw new Error("Cette ligne ne se duplique pas");
  const { data, error } = await db.from(table).select("*").eq("id", rowId).single();
  if (error) throw error;
  const fields = table === "bookings_hg" ? HOTEL_COPIED : BOOKING_COPIED;
  const copy: Record<string, unknown> = Object.fromEntries(fields.map((field) => [field, (data as any)[field]]));
  copy.customer_name = copyName;
  copy.status = "confirmed";
  copy.source = "manual_admin";
  if (table === "bookings_hg") {
    Object.assign(copy, { hg_booking_id: `MANUAL-${crypto.randomUUID()}`, payment_status: "unpaid", is_cancelled: false });
  } else {
    Object.assign(copy, { customer_email: "", payment_status: "pending", supplier_payment_status: "pending" });
  }
  const { error: insertError } = await db.from(table).insert(copy);
  if (insertError) throw insertError;
}

/**
 * Supprime une ou plusieurs lignes, quel que soit leur type. La base copie d'abord chaque ligne
 * (et ce qui lui est rattaché) dans la corbeille, puis la supprime, en une seule opération :
 * si une ligne pose problème, aucune n'est supprimée.
 */
export async function deleteReservationRows(rows: { source: string; id: string }[]) {
  const { error } = await db.rpc("delete_reservations", { p_items: rows.map((row) => ({ source: row.source, id: row.id })) });
  if (error) throw error;
}

/** Remet à l'identique une ligne de la corbeille, avec ce qui lui était rattaché. */
export async function restoreDeletedReservation(deletedId: string) {
  const { error } = await db.rpc("restore_deleted_reservation", { p_id: deletedId });
  if (error) throw error;
}

/**
 * « Lier un dossier payé » : marque un dossier de voyage comme payé, avec la date, le montant
 * convenu et le montant encaissé (inférieur au total = acompte). Une seule écriture, refusée
 * si le dossier a déjà été marqué payé entre-temps.
 */
export async function markDossierPaid(dossierId: string, input: { paidOn: string; total: number; collected: number }) {
  const { data, error } = await db
    .from("dossiers_voyage")
    .update({
      paye_at: new Date(`${input.paidOn}T12:00:00`).toISOString(),
      montant_vente_final: input.total,
      montant_encaisse: input.collected,
      statut: "paye",
      // Un dossier classé non converti peut finalement être payé : il sort des archives.
      archive: false,
      perdu_motif: null,
      perdu_note: null,
    })
    .eq("id", dossierId)
    .is("paye_at", null)
    .select("id");
  if (error) throw error;
  assertChanged(data, "Ce dossier est déjà marqué payé. Recharge la liste.");
}

/** Solde d'un dossier encaissé : l'encaissé rejoint le montant convenu. */
export async function markDossierBalanceCollected(dossierId: string, total: number) {
  const { data, error } = await db
    .from("dossiers_voyage")
    .update({ montant_vente_final: total, montant_encaisse: total })
    .eq("id", dossierId)
    .not("paye_at", "is", null)
    .select("id");
  if (error) throw error;
  assertChanged(data, ALREADY_HANDLED);
}

/** « Classer non converti » : le dossier est archivé avec un motif, sans rien supprimer. */
export async function classifyDossierLost(dossierId: string, reason: DossierLostReason, note: string | null) {
  const { data, error } = await db
    .from("dossiers_voyage")
    .update({ archive: true, statut: "perdu", perdu_motif: reason, perdu_note: note })
    .eq("id", dossierId)
    .is("paye_at", null)
    .select("id");
  if (error) throw error;
  assertChanged(data, "Ce dossier est payé : il ne peut pas être classé non converti.");
}

/** « Passer en Collab » ou retour à la vente. */
export async function setDossierObjective(dossierId: string, objective: "vente" | "collab") {
  const { data, error } = await db
    .from("dossiers_voyage")
    .update({ objectif: objective })
    .eq("id", dossierId)
    .is("paye_at", null)
    .select("id");
  if (error) throw error;
  assertChanged(data, "Ce dossier est payé : il reste une vente.");
}

/**
 * « Réactiver » : le dossier quitte les non convertis et revient en cours, à l'étape où il en
 * était (envoyé s'il l'avait été, sinon en préparation).
 */
export async function reactivateDossier(dossierId: string, wasSent: boolean) {
  const { data, error } = await db
    .from("dossiers_voyage")
    .update({ archive: false, statut: wasSent ? "envoye" : "en_preparation", perdu_motif: null, perdu_note: null })
    .eq("id", dossierId)
    .is("paye_at", null)
    .select("id");
  if (error) throw error;
  assertChanged(data, ALREADY_HANDLED);
}

export async function saveDossierLineCost(lineId: string, cost: number | null) {
  const { data, error } = await db.from("dossiers_voyage_lignes").update({ cout_reel: cost }).eq("id", lineId).select("id");
  if (error) throw error;
  assertChanged(data, "Ligne introuvable. Recharge la liste.");
}

export async function setDossierLineSupplierPaid(lineId: string, paid: boolean) {
  const { data, error } = await db
    .from("dossiers_voyage_lignes")
    .update({ paiement_fournisseur: paid ? "paye" : "a_payer" })
    .eq("id", lineId)
    .select("id");
  if (error) throw error;
  assertChanged(data, "Ligne introuvable. Recharge la liste.");
}
