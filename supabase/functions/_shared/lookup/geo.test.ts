import { describe, it, expect } from "vitest";
import { isInIsrael, isOutsideIsrael } from "./geo";

describe("isInIsrael (côté serveur)", () => {
  it("accepte le pays d'un bout à l'autre et refuse les erreurs typiques", () => {
    expect(isInIsrael(32.0853, 34.7818)).toBe(true); // Tel Aviv
    expect(isInIsrael(29.5577, 34.9519)).toBe(true); // Eilat
    expect(isInIsrael(33.2797, 35.5796)).toBe(true); // Metula
    expect(isInIsrael(1, 1)).toBe(false);
    expect(isInIsrael(34.78, 32.08)).toBe(false); // inversées
    expect(isInIsrael(48.85, 2.35)).toBe(false); // Paris
    expect(isInIsrael(NaN, 34)).toBe(false);
  });

  it("une position absente n'est pas suspecte", () => {
    expect(isOutsideIsrael(null, null)).toBe(false);
    expect(isOutsideIsrael(undefined, 34)).toBe(false);
    expect(isOutsideIsrael(1, 1)).toBe(true);
    expect(isOutsideIsrael(32.1, 34.8)).toBe(false);
  });
});
