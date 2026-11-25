import { useLanguage } from "@/hooks/useLanguage";
import { JsonLd } from "@/components/JsonLd";
import { t } from "@/lib/translations";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

function openDesignMyStayDialog() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("staymakom-open-design-my-stay"));
}

type FAQItem = { q: string; a: string[] };

const link = "underline underline-offset-2 cursor-pointer hover:text-[#a83c3c] transition-colors";

/** Un paragraphe de réponse : le texte entre [crochets] devient le lien vers le formulaire sur-mesure. */
function Paragraph({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(\[[^\]]+\])/);
  return (
    <p className={className}>
      {parts.map((part, i) =>
        part.startsWith("[") && part.endsWith("]") ? (
          <button key={i} type="button" onClick={openDesignMyStayDialog} className={link}>
            {part.slice(1, -1)}
          </button>
        ) : (
          part
        ),
      )}
    </p>
  );
}

const FAQSection = () => {
  const { lang, locale } = useLanguage();
  const isRTL = lang === "he";

  // Textes dans src/lib/translations.ts (en, fr, he) et src/lib/uiTranslations/ (es, ru, de).
  const sectionLabel: string = t(locale, "faqLabel");
  const sectionTitle: string = t(locale, "faqTitle");
  const items: FAQItem[] = t(locale, "faqItems");

  // Résultat enrichi « FAQ » de Google : mêmes questions et réponses, liens [..] en texte simple.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a.join(" ").replace(/\[([^\]]+)\]/g, "$1") },
    })),
  };

  return (
    <>
      <JsonLd data={faqJsonLd} />
      <section className="py-8 sm:py-10 border-t border-border/40" dir={isRTL ? "rtl" : "ltr"}>
        <div className="container px-4 max-w-2xl mx-auto">
          <div className="text-center mb-5 sm:mb-7">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] text-[#ad1414] mb-2">
              {sectionLabel}
            </p>
            <h2 className="font-sans text-sm sm:text-base font-bold uppercase tracking-[0.03em] text-foreground">
              {sectionTitle}
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {items.map((item, index) => (
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="border-b border-border/50 last:border-b-0"
              >
                <AccordionTrigger className="text-sm sm:text-base font-medium text-left hover:no-underline text-foreground hover:text-[#a83c3c] py-4 [&[data-state=open]]:text-[#a83c3c] transition-colors duration-200 text-start">
                  {item.q}
                </AccordionTrigger>
                {/* forceMount : la réponse reste dans la page même accordéon fermé (masquée,
                    pas absente), pour que Google la lise. Radix la cache avec l'attribut hidden. */}
                <AccordionContent forceMount className="text-muted-foreground text-sm leading-relaxed pb-5">
                  {item.a.map((paragraph, i) => (
                    <Paragraph key={i} text={paragraph} className={i > 0 ? "mt-3" : undefined} />
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
};

export default FAQSection;
