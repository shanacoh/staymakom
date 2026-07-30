import { Button } from "@/components/ui/button";
import { swipeText, type SwipeLang } from "@/lib/swipe/localization";
import heroImage from "@/assets/hero-road-desert.jpg";

interface SwipeDossierIntroProps {
  lang: SwipeLang;
  message: string;
  onContinuer: () => void;
}

// Écran facultatif affiché avant le prénom, seulement si l'admin a rempli le "message d'accueil"
// du dossier (ex. expliquer les catégories de propositions) — voir DossierDetail.tsx côté admin.
export const SwipeDossierIntro = ({ lang, message, onContinuer }: SwipeDossierIntroProps) => {
  return (
    <div className="relative h-full flex flex-col items-center justify-center px-6 py-6 text-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }} />
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 w-full flex flex-col items-center max-w-sm">
        <span className="font-sans font-bold tracking-[-0.04em] uppercase text-xs text-[#AD1414] mb-4">
          STAYMAKOM
        </span>
        <p className="text-white text-base leading-relaxed whitespace-pre-line mb-8">{message}</p>
        <Button
          className="w-full max-w-xs h-12 bg-[#AD1414] hover:bg-[#AD1414]/90 text-sm font-bold uppercase tracking-widest"
          onClick={onContinuer}
        >
          {swipeText.categoryDivider.continue[lang]}
        </Button>
      </div>
    </div>
  );
};
