// Aperçu de l'annonce (expérience ou hôtel), section par section, avec le bandeau
// « Aperçu, vous seul voyez cette page ». Même écran avec le lien ou avec un compte.

import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ExperiencePreview } from "@/components/partner/golive/ExperiencePreview";
import { SectionReview } from "@/components/partner/golive/SectionReview";
import HotelPageSections from "@/components/hotel/HotelPageSections";
import { Empty, PageLoader } from "@/components/partner/ui";
import { goliveKeys, usePartnerAccess } from "@/lib/partner/access";
import { usePartner } from "@/lib/partner/context";
import { fieldsOf, LISTING_SECTIONS } from "@/lib/partner/golive";
import { GOLIVE_TEXTS } from "@/lib/partner/i18n-golive";
import type { ListingKind, PartnerListing } from "@/lib/partner/types";

export default function PartnerListingPage() {
  const { kind = "experience", id = "" } = useParams();
  const listingKind: ListingKind = kind === "hotel" ? "hotel" : "experience";
  const { t: base, lang } = usePartner();
  const t = GOLIVE_TEXTS[lang];
  const access = usePartnerAccess();
  const { data, isLoading, error } = useQuery({
    queryKey: goliveKeys.listing(access.scope, listingKind, id),
    queryFn: () => access.listing(listingKind, id),
    retry: false,
  });

  const back = (
    <Link to={access.base} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-600">
      <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden /> {base.tabHome}
    </Link>
  );

  if (isLoading) return <PageLoader label={base.loading} />;
  if (error || !data) {
    return (
      <>
        {back}
        <Empty>{base.errorGeneric}</Empty>
      </>
    );
  }

  const slot = (section: string) =>
    LISTING_SECTIONS[listingKind].includes(section) ? (
      <SectionReview
        key={`${section}-${lang}`}
        kind={listingKind}
        targetId={id}
        section={section}
        fields={fieldsOf(data.fields, section)}
        notePending={data.pending_notes.some((n) => n.section === section)}
      />
    ) : null;

  return (
    <>
      {back}
      <div className="rounded-full bg-neutral-900 px-4 py-2 text-center text-[12px] font-semibold text-white">
        {t.previewBanner}
      </div>
      <ListingSummary listing={data} />
      {listingKind === "experience" ? (
        <ExperiencePreview content={data.content} slot={slot} />
      ) : (
        // La page hôtel publique est large : l'aperçu la montre telle quelle, dans un cadre.
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[12px] border border-neutral-200 bg-white text-neutral-900">
            <HotelPageSections hotel={data.content} lang={lang} slot={(section) => <div className="not-prose">{slot(section)}</div>} />
          </div>
        </div>
      )}
    </>
  );
}

function ListingSummary({ listing }: { listing: PartnerListing }) {
  const { lang } = usePartner();
  const t = GOLIVE_TEXTS[lang];
  const total = listing.fields.length;
  const team = listing.fields.filter((f) => f.source === "staymakom" && f.state !== "to_fill").length;
  const forYou = listing.fields.filter((f) => f.state !== "confirmed").length;
  return <p className="text-center text-[12px] text-neutral-600">{t.counts(team, total, forYou)}</p>;
}
