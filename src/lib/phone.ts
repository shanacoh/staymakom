// Numéros de téléphone des clients : un seul format partout, l'international (« +972541234567 »).
// Le client choisit son pays et tape son numéro comme il en a l'habitude (« 054… », « 06… ») ;
// on retire le 0 national et on ajoute l'indicatif. C'est ce format que Revolut, HyperGuest et
// les liens WhatsApp du back-office savent lire.

// Indicatifs proposés, les plus fréquents d'abord. `region` = code pays (ISO), sert à écrire le
// nom du pays dans la langue de la page (voir countryName).
export const DIAL_CODES: { code: string; label: string; region: string }[] = [
  { code: "+972", label: "🇮🇱 +972", region: "IL" },
  { code: "+33", label: "🇫🇷 +33", region: "FR" },
  { code: "+1", label: "🇺🇸 +1", region: "US" },
  { code: "+44", label: "🇬🇧 +44", region: "GB" },
  { code: "+32", label: "🇧🇪 +32", region: "BE" },
  { code: "+41", label: "🇨🇭 +41", region: "CH" },
  { code: "+352", label: "🇱🇺 +352", region: "LU" },
  { code: "+377", label: "🇲🇨 +377", region: "MC" },
  { code: "+49", label: "🇩🇪 +49", region: "DE" },
  { code: "+34", label: "🇪🇸 +34", region: "ES" },
  { code: "+39", label: "🇮🇹 +39", region: "IT" },
  { code: "+31", label: "🇳🇱 +31", region: "NL" },
  { code: "+351", label: "🇵🇹 +351", region: "PT" },
  { code: "+43", label: "🇦🇹 +43", region: "AT" },
  { code: "+7", label: "🇷🇺 +7", region: "RU" },
  { code: "+61", label: "🇦🇺 +61", region: "AU" },
  { code: "+55", label: "🇧🇷 +55", region: "BR" },
  { code: "+52", label: "🇲🇽 +52", region: "MX" },
  { code: "+54", label: "🇦🇷 +54", region: "AR" },
  { code: "+27", label: "🇿🇦 +27", region: "ZA" },
  { code: "+971", label: "🇦🇪 +971", region: "AE" },
];

/**
 * Nom du pays dans la langue de la page (« Israël », « Израиль », « Spanien »...), écrit par le
 * navigateur lui-même : aucune liste de noms à traduire ni à tenir à jour. Code pays si le
 * navigateur ne sait pas faire.
 */
export function countryName(region: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(region) ?? region;
  } catch {
    return region;
  }
}

/** Indicatif proposé par défaut : la France pour le site en français, Israël sinon. */
export function defaultDialCode(lang: string): string {
  return lang === "fr" ? "+33" : "+972";
}

/**
 * Numéro complet à partir de l'indicatif choisi et de ce que le client a tapé.
 * - « 054-123 4567 » avec +972 → « +972541234567 » (le 0 national est retiré) ;
 * - un numéro tapé avec son propre indicatif (« +33 6… » ou « 0033 6… ») est gardé tel quel ;
 * - l'Italie garde son 0 (il fait partie du numéro).
 */
export function composePhone(dialCode: string, typed: string): string {
  const trimmed = typed.trim();
  if (trimmed.startsWith("+") || trimmed.startsWith("00")) return cleanInternational(trimmed);
  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  if (dialCode !== "+39") digits = digits.replace(/^0+/, "");
  return dialCode + digits;
}

function cleanInternational(raw: string): string {
  return repairStoredPhone("+" + raw.replace(/\D/g, "").replace(/^00/, ""));
}

/** Sépare un numéro enregistré en indicatif connu + reste, pour réafficher le champ. */
export function splitPhone(phone: string, fallbackDialCode: string): { dialCode: string; local: string } {
  const value = phone.trim();
  if (!value.startsWith("+")) return { dialCode: fallbackDialCode, local: value };
  const match = [...DIAL_CODES]
    .sort((a, b) => b.code.length - a.code.length)
    .find((d) => value.replace(/\s/g, "").startsWith(d.code));
  if (!match) return { dialCode: fallbackDialCode, local: value };
  return { dialCode: match.code, local: value.replace(/\s/g, "").slice(match.code.length) };
}

/**
 * Le numéro a-t-il une forme crédible ? Sert uniquement à afficher un message sous le champ,
 * jamais à bloquer une réservation.
 */
export function isPlausiblePhone(phone: string): boolean {
  if (phone.startsWith("+972")) return /^\+972[2-9]\d{7,8}$/.test(phone);
  if (phone.startsWith("+33")) return /^\+33[1-9]\d{8}$/.test(phone);
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

/**
 * Répare un numéro enregistré avant l'arrivée du sélecteur de pays :
 * - « +05X… » ou « 05X… » (10 chiffres en tout) : numéro de portable israélien → « +9725X… » ;
 * - préfixe « 00 » ou « +00 » → « + ».
 * Les autres numéros sont rendus nettoyés des espaces, sans rien deviner.
 */
export function repairStoredPhone(phone: string | null | undefined): string {
  const raw = (phone ?? "").replace(/[\s\-().]/g, "");
  if (!raw) return "";
  const israeliMobile = raw.match(/^\+?0(5\d{8})$/);
  if (israeliMobile) return `+972${israeliMobile[1]}`;
  if (raw.startsWith("+00")) return "+" + raw.slice(3);
  if (raw.startsWith("00")) return "+" + raw.slice(2);
  return raw;
}

/** Chiffres attendus par un lien wa.me (sans « + »), à partir d'un numéro éventuellement ancien. */
export function whatsAppDigits(phone: string | null | undefined): string {
  return repairStoredPhone(phone).replace(/\D/g, "");
}
