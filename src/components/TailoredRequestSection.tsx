import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import tailoredHero from "@/assets/tailored-request-hero.png";
import TailorMadeDialog from "@/components/tailorMade/TailorMadeDialog";

interface TailoredRequestSectionProps {
  ctaClassName?: string;
  heroImage?: string;
  kickerClassName?: string;
  ctaUnderlineClassName?: string;
}

// Bandeau « Design my stay » de la page d'accueil. Le formulaire lui-même vit dans TailorMadeDialog.
const TailoredRequestSection = ({ ctaClassName, heroImage, kickerClassName, ctaUnderlineClassName }: TailoredRequestSectionProps) => {
  const { lang } = useLanguage();
  const isRTL = lang === "he";

  const [dialogOpen, setDialogOpen] = useState(false);

  // D'autres boutons du site (FAQ, haut de page) ouvrent la même fenêtre.
  useEffect(() => {
    const handler = () => setDialogOpen(true);
    window.addEventListener("staymakom-open-design-my-stay", handler);
    return () => window.removeEventListener("staymakom-open-design-my-stay", handler);
  }, []);

  const getCopy = (en: string, he: string, fr: string = en) =>
    lang === "he" ? he : lang === "fr" ? fr : en;

  const perksEN = ["Tailor-made", "Authentic", "Best price guaranteed"];
  const perksFR = ["Sur mesure", "Authentique", "Meilleur prix garanti"];
  const perks = lang === "fr" ? perksFR : perksEN;

  return (
    <>
      {/* ─── Photo Hero Banner ─── */}
      <section
        className="relative w-full bg-cover bg-center py-8 sm:py-10"
        style={{ backgroundImage: `url(${heroImage ?? tailoredHero})` }}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 max-w-2xl mx-auto text-center px-4 space-y-4">
          {lang !== "he" && (
            <p className={cn("text-[11px] tracking-[0.25em] uppercase font-medium", kickerClassName ?? "text-white/55")}>
              {lang === "fr" ? "VOS ENVIES. NOTRE SAVOIR-FAIRE." : "YOUR TRIP. YOUR RULES."}
            </p>
          )}
          <h2 className="font-sans text-sm sm:text-base font-bold uppercase tracking-[0.03em] leading-tight text-white">
            {getCopy(
              "Looking for something truly unique?",
              "מחפשים משהו באמת ייחודי?",
              "Une idée de séjour hors du commun ?"
            )}
          </h2>
          <div className="space-y-2">
            <p className="text-white/70 text-[13px] sm:text-sm max-w-lg mx-auto leading-relaxed">
              {getCopy(
                "Proposal, family vacation, long stay, special occasion, business getaway...",
                "הצעת נישואין, חופשה משפחתית, שהות ארוכה, אירוע מיוחד, נסיעת עסקים...",
                "Demande en mariage, vacances en famille, séjour prolongé, occasion spéciale, retraite professionnelle..."
              )}
            </p>
            <p className="text-white text-[13px] sm:text-sm font-medium max-w-lg mx-auto">
              {getCopy(
                "Drop your idea, we handle everything.",
                "שתפו אותנו ברעיון, אנחנו מטפלים בכל השאר.",
                "Partagez votre idée, on s'occupe du reste."
              )}
            </p>
          </div>
          {lang !== "he" && (
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {perks.map((perk) => (
                <span
                  key={perk}
                  className="px-3 py-1 rounded-full text-[11px] tracking-wide border border-white/30 text-white/70"
                >
                  {perk}
                </span>
              ))}
            </div>
          )}
          <div className="relative inline-block mt-2">
            {ctaUnderlineClassName && (
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-2 bottom-1.5 h-3 sm:h-3.5 rounded-[60%_40%_70%_30%/40%_60%_30%_70%] -rotate-1",
                  ctaUnderlineClassName
                )}
              />
            )}
            <Button
              onClick={() => setDialogOpen(true)}
              className={cn("group relative", ctaClassName)}
            >
              {getCopy("DESIGN MY STAY", "עצבו את השהייה שלכם", "CRÉER MON SÉJOUR")}
              <ArrowRight
                className={cn(
                  "h-4 w-4 transition-transform group-hover:translate-x-1",
                  isRTL ? "mr-2 rotate-180 group-hover:-translate-x-1" : "ml-2"
                )}
              />
            </Button>
          </div>
        </div>
      </section>

      <TailorMadeDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
};

export default TailoredRequestSection;
