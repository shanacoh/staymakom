import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import type { SwipeDeckCard } from "@/lib/swipe/types";
import heroImage from "@/assets/hero-road-desert.jpg";

interface SwipeRecapProps {
  likedCards: SwipeDeckCard[];
  onToggleIndispensable: (card: SwipeDeckCard, valeur: boolean) => void;
  indispensables: Set<string>;
  onTerminer: () => void;
}

export const SwipeRecap = ({ likedCards, onToggleIndispensable, indispensables, onTerminer }: SwipeRecapProps) => {
  const [etape, setEtape] = useState<"intro" | "choix">("intro");

  if (etape === "intro") {
    return (
      <div className="relative h-full flex flex-col items-center justify-center px-6 py-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }} />
        <div className="absolute inset-0 bg-black/45" />

        <div className="relative z-10 w-full flex flex-col items-center">
          <span className="font-sans font-bold tracking-[-0.04em] uppercase text-xs text-[#AD1414] mb-3">
            STAYMAKOM
          </span>
          <h1 className="font-sans text-2xl font-bold uppercase tracking-[0.01em] leading-[1.2] text-white mb-3">
            Tu as aimé {likedCards.length} proposition{likedCards.length > 1 ? "s" : ""} !
          </h1>
          <p className="text-white/75 mb-8 max-w-sm text-sm">
            Envie de choisir tes indispensables parmi ce que tu as aimé ?
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button
              className="h-12 bg-[#AD1414] hover:bg-[#AD1414]/90 text-sm font-bold uppercase tracking-widest"
              onClick={() => setEtape("choix")}
              disabled={likedCards.length === 0}
            >
              Choisir mes indispensables
            </Button>
            <Button
              className="h-12 border border-white bg-transparent text-white text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-[#1a1a1a]"
              onClick={onTerminer}
            >
              Terminer sans choisir
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full px-6 py-4 flex flex-col items-center overflow-hidden bg-[#FAF8F4]">
      <span className="font-sans font-bold tracking-[-0.02em] uppercase text-xs text-[#AD1414] mb-2 shrink-0">
        STAYMAKOM
      </span>
      <h1 className="font-sans text-xl font-bold uppercase tracking-[0.01em] text-[#1a1a1a] mb-1 text-center shrink-0">
        Tes indispensables
      </h1>
      <p className="text-[#1a1a1a]/60 mb-4 text-center max-w-sm shrink-0 text-sm">
        Marque celles que tu ne veux surtout pas manquer.
      </p>

      <div className="w-full max-w-md flex-1 min-h-0 overflow-y-auto overscroll-contain grid grid-cols-2 gap-3 content-start">
        {likedCards.map((card) => {
          const estIndispensable = indispensables.has(card.dossier_proposition_id);
          return (
            <button
              key={card.dossier_proposition_id}
              onClick={() => onToggleIndispensable(card, !estIndispensable)}
              className="relative rounded-xl overflow-hidden aspect-[3/4] text-left"
            >
              {card.photo_url ? (
                <img src={card.photo_url} alt={card.titre} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-[#1a1a1a]/10" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2 text-white text-sm font-semibold line-clamp-2">
                {card.titre}
              </div>
              <div
                className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  estIndispensable ? "bg-[#AD1414]" : "bg-black/40"
                }`}
              >
                <Star className={`w-4 h-4 ${estIndispensable ? "fill-white text-white" : "text-white"}`} />
              </div>
            </button>
          );
        })}
      </div>

      <Button
        className="w-full max-w-xs h-12 bg-[#AD1414] hover:bg-[#AD1414]/90 shrink-0 mt-4 text-sm font-bold uppercase tracking-widest"
        onClick={onTerminer}
      >
        Terminer
      </Button>
    </div>
  );
};
