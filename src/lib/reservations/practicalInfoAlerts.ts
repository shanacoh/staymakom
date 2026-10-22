// Garde-fou de la page Réservations : repère les réservations d'expérience des 7 prochains jours
// dont la fiche n'a pas de point de rendez-vous. Le client recevrait alors une confirmation et un
// rappel sans savoir où aller (le contact du jour J ne lui est jamais envoyé, il reste interne).

import { useQuery } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export const INCOMPLETE_PRACTICAL_INFO_QUERY_KEY = ["admin-incomplete-practical-info"];
export const PRACTICAL_INFO_ALERT_DAYS = 7;

const filled = (value: unknown) => typeof value === "string" && value.trim() !== "";

export interface PracticalInfoCheck {
  meeting_point?: string | null;
  meeting_point_fr?: string | null;
  meeting_point_he?: string | null;
}

/** Vrai si la fiche n'a de point de rendez-vous dans aucune langue. */
export function isPracticalInfoIncomplete(experience: PracticalInfoCheck): boolean {
  return !filled(experience.meeting_point) && !filled(experience.meeting_point_fr) && !filled(experience.meeting_point_he);
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

  const incompleteExperiences = new Set(
    ((experiences ?? []) as ({ id: string } & PracticalInfoCheck)[]).filter(isPracticalInfoIncomplete).map((e) => e.id),
  );

  return new Set(bookings.filter((b) => incompleteExperiences.has(b.standalone_experience_id as string)).map((b) => b.id));
}

/** Identifiants des réservations à venir (7 jours) dont les infos pratiques sont incomplètes. */
export function useIncompletePracticalInfo() {
  return useQuery({ queryKey: INCOMPLETE_PRACTICAL_INFO_QUERY_KEY, queryFn: fetchIncompleteBookingIds });
}
