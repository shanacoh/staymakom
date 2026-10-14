// Contenu de la page itinéraire de Rebeca (dossier TM-1006), en anglais.
// Uniquement ce que la cliente peut voir : les notes internes (prestataires, contraintes)
// ne doivent JAMAIS être écrites ici, elles partiraient dans le site public.
// Elles sont dans docs/itineraires/TM-1006-rebeca.md.

import { resizedImageUrl } from "@/lib/imageUrl";
import heroDesertRoad from "@/assets/hero-road-desert.jpg";
import deadSea from "@/assets/mermorte.png";
import timna from "@/assets/timna-park-eilat-nature.webp";
import jaffaPort from "@/assets/jaffa-port.jpg";
import masadaSunrise from "@/assets/masada-sunrise.jpg";
import camel from "@/assets/chameau-dans-le-désert-du-néguev-51448703.webp";
import bedouinTents from "@/assets/bedouin-tents-comfortably.jpg";
import safed from "@/assets/safed.webp";
import psagotWinery from "@/assets/itineraires/psagot-winery.webp";
import neotSmadar from "@/assets/itineraires/neot-smadar.webp";

const STORAGE = "https://uqeipzfdhyjkjzvqbkeu.supabase.co/storage/v1/object/public";
const stored = (path: string, width = 900) => resizedImageUrl(`${STORAGE}/${path}`, width) as string;

// Photos libres de droits (Unsplash), choisies le 14/10/2026 en attendant les nôtres.
const unsplash = (id: string, width = 900) =>
  `https://images.unsplash.com/photo-${id}?w=${width}&q=75&auto=format&fit=crop`;

export const HERO_IMAGE = heroDesertRoad;

export type Slot = {
  moment: string;
  title: string;
  description?: string;
  /** Petite liste non cliquable : plusieurs possibilités ou tout ce qu'il y a à faire sur place. */
  options?: string[];
  photo?: string;
};

export type Day = {
  number: number;
  title: string;
  /** Phrase sous le titre du jour, quand la journée est à choisir. */
  intro?: string;
  slots: Slot[];
};

export type Chapter = {
  id: string;
  name: string;
  days: string;
  photo: string;
  list: Day[];
};

export const ARRIVAL = {
  label: "Arrival",
  title: "Landing at Ben Gurion",
  description: "Then up to Jerusalem, about 45 minutes away.",
};

