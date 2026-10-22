// Créneaux d'une expérience : une heure précise ("09:30") ou un moment de la journée
// ("morning" / "afternoon"). Le moment est enregistré sous un code neutre et traduit à
// l'affichage, pour que le client voie « Matin », « Morning » ou « בוקר » selon sa langue.
// Même table que supabase/functions/_shared/time-slot.ts (emails) : les garder alignées.

export type SlotLang = "en" | "fr" | "he";

export const TIME_SLOT_MOMENTS: Record<string, Record<SlotLang, string>> = {
  morning: { en: "Morning", fr: "Matin", he: "בוקר" },
  afternoon: { en: "Afternoon", fr: "Après-midi", he: "אחר הצהריים" },
};

const MOMENT_SORT_KEY: Record<string, string> = { morning: "08:00", afternoon: "13:00" };

export function isMomentSlot(slot: string): boolean {
  return slot in TIME_SLOT_MOMENTS;
}

export function formatTimeSlot(slot: string | null | undefined, lang: string = "fr"): string {
  if (!slot) return "";
  const moment = TIME_SLOT_MOMENTS[slot];
  if (!moment) return slot;
  return moment[(lang === "en" || lang === "he" ? lang : "fr") as SlotLang];
}

/** Matin avant les heures de l'après-midi, Après-midi après les heures du matin. */
export function sortTimeSlots(slots: string[]): string[] {
  return [...slots].sort((a, b) => (MOMENT_SORT_KEY[a] ?? a).localeCompare(MOMENT_SORT_KEY[b] ?? b));
}
