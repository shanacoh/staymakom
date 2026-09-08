import V3Header from "@/components/V3Header";
import heroImg from "@/assets/hero-road-desert.jpg";
import { resizedImageUrl } from "@/lib/imageUrl";

type Hotel = {
  name: string;
  image: string;
};

type Escapade = {
  id: string;
  number: string;
  title: string;
  tagline: string;
  highlights: string[];
  hotels: Hotel[];
};

const ESCAPADES: Escapade[] = [
  {
    id: "safed",
    number: "01",
    title: "Escapade à Safed",
    tagline: "Vieille ville, spiritualité et déconnexion dans les montagnes du Nord",
    highlights: [
      "Explorer les ruelles de la vieille ville, ses galeries, ses synagogues historiques et ses petites adresses",
      "Découvrir la forêt de Biriya à travers une escapade nature et des expériences en plein air",
      "Construire un itinéraire entre patrimoine, gastronomie et découvertes locales",
    ],
    hotels: [
      {
        name: "Ruth Safed by Dan Hotels",
        image: "https://www.danhotels.com/sites/default/files/2025-08/Untitled%20design%20%286%29_26.jpg",
      },
      {
        name: "The Setai Bayit BaGalil",
        image: resizedImageUrl(
          "https://fduagvpolipfvnrhtkxz.supabase.co/storage/v1/object/public/hotel-images/hyperguest-1772614752127-0.jpg",
          600
        )!,
      },
    ],
  },
  {
    id: "tiberiade",
    number: "02",
    title: "Escapade à Tibériade",
    tagline: "Lac, nature et douceur de vivre au bord du Kinneret",
    highlights: [
      "Profiter du lac avec des activités nautiques et des moments de détente en pleine nature",
      "Découvrir les paysages et les trésors du Nord autour du Kinneret",
      "Créer un week-end mêlant expériences, bonnes adresses et temps de repos à l'hôtel",
    ],
    hotels: [
      {
        name: "Nof Ginnosar",
        image: resizedImageUrl(
          "https://uqeipzfdhyjkjzvqbkeu.supabase.co/storage/v1/object/public/hotel-images/c6ee921a-2b99-43a7-89d4-6b20fb5db311.jpg",
          600
        )!,
      },
      {
        name: "The Setai Sea of Galilee",
        image: resizedImageUrl(
          "https://fduagvpolipfvnrhtkxz.supabase.co/storage/v1/object/public/hotel-images/hyperguest-1774513030953-11.jpg",
          600
        )!,
      },
      {
        name: "Sofia Hotel",
        image: "https://sofiahotel.co.il/wp-content/uploads/2020/08/home-02.jpg",
      },
    ],
  },
  {
    id: "negev",
    number: "03",
    title: "Escapade dans le Néguev",
    tagline: "Aventure dans le désert, grands espaces et nuits sous les étoiles",
    highlights: [
      "Partir en jeep à travers les paysages sauvages du désert",
      "Tester le sandboarding et explorer les dunes, canyons et cratères du Néguev",
      "Profiter d'un coucher de soleil dans le désert puis d'une expérience d'observation des étoiles",
    ],
    hotels: [
      {
        name: "Beresheet",
        image: resizedImageUrl(
          "https://uqeipzfdhyjkjzvqbkeu.supabase.co/storage/v1/object/public/hotel-images/hyperguest-1782405005661-0.jpg",
          600
        )!,
      },
      {
        name: "Kedma",
        image: resizedImageUrl(
          "https://uqeipzfdhyjkjzvqbkeu.supabase.co/storage/v1/object/public/hotel-images/hyperguest-6f4e00f4-8f20-4a4d-81f5-cf413b4fc0a8.jpg",
          600
        )!,
      },
      {
        name: "Daroma",
        image: "https://media.isrotel.co.il/umb/34619/ri_ban.jpg",
      },
    ],
  },
  {
    id: "eilat",
    number: "04",
    title: "Escapade à Eilat",
    tagline: "Mer Rouge, aventure et soleil toute l'année",
    highlights: [
      "Explorer les fonds marins et découvrir la richesse de la mer Rouge",
      "Profiter de la mer avec une sortie en bateau ou différentes activités nautiques",
      "Partir dans le désert pour une expérience plus aventureuse entre paysages et grands espaces",
    ],
    hotels: [
      {
        name: "Royal Beach Eilat",
        image: "https://media.isrotel.co.il/umb/35962/rb_banner.jpg",
      },
      {
        name: "Aria",
        image: "https://static21.com-hotel.com/uploads/hotel/93158/photo/aria_15970527641.jpg",
      },
      {
        name: "Herbert Samuel The Reef Eilat",
        image: "https://herbertsamuel.com/wp-content/uploads/2024/03/Reef-Header-001.jpg",
      },
      {
        name: "Herbert Samuel Royal Shangri-La",
        image: resizedImageUrl(
          "https://fduagvpolipfvnrhtkxz.supabase.co/storage/v1/object/public/hotel-images/hyperguest-1774513463047-0.jpg",
          600
        )!,
      },
    ],
  },
  {
    id: "haifa-acre",
    number: "05",
    title: "Escapade Haïfa & Acre",
    tagline: "Une escapade entre Méditerranée, histoire et découvertes culinaires",
    highlights: [
      "Découvrir les jardins Bahá'í, les quartiers de Haïfa et les plus belles vues sur la Méditerranée",
      "Explorer les ruelles, marchés et sites historiques de la vieille ville d'Acre",
      "Composer un itinéraire autour de la gastronomie, des adresses locales et des villages de la côte Nord",
    ],
    hotels: [
      {
        name: "Botanica Hotel",
        image: resizedImageUrl(
          "https://fduagvpolipfvnrhtkxz.supabase.co/storage/v1/object/public/hotel-images/hyperguest-1772534141191-0.jpg",
          600
        )!,
      },
    ],
  },
  {
    id: "mer-morte",
    number: "06",
    title: "Escapade à la Mer Morte",
    tagline: "Déconnexion, bien-être et paysages hors du commun",
    highlights: [
      "Profiter d'un moment de détente entre plage privée, piscine et spa",
      "Découvrir les paysages spectaculaires du désert et organiser une expérience à Massada",
      "Créer une parenthèse bien-être autour de la mer Morte, entre relaxation et nature",
    ],
    hotels: [
      {
        name: "Nevo by Isrotel Collection",
        image: "https://media.isrotel.co.il/umb/25063/%D7%91%D7%90%D7%A0%D7%A8-%D7%99%D7%9D-%D7%94%D7%9E%D7%9C%D7%97-%D7%97%D7%93%D7%A9-2020.jpg",
      },
      {
        name: "Noga by Isrotel Collection",
        image: "https://media.isrotel.co.il/umb/30869/noga_banner.jpg",
      },
    ],
  },
];

