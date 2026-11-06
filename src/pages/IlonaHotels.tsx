import { useEffect, useRef, useState, type ReactNode } from "react";
import V3Header from "@/components/V3Header";
import heroImg from "@/assets/hero-road-desert.jpg";
import jacobTentes from "@/assets/ilona-hotels/jacob-tentes.jpg";
import jacobChambre from "@/assets/ilona-hotels/jacob-chambre.jpg";
import jacobFeu from "@/assets/ilona-hotels/jacob-feu.jpg";
import jacobPiscine from "@/assets/ilona-hotels/jacob-piscine.jpg";
import daromaPiscine from "@/assets/ilona-hotels/daroma-piscine.jpg";
import daromaChambre from "@/assets/ilona-hotels/daroma-chambre.jpg";
import daromaSalon from "@/assets/ilona-hotels/daroma-salon.jpg";
import daromaChambre2 from "@/assets/ilona-hotels/daroma-chambre-2.jpg";
import hagafenFacade from "@/assets/ilona-hotels/hagafen-facade.jpg";
import hagafenSuite from "@/assets/ilona-hotels/hagafen-suite.jpg";
import hagafenLit from "@/assets/ilona-hotels/hagafen-lit.jpg";
import hagafenDuplex from "@/assets/ilona-hotels/hagafen-duplex.jpg";
import gordoniaPiscine from "@/assets/ilona-hotels/gordonia-piscine.jpg";
import gordoniaTerrasse from "@/assets/ilona-hotels/gordonia-terrasse.jpg";
import gordoniaChambre from "@/assets/ilona-hotels/gordonia-chambre.jpg";
import gordoniaLobby from "@/assets/ilona-hotels/gordonia-lobby.jpg";

// Page one-off : deuxième proposition à Ilona, le choix de l'hôtel selon la durée
// du séjour. Les noms réels des hôtels ne sont pas affichés (noms d'ambiance).
// Prix fixés par Shana en euros, hors TVA ; le montant en shekels est la conversion.

type Photo = { src: string; alt: string };

type Hotel = {
  name: string;
  place: string;
  badge: string;
  tags: string[];
  rating?: string;
  description: string;
  priceIls: string;
  priceEur: string;
  stay: string;
  photos: Photo[];
};

type Option = {
  pill: string;
  title: string;
  dates: string;
  intro: string;
  hotels: Hotel[];
  activities: string[];
};

