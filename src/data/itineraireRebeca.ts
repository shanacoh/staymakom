// Contenu de la page itinéraire de Rebeca (dossier TM-1006), en anglais.
// Uniquement ce que la cliente peut voir : les notes internes (prestataires, contraintes)
// ne doivent JAMAIS être écrites ici, elles partiraient dans le site public.
// Elles sont dans docs/itineraires/TM-1006-rebeca.md.

import { resizedImageUrl } from "@/lib/imageUrl";
import heroDesertRoad from "@/assets/hero-road-desert.jpg";
import deadSea from "@/assets/mermorte.png";
import timna from "@/assets/timna-park-eilat-nature.webp";
import jaffaPort from "@/assets/jaffa-port.jpg";
import desert from "@/assets/desert-hero.jpg";

const STORAGE = "https://uqeipzfdhyjkjzvqbkeu.supabase.co/storage/v1/object/public";
const stored = (path: string, width = 900) => resizedImageUrl(`${STORAGE}/${path}`, width) as string;

export const HERO_IMAGE = heroDesertRoad;

// Lien Swipe du dossier TM-1006 : c'est là que la cliente fait ses choix.
export const SWIPE_URL = "/swipe/bde1d0ccdde8c27c20c7314a34fd56c2?lang=en";

/** Un moment déjà décidé : affiché tel quel, avec une photo quand on en a une. */
export type FixedSlot = {
  kind: "fixed";
  moment: string;
  title: string;
  description?: string;
  photo?: string;
};

/** Un moment laissé au choix de la cliente : renvoie vers le Swipe du dossier. */
export type ChoiceSlot = {
  kind: "choice";
  moment: string;
  title: string;
  description?: string;
  /** Quelques idées pour donner envie, sans tout dévoiler. */
  ideas: string[];
  /** Nombre total d'idées à swiper dans cette catégorie. */
  count: number;
};

export type Slot = FixedSlot | ChoiceSlot;

export type Day = {
  number: number;
  title: string;
  slots: Slot[];
};

export type Chapter = {
  id: string;
  name: string;
  days: string;
  photo: string;
  list: Day[];
};

// Les catégories du Swipe : une seule définition par catégorie, réutilisée par plusieurs jours.
const choice = (moment: string, title: string, ideas: string[], count: number, description?: string): ChoiceSlot => ({
  kind: "choice",
  moment,
  title,
  description,
  ideas,
  count,
});

const TLV_A_LA_CARTE = ["Cooking with a Jaffa family", "Bauhaus rooftops", "Surf lesson"];
const TLV_NIGHTS = ["Cocktails in a speakeasy", "Jazz night", "Natural wine bar crawl"];

