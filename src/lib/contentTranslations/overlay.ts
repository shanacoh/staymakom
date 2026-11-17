// Pose les textes traduits (table content_translations) sur les fiches reçues de la base,
// à la place des textes anglais. Fonctions « pures » : pas d'accès réseau ici, tout est
// testable (voir overlay.test.ts). Le branchement réseau est dans translatingFetch.ts.
//
// Principe : le site affiche le texte anglais quand la langue n'est ni le français ni
// l'hébreu. En remplaçant l'anglais par la traduction dans les données reçues, toutes les
// pages existantes affichent l'espagnol / le russe / l'allemand sans être modifiées.

import {
  TRANSLATABLE_ENTITIES,
  type EntityType,
  type FieldKind,
  type TranslatableEntity,
} from "../../../supabase/functions/_shared/translations/catalog";
import { hashSource, normalizeSource } from "../../../supabase/functions/_shared/translations/plan";

/**
 * Champs traduits mais JAMAIS posés sur les données : le site s'en sert aussi comme
 * repères (regroupement des lieux par région, filtres par nom de région). Les remplacer
 * casserait ces repères. Ils restent en anglais pour l'instant ; leur affichage traduit
 * se fera à part, avec les textes d'interface.
 */
const NEVER_OVERLAID_FIELDS = new Set(["city", "region"]);
const NEVER_OVERLAID_ENTITIES = new Set<EntityType>(["region"]);

export interface TranslationRow {
  entity_type: string;
  entity_id: string;
  field: string;
  text: string;
  source_hash: string;
}

export interface OverlayTarget {
  entityType: EntityType;
  row: Record<string, unknown>;
}

/** Table de la base → type de fiche traduisible. */
const ENTITY_BY_TABLE: Map<string, EntityType> = new Map(
  (Object.keys(TRANSLATABLE_ENTITIES) as EntityType[])
    .filter((key) => !NEVER_OVERLAID_ENTITIES.has(key))
    .map((key) => [(TRANSLATABLE_ENTITIES[key] as TranslatableEntity).table, key]),
);

export function entityTypeForTable(table: string): EntityType | undefined {
  return ENTITY_BY_TABLE.get(table);
}

function fieldKind(entityType: EntityType, field: string): FieldKind | undefined {
  const entity: TranslatableEntity = TRANSLATABLE_ENTITIES[entityType];
  return entity.fields.find((f) => f.column === field)?.kind;
}

/**
 * Lit la liste des colonnes demandées (paramètre « select ») pour savoir quelle table se
 * cache derrière chaque fiche rattachée. Ex. « *, hotel:hotels2(*), experience2_includes(*) »
 * → { hotel: "hotels2", experience2_includes: "experience2_includes" }.
 */
export function parseEmbeds(select: string): Map<string, string> {
  const embeds = new Map<string, string>();
  const pattern = /(?:([A-Za-z_][\w]*)\s*:\s*)?([A-Za-z_][\w]*)(?:\s*![\w]+)*\s*\(/g;
  for (const match of select.matchAll(pattern)) {
    const [, alias, table] = match;
    embeds.set(alias ?? table, table);
  }
  return embeds;
}

/** Repère toutes les fiches traduisibles d'une réponse, y compris les fiches rattachées. */
export function collectTargets(data: unknown, rootTable: string, embeds: Map<string, string>): OverlayTarget[] {
  const targets: OverlayTarget[] = [];

  const visit = (value: unknown, table: string | undefined) => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item, table);
      return;
    }
    if (!value || typeof value !== "object") return;
    const row = value as Record<string, unknown>;

    const entityType = table ? entityTypeForTable(table) : undefined;
    if (entityType && typeof row.id === "string") targets.push({ entityType, row });

    for (const [key, child] of Object.entries(row)) {
      if (child && typeof child === "object") {
        const childTable = embeds.get(key);
        if (childTable) visit(child, childTable);
      }
    }
  };

  visit(data, rootTable);
  return targets;
}

/** Remet un texte traduit dans la forme de la colonne d'origine (texte, liste, article). */
function decode(kind: FieldKind, text: string, original: unknown): unknown {
  // Texte simple, ou article en blocs rangé comme texte : on garde le texte tel quel.
  if (kind === "text" || typeof original === "string") return text;
  // Liste : la traduction est enregistrée en JSON, la colonne d'origine est une vraie liste.
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/**
 * Pose les traductions sur les fiches. Une traduction n'est posée que si elle a été faite à
 * partir du texte anglais ACTUEL (même empreinte) : si l'anglais a changé depuis, on garde
 * l'anglais plutôt que d'afficher une traduction périmée (horaire, prix, consigne...).
 * Retourne le nombre de textes remplacés.
 */
export async function applyTranslations(
  targets: OverlayTarget[],
  translationsFor: (entityType: EntityType, entityId: string) => TranslationRow[],
  /** Prévenu de chaque texte posé (traduction → anglais d'origine), pour pouvoir remettre
   *  l'anglais dans ce que le site enregistre ensuite (voir writeBack.ts). */
  onReplaced?: (translated: string, english: string) => void,
): Promise<number> {
  let replaced = 0;
  for (const { entityType, row } of targets) {
    for (const translation of translationsFor(entityType, row.id as string)) {
      const field = translation.field;
      if (NEVER_OVERLAID_FIELDS.has(field) || !(field in row)) continue;
      const kind = fieldKind(entityType, field);
      if (!kind) continue;

      const original = row[field];
      // Même calcul d'empreinte que la fonction qui traduit (translate-content)
      const source = normalizeSource(original, kind);
      if (!source || (await hashSource(source)) !== translation.source_hash) continue;

      const value = decode(kind, translation.text, original);
      if (value === undefined) continue;
      row[field] = value;
      replaced++;
      if (onReplaced) {
        if (typeof value === "string" && typeof original === "string") onReplaced(value, original);
        else if (Array.isArray(value) && Array.isArray(original)) {
          value.forEach((item, i) => {
            if (typeof item === "string" && typeof original[i] === "string") onReplaced(item, original[i]);
          });
        }
      }
    }
  }
  return replaced;
}
