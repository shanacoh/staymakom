import { describe, it, expect } from "vitest";
import { distanceMeters, followRedirects, isShortLink, parseGoogleMapsUrl, unwrapConsentUrl } from "./resolve";

const u = (s: string) => new URL(s);

describe("isShortLink", () => {
  it("reconnaît les liens courts de TikTok, Google Maps et Instagram", () => {
    for (const url of [
      "https://vm.tiktok.com/ZMabc/",
      "https://vt.tiktok.com/ZSabc/",
      "https://www.tiktok.com/t/ZTabc/",
      "https://maps.app.goo.gl/AbC123",
      "https://goo.gl/maps/xyz",
      "https://www.instagram.com/share/reel/BAbc/",
    ]) {
      expect(isShortLink(u(url)), url).toBe(true);
    }
    for (const url of ["https://www.tiktok.com/@a/video/123", "https://www.instagram.com/reel/Cx/", "https://www.tishbi.com"]) {
      expect(isShortLink(u(url)), url).toBe(false);
    }
  });
});

describe("parseGoogleMapsUrl", () => {
  it("lit le nom et la position exacte du lieu (avant le centre de la carte)", () => {
    const place = parseGoogleMapsUrl(
      "https://www.google.com/maps/place/Tishbi+Winery/@32.5800,34.9600,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x1!8m2!3d32.5723!4d34.9531"
    );
    expect(place).toEqual({ name: "Tishbi Winery", latitude: 32.5723, longitude: 34.9531 });
  });

  it("lit un nom accentué ou en hébreu, et la position du centre quand il n'y a pas mieux", () => {
    expect(parseGoogleMapsUrl("https://www.google.com/maps/place/Caf%C3%A9+Rimon/@31.7810,35.2200,17z")).toEqual({
      name: "Café Rimon",
      latitude: 31.781,
      longitude: 35.22,
    });
    expect(parseGoogleMapsUrl("https://www.google.com/maps/place/%D7%99%D7%A7%D7%91+%D7%AA%D7%A9%D7%91%D7%99/@32.5,34.9,15z").name).toBe("יקב תשבי");
  });

  it("lit les autres formes de liens (recherche par position, par nom)", () => {
    expect(parseGoogleMapsUrl("https://www.google.com/maps/search/?api=1&query=32.5723,34.9531")).toEqual({
      name: null,
      latitude: 32.5723,
      longitude: 34.9531,
    });
    expect(parseGoogleMapsUrl("https://www.google.com/maps?q=Tishbi+Winery&ll=32.57,34.95")).toEqual({
      name: "Tishbi Winery",
      latitude: 32.57,
      longitude: 34.95,
    });
    expect(parseGoogleMapsUrl("https://www.google.com/maps/place/32.5723,34.9531")).toMatchObject({ name: null });
  });

  it("ne renvoie rien d'inventé pour un lien sans nom ni position, ou une position impossible", () => {
    expect(parseGoogleMapsUrl("https://www.google.com/maps")).toEqual({ name: null, latitude: null, longitude: null });
    expect(parseGoogleMapsUrl("pas une adresse")).toEqual({ name: null, latitude: null, longitude: null });
    expect(parseGoogleMapsUrl("https://www.google.com/maps/place/X/@95.1,200.5,17z").latitude).toBeNull();
  });
});

describe("unwrapConsentUrl", () => {
  it("retrouve l'adresse voulue derrière la page de consentement de Google", () => {
    const wrapped = u("https://consent.google.com/ml?continue=https://www.google.com/maps/place/X/@1.5,2.5,17z&gl=FR");
    expect(unwrapConsentUrl(wrapped).hostname).toBe("www.google.com");
    expect(unwrapConsentUrl(u("https://www.tishbi.com")).hostname).toBe("www.tishbi.com");
  });

  it("ignore une destination interne cachée dans la page de consentement", () => {
    const evil = u("https://consent.google.com/ml?continue=http://169.254.169.254/latest");
    expect(unwrapConsentUrl(evil).hostname).toBe("consent.google.com");
  });
});

describe("followRedirects", () => {
  const redirect = (to: string) => new Response(null, { status: 302, headers: { location: to } });
  const ok = () => new Response("<html>", { status: 200 });
  const noCheck = async () => undefined;

  it("suit un lien court jusqu'à la vraie adresse", async () => {
    const calls: string[] = [];
    const fetchFn = (async (input: RequestInfo | URL) => {
      calls.push(String(input));
      if (String(input).includes("vm.tiktok.com")) return redirect("https://www.tiktok.com/@a/video/123?_r=1");
      return ok();
    }) as typeof fetch;
    const final = await followRedirects(u("https://vm.tiktok.com/ZMabc/"), fetchFn, noCheck);
    expect(final.toString()).toBe("https://www.tiktok.com/@a/video/123?_r=1");
    expect(calls).toHaveLength(2);
  });

  it("passe à travers la page de consentement de Google", async () => {
    const fetchFn = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("maps.app.goo.gl")) return redirect("https://consent.google.com/ml?continue=https://www.google.com/maps/place/X/@1.5,2.5,17z");
      return ok();
    }) as typeof fetch;
    const final = await followRedirects(u("https://maps.app.goo.gl/abc"), fetchFn, noCheck);
    expect(final.toString()).toBe("https://www.google.com/maps/place/X/@1.5,2.5,17z");
  });

  it("s'arrête avant une redirection vers une adresse interne", async () => {
    const fetchFn = (async () => redirect("http://169.254.169.254/latest")) as typeof fetch;
    const final = await followRedirects(u("https://vm.tiktok.com/ZMabc/"), fetchFn, noCheck);
    expect(final.hostname).toBe("vm.tiktok.com");
  });

  it("garde la dernière bonne adresse quand une étape échoue ou refuse", async () => {
    const boom = (async () => { throw new Error("réseau"); }) as typeof fetch;
    expect((await followRedirects(u("https://vm.tiktok.com/ZMabc/"), boom, noCheck)).hostname).toBe("vm.tiktok.com");
    const fetchFn = (async () => ok()) as typeof fetch;
    const refuse = async () => { throw new Error("interne"); };
    expect((await followRedirects(u("https://maps.app.goo.gl/x"), fetchFn, refuse)).hostname).toBe("maps.app.goo.gl");
  });

  it("ne tourne pas en rond indéfiniment", async () => {
    let n = 0;
    const fetchFn = (async () => redirect(`https://vm.tiktok.com/loop${++n}`)) as typeof fetch;
    await followRedirects(u("https://vm.tiktok.com/start"), fetchFn, noCheck);
    expect(n).toBeLessThanOrEqual(5);
  });
});

describe("distanceMeters", () => {
  it("mesure des distances réalistes", () => {
    expect(distanceMeters(32.5723, 34.9531, 32.5723, 34.9531)).toBe(0);
    expect(Math.round(distanceMeters(32.0853, 34.7818, 31.7683, 35.2137) / 1000)).toBe(54); // Tel Aviv à Jérusalem
    expect(distanceMeters(32.5723, 34.9531, 32.5732, 34.9531)).toBeLessThan(120);
  });
});
