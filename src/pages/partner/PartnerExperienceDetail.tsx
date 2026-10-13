// Une expérience du prestataire, en trois parties : questionnaire pratique, disponibilités,
// proposer une modification.

import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AvailabilitySection } from "@/components/partner/experience/AvailabilitySection";
import { ProposalSection } from "@/components/partner/experience/ProposalSection";
import { QuestionnaireSection } from "@/components/partner/experience/QuestionnaireSection";
import { Empty, Notice, PageLoader, Pill } from "@/components/partner/ui";
import { cn } from "@/lib/utils";
import { fetchPartnerExperience, partnerKeys } from "@/lib/partner/api";
import { usePartner } from "@/lib/partner/context";
import { displayText } from "@/lib/partner/logic";

type Section = "questionnaire" | "availability" | "proposal";

export default function PartnerExperienceDetail() {
  const { experienceId = "" } = useParams();
  const { t, lang } = usePartner();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: experience, isLoading, error } = useQuery({
    queryKey: partnerKeys.experience(experienceId),
    queryFn: () => fetchPartnerExperience(experienceId),
    retry: false,
  });

  const back = (
    <Link to="/partner/experiences" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-600">
      <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden /> {t.tabExperiences}
    </Link>
  );

  if (isLoading) return <PageLoader label={t.loading} />;
  if (error || !experience) {
    return (
      <>
        {back}
        <Empty>{t.errorGeneric}</Empty>
      </>
    );
  }

  // Les disponibilités d'une expérience partagée entre plusieurs prestataires ne se gèrent pas d'ici.
  const sections: { key: Section; label: string }[] = [
    { key: "questionnaire", label: t.expSectionQuestionnaire },
    ...(experience.is_primary ? [{ key: "availability" as const, label: t.expSectionAvailability }] : []),
    { key: "proposal", label: t.expSectionProposal },
  ];
  const requested = searchParams.get("section");
  const section = sections.find((s) => s.key === requested)?.key ?? "questionnaire";

  return (
    <>
      {back}
      <div className="space-y-2">
        <h1 className="text-xl font-bold leading-snug tracking-tight">{displayText(experience, "title", lang) || experience.slug}</h1>
        <Pill tone={experience.status === "published" ? "strong" : "muted"}>
          {experience.status === "published" ? t.statusPublished : t.statusDraft}
        </Pill>
      </div>

      {!experience.is_primary && <Notice>{t.expSharedNotice}</Notice>}

      <div className="flex gap-1 overflow-x-auto rounded-full bg-neutral-200/70 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
        {sections.map((s) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={section === s.key}
            onClick={() => setSearchParams({ section: s.key }, { replace: true })}
            className={cn(
              "min-h-[38px] flex-1 whitespace-nowrap rounded-full px-3 text-[13px] font-semibold transition-colors",
              section === s.key ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* La clé remet chaque formulaire à zéro quand on change de langue : on édite le texte de SA langue. */}
      {section === "questionnaire" && <QuestionnaireSection key={`q-${lang}`} experience={experience} />}
      {section === "availability" && <AvailabilitySection experience={experience} />}
      {section === "proposal" && <ProposalSection key={`p-${lang}`} experience={experience} />}
    </>
  );
}
