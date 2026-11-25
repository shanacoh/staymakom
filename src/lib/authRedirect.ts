// Page à rouvrir après connexion (ex. lien d'un email vers le back-office qui tombe sur /auth).
// Gardée aussi le temps d'un aller-retour Google (connexion par OAuth), dans l'onglet seulement.
// Seules les adresses internes du site sont acceptées (jamais un autre site).

const KEY = "staymakom-auth-redirect";

export function safeRedirectPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  if (value.startsWith("/auth")) return null;
  return value;
}

/** Note la page demandée (paramètre ?redirect= de /auth). */
export function rememberAuthRedirect(value: string | null): void {
  const path = safeRedirectPath(value);
  if (!path) return;
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // Navigation privée : on garde seulement le paramètre de l'adresse.
  }
}

/** Page à rouvrir maintenant que la personne est connectée (puis oubliée). */
export function consumeAuthRedirect(value: string | null): string | null {
  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch {
    stored = null;
  }
  return safeRedirectPath(value) || safeRedirectPath(stored);
}
