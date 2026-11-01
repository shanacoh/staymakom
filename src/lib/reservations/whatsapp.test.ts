import { describe, expect, it } from "vitest";
import { buildAgentBookingMessage, buildProviderBookingMessage, providerBookingTarget, type ProviderBookingInfo } from "./whatsapp";

const LABOWITZ: ProviderBookingInfo = {
  experience: "Jerusalem Lights Up",
  date: "2026-11-05",
  timeSlot: "21:00",
  adults: 2,
  children: 1,
  partySize: 3,
  customerName: "Alexander Labowitz",
  specialRequests: null,
  ref: "48e6",
  bookingUrl: "https://cityofdavid.org.il/en/product/hallelujah",
  instructions: "Choose the Hallelujah show",
};

describe("providerBookingTarget", () => {
  it("site ou portail du prestataire : l'agent ; sinon le prestataire", () => {
    expect(providerBookingTarget("provider_website")).toBe("agent");
    expect(providerBookingTarget("provider_portal")).toBe("agent");
    expect(providerBookingTarget("provider_request")).toBe("provider");
    expect(providerBookingTarget(null)).toBe("provider");
  });
});

describe("buildAgentBookingMessage", () => {
  it("donne le lien, les infos, les coordonnées Staymakom et les consignes", () => {
    const message = buildAgentBookingMessage(LABOWITZ);
    expect(message).toContain("Link: https://cityofdavid.org.il/en/product/hallelujah");
    expect(message).toContain("Date: 05/11/2026 at 21:00");
    expect(message).toContain("Guests: 2 adults, 1 child");
    expect(message).toContain("Name on the booking: Alexander Labowitz");
    expect(message).toContain("shana@staymakom.com");
    expect(message).toContain("Instructions: Choose the Hallelujah show");
    expect(message).not.toContain("Special requests");
  });
});

describe("buildProviderBookingMessage", () => {
  it("ne donne ni lien, ni consignes internes, et compte en personnes sans détail adultes/enfants", () => {
    const message = buildProviderBookingMessage({ ...LABOWITZ, adults: null, children: null, specialRequests: "Wheelchair" });
    expect(message).toContain("Guests: 3 people");
    expect(message).toContain("Special requests: Wheelchair");
    expect(message).not.toContain("Link:");
    expect(message).not.toContain("Instructions");
  });
});
