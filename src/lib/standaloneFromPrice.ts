/**
 * Prix "à partir de" d'une expérience standalone (dans sa devise d'origine).
 * Règle : on affiche toujours le tarif le plus bas proposé. Quand un tarif
 * enfant existe et qu'il est moins cher que le tarif adulte, c'est lui qui
 * sert de prix d'appel.
 */
export function getStandaloneFromPrice(experience: {
  base_price: number;
  base_price_child?: number | null;
  has_child_price?: boolean | null;
}): number {
  const child = experience.base_price_child;
  if (experience.has_child_price && child != null && child > 0) {
    return Math.min(experience.base_price, child);
  }
  return experience.base_price;
}
