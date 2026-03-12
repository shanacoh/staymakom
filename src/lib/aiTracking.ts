import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "ai_session_id";
const SEARCH_KEY = "ai_last_search_id";

// Get or create session ID
export const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

// Store the last search ID for tracking
export const setLastSearchId = (searchId: string) => {
  sessionStorage.setItem(SEARCH_KEY, searchId);
};

export const getLastSearchId = (): string | null => {
  return sessionStorage.getItem(SEARCH_KEY);
};

// Track when user clicks on a recommended experience
export const trackExperienceClick = async (
  experienceId: string,
  position: number,
  searchId?: string | null
) => {
  const sessionId = getSessionId();
  const currentSearchId = searchId || getLastSearchId();

  try {
    await supabase.from("ai_search_events").insert({
      search_id: currentSearchId,
      session_id: sessionId,
      event_type: "click",
      experience_id: experienceId,
      position: position,
      metadata: { timestamp: new Date().toISOString() },
    });
  } catch (error) {
    // Error handled silently
  }
};

// Track when user makes a new search (after already having results)
export const trackNewSearch = async (searchId: string) => {
  const sessionId = getSessionId();
  const previousSearchId = getLastSearchId();

  if (previousSearchId && previousSearchId !== searchId) {
    try {
      await supabase.from("ai_search_events").insert({
        search_id: previousSearchId,
        session_id: sessionId,
        event_type: "new_search",
        metadata: { new_search_id: searchId },
      });
    } catch (error) {
      // Error handled silently
    }
  }

  setLastSearchId(searchId);
};

// Track when a booking is made (call this from booking flow)
export const trackBookingConversion = async (
  experienceId: string,
  bookingId: string
) => {
  const sessionId = getSessionId();
  const searchId = getLastSearchId();

  if (searchId) {
    try {
      // Record the event
      await supabase.from("ai_search_events").insert({
        search_id: searchId,
        session_id: sessionId,
        event_type: "booking",
        experience_id: experienceId,
        booking_id: bookingId,
        metadata: { timestamp: new Date().toISOString() },
      });

      // Update the original search as converted
      await supabase
        .from("ai_search_queries")
        .update({
          converted: true,
          conversion_experience_id: experienceId,
          conversion_booking_id: bookingId,
        })
        .eq("id", searchId);

    } catch (error) {
      // Error handled silently
    }
  }
};

// Track bounce (no action after search) - call on page leave
export const trackBounce = async () => {
  const sessionId = getSessionId();
  const searchId = getLastSearchId();

  if (searchId) {
    try {
      // Check if we already have events for this search
      const { data: existingEvents } = await supabase
        .from("ai_search_events")
        .select("id")
        .eq("search_id", searchId)
        .limit(1);

      // Only track bounce if no other events exist
      if (!existingEvents || existingEvents.length === 0) {
        await supabase.from("ai_search_events").insert({
          search_id: searchId,
          session_id: sessionId,
          event_type: "bounce",
          metadata: { timestamp: new Date().toISOString() },
        });
      }
    } catch (error) {
      // Error handled silently
    }
  }
};
