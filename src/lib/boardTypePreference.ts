/**
 * Helper centralisé pour la sélection du rate plan en fonction de la pension préférée.
 *
 * Branché sur la colonne hotels2.preferred_board_type (option validée par Shana 2026-05-06).
 *
 * Règles :
 *   - preferredBoard = null/undefined → comportement historique : on retourne le moins cher
 *     parmi tous les rate plans, peu importe le type de pension (board).
 *   - preferredBoard = 'RO' | 'BB' | 'HB' | 'FB' | 'AI' (mode strict) → on filtre d'abord
 *     les rate plans qui matchent, puis on prend le moins cher du sous-ensemble.
 *     Si AUCUN rate plan ne matche, on retourne null → la chambre/date sera traitée comme
 *     "indisponible aux dates choisies" par les composants en aval (option B Shana).
 *
 * Cette fonction est volontairement générique (rate plans en forme "brute" ou modèle) :
 *   - Elle attend un getter pour board et un getter pour le prix sell.
 *   - Elle ne mute pas les inputs.
 */

export type BoardType = 'RO' | 'BB' | 'HB' | 'FB' | 'AI';

const VALID_BOARDS: readonly BoardType[] = ['RO', 'BB', 'HB', 'FB', 'AI'] as const;

export function isValidBoardType(value: unknown): value is BoardType {
  return typeof value === 'string' && VALID_BOARDS.includes(value as BoardType);
}

/**
 * Normalise une valeur (typiquement venant de la DB ou de l'API) en BoardType ou null.
 * Tout ce qui n'est pas une valeur reconnue → null (= pas de préférence).
 */
export function normalizeBoardPreference(value: unknown): BoardType | null {
  if (typeof value !== 'string') return null;
  const upper = value.trim().toUpperCase();
  return isValidBoardType(upper) ? upper : null;
}

/**
 * Sélectionne le rate plan préféré dans une liste, selon la règle décrite plus haut.
 *
 * @param ratePlans Liste de rate plans (peut être vide ou contenir des items invalides).
 * @param getBoard Fonction qui extrait le code board ('RO'|'BB'|...) d'un rate plan.
 * @param getSellAmount Fonction qui extrait le prix de vente (sell) d'un rate plan.
 *                     Doit retourner null/undefined/0 pour les plans non vendables.
 * @param preferredBoard Préférence de pension (null = pas de préférence).
 * @returns Le rate plan retenu, ou null si aucun ne correspond.
 */
export function pickPreferredRatePlan<T>(
  ratePlans: readonly T[],
  getBoard: (rp: T) => string | null | undefined,
  getSellAmount: (rp: T) => number | null | undefined,
  preferredBoard: BoardType | null,
): T | null {
  if (!ratePlans || ratePlans.length === 0) return null;

  // 1. Constituer le sous-ensemble candidat
  const candidates = preferredBoard
    ? ratePlans.filter((rp) => {
        const board = getBoard(rp);
        return typeof board === 'string' && board.toUpperCase() === preferredBoard;
      })
    : Array.from(ratePlans);

  if (candidates.length === 0) return null;

  // 2. Prendre le moins cher du sous-ensemble (en ignorant les prix nuls / 0)
  let cheapest: T | null = null;
  let cheapestAmount = Infinity;

  for (const rp of candidates) {
    const amount = getSellAmount(rp);
    if (typeof amount !== 'number' || amount <= 0) continue;
    if (amount < cheapestAmount) {
      cheapest = rp;
      cheapestAmount = amount;
    }
  }

  return cheapest;
}
