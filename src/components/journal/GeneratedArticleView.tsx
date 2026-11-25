// Affichage d'un article du Journal rédigé par le blog automatique (une langue par article).
// Même texte que la version servie à Google (api/_seo/journalArticle.ts). L'hébreu s'affiche
// de droite à gauche. Sert aussi d'aperçu dans le back-office (preview = true).
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { dateFnsLocale } from "@/lib/dateFnsLocale";
import { getStandaloneFromPrice } from "@/lib/standaloneFromPrice";
import { trackJournalExperienceCardClicked } from "@/lib/analytics";
import {
  BOOKING_HEADING,
  FAQ_HEADING,
  articleLang,
  inlineToHtml,
  localizeHref,
  type ArticleFaq,
  type ArticleLang,
  type ArticleSection,
  type LinkedListing,
} from "../../../api/_seo/journalArticle";

export interface GeneratedArticleRow {
  id: string;
  slug: string;
  lang: string;
  topic_group: string | null;
  title: string;
  intro: string | null;
  body: ArticleSection[];
  booking_intro: string | null;
  conclusion: string | null;
  faq: ArticleFaq[] | null;
  cover_image: string | null;
  cover_alt: string | null;
  linked_listings: LinkedListing[] | null;
  published_at: string | null;
}

const BODY_STYLE: React.CSSProperties = { fontFamily: "Inter, sans-serif", fontSize: "17px", lineHeight: 1.8, color: "#2C2825" };
const H2_STYLE: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', serif",
  fontSize: "28px",
  fontWeight: 400,
  color: "#1A1814",
  marginTop: "48px",
  marginBottom: "16px",
  lineHeight: 1.3,
};

function Rich({ text, lang, as: Tag = "p", style }: { text: string; lang: ArticleLang; as?: "p" | "li" | "span"; style?: React.CSSProperties }) {
  // inlineToHtml échappe tout le texte : seuls les liens internes et le gras sont rendus.
  return <Tag style={style} className="journal-body-text" dangerouslySetInnerHTML={{ __html: inlineToHtml(text, lang) }} />;
}

interface ListingCard {
  id: string;
  kind: LinkedListing["kind"];
  path: string;
  title: string;
  city: string | null;
  image: string | null;
  price: number | null;
}

const titleCase = (s: string) => (s === s.toUpperCase() ? s.charAt(0) + s.slice(1).toLowerCase() : s);

