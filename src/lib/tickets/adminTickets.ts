// Billets d'entrée d'une réservation, côté back-office (admins uniquement, protégé par la base).
// Les fichiers vont dans le bucket privé, tels quels : aucun recadrage, aucune recompression.
import { supabase } from "@/integrations/supabase/client";
import { detectTicketFile, TICKETS_BUCKET, type TicketFileType } from "./index";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface AdminTicket {
  id: string;
  booking_id: string;
  storage_path: string;
  file_type: TicketFileType;
  mime_type: string;
  original_name: string;
  label: string | null;
  position: number;
  created_at: string;
}

export const MAX_TICKET_BYTES = 15 * 1024 * 1024;

export async function listBookingTickets(bookingId: string): Promise<AdminTicket[]> {
  const { data, error } = await db
    .from("booking_tickets")
    .select("id, booking_id, storage_path, file_type, mime_type, original_name, label, position, created_at")
    .eq("booking_id", bookingId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as AdminTicket[];
}

/**
 * Dépose des fichiers billets sur une réservation, à la suite des billets existants.
 * Chaque fichier : d'abord rangé dans le bucket, puis inscrit en base ; si l'inscription échoue,
 * le fichier est retiré du bucket (rien ne reste à moitié fait).
 */
export async function uploadBookingTickets(
  bookingId: string,
  files: File[],
  startPosition: number,
): Promise<{ added: AdminTicket[]; rejected: { name: string; reason: string }[] }> {
  const added: AdminTicket[] = [];
  const rejected: { name: string; reason: string }[] = [];

  for (const file of files) {
    const detected = detectTicketFile(file.name);
    if (!detected) {
      rejected.push({ name: file.name, reason: "format non accepté (PDF, PNG, JPG ou .pkpass)" });
      continue;
    }
    if (file.size > MAX_TICKET_BYTES) {
      rejected.push({ name: file.name, reason: "fichier trop lourd (15 Mo maximum)" });
      continue;
    }

    const path = `${bookingId}/${crypto.randomUUID()}.${detected.extension}`;
    const { error: uploadError } = await supabase.storage
      .from(TICKETS_BUCKET)
      .upload(path, file, { contentType: detected.mime, upsert: false });
    if (uploadError) {
      rejected.push({ name: file.name, reason: uploadError.message });
      continue;
    }

    const { data, error } = await db
      .from("booking_tickets")
      .insert({
        booking_id: bookingId,
        storage_path: path,
        file_type: detected.type,
        mime_type: detected.mime,
        original_name: file.name,
        position: startPosition + added.length,
      })
      .select("id, booking_id, storage_path, file_type, mime_type, original_name, label, position, created_at")
      .single();
    if (error) {
      await supabase.storage.from(TICKETS_BUCKET).remove([path]);
      rejected.push({ name: file.name, reason: error.message });
      continue;
    }
    added.push(data as AdminTicket);
  }

  if (added.length > 0) {
    // Suivi Amplitude côté serveur : la fonction relit en base ce qui a vraiment été ajouté.
    supabase.functions
      .invoke("track-tickets-uploaded", { body: { booking_id: bookingId, ticket_ids: added.map((t) => t.id) } })
      .catch(() => undefined);
  }
  return { added, rejected };
}

/** Retire un billet : la ligne d'abord (le client ne le voit plus), puis le fichier. */
export async function deleteBookingTicket(ticket: AdminTicket): Promise<void> {
  const { error } = await db.from("booking_tickets").delete().eq("id", ticket.id);
  if (error) throw error;
  await supabase.storage.from(TICKETS_BUCKET).remove([ticket.storage_path]);
}

export async function updateTicketLabel(ticketId: string, label: string): Promise<void> {
  const { error } = await db.from("booking_tickets").update({ label: label.trim() || null }).eq("id", ticketId);
  if (error) throw error;
}

/** Nouvel ordre des billets, enregistré en une seule fois. */
export async function reorderBookingTickets(bookingId: string, orderedIds: string[]): Promise<void> {
  const { error } = await db.rpc("reorder_booking_tickets", { p_booking_id: bookingId, p_ticket_ids: orderedIds });
  if (error) throw error;
}

export async function updateTicketNote(bookingId: string, note: string): Promise<void> {
  const { error } = await db.from("standalone_bookings").update({ ticket_note: note.trim() || null }).eq("id", bookingId);
  if (error) throw error;
}

/** Lien signé de courte durée pour l'aperçu d'un billet dans le back-office. */
export async function signAdminTicketUrl(ticket: AdminTicket): Promise<string | null> {
  const { data, error } = await supabase.storage.from(TICKETS_BUCKET).createSignedUrl(ticket.storage_path, 10 * 60);
  return error ? null : data.signedUrl;
}

export async function sendTicketsEmail(bookingId: string, resend: boolean): Promise<{ tickets_sent_at?: string; already_sent?: boolean }> {
  const { data, error } = await supabase.functions.invoke("send-booking-tickets", { body: { booking_id: bookingId, resend } });
  if (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const details = await (error as any).context?.json?.().catch(() => null);
    throw new Error(details?.error || error.message);
  }
  if (!data?.success) throw new Error(data?.error || "Échec de l'envoi");
  return data;
}
