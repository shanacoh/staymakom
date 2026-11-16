// Carte unique de ce qui se traduit automatiquement (ES / RU / DE...).
//
// Utilisée à la fois par la fonction serveur translate-content (qui traduit) et par le site
// (qui lit les traductions) : une seule liste à tenir à jour. Pour ajouter une langue
// (ex. l'arabe), ajouter une ligne dans AUTO_LOCALES et son nom dans AUTO_LOCALE_NAMES.
//
// Pour chaque type de contenu : la table, la colonne anglaise source de chaque champ
// (attention, elle s'appelle tantôt « title », tantôt « title_en »), et la règle
// « publié » qui décide si la fiche est visible sur le site.
//
// Volontairement absents (jamais traduits) : noms d'hôtels, nom des moods (categories.name),
// adresses (servent au GPS), prix, dates, liens.

export const AUTO_LOCALES = ["es", "ru", "de"] as const;
export type AutoLocale = (typeof AUTO_LOCALES)[number];

export const AUTO_LOCALE_NAMES: Record<AutoLocale, { native: string; english: string }> = {
  es: { native: "Español", english: "Spanish" },
  ru: { native: "Русский", english: "Russian" },
  de: { native: "Deutsch", english: "German" },
};

export function isAutoLocale(value: unknown): value is AutoLocale {
  return typeof value === "string" && (AUTO_LOCALES as readonly string[]).includes(value);
}

/**
 * « text » : un texte (HTML simple possible).
 * « list » : une liste de textes courts.
 * « blocks » : un article en blocs (JSON) ; seuls les textes des blocs sont traduits.
 */
export type FieldKind = "text" | "list" | "blocks";

export interface TranslatableField {
  /** Nom de la colonne anglaise source (c'est aussi la clé « field » enregistrée). */
  column: string;
  kind: FieldKind;
}

/** Règle « visible sur le site » : colonne à comparer à une valeur. */
export interface PublishedRule {
  column: string;
  equals: string | boolean;
}

export interface TranslatableEntity {
  table: string;
  fields: TranslatableField[];
  /** Conditions sur la ligne elle-même pour qu'elle soit publique. */
  published: PublishedRule[];
  /** Pour une sous-ligne (inclus, extra...) : la fiche parente qui doit être publiée. */
  parent?: { entityType: string; foreignKey: string };
  /** Petit libellé lisible pour les journaux et le back-office. */
  label: string;
}

const t = (column: string): TranslatableField => ({ column, kind: "text" });
const l = (column: string): TranslatableField => ({ column, kind: "list" });
const b = (column: string): TranslatableField => ({ column, kind: "blocks" });

const SEO_EN = [t("seo_title_en"), t("meta_description_en"), t("og_title_en"), t("og_description_en")];

