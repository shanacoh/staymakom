import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Loader2, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecommendedJournalProps {
  userId?: string;
  limit?: number;
}

export default function RecommendedJournal({ userId, limit = 3 }: RecommendedJournalProps) {
  const navigate = useNavigate();

  // Fetch latest published journal posts
  const { data: posts, isLoading } = useQuery({
    queryKey: ["recommended-journal", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_posts")
        .select("id, slug, title_en, excerpt_en, cover_image, category, published_at")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 pt-8 border-t border-border/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-accent" />
          <h3 className="font-serif text-xl text-foreground">From the Journal</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/journal")} className="gap-1">
          View all
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <article
            key={post.id}
            onClick={() => navigate(`/journal/${post.slug}`)}
            className="group cursor-pointer"
          >
            <div className="relative aspect-[16/10] rounded-xl overflow-hidden mb-3">
              <img
                src={post.cover_image || "/placeholder.svg"}
                alt={post.title_en}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            <span className="text-xs font-medium text-accent uppercase tracking-wider">
              {post.category}
            </span>

            <h4 className="font-serif text-lg text-foreground mt-1 mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {post.title_en}
            </h4>

            {post.excerpt_en && (
              <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt_en}</p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
