import type { OfferCounters as Counters } from "@/lib/offerPlan/compute";

/** Les 5 compteurs du haut de page, avec le nombre d'expériences en ligne « hors plan ». */
export function OfferCounters({ counters }: { counters: Counters }) {
  const tiles = [
    { label: "Must-haves", value: counters.total },
    { label: "À trouver", value: counters.byStatus.a_trouver },
    { label: "En prospection", value: counters.byStatus.en_prospection },
    { label: "Signés", value: counters.byStatus.signe },
    { label: "En ligne", value: counters.byStatus.en_ligne, note: `+ ${counters.offPlan} en ligne hors plan` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-lg border border-border bg-card p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{tile.label}</div>
          <div className="mt-1 text-2xl font-bold tabular-nums text-foreground">{tile.value}</div>
          {tile.note && <div className="mt-0.5 text-[11px] text-muted-foreground">{tile.note}</div>}
        </div>
      ))}
    </div>
  );
}
