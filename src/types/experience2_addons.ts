/**
 * Types pour les add-ons d'expérience (experience2_addons)
 * Compatible Supabase. Prix final = prix HyperGuest + addons.
 */

export type AddonType =
  // === Section 1 : Experience Pricing (extras client) ===
  | "per_person"           // Prix par personne
  | "per_night"            // Prix par nuit
  | "per_person_per_night" // Prix par personne par nuit
  | "fixed"                // Montant fixe
  // === Section 2 : Commissions (marge Staymakom) ===
  | "commission"           // Commission sur le total
  | "commission_room"      // Commission sur prix de la chambre
  | "commission_experience"// Commission sur prix de l'expérience
  | "commission_fixed"     // Commission montant fixe
  // === Section 3 : Taxes ===
  | "tax";                 // Taxe

// ---------------------------------------------------------------------------
// Section grouping helpers
// ---------------------------------------------------------------------------

export const EXPERIENCE_PRICING_TYPES: AddonType[] = ["per_person", "per_night", "per_person_per_night", "fixed"];
export const COMMISSION_TYPES: AddonType[] = ["commission", "commission_room", "commission_experience", "commission_fixed"];
export const TAX_TYPES: AddonType[] = ["tax"];

export interface ExperienceAddon {
  id: string;
  experience_id: string;
  type: AddonType;
  name: string;
  name_he?: string | null;
  description?: string | null;
  description_he?: string | null;
  value: number;
  is_percentage: boolean;
  calculation_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExperienceAddonInsert {
  experience_id: string;
  type: AddonType;
  name: string;
  name_he?: string | null;
  description?: string | null;
  description_he?: string | null;
  value: number;
  is_percentage: boolean;
  calculation_order?: number;
  is_active?: boolean;
}

export interface ExperienceAddonUpdate {
  type?: AddonType;
  name?: string;
  name_he?: string | null;
  description?: string | null;
  description_he?: string | null;
  value?: number;
  is_percentage?: boolean;
  calculation_order?: number;
  is_active?: boolean;
}

export interface AddonFormData {
  type: AddonType;
  name: string;
  name_he?: string | null;
  description?: string | null;
  description_he?: string | null;
  value: number;
  is_percentage: boolean;
  calculation_order: number;
}

// ---------------------------------------------------------------------------
// Pricing V2 types
// ---------------------------------------------------------------------------

export interface PricingConfig {
  commission_room_pct: number;
  commission_addons_pct: number;
  tax_pct: number;
  promo_type: string | null;
  promo_value: number | null;
  promo_is_percentage: boolean;
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  commission_room_pct: 0,
  commission_addons_pct: 0,
  tax_pct: 0,
  promo_type: null,
  promo_value: null,
  promo_is_percentage: true,
};

// ---------------------------------------------------------------------------
// Addon line types for breakdown
// ---------------------------------------------------------------------------

export interface PricingAddonLine {
  name: string;
  type: AddonType;
  unitPrice: number;
  multiplier: number;
  total: number;
  description?: string;
}

export interface CommissionLine {
  name: string;
  type: AddonType;
  value: number;
  isPercentage: boolean;
  baseAmount: number;
  total: number;
}

export interface PerPersonAddonLine {
  name: string;
  pricePerPerson: number;
  guests: number;
  total: number;
}

export interface PriceBreakdownV2 {
  roomPrice: number;
  // V3 addon lines
  pricingAddonLines: PricingAddonLine[];
  totalPricingAddons: number;
  commissionLines: CommissionLine[];
  totalCommissions: number;
  subtotalBeforeTax: number;
  taxLines: { name: string; pct: number; amount: number; note?: string }[];
  totalTax: number;
  // Legacy compat
  perPersonAddons: PerPersonAddonLine[];
  totalAddons: number;
  commissionRoomPct: number;
  commissionRoomAmount: number;
  commissionAddonsPct: number;
  commissionAddonsAmount: number;
  promo: {
    type: string | null;
    value: number | null;
    isPercentage: boolean;
    discountAmount: number;
    fakeOriginalPrice: number | null;
  };
  finalTotal: number;
  currency: string;
  nights: number;
  guests: number;
  taxPct: number;
  taxAmount: number;
}

// ---------------------------------------------------------------------------
// ADDON_TYPES — full labels
// ---------------------------------------------------------------------------

export const ADDON_TYPES: Record<AddonType, { label: string; labelHe?: string; description: string }> = {
  // --- Experience Pricing ---
  per_person: {
    label: "Per Person Fee",
    labelHe: "מחיר לאדם",
    description: "Amount multiplied by the number of guests (e.g. +₪30/person)",
  },
  per_night: {
    label: "Per Night Fee",
    labelHe: "מחיר ללילה",
    description: "Amount multiplied by the number of nights (e.g. +₪20/night)",
  },
  per_person_per_night: {
    label: "Per Person Per Night",
    labelHe: "מחיר לאדם ללילה",
    description: "Amount multiplied by guests × nights (e.g. +₪15/person/night)",
  },
  fixed: {
    label: "Fixed Amount",
    labelHe: "מחיר קבוע",
    description: "One-time fixed fee added to the total (e.g. +₪100)",
  },
  // --- Commissions ---
  commission: {
    label: "Commission on Total",
    labelHe: "עמלה על הסכום הכולל",
    description: "Percentage or fixed commission on the total price",
  },
  commission_room: {
    label: "Commission on Room",
    labelHe: "עמלה על מחיר החדר",
    description: "Percentage or fixed commission on room price only",
  },
  commission_experience: {
    label: "Commission on Experience",
    labelHe: "עמלה על מחיר החוויה",
    description: "Percentage or fixed commission on experience extras only",
  },
  commission_fixed: {
    label: "Fixed Commission",
    labelHe: "עמלה קבועה",
    description: "Fixed amount added as commission (e.g. +₪50)",
  },
  // --- Tax ---
  tax: {
    label: "Tax",
    labelHe: "מס",
    description: "Tax applied on the total after commissions (default 18%)",
  },
};

export const ADDON_TYPES_EN: Record<AddonType, { label: string; description: string }> = {
  per_person: { label: "Per Person Fee", description: "Amount multiplied by the number of guests" },
  per_night: { label: "Per Night Fee", description: "Amount multiplied by the number of nights" },
  per_person_per_night: { label: "Per Person Per Night", description: "Amount multiplied by guests × nights" },
  fixed: { label: "Fixed Amount", description: "One-time fixed fee added to the total" },
  commission: { label: "Commission on Total", description: "Commission on the total price" },
  commission_room: { label: "Commission on Room", description: "Commission on room price only" },
  commission_experience: { label: "Commission on Experience", description: "Commission on experience extras only" },
  commission_fixed: { label: "Fixed Commission", description: "Fixed amount added as commission" },
  tax: { label: "Tax", description: "Tax applied on the total after commissions" },
};

export const DEFAULT_CALCULATION_ORDER: Record<AddonType, number> = {
  per_person: 1,
  per_night: 2,
  per_person_per_night: 3,
  fixed: 4,
  commission: 10,
  commission_room: 11,
  commission_experience: 12,
  commission_fixed: 13,
  tax: 20,
};

export function formatAddonValue(addon: ExperienceAddon | AddonFormData, currency = "₪"): string {
  if (addon.is_percentage) {
    return `+${addon.value}%`;
  }
  return `+${currency}${Number(addon.value).toFixed(2)}`;
}

export function getAddonTypeLabel(type: AddonType, locale: "en" | "he" = "en"): string {
  const typeInfo = ADDON_TYPES[type];
  if (locale === "he" && typeInfo.labelHe) {
    return typeInfo.labelHe;
  }
  return typeInfo.label;
}

export function getAddonTypeLabelEn(type: AddonType): string {
  return ADDON_TYPES_EN[type]?.label || type;
}

export function getDefaultCalculationOrder(type: AddonType): number {
  return DEFAULT_CALCULATION_ORDER[type] ?? 0;
}

const ADDON_TYPES_ORDER: AddonType[] = [
  "per_person", "per_night", "per_person_per_night", "fixed",
  "commission", "commission_room", "commission_experience", "commission_fixed",
  "tax",
];

export function getDefaultDraftAddons(): AddonFormData[] {
  return ADDON_TYPES_ORDER.map((type) => ({
    type,
    name: ADDON_TYPES[type]?.label ?? type,
    name_he: ADDON_TYPES[type]?.labelHe ?? undefined,
    description: undefined,
    description_he: undefined,
    value: 0,
    is_percentage: false,
    calculation_order: DEFAULT_CALCULATION_ORDER[type] ?? 0,
  }));
}
