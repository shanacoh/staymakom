import { describe, expect, it } from "vitest";
import { rewriteWriteBody, writeTarget } from "./writeBack";

const englishOf = new Map([
  ["КАТАМАРАН ГЕРЦЛИЯ", "CATAMARAN HERZLIYA"],
  ["Гид", "Guide"],
]);
const url = (path: string) => new URL(`https://x.supabase.co${path}`);

describe("rewriteWriteBody", () => {
  it("demande bateau : nom remis en anglais et langue du client jointe", () => {
    const body = JSON.stringify({ experience_title: "КАТАМАРАН ГЕРЦЛИЯ", message: "Привет" });
    const out = JSON.parse(
      rewriteWriteBody(body, writeTarget(url("/rest/v1/standalone_experience_requests"), "POST"), "ru", englishOf)!,
    );
    expect(out).toEqual({ experience_title: "CATAMARAN HERZLIYA", message: "Привет", client_locale: "ru" });
  });

  it("réservation : noms imbriqués remis en anglais, langue jointe pour les fonctions concernées", () => {
    const body = JSON.stringify({ experienceTitle: "КАТАМАРАН ГЕРЦЛИЯ", extras: [{ title: "Гид" }] });
    const out = JSON.parse(rewriteWriteBody(body, writeTarget(url("/functions/v1/process-booking"), "POST"), "ru", englishOf)!);
    expect(out).toEqual({ experienceTitle: "CATAMARAN HERZLIYA", extras: [{ title: "Guide" }], client_locale: "ru" });
  });

  it("n'ajoute pas la langue aux autres fonctions ni aux autres tables", () => {
    const body = JSON.stringify({ name: "Anna" });
    expect(rewriteWriteBody(body, writeTarget(url("/functions/v1/send-contact-request"), "POST"), "de", englishOf)).toBeNull();
    expect(rewriteWriteBody(body, writeTarget(url("/rest/v1/leads"), "POST"), "de", englishOf)).toBeNull();
  });

  it("laisse passer un corps qui n'est pas du JSON", () => {
    expect(rewriteWriteBody("a=b", writeTarget(url("/functions/v1/process-booking"), "POST"), "es", englishOf)).toBeNull();
  });
});
