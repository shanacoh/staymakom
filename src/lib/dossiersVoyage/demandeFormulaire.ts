// Réponses du formulaire « Tailor-made request » stockées sur un dossier de voyage
// (dossiers_voyage.demande_formulaire) : lecture, libellés français pour le back-office, et
// pré-remplissage du dossier au moment où Shana le crée depuis la demande.

import { BUDGETS, CONSTRAINTS, MOODS, REGIONS, STAY_TYPES } from "@/lib/tailorMade/form";
import type { DossierVoyage, DossierVoyageUpdate, PointDepart } from "./types";

type Answers = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
const list = (v: unknown): string[] => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);
const frLabel = (options: { value: string; label: { fr: string } }[], value: string): string =>
  options.find((o) => o.value === value)?.label.fr ?? value;

export function parseDemandeFormulaire(value: unknown): Answers | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Answers) : null;
}

export const budgetFourchetteLabel = (code: string | null | undefined): string => (code ? frLabel(BUDGETS, code) : "");

const formatDate = (iso: string) => iso.split("-").reverse().join("/");

function datesLabel(a: Answers): string {
  if (a.dates_mode === "flexibles") {
    const nights = Number(a.nb_nuits) || 0;
    const [year, month] = str(a.mois).split("-");
    return `Flexibles : ${month}/${year}, ${nights} nuit${nights > 1 ? "s" : ""}`;
  }
  if (a.date_debut && a.date_fin) return `Du ${formatDate(str(a.date_debut))} au ${formatDate(str(a.date_fin))}`;
  return str(a.periode);
}

function travellersLabel(a: Answers): string {
  const adults = Number(a.adultes) || 0;
  if (!adults) return str(a.nb_personnes);
  const children = Number(a.enfants) || 0;
  const base = `${adults} adulte${adults > 1 ? "s" : ""}`;
  if (!children) return base;
  return `${base}, ${children} enfant${children > 1 ? "s" : ""} (${list(a.ages_enfants).join(", ")} ans)`;
}

function sourceLabel(a: Answers): string {
  const source = (a.source && typeof a.source === "object" ? a.source : {}) as Answers;
  const campaign = [source.utm_source, source.utm_medium, source.utm_campaign].map(str).filter(Boolean).join(" / ");
  const referrer = str(source.referrer);
  const landing = str(source.landing_page);
  return [campaign || referrer || (landing ? "Accès direct" : ""), landing ? `arrivée sur ${landing}` : ""].filter(Boolean).join(" · ");
}

export interface AnswerLine {
  label: string;
  value: string;
}

/**
 * Toutes les réponses du client, prêtes à afficher. Gère aussi les demandes reprises de l'ancien
 * formulaire (moins de champs, envies notées avec les catégories du site).
 */
export function answerLines(dossier: DossierVoyage): AnswerLine[] {
  const a = parseDemandeFormulaire(dossier.demande_formulaire);
  if (!a) return [];
  const type = str(a.type_sejour_autre) || (a.type_sejour ? frLabel(STAY_TYPES, str(a.type_sejour)) : str(a.occasion));
  const regions = a.surprenez_moi ? "Surprenez-moi" : list(a.regions).map((r) => frLabel(REGIONS, r)).join(", ") || str(a.region);
  const constraints = [...list(a.contraintes).map((c) => frLabel(CONSTRAINTS, c)), str(a.contrainte_autre)].filter(Boolean).join(", ");
  const firstTrip = typeof a.premier_voyage === "boolean" ? (a.premier_voyage ? "Oui" : "Non") : "";
  const lines: AnswerLine[] = [
    { label: "Type de séjour", value: type },
    { label: "Dates", value: datesLabel(a) },
    { label: "Voyageurs", value: travellersLabel(a) },
    { label: "Budget hors vols", value: budgetFourchetteLabel(dossier.budget_fourchette) || str(a.budget_indicatif) },
    { label: "Envies", value: list(a.moods).map((m) => (m === "autre" && str(a.mood_autre)) || frLabel(MOODS, m)).join(", ") },
    { label: "Régions", value: regions },
    { label: "Contraintes", value: constraints },
    { label: "Premier voyage en Israël", value: firstTrip },
    { label: "Message", value: str(a.message) },
    { label: "Source de la visite", value: sourceLabel(a) },
    { label: "Notes de suivi (ancien tableau)", value: str(a.notes_internes) },
  ];
  return lines.filter((line) => line.value !== "");
}

/**
 * Ce qui change sur le dossier quand Shana clique « Créer le dossier » : il passe à l'étape
 * Brief, déjà rempli avec les réponses (dates, voyageurs et régions le sont depuis la réception).
 */
export function dossierPrefillFromDemande(
  dossier: DossierVoyage,
  pointDepart: PointDepart,
): DossierVoyageUpdate {
  const lines = answerLines(dossier);
  const value = (label: string) => lines.find((line) => line.label === label)?.value ?? "";
  const envies = [value("Type de séjour"), value("Envies"), value("Message")].filter(Boolean).join(" · ");
  const previous = (dossier.brief_data && typeof dossier.brief_data === "object" ? dossier.brief_data : {}) as Record<string, unknown>;
  return {
    statut: "brief",
    point_depart: pointDepart,
    // Le résumé sert aussi de texte de départ à « Analyser avec l'IA ».
    contenu_brut_recu: dossier.contenu_brut_recu ?? lines.map((line) => `${line.label} : ${line.value}`).join("\n"),
    brief_data: { ...previous, contraintes: value("Contraintes") || null, envies: envies || null } as DossierVoyageUpdate["brief_data"],
  };
}
