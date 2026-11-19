// Contenu de la page de proposition pour Sharon, en anglais (langue de la cliente).
// Brief : 50 ans de mariage, 2 adultes, du 7 au 9 février 2027, casher, mobilité réduite,
// « somewhere not too cold ». Par destination : 4 hôtels (prix fixés par Shana en shekels,
// + 250 ₪ chacun) + 1 carte d'activités douces.
// Les vrais noms des hôtels ne sont pas affichés à la cliente (noms d'ambiance), comme pour Ilona :
// le vrai nom est gardé dans `realName` uniquement pour nous retrouver.
// Uniquement ce que la cliente peut voir : jamais de prix d'achat ni de notes internes ici.

import heroDesertRoad from "@/assets/hero-road-desert.jpg";
import negevBanner from "@/assets/ilona-neguev.jpg";
import deadSeaBanner from "@/assets/masada-dead-sea-vintage.jpg";
import eilatBanner from "@/assets/timna-park-eilat-nature.webp";
import jacobTentes from "@/assets/ilona-hotels/jacob-tentes.jpg";
import jacobChambre from "@/assets/ilona-hotels/jacob-chambre.jpg";
import jacobPiscine from "@/assets/ilona-hotels/jacob-piscine.jpg";
import daromaPiscine from "@/assets/ilona-hotels/daroma-piscine.jpg";
import daromaChambre from "@/assets/ilona-hotels/daroma-chambre.jpg";
import daromaSalon from "@/assets/ilona-hotels/daroma-salon.jpg";
import beresheetExterieur from "@/assets/sharon-hotels/beresheet-exterieur.jpg";
import beresheetChambre from "@/assets/sharon-hotels/beresheet-chambre.jpg";
import beresheetSpa from "@/assets/sharon-hotels/beresheet-spa.jpg";
import kedmaExterieur from "@/assets/sharon-hotels/kedma-exterieur.jpg";
import kedmaChambre from "@/assets/sharon-hotels/kedma-chambre.jpg";
import kedmaPiscine from "@/assets/sharon-hotels/kedma-piscine.jpg";
import orchidExterieur from "@/assets/sharon-hotels/orchid-exterieur.jpg";
import orchidChambre from "@/assets/sharon-hotels/orchid-chambre.jpg";
import orchidLobby from "@/assets/sharon-hotels/orchid-lobby.jpg";
import shebaExterieur from "@/assets/sharon-hotels/sheba-exterieur.jpg";
import shebaSuite from "@/assets/sharon-hotels/sheba-suite.jpg";
import shebaMarina from "@/assets/sharon-hotels/sheba-marina.jpg";
import yamsufExterieur from "@/assets/sharon-hotels/yamsuf-exterieur.jpg";
import yamsufChambre from "@/assets/sharon-hotels/yamsuf-chambre.jpg";
import yamsufSalon from "@/assets/sharon-hotels/yamsuf-salon.jpg";
import herbertPiscine from "@/assets/sharon-hotels/herbert-piscine.jpg";
import herbertChambre from "@/assets/sharon-hotels/herbert-chambre.jpg";
import herbertSalon from "@/assets/sharon-hotels/herbert-salon.jpg";
import kaymaExterieur from "@/assets/sharon-hotels/kayma-exterieur.jpg";
import kaymaChambre from "@/assets/sharon-hotels/kayma-chambre.jpg";
import kaymaSpa from "@/assets/sharon-hotels/kayma-spa.jpg";
import nevoExterieur from "@/assets/sharon-hotels/nevo-exterieur.jpg";
import nevoChambre from "@/assets/sharon-hotels/nevo-chambre.jpg";
import nevoSpa from "@/assets/sharon-hotels/nevo-spa.jpg";
import nogaExterieur from "@/assets/sharon-hotels/noga-exterieur.jpg";
import nogaChambre from "@/assets/sharon-hotels/noga-chambre.jpg";
import nogaPiscine from "@/assets/sharon-hotels/noga-piscine.jpg";
import oasisExterieur from "@/assets/sharon-hotels/oasis-exterieur.jpg";
import oasisChambre from "@/assets/sharon-hotels/oasis-chambre.jpg";
import oasisPiscine from "@/assets/sharon-hotels/oasis-piscine.jpg";

export const HERO_IMAGE = heroDesertRoad;

export type Photo = { src: string; alt: string };

export type Hotel = {
  id: string;
  /** Vrai nom, pour nous seulement (jamais affiché sur la page). */
  realName: string;
  /** Nom d'ambiance affiché à la cliente. */
  name: string;
  badge: string;
  tags: string[];
  description: string;
  /** Prix fixé par Shana en shekels, + 250 ₪ ajoutés à sa demande (18/11/2026). */
  priceIls: number;
  photos: Photo[];
};