export const CHAPTERS: Chapter[] = [
  {
    id: "jerusalem",
    name: "Jerusalem",
    days: "Days 1 to 2",
    photo: unsplash("1697054810280-8e83633002e5", 1600),
    list: [
      {
        number: 1,
        title: "Jerusalem, the classics with a twist",
        slots: [
          {
            moment: "Morning",
            title: "The Old City",
            description:
              "The Western Wall, the Jewish Quarter and the hidden alleys of the souks. With or without a private guide, your call.",
          },
          {
            moment: "Afternoon",
            title: "Zipline over Jerusalem",
            description:
              "731 m of cable, the longest in Israel. You fly over the valley at sunset, the Old City walls right in front of you.",
            photo: stored("swipe-images/zip-line-over-jerusalem-8449f827.png"),
          },
          {
            moment: "Evening",
            title: "King David night show",
            description:
              "Chagall, Matisse and Michelangelo projected onto the ancient citadel walls. VIP seats, a private escort and a glass of wine.",
            photo: stored("experience-images/hero/848d0475-3fbc-4c1c-ba48-8df0cb77c96d.png"),
          },
        ],
      },
      {
        number: 2,
        title: "Jerusalem, then down to the desert",
        slots: [
          {
            moment: "Morning",
            title: "Machane Yehuda market",
            description:
              "Wander on your own, or go deeper with a food tour: spices, halva, fresh pastries and the stalls locals swear by.",
            photo: unsplash("1645028845965-d42def5e1e0f"),
          },
          {
            moment: "Late morning",
            title: "Your Jerusalem moment",
            description: "One of these, depending on your mood:",
            options: [
              "The Dead Sea Scrolls at the Israel Museum",
              "Paint your own tile in the Armenian Quarter",
              "Hebrew calligraphy with a scribe",
              "Hezekiah's 2,700-year-old water tunnel",
            ],
          },
          {
            moment: "Afternoon",
            title: "A winery in the Jerusalem hills",
            description: "A tasting overlooking the Judean Desert.",
            photo: psagotWinery,
          },
          {
            moment: "Evening",
            title: "Drive down to the Dead Sea",
            description: "From the hills to the lowest point on Earth in about an hour. Night by the Dead Sea.",
            photo: deadSea,
          },
        ],
      },
    ],
  },
  {
    id: "desert",
    name: "Arava & Negev",
    days: "Days 3 to 6",
    photo: unsplash("1669544881550-a84682c8d389", 1600),
    list: [
      {
        number: 3,
        title: "Masada, the Arava, Timna",
        slots: [
          {
            moment: "Sunrise",
            title: "Masada at sunrise",
            description:
              "Hike up the Snake Path before dawn and watch the sun rise over the Dead Sea from King Herod's fortress.",
            photo: masadaSunrise,
          },
          {
            moment: "Midday",
            title: "Neot Smadar",
            description: "An organic farm and art center rising out of the desert, unlike anywhere else.",
            photo: neotSmadar,
          },
          {
            moment: "Afternoon & night",
            title: "Timna Park, sleep in the desert",
            description: "Giant red rocks and the world's oldest copper mines. Stay the night and take your time:",
            options: [
              "Solomon's Pillars and the Mushroom rock",
              "Rappelling down the canyon walls",
              "Mountain bike trails across the park",
              "Kayaks on Timna Lake",
              "The ancient copper mines",
            ],
            photo: timna,
          },
        ],
      },
      {
        number: 4,
        title: "Up to Mitzpe Ramon",
        slots: [
          {
            moment: "Morning",
            title: "Drive to Mitzpe Ramon",
            description: "Up through the Arava to the edge of the largest erosion crater in the world.",
          },
          {
            moment: "Afternoon",
            title: "Camel ride",
            description: "The desert at the slowest, oldest pace.",
            photo: camel,
          },
          {
            moment: "Late afternoon",
            title: "Jeep tour in the crater",
            description: "Off-road to the bottom of the crater, where the rocks change color every few kilometers.",
          },
          {
            moment: "Evening",
            title: "Bedouin night",
            description: "Tea, a feast in a desert tent and stories from your hosts. Bedouin hospitality, the real kind.",
            photo: bedouinTents,
          },
        ],
      },
      {
        number: 5,
        title: "Mitzpe Ramon, slowly",
        slots: [
          {
            moment: "Morning",
            title: "Slow morning",
            description: "No alarm. A long breakfast facing the crater.",
          },
          {
            moment: "Afternoon",
            title: "Hike up Mount Ardon",
            description:
              "A climb in the middle of the crater, through rocks of every color, to a 360° view at the top. Half a day, worth every step.",
          },
          {
            moment: "Night",
            title: "Stargazing or night safari",
            description: "One of the darkest skies in the country. Your pick:",
            options: [
              "Stargazing: the Milky Way overhead and Saturn's rings in the telescope",
              "Night safari: foxes, hedgehogs and scorpions glowing under UV light",
            ],
            photo: unsplash("1662960126803-02048050f381"),
          },
        ],
      },
      {
        number: 6,
        title: "Back north to Tel Aviv",
        slots: [
          {
            moment: "Morning",
            title: "A hike to break the road",
            description:
              "A hidden canyon of white cliffs with a spring at the bottom and ibex on the ledges. The kind of place you'd never find on your own.",
          },
          {
            moment: "Sunset",
            title: "Drinks on the beach",
            description: "Welcome to Tel Aviv.",
          },
          {
            moment: "Night",
            title: "A real Tel Aviv night out",
            description: "Dinner at one of the city's buzzing tables, then wherever the night takes you.",
          },
        ],
      },
    ],
  },
  {
    id: "tel-aviv",
    name: "Tel Aviv",
    days: "Days 7 to 12",
    photo: unsplash("1500990702037-7620ccb6a60a", 1600),
    list: [
      {
        number: 7,
        title: "Jaffa",
        slots: [
          {
            moment: "Morning",
            title: "Jaffa flea market",
            description: "Vintage finds, brass, old posters and endless cafés in the alleys around the market.",
          },
          {
            moment: "Afternoon",
            title: "Old Jaffa",
            description: "The port, the artists' alleys and the hill looking straight at the Tel Aviv skyline.",
            photo: jaffaPort,
          },
          {
            moment: "Evening",
            title: "BlackOut, dinner in the dark",
            description: "A meal in total darkness, served by blind waiters. Every other sense takes over.",
          },
        ],
      },
      {
        number: 8,
        title: "Tel Aviv, sea and food",
        slots: [
          {
            moment: "Morning",
            title: "Surf lesson",
            description: "Tel Aviv's waves, made for beginners.",
            photo: unsplash("1561884761-fd0f537ca216"),
          },
          {
            moment: "Afternoon",
            title: "À la carte",
            description: "Pick what tempts you:",
            options: [
              "Cocktail class with a bartender",
              "Cooking class, at the market or with a Jaffa family",
              "Bike tour of Tel Aviv",
              "Hummus masterclass",
              "Street art in Florentin",
              "Bauhaus rooftops",
              "Ceramics in a Jaffa studio",
              "Vintage hunt with a stylist",
              "Spa and hammam",
            ],
          },
          {
            moment: "Evening",
            title: "Private chef dinner",
            description: "A table just for you, a menu created for your group.",
          },
        ],
      },
      {
        number: 9,
        title: "A day out of Tel Aviv",
        intro: "Pick the one that calls you. With a private driver-guide.",
        slots: [
          {
            moment: "Option 1",
            title: "Israel wine tour",
            description: "Vineyards, cellar tastings with the winemakers and lunch in a Druze village on Mount Carmel.",
            photo: stored("swipe-images/sur-la-route-des-vins-eefd8258.png"),
          },
          {
            moment: "Option 2",
            title: "Rosh Hanikra & Akko",
            description:
              "Turquoise sea grottoes carved into white cliffs at the Lebanese border, then the Crusader tunnels and the hummus of Akko.",
            photo: unsplash("1699551177305-342b2ca26d04"),
          },
          {
            moment: "Option 3",
            title: "Mystical Tzfat",
            description: "Blue alleys, artists' studios and the secrets of Kabbalah, high in the Galilee hills.",
            photo: safed,
          },
          {
            moment: "Option 4",
            title: "Hula Valley",
            description:
              "In November, tens of thousands of cranes stop here on their way to Africa. A sight, and a sound, you won't forget.",
            photo: unsplash("1566888948244-49757278470b"),
          },
        ],
      },
      {
        number: 10,
        title: "Tel Aviv, the slow side",
        slots: [
          {
            moment: "Morning",
            title: "Bike along the sea",
            description: "From Jaffa to the old port and the Yarkon park, the whole coastline on two wheels.",
            photo: stored("experience-images/hero/71323135-d1ab-4b80-a98a-8ee0afdf3bf8.png"),
          },
          {
            moment: "Afternoon",
            title: "Neve Tzedek & the White City",
            description:
              "Tel Aviv's first neighborhood, its boutiques and cafés, then the Bauhaus buildings that made the city a UNESCO site.",
          },
          {
            moment: "Sunset",
            title: "Yoga on the beach",
            description: "A private session facing the sea as the sun goes down.",
          },
        ],
      },
      {
        number: 11,
        title: "Out at sea",
        slots: [
          {
            moment: "Morning",
            title: "Lazy beach morning",
            description: "Loungers reserved, nothing to do.",
          },
          {
            moment: "Afternoon",
            title: "Boat trip out at sea",
            description: "A private boat off the Tel Aviv coast, a swim in open water and the sunset from the deck.",
            photo: stored("experience-images/hero/bbc57630-ffa0-4694-ac35-ebe0150b768b.png"),
          },
          {
            moment: "Evening",
            title: "Live jazz & natural wine",
            description: "A small club with live music, then the city's best little wine bars.",
          },
        ],
      },
      {
        number: 12,
        title: "Last day",
        slots: [
          {
            moment: "Morning",
            title: "Breakfast by the sea",
            description: "One last long breakfast, one last swim.",
          },
          {
            moment: "Afternoon",
            title: "Last strolls",
            description: "Dizengoff, the design shops and whatever you promised to bring back.",
          },
          {
            moment: "Then",
            title: "Off to the airport",
            description: "Ben Gurion is 20 minutes away.",
          },
        ],
      },
    ],
  },
];

