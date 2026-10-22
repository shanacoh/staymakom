// Règles de l'affichage « Saisie » de la page Réservations, sans accès à la base :
// quelles cellules sont modifiables selon l'origine de la ligne, et quelle modification
// écrire dans quelle table quand une cellule est validée.

import { addDays, format, parseISO } from "date-fns";
import { CHANNEL_OPTIONS, type SelectOption } from "@/components/admin/BookingsGrid/columnTypes";
import { cancellationMargin, isCancellation } from "./cancellation";
import { isRequest } from "./rules";
import type { MoneyByCurrency, ReservationRow, ReservationSource } from "./types";

export type EntryColumnKey =
  | "ref"
  | "status"
  | "type"
  | "client"
  | "phone"
  | "product"
  | "partner"
  | "date"
  | "nights"
  | "pax"
  | "amount"
  | "collected"
  | "clientPayment"
  | "supplierCost"
  | "supplierPayment"
  | "margin"
  | "channel"
  | "notes";

export interface EntryColumn {
  key: EntryColumnKey;
  label: string;
  // "combo" : choix dans une liste avec recherche (produit du catalogue, prestataire).
  kind: "text" | "number" | "date" | "select" | "money" | "combo";
  align?: "left" | "right";
  widthClass: string;
}

export const ENTRY_COLUMNS: EntryColumn[] = [
  // Le client vient en premier : la colonne reste figée à gauche quand la grille défile.
  { key: "client", label: "Client", kind: "text", widthClass: "w-[180px] min-w-[180px]" },
  { key: "phone", label: "Téléphone", kind: "text", widthClass: "w-[140px]" },
  { key: "ref", label: "Réf", kind: "text", widthClass: "w-[80px]" },
  { key: "status", label: "Statut", kind: "select", widthClass: "w-[130px]" },
  { key: "type", label: "Type", kind: "select", widthClass: "w-[125px]" },
  { key: "product", label: "Produit", kind: "combo", widthClass: "w-[240px]" },
  { key: "partner", label: "Prestataire", kind: "combo", widthClass: "w-[170px]" },
  { key: "date", label: "Date", kind: "date", widthClass: "w-[120px]" },
  { key: "nights", label: "Nuits", kind: "number", align: "right", widthClass: "w-[70px]" },
  { key: "pax", label: "Pers.", kind: "number", align: "right", widthClass: "w-[70px]" },
  { key: "amount", label: "Montant", kind: "money", align: "right", widthClass: "w-[110px]" },
  { key: "collected", label: "Encaissé", kind: "money", align: "right", widthClass: "w-[110px]" },
  { key: "clientPayment", label: "Paie. client", kind: "select", widthClass: "w-[130px]" },
  { key: "supplierCost", label: "Coût fourn.", kind: "money", align: "right", widthClass: "w-[110px]" },
  { key: "supplierPayment", label: "Paie. fourn.", kind: "select", widthClass: "w-[125px]" },
  { key: "margin", label: "Marge", kind: "money", align: "right", widthClass: "w-[140px]" },
  { key: "channel", label: "Canal", kind: "select", widthClass: "w-[150px]" },
  { key: "notes", label: "Notes / relance", kind: "text", widthClass: "w-[260px]" },
];

// "edit" : modifiable. "locked" : vient de Revolut, jamais modifiable ici.
// "readonly" : calculé, ou géré ailleurs (fiche, catalogue, dossier).
export type CellMode = "edit" | "locked" | "readonly";

const REVOLUT_COLUMNS: EntryColumnKey[] = ["amount", "collected", "clientPayment"];
const REQUEST_EDITABLE: EntryColumnKey[] = ["status", "client", "phone", "date", "notes"];
const HOTEL_MANUAL_EDITABLE: EntryColumnKey[] = [
  "client",
  "phone",
  "product",
  "date",
  "nights",
  "pax",
  "amount",
  "collected",
  "clientPayment",
  "supplierCost",
  "supplierPayment",
  "channel",
];

