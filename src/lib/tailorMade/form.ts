// Formulaire « Tailor-made request » : les choix proposés (dans les trois langues), l'état du
// formulaire, les règles de validation de chaque étape et la mise en forme de l'envoi.
// Les codes (type de séjour, budget, régions, contraintes) sont ceux attendus par la fonction
// serveur submit-tailor-made-request : toute modification se fait des deux côtés.

import { MACRO_REGIONS, type Lang, type MacroRegion } from "@/lib/regions";
import type { VisitSource } from "@/lib/tailorMade/visitSource";

type Labels = Record<Lang, string>;
export interface Option<T extends string = string> {
  value: T;
  label: Labels;
}

export type StayType = "trip_sur_mesure" | "romantic_getaway" | "proposal" | "celebration" | "friends_group" | "autre";

// « Autre » n'est pas une bulle : c'est un lien qui ouvre un champ libre.
export const STAY_TYPES: Option<Exclude<StayType, "autre">>[] = [
  { value: "trip_sur_mesure", label: { fr: "Trip sur-mesure", en: "Tailor-made trip", he: "טיול בהתאמה אישית" } },
  { value: "romantic_getaway", label: { fr: "Romantic Getaway", en: "Romantic Getaway", he: "חופשה רומנטית" } },
  { value: "proposal", label: { fr: "Proposal", en: "Proposal", he: "הצעת נישואין" } },
  { value: "celebration", label: { fr: "Celebration", en: "Celebration", he: "חגיגה" } },
  { value: "friends_group", label: { fr: "Friends & Group", en: "Friends & Group", he: "חברים וקבוצות" } },
];

export const BUDGETS: Option[] = [
  { value: "moins_500", label: { fr: "Moins de 500 €", en: "Under €500", he: "עד 500 €" } },
  { value: "500_1000", label: { fr: "500 à 1 000 €", en: "€500 to €1,000", he: "500 עד 1,000 €" } },
  { value: "1000_2000", label: { fr: "1 000 à 2 000 €", en: "€1,000 to €2,000", he: "1,000 עד 2,000 €" } },
  { value: "2000_4000", label: { fr: "2 000 à 4 000 €", en: "€2,000 to €4,000", he: "2,000 עד 4,000 €" } },
  { value: "plus_4000", label: { fr: "4 000 € et plus", en: "€4,000 and more", he: "4,000 € ומעלה" } },
  { value: "ne_sait_pas", label: { fr: "Je ne sais pas encore", en: "I don't know yet", he: "עדיין לא יודע/ת" } },
];

// Envies : volontairement cinq grandes familles, pas les catégories du site (trop nombreuses).
// « Autre » ouvre un champ libre.
export const MOODS: Option[] = [
  { value: "romantic", label: { fr: "Romantique", en: "Romantic", he: "רומנטי" } },
  { value: "famille", label: { fr: "Famille", en: "Family", he: "משפחה" } },
  { value: "amis", label: { fr: "Amis", en: "Friends", he: "חברים" } },
  { value: "entreprise", label: { fr: "Entreprise", en: "Corporate", he: "חברה" } },
  { value: "autre", label: { fr: "Autre", en: "Other", he: "אחר" } },
];

export const REGIONS: Option<MacroRegion>[] = MACRO_REGIONS.map((r) => ({ value: r.code, label: r.label }));

export const CONSTRAINTS: Option[] = [
  { value: "kasher", label: { fr: "Kasher", en: "Kosher", he: "כשר" } },
  { value: "shabbat", label: { fr: "Shabbat", en: "Shabbat", he: "שומרי שבת" } },
  { value: "accessibilite", label: { fr: "Accessibilité", en: "Accessibility", he: "נגישות" } },
];

export const LANGUAGES: Option<Lang>[] = [
  { value: "fr", label: { fr: "Français", en: "Français", he: "Français" } },
  { value: "en", label: { fr: "English", en: "English", he: "English" } },
  { value: "he", label: { fr: "עברית", en: "עברית", he: "עברית" } },
];

