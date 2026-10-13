// Message WhatsApp d'invitation à l'espace partenaire, dans la langue du prestataire.
// Rien n'est envoyé automatiquement : le back-office propose de le copier ou d'ouvrir WhatsApp.
// Le lien mène à la page de connexion (email pré-rempli), où le prestataire demande son lien :
// contrairement au lien de l'email, celui-ci n'expire pas.

export type InviteLang = "he" | "en" | "fr";

export const PARTNER_LOGIN_URL = "https://staymakom.com/partner/login";

export function partnerLoginUrl(email: string | null | undefined): string {
  const clean = (email ?? "").trim().toLowerCase();
  return clean ? `${PARTNER_LOGIN_URL}?email=${encodeURIComponent(clean)}` : PARTNER_LOGIN_URL;
}

const MESSAGES: Record<InviteLang, (name: string, url: string) => string> = {
  fr: (name, url) =>
    `Bonjour${name ? ` ${name}` : ""}, votre espace partenaire STAYMAKOM est prêt : réservations, disponibilités et infos pratiques au même endroit.\n\nPour y entrer, ouvrez ce lien et demandez votre lien de connexion (pas de mot de passe) :\n${url}\n\nL'équipe STAYMAKOM`,
  en: (name, url) =>
    `Hello${name ? ` ${name}` : ""}, your STAYMAKOM partner space is ready: bookings, availability and practical details in one place.\n\nTo get in, open this link and ask for your login link (no password needed):\n${url}\n\nThe STAYMAKOM team`,
  he: (name, url) =>
    `שלום${name ? ` ${name}` : ""}, אזור השותפים שלך ב-STAYMAKOM מוכן: הזמנות, זמינות ומידע מעשי במקום אחד.\n\nכדי להיכנס, פתחו את הקישור ובקשו קישור כניסה (אין צורך בסיסמה):\n${url}\n\nצוות STAYMAKOM`,
};

export const inviteLang = (value: string | null | undefined): InviteLang => (value === "he" || value === "fr" ? value : "en");

export function buildInviteMessage(params: { language: string | null | undefined; contactName: string | null | undefined; email: string | null | undefined }): string {
  return MESSAGES[inviteLang(params.language)]((params.contactName ?? "").trim(), partnerLoginUrl(params.email));
}

/** Lien « Ouvrir WhatsApp » vers un numéro, message pré-rempli. `null` si le numéro n'est pas exploitable. */
export function whatsappInviteUrl(phone: string | null | undefined, message: string): string | null {
  let digits = (phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  // Numéro israélien saisi sans indicatif : 05x... devient 9725x...
  else if (digits.startsWith("0")) digits = `972${digits.slice(1)}`;
  if (digits.length < 9) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
