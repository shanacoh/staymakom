// Sprint 5B — modèles de politique d'annulation pour les expériences standalone.
// Textes à valider par Shana avant mise en production.

export type CancellationTemplateId = "free_48h" | "free_7d" | "non_refundable" | "custom";

export interface CancellationTemplate {
  id: CancellationTemplateId;
  label: string;
  en: string;
  fr: string;
  he: string;
}

export const CANCELLATION_TEMPLATES: CancellationTemplate[] = [
  {
    id: "free_48h",
    label: "Gratuite jusqu'à 48 h avant",
    en: "Free cancellation up to 48 hours before the experience.",
    fr: "Annulation gratuite jusqu'à 48 h avant l'expérience.",
    he: "ביטול חינם עד 48 שעות לפני החוויה.",
  },
  {
    id: "free_7d",
    label: "Gratuite jusqu'à 7 jours avant",
    en: "Free cancellation up to 7 days before the experience.",
    fr: "Annulation gratuite jusqu'à 7 jours avant l'expérience.",
    he: "ביטול חינם עד 7 ימים לפני החוויה.",
  },
  {
    id: "non_refundable",
    label: "Non remboursable",
    en: "This experience is non-refundable: no cancellation or change is possible after booking.",
    fr: "Cette expérience n'est pas remboursable : aucune annulation ni modification n'est possible après la réservation.",
    he: "חוויה זו אינה ניתנת לביטול: לא ניתן לבטל או לשנות את ההזמנה לאחר התשלום.",
  },
];

// Trouve le modèle qui correspond exactement au texte EN/FR/HE enregistré,
// ou "custom" si rien ne correspond (texte libre déjà écrit, ou vide).
export function matchCancellationTemplate(
  en: string | null | undefined,
  fr: string | null | undefined,
  he: string | null | undefined
): CancellationTemplateId {
  const match = CANCELLATION_TEMPLATES.find(
    (t) => t.en === (en || "") && t.fr === (fr || "") && t.he === (he || "")
  );
  return match?.id ?? "custom";
}
