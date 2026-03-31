import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapPin {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  experienceSlug: string;
  experienceTitle: string;
}

interface MultiPinMapProps {
  pins: MapPin[];
  lang?: "en" | "he" | "fr";
}

const MultiPinMap = ({ pins, lang = "en" }: MultiPinMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const validPins = pins.filter((p) => p.latitude && p.longitude);
    if (!mapContainer.current || validPins.length === 0) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const center = validPins.length === 1
      ? [validPins[0].latitude, validPins[0].longitude] as [number, number]
      : [31.5, 34.8] as [number, number];

    const zoom = validPins.length === 1 ? 12 : 7;

    const map = L.map(mapContainer.current, {
      dragging: true,
      scrollWheelZoom: false,
    }).setView(center, zoom);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const icon = L.divIcon({
      className: "",
      html: `<div style="
        width: 28px; height: 28px;
        background: #1A1814;
        border: 2px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -30],
    });

    validPins.forEach((pin) => {
      const viewLabel = lang === "he" ? "לחוויה" : lang === "fr" ? "Voir" : "View";
      const marker = L.marker([pin.latitude, pin.longitude], { icon }).addTo(map);
      marker.bindPopup(`
        <div style="min-width: 140px; font-family: sans-serif;">
          <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px; color: #1A1814;">${pin.name}</div>
          <div style="font-size: 11px; color: #666; margin-bottom: 8px;">${pin.experienceTitle}</div>
          <a href="/experience/${pin.experienceSlug}?context=launch"
             style="display: inline-block; background: #1A1814; color: white; padding: 4px 10px; border-radius: 4px; font-size: 11px; text-decoration: none;">
            ${viewLabel} →
          </a>
        </div>
      `);
    });

    if (validPins.length > 1) {
      const group = L.featureGroup(
        validPins.map((p) => L.marker([p.latitude, p.longitude]))
      );
      map.fitBounds(group.getBounds().pad(0.2));
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [pins, lang]);

  return (
    <div
      ref={mapContainer}
      style={{ height: "100%", minHeight: "400px", width: "100%", borderRadius: "12px", overflow: "hidden" }}
    />
  );
};

export default MultiPinMap;
