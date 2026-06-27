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
      className="min-h-screen flex flex-col bg-white overflow-x-clip"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <V3Header mode={mode} setMode={setMode} />

      <main className="flex-1 flex flex-col pb-[92px] md:pb-0 pt-14">

        {/* ── Hero avec overlay ── */}
        <section className="relative h-[55vh] md:h-[65vh] min-h-[320px] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-black/30" />

          {/* 404 centré sur l'image */}
          <div className="relative z-10 text-center px-4">
            <p className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-white/70 mb-3">
              {copy.eyebrow}
            </p>
            <div
              className="font-sans font-bold uppercase leading-none tracking-[-0.04em] select-none"
              style={{
                fontSize: "clamp(6rem, 22vw, 18rem)",
                color: "#ad1414",
                textShadow: "0 2px 40px rgba(0,0,0,0.25)",
              }}
            >
              404
            </div>
          </div>
        </section>

        {/* ── Message + CTA ── */}
        <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12 sm:py-16 bg-white">
          <h1
            className="font-sans text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-[-0.03em] leading-[1.15] text-foreground mb-4 whitespace-pre-line"
          >
            {copy.title}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-sm mb-8">
            {copy.sub}
          </p>
          <Link
            to="/"
            className={
              "group inline-flex items-center gap-2 px-8 py-3 rounded-full " +
              "border border-foreground bg-transparent text-foreground " +
              "text-xs font-bold uppercase tracking-widest " +
              "hover:bg-foreground hover:text-background transition-colors duration-300"
            }
          >
            {copy.cta}
            <ArrowRight
              className={`h-3.5 w-3.5 transition-transform group-hover:translate-x-1 ${
                isRTL ? "rotate-180 group-hover:-translate-x-1" : ""
              }`}
            />
          </Link>
        </section>

      </main>

      <div className="hidden md:block">
        <LaunchFooter />
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default NotFound;