const OPTIONS: Option[] = [
  {
    pill: "Si vous partez 2 nuits",
    title: "Le Néguev",
    dates: "Vendredi 27 → dimanche 29 novembre",
    intro: "Ciel immense, cratère de Ramon, canyons d'Ein Avdat et nuits étoilées. Le désert en version douce.",
    hotels: [
      {
        name: "Les tentes du désert",
        place: "Mitzpe Ramon",
        badge: "Glamping",
        tags: ["Feu de camp", "Piscine", "Près du cratère"],
        description: "Tentes et chambres chaleureuses à deux pas du cratère. Le soir, feu de camp et ciel étoilé.",
        priceIls: "2 527 ₪",
        priceEur: "≈ 710 €",
        stay: "2 nuits · ven. 27 → dim. 29",
        photos: [
          { src: jacobTentes, alt: "Allée de tentes de glamping au coucher du soleil" },
          { src: jacobChambre, alt: "Chambre aux tons chauds, lit double et fauteuil" },
          { src: jacobFeu, alt: "Cercle de feu de camp à la tombée de la nuit" },
          { src: jacobPiscine, alt: "Piscine extérieure entourée de parasols" },
        ],
      },
      {
        name: "Au bord du cratère",
        place: "Mitzpe Ramon",
        badge: "Hôtel design",
        tags: ["Vue cratère", "Piscine couverte", "Petit-déj inclus"],
        rating: "★★★★",
        description: "Posé sur la falaise du cratère de Ramon, à quelques pas des points de vue au lever du soleil.",
        priceIls: "2 172 ₪",
        priceEur: "≈ 610 €",
        stay: "2 nuits · ven. 27 → dim. 29",
        photos: [
          { src: daromaPiscine, alt: "Piscine couverte sous une verrière en bois, vue sur le désert" },
          { src: daromaChambre, alt: "Chambre aux tons sable, lit double et fauteuil" },
          { src: daromaSalon, alt: "Salon avec cheminée centrale et grandes banquettes" },
          { src: daromaChambre2, alt: "Chambre double, lumière douce et applique ronde" },
        ],
      },
    ],
    activities: ["Photoshoot", "Balade en jeep", "Dégustation de vin", "Balade à dos de chameau", "Buggy dans le désert", "Sandboard"],
  },
  {
    pill: "Si vous partez 1 nuit",
    title: "Zikhron Yaakov",
    dates: "Samedi 28 → dimanche 29 novembre",
    intro: "Village historique sur les hauteurs du Carmel, caves à vin, rue piétonne des fondateurs et vue sur la Méditerranée.",
    hotels: [
      {
        name: "Les suites de 1884",
        place: "Zikhron Yaakov",
        badge: "Suites boutique",
        tags: ["Maison historique", "Petit-déj inclus"],
        rating: "★ 9,6",
        description: "De grandes suites dans une maison de pierre de la rue des fondateurs, à deux pas des caves et des cafés.",
        priceIls: "1 460 ₪",
        priceEur: "≈ 410 €",
        stay: "1 nuit · sam. 28 → dim. 29",
        photos: [
          { src: hagafenFacade, alt: "Façade en pierre éclairée au coucher du soleil, cour pavée" },
          { src: hagafenSuite, alt: "Suite aux murs de pierre et plafond haut" },
          { src: hagafenLit, alt: "Lit et lampe de chevet" },
          { src: hagafenDuplex, alt: "Suite en duplex vue d'en haut, balcon" },
        ],
      },
      {
        name: "La terrasse sur la mer",
        place: "Zikhron Yaakov",
        badge: "5 étoiles",
        tags: ["Piscine à débordement", "Spa", "Vue mer"],
        rating: "★ 9,3",
        description: "Sur la crête, piscine à débordement face à la Méditerranée et grand spa. Le choix le plus luxueux.",
        priceIls: "2 401 ₪",
        priceEur: "≈ 674 €",
        stay: "1 nuit · sam. 28 → dim. 29",
        photos: [
          { src: gordoniaPiscine, alt: "Piscine à débordement face à la mer" },
          { src: gordoniaTerrasse, alt: "Terrasse de la piscine et façade" },
          { src: gordoniaChambre, alt: "Chambre lumineuse avec balcon" },
          { src: gordoniaLobby, alt: "Lobby aux grandes baies vitrées" },
        ],
      },
    ],
    activities: ["Photoshoot", "Dégustation de vin", "Balade à cheval", "Jardins de Ramat Hanadiv", "Vélo électrique", "Plage de Dor"],
  },
];

