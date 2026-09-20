import type { Database } from "@/integrations/supabase/types";

export type CatalogueItemRow = Database["public"]["Tables"]["catalogue_items"]["Row"];
export type CatalogueItemUpdate = Database["public"]["Tables"]["catalogue_items"]["Update"];
export type CatalogueLink = Database["public"]["Tables"]["catalogue_links"]["Row"];

export type Nature = "partenaire" | "hors_reseau" | "inspiration";
export type PlaceType = "hebergement" | "restaurant" | "activite" | "lieu_a_visiter" | "bateau" | "autre";
export type CommercialStatus =
  | "a_trier"
  | "idee"
  | "a_contacter"
  | "contacte"
  | "en_discussion"
  | "partenaire"
  | "refuse";
export type Source = "manuel" | "tiktok" | "instagram" | "recommandation" | "site" | "autre";
export type LinkPlatform = "tiktok" | "instagram" | "youtube" | "facebook" | "google_maps" | "site_web" | "autre";
export type LiveKind = "hotel" | "experience" | "standalone";

/**
 * Une ligne de la "vitre" `catalogue_overview` : un lieu du catalogue avec, pour ceux qui sont
 * reliés à une fiche du site, les infos lues en direct sur cette fiche (préfixes `display_` et `live_`).
 * La vue renvoie toutes ses colonnes en "peut être vide" : on les remet ici dans leur vrai type.
 */
export interface CatalogueEntry {
  id: string;
  name: string;
  nature: Nature;
  place_type: PlaceType;
  notes: string | null;
  city: string | null;
  region: string | null;
  address: string | null;
  google_maps_link: string | null;
  latitude: number | null;
  longitude: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  contact_instagram: string | null;
  contact_website: string | null;
  commercial_status: CommercialStatus;
  last_contact_date: string | null;
  next_followup_date: string | null;
  content_sent: boolean;
  content_sent_at: string | null;
  visited: boolean;
  visited_at: string | null;
  video_done: boolean;
  video_url: string | null;
  staymakom_category_ids: string[];
  tags: string[];
  hotel_id: string | null;
  experience_id: string | null;
  standalone_experience_id: string | null;
  source: Source;
  created_at: string;
  updated_at: string;

  display_name: string;
  display_city: string | null;
  display_region: string | null;
  display_address: string | null;
  display_image: string | null;
  display_latitude: number | null;
  display_longitude: number | null;
  display_maps_link: string | null;
  live_kind: LiveKind | null;
  live_id: string | null;
  live_slug: string | null;
  live_status: string | null;
  site_category_ids: string[];
  links_count: number;
  first_thumbnail: string | null;
}

export interface CatalogueCategory {
  id: string;
  name: string;
}

export const NATURE_OPTIONS: { value: Nature; label: string; singular: string }[] = [
  { value: "partenaire", label: "Partenaires", singular: "Partenaire" },
  { value: "hors_reseau", label: "Hors réseau", singular: "Réservable hors réseau" },
  { value: "inspiration", label: "Inspiration", singular: "Contenu et inspiration" },
];

export const PLACE_TYPE_OPTIONS: { value: PlaceType; label: string }[] = [
  { value: "hebergement", label: "Hébergement" },
  { value: "restaurant", label: "Restaurant" },
  { value: "activite", label: "Activité" },
  { value: "lieu_a_visiter", label: "Lieu à visiter" },
  { value: "bateau", label: "Bateau" },
  { value: "autre", label: "Autre" },
];

// Pastilles douces (même esprit que les autres écrans du back-office)
export const STATUS_OPTIONS: { value: CommercialStatus; label: string; className: string }[] = [
  { value: "a_trier", label: "À trier", className: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "idee", label: "Idée", className: "bg-slate-50 text-slate-600 border-slate-200" },
  { value: "a_contacter", label: "À contacter", className: "bg-sky-50 text-sky-700 border-sky-200" },
  { value: "contacte", label: "Contacté", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "en_discussion", label: "En discussion", className: "bg-violet-50 text-violet-700 border-violet-200" },
  { value: "partenaire", label: "Partenaire", className: "bg-green-50 text-green-700 border-green-200" },
  { value: "refuse", label: "Refusé ou abandonné", className: "bg-neutral-100 text-neutral-500 border-neutral-200" },
];

export const SOURCE_OPTIONS: { value: Source; label: string }[] = [
  { value: "manuel", label: "Ajouté à la main" },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "recommandation", label: "Recommandation" },
  { value: "site", label: "Site Staymakom" },
  { value: "autre", label: "Autre" },
];

export const PLATFORM_LABELS: Record<LinkPlatform, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
  google_maps: "Google Maps",
  site_web: "Site web",
  autre: "Lien",
};

export const LIVE_KIND_LABELS: Record<LiveKind, string> = {
  hotel: "Hôtel",
  experience: "Expérience hôtel",
  standalone: "Expérience seule",
};

export function labelOf<T extends string>(
  options: { value: T; label: string }[],
  value: T | null | undefined
): string {
  return options.find((o) => o.value === value)?.label ?? "";
}

/** Page d'édition de la fiche du site (dans le back-office) pour un lieu relié, sinon null. */
export function siteEditPath(entry: Pick<CatalogueEntry, "live_kind" | "live_id">): string | null {
  if (!entry.live_id) return null;
  switch (entry.live_kind) {
    case "hotel":
      return `/admin/hotels2/edit/${entry.live_id}`;
    case "experience":
      return `/admin/experiences2/edit/${entry.live_id}`;
    case "standalone":
      return `/admin/experiences2/standalone/edit/${entry.live_id}`;
    default:
      return null;
  }
}

/** Page publique de la fiche sur le site, uniquement si la fiche est publiée. */
export function sitePublicPath(
  entry: Pick<CatalogueEntry, "live_kind" | "live_slug" | "live_status">
): string | null {
  if (!entry.live_slug || entry.live_status !== "published") return null;
  switch (entry.live_kind) {
    case "hotel":
      return `/hotel/${entry.live_slug}`;
    case "experience":
      return `/experience/${entry.live_slug}`;
    case "standalone":
      return `/standalone-experience/${entry.live_slug}`;
    default:
      return null;
  }
}
