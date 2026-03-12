import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ExperienceMapProps {
  experiences: Array<{
    id: string;
    title: string;
    hotels?: {
      name: string;
      latitude: number | null;
      longitude: number | null;
    };
  }>;
}

const ExperienceMap = ({ experiences }: ExperienceMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Initialize map
    const map = L.map(mapContainer.current).setView([31.5, 34.9], 8);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Custom marker icon
    const customIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="
        background-color: hsl(var(--primary));
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 14px;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">📍</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    // Add markers
    experiences.forEach((exp) => {
      if (exp.hotels?.latitude && exp.hotels?.longitude) {
        L.marker([exp.hotels.latitude, exp.hotels.longitude], { icon: customIcon })
          .bindPopup(
            `<div style="font-family: var(--font-sans);">
              <strong>${exp.title}</strong><br/>
              <small>${exp.hotels.name}</small>
            </div>`
          )
          .addTo(map);
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [experiences]);

  return (
    <div className="sticky top-36 h-[calc(100vh-10rem)] rounded-lg overflow-hidden shadow-strong border border-border">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default ExperienceMap;
