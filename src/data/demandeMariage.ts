// Contenu de la page de proposition « demande en mariage », en français (client francophone).
// Uniquement ce que le client peut voir : les notes internes (prestataires, prix d'achat)
// ne doivent JAMAIS être écrites ici, elles partiraient dans le site public.

import { resizedImageUrl } from "@/lib/imageUrl";
import heroDesertRoad from "@/assets/hero-road-desert.jpg";
import caesarea from "@/assets/cesarea.jpg";
import psagotWinery from "@/assets/itineraires/psagot-winery.webp";

const STORAGE = "https://uqeipzfdhyjkjzvqbkeu.supabase.co/storage/v1/object/public";
const stored = (path: string, width = 900) => resizedImageUrl(`${STORAGE}/${path}`, width) as string;

// Photos libres de droits (Unsplash) pour ce qu'on n'a pas dans nos fiches.
const unsplash = (id: string, width = 900) =>
  `https://images.unsplash.com/photo-${id}?w=${width}&q=75&auto=format&fit=crop`;

export const HERO_IMAGE = heroDesertRoad;

export type Choice = {
  title: string;
  description: string;
  photo: string;
};

export type Chapter = {
  id: string;
  number: string;
  /** Pastille au-dessus du titre (ex. « Option A »). */
  label: string;
  title: string;
  tagline: string;
  intro: string;
  /** Grande photo d'ouverture du chapitre, quand il en a une. */
  banner?: string;
  choices: Choice[];
};

export const CHAPTERS: Chapter[] = [
  {
    id: "saturday-night",
    number: "01",
    label: "Option A · Samedi soir",
    title: "Samedi soir",
    tagline: "Une célébration privée et intime.",
    intro: "Shabbat est terminé, la soirée est à vous. Choisissez le décor de votre demande.",
    choices: [
      {
        title: "Villa privée",
        description: "Une villa décorée rien que pour vous, suivie d'un dîner privé.",
        photo: unsplash("1600596542815-ffad4c1539a9"),
      },
      {
        title: "Sur la plage",
        description: "Une installation romantique sur le sable, suivie d'un dîner au restaurant.",
        photo: unsplash("1494774157365-9e04c6720e47"),
      },
      {
        title: "Jardin privatisé",
        description: "Un jardin rien qu'à vous, avec fleurs, bougies et dîner.",
        photo: unsplash("1529636798458-92182e662485"),
      },
      {
        title: "Rooftop privé",
        description: "Un rooftop aménagé pour une demande intime, suivie d'un dîner.",
        photo: unsplash("1559339352-11d035aa65de"),
      },
      {
        title: "Dîner privé",
        description: "Un dîner gastronomique préparé par un chef privé, dans un cadre pensé pour ce moment.",
        photo: stored("experience-images/hero/b5232ae6-0962-4002-9092-cefff6538165.jpeg"),
      },
    ],
  },
  {
    id: "friday-afternoon",
    number: "02",
    label: "Option B · Vendredi après-midi",
    title: "Vendredi après-midi",
    tagline: "Une expérience avant la grande question.",
    intro: "Vivez un moment inoubliable à deux, puis faites votre demande. Choisissez l'aventure qui vous ressemble.",
    choices: [
      {
        title: "En bateau",
        description: "Une balade privée en bateau, la demande se fait à bord.",
        photo: stored("experience-images/gallery/catamaran-38-herzliya-8e8ca8f6.png"),
      },
      {
        title: "À cheval",
        description: "Une balade à cheval, suivie de la demande sur la plage.",
        photo: stored("experience-images/hero/dfdf6f96-2c72-451c-9d61-e4476c7eb070.jpeg"),
      },
      {
        title: "Pique-nique sur la plage",
        description: "Une installation romantique et un pique-nique sur une plage isolée.",
        photo: stored("experience-images/hero/192ec9d4-582e-47c8-a431-05d60ee095d8.jpeg"),
      },
      {
        title: "En montgolfière",
        description: "Un vol en montgolfière au-dessus des paysages, suivi de la demande.",
        photo: unsplash("1507608616759-54f48f0af0ee"),
      },
      {
        title: "Saut en parachute",
        description: "Un saut en parachute à deux, et la demande à l'atterrissage.",
        photo: unsplash("1601024445121-e5b82f020549"),
      },
      {
        title: "Césarée",
        description: "Une mise en scène romantique dans les ruines romaines, face à la mer.",
        photo: caesarea,
      },
      {
        title: "Au domaine viticole",
        description: "Une demande dans un domaine viticole des collines de Jérusalem.",
        photo: psagotWinery,
      },
    ],
  },
  {
    id: "celebration",
    number: "03",
    label: "La fête",
    title: "Ceux qu'on aime",
    tagline: "Après la demande, la famille.",
    intro: "Deux façons de réunir tout le monde pour fêter le oui.",
    choices: [
      {
        title: "Vendredi soir · Shabbat en famille",
        description: "Un dîner de Shabbat en famille dans une villa privée.",
        photo: unsplash("1519225421980-715cb0215aed"),
      },
      {
        title: "Samedi soir · Dîner de fête",
        description: "Un dîner festif en famille, au restaurant ou dans une villa avec chef privé.",
        photo: unsplash("1414235077428-338989a2e8c0"),
      },
    ],
  },
  {
    id: "new-york",
    number: "04",
    label: "Le chapitre suivant",
    title: "New York",
    tagline: "Une deuxième surprise, juste après le oui.",
    intro: "Trois idées pour lui annoncer le voyage à New York.",
    banner: unsplash("1485871981521-5b1fd3805eee", 1600),
    choices: [
      {
        title: "La pièce manquante",
        description:
          "Un puzzle sur mesure qui raconte votre histoire, façon « Où est Charlie ? ». À la fin, il manque une pièce : c'est vous qui l'avez, et elle révèle NEW YORK.",
        photo: unsplash("1494059980473-813e73ee784b"),
      },
      {
        title: "La chasse au trésor",
        description:
          "Une chasse au trésor romantique : chaque indice retrace votre histoire et mène, étape par étape, à la destination finale, New York.",
        photo: unsplash("1524661135-423995f22d0b"),
      },
      {
        title: "La boîte mystère",
        description:
          "Une boîte personnalisée remplie d'objets et d'indices sur New York, avec les billets d'avion en guise de révélation finale.",
        photo: unsplash("1549465220-1a8b9238cd48"),
      },
    ],
  },
];

export const WHATSAPP_INTRO = "Bonjour Staymakom ! Voici ce qui me plaît pour la demande en mariage :";
