import type { HeroKeyFact, HeroLang } from "@/lib/heroKeyFacts";

interface HeroKeyFactsProps {
  facts: HeroKeyFact[];
  /**
   * Prix « à partir de », déjà mis en forme par l'appelant à partir de la même
   * source que le panneau de réservation. Ce composant ne calcule aucun prix.
   */
  fromPrice?: { amount: string; unit: string } | null;
  onSeeDates?: () => void;
  lang: HeroLang;
}

// Haut de fiche (ordinateur) : bande de 3 infos clés, prix « à partir de »
// et bouton « Voir les dates » qui mène au panneau de réservation.
const HeroKeyFacts = ({ facts, fromPrice, onSeeDates, lang }: HeroKeyFactsProps) => {
  const visibleFacts = facts.filter((f) => !!f.value);

  return (
    <div className="flex flex-col items-center gap-3 pt-1">
      {/* Une case vide est masquée ; à moins de 2 cases, la bande n'apparaît pas. */}
      {visibleFacts.length >= 2 && (
        <div className="flex w-full max-w-[340px] rounded-xl border border-border">
          {visibleFacts.map((fact) => (
            <div
              key={fact.key}
              className="flex-1 min-w-0 px-1.5 py-2 text-center [&:not(:last-child)]:border-e border-border"
            >
              <span className="block text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
                {fact.label}
              </span>
              <span className="block text-[13px] font-semibold text-foreground break-words">
                {fact.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {fromPrice && (
        <p className="text-[13px] text-muted-foreground">
          {lang === "he" ? "החל מ-" : lang === "fr" ? "À partir de " : "From "}
          <span className="text-xl font-bold text-foreground">{fromPrice.amount}</span>
          {" "}{fromPrice.unit}
        </p>
      )}

      {onSeeDates && (
        <button
          type="button"
          onClick={onSeeDates}
          className="rounded-full bg-[#ad1414] px-[22px] py-2.5 text-[13px] font-bold text-white hover:bg-[#9a1212] transition-colors"
        >
          {lang === "he" ? "לתאריכים" : lang === "fr" ? "Voir les dates" : "View dates"}
        </button>
      )}
    </div>
  );
};

export default HeroKeyFacts;
