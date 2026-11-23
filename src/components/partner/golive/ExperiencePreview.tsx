// Aperçu d'une expérience pour son partenaire, avec les blocs de la page publique
// (/standalone-experience/:slug) : photo d'en-tête, programme et inclusions, infos pratiques, carte.
// La page publique elle-même n'est pas réutilisée telle quelle : elle porte la réservation (choix des
// dates, prix, paiement) et le suivi des visites, qui n'ont rien à faire dans un aperçu. Le prix client
// n'apparaît pas : à sa place, « Prix client fixé par STAYMAKOM ».

import type { ReactNode } from "react";
import HeroSection from "@/components/experience-test/HeroSection";
import LocationMap from "@/components/experience-test/LocationMap";
import WhatsIncludedPhotos2 from "@/components/experience-test/WhatsIncludedPhotos2";
import EssentialsBlock from "@/components/experience/EssentialsBlock";
import { usePartner } from "@/lib/partner/context";
import { GOLIVE_TEXTS } from "@/lib/partner/i18n-golive";
import { displayText } from "@/lib/partner/logic";

type Section = "story" | "photos" | "inclusions" | "practical" | "rules";

interface Props {
  content: Record<string, unknown>;
  slot: (section: Section) => ReactNode;
}

export function ExperiencePreview({ content, slot }: Props) {
  const { lang } = usePartner();
  const t = GOLIVE_TEXTS[lang];
  const title = displayText(content, "title", lang);
  const subtitle = displayText(content, "subtitle", lang);
  const longCopy = displayText(content, "long_copy", lang);
  const hero = typeof content.hero_image === "string" && content.hero_image ? [content.hero_image] : [];
  const photos = [...hero, ...((content.photos as string[] | null) ?? [])].filter((p, i, all) => p && all.indexOf(p) === i);
  // Les blocs publics attendent la ligne de la fiche ; l'aperçu n'en contient que les colonnes publiques.
  const experience = { ...content, standalone_experience_price_variants: [] } as unknown as Parameters<typeof EssentialsBlock>[0]["experience"];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[12px] border border-neutral-200 bg-white">
        <HeroSection
          photos={photos}
          title={title}
          subtitle={subtitle || undefined}
          city={displayText(content, "city", lang) || undefined}
          region={displayText(content, "region", lang) || undefined}
          lang={lang}
          experienceMode="live"
        />
        <div className="border-t border-neutral-200 px-4 py-3 text-[13px] font-semibold text-neutral-700">{t.priceByTeam}</div>
      </div>
      {slot("story")}
      {slot("photos")}

      <div className="rounded-[12px] border border-neutral-200 bg-white p-4">
        <WhatsIncludedPhotos2 experienceId={String(content.id)} lang={lang} longCopy={longCopy} source="standalone" />
      </div>
      {slot("inclusions")}

      <div className="rounded-[12px] border border-neutral-200 bg-white p-4">
        <EssentialsBlock experience={experience} experienceTitle={title} lang={lang} />
      </div>
      {typeof content.latitude === "number" && typeof content.longitude === "number" && (
        <div className="overflow-hidden rounded-[12px] border border-neutral-200 bg-white p-4">
          <LocationMap latitude={content.latitude} longitude={content.longitude} hotelName={title} lang={lang} />
        </div>
      )}
      {slot("practical")}
      {slot("rules")}
    </div>
  );
}
