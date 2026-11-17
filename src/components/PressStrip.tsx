import { WHATSAPP_NUMBER, buildWhatsappMessage, getWhatsappMessageVariant } from "@/constants/whatsapp";
import { trackWhatsappClicked, identifyWhatsappClicked } from "@/lib/analytics";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/translations";

type Lang = "en" | "fr" | "he";

// Liste des médias qui ont parlé de STAYMAKOM — simple constante pour pouvoir
// en ajouter facilement, sans logo (texte stylé uniquement).
const PRESS_MENTIONS = ["i24NEWS", "The Jerusalem Post", "Actualité Juive"];

export default function PressStrip({ lang }: { lang: Lang }) {
  // Textes dans la langue de la page (y compris es / ru / de) ; le message WhatsApp pré-rempli,
  // lu par l'équipe, reste dans la langue d'interface (en, fr, he).
  const { locale } = useLanguage();
  const texts = { kicker: t(locale, "pressKicker"), whatsapp: t(locale, "pressWhatsapp") };

  let entrySource: string | undefined;
  try {
    entrySource = sessionStorage.getItem("staymakom_entry_source") || undefined;
  } catch {
    entrySource = undefined;
  }
  const message = encodeURIComponent(buildWhatsappMessage(lang, entrySource));

  const handleClick = () => {
    trackWhatsappClicked("press_strip", getWhatsappMessageVariant(entrySource), entrySource);
    identifyWhatsappClicked();
  };

  return (
    <section className="py-7 sm:py-9" dir={lang === "he" ? "rtl" : "ltr"}>
      <div className="container max-w-3xl flex flex-col items-center gap-3 text-center">
        <span className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {texts.kicker}
        </span>
        <div className="flex flex-wrap items-baseline justify-center gap-x-6 gap-y-1 sm:gap-x-10">
          {PRESS_MENTIONS.map((name) => (
            <span
              key={name}
              className="font-serif text-base sm:text-lg italic text-foreground/80"
            >
              {name}
            </span>
          ))}
        </div>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="text-xs sm:text-sm text-muted-foreground hover:text-[#ad1414] transition-colors"
        >
          {texts.whatsapp}
        </a>
      </div>
    </section>
  );
}
