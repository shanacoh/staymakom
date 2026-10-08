// Validation et nettoyage de ce que l'IA renvoie pour le formulaire expérience.
// Règle unique : seuls les champs listés ici peuvent sortir. Un champ douteux est vidé, un champ
// inconnu ou interdit (prix, marge, disponibilités, prestataire, canal, contact jour J, statut...)
// n'est jamais recopié, même si l'IA le renvoie. Aucun accès réseau ni base : uniquement des règles,
// pour pouvoir les tester sans serveur.

export const str = (v: unknown, max = 5000): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length === 0 ? null : t.slice(0, max);
};
export const int = (v: unknown, min: number, max: number): number | null => {
  const n = typeof v === "number" ? Math.round(v) : NaN;
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};
const triState = (v: unknown): "yes" | "no" | "not_relevant" | null =>
  v === "yes" || v === "no" || v === "not_relevant" ? v : null;
const yesNo = (v: unknown): "yes" | "no" | null => (v === "yes" || v === "no" ? v : null);
export const strArray = (v: unknown, max = 15): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim().slice(0, 300)).slice(0, max) : [];

function cleanIncludeOrExtra(raw: unknown, withDescription: boolean): Record<string, string> | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const title = str(o.title, 150);
  if (!title) return null;
  const entry: Record<string, string> = {
    title,
    title_fr: str(o.title_fr, 150) ?? "",
    title_he: str(o.title_he, 150) ?? "",
  };
  if (withDescription) entry.description = str(o.description, 500) ?? "";
  return entry;
}

export interface BadgeRef {
  id: string;
  label: string;
}

/** Les listes de référence lues en base : l'IA ne peut choisir que dedans. */
export interface DraftReferences {
  categoriesBySlug: Map<string, string>;
  regionsBySlug: Map<string, string>;
  badgesBySlug: Map<string, BadgeRef>;
  /** Photos de la fiche proposées à l'IA, dans l'ordre où elles lui ont été montrées. */
  photoUrls: string[];
  maxCategories: number;
  /** Moods que l'IA peut proposer en plus, jamais en mood principal (« On the Water » : en principal, la fiche devient une fiche bateau). */
  secondaryOnlySlugs?: string[];
}

export interface ExperienceDraft {
  title: string;
  title_fr: string | null;
  title_he: string | null;
  subtitle: string | null;
  subtitle_fr: string | null;
  subtitle_he: string | null;
  long_copy: string;
  long_copy_fr: string | null;
  long_copy_he: string | null;
  category_id: string | null;
  category_ids: string[];
  category_slugs: string[];
  region_id: string | null;
  region_slug: string | null;
  badges: BadgeRef[];
  cover_image: string | null;
  includes: Record<string, string>[];
  extras: Record<string, string>[];
  duration: string | null;
  duration_fr: string | null;
  duration_he: string | null;
  min_party: number | null;
  max_party: number | null;
  min_nights: number | null;
  max_nights: number | null;
  city: string | null;
  city_fr: string | null;
  city_he: string | null;
  region: string | null;
  region_fr: string | null;
  region_he: string | null;
  address: string | null;
  address_fr: string | null;
  address_he: string | null;
  google_maps_link: string | null;
  practical_info: {
    kids: { status: "yes" | "no" | null; from_age: number | null };
    kosher: "yes" | "no" | "not_relevant" | null;
    parking: { status: "yes" | "no" | null };
  };
  accessibility_info: string | null;
  accessibility_info_fr: string | null;
  accessibility_info_he: string | null;
  cancellation_policy: string | null;
  cancellation_policy_fr: string | null;
  cancellation_policy_he: string | null;
  meeting_point: string | null;
  meeting_point_fr: string | null;
  meeting_point_he: string | null;
  arrive_minutes_before: number | null;
  know_before_you_go: string | null;
  know_before_you_go_fr: string | null;
  know_before_you_go_he: string | null;
  contingency_note: string | null;
  contingency_note_fr: string | null;
  contingency_note_he: string | null;
  seo_title_en: string | null;
  seo_title_fr: string | null;
  seo_title_he: string | null;
  meta_description_en: string | null;
  meta_description_fr: string | null;
  meta_description_he: string | null;
  og_title_en: string | null;
  og_title_fr: string | null;
  og_title_he: string | null;
  og_description_en: string | null;
  og_description_fr: string | null;
  og_description_he: string | null;
}

/** La photo que l'IA désigne par son numéro (1 = la première montrée), ou null si le numéro ne correspond à rien. */
export function pickPhoto(photoNumber: unknown, photoUrls: string[]): string | null {
  const n = int(photoNumber, 1, photoUrls.length);
  return n === null ? null : photoUrls[n - 1] ?? null;
}

