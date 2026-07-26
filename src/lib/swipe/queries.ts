import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  Dossier,
  DossierInsert,
  DossierPropositionAvecDetail,
  Participant,
  PropositionAvecRelations,
  PropositionInsert,
  PropositionUpdate,
  Swipe,
  SwipeCategory,
  SwipeDeckCard,
  SwipeDossierPublicInfo,
} from "./types";

const PROPOSITION_SELECT =
  "*, swipe_categories(id, nom), hotels2(id, name, city, region), experiences2(id, title, hotel_id)";

// ============================================================================
// Catégories
// ============================================================================

export function useSwipeCategories() {
  return useQuery({
    queryKey: ["swipe", "categories"],
    queryFn: async (): Promise<SwipeCategory[]> => {
      const { data, error } = await supabase.from("swipe_categories").select("*").order("nom");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateSwipeCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (nom: string) => {
      const { error } = await supabase.from("swipe_categories").insert({ nom });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["swipe", "categories"] }),
  });
}

export function useUpdateSwipeCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nom }: { id: string; nom: string }) => {
      const { error } = await supabase.from("swipe_categories").update({ nom }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["swipe", "categories"] }),
  });
}

export function useDeleteSwipeCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("swipe_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["swipe", "categories"] }),
  });
}

// ============================================================================
// Bibliothèque de propositions
// ============================================================================

export interface PropositionFilters {
  recherche?: string;
  categorieId?: string;
  ville?: string;
  region?: string;
  statut?: "actif" | "archive" | "tous";
}

export function useSwipePropositions(filters: PropositionFilters = {}) {
  return useQuery({
    queryKey: ["swipe", "propositions", filters],
    queryFn: async (): Promise<PropositionAvecRelations[]> => {
      let query = supabase.from("propositions").select(PROPOSITION_SELECT);

      if (filters.categorieId) query = query.eq("categorie_id", filters.categorieId);
      if (filters.ville) query = query.eq("ville", filters.ville);
      if (filters.region) query = query.eq("region", filters.region);
      if (filters.statut && filters.statut !== "tous") query = query.eq("statut", filters.statut);
      else if (!filters.statut) query = query.eq("statut", "actif");
      if (filters.recherche) query = query.ilike("titre", `%${filters.recherche}%`);

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as PropositionAvecRelations[];
    },
  });
}

export function useCreateProposition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (proposition: PropositionInsert) => {
      const { data, error } = await supabase
        .from("propositions")
        .insert(proposition)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["swipe", "propositions"] }),
  });
}

export function useUpdateProposition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: PropositionUpdate & { id: string }) => {
      const { error } = await supabase.from("propositions").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swipe", "propositions"] });
      queryClient.invalidateQueries({ queryKey: ["swipe", "dossier-propositions"] });
    },
  });
}

export function useDeleteProposition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("propositions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["swipe", "propositions"] }),
  });
}

export function useDuplicateProposition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (proposition: PropositionAvecRelations) => {
      const {
        id: _id,
        created_at: _createdAt,
        updated_at: _updatedAt,
        swipe_categories: _cat,
        hotels2: _hotel,
        experiences2: _exp,
        ...rest
      } = proposition;
      const { error } = await supabase
        .from("propositions")
        .insert({ ...rest, titre: `Copie de ${rest.titre}` });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["swipe", "propositions"] }),
  });
}

// ============================================================================
// Recherche de fiches existantes (hôtels2 / expériences2) pour liaison
// ============================================================================

