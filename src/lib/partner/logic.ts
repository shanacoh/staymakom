// Règles de l'espace partenaire, sans aucun accès à la base ni à l'écran (testées dans logic.test.ts).

import type { PartnerAvailability, PartnerBooking, PartnerLang } from "./types";

/** Vrai pour l'espace partenaire (`/partner`, `/partner/...`), faux pour les pages publiques `/partners`, `/partner-exp`... */
export const isPartnerSpacePath = (pathname: string) => pathname === "/partner" || pathname.startsWith("/partner/");

export const PARTNER_LANGS: PartnerLang[] = ["he", "en", "fr"];

export function normalizePartnerLang(value: unknown): PartnerLang | null {
  return value === "he" || value === "en" || value === "fr" ? value : null;
}

/** Langue de départ : celle du prestataire, sinon celle du navigateur, sinon l'anglais. */
export function initialPartnerLang(providerLanguage: unknown, browserLanguage: string | undefined): PartnerLang {
  const own = normalizePartnerLang(providerLanguage);
  if (own) return own;
  const browser = (browserLanguage ?? "").split("-")[0].toLowerCase();
  if (browser === "fr") return "fr";
  if (browser === "he" || browser === "iw") return "he";
  return "en";
}

/** Nom de la colonne d'un texte dans une langue : title / title_fr / title_he. */
export const localizedKey = (base: string, lang: PartnerLang) => (lang === "en" ? base : `${base}_${lang}`);

const filled = (value: unknown): value is string => typeof value === "string" && value.trim() !== "";

/** Le texte dans la langue demandée, tel qu'il est enregistré (vide s'il n'existe pas dans cette langue). */
export function ownText(source: Record<string, unknown> | null | undefined, base: string, lang: PartnerLang): string {
  const value = source?.[localizedKey(base, lang)];
  return filled(value) ? value : "";
}

/** Pour l'affichage : la langue demandée, sinon l'anglais, sinon n'importe quelle langue remplie. */
export function displayText(source: Record<string, unknown> | null | undefined, base: string, lang: PartnerLang): string {
  for (const candidate of [lang, "en", "fr", "he"] as PartnerLang[]) {
    const value = ownText(source, base, candidate);
    if (value) return value;
  }
  return "";
}

// ── Dates ───────────────────────────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, "0");

/** Date locale au format AAAA-MM-JJ (jamais de décalage de fuseau). */
export const toIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Jour de la semaine comme sur la fiche : 1 = lundi ... 7 = dimanche. */
export function weekdayNumber(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  const jsDay = new Date(y, m - 1, d).getDay();
  return jsDay === 0 ? 7 : jsDay;
}

/**
 * Les cases d'un mois pour un calendrier qui commence le dimanche (semaine israélienne) :
 * des cases vides, puis chaque jour au format AAAA-MM-JJ.
 */
export function monthCells(year: number, monthIndex: number): (string | null)[] {
  const first = new Date(year, monthIndex, 1);
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: first.getDay() }, () => null);
  for (let day = 1; day <= days; day += 1) cells.push(`${year}-${pad(monthIndex + 1)}-${pad(day)}`);
  return cells;
}

// ── Disponibilités (même modèle que le back-office et que la page publique) ───────────────────────

/** Vrai si le client peut réserver cette date, selon les règles de la fiche. */
export function isDateOpen(availability: PartnerAvailability, isoDate: string): boolean {
  if (availability.availability_mode === "whitelist") return availability.whitelisted_dates.includes(isoDate);
  if (!availability.available_days.includes(weekdayNumber(isoDate))) return false;
  return !availability.blocked_dates.includes(isoDate);
}

const toggle = <T,>(list: T[], item: T): T[] => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

/**
 * Un appui sur une date du calendrier : en mode « dates ouvertes », il ouvre ou ferme la date ;
 * en mode « jours ouverts », il ferme ou rouvre une date d'un jour ouvert (un jour fermé de la
 * semaine ne se rouvre pas date par date).
 */
export function toggleDate(availability: PartnerAvailability, isoDate: string): PartnerAvailability {
  if (availability.availability_mode === "whitelist") {
    return { ...availability, whitelisted_dates: toggle(availability.whitelisted_dates, isoDate).sort() };
  }
  if (!availability.available_days.includes(weekdayNumber(isoDate))) return availability;
  return { ...availability, blocked_dates: toggle(availability.blocked_dates, isoDate).sort() };
}

export function toggleWeekday(availability: PartnerAvailability, day: number): PartnerAvailability {
  return { ...availability, available_days: toggle(availability.available_days, day).sort((a, b) => a - b) };
}

