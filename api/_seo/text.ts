// Petits outils de texte : nettoyer le HTML saisi dans le back-office, couper une
// description à la bonne longueur, protéger les caractères spéciaux.

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const ENTITIES: Record<string, string> = { "&nbsp;": " ", "&amp;": "&", "&quot;": '"', "&#39;": "'", "&lt;": "<", "&gt;": ">" };

/** Texte brut à partir d'un texte qui peut contenir du HTML. */
export function stripHtml(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(nbsp|amp|quot|#39|lt|gt);/g, (m) => ENTITIES[m] || m)
    .replace(/[ \t]+/g, " ")
    .trim();
}

/** Découpe un long texte en paragraphes non vides. */
export function paragraphs(value: unknown): string[] {
  return stripHtml(value)
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Une phrase sur une seule ligne (pour llms.txt et les listes). */
export function oneLine(value: unknown, max = 160): string {
  const text = stripHtml(value).replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).replace(/\s+\S*$/, "")}…` : text;
}

/**
 * Description pour Google (140 à 160 caractères conseillés) : coupée proprement
 * à la fin d'un mot, sans dépasser 160 caractères.
 */
export function metaDescription(...candidates: unknown[]): string | undefined {
  for (const candidate of candidates) {
    const text = stripHtml(candidate).replace(/\s+/g, " ").trim();
    if (!text) continue;
    if (text.length <= 160) return text;
    return `${text.slice(0, 157).replace(/\s+\S*$/, "")}…`;
  }
  return undefined;
}

/** Liste de textes courts, quel que soit le format enregistré (tableau, texte multi-lignes). */
export function toList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : item?.title || item?.name || item?.label || ""))
      .map((item) => stripHtml(item))
      .filter(Boolean);
  }
  if (typeof value === "string") return paragraphs(value);
  return [];
}

export interface ArticleBlock {
  kind: "h2" | "p";
  text: string;
}

/**
 * Contenu d'un article du journal (liste de blocs avec du HTML dedans) →
 * suite d'intertitres et de paragraphes en texte brut.
 */
export function articleBlocks(content: unknown): ArticleBlock[] {
  let blocks: any[] = [];
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      blocks = Array.isArray(parsed) ? parsed : [{ type: "text", content }];
    } catch {
      blocks = [{ type: "text", content }];
    }
  } else if (Array.isArray(content)) {
    blocks = content;
  }
  const out: ArticleBlock[] = [];
  for (const block of blocks) {
    const html = typeof block?.content === "string" ? block.content : "";
    if (!html) continue;
    const parts = html.split(/(<h[1-4][^>]*>[\s\S]*?<\/h[1-4]>)/i);
    for (const part of parts) {
      if (/^<h[1-4]/i.test(part)) {
        const text = stripHtml(part);
        if (text) out.push({ kind: "h2", text });
      } else {
        for (const p of paragraphs(part)) out.push({ kind: "p", text: p });
      }
    }
  }
  return out;
}

/** Prix affiché, ex. « ₪ 1,250 ». */
export function formatPrice(amount: number, currency = "ILS"): string {
  const symbol = currency === "ILS" ? "₪" : currency === "EUR" ? "€" : currency === "USD" ? "$" : `${currency} `;
  return `${symbol}${Math.round(amount).toLocaleString("en-US")}`;
}
