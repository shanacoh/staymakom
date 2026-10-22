// Lecture des réservations pour la page unique du back-office. Tout le travail de mise au
// format commun (statut, type, encaissé...) est fait par la vue SQL `admin_reservations`
// (migration 20261006120000) : ici on ne fait que lire la vue et habiller les libellés.

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CHANNEL_LABELS } from "@/components/admin/BookingsGrid/columnTypes";
import type { CatalogueExperience, CatalogueHotel } from "./productChoice";
import type {
  ArchivedRequest,
  ClientPayment,
  DeletedReservation,
  DossierLine,
  ItineraryDossier,
  RefundMethod,
  RefundStatus,
  SupplierCredit,
  SupplierRefundStatus,
  UnpaidDossier,
  ReservationRow,
  ReservationSource,
  ReservationStatus,
  ReservationType,
  SupplierPayment,
  UnfinishedPayment,
} from "./types";

export const RESERVATIONS_QUERY_KEY = ["admin-reservations-unified"];

// Une ligne de la vue `admin_reservations`, telle que la base la renvoie.
interface AdminReservationViewRow {
  source: ReservationSource;
  id: string;
  ref: string;
  type: ReservationType;
  status: ReservationStatus;
  client: string;
  product: string;
  partner: string | null;
  service_date: string | null;
  received_at: string | null;
  pax: string | null;
  amount: number | null;
  currency: string;
  collected: number | null;
  client_payment: ClientPayment;
  supplier_cost: number | null;
  supplier_payment: SupplierPayment;
  channel_key: string;
  origin: string | null;
  is_online: boolean;
  notes: string | null;
  sent_to_provider_at: string | null;
  deposit_due: number | null;
  missing_costs: number | null;
  supplier_due: number | null;
  provider_id: string | null;
  refund_amount: number | null;
  refund_status: RefundStatus;
  refund_method: RefundMethod | null;
  kept_amount: number | null;
  supplier_refund_status: SupplierRefundStatus;
  supplier_refund_amount: number | null;
  supplier_credit_open: boolean;
  phone: string | null;
  nights: number | null;
}

const DETAIL_PATHS: Record<ReservationSource, ((id: string) => string) | null> = {
  booking: (id) => `/admin/standalone-bookings/${id}`,
  hotel: (id) => `/admin/reservations/${id}`,
  dossier: (id) => `/admin/dossiers/${id}`,
  request: null,
};

function channelLabel(row: AdminReservationViewRow): string {
  if (row.source === "request") return row.origin === "card_whatsapp" ? "Bouton WhatsApp" : "Demande site";
  if (row.source === "dossier") return row.origin === "formulaire_site" ? "Formulaire site" : "Dossier";
  if (row.is_online) return "En ligne";
  const channel = CHANNEL_LABELS[row.channel_key];
  return channel ? `Manuel · ${channel}` : "Manuel";
}

const toNumber = (value: number | string | null): number | null => (value === null ? null : Number(value));

function toReservationRow(row: AdminReservationViewRow): ReservationRow {
  return {
    key: `${row.source}:${row.id}`,
    id: row.id,
    source: row.source,
    ref: row.ref,
    type: row.type,
    status: row.status,
    client: row.client,
    product: row.product,
    partner: row.partner,
    date: row.service_date,
    receivedAt: row.received_at,
    pax: row.pax ?? "",
    amount: toNumber(row.amount),
    currency: row.currency,
    collected: toNumber(row.collected) ?? 0,
    clientPayment: row.client_payment,
    supplierCost: toNumber(row.supplier_cost),
    supplierPayment: row.supplier_payment,
    channelKey: row.channel_key,
    channelLabel: channelLabel(row),
    isOnline: row.is_online,
    notes: row.notes,
    sentToProviderAt: row.sent_to_provider_at,
    depositDue: toNumber(row.deposit_due),
    missingCosts: row.missing_costs ?? 0,
    supplierDue: toNumber(row.supplier_due),
    detailPath: DETAIL_PATHS[row.source]?.(row.id) ?? null,
    providerId: row.provider_id,
    refundAmount: toNumber(row.refund_amount),
    refundStatus: row.refund_status ?? "none",
    refundMethod: row.refund_method,
    keptAmount: toNumber(row.kept_amount),
    supplierRefundStatus: row.supplier_refund_status ?? "none",
    supplierRefundAmount: toNumber(row.supplier_refund_amount),
    supplierCreditOpen: row.supplier_credit_open ?? false,
    phone: row.phone,
    nights: row.nights,
    flagged: false,
    checkNote: null,
  };
}