export const CHAPTERS: Chapter[] = [
  {
    id: "jerusalem",
    name: "Jerusalem",
    days: "Days 1 to 2",
    photo: stored("experience-images/hero/848d0475-3fbc-4c1c-ba48-8df0cb77c96d.png", 1600),
    list: [
      {
        number: 1,
        title: "Jerusalem, the classics with a twist",
        slots: [
          {
            kind: "fixed",
            moment: "Morning",
            title: "The Old City with a private guide",
            description: "The Western Wall, the Jewish Quarter and the hidden alleys of the souks.",
          },
          {
            kind: "fixed",
            moment: "Afternoon",
            title: "City of David + Israel's longest zipline",
            description: "Walk the ancient city, then fly 731 m over the valley at sunset, facing the Old City walls.",
            photo: stored("swipe-images/zip-line-over-jerusalem-8449f827.png"),
          },
          {
            kind: "fixed",
            moment: "Evening",
            title: "Machane Yehuda by night",
            description: "By day a market, by night the city's liveliest bar scene.",
          },
          choice("Dinner", "Dinner in Jerusalem", ["Biblical cuisine", "Rooftop facing the walls", "Private chef dinner"], 5),
        ],
      },
      {
        number: 2,
        title: "Jerusalem, art and history",
        slots: [
          {
            kind: "fixed",
            moment: "Morning",
            title: "The Dead Sea Scrolls at the Israel Museum",
            description: "The oldest biblical manuscripts in the world, in their iconic white shrine.",
          },
          choice("Afternoon", "An afternoon in Jerusalem", ["Write your name like a scribe", "Ein Kerem", "Coffee on a secret rooftop"], 7),
          {
            kind: "fixed",
            moment: "Evening",
            title: "King David night show, VIP seats",
            description:
              "Chagall, Matisse and Michelangelo projected onto the ancient citadel walls. VIP: private escort, best balcony seats, glass of wine.",
            photo: stored("experience-images/hero/848d0475-3fbc-4c1c-ba48-8df0cb77c96d.png"),
          },
        ],
      },
    ],
  },
  {
    id: "desert",
    name: "Arava & Negev",
    days: "Days 3 to 6",
    photo: desert,
    list: [
      {
        number: 3,
        title: "From the hills to the desert",
        slots: [
          {
            kind: "fixed",
            moment: "Morning",
            title: "Winery visit and brunch in the hills above Jerusalem",
            description: "Tasting and brunch overlooking the Judean Desert.",
          },
          choice("Midday", "A stop on the way down", ["Masada by cable car", "Qumran", "Mount Sodom salt caves"], 4),
          {
            kind: "fixed",
            moment: "Afternoon",
            title: "Floating in the Dead Sea",
            description: "The lowest point on Earth, and the strangest swim of your life.",
            photo: deadSea,
          },
          {
            kind: "fixed",
            moment: "Evening",
            title: "Dinner under the Arava stars",
            description: "Arrival in the desert, dinner and a sky full of stars.",
            photo: stored("swipe-images/stargazing-and-dinner-1e752f48.png"),
          },
        ],
      },
      {
        number: 4,
        title: "The Arava",
        slots: [
          {
            kind: "fixed",
            moment: "Morning",
            title: "Timna Park",
            description: "Giant red rock formations and the world's oldest copper mines.",
            photo: timna,
          },
          {
            kind: "fixed",
            moment: "Afternoon",
            title: "Neot Smadar",
            description: "An organic farm and art center rising out of the desert, unlike anywhere else.",
          },
          {
            kind: "fixed",
            moment: "Evening",
            title: "Drive up to Mitzpe Ramon",
            description: "Dinner on the edge of the crater.",
            photo: stored("hotel-images/hyperguest-1782405005661-0.jpg"),
          },
        ],
      },
      {
        number: 5,
        title: "Mitzpe Ramon",
        slots: [
          choice("Morning", "Your desert adventure", ["Jeep in the crater", "Desert Rider", "Rappel into the crater"], 4),
          {
            kind: "fixed",
            moment: "Afternoon",
            title: "Picnic with the alpacas + desert wine tasting",
            description: "Lunch among the alpacas, then wines grown in the middle of the desert.",
          },
          {
            kind: "fixed",
            moment: "Evening",
            title: "Stargazing",
            description: "One of the darkest skies in the country.",
            photo: stored("swipe-images/une-nuit-dans-le-grand-desert-c423d903.png"),
          },
          choice("Optional", "Desert extras", ["Camel ride", "Night with an astronomer", "Bedouin dinner"], 7),
        ],
      },
      {
        number: 6,
        title: "Back north to Tel Aviv",
        slots: [
          {
            kind: "fixed",
            moment: "Morning",
            title: "Ein Avdat canyon",
            description: "A spring and white cliffs hidden in the desert.",
          },
          {
            kind: "fixed",
            moment: "Midday",
            title: "Lunch at a goat cheese farm",
            description: "Farm-made cheeses on the incense route.",
          },
          {
            kind: "fixed",
            moment: "Afternoon",
            title: "Sde Boker, then drive to Tel Aviv",
            description: "Ben Gurion's resting place overlooking the canyon.",
          },
          {
            kind: "fixed",
            moment: "Evening",
            title: "Sunset drinks on the beach",
            description: "Welcome to Tel Aviv.",
          },
        ],
      },
    ],
  },
  {
    id: "tel-aviv",
    name: "Tel Aviv",
    days: "Days 7 to 12",
    photo: jaffaPort,
    list: [
      {
        number: 7,
        title: "Jaffa",
        slots: [
          {
            kind: "fixed",
            moment: "Morning",
            title: "Old Jaffa and breakfast",
            description:
              "The flea market, a breakfast where you can buy the plates you eat from, and an artist's museum overlooking the sea.",
            photo: jaffaPort,
          },
          { kind: "fixed", moment: "Afternoon", title: "Free time in Jaffa" },
          {
            kind: "fixed",
            moment: "Evening",
            title: "Dinner in total darkness",
            description: "Served by blind waiters, a meal where every other sense takes over.",
          },
        ],
      },
      {
        number: 8,
        title: "A day beyond Tel Aviv",
        slots: [
          choice(
            "Full day",
            "Your day trip",
            ["Wine route", "Tzfat, city of mystics", "Rosh Hanikra & Akko"],
            5,
            "With a private driver-guide."
          ),
        ],
      },
      {
        number: 9,
        title: "Tel Aviv food & culture",
        slots: [
          {
            kind: "fixed",
            moment: "Morning",
            title: "Market food tour",
            description: "Spices, Persian sweets and Yemenite street food with a local foodie.",
          },
          choice("Afternoon", "Tel Aviv à la carte", TLV_A_LA_CARTE, 14),
          choice("Evening", "Tel Aviv nights", TLV_NIGHTS, 7),
        ],
      },
      {
        number: 10,
        title: "Tel Aviv by the sea",
        slots: [
          {
            kind: "fixed",
            moment: "Morning",
            title: "Bike ride along the sea and the Yarkon park",
            photo: stored("experience-images/hero/71323135-d1ab-4b80-a98a-8ee0afdf3bf8.png"),
          },
          {
            kind: "fixed",
            moment: "Afternoon",
            title: "Private boat at sunset",
            description: "Sailing off the Tel Aviv coastline as the sun goes down.",
            photo: stored("experience-images/hero/bbc57630-ffa0-4694-ac35-ebe0150b768b.png"),
          },
          choice("Evening", "Tel Aviv nights", TLV_NIGHTS, 7),
        ],
      },
      {
        number: 11,
        title: "Your day",
        slots: [choice("Full day", "Tel Aviv à la carte", TLV_A_LA_CARTE, 14)],
      },
      {
        number: 12,
        title: "Last day",
        slots: [
          choice("Day", "Tel Aviv à la carte", TLV_A_LA_CARTE, 14),
          {
            kind: "fixed",
            moment: "Evening",
            title: "Farewell dinner with a private chef",
            description: "An exceptional venue, a menu created for your group.",
          },
        ],
      },
    ],
  },
];

export const ARRIVAL = {
  label: "Arrival",
  title: "Private airport transfer to Jerusalem",
  description: "We pick you up at Ben Gurion and drive you straight to your hotel.",
};

export const DEPARTURE = {
  label: "Departure",
  title: "Private transfer to the airport",
  description: "",
};
