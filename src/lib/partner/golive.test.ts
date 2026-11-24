import { describe, expect, it } from "vitest";
import { GOLIVE_TEXTS } from "./i18n-golive";
import {
  actionFor,
  buildLinkMessage,
  buildReminderMessage,
  closedDaysOf,
  formatFieldValue,
  heroPhaseOf,
  normalizeGoLive,
  preparedCounts,
  stepPosition,
  openDaysOf,
  sectionState,
  turnIsStale,
} from "./golive";
import type { GoLive, ListingField } from "./types";

const t = GOLIVE_TEXTS.fr;

function golive(partial: Partial<GoLive>): GoLive {
  return {
    kind: "experience",
    target: { kind: "experience", id: "e1", slug: "s", status: "draft", title: "T", title_he: null, title_fr: null },
    steps: [
      { key: "prepared", actor: "staymakom", done: true },
      { key: "reviewed", actor: "partner", done: false },
      { key: "terms", actor: "partner", done: false },
    ],
    current_step: "reviewed",
    my_turn: true,
    target_date: null,
    turn_since: null,
    counts: { total: 10, prepared_by_team: 8, for_you: 4 },
    commission: null,
    commission_ready: false,
    ...partial,
  };
}

const field = (state: ListingField["state"]): ListingField => ({
  section: "story", key: "title", required: true, value: "x", source: "staymakom", state, confirmed_at: null,
});

describe("sectionState", () => {
  it("à confirmer tant qu'un champ l'est", () => {
    expect(sectionState([field("confirmed"), field("to_confirm")])).toBe("to_confirm");
  });
  it("à remplir quand il ne reste que des champs vides", () => {
    expect(sectionState([field("confirmed"), field("to_fill")])).toBe("to_fill");
  });
  it("confirmée quand tout l'est", () => {
    expect(sectionState([field("confirmed")])).toBe("confirmed");
  });
});

describe("actionFor", () => {
  it("relire l'annonce mène à l'aperçu, avec le lien comme avec le compte", () => {
    expect(actionFor(golive({}), "link", "/partner/link/abc", t)?.to).toBe("/partner/link/abc/listing/experience/e1");
    expect(actionFor(golive({}), "account", "/partner", t)?.to).toBe("/partner/listing/experience/e1");
  });
  it("signer demande la connexion quand on vient du lien", () => {
    const g = golive({ current_step: "terms" });
    expect(actionFor(g, "link", "/partner/link/abc", t)).toEqual({ label: t.actions.loginToSign, to: "/partner/login" });
    expect(actionFor(g, "account", "/partner", t)?.to).toBe("/partner/sign");
  });
  it("aucun bouton quand c'est à l'équipe d'agir", () => {
    expect(actionFor(golive({ my_turn: false }), "link", "/x", t)).toBeNull();
  });
});

describe("turnIsStale", () => {
  const now = new Date("2026-11-23T12:00:00Z");
  it("signal après 3 jours sans bouger", () => {
    expect(turnIsStale({ my_turn: true, turn_since: "2026-11-20T11:00:00Z" }, now)).toBe(true);
    expect(turnIsStale({ my_turn: true, turn_since: "2026-11-21T12:00:00Z" }, now)).toBe(false);
  });
  it("jamais quand c'est à l'équipe", () => {
    expect(turnIsStale({ my_turn: false, turn_since: "2026-10-01T00:00:00Z" }, now)).toBe(false);
  });
});

describe("jours fermés", () => {
  it("se déduisent des jours ouverts et inversement", () => {
    expect(closedDaysOf([1, 2, 3, 4, 7])).toEqual([5, 6]);
    expect(openDaysOf([5, 6])).toEqual([1, 2, 3, 4, 7]);
  });
});

