// Canal de réservation d'une expérience seule : comment STAYMAKOM réserve chez le prestataire.
// Information interne, jamais affichée au client.

export type BookingChannelId = "provider_request" | "provider_website" | "provider_portal";

export interface BookingChannel {
  id: BookingChannelId;
  label: string;
  /** Pas encore disponible : la pastille est grisée et ne peut pas être choisie. */
  comingSoon?: boolean;
}

export const BOOKING_CHANNELS: BookingChannel[] = [
  { id: "provider_request", label: "Demande au prestataire" },
  { id: "provider_website", label: "Site du prestataire" },
  { id: "provider_portal", label: "Portail prestataire", comingSoon: true },
];

/** Même règle que le pré-remplissage fait en base : un lien de réservation veut dire « site du prestataire ». */
export const defaultBookingChannel = (supplierBookingUrl: string | null | undefined): BookingChannelId =>
  supplierBookingUrl?.trim() ? "provider_website" : "provider_request";
