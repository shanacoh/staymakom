import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Share, Heart, Sparkles, Users, Leaf, Wine, Zap, Laptop, Brain, Mountain, Utensils, Plane, Camera, Music, Book, Coffee, Sun, Moon, Compass, Map, Globe, Briefcase, Award, Gift, Gem, Crown, Shield, Flame, Droplet, Wind, Cloud, TreePine, Flower2, type LucideIcon } from "lucide-react";
import { Grid3X3 } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  heart: Heart, users: Users, sparkles: Sparkles, leaf: Leaf, wine: Wine,
  zap: Zap, laptop: Laptop, brain: Brain, mountain: Mountain, utensils: Utensils,
  plane: Plane, camera: Camera, music: Music, book: Book, coffee: Coffee,
  sun: Sun, moon: Moon, star: Star, compass: Compass, map: Map, globe: Globe,
  briefcase: Briefcase, award: Award, gift: Gift, gem: Gem, crown: Crown,
  shield: Shield, flame: Flame, droplet: Droplet, wind: Wind, cloud: Cloud,
  "tree-pine": TreePine, flower: Flower2,
};

function getCategoryImage(slug?: string): string | null {
  if (!slug) return null;
  const s = slug.toLowerCase();
  if (s.includes("romantic"))                                      return "/icons/icon-romantic.png";
  if (s.includes("family"))                                        return "/icons/icon-family.png";
  if (s.includes("taste") || s.includes("food") || s.includes("culinar") || s.includes("foody")) return "/icons/icon-foody.png";
  if (s.includes("land") || s.includes("stories"))                return "/icons/icon-stories.png";
  if (s.includes("nature") || s.includes("beyond") || s.includes("outdoor")) return "/icons/icon-nature.png";
  if (s.includes("mindful"))                                       return "/icons/icon-mindful.png";
  if (s.includes("solo"))                                          return "/icons/icon-solo.png";
  if (s.includes("sporty"))                                        return "/icons/icon-sporty.png";
  return null;
}
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import GalleryModal from "@/components/experience/GalleryModal";
import ShareDialog from "@/components/experience/ShareDialog";
import { useLocalizedNavigation } from "@/hooks/useLocalizedNavigation";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import AuthPromptDialog from "@/components/auth/AuthPromptDialog";
import HeartBurst from "@/components/ui/HeartBurst";
import LocationPopover from "@/components/experience/LocationPopover";
import { trackPhotoGalleryClicked } from "@/lib/analytics";

interface Review {
  id: string;
  text: string;
  rating: number;
  created_at: string;
}

interface HeroSectionProps {
  photos: string[];
  title: string;
  subtitle?: string;
  hotelName?: string;
  hotelImage?: string;
  city?: string;
  region?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  averageRating?: number | null;
  reviewsCount?: number;
  reviews?: Review[];
  basePrice?: number;
  basePriceType?: string;
  currency?: string;
  lang: 'en' | 'he' | 'fr';
  onViewDates?: () => void;
  onScrollToReviews?: () => void;
  experienceId?: string;
  hotelId?: string;
  minParty?: number;
  maxParty?: number;
  categoryName?: string;
  categorySlug?: string;
  categoryIcon?: string;
  slug?: string;
}

