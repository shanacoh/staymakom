// Plafond de coût de la traduction automatique (fonction serveur translate-content).
import { describe, expect, it } from "vitest";
import { CostMeter, callCostUsd } from "../../../supabase/functions/_shared/translations/cost";

describe("coût des appels à l'IA", () => {
  it("Sonnet 5.5 : 100 000 tokens lus + 20 000 écrits = 0,40 $", () => {
    expect(callCostUsd("claude-sonnet-5-5", "claude-sonnet-5-5", { input_tokens: 100_000, output_tokens: 20_000 })).toBeCloseTo(0.4, 9);
  });
  it("repli sur un modèle plus cher : compté au plus cher", () => {
    expect(callCostUsd("claude-sonnet-5-5", "claude-opus-4-8", { input_tokens: 1_000_000 })).toBeCloseTo(5, 9);
  });
  it("modèle inconnu : compté au prix le plus élevé", () => {
    expect(callCostUsd("modele-inconnu", null, { output_tokens: 100_000 })).toBeCloseTo(5, 9);
  });
  it("plafond atteint en comptant les relances précédentes", () => {
    const meter = new CostMeter(1.5, 2);
    meter.add(0.4);
    expect(meter.reached).toBe(false);
    meter.add(0.1);
    expect(meter.reached).toBe(true);
  });
});
