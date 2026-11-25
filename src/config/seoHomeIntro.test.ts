import { describe, expect, it } from "vitest";
import { t } from "@/lib/translations";
import { HOME_INTRO, HOME_SLOGAN } from "../../api/_seo/homeIntro";
import { SEO_HOME_AND_LIST } from "../../api/_seo/staticPages";
import { SEO_STATIC_PAGES } from "./seoStaticPages";

// L'accueil servi aux robots (api/_seo/) doit dire exactement la même chose que le site.
// Si ce test échoue : recopier les textes modifiés du site dans api/_seo/homeIntro.ts
// (titre principal, « À propos ») ou api/_seo/staticPages.ts (titre et description Google).
describe("accueil : copie robots", () => {
  for (const lang of ["en", "fr", "he", "es", "ru", "de"] as const) {
    it(`titre principal et « À propos » identiques au site en ${lang}`, () => {
      expect(HOME_INTRO[lang]).toEqual({
        eyebrow: t(lang, "homeHeroEyebrow"),
        aboutTitle: t(lang, "homeAboutTitle"),
        aboutText: t(lang, "homeAboutText"),
      });
    });
    it(`titre et description Google identiques au site en ${lang}`, () => {
      expect(SEO_HOME_AND_LIST.home[lang]).toEqual(SEO_STATIC_PAGES.home[lang]);
    });
  }

  it("slogan identique au titre du hero", () => {
    expect(HOME_SLOGAN).toBe(`${t("en", "homeHeroTitle1")} ${t("en", "homeHeroTitle2")}`);
  });

  it("un seul titre Google par langue, toujours terminé par « | STAYMAKOM »", () => {
    for (const text of Object.values(SEO_STATIC_PAGES.home)) {
      expect(text.title.endsWith(" | STAYMAKOM")).toBe(true);
    }
  });
});
