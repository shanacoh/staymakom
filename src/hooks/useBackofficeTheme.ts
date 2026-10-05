import { useEffect } from "react";

/**
 * Garde l'apparence du back-office (bleu marine, arrondis d'origine) pendant que le site client passe
 * à la nouvelle DA. La classe est posée sur <html> et pas sur le gabarit, pour que les fenêtres et menus
 * qui s'ouvrent par-dessus la page (rendus hors du gabarit) en héritent aussi.
 */
export function useBackofficeTheme() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("backoffice");
    return () => root.classList.remove("backoffice");
  }, []);
}
