// Réglage rapide des dates depuis l'accueil : le calendrier seul, un appui ouvre ou ferme une date.
// Les jours d'ouverture, les créneaux et le mode de réglage restent dans la fiche de l'expérience.
// Seules les expériences dont le prestataire est le prestataire principal sont modifiables.

import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { AvailabilityCalendar } from "@/components/partner/AvailabilityCalendar";
import { AvailabilitySaveBar } from "@/components/partner/experience/AvailabilitySection";
import { Card, PageLoader, SectionTitle } from "@/components/partner/ui";
import { cn } from "@/lib/utils";
import { fetchPartnerExperience, partnerKeys } from "@/lib/partner/api";
import { usePartner } from "@/lib/partner/context";
import { bookedDates, displayText } from "@/lib/partner/logic";
import { useAvailabilityDraft } from "@/lib/partner/useAvailabilityDraft";
import type {
  PartnerBooking,
  PartnerExperienceDetail,
  PartnerExperienceSummary,
} from "@/lib/partner/types";

interface Props {
  experiences: PartnerExperienceSummary[];
  bookings: PartnerBooking[];
}

export function QuickAvailability({ experiences, bookings }: Props) {
  const { t, lang } = usePartner();
  const editable = experiences.filter(
    (e) => e.is_primary && e.status !== "archived",
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    editable[0]?.id ?? null,
  );
  const detail = useQuery({
    queryKey: partnerKeys.experience(selectedId ?? ""),
    queryFn: () => fetchPartnerExperience(selectedId as string),
    enabled: !!selectedId,
  });

  if (!selectedId) return null;
  const titleOf = (e: PartnerExperienceSummary) =>
    displayText(e as unknown as Record<string, unknown>, "title", lang) ||
    e.slug;

  return (
    <Card className="space-y-3">
      <SectionTitle>{t.homeCalendar}</SectionTitle>

      {editable.length > 1 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {editable.map((e) => (
            <button
              key={e.id}
              type="button"
              aria-pressed={e.id === selectedId}
              onClick={() => setSelectedId(e.id)}
              className={cn(
                "min-h-[32px] shrink-0 rounded-full border px-3 text-[12px] font-medium",
                e.id === selectedId
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 bg-white text-neutral-700",
              )}
            >
              {titleOf(e)}
            </button>
          ))}
        </div>
      )}

      {detail.isLoading || !detail.data ? (
        <PageLoader label={t.loading} />
      ) : (
        // La clé remet le brouillon à zéro quand on change d'expérience.
        <QuickCalendar
          key={selectedId}
          experience={detail.data}
          bookings={bookings}
        />
      )}

      <Link
        to={`/partner/experiences/${selectedId}?section=availability`}
        className="flex items-center justify-between gap-3 border-t border-neutral-100 pt-3 text-[13px] font-medium text-neutral-600"
      >
        {t.homeCalendarMore}
        <ChevronRight
          className="h-4 w-4 shrink-0 text-neutral-400 rtl:-scale-x-100"
          aria-hidden
        />
      </Link>
    </Card>
  );
}

function QuickCalendar({
  experience,
  bookings,
}: {
  experience: PartnerExperienceDetail;
  bookings: PartnerBooking[];
}) {
  const { draft, setDraft, dirty, saving, save } = useAvailabilityDraft(
    experience.id,
    experience.availability,
  );
  return (
    <>
      <AvailabilityCalendar
        value={draft}
        onChange={setDraft}
        bookedDates={bookedDates(bookings, experience.id)}
      />
      {dirty && (
        <AvailabilitySaveBar dirty={dirty} saving={saving} onSave={save} />
      )}
    </>
  );
}
