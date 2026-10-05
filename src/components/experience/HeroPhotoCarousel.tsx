import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { resizedImageUrl } from "@/lib/imageUrl";
import { cn } from "@/lib/utils";

interface HeroPhotoCarouselProps {
  /** Couverture puis galerie, dans l'ordre d'affichage. */
  photos: string[];
  title: string;
  lang: "en" | "he" | "fr";
  /** "desktop" = flèches + zoom au survol ; "mobile" = glisser au doigt uniquement. */
  variant: "mobile" | "desktop";
  /** Clic sur la photo ou sur le compteur : ouvre la galerie plein écran sur cette photo. */
  onOpenGallery: (index: number) => void;
  /** Appelé quand le visiteur fait défiler jusqu'à une autre photo. */
  onPhotoViewed?: (index: number) => void;
  /** Taille, proportions et arrondi du cadre : décidés par le parent. */
  className?: string;
}

const IMAGE_SIZE = {
  mobile: { width: 900, quality: undefined },
  desktop: { width: 1400, quality: 80 },
} as const;

const HeroPhotoCarousel = ({
  photos,
  title,
  lang,
  variant,
  onOpenGallery,
  onPhotoViewed,
  className,
}: HeroPhotoCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { width, quality } = IMAGE_SIZE[variant];
  const isDesktop = variant === "desktop";

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      const index = emblaApi.selectedScrollSnap();
      setSelectedIndex(index);
      onPhotoViewed?.(index);
    };
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onPhotoViewed]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  // Une seule photo : ni flèches ni compteur, simple image cliquable comme avant.
  if (photos.length <= 1) {
    return (
      <div
        className={cn("relative overflow-hidden cursor-pointer", className)}
        onClick={() => onOpenGallery(0)}
      >
        <img
          src={resizedImageUrl(photos[0], width, quality) || "/placeholder.svg"}
          alt={title}
          className={cn(
            "w-full h-full object-cover",
            isDesktop && "transition-transform duration-300 hover:scale-105"
          )}
        />
      </div>
    );
  }

  const seeAllLabel = lang === "he" ? "הצג הכל" : lang === "fr" ? "Voir tout" : "View all";
  const arrowClass =
    "absolute top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-white text-foreground shadow-[0_2px_8px_rgba(0,0,0,0.12)] flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity";

  return (
    // dir="ltr" : le sens de défilement des photos reste le même en hébreu.
    <div
      dir="ltr"
      className={cn("relative overflow-hidden", className)}
      role="region"
      aria-roledescription="carousel"
      aria-label={title}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") { e.preventDefault(); scrollPrev(); }
        else if (e.key === "ArrowRight") { e.preventDefault(); scrollNext(); }
      }}
    >
      <div ref={emblaRef} className="h-full overflow-hidden">
        <div className="flex h-full">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="flex-[0_0_100%] min-w-0 h-full cursor-pointer"
              onClick={() => onOpenGallery(index)}
            >
              <img
                src={resizedImageUrl(photo, width, quality) || "/placeholder.svg"}
                alt={`${title} - ${index + 1}`}
                loading={index === 0 ? undefined : "lazy"}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {isDesktop && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            className={cn(arrowClass, "left-3")}
            aria-label={lang === "he" ? "התמונה הקודמת" : lang === "fr" ? "Photo précédente" : "Previous photo"}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            className={cn(arrowClass, "right-3")}
            aria-label={lang === "he" ? "התמונה הבאה" : lang === "fr" ? "Photo suivante" : "Next photo"}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Compteur « 1 / 9 · Voir tout » : ouvre la galerie plein écran */}
      <button
        type="button"
        onClick={() => onOpenGallery(selectedIndex)}
        className="absolute bottom-3 right-3 z-10 rounded-lg bg-black/55 hover:bg-black/70 text-white text-xs px-2.5 py-1 transition-colors"
      >
        {selectedIndex + 1} / {photos.length} · {seeAllLabel}
      </button>
    </div>
  );
};

export default HeroPhotoCarousel;
