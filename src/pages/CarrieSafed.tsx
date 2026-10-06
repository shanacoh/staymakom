import { useState } from "react";
import V3Header from "@/components/V3Header";
import { ArrowRight, MapPin } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import heroImg from "@/assets/safed.webp";

const WHATSAPP = "972555009910";

const maps = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

// ─── Dimanche : la frise ──────────────────────────────────────────────────────

type ItineraryItem = {
  label: string;
  mapsUrl?: string;
};

type Step = {
  number: string;
  // Moment de la journée : affiché comme intertitre quand il change d'une étape à l'autre
  moment: string;
  title: string;
  mapsUrl?: string;
  description?: string;
  items?: ItineraryItem[];
  highlight?: boolean;
  optional?: boolean;
};

const STEPS: Step[] = [
  {
    number: "01",
    moment: "Morning",
    title: "Slow morning",
    description: "No alarm. Breakfast at the hotel, coffee with a view over the Galilee hills.",
  },
  {
    number: "02",
    moment: "Morning",
    title: "The Old City",
    mapsUrl: maps("Tsfat Old City Israel"),
    description:
      "We get lost on purpose. Blue doors, stone stairways, and workshops where people still make things by hand.",
    items: [
      { label: "Handmade candle shop" },
      { label: "Weaving workshop, where tallitot are made" },
      { label: "Glassblowing studio (subject to availability)" },
    ],
  },
  {
    number: "03",
    moment: "Morning",
    title: "Three synagogues",
    description: "Small rooms, painted ceilings, five centuries of stories.",
    items: [
      { label: "Abuhav Synagogue", mapsUrl: maps("Abuhav Synagogue Safed") },
      { label: "Rabbi Yosef Caro Synagogue", mapsUrl: maps("Rabbi Yosef Caro Synagogue Safed") },
      { label: "Ari Synagogue", mapsUrl: maps("Ari Ashkenazi Synagogue Safed") },
    ],
  },
  {
    number: "04",
    moment: "Midday",
    title: "Lunch at Lahuh Tzfat",
    mapsUrl: maps("Lahuh Tzfat Restaurant Safed"),
    description:
      "A local Yemenite spot in the heart of town. Lahuh straight off the pan, eaten with your hands.",
  },
  {
    number: "05",
    moment: "Afternoon",
    title: "Tasting at Tzfat Distillery",
    mapsUrl: maps("Tzfat Distillery Safed"),
    description:
      "A beautiful space and a host you will not forget. Unusual spirits, made right here, and genuinely excellent.",
    highlight: true,
  },
  {
    number: "06",
    moment: "Afternoon",
    title: "Tomb of Rabbi Yonatan Ben Uziel",
    mapsUrl: maps("Tomb of Rabbi Yonatan Ben Uziel Amuka"),
    description: "A short detour into the Amuka valley, for those who want it.",
    optional: true,
  },
  {
    number: "07",
    moment: "Golden hour",
    title: "Bat Yaar Ranch",
    mapsUrl: maps("Bat Yaar Ranch Biriya Forest"),
    description:
      "A Wild West ranch in the Biriya forest. One hour on horseback with the whole valley below you, in the last light of the day. It feels more like Texas than Israel.",
    highlight: true,
  },
  {
    number: "08",
    moment: "Evening",
    title: "Back to Tel Aviv",
    description: "Two hours south, home by evening.",
  },
];

// ─── Les deux hôtels ──────────────────────────────────────────────────────────

type HotelPhoto = {
  src: string;
  alt: string;
};

type Hotel = {
  name: string;
  shortName: string;
  mood: string;
  description: string;
  tags: string[];
  mapsUrl: string;
  photos: HotelPhoto[];
};

const LEONARDO = "https://media.leonardo-hotels.com/static.leonardo-hotels.com/image";
const DAN = "https://www.danhotels.com/sites/default/files/2025-08";

