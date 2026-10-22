import { describe, expect, it } from "vitest";
import { archivesToCsv, exitStatusLabel, lostReasonLabel } from "./archives";
import type { ArchivedRequest } from "./types";

const base: ArchivedRequest = {
  id: "1",
  receivedAt: "2026-08-09T10:00:00Z",
  client: "Dana",
  phone: "+972 50 000 0000",
  email: "dana@example.com",
  product: "Catamaran Tel Aviv",
  type: "boat",
  requestedDate: "2026-08-15",
  pax: "4",
  exitStatus: "closed",
  lostReason: "date_passee",
  lostNote: null,
  closedAt: "2026-10-22T10:00:00Z",
  bookingId: null,
};

describe("archives des demandes", () => {
  it("affiche le statut de sortie", () => {
    expect(exitStatusLabel(base)).toBe("Archivée");
    expect(exitStatusLabel({ ...base, exitStatus: "converted", lostReason: null })).toBe("Convertie");
  });

  it("joint la note libre au motif", () => {
    expect(lostReasonLabel(base)).toBe("Date passée");
    expect(lostReasonLabel({ ...base, lostReason: "autre", lostNote: "a changé d'avis" })).toBe("Autre · a changé d'avis");
    expect(lostReasonLabel({ ...base, lostReason: null })).toBe("");
  });

  it("produit un fichier lisible par Excel en français", () => {
    const csv = archivesToCsv([base, { ...base, client: 'Le "grand" Yossi; et co' }]);
    expect(csv.startsWith("﻿Reçue le;Client;")).toBe(true);
    const lines = csv.slice(1).split("\r\n");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toBe(
      "09/08/2026;Dana;+972 50 000 0000;dana@example.com;Catamaran Tel Aviv;Bateau;15/08/2026;4;Archivée;Date passée",
    );
    expect(lines[2]).toContain('"Le ""grand"" Yossi; et co"');
  });
});
