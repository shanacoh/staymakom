import { describe, it, expect } from "vitest";
import { CANCELLATION_TEMPLATES } from "@/constants/cancellationTemplates";
import { summarizeCancellation, formatMinNights, formatBoard, buildStandaloneKeyFacts } from "./heroKeyFacts";

const template = (id: string) => CANCELLATION_TEMPLATES.find((t) => t.id === id)!;

describe("summarizeCancellation", () => {
  it("résume les modèles du back-office", () => {
    const t48 = template("free_48h");
    expect(summarizeCancellation({ cancellation_policy: t48.en, cancellation_policy_fr: t48.fr, cancellation_policy_he: t48.he }, "fr")).toBe("48 h");
    const t7 = template("free_7d");
    expect(summarizeCancellation({ cancellation_policy: t7.en }, "fr")).toBe("7 j");
    expect(summarizeCancellation({ cancellation_policy: t7.en }, "en")).toBe("7 days");
    expect(summarizeCancellation({ cancellation_policy_fr: template("non_refundable").fr }, "fr")).toBe("Non remboursable");
  });

  it("lit le premier délai d'un texte libre", () => {
    expect(summarizeCancellation({ cancellation_policy: "Free cancellation up to 72 hours before." }, "fr")).toBe("72 h");
    expect(summarizeCancellation({ cancellation_policy_fr: "Annulation gratuite jusqu'à 14 jours avant l'arrivée." }, "fr")).toBe("14 j");
    expect(summarizeCancellation({ cancellation_policy: "This stay is non-refundable." }, "en")).toBe("Non-refundable");
  });

  it("ne devine pas quand rien n'est reconnaissable", () => {
    expect(summarizeCancellation({}, "fr")).toBeNull();
    expect(summarizeCancellation({ cancellation_policy: "Contact us for conditions." }, "fr")).toBeNull();
  });
});

describe("cases de la bande", () => {
  it("met en forme séjour et pension", () => {
    expect(formatMinNights(2, "fr")).toBe("2 nuits");
    expect(formatMinNights(1, "fr")).toBe("1 nuit");
    expect(formatMinNights(null, "fr")).toBeNull();
    expect(formatBoard("bb", "fr")).toBe("Petit-déj.");
    expect(formatBoard(null, "fr")).toBeNull();
  });

  it("n'ajoute pas de case de gauche vide", () => {
    const facts = buildStandaloneKeyFacts({ highlight: null, cancellation_policy: template("free_48h").en }, "fr");
    // Les cases sans valeur sont masquées par HeroKeyFacts.
    expect(facts.filter((f) => f.value).map((f) => f.key)).toEqual(["cancellation"]);
  });

  it("affiche l'âge minimum et « groupes privés uniquement » quand ils sont renseignés", () => {
    const facts = buildStandaloneKeyFacts({ highlight: null, minAge: 12, privateGroupsOnly: true }, "he");
    expect(facts.find((f) => f.key === "min_age")?.value).toBe("12+");
    expect(facts.find((f) => f.key === "private_only")?.value).toBe("פרטיות בלבד");
    const none = buildStandaloneKeyFacts({ highlight: null, minAge: null, privateGroupsOnly: false }, "de");
    expect(none.filter((f) => f.value)).toEqual([]);
  });

  it("résume l'annulation 24 h choisie par le partenaire", () => {
    expect(summarizeCancellation({ cancellation_policy: template("free_24h").en }, "en")).toContain("24");
  });
});
