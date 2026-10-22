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
