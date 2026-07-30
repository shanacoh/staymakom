import { useMemo, useState } from "react";
import { SwipeDeck } from "./SwipeDeck";
import { SwipeCategoryDivider } from "./SwipeCategoryDivider";
import type { SwipeDeckCard } from "@/lib/swipe/types";
import type { SwipeLang } from "@/lib/swipe/localization";

interface SwipeDeckParCategorieProps {
  lang: SwipeLang;
  cards: SwipeDeckCard[];
  ordreCategories?: string[] | null;
  onSwipeCard: (card: SwipeDeckCard, valeur: boolean) => void;
  onUndoCard: (card: SwipeDeckCard) => void;
  onComplete: () => void;
}

const AUTRES: Record<SwipeLang, string> = { fr: "Autres", en: "Other", he: "אחר" };

interface Groupe {
  id: string | null;
  nom: string;
  ordreGlobal: number;
  cartes: SwipeDeckCard[];
}

/**
 * Même contrat de props que SwipeDeck, pour rester interchangeable côté SwipePublic — mais
 * regroupe les cartes par catégorie et affiche une pancarte d'annonce entre chaque groupe. Un
 * SwipeDeck frais est monté par catégorie plutôt que d'apprendre au SwipeDeck existant à gérer un
 * deuxième type d'écran (le mécanisme de swipe/confirmation/annulation reste intact et inchangé).
 *
 * L'ordre des groupes suit, dans l'ordre de priorité : l'ordre personnalisé du dossier
 * (`ordreCategories`, réglé sur la fiche du dossier) si la catégorie y figure, sinon l'ordre
 * global choisi dans le back-office (page Catégories) ; les propositions sans catégorie sont
 * toujours regroupées sous "Autres", en tout dernier.
 */
export const SwipeDeckParCategorie = ({
  lang,
  cards,
  ordreCategories,
  onSwipeCard,
  onUndoCard,
  onComplete,
}: SwipeDeckParCategorieProps) => {
  const groupes = useMemo<Groupe[]>(() => {
    const parId = new Map<string, Groupe>();
    for (const carte of cards) {
      const cle = carte.categorie_id ?? "__autres__";
      if (!parId.has(cle)) {
        parId.set(cle, {
          id: carte.categorie_id,
          nom: carte.categorie_nom ?? AUTRES[lang],
          ordreGlobal: carte.categorie_ordre ?? Number.MAX_SAFE_INTEGER,
          cartes: [],
        });
      }
      parId.get(cle)!.cartes.push(carte);
    }
    return Array.from(parId.values()).sort((a, b) => {
      const rang = (g: Groupe) => {
        if (g.id === null) return Number.MAX_SAFE_INTEGER; // "Autres" toujours en dernier
        const posPersonnalisee = ordreCategories?.indexOf(g.id) ?? -1;
        if (posPersonnalisee !== -1) return posPersonnalisee;
        // Pas dans l'ordre personnalisé (catégorie ajoutée après coup) : après celles qui y sont,
        // mais toujours avant "Autres".
        return (ordreCategories?.length ?? 0) + 1000 + g.ordreGlobal;
      };
      return rang(a) - rang(b);
    });
  }, [cards, lang, ordreCategories]);

  const [groupeIndex, setGroupeIndex] = useState(0);
  const [phase, setPhase] = useState<"pancarte" | "deck">("pancarte");

  const groupeActuel = groupes[groupeIndex];
  if (!groupeActuel) return null;

  if (phase === "pancarte") {
    return (
      <SwipeCategoryDivider
        lang={lang}
        nomCategorie={groupeActuel.nom}
        nbPropositions={groupeActuel.cartes.length}
        onContinuer={() => setPhase("deck")}
      />
    );
  }

  return (
    <SwipeDeck
      key={groupeActuel.id ?? groupeActuel.nom}
      lang={lang}
      cards={groupeActuel.cartes}
      onSwipeCard={onSwipeCard}
      onUndoCard={onUndoCard}
      onComplete={() => {
        const prochainIndex = groupeIndex + 1;
        if (prochainIndex >= groupes.length) {
          onComplete();
        } else {
          setGroupeIndex(prochainIndex);
          setPhase("pancarte");
        }
      }}
    />
  );
};
