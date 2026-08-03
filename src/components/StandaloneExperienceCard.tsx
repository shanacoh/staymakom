/**
 * Carte pour les expériences "standalone" (Experience Only, sans hôtel).
 * Adaptée de Experience2CardWithPrice — pas de HyperGuest, pas de calcul de prix complexe.
 * Le prix affiché est directement base_price converti dans la devise de l'utilisateur.
 */
import ExperienceCard from "@/components/ExperienceCard";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/hooks/useLanguage";
import { getAutoBadgeTagsFromPracticalInfo, normalizeLegacyPracticalInfo } from "@/lib/standaloneBadges";

// Bateaux : la 3e bulle fixe (skipper) reflète directement les colonnes
// skipper_included / crew_included de la fiche — c'est le même interrupteur
// que celui de la carte "Équipage" du formulaire admin. Ne plus la faire
// dépendre des badges éditoriaux (standalone_experience_highlight_tags), qui
// sont gérés séparément et peuvent se désynchroniser de l'interrupteur.
const SKIPPER_INCLUDED = { en: "Skipper included", he: "סקיפר כלול", fr: "Skipper inclus" };
const SKIPPER_CREW = { en: "Skipper + crew", he: "סקיפר + צוות", fr: "Skipper + équipier" };
const SKIPPER_NOT_INCLUDED = { en: "Skipper not included", he: "סקיפר לא כלול", fr: "Skipper non inclus" };
const UP_TO_GUESTS = { en: "Up to", he: "עד", fr: "Jusqu'à" };
const GUESTS_SUFFIX = { en: "guests", he: "אורחים", fr: "pers." };

interface StandaloneHighlightTagLink {
  tag_id: string;
  position: number;
  highlight_tags: {
    id: string;
    slug: string;
    label_en: string;
    label_he?: string | null;
    label_fr?: string | null;
  };
}

interface StandaloneExperienceCardProps {
  experience: {
    id: string;
    slug: string;
    title: string;
    title_he?: string | null;
    title_fr?: string | null;
    hero_image?: string | null;
    photos?: string[] | null;
    base_price: number;
    base_price_type?: string | null;
    currency?: string | null;
    min_party?: number | null;
    max_party?: number | null;
    has_child_price?: boolean | null;
    has_time_slots?: boolean;
    duration?: string | null;
    duration_fr?: string | null;
    duration_he?: string | null;
    standalone_experience_highlight_tags?: StandaloneHighlightTagLink[] | null;
    skipper_included?: boolean | null;
    crew_included?: boolean | null;
    city?: string | null;
    city_he?: string | null;
    region?: string | null;
    region_he?: string | null;
    practical_info?: unknown;
  };
  index?: number;
  badge?: string | null;
  linkSuffix?: string;
  linkPrefix?: string;
  // Bateaux uniquement : affiche le prix total du bateau en avant, avec le
  // prix par personne en complément — évite de laisser croire que le prix
  // par personne est le prix pour louer le bateau entier.
  showTotalPrice?: boolean;
  // Bateaux uniquement : affiche les 3 bulles fixes (durée, capacité, skipper)
  // au lieu de la liste libre de tags éditoriaux.
  isBoat?: boolean;
}

export default function StandaloneExperienceCard({
  experience,
  index = 0,
  badge,
  linkSuffix,
  linkPrefix = "/standalone-experience",
  showTotalPrice = false,
  isBoat = false,
}: StandaloneExperienceCardProps) {
  const { convert } = useCurrency();
  const { lang } = useLanguage();

  // Pour un forfait (fixed), on affiche le prix "à partir de" = prix total / max participants.
  // Pour un prix par personne, on affiche directement le prix converti.
  const rawConverted = experience.base_price ? convert(experience.base_price) : 0;
  const isFixed = experience.base_price_type === 'fixed';
  const maxParty = experience.max_party ?? 0;
  const displayPrice = isFixed && maxParty > 0
    ? Math.ceil(rawConverted / maxParty)
    : Math.round(rawConverted);
  const totalPrice = isFixed ? Math.round(rawConverted) : undefined;

  // "à partir de" s'affiche pour les forfaits et quand il y a un tarif enfant
  const showFromPrefix = isFixed || (experience.has_child_price ?? false);

  const editorialTags = (experience.standalone_experience_highlight_tags ?? [])
    .sort((a, b) => a.position - b.position)
    .map((link) => ({ highlight_tags: link.highlight_tags }));

  const autoBadgeTags = getAutoBadgeTagsFromPracticalInfo(
    normalizeLegacyPracticalInfo(experience.practical_info)
  )
    .filter((tag) => tag.slug === "auto-kosher" || tag.slug === "auto-kids")
    .map((tag) => ({ highlight_tags: tag }));

  // Bateaux : uniquement 3 bulles fixes — durée, capacité, skipper — toujours dans
  // cet ordre et avec la même présentation sur toutes les cartes. Aucun autre tag
  // éditorial n'est affiché sur la carte (ex: Baignade possible, Yacht + speed
  // boat) : ces infos restent visibles dans la fiche détail, pas sur la grille.
  const skipperLabel = experience.crew_included
    ? SKIPPER_CREW[lang]
    : experience.skipper_included
    ? SKIPPER_INCLUDED[lang]
    : SKIPPER_NOT_INCLUDED[lang];

  // Certaines fiches ont un champ durée qui embarque une précision annexe après
  // une virgule (ex: "Forfait 4h, yacht + speed boat") — on ne garde que la
  // partie durée pour un texte uniforme sur toutes les cartes.
  const rawDuration = lang === "he"
    ? experience.duration_he || experience.duration
    : lang === "fr"
    ? experience.duration_fr || experience.duration
    : experience.duration;
  const durationLabel = rawDuration?.split(",")[0].trim();

  const capacityLabel = experience.max_party
    ? `${UP_TO_GUESTS[lang]} ${experience.max_party} ${GUESTS_SUFFIX[lang]}`
    : undefined;

  const fixedBadges = isBoat
    ? [durationLabel, capacityLabel, skipperLabel].filter((v): v is string => !!v)
    : undefined;

  const cardExperience = {
    ...experience,
    // Pas d'hôtel pour une expérience standalone : on réutilise simplement la forme
    // attendue par ExperienceCard pour afficher ville/région sous la photo.
    hotels: (experience.city || experience.region)
      ? { city: experience.city ?? undefined, city_he: experience.city_he, region: experience.region, region_he: experience.region_he }
      : null,
    base_price: displayPrice,
    experience_highlight_tags: isBoat ? [] : [...editorialTags, ...autoBadgeTags],
  };

  return (
    <ExperienceCard
      experience={cardExperience}
      linkPrefix={linkPrefix}
      linkSuffix={linkSuffix}
      index={index}
      badge={badge}
      isStandaloneExperience
      showFromPrefix={showFromPrefix}
      showTotalPrice={showTotalPrice && isFixed}
      totalPrice={totalPrice}
      fixedBadges={fixedBadges}
    />
  );
}
