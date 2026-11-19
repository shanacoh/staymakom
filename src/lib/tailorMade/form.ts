// Formulaire « Tailor-made request » : les choix proposés (dans les trois langues), l'état du
// formulaire, les règles de validation de chaque étape et la mise en forme de l'envoi.
// Les codes (type de séjour, budget, régions, contraintes) sont ceux attendus par la fonction
// serveur submit-tailor-made-request : toute modification se fait des deux côtés.

import { MACRO_REGIONS, type Lang, type MacroRegion } from "@/lib/regions";
import type { VisitSource } from "@/lib/tailorMade/visitSource";
import { composePhone, defaultDialCode } from "@/lib/phone";
import type { Locale } from "@/lib/locale";

// Libellés : en / fr / he obligatoires, es / ru / de quand ils existent (sinon repli anglais).
type Labels = Record<Lang, string> & Partial<Record<Locale, string>>;
export interface Option<T extends string = string> {
  value: T;
  label: Labels;
}

export type StayType = "trip_sur_mesure" | "romantic_getaway" | "proposal" | "celebration" | "friends_group" | "autre";

// « Autre » n'est pas une bulle : c'est un lien qui ouvre un champ libre.
export const STAY_TYPES: Option<Exclude<StayType, "autre">>[] = [
  { value: "trip_sur_mesure", label: { fr: "Trip sur-mesure", en: "Tailor-made trip", he: "טיול בהתאמה אישית", es: "Viaje a medida", ru: "Поездка под ваши пожелания", de: "Maßgeschneiderte Reise" } },
  { value: "romantic_getaway", label: { fr: "Romantic Getaway", en: "Romantic Getaway", he: "חופשה רומנטית", es: "Escapada romántica", ru: "Романтический отдых", de: "Romantische Auszeit" } },
  { value: "proposal", label: { fr: "Proposal", en: "Proposal", he: "הצעת נישואין", es: "Pedida de mano", ru: "Предложение руки и сердца", de: "Heiratsantrag" } },
  { value: "celebration", label: { fr: "Celebration", en: "Celebration", he: "חגיגה", es: "Celebración", ru: "Праздник", de: "Feier" } },
  { value: "friends_group", label: { fr: "Friends & Group", en: "Friends & Group", he: "חברים וקבוצות", es: "Amigos y grupos", ru: "Друзья и группы", de: "Freunde und Gruppen" } },
];

export const BUDGETS: Option[] = [
  { value: "moins_500", label: { fr: "Moins de 500 €", en: "Under €500", he: "עד 500 €", es: "Menos de 500 €", ru: "До 500 €", de: "Unter 500 €" } },
  { value: "500_1000", label: { fr: "500 à 1 000 €", en: "€500 to €1,000", he: "500 עד 1,000 €", es: "De 500 a 1000 €", ru: "От 500 до 1000 €", de: "500 bis 1.000 €" } },
  { value: "1000_2000", label: { fr: "1 000 à 2 000 €", en: "€1,000 to €2,000", he: "1,000 עד 2,000 €", es: "De 1000 a 2000 €", ru: "От 1000 до 2000 €", de: "1.000 bis 2.000 €" } },
  { value: "2000_4000", label: { fr: "2 000 à 4 000 €", en: "€2,000 to €4,000", he: "2,000 עד 4,000 €", es: "De 2000 a 4000 €", ru: "От 2000 до 4000 €", de: "2.000 bis 4.000 €" } },
  { value: "plus_4000", label: { fr: "4 000 € et plus", en: "€4,000 and more", he: "4,000 € ומעלה", es: "4000 € o más", ru: "От 4000 € и выше", de: "4.000 € und mehr" } },
  { value: "ne_sait_pas", label: { fr: "Je ne sais pas encore", en: "I don't know yet", he: "עדיין לא יודע/ת", es: "Todavía no lo sé", ru: "Пока не знаю", de: "Weiß ich noch nicht" } },
];

// Envies : volontairement cinq grandes familles, pas les catégories du site (trop nombreuses).
// « Autre » ouvre un champ libre.
export const MOODS: Option[] = [
  { value: "romantic", label: { fr: "Romantique", en: "Romantic", he: "רומנטי", es: "Romántico", ru: "Романтика", de: "Romantisch" } },
  { value: "famille", label: { fr: "Famille", en: "Family", he: "משפחה", es: "Familia", ru: "Семья", de: "Familie" } },
  { value: "amis", label: { fr: "Amis", en: "Friends", he: "חברים", es: "Amigos", ru: "Друзья", de: "Freunde" } },
  { value: "entreprise", label: { fr: "Entreprise", en: "Corporate", he: "חברה", es: "Empresa", ru: "Компания", de: "Firma" } },
  { value: "autre", label: { fr: "Autre", en: "Other", he: "אחר", es: "Otro", ru: "Другое", de: "Andere" } },
];

export const REGIONS: Option<MacroRegion>[] = MACRO_REGIONS.map((r) => ({ value: r.code, label: r.label }));

export const CONSTRAINTS: Option[] = [
  { value: "kasher", label: { fr: "Kasher", en: "Kosher", he: "כשר", es: "Kosher", ru: "Кошер", de: "Koscher" } },
  { value: "shabbat", label: { fr: "Shabbat", en: "Shabbat", he: "שומרי שבת", es: "Shabat", ru: "Шаббат", de: "Schabbat" } },
  { value: "accessibilite", label: { fr: "Accessibilité", en: "Accessibility", he: "נגישות", es: "Accesibilidad", ru: "Доступная среда", de: "Barrierefreiheit" } },
];

export const LANGUAGES: Option<Lang>[] = [
  { value: "fr", label: { fr: "Français", en: "Français", he: "Français" } },
  { value: "en", label: { fr: "English", en: "English", he: "English" } },
  { value: "he", label: { fr: "עברית", en: "עברית", he: "עברית" } },
];

// Indicatifs proposés pour le numéro WhatsApp : liste commune à tous les formulaires du site.
export { DIAL_CODES } from "@/lib/phone";


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
    // Même règle que le champ téléphone du site : +33 en français, +972 partout ailleurs.
    dialCode: defaultDialCode(lang),
    phone: "",
    email: "",
    language: lang,
  };
}

/** Libellé d'un choix dans la langue de la page (repli anglais si la langue manque). */
export const optionLabel = (option: Option, locale: Locale): string => option.label[locale] ?? option.label.en;

const MONTH_LOCALES: Record<Locale, string> = { en: "en-US", fr: "fr-FR", he: "he-IL", es: "es-ES", ru: "ru-RU", de: "de-DE" };

/** Les 18 prochains mois, pour le choix « dates flexibles ». */
export function upcomingMonths(lang: Locale, from: Date = new Date()): { value: string; label: string }[] {
  const locale = MONTH_LOCALES[lang] ?? "en-US";
  return Array.from({ length: 18 }, (_, i) => {
    const date = new Date(from.getFullYear(), from.getMonth() + i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString(locale, { month: "long", year: "numeric" });
    return { value, label: label.charAt(0).toUpperCase() + label.slice(1) };
  });
}

/** Numéro complet avec indicatif, sans espaces ni zéro initial (« 06 12… » devient « +33612… »). */
export function fullPhone(form: Pick<TailorMadeForm, "dialCode" | "phone">): string {
  return composePhone(form.dialCode, form.phone);
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