const HOTELS: Hotel[] = [
  {
    name: "Canaan by Fattal",
    shortName: "Canaan",
    mood: "The cocoon",
    description:
      "Just outside the city, up on the hill. Quiet, soft and restful, for switching off completely.",
    tags: ["Outside the city", "Cocooning", "Calm"],
    mapsUrl: maps("Canaan Hotel Limited Edition by Fattal Safed"),
    photos: [
      {
        src: `${LEONARDO}/canaan-hotel_lobby-terrace_01_1dca0d53dabb1216c7cffcd9282ad4f2.jpg`,
        alt: "Canaan by Fattal, terrace with a fire pit",
      },
      {
        src: `${LEONARDO}/canaan-hotel_pool_01_38a2927f72f542644e423710ff067ae7.jpg`,
        alt: "Canaan by Fattal, indoor pool",
      },
      {
        src: `${LEONARDO}/canaan-hotel_deluxe-room_02_e74865dc81acafafe8c6d0e6af5f350c.jpg`,
        alt: "Canaan by Fattal, room",
      },
    ],
  },
  {
    name: "Ruth Safed",
    shortName: "Ruth Safed",
    mood: "The old soul",
    description:
      "Inside the old city itself. Stone walls, arches and real character. Step out the door and you are in the alleys.",
    tags: ["Heart of the old city", "Authentic", "Walk everywhere"],
    mapsUrl: maps("Ruth Safed Hotel"),
    photos: [
      {
        src: `${DAN}/Untitled%20design%20%285%29_35.jpg`,
        alt: "Ruth Safed, stone courtyard",
      },
      {
        src: "https://www.danhotels.com/sites/default/files/styles/our_rooms_gallery/public/2023-03/636x366%20RZ_0019_%D7%A1%D7%95%D7%95%D7%99%D7%98%D7%AA%20%D7%91%D7%99%D7%AA%20%D7%92%D7%A4%D7%9F%20%285%29.jpg",
        alt: "Ruth Safed, room with a view over the Galilee hills",
      },
      {
        src: `${DAN}/Untitled%20design%20%289%29_23.jpg`,
        alt: "Ruth Safed, arched dining room with a view",
      },
    ],
  },
];

