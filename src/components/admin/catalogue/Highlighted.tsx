import { highlightSegments } from "@/lib/catalogue/highlight";

/** Un texte dont les mots cherchés sont surlignés (sans changer le texte lui-même). */
export function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  if (terms.length === 0) return <>{text}</>;
  return (
    <>
      {highlightSegments(text, terms).map((segment, index) =>
        segment.match ? (
          <mark key={index} className="rounded-sm bg-amber-200/70 px-0.5 text-inherit">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </>
  );
}
