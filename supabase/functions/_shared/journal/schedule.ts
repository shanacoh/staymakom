// Heures d'Israël (heure d'été comprise) pour la génération (05:00) et la publication (17:00).
const ISRAEL_TZ = "Asia/Jerusalem";

function israelParts(date: Date): Record<string, number> {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: ISRAEL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const out: Record<string, number> = {};
  for (const p of parts) if (p.type !== "literal") out[p.type] = Number(p.value);
  return out;
}

/** Date du jour en Israël (AAAA-MM-JJ). */
export function israelDate(now: Date = new Date()): string {
  const p = israelParts(now);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function israelHour(now: Date = new Date()): number {
  return israelParts(now).hour;
}

/** Instant UTC correspondant à AAAA-MM-JJ à hh:00 heure d'Israël. */
export function israelTimeToUtc(isoDate: string, hour: number): Date {
  // On part de l'heure UTC naïve puis on corrige du décalage d'Israël ce jour-là (2 h ou 3 h).
  const guess = new Date(`${isoDate}T${String(hour).padStart(2, "0")}:00:00Z`);
  const p = israelParts(guess);
  const shownAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  const offsetMs = shownAsUtc - guess.getTime();
  return new Date(guess.getTime() - offsetMs);
}

/**
 * Heure de publication automatique : aujourd'hui à publishHour (heure d'Israël) si cette heure
 * est encore devant nous d'au moins 6 h, sinon le lendemain à la même heure.
 */
export function nextPublishAt(now: Date, publishHour: number): Date {
  const today = israelTimeToUtc(israelDate(now), publishHour);
  if (today.getTime() - now.getTime() >= 6 * 3600_000) return today;
  const tomorrow = new Date(now.getTime() + 24 * 3600_000);
  return israelTimeToUtc(israelDate(tomorrow), publishHour);
}
