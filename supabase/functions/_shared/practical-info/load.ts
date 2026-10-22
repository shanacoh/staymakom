// Lecture côté serveur des infos pratiques d'une fiche expérience.
// Le contact du jour J n'est pas lu ici : il est interne à l'équipe et n'est jamais envoyé au client.

import { buildPracticalInfo, PRACTICAL_INFO_COLUMNS, type PracticalInfo, type PracticalInfoSource } from "./content.ts";

// deno-lint-ignore no-explicit-any
type ServiceClient = any;

/** Infos pratiques d'une fiche dans la langue demandée, ou `null` si la fiche n'en a aucune. */
export async function loadPracticalInfo(
  serviceClient: ServiceClient,
  experienceId: string | null | undefined,
  lang: unknown,
): Promise<PracticalInfo | null> {
  if (!experienceId) return null;

  const { data, error } = await serviceClient
    .from("standalone_experiences")
    .select(PRACTICAL_INFO_COLUMNS)
    .eq("id", experienceId)
    .maybeSingle();
  if (error) throw error;

  return buildPracticalInfo(data as PracticalInfoSource | null, lang);
}

/** Infos pratiques de démonstration, pour montrer le rendu d'une fiche complète sans rien écrire en base. */
export const SAMPLE_PRACTICAL_SOURCE: PracticalInfoSource = {
  meeting_point: "In front of the main entrance, by the parking lot",
  meeting_point_fr: "Devant l'entrée principale, côté parking",
  meeting_point_he: "מול הכניסה הראשית, ליד החניה",
  address: "12 HaYarkon Street, Tel Aviv",
  access_note: "Bus 4 or 16, HaYarkon stop. Free parking on site.",
  access_note_fr: "Bus 4 ou 16, arrêt HaYarkon. Parking gratuit sur place.",
  access_note_he: "אוטובוס 4 או 16, תחנת הירקון. חניה חינם במקום.",
  arrive_minutes_before: 15,
  know_before_you_go: "Closed shoes, water and a hat.",
  know_before_you_go_fr: "Chaussures fermées, eau et chapeau.",
  know_before_you_go_he: "נעליים סגורות, מים וכובע.",
  contingency_note: "In case of rain, the experience is rescheduled or refunded.",
  contingency_note_fr: "En cas de pluie, l'expérience est reportée ou remboursée.",
  contingency_note_he: "במקרה של גשם, החוויה תידחה או שיינתן החזר.",
  latitude: 32.0853,
  longitude: 34.7818,
};
