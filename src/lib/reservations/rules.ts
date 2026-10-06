// Règles métier de la page Réservations, sans aucun accès à la base ni à l'écran :
// prochaine action d'une ligne, groupes, filtres et chiffres clés.

import { differenceInCalendarDays, isSameMonth, parseISO, subMonths } from "date-fns";
import { formatCurrency } from "@/components/admin/BookingsGrid/columnTypes";
import type {
  MoneyByCurrency,
  NextAction,
  ReservationFilters,
  ReservationKpis,
  ReservationRow,
  ReservationTab,
} from "./types";

// Le solde doit partir au plus tard 2 jours avant la prestation.
const BALANCE_URGENT_DAYS = 2;
// Une date est signalée comme proche jusqu'à 3 jours avant.
const SOON_DAYS = 3;

export const isRequest = (row: ReservationRow) => row.status === "demande" || row.status === "dispo_ok";

function daysUntil(date: string | null, today: Date): number | null {
  return date ? differenceInCalendarDays(parseISO(date), today) : null;
}

/** Le bouton « Prochaine action » d'une ligne, dans l'ordre de priorité fixé par Shana. Rien = ligne soldée. */
export function nextAction(row: ReservationRow, today: Date = new Date()): NextAction | null {
  if (row.status === "annulee") return null;

  if (row.status === "demande") {
    return row.sentToProviderAt
      ? { kind: "confirm_availability", label: "Confirmer la dispo", urgent: false }
      : { kind: "send_to_provider", label: "Envoyer au prestataire", urgent: true };
  }

  if (row.status === "dispo_ok") {
    return row.depositDue
      ? {
          kind: "send_deposit_link",
          label: `Envoyer lien acompte · ${formatCurrency(row.depositDue, row.currency)}`,
          urgent: true,
        }
      : { kind: "send_payment_link", label: "Envoyer lien de paiement", urgent: true };
  }

  const balance = row.amount === null ? 0 : row.amount - row.collected;
  const days = daysUntil(row.date, today);

  // Un dossier de voyage n'a pas de lien de paiement : son solde se confirme à la main.
  if (row.source === "dossier" && balance > 0) {
    return {
      kind: "confirm_collection",
      label: `Confirmer le solde · ${formatCurrency(balance, row.currency)}`,
      urgent: false,
    };
  }

  if (row.clientPayment === "deposit" && balance > 0) {
    return {
      kind: "send_balance_link",
      label: `Envoyer lien solde · ${formatCurrency(balance, row.currency)}`,
      urgent: days !== null && days <= BALANCE_URGENT_DAYS,
    };
  }

  if (row.status === "passee" && row.clientPayment === "unpaid") {
    return { kind: "confirm_collection", label: "Confirmer l'encaissement", urgent: false };
  }

  if (row.supplierPayment === "todo") {
    if (row.missingCosts > 0) {
      const label =
        row.source === "dossier"
          ? `Compléter ${row.missingCosts} coût${row.missingCosts > 1 ? "s" : ""} fournisseur`
          : "Saisir le coût fournisseur";
      return { kind: "enter_supplier_cost", label, urgent: false };
    }
    return {
      kind: "pay_supplier",
      label: `Payer le fournisseur · ${formatCurrency(row.supplierDue, row.currency)}`,
      urgent: false,
    };
  }

  return null;
}

/** Texte sous la date (« dans 3 j », « passée »...) et s'il faut le mettre en rouge. */
export function dateHint(row: ReservationRow, today: Date = new Date()): { text: string; soon: boolean } {
  if (isRequest(row)) {
    if (!row.receivedAt) return { text: "", soon: false };
    const ago = differenceInCalendarDays(today, parseISO(row.receivedAt));
    const text = ago <= 0 ? "reçue aujourd'hui" : ago === 1 ? "reçue hier" : `reçue il y a ${ago} j`;
    return { text, soon: row.status === "demande" && !row.sentToProviderAt };
  }
  const days = daysUntil(row.date, today);
  if (days === null) return { text: "", soon: false };
  const upcoming = row.status !== "annulee";
  if (days === 0) return { text: "aujourd'hui", soon: upcoming };
  if (days === 1) return { text: "demain", soon: upcoming };
  if (days > 1) return { text: `dans ${days} j`, soon: upcoming && days <= SOON_DAYS };
  if (days >= -7) return { text: `il y a ${-days} j`, soon: false };
  return { text: "passée", soon: false };
}

