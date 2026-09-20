import { describe, it, expect, vi } from "vitest";
import { cleanInstagramCaption, cleanTitle, looksLikeUrl, lookup, LookupError, platformOf, queryVariants, type LookupDeps } from "./lookup";

const SITE_HTML = `<html lang="fr"><head>
<title>Vignoble Éden | Accueil</title>
<meta name="description" content="Domaine viticole familial.">
<meta property="og:image" content="/img/cover.jpg">
<script type="application/ld+json">{"@type":"Winery","name":"Vignoble Éden","telephone":"+972 4-111 2222",
"address":{"streetAddress":"HaYekev 1","addressLocality":"Zichron Yaakov"}}</script>
</head><body><a href="https://instagram.com/eden.winery">ig</a></body></html>`;

const OSM_WINERY = {
  lat: "32.57", lon: "34.95", name: "Tishbi Winery", category: "craft", type: "winery",
  address: { road: "HaYekev", house_number: "1", town: "Zichron Yaakov", state: "Haifa District" },
  extratags: { website: "https://www.tishbi.com" },
};

type Route = (url: URL, init?: RequestInit) => Response | Promise<Response> | undefined;

function makeDeps(routes: Route[], extra: Partial<LookupDeps> = {}): { deps: LookupDeps; calls: string[] } {
  const calls: string[] = [];
  const fetchFn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    calls.push(url.toString());
    for (const route of routes) {
      const response = await route(url, init);
      if (response) return response;
    }
    return new Response("not found", { status: 404 });
  }) as typeof fetch;
  return { deps: { fetchFn, sleep: async () => undefined, ...extra }, calls };
}

const html = (body: string, init: ResponseInit = {}) =>
  new Response(body, { status: 200, headers: { "content-type": "text/html; charset=utf-8" }, ...init });
const json = (data: unknown) => new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json" } });
const osmRoute = (results: unknown[]): Route => (url) => (url.hostname === "nominatim.openstreetmap.org" ? json(results) : undefined);

describe("reconnaissance de la saisie", () => {
  it("distingue un lien d'un nom", () => {
    expect(looksLikeUrl("https://www.tishbi.com/fr")).toBe(true);
    expect(looksLikeUrl("www.tishbi.com")).toBe(true);
    expect(looksLikeUrl("tishbi.co.il/contact")).toBe(true);
    expect(looksLikeUrl("Vignoble Tishbi")).toBe(false);
    expect(looksLikeUrl("Café Rimon Jérusalem")).toBe(false);
    expect(looksLikeUrl("Tishbi")).toBe(false);
  });

  it("reconnaît les plateformes et nettoie les titres et légendes", () => {
    expect(platformOf("www.tiktok.com")).toBe("tiktok");
    expect(platformOf("vm.tiktok.com")).toBe("tiktok");
    expect(platformOf("maps.app.goo.gl")).toBe("google_maps");
    expect(platformOf("www.tishbi.com")).toBe("site_web");
    expect(cleanTitle("Vignoble Éden & Fils | Zichron")).toBe("Vignoble Éden & Fils");
    expect(cleanTitle("Café Rimon - Jérusalem")).toBe("Café Rimon");
    expect(cleanTitle("Wi-Fi Lounge")).toBe("Wi-Fi Lounge");
    expect(cleanTitle(null)).toBeNull();
    expect(cleanInstagramCaption('120 likes, 4 comments - chef on March 3, 2025: "Le meilleur vin de Zichron !"')).toBe("Le meilleur vin de Zichron !");
    expect(cleanInstagramCaption("Juste un texte")).toBe("Juste un texte");
  });
});

