// Le Plan de l'offre : ce qu'il faut avoir au catalogue (les « must-haves »), mood par mood et
// région par région, comparé à ce qui est réellement en ligne.

export type MustHaveStatus = "a_trouver" | "en_prospection" | "signe" | "en_ligne" | "abandonne";
export type MustHaveFormat =
  | "atelier"
  | "action"
  | "table"
  | "autonome"
  | "spectacle"
  | "degustation"
  | "guide"
  | "rencontre";
export type CarFree = "oui" | "bus" | "non" | "selon_lieu" | "a_voir";
export type ExperienceKind = "standalone" | "experience2";

export const STATUS_OPTIONS: { value: MustHaveStatus; label: string }[] = [
  { value: "a_trouver", label: "À trouver" },
  { value: "en_prospection", label: "En prospection" },
  { value: "signe", label: "Signé" },
  { value: "en_ligne", label: "En ligne" },
  { value: "abandonne", label: "Abandonné" },
];

export const FORMAT_OPTIONS: { value: MustHaveFormat; label: string }[] = [
  { value: "atelier", label: "Atelier" },
  { value: "action", label: "Action" },
  { value: "table", label: "Table" },
  { value: "autonome", label: "Autonome" },
  { value: "spectacle", label: "Spectacle" },
  { value: "degustation", label: "Dégustation" },
  { value: "guide", label: "Guide" },
  { value: "rencontre", label: "Rencontre" },
];

export const CAR_FREE_OPTIONS: { value: CarFree; label: string }[] = [
  { value: "oui", label: "Oui" },
  { value: "bus", label: "Bus" },
  { value: "non", label: "Non" },
  { value: "selon_lieu", label: "Selon lieu" },
  { value: "a_voir", label: "À voir" },
];

const labelOf = <T extends string>(options: { value: T; label: string }[], value: T | null | undefined) =>
  options.find((o) => o.value === value)?.label ?? "";

export const statusLabel = (value: MustHaveStatus | null | undefined) => labelOf(STATUS_OPTIONS, value);
export const formatLabel = (value: MustHaveFormat | null | undefined) => labelOf(FORMAT_OPTIONS, value);
export const carFreeLabel = (value: CarFree | null | undefined) => labelOf(CAR_FREE_OPTIONS, value);

/** Un mood (table `categories`). */
export interface OfferMood {
  id: string;
  name: string;
  status: string;
  display_order: number | null;
}

/** L'objectif d'une case mood x région. Pas de ligne = objectif 0. */
export interface OfferTarget {
  category_id: string;
  region_id: string;
  target: number;
}

export interface MustHave {
  id: string;
  category_id: string;
  pillar: string | null;
  name: string;
  format: MustHaveFormat | null;
  season: string | null;
  car_free: CarFree;
  is_core: boolean;
  status: MustHaveStatus;
  partner: string | null;
  notes: string | null;
  standalone_experience_id: string | null;
  experience2_id: string | null;
  /** Régions candidates. Liste vide = « à chercher ». */
  region_ids: string[];
}

/** Ce qu'on peut modifier sur un must-have depuis la liste. */
export type MustHavePatch = Partial<Pick<MustHave, "status" | "partner" | "notes">>;

/** Ce qu'il faut pour créer un must-have. */
export type MustHaveDraft = Omit<MustHave, "id" | "standalone_experience_id" | "experience2_id">;

/** Une expérience du site, seule ou hôtel, ramenée à ce dont le plan a besoin. */
export interface OfferExperience {
  kind: ExperienceKind;
  id: string;
  title: string;
  published: boolean;
  /** Tous les moods où elle apparaît (principal et secondaires). */
  moodIds: string[];
  /** Sa région (celle de l'hôtel pour une expérience hôtel), ou null si elle n'est pas reliée. */
  regionId: string | null;
}

export interface OfferPlanData {
  moods: OfferMood[];
  targets: OfferTarget[];
  mustHaves: MustHave[];
  experiences: OfferExperience[];
}

export const EMPTY_OFFER_PLAN: OfferPlanData = { moods: [], targets: [], mustHaves: [], experiences: [] };
