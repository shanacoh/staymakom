// Tous les échanges de l'espace partenaire avec la base passent par ici, et uniquement par les
// fonctions `partner_*` : l'écran ne lit ni n'écrit jamais une table directement.

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type {
  PartnerAvailability,
  PartnerBooking,
  PartnerExperienceDetail,
  PartnerExperienceSummary,
  PartnerProfilePatch,
  PartnerProposal,
  PartnerReview,
  PartnerSession,
  PartnerUser,
  ProposalType,
} from "./types";

// Les fonctions partenaire ne sont pas encore décrites dans les types générés.
const db = supabase as unknown as SupabaseClient;

/** Code d'erreur renvoyé par la base (`not_partner`, `terms_required`, `no_change`...), ou le message brut. */
export function partnerErrorCode(error: unknown): string {
  const message = (error as { message?: string } | null)?.message ?? "";
  return message.trim();
}

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await db.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const partnerKeys = {
  session: (userId: string | undefined) => ["partner", "session", userId] as const,
  experiences: ["partner", "experiences"] as const,
  experience: (id: string) => ["partner", "experience", id] as const,
  proposals: ["partner", "proposals"] as const,
  bookings: ["partner", "bookings"] as const,
  reviews: ["partner", "reviews"] as const,
  users: ["partner", "users"] as const,
};

export const fetchPartnerSession = () => call<PartnerSession>("partner_session");
export const updatePartnerProfile = (patch: PartnerProfilePatch) =>
  call<PartnerSession>("partner_update_profile", { p_patch: patch });
export const acceptPartnerTerms = (version: number, signerName: string) =>
  call<PartnerSession>("partner_accept_terms", { p_version: version, p_signer_name: signerName });

export const fetchPartnerExperiences = () => call<PartnerExperienceSummary[]>("partner_experiences");
export const fetchPartnerExperience = (id: string) =>
  call<PartnerExperienceDetail>("partner_experience", { p_experience_id: id });

export const setPartnerDayContact = (experienceId: string, contact: { name: string; phone: string; language: string }) =>
  call<void>("partner_set_day_contact", {
    p_experience_id: experienceId,
    p_name: contact.name,
    p_phone: contact.phone,
    p_language: contact.language,
  });

export const setPartnerAvailability = (experienceId: string, availability: PartnerAvailability) =>
  call<PartnerAvailability>("partner_set_availability", { p_experience_id: experienceId, p_availability: availability });

export const submitPartnerProposal = (params: {
  experienceId: string | null;
  type: ProposalType;
  proposed: Record<string, unknown>;
  note?: string;
}) =>
  call<string>("partner_submit_proposal", {
    p_experience_id: params.experienceId,
    p_type: params.type,
    p_proposed: params.proposed,
    p_note: params.note ?? null,
  });

export const fetchPartnerProposals = () => call<PartnerProposal[]>("partner_proposals");
export const fetchPartnerBookings = () => call<PartnerBooking[]>("partner_bookings");
export const fetchPartnerReviews = () => call<PartnerReview[]>("partner_reviews");
export const fetchPartnerUsers = () => call<PartnerUser[]>("partner_users");

// ── Connexion ───────────────────────────────────────────────────────────────────────────────────

/** Demande un lien de connexion par email. La réponse est la même que l'adresse soit connue ou non. */
export async function requestPartnerLoginLink(email: string): Promise<void> {
  const { error } = await supabase.functions.invoke("partner-login-link", { body: { email } });
  if (error) throw error;
}

/** Échange le jeton du lien reçu par email contre une session. */
export async function signInWithPartnerToken(tokenHash: string): Promise<void> {
  const first = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  if (!first.error) return;
  // Selon la version du service de connexion, le même jeton se présente sous le type « email ».
  const second = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
  if (second.error) throw second.error;
}

// ── Photos ──────────────────────────────────────────────────────────────────────────────────────

export const PARTNER_PHOTO_MAX_BYTES = 10 * 1024 * 1024;

/**
 * Envoie une photo dans le dossier du prestataire (le seul où la base l'autorise à écrire) et
 * renvoie son adresse. La photo n'apparaît nulle part sur le site tant que la proposition qui la
 * porte n'est pas acceptée.
 */
export async function uploadPartnerPhoto(providerId: string, file: File): Promise<string> {
  const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `partner-proposals/${providerId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("experience-images").upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return supabase.storage.from("experience-images").getPublicUrl(path).data.publicUrl;
}
