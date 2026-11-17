import { describe, expect, it } from "vitest";
import {
  decideFieldAction,
  hashSource,
  normalizeSource,
} from "../../../supabase/functions/_shared/translations/plan";
import { AUTO_LOCALES, rootEntityTypes, childEntityTypes, TRANSLATABLE_ENTITIES } from "../../../supabase/functions/_shared/translations/catalog";

describe("normalizeSource", () => {
  it("ignore un texte vide", () => {
    expect(normalizeSource("   ", "text")).toBeNull();
    expect(normalizeSource(null, "text")).toBeNull();
  });
  it("garde le texte tel quel (HTML, sauts de ligne)", () => {
    expect(normalizeSource("<p>Hello</p>\nWorld", "text")).toBe("<p>Hello</p>\nWorld");
  });
  it("met une liste sous forme stable, sans éléments vides", () => {
    expect(normalizeSource([" Wine ", "", "Cheese"], "list")).toBe('["Wine","Cheese"]');
    expect(normalizeSource([], "list")).toBeNull();
  });
  it("renonce à une liste d'objets", () => {
    expect(normalizeSource([{ a: 1 }], "list")).toBeNull();
  });
});

describe("decideFieldAction", () => {
  const auto = { source_hash: "h1", status: "auto" as const, stale: false };
  const reviewed = { source_hash: "h1", status: "reviewed" as const, stale: false };

  it("traduit ce qui n'existe pas encore", () => {
    expect(decideFieldAction("h1", undefined, "changed")).toBe("translate");
  });
  it("ne refait rien si l'anglais n'a pas changé", () => {
    expect(decideFieldAction("h1", auto, "changed")).toBe("skip");
  });
  it("retraduit une traduction auto dont l'anglais a changé", () => {
    expect(decideFieldAction("h2", auto, "changed")).toBe("translate");
  });
  it("mode all : retraduit toute traduction auto", () => {
    expect(decideFieldAction("h1", auto, "all")).toBe("translate");
  });
  it("n'écrase jamais une traduction vérifiée, même en mode all", () => {
    expect(decideFieldAction("h1", reviewed, "all")).toBe("skip");
    expect(decideFieldAction("h2", reviewed, "all")).toBe("mark_stale");
  });
  it("signale une seule fois « source modifiée »", () => {
    expect(decideFieldAction("h2", reviewed, "changed")).toBe("mark_stale");
    expect(decideFieldAction("h2", { ...reviewed, stale: true }, "changed")).toBe("skip");
  });
});

describe("hashSource", () => {
  it("donne la même empreinte pour le même texte, une autre sinon", async () => {
    expect(await hashSource("abc")).toBe(await hashSource("abc"));
    expect(await hashSource("abc")).not.toBe(await hashSource("abd"));
  });
});

describe("catalogue", () => {
  it("contient ES, RU, DE", () => {
    expect([...AUTO_LOCALES]).toEqual(["es", "ru", "de"]);
  });
  it("chaque sous-ligne pointe vers une fiche principale", () => {
    const roots = rootEntityTypes();
    for (const root of roots) {
      for (const child of childEntityTypes(root)) {
        expect(roots).toContain((TRANSLATABLE_ENTITIES[child] as { parent?: { entityType: string } }).parent?.entityType);
      }
    }
  });
});

import { extractBlockTexts, rebuildBlocks } from "../../../supabase/functions/_shared/translations/blocks";

describe("articles en blocs", () => {
  const source = JSON.stringify([
    { id: "a", type: "text", content: "<p>Hello</p>" },
    { id: "b", type: "title", level: "h2", content: "Title" },
    { id: "c", type: "cta", url: "/about", text: "Discover" },
    { id: "d", type: "image", url: "x.jpg" },
  ]);

  it("n'extrait que les textes", () => {
    expect(extractBlockTexts(source)).toEqual(["<p>Hello</p>", "Title", "Discover"]);
  });
  it("remet les traductions à leur place sans toucher aux liens ni aux identifiants", () => {
    const rebuilt = JSON.parse(rebuildBlocks(source, ["<p>Hola</p>", "Título", "Descubrir"])!);
    expect(rebuilt[0]).toEqual({ id: "a", type: "text", content: "<p>Hola</p>" });
    expect(rebuilt[1]).toEqual({ id: "b", type: "title", level: "h2", content: "Título" });
    expect(rebuilt[2]).toEqual({ id: "c", type: "cta", url: "/about", text: "Descubrir" });
    expect(rebuilt[3]).toEqual({ id: "d", type: "image", url: "x.jpg" });
  });
  it("refuse une traduction au mauvais nombre d'éléments", () => {
    expect(rebuildBlocks(source, ["un seul"])).toBeNull();
  });
  it("renvoie null pour un contenu qui n'est pas en blocs", () => {
    expect(extractBlockTexts("<p>plain html</p>")).toBeNull();
  });
});

import { hasLongDash } from "../../../supabase/functions/_shared/translations/plan";

describe("hasLongDash", () => {
  it("repère un tiret long sans rien modifier", () => {
    expect(hasLongDash("Север — это зелёные пейзажи")).toBe(true);
  });
  it("ignore les intervalles et les traits d'union", () => {
    expect(hasLongDash("2–3 Tage in Тель-Авив")).toBe(false);
  });
});
