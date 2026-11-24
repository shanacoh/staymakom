// Côté back-office de l'espace partenaire : accès et invitation, propositions à valider,
// conditions partenaires, règlements. Tout ce qui est lu ici est réservé aux admins par la base.

import type { SupabaseClient } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PartnerBooking, ProposalStatus, ProposalType, TermsKind } from "@/lib/partner/types";

// Les nouvelles tables ne sont pas encore dans les types générés.
const db = supabase as unknown as SupabaseClient;

export const partnerAdminKeys = {
  access: (providerId: string) => ["admin-partner-access", providerId] as const,
  proposals: ["admin-partner-proposals"] as const,
  pendingCount: ["admin-partner-proposals-pending-count"] as const,
  terms: (kind: TermsKind) => ["admin-partner-terms", kind] as const,
  signature: ["admin-partner-staymakom-signature"] as const,
  settlements: (providerId: string) => ["admin-partner-settlements", providerId] as const,
  priceSignal: (experienceId: string) => ["admin-supplier-price-signal", experienceId] as const,
};

// ── Accès et invitation ─────────────────────────────────────────────────────────────────────────

export interface ProviderAccessUser {
  id: string;
  email: string;
  invited_at: string;
  last_login_at: string | null;
}

export interface ProviderAccess {
  users: ProviderAccessUser[];
  /** Dernière acceptation des conditions, avec sa preuve. */
  acceptance: { version: number; signer_name: string; accepted_at: string; ip_address: string | null } | null;
  pendingProposals: number;
}

export async function fetchProviderAccess(providerId: string): Promise<ProviderAccess> {
  const [users, acceptance, pending] = await Promise.all([
    db.from("provider_users").select("id, email, invited_at, last_login_at").eq("provider_id", providerId).order("invited_at"),
    db
      .from("partner_terms_acceptances")
      .select("version, signer_name, accepted_at, ip_address")
      .eq("provider_id", providerId)
      .order("accepted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from("partner_proposals").select("id", { count: "exact", head: true }).eq("provider_id", providerId).eq("status", "pending"),
  ]);
  if (users.error) throw users.error;
  if (acceptance.error) throw acceptance.error;
  if (pending.error) throw pending.error;
  return {
    users: (users.data ?? []) as ProviderAccessUser[],
    acceptance: acceptance.data as ProviderAccess["acceptance"],
    pendingProposals: pending.count ?? 0,
  };
}

/** Le message d'erreur renvoyé par une fonction serveur (il est dans le corps de la réponse). */
async function functionErrorMessage(error: unknown): Promise<string> {
  const response = (error as { context?: Response } | null)?.context;
  if (response && typeof response.json === "function") {
    try {
      const body = await response.json();
      if (typeof body?.error === "string") return body.error;
    } catch {
      // Corps illisible : on garde le message générique.
    }
  }
  return (error as { message?: string } | null)?.message ?? "Une erreur est survenue";
}

/** Crée l'accès (si besoin) et envoie le lien de connexion par email, dans la langue du prestataire. */
export async function invitePartner(providerId: string, email?: string): Promise<{ email: string }> {
  const { data, error } = await supabase.functions.invoke("partner-invite", {
    body: { provider_id: providerId, ...(email ? { email } : {}) },
  });
  if (error) throw new Error(await functionErrorMessage(error));
  if (data?.error) throw new Error(data.error);
  return { email: data.email };
}

// ── Propositions ────────────────────────────────────────────────────────────────────────────────

export interface AdminProposal {
  id: string;
  provider_id: string;
  provider_name: string;
  experience_id: string | null;
  experience_title: string | null;
  /** Proposition sur une page hôtel (type « note »). */
  hotel_id: string | null;
  hotel_name: string | null;
  section: string | null;
  via_link: boolean;
  proposal_type: ProposalType;
  lang: "he" | "en" | "fr";
  proposed: Record<string, unknown>;
  current: Record<string, unknown>;
  note: string | null;
  status: ProposalStatus;
  admin_comment: string | null;
  created_at: string;
  reviewed_at: string | null;
  created_experience_id: string | null;
}

export async function fetchProposals(): Promise<AdminProposal[]> {
  const { data, error } = await db
    .from("partner_proposals")
    .select(
      "id, provider_id, experience_id, hotel_id, section, via_link, proposal_type, lang, proposed, current, note, status, admin_comment, created_at, reviewed_at, created_experience_id, providers(name), standalone_experiences!partner_proposals_experience_id_fkey(title, title_fr), hotels2(name)",
    )
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const { providers, standalone_experiences: experience, hotels2: hotel, ...proposal } = row as unknown as Record<string, unknown> & {
      providers: { name: string } | null;
      standalone_experiences: { title: string | null; title_fr: string | null } | null;
      hotels2: { name: string | null } | null;
    };
    return {
      ...proposal,
      provider_name: providers?.name ?? "Prestataire supprimé",
      experience_title: experience?.title_fr || experience?.title || null,
      hotel_name: hotel?.name ?? null,
    } as AdminProposal;
  });
}

