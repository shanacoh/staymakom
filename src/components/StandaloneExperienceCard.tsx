/**
 * Carte pour les expériences "standalone" (Experience Only, sans hôtel).
 * Adaptée de Experience2CardWithPrice — pas de HyperGuest, pas de calcul de prix complexe.
 * Le prix affiché est directement base_price converti dans la devise de l'utilisateur.
 */
import ExperienceCard from "@/components/ExperienceCard";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getAutoBadgeTagsFromPracticalInfo, normalizeLegacyPracticalInfo } from "@/lib/standaloneBadges";

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
    standalone_experience_highlight_tags?: StandaloneHighlightTagLink[] | null;
    city?: string | null;
    city_he?: string | null;
    region?: string | null;
    region_he?: string | null;
    practical_info?: unknown;
  };
  index?: number;
  badge?: string | null;
}

export default function StandaloneExperienceCard({
  experience,
  index = 0,
  badge,
}: StandaloneExperienceCardProps) {
  const { convert } = useCurrency();

  // Pour un forfait (fixed), on affiche le prix "à partir de" = prix total / max participants.
  // Pour un prix par personne, on affiche directement le prix converti.
  const rawConverted = experience.base_price ? convert(experience.base_price) : 0;
  const isFixed = experience.base_price_type === 'fixed';
  const maxParty = experience.max_party ?? 0;
  const displayPrice = isFixed && maxParty > 0
    ? Math.ceil(rawConverted / maxParty)
    : Math.round(rawConverted);

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

  const cardExperience = {
    ...experience,
    // Pas d'hôtel pour une expérience standalone : on réutilise simplement la forme
    // attendue par ExperienceCard pour afficher ville/région sous la photo.
    hotels: (experience.city || experience.region)
      ? { city: experience.city ?? undefined, city_he: experience.city_he, region: experience.region, region_he: experience.region_he }
      : null,
    base_price: displayPrice,
    experience_highlight_tags: [...editorialTags, ...autoBadgeTags],
  };

  return (
    <ExperienceCard
      experience={cardExperience}
      linkPrefix="/standalone-experience"
      index={index}
      badge={badge}
      isStandaloneExperience
      showFromPrefix={showFromPrefix}
    />
  );
}