export function useHotelsPourLiaison(recherche: string) {
  return useQuery({
    queryKey: ["swipe", "hotels-liaison", recherche],
    queryFn: async () => {
      let query = supabase
        .from("hotels2")
        .select("id, name, city, region, hero_image, address")
        .eq("status", "published")
        .order("name")
        .limit(20);
      if (recherche) query = query.ilike("name", `%${recherche}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: recherche.length >= 2,
  });
}

export function useExperiencesPourLiaison(recherche: string) {
  return useQuery({
    queryKey: ["swipe", "experiences-liaison", recherche],
    queryFn: async () => {
      let query = supabase
        .from("experiences2")
        .select("id, title, hero_image, address, hotel_id, hotels2(city, region)")
        .eq("status", "published")
        .order("title")
        .limit(20);
      if (recherche) query = query.ilike("title", `%${recherche}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: recherche.length >= 2,
  });
}

/** Hôtels/expériences publiés qui n'ont pas encore de proposition correspondante dans la bibliothèque */
export function useFichesNonReferencees() {
  return useQuery({
    queryKey: ["swipe", "fiches-non-referencees"],
    queryFn: async () => {
      const [{ data: hotels, error: hotelsErr }, { data: experiences, error: expErr }, { data: propositions, error: propErr }] =
        await Promise.all([
          supabase.from("hotels2").select("id, name, city").eq("status", "published"),
          supabase.from("experiences2").select("id, title").eq("status", "published"),
          supabase.from("propositions").select("hotel_id, experience_id"),
        ]);
      if (hotelsErr) throw hotelsErr;
      if (expErr) throw expErr;
      if (propErr) throw propErr;

      const hotelIdsReferences = new Set(propositions.map((p) => p.hotel_id).filter(Boolean));
      const experienceIdsReferencees = new Set(propositions.map((p) => p.experience_id).filter(Boolean));

      return {
        hotels: hotels.filter((h) => !hotelIdsReferences.has(h.id)),
        experiences: experiences.filter((e) => !experienceIdsReferencees.has(e.id)),
      };
    },
  });
}

// ============================================================================
// Dossiers
// ============================================================================

export function useDossiers() {
  return useQuery({
    queryKey: ["swipe", "dossiers"],
    queryFn: async () => {
      const { data: dossiers, error } = await supabase
        .from("dossiers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const dossierIds = dossiers.map((d) => d.id);
      const [{ data: propositionsCounts }, { data: participantsCounts }] = await Promise.all([
        supabase.from("dossier_propositions").select("dossier_id").in("dossier_id", dossierIds.length ? dossierIds : [""]),
        supabase.from("participants").select("dossier_id").in("dossier_id", dossierIds.length ? dossierIds : [""]),
      ]);

      const countBy = (rows: { dossier_id: string }[] | null) => {
        const map = new Map<string, number>();
        (rows ?? []).forEach((r) => map.set(r.dossier_id, (map.get(r.dossier_id) ?? 0) + 1));
        return map;
      };
      const nbPropositions = countBy(propositionsCounts);
      const nbParticipants = countBy(participantsCounts);

      return dossiers.map((d) => ({
        ...d,
        nbPropositions: nbPropositions.get(d.id) ?? 0,
        nbParticipants: nbParticipants.get(d.id) ?? 0,
      }));
    },
  });
}

export function useDossier(dossierId: string | undefined) {
  return useQuery({
    queryKey: ["swipe", "dossier", dossierId],
    queryFn: async (): Promise<Dossier> => {
      const { data, error } = await supabase.from("dossiers").select("*").eq("id", dossierId as string).single();
      if (error) throw error;
      return data;
    },
    enabled: !!dossierId,
  });
}

export function useCreateDossier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dossier: DossierInsert) => {
      const { data, error } = await supabase.from("dossiers").insert(dossier).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["swipe", "dossiers"] }),
  });
}

export function useUpdateDossier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: Partial<Dossier> & { id: string }) => {
      const { error } = await supabase.from("dossiers").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["swipe", "dossiers"] });
      queryClient.invalidateQueries({ queryKey: ["swipe", "dossier", variables.id] });
    },
  });
}

export function useDupliquerDossier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dossierId: string) => {
      const [{ data: original, error: erreurDossier }, { data: propositionsOriginales, error: erreurPropositions }] =
        await Promise.all([
          supabase.from("dossiers").select("*").eq("id", dossierId).single(),
          supabase.from("dossier_propositions").select("proposition_id, ordre").eq("dossier_id", dossierId),
        ]);
      if (erreurDossier) throw erreurDossier;
      if (erreurPropositions) throw erreurPropositions;

      const { data: nouveauDossier, error: erreurCreation } = await supabase
        .from("dossiers")
        .insert({ nom_client: original.nom_client, afficher_prix: original.afficher_prix, statut: "brouillon" })
        .select()
        .single();
      if (erreurCreation) throw erreurCreation;

      if (propositionsOriginales.length > 0) {
        const { error: erreurCopie } = await supabase.from("dossier_propositions").insert(
          propositionsOriginales.map((p) => ({
            dossier_id: nouveauDossier.id,
            proposition_id: p.proposition_id,
            ordre: p.ordre,
          }))
        );
        if (erreurCopie) throw erreurCopie;
      }

      return nouveauDossier;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["swipe", "dossiers"] }),
  });
}

export function useDeleteDossier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dossiers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["swipe", "dossiers"] }),
  });
}

// ============================================================================
// Propositions d'un dossier (back-office)
// ============================================================================

export function useDossierPropositions(dossierId: string | undefined) {
  return useQuery({
    queryKey: ["swipe", "dossier-propositions", dossierId],
    queryFn: async (): Promise<DossierPropositionAvecDetail[]> => {
      const { data, error } = await supabase
        .from("dossier_propositions")
        .select(`*, propositions(${PROPOSITION_SELECT})`)
        .eq("dossier_id", dossierId as string)
        .order("ordre");
      if (error) throw error;
      return data as unknown as DossierPropositionAvecDetail[];
    },
    enabled: !!dossierId,
  });
}

