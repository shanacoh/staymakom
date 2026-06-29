import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import V3Header from "@/components/V3Header";
import LaunchFooter from "@/components/LaunchFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useLanguage, getLocalizedField } from "@/hooks/useLanguage";

const Journal = () => {
  const { lang } = useLanguage();
  const { data: posts, isLoading } = useQuery({
    queryKey: ["journal-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_posts" as any)
        .select("*")
        .eq("status", "published")
        .not("published_at", "is", null)
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  const featuredPost = posts?.[0];
  const remainingPosts = posts?.slice(1);

  return (
    <div className="min-h-screen bg-white">
      <V3Header />

      <main className="max-w-6xl mx-auto px-6 py-12 pt-24">
        <div className="text-center mb-10">
          <h1 className="font-sans text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Journal</h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
            Stories, places, and insights from extraordinary stays across Israel
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-12">
            {/* Hero card skeleton — mirrors the featured post layout */}
            <div className="relative rounded-xl overflow-hidden" style={{ height: "420px" }}>
              <Skeleton className="w-full h-full" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-9 w-3/4" />
                <Skeleton className="h-9 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            {/* Grid skeleton — mirrors the remaining posts */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="overflow-hidden border-0 bg-white">
                  <div className="aspect-[4/3] overflow-hidden">
                    <Skeleton className="w-full h-full" />
                  </div>
                  <CardContent className="p-5 space-y-2">
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-4/5" />
                    <Skeleton className="h-3 w-full mt-1" />
                    <Skeleton className="h-3 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-12">
            {/* Featured Article — Hero Card */}
            {featuredPost && (
              <Link to={`/journal/${featuredPost.slug}`} className="block group">
                <div className="relative rounded-xl overflow-hidden" style={{ height: "420px" }}>
                  <img
                    src={featuredPost.cover_image || "/placeholder.svg"}
                    alt={getLocalizedField(featuredPost, "title", lang) || featuredPost.title_en}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ aspectRatio: "16/9" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="inline-block px-3 py-1 text-[11px] font-medium uppercase tracking-[0.1em] rounded-full bg-muted text-foreground">
                        {featuredPost.category}
                      </span>
                      {featuredPost.published_at && (
                        <span className="text-xs text-white/80 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(featuredPost.published_at), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                    <h2
                      className="text-white mb-3 line-clamp-2"
                      style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "36px", fontWeight: 500, lineHeight: 1.2 }}
                    >
                      {getLocalizedField(featuredPost, "title", lang) || featuredPost.title_en}
                    </h2>
                    {(getLocalizedField(featuredPost, "excerpt", lang) || featuredPost.excerpt_en) && (
                      <p className="text-white/80 text-sm line-clamp-2 max-w-2xl mb-4">
                        {getLocalizedField(featuredPost, "excerpt", lang) || featuredPost.excerpt_en}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-1 text-[#ad1414] text-sm font-medium group-hover:gap-2 transition-all">
                      Read the story <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* Remaining Articles Grid */}
            {remainingPosts && remainingPosts.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {remainingPosts.map((post) => (
                  <Link key={post.id} to={`/journal/${post.slug}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full border-0 bg-white">
                      {post.cover_image && (
                        <div className="aspect-[4/3] overflow-hidden">
                          <img
                            src={post.cover_image}
                            alt={getLocalizedField(post, "title", lang) || post.title_en}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-block px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.1em] rounded-full bg-muted text-foreground">
                            {post.category}
                          </span>
                          {post.published_at && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(post.published_at), "MMM d, yyyy")}
                            </div>
                          )}
                        </div>
                        <h3 className="font-serif text-lg mb-1 line-clamp-2">
                          {getLocalizedField(post, "title", lang) || post.title_en}
                        </h3>
                        {(getLocalizedField(post, "excerpt", lang) || post.excerpt_en) && (
                          <p className="text-sm text-muted-foreground line-clamp-2" style={{ lineHeight: 1.5 }}>
                            {getLocalizedField(post, "excerpt", lang) || post.excerpt_en}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-base text-muted-foreground">
              No articles published yet. Check back soon!
            </p>
          </div>
        )}
      </main>

      <LaunchFooter />
    </div>
  );
};

export default Journal;
