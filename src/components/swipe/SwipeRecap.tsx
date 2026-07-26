import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import type { SwipeDeckCard } from "@/lib/swipe/types";

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
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 text-center">
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-3">
          Tu as aimé {likedCards.length} proposition{likedCards.length > 1 ? "s" : ""} !
        </h1>
        <p className="text-[#1a1a1a]/60 mb-8 max-w-sm">
          Envie de choisir tes indispensables parmi ce que tu as aimé ?
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button
            className="h-12 bg-[#AD1414] hover:bg-[#AD1414]/90"
            onClick={() => setEtape("choix")}
            disabled={likedCards.length === 0}
          >
            Choisir mes indispensables
          </Button>
          <Button variant="outline" className="h-12" onClick={onTerminer}>
            Terminer sans choisir
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-12 flex flex-col items-center">
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2 text-center">Tes indispensables</h1>
      <p className="text-[#1a1a1a]/60 mb-8 text-center max-w-sm">
        Marque celles que tu ne veux surtout pas manquer.
      </p>

      <div className="w-full max-w-md grid grid-cols-2 gap-3 mb-8">
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

      <Button className="w-full max-w-xs h-12 bg-[#AD1414] hover:bg-[#AD1414]/90" onClick={onTerminer}>
        Terminer
      </Button>
    </div>
  );
};
