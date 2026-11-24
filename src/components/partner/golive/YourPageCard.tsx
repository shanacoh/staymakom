// « Votre page » : la vignette de sa fiche et l'aperçu tel que les clients la verront. Le bouton
// n'est actif qu'une fois l'annonce préparée par l'équipe ; avant, « Aperçu bientôt ». Le compteur
// « X sur Y préparés par notre équipe · Z pour vous » n'apparaît qu'à ce moment-là.

import { Link } from "react-router-dom";
import heroDefault from "@/assets/hero-road-desert.jpg";
import { resizedImageUrl } from "@/lib/imageUrl";
import { usePartnerAccess } from "@/lib/partner/access";
import { usePartner } from "@/lib/partner/context";
import { listingPrepared, preparedCounts } from "@/lib/partner/golive";
import { GOLIVE_TEXTS } from "@/lib/partner/i18n-golive";
import type { GoLive } from "@/lib/partner/types";

export function YourPageCard({ golive, photo }: { golive: GoLive; photo: string | null }) {
  const { lang } = usePartner();
  const g = GOLIVE_TEXTS[lang];
  const t = g.page;
  const access = usePartnerAccess();
  const target = golive.target;
  const ready = !!target && listingPrepared(golive);
  const counts = preparedCounts(golive);

  return (
    <section className="grid overflow-hidden rounded-[18px] border border-[#E8E0D4] bg-white sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="relative min-h-[180px] bg-[#E8E0D4]">
        <img src={resizedImageUrl(photo, 800) ?? heroDefault} alt="" className="absolute inset-0 h-full w-full object-cover" />
      </div>
      <div className="flex flex-col justify-center gap-2.5 p-5 sm:p-6">
        <p className="text-[11px] font-medium tracking-[0.16em] rtl:tracking-normal text-brand">{t.yourPageEyebrow}</p>
        <h2 className="text-[20px] font-bold leading-snug text-neutral-900">{t.yourPageTitle}</h2>
        <p className="text-[14px] leading-relaxed text-neutral-500">{ready ? t.yourPageReady : t.yourPageSoon}</p>
        {counts && <p className="text-[13px] text-neutral-700">{t.preparedCount(counts.team, counts.total, counts.forYou)}</p>}
        <div className="flex flex-wrap gap-2 pt-1">
          {ready ? (
            <Link
              to={`${access.base}/listing/${target!.kind}/${target!.id}`}
              className="inline-flex min-h-[40px] items-center rounded-full bg-neutral-900 px-5 text-[13px] font-semibold text-white hover:bg-neutral-700"
            >
              {g.openPreview}
            </Link>
          ) : (
            <span className="inline-flex min-h-[40px] items-center rounded-full border border-[#E8E0D4] px-5 text-[13px] text-neutral-400" aria-disabled>
              {t.previewSoon}
            </span>
          )}
          {target?.kind === "experience" && (
            <Link
              to={`${access.base}/rules/${target.id}`}
              className="inline-flex min-h-[40px] items-center rounded-full border border-neutral-300 px-5 text-[13px] font-medium text-neutral-900 hover:bg-neutral-100"
            >
              {g.myRules}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
