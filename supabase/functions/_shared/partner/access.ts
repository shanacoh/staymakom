// Accès à l'espace partenaire : fabriquer un lien de connexion à usage unique (« lien magique »)
// et l'envoyer par email dans la langue du prestataire. Pas de mot de passe.
//
// Le lien mène à la page de connexion du site avec un jeton ; c'est la page qui l'échange contre
// une session, après un clic du prestataire. Un aperçu de lien (WhatsApp, antivirus de messagerie)
// ne peut donc pas « consommer » le lien à sa place.

import { PARTNER_SITE_URL, renderPartnerEmail, sendPartnerEmail, type PartnerLang } from "./email.ts";

// deno-lint-ignore no-explicit-any
type ServiceClient = any;

export const partnerLoginPageUrl = (email?: string) =>
  `${PARTNER_SITE_URL}/partner/login${email ? `?email=${encodeURIComponent(email)}` : ""}`;

/** Lien de connexion à usage unique pour un compte existant. */
export async function createPartnerLoginLink(serviceClient: ServiceClient, email: string): Promise<string> {
  const { data, error } = await serviceClient.auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw error;
  const tokenHash = data?.properties?.hashed_token;
  if (!tokenHash) throw new Error("Lien de connexion introuvable dans la réponse");
  return `${PARTNER_SITE_URL}/partner/login?token_hash=${encodeURIComponent(tokenHash)}`;
}

const TEXTS: Record<PartnerLang, {
  eyebrow: string;
  inviteSubject: string;
  inviteBanner: string;
  inviteSub: string;
  inviteIntro: (provider: string) => string;
  loginSubject: string;
  loginBanner: string;
  loginIntro: string;
  hello: (name: string) => string;
  cta: string;
  footnote: string;
  contact: string;
}> = {
  en: {
    eyebrow: "Partner space",
    inviteSubject: "Your STAYMAKOM partner space is ready",
    inviteBanner: "Welcome to your partner space",
    inviteSub: "Bookings, availability and practical details in one place",
    inviteIntro: (provider) =>
      `The STAYMAKOM team has opened a partner space for ${provider}.\nYou will find your upcoming bookings, manage your availability yourself and send us any change you would like on your experiences.\n\nNo password needed: the button below logs you in.`,
    loginSubject: "Your login link to the STAYMAKOM partner space",
    loginBanner: "Your login link",
    loginIntro: "Tap the button below to open your partner space. No password needed.",
    hello: (name) => `Hello ${name},`,
    cta: "Open my space",
    footnote: "This link works once and expires quickly. You can ask for a new one at any time from the login page.",
    contact: "A question? Simply reply to this email. The STAYMAKOM team",
  },
  fr: {
    eyebrow: "Espace partenaire",
    inviteSubject: "Votre espace partenaire STAYMAKOM est prêt",
    inviteBanner: "Bienvenue dans votre espace partenaire",
    inviteSub: "Réservations, disponibilités et infos pratiques au même endroit",
    inviteIntro: (provider) =>
      `L'équipe STAYMAKOM a ouvert un espace partenaire pour ${provider}.\nVous y trouverez vos prochaines réservations, vous y gérez vous-même vos disponibilités et vous nous proposez les modifications que vous souhaitez sur vos expériences.\n\nPas de mot de passe : le bouton ci-dessous vous connecte.`,
    loginSubject: "Votre lien de connexion à l'espace partenaire STAYMAKOM",
    loginBanner: "Votre lien de connexion",
    loginIntro: "Appuyez sur le bouton ci-dessous pour ouvrir votre espace partenaire. Pas de mot de passe.",
    hello: (name) => `Bonjour ${name},`,
    cta: "Ouvrir mon espace",
    footnote: "Ce lien fonctionne une seule fois et expire rapidement. Vous pouvez en demander un nouveau à tout moment depuis la page de connexion.",
    contact: "Une question ? Répondez simplement à cet email. L'équipe STAYMAKOM",
  },
  he: {
    eyebrow: "אזור השותפים",
    inviteSubject: "אזור השותפים שלך ב-STAYMAKOM מוכן",
    inviteBanner: "ברוכים הבאים לאזור השותפים",
    inviteSub: "הזמנות, זמינות ומידע מעשי במקום אחד",
    inviteIntro: (provider) =>
      `צוות STAYMAKOM פתח אזור שותפים עבור ${provider}.\nכאן תמצאו את ההזמנות הקרובות, תנהלו בעצמכם את הזמינות ותציעו לנו שינויים בחוויות שלכם.\n\nאין צורך בסיסמה: הכפתור למטה מחבר אתכם.`,
    loginSubject: "קישור הכניסה שלך לאזור השותפים של STAYMAKOM",
    loginBanner: "קישור הכניסה שלך",
    loginIntro: "לחצו על הכפתור למטה כדי לפתוח את אזור השותפים. אין צורך בסיסמה.",
    hello: (name) => `שלום ${name},`,
    cta: "כניסה לאזור שלי",
    footnote: "הקישור תקף לשימוש אחד ופג במהירות. אפשר לבקש קישור חדש בכל עת מדף הכניסה.",
    contact: "יש שאלה? אפשר פשוט להשיב למייל הזה. צוות STAYMAKOM",
  },
};

/** Envoie l'invitation (première fois) ou un simple lien de connexion. */
export async function sendPartnerAccessEmail(
  serviceClient: ServiceClient,
  params: { kind: "invite" | "login"; email: string; lang: PartnerLang; providerName: string; contactName?: string | null },
): Promise<{ ok: boolean; details?: string }> {
  const t = TEXTS[params.lang];
  const link = await createPartnerLoginLink(serviceClient, params.email);
  const invite = params.kind === "invite";
  const html = renderPartnerEmail({
    lang: params.lang,
    eyebrow: t.eyebrow,
    banner: invite ? t.inviteBanner : t.loginBanner,
    bannerSub: invite ? t.inviteSub : undefined,
    greeting: t.hello(params.contactName?.trim() || params.providerName),
    intro: invite ? t.inviteIntro(params.providerName) : t.loginIntro,
    cta: { label: t.cta, url: link },
    footnote: t.footnote,
    contact: t.contact,
  });
  return sendPartnerEmail([params.email], invite ? t.inviteSubject : t.loginSubject, html);
}
