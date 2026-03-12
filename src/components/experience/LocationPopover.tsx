import { useState, useRef, useEffect } from "react";
import { MapPin } from "lucide-react";

interface LocationPopoverProps {
  city?: string;
  region?: string;
  hotelName?: string;
  latitude?: number;
  longitude?: number;
  lang?: "en" | "he" | "fr";
  variant?: "default" | "light";
}

const LocationPopover = ({
  city,
  region,
  hotelName,
  latitude,
  longitude,
  lang = "en",
  variant = "default",
}: LocationPopoverProps) => {
  const color = variant === "light" ? "#FFFFFF" : "#8C7B6B";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const locationText = [city, region].filter(Boolean).join(", ");
  if (!locationText) return null;

  const hasCoords = typeof latitude === "number" && typeof longitude === "number";
  const query = encodeURIComponent([hotelName, city].filter(Boolean).join(" "));

  const googleUrl = hasCoords
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${query}`;

  const wazeUrl = hasCoords
    ? `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`
    : `https://waze.com/ul?q=${query}`;

  const appleUrl = hasCoords
    ? `https://maps.apple.com/?ll=${latitude},${longitude}`
    : `https://maps.apple.com/?q=${query}`;

  const options = [
    { icon: "🗺", label: lang === "he" ? "פתח ב-Google Maps" : "Open in Google Maps", url: googleUrl },
    { icon: "🚗", label: lang === "he" ? "פתח ב-Waze" : "Open in Waze", url: wazeUrl },
    { icon: "🍎", label: lang === "he" ? "פתח ב-Apple Maps" : "Open in Apple Maps", url: appleUrl },
  ];

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 cursor-pointer hover:underline transition-colors"
        style={{ fontSize: "13px", color }}
      >
        <MapPin className="h-3.5 w-3.5" style={{ color }} />
        <span>{locationText}</span>
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1.5"
          style={{
            background: "#fff",
            border: "1px solid #E8E0D4",
            borderRadius: "4px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            minWidth: "220px",
            ...(lang === "he" ? { right: 0 } : { left: 0 }),
          }}
        >
          {options.map((opt) => (
            <a
              key={opt.url}
              href={opt.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 transition-colors"
              style={{
                height: "40px",
                padding: "0 16px",
                fontSize: "14px",
                color: "#1A1814",
                fontFamily: "Inter, sans-serif",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#FAF8F5")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationPopover;
