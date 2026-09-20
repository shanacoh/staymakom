import { detectPlatform, isHttpUrl, sourceFromPlatform } from "./embed";
import { toUrl, type AppliedLookup, type LookupLink, type LookupSuggestion } from "./lookup";
import type { NewItemInput, NewLinkInput } from "./queries";
import { PLATFORM_LABELS, type CommercialStatus, type Nature, type PlaceType } from "./types";

export type AddMode = "place" | "link";

/** Infos retrouvées par la recherche qui n'ont pas de case dans la fenêtre : elles sont enregistrées avec le lieu. */
export type Extras = Pick<
  LookupSuggestion,
  "address" | "phone" | "email" | "instagram" | "website" | "latitude" | "longitude" | "google_maps_link"
>;

export const EMPTY_EXTRAS: Extras = {
  address: null,
  phone: null,
  email: null,
  instagram: null,
  website: null,
  latitude: null,
  longitude: null,
  google_maps_link: null,
};

type TextField = "name" | "city" | "region" | "notes" | "url";

/** Ce qui est saisi dans la fenêtre "Ajouter". `auto` liste les cases remplies par la recherche (pas à la main). */
export interface AddFormState {
  name: string;
  url: string;
  caption: string;
  nature: Nature;
  placeType: PlaceType;
  status: CommercialStatus;
  statusTouched: boolean;
  city: string;
  region: string;
  notes: string;
  extras: Extras;
  linkInfo: LookupLink | null;
  sources: string[];
  auto: string[];
}

export function emptyForm(): AddFormState {
  return {
    name: "",
    url: "",
    caption: "",
    nature: "inspiration",
    placeType: "autre",
    status: "idee",
    statusTouched: false,
    city: "",
    region: "",
    notes: "",
    extras: { ...EMPTY_EXTRAS },
    linkInfo: null,
    sources: [],
    auto: [],
  };
}

/** Une case modifiée à la main n'est plus considérée comme remplie par la recherche : elle ne sera plus écrasée. */
export function markEdited(form: AddFormState, key: string): AddFormState {
  return form.auto.includes(key) ? { ...form, auto: form.auto.filter((k) => k !== key) } : form;
}

/**
 * Remplit la fenêtre avec le résultat d'une recherche. Une case vide est remplie ; une case déjà
 * remplie par une recherche précédente est remplacée (on relance une recherche pour corriger) ;
 * une case saisie à la main n'est jamais touchée.
 */
export function applyLookupToForm(form: AddFormState, applied: AppliedLookup): AddFormState {
  const s = applied.suggestion;
  const next: AddFormState = { ...form, auto: [...form.auto] };

  const fill = (key: TextField, value: string | null | undefined) => {
    if (value && (form[key] === "" || form.auto.includes(key))) {
      next[key] = value;
      if (!next.auto.includes(key)) next.auto.push(key);
    }
  };
  fill("name", s.name);
  fill("city", s.city);
  fill("region", s.region);
  fill("notes", s.description);
  fill("url", applied.link?.url);

  if (s.place_type && (form.placeType === "autre" || form.auto.includes("placeType"))) {
    next.placeType = s.place_type;
    if (!next.auto.includes("placeType")) next.auto.push("placeType");
  }

  next.extras = {
    address: s.address,
    phone: s.phone,
    email: s.email,
    instagram: s.instagram,
    website: s.website,
    latitude: s.latitude,
    longitude: s.longitude,
    google_maps_link: s.google_maps_link,
  };
  next.linkInfo = applied.link;
  next.sources = applied.sources;
  return next;
}

export interface CreatePayload {
  item: NewItemInput;
  link: NewLinkInput | null;
}

/** Soit `payload` (prêt à enregistrer), soit `error` (message à afficher), jamais les deux. */
export interface BuildResult {
  payload?: CreatePayload;
  error?: string;
}

/**
 * Prépare ce qui est envoyé à la base, ou renvoie le message d'erreur à afficher.
 * `query` est ce qui est écrit dans la zone de recherche (un lien ou un nom).
 */
export function buildCreatePayload(
  form: AddFormState,
  mode: AddMode,
  query: string
): BuildResult {
  const queryUrl = toUrl(query);
  const url = form.url.trim() || (mode === "link" ? (queryUrl ?? "") : "");
  const nameFromQuery = mode === "link" && !queryUrl ? query.trim() : "";

  if (url && !isHttpUrl(url)) return { error: "Colle un lien complet, qui commence par https://" };
  if (mode === "link" && !url && !form.name.trim() && !nameFromQuery) {
    return { error: "Colle un lien ou écris le nom d'un lieu" };
  }
  if (mode === "place" && !form.name.trim()) return { error: "Donne au moins un nom au lieu" };

  const platform = url ? (form.linkInfo?.platform ?? detectPlatform(url)) : null;
  const name = form.name.trim() || nameFromQuery || (platform ? `À identifier (${PLATFORM_LABELS[platform]})` : "");
  const status = form.statusTouched ? form.status : mode === "link" ? "a_trier" : "idee";

  return {
    payload: {
      item: {
        name,
        nature: form.nature,
        place_type: form.placeType,
        commercial_status: status,
        city: form.city.trim() || null,
        region: form.region.trim() || null,
        notes: form.notes.trim() || null,
        address: form.extras.address,
        latitude: form.extras.latitude,
        longitude: form.extras.longitude,
        google_maps_link: form.extras.google_maps_link,
        contact_phone: form.extras.phone,
        contact_email: form.extras.email,
        contact_instagram: form.extras.instagram,
        contact_website: form.extras.website,
        source: platform ? sourceFromPlatform(platform) : "manuel",
      },
      link:
        url && platform
          ? {
              url,
              platform,
              caption: form.caption.trim() || form.linkInfo?.caption || null,
              author: form.linkInfo?.author ?? null,
              thumbnail_url: form.linkInfo?.thumbnail_url ?? null,
            }
          : null,
    },
  };
}
