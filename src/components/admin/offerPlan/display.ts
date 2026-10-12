import { experienceKey, linkedExperienceKey } from "@/lib/offerPlan/compute";
import type { MustHave, MustHaveStatus, OfferExperience } from "@/lib/offerPlan/types";

// Repères d'affichage partagés par la grille, le panneau d'une case et la liste.

// Pas de vert : noir = acquis, gris = en cours, pointillé rouge = à trouver.
export const STATUS_CLASS: Record<MustHaveStatus, string> = {
  a_trouver: "border border-dashed border-red-500 text-red-600",
  en_prospection: "bg-neutral-200 text-neutral-800",
  signe: "border border-black text-black",
  en_ligne: "bg-black text-white",
  abandonne: "text-muted-foreground line-through",
};

export const experienceEditUrl = (e: Pick<OfferExperience, "kind" | "id">) =>
  e.kind === "standalone" ? `/admin/experiences2/standalone/edit/${e.id}` : `/admin/experiences2/edit/${e.id}`;

/** L'expérience qui couvre un must-have, retrouvée dans la liste des expériences. */
export function findLinkedExperience(mustHave: MustHave, experiences: OfferExperience[]): OfferExperience | null {
  const key = linkedExperienceKey(mustHave);
  if (!key) return null;
  return experiences.find((e) => experienceKey(e.kind, e.id) === key) ?? null;
}
