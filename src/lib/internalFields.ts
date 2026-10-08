// Champs internes : prix fournisseur, marge, prestataire, contact du jour J...
//
// Ces informations ne vivent plus dans les tables que le site public peut lire. Chacune a sa table
// voisine, réservée aux admins (une ligne par fiche, reliée par son identifiant). Ce module est le
// seul endroit qui sait où elles sont rangées : les écrans du back-office lui demandent de les
// lire, de les séparer du reste d'un enregistrement, et de les sauvegarder.
import { supabase } from "@/integrations/supabase/client";

export interface InternalStore {
  /** Table interne, réservée aux admins. */
  table: string;
  /** Colonne qui relie la ligne interne à sa fiche. */
  key: string;
  /** Champs rangés dans cette table. */
  fields: readonly string[];
}

export const STANDALONE_EXPERIENCE_INTERNAL: InternalStore = {
  table: "standalone_experience_internal",
  key: "experience_id",
  fields: [
    "supplier_price_adult",
    "supplier_price_child",
    "markup_percent",
    "supplier_name",
    "supplier_boat_name",
    "supplier_contact",
    "supplier_payment_method",
    "supplier_booking_url",
    "provider_id",
    "booking_channel",
    "day_contact_name",
    "day_contact_phone",
    "day_contact_language",
  ],
};

export const STANDALONE_RATE_OPTION_INTERNAL: InternalStore = {
  table: "standalone_rate_option_internal",
  key: "rate_option_id",
  fields: ["supplier_price_adult", "supplier_price_child"],
};

export const STANDALONE_PRICE_VARIANT_INTERNAL: InternalStore = {
  table: "standalone_price_variant_internal",
  key: "variant_id",
  fields: ["purchase_price"],
};

export const EXPERIENCE2_INTERNAL: InternalStore = {
  table: "experience2_internal",
  key: "experience_id",
  fields: ["experience_net_cost", "experience_cost_fixed", "experience_cost_per_person"],
};

export const HOTEL2_INTERNAL: InternalStore = {
  table: "hotel2_internal",
  key: "hotel_id",
  fields: ["contact_email", "contact_phone", "commission_rate"],
};

type Row = Record<string, unknown>;

// Les tables internes ne sont pas encore décrites dans les types générés.
const db = supabase as any;

/** Sépare un enregistrement en deux : ce qui va dans la table publique, ce qui va dans la table interne. */
export function splitInternalFields<T extends Row>(store: InternalStore, payload: T) {
  const publicFields: Row = {};
  const internalFields: Row = {};
  for (const [field, value] of Object.entries(payload)) {
    if (store.fields.includes(field)) internalFields[field] = value;
    else publicFields[field] = value;
  }
  return { publicFields, internalFields };
}

/** Ne garde d'une ligne interne que ses champs métier (ni identifiant, ni date technique). */
function pickInternalFields(store: InternalStore, row: Row | null | undefined): Row {
  const picked: Row = {};
  if (!row) return picked;
  for (const field of store.fields) {
    if (field in row) picked[field] = row[field];
  }
  return picked;
}

/** Champs internes d'une fiche. Objet vide si la fiche n'en a pas encore. */
export async function fetchInternalFields(store: InternalStore, id: string): Promise<Row> {
  const { data, error } = await db.from(store.table).select("*").eq(store.key, id).maybeSingle();
  if (error) throw error;
  return pickInternalFields(store, data);
}

/** Ajoute à chaque ligne (repérée par `id`) ses champs internes. Une seule lecture pour toute la liste. */
export async function withInternalFields<T extends { id: string }>(store: InternalStore, rows: T[]): Promise<T[]> {
  if (rows.length === 0) return rows;
  const { data, error } = await db
    .from(store.table)
    .select("*")
    .in(
      store.key,
      rows.map((row) => row.id),
    );
  if (error) throw error;
  const byId = new Map<string, Row>((data ?? []).map((row: Row) => [row[store.key] as string, row]));
  return rows.map((row) => ({ ...row, ...pickInternalFields(store, byId.get(row.id)) }));
}

/**
 * Enregistre des champs internes pour une fiche. Seuls les champs fournis sont écrits : les autres
 * gardent leur valeur. Ne fait rien si aucun champ interne n'est fourni.
 */
export async function saveInternalFields(store: InternalStore, id: string, values: Row): Promise<void> {
  const internalFields = pickInternalFields(store, values);
  if (Object.keys(internalFields).length === 0) return;
  const { error } = await db.from(store.table).upsert({ [store.key]: id, ...internalFields }, { onConflict: store.key });
  if (error) throw error;
}
