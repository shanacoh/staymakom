// Messages WhatsApp pré-remplis de la zone Réservations (prestataire et client), partagés
// entre le panneau des demandes et les boutons « Prochaine action ».

import { format, parseISO } from "date-fns";
import { WHATSAPP_NUMBER } from "@/constants/whatsapp";

/* eslint-disable @typescript-eslint/no-explicit-any */

// wa.me exige un numéro sans espaces ni "+" — construit un message pré-rempli
// pour que l'admin n'ait qu'à cliquer "Envoyer" sur WhatsApp Web/mobile.
export function buildWhatsAppLink(phone: string, text: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function durationLabel(minutes: number | null): string {
  if (!minutes) return "";
  return minutes % 60 === 0 ? `${minutes / 60}h` : `${Math.floor(minutes / 60)}h${minutes % 60}`;
}

// Message au prestataire, en anglais — l'hébreu mélangé avec le nom du bateau
// (toujours en alphabet latin) et les autres infos produisait un texte bidirectionnel
// illisible sur WhatsApp. L'anglais reste compris par tous les prestataires actuels.
export function buildProviderMessage(request: any): string {
  // Le nom envoyé au prestataire est le sien (supplier_boat_name), pas le nom
  // client STAYMAKOM : certains prestataires appellent leur bateau autrement.
  const boatName = request.standalone_experiences?.supplier_boat_name
    || request.standalone_experiences?.title
    || request.preferred_city
    || "a boat";
  // Le pop-up rapide (bouton WhatsApp des cartes) ne connaît qu'une fourchette
  // large ("aujourd'hui ou demain"...), stockée dans `message` sans date exacte :
  // on l'utilise comme texte de date, jamais comme une note à part collée en français.
  const isQuickRequest = request.source === "card_whatsapp";
  const dateTxt = request.requested_date
    ? format(parseISO(request.requested_date), "dd/MM/yyyy")
    : (isQuickRequest && request.message) ? request.message : "flexible";
  const timeMap: Record<string, string> = { morning: "morning", afternoon: "afternoon", sunset: "sunset", precise: request.desired_time_value || "" };
  const timeTxt = request.desired_time_period ? (timeMap[request.desired_time_period] || request.desired_time_period) : "flexible";
  // Une seule valeur (pas de fourchette artificielle "2-2") quand min et max sont identiques.
  const partyTxt = request.party_max && request.party_max !== request.adults
    ? `${request.adults}-${request.party_max}`
    : `around ${request.adults}`;
  const durationTxt = durationLabel(request.requested_duration_minutes) || "not specified";
  const notesLine = (!isQuickRequest && request.message) ? ` Notes: ${request.message}.` : "";
  return `Hi, new request from STAYMAKOM: ${boatName}, ${dateTxt}, ${timeTxt}, ${partyTxt} people, ${durationTxt}.${notesLine} Any availability? Thanks!`;
}

export type FollowUpLanguage = "fr" | "en" | "he";

export const FOLLOW_UP_LANGUAGES: { value: FollowUpLanguage; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "he", label: "עברית" },
];

// Relance d'un client dont le paiement en ligne n'a pas abouti, dans la langue choisie.
// En hébreu, la formulation évite d'accorder au masculin ou au féminin.
export function buildPaymentFollowUpMessage(clientName: string, product: string, language: FollowUpLanguage = "fr"): string {
  switch (language) {
    case "en":
      return `Hi ${clientName}, this is Shana from Staymakom. I saw that your payment for "${product}" didn't go through. Would you like me to help you complete your booking?`;
    case "he":
      return `היי ${clientName}, כאן שנה מ-Staymakom. ראיתי שהתשלום עבור "${product}" לא הושלם. אפשר לעזור להשלים את ההזמנה?`;
    default:
      return `Bonjour ${clientName}, ici Shana de Staymakom. J'ai vu que votre paiement pour « ${product} » n'a pas abouti. Souhaitez-vous que je vous aide à finaliser votre réservation ?`;
  }
}

