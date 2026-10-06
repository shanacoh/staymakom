// Messages WhatsApp pré-remplis de la zone Réservations (prestataire et client), partagés
// entre le panneau des demandes et les boutons « Prochaine action ».

import { format, parseISO } from "date-fns";

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

// Relance d'un client dont le paiement en ligne n'a pas abouti.
export function buildPaymentFollowUpMessage(clientName: string, product: string): string {
  return `Bonjour ${clientName}, ici Shana de Staymakom. J'ai vu que votre paiement pour « ${product} » n'a pas abouti. Souhaitez-vous que je vous aide à finaliser votre réservation ?`;
}
