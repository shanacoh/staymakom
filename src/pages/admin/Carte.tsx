import { useDeferredValue, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogueFilters } from "@/components/admin/catalogue/CatalogueFilters";
import { CatalogueItemPanel } from "@/components/admin/catalogue/CatalogueItemPanel";
import { CatalogueMap } from "@/components/admin/catalogue/CatalogueMap";
import { CatalogueTabs } from "@/components/admin/catalogue/CatalogueTabs";
import { LocateList, type SuggestedPosition } from "@/components/admin/catalogue/LocateList";
import { PositionAlerts } from "@/components/admin/catalogue/PositionAlerts";
import {
  DEFAULT_FILTERS,
  applyFilters,
  countByTab,
  distinctPlaces,
  todayIso,
  type CatalogueFilterState,
} from "@/lib/catalogue/filters";
import { hasSuspectPosition, isInIsrael, outsideIsraelWarning, siteHasBadPosition } from "@/lib/catalogue/geo";
import { mapBaseEntries, splitByPosition, STATUS_COLORS } from "@/lib/catalogue/map";
import { errorMessage, useCatalogueCategories, useCatalogueEntries, useUpdateCatalogueItem } from "@/lib/catalogue/queries";
import { STATUS_OPTIONS, type CatalogueEntry } from "@/lib/catalogue/types";

interface PendingPosition extends SuggestedPosition {
  entry: CatalogueEntry;
}

const round6 = (value: number) => Math.round(value * 1e6) / 1e6;

export default function AdminCarte() {
  const { data: entries = [], isLoading, error } = useCatalogueEntries();
  const { data: categories = [] } = useCatalogueCategories();
  const update = useUpdateCatalogueItem();

  const [filters, setFilters] = useState<CatalogueFilterState>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placing, setPlacing] = useState<CatalogueEntry | null>(null);
  const [pending, setPending] = useState<PendingPosition | null>(null);

  const today = useMemo(() => todayIso(), []);
  // Les lieux "À trier" (pas encore rangés) et abandonnés n'ont pas leur place sur la carte
  const base = useMemo(() => mapBaseEntries(entries, filters.status), [entries, filters.status]);
  const counts = useMemo(() => countByTab(base), [base]);
  const regions = useMemo(() => distinctPlaces(base, (e) => e.display_region), [base]);
  const cities = useMemo(() => distinctPlaces(base, (e) => e.display_city), [base]);
  const deferredFilters = useDeferredValue(filters);
  const filtered = useMemo(() => applyFilters(base, deferredFilters, today), [base, deferredFilters, today]);
  const { placed, missing } = useMemo(() => splitByPosition(filtered), [filtered]);
  // Les alertes de position ne dépendent pas des filtres : une erreur de données doit toujours se voir
  const suspect = useMemo(() => base.filter(hasSuspectPosition), [base]);
  const siteBad = useMemo(() => base.filter(siteHasBadPosition), [base]);
  const selected = useMemo(() => entries.find((e) => e.id === selectedId) ?? null, [entries, selectedId]);
  const knownRegions = useMemo(() => regions.map((r) => r.label), [regions]);

  const legend = useMemo(() => {
    const present = new Set(placed.map((p) => p.entry.commercial_status));
    return STATUS_OPTIONS.filter((s) => present.has(s.value));
  }, [placed]);

  const suggest = (entry: CatalogueEntry, position: SuggestedPosition) => {
    setPlacing(null);
    setPending({ entry, ...position });
  };

  const pickOnMap = (lat: number, lng: number) => {
    if (!placing) return;
    setPending({ entry: placing, lat, lng, label: "Position choisie sur la carte" });
    setPlacing(null);
  };

  const pendingWarning = pending ? outsideIsraelWarning(pending.lat, pending.lng) : null;

  const confirm = async () => {
    if (!pending || (pending && !isInIsrael(pending.lat, pending.lng))) return;
    try {
      await update.mutateAsync({
        id: pending.entry.id,
        patch: { latitude: round6(pending.lat), longitude: round6(pending.lng) },
      });
      toast.success(`Position enregistrée : ${pending.entry.display_name}`);
      setPending(null);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Carte</h1>
          <p className="text-sm text-muted-foreground">
            Tous les lieux du catalogue sur une carte, avec les mêmes filtres.
          </p>
        </div>
        {!isLoading && !error && (
          <p className="text-xs text-muted-foreground">
            {placed.length} lieu{placed.length > 1 ? "x" : ""} sur la carte
            {missing.length > 0 && `, ${missing.length} à localiser`}
            {suspect.length > 0 && `, ${suspect.length} à corriger`}
          </p>
        )}
      </div>

      <CatalogueTabs value={filters.tab} counts={counts} onChange={(tab) => setFilters((f) => ({ ...f, tab }))} />
      <CatalogueFilters
        filters={filters}
        onChange={setFilters}
        categories={categories}
        regions={regions}
        cities={cities}
        showSort={false}
      />

      {!isLoading && !error && (
        <PositionAlerts
          suspect={suspect}
          siteBad={siteBad}
          knownRegions={knownRegions}
          placingId={placing?.id ?? null}
          onSuggest={suggest}
          onStartPlacing={(entry) => {
            setPending(null);
            setPlacing(entry);
          }}
          onCancelPlacing={() => setPlacing(null)}
          onOpen={setSelectedId}
        />
      )}

      {placing && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <span>
            Clique sur la carte à l'endroit exact de <strong>{placing.display_name}</strong>.
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={() => setPlacing(null)}>
            Annuler
          </Button>
        </div>
      )}
      {pending && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm">
          <span>
            Placer <strong>{pending.entry.display_name}</strong> ici ?{" "}
            <span className="text-muted-foreground">{pending.label}</span>
            {pendingWarning && <span className="mt-1 block text-xs text-destructive">{pendingWarning} Choisis un autre endroit.</span>}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setPending(null)} disabled={update.isPending}>
              Annuler
            </Button>
            <Button type="button" size="sm" onClick={confirm} disabled={update.isPending || !!pendingWarning}>
              {update.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Confirmer
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-[65vh] w-full" aria-busy="true" />
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Impossible de charger le catalogue : {errorMessage(error)}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-2">
            <CatalogueMap
              points={placed}
              onOpen={setSelectedId}
              placing={placing !== null}
              onPickPosition={pickOnMap}
              preview={pending ? { lat: pending.lat, lng: pending.lng } : null}
            />
            {legend.length > 0 && (
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground" aria-label="Légende des couleurs">
                {legend.map((status) => (
                  <li key={status.value} className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full border border-white shadow"
                      style={{ background: STATUS_COLORS[status.value] }}
                    />
                    {status.label}
                  </li>
                ))}
              </ul>
            )}
            {placed.length === 0 && (
              <p className="text-xs text-muted-foreground">Aucun lieu avec une position ne correspond à ces filtres.</p>
            )}
          </div>
          <LocateList
            entries={missing}
            knownRegions={knownRegions}
            placingId={placing?.id ?? null}
            onSuggest={suggest}
            onStartPlacing={(entry) => {
              setPending(null);
              setPlacing(entry);
            }}
            onCancelPlacing={() => setPlacing(null)}
            onOpen={setSelectedId}
          />
        </div>
      )}

      {selected && (
        <CatalogueItemPanel
          key={selected.id}
          entry={selected}
          allEntries={entries}
          categories={categories}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