function useLinkedListings(listings: LinkedListing[], lang: ArticleLang) {
  return useQuery({
    queryKey: ["journal-linked-listings", listings.map((l) => l.id).join(","), lang],
    enabled: listings.length > 0,
    queryFn: async (): Promise<ListingCard[]> => {
      const exIds = listings.filter((l) => l.kind === "experience").map((l) => l.id);
      const saIds = listings.filter((l) => l.kind !== "experience").map((l) => l.id);
      const [ex, sa] = await Promise.all([
        exIds.length
          ? supabase
              .from("experiences2")
              .select("id,slug,title,title_fr,title_he,hero_image,thumbnail_image,base_price,from_price_ils,hotels2(city,city_fr,city_he,hero_image)")
              .in("id", exIds)
              .eq("status", "published")
          : Promise.resolve({ data: [] as any[] }),
        saIds.length
          ? supabase
              .from("standalone_experiences")
              .select("id,slug,category_id,title,title_fr,title_he,city,city_fr,city_he,hero_image,thumbnail_image,base_price,base_price_child,has_child_price,is_bookable")
              .in("id", saIds)
              .eq("status", "published")
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const pick = (r: any, base: string) => (lang === "en" ? r[base] : r[`${base}_${lang}`] || r[base]);
      const cards = new Map<string, ListingCard>();
      for (const r of (ex.data || []) as any[]) {
        const h = r.hotels2 || {};
        const price = Number(r.base_price) > 0 ? Number(r.base_price) : Number(r.from_price_ils) || null;
        cards.set(r.id, {
          id: r.id,
          kind: "experience",
          path: `/experience/${r.slug}`,
          title: titleCase(pick(r, "title") || r.title),
          city: pick(h, "city") || null,
          image: r.thumbnail_image || r.hero_image || h.hero_image || null,
          price: price ? Math.round(price) : null,
        });
      }
      for (const r of (sa.data || []) as any[]) {
        const kind = listings.find((l) => l.id === r.id)?.kind || "standalone";
        const price = r.is_bookable === false ? 0 : getStandaloneFromPrice(r);
        cards.set(r.id, {
          id: r.id,
          kind,
          path: `${kind === "boat" ? "/boat" : "/standalone-experience"}/${r.slug}`,
          title: titleCase(pick(r, "title") || r.title),
          city: pick(r, "city") || null,
          image: r.thumbnail_image || r.hero_image || null,
          price: price > 0 ? Math.round(price) : null,
        });
      }
      // Ordre choisi par le rédacteur ; une fiche dépubliée depuis disparaît simplement.
      return listings.map((l) => cards.get(l.id)).filter((c): c is ListingCard => !!c);
    },
  });
}

const FROM: Record<ArticleLang, string> = { en: "From", fr: "À partir de", he: "החל מ-" };

export function GeneratedArticleView({ post, preview = false }: { post: GeneratedArticleRow; preview?: boolean }) {
  const lang = articleLang(post as unknown as Record<string, unknown>);
  const isRTL = lang === "he";
  const listings = post.linked_listings || [];
  const { data: cards } = useLinkedListings(listings, lang);
  const faq = (post.faq || []).filter((f) => f.question && f.answer);

  return (
    <article dir={isRTL ? "rtl" : "ltr"} lang={lang} style={{ textAlign: isRTL ? "right" : "left" }}>
      {post.published_at && (
        <p className="text-sm text-muted-foreground mb-6">
          {format(new Date(post.published_at), "MMMM d, yyyy", { locale: dateFnsLocale(lang) })}
        </p>
      )}

      <h1
        className="mb-6"
        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 400, lineHeight: 1.15, color: "#1A1814" }}
      >
        {post.title}
      </h1>
      <p className="text-lg mb-10" style={{ color: "#8A8580" }}>
        STAYMAKOM
      </p>

      {post.cover_image && (
        <div className="rounded-lg overflow-hidden mb-12 mx-auto" style={{ maxWidth: "840px" }}>
          <img src={post.cover_image} alt={post.cover_alt || post.title} className="w-full object-cover" style={{ aspectRatio: "16/9" }} />
        </div>
      )}

      <div className="mx-auto" style={{ maxWidth: "680px" }}>
        {post.intro && (
          <Rich
            text={post.intro}
            lang={lang}
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "21px", lineHeight: 1.6, color: "#5C4A3A", marginBottom: "32px" }}
          />
        )}

        {post.body.map((section, i) => (
          <section key={i}>
            <h2 style={H2_STYLE}>{section.heading}</h2>
            {section.paragraphs.map((p, j) => (
              <Rich key={j} text={p} lang={lang} style={{ ...BODY_STYLE, marginBottom: "20px" }} />
            ))}
            {section.bullets && section.bullets.length > 0 && (
              <ul className={`${isRTL ? "pr-6" : "pl-6"} list-disc my-4 space-y-1`} style={BODY_STYLE}>
                {section.bullets.map((b, j) => (
                  <Rich key={j} as="li" text={b} lang={lang} />
                ))}
              </ul>
            )}
            {(section.paragraphs_after || []).map((p, j) => (
              <Rich key={`after-${j}`} text={p} lang={lang} style={{ ...BODY_STYLE, marginBottom: "20px" }} />
            ))}
          </section>
        ))}

        {cards && cards.length > 0 && (
          <section className="mt-14">
            <h2 style={H2_STYLE}>{BOOKING_HEADING[lang]}</h2>
            {post.booking_intro && <Rich text={post.booking_intro} lang={lang} style={{ ...BODY_STYLE, marginBottom: "24px" }} />}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {cards.map((card, index) => (
                <Link
                  key={card.id}
                  to={localizeHref(card.path, lang)}
                  className="group block border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-shadow"
                  onClick={() => {
                    if (preview) return;
                    trackJournalExperienceCardClicked({
                      article: post.slug,
                      language: lang,
                      topic_group: post.topic_group,
                      listing_id: card.id,
                      listing_kind: card.kind,
                      position: index + 1,
                    });
                  }}
                >
                  {card.image && (
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={card.image} alt={card.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">{card.title}</h3>
                    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                      {card.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {card.city}
                        </span>
                      )}
                      {card.price && (
                        <span className="font-semibold text-foreground">
                          {FROM[lang]} ₪{card.price.toLocaleString("en-US")}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {faq.length > 0 && (
          <section className="mt-14">
            <h2 style={H2_STYLE}>{FAQ_HEADING[lang]}</h2>
            {faq.map((f, i) => (
              <div key={i} className="mb-6">
                <h3 className="font-semibold mb-2" style={{ fontSize: "18px", color: "#1A1814" }}>
                  {f.question}
                </h3>
                <Rich text={f.answer} lang={lang} style={BODY_STYLE} />
              </div>
            ))}
          </section>
        )}

        {post.conclusion && <Rich text={post.conclusion} lang={lang} style={{ ...BODY_STYLE, marginTop: "40px" }} />}
      </div>
    </article>
  );
}
