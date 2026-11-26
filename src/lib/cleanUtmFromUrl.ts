// Nettoyage de la barre d'adresse : une fois les paramètres de campagne (utm_*) lus et
// mémorisés pour Amplitude, on les retire de l'adresse affichée, sans recharger la page
// et sans toucher aux autres paramètres (lang, etc.). Le client voit une adresse propre.

const UTM_PREFIX = "utm_";

/** Retourne la partie « ?… » de l'adresse sans les paramètres utm_* (chaîne vide s'il ne reste rien). */
export function stripUtmFromSearch(search: string): string {
  const params = new URLSearchParams(search);
  for (const key of Array.from(params.keys())) {
    if (key.toLowerCase().startsWith(UTM_PREFIX)) params.delete(key);
  }
  const rest = params.toString();
  return rest ? `?${rest}` : "";
}

/** Retire les utm_* de la barre d'adresse. Ne fait rien s'il n'y en a pas. */
export function cleanUtmFromAddressBar(): void {
  try {
    const { pathname, search, hash } = window.location;
    const cleaned = stripUtmFromSearch(search);
    if (cleaned === search) return;
    // On garde l'état d'historique existant (le routeur du site y range ses repères).
    window.history.replaceState(window.history.state, "", `${pathname}${cleaned}${hash}`);
  } catch {
    // Navigateur qui refuse : l'adresse reste avec ses utm, sans conséquence.
  }
}
