// Prix « à partir de » d'une expérience seule (dans sa devise d'origine, ILS).
// Règle unique partagée par le site (src/lib/standaloneFromPrice.ts la réexporte) et par la
// version préparée pour Google : on affiche toujours le tarif le plus bas proposé ; quand un
// tarif enfant existe et qu'il est moins cher que le tarif adulte, c'est lui le prix d'appel.
// Fichier sans dépendance (règle : api/ n'importe jamais src/).
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
