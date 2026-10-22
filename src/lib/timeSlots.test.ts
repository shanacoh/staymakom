import { describe, expect, it } from "vitest";
import { formatTimeSlot, sortTimeSlots } from "./timeSlots";

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
});