export function matchesTab(row: ReservationRow, tab: ReservationTab): boolean {
  if (tab === "all") return true;
  if (tab === "hotels") return row.type === "hotel";
  if (tab === "experiences") return row.type === "experience" || row.type === "boat";
  return row.type === "itinerary";
}

function matchesPeriod(row: ReservationRow, period: ReservationFilters["period"], today: Date): boolean {
  if (period === "all") return true;
  if (!row.date) return period === "upcoming";
  const date = parseISO(row.date);
  const days = differenceInCalendarDays(date, today);
  if (period === "upcoming") return days >= 0;
  if (period === "past") return days < 0;
  if (period === "this_month") return isSameMonth(date, today);
  return isSameMonth(date, subMonths(today, 1));
}

function matchesPayment(row: ReservationRow, payment: ReservationFilters["payment"]): boolean {
  switch (payment) {
    case "client_unpaid":
      return !isRequest(row) && row.clientPayment === "unpaid";
    case "client_deposit":
      return row.clientPayment === "deposit";
    case "client_paid":
      return row.clientPayment === "paid";
    case "supplier_todo":
      return row.supplierPayment === "todo";
    default:
      return true;
  }
}

function matchesSearch(row: ReservationRow, search: string): boolean {
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = [row.client, row.product, row.ref, row.partner ?? ""].join(" ").toLowerCase();
  return words.every((word) => haystack.includes(word));
}

/** Tous les filtres de la barre d'outils sauf l'onglet, pour que les compteurs d'onglets en tiennent compte. */
export function applyToolbarFilters(
  rows: ReservationRow[],
  filters: Omit<ReservationFilters, "tab">,
  today: Date = new Date(),
): ReservationRow[] {
  return rows.filter(
    (row) =>
      (!filters.boatsOnly || row.type === "boat") &&
      matchesPayment(row, filters.payment) &&
      matchesPeriod(row, filters.period, today) &&
      (filters.channel === "all" || row.channelKey === filters.channel) &&
      matchesSearch(row, filters.search),
  );
}

export interface ReservationGroups {
  requests: ReservationRow[];
  todo: ReservationRow[];
  settled: ReservationRow[];
}

/** Demandes en haut, puis ce qui attend une action, puis ce qui est soldé. */
export function groupRows(rows: ReservationRow[], today: Date = new Date()): ReservationGroups {
  const groups: ReservationGroups = { requests: [], todo: [], settled: [] };
  for (const row of rows) {
    if (isRequest(row)) groups.requests.push(row);
    else if (nextAction(row, today)) groups.todo.push(row);
    else groups.settled.push(row);
  }
  return groups;
}

function add(totals: MoneyByCurrency, currency: string, amount: number) {
  if (amount === 0) return;
  totals[currency] = (totals[currency] ?? 0) + amount;
}

/** Chiffres clés. Les demandes (montants estimés) et les annulations n'entrent dans aucun total d'argent. */
export function computeKpis(rows: ReservationRow[]): ReservationKpis {
  const kpis: ReservationKpis = { requests: 0, toCollect: {}, toPaySuppliers: {}, knownMargin: {}, missingCost: 0 };
  for (const row of rows) {
    if (isRequest(row)) {
      kpis.requests += 1;
      continue;
    }
    if (row.status === "annulee" || row.clientPayment === "refunded") continue;
    if (row.amount !== null) add(kpis.toCollect, row.currency, Math.max(row.amount - row.collected, 0));
    if (row.supplierPayment === "todo") {
      kpis.missingCost += row.missingCosts;
      add(kpis.toPaySuppliers, row.currency, row.supplierDue ?? 0);
    }
    if (row.amount !== null && row.supplierCost !== null) add(kpis.knownMargin, row.currency, row.amount - row.supplierCost);
  }
  return kpis;
}

/** « ₪19 780 » ou « ₪19 780 + $200 » si plusieurs devises. */
export function formatMoneyByCurrency(totals: MoneyByCurrency): string {
  const entries = Object.entries(totals);
  if (entries.length === 0) return formatCurrency(0, "ILS");
  return entries.map(([currency, amount]) => formatCurrency(Math.round(amount), currency)).join(" + ");
}