export function cellMode(row: ReservationRow, key: EntryColumnKey): CellMode {
  if (key === "ref" || key === "margin") return "readonly";
  if (row.isOnline && REVOLUT_COLUMNS.includes(key)) return "locked";

  switch (row.source) {
    case "booking":
      // Les nuits ne concernent que les hôtels ; le canal d'une réservation en ligne est « En ligne ».
      if (key === "nights") return "readonly";
      if (key === "channel" && row.isOnline) return "readonly";
      return "edit";
    case "request":
      return REQUEST_EDITABLE.includes(key) ? "edit" : "readonly";
    case "hotel":
      if (key === "notes") return "edit";
      // Une réservation d'hôtel synchronisée automatiquement ne se corrige pas à la main.
      // Le statut (annulation) se change par le menu « … », le prestataire est l'hôtel lui-même.
      return !row.isOnline && HOTEL_MANUAL_EDITABLE.includes(key) ? "edit" : "readonly";
    default:
      return "readonly";
  }
}

const BOOKING_STATUS_OPTIONS: SelectOption[] = [
  { value: "confirmee", label: "Confirmée" },
  { value: "passee", label: "Passée" },
  { value: "annulee", label: "Annulée" },
];
const REQUEST_STATUS_OPTIONS: SelectOption[] = [
  { value: "demande", label: "Demande" },
  { value: "dispo_ok", label: "Dispo OK" },
];
const TAILOR_MADE_STATUS_OPTIONS: SelectOption[] = [{ value: "demande_sur_mesure", label: "Demande sur-mesure" }];
const TYPE_OPTIONS: SelectOption[] = [
  { value: "experience", label: "Expérience" },
  { value: "boat", label: "Bateau" },
];
const CLIENT_PAYMENT_OPTIONS: SelectOption[] = [
  { value: "unpaid", label: "Non payé" },
  { value: "deposit", label: "Acompte" },
  { value: "paid", label: "Payé" },
  { value: "refunded", label: "Remboursé" },
];
const SUPPLIER_PAYMENT_OPTIONS: SelectOption[] = [
  { value: "todo", label: "À payer" },
  { value: "paid", label: "Payé" },
];
const CHANNEL_SELECT_OPTIONS: SelectOption[] = [{ value: "manual", label: "Sans canal" }, ...CHANNEL_OPTIONS];

export function selectOptions(row: ReservationRow, key: EntryColumnKey): SelectOption[] {
  switch (key) {
    case "status":
      if (row.status === "demande_sur_mesure") return TAILOR_MADE_STATUS_OPTIONS;
      return row.source === "request" ? REQUEST_STATUS_OPTIONS : BOOKING_STATUS_OPTIONS;
    case "type":
      return TYPE_OPTIONS;
    case "clientPayment":
      return CLIENT_PAYMENT_OPTIONS;
    case "supplierPayment":
      return SUPPLIER_PAYMENT_OPTIONS;
    case "channel":
      return CHANNEL_SELECT_OPTIONS;
    default:
      return [];
  }
}

const TABLES: Partial<Record<ReservationSource, string>> = {
  booking: "standalone_bookings",
  request: "standalone_experience_requests",
  hotel: "bookings_hg",
};

export type CellUpdate = { ok: true; table: string; patch: Record<string, unknown> } | { ok: false; message: string };

const invalid = (message: string): CellUpdate => ({ ok: false, message });

function parseAmount(raw: string): number | null | undefined {
  const trimmed = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isNaN(n) || n < 0 ? undefined : n;
}

const CLIENT_PAYMENT_TO_DB: Record<string, string> = {
  unpaid: "pending",
  deposit: "deposit_paid",
  paid: "paid",
  refunded: "refunded",
};

/**
 * Encaissé saisi à la main : rien = non payé, tout = payé, entre les deux = acompte. Le statut de
 * paiement suit, comme si on l'avait choisi dans « Paie. client ».
 */
function collectedStatus(row: ReservationRow, collected: number): "unpaid" | "deposit" | "paid" {
  if (collected <= 0) return "unpaid";
  return row.amount !== null && collected >= row.amount ? "paid" : "deposit";
}

