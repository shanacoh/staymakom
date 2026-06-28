import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import V3Header from "@/components/V3Header";
import LaunchFooter from "@/components/LaunchFooter";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useLanguage } from "@/hooks/useLanguage";
import heroImage from "@/assets/hero-road-desert.jpg";

const COPY = {
  en: {
    eyebrow: "Lost in the desert",
    title: "This page went\non its own escape.",
    sub: "The Israel most people never find… including this page.",
    cta: "Back to home",
  },
  fr: {
    eyebrow: "Perdu dans le désert",
    title: "Cette page est\npartie en escapade.",
    sub: "L'Israël que la plupart des gens ne trouvent pas… cette page non plus.",
    cta: "Retour à l'accueil",
  },
  he: {
    eyebrow: "אבוד במדבר",
    title: "הדף הזה ברח\nלחופשה משלו.",
    sub: "הישראל שרוב האנשים לא מוצאים… כולל הדף הזה.",
    cta: "חזרה לדף הבית",
  },
};

const NotFound = () => {
  const [mode, setMode] = useState<"stay" | "live">("live");
  const { lang } = useLanguage();
  const isRTL = lang === "he";
  const copy = COPY[lang] ?? COPY.en;

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <V3Header mode={mode} setMode={setMode} />

      {/* Zone centrale : image en fond, tout le contenu centré dedans */}
      <main className="flex-1 relative flex items-center justify-center">

        {/* Image de fond */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-black/40" />

        {/* Contenu */}
        <div className="relative z-10 text-center px-4 flex flex-col items-center gap-4 sm:gap-5 pb-20 md:pb-0">
          <p className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-white/70">
            {copy.eyebrow}
          </p>

          <div
            className="font-sans font-bold uppercase leading-none tracking-[-0.04em] select-none text-[#ad1414]"
            style={{
              fontSize: "clamp(5rem, 18vw, 14rem)",
              textShadow: "0 2px 40px rgba(0,0,0,0.3)",
            }}
          >
            404
          </div>

          <h1 className="font-sans text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-[-0.03em] leading-[1.2] text-white whitespace-pre-line">
            {copy.title}
          </h1>

          <p className="text-white/75 text-xs sm:text-sm max-w-xs sm:max-w-sm">
            {copy.sub}
          </p>

          <Link
            to="/"
            className={
              "group inline-flex items-center gap-2 px-7 py-2.5 rounded-full " +
              "border border-white bg-transparent text-white " +
              "text-xs font-bold uppercase tracking-widest " +
              "hover:bg-white hover:text-foreground transition-colors duration-300 mt-1"
            }
          >
            {copy.cta}
            <ArrowRight
              className={`h-3.5 w-3.5 transition-transform group-hover:translate-x-1 ${
                isRTL ? "rotate-180 group-hover:-translate-x-1" : ""
              }`}
            />
          </Link>
        </div>
      </main>

      <div className="hidden md:block">
        <LaunchFooter />
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default NotFound;
