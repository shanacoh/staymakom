import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  BriefData,
  CanalOrigine,
  DestinataireType,
  DossierVoyage,
  DossierVoyageUpdate,
  Objectif,
  PointDepart,
} from "./types";

const LIST_KEY = ["dossiers_voyage", "liste"] as const;
const detailKey = (id: string) => ["dossiers_voyage", "detail", id] as const;

export function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "Une erreur est survenue";
}

/** Tous les dossiers de voyage, du plus récent au plus ancien (modèles et archivés inclus : le filtrage se fait à l'affichage). */
export function useDossiersVoyage() {
  return useQuery({
    queryKey: LIST_KEY,
    queryFn: async (): Promise<DossierVoyage[]> => {
      const { data, error } = await supabase
        .from("dossiers_voyage")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useDossierVoyage(id: string | undefined) {
  return useQuery({
    queryKey: detailKey(id ?? ""),
    enabled: !!id,
    queryFn: async (): Promise<DossierVoyage> => {
      const { data, error } = await supabase.from("dossiers_voyage").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });
}

export interface NouvelleDemandeInput {
  nom_destinataire: string;
  email: string;
  telephone: string;
  destinataire_type: DestinataireType;
  objectif: Objectif;
  point_depart: PointDepart;
  canal_origine: CanalOrigine;
  contenu_brut_recu: string;
}

export function useCreateDossierVoyage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: NouvelleDemandeInput): Promise<DossierVoyage> => {
      const { data, error } = await supabase
        .from("dossiers_voyage")
        .insert({
          nom_destinataire: input.nom_destinataire.trim(),
          email: input.email.trim() || null,
          telephone: input.telephone.trim() || null,
          destinataire_type: input.destinataire_type,
          objectif: input.objectif,
          point_depart: input.point_depart,
          canal_origine: input.canal_origine,
          contenu_brut_recu: input.contenu_brut_recu.trim() || null,
          statut: "nouvelle_demande",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

/** Duplique un modèle (ou tout autre dossier) : nouveau destinataire, lien et statut repartent de zéro. */
export function useDupliquerDossierVoyage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      modeleId,
      nom_destinataire,
    }: {
      modeleId: string;
      nom_destinataire: string;
    }): Promise<DossierVoyage> => {
      const { data: modele, error: errModele } = await supabase
        .from("dossiers_voyage")
        .select("*")
        .eq("id", modeleId)
        .single();
      if (errModele) throw errModele;

      const { data, error } = await supabase
        .from("dossiers_voyage")
        .insert({
          nom_destinataire: nom_destinataire.trim(),
          destinataire_type: modele.destinataire_type,
          objectif: modele.objectif,
          point_depart: modele.point_depart,
          canal_origine: "saisie_manuelle",
          statut: "nouvelle_demande",
          est_modele: false,
          modele_source_id: modeleId,
          afficher_prix: modele.afficher_prix,
          trier_par_categorie: modele.trier_par_categorie,
          message_intro: modele.message_intro,
          message_intro_en: modele.message_intro_en,
          message_intro_he: modele.message_intro_he,
          ordre_categories: modele.ordre_categories,
        })
        .select()
        .single();
      if (error) throw error;

      // Copie les lieux d'Explorer du modèle (dossier_propositions), si le modèle en a.
      const { data: propositionsModele } = await supabase
        .from("dossier_propositions")
        .select("proposition_id, catalogue_item_id, ordre")
        .eq("dossier_id", modeleId);
      if (propositionsModele && propositionsModele.length > 0) {
        await supabase.from("dossier_propositions").insert(
          propositionsModele.map((p) => ({
            dossier_id: data.id,
            proposition_id: p.proposition_id,
            catalogue_item_id: p.catalogue_item_id,
            ordre: p.ordre,
          }))
        );
      }

      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LIST_KEY }),
  });
}

export function copierLienDossierVoyage(tokenPublic: string): string {
  return `${window.location.origin}/voyage/${tokenPublic}`;
}

export function useUpdateDossierVoyage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: DossierVoyageUpdate): Promise<DossierVoyage> => {
      const { data, error } = await supabase.from("dossiers_voyage").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: detailKey(id) });
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}

/** Appelle l'edge function generate-dossier-brief : extrait un brief structuré du texte brut reçu. */
export function useGenerateDossierBrief(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<BriefData> => {
      const { data, error } = await supabase.functions.invoke("generate-dossier-brief", {
        body: { dossierId: id },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Échec de la génération du brief");
      return data.brief as BriefData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: detailKey(id) });
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}
