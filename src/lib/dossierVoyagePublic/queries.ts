import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EtapeDossierPublic {
  dossier_id: string;
  etape: "explorer" | "proposition" | "carnet" | string;
  nom_destinataire: string;
  objectif: "vente" | "collab" | string;
  langue: "fr" | "en" | "he" | null;
}

export function useResoudreDossierVoyage(token: string | undefined) {
  return useQuery({
    queryKey: ["voyage-public", "etape", token],
    enabled: !!token,
    retry: false,
    queryFn: async (): Promise<EtapeDossierPublic | null> => {
      const { data, error } = await supabase.rpc("dossier_voyage_resoudre_etape", { p_token: token as string });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
}

export interface PropositionHeader {
  dossier_id: string;
  nom_destinataire: string;
  objectif: string;
  langue: "fr" | "en" | "he" | null;
  version_id: string | null;
  prix_total_vente: number | null;
  devise: string | null;
}

export function usePropositionHeader(token: string | undefined, actif: boolean) {
  return useQuery({
    queryKey: ["voyage-public", "proposition-header", token],
    enabled: !!token && actif,
    queryFn: async (): Promise<PropositionHeader | null> => {
      const { data, error } = await supabase.rpc("dossier_voyage_get_proposition_header_by_token", { p_token: token as string });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
}

export interface PropositionLigne {
  ligne_id: string;
  jour: number;
  nature: string;
  casher: boolean | null;
  nom_code: string | null;
  nom_code_en: string | null;
  nom_code_he: string | null;
  description_sensorielle: string | null;
  description_sensorielle_en: string | null;
  description_sensorielle_he: string | null;
  visuel_url: string | null;
  secteur_libelle: string | null;
  secteur_rayon_km: number | null;
  texte_libre: string | null;
}

export function usePropositionLignes(token: string | undefined, actif: boolean) {
  return useQuery({
    queryKey: ["voyage-public", "proposition-lignes", token],
    enabled: !!token && actif,
    queryFn: async (): Promise<PropositionLigne[]> => {
      const { data, error } = await supabase.rpc("dossier_voyage_get_proposition_lignes_by_token", { p_token: token as string });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSetReaction() {
  return useMutation({
    mutationFn: async (params: { token: string; ligneId: string; reaction: "jaime" | "mitige" | "non"; commentaire: string | null }) => {
      const { error } = await supabase.rpc("dossier_voyage_set_reaction", {
        p_token: params.token,
        p_ligne_id: params.ligneId,
        p_reaction: params.reaction,
        p_commentaire: params.commentaire,
      });
      if (error) throw error;
    },
  });
}

export function useEnvoyerRetours() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { error } = await supabase.rpc("dossier_voyage_envoyer_retours", { p_token: token });
      if (error) throw error;
    },
  });
}
