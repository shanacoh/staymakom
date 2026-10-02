import type { Database } from "@/integrations/supabase/types";

export type DossierVoyage = Database["public"]["Tables"]["dossiers_voyage"]["Row"];
export type DossierVoyageInsert = Database["public"]["Tables"]["dossiers_voyage"]["Insert"];
export type DossierVoyageUpdate = Database["public"]["Tables"]["dossiers_voyage"]["Update"];

export type DossierVoyageVersion = Database["public"]["Tables"]["dossiers_voyage_versions"]["Row"];
export type DossierVoyageLigne = Database["public"]["Tables"]["dossiers_voyage_lignes"]["Row"];
export type DossierVoyageLigneInsert = Database["public"]["Tables"]["dossiers_voyage_lignes"]["Insert"];
export type DossierVoyageLigneUpdate = Database["public"]["Tables"]["dossiers_voyage_lignes"]["Update"];

export type NatureLigne = "hebergement" | "restaurant" | "activite" | "transport" | "lieu_a_visiter" | "autre";
export type OrigineLigne = "impose_shana" | "demande_client" | "ia";

export const NATURE_LIGNE_OPTIONS: { value: NatureLigne; label: string }[] = [
  { value: "hebergement", label: "Hébergement" },
  { value: "restaurant", label: "Restaurant" },
  { value: "activite", label: "Activité" },
  { value: "transport", label: "Transport" },
  { value: "lieu_a_visiter", label: "Lieu à visiter" },
  { value: "autre", label: "Autre" },
];

export const ORIGINE_LIGNE_OPTIONS: { value: OrigineLigne; label: string }[] = [
  { value: "impose_shana", label: "Imposé par Shana" },
  { value: "demande_client", label: "Demandé par le client" },
  { value: "ia", label: "Proposé par l'IA" },
];

/** Mappe le type d'une fiche Catalogue vers la nature la plus proche d'une ligne de dossier. */
export function placeTypeVersNature(placeType: string): NatureLigne {
  switch (placeType) {
    case "hebergement":
      return "hebergement";
    case "restaurant":
      return "restaurant";
    case "activite":
    case "bateau":
      return "activite";
    case "lieu_a_visiter":
      return "lieu_a_visiter";
    default:
      return "autre";
  }
}

export type DestinataireType = "client" | "influenceur";
export type Objectif = "vente" | "collab";
export type PointDepart = "explorer" | "proposition";
export type CanalOrigine = "whatsapp" | "email" | "formulaire_site" | "saisie_manuelle";
export type StatutDossierVoyage =
  | "nouvelle_demande"
  | "brief"
  | "en_preparation"
  | "envoye"
  | "retours"
  | "paye"
  | "collab_confirme"
  | "confirme"
  | "en_voyage"
  | "termine"
  | "perdu";

export const DESTINATAIRE_TYPE_OPTIONS: { value: DestinataireType; label: string }[] = [
  { value: "client", label: "Client" },
  { value: "influenceur", label: "Influenceur" },
];

export const OBJECTIF_OPTIONS: { value: Objectif; label: string }[] = [
  { value: "vente", label: "Vente" },
  { value: "collab", label: "Collab" },
];

export const POINT_DEPART_OPTIONS: { value: PointDepart; label: string }[] = [
  { value: "explorer", label: "Explorer (jeu de swipe)" },
  { value: "proposition", label: "Proposition directe" },
];

export const CANAL_ORIGINE_OPTIONS: { value: CanalOrigine; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp transféré" },
  { value: "email", label: "Email transféré" },
  { value: "formulaire_site", label: "Formulaire du site" },
  { value: "saisie_manuelle", label: "Saisie manuelle" },
];

