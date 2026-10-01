import type { Database } from "@/integrations/supabase/types";

export type DossierVoyage = Database["public"]["Tables"]["dossiers_voyage"]["Row"];
export type DossierVoyageInsert = Database["public"]["Tables"]["dossiers_voyage"]["Insert"];
export type DossierVoyageUpdate = Database["public"]["Tables"]["dossiers_voyage"]["Update"];

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
