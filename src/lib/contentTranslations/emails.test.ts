import { describe, expect, it } from "vitest";
import { customerEmailLang } from "../../../supabase/functions/_shared/email-lang";
import { applyRowTranslations } from "../../../supabase/functions/_shared/translations/translateRow";
import { hashSource, normalizeSource } from "../../../supabase/functions/_shared/translations/plan";
import { buildPracticalInfo, formatBookingDate, practicalInfoLabels } from "../../../supabase/functions/_shared/practical-info/content";
import { TICKET_TEXTS } from "../../../supabase/functions/_shared/tickets/content";
import { formatTimeSlot } from "../../../supabase/functions/_shared/time-slot";

const hashOf = async (text: string) => hashSource(normalizeSource(text, "text")!);

describe("emails client dans la langue de la page", () => {
  it("langue de l'email : client_locale es / ru / de d'abord, sinon preferred_lang", () => {
    expect(customerEmailLang("ru", "en")).toBe("ru");
    expect(customerEmailLang("de", null)).toBe("de");
    expect(customerEmailLang("fr", "fr")).toBe("fr");
    expect(customerEmailLang(null, "he")).toBe("he");
    expect(customerEmailLang(undefined, undefined)).toBe("en");
  });

  it("une traduction n'est posée que si l'anglais n'a pas changé ; ville et région jamais", async () => {
    const row = { id: "x", title: "Sunset Sail", meeting_point: "Marina gate", city: "Herzliya" };
    const out = await applyRowTranslations("standalone_experience", row, [
      { field: "title", text: "Закатная прогулка", source_hash: await hashOf("Sunset Sail") },
      { field: "meeting_point", text: "Старый вход", source_hash: await hashOf("Old gate") },
      { field: "city", text: "Герцлия", source_hash: await hashOf("Herzliya") },
    ]);
    expect(out.title).toBe("Закатная прогулка");
    expect(out.meeting_point).toBe("Marina gate");
    expect(out.city).toBe("Herzliya");
    expect(row.title).toBe("Sunset Sail");
  });

  it("infos pratiques, billets, créneaux et dates existent en es / ru / de", () => {
    for (const lang of ["es", "ru", "de"] as const) {
      expect(practicalInfoLabels(lang).title.length).toBeGreaterThan(3);
      expect(TICKET_TEXTS[lang].openTickets.length).toBeGreaterThan(3);
      expect(formatTimeSlot("morning", lang)).not.toBe("Morning");
      const info = buildPracticalInfo({ meeting_point: "Marina gate", meeting_point_fr: "Porte" }, lang);
      expect(info?.meetingPoint).toBe("Marina gate");
      expect(info?.lang).toBe(lang);
    }
    expect(formatBookingDate("2026-12-03", "de")).toContain("Dezember");
    expect(formatBookingDate("2026-12-03", "ru")).toContain("декабря");
  });
});
