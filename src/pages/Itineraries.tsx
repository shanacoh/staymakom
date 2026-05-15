import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Clock, Building2, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── JSON schema for itinerary_content ────────────────────────────────────────
// {
//   "title": "Your Galilee Escape",
//   "subtitle": "3 Days · April 2026",
//   "cover_image": "https://...",
//   "intro": "We've put together something special for you...",
//   "days": [
//     {
//       "label": "Day 1 — Arrival",
//       "date": "April 10, 2026",
//       "hotel": {
//         "name": "The Magdala Hotel",
//         "location": "Migdal, Sea of Galilee",
//         "check_in": "14:00",
//         "check_out": "12:00",
//         "image": "https://...",
//         "notes": "Your room has a lake view."
//       },
//       "experiences": [
//         {
//           "time": "19:00",
//           "title": "Sunset boat ride",
//           "description": "Private boat on the Sea of Galilee at golden hour.",
//           "image": "https://..."
//         }
//       ],
//       "notes": "Dinner reservation at 20:30 is included."
//     }
//   ],
//   "notes": "For any changes contact shana@staymakom.com"
// }

interface HotelBlock {
  name: string;
  location?: string;
  check_in?: string;
  check_out?: string;
  image?: string;
  notes?: string;
}

interface ExperienceBlock {
  time?: string;
  title: string;
  description?: string;
  image?: string;
}

interface ItineraryDay {
  label: string;
  date?: string;
  hotel?: HotelBlock;
  experiences?: ExperienceBlock[];
  notes?: string;
}

interface ItineraryContent {
  title: string;
  subtitle?: string;
  cover_image?: string;
  intro?: string;
  days: ItineraryDay[];
  notes?: string;
}

interface ItineraryRow {
  client_name: string;
  itinerary_content: ItineraryContent;
}

// ─── Gate screen ──────────────────────────────────────────────────────────────
const GateScreen = ({ onUnlock }: { onUnlock: (row: ItineraryRow) => void }) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError(false);

    const { data } = await supabase
      .from("itineraries")
      .select("client_name, itinerary_content")
      .eq("password", password.trim())
      .maybeSingle();

    setLoading(false);

    if (data) {
      onUnlock(data as ItineraryRow);
    } else {
      setError(true);
      setPassword("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2EC] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center space-y-10 animate-in fade-in duration-700">
        <div className="space-y-3">
          <span className="font-sans font-bold tracking-[-0.04em] uppercase text-2xl text-[#1A1814]">
            STAYMAKOM
          </span>
          <p className="text-sm text-[#9E9890] tracking-wide">
            Your journey is waiting.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            ref={inputRef}
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false); }}
            placeholder="Enter your personal code"
            autoComplete="off"
            autoFocus
            className={cn(
              "h-12 text-center text-base border rounded-xl bg-white tracking-widest transition-colors",
              error
                ? "border-red-300 focus:border-red-400"
                : "border-[#DDD8D0] focus:border-[#1A1814]"
            )}
          />

          {error && (
            <p className="text-xs text-[#6B6560] animate-in fade-in duration-300">
              We don't recognize this code. Check with us at{" "}
              <a href="mailto:shana@staymakom.com" className="text-[#1A1814] underline underline-offset-2">
                shana@staymakom.com
              </a>
            </p>
          )}

          <Button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full h-12 bg-[#1A1814] hover:bg-[#1A1814]/85 text-white rounded-xl text-sm font-medium tracking-wide"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enter"}
          </Button>
        </form>
      </div>
    </div>
  );
};

