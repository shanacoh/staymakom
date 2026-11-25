import { Fragment } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { useLocalizedNavigation } from "@/hooks/useLocalizedNavigation";
import { t } from "@/lib/translations";

// Section « À propos » en bas de l'accueil : un court texte que Google et les IA peuvent lire,
// avec des liens vers les pages de catégorie. Textes dans src/lib/translations.ts (en, fr, he)
// et src/lib/uiTranslations/ (es, ru, de) ; copie robots dans api/_seo/homeIntro.ts.

/** Découpe « ... [texte](/adresse) ... » en morceaux de texte et liens internes. */
export function splitInlineLinks(text: string): ({ text: string } | { label: string; path: string })[] {
  const parts: ({ text: string } | { label: string; path: string })[] = [];
  const pattern = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ text: text.slice(last, index) });
    parts.push({ label: match[1], path: match[2] });
    last = index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

const HomeAboutSection = () => {
  const { lang, locale } = useLanguage();
  const { getLocalizedPath } = useLocalizedNavigation();
  const isRTL = lang === "he";

  return (
    <section className="py-8 sm:py-10 border-t border-border/40" dir={isRTL ? "rtl" : "ltr"}>
      <div className="container px-4 max-w-2xl mx-auto text-center">
        <h2 className="font-sans text-sm sm:text-base font-bold uppercase tracking-[0.03em] text-foreground mb-3">
          {t(locale, "homeAboutTitle")}
        </h2>
        <p className="text-muted-foreground text-[13px] sm:text-sm leading-relaxed">
          {splitInlineLinks(t(locale, "homeAboutText")).map((part, i) =>
            "path" in part ? (
              <Link
                key={i}
                to={getLocalizedPath(part.path)}
                className="underline underline-offset-2 hover:text-[#a83c3c] transition-colors"
              >
                {part.label}
              </Link>
            ) : (
              <Fragment key={i}>{part.text}</Fragment>
            ),
          )}
        </p>
      </div>
    </section>
  );
};

export default HomeAboutSection;
