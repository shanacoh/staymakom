// Tous les lieux du catalogue sont en Israël : une position ailleurs est forcément une erreur (homonyme
// trouvé à l'étranger, latitude et longitude inversées...). Même rectangle que src/lib/catalogue/geo.ts
// (les deux côtés tournent dans des environnements différents, donc la règle est écrite deux fois).

export const ISRAEL_BOUNDS = { south: 29.4, north: 33.4, west: 34.2, east: 35.9 } as const;

export function isInIsrael(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= ISRAEL_BOUNDS.south &&
    lat <= ISRAEL_BOUNDS.north &&
    lng >= ISRAEL_BOUNDS.west &&
    lng <= ISRAEL_BOUNDS.east
  );
}

/** Vrai quand une position existe et n'est pas en Israël (une position absente n'est pas suspecte). */
export function isOutsideIsrael(lat: number | null | undefined, lng: number | null | undefined): boolean {
  return typeof lat === "number" && typeof lng === "number" && !isInIsrael(lat, lng);
}
