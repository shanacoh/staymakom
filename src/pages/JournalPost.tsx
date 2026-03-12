import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft, MapPin, ArrowRight, Heart } from "lucide-react";
import { format } from "date-fns";
import NotFound from "./NotFound";
import DOMPurify from "dompurify";
import { useLanguage, getLocalizedField } from "@/hooks/useLanguage";
import { Block } from "@/components/admin/journal/types";
import { useAuth } from "@/contexts/AuthContext";
import AuthPromptDialog from "@/components/auth/AuthPromptDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trackJournalArticleViewed, trackCtaClickedFromJournal } from "@/lib/analytics";

// Reading progress bar
function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setProgress(Math.min((scrollTop / docHeight) * 100, 100));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[999] h-[2px]">
      <div
        className="h-full transition-[width] duration-100"
        style={{ width: `${progress}%`, backgroundColor: "#B8935A" }}
      />
    </div>
  );
}

// Embedded Experience Card Component
function EmbeddedExperienceCard({ experienceId }: { experienceId: string }) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  
  const { data: experience, isLoading } = useQuery({
    queryKey: ["embedded-experience", experienceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select(`
          id,
          title,
          title_he,
          slug,
          hero_image,
          base_price,
          currency,
          status,
          hotels!inner(name, name_he, city, city_he, hero_image)
        `)
        .eq("id", experienceId)
        .eq("status", "published")
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!experienceId,
  });

  const { data: wishlistStatus } = useQuery({
    queryKey: ["wishlist-status", experienceId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("wishlist")
        .select("id, deleted_at")
        .eq("user_id", user.id)
        .eq("experience_id", experienceId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!experienceId,
  });

  const isInWishlist = wishlistStatus && !wishlistStatus.deleted_at;

  const wishlistMutation = useMutation({
    mutationFn: async ({ isAdding }: { isAdding: boolean }) => {
      if (!user?.id) throw new Error("Not authenticated");
      if (isAdding) {
        if (wishlistStatus?.deleted_at) {
          const { error } = await supabase.from("wishlist").update({ deleted_at: null }).eq("id", wishlistStatus.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("wishlist").insert({ user_id: user.id, experience_id: experienceId });
          if (error) throw error;
        }
      } else {
        const { error } = await supabase.from("wishlist").update({ deleted_at: new Date().toISOString() }).eq("user_id", user.id).eq("experience_id", experienceId).is("deleted_at", null);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist-status", experienceId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(variables.isAdding ? (lang === "he" ? "נוסף למועדפים" : "Added to favorites") : (lang === "he" ? "הוסר מהמועדפים" : "Removed from favorites"));
    },
  });

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }
    wishlistMutation.mutate({ isAdding: !isInWishlist });
  };

  if (isLoading) {
    return (
      <div className="my-8 p-4 border rounded-lg bg-muted/30 animate-pulse">
        <div className="flex gap-4">
          <div className="w-32 h-24 bg-muted rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!experience) return null;

  const hotel = experience.hotels as any;
  const title = lang === "he" ? experience.title_he || experience.title : experience.title;
  const hotelName = lang === "he" ? hotel?.name_he || hotel?.name : hotel?.name;
  const city = lang === "he" ? hotel?.city_he || hotel?.city : hotel?.city;
  const imageUrl = experience.hero_image || hotel?.hero_image;

  return (
    <>
      <AuthPromptDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} lang={lang} defaultTab="login" context="favorites" />
      <Link to={`/experience/${experience.slug}`} className="block my-8 group relative">
        <div className="border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-shadow">
          <div className="flex flex-col sm:flex-row">
            {imageUrl && (
              <div className="sm:w-48 aspect-video sm:aspect-square overflow-hidden relative">
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            <div className="flex-1 p-4 sm:p-6 flex flex-col justify-center">
              <p className="text-sm text-muted-foreground mb-1">{hotelName}</p>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                {title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {city}
                  </span>
                )}
                <span className="font-semibold text-foreground">
                  {experience.currency} {experience.base_price}
                </span>
              </div>
            </div>
            {/* Heart button */}
            <button
              onClick={handleHeartClick}
              className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm transition-all hover:bg-background"
              aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={cn("h-4 w-4 transition-colors", isInWishlist ? "fill-destructive text-destructive" : "text-muted-foreground")} />
            </button>
          </div>
        </div>
      </Link>
    </>
  );
}

const JournalPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLanguage();

  useEffect(() => { if (slug) trackJournalArticleViewed(slug); }, [slug]);

  const { data: post, isLoading } = useQuery({
    queryKey: ["journal-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_posts" as any)
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .not("published_at", "is", null)
        .single();

      if (error) throw error;
      return data as any;
    },
  });

  // Fetch related articles from same category
  const { data: relatedPosts } = useQuery({
    queryKey: ["related-journal", post?.category, post?.id],
    queryFn: async () => {
      // First try same category
      const { data: sameCat } = await supabase
        .from("journal_posts" as any)
        .select("id, slug, title_en, title_he, cover_image, category")
        .eq("status", "published")
        .eq("category", post.category)
        .neq("id", post.id)
        .not("published_at", "is", null)
        .order("published_at", { ascending: false })
        .limit(2);

      let results = (sameCat || []) as any[];

      // Fill with recent if needed
      if (results.length < 2) {
        const existingIds = [post.id, ...results.map((r: any) => r.id)];
        const { data: recent } = await supabase
          .from("journal_posts" as any)
          .select("id, slug, title_en, title_he, cover_image, category")
          .eq("status", "published")
          .not("published_at", "is", null)
          .not("id", "in", `(${existingIds.join(",")})`)
          .order("published_at", { ascending: false })
          .limit(2 - results.length);
        results = [...results, ...(recent || [])];
      }

      return results as any[];
    },
    enabled: !!post,
  });

  // Parse blocks from JSON string, fallback to legacy HTML
  const parseContent = (content: string): { blocks: Block[] | null; html: string | null } => {
    if (!content) return { blocks: null, html: null };
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return { blocks: parsed, html: null };
      }
      return { blocks: null, html: content };
    } catch {
      return { blocks: null, html: content };
    }
  };

  const renderBlock = (block: Block, index: number, allBlocks: Block[]) => {
    switch (block.type) {
      case "title": {
        // Skip if it's the first block and matches the article title (duplicate)
        if (index === 0 && block.content === post?.title_en) return null;
        const TitleTag = block.level;
        return block.content ? (
          <TitleTag
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: block.level === "h2" ? "28px" : block.level === "h3" ? "24px" : "32px",
              fontWeight: 400,
              color: "#1A1814",
              marginTop: "48px",
              marginBottom: "16px",
              lineHeight: 1.3,
            }}
          >
            {block.content}
          </TitleTag>
        ) : null;
      }

      case "text": {
        const processedTextContent = block.content
          ? block.content
              .replace(/<p><\/p>/g, "")
              .replace(/<p>\s*<\/p>/g, "")
          : "";
        return processedTextContent ? (
          <div
            className="journal-body-text"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "17px",
              lineHeight: 1.8,
              color: "#2C2825",
              marginBottom: "24px",
            }}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(processedTextContent, {
                ALLOWED_TAGS: [
                  "p", "br", "strong", "em", "u", "s", "h1", "h2", "h3",
                  "ul", "ol", "li", "a", "span",
                ],
                ALLOWED_ATTR: ["href", "target", "rel", "class", "style"],
              }),
            }}
          />
        ) : null;
      }

      case "image":
        return block.url ? (
          <figure className="my-8">
            <img
              src={block.url}
              alt={block.alt || "Article image"}
              className="w-full rounded-lg shadow-md"
            />
            {block.caption && (
              <figcaption className="text-sm text-center mt-3" style={{ color: "#8A8580" }}>
                {block.caption}
              </figcaption>
            )}
          </figure>
        ) : null;

      case "cta":
        return block.text ? (
          <div className="my-10 text-center">
            <Button size="lg" asChild onClick={() => trackCtaClickedFromJournal(slug || '', block.url?.includes('/experience') ? 'experience_link' : 'book_now')}>
              <Link to={block.url}>{block.text}</Link>
            </Button>
          </div>
        ) : null;

      case "quote":
        return block.content ? (
          <blockquote className="my-8 pl-6 border-l-4" style={{ borderColor: "#B8935A" }}>
            <p className="text-xl italic leading-relaxed" style={{ color: "#5C4A3A" }}>
              {block.content}
            </p>
            {block.author && (
              <cite className="block mt-3 text-sm font-medium not-italic" style={{ color: "#8A8580" }}>
                — {block.author}
              </cite>
            )}
          </blockquote>
        ) : null;

      case "pull_quote":
        return block.content ? (
          <blockquote
            className="text-center italic"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "24px",
              borderLeft: "3px solid #B8935A",
              paddingLeft: "24px",
              margin: "48px auto",
              maxWidth: "560px",
              color: "#5C4A3A",
              textAlign: "left",
              lineHeight: 1.5,
            }}
          >
            {block.content}
          </blockquote>
        ) : null;

      case "divider":
        return (
          <div className="text-center my-12" style={{ color: "#B8935A", letterSpacing: "0.3em", fontSize: "14px" }}>
            — ✦ —
          </div>
        );

      case "list": {
        const ListTag = block.style === "bullet" ? "ul" : "ol";
        const listClass = block.style === "bullet" ? "list-disc list-inside" : "list-decimal list-inside";
        return block.items.some((item) => item) ? (
          <ListTag
            className={`${listClass} my-6 space-y-2`}
            style={{ fontSize: "17px", lineHeight: 1.8, color: "#2C2825" }}
          >
            {block.items.filter((item) => item).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ListTag>
        ) : null;
      }

      case "experience":
        return block.experience_id ? (
          <div onClick={() => trackCtaClickedFromJournal(slug || '', 'experience_link')}>
            <EmbeddedExperienceCard experienceId={block.experience_id} />
          </div>
        ) : null;

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5]">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="h-8 bg-muted rounded w-32 mb-8 animate-pulse" />
          <div className="h-12 bg-muted rounded mb-4 animate-pulse" />
          <div className="h-6 bg-muted rounded w-48 mb-8 animate-pulse" />
          <div className="aspect-[16/9] bg-muted rounded mb-12 animate-pulse" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return <NotFound />;
  }

  const title = getLocalizedField(post, "title", lang) || post.title_en;
  const excerpt = getLocalizedField(post, "excerpt", lang) || post.excerpt_en;
  const content = getLocalizedField(post, "content", lang) || post.content_en;
  const { blocks, html } = parseContent(content);
  const isRTL = lang === "he";

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <ReadingProgressBar />
      <SEOHead
        titleEn={post.seo_title_en || post.title_en}
        titleHe={post.seo_title_he || post.title_he}
        titleFr={post.seo_title_fr}
        descriptionEn={post.meta_description_en || post.excerpt_en}
        descriptionHe={post.meta_description_he || post.excerpt_he}
        descriptionFr={post.meta_description_fr}
        ogTitleEn={post.og_title_en || post.seo_title_en || post.title_en}
        ogTitleHe={post.og_title_he || post.seo_title_he || post.title_he}
        ogTitleFr={post.og_title_fr || post.seo_title_fr}
        ogDescriptionEn={post.og_description_en || post.meta_description_en || post.excerpt_en}
        ogDescriptionHe={post.og_description_he || post.meta_description_he || post.excerpt_he}
        ogDescriptionFr={post.og_description_fr || post.meta_description_fr}
        ogImage={post.og_image || post.cover_image}
      />
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-20" dir={isRTL ? "rtl" : "ltr"}>
        <Link to="/journal">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className={`w-4 h-4 ${isRTL ? "ml-2 rotate-180" : "mr-2"}`} />
            {isRTL ? "חזרה ליומן" : "Back to Journal"}
          </Button>
        </Link>

        <article>
          {/* Category & Date */}
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-block px-3 py-1 text-[11px] font-medium uppercase tracking-[0.1em] rounded-full bg-[#E8E0D4] text-[#1A1814]">
              {post.category}
            </span>
            {post.published_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {format(new Date(post.published_at), "MMMM d, yyyy")}
              </div>
            )}
          </div>

          {/* Title */}
          <h1
            className="mb-6"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(32px, 5vw, 56px)",
              fontWeight: 400,
              lineHeight: 1.15,
              color: "#1A1814",
            }}
          >
            {title}
          </h1>

          {/* Author */}
          {post.author_name && (
            <p className="text-lg mb-12" style={{ color: "#8A8580" }}>
              {isRTL ? `מאת ${post.author_name}` : `By ${post.author_name}`}
            </p>
          )}

          {/* Cover Image — full width (max 840px) */}
          {post.cover_image && (
            <div className="rounded-lg overflow-hidden mb-12 mx-auto" style={{ maxWidth: "840px" }}>
              <img
                src={post.cover_image}
                alt={title}
                className="w-full object-cover"
                style={{ aspectRatio: "16/9" }}
              />
            </div>
          )}

          {/* Excerpt */}
          {excerpt && (
            <div
              className="mb-10 mx-auto"
              style={{
                maxWidth: "680px",
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "20px",
                lineHeight: 1.6,
                color: "#5C4A3A",
              }}
            >
              {excerpt}
            </div>
          )}

          {/* Article Body — constrained to 680px */}
          <div className="mx-auto" style={{ maxWidth: "680px" }}>
            {blocks && blocks.length > 0 ? (
              <div>
                {blocks.map((block, index) => (
                  <div key={block.id}>{renderBlock(block, index, blocks)}</div>
                ))}
              </div>
            ) : html ? (
              (() => {
                const processedHtml = html
                  .replace(/<p><\/p>/g, "")
                  .replace(/<p>\s*<\/p>/g, "");
                return (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(processedHtml, {
                        ALLOWED_TAGS: [
                          "p", "br", "strong", "em", "u", "h1", "h2", "h3", "h4", "h5", "h6",
                          "ul", "ol", "li", "a", "blockquote", "img", "pre", "code", "span", "div",
                        ],
                        ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "title", "class", "style"],
                      }),
                    }}
                    style={{ fontSize: "17px", lineHeight: 1.8, color: "#2C2825" }}
                  />
                );
              })()
            ) : null}
          </div>

          {/* End-of-Article CTA */}
          <div className="mx-auto mt-16 pt-8" style={{ maxWidth: "680px" }}>
            <div className="text-center mb-2" style={{ color: "#B8935A", letterSpacing: "0.3em", fontSize: "14px" }}>
              — ✦ —
            </div>
            <div className="text-center py-8">
              <h3
                className="mb-3"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "28px",
                  fontWeight: 400,
                  color: "#1A1814",
                }}
              >
                Ready to experience it?
              </h3>
              <p className="mb-6" style={{ fontSize: "15px", color: "#8A8580" }}>
                Discover our handpicked escapes across Israel.
              </p>
              <Link
                to="/experiences"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: "#1A1814", borderRadius: 0 }}
              >
                Explore experiences <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </article>

        {/* Related Articles */}
        {relatedPosts && relatedPosts.length > 0 && (
          <div className="mt-16 pt-8 border-t" style={{ borderColor: "#E8E0D4" }}>
            <h3
              className="mb-8"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "24px",
                fontWeight: 400,
                color: "#1A1814",
              }}
            >
              More from the Journal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedPosts.slice(0, 2).map((rp: any) => (
                <Link key={rp.id} to={`/journal/${rp.slug}`} className="group">
                  <div className="rounded-xl overflow-hidden mb-3">
                    <img
                      src={rp.cover_image || "/placeholder.svg"}
                      alt={getLocalizedField(rp, "title", lang) || rp.title_en}
                      className="w-full aspect-[16/10] object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <span className="inline-block px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.1em] rounded-full bg-[#E8E0D4] text-[#1A1814] mb-2">
                    {rp.category}
                  </span>
                  <h4 className="font-serif text-lg group-hover:text-primary transition-colors line-clamp-2">
                    {getLocalizedField(rp, "title", lang) || rp.title_en}
                  </h4>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default JournalPost;
