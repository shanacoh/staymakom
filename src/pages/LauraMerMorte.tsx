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
import heroImg from "@/assets/hero-road-desert.jpg";

const WHATSAPP = "972555009910";

const maps = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

// ─── Les trois jours : la frise ───────────────────────────────────────────────

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

type Day = {
  date: string;
  title: string;
  steps: Step[];
};

const DAYS: Day[] = [
  {
    date: "Vendredi 9 octobre",
    title: "La route vers le désert",
    steps: [
      {
        number: "01",
        moment: "Matin",
        title: "Départ de Tel Aviv",
        description:
          "Départ en début de matinée, cap à l'est. En moins d'une heure, la ville laisse place aux collines de Judée.",
      },
      {
        number: "02",
        moment: "Matin",
        title: "Domaine du Castel",
        mapsUrl: maps("Domaine du Castel Winery Yad HaShmona"),
        description:
          "L'un des grands domaines viticoles du pays, niché dans les collines de Judée. Visite du chai et dégustation, verre en main face aux vignes.",
        highlight: true,
      },
      {
        number: "03",
        moment: "Midi",
        title: "Ein Prat",
        mapsUrl: maps("Ein Prat Nature Reserve"),
        description:
          "Une oasis cachée au creux du désert de Judée. Des bassins d'eau de source, des figuiers, des falaises tout autour. On se baigne, on pique-nique, on prend son temps.",
        items: [{ label: "Maillot et chaussures d'eau à prévoir" }],
      },
      {
        number: "04",
        moment: "Fin de journée",
        title: "Hôtel Nevo",
        mapsUrl: maps("Nevo by Isrotel Collection Dead Sea"),
        description:
          "La route descend jusqu'au point le plus bas de la terre. Installation à l'hôtel avant l'entrée de Shabbat, et premier coucher de soleil sur la mer Morte.",
      },
    ],
  },
  {
    date: "Samedi 10 octobre",
    title: "Shabbat au bord de l'eau",
    steps: [
      {
        number: "01",
        moment: "Matin",
        title: "Shabbat à l'hôtel",
        description:
          "Pas de réveil, pas de programme. Un petit-déjeuner qui s'étire, la piscine, le spa, un livre.",
      },
      {
        number: "02",
        moment: "Après-midi",
        title: "Baignade à la mer Morte",
        mapsUrl: maps("Ein Bokek Beach Dead Sea"),
        description:
          "On flotte sans effort, face aux montagnes de Moab. Dix à quinze minutes dans l'eau suffisent, puis on se rince et on recommence.",
        highlight: true,
      },
      {
        number: "03",
        moment: "Soir",
        title: "Soirée calme",
        description: "Dîner à l'hôtel et coucher tôt. Demain, le réveil sonne avant l'aube.",
      },
    ],
  },
  {
    date: "Dimanche 11 octobre",
    title: "Du lever du soleil au retour",
    steps: [
      {
        number: "01",
        moment: "Avant l'aube",
        title: "Massada par le Snake Path",
        mapsUrl: maps("Masada Snake Path East Entrance"),
        description:
          "Départ de l'hôtel de nuit. Environ 45 minutes de montée à la fraîche par le chemin du Serpent, puis le soleil qui se lève sur la mer Morte et les montagnes de Jordanie, depuis la forteresse d'Hérode.",
        items: [{ label: "Lampe frontale, eau et bonnes chaussures" }],
        highlight: true,
      },
      {
        number: "02",
        moment: "Matin",
        title: "Petit-déjeuner et café",
        description: "La récompense. Un vrai café et un petit-déjeuner bien mérité après la descente.",
      },
      {
        number: "03",
        moment: "Matin",
        title: "Einot Tzukim",
        mapsUrl: maps("Einot Tsukim Nature Reserve"),
        description:
          "La réserve naturelle la plus basse du monde. Des bassins d'eau douce bordés de roseaux, au bord de la mer Morte.",
      },
      {
        number: "04",
        moment: "Midi",
        title: "Qumran",
        mapsUrl: maps("Qumran National Park"),
        description:
          "Les grottes où les manuscrits de la mer Morte ont été retrouvés en 1947. Une courte visite, deux mille ans d'histoire.",
      },
      {
        number: "05",
        moment: "Après-midi",
        title: "Retour à Tel Aviv",
        description: "Environ une heure et demie de route, arrivée en fin d'après-midi.",
      },
    ],
  },
];

// ─── L'hôtel ──────────────────────────────────────────────────────────────────

type HotelPhoto = {
  src: string;
  alt: string;
};

const ISROTEL = "https://media.isrotel.co.il/umb";

const HOTEL = {
  name: "Nevo by Isrotel",
  mood: "Deux nuits face à la mer Morte",
  description:
    "À Ein Bokek, au bord de la mer Morte. Chaque chambre a son balcon, la plupart face à l'eau. Une grande piscine entourée de palmiers, un spa, et la plage à deux pas.",
  tags: ["Ein Bokek", "Piscine et spa", "Plage à deux pas"],
  mapsUrl: maps("Nevo by Isrotel Collection Dead Sea"),
  photos: [
    {
      src: `${ISROTEL}/22559/${encodeURIComponent("ים-המלח-רחפן6")}.jpg`,
      alt: "Nevo by Isrotel, l'hôtel et sa piscine au pied des falaises du désert",
    },
    {
      src: `${ISROTEL}/22558/${encodeURIComponent("ים-המלח-רחפן2")}.jpg`,
      alt: "Nevo by Isrotel, la piscine vue du ciel",
    },
    {
      src: `${ISROTEL}/32649/nevo-online-rez-7.jpg`,
      alt: "Nevo by Isrotel, au bord du bassin",
    },
  ] as HotelPhoto[],
};

