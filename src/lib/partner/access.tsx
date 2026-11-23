// Comment l'espace partenaire parle à la base : avec un compte (fonctions `partner_*`) ou avec le
// lien personnel envoyé par WhatsApp (une seule porte, `partner_link`, qui reconnaît le prestataire
// par son jeton). Les écrans ne savent pas lequel des deux est utilisé : ils appellent l'accès du
// contexte. C'est la base qui décide de ce qui est permis (le lien ne permet ni de signer, ni de voir
// réservations et revenus).

import { createContext, useContext } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type {
  GoLive,
  ListingField,
  ListingKind,
  PartnerAvailability,
  PartnerExperienceDetail,
  PartnerExperienceSummary,
  PartnerListing,
  PartnerRules,
  PartnerSession,
  ProposalType,
} from "./types";

const db = supabase as unknown as SupabaseClient;

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await db.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export interface ProposalInput {
  experienceId: string;
  type: Extract<ProposalType, "text" | "practical_info" | "photos" | "price">;
  proposed: Record<string, unknown>;
  note?: string;
}

export interface PartnerAccess {
  mode: "account" | "link";
  /** Début des adresses de l'espace : /partner, ou /partner/link/<jeton>. */
  base: string;
  /** Sépare en mémoire les données d'un lien de celles d'un compte. */
  scope: string;
  session(): Promise<PartnerSession>;
  golive(): Promise<GoLive>;
  experiences(): Promise<PartnerExperienceSummary[]>;
  experience(id: string): Promise<PartnerExperienceDetail>;
  listing(kind: ListingKind, id: string): Promise<PartnerListing>;
  confirmSection(kind: ListingKind, id: string, section: string): Promise<ListingField[]>;
  submitNote(kind: ListingKind, id: string, section: string, text: string): Promise<string>;
  submitProposal(input: ProposalInput): Promise<string>;
  setRules(experienceId: string, rules: Partial<PartnerRules>): Promise<PartnerRules>;
  setPublicPrice(experienceId: string, adult: string, child: string): Promise<{ adult: number | null; child: number | null }>;
  setDayContact(experienceId: string, contact: { name: string; phone: string; language: string }): Promise<void>;
  setAvailability(experienceId: string, availability: PartnerAvailability): Promise<PartnerAvailability>;
  setLanguage(language: string): Promise<PartnerSession>;
}

export const accountAccess: PartnerAccess = {
  mode: "account",
  base: "/partner",
  scope: "account",
  session: () => rpc("partner_session"),
  golive: () => rpc("partner_golive"),
  experiences: () => rpc("partner_experiences"),
  experience: (id) => rpc("partner_experience", { p_experience_id: id }),
  listing: (kind, id) => rpc("partner_listing", { p_kind: kind, p_target: id }),
  confirmSection: (kind, id, section) => rpc("partner_confirm_section", { p_kind: kind, p_target: id, p_section: section }),
  submitNote: (kind, id, section, text) => rpc("partner_submit_note", { p_kind: kind, p_target: id, p_section: section, p_text: text }),
  submitProposal: ({ experienceId, type, proposed, note }) =>
    rpc("partner_submit_proposal", { p_experience_id: experienceId, p_type: type, p_proposed: proposed, p_note: note ?? null }),
  setRules: (id, rules) => rpc("partner_set_rules", { p_experience_id: id, p_rules: rules }),
  setPublicPrice: (id, adult, child) => rpc("partner_set_public_price", { p_experience_id: id, p_adult: adult, p_child: child }),
  setDayContact: (id, contact) =>
    rpc("partner_set_day_contact", { p_experience_id: id, p_name: contact.name, p_phone: contact.phone, p_language: contact.language }),
  setAvailability: (id, availability) => rpc("partner_set_availability", { p_experience_id: id, p_availability: availability }),
  setLanguage: (language) => rpc("partner_update_profile", { p_patch: { language } }),
};

export function linkAccess(token: string): PartnerAccess {
  const call = <T,>(action: string, args: Record<string, unknown> = {}) =>
    rpc<T>("partner_link", { p_token: token, p_action: action, p_args: args });
  return {
    mode: "link",
    base: `/partner/link/${token}`,
    scope: `link:${token}`,
    session: () => call("session"),
    golive: () => call("golive"),
    experiences: () => call("experiences"),
    experience: (id) => call("experience", { id }),
    listing: (kind, id) => call("listing", { kind, id }),
    confirmSection: (kind, id, section) => call("confirm_section", { kind, id, section }),
    submitNote: (kind, id, section, text) => call("submit_note", { kind, id, section, text }),
    submitProposal: ({ experienceId, type, proposed, note }) => call("submit_proposal", { id: experienceId, type, proposed, note: note ?? null }),
    setRules: (id, rules) => call("set_rules", { id, rules }),
    setPublicPrice: (id, adult, child) => call("set_public_price", { id, adult, child }),
    setDayContact: (id, contact) => call("set_day_contact", { id, ...contact }),
    setAvailability: (id, availability) => call("set_availability", { id, availability }),
    setLanguage: (language) => call("set_language", { language }),
  };
}

export const PartnerAccessContext = createContext<PartnerAccess>(accountAccess);
export const usePartnerAccess = () => useContext(PartnerAccessContext);

/** Clés de cache des données du parcours, séparées par accès (compte ou lien). */
export const goliveKeys = {
  golive: (scope: string) => ["partner", scope, "golive"] as const,
  listing: (scope: string, kind: ListingKind, id: string) => ["partner", scope, "listing", kind, id] as const,
  experience: (scope: string, id: string) => ["partner", scope, "experience", id] as const,
  session: (scope: string) => ["partner", scope, "session"] as const,
};
