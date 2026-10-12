import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NO_FILTERS, filterMustHaves, type MustHaveFilters } from "@/lib/offerPlan/compute";
import {
  STATUS_OPTIONS,
  formatLabel,
  type MustHave,
  type MustHavePatch,
  type MustHaveStatus,
  type OfferExperience,
  type OfferMood,
} from "@/lib/offerPlan/types";
import type { ZoneGroup } from "@/lib/regionList/labels";
import { cn } from "@/lib/utils";
import { STATUS_CLASS, findLinkedExperience } from "./display";
import { CommitInput, CoreBadge, ExperienceLink } from "./MustHaveBits";
import { ProviderPicker } from "@/components/admin/providers/ProviderPicker";
import { RegionMultiSelect } from "./RegionMultiSelect";

interface MustHaveListProps {
  mustHaves: MustHave[];
  moods: OfferMood[];
  zones: ZoneGroup[];
  experiences: OfferExperience[];
  onUpdate: (id: string, patch: MustHavePatch) => void;
  onRegionsChange: (id: string, regionIds: string[]) => void;
  /** Ouvre la fenêtre « + Must-have », avec le mood du filtre en cours s'il y en a un. */
  onAdd: (moodId: string | null) => void;
}

const ALL = "all";
const SEARCHING = "none";

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="h-8 w-auto min-w-36 gap-2 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-80">{children}</SelectContent>
    </Select>
  );
}

/** La vue liste : tous les must-haves, filtrables, avec statut, partenaire, notes et régions modifiables sur place. */
export function MustHaveList({ mustHaves, moods, zones, experiences, onUpdate, onRegionsChange, onAdd }: MustHaveListProps) {
  const [filters, setFilters] = useState<MustHaveFilters>(NO_FILTERS);
  const visible = useMemo(() => filterMustHaves(mustHaves, filters), [mustHaves, filters]);
  const moodName = useMemo(() => new Map(moods.map((m) => [m.id, m.name])), [moods]);
  const pick = (value: string) => (value === ALL ? null : value);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect label="Filtrer par mood" value={filters.mood ?? ALL} onChange={(v) => setFilters((f) => ({ ...f, mood: pick(v) }))}>
          <SelectItem value={ALL}>Tous les moods</SelectItem>
          {moods.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Filtrer par statut"
          value={filters.status ?? ALL}
          onChange={(v) => setFilters((f) => ({ ...f, status: pick(v) as MustHaveStatus | null }))}
        >
          <SelectItem value={ALL}>Tous les statuts</SelectItem>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Filtrer par socle"
          value={filters.core === null ? ALL : filters.core ? "yes" : "no"}
          onChange={(v) => setFilters((f) => ({ ...f, core: v === ALL ? null : v === "yes" }))}
        >
          <SelectItem value={ALL}>Socle ou non</SelectItem>
          <SelectItem value="yes">Socle</SelectItem>
          <SelectItem value="no">Hors socle</SelectItem>
        </FilterSelect>
        <FilterSelect label="Filtrer par région" value={filters.region ?? ALL} onChange={(v) => setFilters((f) => ({ ...f, region: pick(v) }))}>
          <SelectItem value={ALL}>Toutes les régions</SelectItem>
          <SelectItem value={SEARCHING}>À chercher</SelectItem>
          {zones.map(({ zone, regions }) => (
            <SelectGroup key={zone.slug}>
              <SelectLabel>{zone.name_fr}</SelectLabel>
              {regions.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name_fr}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </FilterSelect>
        <span className="text-xs text-muted-foreground">
          {visible.length} must-have{visible.length > 1 ? "s" : ""}
        </span>
        <Button type="button" size="sm" className="ml-auto" onClick={() => onAdd(filters.mood)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Must-have
        </Button>
      </div>

      {mustHaves.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Aucun must-have pour l'instant. Ajoute le premier avec « + Must-have », ou charge ta liste dans la base.
        </div>
      ) : visible.length === 0 ? (
        <div className="space-y-3 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          <p>Aucun must-have ne correspond à ces filtres.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => setFilters(NO_FILTERS)}>
            Tout effacer
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <Table className="min-w-[1100px]">
            <TableHeader>
              <TableRow>
                <TableHead>Must-have</TableHead>
                <TableHead>Mood</TableHead>
                <TableHead>Format</TableHead>
                <TableHead className="w-40">Statut</TableHead>
                <TableHead className="w-52">Partenaire</TableHead>
                <TableHead className="w-52">Régions</TableHead>
                <TableHead className="w-56">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((m) => {
                const linked = findLinkedExperience(m, experiences);
                // Publiée, l'expérience liée impose « en ligne » : le statut ne se change plus à la main.
                const statusLocked = !!linked?.published;
                return (
                  <TableRow key={m.id} className="align-top">
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2 font-medium">
                        {m.name}
                        <CoreBadge core={m.is_core} />
                      </div>
                      {(m.pillar || m.season) && (
                        <div className="text-xs text-muted-foreground">{[m.pillar, m.season].filter(Boolean).join(" · ")}</div>
                      )}
                      {linked && (
                        <div className="mt-0.5 text-xs">
                          <ExperienceLink experience={linked} />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{moodName.get(m.category_id) ?? "–"}</TableCell>
                    <TableCell className="text-xs">{formatLabel(m.format) || "–"}</TableCell>
                    <TableCell>
                      <Select
                        value={m.status}
                        disabled={statusLocked}
                        onValueChange={(v) => onUpdate(m.id, { status: v as MustHaveStatus })}
                      >
                        <SelectTrigger
                          aria-label={`Statut de ${m.name}`}
                          title={statusLocked ? "En ligne automatiquement : l'expérience liée est publiée" : undefined}
                          className={cn("h-8 gap-1 rounded-full border-0 px-2.5 text-xs font-medium", STATUS_CLASS[m.status])}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.filter((s) => s.value !== "en_ligne" || m.status === "en_ligne").map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="space-y-1">
                      <ProviderPicker
                        aria-label={`Prestataire de ${m.name}`}
                        value={m.provider_id}
                        onChange={(id) => onUpdate(m.id, { provider_id: id })}
                        placeholder="Prestataire"
                        compact
                      />
                      <CommitInput
                        aria-label={`Partenaire envisagé pour ${m.name}`}
                        className="h-8 text-xs"
                        placeholder="Partenaire envisagé (texte libre)"
                        value={m.partner ?? ""}
                        onCommit={(v) => onUpdate(m.id, { partner: v || null })}
                      />
                    </TableCell>
                    <TableCell>
                      <RegionMultiSelect value={m.region_ids} onChange={(ids) => onRegionsChange(m.id, ids)} />
                    </TableCell>
                    <TableCell>
                      <CommitInput
                        aria-label={`Notes sur ${m.name}`}
                        className="h-8 text-xs"
                        placeholder="Notes"
                        value={m.notes ?? ""}
                        onCommit={(v) => onUpdate(m.id, { notes: v || null })}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
