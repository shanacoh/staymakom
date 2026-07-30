import { motion } from "framer-motion";
import { Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { swipeText, type SwipeLang } from "@/lib/swipe/localization";
import heroImage from "@/assets/hero-road-desert.jpg";

interface SwipeIntroProps {
  lang: SwipeLang;
  onCommencer: () => void;
}

const TIMES = [0, 0.15, 0.35, 0.5, 0.55, 0.75, 0.95, 1];

export const SwipeIntro = ({ lang, onCommencer }: SwipeIntroProps) => {
  const t = swipeText.intro;
  return (
    <div className="relative h-full flex flex-col items-center justify-center px-6 py-6 text-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }} />
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-xs">
        <span className="font-sans font-bold tracking-[-0.04em] uppercase text-xs text-[#AD1414] mb-3">
          STAYMAKOM
        </span>
        <h1 className="font-sans text-2xl font-bold uppercase tracking-[0.02em] leading-[1.1] text-white mb-6">
          {t.title[lang]}
        </h1>

        <div className="relative w-36 h-48 mb-6">
          <motion.div
            className="absolute inset-0 rounded-2xl bg-white/10 border border-white/40 backdrop-blur-sm"
            animate={{ x: [0, 0, 50, 50, 0, -50, -50, 0], rotate: [0, 0, 8, 8, 0, -8, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", times: TIMES }}
          />
          <motion.div
            className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white flex items-center justify-center"
            animate={{ opacity: [0, 0, 1, 1, 0, 0, 0, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", times: TIMES }}
          >
            <Heart className="w-5 h-5 text-[#AD1414] fill-[#AD1414]" />
          </motion.div>
          <motion.div
            className="absolute top-2 left-2 w-9 h-9 rounded-full bg-white flex items-center justify-center"
            animate={{ opacity: [0, 0, 0, 0, 0, 1, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", times: TIMES }}
          >
            <X className="w-5 h-5 text-[#1a1a1a]" />
          </motion.div>
        </div>

        <div dir="ltr" className="flex items-center justify-center gap-6 mb-8 text-white text-sm font-semibold">
          <span className="flex items-center gap-1.5">
            <X className="w-4 h-4" /> {t.pass[lang]}
          </span>
          <span className="flex items-center gap-1.5">
            <Heart className="w-4 h-4 fill-white" /> {t.like[lang]}
          </span>
        </div>

        <Button
          className="w-full h-12 bg-[#AD1414] hover:bg-[#AD1414]/90 text-sm font-bold uppercase tracking-widest"
          onClick={onCommencer}
        >
          {t.cta[lang]}
        </Button>
      </div>
    </div>
  );
};
