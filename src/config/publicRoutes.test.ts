import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { classifyPath } from "./publicRoutes";

// Toutes les adresses de premier niveau déclarées dans App.tsx (path="/..."),
// avec un exemple de valeur à la place des paramètres (:slug, :token...).
function appRoutes(): string[] {
  const source = readFileSync(join(__dirname, "..", "App.tsx"), "utf-8");
  return [...source.matchAll(/path="(\/[^"]*)"/g)]
    .map((m) => m[1])
    .filter((p) => p !== "/*")
    .map((p) => p.replace(/\/\*$/, "/x").replace(/:[A-Za-z]+/g, "exemple"));
}

describe("plan des adresses du guichet robots", () => {
  it("classe chaque adresse de App.tsx (sinon les robots recevraient une 404 sur une vraie page)", () => {
    const unknown = appRoutes().filter((p) => classifyPath(p) === "unknown");
    expect(unknown).toEqual([]);
  });

  it("ne traite jamais les parcours de paiement comme des pages à préparer", () => {
    for (const p of ["/checkout", "/standalone-checkout", "/cart", "/booking/confirmation/abc", "/standalone-booking/confirmation/abc", "/billet/abc", "/admin/bookings", "/account"]) {
      expect(classifyPath(p)).toBe("private");
    }
  });

  it("reconnaît les fiches et repère les adresses inexistantes", () => {
    expect(classifyPath("/hotel/the-inbal-jerusalem")).toBe("page");
    expect(classifyPath("/experience/wine-tasting-negev-beresheet")).toBe("page");
    expect(classifyPath("/celine30")).toBe("page");
    expect(classifyPath("/journal/")).toBe("page");
    expect(classifyPath("/page-inexistante-test-404")).toBe("unknown");
    expect(classifyPath("/hotel/a/b")).toBe("unknown");
  });
});
