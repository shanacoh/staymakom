import { describe, it, expect } from "vitest";
import { detectPlatform, getEmbed, isHttpUrl, sourceFromPlatform } from "./embed";

describe("isHttpUrl", () => {
  it("accepte http et https, refuse le reste", () => {
    expect(isHttpUrl("https://www.tiktok.com/@a/video/1234567")).toBe(true);
    expect(isHttpUrl("http://example.com")).toBe(true);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("pas un lien")).toBe(false);
    expect(isHttpUrl("")).toBe(false);
  });
});

describe("detectPlatform", () => {
  it("reconnaît les plateformes usuelles, y compris les liens courts", () => {
    expect(detectPlatform("https://www.tiktok.com/@chef/video/7300000000000000000")).toBe("tiktok");
    expect(detectPlatform("https://vm.tiktok.com/ZMabcdef/")).toBe("tiktok");
    expect(detectPlatform("https://www.instagram.com/reel/CxYzAbCdE/")).toBe("instagram");
    expect(detectPlatform("https://youtu.be/dQw4w9WgXcQ")).toBe("youtube");
    expect(detectPlatform("https://maps.app.goo.gl/abc123")).toBe("google_maps");
    expect(detectPlatform("https://www.google.com/maps/place/Eilat")).toBe("google_maps");
    expect(detectPlatform("https://www.un-vignoble.co.il")).toBe("site_web");
    expect(detectPlatform("n'importe quoi")).toBe("autre");
  });

  it("ne se laisse pas tromper par un faux domaine", () => {
    expect(detectPlatform("https://nottiktok.com/video/1")).toBe("site_web");
    expect(detectPlatform("https://tiktok.com.evil.io/video/1")).toBe("site_web");
  });
});

describe("sourceFromPlatform", () => {
  it("déduit l'origine de l'idée", () => {
    expect(sourceFromPlatform("tiktok")).toBe("tiktok");
    expect(sourceFromPlatform("instagram")).toBe("instagram");
    expect(sourceFromPlatform("site_web")).toBe("autre");
  });
});

describe("getEmbed", () => {
  it("construit le lecteur TikTok à partir de l'identifiant de la vidéo", () => {
    const embed = getEmbed("https://www.tiktok.com/@chef/video/7300000000000000000?_t=abc&_r=1");
    expect(embed?.src).toBe("https://www.tiktok.com/embed/v2/7300000000000000000");
  });

  it("ne sait pas afficher un lien court TikTok (pas d'identifiant dedans)", () => {
    expect(getEmbed("https://vm.tiktok.com/ZMabcdef/")).toBeNull();
  });

  it("construit le lecteur Instagram pour un reel, un post et l'ancien format /reels/", () => {
    expect(getEmbed("https://www.instagram.com/reel/CxYzAbCdE/?igsh=xyz")?.src).toBe(
      "https://www.instagram.com/reel/CxYzAbCdE/embed"
    );
    expect(getEmbed("https://www.instagram.com/p/CxYzAbCdE/")?.src).toBe(
      "https://www.instagram.com/p/CxYzAbCdE/embed"
    );
    expect(getEmbed("https://www.instagram.com/monchef/reels/CxYzAbCdE/")?.src).toBe(
      "https://www.instagram.com/reel/CxYzAbCdE/embed"
    );
  });

  it("construit le lecteur YouTube (lien classique, court et shorts)", () => {
    expect(getEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ")?.src).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    );
    expect(getEmbed("https://youtu.be/dQw4w9WgXcQ")?.src).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(getEmbed("https://www.youtube.com/shorts/dQw4w9WgXcQ")?.src).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    );
  });

  it("refuse tout ce qui n'est pas un lecteur connu", () => {
    expect(getEmbed("https://www.un-vignoble.co.il/video")).toBeNull();
    expect(getEmbed("javascript:alert(1)")).toBeNull();
    expect(getEmbed("https://www.youtube.com/watch?v=trop-court")).toBeNull();
  });
});