export function usePendingProposalCount() {
  const { data } = useQuery({
    queryKey: partnerAdminKeys.pendingCount,
    queryFn: async () => {
      const { count, error } = await db.from("partner_proposals").select("id", { count: "exact", head: true }).eq("status", "pending");
      if (error) return 0;
      return count ?? 0;
    },
    refetchInterval: 60000,
  });
  return data ?? 0;
}

/** Accepter applique la modification dans la même opération, côté base. */
export async function reviewProposal(id: string, decision: "accepted" | "rejected", comment: string) {
  const { data, error } = await db.rpc("admin_review_partner_proposal", { p_id: id, p_decision: decision, p_comment: comment });
  if (error) throw error;
  return data as { status: string; created_experience_id: string | null };
}

// ── Conditions partenaires ──────────────────────────────────────────────────────────────────────

export interface TermsVersion {
  version: number;
  text_he: string;
  text_en: string;
  text_fr: string;
  published_at: string | null;
  acceptances: number;
}

/** Les versions d'un type de conditions : « conditions expériences » ou « contrat hôtel ». */
export async function fetchTermsVersions(kind: TermsKind): Promise<TermsVersion[]> {
  const [versions, acceptances] = await Promise.all([
    db.from("partner_terms_versions").select("version, text_he, text_en, text_fr, published_at").eq("kind", kind).order("version", { ascending: false }),
    db.from("partner_terms_acceptances").select("version"),
  ]);
  if (versions.error) throw versions.error;
  if (acceptances.error) throw acceptances.error;
  const counts = new Map<number, number>();
  for (const row of acceptances.data ?? []) counts.set(row.version, (counts.get(row.version) ?? 0) + 1);
  return (versions.data ?? []).map((v) => ({ ...v, acceptances: counts.get(v.version) ?? 0 })) as TermsVersion[];
}

export type TermsTexts = Pick<TermsVersion, "text_he" | "text_en" | "text_fr">;

/** Corrige le texte d'une version que personne n'a encore acceptée (la base refuse sinon). */
export async function saveTermsVersion(version: number, texts: TermsTexts) {
  const { data, error } = await db.from("partner_terms_versions").update(texts).eq("version", version).select("version");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Version introuvable.");
}

/**
 * Publie : le brouillon de ce type s'il n'a jamais été publié (ex. contrat hôtel « À coller »), sinon
 * une nouvelle version, que chaque prestataire devra accepter.
 */
export async function publishTermsVersion(kind: TermsKind, texts: TermsTexts): Promise<number> {
  const { data, error } = await db.rpc("admin_publish_partner_terms", {
    p_kind: kind,
    p_text_he: texts.text_he,
    p_text_en: texts.text_en,
    p_text_fr: texts.text_fr,
  });
  if (error) throw error;
  return data as number;
}

// ── Signature STAYMAKOM (apposée sur les contrats hôtel signés) ─────────────────────────────────

