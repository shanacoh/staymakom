import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-road-desert.jpg";

interface SwipeCategoryDividerProps {
  nomCategorie: string;
  nbPropositions: number;
  onContinuer: () => void;
}

export const SwipeCategoryDivider = ({ nomCategorie, nbPropositions, onContinuer }: SwipeCategoryDividerProps) => {
  return (
    <div className="relative h-full flex flex-col items-center justify-center px-6 py-6 text-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }} />
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 w-full flex flex-col items-center">
        <span className="font-sans font-bold tracking-[-0.04em] uppercase text-xs text-[#AD1414] mb-3">
          STAYMAKOM
        </span>
        <h1 className="font-sans text-4xl font-bold uppercase tracking-[0.01em] leading-[1.1] text-white mb-3">
          {nomCategorie}
        </h1>
        <p className="text-white/75 text-sm mb-8">
          {nbPropositions} proposition{nbPropositions > 1 ? "s" : ""}
        </p>
        <Button
          className="w-full max-w-xs h-12 bg-[#AD1414] hover:bg-[#AD1414]/90 text-sm font-bold uppercase tracking-widest"
          onClick={onContinuer}
        >
          Continuer
        </Button>
      </div>
    </div>
  );
};