function HotelCard({ hotel }: { hotel: Hotel }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const waLink = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    `Hi Shana! I choose ${hotel.name} for our night in Safed.`
  )}`;

  return (
    <div className="flex flex-col rounded-xl border border-border bg-white overflow-hidden">
      {/* Photos, défilent au doigt ou avec les flèches */}
      <div className="relative">
        <Carousel
          className="w-full"
          opts={{ loop: true }}
          setApi={(api?: CarouselApi) => {
            api?.on("select", () => setPhotoIndex(api.selectedScrollSnap()));
          }}
        >
          <CarouselContent className="ml-0">
            {hotel.photos.map((photo, i) => (
              <CarouselItem key={photo.src} className="pl-0">
                <div className="aspect-[3/2] w-full overflow-hidden">
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    loading={i === 0 ? undefined : "lazy"}
                    className="w-full h-full object-cover"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:inline-flex left-3 right-auto top-1/2 h-9 w-9 border-none bg-white/90 shadow-md hover:bg-white" />
          <CarouselNext className="hidden sm:inline-flex right-3 left-auto top-1/2 h-9 w-9 border-none bg-white/90 shadow-md hover:bg-white" />
        </Carousel>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {hotel.photos.map((photo, i) => (
            <div
              key={photo.src}
              className={
                "w-1.5 h-1.5 rounded-full transition-colors " +
                (i === photoIndex ? "bg-white" : "bg-white/40")
              }
            />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pt-4 pb-5">
        <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#ad1414] font-sans mb-1.5">
          {hotel.mood}
        </p>
        <a
          href={hotel.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1.5 font-sans text-base font-bold uppercase tracking-[0.04em] text-foreground hover:text-[#ad1414] transition-colors"
        >
          {hotel.name}
          <MapPin className="h-3 w-3 shrink-0 text-[#ad1414]/70 group-hover:text-[#ad1414]" />
        </a>
        <p className="mt-1.5 text-[13px] text-foreground/70 leading-relaxed font-sans">{hotel.description}</p>
        <div className="mt-3 mb-5 flex flex-wrap gap-1.5">
          {hotel.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground font-sans"
            >
              {tag}
            </span>
          ))}
        </div>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-auto inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#ad1414] px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white font-sans hover:bg-[#8f1010] transition-colors"
        >
          I choose {hotel.shortName}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </div>
  );
}

// ─── Staymakom en trois offres ────────────────────────────────────────────────

const OFFERS = [
  {
    number: "01",
    title: "A hotel + an experience",
    description: "A stay built around something to live, not just a room.",
  },
  {
    number: "02",
    title: "Experiences by the day",
    description: "A tasting, a ride, a workshop, booked on its own.",
  },
  {
    number: "03",
    title: "Full itineraries",
    description: "2, 5 or 10 days to see the country differently, planned from start to finish.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

const CarrieSafed = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <V3Header />

      {/* Hero */}
      <section className="relative h-[56vh] md:h-[60vh] min-h-[360px] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImg})` }}
        />
        <div className="absolute inset-0 bg-black/45" />

        <div className="relative z-10 text-center text-white px-4 sm:px-6 max-w-4xl mx-auto">
          <p
            className="text-xs sm:text-sm uppercase tracking-[0.18em] text-white/75 font-sans mb-4 opacity-0 animate-hero-fade-up"
            style={{ animationDelay: "0ms" }}
          >
            STAYMAKOM · Private Itinerary
          </p>
          <h1
            className="font-sans text-[34px] sm:text-5xl md:text-6xl font-bold uppercase tracking-[0.02em] leading-[1.05] opacity-0 animate-hero-fade-up text-white text-center drop-shadow-lg"
            style={{ animationDelay: "150ms" }}
          >
            A Sunday in Safed
          </h1>
          <p
            className="mt-4 text-sm sm:text-base text-white/85 font-sans uppercase tracking-[0.14em] opacity-0 animate-hero-fade-up"
            style={{ animationDelay: "300ms" }}
          >
            For Carrie · October 10-11
          </p>
          <p
            className="mt-4 text-[15px] sm:text-lg text-white/85 font-sans max-w-md mx-auto leading-relaxed opacity-0 animate-hero-fade-up"
            style={{ animationDelay: "450ms" }}
          >
            One night and one slow day in the Galilee, on us. Everything is arranged. You just show up.
          </p>
        </div>
      </section>

      {/* Dimanche : programme, une ligne par étape */}
      <section className="pt-14 pb-14 px-5 scroll-mt-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-sans">
              Sunday, October 11
            </p>
            <h2 className="mt-2 font-sans text-xl sm:text-2xl font-bold uppercase tracking-[0.02em] text-foreground">
              The slow day
            </h2>
            <div className="mx-auto mt-4 h-px w-8 bg-[#ad1414]" />
          </div>

          <div className="border-t border-border">
            {STEPS.map((step, index) => {
              const startsMoment = index === 0 || STEPS[index - 1].moment !== step.moment;
              return (
                <div
                  key={step.number}
                  className="grid grid-cols-[2rem_1fr] sm:grid-cols-[6.5rem_2rem_1fr] gap-x-4 border-b border-border py-5"
                >
                  {/* Moment de la journée : à gauche sur ordinateur, au-dessus sur téléphone */}
                  <p
                    className={
                      "col-span-2 sm:col-span-1 font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground sm:pt-[3px] " +
                      (startsMoment ? "mb-3 sm:mb-0" : "hidden sm:block sm:invisible")
                    }
                  >
                    {step.moment}
                  </p>

                  <span
                    className={
                      "font-sans text-[11px] tracking-[0.1em] pt-[2px] " +
                      (step.highlight ? "text-[#ad1414] font-bold" : "text-muted-foreground")
                    }
                  >
                    {step.number}
                  </span>

                  <div className="min-w-0">
                    {(step.highlight || step.optional) && (
                      <p
                        className={
                          "mb-1 font-sans text-[9px] font-bold uppercase tracking-[0.22em] " +
                          (step.highlight ? "text-[#ad1414]" : "text-muted-foreground")
                        }
                      >
                        {step.highlight ? "Staymakom favourite" : "Optional"}
                      </p>
                    )}

                    {step.mapsUrl ? (
                      <a
                        href={step.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex w-fit items-start gap-1.5 font-sans text-sm font-bold uppercase tracking-[0.06em] leading-snug text-foreground hover:text-[#ad1414] transition-colors"
                      >
                        {step.title}
                        <MapPin className="h-3 w-3 shrink-0 mt-[3px] text-[#ad1414]/70 group-hover:text-[#ad1414]" />
                      </a>
                    ) : (
                      <h3 className="font-sans text-sm font-bold uppercase tracking-[0.06em] leading-snug text-foreground">
                        {step.title}
                      </h3>
                    )}

                    {step.description && (
                      <p className="mt-1.5 text-[13px] text-foreground/70 leading-relaxed font-sans">
                        {step.description}
                      </p>
                    )}

                    {step.items && (
                      <ul className="mt-2.5 space-y-1">
                        {step.items.map((item) => (
                          <li key={item.label} className="flex items-center gap-2.5 text-[13px] text-foreground/70 font-sans">
                            <span className="h-px w-3 shrink-0 bg-foreground/30" />
                            {item.mapsUrl ? (
                              <a
                                href={item.mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center gap-1 hover:text-[#ad1414] transition-colors"
                              >
                                {item.label}
                                <MapPin className="h-2.5 w-2.5 shrink-0 text-[#ad1414]/60 group-hover:text-[#ad1414]" />
                              </a>
                            ) : (
                              item.label
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Choix de l'hôtel */}
      <section className="py-12 px-5 bg-muted/40">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8 space-y-2">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-sans">
              Where you sleep
            </p>
            <h2 className="font-sans text-xl sm:text-2xl font-bold uppercase tracking-[0.02em] text-foreground">
              Your stay, your call
            </h2>
            <p className="text-[13px] text-foreground/70 font-sans max-w-sm mx-auto leading-relaxed">
              Two hotels, two very different moods. Pick the one that feels like you and I will take care of the rest.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {HOTELS.map((hotel) => (
              <HotelCard key={hotel.name} hotel={hotel} />
            ))}
          </div>
        </div>
      </section>

      {/* Staymakom */}
      <section className="py-12 px-5">
        <div className="max-w-2xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#ad1414] font-sans mb-2">
            Why I am inviting you
          </p>
          <h2 className="font-sans text-xl sm:text-2xl font-bold uppercase tracking-[0.02em] text-foreground leading-tight">
            Staymakom, in a few words
          </h2>
          <p className="mt-3 text-[13px] sm:text-sm text-foreground/75 leading-relaxed font-sans">
            Israelis and visitors alike, we all end up doing the same Israel: the same cities, the same sites, the
            same weekend. Staymakom exists to open up the rest. The places beyond the headlines, and the people who
            live there and are happy to open their door.
          </p>

          <p className="mt-8 text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-sans">
            On the site, three ways to travel
          </p>
          <div className="mt-3 grid sm:grid-cols-3 border-t border-border sm:border-b sm:divide-x divide-border">
            {OFFERS.map((offer) => (
              <div key={offer.number} className="border-b border-border sm:border-b-0 py-4 sm:px-4 sm:first:pl-0 sm:last:pr-0">
                <p className="font-sans text-[11px] tracking-[0.1em] text-[#ad1414] font-bold mb-1.5">
                  {offer.number}
                </p>
                <h3 className="font-sans text-[13px] font-bold uppercase tracking-[0.06em] text-foreground leading-snug">
                  {offer.title}
                </h3>
                <p className="mt-1 text-[13px] text-foreground/70 leading-relaxed font-sans">{offer.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 space-y-3 text-[13px] sm:text-sm text-foreground/75 leading-relaxed font-sans">
            <p>
              What would help me most: a few stories from your day, so people see there is still so much to discover
              here. A video on your profile would be exceptional. And if you enjoyed it, tell the people around you.
            </p>
            <p>
              From my side, the offer stays open. Whenever you come, whatever you feel like doing, I will organise it.
            </p>
          </div>
        </div>
      </section>

      {/* P.S. */}
      <section className="py-10 px-5 border-t border-border">
        <div className="max-w-md mx-auto text-center">
          <p className="text-[13px] text-foreground/70 leading-relaxed font-sans italic">
            P.S. We have met before. Summer 2025, at Malka: my sister and I came over to your table to see you and
            your husband, and to thank you for everything you do for us. You posted us in your story that night. I am
            writing this on the eve of October 7th, and it means even more today.
          </p>
          <p className="mt-3 font-sans text-[11px] font-bold uppercase tracking-[0.22em] text-foreground">Shana</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-6 text-center">
        <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          © STAYMAKOM · Tailor-made experiences in Israel
        </p>
      </footer>
    </div>
  );
};

export default CarrieSafed;
