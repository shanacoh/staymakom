import type { SupabaseClient } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PROVIDER_LINKS_QUERY_KEY } from "@/lib/providers/queries";
import {
  EMPTY_OFFER_PLAN,
  type ExperienceKind,
  type MustHave,
  type MustHaveDraft,
  type MustHavePatch,
  type OfferExperience,
  type OfferPlanData,
} from "./types";

// Lecture et écriture du Plan de l'offre. Les trois tables sont réservées aux admins par la base.

// Les tables du plan ne sont pas encore dans les types générés.
const db = supabase as unknown as SupabaseClient;

export const OFFER_PLAN_QUERY_KEY = ["admin-offer-plan"] as const;

const MUST_HAVE_COLUMNS =
  "id, category_id, pillar, name, format, season, car_free, is_core, status, partner, provider_id, notes, standalone_experience_id, experience2_id, offer_must_have_regions(region_id)";

type MustHaveRow = Omit<MustHave, "region_ids"> & { offer_must_have_regions: { region_id: string }[] | null };

interface StandaloneRow {
  id: string;
  title: string | null;
  title_fr: string | null;
  slug: string;
  status: string;
  category_id: string | null;
  category_ids: unknown;
  region_id: string | null;
}

interface HotelExperienceRow {
  id: string;
  title: string;
  status: string;
  category_id: string | null;
  hotel: { region_id: string | null } | null;
}

const toMustHave = ({ offer_must_have_regions, ...row }: MustHaveRow): MustHave => ({
  ...row,
  region_ids: (offer_must_have_regions ?? []).map((r) => r.region_id),
});

export async function fetchMustHaves(): Promise<MustHave[]> {
  const { data, error } = await db.from("offer_must_haves").select(MUST_HAVE_COLUMNS).order("name");
  if (error) throw error;
  return (data as unknown as MustHaveRow[]).map(toMustHave);
}

async function fetchExperiences(): Promise<OfferExperience[]> {
  const [standalone, hotel] = await Promise.all([
    db.from("standalone_experiences").select("id, title, title_fr, slug, status, category_id, category_ids, region_id"),
    db.from("experiences2").select("id, title, status, category_id, hotel:hotels2!experiences2_hotel_id_fkey(region_id)"),
  ]);
  if (standalone.error) throw standalone.error;
  if (hotel.error) throw hotel.error;

  const standaloneRows: OfferExperience[] = ((standalone.data ?? []) as StandaloneRow[]).map((s) => ({
    kind: "standalone",
    id: s.id,
    title: s.title || s.title_fr || s.slug,
    published: s.status === "published",
    moodIds: [...new Set([s.category_id, ...(Array.isArray(s.category_ids) ? (s.category_ids as string[]) : [])])].filter(
      (id): id is string => !!id
    ),
    regionId: s.region_id ?? null,
  }));
  const hotelRows: OfferExperience[] = ((hotel.data ?? []) as unknown as HotelExperienceRow[]).map((e) => ({
    kind: "experience2",
    id: e.id,
    title: e.title,
    published: e.status === "published",
    moodIds: e.category_id ? [e.category_id] : [],
    regionId: e.hotel?.region_id ?? null,
  }));
  return [...standaloneRows, ...hotelRows];
}

export async function fetchOfferPlan(): Promise<OfferPlanData> {
  const [moods, targets, mustHaves, experiences] = await Promise.all([
    db.from("categories").select("id, name, status, display_order"),
    db.from("offer_targets").select("category_id, region_id, target"),
    fetchMustHaves(),
    fetchExperiences(),
  ]);
  if (moods.error) throw moods.error;
  if (targets.error) throw targets.error;
  return { moods: moods.data ?? [], targets: targets.data ?? [], mustHaves, experiences };
}

export function useOfferPlan() {
  const query = useQuery({ queryKey: OFFER_PLAN_QUERY_KEY, queryFn: fetchOfferPlan });
  return { ...query, plan: query.data ?? EMPTY_OFFER_PLAN };
}

/** Enregistre l'objectif d'une case. Un objectif à 0 retire la ligne : pas de ligne = objectif 0. */
export async function saveTarget(categoryId: string, regionId: string, target: number): Promise<void> {
  const { error } =
    target > 0
      ? await db
          .from("offer_targets")
          .upsert({ category_id: categoryId, region_id: regionId, target }, { onConflict: "category_id,region_id" })
      : await db.from("offer_targets").delete().eq("category_id", categoryId).eq("region_id", regionId);
  if (error) throw error;
}

export async function updateMustHave(id: string, patch: MustHavePatch): Promise<void> {
  const { error } = await db.from("offer_must_haves").update(patch).eq("id", id);
  if (error) throw error;
}

/** Remplace d'un coup les régions candidates d'un must-have (liste vide = « à chercher »). */
export async function saveMustHaveRegions(id: string, regionIds: string[]): Promise<void> {
  const { error } = await db.rpc("set_must_have_regions", { p_must_have_id: id, p_region_ids: regionIds });
  if (error) throw error;
}

export async function createMustHave({ region_ids, ...fields }: MustHaveDraft): Promise<void> {
  const { data, error } = await db.from("offer_must_haves").insert([fields]).select("id").single();
  if (error) throw error;
  // Si cette seconde étape échoue, le must-have existe quand même, en « à chercher » : rien de bancal.
  if (region_ids.length > 0) await saveMustHaveRegions(data.id as string, region_ids);
}

/**
 * Relie une expérience à un must-have, ou la détache (mustHaveId = null). Tout se fait en une
 * seule opération côté base : l'ancien lien est retiré et le nouveau posé en même temps.
 */
export async function linkExperienceToMustHave(kind: ExperienceKind, experienceId: string, mustHaveId: string | null): Promise<void> {
  const { error } = await db.rpc("set_experience_must_have", {
    p_kind: kind,
    p_experience_id: experienceId,
    p_must_have_id: mustHaveId,
  });
  if (error) throw error;
}

/** Une écriture du plan : elle recharge le plan une fois terminée, réussie ou non. */
export function useOfferPlanMutation<TArgs>(write: (args: TArgs) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: write,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: OFFER_PLAN_QUERY_KEY });
      // Les must-haves reliés à un prestataire apparaissent aussi sur sa fiche.
      queryClient.invalidateQueries({ queryKey: PROVIDER_LINKS_QUERY_KEY });
    },
  });
}
