import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Wifi, Car, Coffee, UtensilsCrossed, Waves, TreePine, Clock, DoorOpen, Hotel as HotelIcon } from "lucide-react";
import { getLocalizedField, type Language } from "@/hooks/useLanguage";
import LocationPopover from "@/components/experience/LocationPopover";

interface Hotel {
  id: string;
  name: string;
  name_he?: string;
  slug: string;
  story?: string;
  story_he?: string;
  hero_image?: string;
  photos?: string[];
  city?: string;
  city_he?: string;
  region?: string;
  region_he?: string;
  amenities?: string[];
  highlights?: string[];
  highlights_he?: string[];
  star_rating?: number;
  check_in_time?: string;
  check_out_time?: string;
  number_of_rooms?: number;
  property_type?: string;
  latitude?: number;
  longitude?: number;
}

interface YourStaySectionProps {
  hotel: Hotel | null;
  lang?: Language;
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-4 w-4" />,
  parking: <Car className="h-4 w-4" />,
  breakfast: <Coffee className="h-4 w-4" />,
  restaurant: <UtensilsCrossed className="h-4 w-4" />,
  pool: <Waves className="h-4 w-4" />,
  garden: <TreePine className="h-4 w-4" />,
};

const YourStaySection = ({ hotel, lang = "en" }: YourStaySectionProps) => {
  if (!hotel) return null;

  const name = getLocalizedField(hotel, "name", lang) as string || hotel.name;
  const city = getLocalizedField(hotel, "city", lang) as string || hotel.city;
  const region = getLocalizedField(hotel, "region", lang) as string || hotel.region;
  const story = getLocalizedField(hotel, "story", lang) as string || hotel.story;
  const highlights = (lang === 'he' ? hotel.highlights_he : hotel.highlights) || hotel.highlights || [];

  // Get 3 photos for the grid
  const hotelPhotos = [hotel.hero_image, ...(hotel.photos || [])].filter(Boolean).slice(0, 3);

  // Build info chips from new fields
  const infoChips: { icon: React.ReactNode; label: string }[] = [];
  if (hotel.star_rating && hotel.star_rating > 0) {
    infoChips.push({
      icon: <Star className="h-3.5 w-3.5 fill-primary text-primary" />,
      label: "★".repeat(hotel.star_rating),
    });
  }
  if (hotel.check_in_time) {
    const checkInLabel = lang === "he" ? "צ'ק-אין" : lang === "fr" ? "Arrivée" : "Check-in";
    infoChips.push({
      icon: <DoorOpen className="h-3.5 w-3.5" />,
      label: `${checkInLabel} ${hotel.check_in_time}`,
    });
  }
  if (hotel.check_out_time) {
    const checkOutLabel = lang === "he" ? "צ'ק-אאוט" : lang === "fr" ? "Départ" : "Check-out";
    infoChips.push({
      icon: <Clock className="h-3.5 w-3.5" />,
      label: `${checkOutLabel} ${hotel.check_out_time}`,
    });
  }
  if (hotel.property_type) {
    infoChips.push({
      icon: <HotelIcon className="h-3.5 w-3.5" />,
      label: hotel.property_type,
    });
  }

  return (
    <section className="py-6">
      <div className="space-y-6">
        {/* Section Header */}
        <div>
          <h2 className="font-serif text-xl md:text-2xl font-medium text-foreground mb-1">
            {lang === "he" ? "המלון שלך" : lang === "fr" ? "Votre hébergement" : "Your stay"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {lang === "he" 
              ? "החוויה כוללת לינה במלון הזה" 
              : lang === "fr" 
              ? "Cette expérience inclut un séjour dans cet établissement"
              : "This experience includes a stay at this property"}
          </p>
        </div>

        {/* Hotel Card - Large visual */}
        <div className="group relative overflow-hidden rounded-xl bg-muted">
          {/* Photo Grid */}
          <div className="grid grid-cols-3 gap-0.5 aspect-[3/1] md:aspect-[4/1]">
            {hotelPhotos.map((photo, index) => (
              <div key={index} className="relative overflow-hidden">
                <img
                  src={photo || "/placeholder.svg"}
                  alt={`${name} - ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))}
          </div>

          {/* Hotel Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4 md:p-6">
            <div className="flex items-end justify-between gap-4">
              <div className="text-white">
                <h3 className="text-lg md:text-xl font-semibold mb-1 text-white">{name}</h3>
                <LocationPopover
                  city={city || undefined}
                  region={region || undefined}
                  hotelName={name}
                  latitude={hotel.latitude}
                  longitude={hotel.longitude}
                  lang={lang}
                  variant="light"
                />
              </div>
              <Link to={`/hotel/${hotel.slug}`}>
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30"
                >
                  {lang === "he" ? "לפרופיל" : lang === "fr" ? "Voir plus" : "View property"}
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Info Chips (star rating, check-in/out, property type) */}
        {infoChips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {infoChips.map((chip, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 text-sm text-foreground"
              >
                {chip.icon}
                <span>{chip.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {highlights.slice(0, 6).map((highlight, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 p-3 rounded-lg bg-muted/50"
              >
                <Star className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm">{highlight}</span>
              </div>
            ))}
          </div>
        )}

        {/* Story excerpt */}
        {story && (
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
            {story}
          </p>
        )}
      </div>
    </section>
  );
};

export default YourStaySection;
