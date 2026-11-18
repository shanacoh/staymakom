// Contenu de la page itinéraire de Vern (du vendredi 8 au vendredi 15 janvier 2027), en anglais.
// Uniquement ce que le client peut voir : les notes internes (prestataires, contraintes)
// ne doivent JAMAIS être écrites ici, elles partiraient dans le site public.
// Repris de la page de Jade (src/data/itineraireJade.ts).
// Vern voyage seul, il est déjà à Tel Aviv du 3 au 7 janvier et passe Shabbat à Jérusalem.
// Ses centres d'intérêt : histoire, politique, authenticité, monde de l'entreprise.

import { resizedImageUrl } from "@/lib/imageUrl";
import heroDesertRoad from "@/assets/hero-road-desert.jpg";
import deadSea from "@/assets/mermorte.png";
import masadaSunrise from "@/assets/masada-sunrise.jpg";
import psagotWinery from "@/assets/itineraires/psagot-winery.webp";
import neotSmadar from "@/assets/itineraires/neot-smadar.webp";
// Photo de la Knesset : « Knesset front side - 2022 », Clema12, Wikimedia Commons, licence CC BY-SA 4.0 (crédit en pied de page).
import knesset from "@/assets/itineraires/knesset.webp";
import bedouinTents from "@/assets/bedouin-tents-comfortably.jpg";

const STORAGE = "https://uqeipzfdhyjkjzvqbkeu.supabase.co/storage/v1/object/public";
const stored = (path: string, width = 900) => resizedImageUrl(`${STORAGE}/${path}`, width) as string;

// Photos libres de droits (Unsplash), les mêmes que sur les pages de Rebeca et Jade.
const unsplash = (id: string, width = 900) =>
  `https://images.unsplash.com/photo-${id}?w=${width}&q=75&auto=format&fit=crop`;

export const HERO_IMAGE = heroDesertRoad;

export const TRAVELER = "Vern";

export const DATES = "Friday 8 to Friday 15 January";

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

/** Une façon de faire une journée, au choix du client : résumée en quelques étapes courtes. */
export type Variant = {
  label: string;
  title: string;
  description: string;
  items: string[];
};

export type Chapter = {
  id: string;
  name: string;
  days: string;
  photo: string;
  /** Phrase sous la photo du chapitre. */
  intro?: string;
  list: Day[];
  /** Bandeau qui annonce le choix, affiché juste avant les options. */
  choice?: { label: string; title: string; intro: string };
  /** Journée à choisir : les options sont résumées côte à côte dans un seul bandeau. */
  variants?: Variant[];
};

export const ARRIVAL = {
  label: "Friday 8 January",
  title: "From Tel Aviv to Jerusalem",
  description: "We pick you up at your Tel Aviv hotel and drive you up to Jerusalem, about an hour away.",
};

