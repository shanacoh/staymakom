import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { icons, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import DOMPurify from "dompurify";

interface WhatsIncludedPhotos2Props {
  experienceId: string;
  lang?: string;
  longCopy?: string;
  source?: "experience2" | "standalone";
}

const WhatsIncludedPhotos2 = ({ experienceId, lang = "en", longCopy, source = "experience2" }: WhatsIncludedPhotos2Props) => {
  const table = source === "standalone" ? "standalone_experience_includes" : "experience2_includes";

  const { data: includes } = useQuery({
    queryKey: ["experience-includes", experienceId, source],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from(table)
        .select("*")
        .eq("experience_id", experienceId)
        .eq("published", true)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  if (!includes || includes.length === 0) {
    if (!longCopy) return null;
    return (
      <section className="py-6 border-b border-border" dir={lang === "he" ? "rtl" : "ltr"}>
        <h2 className="font-serif text-xl md:text-2xl font-medium text-foreground mb-3 break-words">
          {lang === "he" ? "מה בתכנית" : lang === "fr" ? "Au programme" : "What's on the program"}
        </h2>
        <div className="w-full overflow-hidden">
          <div
            className="prose prose-sm max-w-none break-words prose-p:text-muted-foreground prose-headings:text-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(longCopy) }}
          />
        </div>
      </section>
    );
  }

  const heading =
    lang === "he" ? "מה בתכנית" : lang === "fr" ? "Au programme" : "What's on the program";

  const isImageUrl = (url?: string | null): boolean =>
    !!url && (url.startsWith("http://") || url.startsWith("https://"));

  const getIconComponent = (iconName?: string | null): LucideIcon => {
    if (!iconName || isImageUrl(iconName)) return Sparkles;
    const IconComponent = icons[iconName as keyof typeof icons];
    return (IconComponent as LucideIcon) || Sparkles;
  };

  return (
    <section className="py-6 border-b border-border" dir={lang === "he" ? "rtl" : "ltr"}>
      <h2 className="font-serif text-xl md:text-2xl font-medium text-foreground mb-3 break-words">{heading}</h2>
      {longCopy && (
        <div className="w-full overflow-hidden mb-6">
          <div
            className="prose prose-sm max-w-none break-words prose-p:text-muted-foreground prose-headings:text-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(longCopy) }}
          />
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {includes.map((item) => {
          const title = lang === "he" ? item.title_he || item.title : lang === "fr" ? (item as any).title_fr || item.title : item.title;
          const description =
            lang === "he" ? item.description_he || item.description : lang === "fr" ? (item as any).description_fr || item.description : item.description;
          const hasImageUrl = isImageUrl(item.icon_url);
          const IconComponent = getIconComponent(item.icon_url);

          return (
            <div key={item.id} className="group flex flex-col">
              <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden flex items-center justify-center mb-2">
                {hasImageUrl ? (
                  <img
                    src={item.icon_url!}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <IconComponent className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-primary" />
                )}
              </div>
              <div className="flex flex-col flex-1">
                <h3 className="font-semibold text-xs sm:text-sm leading-tight line-clamp-2 h-8 sm:h-9">
                  {title}
                </h3>
                {description && (
                  <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default WhatsIncludedPhotos2;
