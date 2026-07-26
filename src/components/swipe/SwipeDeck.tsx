import { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Heart, X, Undo2 } from "lucide-react";
import { SwipeCard } from "./SwipeCard";
import { SwipeProgressBar } from "./SwipeProgressBar";
import type { SwipeDeckCard } from "@/lib/swipe/types";

interface SwipeDeckProps {
  cards: SwipeDeckCard[];
  onSwipeCard: (card: SwipeDeckCard, valeur: boolean) => void;
  onUndoCard: (card: SwipeDeckCard) => void;
  onComplete: () => void;
}

const SEUIL_SWIPE = 120;

const DraggableTopCard = ({
  card,
  onDecide,
}: {
  card: SwipeDeckCard;
  onDecide: (valeur: boolean) => void;
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-18, 18]);
  const likeOpacity = useTransform(x, [20, 120], [0, 1]);
  const passOpacity = useTransform(x, [-120, -20], [1, 0]);

  return (
    <motion.div
      className="absolute inset-0"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={(_e, info) => {
        if (info.offset.x > SEUIL_SWIPE) onDecide(true);
        else if (info.offset.x < -SEUIL_SWIPE) onDecide(false);
      }}
      initial={{ scale: 1, opacity: 1 }}
      exit={{ x: x.get() > 0 ? 400 : x.get() < 0 ? -400 : 0, opacity: 0, transition: { duration: 0.25 } }}
    >
      <SwipeCard card={card} />
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute top-8 left-8 border-4 border-emerald-400 text-emerald-400 text-2xl font-black uppercase px-4 py-1 rounded-lg -rotate-12"
      >
        J'aime
      </motion.div>
      <motion.div
        style={{ opacity: passOpacity }}
        className="absolute top-8 right-8 border-4 border-[#AD1414] text-[#AD1414] text-2xl font-black uppercase px-4 py-1 rounded-lg rotate-12"
      >
        Passer
      </motion.div>
    </motion.div>
  );
};

export const SwipeDeck = ({ cards, onSwipeCard, onUndoCard, onComplete }: SwipeDeckProps) => {
  const [index, setIndex] = useState(0);
  const [historique, setHistorique] = useState<SwipeDeckCard[]>([]);

  const decider = (card: SwipeDeckCard, valeur: boolean) => {
    onSwipeCard(card, valeur);
    setHistorique((h) => [...h, card]);
    const prochainIndex = index + 1;
    if (prochainIndex >= cards.length) {
      // Laisse l'animation de sortie se jouer avant de passer au récap
      setTimeout(onComplete, 250);
    }
    setIndex(prochainIndex);
  };

  const annulerDernier = () => {
    const dernier = historique[historique.length - 1];
    if (!dernier) return;
    onUndoCard(dernier);
    setHistorique((h) => h.slice(0, -1));
    setIndex((i) => Math.max(0, i - 1));
  };

  const cartesVisibles = cards.slice(index, index + 3);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="w-full max-w-sm px-4">
        <SwipeProgressBar current={index} total={cards.length} />
      </div>

      <div className="relative w-full max-w-sm h-[65vh] px-4">
        {cartesVisibles.length === 0 && (
          <div className="absolute inset-4 rounded-2xl border-2 border-dashed border-[#1a1a1a]/20 flex items-center justify-center text-[#1a1a1a]/50">
            Deck terminé
          </div>
        )}
        <AnimatePresence>
          {cartesVisibles
            .map((card, i) => ({ card, i }))
            .reverse()
            .map(({ card, i }) =>
              i === 0 ? (
                <DraggableTopCard key={card.dossier_proposition_id} card={card} onDecide={(v) => decider(card, v)} />
              ) : (
                <motion.div
                  key={card.dossier_proposition_id}
                  className="absolute inset-0"
                  style={{
                    scale: 1 - i * 0.04,
                    top: i * 10,
                    zIndex: -i,
                  }}
                  initial={false}
                >
                  <SwipeCard card={card} />
                </motion.div>
              )
            )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => cartesVisibles[0] && decider(cartesVisibles[0], false)}
          disabled={cartesVisibles.length === 0}
          className="w-14 h-14 rounded-full border-2 border-[#AD1414] text-[#AD1414] flex items-center justify-center hover:bg-[#AD1414]/10 transition-colors disabled:opacity-30"
          aria-label="Passer"
        >
          <X className="w-6 h-6" />
        </button>
        <button
          type="button"
          onClick={annulerDernier}
          disabled={historique.length === 0}
          className="w-10 h-10 rounded-full text-[#1a1a1a]/50 flex items-center justify-center hover:bg-[#1a1a1a]/5 transition-colors disabled:opacity-20"
          aria-label="Annuler le dernier swipe"
        >
          <Undo2 className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => cartesVisibles[0] && decider(cartesVisibles[0], true)}
          disabled={cartesVisibles.length === 0}
          className="w-14 h-14 rounded-full bg-[#AD1414] text-white flex items-center justify-center hover:bg-[#AD1414]/90 transition-colors disabled:opacity-30"
          aria-label="J'aime"
        >
          <Heart className="w-6 h-6 fill-current" />
        </button>
      </div>
    </div>
  );
};
