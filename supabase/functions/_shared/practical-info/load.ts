// Lecture côté serveur des infos pratiques d'une fiche expérience.
// Le contact du jour J vit dans la table interne `standalone_experience_internal` : il n'est lisible
// qu'avec la clé de service (fonctions serveur), jamais par le navigateur d'un visiteur.
// Si l'expérience n'a pas le sien, on prend celui de son prestataire (table `providers`, interne aussi).

import {
  buildPracticalInfo,
  PRACTICAL_INFO_COLUMNS,
  resolveDayContact,
  type DayContactSource,
  type PracticalInfo,
  type PracticalInfoSource,
  type ProviderDayContactSource,
} from "./content.ts";

// deno-lint-ignore no-explicit-any
type ServiceClient = any;

/** Infos pratiques d'une fiche dans la langue demandée, ou `null` si la fiche n'en a aucune. */
export async function loadPracticalInfo(
  serviceClient: ServiceClient,
  experienceId: string | null | undefined,
  lang: unknown,
): Promise<PracticalInfo | null> {
  if (!experienceId) return null;

  const [experience, internal] = await Promise.all([
    serviceClient.from("standalone_experiences").select(PRACTICAL_INFO_COLUMNS).eq("id", experienceId).maybeSingle(),
    serviceClient
      .from("standalone_experience_internal")
      .select("day_contact_name, day_contact_phone, day_contact_language, provider_id")
      .eq("experience_id", experienceId)
      .maybeSingle(),
  ]);
  if (experience.error) throw experience.error;
  if (internal.error) throw internal.error;

  const experienceContact = internal.data as (DayContactSource & { provider_id?: string | null }) | null;
  const dayContact = resolveDayContact(experienceContact, await loadProviderDayContact(serviceClient, experienceContact));

  return buildPracticalInfo(experience.data as PracticalInfoSource | null, dayContact, lang);
}

/**
 * Contact du jour J par défaut du prestataire de l'expérience. Lu seulement si l'expérience n'a pas
 * le sien. Une lecture qui échoue ne bloque rien : on envoie alors les infos sans ce contact.
 */
async function loadProviderDayContact(
  serviceClient: ServiceClient,
  experienceContact: (DayContactSource & { provider_id?: string | null }) | null,
): Promise<ProviderDayContactSource | null> {
  const providerId = experienceContact?.provider_id;
  if (!providerId) return null;
  if (hasOwnContact(experienceContact)) return null;

  const { data, error } = await serviceClient
    .from("providers")
    .select("day_contact_name, day_contact_whatsapp, day_contact_language")
    .eq("id", providerId)
    .maybeSingle();
  if (error) {
    console.error("Contact jour J du prestataire illisible:", error);
    return null;
  }
  return data as ProviderDayContactSource | null;
}

const hasOwnContact = (contact: DayContactSource | null) =>
  !!(contact?.day_contact_name?.trim() || contact?.day_contact_phone?.trim());

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

export const SAMPLE_DAY_CONTACT: DayContactSource = {
  day_contact_name: "Yael",
  day_contact_phone: "+972 50 000 0000",
  day_contact_language: "he",
};