function bookingPatch(row: ReservationRow, key: EntryColumnKey, raw: string): Record<string, unknown> | string {
  const trimmed = raw.trim();
  switch (key) {
    case "phone":
      return { customer_phone: trimmed || null };
    case "collected": {
      const n = parseAmount(raw);
      if (n === undefined) return "Montant invalide";
      const status = collectedStatus(row, n ?? 0);
      if (status === "deposit") return { payment_status: "deposit_paid", deposit_amount: n };
      return { payment_status: CLIENT_PAYMENT_TO_DB[status] };
    }
    case "status":
      // « Passée » n'est pas enregistré : c'est une réservation confirmée dont la date est dépassée.
      return trimmed === "annulee"
        ? { status: "cancelled" }
        : { status: "confirmed", is_cancelled: false, cancelled_at: null };
    case "type":
      return { product_type: trimmed };
    case "client":
      return trimmed ? { customer_name: trimmed } : "Le nom du client ne peut pas être vide";
    case "product":
      return trimmed ? { custom_experience_title: trimmed } : "Le produit ne peut pas être vide";
    case "date":
      return trimmed ? { booking_date: trimmed } : "La date est obligatoire";
    case "pax": {
      const n = parseInt(trimmed, 10);
      return Number.isNaN(n) || n < 1 ? "Nombre de personnes invalide" : { party_size: n };
    }
    case "amount": {
      const n = parseAmount(raw);
      return n === undefined || n === null ? "Montant invalide" : { sell_price: n };
    }
    case "clientPayment":
      return CLIENT_PAYMENT_TO_DB[trimmed] ? { payment_status: CLIENT_PAYMENT_TO_DB[trimmed] } : "Paiement invalide";
    case "supplierCost": {
      const n = parseAmount(raw);
      return n === undefined ? "Coût invalide" : { supplier_cost: n };
    }
    case "supplierPayment":
      return { supplier_payment_status: trimmed === "paid" ? "paid" : "pending" };
    case "channel":
      return { channel: trimmed === "manual" || trimmed === "" ? null : trimmed };
    case "notes":
      return { internal_notes: trimmed || null };
    default:
      return "Cette cellule n'est pas modifiable";
  }
}

function requestPatch(row: ReservationRow, key: EntryColumnKey, raw: string): Record<string, unknown> | string {
  const trimmed = raw.trim();
  switch (key) {
    case "phone":
      return { customer_phone: trimmed || null };
    case "status":
      if (trimmed === "dispo_ok") return { status: "availability_confirmed" };
      return { status: row.sentToProviderAt ? "sent_to_provider" : "new" };
    case "client":
      return { customer_name: trimmed || null };
    case "date":
      return { requested_date: trimmed || null };
    case "notes":
      return { internal_notes: trimmed || null };
    default:
      return "Cette cellule n'est pas modifiable";
  }
}

const HOTEL_PAYMENT_TO_DB: Record<string, string> = {
  unpaid: "unpaid",
  deposit: "deposit_paid",
  paid: "paid",
  refunded: "refunded",
};

// Pour un hôtel, la commission enregistrée (montant client moins coût net) suit chaque
// modification de l'un ou de l'autre, pour que les deux restent cohérents. Un coût vidé
// redevient « à saisir » (commission à 0, comme à la création sans coût).
// Départ d'un hôtel = arrivée + nuits.
const checkoutOf = (checkin: string, nights: number) => format(addDays(parseISO(checkin), nights), "yyyy-MM-dd");

function hotelPatch(row: ReservationRow, key: EntryColumnKey, raw: string): Record<string, unknown> | string {
  const trimmed = raw.trim();
  switch (key) {
    case "phone":
      return { customer_phone: trimmed || null };
    case "date":
      return trimmed ? { checkin: trimmed, checkout: checkoutOf(trimmed, row.nights ?? 1) } : "La date d'arrivée est obligatoire";
    case "nights": {
      const n = parseInt(trimmed, 10);
      if (Number.isNaN(n) || n < 1) return "Nombre de nuits invalide";
      return row.date ? { nights: n, checkout: checkoutOf(row.date, n) } : "Saisis d'abord la date d'arrivée";
    }
    case "collected": {
      const n = parseAmount(raw);
      if (n === undefined) return "Montant invalide";
      const status = collectedStatus(row, n ?? 0);
      return { payment_status: HOTEL_PAYMENT_TO_DB[status], paid_amount: status === "unpaid" ? null : n };
    }
    case "notes":
      return { internal_notes: trimmed || null };
    case "channel":
      return { channel: trimmed === "manual" || trimmed === "" ? null : trimmed };
    case "client":
      return trimmed ? { customer_name: trimmed } : "Le nom du client ne peut pas être vide";
    case "pax": {
      const n = parseInt(trimmed, 10);
      return Number.isNaN(n) || n < 1 ? "Nombre de personnes invalide" : { party_size: n };
    }
    case "amount": {
      const n = parseAmount(raw);
      return n === undefined || n === null ? "Montant invalide" : { sell_price: n, commission_amount: n - (row.supplierCost ?? 0) };
    }
    case "supplierCost": {
      const n = parseAmount(raw);
      if (n === undefined) return "Coût invalide";
      if (n === null) return row.supplierPayment === "paid" ? "L'hôtel est noté payé : remets-le « À payer » avant de vider le coût" : { net_price: null, commission_amount: 0 };
      return { net_price: n, commission_amount: (row.amount ?? 0) - n };
    }
    case "clientPayment": {
      const status = HOTEL_PAYMENT_TO_DB[trimmed];
      if (!status) return "Paiement invalide";
      // L'encaissé d'un hôtel saisi à la main est paid_amount : payé = tout, non payé = rien.
      // Un acompte garde le montant déjà noté (il se saisit à la création).
      if (trimmed === "paid") return { payment_status: status, paid_amount: row.amount };
      if (trimmed === "unpaid") return { payment_status: status, paid_amount: null };
      return { payment_status: status };
    }
    case "supplierPayment":
      if (trimmed === "paid" && row.supplierCost === null) return "Saisis d'abord le coût de l'hôtel";
      return trimmed === "paid"
        ? { supplier_payment_status: "paid", supplier_paid_at: new Date().toISOString().slice(0, 10) }
        : { supplier_payment_status: "pending", supplier_paid_at: null };
    default:
      return "Cette cellule n'est pas modifiable";
  }
}

