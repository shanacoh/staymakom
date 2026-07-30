import { describe, it, expect } from "vitest";
import { buildBreadcrumbJsonLd } from "./breadcrumbJsonLd";

describe("buildBreadcrumbJsonLd", () => {
  it("construit un BreadcrumbList vide quand il n'y a aucune étape", () => {
    expect(buildBreadcrumbJsonLd([])).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [],
    });
  });

  it("numérote les étapes dans l'ordre, en commençant à 1", () => {
    const result = buildBreadcrumbJsonLd([
      { name: "Home", url: "https://staymakom.com/" },
      { name: "With Hotel", url: "https://staymakom.com/category/romantic?mode=stay" },
      { name: "Romantic Escape", url: "https://staymakom.com/category/romantic" },
    ]);

    expect(result.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: "https://staymakom.com/" },
      {
        "@type": "ListItem",
        position: 2,
        name: "With Hotel",
        item: "https://staymakom.com/category/romantic?mode=stay",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Romantic Escape",
        item: "https://staymakom.com/category/romantic",
      },
    ]);
  });

  it("reste au format schema.org attendu par Google", () => {
    const result = buildBreadcrumbJsonLd([{ name: "Home", url: "https://staymakom.com/" }]);
    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("BreadcrumbList");
  });
});
