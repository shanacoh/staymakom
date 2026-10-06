// Écritures déclenchées par les boutons « Prochaine action » de la page Réservations.
// Chaque fonction fait une seule modification, et la conditionne à l'état attendu de la
// ligne : si quelqu'un d'autre l'a déjà traitée entre-temps, rien n'est écrasé.

import { supabase } from "@/integrations/supabase/client";

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
      "id, experience_id, customer_name, customer_email, customer_phone, requested_date, adults, children, party_max, message, internal_notes, status, source, desired_time_period, desired_time_value, requested_duration_minutes, preferred_city, sent_to_provider_at, provider_responded_at, standalone_experiences(title, supplier_boat_name, providers(name, whatsapp))",
    )
    .eq("id", requestId)
    .single();
  if (error) throw error;
  return data as any;
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

/** Réponse du prestataire : disponible (la demande passe en « Dispo OK ») ou non (elle est fermée). */
export async function recordProviderAnswer(requestId: string, available: boolean) {
  const { data, error } = await db
    .from("standalone_experience_requests")
    .update({ status: available ? "availability_confirmed" : "closed", provider_responded_at: new Date().toISOString() })
    .eq("id", requestId)
    .in("status", ["new", "sent_to_provider", "contacted"])
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

/** Écrit la modification d'une cellule de la grille de Saisie (une cellule = une écriture). */
export async function saveCellUpdate(table: string, rowId: string, patch: Record<string, unknown>) {
  const { data, error } = await db.from(table).update(patch).eq("id", rowId).select("id");
  if (error) throw error;
  assertChanged(data, "Ligne introuvable. Recharge la liste.");
}

/**
 * Ligne vide du bas de la grille : dès qu'un nom est tapé, la réservation est créée.
 * Elle démarre « Confirmée », paiement client « Non payé », à la date du jour, et se complète
 * ensuite cellule par cellule. Le type (Expérience / Bateau) est posé par la base.
 */
export async function createBookingFromGrid(customerName: string, today: string) {
  const { error } = await db.from("standalone_bookings").insert({
    customer_name: customerName,
    customer_email: "",
    // La base exige une fiche liée ou un titre : titre vide en attendant la saisie du produit.
    custom_experience_title: "",
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

/**
 * Supprime définitivement une ligne saisie à la main ou une demande. La condition sur
 * l'origine est répétée dans la requête : une réservation payée en ligne ne peut pas être
 * supprimée par ce chemin, même si l'écran se trompait.
 */
export async function deleteReservationRow(source: "booking" | "request", rowId: string) {
  const query =
    source === "booking"
      ? db.from("standalone_bookings").delete().eq("id", rowId).eq("source", "manual_admin")
      : db.from("standalone_experience_requests").delete().eq("id", rowId);
  const { data, error } = await query.select("id");
  if (error) throw error;
  assertChanged(data, "Ligne introuvable ou non supprimable. Recharge la liste.");
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
