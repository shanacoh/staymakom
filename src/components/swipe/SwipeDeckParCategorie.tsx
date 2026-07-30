import { useMemo, useState } from "react";
import { SwipeDeck } from "./SwipeDeck";
import { SwipeCategoryDivider } from "./SwipeCategoryDivider";
import type { SwipeDeckCard } from "@/lib/swipe/types";
import type { SwipeLang } from "@/lib/swipe/localization";

interface SwipeDeckParCategorieProps {
  lang: SwipeLang;
  cards: SwipeDeckCard[];
  onSwipeCard: (card: SwipeDeckCard, valeur: boolean) => void;
  onUndoCard: (card: SwipeDeckCard) => void;
  onComplete: () => void;
}

const AUTRES: Record<SwipeLang, string> = { fr: "Autres", en: "Other", he: "אחר" };

interface Groupe {
  nom: string;
  ordre: number;
  cartes: SwipeDeckCard[];
}

/**
 * Même contrat de props que SwipeDeck, pour rester interchangeable côté SwipePublic — mais
 * regroupe les cartes par catégorie et affiche une pancarte d'annonce entre chaque groupe. Un
 * SwipeDeck frais est monté par catégorie plutôt que d'apprendre au SwipeDeck existant à gérer un
 * deuxième type d'écran (le mécanisme de swipe/confirmation/annulation reste intact et inchangé).
 * L'ordre des groupes suit l'ordre des catégories choisi dans le back-office (page Catégories) ;
 * les propositions sans catégorie sont regroupées sous "Autres", toujours en dernier.
 */
export const SwipeDeckParCategorie = ({ lang, cards, onSwipeCard, onUndoCard, onComplete }: SwipeDeckParCategorieProps) => {
  const groupes = useMemo<Groupe[]>(() => {
    const parNom = new Map<string, Groupe>();
    for (const carte of cards) {
      const nom = carte.categorie_nom ?? AUTRES[lang];
      if (!parNom.has(nom)) {
        parNom.set(nom, { nom, ordre: carte.categorie_ordre ?? Number.MAX_SAFE_INTEGER, cartes: [] });
      }
      parNom.get(nom)!.cartes.push(carte);
    }
    return Array.from(parNom.values()).sort((a, b) => a.ordre - b.ordre);
  }, [cards, lang]);

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
      key={groupeActuel.nom}
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
