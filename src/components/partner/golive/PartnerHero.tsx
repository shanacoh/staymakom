// Le haut de la page partenaire, comme les pages du site : la photo principale de sa fiche (même en
// brouillon, sinon la photo de marque), « ESPACE PARTENAIRE · Nom » (le nom tel qu'il est saisi),
// « Bienvenue chez STAYMAKOM. » et une phrase qui dépend de l'avancement.

import heroDefault from "@/assets/hero-road-desert.jpg";
import { resizedImageUrl } from "@/lib/imageUrl";
import { usePartner } from "@/lib/partner/context";
import { GOLIVE_TEXTS } from "@/lib/partner/i18n-golive";
import type { HeroPhase } from "@/lib/partner/golive";
import type { GoLive } from "@/lib/partner/types";

export function PartnerHero({ name, photo, kind, phase }: { name: string; photo: string | null; kind: GoLive["kind"]; phase: HeroPhase }) {
  const { lang } = usePartner();
  const t = GOLIVE_TEXTS[lang].page;
  const src = resizedImageUrl(photo, 1600) ?? heroDefault;
  return (
    <section className="relative -mx-4 overflow-hidden sm:mx-0 sm:rounded-[18px]">
      <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/10" aria-hidden />
      <div className="relative flex min-h-[340px] flex-col justify-end gap-3 px-5 pb-8 pt-24 sm:min-h-[380px] sm:px-8 sm:pb-10">
        <p className="text-[11px] font-medium text-white/85">
          <span className="uppercase tracking-[0.16em] rtl:tracking-normal">{t.partnerSpace}</span>
          <span aria-hidden> · </span>
          <span className="tracking-normal">{name}</span>
        </p>
        <h1 className="text-[32px] font-bold leading-[1.1] tracking-[-0.01em] text-white sm:text-[40px]">{t.heroTitle}</h1>
        <p className="max-w-[560px] text-[15px] leading-relaxed text-white/90 sm:text-[16px]">{t.heroLine[phase][kind]}</p>
      </div>
    </section>
  );
}