// Le prestataire n'a pas de disponibilité : on prévient le client et on lui propose autre chose.
export function buildNotAvailableMessage(clientName: string, alternativesUrl: string, language: FollowUpLanguage = "fr"): string {
  switch (language) {
    case "en":
      return `Hi ${clientName}, this is Shana from Staymakom. Unfortunately this slot isn't available after all. Here are other options that might work for you: ${alternativesUrl}`;
    case "he":
      return `היי ${clientName}, כאן שנה מ-Staymakom. לצערי המועד הזה לא זמין בסופו של דבר. הנה אפשרויות נוספות שיכולות להתאים: ${alternativesUrl}`;
    default:
      return `Bonjour ${clientName}, ici Shana de Staymakom. Ce créneau n'est finalement pas disponible. Voici d'autres propositions qui pourraient vous convenir : ${alternativesUrl}`;
  }
}

// Coordonnées que l'agent saisit sur le site du prestataire : le billet est au nom du client,
// mais les confirmations et les appels arrivent chez Staymakom.
export const STAYMAKOM_BOOKING_CONTACT = { name: "Staymakom", email: "shana@staymakom.com", phone: `+${WHATSAPP_NUMBER}` };

export type ProviderBookingTarget = "provider" | "agent";

/** Résa sur le site ou le portail du prestataire : c'est l'agent qui la fait. Sinon, WhatsApp au prestataire. */
export function providerBookingTarget(channel: string | null | undefined): ProviderBookingTarget {
  return channel === "provider_website" || channel === "provider_portal" ? "agent" : "provider";
}

export interface ProviderBookingInfo {
  experience: string;
  date: string;
  timeSlot: string | null;
  adults: number | null;
  children: number | null;
  partySize: number | null;
  customerName: string;
  specialRequests: string | null;
  ref: string;
  bookingUrl?: string | null;
  instructions?: string | null;
}

function guestsLabel(info: ProviderBookingInfo): string {
  if (info.adults === null && info.children === null) return `${info.partySize ?? "?"} people`;
  const adults = info.adults ?? 0;
  const children = info.children ?? 0;
  const parts = [`${adults} adult${adults > 1 ? "s" : ""}`];
  if (children > 0) parts.push(`${children} child${children > 1 ? "ren" : ""}`);
  return parts.join(", ");
}

// Infos communes aux deux messages ; une info absente (demande spéciale...) ne laisse pas de ligne vide.
function bookingLines(info: ProviderBookingInfo): (string | null)[] {
  const when = format(parseISO(info.date), "dd/MM/yyyy") + (info.timeSlot ? ` at ${info.timeSlot}` : "");
  return [
    `Experience: ${info.experience}`,
    `Date: ${when}`,
    `Guests: ${guestsLabel(info)}`,
    `Name on the booking: ${info.customerName}`,
    info.specialRequests ? `Special requests: ${info.specialRequests}` : null,
  ];
}

const joinMessage = (intro: string, lines: (string | null)[], closing: string) =>
  [intro, ...lines.filter(Boolean), "", closing].join("\n");

/** Message de résa au prestataire, en anglais comme le message des demandes bateau. */
export function buildProviderBookingMessage(info: ProviderBookingInfo): string {
  return joinMessage("Hi, new booking from STAYMAKOM:", bookingLines(info), "Can you confirm it? Thanks!");
}

/** Message à l'agent qui réserve sur le site du prestataire : lien, infos, coordonnées et consignes de la fiche. */
export function buildAgentBookingMessage(info: ProviderBookingInfo): string {
  const contact = STAYMAKOM_BOOKING_CONTACT;
  return joinMessage(
    `New booking to make on the provider's website (ref ${info.ref}):`,
    [
      info.bookingUrl ? `Link: ${info.bookingUrl}` : null,
      ...bookingLines(info),
      `Contact details to enter: ${contact.name}, ${contact.email}, ${contact.phone}`,
      info.instructions ? `Instructions: ${info.instructions}` : null,
    ],
    "Please send me the confirmation once it's booked. Thanks!",
  );
}
