import { describe, it, expect } from "vitest";
import { EMPTY_LOOKUP_SUGGESTION, type AppliedLookup } from "./lookup";
import { applyLookupToForm, buildCreatePayload, emptyForm, markEdited } from "./lookupForm";

const applied = (over: Partial<AppliedLookup["suggestion"]> = {}, link: AppliedLookup["link"] = null): AppliedLookup => ({
  suggestion: { ...EMPTY_LOOKUP_SUGGESTION, ...over },
  link,
  sources: ["le site"],
});

const SITE_LINK = { platform: "site_web" as const, url: "https://www.eden.co.il/", caption: "Domaine familial", author: null, thumbnail_url: "https://x/y.jpg" };

describe("applyLookupToForm", () => {
  it("remplit les cases vides et garde les infos sans case pour l'enregistrement", () => {
    const form = applyLookupToForm(
      emptyForm(),
      applied({ name: "Vignoble Éden", place_type: "activite", city: "Zichron", description: "Un domaine.", phone: "+972 4-111", latitude: 32.5, longitude: 34.9 }, SITE_LINK)
    );
    expect(form).toMatchObject({ name: "Vignoble Éden", placeType: "activite", city: "Zichron", notes: "Un domaine.", url: "https://www.eden.co.il/" });
    expect(form.extras).toMatchObject({ phone: "+972 4-111", latitude: 32.5, longitude: 34.9 });
    expect(form.linkInfo).toEqual(SITE_LINK);
    expect(form.sources).toEqual(["le site"]);
  });

  it("ne touche jamais à une case saisie à la main", () => {
    const typed = { ...emptyForm(), name: "Mon nom à moi", city: "Haïfa", placeType: "restaurant" as const };
    const form = applyLookupToForm(typed, applied({ name: "Nom trouvé", city: "Zichron", place_type: "activite" }));
    expect(form).toMatchObject({ name: "Mon nom à moi", city: "Haïfa", placeType: "restaurant" });
  });

  it("remplace ce qu'une recherche précédente avait rempli (on relance pour corriger)", () => {
    const first = applyLookupToForm(emptyForm(), applied({ name: "Mauvais lieu", city: "Tel Aviv", place_type: "activite" }));
    const second = applyLookupToForm(first, applied({ name: "Bon lieu", city: "Zichron", place_type: "hebergement" }));
    expect(second).toMatchObject({ name: "Bon lieu", city: "Zichron", placeType: "hebergement" });
  });

  it("une case corrigée à la main après la recherche n'est plus écrasée", () => {
    const first = applyLookupToForm(emptyForm(), applied({ name: "Mauvais lieu", city: "Tel Aviv" }));
    const edited = markEdited({ ...first, name: "Corrigé à la main" }, "name");
    const second = applyLookupToForm(edited, applied({ name: "Autre proposition", city: "Zichron" }));
    expect(second).toMatchObject({ name: "Corrigé à la main", city: "Zichron" });
  });

  it("une nouvelle recherche remplace les infos de contact de la précédente", () => {
    const first = applyLookupToForm(emptyForm(), applied({ phone: "+972 1", address: "Ancienne rue" }));
    const second = applyLookupToForm(first, applied({ address: "Nouvelle rue" }));
    expect(second.extras).toMatchObject({ phone: null, address: "Nouvelle rue" });
  });
});

describe("buildCreatePayload, mode « coller un lien »", () => {
  it("un lien seul arrive à trier, avec un nom provisoire lisible", () => {
    const r = buildCreatePayload(emptyForm(), "link", "https://www.tiktok.com/@a/video/1234567?_t=x");
    expect(r.error).toBeUndefined();
    expect(r.payload!.item).toMatchObject({ name: "À identifier (TikTok)", commercial_status: "a_trier", source: "tiktok", nature: "inspiration", place_type: "autre" });
    expect(r.payload!.link).toMatchObject({ url: "https://www.tiktok.com/@a/video/1234567?_t=x", platform: "tiktok", caption: null });
  });

  it("un nom écrit dans la zone de recherche devient le nom du lieu", () => {
    const r = buildCreatePayload(emptyForm(), "link", "Vignoble Tishbi");
    expect(r.error).toBeUndefined();
    expect(r.payload!.item).toMatchObject({ name: "Vignoble Tishbi", commercial_status: "a_trier", source: "manuel" });
    expect(r.payload!.link).toBeNull();
  });

  it("enregistre tout ce que la recherche a trouvé, et la légende tapée prime sur la légende copiée", () => {
    const form = applyLookupToForm(
      { ...emptyForm(), caption: "Ma note" },
      applied({ name: "Vignoble Éden", phone: "+972 4-111", email: "a@b.co", instagram: "@eden", website: "https://www.eden.co.il/", address: "HaYekev 1", latitude: 32.5, longitude: 34.9 }, SITE_LINK)
    );
    const r = buildCreatePayload(form, "link", "www.eden.co.il");
    expect(r.error).toBeUndefined();
    expect(r.payload!.item).toMatchObject({
      name: "Vignoble Éden", contact_phone: "+972 4-111", contact_email: "a@b.co", contact_instagram: "@eden",
      contact_website: "https://www.eden.co.il/", address: "HaYekev 1", latitude: 32.5, longitude: 34.9, source: "autre",
    });
    expect(r.payload!.link).toMatchObject({ platform: "site_web", caption: "Ma note", thumbnail_url: "https://x/y.jpg" });
  });

  it("refuse quand il n'y a ni lien ni nom", () => {
    expect(buildCreatePayload(emptyForm(), "link", "  ").error).toBeDefined();
  });

  it("le statut choisi à la main est respecté", () => {
    const r = buildCreatePayload({ ...emptyForm(), status: "a_contacter", statusTouched: true }, "link", "Café Rimon");
    expect(r.payload?.item.commercial_status).toBe("a_contacter");
  });
});

describe("buildCreatePayload, mode « ajouter un lieu »", () => {
  it("exige un nom et met le lieu au statut idée par défaut", () => {
    expect(buildCreatePayload(emptyForm(), "place", "").error).toBeDefined();
    const r = buildCreatePayload({ ...emptyForm(), name: "Spa du Désert", city: " Arad " }, "place", "");
    expect(r.payload?.item).toMatchObject({ name: "Spa du Désert", commercial_status: "idee", city: "Arad", source: "manuel" });
  });

  it("refuse un lien qui n'est pas en https", () => {
    const r = buildCreatePayload({ ...emptyForm(), name: "X", url: "javascript:alert(1)" }, "place", "");
    expect(r.error).toMatch(/https/);
  });
});
