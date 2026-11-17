import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import { t } from "@/lib/translations";

const MarqueeBanner = ({ className }: { className?: string }) => {
  const { lang, locale } = useLanguage();
  const isRTL = lang === 'he';
  
  // Create the formatted text with proper styling
  const createContent = () => (
    <>
      <span className="font-normal">{t(locale, "marqueeLine1")}</span>
      <span className="font-bold"> {t(locale, "marqueeLine2")}</span>
    </>
  );

  // Repeat the content for seamless loop
  const repeatedContent = Array(12).fill(null).map((_, i) => (
    <span key={i} className="mx-8">
      {createContent()}
    </span>
  ));

  return (
    <section
      className={cn("bg-white py-2 sm:py-3 overflow-hidden", className)}
      aria-hidden="true"
    >
      <div className={`flex whitespace-nowrap ${isRTL ? 'animate-marquee-rtl' : 'animate-marquee'}`}>
        <div className="flex text-foreground text-sm sm:text-base md:text-lg tracking-[0.01em] uppercase">
          {repeatedContent}
        </div>
        <div className="flex text-foreground text-sm sm:text-base md:text-lg tracking-[0.01em] uppercase">
          {repeatedContent}
        </div>
      </div>
    </section>
  );
};

export default MarqueeBanner;
