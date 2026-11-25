// Blog automatique du Journal : formes de données partagées (générateur, contrôles, tests).
// Fichiers sans dépendance Deno : ils sont aussi testés par vitest (src/lib/journal/*.test.ts).

export type JournalLang = "en" | "he" | "fr";
export const JOURNAL_LANGS: readonly JournalLang[] = ["en", "he", "fr"];

export type TopicType = "pilier" | "guide" | "saisonnier" | "cluster";

export interface BlogTopic {
  id: string;
  lang: JournalLang;
  primary_keyword: string;
  monthly_volume: number | null;
  difficulty: number | null;
  topic_type: TopicType;
  working_title: string;
  angle: string | null;
  link_regions: string[];
  link_moods: string[];
  link_cities: string[];
  link_note: string | null;
  desired_date: string | null; // AAAA-MM-JJ
  priority: number;
  status: "a_faire" | "genere" | "publie" | "ecarte";
  topic_group: string | null;
}

/** Fiche publiée proposée au rédacteur (expérience avec hôtel, expérience seule ou bateau). */
export interface ListingContext {
  id: string;
  kind: "experience" | "standalone" | "boat";
  /** Adresse relative de la fiche, sans langue (ex. /experience/black-gold-ritual-dead-sea). */
  path: string;
  title: string;
  description: string;
  city: string | null;
  region: string | null;
  moods: string[];
  /** Prix de départ en shekels, arrondi. null = sur demande. */
  from_price_ils: number | null;
  price_basis: "per_person" | "per_group" | "package" | null;
  cover_image: string | null;
  hotel_name: string | null;
  /** Rue / lieu exact (jamais envoyé au rédacteur, sert au contrôle « aucune adresse »). */
  address: string | null;
}

export interface PublishedArticleRef {
  title: string;
  path: string; // /journal/<slug>
  lang: JournalLang;
  primary_keyword: string | null;
}

export interface ArticleSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface ArticleFaq {
  question: string;
  answer: string;
}

/** Ce que le rédacteur (Claude) renvoie. */
export interface GeneratedArticle {
  slug: string;
  seo_title: string;
  meta_description: string;
  h1: string;
  intro: string;
  sections: ArticleSection[];
  booking_intro: string;
  booking_listing_ids: string[];
  faq: ArticleFaq[];
  conclusion: string;
  cover_listing_id: string;
  cover_alt: string;
  secondary_keywords: string[];
  to_verify: string[];
}

export interface JournalSettings {
  auto_publish: boolean;
  publish_hour: number;
  manual_review_remaining: number;
  forbidden_words: Partial<Record<JournalLang, string[]>>;
  provider_aliases: string[];
  provider_allowlist: string[];
  notify_email: string;
  indexnow_key: string | null;
  /** Dates vérifiées (fêtes, événements) données telles quelles au rédacteur. */
  key_dates: string;
  /** Grandes chaînes à ne jamais citer (bloque l'article). */
  chain_names: string[];
}