// Pastilles douces, même esprit que le reste du back-office (ex. Catalogue)
export const STATUT_OPTIONS: { value: StatutDossierVoyage; label: string; className: string }[] = [
  { value: "nouvelle_demande", label: "Nouvelle demande", className: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "brief", label: "Brief", className: "bg-sky-50 text-sky-700 border-sky-200" },
  { value: "en_preparation", label: "En préparation", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "envoye", label: "Envoyé", className: "bg-violet-50 text-violet-700 border-violet-200" },
  { value: "retours", label: "Retours", className: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" },
  { value: "paye", label: "Payé", className: "bg-green-50 text-green-700 border-green-200" },
  { value: "collab_confirme", label: "Collab confirmée", className: "bg-green-50 text-green-700 border-green-200" },
  { value: "confirme", label: "Confirmé", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "en_voyage", label: "En voyage", className: "bg-teal-50 text-teal-700 border-teal-200" },
  { value: "termine", label: "Terminé", className: "bg-slate-50 text-slate-600 border-slate-200" },
  { value: "perdu", label: "Perdu", className: "bg-neutral-100 text-neutral-500 border-neutral-200" },
];

export function labelOf<T extends string>(options: { value: T; label: string }[], value: T): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

export interface LieuImpose {
  catalogue_item_id: string;
  nom: string;
  origine: "impose_shana" | "demande_client";
}

export function parseLieuxImposes(value: unknown): LieuImpose[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is LieuImpose =>
      !!v && typeof v === "object" && typeof (v as LieuImpose).catalogue_item_id === "string" && typeof (v as LieuImpose).nom === "string"
  );
}

/** Contenu de dossiers_voyage.brief_data, rempli par generate-dossier-brief (étape 4). */
export interface BriefData {
  contraintes: string | null;
  envies: string | null;
  incertitudes: string[];
  questions_a_poser: string[];
  message_whatsapp: string | null;
  exclusions_mentionnees: string[];
}

export function parseBriefData(value: unknown): BriefData {
  const o = (value && typeof value === "object" ? (value as Record<string, unknown>) : {}) as Record<string, unknown>;
  const strArray = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  return {
    contraintes: typeof o.contraintes === "string" ? o.contraintes : null,
    envies: typeof o.envies === "string" ? o.envies : null,
    incertitudes: strArray(o.incertitudes),
    questions_a_poser: strArray(o.questions_a_poser),
    message_whatsapp: typeof o.message_whatsapp === "string" ? o.message_whatsapp : null,
    exclusions_mentionnees: strArray(o.exclusions_mentionnees),
  };
}

/** L'étape du bandeau (Demande reçue / Brief / Composer / Lien client) correspondant au statut actuel. */
export type EtapeDossier = "demande_recue" | "brief" | "composer" | "lien_client";

export function etapeDuStatut(statut: string): EtapeDossier {
  if (statut === "nouvelle_demande") return "demande_recue";
  if (statut === "brief") return "brief";
  if (statut === "en_preparation") return "composer";
  return "lien_client"; // envoye, retours, paye, collab_confirme, confirme, en_voyage, termine, perdu
}

/** La ligne d'action en un coup d'œil affichée sous chaque dossier dans la liste (file actionnable). */
export interface StatutActionnable {
  texte: string;
  classe: string;
}

export function statutActionnable(d: DossierVoyage): StatutActionnable | null {
  if (d.archive) return null;
  if (d.statut === "nouvelle_demande") {
    return { texte: "Demande reçue, à analyser", classe: "text-red-600" };
  }
  if (d.statut === "brief") {
    return d.brief_valide_par_shana
      ? { texte: "Brief validé : composer et envoyer", classe: "text-red-600" }
      : { texte: "Brief généré, à valider", classe: "text-amber-600" };
  }
  if (d.statut === "en_preparation") {
    return { texte: "En préparation : programme à compléter", classe: "text-indigo-600" };
  }
  if (d.statut === "envoye") {
    const heuresDepuisEnvoi = d.envoye_at ? (Date.now() - new Date(d.envoye_at).getTime()) / 3_600_000 : null;
    if (d.point_depart === "explorer" && d.statut_lecture === "termine") {
      return { texte: "Swipe terminé : brouillon IA prêt", classe: "text-red-600" };
    }
    if (d.nb_ouvertures >= 3) {
      return { texte: `Ouvert ${d.nb_ouvertures} fois, pas de réponse`, classe: "text-amber-600" };
    }
    if (heuresDepuisEnvoi != null && heuresDepuisEnvoi >= 48 && d.nb_ouvertures === 0) {
      return { texte: `Envoyé il y a ${Math.round(heuresDepuisEnvoi)} h, jamais ouvert`, classe: "text-amber-600" };
    }
    return { texte: "Envoyé, en attente", classe: "text-muted-foreground" };
  }
  if (d.statut === "retours") return { texte: "Retours reçus : réviser", classe: "text-blue-600" };
  if (d.statut === "paye") return { texte: "Payé", classe: "text-green-600" };
  if (d.statut === "collab_confirme") return { texte: "Collab confirmée", classe: "text-green-600" };
  return null;
}
