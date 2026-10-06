import type { Database } from "@/integrations/supabase/types";
import { type ColumnDef, type SelectOption, formatCurrency, CHANNEL_OPTIONS } from "./columnTypes";

export type BookingRow = Database["public"]["Tables"]["standalone_bookings"]["Row"];

export type NewBookingDraft = Partial<
  Pick<
    BookingRow,
    | "status"
    | "customer_name"
    | "customer_email"
    | "customer_phone"
    | "custom_experience_title"
    | "supplier_name"
    | "booking_date"
    | "time_slot"
    | "party_size"
    | "sell_price"
    | "currency"
    | "supplier_cost"
    | "payment_status"
    | "supplier_payment_status"
    | "internal_notes"
    | "channel"
  >
>;

export type ExperienceColumnKey =
  | "status"
  | "product_type"
  | "customer_name"
  | "customer_email"
  | "customer_phone"
  | "custom_experience_title"
  | "supplier_name"
  | "booking_date"
  | "time_slot"
  | "party_size"
  | "sell_price"
  | "supplier_cost"
  | "commission"
  | "payment_status"
  | "supplier_payment_status"
  | "internal_notes"
  | "channel";

// La base n'accepte que ces 3 statuts (le statut "Brouillon" n'a jamais existé côté base :
// une ligne créée avec lui était refusée). "pending" = paiement en ligne pas abouti.
export const STATUS_OPTIONS: SelectOption[] = [
  { value: "pending", label: "En attente" },
  { value: "confirmed", label: "Confirmé" },
  { value: "cancelled", label: "Annulé" },
];

// "failed" existe sur des paiements client déjà tentés (Revolut) via l'ancien
// flux — gardé ici pour que ces réservations restent lisibles dans la grille.
// Le paiement fournisseur (nouvelle colonne) n'a lui que pending/paid.
export const CLIENT_PAYMENT_OPTIONS: SelectOption[] = [
  { value: "pending", label: "Impayé" },
  { value: "failed", label: "Échoué" },
  { value: "paid", label: "Payé" },
];

// Type de produit, modifiable à la main : une réservation saisie sans fiche catalogue
// démarre en "Expérience" et se passe en "Bateau" ici.
export const PRODUCT_TYPE_OPTIONS: SelectOption[] = [
  { value: "experience", label: "Expérience" },
  { value: "boat", label: "Bateau" },
];

export const SUPPLIER_PAYMENT_OPTIONS: SelectOption[] = [
  { value: "pending", label: "Impayé" },
  { value: "paid", label: "Payé" },
];

export { formatCurrency };

export const EXPERIENCE_COLUMNS: ColumnDef[] = [
  { key: "status", label: "Statut", type: "select", options: STATUS_OPTIONS, widthClass: "w-[130px]" },
  { key: "product_type", label: "Type", type: "select", options: PRODUCT_TYPE_OPTIONS, widthClass: "w-[120px]" },
  {
    key: "customer_name",
    label: "Client",
    type: "text",
    widthClass: "w-[160px]",
    newRowPlaceholder: "+ Ajouter une réservation",
  },
  { key: "customer_email", label: "Email", type: "text", widthClass: "w-[190px]" },
  { key: "customer_phone", label: "Téléphone", type: "text", widthClass: "w-[130px]" },
  { key: "custom_experience_title", label: "Expérience", type: "text", widthClass: "w-[180px]" },
  { key: "supplier_name", label: "Fournisseur", type: "text", widthClass: "w-[150px]" },
  { key: "booking_date", label: "Date", type: "date", widthClass: "w-[150px]" },
  { key: "time_slot", label: "Créneau", type: "text", widthClass: "w-[110px]" },
  { key: "party_size", label: "Pers.", type: "number", widthClass: "w-[70px]", align: "right" },
  {
    key: "sell_price",
    label: "Montant client",
    type: "number",
    widthClass: "w-[150px]",
    align: "right",
    locksWhenAutomatic: true,
  },
  { key: "supplier_cost", label: "Coût fournisseur", type: "number", widthClass: "w-[140px]", align: "right" },
  { key: "commission", label: "Commission", type: "readonly", widthClass: "w-[110px]", align: "right" },
  {
    key: "payment_status",
    label: "Paiement client",
    type: "select",
    options: CLIENT_PAYMENT_OPTIONS,
    widthClass: "w-[140px]",
    locksWhenAutomatic: true,
  },
  {
    key: "supplier_payment_status",
    label: "Paiement fournisseur",
    type: "select",
    options: SUPPLIER_PAYMENT_OPTIONS,
    widthClass: "w-[150px]",
  },
  { key: "internal_notes", label: "Notes / relance", type: "text", widthClass: "w-[260px]" },
  { key: "channel", label: "Canal", type: "select", options: CHANNEL_OPTIONS, widthClass: "w-[130px]" },
];

export const EXPERIENCE_INTERACTIVE_COLUMNS = EXPERIENCE_COLUMNS.filter((c) => c.type !== "readonly");

// Une ligne saisie à la main démarre « Confirmée », paiement client « Non payé ».
export const NEW_ROW_DEFAULTS: NewBookingDraft = {
  status: "confirmed",
  currency: "ILS",
  payment_status: "pending",
  supplier_payment_status: "pending",
  party_size: 1,
  sell_price: 0,
};
