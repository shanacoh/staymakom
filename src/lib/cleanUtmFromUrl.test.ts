import { describe, expect, it } from "vitest";
import { stripUtmFromSearch } from "./cleanUtmFromUrl";

describe("stripUtmFromSearch", () => {
  it("retire tous les utm_* et ne laisse rien", () => {
    expect(stripUtmFromSearch("?utm_source=instagram&utm_medium=social&utm_campaign=bio")).toBe("");
  });

  it("garde les autres paramètres, comme lang", () => {
    expect(stripUtmFromSearch("?utm_source=tiktok&lang=he&utm_campaign=bio")).toBe("?lang=he");
  });

  it("ne change rien quand il n'y a pas d'utm", () => {
    expect(stripUtmFromSearch("?lang=fr")).toBe("?lang=fr");
    expect(stripUtmFromSearch("")).toBe("");
  });
});
