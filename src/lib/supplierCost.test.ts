import { describe, expect, it } from "vitest";
import { supplierCostOf, type SupplierCostInput } from "../../supabase/functions/_shared/supplier-cost";

const base: SupplierCostInput = {
  adults: 1,
  children: 0,
  priceType: "per_person",
  hasChildPrice: false,
  prices: { adult: 62, child: 51 },
  hasExtras: false,
};

describe("supplierCostOf", () => {
  it("multiplie le prix fournisseur adulte par le nombre d'adultes", () => {
    expect(supplierCostOf(base)).toBe(62);
    expect(supplierCostOf({ ...base, adults: 3 })).toBe(186);
  });

  it("utilise le prix enfant quand la fiche a un tarif enfant", () => {
    expect(supplierCostOf({ ...base, adults: 2, children: 1, hasChildPrice: true })).toBe(175);
  });

  it("compte les enfants au prix adulte sans tarif enfant, comme le prix de vente", () => {
    expect(supplierCostOf({ ...base, adults: 2, children: 1 })).toBe(186);
  });

  it("prend le prix adulte tel quel pour un forfait", () => {
    expect(supplierCostOf({ ...base, adults: 4, priceType: "fixed", prices: { adult: 900, child: null } })).toBe(900);
  });

  it("laisse le coût à compléter quand on ne peut pas le connaître sans se tromper", () => {
    expect(supplierCostOf({ ...base, prices: null })).toBeNull();
    expect(supplierCostOf({ ...base, prices: { adult: 0, child: null } })).toBeNull();
    expect(supplierCostOf({ ...base, prices: { adult: null, child: null } })).toBeNull();
    expect(supplierCostOf({ ...base, hasExtras: true })).toBeNull();
  });
});
