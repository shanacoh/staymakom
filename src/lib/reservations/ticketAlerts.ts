// Page Réservations : repère les réservations payées, à venir, dont la fiche demande un billet
// d'entrée du prestataire et dont les billets n'ont pas encore été envoyés au client.

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export const TICKETS_TO_SEND_QUERY_KEY = ["admin-tickets-to-send"];

async function fetchTicketsToSend(): Promise<Set<string>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("standalone_bookings")
    .select("id, standalone_experiences!inner(requires_entry_ticket)")
    .eq("standalone_experiences.requires_entry_ticket", true)
    .in("payment_status", ["paid", "deposit_paid"])
    .eq("is_cancelled", false)
    .is("tickets_sent_at", null)
    .gte("booking_date", format(new Date(), "yyyy-MM-dd"));
  if (error) throw error;
  return new Set(((data ?? []) as { id: string }[]).map((b) => b.id));
}

/** Identifiants des réservations dont les billets d'entrée sont à envoyer. */
export function useTicketsToSend() {
  return useQuery({ queryKey: TICKETS_TO_SEND_QUERY_KEY, queryFn: fetchTicketsToSend });
}
