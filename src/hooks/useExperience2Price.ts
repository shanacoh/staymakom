// =============================================================================
// src/hooks/useExperience2Price.ts
// Hook de calcul de prix V3 — Addons-only model
// =============================================================================

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useQuickDateAvailability } from "@/hooks/useQuickDateAvailability";
import type {
  ExperienceAddon,
  PricingConfig,
  PriceBreakdownV2,
  PricingAddonLine,
  CommissionLine,
  PerPersonAddonLine,
} from "@/types/experience2_addons";
import {
  EXPERIENCE_PRICING_TYPES,
  COMMISSION_TYPES,
} from "@/types/experience2_addons";

// ---------------------------------------------------------------------------
// Fetch ALL active addons for an experience
// ---------------------------------------------------------------------------

export function useExperienceAddons(experienceId: string | null) {
  return useQuery({
    queryKey: ["experience2-addons", experienceId],
    queryFn: async () => {
      if (!experienceId) return [];
      const { data, error } = await supabase
        .from("experience2_addons")
        .select("*")
        .eq("experience_id", experienceId)
        .eq("is_active", true)
        .order("calculation_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ExperienceAddon[];
    },
    enabled: !!experienceId,
  });
}

// ---------------------------------------------------------------------------
// Fetch pricing config from experiences2 table (promo only now)
// ---------------------------------------------------------------------------

export function useExperiencePricingConfig(experienceId: string | null) {
  return useQuery({
    queryKey: ["experience2-pricing-config", experienceId],
    queryFn: async () => {
      if (!experienceId) return null;
      const { data, error } = await supabase
        .from("experiences2")
        .select("commission_room_pct, commission_addons_pct, tax_pct, promo_type, promo_value, promo_is_percentage")
        .eq("id", experienceId)
        .single();
      if (error) throw error;
      return {
        commission_room_pct: data.commission_room_pct ?? 0,
        commission_addons_pct: data.commission_addons_pct ?? 0,
        tax_pct: data.tax_pct ?? 0,
        promo_type: data.promo_type ?? null,
        promo_value: data.promo_value ?? null,
        promo_is_percentage: data.promo_is_percentage ?? true,
      } as PricingConfig;
    },
    enabled: !!experienceId,
  });
}

// ---------------------------------------------------------------------------
// Extract room price from HyperGuest RatePlanPrices
// ---------------------------------------------------------------------------

export function extractPriceFromRatePlanPrices(ratePlanPrices: unknown): { amount: number; currency: string } | null {
  if (ratePlanPrices == null) return null;

  if (typeof ratePlanPrices === "number") {
    return { amount: ratePlanPrices, currency: "ILS" };
  }

  const p = ratePlanPrices as Record<string, unknown>;

  if (p.sell && typeof p.sell === "object") {
    const sell = p.sell as Record<string, unknown>;
    if (typeof sell.price === "number") {
      return { amount: sell.price, currency: (sell.currency as string) || "ILS" };
    }
  }

  if (p.net && typeof p.net === "object") {
    const net = p.net as Record<string, unknown>;
    if (typeof net.price === "number") {
      return { amount: net.price, currency: (net.currency as string) || "ILS" };
    }
  }

  if (typeof p.total === "number") {
    return { amount: p.total, currency: (p.currency as string) || "ILS" };
  }

  if (p.total && typeof p.total === "object") {
    const total = p.total as Record<string, unknown>;
    if (typeof total.amount === "number") {
      return { amount: total.amount, currency: (total.currency as string) || "ILS" };
    }
  }

  if (typeof p.amount === "number") {
    return { amount: p.amount, currency: (p.currency as string) || "ILS" };
  }

  if (Array.isArray(ratePlanPrices)) {
    const sum = (ratePlanPrices as unknown[]).reduce<number>((s, item: unknown) => {
      if (typeof item === "number") return s + item;
      if (item && typeof item === "object") {
        const i = item as Record<string, unknown>;
        return s + (Number(i.price ?? i.amount ?? i.rate ?? 0));
      }
      return s;
    }, 0);
    return { amount: sum, currency: "ILS" };
  }

  const arr = (p.perNight ?? p.dailyPrices) as unknown[];
  if (Array.isArray(arr)) {
    const sum = arr.reduce<number>((s, item: unknown) => {
      if (typeof item === "number") return s + item;
      if (item && typeof item === "object") {
        const i = item as Record<string, unknown>;
        return s + (Number(i.price ?? i.amount ?? i.rate ?? 0));
      }
      return s;
    }, 0);
    return { amount: sum, currency: "ILS" };
  }

  return null;
}

// ---------------------------------------------------------------------------
// Core calculation: V3 addons-only pricing model
// ---------------------------------------------------------------------------

export function calculatePriceV2(
  roomPrice: number,
  guests: number,
  nights: number,
  allAddons: ExperienceAddon[],
  config: PricingConfig,
  currency: string,
): PriceBreakdownV2 {
  // --- Layer 1: Room ---
  // roomPrice is already the full stay price from HyperGuest

  // --- Layer 2: Experience Pricing addons ---
  const pricingAddons = allAddons.filter((a) => (EXPERIENCE_PRICING_TYPES as string[]).includes(a.type) && a.is_active);
  const pricingAddonLines: PricingAddonLine[] = pricingAddons.map((addon) => {
    let multiplier = 1;
    let description = "";
    switch (addon.type) {
      case "per_person":
        multiplier = guests;
        description = `× ${guests} guests`;
        break;
      case "per_night":
        multiplier = nights;
        description = `× ${nights} nights`;
        break;
      case "per_person_per_night":
        multiplier = guests * nights;
        description = `× ${guests} guests × ${nights} nights`;
        break;
      case "fixed":
        multiplier = 1;
        description = "fixed";
        break;
    }
    return {
      name: addon.name,
      type: addon.type,
      unitPrice: addon.value,
      multiplier,
      total: addon.value * multiplier,
      description,
    };
  });

  const totalPricingAddons = pricingAddonLines.reduce((sum, l) => sum + l.total, 0);

  // Legacy compat: per-person lines
  const perPersonAddons: PerPersonAddonLine[] = pricingAddons
    .filter((a) => a.type === "per_person")
    .map((addon) => ({
      name: addon.name,
      pricePerPerson: addon.value,
      guests,
      total: addon.value * guests,
    }));

  const totalAddons = perPersonAddons.reduce((sum, a) => sum + a.total, 0);

  // --- Layer 3: Commissions (from addons) ---
  const commissionAddons = allAddons.filter((a) => (COMMISSION_TYPES as string[]).includes(a.type) && a.is_active);
  const subtotalBeforeCommissions = roomPrice + totalPricingAddons;
  const experienceExtrasTotal = totalPricingAddons;

  const commissionLines: CommissionLine[] = commissionAddons.map((addon) => {
    let baseAmount = 0;
    switch (addon.type) {
      case "commission":
        baseAmount = subtotalBeforeCommissions;
        break;
      case "commission_room":
        baseAmount = roomPrice;
        break;
      case "commission_experience":
        baseAmount = experienceExtrasTotal;
        break;
      case "commission_fixed":
        baseAmount = 0; // fixed, no base
        break;
    }
    const total = addon.type === "commission_fixed"
      ? addon.value
      : addon.is_percentage
        ? (baseAmount * addon.value) / 100
        : addon.value;
    return {
      name: addon.name,
      type: addon.type,
      value: addon.value,
      isPercentage: addon.is_percentage,
      baseAmount,
      total,
    };
  });

  const totalCommissions = commissionLines.reduce((sum, c) => sum + c.total, 0);

  // Legacy compat
  const commissionRoomPct = commissionAddons.find((a) => a.type === "commission_room" && a.is_percentage)?.value ?? 0;
  const commissionRoomAmount = commissionLines.filter((c) => c.type === "commission_room").reduce((s, c) => s + c.total, 0);
  const commissionAddonsPct = commissionAddons.find((a) => a.type === "commission_experience" && a.is_percentage)?.value ?? 0;
  const commissionAddonsAmount = commissionLines.filter((c) => c.type === "commission_experience").reduce((s, c) => s + c.total, 0);

  // --- Layer 4: Taxes — REMOVED (prices displayed excl. VAT) ---
  const subtotalBeforeTax = roomPrice + totalPricingAddons + totalCommissions;

  // --- Layer 5: Promo ---
  const totalBeforePromo = subtotalBeforeTax;
  let discountAmount = 0;
  let fakeOriginalPrice: number | null = null;

  if (config.promo_type === "real_discount" && config.promo_value != null && config.promo_value > 0) {
    if (config.promo_is_percentage) {
      discountAmount = (totalBeforePromo * config.promo_value) / 100;
    } else {
      discountAmount = Math.min(config.promo_value, totalBeforePromo);
    }
  } else if (config.promo_type === "fake_markup" && config.promo_value != null && config.promo_value > 0) {
    fakeOriginalPrice = totalBeforePromo * (1 + config.promo_value / 100);
  }

  // --- Final ---
  const finalTotal = Math.max(0, totalBeforePromo - discountAmount);

  return {
    roomPrice,
    pricingAddonLines,
    totalPricingAddons,
    commissionLines,
    totalCommissions,
    subtotalBeforeTax,
    taxLines: [],
    totalTax: 0,
    // Legacy compat
    perPersonAddons,
    totalAddons,
    commissionRoomPct,
    commissionRoomAmount,
    commissionAddonsPct,
    commissionAddonsAmount,
    taxPct: 0,
    taxAmount: 0,
    promo: {
      type: config.promo_type,
      value: config.promo_value,
      isPercentage: config.promo_is_percentage,
      discountAmount,
      fakeOriginalPrice,
    },
    finalTotal,
    currency,
    nights,
    guests,
  };
}

// ---------------------------------------------------------------------------
// Main hook: useExperience2Price
// ---------------------------------------------------------------------------

export function useExperience2Price(
  experienceId: string | null,
  basePrice: number | null,
  currency: string,
  nights: number,
  numberOfGuests: number,
  ratePlanPrices?: unknown,
): PriceBreakdownV2 | null {
  const { data: addons } = useExperienceAddons(experienceId);
  const { data: pricingConfig } = useExperiencePricingConfig(experienceId);

  return useMemo(() => {
    const extracted = extractPriceFromRatePlanPrices(ratePlanPrices);
    const roomPrice = extracted?.amount ?? basePrice ?? 0;
    const cur = extracted?.currency ?? currency;

    if (roomPrice <= 0 && (!addons || addons.length === 0)) return null;

    const config: PricingConfig = pricingConfig ?? {
      commission_room_pct: 0,
      commission_addons_pct: 0,
      tax_pct: 0,
      promo_type: null,
      promo_value: null,
      promo_is_percentage: true,
    };

    return calculatePriceV2(roomPrice, numberOfGuests, nights, addons ?? [], config, cur);
  }, [addons, pricingConfig, basePrice, currency, nights, numberOfGuests, ratePlanPrices]);
}

// ---------------------------------------------------------------------------
// "From" price — single source of truth for all display surfaces
// Formula: cheapest_nightly_rate + fixed_addons + commissions
// Excludes: per_person, per_night, per_person_per_night (shown at booking only)
// ---------------------------------------------------------------------------

export function calculateFromPrice(
  nightlyRoomRate: number,
  allAddons: ExperienceAddon[],
  config: PricingConfig,
): number | null {
  if (nightlyRoomRate <= 0) return null;

  // Only include "fixed" experience pricing addons
  const fixedAddons = allAddons.filter(
    (a) => a.type === "fixed" && a.is_active
  );
  const fixedTotal = fixedAddons.reduce((sum, a) => sum + a.value, 0);

  const subtotal = nightlyRoomRate + fixedTotal;

  // Apply commissions
  const commissionAddons = allAddons.filter(
    (a) => (COMMISSION_TYPES as string[]).includes(a.type) && a.is_active
  );

  let totalCommissions = 0;
  for (const addon of commissionAddons) {
    let baseAmount = 0;
    switch (addon.type) {
      case "commission":
        baseAmount = subtotal;
        break;
      case "commission_room":
        baseAmount = nightlyRoomRate;
        break;
      case "commission_experience":
        baseAmount = fixedTotal;
        break;
      case "commission_fixed":
        baseAmount = 0;
        break;
    }
    const amount =
      addon.type === "commission_fixed"
        ? addon.value
        : addon.is_percentage
          ? (baseAmount * addon.value) / 100
          : addon.value;
    totalCommissions += amount;
  }

  const total = subtotal + totalCommissions;
  return total > 0 ? total : null;
}

/**
 * Hook: returns the "From" price in ILS for an experience,
 * using the cheapest 1-night HyperGuest rate + fixed addons + commissions.
 */
export function useFromPrice(
  experienceId: string | null,
  hyperguestPropertyId: string | null,
) {
  const { data: addons } = useExperienceAddons(experienceId);
  const { data: pricingConfig } = useExperiencePricingConfig(experienceId);

  const propId = hyperguestPropertyId ? parseInt(hyperguestPropertyId) : null;

  const { data: quickDates, isLoading } = useQuickDateAvailability({
    propertyId: propId,
    nights: 1,
    adults: 2,
    currency: "ILS",
    enabled: !!propId,
  });

  const cheapestDate = useMemo(() => {
    if (!quickDates || quickDates.length === 0) return null;
    return quickDates.reduce((best, curr) => {
      if (curr.cheapestPrice == null) return best;
      if (!best || best.cheapestPrice == null || curr.cheapestPrice < best.cheapestPrice)
        return curr;
      return best;
    }, null as (typeof quickDates)[0] | null);
  }, [quickDates]);

  const fromPrice = useMemo(() => {
    const roomPrice = cheapestDate?.cheapestPrice ?? 0;
    const config: PricingConfig = pricingConfig ?? {
      commission_room_pct: 0,
      commission_addons_pct: 0,
      tax_pct: 0,
      promo_type: null,
      promo_value: null,
      promo_is_percentage: true,
    };
    return calculateFromPrice(roomPrice, addons ?? [], config);
  }, [cheapestDate, addons, pricingConfig]);

  return {
    fromPriceILS: fromPrice,
    cheapestDate,
    isLoading,
    hasHyperguest: !!propId,
  };
}

// ---------------------------------------------------------------------------
// Legacy compatibility
// ---------------------------------------------------------------------------

export interface PriceBreakdown {
  basePrice: number;
  commissions: Array<{ name: string; amount: number; type: "commission" | "per_night" }>;
  taxes: Array<{ name: string; amount: number }>;
  subtotal: number;
  totalTaxes: number;
  total: number;
  currency: string;
  nights: number;
}
