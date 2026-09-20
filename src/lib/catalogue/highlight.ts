export interface TextSegment {
  text: string;
  match: boolean;
}

/** Une lettre sans accent ni majuscule ("É" donne "e"). Une lettre peut donner plus d'une lettre ("Œ" donne "œ"). */
function fold(char: string): string {
  return char.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Découpe un texte en morceaux, en repérant les mots cherchés (sans tenir compte des accents ni des
 * majuscules) tout en gardant le texte d'origine tel quel. `terms` vient de `searchTerms`.
 */
export function highlightSegments(text: string, terms: string[]): TextSegment[] {
  const needles = terms.filter(Boolean);
  if (!text || needles.length === 0) return [{ text, match: false }];

  // Texte simplifié, avec pour chaque lettre simplifiée la position de sa lettre d'origine
  let folded = "";
  const origin: number[] = [];
  const chars = Array.from(text);
  chars.forEach((char, index) => {
    for (const piece of fold(char)) {
      folded += piece;
      origin.push(index);
    }
  });

  // Les zones à surligner, en positions de lettres d'origine
  const marked = new Array<boolean>(chars.length).fill(false);
  for (const needle of needles) {
    let from = 0;
    for (;;) {
      const at = folded.indexOf(needle, from);
      if (at === -1) break;
      for (let i = at; i < at + needle.length; i++) marked[origin[i]] = true;
      from = at + Math.max(needle.length, 1);
    }
  }

  const segments: TextSegment[] = [];
  chars.forEach((char, index) => {
    const last = segments[segments.length - 1];
    if (last && last.match === marked[index]) last.text += char;
    else segments.push({ text: char, match: marked[index] });
  });
  return segments;
}
