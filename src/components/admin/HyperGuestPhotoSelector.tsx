/**
 * HyperGuestPhotoSelector — Grid gallery for selecting HyperGuest photos
 * Supports checkbox selection, hero designation, select all/deselect all
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, CheckSquare, XSquare, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HyperGuestPhoto {
  url: string;
  thumbnail: string;
  caption?: string;
}

interface HyperGuestPhotoSelectorProps {
  photos: HyperGuestPhoto[];
  selectedPhotos: string[];
  heroImage: string | null;
  onSelectionChange: (urls: string[]) => void;
  onHeroChange: (url: string) => void;
  isLoading?: boolean;
}

export function HyperGuestPhotoSelector({
  photos,
  selectedPhotos,
  heroImage,
  onSelectionChange,
  onHeroChange,
  isLoading,
}: HyperGuestPhotoSelectorProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [failedThumbs, setFailedThumbs] = useState<Set<string>>(new Set());

  const togglePhoto = (url: string) => {
    if (selectedPhotos.includes(url)) {
      onSelectionChange(selectedPhotos.filter((u) => u !== url));
    } else {
      onSelectionChange([...selectedPhotos, url]);
    }
  };

  const selectAll = () => {
    onSelectionChange(photos.map((p) => p.url));
  };

  const deselectAll = () => {
    onSelectionChange([]);
  };

  if (photos.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            HyperGuest Photos ({photos.length} available)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={selectAll}>
            <CheckSquare className="h-3.5 w-3.5 mr-1" />
            Select All
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={deselectAll}>
            <XSquare className="h-3.5 w-3.5 mr-1" />
            Deselect All
          </Button>
          <span className="text-xs text-muted-foreground ml-2">
            {selectedPhotos.length} selected
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {photos.map((photo, index) => {
          const isSelected = selectedPhotos.includes(photo.url);
          const isHero = heroImage === photo.url;
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={photo.url}
              className={cn(
                "relative aspect-square rounded-md overflow-hidden cursor-pointer transition-all border-2",
                isSelected ? "border-primary" : "border-transparent",
                !isSelected && "opacity-50 hover:opacity-80",
              )}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => togglePhoto(photo.url)}
            >
              <img
                src={failedThumbs.has(photo.thumbnail || photo.url) ? photo.url : (photo.thumbnail || photo.url)}
                alt={photo.caption || `Photo ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  const thumbUrl = photo.thumbnail || photo.url;
                  if (target.src !== photo.url && !failedThumbs.has(thumbUrl)) {
                    setFailedThumbs(prev => new Set(prev).add(thumbUrl));
                    target.src = photo.url;
                  }
                }}
              />

              {/* Hero badge */}
              {isHero && (
                <div className="absolute top-1 left-1 bg-amber-500 text-white rounded-full p-1">
                  <Star className="h-3 w-3 fill-current" />
                </div>
              )}

              {/* Checkbox */}
              <div className="absolute top-1 right-1" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => togglePhoto(photo.url)}
                  className="bg-white/80 backdrop-blur-sm"
                />
              </div>

              {/* Set as Hero button on hover */}
              {isHovered && isSelected && !isHero && (
                <button
                  type="button"
                  className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-[10px] py-1 rounded text-center hover:bg-black/90 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onHeroChange(photo.url);
                  }}
                >
                  ★ Set as Hero
                </button>
              )}
            </div>
          );
        })}
      </div>

      {isLoading && (
        <p className="text-xs text-muted-foreground animate-pulse">Downloading selected images...</p>
      )}
    </div>
  );
}

export default HyperGuestPhotoSelector;
