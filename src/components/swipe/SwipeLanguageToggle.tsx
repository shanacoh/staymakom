import type { Language } from "@/hooks/useLanguage";

interface SwipeLanguageToggleProps {
  lang: Language;
  onChange: (lang: Language) => void;
}

const OPTIONS: { lang: Language; label: string }[] = [
  { lang: "en", label: "EN" },
  { lang: "fr", label: "FR" },
  { lang: "he", label: "עב" },
];

// Discret, comme le sélecteur EN | FR | עב du header du site (Header.tsx) — un fond sombre semi-
// transparent en plus, pour rester lisible aussi bien sur les écrans à photo que sur le fond clair
// du deck. dir="ltr" fixe l'ordre des options quelle que soit la langue active.
export const SwipeLanguageToggle = ({ lang, onChange }: SwipeLanguageToggleProps) => {
  return (
    <div
      dir="ltr"
      className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1"
    >
      {OPTIONS.map((option, i) => (
        <div key={option.lang} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-[10px] text-white/30 select-none">|</span>}
          <button
            type="button"
            onClick={() => onChange(option.lang)}
            className={`transition-colors ${option.lang === "he" ? "text-[12px]" : "text-[11px]"} ${
              option.lang === lang ? "text-white font-semibold" : "text-white/50 hover:text-white/80"
            }`}
          >
            {option.label}
          </button>
        </div>
      ))}
    </div>
  );
};
