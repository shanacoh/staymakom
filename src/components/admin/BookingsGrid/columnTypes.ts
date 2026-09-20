// Types partagés entre les deux jeux de colonnes du tableur de réservations
// (expériences/bateaux sur standalone_bookings, hôtels sur bookings_hg).

export type ColumnType = "text" | "number" | "date" | "select" | "readonly";

export interface SelectOption {
  value: string;
  label: string;
}

export type ColumnKey = string;

export interface ColumnDef {
  key: ColumnKey;
  label: string;
  type: ColumnType;
  options?: SelectOption[];
  widthClass?: string;
  align?: "left" | "right";
  // Colonne verrouillée en lecture seule pour les réservations créées
  // automatiquement (paiement en ligne / synchro externe) — pour ne jamais
  // désynchroniser la réalité du paiement/de la synchro. Reste éditable pour
  // les réservations saisies manuellement.
  locksWhenAutomatic?: boolean;
  // Texte affiché sur la ligne "nouvelle réservation" tant que la colonne est vide.
  newRowPlaceholder?: string;
}

export const CURRENCY_OPTIONS = ["ILS", "USD", "EUR"];

const CURRENCY_SYMBOLS: Record<string, string> = { ILS: "₪", USD: "$", EUR: "€" };

export function formatCurrency(amount: number | null | undefined, currency: string | null | undefined) {
  if (amount === null || amount === undefined) return "—";
  const symbol = CURRENCY_SYMBOLS[currency || "ILS"] || currency || "₪";
  return `${symbol}${amount.toLocaleString("fr-FR")}`;
}