export const CHAPTERS: Chapter[] = [
  {
    id: "jerusalem",
    name: "Jerusalem",
    days: "Days 1 to 3",
    photo: unsplash("1697054810280-8e83633002e5", 1600),
    intro: "Shabbat, then the city's history and politics up close.",
    list: [
      {
        number: 1,
        date: "Fri 8 Jan",
        title: "Shabbat comes to Jerusalem",
        slots: [
          {
            moment: "Morning",
            title: "Machane Yehuda, Friday rush",
            description:
              "The whole city shops for Shabbat at once: challah, spices, flowers and the stalls locals swear by.",
            photo: unsplash("1645028845965-d42def5e1e0f"),
          },
          {
            moment: "Afternoon",
            title: "The Old City",
            description:
              "The Jewish, Christian, Muslim and Armenian quarters, and 3,000 years of history in a square kilometer. With a guide who tells it straight.",
          },
          {
            moment: "Sunset",
            title: "Shabbat at the Western Wall",
            description: "The city goes quiet and the Wall fills with prayer and song. Something to see once in a life.",
          },
          {
            moment: "Evening",
            title: "Shabbat dinner with a local family",
            description: "At their table, in their home. Blessings, wine, long conversations and no phones.",
          },
        ],
      },
      {
        number: 2,
        date: "Sat 9 Jan",
        title: "Jerusalem on Shabbat",
        slots: [
          {
            moment: "Morning",
            title: "The quiet city",
            description: "No cars, no rush. A walk through the old neighborhoods, with a synagogue service if you like:",
            options: ["Rehavia and its Bauhaus villas", "The German Colony", "Yemin Moshe and the windmill"],
          },
          {
            moment: "Afternoon",
            title: "The Israel Museum",
            description:
              "The Dead Sea Scrolls in the Shrine of the Book and the giant model of Jerusalem in the time of the Second Temple.",
          },
          {
            moment: "Evening",
            title: "The city switches back on",
            description:
              "When three stars appear, Shabbat ends and Jerusalem comes alive. Dinner and drinks in the market's bars.",
          },
        ],
      },
      {
        number: 3,
        date: "Sun 10 Jan",
        title: "History and politics",
        slots: [
          {
            moment: "Morning",
            title: "Yad Vashem",
            description: "The World Holocaust Remembrance Center, with a guide. The key to understanding the country.",
          },
          {
            moment: "Afternoon",
            title: "The Knesset",
            description:
              "A tour of Israel's parliament, and when it's sitting, a debate from the gallery. Chagall's tapestries are in the hall.",
            photo: knesset,
          },
          {
            moment: "Late afternoon & evening",
            title: "Your pick",
            description: "One or two of these, depending on what you're curious about:",
            options: [
              "An off-the-record briefing with a journalist or political analyst",
              "Startup Nation over dinner, with a founder or investor",
              "The Museum of Tolerance, Jerusalem's newest landmark",
              "The Supreme Court building, with a guide",
              "Mount Herzl, where Israel's leaders are buried",
              "A tasting tour of Jerusalem's craft beer and whisky bars",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "hills",
    name: "Hills & Dead Sea",
    days: "Day 4",
    photo: psagotWinery,
    intro: "Out of the city to the vineyards, then down to the lowest point on Earth.",
    list: [
      {
        number: 4,
        date: "Mon 11 Jan",
        title: "The Judean hills, then down to the Dead Sea",
        slots: [
          {
            moment: "Morning",
            title: "Your last Jerusalem story",
            description: "One of these, depending on your mood:",
            options: [
              "The City of David, where Jerusalem began",
              "The Western Wall tunnels",
              "The Tower of David museum",
              "The Mount of Olives at sunrise",
            ],
          },
          {
            moment: "Midday",
            title: "A kibbutz that became a business",
            description:
              "A kibbutz in the hills, founded in 1948, that turned its fields into a winery, a hotel and an industry. Lunch with a member who lived it.",
          },
          {
            moment: "Afternoon",
            title: "A winery in the Judean hills",
            description: "A boutique cellar and a tasting with the winemaker, looking down over the valleys.",
            photo: psagotWinery,
          },
          {
            moment: "Evening",
            title: "Down to the Dead Sea",
            description: "From the hills to the lowest point on Earth in about an hour and a half. Night by the Dead Sea.",
            photo: deadSea,
          },
        ],
      },
    ],
  },
  {
    id: "desert",
    name: "Arava & Negev",
    days: "Days 5 to 7",
    photo: unsplash("1669544881550-a84682c8d389", 1600),
    intro: "South along the Arava, then back up through the crater.",
    list: [
      {
        number: 5,
        date: "Tue 12 Jan",
        title: "Masada, then the Arava",
        slots: [
          {
            moment: "Sunrise",
            title: "Masada at sunrise",
            description:
              "Up the Snake Path before dawn to King Herod's fortress, and the story of the last stand against Rome.",
            photo: masadaSunrise,
          },
          {
            moment: "Late morning",
            title: "A float in the Dead Sea",
            description: "Salt, mud and a sea you can't sink in. Even in January the water is mild.",
          },
          {
            moment: "Afternoon",
            title: "Farming the desert",
            description:
              "The Arava research station where Israeli agritech was born: vegetables, dates and fish grown with almost no water.",
          },
          {
            moment: "Night",
            title: "Sleep in the Arava",
            description: "A night in the middle of the desert, far from everything, under a sky full of stars.",
          },
        ],
      },
      {
        number: 6,
        date: "Wed 13 Jan",
        title: "A day in the Arava",
        slots: [
          {
            moment: "Morning",
            title: "Neot Smadar",
            description:
              "A community that built an organic farm and art center out of the desert. Coffee and a talk with the people who live there.",
            photo: neotSmadar,
          },
          {
            moment: "Afternoon",
            title: "Jeep tour in the crater",
            description:
              "Off-road to the bottom of Ramon Crater, the largest of its kind in the world, where the rocks change color every few kilometers.",
          },
          {
            moment: "Evening",
            title: "Bedouin dinner",
            description:
              "Tea and a feast in a desert tent, and a frank conversation about Bedouin life in Israel today.",
            photo: bedouinTents,
          },
          {
            moment: "Night",
            title: "Stargazing",
            description: "One of the darkest skies in the country. The Milky Way overhead and Saturn's rings in the telescope.",
            photo: unsplash("1662960126803-02048050f381"),
          },
        ],
      },
    ],
    choice: {
      label: "Day 7 · Thu 14 Jan · Your choice",
      title: "Two ways back to Tel Aviv",
      intro: "Pick the one that speaks to you. Both end with dinner by the sea.",
    },
    variants: [
      {
        label: "Option 1",
        title: "Mitzpe Ramon",
        description: "One more morning in the desert, then back to Tel Aviv.",
        items: [
          "Sunrise walk on the crater rim",
          "Ben-Gurion's desert hut at Sde Boker",
          "A short hike in Ein Avdat canyon",
          "Drive back to Tel Aviv",
          "A last dinner by the sea",
        ],
      },
      {
        label: "Option 2",
        title: "The south, after October 7",
        description: "A day to understand, with the people who were there.",
        items: [
          "The Nova festival memorial",
          "A border kibbutz, with a resident",
          "The people rebuilding the south",
          "Drive back to Tel Aviv",
          "A last dinner by the sea",
        ],
      },
    ],
  },
];

export const DEPARTURE = {
  label: "Friday 15 January",
  title: "Off to Ben Gurion",
  description: "Your driver picks you up at your hotel for your morning flight. The airport is 20 minutes away.",
};

/** Phrase juste avant le bouton WhatsApp : la suite, et les frais d'organisation. */
export const NEXT_STEP =
  "If you'd like to move forward, a $150 planning fee will apply to the further organization of your trip.";

export const PHOTO_CREDITS = "Knesset photo: Clema12, CC BY-SA 4.0, via Wikimedia Commons";

/** Questions de fin de page : le client coche, puis envoie ses réponses sur WhatsApp. */
export type OptionQuestion = {
  title: string;
  description?: string;
  choices: string[];
};

export const LETS_DISCUSS = "I don't know yet, let's discuss";

export const WHATSAPP_INTRO = "Hi Shana! Here are my answers for the Israel itinerary (Vern, 8 to 15 January):";

export const OPTION_QUESTIONS: OptionQuestion[] = [
  {
    title: "Your last day, Thursday 14 January",
    choices: ["Option 1: Mitzpe Ramon", "Option 2: the Nova site and the kibbutzim"],
  },
  {
    title: "Your week in Tel Aviv, 3 to 7 January",
    description:
      "You're already in Tel Aviv that week. Would you like us to add a few things to it? A tech or political tour, Jaffa with a historian, a cooking class, a dinner with locals...",
    choices: [
      "Yes, things to do on my own",
      "Yes, things to do with other people (small groups, classes, dinners)",
      "No thanks, I'm all set",
    ],
  },
  {
    title: "Getting around",
    choices: ["A private driver for the whole week", "A private driver between stops only", "A rental car"],
  },
  {
    title: "Guides",
    choices: ["A private guide for each visit", "A guide for some places only", "No guide, I'll explore on my own"],
  },
  {
    title: "What should we book for you?",
    choices: ["Hotels", "Experiences and guides", "Restaurants", "All of it"],
  },
];
