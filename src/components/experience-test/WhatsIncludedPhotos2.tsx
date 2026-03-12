import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { icons, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import DOMPurify from "dompurify";

interface WhatsIncludedPhotos2Props {
  experienceId: string;
  lang?: string;
  longCopy?: string;
}

const WhatsIncludedPhotos2 = ({ experienceId, lang = "en", longCopy }: WhatsIncludedPhotos2Props) => {
  const { data: includes } = useQuery({
    queryKey: ["experience2-includes", experienceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experience2_includes")
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
        <h2 className="font-serif text-xl md:text-2xl font-medium text-foreground mb-3">
          {lang === "he" ? "מה בתכנית" : lang === "fr" ? "Au programme" : "What's on the program"}
        </h2>
        <div
          className="text-xs md:text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(longCopy) }}
        />
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
      <h2 className="font-serif text-xl md:text-2xl font-medium text-foreground mb-3">{heading}</h2>
      {longCopy && (
        <div
          className="text-xs md:text-sm text-muted-foreground leading-relaxed mb-6 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(longCopy) }}
        />
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {includes.map((item) => {
          const title = lang === "he" ? item.title_he || item.title : item.title;
          const description =
            lang === "he" ? item.description_he || item.description : item.description;
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
                <h3 className="font-semibold text-[11px] sm:text-xs leading-tight line-clamp-2 h-7 sm:h-8">
                  {title}
                </h3>
                {description && (
                  <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
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
