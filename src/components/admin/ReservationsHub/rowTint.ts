// Fond d'une ligne selon son état (voir `rowState` dans src/lib/reservations/entryLook.ts) :
// ambre à régler, bleu demande, violet annulé (texte gris), jaune avoir, blanc soldé. Fonds
// opaques : une cellule figée garde la couleur de sa ligne au défilement. Toujours pas de vert.

import type { Tone } from "@/lib/reservations/entryLook";

export const ROW_TINT: Record<Tone, string> = {
  neutral: "bg-card",
  dark: "bg-card",
  amber: "bg-amber-50",
  blue: "bg-sky-50",
  violet: "bg-[#F3EEFA] text-muted-foreground",
  yellow: "bg-yellow-50",
};