// Carrousel de photos : défilement au doigt sur mobile, flèches au survol sur ordinateur
function PhotoCarousel({ photos, children }: { photos: Photo[]; children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => setIndex(Math.round(track.scrollLeft / track.clientWidth));
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  const go = (delta: number) => {
    const track = trackRef.current;
    if (!track) return;
    const next = (index + delta + photos.length) % photos.length;
    track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="group relative rounded-[14px] overflow-hidden bg-muted">
      <div
        ref={trackRef}
        className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((photo) => (
          <img
            key={photo.src}
            src={photo.src}
            alt={photo.alt}
            loading="lazy"
            className="w-full shrink-0 aspect-[4/3] object-cover snap-start"
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
      {children}
      <button
        type="button"
        aria-label="Photo précédente"
        onClick={() => go(-1)}
        className="absolute left-2 top-[42%] -translate-y-1/2 w-[30px] h-[30px] rounded-full bg-white/90 text-foreground grid place-items-center text-[15px] font-semibold opacity-90 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="Photo suivante"
        onClick={() => go(1)}
        className="absolute right-2 top-[42%] -translate-y-1/2 w-[30px] h-[30px] rounded-full bg-white/90 text-foreground grid place-items-center text-[15px] font-semibold opacity-90 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
      >
        ›
      </button>
      <span className="absolute top-2.5 right-2.5 px-[7px] py-0.5 rounded-full bg-black/50 text-white text-[10px] tabular-nums">
        {index + 1} / {photos.length}
      </span>
    </div>
  );
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  return (
    <article className="grid gap-2 content-start min-w-0">
      <PhotoCarousel photos={hotel.photos}>
        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-white/95 text-foreground text-[10px] font-semibold uppercase tracking-wider">
          {hotel.badge}
        </span>
        <div className="pointer-events-none absolute left-3 right-3 bottom-3 text-white">
          <h3 className="text-white text-base font-bold leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]">{hotel.name}</h3>
          <p className="text-xs opacity-90 mt-0.5">{hotel.place}</p>
        </div>
      </PhotoCarousel>
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex flex-wrap gap-1 min-w-0">
          {hotel.tags.map((tag) => (
            <span
              key={tag}
              className="whitespace-nowrap px-2 py-px rounded-full bg-muted/60 border border-border/40 text-[11px] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
        {hotel.rating && <span className="text-xs font-semibold whitespace-nowrap">{hotel.rating}</span>}
      </div>
      <p className="text-[13px] text-muted-foreground px-0.5">{hotel.description}</p>
      <div className="flex items-baseline flex-wrap gap-x-2 gap-y-1 px-0.5">
        <span className="text-lg font-bold tabular-nums">{hotel.priceIls}</span>
        <span className="text-[13px] text-muted-foreground tabular-nums">{hotel.priceEur}</span>
        <span className="basis-full text-[11px] text-muted-foreground">{hotel.stay}</span>
      </div>
    </article>
  );
}

function ActivitiesBubble({ activities }: { activities: string[] }) {
  return (
    <div className="md:col-span-2 lg:col-span-1 rounded-[20px] bg-[#f7f1ea] border border-[#ad7848]/20 p-5 grid gap-3.5 content-start">
      <h4 className="text-[15px] font-bold">Activités à réserver</h4>
      <ul className="flex flex-wrap gap-2">
        {activities.map((activity) => (
          <li key={activity} className="px-3 py-1.5 rounded-full bg-white border border-[#ad7848]/20 text-[13px]">
            {activity}
          </li>
        ))}
      </ul>
      <p className="text-[13px] text-muted-foreground">
        Une fois l'hôtel réservé, on vous envoie l'itinéraire complet, réservations comprises.
      </p>
    </div>
  );
}

export default function IlonaHotels() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <V3Header />

      {/* ── Hero ── */}
      <section className="relative min-h-[400px] flex items-end text-white">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImg})` }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/60" />
        <div className="relative z-10 w-full max-w-[1120px] mx-auto px-5 pt-11 pb-10">
          <p className="text-[11px] font-semibold tracking-[0.28em] uppercase opacity-90">STAYMAKOM · Proposition privée</p>
          <h1 className="text-white text-[32px] sm:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight leading-[1.02] my-3 [text-wrap:balance]">
            Votre escapade de fin novembre
          </h1>
          <p className="text-[15px] font-light max-w-[54ch] opacity-90">
            Deux propositions selon le temps dont vous disposez. Choisissez votre hôtel, on construit ensuite l'itinéraire autour, réservations comprises.
          </p>
        </div>
      </section>

      <main className="w-full max-w-[1120px] mx-auto px-5 pt-12 pb-8 grid gap-16">
        {OPTIONS.map((option) => (
          <section key={option.title} className="grid gap-[22px]">
            <div className="grid gap-2 max-w-[640px]">
              <span className="justify-self-start px-3 py-[5px] rounded-full bg-[#fbeeee] text-[#ad1414] text-[11px] font-semibold uppercase tracking-[0.08em]">
                {option.pill}
              </span>
              <h2 className="text-[26px] sm:text-[34px] font-extrabold tracking-tight leading-tight mt-1">{option.title}</h2>
              <p className="text-sm font-semibold">{option.dates}</p>
              <p className="text-sm text-muted-foreground">{option.intro}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-7 items-start">
              {option.hotels.map((hotel) => (
                <HotelCard key={hotel.name} hotel={hotel} />
              ))}
              <ActivitiesBubble activities={option.activities} />
            </div>
          </section>
        ))}

        <div className="grid gap-1 text-xs text-muted-foreground max-w-[72ch] pt-2">
          <p className="font-semibold text-foreground">Prix hors TVA : la TVA de 18 % se règle sur place à l'hôtel.</p>
          <p>Les tarifs peuvent évoluer jusqu'à la réservation.</p>
          <p>Conversion indicative en euros : 1 ₪ = 0,281 €.</p>
        </div>
      </main>

      <footer className="text-center text-xs text-muted-foreground pt-6 pb-10">
        <strong className="text-foreground font-bold tracking-[0.2em]">STAYMAKOM</strong>
        <br />
        The Israel most people never find.
      </footer>
    </div>
  );
}