export function parseDraft(raw: Record<string, unknown>, refs: DraftReferences): { draft: ExperienceDraft; toVerify: string[] } {
  const title = str(raw.title, 150);
  if (!title) throw new Error("Titre manquant dans la réponse de l'IA");
  const longCopy = str(raw.long_copy, 8000);
  if (!longCopy) throw new Error("Description manquante dans la réponse de l'IA");

  const includes = Array.isArray(raw.includes)
    ? raw.includes.map((i) => cleanIncludeOrExtra(i, false)).filter((i): i is Record<string, string> => i !== null).slice(0, 4)
    : [];
  const extras = Array.isArray(raw.extras)
    ? raw.extras.map((e) => cleanIncludeOrExtra(e, true)).filter((e): e is Record<string, string> => e !== null)
    : [];

  const toVerify = strArray(raw.to_verify, 20);

  const categoryIds: string[] = [];
  const resolvedSlugs: string[] = [];
  for (const slug of strArray(raw.category_slugs, refs.maxCategories)) {
    const id = refs.categoriesBySlug.get(slug);
    if (!id) {
      toVerify.push(`Mood proposé par l'IA (« ${slug} ») introuvable dans la liste : à choisir manuellement.`);
    } else if (!categoryIds.includes(id)) {
      categoryIds.push(id);
      resolvedSlugs.push(slug);
    }
  }

  // Un mood « secondaire seulement » ne peut pas être principal : il passe derrière, ou il est retiré s'il est seul.
  const secondaryOnly = refs.secondaryOnlySlugs ?? [];
  if (resolvedSlugs.length > 0 && secondaryOnly.includes(resolvedSlugs[0])) {
    const firstAllowed = resolvedSlugs.findIndex((slug) => !secondaryOnly.includes(slug));
    if (firstAllowed === -1) {
      toVerify.push("L'IA n'a trouvé que le mood « On the Water » : si c'est une sortie en bateau, crée la fiche depuis la page Bateaux ; sinon choisis le mood principal à la main.");
      categoryIds.length = 0;
      resolvedSlugs.length = 0;
    } else {
      categoryIds.unshift(...categoryIds.splice(firstAllowed, 1));
      resolvedSlugs.unshift(...resolvedSlugs.splice(firstAllowed, 1));
    }
  }

  // Région : uniquement une région de la liste. Un nom inconnu n'est jamais relié, il est signalé.
  const regionSlug = str(raw.region_slug, 100);
  const regionId = regionSlug ? refs.regionsBySlug.get(regionSlug) ?? null : null;
  if (regionSlug && !regionId) {
    toVerify.push(`Région proposée par l'IA (« ${regionSlug} ») introuvable dans la liste : à choisir manuellement.`);
  }

  // Badges : uniquement des badges existants, jamais de création.
  const badges: BadgeRef[] = [];
  for (const slug of strArray(raw.badge_slugs, 3)) {
    const badge = refs.badgesBySlug.get(slug);
    if (!badge) {
      toVerify.push(`Badge proposé par l'IA (« ${slug} ») absent de la liste : à créer ou à ignorer.`);
    } else if (!badges.some((b) => b.id === badge.id)) {
      badges.push(badge);
    }
  }

  const practicalRaw = (raw.practical_info && typeof raw.practical_info === "object" ? raw.practical_info : {}) as Record<string, unknown>;
  const kidsRaw = (practicalRaw.kids && typeof practicalRaw.kids === "object" ? practicalRaw.kids : {}) as Record<string, unknown>;
  const parkingRaw = (practicalRaw.parking && typeof practicalRaw.parking === "object" ? practicalRaw.parking : {}) as Record<string, unknown>;

  const draft: ExperienceDraft = {
    title,
    title_fr: str(raw.title_fr, 150),
    title_he: str(raw.title_he, 150),
    subtitle: str(raw.subtitle, 300),
    subtitle_fr: str(raw.subtitle_fr, 300),
    subtitle_he: str(raw.subtitle_he, 300),
    long_copy: longCopy,
    long_copy_fr: str(raw.long_copy_fr, 8000),
    long_copy_he: str(raw.long_copy_he, 8000),
    category_id: categoryIds[0] ?? null,
    category_ids: categoryIds,
    category_slugs: resolvedSlugs,
    region_id: regionId,
    region_slug: regionId ? regionSlug : null,
    badges,
    cover_image: pickPhoto(raw.cover_photo_number, refs.photoUrls),
    includes,
    extras,
    duration: str(raw.duration, 100),
    duration_fr: str(raw.duration_fr, 100),
    duration_he: str(raw.duration_he, 100),
    min_party: int(raw.min_party, 1, 100),
    max_party: int(raw.max_party, 1, 100),
    min_nights: int(raw.min_nights, 1, 8),
    max_nights: int(raw.max_nights, 1, 8),
    city: str(raw.city, 150),
    city_fr: str(raw.city_fr, 150),
    city_he: str(raw.city_he, 150),
    region: str(raw.region, 150),
    region_fr: str(raw.region_fr, 150),
    region_he: str(raw.region_he, 150),
    address: str(raw.address, 300),
    address_fr: str(raw.address_fr, 300),
    address_he: str(raw.address_he, 300),
    google_maps_link: str(raw.google_maps_link, 500),
    practical_info: {
      kids: { status: yesNo(kidsRaw.status), from_age: int(kidsRaw.from_age, 0, 18) },
      kosher: triState(practicalRaw.kosher),
      parking: { status: yesNo(parkingRaw.status) },
    },
    accessibility_info: str(raw.accessibility_info, 1000),
    accessibility_info_fr: str(raw.accessibility_info_fr, 1000),
    accessibility_info_he: str(raw.accessibility_info_he, 1000),
    cancellation_policy: str(raw.cancellation_policy, 1000),
    cancellation_policy_fr: str(raw.cancellation_policy_fr, 1000),
    cancellation_policy_he: str(raw.cancellation_policy_he, 1000),
    meeting_point: str(raw.meeting_point, 300),
    meeting_point_fr: str(raw.meeting_point_fr, 300),
    meeting_point_he: str(raw.meeting_point_he, 300),
    arrive_minutes_before: int(raw.arrive_minutes_before, 0, 600),
    know_before_you_go: str(raw.know_before_you_go, 1000),
    know_before_you_go_fr: str(raw.know_before_you_go_fr, 1000),
    know_before_you_go_he: str(raw.know_before_you_go_he, 1000),
    contingency_note: str(raw.contingency_note, 1000),
    contingency_note_fr: str(raw.contingency_note_fr, 1000),
    contingency_note_he: str(raw.contingency_note_he, 1000),
    seo_title_en: str(raw.seo_title_en, 60),
    seo_title_fr: str(raw.seo_title_fr, 60),
    seo_title_he: str(raw.seo_title_he, 60),
    meta_description_en: str(raw.meta_description_en, 155),
    meta_description_fr: str(raw.meta_description_fr, 155),
    meta_description_he: str(raw.meta_description_he, 155),
    og_title_en: str(raw.og_title_en, 60),
    og_title_fr: str(raw.og_title_fr, 60),
    og_title_he: str(raw.og_title_he, 60),
    og_description_en: str(raw.og_description_en, 155),
    og_description_fr: str(raw.og_description_fr, 155),
    og_description_he: str(raw.og_description_he, 155),
  };

  return { draft, toVerify };
}

