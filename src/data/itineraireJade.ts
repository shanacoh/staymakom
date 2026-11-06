// Contenu de la page itinéraire de Jade (du dimanche 8 au dimanche 15 novembre 2026), en anglais.
// Uniquement ce que la cliente peut voir : les notes internes (prestataires, contraintes)
// ne doivent JAMAIS être écrites ici, elles partiraient dans le site public.
// Repris de la page de Rebeca (src/data/itineraireRebeca.ts).

import { resizedImageUrl } from "@/lib/imageUrl";
import heroDesertRoad from "@/assets/hero-road-desert.jpg";
import jaffaPort from "@/assets/jaffa-port.jpg";
import camel from "@/assets/chameau-dans-le-désert-du-néguev-51448703.webp";
import bedouinTents from "@/assets/bedouin-tents-comfortably.jpg";
import safed from "@/assets/safed.webp";
import psagotWinery from "@/assets/itineraires/psagot-winery.webp";

const STORAGE = "https://uqeipzfdhyjkjzvqbkeu.supabase.co/storage/v1/object/public";
const stored = (path: string, width = 900) => resizedImageUrl(`${STORAGE}/${path}`, width) as string;

// Photos libres de droits (Unsplash), les mêmes que sur la page de Rebeca.
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
  /** Jour de la semaine et date, affichés à côté du numéro du jour. */
  date: string;
  title: string;
  /** Phrase sous le titre du jour, quand la journée est à choisir. */
  intro?: string;
  slots: Slot[];
};

/** Une façon de finir le séjour : plusieurs jours qui se suivent, au choix de la cliente. */
export type Variant = {
  label: string;
  title: string;
  description: string;
  list: Day[];
};

export type Chapter = {
  id: string;
  name: string;
  days: string;
  photo: string;
  /** Phrase sous la photo du chapitre. */
  intro?: string;
  list: Day[];
  /** Fin de séjour à choisir : chaque option est présentée l'une après l'autre. */
  variants?: Variant[];
};

export const DATES = "Sunday 8 to Sunday 15 November";

export const ARRIVAL = {
  label: "Sunday 8 November",
  title: "Landing at Ben Gurion",
  description: "We pick you up and drive you up to Jerusalem, about 45 minutes away.",
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
        date: "Sun 8 Nov",
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
        date: "Mon 9 Nov",
        title: "Jerusalem, then on to Tel Aviv",
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
            title: "Down to Tel Aviv",
            description: "About an hour's drive to the coast. Dinner and a first walk by the sea.",
          },
        ],
      },
    ],
  },
  {
    id: "tel-aviv",
    name: "Tel Aviv",
    days: "Days 3 to 5",
    photo: unsplash("1500990702037-7620ccb6a60a", 1600),
    list: [
      {
        number: 3,
        date: "Tue 10 Nov",
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
        number: 4,
        date: "Wed 11 Nov",
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
            description: "A table just for you, a menu created for you.",
          },
        ],
      },
      {
        number: 5,
        date: "Thu 12 Nov",
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
    ],
  },
  {
    id: "options",
    name: "Your options",
    days: "Days 6 to 8",
    photo: unsplash("1669544881550-a84682c8d389", 1600),
    intro: "Two ways to end the trip. Pick the one that feels right.",
    list: [],
    variants: [
      {
        label: "Option 1",
        title: "A day out of Tel Aviv",
        description: "Stay based in Tel Aviv and escape for a day with a private driver-guide.",
        list: [
          {
            number: 6,
            date: "Fri 13 Nov",
            title: "A day out of Tel Aviv",
            intro: "Pick the one that calls you. With a private driver-guide.",
            slots: [
              {
                moment: "Option 1",
                title: "Israel wine tour",
                description:
                  "Vineyards, cellar tastings with the winemakers and lunch in a Druze village on Mount Carmel.",
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
            number: 7,
            date: "Sat 14 Nov",
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
        ],
      },
      {
        label: "Option 2",
        title: "Six Senses, in the desert",
        description: "Two nights at Six Senses Shaharut, high above the Arava, with the desert all to yourselves.",
        list: [
          {
            number: 6,
            date: "Fri 13 Nov",
            title: "Down to the desert",
            slots: [
              {
                moment: "Morning",
                title: "Drive to Six Senses Shaharut",
                description: "South through the Negev to a cliff above the Arava, with the mountains of Edom on the horizon.",
              },
              {
                moment: "Afternoon",
                title: "Camel ride",
                description: "The desert at the slowest, oldest pace.",
                photo: camel,
              },
              {
                moment: "Late afternoon",
                title: "Jeep tour in the desert",
                description: "Off-road through canyons and dry riverbeds, where the rocks change color every few kilometers.",
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
            number: 7,
            date: "Sat 14 Nov",
            title: "The desert, slowly",
            slots: [
              {
                moment: "Morning",
                title: "Slow morning",
                description: "No alarm. A long breakfast facing the desert.",
              },
              {
                moment: "Afternoon",
                title: "A desert hike",
                description:
                  "A climb through rocks of every color to a 360° view at the top. Half a day, worth every step.",
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
        ],
      },
    ],
  },
];

export const DEPARTURE = {
  label: "Sunday 15 November",
  title: "Off to Ben Gurion",
  description: "One last breakfast, then your driver takes you to the airport.",
};

/** Tout ce qu'on peut réserver et organiser pour la cliente, pour qu'elle n'ait rien à gérer sur place. */
export const SERVICES = {
  title: "We take care of everything",
  intro: "You just enjoy. We can book and organize it all for you:",
  list: [
    { title: "Airport pick-up", description: "A driver waiting for you at Ben Gurion, and back on the last day." },
    { title: "Every transfer", description: "A taxi or private driver from one place to the next, Jerusalem, Tel Aviv, the desert." },
    { title: "Hotels", description: "The right place for each stop, booked for you." },
    { title: "Experiences & guides", description: "Every activity on this page, reserved at the right time." },
    { title: "Restaurants", description: "The tables that are hard to get, booked ahead." },
  ],
};

/** Questions de fin de page : la cliente coche, puis envoie ses réponses sur WhatsApp. */
export type OptionQuestion = {
  title: string;
  description?: string;
  choices: string[];
};

export const LETS_DISCUSS = "I don't know yet, let's discuss";

export const OPTION_QUESTIONS: OptionQuestion[] = [
  {
    title: "The end of the trip",
    choices: ["Option 1: a day out of Tel Aviv", "Option 2: Six Senses in the desert"],
  },
  {
    title: "Getting around",
    choices: [
      "Airport pick-up and drop-off",
      "Taxis between each stop",
      "A private driver for the whole trip",
      "A rental car",
    ],
  },
  {
    title: "What should we book for you?",
    choices: ["Hotels", "Experiences and guides", "Restaurants", "All of it"],
  },
  {
    title: "Guides",
    choices: ["A private guide for each visit", "A guide for some places only", "No guide, we explore on our own"],
  },
];
