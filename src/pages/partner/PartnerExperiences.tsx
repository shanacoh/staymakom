// Mes expériences : celles dont il est le prestataire (principal ou dans la liste), avec leur statut.

import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { Empty, PageLoader, Pill } from "@/components/partner/ui";
import { fetchPartnerExperiences, partnerKeys } from "@/lib/partner/api";
import { usePartner } from "@/lib/partner/context";
import { displayText } from "@/lib/partner/logic";

export default function PartnerExperiences() {
  const { t, lang } = usePartner();
  const { data, isLoading } = useQuery({ queryKey: partnerKeys.experiences, queryFn: fetchPartnerExperiences });

  if (isLoading) return <PageLoader label={t.loading} />;
  const experiences = data ?? [];

  return (
    <>
      <h1 className="text-xl font-bold tracking-tight">{t.tabExperiences}</h1>
      {experiences.length === 0 ? (
        <Empty>{t.expEmpty}</Empty>
      ) : (
        <ul className="space-y-3">
          {experiences.map((experience) => {
            const todo = Number(experience.needs_questionnaire) + Number(experience.needs_availability);
            return (
              <li key={experience.id}>
                <Link
                  to={`/partner/experiences/${experience.id}`}
                  className="flex items-center gap-3 rounded-[14px] border border-neutral-200 bg-white p-3 transition-colors hover:border-neutral-400"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[10px] bg-neutral-100">
                    {experience.image && <img src={experience.image} alt="" loading="lazy" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-neutral-900">
                      {displayText(experience as unknown as Record<string, unknown>, "title", lang) || experience.slug}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Pill tone={experience.status === "published" ? "strong" : "muted"}>
                        {experience.status === "published" ? t.statusPublished : t.statusDraft}
                      </Pill>
                      {todo > 0 && (
                        <Pill tone="urgent">
                          {t.homeActions} · {todo}
                        </Pill>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400 rtl:-scale-x-100" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