async function fetchReservationRows(): Promise<ReservationRow[]> {
  // La vue n'est pas encore dans les types générés de la base.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).from("admin_reservations").select("*");
  if (error) throw error;

  // Lignes marquées « à vérifier » : table à part, rapprochée par origine et identifiant.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: flags, error: flagsError } = await (supabase as any).from("reservation_flags").select("source, row_id, note");
  if (flagsError) throw flagsError;
  const notes = new Map<string, string | null>(
    (flags as { source: string; row_id: string; note: string | null }[]).map((f) => [`${f.source}:${f.row_id}`, f.note]),
  );

  const rows = (data as AdminReservationViewRow[]).map((viewRow) => {
    const row = toReservationRow(viewRow);
    return notes.has(row.key) ? { ...row, flagged: true, checkNote: notes.get(row.key) ?? null } : row;
  });
  // Du plus récent au plus ancien ; une demande sans date précise se classe à sa date de réception.
  const sortDate = (row: ReservationRow) => row.date ?? row.receivedAt?.slice(0, 10) ?? "";
  return rows.sort((a, b) => sortDate(b).localeCompare(sortDate(a)));
}

export function useReservationRows() {
  return useQuery({ queryKey: RESERVATIONS_QUERY_KEY, queryFn: fetchReservationRows });
}

export const UNFINISHED_PAYMENTS_QUERY_KEY = ["admin-unfinished-payments"];

async function fetchUnfinishedPayments(): Promise<UnfinishedPayment[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("admin_unfinished_payments")
    .select("*")
    .order("last_attempt_at", { ascending: false });
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    key: `${row.customer_email}:${row.experience_id ?? row.product}`,
    client: row.client || row.customer_email || "Sans nom",
    customerPhone: row.customer_phone,
    product: row.product,
    productByLanguage: { fr: row.product, en: row.product_en ?? row.product, he: row.product_he ?? row.product_en ?? row.product },
    attempts: row.attempts,
    amount: toNumber(row.amount),
    currency: row.currency,
    lastAttemptAt: row.last_attempt_at,
    kind: row.kind,
    converted: row.converted,
  }));
}

/** Paiements en ligne non aboutis (vue SQL `admin_unfinished_payments`). */
export function useUnfinishedPayments() {
  return useQuery({ queryKey: UNFINISHED_PAYMENTS_QUERY_KEY, queryFn: fetchUnfinishedPayments });
}

export const DELETED_RESERVATIONS_QUERY_KEY = ["admin-deleted-reservations"];

async function fetchDeletedReservations(): Promise<DeletedReservation[]> {
  // La copie complète de la ligne (payload) reste en base : la liste n'a besoin que des repères.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("deleted_reservations")
    .select("id, source, client, product, amount, currency, deleted_at")
    .order("deleted_at", { ascending: false });
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    id: row.id,
    source: row.source,
    client: row.client || "Sans nom",
    product: row.product || "",
    amount: toNumber(row.amount),
    currency: row.currency,
    deletedAt: row.deleted_at,
  }));
}

/** Corbeille de la page Réservations (table `deleted_reservations`). */
export function useDeletedReservations() {
  return useQuery({ queryKey: DELETED_RESERVATIONS_QUERY_KEY, queryFn: fetchDeletedReservations });
}

