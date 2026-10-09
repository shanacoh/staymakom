import { useState } from "react";
import V3Header from "@/components/V3Header";
import { MapPin } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import heroImg from "@/assets/safed.webp";

const maps = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

// ─── Dimanche : les suggestions ───────────────────────────────────────────────

type PlaceLink = {
  label: string;
  mapsUrl: string;
};

// Une adresse précise à l'intérieur d'une étape (atelier, galerie, synagogues)
type Place = {
  name: string;
  tagline: string;
  address?: string;
  description: string;
  mapsUrl: string;
  links?: PlaceLink[];
};

type Step = {
  number: string;
  moment: string;
  title: string;
  tagline: string;
  mapsUrl: string;
  paragraphs: string[];
  places?: Place[];
};

const STEPS: Step[] = [
  {
    number: "01",
    moment: "Morning",
    title: "Amuka",
    tagline: "A spiritual pilgrimage",
    mapsUrl: maps("Tomb of Rabbi Yonatan Ben Uziel Amuka"),
    paragraphs: [
      "You could begin the morning at the tomb of Rabbi Yonatan ben Uziel, a revered Jewish sage and a beloved pilgrimage site. People come here to pray for a soulmate, often for someone they love who is still looking for theirs.",
      "Deep within the Biriya Forest, it is a peaceful, spiritual setting and a rare way to connect with centuries of Jewish tradition.",
    ],
  },
  {
    number: "02",
    moment: "Late morning",
    title: "The Old City of Safed",
    tagline: "A journey through Jewish heritage",
    mapsUrl: maps("Tsfat Old City Israel"),
    paragraphs: [
      "Wander through the cobblestone alleys of Safed, one of Judaism's most important spiritual centers and the birthplace of a rich Kabbalistic tradition. A few doors worth pushing along the way:",
    ],
    places: [
      {
        name: "Safed Candles",
        tagline: "Handmade wax art",
        address: "62 Israel Najara Street",
        description:
          "Safed's iconic candle shop, known for its handcrafted Shabbat, Havdalah and Hanukkah candles, alongside intricate wax sculptures inspired by biblical stories.",
        mapsUrl: maps("Safed Candles, Najara Street, Safed"),
      },
      {
        name: "Sheva Chaya Glassblowing Gallery",
        tagline: "The art of glass",
        address: "7 Tet Vav Street",
        description:
          "Watch artist Sheva Chaya turn molten glass into extraordinary pieces during a live glassblowing demonstration.",
        mapsUrl: maps("Sheva Chaya Glassblowing Gallery Safed"),
      },
      {
        name: "Ancient synagogues",
        tagline: "Five centuries of prayer",
        description:
          "Each has its own story, its own architecture and a deep spiritual significance. Step inside one, or all three.",
        mapsUrl: maps("Ancient synagogues Old City Safed"),
        links: [
          { label: "Abuhav Synagogue", mapsUrl: maps("Abuhav Synagogue Safed") },
          { label: "Rabbi Yosef Caro Synagogue", mapsUrl: maps("Rabbi Yosef Caro Synagogue Safed") },
          { label: "Ari Synagogue", mapsUrl: maps("Ari Ashkenazi Synagogue Safed") },
        ],
      },
      {
        name: "Canaan Gallery",
        tagline: "Handwoven talitot",
        address: "28 Alkabets Street, Old City",
        description:
          "An artisanal weaving workshop where you can watch handmade Jewish prayer shawls take shape, a craft deeply rooted in tradition.",
        mapsUrl: maps("Canaan Gallery Safed"),
      },
    ],
  },
  {
    number: "03",
    moment: "Midday",
    title: "Lunch at Lahuh Tzfat",
    tagline: "Our lunch pick",
    mapsUrl: maps("Lahuh Tzfat Restaurant Safed"),
    paragraphs: [
      "A local Yemenite spot in the heart of town. Lahuh straight off the pan, eaten with your hands.",
    ],
  },
  {
    number: "04",
    moment: "Afternoon",
    title: "Safed Boutique Distillery",
    tagline: "Exceptional spirits",
    mapsUrl: maps("Tzfat Distillery Safed"),
    paragraphs: [
      "A world of distinctive, carefully crafted spirits, made right here. Learn about the art of distillation and, subject to availability, enjoy a tasting.",
    ],
  },
];

// ─── Samedi soir : le Canaan ──────────────────────────────────────────────────

const LEONARDO = "https://media.leonardo-hotels.com/static.leonardo-hotels.com/image";

const CANAAN = {
  name: "Canaan Hotel",
  description:
    "Spend the night at Canaan Hotel, nestled in the hills above Safed, surrounded by the peaceful landscapes of the Galilee. Quiet, soft and restful, for switching off completely.",
  tags: ["Above the city", "Cocooning", "Calm"],
  mapsUrl: maps("Canaan Hotel Limited Edition by Fattal Safed"),
  photos: [
    {
      src: `${LEONARDO}/canaan-hotel_lobby-terrace_01_1dca0d53dabb1216c7cffcd9282ad4f2.jpg`,
      alt: "Canaan Hotel, terrace with a fire pit",
    },
    {
      src: `${LEONARDO}/canaan-hotel_pool_01_38a2927f72f542644e423710ff067ae7.jpg`,
      alt: "Canaan Hotel, indoor pool",
    },
    {
      src: `${LEONARDO}/canaan-hotel_deluxe-room_02_e74865dc81acafafe8c6d0e6af5f350c.jpg`,
      alt: "Canaan Hotel, room",
    },
  ],
};

