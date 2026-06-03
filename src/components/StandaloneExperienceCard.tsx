/**
 * Carte pour les expériences "standalone" (Experience Only, sans hôtel).
 * Adaptée de Experience2CardWithPrice — pas de HyperGuest, pas de calcul de prix complexe.
 * Le prix affiché est directement base_price converti dans la devise de l'utilisateur.
 */
import ExperienceCard from "@/components/ExperienceCard";
import { useCurrency } from "@/contexts/CurrencyContext";

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
    has_time_slots?: boolean;
    experience2_highlight_tags?: any[];
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

  // Convertir le prix de base dans la devise d'affichage de l'utilisateur.
  // base_price est en USD par défaut — on utilise convert() comme partout ailleurs.
  const displayPrice = experience.base_price ? Math.round(convert(experience.base_price)) : 0;

  const cardExperience = {
    ...experience,
    hotels: null,
    base_price: displayPrice,
    experience_highlight_tags: experience.experience2_highlight_tags || [],
  };

  return (
    <ExperienceCard
      experience={cardExperience}
      linkPrefix="/standalone-experience"
      index={index}
      badge={badge}
    />
  );
}
