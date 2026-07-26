import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
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
const DUREE_SORTIE = 0.35;
const DELAI_AVANT_SUIVANTE = 400;

export interface TopCardHandle {
  confirmerDecision: (valeur: boolean) => void;
}

// Pas de forwardRef ici volontairement : AnimatePresence gère déjà ses propres refs internes sur
// ses enfants directs pour piloter les animations de sortie. Faire cohabiter ce mécanisme avec un
// useImperativeHandle personnalisé provoque un avertissement React ("ref is not a prop"). On
// remonte donc les commandes (confirmerDecision) au parent via un simple callback + useEffect.
const DraggableTopCard = ({
  card,
  onDecide,
  onDecisionStart,
  exposerCommandes,
}: {
  card: SwipeDeckCard;
  onDecide: (valeur: boolean) => void;
  onDecisionStart: () => void;
  exposerCommandes: (commandes: TopCardHandle | null) => void;
}) => {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-300, 300], [-18, 18]);
    const likeOpacity = useTransform(x, [20, 120], [0, 1]);
    const passOpacity = useTransform(x, [-120, -20], [1, 0]);
    const [decisionEnCours, setDecisionEnCours] = useState<{ valeur: boolean } | null>(null);
    const decisionPriseRef = useRef(false);

    const confirmerDecision = (valeur: boolean) => {
      if (decisionPriseRef.current) return;
      decisionPriseRef.current = true;
      onDecisionStart();
      setDecisionEnCours({ valeur });
      animate(x, valeur ? 500 : -500, { duration: DUREE_SORTIE, ease: "easeIn" });
      setTimeout(() => onDecide(valeur), DELAI_AVANT_SUIVANTE);
    };

    useEffect(() => {
      exposerCommandes({ confirmerDecision });
      return () => exposerCommandes(null);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <motion.div
        className="absolute inset-0"
        style={{ x, rotate }}
        drag={decisionEnCours ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.9}
        onDragEnd={(_e, info) => {
          if (info.offset.x > SEUIL_SWIPE) confirmerDecision(true);
          else if (info.offset.x < -SEUIL_SWIPE) confirmerDecision(false);
        }}
        initial={{ scale: 1, opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.15 } }}
      >
        <SwipeCard card={card} />

        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-6 left-6 w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg -rotate-12"
        >
          <Heart className="w-8 h-8 text-white fill-white" />
        </motion.div>
        <motion.div
          style={{ opacity: passOpacity }}
          className="absolute top-6 right-6 w-16 h-16 rounded-full bg-[#AD1414] flex items-center justify-center shadow-lg rotate-12"
        >
          <X className="w-8 h-8 text-white" strokeWidth={3} />
        </motion.div>

        <AnimatePresence>
          {decisionEnCours && (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`absolute inset-0 flex items-center justify-center rounded-2xl ${
                decisionEnCours.valeur ? "bg-emerald-500/30" : "bg-[#AD1414]/30"
              }`}
            >
              <motion.div
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 350, damping: 18 }}
                className={`w-28 h-28 rounded-full flex items-center justify-center shadow-2xl ${
                  decisionEnCours.valeur ? "bg-emerald-500" : "bg-[#AD1414]"
                }`}
              >
                {decisionEnCours.valeur ? (
                  <Heart className="w-14 h-14 text-white fill-white" />
                ) : (
                  <X className="w-14 h-14 text-white" strokeWidth={3} />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
};

export const SwipeDeck = ({ cards, onSwipeCard, onUndoCard, onComplete }: SwipeDeckProps) => {
  const [index, setIndex] = useState(0);
  const [historique, setHistorique] = useState<SwipeDeckCard[]>([]);
  const [enAttente, setEnAttente] = useState(false);
  const topCardRef = useRef<TopCardHandle | null>(null);
  const topCardIdRef = useRef<string | null>(null);

  // La carte du dessus reste montée le temps de son animation de sortie (AnimatePresence) et se
  // démonte après que la carte suivante est déjà montée — sans cette protection par identifiant,
  // son démontage tardif remettrait topCardRef à null et rendrait les boutons J'aime/Passer
  // silencieusement inopérants après la première carte.
  const rattacherCommandesCarte = (id: string) => (commandes: TopCardHandle | null) => {
    if (commandes) {
      topCardRef.current = commandes;
      topCardIdRef.current = id;
    } else if (topCardIdRef.current === id) {
      topCardRef.current = null;
      topCardIdRef.current = null;
    }
  };

  const decider = (card: SwipeDeckCard, valeur: boolean) => {
    onSwipeCard(card, valeur);
    setHistorique((h) => [...h, card]);
    const prochainIndex = index + 1;
    if (prochainIndex >= cards.length) {
      setTimeout(onComplete, 250);
    }
    setIndex(prochainIndex);
    setEnAttente(false);
  };

  const declencherDecision = (valeur: boolean) => {
    if (enAttente) return;
    topCardRef.current?.confirmerDecision(valeur);
  };

  const annulerDernier = () => {
    if (enAttente) return;
    const dernier = historique[historique.length - 1];
    if (!dernier) return;
    onUndoCard(dernier);
    setHistorique((h) => h.slice(0, -1));
    setIndex((i) => Math.max(0, i - 1));
  };

  const cartesVisibles = cards.slice(index, index + 3);

  return (
    <div className="h-full flex flex-col items-center gap-3 w-full py-3 overflow-hidden bg-[#FAF8F4]">
      <div className="w-full max-w-sm px-4 shrink-0">
        <span className="block text-center font-sans font-bold tracking-[-0.02em] uppercase text-[10px] text-[#AD1414] mb-2">
          STAYMAKOM
        </span>
        <SwipeProgressBar current={index} total={cards.length} />
      </div>

      <div className="relative w-full max-w-sm flex-1 min-h-0 px-4">
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
                <DraggableTopCard
                  key={card.dossier_proposition_id}
                  exposerCommandes={rattacherCommandesCarte(card.dossier_proposition_id)}
                  card={card}
                  onDecide={(v) => decider(card, v)}
                  onDecisionStart={() => setEnAttente(true)}
                />
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

      <div className="flex items-center gap-6 shrink-0">
        <button
          type="button"
          onClick={() => declencherDecision(false)}
          disabled={cartesVisibles.length === 0 || enAttente}
          className="w-14 h-14 rounded-full border-2 border-[#AD1414] text-[#AD1414] flex items-center justify-center hover:bg-[#AD1414]/10 transition-colors disabled:opacity-30"
          aria-label="Passer"
        >
          <X className="w-6 h-6" />
        </button>
        <button
          type="button"
          onClick={annulerDernier}
          disabled={historique.length === 0 || enAttente}
          className="w-10 h-10 rounded-full text-[#1a1a1a]/50 flex items-center justify-center hover:bg-[#1a1a1a]/5 transition-colors disabled:opacity-20"
          aria-label="Annuler le dernier swipe"
        >
          <Undo2 className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => declencherDecision(true)}
          disabled={cartesVisibles.length === 0 || enAttente}
          className="w-14 h-14 rounded-full bg-[#AD1414] text-white flex items-center justify-center hover:bg-[#AD1414]/90 transition-colors disabled:opacity-30"
          aria-label="J'aime"
        >
          <Heart className="w-6 h-6 fill-current" />
        </button>
      </div>
    </div>
  );
};
