import { describe, expect, it } from "vitest";
import { t } from "@/lib/translations";
import { HOME_FAQ } from "../../api/_seo/faq";

// La FAQ servie aux robots (api/_seo/faq.ts) doit rester identique à celle du site.
// Si ce test échoue : recopier les textes « faqItems » modifiés dans api/_seo/faq.ts.
describe("FAQ de l'accueil : copie robots", () => {
  for (const lang of ["en", "fr", "he", "es", "ru", "de"] as const) {
    it(`identique au site en ${lang}`, () => {
      expect(HOME_FAQ[lang]).toEqual(t(lang, "faqItems"));
    });
  }
});
