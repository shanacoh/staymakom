import type { Database } from "@/integrations/supabase/types";

export type SwipeCategory = Database["public"]["Tables"]["swipe_categories"]["Row"];
export type Proposition = Database["public"]["Tables"]["propositions"]["Row"];
export type PropositionInsert = Database["public"]["Tables"]["propositions"]["Insert"];
export type PropositionUpdate = Database["public"]["Tables"]["propositions"]["Update"];
export type Dossier = Database["public"]["Tables"]["dossiers"]["Row"];
export type DossierInsert = Database["public"]["Tables"]["dossiers"]["Insert"];
export type DossierProposition = Database["public"]["Tables"]["dossier_propositions"]["Row"];
export type Participant = Database["public"]["Tables"]["participants"]["Row"];
export type Swipe = Database["public"]["Tables"]["swipes"]["Row"];

export type DossierStatut = "brouillon" | "envoye" | "cloture";
export type DossierStatutLecture = "envoye" | "vu" | "termine";
export type PropositionStatut = "actif" | "archive";
export type ModeReservation = "reservable_en_ligne" | "demande_necessaire";

/** Proposition enrichie pour l'affichage back-office (bibliothèque, sélecteur de dossier) */
export interface PropositionAvecRelations extends Proposition {
  swipe_categories: { id: string; nom: string } | null;
  hotels2: { id: string; name: string; city: string | null; region: string | null } | null;
  experiences2: { id: string; title: string; hotel_id: string | null } | null;
  standalone_experiences: { id: string; title: string | null; city: string | null; region: string | null } | null;
}

/** Ligne de dossier_propositions enrichie de sa proposition, pour l'écran détail dossier */
export interface DossierPropositionAvecDetail extends DossierProposition {
  propositions: PropositionAvecRelations;
}

/** Carte du deck public, telle que renvoyée par la fonction RPC swipe_get_deck_by_token */
export interface SwipeDeckCard {
  dossier_proposition_id: string;
  ordre: number;
  titre: string;
  description: string | null;
  photo_url: string | null;
  ville: string | null;
  categorie_nom: string | null;
  prix_client: number | null;
}

/** Infos minimales de dossier résolues depuis le token public */
export interface SwipeDossierPublicInfo {
  dossier_id: string;
  nom_client: string;
  afficher_prix: boolean;
  statut: string;
}

/** Ligne du tableau croisé de résultats (une proposition du dossier) */
export interface ResultatLigne {
  dossier_proposition_id: string;
  proposition: PropositionAvecRelations;
  parParticipant: Record<string, { valeur: boolean | null; coupDeCoeur: boolean }>;
  score: number;
  nbIndispensables: number;
}