const NP = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <V3Header />

      {/* ── Hero ── */}
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
            STAYMAKOM · Nos Escapades
          </p>
          <h1
            className="font-sans text-[28px] sm:text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-[0.02em] leading-[1.1] opacity-0 animate-hero-fade-up text-white text-center drop-shadow-lg"
            style={{ animationDelay: "150ms" }}
          >
            Escapades en Israël
          </h1>
          <p
            className="mt-4 text-sm sm:text-base text-white/85 font-sans uppercase tracking-[0.14em] opacity-0 animate-hero-fade-up"
            style={{ animationDelay: "300ms" }}
          >
            6 façons de découvrir le pays autrement
          </p>
          <p
            className="mt-3 text-sm sm:text-base text-white/80 font-sans max-w-xl mx-auto leading-relaxed opacity-0 animate-hero-fade-up"
            style={{ animationDelay: "450ms" }}
          >
            L'objectif n'est pas seulement de choisir un hôtel, mais de construire un séjour avec des activités, des visites et des expériences autour, pour un voyage vraiment inoubliable.
          </p>
        </div>
      </section>

      {/* ── Escapades ── */}
      <section className="pt-12 pb-16 px-4 scroll-mt-16">
        <div className="max-w-4xl mx-auto space-y-10">
          {ESCAPADES.map((esc) => (
            <div
              key={esc.id}
              className="rounded-2xl border border-border bg-muted/40 overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 sm:px-8 pt-7 pb-5">
                <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-[#ad1414] font-bold mb-2">
                  {esc.number}
                </p>
                <h2 className="font-sans text-xl sm:text-2xl font-bold uppercase tracking-[-0.01em] text-foreground">
                  {esc.title}
                </h2>
                <p className="mt-1.5 text-sm text-foreground/70 italic font-sans">
                  {esc.tagline}
                </p>
              </div>

              {/* Highlights */}
              <div className="px-6 sm:px-8 pb-6">
                <ul className="space-y-1.5">
                  {esc.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-sm text-foreground/80 font-sans leading-relaxed">
                      <span className="text-[#ad1414] mt-1 leading-none">•</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Hotels */}
              <div className="px-6 sm:px-8 pb-7 pt-5 bg-white border-t border-border">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-sans mb-3">
                  {esc.hotels.length > 1 ? "Hôtels sélectionnés" : "Hôtel sélectionné"}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {esc.hotels.map((hotel) => (
                    <div
                      key={hotel.name}
                      className="group relative rounded-xl overflow-hidden aspect-[4/3]"
                    >
                      {hotel.image ? (
                        <div
                          className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                          style={{ backgroundImage: `url(${hotel.image})` }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-foreground/10" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2.5">
                        <p className="text-white text-[11px] sm:text-xs font-sans font-medium leading-snug drop-shadow">
                          {hotel.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-border py-6 text-center">
        <p className="font-sans text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
          © STAYMAKOM · Expériences sur-mesure en Israël
        </p>
      </footer>
    </div>
  );
};

export default NP;
