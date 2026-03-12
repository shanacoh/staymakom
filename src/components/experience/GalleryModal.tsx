import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

interface GalleryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: string[];
  title: string;
  initialIndex?: number;
}

const GalleryModal = ({
  open,
  onOpenChange,
  photos,
  title,
  initialIndex = 0,
}: GalleryModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    startIndex: initialIndex,
  });

  // Update current index when carousel scrolls
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  // Initialize carousel listeners
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Scroll to initial index when modal opens
  useEffect(() => {
    if (open && emblaApi) {
      emblaApi.scrollTo(initialIndex, true);
      setCurrentIndex(initialIndex);
    }
  }, [open, emblaApi, initialIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      } else if (e.key === "ArrowLeft") {
        emblaApi?.scrollPrev();
      } else if (e.key === "ArrowRight") {
        emblaApi?.scrollNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange, emblaApi]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  if (!open || photos.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-4 bg-black/80">
        <span className="text-white text-sm font-medium">
          {currentIndex + 1} / {photos.length}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="text-white hover:bg-white/10 h-10 w-10"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Carousel Container */}
      <div className="flex-1 relative overflow-hidden" ref={emblaRef}>
        <div className="flex h-full">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="flex-[0_0_100%] min-w-0 h-full flex items-center justify-center p-4"
            >
              <img
                src={photo}
                alt={`${title} - Photo ${index + 1}`}
                className="max-h-full max-w-full object-contain"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
            aria-label="Photo précédente"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
            aria-label="Photo suivante"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}
    </div>,
    document.body
  );
};

export default GalleryModal;
