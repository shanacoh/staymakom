import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { draftSaveStatus, formStatusLabel, splitArchived } from "./status";
import { archivedRedirectPath } from "./redirect";

describe("archivage des fiches", () => {
  it("range les fiches archivées à part, sans toucher à l'ordre des autres", () => {
    const rows = [
      { id: "a", status: "published" },
      { id: "b", status: "archived" },
      { id: "c", status: "draft" },
      { id: "d", status: null },
    ];
    const { active, archived } = splitArchived(rows);
    expect(active.map((r) => r.id)).toEqual(["a", "c", "d"]);
    expect(archived.map((r) => r.id)).toEqual(["b"]);
  });

  it("affiche « Archivée » dans l'en-tête du formulaire", () => {
    expect(formStatusLabel("archived")).toBe("Archivée");
    expect(formStatusLabel("published")).toBe("Publiée");
    expect(formStatusLabel(undefined)).toBe("Brouillon");
  });

  it("garde une fiche archivée dans les archives quand on enregistre un brouillon", () => {
    expect(draftSaveStatus("archived")).toBe("archived");
    expect(draftSaveStatus("published")).toBe("draft");
    expect(draftSaveStatus(null)).toBe("draft");
  });
});

describe("redirection d'un lien vers une fiche archivée", () => {
  it("envoie vers le mood de la fiche en priorité", () => {
    expect(archivedRedirectPath("standalone", { category_slug: "taste", region_slug: "galilee" })).toBe("/category/taste");
  });

  it("envoie les bateaux vers la page bateaux", () => {
    expect(archivedRedirectPath("standalone", { category_slug: "bateaux", region_slug: null })).toBe("/boat");
  });

  it("à défaut de mood, envoie vers l'accueil filtré sur la région", () => {
    expect(archivedRedirectPath("standalone", { category_slug: null, region_slug: "galilee" })).toBe("/?region=galilee");
    expect(archivedRedirectPath("hotel", { category_slug: null, region_slug: "negev" })).toBe("/?region=negev&mode=stay");
  });

  it("à défaut de tout, envoie vers l'accueil", () => {
    expect(archivedRedirectPath("hotel", { category_slug: null, region_slug: null })).toBe("/");
  });
});