// ─── Itinerary display ────────────────────────────────────────────────────────
const ItineraryDisplay = ({ row }: { row: ItineraryRow }) => {
  const { itinerary_content: c, client_name } = row;

  return (
    <div className="min-h-screen bg-[#F5F2EC]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#F5F2EC]/90 backdrop-blur-sm border-b border-[#E8E4DC] py-4 px-6 text-center">
        <span className="font-sans font-bold tracking-[-0.04em] uppercase text-sm text-[#1A1814]">
          STAYMAKOM
        </span>
      </div>

      {/* Cover */}
      {c.cover_image && (
        <div className="relative h-[45vh] min-h-[260px]">
          <img src={c.cover_image} alt={c.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-2">{c.title}</h1>
            {c.subtitle && <p className="text-sm text-white/80 tracking-wide">{c.subtitle}</p>}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-5 py-10 space-y-12">
        {/* Title (if no cover image) */}
        {!c.cover_image && (
          <div className="text-center space-y-2">
            <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1814]">{c.title}</h1>
            {c.subtitle && <p className="text-sm text-[#9E9890] tracking-wide">{c.subtitle}</p>}
          </div>
        )}

        {/* Intro */}
        {c.intro && (
          <div className="bg-white rounded-2xl px-7 py-6 border border-[#EDE8E0]">
            <p className="text-sm text-[#4A4540] leading-relaxed">
              Dear <span className="font-medium text-[#1A1814]">{client_name}</span>,
            </p>
            <p className="text-sm text-[#6B6560] leading-relaxed mt-2">{c.intro}</p>
          </div>
        )}

        {/* Days */}
        {c.days?.map((day, i) => (
          <div key={i} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Day header */}
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-[#1A1814] text-white text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </div>
              <div>
                <p className="font-serif text-lg text-[#1A1814]">{day.label}</p>
                {day.date && <p className="text-xs text-[#9E9890]">{day.date}</p>}
              </div>
            </div>

            {/* Hotel */}
            {day.hotel && (
              <div className="bg-white rounded-2xl border border-[#EDE8E0] overflow-hidden">
                {day.hotel.image && (
                  <img src={day.hotel.image} alt={day.hotel.name} className="w-full h-44 object-cover" />
                )}
                <div className="px-6 py-5 space-y-3">
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-[#C4A882] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-[#1A1814]">{day.hotel.name}</p>
                      {day.hotel.location && (
                        <p className="text-xs text-[#9E9890] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />{day.hotel.location}
                        </p>
                      )}
                    </div>
                  </div>
                  {(day.hotel.check_in || day.hotel.check_out) && (
                    <div className="flex gap-6 text-xs text-[#6B6560]">
                      {day.hotel.check_in && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Check-in {day.hotel.check_in}
                        </span>
                      )}
                      {day.hotel.check_out && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Check-out {day.hotel.check_out}
                        </span>
                      )}
                    </div>
                  )}
                  {day.hotel.notes && (
                    <p className="text-xs text-[#9E9890] italic border-t border-[#F0EDE6] pt-3">
                      {day.hotel.notes}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Experiences */}
            {day.experiences?.map((exp, j) => (
              <div key={j} className="bg-white rounded-2xl border border-[#EDE8E0] overflow-hidden">
                {exp.image && (
                  <img src={exp.image} alt={exp.title} className="w-full h-36 object-cover" />
                )}
                <div className="px-6 py-4 space-y-1">
                  {exp.time && (
                    <p className="text-xs text-[#C4A882] font-medium tracking-wide">{exp.time}</p>
                  )}
                  <p className="text-sm font-semibold text-[#1A1814]">{exp.title}</p>
                  {exp.description && (
                    <p className="text-xs text-[#6B6560] leading-relaxed pt-1">{exp.description}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Day notes */}
            {day.notes && (
              <div className="flex gap-3 px-1">
                <StickyNote className="w-4 h-4 text-[#C4A882] shrink-0 mt-0.5" />
                <p className="text-xs text-[#6B6560] leading-relaxed">{day.notes}</p>
              </div>
            )}
          </div>
        ))}

        {/* General notes */}
        {c.notes && (
          <div className="border-t border-[#E8E4DC] pt-8 text-center">
            <p className="text-xs text-[#9E9890] leading-relaxed max-w-sm mx-auto">{c.notes}</p>
          </div>
        )}

        <div className="text-center pb-4">
          <span className="font-sans font-bold tracking-[-0.04em] uppercase text-xs text-[#C4BEB5]">
            STAYMAKOM
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Dummy data — REMOVE before production, replace with real Supabase entries ─
const PREVIEW_ITINERARY: ItineraryRow = {
  client_name: "Sarah & David",
  itinerary_content: {
    title: "Your Galilee Escape",
    subtitle: "3 Days · May 2026",
    cover_image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=80",
    intro: "We've designed every detail of this journey with you in mind — slow mornings, golden light, and the kind of stillness that only the Galilee can offer. Everything is taken care of. All you need to do is arrive.",
    days: [
      {
        label: "Day 1 — Arrival",
        date: "May 14, 2026",
        hotel: {
          name: "Alegra Boutique Hotel",
          location: "Jerusalem of the Galilee",
          check_in: "15:00",
          image: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
          notes: "Your suite overlooks the Sea of Galilee. A welcome basket with local wines and artisan cheeses will be waiting in the room.",
        },
        experiences: [
          {
            time: "18:30",
            title: "Private sunset sail on the Sea of Galilee",
            description: "A 90-minute private boat experience at golden hour — just the two of you, the water, and the mountains fading into dusk.",
            image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=800&q=80",
          },
          {
            time: "20:30",
            title: "Dinner at Helena Restaurant",
            description: "Table reserved on the terrace. Regional cuisine by chef Assaf Granit — think slow-cooked lamb, roasted eggplant, and freshly baked laffa.",
          },
        ],
        notes: "No need to worry about transport — a private driver will meet you at the airport and take you directly to the hotel.",
      },
      {
        label: "Day 2 — Into the Landscape",
        date: "May 15, 2026",
        hotel: {
          name: "Alegra Boutique Hotel",
          location: "Jerusalem of the Galilee",
          check_out: "12:00",
        },
        experiences: [
          {
            time: "08:00",
            title: "Breakfast in the garden",
            description: "A slow breakfast on the terrace — fresh-pressed juices, warm breads from the local bakery, and eggs from the hotel's own farm.",
          },
          {
            time: "10:00",
            title: "Private guided hike — Arbel Cliffs",
            description: "A 2-hour moderate hike with a local guide through the ancient cliffs overlooking the Sea of Galilee. Dramatic views, fig trees, and complete silence.",
            image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
          },
          {
            time: "14:00",
            title: "Spa & wellness at the hotel",
            description: "Two hours reserved for you at the spa — a couple's massage followed by private access to the mineral pool and hammam.",
            image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80",
          },
          {
            time: "19:00",
            title: "Wine tasting — Galil Mountain Winery",
            description: "A private after-hours tasting of 6 estate wines, guided by the winemaker himself. The winery closes to the public at 17:00 — this is arranged exclusively for you.",
          },
        ],
        notes: "Pack comfortable shoes for the morning hike. Everything else — towels, sun cream, water — is provided by the hotel.",
      },
      {
        label: "Day 3 — Departure",
        date: "May 16, 2026",
        hotel: {
          name: "Alegra Boutique Hotel",
          location: "Jerusalem of the Galilee",
          check_out: "12:00",
          notes: "Late check-out until 13:00 has been arranged.",
        },
        experiences: [
          {
            time: "09:00",
            title: "Morning swim & last breakfast",
            description: "One final slow morning — take a dip in the infinity pool before a leisurely breakfast with panoramic views.",
          },
          {
            time: "11:30",
            title: "Visit to the old city of Tzfat",
            description: "A 90-minute stroll through the mystical alleys of Tzfat with a local artist-guide — galleries, hidden courtyards, and centuries of stories.",
            image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
          },
        ],
        notes: "Your driver will collect you at 14:00 for the return journey to Tel Aviv.",
      },
    ],
    notes: "For any last-minute changes or questions during your trip, Shana is reachable directly at shana@staymakom.com or +972 50 000 0000.",
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const Itineraries = () => {
  // TODO: remove PREVIEW_ITINERARY initializer once design is validated
  const [itinerary, setItinerary] = useState<ItineraryRow | null>(PREVIEW_ITINERARY);

  if (itinerary) return <ItineraryDisplay row={itinerary} />;
  return <GateScreen onUnlock={setItinerary} />;
};

export default Itineraries;