function HotelCard() {
  const [photoIndex, setPhotoIndex] = useState(0);

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
            {HOTEL.photos.map((photo, i) => (
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
          {HOTEL.photos.map((photo, i) => (
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
          {HOTEL.mood}
        </p>
        <a
          href={HOTEL.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1.5 font-sans text-base font-bold uppercase tracking-[0.04em] text-foreground hover:text-[#ad1414] transition-colors"
        >
          {HOTEL.name}
          <MapPin className="h-3 w-3 shrink-0 text-[#ad1414]/70 group-hover:text-[#ad1414]" />
        </a>
        <p className="mt-1.5 text-[13px] text-foreground/70 leading-relaxed font-sans">{HOTEL.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {HOTEL.tags.map((tag) => (
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

// ─── Bon à savoir ─────────────────────────────────────────────────────────────

const TIPS = [
  {
    number: "01",
    title: "Dans la valise",
    description: "Maillot, chaussures d'eau, chapeau, crème solaire et une lampe frontale pour Massada.",
  },
  {
    number: "02",
    title: "La mer Morte",
    description: "On évite de se raser la veille et on garde la tête hors de l'eau. Le sel pique.",
  },
  {
    number: "03",
    title: "L'eau",
    description: "Il fait encore chaud en octobre. Au moins un litre et demi par personne pour chaque marche.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

const LauraMerMorte = () => {
  const waLink = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    "Bonjour Shana ! J'ai une question sur notre séjour à la mer Morte."
  )}`;

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
            STAYMAKOM · Itinéraire privé
          </p>
          <h1
            className="font-sans text-[34px] sm:text-5xl md:text-6xl font-bold uppercase tracking-[0.02em] leading-[1.05] opacity-0 animate-hero-fade-up text-white text-center drop-shadow-lg"
            style={{ animationDelay: "150ms" }}
          >
            Trois jours à la mer Morte
          </h1>
          <p
            className="mt-4 text-sm sm:text-base text-white/85 font-sans uppercase tracking-[0.14em] opacity-0 animate-hero-fade-up"
            style={{ animationDelay: "300ms" }}
          >
            Pour Laura · 9 au 11 octobre
          </p>
          <p
            className="mt-4 text-[15px] sm:text-lg text-white/85 font-sans max-w-md mx-auto leading-relaxed opacity-0 animate-hero-fade-up"
            style={{ animationDelay: "450ms" }}
          >
            Un domaine dans les collines, une oasis dans le désert, un Shabbat au bord de l'eau et un lever de
            soleil à Massada.
          </p>
        </div>
      </section>

      {/* Programme : un bloc par jour, une ligne par étape */}
      {DAYS.map((day, dayIndex) => (
        <section
          key={day.date}
          className={"px-5 scroll-mt-16 " + (dayIndex === 0 ? "pt-14 pb-6" : "pt-8 pb-6")}
        >
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-sans">
                {day.date}
              </p>
              <h2 className="mt-2 font-sans text-xl sm:text-2xl font-bold uppercase tracking-[0.02em] text-foreground">
                {day.title}
              </h2>
              <div className="mx-auto mt-4 h-px w-8 bg-[#ad1414]" />
            </div>

            <div className="border-t border-border">
              {day.steps.map((step, index) => {
                const startsMoment = index === 0 || day.steps[index - 1].moment !== step.moment;
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
                          {step.highlight ? "Coup de cœur Staymakom" : "En option"}
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
                            <li
                              key={item.label}
                              className="flex items-center gap-2.5 text-[13px] text-foreground/70 font-sans"
                            >
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
      ))}

      {/* L'hôtel */}
      <section className="mt-8 py-12 px-5 bg-muted/40">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8 space-y-2">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-sans">
              Où vous dormez
            </p>
            <h2 className="font-sans text-xl sm:text-2xl font-bold uppercase tracking-[0.02em] text-foreground">
              Votre hôtel
            </h2>
          </div>

          <HotelCard />
        </div>
      </section>

      {/* Bon à savoir */}
      <section className="py-12 px-5">
        <div className="max-w-2xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#ad1414] font-sans mb-2">
            Avant de partir
          </p>
          <h2 className="font-sans text-xl sm:text-2xl font-bold uppercase tracking-[0.02em] text-foreground leading-tight">
            Bon à savoir
          </h2>

          <div className="mt-5 grid sm:grid-cols-3 border-t border-border sm:border-b sm:divide-x divide-border">
            {TIPS.map((tip) => (
              <div
                key={tip.number}
                className="border-b border-border sm:border-b-0 py-4 sm:px-4 sm:first:pl-0 sm:last:pr-0"
              >
                <p className="font-sans text-[11px] tracking-[0.1em] text-[#ad1414] font-bold mb-1.5">
                  {tip.number}
                </p>
                <h3 className="font-sans text-[13px] font-bold uppercase tracking-[0.06em] text-foreground leading-snug">
                  {tip.title}
                </h3>
                <p className="mt-1 text-[13px] text-foreground/70 leading-relaxed font-sans">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-10 px-5 border-t border-border">
        <div className="max-w-md mx-auto text-center">
          <p className="text-[13px] text-foreground/70 leading-relaxed font-sans">
            Une question, une envie de changer quelque chose ? Écrivez-moi, je m'en occupe.
          </p>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[#ad1414] px-6 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white font-sans hover:bg-[#8f1010] transition-colors"
          >
            Écrire à Shana
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-border py-6 text-center">
        <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          © STAYMAKOM · Expériences sur mesure en Israël
        </p>
      </footer>
    </div>
  );
};

export default LauraMerMorte;
