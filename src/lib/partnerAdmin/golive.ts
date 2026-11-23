// Back-office, parcours partenaire : le lien personnel (créer, régénérer, révoquer), le go live tel que
// le partenaire le voit (avec le tableau des champs de l'annonce), les cases cochées par l'équipe
// (date cible, accord trouvé, HyperGuest) et le prix public / la commission propre d'une expérience.
// Tout est réservé aux admins par la base.

import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { GoLive, ListingField } from "@/lib/partner/types";

const db = supabase as unknown as SupabaseClient;

export const goliveAdminKeys = {
  golive: (providerId: string) => ["admin-partner-golive", providerId] as const,
  link: (providerId: string) => ["admin-partner-link", providerId] as const,
};

export interface AdminExperienceCommercials {
  id: string;
  title: string;
  status: string;
  public_price_adult: number | null;
  public_price_child: number | null;
  supplier_price_adult: number | null;
  supplier_price_child: number | null;
  commission_type: "percent" | "fixed" | null;
  commission_value: number | null;
  commission_fixed_unit: "per_person" | "per_booking" | null;
  currency: string;
}

export interface AdminGoLive extends GoLive {
  fields: ListingField[];
  experiences: AdminExperienceCommercials[];
}

export interface ProviderLinkState {
  partner_link_token: string | null;
  partner_link_created_at: string | null;
  partner_link_first_opened_at: string | null;
  partner_link_last_seen_at: string | null;
  golive_target_date: string | null;
  hotel_agreement_at: string | null;
  hg_channel_manager_at: string | null;
  hg_rooms_mapped_at: string | null;
  hg_test_booking_at: string | null;
}

export type ProviderGoLivePatch = Partial<
  Pick<ProviderLinkState, "golive_target_date" | "hotel_agreement_at" | "hg_channel_manager_at" | "hg_rooms_mapped_at" | "hg_test_booking_at">
>;

export async function fetchAdminGoLive(providerId: string): Promise<AdminGoLive> {
  const { data, error } = await db.rpc("admin_partner_golive", { p_provider_id: providerId });
  if (error) throw error;
  return data as AdminGoLive;
}

export async function fetchProviderLinkState(providerId: string): Promise<ProviderLinkState> {
  const { data, error } = await db
    .from("providers")
    .select(
      "partner_link_token, partner_link_created_at, partner_link_first_opened_at, partner_link_last_seen_at, golive_target_date, hotel_agreement_at, hg_channel_manager_at, hg_rooms_mapped_at, hg_test_booking_at",
    )
    .eq("id", providerId)
    .single();
  if (error) throw error;
  return data as ProviderLinkState;
}

export async function updateProviderGoLive(providerId: string, patch: ProviderGoLivePatch): Promise<void> {
  const { error } = await db.from("providers").update(patch).eq("id", providerId);
  if (error) throw error;
}

export async function regeneratePartnerLink(providerId: string): Promise<string> {
  const { data, error } = await db.rpc("admin_partner_link_regenerate", { p_provider_id: providerId });
  if (error) throw error;
  return data as string;
}

export async function revokePartnerLink(providerId: string): Promise<void> {
  const { error } = await db.rpc("admin_partner_link_revoke", { p_provider_id: providerId });
  if (error) throw error;
}

export interface CommercialsResult {
  derived_adult: number | null;
  derived_child: number | null;
  supplier_price_adult: number | null;
  supplier_price_child: number | null;
  to_check: boolean;
}

/**
 * Prix public du partenaire et commission propre de l'expérience. Le prix fournisseur en découle s'il
 * est vide ; déjà saisi et différent, il n'est remplacé que si `applySupplier` est demandé.
 */
export async function saveExperienceCommercials(params: {
  experienceId: string;
  publicAdult: number | null;
  publicChild: number | null;
  commissionType: "percent" | "fixed" | null;
  commissionValue: number | null;
  commissionUnit: "per_person" | "per_booking" | null;
  applySupplier?: boolean;
}): Promise<CommercialsResult> {
  const { data, error } = await db.rpc("admin_set_experience_commercials", {
    p_experience_id: params.experienceId,
    p_public_adult: params.publicAdult,
    p_public_child: params.publicChild,
    p_commission_type: params.commissionType ?? "",
    p_commission_value: params.commissionValue,
    p_commission_unit: params.commissionUnit,
    p_apply_supplier: params.applySupplier ?? false,
  });
  if (error) throw error;
  return data as CommercialsResult;
}

/** Le prix fournisseur attendu : prix public moins commission (null si non calculable). */
export function derivedSupplierPrice(
  publicPrice: number | null,
  type: "percent" | "fixed" | null,
  value: number | null,
  unit: "per_person" | "per_booking" | null,
): number | null {
  if (publicPrice == null || type == null || value == null) return null;
  if (type === "percent") return Math.round(publicPrice * (1 - value / 100) * 100) / 100;
  if (unit === "per_person") return Math.max(publicPrice - value, 0);
  return null;
}
