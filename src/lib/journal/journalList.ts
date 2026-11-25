// Liste du Journal selon la langue du visiteur (même règle que la version pour Google,
// api/_seo/resolvers.ts) :
//  - nouveaux articles écrits dans sa langue + anciens articles bilingues (anglais / hébreu,
//    traduits automatiquement en espagnol / russe / allemand) ;
//  - en français : seulement les articles écrits en français, sinon la liste anglaise.
import { articleLang, articlePath, inlineToText, isGeneratedArticle } from "../../../api/_seo/journalArticle";

type Post = Record<string, any>;

export interface JournalListItem extends Post {
  __title: string;
  __excerpt: string;
  __href: string;
}

export function postsForLocale(posts: Post[], locale: string): Post[] {
  const legacy = posts.filter((p) => !isGeneratedArticle(p));
  const generated = posts.filter((p) => isGeneratedArticle(p));
  // Ancien article : visible en hébreu seulement s'il a son texte hébreu.
  const legacyIn = (code: string) => (code === "fr" ? [] : code === "he" ? legacy.filter((p) => p.title_he) : legacy);
  const inLang = (code: string) => [...generated.filter((p) => p.lang === code), ...legacyIn(code)];
  const code = locale === "fr" || locale === "he" ? locale : "en";
  const list = inLang(code);
  const chosen = list.length ? list : inLang("en");
  return chosen.sort((a, b) => String(b.published_at || "").localeCompare(String(a.published_at || "")));
}

/** Titre, chapeau et adresse à afficher (ancien article : texte dans la langue de l'interface). */
export function toListItem(post: Post, lang: "en" | "fr" | "he"): JournalListItem {
  if (isGeneratedArticle(post)) {
    return { ...post, __title: post.title, __excerpt: inlineToText(post.intro || ""), __href: articlePath(post.slug, articleLang(post)) };
  }
  const title = (lang === "he" && post.title_he) || post.title_en;
  const excerpt = (lang === "he" && post.excerpt_he) || post.excerpt_en || "";
  return { ...post, __title: title, __excerpt: excerpt, __href: `/journal/${post.slug}` };
}
