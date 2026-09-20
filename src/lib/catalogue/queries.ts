import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type {
  CatalogueCategory,
  CatalogueEntry,
  CatalogueItemUpdate,
  CatalogueLink,
  LinkPlatform,
  LiveKind,
} from "./types";

const ENTRIES_KEY = ["catalogue", "entries"] as const;
const PAGE_SIZE = 1000; // limite d'une lecture côté base : on lit par paquets pour ne jamais tronquer

/** Message lisible pour l'écran, quelle que soit la forme de l'erreur. */
export function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Une erreur est survenue";
}

const isDuplicate = (error: unknown) =>
  !!error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "23505";

// ============================================================================
// Lecture du catalogue
// ============================================================================

/**
 * Ajoute au catalogue les fiches publiées du site qui n'y sont pas encore. Lancée une fois à
 * l'ouverture de la page (pas à chaque enregistrement). Une erreur ici ne doit jamais empêcher
 * d'afficher le catalogue : on la note et on continue.
 * `gcTime: 0` : le résultat n'est pas gardé en mémoire, donc chaque ouverture de la page relance la synchro.
 */
export function useCatalogueSync() {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["catalogue", "sync"],
    gcTime: 0,
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc("sync_catalogue_with_site");
      if (error) {
        console.warn("Synchronisation du catalogue avec le site impossible :", error.message);
        return 0;
      }
      // Des fiches viennent d'être ajoutées : la liste déjà en mémoire n'est plus à jour
      if ((data ?? 0) > 0) await queryClient.invalidateQueries({ queryKey: ENTRIES_KEY });
      return data ?? 0;
    },
  });
}

async function fetchAllEntries(): Promise<CatalogueEntry[]> {
  const entries: CatalogueEntry[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("catalogue_overview")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    // La vue renvoie toutes ses colonnes comme "peut être vide" : CatalogueEntry les remet dans leur vrai type.
    entries.push(...((data ?? []) as unknown as CatalogueEntry[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return entries;
}

export function useCatalogueEntries() {
  const sync = useCatalogueSync();
  const entries = useQuery({
    queryKey: ENTRIES_KEY,
    queryFn: fetchAllEntries,
    enabled: sync.isSuccess, // on lit le catalogue une fois la synchro terminée
    refetchOnWindowFocus: false,
  });
  return {
    data: entries.data,
    error: entries.error,
    isLoading: sync.isPending || entries.isLoading,
  };
}

export function useCatalogueCategories() {
  return useQuery({
    queryKey: ["catalogue", "categories"],
    queryFn: async (): Promise<CatalogueCategory[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("display_order", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================================
// Fiches du site que l'on peut relier à un lieu
// ============================================================================

export interface SiteItemOption {
  kind: LiveKind;
  id: string;
  label: string;
  published: boolean;
}

export function useSiteItemsForLinking(enabled: boolean) {
  return useQuery({
    queryKey: ["catalogue", "site-items"],
    enabled,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<SiteItemOption[]> => {
      const [hotels, experiences, standalones] = await Promise.all([
        supabase.from("hotels2").select("id, name, status"),
        supabase.from("experiences2").select("id, title, status"),
        supabase.from("standalone_experiences").select("id, title, status"),
      ]);
      if (hotels.error) throw hotels.error;
      if (experiences.error) throw experiences.error;
      if (standalones.error) throw standalones.error;

      const options: SiteItemOption[] = [
        ...(hotels.data ?? []).map((h) => ({
          kind: "hotel" as const,
          id: h.id,
          label: h.name,
          published: h.status === "published",
        })),
        ...(experiences.data ?? []).map((e) => ({
          kind: "experience" as const,
          id: e.id,
          label: e.title,
          published: e.status === "published",
        })),
        ...(standalones.data ?? []).map((s) => ({
          kind: "standalone" as const,
          id: s.id,
          label: s.title ?? "(sans titre)",
          published: s.status === "published",
        })),
      ];
      return options.sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));
    },
  });
}

// ============================================================================
// Écritures
// ============================================================================

export interface NewLinkInput {
  url: string;
  platform: LinkPlatform;
  caption?: string | null;
  author?: string | null;
  thumbnail_url?: string | null;
}

export interface NewItemInput {
  name: string;
  nature?: string;
  place_type?: string;
  notes?: string | null;
  city?: string | null;
  region?: string | null;
  commercial_status?: string;
  source?: string;
}

/**
 * Crée un lieu et, si on en donne un, son premier lien en une seule opération : les deux sont
 * enregistrés ensemble ou pas du tout. Refuse un lien déjà présent ailleurs dans le catalogue.
 */
export function useCreateCatalogueItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ item, link }: { item: NewItemInput; link?: NewLinkInput | null }): Promise<string> => {
      const { data, error } = await supabase.rpc("catalogue_create_item", {
        p_item: item as unknown as Json,
        p_link: (link ?? null) as unknown as Json,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ENTRIES_KEY }),
  });
}

export function useUpdateCatalogueItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: CatalogueItemUpdate }) => {
      const { error } = await supabase.from("catalogue_items").update(patch).eq("id", id);
      if (error) {
        if (isDuplicate(error)) {
          throw new Error("Cette fiche du site est déjà dans le catalogue, sous un autre lieu.");
        }
        throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ENTRIES_KEY }),
  });
}

export function useDeleteCatalogueItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("catalogue_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ENTRIES_KEY }),
  });
}

// ============================================================================
// Liens et vidéos d'un lieu
// ============================================================================

export function useCatalogueLinks(itemId: string | null) {
  return useQuery({
    queryKey: ["catalogue", "links", itemId],
    enabled: !!itemId,
    queryFn: async (): Promise<CatalogueLink[]> => {
      const { data, error } = await supabase
        .from("catalogue_links")
        .select("*")
        .eq("item_id", itemId as string)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddCatalogueLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, link }: { itemId: string; link: NewLinkInput }) => {
      const { error } = await supabase.from("catalogue_links").insert({
        item_id: itemId,
        url: link.url.trim(),
        platform: link.platform,
        caption: link.caption?.trim() || null,
        author: link.author?.trim() || null,
        thumbnail_url: link.thumbnail_url || null,
      });
      if (error) {
        if (isDuplicate(error)) throw new Error("Ce lien est déjà dans le catalogue.");
        throw error;
      }
    },
    onSuccess: (_data, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ["catalogue", "links", itemId] });
      queryClient.invalidateQueries({ queryKey: ENTRIES_KEY });
    },
  });
}

export function useDeleteCatalogueLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ linkId }: { linkId: string; itemId: string }) => {
      const { error } = await supabase.from("catalogue_links").delete().eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: (_data, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ["catalogue", "links", itemId] });
      queryClient.invalidateQueries({ queryKey: ENTRIES_KEY });
    },
  });
}
