import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Language } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Navigation } from "lucide-react";
import { trackMapGetThereClicked } from "@/lib/analytics";

interface LocationMapProps {
  latitude: number | null;
  longitude: number | null;
  hotelName: string;
  lang?: Language;
  showGetThere?: boolean;
}

const LocationMap = ({ 
  latitude, 
  longitude, 
  hotelName, 
  lang = "en",
  showGetThere = true 
}: LocationMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    if (!latitude || !longitude) return;

    // Initialize map
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const map = L.map(mapContainer.current, {
      dragging: !isMobile,
    }).setView([latitude, longitude], 13);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Custom marker icon
    const customIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="
        background-color: hsl(var(--primary));
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ">📍</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    // Add marker
    L.marker([latitude, longitude], { icon: customIcon })
      .bindPopup(`<strong>${hotelName}</strong>`)
      .addTo(map);

    // Mobile: two-finger scroll support
    if (L.Browser.mobile && mapContainer.current) {
      const container = mapContainer.current;

      const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length >= 2) {
          map.dragging.enable();
        } else if (e.touches.length === 1) {
          // Show overlay message
          setShowOverlay(true);
          if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
          overlayTimerRef.current = setTimeout(() => setShowOverlay(false), 1500);
        }
      };

      const handleTouchEnd = () => {
        map.dragging.disable();
      };

      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });

      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
        map.remove();
        mapRef.current = null;
        if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
      };
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, hotelName]);

  if (!latitude || !longitude) return null;

  // Navigation URLs
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  const appleMapsUrl = `https://maps.apple.com/?daddr=${latitude},${longitude}`;
  const wazeUrl = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;

  const getThereLabel = lang === "he" ? "הגעה" : lang === "fr" ? "S'y rendre" : "Get there";
  const twoFingerMsg = lang === "he" ? "השתמש בשתי אצבעות להזזת המפה" : lang === "fr" ? "Utilisez deux doigts pour déplacer la carte" : "Use two fingers to move the map";

  return (
    <section className="pb-6">
      <div className="h-[280px] rounded-lg overflow-hidden border border-border relative">
        <div ref={mapContainer} className="w-full h-full" />
        {/* Two-finger overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300"
          style={{ opacity: showOverlay ? 1 : 0 }}
        >
          <div
            className="text-white text-[13px] px-4 py-2"
            style={{
              background: 'rgba(26,24,20,0.7)',
              borderRadius: '20px',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {twoFingerMsg}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-sm text-muted-foreground">{hotelName}</p>
        
        {showGetThere && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => trackMapGetThereClicked(hotelName)}>
                <Navigation className="h-4 w-4" />
                {getThereLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background z-50">
              <DropdownMenuItem asChild>
                <a 
                  href={googleMapsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  Google Maps
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a 
                  href={appleMapsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  Apple Maps
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a 
                  href={wazeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  Waze
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </section>
  );
};

export default LocationMap;
