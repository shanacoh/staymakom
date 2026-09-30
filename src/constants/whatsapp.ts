export const WHATSAPP_NUMBER = "972555009910";

export const WHATSAPP_MESSAGES = {
  fr: "Bonjour ! J'aimerais en savoir plus sur vos expériences",
  en: "Hello! I'd love to learn more about your experiences",
  he: "שלום! אני מעוניין/ת לשמוע עוד על החוויות שלכם",
};

export type WhatsappMessageVariant = "site" | "ig" | "tiktok" | "google" | "facebook";

const ENTRY_SOURCE_MARKERS: Record<string, string> = {
  instagram: " 🙏🏽",
  tiktok: " 🙌🏽",
  google: " ☀️",
  facebook: " 👋🏽",
};

// Marqueur discret selon la source d'arrivée (entry_source) : ajouté en fin de
// message, aucune autre différence de contenu.
export function buildWhatsappMessage(lang: keyof typeof WHATSAPP_MESSAGES, entrySource?: string): string {
  const template = WHATSAPP_MESSAGES[lang] ?? WHATSAPP_MESSAGES.en;
  const marker = entrySource ? ENTRY_SOURCE_MARKERS[entrySource] : undefined;
  return marker ? `${template}${marker}` : template;
}

export function getWhatsappMessageVariant(entrySource?: string): WhatsappMessageVariant {
  if (entrySource === "instagram") return "ig";
  if (entrySource === "tiktok") return "tiktok";
  if (entrySource === "google") return "google";
  if (entrySource === "facebook") return "facebook";
  return "site";
}