describe("recherche par nom", () => {
  it("propose les lieux trouvés à choisir, sans rien deviner", async () => {
    const { deps } = makeDeps([osmRoute([OSM_WINERY])]);
    const result = await lookup("Tishbi", ["Center District Israel"], deps);
    expect(result.kind).toBe("name");
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].suggestion).toMatchObject({ name: "Tishbi Winery", place_type: "activite", website: "https://www.tishbi.com/" });
    expect(result.suggestion.name).toBeNull();
  });

  it("cherche d'abord en Israël, puis partout si rien n'est trouvé", async () => {
    const { deps, calls } = makeDeps([(url) => (url.searchParams.get("countrycodes") === "il" ? json([]) : json([OSM_WINERY]))]);
    const result = await lookup("Tishbi", [], deps);
    expect(result.candidates).toHaveLength(1);
    expect(calls).toHaveLength(2);
    expect(calls[0]).toContain("countrycodes=il");
    expect(calls[1]).not.toContain("countrycodes");
  });

  it("réessaie avec une recherche plus courte et le dit", async () => {
    const { deps, calls } = makeDeps([(url) => (url.searchParams.get("q") === "Tishbi Winery" ? json([OSM_WINERY]) : url.hostname === "nominatim.openstreetmap.org" ? json([]) : undefined)]);
    const result = await lookup("Tishbi Winery Zichron Yaakov", [], deps);
    expect(result.candidates).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/recherche élargie à « Tishbi Winery »/);
    expect(calls.map((c) => new URL(c).searchParams.get("q"))).toEqual(["Tishbi Winery Zichron Yaakov", "Tishbi Winery Zichron", "Tishbi Winery"]);
  });

  it("prépare des variantes de recherche raisonnables", () => {
    expect(queryVariants("Tishbi Winery Zichron Yaakov")).toEqual(["Tishbi Winery Zichron Yaakov", "Tishbi Winery Zichron", "Tishbi Winery"]);
    expect(queryVariants("Café Rimon")).toEqual(["Café Rimon"]); // "Café" seul serait trop vague
    expect(queryVariants("Tishbi Zichron")).toEqual(["Tishbi Zichron", "Tishbi"]);
    expect(queryVariants("  Tishbi  ")).toEqual(["Tishbi"]);
  });

  it("prévient quand rien n'est trouvé", async () => {
    const { deps } = makeDeps([osmRoute([])]);
    const result = await lookup("Lieu inconnu xyz", [], deps);
    expect(result.candidates).toEqual([]);
    expect(result.warnings[0]).toMatch(/Aucun lieu trouvé/);
  });

  it("signale clairement un service de cartes indisponible", async () => {
    const { deps } = makeDeps([() => new Response("erreur", { status: 500 })]);
    await expect(lookup("Tishbi", [], deps)).rejects.toMatchObject({ status: 503 });
  });

  it("refuse une saisie vide ou trop longue", async () => {
    const { deps } = makeDeps([]);
    await expect(lookup("   ", [], deps)).rejects.toBeInstanceOf(LookupError);
    await expect(lookup("a".repeat(501), [], deps)).rejects.toBeInstanceOf(LookupError);
  });
});

