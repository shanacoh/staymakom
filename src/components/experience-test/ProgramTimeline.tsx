import { getLocalizedField, type Language } from "@/hooks/useLanguage";
import { icons, Sparkles } from "lucide-react";
import DOMPurify from "dompurify";
import type { LucideIcon } from "lucide-react";

interface IncludeItem {
  id: string;
  title: string;
  title_he?: string;
  description?: string;
  description_he?: string;
  icon_url?: string;
  order_index: number;
}

interface ProgramTimelineProps {
  includes: IncludeItem[];
  lang?: Language;
  introText?: string;
}

const ProgramTimeline = ({ includes, lang = "en", introText }: ProgramTimelineProps) => {
  if (!includes || includes.length === 0) return null;

  const sortedIncludes = [...includes].sort((a, b) => a.order_index - b.order_index);

  const isImageUrl = (url?: string | null): boolean => {
    return !!url && (url.startsWith('http://') || url.startsWith('https://'));
  };

  const getIconComponent = (iconName?: string | null): LucideIcon => {
    if (!iconName || isImageUrl(iconName)) return Sparkles;
    const IconComponent = icons[iconName as keyof typeof icons];
    return (IconComponent as LucideIcon) || Sparkles;
  };

  return (
    <section className="py-6 border-b border-border" dir={lang === 'he' ? 'rtl' : 'ltr'}>
      <h2 className="font-serif text-xl md:text-2xl font-medium text-foreground mb-3">
        {lang === "he" ? "מה בתכנית" : lang === "fr" ? "Au programme" : "What's on the program"}
      </h2>

      {/* Introduction text */}
      {introText && (
        <div 
          className="text-xs md:text-sm text-muted-foreground leading-relaxed mb-6 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(introText) }}
        />
      )}

      {/* Grid layout - 4 columns like original WhatsIncludedPhotos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {sortedIncludes.map((item) => {
          const title = getLocalizedField(item, "title", lang) as string || item.title;
          const description = getLocalizedField(item, "description", lang) as string || item.description;
          const hasImageUrl = isImageUrl(item.icon_url);
          const IconComponent = getIconComponent(item.icon_url);

          return (
            <div key={item.id} className="group flex flex-col">
              {/* Image or Icon Container */}
              <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden flex items-center justify-center mb-3">
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
              
              {/* Content Container */}
              <div className="flex flex-col flex-1">
                {/* Title - Fixed 2-line height */}
                <h3 className="font-semibold text-[11px] sm:text-xs leading-tight line-clamp-2 h-7 sm:h-8">
                  {title}
                </h3>
                
                {/* Description */}
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

export default ProgramTimeline;
