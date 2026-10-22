import { describe, expect, it } from "vitest";
import { clientLinkPath, computeItineraryKpis, groupItineraries, itineraryStatusLabel } from "./itineraries";
import type { ItineraryDossier } from "./types";

function dossier(overrides: Partial<ItineraryDossier>): ItineraryDossier {
  return {
    id: "1",
    ref: "TM-1",
    name: "DOSSIER",
    client: null,
    createdAt: "2026-10-01T10:00:00Z",
    arrival: null,
    departure: null,
    travelers: 2,
    objective: "vente",
    statut: "en_preparation",
    archived: false,
    group: "en_cours",
    opens: 0,
    lastOpenedAt: null,
    sentAt: null,
    paidAt: null,
    amount: null,
    collected: null,
    proposedPrice: null,
    currency: "ILS",
    token: "abc",
    customPage: null,
    lostReason: null,
    lostNote: null,
    ...overrides,
  };
}

describe("onglet Itinéraire", () => {
  it("le lien client mène à la page faite sur mesure quand il y en a une", () => {
    expect(clientLinkPath(dossier({}))).toBe("/voyage/abc");
    expect(clientLinkPath(dossier({ customPage: "/happy-birthday-mom" }))).toBe("/happy-birthday-mom");
  });

  it("un dossier non converti affiche son motif, ou qu'il reste à préciser", () => {
    expect(itineraryStatusLabel(dossier({ group: "non_converti", statut: "perdu" }))).toBe("Non converti · motif à préciser");
    expect(itineraryStatusLabel(dossier({ group: "non_converti", lostReason: "prix", lostNote: "trop cher" }))).toBe(
      "Non converti · Prix, trop cher",
    );
    expect(itineraryStatusLabel(dossier({ statut: "envoye" }))).toBe("Envoyé");
  });

  it("range chaque dossier dans son groupe", () => {
    const groups = groupItineraries([dossier({ group: "converti" }), dossier({ group: "modele" }), dossier({})]);
    expect(groups.converti).toHaveLength(1);
    expect(groups.modele).toHaveLength(1);
    expect(groups.en_cours).toHaveLength(1);
  });

  it("chiffres clés : sans les modèles, conversion sur la vente seulement", () => {
    const kpis = computeItineraryKpis([
      dossier({ group: "converti", paidAt: "2026-08-24T09:00:00Z", amount: 150, currency: "USD", customPage: "/happy-birthday-mom" }),
      dossier({ statut: "envoye", sentAt: "2026-10-02T09:00:00Z" }),
      dossier({ group: "non_converti", statut: "perdu", customPage: "/NP" }),
      dossier({ group: "collab", objective: "collab", statut: "envoye" }),
      dossier({ group: "modele", statut: "retours" }),
      dossier({ statut: "brief" }),
    ]);
    expect(kpis).toEqual({ created: 5, sent: 3, converted: 1, conversionRate: 33, revenue: { USD: 150 } });
  });

  it("pas de taux de conversion tant que rien n'est envoyé", () => {
    expect(computeItineraryKpis([dossier({})]).conversionRate).toBeNull();
  });
});