export const TRANSLATABLE_ENTITIES = {
  standalone_experience: {
    table: "standalone_experiences",
    label: "Expérience standalone",
    published: [{ column: "status", equals: "published" }],
    fields: [
      t("title"), t("subtitle"), t("long_copy"),
      l("includes"), l("not_includes"), l("good_to_know"),
      t("know_before_you_go"), t("meeting_point"), t("access_note"), t("accessibility_info"),
      t("schedule_note"), t("contingency_note"), t("duration"), t("cancellation_policy"),
      t("city"), t("region"),
      ...SEO_EN,
    ],
  },
  standalone_experience_include: {
    table: "standalone_experience_includes",
    label: "Inclus (standalone)",
    published: [{ column: "published", equals: true }],
    parent: { entityType: "standalone_experience", foreignKey: "experience_id" },
    fields: [t("title")],
  },
  standalone_extra: {
    table: "standalone_extras",
    label: "Extra (standalone)",
    published: [{ column: "is_available", equals: true }],
    parent: { entityType: "standalone_experience", foreignKey: "experience_id" },
    fields: [t("title")],
  },
  standalone_rate_option: {
    table: "standalone_rate_options",
    label: "Option de tarif (standalone)",
    published: [{ column: "is_available", equals: true }],
    parent: { entityType: "standalone_experience", foreignKey: "experience_id" },
    fields: [t("label")],
  },
  standalone_mood_presentation: {
    table: "standalone_experience_mood_presentations",
    label: "Présentation par mood (standalone)",
    published: [],
    parent: { entityType: "standalone_experience", foreignKey: "experience_id" },
    fields: [t("title"), t("subtitle"), t("long_copy")],
  },
  experience2: {
    table: "experiences2",
    label: "Expérience avec hôtel",
    published: [{ column: "status", equals: "published" }],
    fields: [
      t("title"), t("subtitle"), t("long_copy"),
      l("includes"), l("not_includes"), l("good_to_know"), l("services"),
      t("accessibility_info"), t("duration"), t("cancellation_policy"),
      ...SEO_EN,
    ],
  },
  experience2_include: {
    table: "experience2_includes",
    label: "Inclus (expérience avec hôtel)",
    published: [{ column: "published", equals: true }],
    parent: { entityType: "experience2", foreignKey: "experience_id" },
    fields: [t("title"), t("description")],
  },
  experience2_addon: {
    table: "experience2_addons",
    label: "Option (expérience avec hôtel)",
    published: [{ column: "is_active", equals: true }],
    parent: { entityType: "experience2", foreignKey: "experience_id" },
    fields: [t("name"), t("description")],
  },
  experience2_practical_info: {
    table: "experience2_practical_info",
    label: "Info pratique (expérience avec hôtel)",
    published: [{ column: "is_visible", equals: true }],
    parent: { entityType: "experience2", foreignKey: "experience_id" },
    fields: [t("label"), t("value")],
  },
  hotel2: {
    table: "hotels2",
    label: "Hôtel",
    published: [{ column: "status", equals: "published" }],
    fields: [
      t("story"), l("highlights"), l("amenities"), t("description_location"), t("description_room"),
      t("city"), t("region"),
      ...SEO_EN,
    ],
  },
  category: {
    table: "categories",
    label: "Mood (catégorie)",
    published: [{ column: "status", equals: "published" }],
    fields: [t("presentation_title"), t("intro_rich_text"), t("launch_description"), l("bullets"), ...SEO_EN],
  },
  journal_post: {
    table: "journal_posts",
    label: "Article du Journal",
    published: [{ column: "status", equals: "published" }],
    fields: [t("title_en"), t("excerpt_en"), b("content_en"), ...SEO_EN],
  },
  region: {
    table: "regions",
    label: "Région",
    published: [{ column: "is_active", equals: true }],
    fields: [t("name")],
  },
  highlight_tag: {
    table: "highlight_tags",
    label: "Étiquette",
    published: [],
    fields: [t("label_en")],
  },
} as const satisfies Record<string, TranslatableEntity>;

export type EntityType = keyof typeof TRANSLATABLE_ENTITIES;

export function isEntityType(value: unknown): value is EntityType {
  return typeof value === "string" && value in TRANSLATABLE_ENTITIES;
}

/** Les sous-types rattachés à une fiche (ex. inclus et extras d'une expérience standalone). */
export function childEntityTypes(parent: EntityType): EntityType[] {
  return (Object.keys(TRANSLATABLE_ENTITIES) as EntityType[]).filter((key) => {
    const entity: TranslatableEntity = TRANSLATABLE_ENTITIES[key];
    return entity.parent?.entityType === parent;
  });
}

/** Les types « fiche » (sans parent) : ce sont eux qu'on parcourt, leurs sous-lignes suivent. */
export function rootEntityTypes(): EntityType[] {
  return (Object.keys(TRANSLATABLE_ENTITIES) as EntityType[]).filter((key) => {
    const entity: TranslatableEntity = TRANSLATABLE_ENTITIES[key];
    return !entity.parent;
  });
}
