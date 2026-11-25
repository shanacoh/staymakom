// Ce qu'une page doit montrer aux robots, indépendamment de la mise en forme HTML.
// Chaque fiche (hôtel, expérience, article...) est d'abord traduite en PageModel
// (resolvers.ts), puis mise en page (renderBody.ts) et dans l'en-tête (patchHead.ts).

export interface PageLink {
  label: string;
  href: string;
  note?: string;
}

export interface PageSection {
  heading?: string;
  paragraphs?: string[];
  list?: string[];
  links?: PageLink[];
}

export interface PageFact {
  label: string;
  value: string;
}

export interface PageModel {
  /** 404 = fiche ou adresse inexistante. */
  status: 200 | 404;
  /** Adresse de référence (canonical) quand la page a plusieurs adresses (/hotels/x → /hotel/x). */
  canonicalPath?: string;
  /** Titre d'onglet / Google. Absent = celui d'index.html. */
  title?: string;
  /** Description Google (140 à 160 caractères). */
  description?: string;
  image?: string;
  /** Titre principal visible (un seul H1 par page). */
  h1?: string;
  intro?: string[];
  facts?: PageFact[];
  sections?: PageSection[];
  /** Fil d'Ariane : nom + chemin (ex. "/hotel/the-inbal-jerusalem"). */
  breadcrumbs?: { name: string; path: string }[];
  jsonLd?: (Record<string, unknown> | null)[];
  /**
   * Langues où le contenu principal existe vraiment. Absent = toutes. Une langue absente
   * n'est ni annoncée (hreflang, plan du site), et sa version pointe (canonical) vers l'anglais.
   */
  availableLangs?: string[];
  /**
   * Page écrite dans UNE seule langue (articles du Journal au nouveau format) : sa langue de
   * référence (canonical, html lang), quelle que soit la langue demandée dans l'adresse.
   */
  contentLang?: "en" | "fr" | "he";
  /**
   * Versions dans d'autres langues à des adresses différentes (articles d'un même sujet).
   * Présent = remplace le calcul habituel des hreflang ; liste vide = aucune alternative.
   */
  alternates?: { lang: string; url: string }[];
  /** true = on ne prépare pas de contenu (pages sur mesure pour un client, etc.). */
  passthrough?: boolean;
}

export const NOT_FOUND: PageModel = { status: 404 };
export const PASSTHROUGH: PageModel = { status: 200, passthrough: true };
