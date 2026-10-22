// Règles de l'onglet Itinéraire, sans accès à la base ni à l'écran : groupes, libellés,
// chiffres clés et lien client de chaque dossier de voyage.

import type { DossierLostReason, ItineraryDossier, ItineraryGroup, ItineraryKpis, MoneyByCurrency } from "./types";

export const ITINERARY_GROUPS: { key: ItineraryGroup; label: string; hint?: string }[] = [
  { key: "converti", label: "Convertis", hint: "payés" },
  { key: "en_cours", label: "En cours" },
  { key: "collab", label: "Collab", hint: "influenceurs, une autre finalité que la vente" },
  { key: "modele", label: "Modèles" },
  { key: "non_converti", label: "Non convertis", hint: "archivés ou terminés sans paiement" },
];

export const DOSSIER_LOST_REASON_OPTIONS: { value: DossierLostReason; label: string }[] = [
  { value: "prix", label: "Prix" },
  { value: "client_ne_repond_plus", label: "Client ne répond plus" },
  { value: "a_reserve_ailleurs", label: "A réservé ailleurs" },
  { value: "v0_test", label: "V0 test" },
  { value: "autre", label: "Autre" },
];

const LOST_REASON_LABELS = Object.fromEntries(DOSSIER_LOST_REASON_OPTIONS.map((o) => [o.value, o.label])) as Record<
  DossierLostReason,
  string
>;

const STATUT_LABELS: Record<string, string> = {
  demande_sur_mesure: "Demande sur-mesure",
  nouvelle_demande: "Nouvelle demande",
  brief: "Brief",
  en_preparation: "En préparation",
  envoye: "Envoyé",
  retours: "Retours reçus",
  paye: "Payé",
  collab_confirme: "Collab confirmée",
  confirme: "Confirmé",
  en_voyage: "En voyage",
  termine: "Terminé",
  perdu: "Non converti",
};

/** Statut affiché : un dossier non converti le dit, avec son motif quand il est connu. */
export function itineraryStatusLabel(dossier: ItineraryDossier): string {
  if (dossier.group === "non_converti") {
    const reason = dossier.lostReason ? LOST_REASON_LABELS[dossier.lostReason] : "motif à préciser";
    return `Non converti · ${[reason, dossier.lostNote].filter(Boolean).join(", ")}`;
  }
  return STATUT_LABELS[dossier.statut] ?? dossier.statut;
}

/** Chemin de la page que voit le client : la page faite sur mesure, sinon le lien du dossier. */
export const clientLinkPath = (dossier: ItineraryDossier) => dossier.customPage ?? `/voyage/${dossier.token}`;

// Un dossier compte comme envoyé dès qu'un client a pu le voir. Une page faite sur mesure n'existe
// que pour être envoyée.
const SENT_STATUTS = new Set(["envoye", "retours", "paye", "collab_confirme", "confirme", "en_voyage", "termine"]);
const wasSent = (d: ItineraryDossier) => d.paidAt !== null || d.sentAt !== null || d.customPage !== null || SENT_STATUTS.has(d.statut);

export function groupItineraries(dossiers: ItineraryDossier[]): Record<ItineraryGroup, ItineraryDossier[]> {
  const groups: Record<ItineraryGroup, ItineraryDossier[]> = { converti: [], en_cours: [], collab: [], modele: [], non_converti: [] };
  for (const dossier of dossiers) groups[dossier.group].push(dossier);
  return groups;
}

/**
 * Chiffres clés de l'onglet. Les modèles ne comptent pas, et le taux de conversion ne regarde
 * que la vente : une collab n'a pas vocation à être payée.
 */
export function computeItineraryKpis(dossiers: ItineraryDossier[]): ItineraryKpis {
  const real = dossiers.filter((d) => d.group !== "modele");
  const sales = real.filter((d) => d.objective === "vente");
  const sent = sales.filter(wasSent).length;
  const converted = real.filter((d) => d.group === "converti");
  const revenue: MoneyByCurrency = {};
  for (const d of converted) {
    if (d.amount !== null) revenue[d.currency] = (revenue[d.currency] ?? 0) + d.amount;
  }
  return {
    created: real.length,
    sent,
    converted: converted.length,
    conversionRate: sent > 0 ? Math.round((converted.length / sent) * 100) : null,
    revenue,
  };
}
