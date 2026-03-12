import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage, getLocalizedField } from "@/hooks/useLanguage";
import { useCurrency } from "@/contexts/CurrencyContext";
import { t } from "@/lib/translations";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import AuthPromptDialog from "@/components/auth/AuthPromptDialog";
import HeartBurst from "@/components/ui/HeartBurst";
import { useIsMobile } from "@/hooks/use-mobile";
import { trackWishlistClicked, trackExperienceCardClicked } from "@/lib/analytics";

interface HighlightTag {
  id: string;
  slug: string;
  label_en: string;
  label_he?: string | null;
}

interface ExperienceCardProps {
  experience: {
    id: string;
    slug: string;
    title: string;
    title_he?: string | null;
    hero_image?: string | null;
    photos?: string[] | null;
    base_price: number;
    currency?: string | null;
    base_price_type?: string | null;
    hotels?: {
      name: string;
      name_he?: string | null;
      city: string;
      city_he?: string | null;
      region?: string | null;
      region_he?: string | null;
      hero_image?: string | null;
    } | null;
    includes?: string[] | null;
    includes_he?: string[] | null;
    min_nights?: number | null;
    max_nights?: number | null;
    min_party?: number | null;
    max_party?: number | null;
    experience_highlight_tags?: Array<{
      highlight_tags: HighlightTag;
    }> | null;
  };
  badge?: string | null;
  originalPrice?: number | null;
  discountPercent?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  distance?: number | null;
  userCity?: string | null;
  isInWishlist?: boolean;
  onWishlistToggle?: (experienceId: string, isAdding: boolean) => void;
  userId?: string | null;
  linkPrefix?: string;
  linkSuffix?: string;
}