const HeroSection = ({ 
  photos, 
  title, 
  subtitle,
  hotelName,
  hotelImage,
  city,
  region,
  address,
  latitude,
  longitude,
  averageRating,
  reviewsCount = 0,
  reviews = [],
  basePrice,
  basePriceType = 'per_person',
  currency = 'EUR',
  lang,
  onViewDates,
  onScrollToReviews,
  experienceId,
  hotelId,
  minParty = 2,
  maxParty = 4,
  categoryName,
  categorySlug,
  categoryIcon,
  slug,
}: HeroSectionProps) => {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [animateHeart, setAnimateHeart] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { getLocalizedPath } = useLocalizedNavigation();
  const [searchParams] = useSearchParams();
  const isLaunch = searchParams.get("context") === "launch";

  const displayPhotos = photos.slice(0, 4);

  const handleShare = async () => {
    const url = window.location.href;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }
    try { await navigator.clipboard.writeText(url); } catch {}
    setShareDialogOpen(true);
  };

  // Wishlist functionality
  const { data: wishlistStatus } = useQuery({
    queryKey: ["wishlist-status", experienceId, user?.id],
    queryFn: async () => {
      if (!user?.id || !experienceId) return null;
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
      if (!user?.id || !experienceId) throw new Error("Not authenticated");
      if (isAdding) {
        if (wishlistStatus?.deleted_at) {
          const { error } = await supabase.from("wishlist").update({ deleted_at: null }).eq("id", wishlistStatus.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("wishlist").insert({ user_id: user.id, experience_id: experienceId });
          if (error) throw error;
        }
      } else {
        const { error } = await supabase.from("wishlist").update({ deleted_at: new Date().toISOString() }).eq("user_id", user.id).eq("experience_id", experienceId);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist-status", experienceId, user?.id] });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      if (variables.isAdding) {
        setAnimateHeart(true);
        setShowBurst(true);
        setTimeout(() => setAnimateHeart(false), 400);
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
    },
  });

  const handleFavorite = () => {
    if (!user) { setAuthDialogOpen(true); return; }
    wishlistMutation.mutate({ isAdding: !isInWishlist });
  };

  // Curated badge or rating display
  const renderSocialProof = () => {
    if (averageRating && reviewsCount > 0) {
      return (
        <div className="flex items-center gap-1.5 text-sm">
          <Star className="h-3.5 w-3.5 fill-foreground text-foreground" />
          <span className="font-medium">{averageRating.toFixed(1)}</span>
          <span className="text-muted-foreground">·</span>
          <button 
            onClick={onScrollToReviews}
            className="text-muted-foreground underline hover:text-foreground transition-colors"
          >
            {reviewsCount} {lang === 'he' ? 'ביקורות' : lang === 'en' ? 'reviews' : 'avis'}
          </button>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-xs text-cta-foreground/60 uppercase tracking-wider font-medium">
        <Sparkles className="h-3.5 w-3.5" />
        <span>{lang === 'he' ? 'נבחר ע״י STAYMAKOM' : 'Curated by STAYMAKOM'}</span>
      </div>
    );
  };

  // Header info block (reusable for mobile & desktop)
  const renderHeaderBlock = (isMobile: boolean) => (
    <div className={cn(isMobile ? "space-y-4" : "space-y-3", "text-center")}>
      {/* 1. Category tag — gold, uppercase */}
      {categoryName && categorySlug && (() => {
        const catImg = getCategoryImage(categorySlug);
        const FallbackIcon = categoryIcon ? CATEGORY_ICONS[categoryIcon] : null;
        return (
          <Link
            to={isLaunch
              ? `/launch/experiences?filter=${categorySlug === 'romantic' ? 'romantic' : 'adventure'}`
              : getLocalizedPath(`/category/${categorySlug}`)
            }
            className="inline-flex flex-col items-center gap-1 group/catlink"
          >
            {catImg ? (
              <div
                className="h-7 w-7 flex-shrink-0 transition-all duration-300 opacity-75 group-hover/catlink:opacity-100 group-hover/catlink:scale-110 group-hover/catlink:-translate-y-0.5"
                style={{
                  backgroundColor: 'hsl(var(--cta-foreground))',
                  maskImage: `url(${catImg})`,
                  WebkitMaskImage: `url(${catImg})`,
                  maskSize: 'contain',
                  WebkitMaskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskPosition: 'center',
                }}
              />
            ) : FallbackIcon ? (
              <FallbackIcon className="h-4 w-4 text-muted-foreground/60 group-hover/catlink:text-muted-foreground transition-colors" />
            ) : null}
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-cta-foreground/80 group-hover/catlink:text-cta-foreground transition-colors">
              {categoryName}
            </span>
          </Link>
        );
      })()}
      
      {/* 2. Title — Inter bold */}
      <h1 className={cn(
        "font-sans font-bold text-foreground leading-tight",
        isMobile ? "text-2xl pt-1" : "text-3xl xl:text-4xl"
      )}>
        {title}
      </h1>

      {/* 3. Subtitle — italic, muted */}
      {subtitle && (
         <p className={cn(
           "text-muted-foreground leading-relaxed break-words",
           isMobile ? "text-[15px]" : "text-sm"
         )}>
          {subtitle}
        </p>
      )}

      {/* 4. Rating or Curated badge */}
      <div className={cn("flex items-center gap-2", isMobile ? "justify-center" : "justify-center")}>
        {renderSocialProof()}
      </div>

      {/* 5. Share + Wishlist — inline */}
      <div className={cn("flex items-center gap-2", isMobile ? "justify-center" : "justify-center")}>
        <button 
          onClick={handleShare}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors" 
          aria-label="Share"
        >
          <Share className="h-4 w-4" />
        </button>
        <button 
          onClick={handleFavorite}
          className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors" 
          aria-label="Save"
        >
          <Heart className={cn(
            "h-4 w-4 transition-all",
            isInWishlist && "fill-rose-500 text-rose-500",
            animateHeart && "animate-heart-pop"
          )} />
          <HeartBurst trigger={showBurst} onComplete={() => setShowBurst(false)} />
        </button>
      </div>

      {/* 6. Hotel with "Hosted at" prefix */}
      {hotelName && (
        <div className={cn("flex items-center gap-3.5 pt-1 mt-1", isMobile ? "justify-center" : "justify-center")}>
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground overflow-hidden flex-shrink-0">
            {hotelImage ? (
              <img src={hotelImage} alt={hotelName} className="w-full h-full object-cover" />
            ) : (
              hotelName.charAt(0)
            )}
          </div>
          <div className={isMobile ? "text-center" : ""}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {lang === 'he' ? 'מתארחים ב' : 'Hosted at'}
            </p>
            <p className="text-sm font-medium text-foreground break-words">{hotelName}</p>
            <LocationPopover
              city={city}
              region={region}
              hotelName={hotelName}
              latitude={latitude}
              longitude={longitude}
              lang={lang}
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <AuthPromptDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} lang={lang} defaultTab="login" />
      <div className="pt-16 md:pt-18">
        {/* Fil d'Ariane — même composant partagé que les fiches hôtel et catégorie */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 py-3">
          <Breadcrumb>
            <BreadcrumbList className="flex-nowrap">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={isLaunch ? "/launch" : getLocalizedPath("/")}>
                    {lang === 'he' ? 'בית' : lang === 'fr' ? 'Accueil' : 'Home'}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {categoryName && categorySlug && (
                <>
                  <BreadcrumbSeparator className={cn(lang === 'he' && "[&>svg]:rotate-180")} />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link
                        to={isLaunch
                          ? `/launch/experiences?filter=${categorySlug === 'romantic' ? 'romantic' : 'adventure'}`
                          : getLocalizedPath(`/category/${categorySlug}`)
                        }
                      >
                        {categoryName}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator className={cn(lang === 'he' && "[&>svg]:rotate-180")} />
              <BreadcrumbItem className="min-w-0 flex-1">
                <BreadcrumbPage className="truncate block">{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* MOBILE: Full-width carousel */}
        <div className="block md:hidden">
          <div className="px-4 pt-2">
            <div className="relative">
              <Carousel 
                className="w-full"
                opts={{ loop: true }}
                setApi={(api) => {
                  api?.on("select", () => {
                    setCarouselIndex(api.selectedScrollSnap());
                  });
                }}
              >
                <CarouselContent>
                  {photos.slice(0, 8).map((photo, index) => (
                    <CarouselItem key={index}>
                      <div 
                        className="aspect-[4/3] w-full cursor-pointer rounded-2xl overflow-hidden"
                        onClick={() => { trackPhotoGalleryClicked(title); setIsGalleryOpen(true); }}
                      >
                        <img
                          src={photo || "/placeholder.svg"}
                          alt={`${title} - ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
              
              {/* Dots indicator */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {photos.slice(0, 8).map((_, index) => (
                  <div 
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === carouselIndex ? 'bg-white' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>

              {/* Photo counter */}
              <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
                {carouselIndex + 1} / {Math.min(photos.length, 8)}
              </div>
            </div>
          </div>

          {/* Mobile: Header block below photos */}
          <div className="px-4 pt-5">
            {renderHeaderBlock(true)}
          </div>
        </div>

        {/* DESKTOP: 2-column layout */}
        <div className="hidden md:block max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-16">
          <div className="grid grid-cols-[65fr_35fr] gap-4 md:gap-6 xl:gap-8 items-center">
            {/* LEFT: Single large photo */}
            <div className="relative h-[calc(100vh-12rem)]">
              <div 
                className="relative w-full h-full rounded-xl overflow-hidden cursor-pointer"
                onClick={() => { trackPhotoGalleryClicked(title); setCurrentPhotoIndex(0); setIsGalleryOpen(true); }}
              >
                <img
                  src={photos[0] || "/placeholder.svg"}
                  alt={title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                {photos.length > 1 && (
                  <button
                    className="absolute bottom-4 right-4 z-10 px-3 py-2 rounded-lg bg-white/90 hover:bg-white shadow-md transition-all flex items-center gap-2"
                    onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(0); setIsGalleryOpen(true); }}
                  >
                    <Grid3X3 className="h-4 w-4 text-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {lang === 'he' ? `הצג את כל ${photos.length} התמונות` : `View all ${photos.length} photos`}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT: Header block */}
            <div className="flex flex-col justify-center items-center h-[calc(100vh-12rem)]">
              {renderHeaderBlock(false)}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      <GalleryModal
        open={isGalleryOpen}
        onOpenChange={setIsGalleryOpen}
        photos={photos}
        title={title}
        initialIndex={carouselIndex}
        slug={slug}
      />

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        url={window.location.href}
        title={title}
        lang={lang}
      />
    </>
  );
};

export default HeroSection;
