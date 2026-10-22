// Archives des demandes, sans accès à la base ni à l'écran : libellés des motifs et du statut de
// sortie, et fichier d'export pour relancer ces contacts plus tard (reprise de saison bateaux).

import { format, parseISO } from "date-fns";
import type { ArchivedRequest, LostReason } from "./types";

export const LOST_REASON_OPTIONS: { value: LostReason; label: string }[] = [
  { value: "prix", label: "Prix" },
  { value: "pas_de_dispo", label: "Pas de dispo" },
  { value: "client_ne_repond_plus", label: "Client ne répond plus" },
  { value: "a_reserve_ailleurs", label: "A réservé ailleurs" },
  { value: "date_passee", label: "Date passée" },
  { value: "autre", label: "Autre" },
];

const LOST_REASON_LABELS = Object.fromEntries(LOST_REASON_OPTIONS.map((o) => [o.value, o.label])) as Record<LostReason, string>;

export const exitStatusLabel = (request: ArchivedRequest) => (request.exitStatus === "converted" ? "Convertie" : "Archivée");

/** Motif lisible, avec la note libre quand il y en a une. */
export function lostReasonLabel(request: ArchivedRequest): string {
  const reason = request.lostReason ? LOST_REASON_LABELS[request.lostReason] : "";
  return [reason, request.lostNote].filter(Boolean).join(" · ");
}

const day = (value: string | null) => (value ? format(parseISO(value), "dd/MM/yyyy") : "");

// Point-virgule et marque UTF-8 en tête : le fichier s'ouvre tel quel dans Excel en français,
// accents compris.
function csvCell(value: string): string {
  return /[";\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

const CSV_HEADERS = [
  "Reçue le",
  "Client",
  "Téléphone",
  "Email",
  "Produit",
  "Type",
  "Date demandée",
  "Pers.",
  "Statut de sortie",
  "Motif",
];

export function archivesToCsv(requests: ArchivedRequest[]): string {
  const lines = requests.map((r) =>
    [
      day(r.receivedAt),
      r.client,
      r.phone ?? "",
      r.email ?? "",
      r.product,
      r.type === "boat" ? "Bateau" : "Expérience",
      day(r.requestedDate),
      r.pax,
      exitStatusLabel(r),
      lostReasonLabel(r),
    ]
      .map(csvCell)
      .join(";"),
  );
  return "﻿" + [CSV_HEADERS.join(";"), ...lines].join("\r\n");
}
