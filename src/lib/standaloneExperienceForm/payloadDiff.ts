// « Ouvrir une fiche et l'enregistrer sans rien toucher ne doit modifier aucune donnée. »
//
// À l'ouverture d'une fiche, le formulaire photographie ce qu'il enverrait s'il enregistrait tout de
// suite (la « référence »). À l'enregistrement, seuls les champs dont la valeur a changé depuis cette
// photo sont envoyés à la base. Un champ jamais touché n'est donc jamais réécrit, même si le
// formulaire l'aurait reformulé (texte vide devenu « rien », prix arrondi, liste remise par défaut...).

type Payload = Record<string, unknown>;

// Écriture stable d'une valeur : deux objets identiques dont les clés sont rangées dans un ordre
// différent donnent le même texte. `undefined` est traité comme absent.
function stableStringify(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Payload)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
}

export const sameValue = (a: unknown, b: unknown) => stableStringify(a) === stableStringify(b);

/**
 * Les champs de `payload` dont la valeur diffère de la référence. Sans référence (fiche neuve),
 * tout est renvoyé. Un champ `undefined` n'est jamais envoyé : il ne veut pas dire « vider ».
 */
export function diffPayload<T extends Payload>(baseline: Payload | null | undefined, payload: T): Partial<T> {
  const patch: Partial<T> = {};
  for (const key of Object.keys(payload) as (keyof T & string)[]) {
    if (payload[key] === undefined) continue;
    if (baseline && sameValue(baseline[key], payload[key])) continue;
    patch[key] = payload[key];
  }
  return patch;
}
