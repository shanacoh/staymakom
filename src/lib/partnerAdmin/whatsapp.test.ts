import { describe, expect, it } from "vitest";
import { buildInviteMessage, partnerLoginUrl, whatsappInviteUrl } from "./whatsapp";

describe("invitation WhatsApp", () => {
  it("écrit le message dans la langue du prestataire, avec le lien de connexion pré-rempli", () => {
    const fr = buildInviteMessage({ language: "fr", contactName: "Noa", email: "Noa@Citrus.co.il " });
    expect(fr).toContain("Bonjour Noa,");
    expect(fr).toContain("https://staymakom.com/partner/login?email=noa%40citrus.co.il");
    expect(fr).toContain("L'équipe STAYMAKOM");
    expect(buildInviteMessage({ language: "he", contactName: null, email: null })).toContain("צוות STAYMAKOM");
  });

  it("retombe sur l'anglais quand la langue n'est pas renseignée", () => {
    expect(buildInviteMessage({ language: null, contactName: "", email: "" })).toMatch(/^Hello, your STAYMAKOM partner space/);
    expect(partnerLoginUrl(null)).toBe("https://staymakom.com/partner/login");
  });

  it("construit le lien WhatsApp, y compris pour un numéro israélien sans indicatif", () => {
    expect(whatsappInviteUrl("+972 54-305-1127", "Salut !")).toBe("https://wa.me/972543051127?text=Salut%20!");
    expect(whatsappInviteUrl("054 305 1127", "x")).toBe("https://wa.me/972543051127?text=x");
    expect(whatsappInviteUrl("00972543051127", "x")).toBe("https://wa.me/972543051127?text=x");
    expect(whatsappInviteUrl("", "x")).toBeNull();
    expect(whatsappInviteUrl("12", "x")).toBeNull();
  });
});