export function useAjouterPropositionAuDossier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dossierId, propositionId, ordre }: { dossierId: string; propositionId: string; ordre: number }) => {
      const { error } = await supabase
        .from("dossier_propositions")
        .insert({ dossier_id: dossierId, proposition_id: propositionId, ordre });
      if (error) throw error;
    },
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: ["swipe", "dossier-propositions", variables.dossierId] }),
  });
}

export function useRetirerPropositionDuDossier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dossierId }: { id: string; dossierId: string }) => {
      const { error } = await supabase.from("dossier_propositions").delete().eq("id", id);
      if (error) throw error;
      return dossierId;
    },
    onSuccess: (dossierId) =>
      queryClient.invalidateQueries({ queryKey: ["swipe", "dossier-propositions", dossierId] }),
  });
}

export function useReordonnerPropositionsDossier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ dossierId, ordres }: { dossierId: string; ordres: { id: string; ordre: number }[] }) => {
      await Promise.all(
        ordres.map(({ id, ordre }) => supabase.from("dossier_propositions").update({ ordre }).eq("id", id))
      );
    },
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: ["swipe", "dossier-propositions", variables.dossierId] }),
  });
}

// ============================================================================
// Résultats (back-office)
// ============================================================================

export function useDossierParticipants(dossierId: string | undefined) {
  return useQuery({
    queryKey: ["swipe", "dossier-participants", dossierId],
    queryFn: async (): Promise<Participant[]> => {
      const { data, error } = await supabase
        .from("participants")
        .select("*")
        .eq("dossier_id", dossierId as string)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!dossierId,
  });
}

export function useDossierSwipes(dossierId: string | undefined, dossierPropositionIds: string[]) {
  return useQuery({
    queryKey: ["swipe", "dossier-swipes", dossierId, dossierPropositionIds],
    queryFn: async (): Promise<Swipe[]> => {
      if (dossierPropositionIds.length === 0) return [];
      const { data, error } = await supabase
        .from("swipes")
        .select("*")
        .in("dossier_proposition_id", dossierPropositionIds);
      if (error) throw error;
      return data;
    },
    enabled: !!dossierId && dossierPropositionIds.length > 0,
  });
}

// ============================================================================
// Page publique /swipe/:token — tout passe par les fonctions RPC token-scopées
// ============================================================================

export function useSwipeDossierByToken(token: string | undefined) {
  return useQuery({
    queryKey: ["swipe-public", "dossier", token],
    queryFn: async (): Promise<SwipeDossierPublicInfo | null> => {
      const { data, error } = await supabase.rpc("swipe_get_dossier_by_token", { p_token: token as string });
      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!token,
    retry: false,
  });
}

export function useSwipeParticipantsByToken(token: string | undefined) {
  return useQuery({
    queryKey: ["swipe-public", "participants", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("swipe_get_participants_by_token", { p_token: token as string });
      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });
}

export function useSwipeDeckByToken(token: string | undefined) {
  return useQuery({
    queryKey: ["swipe-public", "deck", token],
    queryFn: async (): Promise<SwipeDeckCard[]> => {
      const { data, error } = await supabase.rpc("swipe_get_deck_by_token", { p_token: token as string });
      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });
}

export function useGetOrCreateParticipant() {
  return useMutation({
    mutationFn: async ({ token, prenom }: { token: string; prenom: string }) => {
      const { data, error } = await supabase.rpc("swipe_get_or_create_participant", {
        p_token: token,
        p_prenom: prenom,
      });
      if (error) throw error;
      return data as string;
    },
  });
}

export function useUpsertSwipe() {
  return useMutation({
    mutationFn: async (params: {
      token: string;
      participantId: string;
      dossierPropositionId: string;
      valeur: boolean;
    }) => {
      const { error } = await supabase.rpc("swipe_upsert_swipe", {
        p_token: params.token,
        p_participant_id: params.participantId,
        p_dossier_proposition_id: params.dossierPropositionId,
        p_valeur: params.valeur,
      });
      if (error) throw error;
    },
  });
}

export function useCancelSwipe() {
  return useMutation({
    mutationFn: async (params: { token: string; participantId: string; dossierPropositionId: string }) => {
      const { error } = await supabase.rpc("swipe_cancel_swipe", {
        p_token: params.token,
        p_participant_id: params.participantId,
        p_dossier_proposition_id: params.dossierPropositionId,
      });
      if (error) throw error;
    },
  });
}

export function useSetCoupDeCoeur() {
  return useMutation({
    mutationFn: async (params: {
      token: string;
      participantId: string;
      dossierPropositionId: string;
      valeur: boolean;
    }) => {
      const { error } = await supabase.rpc("swipe_set_coup_de_coeur", {
        p_token: params.token,
        p_participant_id: params.participantId,
        p_dossier_proposition_id: params.dossierPropositionId,
        p_valeur: params.valeur,
      });
      if (error) throw error;
    },
  });
}
