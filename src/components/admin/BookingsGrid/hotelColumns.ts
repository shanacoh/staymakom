import type { Database } from "@/integrations/supabase/types";
import { type ColumnDef, type SelectOption, formatCurrency } from "./columnTypes";

export type HotelBookingRow = Database["public"]["Tables"]["bookings_hg"]["Row"] & {
  hotels2?: { id: string; name: string } | null;
  experiences2?: { title: string } | null;
};

export type NewHotelBookingDraft = Partial<
  Pick<
    Database["public"]["Tables"]["bookings_hg"]["Row"],
    | "status"
    | "customer_name"
    | "customer_email"
    | "hotel_id"
    | "checkin"
    | "checkout"
    | "party_size"
    | "sell_price"
    | "currency"
    | "payment_status"
    | "internal_notes"
  >
>;

export type HotelColumnKey =
  | "status"
  | "customer_name"
  | "customer_email"
  | "hotel_id"
  | "checkin"
  | "checkout"
  | "party_size"
  | "sell_price"
  | "net_price"
  | "commission"
  | "payment_status"
  | "internal_notes";

// Valeurs vues venant de HyperGuest (voir Reservations.tsx historique) + les
// 3 statuts utiles pour une saisie manuelle.
export const HOTEL_STATUS_OPTIONS: SelectOption[] = [
  { value: "confirmed", label: "Confirmé" },
  { value: "pending", label: "En attente" },
  { value: "pendingreview", label: "En vérification" },
  { value: "cancelled", label: "Annulé" },
  { value: "failed", label: "Échoué" },
];

export const HOTEL_PAYMENT_OPTIONS: SelectOption[] = [
  { value: "unpaid", label: "Impayé" },
  { value: "paid", label: "Payé" },
  { value: "deposit_paid", label: "Acompte versé" },
  { value: "refund_pending", label: "Remb. dû" },
  { value: "refunded", label: "Remboursé" },
  { value: "no_refund_due", label: "Pas de remb." },
];

export { formatCurrency };

// Colonnes verrouillées pour une réservation automatique (source =
// hyperguest_sync) : tout ce qui reflète la réalité de la synchro/du
// paiement réel. `internal_notes` reste éditable dans tous les cas.
export const HOTEL_COLUMNS: ColumnDef[] = [
  {
    key: "status",
    label: "Statut",
    type: "select",
    options: HOTEL_STATUS_OPTIONS,
    widthClass: "w-[140px]",
    locksWhenAutomatic: true,
  },
  {
    key: "customer_name",
    label: "Client",
    type: "text",
    widthClass: "w-[160px]",
    locksWhenAutomatic: true,
    newRowPlaceholder: "+ Ajouter une réservation",
  },
  { key: "customer_email", label: "Email", type: "text", widthClass: "w-[190px]", locksWhenAutomatic: true },
  { key: "hotel_id", label: "Hôtel", type: "select", widthClass: "w-[180px]", locksWhenAutomatic: true },
  { key: "checkin", label: "Arrivée", type: "date", widthClass: "w-[140px]", locksWhenAutomatic: true },
  { key: "checkout", label: "Départ", type: "date", widthClass: "w-[140px]", locksWhenAutomatic: true },
  { key: "party_size", label: "Pers.", type: "number", widthClass: "w-[70px]", align: "right", locksWhenAutomatic: true },
  {
    key: "sell_price",
    label: "Montant client",
    type: "number",
    widthClass: "w-[150px]",
    align: "right",
    locksWhenAutomatic: true,
  },
  {
    key: "net_price",
    label: "Coût net",
    type: "number",
    widthClass: "w-[140px]",
    align: "right",
    locksWhenAutomatic: true,
  },
  { key: "commission", label: "Commission", type: "readonly", widthClass: "w-[110px]", align: "right" },
  {
    key: "payment_status",
    label: "Paiement",
    type: "select",
    options: HOTEL_PAYMENT_OPTIONS,
    widthClass: "w-[140px]",
    locksWhenAutomatic: true,
  },
  { key: "internal_notes", label: "Notes / relance", type: "text", widthClass: "w-[260px]" },
];

export const HOTEL_INTERACTIVE_COLUMNS = HOTEL_COLUMNS.filter((c) => c.type !== "readonly");

export const NEW_HOTEL_ROW_DEFAULTS: NewHotelBookingDraft = {
  status: "confirmed",
  currency: "ILS",
  payment_status: "unpaid",
  party_size: 1,
  sell_price: 0,
};
