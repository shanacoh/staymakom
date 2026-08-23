import V3Header from "@/components/V3Header";
import { Clock, MapPin } from "lucide-react";
import heroImg from "@/assets/jaffa-port.jpg";

type Activity = {
  title: string;
  description?: string;
  emoji?: string;
  mapsUrl?: string;
};

type TimeBlock = {
  number: string;
  time: string;
  note?: string;
  activities: Activity[];
};

const BLOCKS: TimeBlock[] = [
  {
    number: "01",
    time: "1:00 PM – 3:30 PM",
    note: "Free time, no reservation needed",
    activities: [
      {
        title: "Jaffa Flea Market",
        description: "Wander through vintage shops, antique stalls and hidden gems in one of Tel Aviv's most charming neighborhoods.",
        mapsUrl: "https://www.google.com/maps/search/?api=1&query=Jaffa+Flea+Market+Tel+Aviv",
      },
      {
        title: "Cafe Puaa",
        description: "A cozy, bohemian café tucked into the flea market, perfect for a relaxed lunch or brunch.",
        mapsUrl: "https://www.google.com/maps/search/?api=1&query=Cafe+Puaa+Jaffa",
      },
      {
        title: "Ilana Goor Museum",
        description: "A unique art museum in the heart of Old Jaffa, with beautiful views over the Mediterranean.",
        mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ilana+Goor+Museum+Jaffa",
      },
    ],
  },
  {
    number: "02",
    time: "4:00 PM",
    activities: [
      {
        title: "Alchemist Bar TLV",
        description: "A fun and stylish mixology workshop in the heart of Tel Aviv.",
        emoji: "🍸",
        mapsUrl: "https://www.google.com/maps/search/?api=1&query=Alchemist+Bar+Tel+Aviv",
      },
    ],
  },
  {
    number: "03",
    time: "6:30 PM",
    activities: [
      {
        title: "Whiskey BM",
        description: "Whisky tasting at whisky bar.",
        emoji: "🥃",
        mapsUrl: "https://www.google.com/maps/search/?api=1&query=Whiskey+Bar+BM+Tel+Aviv",
      },
    ],
  },
  {
    number: "04",
    time: "8:30 PM",
    activities: [
      {
        title: "Shila Restaurant",
        description: "Dinner at one of Tel Aviv's most celebrated tables.",
        emoji: "🍽️",
        mapsUrl: "https://www.google.com/maps/search/?api=1&query=Shila+Restaurant+Tel+Aviv",
      },
    ],
  },
];

const HappyBirthdayMom = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <V3Header />

      {/* Hero */}
      <section className="relative h-[49vh] md:h-[54vh] min-h-[300px] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImg})` }}
        />
        <div className="absolute inset-0 bg-black/45" />

        <div className="relative z-10 text-center text-white px-4 sm:px-6 max-w-3xl mx-auto">
          <p
            className="text-xs uppercase tracking-[0.18em] text-white/70 font-sans mb-3 opacity-0 animate-hero-fade-up"
            style={{ animationDelay: "0ms" }}
          >
            STAYMAKOM · Private Itinerary
          </p>
          <h1
            className="font-sans text-[28px] sm:text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-[0.02em] leading-[1.1] opacity-0 animate-hero-fade-up text-white text-center drop-shadow-lg"
            style={{ animationDelay: "150ms" }}
          >
            Happy Birthday Mom
          </h1>
          <p
            className="mt-4 text-sm sm:text-base text-white/85 font-sans uppercase tracking-[0.14em] opacity-0 animate-hero-fade-up"
            style={{ animationDelay: "300ms" }}
          >
            4 Guests · Hosted by Josh Sirota
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="pt-12 pb-16 px-4 scroll-mt-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-sans">Tel Aviv - Yaffo</p>
            <h2 className="font-sans text-2xl sm:text-3xl font-bold uppercase tracking-[-0.02em] text-foreground">
              The Day's Plan
            </h2>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-2 bottom-2 w-px bg-border sm:left-6" />

            <div className="space-y-6">
              {BLOCKS.map((block) => (
                <div key={block.number} className="relative flex gap-4 sm:gap-5">
                  {/* Number badge */}
                  <div className="relative z-10 flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full border bg-white border-border text-foreground font-sans text-xs sm:text-sm font-bold">
                    {block.number}
                  </div>

                  {/* Content card */}
                  <div className="flex-1 rounded-2xl px-5 py-4 mb-1 bg-muted/40 border border-border">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                      <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] font-bold text-[#ad1414]">
                        <Clock className="h-3 w-3" />
                        {block.time}
                      </span>
                      {block.note && (
                        <span className="text-[11px] text-muted-foreground font-sans italic">
                          · {block.note}
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      {block.activities.map((activity) => (
                        <div key={activity.title}>
                          <h3 className="font-sans text-base sm:text-lg font-bold uppercase tracking-[-0.01em] text-foreground">
                            {activity.title}
                            {activity.emoji && <span className="ml-1.5">{activity.emoji}</span>}
                          </h3>
                          {activity.description && (
                            <p className="mt-0.5 text-sm text-foreground/80 leading-relaxed font-sans">
                              {activity.description}
                            </p>
                          )}
                          {activity.mapsUrl && (
                            <a
                              href={activity.mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group mt-1.5 inline-flex items-center gap-1 text-xs font-sans font-semibold text-[#ad1414] hover:text-[#8a0f0f] transition-colors"
                            >
                              <MapPin className="h-3.5 w-3.5 shrink-0 group-hover:scale-110 transition-transform" />
                              <span className="underline decoration-transparent group-hover:decoration-[#8a0f0f] underline-offset-2 transition-colors">
                                Get there
                              </span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-6 text-center">
        <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          © STAYMAKOM · Tailor-Made Experiences in Israel
        </p>
      </footer>
    </div>
  );
};

export default HappyBirthdayMom;
