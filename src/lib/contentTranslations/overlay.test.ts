import { describe, expect, it } from "vitest";
import { applyTranslations, collectTargets, parseEmbeds, type TranslationRow } from "./overlay";
import { hashSource } from "../../../supabase/functions/_shared/translations/plan";

const ID = "11111111-1111-1111-1111-111111111111";
const INCLUDE_ID = "22222222-2222-2222-2222-222222222222";

async function row(field: string, source: string, text: string, entity_type = "standalone_experience", entity_id = ID): Promise<TranslationRow> {
  return { entity_type, entity_id, field, text, source_hash: await hashSource(source) };
}

describe("parseEmbeds", () => {
  it("repère les fiches rattachées, avec ou sans surnom", () => {
    const embeds = parseEmbeds("*, hotel:hotels2!fk_hotel(*), experience2_includes(id,title), categories(slug)");
    expect(embeds.get("hotel")).toBe("hotels2");
    expect(embeds.get("experience2_includes")).toBe("experience2_includes");
    expect(embeds.get("categories")).toBe("categories");
  });
});

describe("collectTargets", () => {
  it("trouve la fiche et ses sous-lignes", () => {
    const data = [{ id: ID, title: "A", standalone_experience_includes: [{ id: INCLUDE_ID, title: "B" }] }];
    const targets = collectTargets(data, "standalone_experiences", parseEmbeds("*, standalone_experience_includes(*)"));
    expect(targets.map((t) => t.entityType)).toEqual(["standalone_experience", "standalone_experience_include"]);
  });

  it("ignore une table non traduite", () => {
    expect(collectTargets([{ id: ID, title: "A" }], "bookings", new Map())).toEqual([]);
  });
});

describe("applyTranslations", () => {
  it("remplace l'anglais par la traduction faite sur le texte actuel", async () => {
    const data = { id: ID, title: "Sunset Jeep", includes: ["Guide", "Water"] };
    const translations = [
      await row("title", "Sunset Jeep", "Джип на закате"),
      await row("includes", JSON.stringify(["Guide", "Water"]), JSON.stringify(["Гид", "Вода"])),
    ];
    const n = await applyTranslations(collectTargets(data, "standalone_experiences", new Map()), () => translations);
    expect(n).toBe(2);
    expect(data.title).toBe("Джип на закате");
    expect(data.includes).toEqual(["Гид", "Вода"]);
  });

  it("garde l'anglais si la traduction est périmée (l'anglais a changé depuis)", async () => {
    const data = { id: ID, title: "Sunset Jeep (2 hours)" };
    const translations = [await row("title", "Sunset Jeep", "Джип на закате")];
    await applyTranslations(collectTargets(data, "standalone_experiences", new Map()), () => translations);
    expect(data.title).toBe("Sunset Jeep (2 hours)");
  });

  it("ne touche jamais la ville ni la région (servent au regroupement des lieux)", async () => {
    const data = { id: ID, city: "Eilat", region: "South" };
    const translations = [await row("city", "Eilat", "Эйлат"), await row("region", "South", "Юг")];
    await applyTranslations(collectTargets(data, "standalone_experiences", new Map()), () => translations);
    expect(data).toEqual({ id: ID, city: "Eilat", region: "South" });
  });

  it("ne crée pas un champ que la page n'a pas demandé", async () => {
    const data: Record<string, unknown> = { id: ID, title: "A" };
    const translations = [await row("subtitle", "B", "Б")];
    await applyTranslations(collectTargets(data, "standalone_experiences", new Map()), () => translations);
    expect("subtitle" in data).toBe(false);
  });
});
