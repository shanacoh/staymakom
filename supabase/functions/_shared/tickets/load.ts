// Lecture côté serveur d'une réservation et de ses billets d'entrée (clé de service).
// Sert à l'email « Vos billets » et à la page billet : les deux montrent exactement les mêmes infos.

import { formatBookingDate, normalizeLang, type PracticalInfo, type PracticalLang } from "../practical-info/content.ts";
import { loadPracticalInfo } from "../practical-info/load.ts";
import { formatTimeSlot } from "../time-slot.ts";
import { TICKETS_BUCKET, type TicketFileType } from "./content.ts";

// deno-lint-ignore no-explicit-any
type ServiceClient = any;

export interface TicketFile {
  id: string;
  storagePath: string;
  fileType: TicketFileType;
  mimeType: string;
  originalName: string;
  label: string | null;
}

export interface TicketBooking {
  id: string;
  lang: PracticalLang;
  customerEmail: string | null;
  experienceTitle: string;
  bookingDate: string;
  dateLabel: string;
  timeLabel: string;
  partySize: number;
  ticketNote: string;
  token: string | null;
  ticketsSentAt: string | null;
  /** Faux si la réservation est annulée ou remboursée : plus aucun billet n'est montré. */
  active: boolean;
  experienceId: string | null;
  tickets: TicketFile[];
}

const BOOKING_COLUMNS =
  "id, customer_email, booking_date, time_slot, party_size, preferred_lang, status, is_cancelled, payment_status, " +
  "ticket_note, ticket_access_token, tickets_sent_at, custom_experience_title, standalone_experience_id, " +
  "standalone_experiences(title, title_fr, title_he), " +
  "booking_tickets(id, storage_path, file_type, mime_type, original_name, label, position, created_at)";

/** Réservation et billets, par identifiant (back-office) ou par jeton de page billet (client). `null` si inconnue. */
export async function loadTicketBooking(
  serviceClient: ServiceClient,
  by: { bookingId: string } | { token: string },
): Promise<TicketBooking | null> {
  const query = serviceClient.from("standalone_bookings").select(BOOKING_COLUMNS);
  const { data, error } = "bookingId" in by
    ? await query.eq("id", by.bookingId).maybeSingle()
    : await query.eq("ticket_access_token", by.token).maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const lang = normalizeLang(data.preferred_lang);
  const experience = data.standalone_experiences as { title?: string; title_fr?: string; title_he?: string } | null;
  const localizedTitle = lang === "fr" ? experience?.title_fr : lang === "he" ? experience?.title_he : experience?.title;
  // deno-lint-ignore no-explicit-any
  const rows = ((data.booking_tickets ?? []) as any[]).sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));

  return {
    id: data.id,
    lang,
    customerEmail: data.customer_email,
    experienceTitle: (localizedTitle || experience?.title || data.custom_experience_title || "").trim(),
    bookingDate: data.booking_date,
    dateLabel: data.booking_date ? formatBookingDate(data.booking_date, lang) : "",
    timeLabel: formatTimeSlot(data.time_slot, lang),
    partySize: data.party_size,
    ticketNote: (data.ticket_note || "").trim(),
    token: data.ticket_access_token,
    ticketsSentAt: data.tickets_sent_at,
    active: !data.is_cancelled && data.status !== "cancelled" && !["refunded", "refund_pending"].includes(data.payment_status),
    experienceId: data.standalone_experience_id,
    tickets: rows.map((row) => ({
      id: row.id,
      storagePath: row.storage_path,
      fileType: row.file_type,
      mimeType: row.mime_type,
      originalName: row.original_name,
      label: (row.label || "").trim() || null,
    })),
  };
}

/** Infos pratiques de la fiche, sans jamais faire échouer l'envoi ou la page si elles sont illisibles. */
export async function loadTicketPracticalInfo(serviceClient: ServiceClient, booking: TicketBooking): Promise<PracticalInfo | null> {
  try {
    return await loadPracticalInfo(serviceClient, booking.experienceId, booking.lang);
  } catch (error) {
    console.error(`Infos pratiques illisibles pour ${booking.id}:`, error);
    return null;
  }
}

/** Contenu brut d'un fichier billet (aucune transformation : c'est le fichier du prestataire). */
export async function downloadTicketFile(serviceClient: ServiceClient, ticket: TicketFile): Promise<Uint8Array> {
  const { data, error } = await serviceClient.storage.from(TICKETS_BUCKET).download(ticket.storagePath);
  if (error || !data) throw new Error(`Fichier billet illisible : ${ticket.originalName}`);
  return new Uint8Array(await (data as Blob).arrayBuffer());
}

/** Lien signé de courte durée vers un fichier billet (page billet). */
export async function signTicketFile(
  serviceClient: ServiceClient,
  ticket: TicketFile,
  expiresInSeconds: number,
  download?: string,
): Promise<string | null> {
  const { data, error } = await serviceClient.storage
    .from(TICKETS_BUCKET)
    .createSignedUrl(ticket.storagePath, expiresInSeconds, download ? { download } : undefined);
  if (error) {
    console.error(`Lien signé impossible pour ${ticket.id}:`, error);
    return null;
  }
  return data.signedUrl;
}