export default function ExperienceCard({
  experience,
  badge,
  originalPrice,
  discountPercent,
  rating = 9.1,
  reviewCount = 14,
  distance,
  userCity,
  isInWishlist: initialIsInWishlist = false,
  onWishlistToggle,
  linkPrefix = "/experience",
  linkSuffix = "",
  index = 0,
}: ExperienceCardProps & { index?: number }) {
  const { lang } = useLanguage();
  const { symbol: currencySymbol } = useCurrency();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [isHovered, setIsHovered] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [animateHeart, setAnimateHeart] = useState(false);

  const title = getLocalizedField(experience, 'title', lang) as string;
  const hotelName = experience.hotels ? (getLocalizedField(experience.hotels, 'name', lang) as string) : '';
  const region = experience.hotels ? (getLocalizedField(experience.hotels, 'region', lang) as string || getLocalizedField(experience.hotels, 'city', lang) as string) : '';

  // Get highlight tags
  const highlightTags = experience.experience_highlight_tags?.map(eht => eht.highlight_tags) || [];

  // Currency symbol from context
  const displaySymbol = currencySymbol;
  // Limit tags on mobile
  const maxTags = isMobile ? 2 : 4;

  // Query wishlist status
  const { data: wishlistStatus } = useQuery({
    queryKey: ["wishlist-status", experience.id, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("wishlist")
        .select("id, deleted_at")
        .eq("user_id", user.id)
        .eq("experience_id", experience.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    initialData: initialIsInWishlist ? { id: '', deleted_at: null } : null,
  });

  const isInWishlist = wishlistStatus && !wishlistStatus.deleted_at;

  // Toggle wishlist mutation
  const wishlistMutation = useMutation({
    mutationFn: async ({ isAdding }: { isAdding: boolean }) => {
      if (!user?.id) {
        throw new Error("Not authenticated");
      }

      if (isAdding) {
        // Check if row exists with soft delete
        if (wishlistStatus?.deleted_at) {
          const { error } = await supabase
            .from("wishlist")
            .update({ deleted_at: null })
            .eq("id", wishlistStatus.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("wishlist")
            .insert({
              user_id: user.id,
              experience_id: experience.id,
            });
          if (error) throw error;
        }
      } else {
        // Soft delete
        const { error } = await supabase
          .from("wishlist")
          .update({ deleted_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("experience_id", experience.id)
          .is("deleted_at", null);
        
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist-status", experience.id, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      
      trackWishlistClicked(experience.slug, variables.isAdding ? "added" : "removed");
      
      if (variables.isAdding) {
        // Trigger animations
        setAnimateHeart(true);
        setShowBurst(true);
        setTimeout(() => setAnimateHeart(false), 400);
        
        // Show success toast
        const messages = {
          en: { title: "Added to favorites", desc: "You can find it in your account" },
          fr: { title: "Ajouté aux favoris", desc: "Retrouvez-le dans votre compte" },
          he: { title: "נוסף למועדפים", desc: "תוכל למצוא אותו בחשבון שלך" },
        };
        const msg = messages[lang] || messages.en;
        toast.success(msg.title, { description: msg.desc });
      } else {
        const removed = lang === 'he' ? 'הוסר מהמועדפים' : lang === 'fr' ? 'Retiré des favoris' : 'Removed from favorites';
        toast.success(removed);
      }
      
      onWishlistToggle?.(experience.id, variables.isAdding);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update wishlist");
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

  // Calculate display price
  const displayPrice = originalPrice && discountPercent 
    ? Math.floor(experience.base_price * (1 - discountPercent / 100))
    : experience.base_price;

  return (
    <>
      <AuthPromptDialog 
        open={authDialogOpen} 
        onOpenChange={setAuthDialogOpen} 
        lang={lang} 
        defaultTab="login" 
      />
      
      <Link
        to={`${linkPrefix}/${experience.slug}?lang=${lang}${linkSuffix ? `&${linkSuffix.replace(/^\?/, '')}` : ''}`}
        className="group block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => trackExperienceCardClicked(experience.slug, title, displayPrice, index)}
      >
        {/* Photo section with title overlay */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl mb-2">
          <img
            src={(experience as any).thumbnail_image || experience.hero_image || experience.photos?.[0] || experience.hotels?.hero_image || '/placeholder.svg'}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Gradient overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Badge - top left */}
          {badge && (
            <div className="absolute top-2.5 left-2.5">
              <span className="inline-block px-2 py-0.5 bg-white/95 backdrop-blur-sm rounded text-foreground text-[10px] font-semibold uppercase tracking-wider">
                {badge === "NEW" ? t(lang, 'badgeNew') : badge === "ON SALE" ? t(lang, 'badgeOnSale') : badge === "POPULAR" ? t(lang, 'badgePopular') : badge}
              </span>
            </div>
          )}
          
          {/* Heart button - top right */}
          <button
            onClick={handleHeartClick}
            disabled={wishlistMutation.isPending}
            className={cn(
              "absolute top-2 right-2 sm:top-2.5 sm:right-2.5 p-1 sm:p-1.5 rounded-full bg-white/20 backdrop-blur-sm transition-all duration-300 hover:bg-white/40",
              isInWishlist ? 'opacity-100' : 'opacity-70 sm:opacity-0 sm:group-hover:opacity-100',
            )}
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              className={cn(
                "h-4 w-4 sm:h-5 sm:w-5 transition-all",
                isInWishlist ? 'fill-destructive text-destructive' : 'text-white',
                animateHeart && 'animate-heart-pop'
              )}
            />
            <HeartBurst trigger={showBurst} onComplete={() => setShowBurst(false)} />
          </button>

          {/* Title on image - bottom left */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="font-sans text-base sm:text-lg md:text-xl font-bold text-white leading-tight line-clamp-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
              {title}
            </h3>
          </div>
        </div>

        {/* Tags - just below the photo */}
        {highlightTags.length > 0 && (
          <div className="flex flex-nowrap gap-1 overflow-hidden px-0.5 -mt-0.5 mb-1">
            {highlightTags.slice(0, maxTags).map((tag) => (
              <span
                key={tag.id}
                className="inline-block whitespace-nowrap px-1.5 py-px bg-muted/60 rounded-full text-[9px] font-normal tracking-wide text-muted-foreground border border-border/40"
              >
                {lang === 'he' && tag.label_he ? tag.label_he : tag.label_en}
              </span>
            ))}
            {highlightTags.length > maxTags && (
              <span className="inline-block whitespace-nowrap px-1 py-px text-[9px] text-muted-foreground">
                +{highlightTags.length - maxTags}
              </span>
            )}
          </div>
        )}

        {/* Metadata below image */}
        <div className="space-y-1 px-0.5">
          {/* Row: City | Region + Rating */}
          <div className="flex items-center justify-between">
            {hotelName ? (
              <p className="text-[11px] sm:text-xs text-muted-foreground tracking-wide truncate">
                {experience.hotels?.city ? (getLocalizedField(experience.hotels, 'city', lang) as string) : ''}{region ? ` | ${region}` : ''}
              </p>
            ) : <span />}
            {rating && (
              <div className="flex items-center gap-0.5 shrink-0">
                <span className="text-foreground text-[11px]">★</span>
                <span className="font-semibold text-[11px] text-foreground">{rating.toFixed(1)}</span>
                {reviewCount != null && reviewCount > 0 && (
                  <span className="text-muted-foreground text-[10px]">({reviewCount})</span>
                )}
              </div>
            )}
          </div>

          {/* Hotel name */}
          {hotelName && (
            <p className="text-xs sm:text-sm font-semibold text-foreground leading-snug line-clamp-1">
              {hotelName}
            </p>
          )}


          {/* Price row */}
          {displayPrice > 0 && (
            <div className="flex items-baseline gap-1 pt-0.5">
              <span className="font-bold text-sm sm:text-base text-foreground">
                {displaySymbol}{displayPrice}
              </span>
              {originalPrice && originalPrice > displayPrice && (
                <span className="text-[11px] text-muted-foreground line-through">
                  {displaySymbol}{originalPrice}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">
                / {lang === 'he' ? 'לילה' : 'night'}
              </span>
              {discountPercent && (
                <span className="inline-block ml-1 px-1.5 py-px bg-accent text-accent-foreground text-[9px] font-medium rounded">
                  -{discountPercent} %
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </>
  );
}
