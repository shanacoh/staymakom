// « Réécrire pour ce mood » et versions par mood du brouillon IA (chantier Offre, prompt 3).
//
// L'IA écrit titre, accroche et description d'un mood à partir de ce qui est déjà dans la fiche.
// Ce fichier prépare ce qu'on lui montre (jamais de prix, de marge, de dates, de prestataire, de
// canal ni de contact) et range sa réponse. Il n'enregistre rien.

import { supabase } from "@/integrations/supabase/client";
import {
  PRESENTATION_TEXT_FIELDS,
  emptyPresentation,
  presentationPlainText,
  type MoodPresentation,
  type MoodPresentationMap,
} from "./moodPresentations";

export interface MoodFact {
  label: string;
  value: string;
}

/** Les valeurs de la fiche utiles à l'IA, dans leurs trois langues quand elles en ont. */
export interface MoodFactSource {
  text: Record<string, unknown>;
  minParty?: number | null;
  maxParty?: number | null;
  arriveMinutesBefore?: number | null;
  kids?: { status: "yes" | "no" | null; from_age: number | null };
  kosher?: "yes" | "no" | "not_relevant" | null;
  parking?: "yes" | "no" | null;
  includes: string[];
  extras: string[];
}

const filled = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

/** Un texte multilingue de la fiche : le français d'abord, sinon l'anglais, sinon l'hébreu. */
const localized = (text: Record<string, unknown>, base: string): string => {
  const value = [text[`${base}_fr`], text[base], text[`${base}_he`]].find(filled);
  return value ? presentationPlainText(value) : "";
};

const yesNoLabel = (v: "yes" | "no" | "not_relevant" | null | undefined) => (v === "yes" ? "oui" : v === "no" ? "non" : "");

const uniqueTitles = (titles: string[]) => Array.from(new Set(titles.map((t) => t.trim()).filter(Boolean)));

/** Les faits communs à tous les moods : ce que l'IA a le droit de reprendre, et rien d'autre. */
export function buildMoodFacts(source: MoodFactSource): MoodFact[] {
  const { text } = source;
  const party =
    source.minParty && source.maxParty ? `${source.minParty} à ${source.maxParty} personnes` : "";
  const kids =
    source.kids?.status === "yes"
      ? source.kids.from_age != null
        ? `oui, dès ${source.kids.from_age} ans`
        : "oui"
      : yesNoLabel(source.kids?.status);
  const facts: MoodFact[] = [
    { label: "Durée", value: localized(text, "duration") },
    { label: "Taille du groupe", value: party },
    { label: "Ville", value: localized(text, "city") },
    { label: "Adresse", value: localized(text, "address") },
    { label: "Accès", value: localized(text, "access_note") },
    { label: "Enfants", value: kids },
    { label: "Casher", value: yesNoLabel(source.kosher) },
    { label: "Parking", value: yesNoLabel(source.parking) },
    { label: "Accessibilité", value: localized(text, "accessibility_info") },
    { label: "Ce qui est inclus", value: uniqueTitles(source.includes).join(" ; ") },
    { label: "Options en supplément", value: uniqueTitles(source.extras).join(" ; ") },
    { label: "Point de rendez-vous", value: localized(text, "meeting_point") },
    { label: "Arriver avant", value: source.arriveMinutesBefore != null && Number.isFinite(source.arriveMinutesBefore) ? `${source.arriveMinutesBefore} minutes` : "" },
    { label: "À savoir", value: localized(text, "know_before_you_go") },
    { label: "Météo ou imprévu", value: localized(text, "contingency_note") },
  ];
  return facts.filter((f) => f.value.length > 0);
}

/** Les titres des autres moods de la fiche, dans les trois langues : l'IA ne doit pas les reprendre. */
export function takenTitles(input: {
  main: MoodPresentation;
  presentations: MoodPresentationMap;
  selectedIds: string[];
  targetIds: string[];
}): string[] {
  const { main, presentations, selectedIds, targetIds } = input;
  const primaryId = selectedIds[0] ?? null;
  const titles: string[] = [];
  for (const id of selectedIds) {
    if (targetIds.includes(id)) continue;
    const presentation = id === primaryId ? main : presentations[id];
    if (presentation) titles.push(presentation.title, presentation.title_fr, presentation.title_he);
  }
  return uniqueTitles(titles);
}

export const hasPresentationText = (presentation: MoodPresentation | undefined): boolean =>
  !!presentation && PRESENTATION_TEXT_FIELDS.some((f) => presentationPlainText(presentation[f] || "").length > 0);

/**
 * La version d'un mood après réécriture : les textes de l'IA remplacent les anciens, la photo déjà
 * choisie est gardée (l'IA n'en propose une que si le mood n'en avait pas).
 */
export function mergeAiPresentation(current: MoodPresentation | undefined, ai: MoodPresentation): MoodPresentation {
  const next = { ...(current ?? emptyPresentation()) };
  for (const field of PRESENTATION_TEXT_FIELDS) if (filled(ai[field])) next[field] = ai[field];
  next.cover_image = current?.cover_image || ai.cover_image || null;
  return next;
}

export interface MoodAiRequest {
  moodIds: string[];
  presentation: MoodPresentation;
  facts: MoodFact[];
  takenTitles: string[];
  /** Photos de la fiche, montrées à l'IA seulement pour les moods sans photo. */
  photoUrls: string[];
  needsCoverIds: string[];
}

export interface MoodAiResult {
  presentations: MoodPresentationMap;
  toVerify: string[];
  warnings: string[];
}

export async function requestMoodPresentations(request: MoodAiRequest): Promise<MoodAiResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Session expirée, reconnecte-toi.");

  const presentation: Record<string, string> = {};
  for (const field of PRESENTATION_TEXT_FIELDS) presentation[field] = request.presentation[field] || "";

  const { data, error } = await supabase.functions.invoke("generate-experience-draft", {
    headers: { Authorization: `Bearer ${token}` },
    body: {
      type: "standalone",
      mode: "mood",
      mood_ids: request.moodIds,
      content: { presentation, facts: request.facts },
      taken_titles: request.takenTitles,
      photo_urls: request.needsCoverIds.length > 0 ? request.photoUrls : [],
      needs_cover_ids: request.needsCoverIds,
    },
  });
  if (error || data?.error) {
    // Le serveur explique son refus (fiche trop vide, mood introuvable) dans le corps de la réponse.
    const details = await (error as { context?: Response } | null)?.context?.json?.().catch(() => null);
    throw new Error(data?.error || details?.error || error?.message || "Erreur inconnue");
  }

  return {
    presentations: (data.presentations || {}) as MoodPresentationMap,
    toVerify: (data.to_verify || []) as string[],
    warnings: (data.warnings || []) as string[],
  };
}
