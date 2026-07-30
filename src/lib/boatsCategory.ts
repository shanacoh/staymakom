/**
 * Id de la catégorie "bateaux" (slug fixe, cf. migration 20260731010000).
 * Codé en dur plutôt que résolu via une requête sur `categories` : cette
 * catégorie reste volontairement en status='draft' (pour ne jamais apparaître
 * dans un menu ou le sitemap), ce qui bloquerait sa lecture par un visiteur
 * anonyme à cause du RLS de la table `categories` elle-même. Partagé entre le
 * front public (/boat) et le back office (Mes bateaux / Demandes).
 */
export const BOATS_CATEGORY_ID = "06434e23-29f4-4c6b-ba63-b61e68879520";
