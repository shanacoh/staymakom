import { describe, it, expect } from "vitest";
import {
  decodeEntities,
  extractHrefs,
  extractLang,
  extractMetaTags,
  extractTitle,
  findEmail,
  findInstagram,
  findPhone,
  htmlToText,
  normalizeInstagram,
  pickPlaceFromJsonLd,
} from "./parse";

const PAGE = `<!doctype html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8">
  <title>Vignoble Éden &amp; Fils | Zichron</title>
  <meta name="description" content="Dégustations au c&#339;ur des collines">
  <meta property="og:site_name" content="Éden">
  <meta property="og:image" content='https://example.com/photo.jpg'>
  <meta property="og:title" content="Vignoble Éden">
  <meta property="og:title" content="Doublon ignoré">
  <script type="application/ld+json">
  {"@context":"https://schema.org","@graph":[
    {"@type":"Organization","name":"Groupe Éden"},
    {"@type":["LocalBusiness","Winery"],"name":"Vignoble Éden","telephone":"+972 4-123 4567",
     "address":{"@type":"PostalAddress","streetAddress":"Rue des Vignes 12","addressLocality":"Zichron Yaakov","addressRegion":"Nord"},
     "geo":{"@type":"GeoCoordinates","latitude":"32.5723","longitude":34.9531},
     "sameAs":["https://www.facebook.com/eden","https://www.instagram.com/eden.winery/"],
     "image":["https://example.com/a.jpg"]}
  ]}
  </script>
  <script>var x = "<a href='tel:000'>ignoré</a>";</script>
  <script type="application/ld+json">{ceci n'est pas du json}</script>
</head>
<body>
  <a href="tel:+972%204%20123%204567">Appeler</a>
  <a href='mailto:contact@eden.co.il?subject=Bonjour'>Écrire</a>
  <a href="https://www.instagram.com/eden.winery/">Instagram</a>
  <style>.x{color:red}</style>
  <h1>Bienvenue au vignoble</h1><p>Visite &amp; dégustation.</p>
</body></html>`;

describe("lecture des balises de la page", () => {
  it("décode les caractères spéciaux", () => {
    expect(decodeEntities("Caf&eacute; &amp; Co &#39;x&#39; &#x41; &nbsp;fin")).toBe("Caf&eacute; & Co 'x' A  fin");
    expect(decodeEntities("&#0; &#1114112;")).toBe("&#0; &#1114112;");
  });

  it("lit le titre, la langue et les balises meta (première valeur gardée)", () => {
    expect(extractTitle(PAGE)).toBe("Vignoble Éden & Fils | Zichron");
    expect(extractLang(PAGE)).toBe("he");
    const meta = extractMetaTags(PAGE);
    expect(meta.description).toBe("Dégustations au cœur des collines");
    expect(meta["og:title"]).toBe("Vignoble Éden");
    expect(meta["og:image"]).toBe("https://example.com/photo.jpg");
  });

  it("ne renvoie rien quand la page n'a pas ces balises", () => {
    expect(extractTitle("<p>rien</p>")).toBeNull();
    expect(extractLang("<html>")).toBeNull();
    expect(extractMetaTags("<p>rien</p>")).toEqual({});
  });
});

describe("données structurées de la page", () => {
  it("choisit l'entrée la plus précise du lieu et lit adresse, position et Instagram", () => {
    const place = pickPlaceFromJsonLd(PAGE);
    expect(place).toMatchObject({
      name: "Vignoble Éden",
      phone: "+972 4-123 4567",
      address: "Rue des Vignes 12",
      city: "Zichron Yaakov",
      region: "Nord",
      latitude: 32.5723,
      longitude: 34.9531,
      image: "https://example.com/a.jpg",
    });
    expect(place?.sameAs).toContain("https://www.instagram.com/eden.winery/");
  });

  it("supporte une adresse écrite en simple texte et ignore un bloc mal formé", () => {
    const html = `<script type="application/ld+json">{"@type":"Restaurant","name":"Chez Moi","address":"5 Allenby, Tel Aviv"}</script>`;
    expect(pickPlaceFromJsonLd(html)).toMatchObject({ name: "Chez Moi", address: "5 Allenby, Tel Aviv", city: null });
    expect(pickPlaceFromJsonLd("<script type='application/ld+json'>{cassé</script>")).toBeNull();
    expect(pickPlaceFromJsonLd("<p>aucune donnée</p>")).toBeNull();
  });
});

describe("coordonnées trouvées dans les liens", () => {
  const hrefs = extractHrefs(PAGE);

  it("ne prend que les vrais liens (pas ceux cachés dans un script)", () => {
    expect(hrefs).not.toContain("tel:000");
    expect(hrefs).toContain("https://www.instagram.com/eden.winery/");
  });

  it("trouve le téléphone, l'email et le compte Instagram", () => {
    expect(findPhone(hrefs)).toBe("+972 4 123 4567");
    expect(findEmail(hrefs)).toBe("contact@eden.co.il");
    expect(findInstagram(hrefs)).toBe("@eden.winery");
  });

  it("ignore les liens Instagram qui ne sont pas un compte, et les numéros trop courts", () => {
    expect(findInstagram(["https://www.instagram.com/p/AbC123/", "https://instagram.com/explore/"])).toBeNull();
    expect(findPhone(["tel:123"])).toBeNull();
    expect(findEmail(["mailto:pas-un-email"])).toBeNull();
  });

  it("normalise un compte Instagram écrit de plusieurs façons", () => {
    expect(normalizeInstagram("eden.winery")).toBe("@eden.winery");
    expect(normalizeInstagram("@eden.winery")).toBe("@eden.winery");
    expect(normalizeInstagram("https://www.instagram.com/eden.winery/?hl=fr")).toBe("@eden.winery");
    expect(normalizeInstagram("pas un compte!")).toBeNull();
    expect(normalizeInstagram("")).toBeNull();
  });
});

describe("texte lisible de la page", () => {
  it("enlève scripts, styles et balises, et coupe à la longueur demandée", () => {
    const text = htmlToText(PAGE);
    expect(text).toContain("Bienvenue au vignoble");
    expect(text).toContain("Visite & dégustation.");
    expect(text).not.toContain("color:red");
    expect(text).not.toContain("ignoré");
    expect(htmlToText(PAGE, 10)).toHaveLength(10);
  });
});
