/**
 * Id de la catégorie "bateaux" (slug fixe, cf. migration 20260731010000).
 * Codé en dur plutôt que résolu via une requête sur `categories` : la
 * catégorie est publiée en saison et repassée en status='draft' hors saison
 * (la puce et la page catégorie disparaissent alors du site). En draft, un
 * visiteur anonyme ne peut plus la lire (RLS de la table `categories`), alors
 * que la vitrine /boat doit continuer à fonctionner toute l'année. Partagé
 * entre le front public (/boat) et le back office (onglet Bateaux / Réservations).
 */
export const BOATS_CATEGORY_ID = "06434e23-29f4-4c6b-ba63-b61e68879520";
