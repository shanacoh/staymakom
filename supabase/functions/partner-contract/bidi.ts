// Ordre d'affichage d'une ligne qui mélange hébreu (droite-à-gauche) et alphabet latin.
// Un PDF dessine les lettres de gauche à droite : il faut donc remettre dans l'ordre « visuel »
// une ligne écrite dans l'ordre de lecture. Version simplifiée de l'algorithme Unicode, suffisante
// pour un contrat : l'hébreu n'a pas de lettres liées, retourner l'ordre suffit (pas de mise en forme).
//  - Une ligne est droite-à-gauche si sa première lettre « forte » est hébraïque.
//  - Les signes neutres (espaces, ponctuation) prennent le sens de leurs voisins s'ils concordent,
//    sinon celui de la ligne.
//  - Les nombres (avec leurs signes : %, ₪, virgule...) et le texte latin gardent leur ordre, à
//    l'intérieur d'une ligne hébraïque aussi.

export interface Run {
  text: string;
  rtl: boolean;
}

const HEBREW = /[֐-׿יִ-ﭏ]/;
const STRONG_LTR = /[A-Za-z0-9À-ɏ]/;
const NUMBER_UNIT = /[%‰°$€₪+\-]/;
const NUMBER_SEPARATOR = /[.,:\/]/;
const MIRROR: Record<string, string> = { "(": ")", ")": "(", "[": "]", "]": "[", "{": "}", "}": "{", "<": ">", ">": "<" };

export const isHebrew = (char: string) => HEBREW.test(char);

export function lineIsRtl(text: string): boolean {
  for (const char of text) {
    if (HEBREW.test(char)) return true;
    if (STRONG_LTR.test(char)) return false;
  }
  return false;
}

/** Les morceaux de la ligne dans l'ordre où il faut les dessiner, de gauche à droite. */
export function visualRuns(line: string, baseRtl = lineIsRtl(line)): Run[] {
  const chars = [...line];
  const types = chars.map((c) => (HEBREW.test(c) ? "R" : STRONG_LTR.test(c) ? "L" : "N"));
  // Les signes collés à un nombre (15%, 12.5, 1,000, ₪50) restent avec lui, dans son ordre.
  for (let i = 0; i < chars.length; i++) {
    if (types[i] !== "N") continue;
    const digitBefore = /[0-9]/.test(chars[i - 1] ?? "");
    const digitAfter = /[0-9]/.test(chars[i + 1] ?? "");
    // %, ₪, $... d'un côté du nombre ; point, virgule, barre, deux-points seulement ENTRE deux chiffres
    // (un point final reste la ponctuation de la phrase).
    if ((NUMBER_UNIT.test(chars[i]) && (digitBefore || digitAfter)) || (NUMBER_SEPARATOR.test(chars[i]) && digitBefore && digitAfter)) {
      types[i] = "L";
    }
  }

  // Les neutres prennent le sens de leurs voisins forts quand ceux-ci concordent.
  const resolved = types.map((type, i) => {
    if (type !== "N") return type;
    let before: string | null = null;
    for (let j = i - 1; j >= 0; j--) if (types[j] !== "N") { before = types[j]; break; }
    let after: string | null = null;
    for (let j = i + 1; j < types.length; j++) if (types[j] !== "N") { after = types[j]; break; }
    if (before && before === after) return before;
    return baseRtl ? "R" : "L";
  });

  // Morceaux dans l'ordre de lecture.
  const logical: Run[] = [];
  chars.forEach((char, i) => {
    const rtl = resolved[i] === "R";
    const last = logical[logical.length - 1];
    if (last && last.rtl === rtl) last.text += char;
    else logical.push({ text: char, rtl });
  });

  // Un morceau droite-à-gauche se dessine à l'envers (parenthèses retournées) ; une ligne
  // droite-à-gauche range ses morceaux de droite à gauche.
  const drawn = logical.map((run) =>
    run.rtl ? { rtl: true, text: [...run.text].reverse().map((c) => MIRROR[c] ?? c).join("") } : run,
  );
  return baseRtl ? drawn.reverse() : drawn;
}
