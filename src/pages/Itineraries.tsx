import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Interfaces ───────────────────────────────────────────────────────────────
// JSON schema stored in itinerary_content (Supabase jsonb column):
// {
//   title, subtitle?, cover_image?, tagline?,
//   meta?: { dates?, duration?, format? },
//   intro?,
//   chapters: [{
//     number?, title, period?, image?, narrative?, body?,
//     experiences?: [{ icon?, title, description?, highlight?, image?, time? }],
//     daytrips?: [{ icon?, title, description }],
//     destinations?: [{ icon?, title, subtitle?, body, highlights?, tags?, image? }],
//     accommodation_note?
//   }],
//   closing?: { title, body },
//   contact?
// }

interface Experience {
  icon?: string;
  title: string;
  description?: string;
  highlight?: boolean;
  image?: string;
  time?: string;
}

interface DayTrip {
  icon?: string;
  title: string;
  description: string;
}

interface Destination {
  icon?: string;
  title: string;
  subtitle?: string;
  body: string;
  distance?: string;
  nights?: string;
  stay?: string;
  highlights?: string[];
  tags?: string[];
  image?: string;
}

interface Chapter {
  number?: string;
  title: string;
  period?: string;
  image?: string;
  narrative?: string;
  body?: string;
  experiences?: Experience[];
  daytrips?: DayTrip[];
  daytrips_intro?: string;
  destinations?: Destination[];
  accommodation_note?: string;
}

interface ItineraryContent {
  title: string;
  subtitle?: string;
  cover_image?: string;
  tagline?: string;
  quote?: string;
  meta?: { dates?: string; duration?: string; format?: string };
  intro?: string;
  chapters: Chapter[];
  closing?: { title: string; body: string };
  contact?: string;
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
  const [activeChapter, setActiveChapter] = useState(0);
  const chapterRefs = useRef<(HTMLElement | null)[]>([]);
  const navRef = useRef<HTMLDivElement>(null);

