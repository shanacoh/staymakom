// Règles du parcours go live, sans écran ni base : quelles sections montrer, l'état d'une section,
// le bouton de l'étape en cours, l'affichage d'une valeur, la relance après 3 jours et les messages
// WhatsApp que l'équipe copie (dans la langue du prestataire). Testées dans golive.test.ts.

import { GOLIVE_TEXTS, type GoLiveTexts } from "./i18n-golive";
import type { FieldState, GoLive, GoLiveStep, ListingField, ListingKind, PartnerLang } from "./types";

export const LISTING_SECTIONS: Record<ListingKind, string[]> = {
  experience: ["story", "photos", "inclusions", "practical", "rules"],
  hotel: ["story", "photos", "rooms", "practical"],
};

/** Sections qui se proposent en texte libre (« note ») plutôt que champ par champ. */
export const NOTE_SECTIONS = new Set(["photos", "inclusions", "rooms"]);

export function fieldsOf(fields: ListingField[], section: string): ListingField[] {
  return fields.filter((field) => field.section === section);
}

/** Une section est confirmée quand plus aucun de ses champs n'est « à confirmer ». */
export function sectionState(fields: ListingField[]): FieldState {
  if (fields.some((field) => field.state === "to_confirm")) return "to_confirm";
  if (fields.some((field) => field.state === "to_fill")) return "to_fill";
  return "confirmed";
}

export function currentStep(golive: GoLive): GoLiveStep | null {
  return golive.steps.find((step) => step.key === golive.current_step) ?? null;
}

export interface StepAction {
  label: string;
  to: string;
}

/**
 * Le seul bouton de l'étape « votre tour ». Signer demande un compte : par le lien, le bouton mène
 * à la connexion.
 */
export function actionFor(golive: GoLive, mode: "account" | "link", base: string, t: GoLiveTexts): StepAction | null {
  const step = currentStep(golive);
  if (!step || !golive.my_turn) return null;
  const target = golive.target;
  switch (step.key) {
    case "reviewed":
      return target ? { label: t.actions.reviewed, to: `${base}/listing/${target.kind}/${target.id}` } : null;
    case "practical":
      return target ? { label: t.actions.practical, to: `${base}/practical/${target.id}` } : null;
    case "dates":
      return target ? { label: t.actions.dates, to: `${base}/availability/${target.id}` } : null;
    case "terms":
    case "contract":
      return mode === "link"
        ? { label: t.actions.loginToSign, to: "/partner/login" }
        : { label: step.key === "terms" ? t.actions.terms : t.actions.contract, to: `${base}/sign` };
    default:
      return null;
  }
}

/** Vrai si l'étape « votre tour » n'a pas bougé depuis `days` jours. */
export function turnIsStale(golive: Pick<GoLive, "my_turn" | "turn_since">, now: Date, days = 3): boolean {
  if (!golive.my_turn || !golive.turn_since) return false;
  return now.getTime() - new Date(golive.turn_since).getTime() >= days * 24 * 60 * 60 * 1000;
}

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7];

/** Jours fermés (1 = lundi ... 7 = dimanche) à partir des jours ouverts. */
export function closedDaysOf(openDays: number[]): number[] {
  return ALL_DAYS.filter((day) => !openDays.includes(day));
}

export function openDaysOf(closedDays: number[]): number[] {
  return ALL_DAYS.filter((day) => !closedDays.includes(day));
}

/** Une valeur de champ en une ligne lisible, dans la langue de l'espace. */
export function formatFieldValue(field: Pick<ListingField, "key" | "value">, t: GoLiveTexts, weekdays: string[]): string {
  const v = field.value as unknown;
  if (v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) return t.empty;
  switch (field.key) {
    case "group_size": {
      const g = v as { min?: number; max?: number };
      return t.people(g.min ?? 1, g.max ?? 1);
    }
    case "min_age":
      return t.years(Number(v));
    case "lead_time_days":
      return t.daysAhead(Number(v));
    case "available_days": {
      const open = (v as number[]).map(Number);
      return open.length === 7 ? weekdays.join(", ") : open.map((d) => weekdays[d - 1]).join(", ");
    }
    case "private_groups_only":
      return v ? t.yes : t.no;
    case "free_cancellation_hours":
      return t.hoursBefore(Number(v));
    case "photos":
      return `${(v as string[]).length}`;
    case "day_contact": {
      const c = v as { name?: string; phone?: string };
      return [c.name, c.phone].filter(Boolean).join(" · ");
    }
    case "public_price": {
      const p = v as { adult?: number; child?: number };
      return [p.adult != null ? `${p.adult}` : null, p.child != null ? `${p.child}` : null].filter(Boolean).join(" / ");
    }
    case "check_in_out": {
      const c = v as { check_in?: string; check_out?: string };
      return [c.check_in, c.check_out].filter(Boolean).join(" → ");
    }
    default:
      if (Array.isArray(v)) return (v as unknown[]).join(" · ");
      return String(v);
  }
}

// ── Messages WhatsApp (copiés par l'équipe, jamais envoyés seuls) ───────────────────────────────

function langOf(language: string | null | undefined): PartnerLang {
  return language === "he" || language === "fr" ? language : "en";
}

export function partnerLinkUrl(origin: string, token: string): string {
  return `${origin.replace(/\/$/, "")}/partner/link/${token}`;
}

/** Le message qui accompagne le lien personnel. */
export function buildLinkMessage(params: { language: string | null | undefined; contactName: string | null | undefined; url: string }): string {
  const lang = langOf(params.language);
  const name = params.contactName?.trim();
  if (lang === "he") {
    return `${name ? `שלום ${name},` : "שלום,"}\nהכנו עבורכם את המודעה ב-STAYMAKOM. בקישור הזה תוכלו לראות אותה, לאשר כל חלק ולראות מה נשאר לעשות כדי לעלות לאוויר:\n${params.url}\nצוות STAYMAKOM`;
  }
  if (lang === "fr") {
    return `${name ? `Bonjour ${name},` : "Bonjour,"}\nNous avons préparé votre annonce STAYMAKOM. Avec ce lien, vous la voyez, vous confirmez chaque partie et vous savez ce qu'il reste à faire pour la mise en ligne :\n${params.url}\nL'équipe STAYMAKOM`;
  }
  return `${name ? `Hello ${name},` : "Hello,"}\nWe have prepared your STAYMAKOM listing. With this link you can see it, confirm each part and check what is left before going live:\n${params.url}\nThe STAYMAKOM team`;
}

/** La relance qui nomme l'étape en attente. */
export function buildReminderMessage(params: {
  language: string | null | undefined;
  contactName: string | null | undefined;
  stepKey: string;
  url: string;
}): string {
  const lang = langOf(params.language);
  const step = GOLIVE_TEXTS[lang].steps[params.stepKey] ?? params.stepKey;
  const name = params.contactName?.trim();
  if (lang === "he") {
    return `${name ? `שלום ${name},` : "שלום,"}\nנשאר רק שלב אחד בצד שלכם כדי להתקדם: «${step}». זה לוקח כמה דקות, מהטלפון:\n${params.url}\nצוות STAYMAKOM`;
  }
  if (lang === "fr") {
    return `${name ? `Bonjour ${name},` : "Bonjour,"}\nIl reste une étape de votre côté pour avancer : « ${step} ». Cela prend quelques minutes, depuis votre téléphone :\n${params.url}\nL'équipe STAYMAKOM`;
  }
  return `${name ? `Hello ${name},` : "Hello,"}\nThere is one step left on your side to move forward: "${step}". It takes a few minutes, from your phone:\n${params.url}\nThe STAYMAKOM team`;
}