/** Traduit une cellule validée en modification à écrire, ou en message d'erreur si la valeur est refusée. */
export function buildCellUpdate(row: ReservationRow, key: EntryColumnKey, raw: string): CellUpdate {
  const table = TABLES[row.source];
  if (!table || cellMode(row, key) !== "edit") return invalid("Cette cellule n'est pas modifiable");
  const patch =
    row.source === "booking" ? bookingPatch(row, key, raw) : row.source === "request" ? requestPatch(row, key, raw) : hotelPatch(row, key, raw);
  return typeof patch === "string" ? invalid(patch) : { ok: true, table, patch };
}

/** Valeur brute d'une cellule, telle qu'on la saisit (date au format yyyy-MM-dd, nombres sans devise). */
export function cellValue(row: ReservationRow, key: EntryColumnKey): string | number | null {
  switch (key) {
    case "ref":
      return row.ref;
    case "status":
      return row.status;
    case "type":
      return row.type;
    case "client":
      return row.client;
    case "phone":
      return row.phone;
    case "product":
      return row.product;
    case "partner":
      return row.partner;
    case "date":
      return row.date;
    case "nights":
      return row.nights;
    case "pax":
      return row.pax || null;
    case "amount":
      return row.amount;
    case "collected":
      return isRequest(row) ? null : row.collected;
    case "clientPayment":
      return isRequest(row) ? null : row.clientPayment;
    case "supplierCost":
      return row.supplierCost;
    case "supplierPayment":
      return row.supplierPayment === "none" ? null : row.supplierPayment;
    case "margin":
      if (isCancellation(row)) return cancellationMargin(row);
      return isRequest(row) || row.amount === null || row.supplierCost === null ? null : row.amount - row.supplierCost;
    case "channel":
      return row.channelKey;
    case "notes":
      return row.notes;
  }
}

export interface EntryTotals {
  amount: MoneyByCurrency;
  collected: MoneyByCurrency;
  costs: MoneyByCurrency;
  knownMargin: MoneyByCurrency;
}

/**
 * Totaux du bas de grille. Les demandes (montants estimés) ne comptent pas. Une annulation ne
 * compte que par sa marge d'annulation.
 */
export function computeTotals(rows: ReservationRow[]): EntryTotals {
  const totals: EntryTotals = { amount: {}, collected: {}, costs: {}, knownMargin: {} };
  const add = (bucket: MoneyByCurrency, currency: string, value: number) => {
    bucket[currency] = (bucket[currency] ?? 0) + value;
  };
  for (const row of rows) {
    if (isRequest(row)) continue;
    if (isCancellation(row)) {
      const margin = cancellationMargin(row);
      if (margin !== null) add(totals.knownMargin, row.currency, margin);
      continue;
    }
    if (row.amount !== null) add(totals.amount, row.currency, row.amount);
    add(totals.collected, row.currency, row.collected);
    if (row.supplierCost !== null) {
      add(totals.costs, row.currency, row.supplierCost);
      if (row.amount !== null) add(totals.knownMargin, row.currency, row.amount - row.supplierCost);
    }
  }
  return totals;
}