export type Region = {
  id: string;
  number: string;
  title: string;
  tagline: string;
  /** Température de février affichée sur la pastille. */
  weather: string;
  banner: string;
  hotels: Hotel[];
  /** Activités douces, peu d'effort physique (items courts). */
  activities: string[];
};

export const REGIONS: Region[] = [
  {
    id: "negev",
    number: "01",
    title: "The Negev",
    tagline: "Silence, wide views and starry skies.",
    weather: "February · 16 to 20°C",
    banner: negevBanner,
    hotels: [
      {
        id: "beresheet",
        realName: "Beresheet by Isrotel Exclusive",
        name: "On the edge of the crater",
        badge: "Luxury",
        tags: ["Crater view", "Spa", "Infinity pool"],
        description: "Villas set right on the cliff of the Ramon Crater, with one of the most beautiful views in the country.",
        priceIls: 3750,
        photos: [
          { src: beresheetExterieur, alt: "Infinity pool facing the crater" },
          { src: beresheetChambre, alt: "Warm bedroom with a large bed" },
          { src: beresheetSpa, alt: "Indoor pool of the spa" },
        ],
      },
      {
        id: "kedma",
        realName: "Kedma by Isrotel Design",
        name: "The desert caravanserai",
        badge: "Design hotel",
        tags: ["Pool", "Spa", "Quiet"],
        description: "A calm, sand-coloured hotel built like an old caravan stop, with a pool facing the dunes.",
        priceIls: 2325,
        photos: [
          { src: kedmaExterieur, alt: "Pool in front of the sand-coloured hotel" },
          { src: kedmaChambre, alt: "Bright room with a sofa and natural tones" },
          { src: kedmaPiscine, alt: "Pool overlooking the desert" },
        ],
      },
      {
        id: "jacob",
        realName: "Jacob",
        name: "The desert tents",
        badge: "Glamping",
        tags: ["Pool", "Campfire", "Near the crater"],
        description: "Warm, comfortable tents and rooms near the crater. In the evening, a fire and the stars.",
        priceIls: 2185,
        photos: [
          { src: jacobTentes, alt: "Glamping tents at sunset" },
          { src: jacobChambre, alt: "Room in warm tones, double bed" },
          { src: jacobPiscine, alt: "Outdoor pool with parasols" },
        ],
      },
      {
        id: "daroma",
        realName: "Daroma",
        name: "Above the crater",
        badge: "Boutique hotel",
        tags: ["Crater view", "Indoor pool", "Breakfast"],
        description: "A boutique hotel on the crater's edge, a few steps from the sunrise viewpoints.",
        priceIls: 1350,
        photos: [
          { src: daromaPiscine, alt: "Indoor pool under a wooden roof, desert view" },
          { src: daromaChambre, alt: "Sand-coloured room with a double bed" },
          { src: daromaSalon, alt: "Lounge with a central fireplace" },
        ],
      },
    ],
    activities: [
      "Spa and massage",
      "Sunset jeep ride, no walking",
      "Stargazing from a comfortable chair",
      "Wine tasting in a desert farm",
      "Private anniversary dinner",
    ],
  },
  {
    id: "eilat",
    number: "02",
    title: "Eilat",
    tagline: "Summer in the middle of winter, by the Red Sea.",
    weather: "February · 22 to 24°C",
    banner: eilatBanner,
    hotels: [
      {
        id: "orchid",
        realName: "Orchid Eilat - All Inclusive Extra",
        name: "The Thai village",
        badge: "All inclusive",
        tags: ["Sea view", "Villas", "Spa"],
        description: "Wooden villas on the hillside, in a lush tropical garden overlooking the Red Sea.",
        priceIls: 1900,
        photos: [
          { src: orchidExterieur, alt: "Pool and pavilion facing the sea" },
          { src: orchidChambre, alt: "Room with a large bay window on the sea" },
          { src: orchidLobby, alt: "Wooden lobby with chandeliers" },
        ],
      },
      {
        id: "queen-of-sheba",
        realName: "Queen of Sheba Eilat",
        name: "The palace on the marina",
        badge: "5 stars",
        tags: ["Marina", "Spa", "Promenade"],
        description: "A grand palace-style hotel on the marina, steps from the promenade and the sea.",
        priceIls: 2850,
        photos: [
          { src: shebaExterieur, alt: "Palace-style facade and pool" },
          { src: shebaSuite, alt: "Suite terrace with a jacuzzi and sea view" },
          { src: shebaMarina, alt: "The marina and the hotel from above" },
        ],
      },
      {
        id: "yam-suf",
        realName: "Yam Suf by Isrotel Collection",
        name: "The quiet garden by the reef",
        badge: "Isrotel",
        tags: ["Near the reef", "Pool", "Calm"],
        description: "A quiet resort south of the city, near the coral beach, with a large pool among palm trees.",
        priceIls: 1550,
        photos: [
          { src: yamsufExterieur, alt: "Pool and palm trees facing the sea" },
          { src: yamsufChambre, alt: "Room balcony with a sea view" },
          { src: yamsufSalon, alt: "Bright lounge with armchairs" },
        ],
      },
      {
        id: "herbert",
        realName: "The Herbert Eilat - All inclusive Plus",
        name: "The city-centre retreat",
        badge: "All inclusive",
        tags: ["Pool", "City centre", "All meals"],
        description: "A modern hotel in the centre, everything included, close to the shops and the promenade.",
        priceIls: 1700,
        photos: [
          { src: herbertPiscine, alt: "Pool with sunbeds" },
          { src: herbertChambre, alt: "Bright room with a double bed" },
          { src: herbertSalon, alt: "Lounge with soft sofas" },
        ],
      },
    ],
    activities: [
      "Glass-bottom boat over the reef",
      "Underwater observatory",
      "Spa and hammam",
      "Calm private boat trip",
      "Anniversary dinner by the sea",
    ],
  },
  {
    id: "dead-sea",
    number: "03",
    title: "The Dead Sea",
    tagline: "The lowest, warmest place on earth.",
    weather: "February · 21 to 23°C",
    banner: deadSeaBanner,
    hotels: [
      {
        id: "kayma",
        realName: "Kayma by Isrotel Exclusive",
        name: "The white villa on the shore",
        badge: "Luxury",
        tags: ["Beachfront", "Spa", "Infinity pool"],
        description: "A small, ultra-calm luxury hotel on the beach, with a long infinity pool facing the sea.",
        priceIls: 4350,
        photos: [
          { src: kaymaExterieur, alt: "White pool lined with cabanas and palm trees" },
          { src: kaymaChambre, alt: "Bedroom with a large window on the sea" },
          { src: kaymaSpa, alt: "Spa with a round skylight" },
        ],
      },
      {
        id: "nevo",
        realName: "Nevo by Isrotel Collection",
        name: "The sea-view resort",
        badge: "5 stars",
        tags: ["Beachfront", "Spa", "Mineral pool"],
        description: "A large resort on the beach, with gardens, a spa and rooms overlooking the Dead Sea.",
        priceIls: 1750,
        photos: [
          { src: nevoExterieur, alt: "The hotel facing the beach and mountains" },
          { src: nevoChambre, alt: "Room living area with a sea view" },
          { src: nevoSpa, alt: "Indoor mineral pool of the spa" },
        ],
      },
      {
        id: "noga",
        realName: "Noga by Isrotel Collection",
        name: "The garden by the sea",
        badge: "Isrotel",
        tags: ["Beachfront", "Pool", "Gardens"],
        description: "A friendly hotel at the foot of the mountains, with gardens and a pool near the beach.",
        priceIls: 1500,
        photos: [
          { src: nogaExterieur, alt: "The hotel at the foot of the mountain" },
          { src: nogaChambre, alt: "Room with a sofa and soft colours" },
          { src: nogaPiscine, alt: "Pool lined with palm trees" },
        ],
      },
      {
        id: "oasis",
        realName: "Oasis Spa Club Dead Sea Hotel (16+)",
        name: "The adults-only spa club",
        badge: "Adults only",
        tags: ["Spa", "Quiet", "16+"],
        description: "A peaceful, adults-only hotel built around its spa, ideal for a slow, restful stay.",
        priceIls: 1850,
        photos: [
          { src: oasisExterieur, alt: "Hotel facade and garden" },
          { src: oasisChambre, alt: "Bright, simple bedroom" },
          { src: oasisPiscine, alt: "Pool with sunbeds and palm trees" },
        ],
      },
    ],
    activities: [
      "Floating in the Dead Sea",
      "Black mud ritual",
      "Spa and mineral pools",
      "Masada by cable car",
      "Private anniversary dinner",
    ],
  },
];

/** Ce qu'on peut organiser en plus, affiché dans la partie 4 (« Next steps »). */
export const NEXT_STEPS = ["Gentle activities", "Spa time", "A special touch for your anniversary"];

export const WHATSAPP_INTRO = "Hi Staymakom! I'd like to schedule a call about our 50th anniversary weekend in February.";
