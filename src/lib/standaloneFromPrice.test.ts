import { describe, expect, it } from "vitest";
import { getStandaloneFromPrice } from "./standaloneFromPrice";

describe("getStandaloneFromPrice", () => {
  it("prend le tarif enfant quand il est plus bas", () => {
    expect(getStandaloneFromPrice({ base_price: 125, base_price_child: 80, has_child_price: true })).toBe(80);
  });

  it("garde le tarif adulte s'il n'y a pas de tarif enfant", () => {
    expect(getStandaloneFromPrice({ base_price: 125, base_price_child: 80, has_child_price: false })).toBe(125);
    expect(getStandaloneFromPrice({ base_price: 125, base_price_child: null, has_child_price: true })).toBe(125);
  });

  it("ignore un tarif enfant à 0 (non renseigné)", () => {
    expect(getStandaloneFromPrice({ base_price: 125, base_price_child: 0, has_child_price: true })).toBe(125);
  });

  it("garde le tarif adulte s'il est le plus bas", () => {
    expect(getStandaloneFromPrice({ base_price: 60, base_price_child: 80, has_child_price: true })).toBe(60);
  });
});