// Indicatifs proposés pour le numéro WhatsApp, les plus fréquents d'abord.
export const DIAL_CODES: { code: string; label: string }[] = [
  { code: "+972", label: "🇮🇱 +972" },
  { code: "+33", label: "🇫🇷 +33" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+32", label: "🇧🇪 +32" },
  { code: "+41", label: "🇨🇭 +41" },
  { code: "+352", label: "🇱🇺 +352" },
  { code: "+377", label: "🇲🇨 +377" },
  { code: "+49", label: "🇩🇪 +49" },
  { code: "+34", label: "🇪🇸 +34" },
  { code: "+39", label: "🇮🇹 +39" },
  { code: "+31", label: "🇳🇱 +31" },
  { code: "+351", label: "🇵🇹 +351" },
  { code: "+43", label: "🇦🇹 +43" },
  { code: "+61", label: "🇦🇺 +61" },
  { code: "+55", label: "🇧🇷 +55" },
  { code: "+52", label: "🇲🇽 +52" },
  { code: "+54", label: "🇦🇷 +54" },
  { code: "+27", label: "🇿🇦 +27" },
  { code: "+971", label: "🇦🇪 +971" },
  { code: "+212", label: "🇲🇦 +212" },
];

const DEFAULT_DIAL_CODE: Record<Lang, string> = { fr: "+33", en: "+1", he: "+972" };

export const MAX_ADULTS = 30;
export const MAX_CHILDREN = 15;
export const MAX_NIGHTS = 60;

export type DatesMode = "precises" | "flexibles";

export interface TailorMadeForm {
  stayType: StayType | "";
  stayTypeOther: string;
  datesMode: DatesMode;
  dateStart: string;
  dateEnd: string;
  month: string;
  nights: number;
  adults: number;
  children: number;
  // Une case par enfant, vide tant que l'âge n'est pas choisi.
  childrenAges: string[];
  budget: string;
  moods: string[];
  moodOther: string;
  regions: MacroRegion[];
  surpriseMe: boolean;
  constraints: string[];
  constraintOther: string;
  firstTrip: boolean | null;
  message: string;
  firstName: string;
  dialCode: string;
  phone: string;
  email: string;
  language: Lang;
}

export function emptyForm(lang: Lang): TailorMadeForm {
  return {
    stayType: "",
    stayTypeOther: "",
    datesMode: "precises",
    dateStart: "",
    dateEnd: "",
    month: "",
    nights: 3,
    adults: 2,
    children: 0,
    childrenAges: [],
    budget: "",
    moods: [],
    moodOther: "",
    regions: [],
    surpriseMe: false,
    constraints: [],
    constraintOther: "",
    firstTrip: null,
    message: "",
    firstName: "",
    dialCode: DEFAULT_DIAL_CODE[lang],
    phone: "",
    email: "",
    language: lang,
  };
}

/** Les 18 prochains mois, pour le choix « dates flexibles ». */
export function upcomingMonths(lang: Lang, from: Date = new Date()): { value: string; label: string }[] {
  const locale = lang === "he" ? "he-IL" : lang === "fr" ? "fr-FR" : "en-US";
  return Array.from({ length: 18 }, (_, i) => {
    const date = new Date(from.getFullYear(), from.getMonth() + i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString(locale, { month: "long", year: "numeric" });
    return { value, label: label.charAt(0).toUpperCase() + label.slice(1) };
  });
}

/** Numéro complet avec indicatif, sans espaces ni zéro initial (« 06 12… » devient « +33612… »). */
export function fullPhone(form: Pick<TailorMadeForm, "dialCode" | "phone">): string {
  return form.dialCode + form.phone.replace(/\D/g, "").replace(/^0+/, "");
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FormStep = 1 | 2 | 3;

/** Une étape est complète quand tout ce qui y est obligatoire est rempli. */
export function isStepComplete(step: FormStep, form: TailorMadeForm): boolean {
  if (step === 1) {
    const typeOk = form.stayType !== "" && (form.stayType !== "autre" || form.stayTypeOther.trim() !== "");
    const datesOk =
      form.datesMode === "precises"
        ? form.dateStart !== "" && form.dateEnd !== "" && form.dateEnd >= form.dateStart
        : form.month !== "" && form.nights >= 1;
    const agesOk = form.childrenAges.length === form.children && form.childrenAges.every((age) => age !== "");
    return typeOk && datesOk && form.adults >= 1 && agesOk;
  }
  if (step === 2) {
    return form.budget !== "" && (form.surpriseMe || form.regions.length > 0) && form.firstTrip !== null;
  }
  const digits = fullPhone(form).length - 1;
  const emailOk = form.email.trim() === "" || EMAIL.test(form.email.trim());
  return form.firstName.trim() !== "" && digits >= 8 && digits <= 15 && emailOk;
}

/** Ce qui est envoyé à la fonction serveur. */
export function toPayload(form: TailorMadeForm, source: VisitSource) {
  return {
    first_name: form.firstName.trim(),
    whatsapp: fullPhone(form),
    email: form.email.trim() || undefined,
    langue: form.language,
    type_sejour: form.stayType,
    type_sejour_autre: form.stayType === "autre" ? form.stayTypeOther.trim() : undefined,
    dates_mode: form.datesMode,
    ...(form.datesMode === "precises"
      ? { date_debut: form.dateStart, date_fin: form.dateEnd }
      : { mois: form.month, nb_nuits: form.nights }),
    adultes: form.adults,
    enfants: form.children,
    ages_enfants: form.childrenAges.map(Number),
    budget: form.budget,
    moods: form.moods,
    mood_autre: form.moods.includes("autre") ? form.moodOther.trim() || undefined : undefined,
    regions: form.surpriseMe ? [] : form.regions,
    surprenez_moi: form.surpriseMe,
    contraintes: form.constraints,
    contrainte_autre: form.constraintOther.trim() || undefined,
    premier_voyage: form.firstTrip,
    message: form.message.trim() || undefined,
    source,
  };
}