export const DOSSIER_LINES_QUERY_KEY = ["admin-reservation-dossier-lines"];

async function fetchDossierLines(): Promise<DossierLine[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data: paid, error: paidError } = await db
    .from("dossiers_voyage")
    .select("id")
    .not("paye_at", "is", null)
    .eq("est_modele", false);
  if (paidError) throw paidError;
  const ids = (paid as { id: string }[]).map((d) => d.id);
  if (ids.length === 0) return [];

  const { data, error } = await db
    .from("admin_reservation_dossier_lines")
    .select("*")
    .in("dossier_id", ids)
    .order("jour")
    .order("ordre");
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((line) => ({
    id: line.id,
    dossierId: line.dossier_id,
    nature: line.nature,
    product: line.product,
    date: line.service_date,
    pax: line.pax ?? "",
    currency: line.currency,
    estimatedCost: toNumber(line.cout_estime),
    cost: toNumber(line.cout_reel),
    supplierPaid: line.paiement_fournisseur === "paye",
  }));
}

/** Lignes de réservation des dossiers de voyage payés (vue SQL `admin_reservation_dossier_lines`). */
export function useDossierLines() {
  return useQuery({ queryKey: DOSSIER_LINES_QUERY_KEY, queryFn: fetchDossierLines });
}

export const UNPAID_DOSSIERS_QUERY_KEY = ["admin-reservation-unpaid-dossiers"];

async function fetchUnpaidDossiers(): Promise<UnpaidDossier[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from("dossiers_voyage")
    .select("id, reference, nom_destinataire, devise, version_verrouillee_id, version_active_id")
    .is("paye_at", null)
    .eq("est_modele", false)
    .eq("archive", false)
    .order("created_at", { ascending: false });
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dossiers = data as any[];
  const versionIds = dossiers.map((d) => d.version_verrouillee_id ?? d.version_active_id).filter(Boolean);
  const prices = new Map<string, number | null>();
  if (versionIds.length > 0) {
    const { data: versions, error: versionsError } = await db
      .from("dossiers_voyage_versions")
      .select("id, prix_total_vente")
      .in("id", versionIds);
    if (versionsError) throw versionsError;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const version of versions as any[]) prices.set(version.id, toNumber(version.prix_total_vente));
  }
  return dossiers.map((d) => ({
    id: d.id,
    label: d.reference ? `${d.reference} · ${d.nom_destinataire}` : d.nom_destinataire,
    currency: d.devise || "ILS",
    proposedTotal: prices.get(d.version_verrouillee_id ?? d.version_active_id) ?? null,
  }));
}

/** Dossiers de voyage pas encore payés, pour la fenêtre « Lier un dossier payé ». */
export function useUnpaidDossiers(enabled: boolean) {
  return useQuery({ queryKey: UNPAID_DOSSIERS_QUERY_KEY, queryFn: fetchUnpaidDossiers, enabled });
}

export const REQUEST_ARCHIVES_QUERY_KEY = ["admin-request-archives"];

async function fetchRequestArchives(): Promise<ArchivedRequest[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("admin_request_archives")
    .select("*")
    .order("received_at", { ascending: false });
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    id: row.id,
    receivedAt: row.received_at,
    client: row.client,
    phone: row.phone,
    email: row.email,
    product: row.product,
    type: row.type,
    requestedDate: row.requested_date,
    pax: row.pax ?? "",
    exitStatus: row.exit_status,
    lostReason: row.lost_reason,
    lostNote: row.lost_note,
    closedAt: row.closed_at,
    bookingId: row.booking_id,
  }));
}

/** Demandes converties ou archivées (vue SQL `admin_request_archives`), derrière la puce « Archives ». */
export function useRequestArchives() {
  return useQuery({ queryKey: REQUEST_ARCHIVES_QUERY_KEY, queryFn: fetchRequestArchives });
}