/** Un créneau saisi (« 9:30 », « 18h », « 1800 ») remis au format HH:MM, ou null s'il n'est pas lisible. */
export function normalizeTimeSlot(input: string): string | null {
  const match = input.trim().match(/^(\d{1,2})\s*(?:[:hH.]?\s*(\d{2}))?\s*[hH]?$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  if (hours > 23 || minutes > 59) return null;
  return `${pad(hours)}:${pad(minutes)}`;
}

export function addTimeSlot(availability: PartnerAvailability, input: string): PartnerAvailability | null {
  const slot = normalizeTimeSlot(input);
  if (!slot) return null;
  if (availability.time_slots.includes(slot)) return availability;
  return { ...availability, has_time_slots: true, time_slots: [...availability.time_slots, slot].sort() };
}

export function removeTimeSlot(availability: PartnerAvailability, slot: string): PartnerAvailability {
  const time_slots = availability.time_slots.filter((s) => s !== slot);
  return { ...availability, time_slots, has_time_slots: time_slots.length > 0 };
}

// ── Réservations et revenus ─────────────────────────────────────────────────────────────────────

/** Sépare « à venir » (la plus proche d'abord) et « passées » (la plus récente d'abord). */
export function splitBookings(bookings: PartnerBooking[], today: string) {
  return {
    upcoming: bookings.filter((b) => b.booking_date >= today).sort((a, b) => a.booking_date.localeCompare(b.booking_date)),
    past: bookings.filter((b) => b.booking_date < today).sort((a, b) => b.booking_date.localeCompare(a.booking_date)),
  };
}

export interface MonthlyRevenue {
  /** Mois de la prestation, AAAA-MM. */
  month: string;
  currency: string;
  count: number;
  /** Total de ce qui revient au prestataire, sur les réservations dont le montant est connu. */
  total: number;
  settled: number;
  due: number;
  /** Réservations du mois dont le montant n'est pas encore connu. */
  unknown: number;
}

/** Totaux par mois et par devise, le mois le plus récent d'abord. */
export function monthlyRevenue(bookings: PartnerBooking[]): MonthlyRevenue[] {
  const byKey = new Map<string, MonthlyRevenue>();
  for (const booking of bookings) {
    const month = booking.booking_date.slice(0, 7);
    const key = `${month}|${booking.currency}`;
    const stat = byKey.get(key) ?? { month, currency: booking.currency, count: 0, total: 0, settled: 0, due: 0, unknown: 0 };
    stat.count += 1;
    if (booking.provider_amount == null) stat.unknown += 1;
    else {
      stat.total += booking.provider_amount;
      if (booking.settled) stat.settled += booking.provider_amount;
      else stat.due += booking.provider_amount;
    }
    byKey.set(key, stat);
  }
  const round = (n: number) => Math.round(n * 100) / 100;
  return [...byKey.values()]
    .map((s) => ({ ...s, total: round(s.total), settled: round(s.settled), due: round(s.due) }))
    .sort((a, b) => b.month.localeCompare(a.month) || a.currency.localeCompare(b.currency));
}

export interface RevenueTotal {
  currency: string;
  /** Tout ce qui revient au prestataire, réservations passées et à venir. */
  total: number;
  /** La part pas encore réglée par STAYMAKOM. */
  due: number;
}

/** Totaux de l'accueil, une ligne par devise (la plus grosse d'abord), sans les montants inconnus. */
export function revenueTotals(bookings: PartnerBooking[]): RevenueTotal[] {
  const byCurrency = new Map<string, RevenueTotal>();
  for (const month of monthlyRevenue(bookings)) {
    const stat = byCurrency.get(month.currency) ?? { currency: month.currency, total: 0, due: 0 };
    stat.total += month.total;
    stat.due += month.due;
    byCurrency.set(month.currency, stat);
  }
  const round = (n: number) => Math.round(n * 100) / 100;
  return [...byCurrency.values()]
    .map((t) => ({ ...t, total: round(t.total), due: round(t.due) }))
    .sort((a, b) => b.total - a.total);
}

/** Dates (AAAA-MM-JJ) où le prestataire a au moins une réservation, pour les marquer au calendrier. */
export function bookedDates(bookings: PartnerBooking[], experienceId?: string): Set<string> {
  return new Set(
    bookings.filter((b) => !experienceId || b.experience_id === experienceId).map((b) => b.booking_date),
  );
}

// ── Propositions ────────────────────────────────────────────────────────────────────────────────

/** Ne garde d'un formulaire que les champs réellement modifiés (comparés sans les espaces de bord). */
export function changedFields(original: Record<string, string>, edited: Record<string, string>): Record<string, string> {
  const changed: Record<string, string> = {};
  for (const [key, value] of Object.entries(edited)) {
    if (value.trim() !== (original[key] ?? "").trim()) changed[key] = value.trim();
  }
  return changed;
}

export function formatMoney(amount: number | null | undefined, currency: string): string {
  if (amount == null) return "";
  const symbols: Record<string, string> = { ILS: "₪", USD: "$", EUR: "€" };
  const value = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return `${symbols[currency] ?? `${currency} `}${value}`;
}
