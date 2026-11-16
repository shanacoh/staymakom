import { describe, expect, it } from "vitest";
import { formatTimeSlot, slotsForDate, sortTimeSlots } from "./timeSlots";

describe("créneaux horaires", () => {
  it("traduit les moments de la journée et laisse une heure telle quelle", () => {
    expect(formatTimeSlot("morning", "fr")).toBe("Matin");
    expect(formatTimeSlot("afternoon", "en")).toBe("Afternoon");
    expect(formatTimeSlot("afternoon", "he")).toBe("אחר הצהריים");
    expect(formatTimeSlot("09:30", "fr")).toBe("09:30");
    expect(formatTimeSlot(null)).toBe("");
  });

  it("range le matin avant l'après-midi, au milieu des heures", () => {
    expect(sortTimeSlots(["afternoon", "16:00", "morning", "10:00"])).toEqual(["morning", "10:00", "afternoon", "16:00"]);
  });

  it("prend les horaires propres à une date s'ils existent, sinon les horaires habituels", () => {
    const habituels = ["19:15", "20:00"];
    const labels = {
      "2026-12-07": { en: "5:45pm or 6:30pm", fr: "17h45 ou 18h30", slots: ["17:45", "18:30"] },
      "2026-12-17": { en: "Evening" },
      "2026-12-20": { fr: "x", slots: [] },
    };
    expect(slotsForDate(habituels, labels, "2026-12-07")).toEqual(["17:45", "18:30"]);
    expect(slotsForDate(habituels, labels, "2026-12-17")).toEqual(habituels);
    expect(slotsForDate(habituels, labels, "2026-12-20")).toEqual(habituels);
    expect(slotsForDate(habituels, null, "2026-12-07")).toEqual(habituels);
    expect(slotsForDate(habituels, labels, "")).toEqual(habituels);
    expect(slotsForDate(null, null, "2026-12-07")).toEqual([]);
  });
});