/** Questions de fin de page : la cliente coche, puis envoie ses réponses sur WhatsApp. */
export type OptionQuestion = {
  title: string;
  description?: string;
  choices: string[];
};

export const LETS_DISCUSS = "I don't know yet, let's discuss";

export const OPTION_QUESTIONS: OptionQuestion[] = [
  {
    title: "Getting around",
    choices: ["A rental car", "A private driver for the whole trip", "Just airport transfers"],
  },
  {
    title: "Guides",
    choices: ["A private guide for each visit", "A guide for some places only", "No guide, we explore on our own"],
  },
  {
    title: "A day at the Nova site and the kibbutzim",
    description:
      "A day in the south to remember October 7: the Nova festival site and the kibbutzim that were attacked, and the people rebuilding them.",
    choices: ["Yes, we'd like that", "No, thank you"],
  },
];

export const PRICING = {
  hotels:
    "Since you're a travel agency, we'll leave the hotel bookings to you, and we're happy to point you to the right places for each stop, depending on what your group is looking for.",
  service:
    "What you see here is the big picture, a first sketch of what your trip could look like. From here we go much further: we dig out the hidden spots and exclusive experiences most visitors never hear of, shape every day around your group and book it all for you.",
  price: "$250 per person",
  priceNote:
    "For designing and organizing the whole trip. The experiences themselves come on top, and we'll share every price with you before booking anything.",
};