export const ITINERARIES_QUERY_KEY = ["admin-itineraries"];

async function fetchItineraries(): Promise<ItineraryDossier[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("admin_itineraries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    id: row.id,
    ref: row.ref,
    name: row.nom,
    client: row.client,
    createdAt: row.created_at,
    arrival: row.dates_arrivee,
    departure: row.dates_depart,
    travelers: row.nb_voyageurs,
    objective: row.objectif,
    statut: row.statut,
    archived: row.archive,
    group: row.groupe,
    opens: row.nb_ouvertures ?? 0,
    lastOpenedAt: row.derniere_ouverture_at,
    sentAt: row.envoye_at,
    paidAt: row.paye_at,
    amount: toNumber(row.montant),
    collected: toNumber(row.encaisse),
    proposedPrice: toNumber(row.prix_propose),
    currency: row.devise,
    token: row.token_public,
    customPage: row.page_sur_mesure,
    lostReason: row.perdu_motif,
    lostNote: row.perdu_note,
  }));
}

/** Tous les dossiers de voyage pour l'onglet Itinéraire (vue SQL `admin_itineraries`). */
export function useItineraries() {
  return useQuery({ queryKey: ITINERARIES_QUERY_KEY, queryFn: fetchItineraries });
}

export const SUPPLIER_CREDITS_QUERY_KEY = ["admin-supplier-credits"];

async function fetchSupplierCredits(providerId: string): Promise<SupplierCredit[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("admin_supplier_credits")
    .select("*")
    .eq("provider_id", providerId)
    .order("service_date");
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    id: row.id,
    ref: row.ref,
    providerId: row.provider_id,
    providerName: row.provider_name,
    client: row.client,
    product: row.product,
    date: row.service_date,
    amount: Number(row.amount),
    currency: row.currency,
  }));
}

/** Avoirs encore ouverts chez un prestataire (vue SQL `admin_supplier_credits`). */
export function useSupplierCredits(providerId: string | null | undefined) {
  return useQuery({
    queryKey: [...SUPPLIER_CREDITS_QUERY_KEY, providerId],
    queryFn: () => fetchSupplierCredits(providerId as string),
    enabled: !!providerId,
  });
}

export const GRID_CATALOGUE_QUERY_KEY = ["admin-reservations-grid-catalogue"];

async function fetchGridCatalogue(): Promise<{ experiences: CatalogueExperience[]; hotels: CatalogueHotel[] }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const [experiences, internal, hotels] = await Promise.all([
    db
      .from("standalone_experiences")
      .select("id, title, title_fr, currency, base_price, base_price_type, status, categories(slug)")
      .neq("status", "archived")
      .order("title"),
    db.from("standalone_experience_internal").select("experience_id, supplier_price_adult"),
    db.from("hotels2").select("id, name").neq("status", "archived").order("name"),
  ]);
  for (const result of [experiences, internal, hotels]) if (result.error) throw result.error;
  const supplierPrice = new Map<string, number | null>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (internal.data as any[]).map((i) => [i.experience_id, toNumber(i.supplier_price_adult)]),
  );
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    experiences: (experiences.data as any[]).map((e) => ({
      id: e.id,
      title: e.title_fr || e.title,
      currency: e.currency || "ILS",
      basePrice: toNumber(e.base_price),
      basePriceType: e.base_price_type,
      isBoat: e.categories?.slug === "bateaux",
      supplierPriceAdult: supplierPrice.get(e.id) ?? null,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hotels: (hotels.data as any[]).map((h) => ({ id: h.id, name: h.name })),
  };
}

/** Expériences et hôtels du catalogue, pour choisir le produit d'une ligne dans la Saisie. */
export function useGridCatalogue(enabled: boolean) {
  return useQuery({ queryKey: GRID_CATALOGUE_QUERY_KEY, queryFn: fetchGridCatalogue, enabled, staleTime: 5 * 60_000 });
}