  // Track which chapter is in view
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    chapterRefs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setActiveChapter(i);
            const navEl = navRef.current;
            if (navEl) {
              const pill = navEl.children[i] as HTMLElement;
              pill?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
            }
          }
        },
        { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(obs => obs.disconnect());
  }, [c.chapters.length]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F2EC" }}>

      {/* ── 1. HERO ────────────────────────────────────────────────────────── */}
      <section className="relative h-screen min-h-[600px] flex flex-col justify-end overflow-hidden">
        {c.cover_image && (
          <img
            src={c.cover_image}
            alt={c.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-black/80" />

        {/* Wordmark top */}
        <div className="absolute top-6 left-0 right-0 text-center z-10">
          <span className="font-sans font-bold tracking-[-0.04em] uppercase text-sm text-white/70">
            STAYMAKOM
          </span>
        </div>

        {/* Content bottom */}
        <div className="relative z-10 px-6 pb-16 max-w-5xl mx-auto w-full text-center text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/65 mb-5">
            Crafted for {client_name}
          </p>
          <h1
            className="font-sans text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-5 tracking-tight text-white"
            style={{ textShadow: "0 2px 16px rgba(0,0,0,0.45)" }}
          >
            {c.title}
          </h1>
          {c.tagline && (
            <p className="text-sm text-white/75 max-w-lg mx-auto mb-5 leading-relaxed">
              {c.tagline}
            </p>
          )}
          {c.quote && (
            <p className="font-display text-xl sm:text-2xl italic text-white/90 max-w-xl mx-auto mb-10 leading-relaxed">
              "{c.quote}"
            </p>
          )}
          {c.meta && (
            <div className="flex flex-wrap justify-center gap-2.5">
              {c.meta.dates && (
                <span className="px-4 py-1.5 rounded-full border border-white/25 text-xs text-white/70 backdrop-blur-sm">
                  {c.meta.dates}
                </span>
              )}
              {c.meta.duration && (
                <span className="px-4 py-1.5 rounded-full border border-white/25 text-xs text-white/70 backdrop-blur-sm">
                  {c.meta.duration}
                </span>
              )}
              {c.meta.format && (
                <span className="px-4 py-1.5 rounded-full border border-white/25 text-xs text-white/70 backdrop-blur-sm">
                  {c.meta.format}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <span className="text-[9px] uppercase tracking-[0.25em] text-white/40">Scroll</span>
          <div className="w-px h-8 bg-white/25 scroll-indicator-line" />
        </div>
      </section>

      {/* ── 2. INTRO ───────────────────────────────────────────────────────── */}
      {c.intro && (
        <div className="py-16 px-6 max-w-2xl mx-auto">
          {c.intro.split("\n\n").map((para, i) => (
            <p key={i} className="text-[15px] text-[#6B6560] leading-[1.9] mb-5 last:mb-0">
              {para}
            </p>
          ))}
        </div>
      )}

      {/* ── 3. STICKY CHAPTER NAV ──────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#F5F2EC]/95 backdrop-blur-sm border-b border-[#EDE8E0]">
        <div ref={navRef} className="flex overflow-x-auto scrollbar-hide px-4 sm:px-8">
          {c.chapters.map((chapter, i) => (
            <button
              key={i}
              onClick={() => chapterRefs.current[i]?.scrollIntoView({ behavior: "smooth" })}
              className={cn(
                "flex-shrink-0 px-5 py-4 text-[11px] font-medium tracking-[0.1em] uppercase transition-colors border-b-2 whitespace-nowrap",
                activeChapter === i
                  ? "border-[#1A1814] text-[#1A1814]"
                  : "border-transparent text-[#9E9890] hover:text-[#6B6560]"
              )}
            >
              {chapter.number && (
                <span className="text-[#C4A882] mr-1.5">{chapter.number}</span>
              )}
              {chapter.title}
            </button>
          ))}
        </div>
      </div>

      {/* ── 4. CHAPTER SECTIONS ────────────────────────────────────────────── */}
      {c.chapters.map((chapter, i) => (
        <section
          key={i}
          id={`chapter-${i}`}
          ref={(el) => { chapterRefs.current[i] = el; }}
          style={{ scrollMarginTop: "56px" }}
          className="py-20 border-t border-[#EDE8E0]"
        >
          {/* Chapter header */}
          <div className="max-w-5xl mx-auto px-6 overflow-hidden">
            <div className="flex items-start gap-4 sm:gap-6">
              {chapter.number && (
                <span
                  className="font-display leading-none font-light select-none shrink-0 hidden sm:block"
                  style={{ fontSize: "clamp(80px, 12vw, 160px)", color: "#EDE8E0" }}
                >
                  {chapter.number}
                </span>
              )}
              <div className="pt-0 sm:pt-8 flex-1">
                {chapter.period && (
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#C4A882] mb-3">
                    {chapter.period}
                  </p>
                )}
                <h2 className="font-display font-light leading-[1.0] text-[#1A1814]"
                  style={{ fontSize: "clamp(32px, 5vw, 56px)" }}>
                  {chapter.title}
                </h2>
              </div>
            </div>
          </div>

          {/* Body text */}
          {chapter.body && (
            <div className="max-w-2xl mx-auto px-6 mb-14">
              <p className="text-[14px] text-[#4A4540] leading-[1.9]">{chapter.body}</p>
            </div>
          )}

          {/* Experiences grid */}
          {chapter.experiences && chapter.experiences.length > 0 && (
            <div className="max-w-5xl mx-auto px-6 mb-14">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#9E9890] mb-6">
                Experiences
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {chapter.experiences.map((exp, j) => (
                  <div
                    key={j}
                    className={cn(
                      "rounded-2xl border border-[#EDE8E0] overflow-hidden",
                      exp.highlight ? "md:col-span-2" : ""
                    )}
                    style={{ backgroundColor: exp.highlight ? "#F8F3EC" : "#FFFFFF" }}
                  >
                    {exp.image && !exp.highlight && (
                      <img src={exp.image} alt={exp.title} className="w-full h-40 object-cover" />
                    )}
                    <div className="px-6 py-5 flex gap-4 items-start">
                      {exp.icon && (
                        <span className="text-2xl shrink-0 mt-0.5">{exp.icon}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        {exp.time && (
                          <p className="text-[10px] text-[#C4A882] tracking-widest uppercase mb-1.5">
                            {exp.time}
                          </p>
                        )}
                        <p className={cn(
                          "font-medium text-[#1A1814] leading-snug",
                          exp.highlight ? "text-[15px]" : "text-sm"
                        )}>
                          {exp.title}
                        </p>
                        {exp.description && (
                          <p className="text-xs text-[#6B6560] leading-relaxed mt-2">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Day trips — dark contrast section */}
          {chapter.daytrips && chapter.daytrips.length > 0 && (
            <div className="mb-14" style={{ backgroundColor: "#1C1915" }}>
              <div className="max-w-5xl mx-auto px-6 py-10">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#C4A882] mb-4">
                  Day Trips
                </p>
                {chapter.daytrips_intro && (
                  <p className="text-sm text-white/55 leading-relaxed mb-8 max-w-2xl">
                    {chapter.daytrips_intro}
                  </p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {chapter.daytrips.map((trip, j) => (
                    <div
                      key={j}
                      className="rounded-xl border border-white/10 p-4"
                      style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                    >
                      {trip.icon && (
                        <span className="text-xl block mb-2.5">{trip.icon}</span>
                      )}
                      <p className="text-sm font-medium text-white mb-1.5 leading-snug">
                        {trip.title}
                      </p>
                      <p className="text-xs text-white/45 leading-relaxed">{trip.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Destination blocks (road trip chapters) */}
          {chapter.destinations && chapter.destinations.length > 0 && (
            <div className="max-w-5xl mx-auto px-6 mb-14">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#9E9890] mb-6">
                Destinations
              </p>
              <div className="space-y-5">
                {chapter.destinations.map((dest, j) => (
                  <div key={j} className="bg-white rounded-2xl border border-[#EDE8E0] overflow-hidden">

                    {/* A — Header teinté */}
                    <div className="px-6 py-5" style={{ backgroundColor: "#F8F5F0" }}>
                      <p className="font-display text-[11px] tracking-widest mb-2" style={{ color: "#C4A882" }}>
                        {String(j + 1).padStart(2, "0")}
                      </p>
                      <div className="flex items-center gap-2.5">
                        {dest.icon && <span className="text-xl shrink-0">{dest.icon}</span>}
                        <p className="font-medium text-[#1A1814] text-base leading-snug">{dest.title}</p>
                      </div>
                    </div>

                    {/* B — Bande d'infos rapides */}
                    {(dest.distance || dest.nights || dest.stay) && (
                      <div className="px-6 py-3 flex flex-wrap gap-x-5 gap-y-1.5 border-b border-[#EDE8E0]">
                        {dest.distance && (
                          <span className="flex items-center gap-1.5 text-xs text-[#4A4540]">
                            <span className="text-sm">📍</span>
                            <span className="font-medium">{dest.distance}</span>
                          </span>
                        )}
                        {dest.nights && (
                          <span className="flex items-center gap-1.5 text-xs text-[#4A4540]">
                            <span className="text-sm">🌙</span>
                            {dest.nights}
                          </span>
                        )}
                        {dest.stay && (
                          <span className="flex items-center gap-1.5 text-xs text-[#4A4540]">
                            <span className="text-sm">🏨</span>
                            {dest.stay}
                          </span>
                        )}
                      </div>
                    )}

                    {/* C — Corps */}
                    <div className="px-6 pt-5 pb-2">
                      <p className="text-sm text-[#4A4540] leading-[1.85]">{dest.body}</p>
                    </div>

                    {/* D — Grille d'activités */}
                    {dest.highlights && dest.highlights.length > 0 && (
                      <div className="px-6 pb-6 pt-4">
                        <p className="text-[10px] uppercase tracking-widest text-[#9E9890] mb-3">
                          Things to do
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {dest.highlights.map((h, k) => (
                            <div
                              key={k}
                              className="rounded-xl px-3 py-2.5 text-xs text-[#4A4540] leading-snug"
                              style={{ backgroundColor: "#F8F5F0" }}
                            >
                              {h}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accommodation note */}
          {chapter.accommodation_note && (
            <div className="max-w-5xl mx-auto px-6">
              <div className="pl-5 py-4 pr-6 rounded-r-xl"
                style={{ borderLeft: "3px solid #C4A882", backgroundColor: "#FAF7F3" }}>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#C4A882] mb-1.5">
                  Accommodation
                </p>
                <p className="text-sm text-[#4A4540] leading-relaxed">
                  {chapter.accommodation_note}
                </p>
              </div>
            </div>
          )}
        </section>
      ))}

      {/* ── 5. CLOSING ─────────────────────────────────────────────────────── */}
      {c.closing && (
        <section className="py-28 px-6 text-center border-t border-[#EDE8E0]">
          <div className="max-w-lg mx-auto space-y-6">
            <div className="w-10 h-px mx-auto" style={{ backgroundColor: "#C4A882" }} />
            <h2 className="font-display text-3xl sm:text-4xl italic text-[#1A1814] font-light">
              {c.closing.title}
            </h2>
            <p className="text-sm text-[#6B6560] leading-[1.9]">{c.closing.body}</p>
            {c.contact && (
              <a
                href={`mailto:${c.contact}`}
                className="inline-block mt-2 text-sm font-medium text-[#1A1814] transition-colors hover:text-[#C4A882]"
                style={{ borderBottom: "1px solid #C4A882", paddingBottom: "2px" }}
              >
                {c.contact}
              </a>
            )}
            <div className="pt-8">
              <span className="font-sans font-bold tracking-[-0.04em] uppercase text-xs text-[#C4BEB5]">
                STAYMAKOM
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

// ─── Preview data,REMOVE before production ──────────────────────────────────
const PREVIEW_ITINERARY: ItineraryRow = {
  client_name: "Nicole",
  itinerary_content: {
    title: "A Summer Built Around You",
    cover_image: "/hero-itinerary.jpg",
    tagline: "Not a fixed itinerary. More a collection of places, moods, people, and moments we can shape together.",
    quote: "This isn't about following a schedule. It's about creating the version of Israel you actually want to experience.",
    meta: {
      dates: "June 24 – July 10",
      duration: "17 days of possibilities",
      format: "Friends joining anytime",
    },
    intro: "Hi Nicole,\n\nThis isn't a traditional itinerary with everything locked in advance. Think of it as a flexible collection of places, moods, hotels, and experiences you can pick from depending on your energy and who's joining you.\n\nNothing is set in stone. The goal is to help you imagine what your summer in Israel could feel like, and build it together around what excites you most. Something personal, effortless, and genuinely cool.",
    chapters: [
      {
        number: "01",
        title: "Tel Aviv",
        period: "June 24 – July 4 · 10 nights",
        narrative: "Ten days in a city that never quite sleeps, but knows how to be still when it matters.",
        body: "Tel Aviv isn't a backdrop. It's a character. Your base is a design hotel steps from the beach; the city opens from there,the shuk, the galleries, the coastline, the neighbourhoods that each feel like a different city within the city.",
        experiences: [
          {
            icon: "🌅",
            title: "Beach mornings, late breakfasts, rooftop evenings",
            description: "Yes, it's the classic,but it's the classic for a reason. We'll send you a curated list of the right spots: beach clubs worth the membership, breakfast places that don't show up in the obvious guides, rooftops that actually have a view.",
            highlight: true,
          },
          {
            icon: "🛍️",
            title: "Flea market in Jaffa, Levinsky & Carmel walk",
            description: "Three markets, three completely different energies. Vintage and design in the Jaffa port flea market. Spices and Persian pastries in Levinsky. Everything-under-the-sun chaos at Carmel.",
          },
          {
            icon: "🥃",
            title: "Whisky & Chocolate Tasting",
            description: "A sit-down session with an Israeli whisky expert,not a tour, a conversation. Really good whisky matched with single-origin Israeli chocolate.",
          },
          {
            icon: "🍳",
            title: "Cooking Class",
            description: "Israeli cuisine is one of the most exciting in the world right now. Hands-on, market-to-table, loud kitchen energy. You leave knowing how to make three things you'll actually make again.",
          },
          {
            icon: "🎤",
            title: "Comedy Club Night",
            description: "Tel Aviv has a genuinely thriving stand-up scene,in English. A great way to be in a room full of locals laughing at the same things.",
          },
          {
            icon: "🏺",
            title: "Clay Workshop",
            description: "A slow afternoon with your hands in clay, somewhere in one of TLV's art neighbourhoods. A good counterpoint to the beach energy.",
          },
          {
            icon: "🏃",
            title: "Active Retreat",
            description: "Tel Aviv is one of the most fitness-forward cities in the world. Options: bootcamp, yoga, pilates, reformer, beachfront surf lesson, or a half-day trail hike north of the city.",
          },
        ],
        daytrips_intro: "Easy day trips from Tel Aviv to experience incredible places while still keeping the city as your home base. All under 2 hours away — you're back in time for dinner.",
        daytrips: [
          {
            icon: "🍷",
            title: "Zichron Yaakov",
            description: "50 min north. Rothschild-era wine village, century-old cellars.",
          },
          {
            icon: "🏛️",
            title: "Caesarea + Hippie Market",
            description: "Roman ruins on the sea, then an outdoor artisan market. Easy half-day.",
          },
          {
            icon: "⚓",
            title: "Acre (Akko)",
            description: "UNESCO-listed crusader city with underground tunnels and Arab market.",
          },
          {
            icon: "🌊",
            title: "Masada & Ein Gedi",
            description: "Sunrise hike up Masada, float in the Dead Sea, swim at Ein Gedi waterfall.",
          },
        ],
        accommodation_note: "You'll be staying at a design hotel in the White City, walking distance from the beach, Dizengoff Square, and the Carmel Market. Breakfast included. Check-in June 24, check-out July 4. Accommodation sourcing is currently in progress, with ongoing conversations with hotels and short-term rentals regarding availability, preferred rates, and potential hosted stays.",
      },
      {
        number: "02",
        title: "Jerusalem",
        period: "July 4 – July 6 · 2 nights",
        narrative: "Two nights is not enough. It never is. But it's enough to feel the weight of it.",
        body: "Jerusalem doesn't perform for tourists,it simply exists, with 3,000 years of continuity happening simultaneously. You'll see it at dusk when the city goes quiet, and again at dawn when it wakes before anyone else.",
        experiences: [
          {
            icon: "🕌",
            title: "The Western Wall,your moment, your way",
            description: "There's no right time,only your time. Some people go at dawn before the crowds, some go at the start of Shabbat when the plaza fills with singing. Optional add-on: rooftop walk on the Old City ramparts with views across all four quarters.",
            highlight: true,
          },
          {
            icon: "🚶",
            title: "Old City walk,the four quarters + Mahane Yehuda",
            description: "Armenian ceramics, the shuk, Via Dolorosa, the Jewish Quarter at golden hour,and then the market as Shabbat approaches. A curated list of which hummus counter, which pastry, which spice vendor.",
          },
          {
            icon: "🏺",
            title: "Ceramic Workshop",
            description: "Jerusalem has one of the best ceramic traditions in the region,Armenian, Jewish, contemporary. A hands-on session in the Old City, making something you actually bring home.",
          },
          {
            icon: "🪂",
            title: "Ziplining over Jerusalem",
            description: "Yes, this exists. A zipline that flies you over the Hinnom Valley with the Old City walls in view. An absurd sentence that is completely true.",
          },
          {
            icon: "🏙️",
            title: "City of David Tour",
            description: "Underground tunnels through 3,000 years of Jerusalem,Hezekiah's Tunnel, the archaeological layers beneath the modern city. Almost no one outside Israel knows this exists.",
          },
          {
            icon: "🕯️",
            title: "Kabbalat Shabbat",
            description: "If the timing aligns,and we'll make sure it does,a Friday evening in Jerusalem as Shabbat comes in is like nothing else. The city shifts. Candles appear in windows. The Western Wall fills.",
            highlight: true,
          },
        ],
        accommodation_note: "Two nights at a boutique hotel within the historic centre, stone walls, contemporary interiors, rooftop terrace overlooking the Old City. Breakfast included. Accommodation sourcing is currently in progress, with ongoing conversations with hotels and short-term rentals regarding availability, preferred rates, and potential hosted stays.",
      },
      {
        number: "03",
        title: "The Road",
        period: "July 6 – July 10",
        narrative: "Okay. This is where things get interesting.",
        body: "We're proposing four very different escapes from Tel Aviv, each with its own energy, landscape, and vibe. You don't have to do all of them in one trip. Pick one or two that excite you most, experience them fully, and save the others for a future visit. The idea is to come home with energy, not exhaustion. Every destination below is within easy reach of Tel Aviv, and a car is arranged for each leg.",
        destinations: [
          {
            icon: "🏜️",
            title: "The Negev Desert, Mitzpe Ramon",
            distance: "2h30 from Tel Aviv",
            nights: "1 night",
            stay: "Desert lodge",
            body: "Ramon Crater is the world's largest natural erosion crater, 40km wide and completely silent. It's the kind of place that resets you in a way no beach or city can. You sleep in a desert lodge right at the rim. One night is all you need, and all you'll be able to think about for weeks after.",
            highlights: ["Full-day jeep tour deep into the crater", "Camel ride at sunset", "Stargazing under the clearest sky in Israel", "Desert sunrise from the rim"],
          },
          {
            icon: "🌀",
            title: "Tzfat, City of Kabbalah",
            distance: "2hr from Tel Aviv",
            nights: "1 night",
            stay: "Boutique guesthouse",
            body: "The most spiritual city in Israel, and one of the most otherworldly places you'll ever visit. Winding blue-painted alleys, ancient synagogues, artist studios hidden in old stone buildings. A total contrast to Tel Aviv, slower, quieter, and deeply atmospheric.",
            highlights: ["Guided walk through the mystical Old City", "Visit to one of the oldest synagogues in Israel", "Private artist gallery", "Hidden local market at sunrise"],
          },
          {
            icon: "🍇",
            title: "Zichron Ya'akov, Wine Country",
            distance: "45min from Tel Aviv",
            nights: "1 night",
            stay: "Design guesthouse",
            body: "45 minutes from Tel Aviv, a completely different world. A Rothschild-era wine village in the Carmel mountains, beautiful Ottoman street, century-old cellars, long lunches with Mediterranean views. The closest thing to a French countryside feeling in Israel.",
            highlights: ["Private winery tasting", "Ottoman pedestrian street", "Mediterranean views over the coast", "Hidden wine bar dinner"],
          },
          {
            icon: "🌊",
            title: "Sea of Galilee, Kinneret",
            distance: "1h30 from Tel Aviv",
            nights: "1 night",
            stay: "Lakeside boutique hotel",
            body: "Wide open water, total quiet, and a boutique hotel right on the shore. A private boat at golden hour. Dinner on the water. Morning kayak on the lake. A slow, beautiful way to end a summer in Israel.",
            highlights: ["Private sunset boat ride", "Dinner on the water", "Morning kayak on the lake", "Hidden local spots along the shore"],
          },
        ],
        accommodation_note: "Hotels are pre-booked at each destination. A hire car is arranged for each leg. Accommodation sourcing is currently in progress, with ongoing conversations with hotels and short-term rentals regarding availability, preferred rates, and potential hosted stays.",
      },
    ],
    closing: {
      title: "Next step. Let's talk.",
      body: "Hi Nicole, I was so happy we connected. These are just ideas for now, a starting point we can shape together. I can help you book everything, or simply organize a few activities here and there. The goal is really for you to have an amazing trip and make the classic Israel experience feel a little more unforgettable. That's exactly the mission behind Staymakom.",
    },
    contact: "shana@staymakom.com",
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