export const STAYMAKOM_SIGNATURE_PATH = "staymakom/signature.png";

export type StaymakomSignatureMethod = "drawn" | "png";

export interface StaymakomSignatureInfo {
  savedAt: string;
  savedBy: string | null;
  method: StaymakomSignatureMethod | null;
}

/** La signature STAYMAKOM en place (date, compte admin, façon de la déposer), ou null s'il n'y en a pas. */
export async function fetchStaymakomSignatureInfo(): Promise<StaymakomSignatureInfo | null> {
  const { data, error } = await supabase.storage.from("partner-contracts").list("staymakom", { search: "signature.png" });
  if (error) throw error;
  const file = (data ?? []).find((f) => f.name === "signature.png");
  if (!file) return null;
  const { data: info } = await supabase.storage.from("partner-contracts").info(STAYMAKOM_SIGNATURE_PATH);
  const meta = (info?.metadata ?? {}) as Record<string, string | undefined>;
  return {
    savedAt: meta.saved_at ?? file.updated_at ?? file.created_at,
    savedBy: meta.saved_by_email ?? null,
    method: meta.method === "drawn" || meta.method === "png" ? meta.method : null,
  };
}

/**
 * Enregistre la signature STAYMAKOM (image PNG envoyée ou signée à l'écran) au même endroit, en
 * remplaçant la précédente, avec la date, l'heure et le compte admin. Les PDF déjà générés gardent
 * la signature qu'ils avaient.
 */
export async function uploadStaymakomSignature(file: Blob, method: StaymakomSignatureMethod): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.storage.from("partner-contracts").upload(STAYMAKOM_SIGNATURE_PATH, file, {
    upsert: true,
    contentType: "image/png",
    cacheControl: "60",
    metadata: { saved_at: new Date().toISOString(), saved_by_user_id: user?.id ?? null, saved_by_email: user?.email ?? null, method },
  });
  if (error) throw error;
}

// ── Règlements ──────────────────────────────────────────────────────────────────────────────────

/** Les réservations payées d'un prestataire, avec le montant qui lui revient : ce qu'il voit dans son espace. */
export async function fetchProviderSettlements(providerId: string): Promise<PartnerBooking[]> {
  const { data, error } = await db.rpc("admin_provider_settlements", { p_provider_id: providerId });
  if (error) throw error;
  return (data ?? []) as PartnerBooking[];
}

/**
 * Marque une réservation comme réglée au prestataire. Le montant réglé est figé sur la réservation
 * (coût fournisseur), pour qu'un changement de prix sur la fiche ne réécrive pas le passé.
 */
export async function markSettled(bookingId: string, settlement: { amount: number; date: string; reference: string }) {
  const { data, error } = await db
    .from("standalone_bookings")
    .update({
      supplier_cost: settlement.amount,
      supplier_payment_status: "paid",
      supplier_paid_at: settlement.date,
      supplier_payment_reference: settlement.reference.trim() || null,
    })
    .eq("id", bookingId)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Réservation introuvable.");
}

export async function unmarkSettled(bookingId: string) {
  const { data, error } = await db
    .from("standalone_bookings")
    .update({ supplier_payment_status: "pending", supplier_paid_at: null, supplier_payment_reference: null })
    .eq("id", bookingId)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Réservation introuvable.");
}

// ── Signal « prix fournisseur modifié » ─────────────────────────────────────────────────────────

export async function fetchSupplierPriceSignal(experienceId: string): Promise<string | null> {
  const { data, error } = await db
    .from("standalone_experience_internal")
    .select("supplier_price_changed_at")
    .eq("experience_id", experienceId)
    .maybeSingle();
  if (error) throw error;
  return (data?.supplier_price_changed_at as string | null) ?? null;
}

export async function clearSupplierPriceSignal(experienceId: string) {
  const { error } = await db.from("standalone_experience_internal").update({ supplier_price_changed_at: null }).eq("experience_id", experienceId);
  if (error) throw error;
}
