/**
 * Pause temporaire de la page d'accueil (préparation de l'offre d'hiver).
 *
 * Tant que la pause est active, l'adresse "/" affiche la page d'attente
 * (`src/pages/WinterPause.tsx`) à la place de la vraie home. Toutes les autres
 * pages du site (fiches, paiement, confirmations, back-office) restent accessibles.
 *
 * - Pour couper la pause avant la date de fin : passer `enabled` à false.
 * - Pour la prolonger : repousser `endsAt`.
 * - La vraie home reste visible pendant la pause à l'adresse "/v3" (pour l'équipe).
 *
 * Passé `endsAt`, la vraie home revient toute seule, sans rien toucher.
 */
export const SITE_PAUSE = {
  enabled: true,
  // Fin de la pause : mardi 13 octobre 2026 à minuit, heure d'Israël.
  endsAt: "2026-10-13T23:59:59+03:00",
};

export function isSitePauseActive(now: Date = new Date()): boolean {
  if (!SITE_PAUSE.enabled) return false;
  return now.getTime() <= new Date(SITE_PAUSE.endsAt).getTime();
}
