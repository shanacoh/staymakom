/**
 * Règles de disponibilité communes aux bateaux (liste /boat et fiche détail) :
 * délai minimum avant de pouvoir réserver, jours disponibles, dates bloquées,
 * mode liste blanche. Extrait de BoatDetailModal pour être réutilisé par la
 * page de liste (filtre date) sans dupliquer la logique.
 */

export interface BoatAvailabilityFields {
  lead_time_days?: number | null;
  available_days?: number[] | null;
  blocked_dates?: string[] | null;
  availability_end_date?: string | null;
  availability_mode?: string | null;
  whitelisted_dates?: string[] | null;
}

export function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getMinDate(boat: BoatAvailabilityFields): string {
  const d = new Date();
  d.setDate(d.getDate() + (boat.lead_time_days ?? 0));
  return toLocalDateStr(d);
}

export function isDateUnavailableForBoat(boat: BoatAvailabilityFields, date: Date): boolean {
  const availableDays: number[] = boat.available_days ?? [1, 2, 3, 4, 5, 6, 7];
  const blockedDateStrings: string[] = boat.blocked_dates ?? [];
  const isWhitelistMode = boat.availability_mode === "whitelist";
  const whitelistedSet = new Set<string>(isWhitelistMode ? boat.whitelisted_dates ?? [] : []);
  const minDate = new Date(getMinDate(boat) + "T00:00:00");
  const maxDate = boat.availability_end_date ? new Date(boat.availability_end_date + "T23:59:59") : undefined;
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (d < minDate) return true;
  if (isWhitelistMode) return !whitelistedSet.has(toLocalDateStr(date));
  if (maxDate && d > maxDate) return true;
  if (availableDays.length < 7) {
    const availableJsDays = availableDays.map((n) => (n === 7 ? 0 : n));
    if (!availableJsDays.includes(date.getDay())) return true;
  }
  return blockedDateStrings.includes(toLocalDateStr(date));
}

/** true si la date demandée est aujourd'hui ou demain — déclenche le bandeau "dernière minute". */
export function isLastMinuteDate(dateStr: string): boolean {
  const today = toLocalDateStr(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toLocalDateStr(tomorrow);
  return dateStr === today || dateStr === tomorrowStr;
}

/** Adresse fixe du point de rendez-vous par port (les deux seuls départs actifs). */
export const BOAT_MEETING_POINTS: Record<string, { address: string; note: string; mapsUrl: string }> = {
  Herzliya: {
    address: "Devant le Superpharm de la marina, Yordei Yam 1, Herzliya",
    note: "Le skipper appelle 10 minutes avant.",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Superpharm Herzliya Marina, Yordei Yam 1"),
  },
  "Tel Aviv": {
    address: "Marina de Tel Aviv, Eliezer Peri 14 (face au Carlton)",
    note: "Le skipper appelle 10 minutes avant.",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("Eliezer Peri 14, Tel Aviv Marina"),
  },
};
