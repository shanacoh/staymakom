// Garde-fou de la page Réservations : repère les réservations d'expérience des 7 prochains jours
// dont la fiche n'a ni point de rendez-vous ni contact jour J. Le client recevrait alors une
// confirmation et un rappel sans savoir où aller ni qui appeler.

import { useQuery } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { STANDALONE_EXPERIENCE_INTERNAL, withInternalFields } from "@/lib/internalFields";

export const INCOMPLETE_PRACTICAL_INFO_QUERY_KEY = ["admin-incomplete-practical-info"];
export const PRACTICAL_INFO_ALERT_DAYS = 7;

const filled = (value: unknown) => typeof value === "string" && value.trim() !== "";

export interface PracticalInfoCheck {
  meeting_point?: string | null;
  meeting_point_fr?: string | null;
  meeting_point_he?: string | null;
  day_contact_name?: string | null;
  day_contact_phone?: string | null;
}

/** Vrai si la fiche n'a ni point de rendez-vous (dans aucune langue) ni contact jour J. */
export function isPracticalInfoIncomplete(experience: PracticalInfoCheck): boolean {
  const hasMeetingPoint = filled(experience.meeting_point) || filled(experience.meeting_point_fr) || filled(experience.meeting_point_he);
  const hasDayContact = filled(experience.day_contact_name) || filled(experience.day_contact_phone);
  return !hasMeetingPoint && !hasDayContact;
}

async function fetchIncompleteBookingIds(): Promise<Set<string>> {
  const today = new Date();
  const { data: bookings, error } = await supabase
    .from("standalone_bookings")
    .select("id, standalone_experience_id")
    .gte("booking_date", format(today, "yyyy-MM-dd"))
    .lte("booking_date", format(addDays(today, PRACTICAL_INFO_ALERT_DAYS), "yyyy-MM-dd"))
    .eq("status", "confirmed")
    .eq("is_cancelled", false)
    .or("product_type.is.null,product_type.neq.boat")
    .not("standalone_experience_id", "is", null);
  if (error) throw error;
  if (!bookings || bookings.length === 0) return new Set();

  const experienceIds = [...new Set(bookings.map((b) => b.standalone_experience_id as string))];
  const { data: experiences, error: experiencesError } = await supabase
    .from("standalone_experiences")
    .select("id, meeting_point, meeting_point_fr, meeting_point_he")
    .in("id", experienceIds);
  if (experiencesError) throw experiencesError;

  const withContact = await withInternalFields(STANDALONE_EXPERIENCE_INTERNAL, (experiences ?? []) as { id: string }[]);
  const incompleteExperiences = new Set(withContact.filter((e) => isPracticalInfoIncomplete(e as PracticalInfoCheck)).map((e) => e.id));

  return new Set(bookings.filter((b) => incompleteExperiences.has(b.standalone_experience_id as string)).map((b) => b.id));
}

/** Identifiants des réservations à venir (7 jours) dont les infos pratiques sont incomplètes. */
export function useIncompletePracticalInfo() {
  return useQuery({ queryKey: INCOMPLETE_PRACTICAL_INFO_QUERY_KEY, queryFn: fetchIncompleteBookingIds });
}
