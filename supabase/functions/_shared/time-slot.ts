// Créneau d'une réservation : une heure précise ("09:30") ou un moment de la journée
// ("morning" / "afternoon"), traduit ici pour les emails et messages.
// Même table que src/lib/timeSlots.ts (site) : les garder alignées.

const TIME_SLOT_MOMENTS: Record<string, Record<"en" | "fr" | "he", string>> = {
  morning: { en: "Morning", fr: "Matin", he: "בוקר" },
  afternoon: { en: "Afternoon", fr: "Après-midi", he: "אחר הצהריים" },
};

export function isMomentSlot(slot: string | null | undefined): boolean {
  return !!slot && slot in TIME_SLOT_MOMENTS;
}

export function formatTimeSlot(slot: string | null | undefined, lang: string = "en"): string {
  if (!slot) return "";
  const moment = TIME_SLOT_MOMENTS[slot];
  if (!moment) return slot;
  return moment[lang === "fr" || lang === "he" ? lang : "en"];
}

/**
 * Horaires acceptés pour une date : ceux de `session_labels[date].slots` s'ils existent
 * (ex. horaires spéciaux pendant Hanoukka), sinon les horaires habituels `time_slots`.
 * Même règle que src/lib/timeSlots.ts (site) : les garder alignées.
 */
export function slotsForDate(timeSlots: unknown, sessionLabels: unknown, date: string | null | undefined): string[] {
  const labels = sessionLabels && typeof sessionLabels === 'object' ? (sessionLabels as Record<string, any>) : null;
  const dateSlots = date && labels ? labels[date]?.slots : undefined;
  if (Array.isArray(dateSlots) && dateSlots.length > 0) return dateSlots;
  return Array.isArray(timeSlots) ? (timeSlots as string[]) : [];
}