describe("recherche à partir d'un site", () => {
  const siteRoute: Route = (url) => (url.hostname === "www.eden.co.il" ? html(SITE_HTML) : undefined);
  const aiReply = JSON.stringify({
    name: "Vignoble Éden", place_type: "activite", city: "Zichron Yaakov", region: "Center District", address: "HaYekev 1",
    phone: null, email: "hello@eden.co.il", instagram: null, description: "Un domaine viticole familial.",
  });

  it("combine la page, l'IA et la position trouvée à partir de l'adresse", async () => {
    const askAi = vi.fn(async () => aiReply);
    const { deps, calls } = makeDeps([siteRoute, osmRoute([OSM_WINERY])], { askAi });
    const result = await lookup("https://www.eden.co.il/", ["Center District Israel"], deps);

    expect(result.kind).toBe("site");
    expect(result.suggestion).toMatchObject({
      name: "Vignoble Éden",
      place_type: "activite",
      city: "Zichron Yaakov",
      region: "Center District Israel", // écriture déjà utilisée dans le catalogue
      address: "HaYekev 1",
      phone: "+972 4-111 2222", // lu dans la page, prioritaire sur l'IA
      email: "hello@eden.co.il", // absent de la page, donné par l'IA
      instagram: "@eden.winery",
      description: "Un domaine viticole familial.",
      latitude: 32.57,
      longitude: 34.95,
    });
    expect(result.suggestion.google_maps_link).toContain("32.57,34.95");
    expect(result.link).toMatchObject({ platform: "site_web", thumbnail_url: "https://www.eden.co.il/img/cover.jpg" });
    expect(result.sources).toEqual(["le site", "l'IA", "OpenStreetMap"]);
    expect(askAi).toHaveBeenCalledTimes(1);
    expect(calls.some((c) => c.includes("nominatim") && c.includes("HaYekev"))).toBe(true);
  });

  it("fonctionne sans IA, avec ce qui est lisible directement dans la page", async () => {
    const { deps } = makeDeps([siteRoute, osmRoute([])]);
    const result = await lookup("www.eden.co.il", [], deps);
    expect(result.suggestion).toMatchObject({ name: "Vignoble Éden", phone: "+972 4-111 2222", description: "Domaine viticole familial.", place_type: null });
    expect(result.warnings[0]).toMatch(/IA n'est pas disponible/);
  });

  it("garde le résultat de la page quand l'IA échoue", async () => {
    const { deps } = makeDeps([siteRoute, osmRoute([])], { askAi: async () => { throw new Error("panne"); } });
    const result = await lookup("https://www.eden.co.il", [], deps);
    expect(result.suggestion.name).toBe("Vignoble Éden");
    expect(result.warnings.join(" ")).toMatch(/L'IA n'a pas pu/);
  });

  it("suit une redirection vers le site final", async () => {
    const { deps } = makeDeps([
      (url) => (url.hostname === "eden.co.il" ? new Response(null, { status: 301, headers: { location: "https://www.eden.co.il/fr" } }) : undefined),
      siteRoute,
      osmRoute([]),
    ]);
    const result = await lookup("https://eden.co.il", [], deps);
    expect(result.suggestion.website).toBe("https://www.eden.co.il/fr");
  });
});

describe("sécurité de la lecture des sites", () => {
  it("refuse les adresses internes avant tout appel réseau", async () => {
    const { deps, calls } = makeDeps([]);
    for (const query of ["http://localhost/admin", "http://127.0.0.1:8080", "http://169.254.169.254/latest/meta-data", "https://user:pw@example.com"]) {
      await expect(lookup(query, [], deps)).rejects.toBeInstanceOf(LookupError);
    }
    expect(calls).toHaveLength(0);
  });

  it("refuse un site qui redirige vers une adresse interne", async () => {
    const { deps } = makeDeps([(url) => (url.hostname === "piege.com" ? new Response(null, { status: 302, headers: { location: "http://169.254.169.254/" } }) : undefined)]);
    await expect(lookup("https://piege.com", [], deps)).rejects.toMatchObject({ message: expect.stringMatching(/redirige/) });
  });

  it("refuse un domaine dont l'adresse réelle est interne", async () => {
    const { deps, calls } = makeDeps([], { resolveHost: async () => ["10.0.0.7"] });
    await expect(lookup("https://faux-public.com", [], deps)).rejects.toMatchObject({ message: expect.stringMatching(/réseau interne/) });
    expect(calls).toHaveLength(0);
  });

  it("n'est pas bloquée quand la vérification des adresses n'est pas possible", async () => {
    const { deps } = makeDeps([(url) => (url.hostname === "www.eden.co.il" ? html(SITE_HTML) : undefined), osmRoute([])], { resolveHost: async () => null });
    await expect(lookup("https://www.eden.co.il", [], deps)).resolves.toMatchObject({ kind: "site" });
  });

  it("refuse ce qui n'est pas une page web, et les erreurs du site", async () => {
    const { deps } = makeDeps([
      (url) => (url.hostname === "fichier.com" ? new Response("%PDF", { headers: { "content-type": "application/pdf" } }) : undefined),
      (url) => (url.hostname === "casse.com" ? new Response("boom", { status: 503 }) : undefined),
    ]);
    await expect(lookup("https://fichier.com/menu.pdf", [], deps)).rejects.toMatchObject({ status: 422 });
    await expect(lookup("https://casse.com", [], deps)).rejects.toMatchObject({ message: expect.stringMatching(/erreur 503/) });
  });

  it("coupe une page démesurée au lieu de tout charger", async () => {
    const huge = "x".repeat(3_000_000);
    const { deps } = makeDeps([(url) => (url.hostname === "enorme.com" ? html(`<title>Gros</title>${huge}`) : undefined), osmRoute([])]);
    const result = await lookup("https://enorme.com", [], deps);
    expect(result.suggestion.name).toBe("Gros");
  });
});

describe("recherche à partir d'une vidéo", () => {
  const tiktokRoute: Route = (url) =>
    url.hostname === "www.tiktok.com" && url.pathname === "/oembed"
      ? json({ title: "Dégustation chez Tishbi à Zichron", author_name: "foodie", thumbnail_url: "https://cdn.tt/thumb.jpg" })
      : undefined;

  it("copie légende, auteur et vignette, puis retrouve le lieu cité", async () => {
    const askAi = async () => JSON.stringify({ name: "Tishbi Winery", city: "Zichron Yaakov", place_type: "activite" });
    const { deps } = makeDeps([tiktokRoute, osmRoute([OSM_WINERY])], { askAi });
    const result = await lookup("https://www.tiktok.com/@foodie/video/7300000000000000000?_t=abc", [], deps);

    expect(result.kind).toBe("social");
    expect(result.link).toEqual({
      platform: "tiktok",
      url: "https://www.tiktok.com/@foodie/video/7300000000000000000?_t=abc",
      caption: "Dégustation chez Tishbi à Zichron",
      author: "foodie",
      thumbnail_url: "https://cdn.tt/thumb.jpg",
    });
    expect(result.suggestion.name).toBe("Tishbi Winery");
    expect(result.candidates[0].suggestion.address).toBe("HaYekev 1");
  });

  it("garde au moins le lien quand la vidéo n'est pas lisible", async () => {
    const { deps } = makeDeps([(url) => (url.hostname === "www.tiktok.com" ? new Response("no", { status: 400 }) : undefined)]);
    const result = await lookup("https://vm.tiktok.com/ZMabcdef/", [], deps);
    expect(result.link).toMatchObject({ platform: "tiktok", caption: null, thumbnail_url: null });
    expect(result.warnings[0]).toMatch(/n'a pas pu être lue/);
  });

  it("lit la légende d'un post Instagram public", async () => {
    const igPage = `<html><head><meta property="og:title" content="Chef Dan on Instagram: &quot;Spot incroyable&quot;">
    <meta property="og:description" content='120 likes, 4 comments - chefdan on March 3, 2025: "Spot incroyable à Jaffa"'>
    <meta property="og:image" content="https://cdn.ig/p.jpg"></head></html>`;
    const { deps } = makeDeps([(url) => (url.hostname === "www.instagram.com" ? html(igPage) : undefined)]);
    const result = await lookup("https://www.instagram.com/reel/CxYzAbCdE/?igsh=xyz", [], deps);
    expect(result.link).toMatchObject({ platform: "instagram", caption: "Spot incroyable à Jaffa", author: "Chef Dan", thumbnail_url: "https://cdn.ig/p.jpg" });
  });

  it("garde un lien Google Maps tel quel, sans le lire", async () => {
    const { deps, calls } = makeDeps([]);
    const result = await lookup("https://maps.app.goo.gl/abc123", [], deps);
    expect(result.link).toMatchObject({ platform: "google_maps" });
    expect(result.warnings[0]).toMatch(/Google Maps/);
    expect(calls).toHaveLength(0);
  });
});
