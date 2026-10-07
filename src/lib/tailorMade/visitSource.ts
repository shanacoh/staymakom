// Source de la visite (campagne publicitaire, site d'origine, première page vue), mémorisée à
// l'arrivée sur le site pour être jointe à une demande sur mesure envoyée plus tard dans la
// même visite, sans rien demander au client.

const STORAGE_KEY = "staymakom_visit_source";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export type VisitSource = Partial<Record<(typeof UTM_KEYS)[number] | "referrer" | "landing_page", string>>;

/** À appeler une fois à l'arrivée sur le site. Ne remplace jamais une source déjà mémorisée. */
export function rememberVisitSource(): void {
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const source: VisitSource = { landing_page: window.location.pathname };
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) source[key] = value;
    }
    if (document.referrer) source.referrer = document.referrer;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(source));
  } catch {
    // Stockage du navigateur indisponible : la demande partira sans source.
  }
}

export function readVisitSource(): VisitSource {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as VisitSource) : {};
  } catch {
    return {};
  }
}

/** Libellé court de la source, pour les statistiques (campagne, sinon site d'origine, sinon accès direct). */
export function visitSourceLabel(source: VisitSource): string {
  if (source.utm_source) return source.utm_source;
  if (source.referrer) {
    try {
      return new URL(source.referrer).hostname;
    } catch {
      return source.referrer;
    }
  }
  return "direct";
}