// ---------------------------------------------------------------------------
// Présentation par mood (mode "mood")
// ---------------------------------------------------------------------------

export const MOOD_TEXT_FIELDS = [
  "title", "title_fr", "title_he",
  "subtitle", "subtitle_fr", "subtitle_he",
  "long_copy", "long_copy_fr", "long_copy_he",
] as const;

export type MoodTextField = (typeof MOOD_TEXT_FIELDS)[number];

export type MoodPresentationDraft = Record<MoodTextField, string> & { cover_image: string | null };

const MOOD_FIELD_MAX: Record<"title" | "subtitle" | "long_copy", number> = { title: 150, subtitle: 300, long_copy: 8000 };

const sameTitle = (a: string, b: string) => a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();

/**
 * Nettoie les présentations par mood renvoyées par l'IA.
 * - seuls les moods demandés sont gardés, et seulement titre / accroche / description / photo ;
 * - une photo n'est proposée que pour un mood qui n'en a pas (`needsCover`) ;
 * - un titre identique à un titre déjà pris sur la fiche est signalé dans « À vérifier ».
 */
export function parseMoodPresentations(
  raw: unknown,
  options: {
    /** slug du mood -> identifiant, pour les seuls moods demandés. */
    targetsBySlug: Map<string, { id: string; name: string }>;
    needsCover: Set<string>;
    photoUrls: string[];
    /** Titres déjà utilisés par les autres moods de la fiche (toutes langues confondues). */
    takenTitles: string[];
  },
): { presentations: Record<string, MoodPresentationDraft>; toVerify: string[] } {
  const presentations: Record<string, MoodPresentationDraft> = {};
  const toVerify: string[] = [];
  const taken = options.takenTitles.filter((t) => t.trim().length > 0);

  for (const entry of Array.isArray(raw) ? raw : []) {
    if (!entry || typeof entry !== "object") continue;
    const o = entry as Record<string, unknown>;
    const target = options.targetsBySlug.get(str(o.mood_slug, 100) ?? "");
    if (!target || presentations[target.id]) continue;

    const presentation = { cover_image: null } as MoodPresentationDraft;
    for (const field of MOOD_TEXT_FIELDS) {
      const part = field.replace(/_(fr|he)$/, "") as keyof typeof MOOD_FIELD_MAX;
      presentation[field] = str(o[field], MOOD_FIELD_MAX[part]) ?? "";
    }
    if (!MOOD_TEXT_FIELDS.some((f) => presentation[f])) continue;
    if (options.needsCover.has(target.id)) presentation.cover_image = pickPhoto(o.cover_photo_number, options.photoUrls);

    const titles = [presentation.title, presentation.title_fr, presentation.title_he].filter(Boolean);
    const duplicate = titles.find((t) => taken.some((other) => sameTitle(t, other)));
    if (duplicate) toVerify.push(`Le titre « ${duplicate} » du mood ${target.name} est identique à celui d'un autre mood : à changer.`);
    taken.push(...titles);

    presentations[target.id] = presentation;
  }

  return { presentations, toVerify };
}
