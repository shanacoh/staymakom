import { describe, it, expect } from "vitest";
import { isBlockedHostname, isPrivateIp, parsePublicHttpUrl } from "./safe-url";

describe("adresses internes refusées", () => {
  it("reconnaît les adresses IPv4 privées", () => {
    for (const ip of ["127.0.0.1", "10.0.0.5", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "0.0.0.0", "100.64.0.1"]) {
      expect(isPrivateIp(ip), ip).toBe(true);
    }
    for (const ip of ["8.8.8.8", "172.32.0.1", "172.15.0.1", "93.184.216.34"]) {
      expect(isPrivateIp(ip), ip).toBe(false);
    }
  });

  it("reconnaît les adresses IPv6 privées, y compris une IPv4 déguisée", () => {
    for (const ip of ["::1", "::", "fd00::1", "fc00::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:10.1.2.3", "[::1]"]) {
      expect(isPrivateIp(ip), ip).toBe(true);
    }
    expect(isPrivateIp("2606:4700:4700::1111")).toBe(false);
    expect(isPrivateIp("::ffff:8.8.8.8")).toBe(false);
  });

  it("refuse les noms de machine internes", () => {
    for (const host of ["localhost", "app.localhost", "printer.local", "db.internal", "intranet", "127.0.0.1", "[::1]"]) {
      expect(isBlockedHostname(host), host).toBe(true);
    }
    expect(isBlockedHostname("www.tishbi.com")).toBe(false);
    expect(isBlockedHostname("site.co.il")).toBe(false);
  });
});

describe("parsePublicHttpUrl", () => {
  it("accepte un site public en http ou https", () => {
    expect(parsePublicHttpUrl("https://www.tishbi.com/fr?x=1")?.hostname).toBe("www.tishbi.com");
    expect(parsePublicHttpUrl("  http://example.co.il ")?.protocol).toBe("http:");
  });

  it("refuse tout ce qui pourrait viser l'intérieur ou n'est pas une page web", () => {
    for (const url of [
      "ftp://example.com",
      "file:///etc/passwd",
      "javascript:alert(1)",
      "http://localhost/admin",
      "http://127.0.0.1:54321/",
      "http://2130706433/", // 127.0.0.1 écrit en nombre
      "http://0x7f000001/",
      "http://[::1]/",
      "http://169.254.169.254/latest/meta-data",
      "https://user:pass@example.com",
      "https://example.com:8443/",
      "pas une adresse",
      "",
    ]) {
      expect(parsePublicHttpUrl(url), url).toBeNull();
    }
  });
});
