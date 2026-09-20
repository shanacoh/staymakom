import { isHttpUrl } from "./embed";
import type {
  CatalogueEntry,
  CatalogueItemUpdate,
  CommercialStatus,
  Nature,
  PlaceType,
} from "./types";

/**
 * Brouillon de la fiche d'un lieu pendant qu'on la modifie : tout en texte ou en cases à cocher,
 * comme les champs de l'écran. `buildPatch` le compare au lieu d'origine et ne renvoie que ce qui a changé.
 */
export interface CatalogueDraft {
  name: string;
  nature: Nature;
  place_type: PlaceType;
  commercial_status: CommercialStatus;
  notes: string;
  city: string;
  region: string;
  address: string;
  google_maps_link: string;
  latitude: string;
  longitude: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  contact_instagram: string;
  contact_website: string;
  last_contact_date: string;
  next_followup_date: string;
  content_sent: boolean;
  content_sent_at: string;
  visited: boolean;
  visited_at: string;
  video_done: boolean;
  video_url: string;
  category_ids: string[];
  tags: string; // séparées par des virgules
}

export function draftFromEntry(entry: CatalogueEntry): CatalogueDraft {
  return {
    name: entry.name,
    nature: entry.nature,
    place_type: entry.place_type,
    commercial_status: entry.commercial_status,
    notes: entry.notes ?? "",
    city: entry.city ?? "",
    region: entry.region ?? "",
    address: entry.address ?? "",
    google_maps_link: entry.google_maps_link ?? "",
    latitude: entry.latitude === null ? "" : String(entry.latitude),
    longitude: entry.longitude === null ? "" : String(entry.longitude),
    contact_name: entry.contact_name ?? "",
    contact_phone: entry.contact_phone ?? "",
    contact_email: entry.contact_email ?? "",
    contact_instagram: entry.contact_instagram ?? "",
    contact_website: entry.contact_website ?? "",
    last_contact_date: entry.last_contact_date ?? "",
    next_followup_date: entry.next_followup_date ?? "",
    content_sent: entry.content_sent,
    content_sent_at: entry.content_sent_at ?? "",
    visited: entry.visited,
    visited_at: entry.visited_at ?? "",
    video_done: entry.video_done,
    video_url: entry.video_url ?? "",
    category_ids: [...entry.staymakom_category_ids],
    tags: entry.tags.join(", "),
  };
}

export function parseTags(text: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of text.split(",")) {
    const tag = raw.trim();
    const key = tag.toLowerCase();
    if (tag && !seen.has(key)) {
      seen.add(key);
      tags.push(tag);
    }
  }
  return tags;
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((value) => b.includes(value));
const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((value, index) => value === b[index]);
const orNull = (value: string): string | null => (value.trim() === "" ? null : value.trim());

export interface PatchResult {
  patch: CatalogueItemUpdate;
  error: string | null;
}

/**
 * Transforme le brouillon en modification à envoyer à la base : seulement les champs changés,
 * les champs vides deviennent "vide" en base. Pour un lieu relié à une fiche du site, le nom et la
 * localisation viennent de la fiche : on n'y touche pas depuis ici.
 */
export function buildPatch(draft: CatalogueDraft, entry: CatalogueEntry): PatchResult {
  const patch: CatalogueItemUpdate = {};
  const linked = entry.live_kind !== null;

  const setText = (key: keyof CatalogueItemUpdate, next: string, current: string | null) => {
    const value = orNull(next);
    if (value !== (current ?? null)) (patch as Record<string, unknown>)[key] = value;
  };

  if (!linked) {
    const name = draft.name.trim();
    if (!name) return { patch: {}, error: "Le nom du lieu ne peut pas être vide" };
    if (name !== entry.name) patch.name = name;

    setText("city", draft.city, entry.city);
    setText("region", draft.region, entry.region);
    setText("address", draft.address, entry.address);

    if (draft.google_maps_link.trim() && !isHttpUrl(draft.google_maps_link)) {
      return { patch: {}, error: "Le lien Google Maps doit commencer par https://" };
    }
    setText("google_maps_link", draft.google_maps_link, entry.google_maps_link);

    const lat = draft.latitude.trim();
    const lng = draft.longitude.trim();
    if ((lat === "") !== (lng === "")) {
      return { patch: {}, error: "Renseigne la latitude et la longitude ensemble, ou aucune des deux" };
    }
    const latitude = lat === "" ? null : Number(lat.replace(",", "."));
    const longitude = lng === "" ? null : Number(lng.replace(",", "."));
    if (
      (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) ||
      (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))
    ) {
      return { patch: {}, error: "Latitude ou longitude invalide" };
    }
    if (latitude !== entry.latitude) patch.latitude = latitude;
    if (longitude !== entry.longitude) patch.longitude = longitude;
  }

  if (draft.nature !== entry.nature) patch.nature = draft.nature;
  if (draft.place_type !== entry.place_type) patch.place_type = draft.place_type;
  if (draft.commercial_status !== entry.commercial_status) patch.commercial_status = draft.commercial_status;

  setText("notes", draft.notes, entry.notes);
  setText("contact_name", draft.contact_name, entry.contact_name);
  setText("contact_phone", draft.contact_phone, entry.contact_phone);
  setText("contact_email", draft.contact_email, entry.contact_email);
  setText("contact_instagram", draft.contact_instagram, entry.contact_instagram);
  setText("contact_website", draft.contact_website, entry.contact_website);
  setText("last_contact_date", draft.last_contact_date, entry.last_contact_date);
  setText("next_followup_date", draft.next_followup_date, entry.next_followup_date);

  if (draft.content_sent !== entry.content_sent) patch.content_sent = draft.content_sent;
  setText("content_sent_at", draft.content_sent_at, entry.content_sent_at);
  if (draft.visited !== entry.visited) patch.visited = draft.visited;
  setText("visited_at", draft.visited_at, entry.visited_at);
  if (draft.video_done !== entry.video_done) patch.video_done = draft.video_done;

  if (draft.video_url.trim() && !isHttpUrl(draft.video_url)) {
    return { patch: {}, error: "Le lien de ta vidéo doit commencer par https://" };
  }
  setText("video_url", draft.video_url, entry.video_url);

  if (!sameSet(draft.category_ids, entry.staymakom_category_ids)) patch.staymakom_category_ids = draft.category_ids;
  const tags = parseTags(draft.tags);
  if (!sameList(tags, entry.tags)) patch.tags = tags;

  return { patch, error: null };
}

export function hasChanges(result: PatchResult): boolean {
  return Object.keys(result.patch).length > 0;
}
