// Décide, champ par champ et langue par langue, ce que la traduction automatique doit faire.
// Aucune lecture ni écriture ici : uniquement la règle, pour pouvoir la tester simplement.

import type { FieldKind } from "./catalog.ts";

export type TranslationMode = "changed" | "all";

export interface ExistingTranslation {
  source_hash: string;
  status: "auto" | "reviewed";
  stale: boolean;
}

export type FieldAction =
  | "translate"     // pas encore traduit, ou anglais modifié sur une traduction auto
  | "mark_stale"    // anglais modifié sur une traduction vérifiée : on signale, on ne touche pas
  | "skip";         // rien à faire

/**
 * Met le texte anglais sous une forme stable (pour l'empreinte et l'envoi à l'IA).
 * Un champ vide renvoie null : rien à traduire.
 * Une liste ne garde que les textes non vides ; si un élément n'est pas un texte, on renonce.
 * Un article en blocs est gardé tel quel (son JSON complet sert d'empreinte).
 */
export function normalizeSource(value: unknown, kind: FieldKind): string | null {
  if (kind === "list") {
    if (!Array.isArray(value)) return null;
    if (!value.every((item) => typeof item === "string")) return null;
    const items = (value as string[]).map((item) => item.trim()).filter((item) => item.length > 0);
    return items.length > 0 ? JSON.stringify(items) : null;
  }
  if (typeof value !== "string") return null;
  return value.trim().length > 0 ? value : null;
}

/** Empreinte du texte anglais (SHA-256 en hexadécimal). */
export async function hashSource(source: string): Promise<string> {
  const bytes = new TextEncoder().encode(source);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function decideFieldAction(
  sourceHash: string,
  existing: ExistingTranslation | undefined,
  mode: TranslationMode,
): FieldAction {
  if (!existing) return "translate";
  const sourceChanged = existing.source_hash !== sourceHash;
  if (existing.status === "reviewed") {
    // Une traduction vérifiée n'est jamais écrasée, quel que soit le mode.
    return sourceChanged && !existing.stale ? "mark_stale" : "skip";
  }
  if (mode === "all") return "translate";
  return sourceChanged ? "translate" : "skip";
}

/** Vrai si le texte contient un tiret long (interdit par la marque) : à signaler, jamais corrigé automatiquement. */
export function hasLongDash(text: string): boolean {
  return text.includes("—");
}