function CanaanCard() {
  const [photoIndex, setPhotoIndex] = useState(0);

  return (
    <div className="grid sm:grid-cols-2 rounded-xl border border-border bg-white overflow-hidden">
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
            {CANAAN.photos.map((photo, i) => (
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
          {CANAAN.photos.map((photo, i) => (
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

      <div className="flex flex-col justify-center px-5 py-5">
        <a
          href={CANAAN.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex w-fit items-center gap-1.5 font-sans text-base font-bold uppercase tracking-[0.04em] text-foreground hover:text-[#ad1414] transition-colors"
        >
          {CANAAN.name}
          <MapPin className="h-3 w-3 shrink-0 text-[#ad1414]/70 group-hover:text-[#ad1414]" />
        </a>
        <p className="mt-1.5 text-[13px] text-foreground/70 leading-relaxed font-sans">{CANAAN.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {CANAAN.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground font-sans"
            >
              {tag}
            </span>
          ))}
        </div>
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
            One night at Canaan Hotel and a Sunday of spirituality, art and ancient traditions, on us. Take the ideas you like, leave the rest.
          </p>
        </div>
      </section>

      {/* Samedi soir : l'hôtel */}
      <section className="py-12 px-5 bg-muted/40">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8 space-y-2">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-sans">
              Saturday night, October 10
            </p>
            <h2 className="font-sans text-xl sm:text-2xl font-bold uppercase tracking-[0.02em] text-foreground">
              A night at Canaan Hotel
            </h2>
          </div>

          <CanaanCard />
        </div>
      </section>

      {/* Dimanche : suggestions, une ligne par étape */}
      <section className="pt-14 pb-14 px-5 scroll-mt-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-sans">
              Sunday, October 11 · Our suggestions
            </p>
            <h2 className="mt-2 font-sans text-xl sm:text-2xl font-bold uppercase tracking-[0.02em] text-foreground">
              Discover the magic of Safed
            </h2>
            <div className="mx-auto mt-4 h-px w-8 bg-[#ad1414]" />
            <p className="mt-4 text-[13px] text-foreground/70 font-sans max-w-sm mx-auto leading-relaxed">
              These are the places we love, in an order that flows well. Pick the ones that speak to you and skip
              the rest, nothing is timed. Tap any name to open it on the map.
            </p>
          </div>

          <div className="border-t border-border">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="grid grid-cols-[2rem_1fr] sm:grid-cols-[6.5rem_2rem_1fr] gap-x-4 border-b border-border py-5"
              >
                {/* Moment de la journée : à gauche sur ordinateur, au-dessus sur téléphone */}
                <p className="col-span-2 sm:col-span-1 mb-3 sm:mb-0 font-sans text-[10px] uppercase tracking-[0.25em] text-muted-foreground sm:pt-[3px]">
                  {step.moment}
                </p>

                <span className="font-sans text-[11px] tracking-[0.1em] pt-[2px] text-muted-foreground">
                  {step.number}
                </span>

                <div className="min-w-0">
                  <p className="mb-1 font-sans text-[9px] font-bold uppercase tracking-[0.22em] text-[#ad1414]">
                    {step.tagline}
                  </p>

                  <a
                    href={step.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex w-fit items-start gap-1.5 font-sans text-sm font-bold uppercase tracking-[0.06em] leading-snug text-foreground hover:text-[#ad1414] transition-colors"
                  >
                    {step.title}
                    <MapPin className="h-3 w-3 shrink-0 mt-[3px] text-[#ad1414]/70 group-hover:text-[#ad1414]" />
                  </a>

                  {step.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="mt-1.5 text-[13px] text-foreground/70 leading-relaxed font-sans">
                      {paragraph}
                    </p>
                  ))}

                  {step.places && (
                    <div className="mt-4 divide-y divide-border border-t border-border">
                      {step.places.map((place) => (
                        <div key={place.name} className="py-3.5">
                          <a
                            href={place.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex w-fit items-start gap-1.5 font-sans text-[13px] font-bold leading-snug text-foreground hover:text-[#ad1414] transition-colors"
                          >
                            {place.name}
                            <MapPin className="h-2.5 w-2.5 shrink-0 mt-[4px] text-[#ad1414]/70 group-hover:text-[#ad1414]" />
                          </a>
                          <p className="mt-0.5 font-sans text-[11px] text-muted-foreground">
                            {place.tagline}
                            {place.address && ` · ${place.address}`}
                          </p>
                          <p className="mt-1.5 text-[13px] text-foreground/70 leading-relaxed font-sans">
                            {place.description}
                          </p>

                          {place.links && (
                            <ul className="mt-2 space-y-1">
                              {place.links.map((link) => (
                                <li
                                  key={link.label}
                                  className="flex items-center gap-2.5 text-[13px] text-foreground/70 font-sans"
                                >
                                  <span className="h-px w-3 shrink-0 bg-foreground/30" />
                                  <a
                                    href={link.mapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group inline-flex items-center gap-1 hover:text-[#ad1414] transition-colors"
                                  >
                                    {link.label}
                                    <MapPin className="h-2.5 w-2.5 shrink-0 text-[#ad1414]/60 group-hover:text-[#ad1414]" />
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
            I am so happy to have put this stay together for the two of you.
          </p>
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
              What would help me most: a few stories from your day, tagging{" "}
              <a
                href="https://www.instagram.com/staymakom"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-foreground hover:text-[#ad1414] transition-colors"
              >
                @staymakom
              </a>
              , so people see there is still so much to discover here. A video on your profile would be exceptional.
              And if you enjoyed it, tell the people around you.
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
