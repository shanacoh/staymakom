import { describe, expect, it } from "vitest";
import { missingUiKeys, t, translations, type UiKey } from "@/lib/translations";
import { AUTO_UI_TRANSLATIONS } from "@/lib/uiTranslations";
import { ruPlural } from "./ru";

const AUTO = ["es", "ru", "de"] as const;

/** Tous les textes d'une valeur (chaîne, liste, FAQ, fonction appelée avec 2). */
function textsOf(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "function") return textsOf((value as (n: number) => unknown)(2));
  if (Array.isArray(value)) return value.flatMap(textsOf);
  if (value && typeof value === "object") return Object.values(value).flatMap(textsOf);
  return [];
}

describe("textes d'interface ES / RU / DE", () => {
  it("les trois langues traduisent exactement les mêmes clés", () => {
    const keys = (l: (typeof AUTO)[number]) => Object.keys(AUTO_UI_TRANSLATIONS[l]).sort();
    expect(keys("ru")).toEqual(keys("es"));
    expect(keys("de")).toEqual(keys("es"));
  });

  it("chaque clé traduite a la même forme que l'anglais (texte, liste, fonction, FAQ)", () => {
    for (const l of AUTO) {
      for (const [key, value] of Object.entries(AUTO_UI_TRANSLATIONS[l])) {
        const en = translations.en[key as UiKey];
        expect(typeof value, `${l}.${key}`).toBe(typeof en);
        if (Array.isArray(en)) expect((value as unknown[]).length, `${l}.${key}`).toBe(en.length);
      }
    }
  });

  it("la FAQ garde ses liens [entre crochets] et ses paragraphes", () => {
    const en = translations.en.faqItems;
    for (const l of AUTO) {
      const items = t(l, "faqItems") as typeof en;
      items.forEach((item, i) => {
        expect(item.a.length, `${l} FAQ ${i}`).toBe(en[i].a.length);
        const links = (s: string[]) => s.join(" ").match(/\[[^\]]+\]/g)?.length ?? 0;
        expect(links(item.a), `${l} FAQ ${i}`).toBe(links(en[i].a));
      });
    }
  });

  it("aucun tiret long, et pas d'anglais oublié (texte identique à l'anglais)", () => {
    const allowedSame = new Set(["total", "Spa", "Hotel", "POPULAR"]);
    for (const l of AUTO) {
      for (const [key, value] of Object.entries(AUTO_UI_TRANSLATIONS[l])) {
        for (const text of textsOf(value)) expect(text, `${l}.${key}`).not.toMatch(/—/);
        const same = typeof value === "string" && value === translations.en[key as UiKey] && !allowedSame.has(value);
        expect(same, `${l}.${key} est resté en anglais`).toBe(false);
      }
    }
  });

  it("une clé non traduite s'affiche en anglais", () => {
    expect(t("ru", "experienceNotFound")).toBe(translations.en.experienceNotFound);
    expect(missingUiKeys("ru")).toContain("experienceNotFound");
    expect(missingUiKeys("ru")).not.toContain("faqItems");
    expect(missingUiKeys("en")).toEqual([]);
  });

  it("pluriels russes", () => {
    expect(t("ru", "homeResultsCount")(1)).toBe("1 впечатление");
    expect(t("ru", "homeResultsCount")(3)).toBe("3 впечатления");
    expect(t("ru", "homeResultsCount")(11)).toBe("11 впечатлений");
    expect(t("ru", "homeResultsCount")(21)).toBe("21 впечатление");
    expect(ruPlural(14, "a", "b", "c")).toBe("c");
  });
});
