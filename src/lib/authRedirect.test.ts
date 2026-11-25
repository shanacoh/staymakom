import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./authRedirect";

describe("retour après connexion", () => {
  it("accepte une page du site (lien d'email vers le back-office)", () => {
    expect(safeRedirectPath("/admin/journal/article/abc?action=publish")).toBe("/admin/journal/article/abc?action=publish");
  });

  it("refuse tout autre site et les boucles vers la connexion", () => {
    for (const value of ["https://evil.com", "//evil.com", "/\\evil.com", "/auth?redirect=/x", "admin", "", null]) {
      expect(safeRedirectPath(value)).toBeNull();
    }
  });
});
