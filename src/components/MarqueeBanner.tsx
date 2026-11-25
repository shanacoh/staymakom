import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import { t } from "@/lib/translations";

/**
 * Bandeau défilant « HANDPICKED HOTELS. UNFORGETTABLE EXPERIENCES. ».
 *
 * Le texte n'existe qu'UNE fois dans la page (pour Google et les lecteurs d'écran) : la
 * première copie est un vrai texte, toutes les copies décoratives qui font la boucle sont
 * dessinées par la feuille de style (attribut data-text affiché via ::before), donc
 * absentes du contenu lu par les moteurs. Rendu visuel identique à avant.
 */
const MarqueeBanner = ({ className }: { className?: string }) => {
  const { lang, locale } = useLanguage();
  const isRTL = lang === 'he';
  const line1: string = t(locale, "marqueeLine1");
  const line2: string = t(locale, "marqueeLine2");

  // Copie décorative : texte dessiné par le CSS, rien dans le HTML.
  const decorative = (key: number) => (
    <span key={key} className="mx-8" aria-hidden="true">
      <span className="font-normal before:content-[attr(data-text)]" data-text={line1} />
      <span className="font-bold before:content-[attr(data-text)]" data-text={` ${line2}`} />
    </span>
  );

  const firstRow = [
    <span key="real" className="mx-8">
      <span className="font-normal">{line1}</span>
      <span className="font-bold"> {line2}</span>
    </span>,
    ...Array.from({ length: 11 }, (_, i) => decorative(i + 1)),
  ];
  const secondRow = Array.from({ length: 12 }, (_, i) => decorative(100 + i));

  return (
    <section className={cn("bg-white py-2 sm:py-3 overflow-hidden", className)}>
      <div className={`flex whitespace-nowrap ${isRTL ? 'animate-marquee-rtl' : 'animate-marquee'}`}>
        <div className="flex text-foreground text-sm sm:text-base md:text-lg tracking-[0.01em] uppercase">
          {firstRow}
        </div>
        <div className="flex text-foreground text-sm sm:text-base md:text-lg tracking-[0.01em] uppercase" aria-hidden="true">
          {secondRow}
        </div>
      </div>
    </section>
  );
};

export default MarqueeBanner;
