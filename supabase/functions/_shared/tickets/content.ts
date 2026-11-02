// Billets d'entrée envoyés par le prestataire : le seul endroit qui décide comment on reconnaît un
// fichier billet et comment on en parle au client (email « Vos billets », page billet, confirmation,
// rappel de la veille), en anglais, français et hébreu.
//
// Fichier sans aucune dépendance : lu par les fonctions serveur et par le site (page /billet/<jeton>,
// back-office). On ne génère jamais de billet : on transmet le fichier du prestataire tel quel.

import type { PracticalLang } from "../practical-info/content.ts";

export type TicketFileType = "pdf" | "image" | "pkpass";

export const TICKETS_BUCKET = "booking-tickets";
export const TICKET_PAGE_BASE_URL = "https://staymakom.com/billet/";

/** Types acceptés au dépôt (sélecteur de fichiers du back-office). */
export const TICKET_ACCEPT = ".pdf,.png,.jpg,.jpeg,.pkpass,application/pdf,image/png,image/jpeg,application/vnd.apple.pkpass";

const MIME_BY_EXTENSION: Record<string, { type: TicketFileType; mime: string }> = {
  pdf: { type: "pdf", mime: "application/pdf" },
  png: { type: "image", mime: "image/png" },
  jpg: { type: "image", mime: "image/jpeg" },
  jpeg: { type: "image", mime: "image/jpeg" },
  pkpass: { type: "pkpass", mime: "application/vnd.apple.pkpass" },
};

/**
 * Type et format d'un fichier billet, d'après son extension (le navigateur ne connaît souvent pas
 * le format .pkpass). `null` si le fichier n'est pas un billet accepté.
 */
export function detectTicketFile(fileName: string): { type: TicketFileType; mime: string; extension: string } | null {
  const extension = (fileName.split(".").pop() || "").toLowerCase();
  const known = MIME_BY_EXTENSION[extension];
  return known ? { ...known, extension } : null;
}

/** Nom du fichier joint à l'email : le nom d'origine, précédé du libellé s'il existe. */
export function ticketAttachmentName(originalName: string, label?: string | null): string {
  const cleanLabel = (label || "").trim().replace(/[\\/:*?"<>|]/g, "-");
  return cleanLabel ? `${cleanLabel} - ${originalName}` : originalName;
}

export function ticketPageUrl(token: string): string {
  return `${TICKET_PAGE_BASE_URL}${token}`;
}

export const TICKET_TEXTS: Record<PracticalLang, {
  eyebrow: string;
  subject: (title: string, date: string) => string;
  guests: (count: number) => string;
  openTickets: string;
  showCode: string;
  attached: string;
  question: string;
  questionLink: string;
  confirmationNotice: string;
  brightnessTip: string;
  downloadPdf: string;
  addToWallet: string;
  openFile: string;
  loading: string;
  unavailableTitle: string;
  unavailableBody: string;
}> = {
  en: {
    eyebrow: "Your tickets",
    subject: (title, date) => `Your tickets · ${title}, ${date}`,
    guests: (count) => `${count} guest${count > 1 ? "s" : ""}`,
    openTickets: "Open my tickets",
    showCode: "Show this code at the entrance, on your phone or printed.",
    attached: "Your tickets are also attached to this email.",
    question: "A question? Our team answers on WhatsApp",
    questionLink: "Write to us",
    confirmationNotice: "Your entry tickets will be sent to you separately before the experience.",
    brightnessTip: "Tip: turn up your screen brightness at the entrance.",
    downloadPdf: "Download the PDF",
    addToWallet: "Add to Apple Wallet",
    openFile: "Open the file",
    loading: "Loading your ticket…",
    unavailableTitle: "This ticket is no longer available",
    unavailableBody: "If you think this is a mistake, our team answers on WhatsApp.",
  },
  fr: {
    eyebrow: "Vos billets",
    subject: (title, date) => `Vos billets · ${title}, ${date}`,
    guests: (count) => `${count} participant${count > 1 ? "s" : ""}`,
    openTickets: "Ouvrir mes billets",
    showCode: "Présentez ce code à l'entrée, depuis votre téléphone ou imprimé.",
    attached: "Vos billets sont aussi joints à cet email.",
    question: "Une question ? Notre équipe vous répond sur WhatsApp",
    questionLink: "Nous écrire",
    confirmationNotice: "Vos billets d'entrée vous seront envoyés séparément avant l'expérience.",
    brightnessTip: "Astuce : montez la luminosité de votre écran à l'entrée.",
    downloadPdf: "Télécharger le PDF",
    addToWallet: "Ajouter à Apple Wallet",
    openFile: "Ouvrir le fichier",
    loading: "Chargement du billet…",
    unavailableTitle: "Ce billet n'est plus disponible",
    unavailableBody: "Si vous pensez qu'il s'agit d'une erreur, notre équipe vous répond sur WhatsApp.",
  },
  he: {
    eyebrow: "הכרטיסים שלכם",
    subject: (title, date) => `הכרטיסים שלכם · ${title}, ${date}`,
    guests: (count) => (count === 1 ? "משתתף אחד" : `${count} משתתפים`),
    openTickets: "לפתיחת הכרטיסים",
    showCode: "יש להציג את הקוד בכניסה, מהטלפון או מודפס.",
    attached: "הכרטיסים מצורפים גם למייל הזה.",
    question: "יש שאלה? הצוות שלנו עונה בוואטסאפ",
    questionLink: "לכתוב לנו",
    confirmationNotice: "כרטיסי הכניסה יישלחו אליכם בנפרד לפני החוויה.",
    brightnessTip: "טיפ: הגבירו את בהירות המסך בכניסה.",
    downloadPdf: "להורדת ה-PDF",
    addToWallet: "הוספה ל-Apple Wallet",
    openFile: "לפתיחת הקובץ",
    loading: "הכרטיס נטען…",
    unavailableTitle: "הכרטיס הזה כבר לא זמין",
    unavailableBody: "אם נראה לכם שזו טעות, הצוות שלנו עונה בוואטסאפ.",
  },
};

/** « date · heure · participants », en sautant ce qui est vide. */
export function ticketSummaryLine(parts: { date: string; time?: string | null; partySize?: number | null }, lang: PracticalLang): string {
  const guests = parts.partySize && parts.partySize > 0 ? TICKET_TEXTS[lang].guests(parts.partySize) : "";
  return [parts.date, parts.time || "", guests].filter((part) => part.trim() !== "").join(" · ");
}

const SHORT_DATE_LOCALES: Record<PracticalLang, string> = { en: "en-US", fr: "fr-FR", he: "he-IL" };

/** Date courte pour l'objet de l'email (ex. « 12 novembre »). */
export function formatShortDate(dateStr: string, lang: PracticalLang): string {
  const date = new Date(`${dateStr.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString(SHORT_DATE_LOCALES[lang], { day: "numeric", month: "long", timeZone: "UTC" });
}
