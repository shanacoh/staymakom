// Ce que le site ENVOIE (demandes, réservations, emails) depuis une page en espagnol,
// russe ou allemand. Fonctions « pures », testées dans writeBack.test.ts.
//
// Deux règles :
// 1. Le back-office et les emails internes parlent anglais : tout nom de fiche affiché
//    traduit (titre d'expérience, de bateau, option, extra...) repart en anglais.
// 2. La langue de la page (client_locale) accompagne la demande, pour le badge du back-office.

import type { AutoLocale } from "@/lib/locale";

/** Tables où le site enregistre lui-même une demande, et qui ont la colonne client_locale. */
export const CLIENT_LOCALE_TABLES = new Set(["standalone_experience_requests"]);

/** Fonctions serveur qui enregistrent client_locale sur la réservation ou la demande créée. */
export const CLIENT_LOCALE_FUNCTIONS = new Set([
  "process-standalone-payment", // réservation d'expérience
  "process-booking", // réservation d'hôtel
  "submit-tailor-made-request", // demande sur-mesure
]);

/** Remplace chaque texte traduit par son anglais d'origine, partout dans les données envoyées. */
export function restoreEnglish(value: unknown, englishOf: ReadonlyMap<string, string>): unknown {
  if (typeof value === "string") return englishOf.get(value) ?? value;
  if (Array.isArray(value)) return value.map((item) => restoreEnglish(item, englishOf));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, restoreEnglish(item, englishOf)]),
    );
  }
  return value;
}

/** Ajoute la langue de la page à un objet (ou à chaque ligne d'une liste), sans écraser. */
export function withClientLocale(value: unknown, locale: AutoLocale): unknown {
  if (Array.isArray(value)) return value.map((item) => withClientLocale(item, locale));
  if (value && typeof value === "object" && !("client_locale" in (value as object))) {
    return { ...(value as Record<string, unknown>), client_locale: locale };
  }
  return value;
}

export type WriteTarget =
  | { kind: "function"; name: string }
  | { kind: "table"; table: string; insert: boolean }
  | { kind: "other" };

/** Ce que vise un envoi : une fonction serveur, une table de la base, ou autre chose. */
export function writeTarget(url: URL, method: string): WriteTarget {
  const fn = url.pathname.match(/\/functions\/v1\/([\w-]+)$/)?.[1];
  if (fn) return { kind: "function", name: fn };
  const table = url.pathname.match(/\/rest\/v1\/([\w]+)$/)?.[1];
  if (table && table !== "rpc") return { kind: "table", table, insert: method === "POST" };
  return { kind: "other" };
}

/**
 * Corps à envoyer à la place du corps d'origine (texte JSON), ou null s'il n'y a rien à changer.
 */
export function rewriteWriteBody(
  body: string,
  target: WriteTarget,
  locale: AutoLocale,
  englishOf: ReadonlyMap<string, string>,
): string | null {
  if (target.kind === "other") return null;
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    return null;
  }
  let next = englishOf.size > 0 ? restoreEnglish(data, englishOf) : data;
  const addsLocale =
    (target.kind === "function" && CLIENT_LOCALE_FUNCTIONS.has(target.name)) ||
    (target.kind === "table" && target.insert && CLIENT_LOCALE_TABLES.has(target.table));
  if (addsLocale) next = withClientLocale(next, locale);
  const out = JSON.stringify(next);
  return out === body ? null : out;
}
