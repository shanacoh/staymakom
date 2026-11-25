// Contrôles de fond avant publication automatique. Un seul échec = article « bloqué »
// (jamais publié tout seul), avec la raison affichée dans le back-office et l'email.
//  - aucun nom de prestataire d'expérience (table providers + variantes connues) ;
//  - aucune adresse exacte d'expérience ;
//  - aucun mot de la liste « sécurité / guerre / politique » (3 langues, modifiable) ;
//  - pas de doublon (même mot-clé principal, même langue, déjà programmé ou publié).
import type { JournalLang } from "./types.ts";

export interface ProviderName {
  name: string;
  provider_type: string | null;
}

const HEBREW = /[\u0590-\u05FF]/;
// Préfixes hébreux collés au mot (ו, ב, ל, ה, מ, ש, כ, jusqu'à deux lettres : « ובמלחמה »).
const HE_PREFIX = "[\\u05D5\\u05D1\\u05DC\\u05D4\\u05DE\\u05E9\\u05DB]{0,2}";

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Recherche d'un mot ou d'une expression entière (pas à l'intérieur d'un autre mot). */
export function termRegex(term: string, caseSensitive = false): RegExp {
  const body = escapeRe(term.trim()).replace(/\s+/g, "\\s+").replace(/['’]/g, "['’]");
  if (HEBREW.test(term)) {
    // Hébreu : préfixes collés acceptés, terminaisons (pluriel, possessif) aussi.
    return new RegExp(`(^|[^\\u0590-\\u05FF])${HE_PREFIX}${body}`, "u");
  }
  return new RegExp(`(^|[^\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])`, caseSensitive ? "u" : "iu");
}

/** Nom de prestataire nettoyé : sans parenthèses ni tirets de fin (« Time Elevator (Jerusalem) »). */
export function cleanProviderName(name: string): string {
  return name.replace(/\([^)]*\)/g, " ").replace(/[-–—\s]+$/g, "").replace(/\s+/g, " ").trim();
}

/** Prestataires d'expérience et de bateau (les hôtels peuvent être nommés). */
export function providerTerms(providers: ProviderName[], aliases: string[], allowlist: string[]): string[] {
  const allowed = new Set(allowlist.map((a) => a.trim().toLowerCase()));
  const names = providers
    .filter((p) => p.provider_type !== "hotel")
    .map((p) => cleanProviderName(p.name))
    .concat(aliases.map(cleanProviderName))
    .filter((n) => n.length >= 3 && !allowed.has(n.toLowerCase()));
  return [...new Set(names)];
}

/** Un nom court tout en majuscules (« MARK », « B.OZ ») ne se cherche qu'en majuscules. */
function isCaseSensitiveName(name: string): boolean {
  return name.length <= 5 && name === name.toUpperCase() && /[A-Z]/.test(name);
}

export function findProviderNames(text: string, terms: string[]): string[] {
  return terms.filter((t) => termRegex(t, isCaseSensitiveName(t)).test(text));
}

export function findForbiddenWords(text: string, words: string[]): string[] {
  return words.filter((w) => w.trim() && termRegex(w).test(text));
}

// Formes d'adresse postale : « 12 Herzl Street », « rue X 12 », « רחוב הרצל 12 », code postal.
const ADDRESS_PATTERNS: RegExp[] = [
  /\b\d{1,4}\s+[A-Z][\p{L}'-]+(\s+[A-Z][\p{L}'-]+)?\s+(Street|St\.|Road|Rd\.|Avenue|Ave\.|Boulevard|Blvd\.?)(?![\p{L}])/u,
  /\b(Street|St\.|Road|Avenue|Boulevard)\s+\d{1,4}\b/u,
  /\b\d{1,4},?\s+(rue|avenue|boulevard|chemin|allée)\s+\p{L}/iu,
  /\b(rue|avenue|boulevard)\s+[\p{L}' -]{2,30}\s+\d{1,4}\b/iu,
  /(^|[^\u0590-\u05FF])[ובלהמ]{0,2}(רחוב|רח'|שדרות|שד')\s+[\u0590-\u05FF"' -]{2,30}\s+\d{1,4}/u,
  /\b\d{7}\b/, // code postal israélien
];

/** Morceau « rue » d'une adresse de fiche (avant la première virgule), s'il est assez précis. */
export function streetPart(address: string | null): string | null {
  if (!address) return null;
  const first = address.split(",")[0].trim();
  if (first.length < 6) return null;
  // Une adresse précise contient un numéro, ou un mot de rue.
  if (!/\d/.test(first) && !/\b(street|st\.|road|rd|avenue|blvd|rue|רחוב)\b/i.test(first)) return null;
  return first;
}

export function findAddresses(text: string, listingAddresses: (string | null)[]): string[] {
  const found: string[] = [];
  for (const re of ADDRESS_PATTERNS) {
    const m = text.match(re);
    if (m) found.push(m[0].trim());
  }
  for (const address of listingAddresses) {
    const street = streetPart(address);
    if (street && text.toLowerCase().includes(street.toLowerCase())) found.push(street);
  }
  return [...new Set(found)];
}

export interface CheckInput {
  text: string;
  lang: JournalLang;
  providerTerms: string[];
  forbiddenWords: Partial<Record<JournalLang, string[]>>;
  listingAddresses: (string | null)[];
  /** Grandes chaînes (cafés, boulangeries, restaurants) jamais citées. */
  chainNames?: string[];
  /** Un article programmé ou publié a déjà ce mot-clé dans cette langue. */
  duplicateOf: string | null;
}

/** Raisons de blocage (vide = l'article peut être programmé). */
export function runContentChecks(input: CheckInput): string[] {
  const reasons: string[] = [];
  const providers = findProviderNames(input.text, input.providerTerms);
  if (providers.length) reasons.push(`Nom de prestataire cité : ${providers.join(", ")}`);
  const addresses = findAddresses(input.text, input.listingAddresses);
  if (addresses.length) reasons.push(`Adresse exacte repérée : ${addresses.join(" ; ")}`);
  const forbidden = findForbiddenWords(input.text, input.forbiddenWords[input.lang] || []);
  if (forbidden.length) reasons.push(`Mot interdit (sécurité / politique) : ${forbidden.join(", ")}`);
  const chains = findProviderNames(input.text, input.chainNames || []);
  if (chains.length) reasons.push(`Grande chaîne citée : ${chains.join(", ")}`);
  if (input.duplicateOf) reasons.push(`Doublon : même mot-clé principal que « ${input.duplicateOf} »`);
  return reasons;
}
