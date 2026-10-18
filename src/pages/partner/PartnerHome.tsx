// Accueil : les chiffres clés (réservations à venir, total généré), ce qui attend le partenaire,
// le calendrier pour ouvrir ou fermer une date, les prochaines réservations et ses propositions.

import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { BookingCard } from "@/components/partner/BookingCard";
import { HomeStats } from "@/components/partner/home/HomeStats";
import { QuickAvailability } from "@/components/partner/home/QuickAvailability";
import { ProposalList } from "@/components/partner/ProposalList";
import { Card, Empty, Hint, PageLoader, Pill, SectionTitle } from "@/components/partner/ui";
import { fetchPartnerBookings, fetchPartnerExperiences, fetchPartnerProposals, partnerKeys } from "@/lib/partner/api";
import { usePartner, usePartnerSession } from "@/lib/partner/context";
import { displayText, revenueTotals, splitBookings, toIsoDate } from "@/lib/partner/logic";

export default function PartnerHome() {
  const { t, lang } = usePartner();
  const session = usePartnerSession();
  const bookings = useQuery({ queryKey: partnerKeys.bookings, queryFn: fetchPartnerBookings });
  const experiences = useQuery({ queryKey: partnerKeys.experiences, queryFn: fetchPartnerExperiences });
  const proposals = useQuery({ queryKey: partnerKeys.proposals, queryFn: fetchPartnerProposals });

  if (bookings.isLoading || experiences.isLoading || proposals.isLoading) return <PageLoader label={t.loading} />;

  const allBookings = bookings.data ?? [];
  const allUpcoming = splitBookings(allBookings, toIsoDate(new Date())).upcoming;
  const upcoming = allUpcoming.slice(0, 3);
  const actions = (experiences.data ?? []).flatMap((experience) => {
    const title = displayText(experience as unknown as Record<string, unknown>, "title", lang) || experience.slug;
    return [
      experience.needs_questionnaire && { key: `${experience.id}-q`, id: experience.id, section: "questionnaire", title, label: t.homeActionQuestionnaire },
      experience.needs_availability && { key: `${experience.id}-a`, id: experience.id, section: "availability", title, label: t.homeActionAvailability },
    ].filter(Boolean) as { key: string; id: string; section: string; title: string; label: string }[];
  });
  const latestProposals = (proposals.data ?? []).slice(0, 5);

  return (
    <>
      <h1 className="text-xl font-bold tracking-tight">{t.homeHello(session.provider.contact_name || session.provider.name)}</h1>

      <HomeStats upcomingCount={allUpcoming.length} totals={revenueTotals(allBookings)} />

      {/* « À faire » n'apparaît que s'il y a vraiment quelque chose à faire. */}
      {actions.length > 0 && (
        <Card>
          <SectionTitle aside={<Pill tone="urgent">{actions.length}</Pill>}>{t.homeActions}</SectionTitle>
          <ul className="divide-y divide-neutral-100">
            {actions.map((action) => (
              <li key={action.key}>
                <Link
                  to={`/partner/experiences/${action.id}?section=${action.section}`}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-neutral-900">{action.label}</span>
                    <span className="block truncate text-[12px] text-neutral-500">{action.title}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400 rtl:-scale-x-100" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <QuickAvailability experiences={experiences.data ?? []} bookings={allBookings} />

      <div>
        <SectionTitle
          aside={
            <Link to="/partner/bookings" className="text-[13px] font-medium text-neutral-600 underline underline-offset-4">
              {t.homeSeeAll}
            </Link>
          }
        >
          {t.homeNextBookings}
        </SectionTitle>
        {upcoming.length === 0 ? (
          <Empty>{t.homeNoBookings}</Empty>
        ) : (
          <div className="space-y-3">
            {upcoming.map((booking) => (
              <BookingCard key={booking.id} booking={booking} compact />
            ))}
          </div>
        )}
      </div>

      <Card>
        <SectionTitle>{t.homeProposals}</SectionTitle>
        {latestProposals.length === 0 ? <Hint>{t.homeNoProposals}</Hint> : <ProposalList proposals={latestProposals} />}
      </Card>
    </>
  );
}
