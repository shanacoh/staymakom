import { describe, expect, it } from "vitest";
import { isBotUserAgent, isProductionHost, isUntrackedPath } from "./trackingGuard";
import { computeEntrySource } from "./analytics";

const REAL_CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Mobile/15E148 Safari/604.1";

describe("Amplitude : robots exclus", () => {
  it("vrais visiteurs comptés", () => {
    expect(isBotUserAgent(REAL_CHROME)).toBe(false);
    expect(isBotUserAgent(IPHONE)).toBe(false);
    expect(isBotUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 450.0.0")).toBe(false);
  });
  it("robots connus exclus", () => {
    for (const ua of [
      "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
      "meta-webindexer/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)",
      "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/153.0.0.0 Safari/537.36",
      "Prerender (+https://github.com/prerender/prerender)",
      "",
    ]) {
      expect(isBotUserAgent(ua)).toBe(true);
    }
  });
  it("le faux Chrome 145 de bureau (New York) est exclu, pas un Chrome 145 mobile", () => {
    expect(isBotUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36")).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36")).toBe(true);
    expect(isBotUserAgent("Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36")).toBe(false);
  });
  it("seul le vrai site est compté, jamais le back-office", () => {
    expect(isProductionHost("www.staymakom.com")).toBe(true);
    expect(isProductionHost("localhost")).toBe(false);
    expect(isProductionHost("staymakom-git-xyz.vercel.app")).toBe(false);
    expect(isUntrackedPath("/admin/bookings")).toBe(true);
    expect(isUntrackedPath("/hotel-admin")).toBe(true);
    expect(isUntrackedPath("/administration-tips")).toBe(false);
  });
});

describe("Source d'arrivée", () => {
  it("utm_source prime sur le referrer", () => {
    expect(computeEntrySource("newsletter", "https://www.google.com/", REAL_CHROME)).toBe("newsletter");
  });
  it("navigateurs intégrés sans referrer reconnus", () => {
    expect(computeEntrySource(undefined, "", `${IPHONE} Instagram 450.0.0`)).toBe("instagram");
    expect(computeEntrySource(undefined, "", `${IPHONE} musical_ly_35.0`)).toBe("tiktok");
    expect(computeEntrySource(undefined, "", `${IPHONE} WhatsApp/2.24`)).toBe("whatsapp");
    expect(computeEntrySource(undefined, "", IPHONE)).toBe("direct");
  });
});
