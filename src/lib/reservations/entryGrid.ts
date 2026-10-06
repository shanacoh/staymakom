// Règles de l'affichage « Saisie » de la page Réservations, sans accès à la base :
// quelles cellules sont modifiables selon l'origine de la ligne, et quelle modification
// écrire dans quelle table quand une cellule est validée.

import { CHANNEL_OPTIONS, type SelectOption } from "@/components/admin/BookingsGrid/columnTypes";
import { isRequest } from "./rules";
import type { MoneyByCurrency, ReservationRow, ReservationSource } from "./types";

export type EntryColumnKey =
  | "ref"
  | "status"
  | "type"
  | "client"
  | "product"
  | "date"
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
  kind: "text" | "number" | "date" | "select" | "money";
  align?: "left" | "right";
  widthClass: string;
}

export const ENTRY_COLUMNS: EntryColumn[] = [
  { key: "ref", label: "Réf", kind: "text", widthClass: "w-[80px]" },
  { key: "status", label: "Statut", kind: "select", widthClass: "w-[130px]" },
  { key: "type", label: "Type", kind: "select", widthClass: "w-[125px]" },
  { key: "client", label: "Client", kind: "text", widthClass: "w-[180px]" },
  { key: "product", label: "Produit", kind: "text", widthClass: "w-[220px]" },
  { key: "date", label: "Date", kind: "date", widthClass: "w-[120px]" },
  { key: "pax", label: "Pers.", kind: "number", align: "right", widthClass: "w-[70px]" },
  { key: "amount", label: "Montant", kind: "money", align: "right", widthClass: "w-[110px]" },
  { key: "collected", label: "Encaissé", kind: "money", align: "right", widthClass: "w-[110px]" },
  { key: "clientPayment", label: "Paie. client", kind: "select", widthClass: "w-[130px]" },
  { key: "supplierCost", label: "Coût fourn.", kind: "money", align: "right", widthClass: "w-[110px]" },
  { key: "supplierPayment", label: "Paie. fourn.", kind: "select", widthClass: "w-[125px]" },
  { key: "margin", label: "Marge", kind: "money", align: "right", widthClass: "w-[100px]" },
  { key: "channel", label: "Canal", kind: "select", widthClass: "w-[150px]" },
  { key: "notes", label: "Notes / relance", kind: "text", widthClass: "w-[260px]" },
];

// "edit" : modifiable. "locked" : vient de Revolut, jamais modifiable ici.
// "readonly" : calculé, ou géré ailleurs (fiche, catalogue, dossier).
export type CellMode = "edit" | "locked" | "readonly";

const REVOLUT_COLUMNS: EntryColumnKey[] = ["amount", "collected", "clientPayment"];
const REQUEST_EDITABLE: EntryColumnKey[] = ["status", "client", "date", "notes"];
const HOTEL_MANUAL_EDITABLE: EntryColumnKey[] = ["client", "pax", "amount", "clientPayment", "supplierCost", "channel"];

export function cellMode(row: ReservationRow, key: EntryColumnKey): CellMode {
  if (key === "ref" || key === "margin") return "readonly";
  if (row.isOnline && REVOLUT_COLUMNS.includes(key)) return "locked";

  switch (row.source) {
    case "booking":
      // L'encaissé se déduit du paiement client, et le canal d'une réservation en ligne est « En ligne ».
      if (key === "collected") return "readonly";
      if (key === "channel" && row.isOnline) return "readonly";
      return "edit";
    case "request":
      return REQUEST_EDITABLE.includes(key) ? "edit" : "readonly";
    case "hotel":
      if (key === "notes") return "edit";
      // Une réservation d'hôtel synchronisée automatiquement ne se corrige pas à la main.
      // Les dates (arrivée et départ) et le statut se changent dans la fiche.
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

function bookingPatch(key: EntryColumnKey, raw: string): Record<string, unknown> | string {
  const trimmed = raw.trim();
  switch (key) {
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
// modification de l'un ou de l'autre, pour que les deux restent cohérents.
function hotelPatch(row: ReservationRow, key: EntryColumnKey, raw: string): Record<string, unknown> | string {
  const trimmed = raw.trim();
  switch (key) {
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
      return n === undefined || n === null ? "Coût invalide" : { net_price: n, commission_amount: (row.amount ?? 0) - n };
    }
    case "clientPayment":
      return HOTEL_PAYMENT_TO_DB[trimmed] ? { payment_status: HOTEL_PAYMENT_TO_DB[trimmed] } : "Paiement invalide";
    default:
      return "Cette cellule n'est pas modifiable";
  }
}

/** Traduit une cellule validée en modification à écrire, ou en message d'erreur si la valeur est refusée. */
export function buildCellUpdate(row: ReservationRow, key: EntryColumnKey, raw: string): CellUpdate {
  const table = TABLES[row.source];
  if (!table || cellMode(row, key) !== "edit") return invalid("Cette cellule n'est pas modifiable");
  const patch =
    row.source === "booking" ? bookingPatch(key, raw) : row.source === "request" ? requestPatch(row, key, raw) : hotelPatch(row, key, raw);
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
    case "product":
      return row.product;
    case "date":
      return row.date;
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

/** Totaux du bas de grille. Les demandes (montants estimés) et les annulations ne comptent pas. */
export function computeTotals(rows: ReservationRow[]): EntryTotals {
  const totals: EntryTotals = { amount: {}, collected: {}, costs: {}, knownMargin: {} };
  const add = (bucket: MoneyByCurrency, currency: string, value: number) => {
    bucket[currency] = (bucket[currency] ?? 0) + value;
  };
  for (const row of rows) {
    if (isRequest(row) || row.status === "annulee") continue;
    if (row.amount !== null) add(totals.amount, row.currency, row.amount);
    add(totals.collected, row.currency, row.collected);
    if (row.supplierCost !== null) {
      add(totals.costs, row.currency, row.supplierCost);
      if (row.amount !== null) add(totals.knownMargin, row.currency, row.amount - row.supplierCost);
    }
  }
  return totals;
}
