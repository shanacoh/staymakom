// Contenu « en blocs » (articles du Journal) : une liste de blocs texte / titre / bouton,
// enregistrée sous forme de JSON. Pour que la traduction ne puisse jamais casser la mise en
// page ni un lien, on n'envoie à l'IA que les textes, puis on les remet à leur place.

type Block = Record<string, unknown> & { type?: unknown };

/** Où se trouve le texte traduisible de chaque type de bloc. */
const TEXT_KEY_BY_TYPE: Record<string, string> = {
  text: "content",
  title: "content",
  cta: "text",
};

function parseBlocks(source: string): Block[] | null {
  try {
    const parsed = JSON.parse(source);
    if (!Array.isArray(parsed) || !parsed.every((b) => b && typeof b === "object")) return null;
    return parsed as Block[];
  } catch {
    return null;
  }
}

function textSlots(blocks: Block[]): { index: number; key: string }[] {
  const slots: { index: number; key: string }[] = [];
  blocks.forEach((block, index) => {
    const key = typeof block.type === "string" ? TEXT_KEY_BY_TYPE[block.type] : undefined;
    if (key && typeof block[key] === "string" && (block[key] as string).trim()) slots.push({ index, key });
  });
  return slots;
}

/** Les textes à traduire, dans l'ordre. null si le contenu n'est pas une liste de blocs. */
export function extractBlockTexts(source: string): string[] | null {
  const blocks = parseBlocks(source);
  if (!blocks) return null;
  return textSlots(blocks).map(({ index, key }) => blocks[index][key] as string);
}

/** Remet les textes traduits à leur place ; tout le reste (liens, identifiants, niveaux) est inchangé. */
export function rebuildBlocks(source: string, translated: string[]): string | null {
  const blocks = parseBlocks(source);
  if (!blocks) return null;
  const slots = textSlots(blocks);
  if (slots.length !== translated.length) return null;
  const copy = blocks.map((b) => ({ ...b }));
  slots.forEach(({ index, key }, i) => {
    copy[index][key] = translated[i];
  });
  return JSON.stringify(copy);
}
