import { Heart } from "lucide-react";
import { swipeText, type SwipeLang } from "@/lib/swipe/localization";
import heroImage from "@/assets/hero-road-desert.jpg";

interface SwipeThankYouProps {
  lang: SwipeLang;
}

export const SwipeThankYou = ({ lang }: SwipeThankYouProps) => {
  return (
    <div className="relative h-full flex flex-col items-center justify-center px-6 py-6 text-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }} />
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-white/15 border border-white/40 flex items-center justify-center mb-6">
          <Heart className="w-8 h-8 text-[#AD1414] fill-[#AD1414]" />
        </div>
        <span className="font-sans font-bold tracking-[-0.04em] uppercase text-xs text-[#AD1414] mb-2">
          STAYMAKOM
        </span>
        <h1 className="font-sans text-3xl font-bold uppercase tracking-[0.01em] text-white mb-3">
          {swipeText.thankYou.title[lang]}
        </h1>
        <p className="text-white/75 max-w-sm text-sm">{swipeText.thankYou.subtitle[lang]}</p>
      </div>
    </div>
  );
};
