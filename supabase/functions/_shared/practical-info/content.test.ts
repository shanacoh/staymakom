import { describe, expect, it } from "vitest";
import {
  buildClientWhatsAppMessage,
  buildPracticalInfo,
  hasLocation,
  renderPracticalInfoHtml,
  renderPracticalInfoLines,
} from "./content";

const fullFiche = {
  meeting_point: "Main entrance",
  meeting_point_fr: "Entrée principale",
  address: "12 HaYarkon Street, Tel Aviv",
  access_note_fr: "Bus 4, parking gratuit",
  arrive_minutes_before: 15,
  know_before_you_go_fr: "Chaussures fermées",
  contingency_note_fr: "Report en cas de pluie",
  latitude: 32.08,
  longitude: 34.78,
};

describe("buildPracticalInfo", () => {
  it("ne crée aucun bloc quand la fiche n'a aucune info pratique", () => {
    expect(buildPracticalInfo({}, "fr")).toBeNull();
    expect(buildPracticalInfo(null, "fr")).toBeNull();
    // L'adresse seule figurait déjà dans la confirmation : elle ne suffit pas à créer le bloc.
    expect(buildPracticalInfo({ address: "12 HaYarkon Street", latitude: 32, longitude: 34 }, "fr")).toBeNull();
    expect(buildPracticalInfo({ meeting_point: "   ", arrive_minutes_before: 0 }, "en")).toBeNull();
    expect(renderPracticalInfoHtml(null)).toBe("");
    expect(renderPracticalInfoLines(null)).toEqual([]);
  });

  it("prend la langue du client, sinon l'anglais", () => {
    expect(buildPracticalInfo(fullFiche, "fr")?.meetingPoint).toBe("Entrée principale");
    expect(buildPracticalInfo(fullFiche, "he")?.meetingPoint).toBe("Main entrance");
    expect(buildPracticalInfo(fullFiche, null)?.lang).toBe("en");
  });

  it("donne l'adresse et les liens Waze et Google Maps", () => {
    const info = buildPracticalInfo(fullFiche, "fr")!;
    expect(info.address).toBe("12 HaYarkon Street, Tel Aviv");
    expect(info.wazeUrl).toBe("https://waze.com/ul?ll=32.08,34.78&navigate=yes");
    expect(info.mapsUrl).toContain("32.08,34.78");
    expect(hasLocation(info)).toBe(true);
  });

  it("sans coordonnées, les liens partent de l'adresse", () => {
    const info = buildPracticalInfo({ address: "Rue Dizengoff 1", arrive_minutes_before: 10 }, "fr")!;
    expect(info.wazeUrl).toBe("https://waze.com/ul?q=Rue%20Dizengoff%201&navigate=yes");
  });

  it("n'affiche que les champs remplis", () => {
    const info = buildPracticalInfo({ arrive_minutes_before: 20 }, "fr")!;
    const html = renderPracticalInfoHtml(info);
    expect(html).toContain("Merci d'arriver 20 minutes avant.");
    expect(html).toContain("Notre équipe vous répond sur WhatsApp");
    expect(html).not.toContain("Point de rendez-vous");
    expect(html).not.toContain("Contact le jour J");
    expect(html).not.toContain("Waze");
    expect(hasLocation(info)).toBe(false);
  });

  it("n'envoie jamais de contact du jour J au client", () => {
    const html = renderPracticalInfoHtml(buildPracticalInfo(fullFiche, "fr"));
    expect(html).not.toContain("Contact le jour J");
    expect(renderPracticalInfoLines(buildPracticalInfo(fullFiche, "fr")).join("\n")).not.toContain("📞");
  });

  it("échappe le texte saisi dans la fiche", () => {
    const html = renderPracticalInfoHtml(buildPracticalInfo({ meeting_point: "<script>x</script>" }, "en"));
    expect(html).not.toContain("<script>");
  });

  it("écrit l'hébreu de droite à gauche", () => {
    expect(renderPracticalInfoHtml(buildPracticalInfo({ meeting_point_he: "מול הכניסה" }, "he"))).toContain('dir="rtl"');
  });
});

describe("buildClientWhatsAppMessage", () => {
  const booking = { customerName: "Dana", experienceTitle: "Balade", bookingDate: "2026-10-20", timeSlot: "10:00" };

  it("reprend le contenu du bloc en texte court, au nom de l'équipe", () => {
    const message = buildClientWhatsAppMessage(booking, buildPracticalInfo(fullFiche, "fr"), "fr");
    expect(message).toContain("Bonjour Dana");
    expect(message).toContain("mardi 20 octobre 2026 à 10:00");
    expect(message).toContain("📍 Point de rendez-vous : Entrée principale");
    expect(message).toContain("Waze : https://waze.com/ul?ll=32.08,34.78&navigate=yes");
    expect(message).not.toContain("📞");
    expect(message).toContain("Notre équipe vous répond ici.");
    expect(message).not.toContain("Shana");
    expect(message).not.toContain("—");
  });

  it("reste un simple rappel quand la fiche n'a aucune info pratique", () => {
    const message = buildClientWhatsAppMessage(booking, null, "en");
    expect(message.split("\n")).toHaveLength(3);
    expect(message).toContain("Hi Dana, a quick reminder of your booking");
  });
});
