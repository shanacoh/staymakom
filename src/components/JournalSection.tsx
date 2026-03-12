import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLocalizedField, Language } from "@/hooks/useLanguage";
import { t } from "@/lib/translations";

interface JournalSectionProps {
  lang: Language;
}

const JournalSection = ({ lang }: JournalSectionProps) => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["journal-posts-homepage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_posts")
        .select("*")
        .eq("status", "published")
        .not("published_at", "is", null)
        .order("published_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Stories: "bg-amber-100 text-amber-800",
      Places: "bg-emerald-100 text-emerald-800",
      Guides: "bg-blue-100 text-blue-800",
      People: "bg-purple-100 text-purple-800",
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  const getCategoryLabel = (category: string) => {
    if (lang === 'he') {
      const hebrewLabels: Record<string, string> = {
        Stories: "סיפורים",
        Places: "מקומות",
        Guides: "מדריכים",
        People: "אנשים",
      };
      return hebrewLabels[category] || category;
    }
    return category;
  };

  if (isLoading) {
    return (
      <section className="container py-6 sm:py-8 px-4">
        <div className="text-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
        </div>
      </section>
    );
  }

  if (!posts || posts.length === 0) {
    return null;
  }

  const [featuredPost, ...sidePosts] = posts;

  const isRTL = lang === 'he';

  return (
    <section className="bg-muted/30 py-6 sm:py-8">
      <div className="container px-4" dir="ltr">
        {/* Section Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-sans text-lg sm:text-xl font-bold tracking-tight uppercase">
            {t(lang, 'journalTitle')}
          </h2>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="group text-foreground hover:text-primary text-xs"
          >
            <Link to={`/journal${lang === "he" ? "?lang=he" : ""}`}>
              {t(lang, 'journalViewAll')}
              <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {/* Editorial Layout */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Featured Article (Left) */}
          <Link
            to={`/journal/${featuredPost.slug}${lang === "he" ? "?lang=he" : ""}`}
            className="md:col-span-3 group relative overflow-hidden rounded-lg"
          >
            <div className="aspect-[16/9] overflow-hidden">
              {featuredPost.cover_image ? (
                <img
                  src={featuredPost.cover_image}
                  alt={getLocalizedField(featuredPost, "title", lang) as string}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50" />
              )}
            </div>
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
              <span
                className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded mb-1.5 ${getCategoryColor(
                  featuredPost.category
                )}`}
              >
                {getCategoryLabel(featuredPost.category)}
              </span>
              <h3 className="text-white font-semibold text-sm sm:text-base line-clamp-2">
                {getLocalizedField(featuredPost, "title", lang) as string}
              </h3>
            </div>
          </Link>

          {/* Side Stack (Right) */}
          <div className="md:col-span-2 flex flex-col gap-2">
            {sidePosts.map((post) => (
              <Link
                key={post.id}
                to={`/journal/${post.slug}${lang === "he" ? "?lang=he" : ""}`}
                className="group relative overflow-hidden rounded-lg flex-1 min-h-[120px]"
              >
                {/* Background Image */}
                {post.cover_image ? (
                  <img
                    src={post.cover_image}
                    alt={getLocalizedField(post, "title", lang) as string}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-muted to-muted/50" />
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <span
                    className={`inline-block px-1.5 py-0.5 text-[9px] font-medium rounded mb-1 ${getCategoryColor(
                      post.category
                    )}`}
                  >
                    {getCategoryLabel(post.category)}
                  </span>
                  <h3 className="text-white font-medium text-xs sm:text-sm line-clamp-2">
                    {getLocalizedField(post, "title", lang) as string}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default JournalSection;
