import { useEffect } from "react";

/**
 * Active les couleurs propres au back-office (noir de marque pour la structure, rouge pour l'action,
 * voir `.backoffice` dans index.css). La classe est posée sur <html> et pas sur le gabarit, pour que les
 * fenêtres et menus qui s'ouvrent par-dessus la page (rendus hors du gabarit) en héritent aussi.
 */
export function useBackofficeTheme() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("backoffice");
    return () => root.classList.remove("backoffice");
  }, []);
}
