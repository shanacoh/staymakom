// Catégories des articles du Journal (liste fixe choisie dans l'éditeur du back-office).
// La base garde le nom anglais (« Stories »...), qui sert aussi à trouver les articles liés ;
// seul l'affichage est traduit, avec les textes d'interface (clés journalCategory__…).
import { tPage, type UiKey } from "@/lib/translations";

const KEYS: Record<string, UiKey> = {
  Stories: "journalCategory__stories",
  Places: "journalCategory__places",
  Guides: "journalCategory__guides",
  "Food & Wine": "journalCategory__foodWine",
  "Slow Travel": "journalCategory__slowTravel",
  "Behind the Scenes": "journalCategory__behindTheScenes",
  People: "journalCategory__people",
};

/** Catégorie à afficher dans la langue de la page (une catégorie inconnue reste telle quelle). */
export function journalCategoryLabel(category: string | null | undefined): string {
  if (!category) return "";
  const key = KEYS[category.trim()];
  return key ? (tPage(key) as string) : category;
}
