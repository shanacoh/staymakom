import { WHATSAPP_NUMBER, buildWhatsappMessage, getWhatsappMessageVariant } from "@/constants/whatsapp";
import { trackWhatsappClicked, identifyWhatsappClicked } from "@/lib/analytics";

type Lang = "en" | "fr" | "he";

// Liste des médias qui ont parlé de STAYMAKOM — simple constante pour pouvoir
// en ajouter facilement, sans logo (texte stylé uniquement).
const PRESS_MENTIONS = ["i24NEWS", "Actualité Juive"];

const TEXTS: Record<Lang, { kicker: string; whatsapp: string }> = {
  fr: { kicker: "Ils parlent de nous", whatsapp: "Une question ? Notre équipe vous répond rapidement sur WhatsApp" },
  en: { kicker: "As seen in", whatsapp: "Questions? Our team replies quickly on WhatsApp" },
  he: { kicker: "כתבו עלינו", whatsapp: "שאלה? הצוות שלנו עונה מהר בוואטסאפ" },
};

export default function PressStrip({ lang }: { lang: Lang }) {
  const texts = TEXTS[lang] ?? TEXTS.en;

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
        <div className="flex items-baseline gap-6 sm:gap-10">
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