describe("formatFieldValue", () => {
  const days = t === GOLIVE_TEXTS.fr ? ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"] : [];
  it("affiche les règles en clair", () => {
    expect(formatFieldValue({ key: "group_size", value: { min: 2, max: 8 } }, t, days)).toBe("2 à 8 personnes");
    expect(formatFieldValue({ key: "free_cancellation_hours", value: 24 }, t, days)).toBe("Gratuite jusqu'à 24 h avant");
    expect(formatFieldValue({ key: "available_days", value: [1, 7] }, t, days)).toBe("lun, dim");
    expect(formatFieldValue({ key: "title", value: "" }, t, days)).toBe(t.empty);
  });
});

describe("messages WhatsApp", () => {
  it("dans la langue du prestataire, avec le lien, au nom de l'équipe", () => {
    const he = buildLinkMessage({ language: "he", contactName: "Dana", url: "https://x/partner/link/abc" });
    expect(he).toContain("שלום Dana");
    expect(he).toContain("https://x/partner/link/abc");
    expect(he).toContain("צוות STAYMAKOM");
    expect(buildLinkMessage({ language: null, contactName: null, url: "u" })).toContain("The STAYMAKOM team");
  });
  it("la relance nomme l'étape", () => {
    expect(buildReminderMessage({ language: "en", contactName: "Avi", stepKey: "practical", url: "u" })).toContain('"Practical info"');
    expect(buildReminderMessage({ language: "fr", contactName: null, stepKey: "dates", url: "u" })).toContain("« Premières dates ouvertes »");
  });
});

describe("normalizeGoLive", () => {
  const hotel = (online: boolean, agreement = false) =>
    golive({
      kind: "hotel",
      steps: [
        { key: "agreement", actor: "staymakom", done: agreement },
        { key: "prepared", actor: "staymakom", done: true },
        { key: "online", actor: "staymakom", done: online },
      ],
      current_step: agreement ? "online" : "agreement",
      my_turn: false,
    });

  it("ne coche pas « En ligne » tant qu'une étape précédente n'est pas faite (fiche déjà publiée)", () => {
    const g = normalizeGoLive(hotel(true));
    expect(g.steps.find((s) => s.key === "online")?.done).toBe(false);
    expect(g.current_step).toBe("agreement");
  });

  it("coche « En ligne » quand tout est fait et la fiche publiée", () => {
    const g = normalizeGoLive(hotel(true, true));
    expect(g.steps.every((s) => s.done)).toBe(true);
    expect(g.current_step).toBeNull();
    expect(g.my_turn).toBe(false);
  });
});

describe("stepPosition", () => {
  it("donne l'étape en cours sur le total", () => {
    expect(stepPosition(golive({}))).toEqual({ index: 2, total: 3 });
    expect(stepPosition(golive({ current_step: null }))).toEqual({ index: 3, total: 3 });
  });
});

describe("preparedCounts", () => {
  it("X + Z = Y", () => {
    const c = preparedCounts(golive({ counts: { total: 8, prepared_by_team: 1, for_you: 8 } }));
    expect(c).toEqual({ team: 1, total: 8, forYou: 7 });
  });

  it("masqué tant que l'annonce n'est pas préparée", () => {
    const steps = [{ key: "prepared", actor: "staymakom" as const, done: false }];
    expect(preparedCounts(golive({ steps }))).toBeNull();
  });
});

describe("heroPhaseOf", () => {
  const steps = [
    { key: "agreement", actor: "staymakom" as const, done: false },
    { key: "prepared", actor: "staymakom" as const, done: true },
    { key: "reviewed", actor: "partner" as const, done: true },
    { key: "contract", actor: "staymakom" as const, done: false },
  ];
  it("« on prépare » avant la première étape du partenaire", () => {
    expect(heroPhaseOf({ steps, current_step: "agreement", my_turn: false })).toBe("preparing");
  });
  it("« entre nos mains » après", () => {
    expect(heroPhaseOf({ steps, current_step: "contract", my_turn: false })).toBe("team");
  });
  it("à son tour, puis en ligne", () => {
    expect(heroPhaseOf({ steps, current_step: "reviewed", my_turn: true })).toBe("your_turn");
    expect(heroPhaseOf({ steps, current_step: null, my_turn: false })).toBe("live");
  });
});
