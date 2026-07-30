import type { Language } from "@/hooks/useLanguage";
import type { SwipeDeckCard, SwipeDeckCardRaw } from "./types";

export type SwipeLang = Language;

// À la différence de getLocalizedField() (src/hooks/useLanguage.tsx), le champ sans suffixe n'est
// PAS l'anglais ici : c'est le français (voir la migration 20260729010000_swipe_module_multilingue.sql
// pour le pourquoi). Il faut donc son propre résolveur — sinon, en anglais, la carte retombe tout
// de suite sur le champ de base (français) au lieu de vérifier _en, puisque le champ de base n'est
// presque jamais vide (le français est obligatoire à la saisie).
export const localizeText = (base: string | null, en: string | null, he: string | null, lang: SwipeLang): string | null => {
  if (lang === "en") return en ?? base;
  if (lang === "he") return he ?? base;
  return base;
};

/** Résout une carte brute (3 langues à la fois) dans la langue choisie par le client. */
export const localizeSwipeDeckCard = (card: SwipeDeckCardRaw, lang: SwipeLang): SwipeDeckCard => ({
  dossier_proposition_id: card.dossier_proposition_id,
  ordre: card.ordre,
  titre: localizeText(card.titre, card.titre_en, card.titre_he, lang) ?? card.titre,
  description: localizeText(card.description, card.description_en, card.description_he, lang),
  photo_url: card.photo_url,
  nom_hotel: localizeText(card.nom_hotel, card.nom_hotel_en, card.nom_hotel_he, lang),
  ville: localizeText(card.ville, card.ville_en, card.ville_he, lang),
  categorie_nom: localizeText(card.categorie_nom, card.categorie_nom_en, card.categorie_nom_he, lang),
  categorie_ordre: card.categorie_ordre,
  prix_client: card.prix_client,
});

/** Textes fixes de l'écran de swipe (hors contenu des cartes), dans les 3 langues. */
export const swipeText = {
  namePrompt: {
    title: { fr: "Quel est ton prénom ?", en: "What's your first name?", he: "מה השם הפרטי שלך?" },
    selectTitle: { fr: "Qui es-tu ?", en: "Who are you?", he: "מי אתה/את?" },
    alreadyStarted: { fr: "Déjà commencé ?", en: "Already started?", he: "כבר התחלת?" },
    placeholder: { fr: "Ton prénom", en: "Your first name", he: "השם הפרטי שלך" },
    start: { fr: "Commencer", en: "Start", he: "התחלה" },
  },
  intro: {
    title: { fr: "Comment ça marche ?", en: "How does it work?", he: "איך זה עובד?" },
    pass: { fr: "Je passe", en: "Skip", he: "לדלג" },
    like: { fr: "J'aime", en: "Like", he: "אהבתי" },
    cta: { fr: "Je swipe !", en: "Let's swipe!", he: "בואו נתחיל!" },
  },
  deck: {
    passAria: { fr: "Passer", en: "Skip", he: "דילוג" },
    undoAria: { fr: "Annuler le dernier swipe", en: "Undo last swipe", he: "בטל את הבחירה האחרונה" },
    likeAria: { fr: "J'aime", en: "Like", he: "אהבתי" },
  },
  categoryDivider: {
    continue: { fr: "Continuer", en: "Continue", he: "המשך" },
    propositionCount: (n: number, lang: SwipeLang) => {
      if (lang === "en") return `${n} suggestion${n > 1 ? "s" : ""}`;
      if (lang === "he") return n === 1 ? "הצעה אחת" : `${n} הצעות`;
      return `${n} proposition${n > 1 ? "s" : ""}`;
    },
  },
  recap: {
    limitReached: {
      fr: "Tu as déjà choisi tes 3 préférées, retire-en une pour changer.",
      en: "You've already picked your top 3, remove one to change.",
      he: "כבר בחרת את 3 המועדפים שלך, הסר/י אחד כדי לשנות.",
    },
    likedSubtitle: {
      fr: "Envie de choisir ton top 3 parmi ce que tu as aimé ?",
      en: "Want to pick your top 3 favorites?",
      he: "רוצה לבחור את 3 המועדפים שלך?",
    },
    chooseTop3: { fr: "Choisir mon top 3", en: "Pick my top 3", he: "בחירת 3 המועדפים שלי" },
    finishWithoutChoosing: { fr: "Terminer sans choisir", en: "Finish without choosing", he: "סיום בלי לבחור" },
    chooseTop3Title: { fr: "Choisis ton top 3", en: "Pick your top 3", he: "בחר/י את 3 המועדפים שלך" },
    chooseTop3Subtitle: {
      fr: "Choisis jusqu'à 3 propositions parmi celles que tu as aimées.",
      en: "Choose up to 3 from what you liked.",
      he: "בחר/י עד 3 הצעות מתוך אלה שאהבת.",
    },
    finish: { fr: "Terminer", en: "Finish", he: "סיום" },
    likedTitle: (n: number, lang: SwipeLang) => {
      if (lang === "en") return `You liked ${n} suggestion${n > 1 ? "s" : ""}!`;
      if (lang === "he") return n === 1 ? "אהבת הצעה אחת!" : `אהבת ${n} הצעות!`;
      return `Tu as aimé ${n} proposition${n > 1 ? "s" : ""} !`;
    },
    selectedCount: (n: number, lang: SwipeLang) => {
      if (lang === "he") return `${n}/3 נבחרו`;
      if (lang === "en") return `${n}/3 selected`;
      return `${n}/3 sélectionnées`;
    },
  },
  thankYou: {
    title: { fr: "Merci !", en: "Thank you!", he: "תודה!" },
    subtitle: {
      fr: "On revient vite vers toi avec l'itinéraire parfait.",
      en: "We'll be back soon with the perfect itinerary.",
      he: "נחזור אליך בקרוב עם המסלול המושלם.",
    },
  },
  swipePublic: {
    invalidLinkTitle: {
      fr: "Ce lien n'est plus valide",
      en: "This link is no longer valid",
      he: "הקישור הזה כבר לא בתוקף",
    },
    invalidLinkSubtitle: {
      fr: "Contacte ton conseiller de voyage pour obtenir un nouveau lien.",
      en: "Contact your travel advisor to get a new link.",
      he: "צור/י קשר עם היועץ/ת שלך לנסיעות כדי לקבל קישור חדש.",
    },
    emptyDeck: {
      fr: "Aucune proposition n'a encore été ajoutée à ce dossier.",
      en: "No suggestions have been added to this folder yet.",
      he: "עדיין לא נוספו הצעות לתיק הזה.",
    },
  },
} as const;
