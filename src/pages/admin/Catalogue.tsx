import { useDeferredValue, useMemo, useState } from "react";
import { Link2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tile } from "@/components/admin/DashboardTiles";
import { AddToCatalogueDialog, type AddMode } from "@/components/admin/catalogue/AddToCatalogueDialog";
import { CatalogueFilters } from "@/components/admin/catalogue/CatalogueFilters";
import { CatalogueItemPanel } from "@/components/admin/catalogue/CatalogueItemPanel";
import { CatalogueTable } from "@/components/admin/catalogue/CatalogueTable";
import {
  DEFAULT_FILTERS,
  applyFilters,
  computeTiles,
  countByTab,
  distinctPlaces,
  hasActiveFilters,
  todayIso,
  type CatalogueFilterState,
  type QuickFilter,
  type TabKey,
} from "@/lib/catalogue/filters";
import { errorMessage, useCatalogueCategories, useCatalogueEntries } from "@/lib/catalogue/queries";
import { NATURE_OPTIONS } from "@/lib/catalogue/types";
import { cn } from "@/lib/utils";

const TABS: { value: TabKey; label: string }[] = [
  { value: "all", label: "Tous" },
  ...NATURE_OPTIONS.map((n) => ({ value: n.value as TabKey, label: n.label })),
  { value: "a_trier", label: "À trier" },
];

function CounterTile({
  label,
  count,
  hint,
  active,
  onClick,
}: {
  label: string;
  count: number;
  hint: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn("rounded-xl text-left transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground", active && "ring-2 ring-foreground")}
    >
      <Tile label={label}>
        <div className="text-2xl font-semibold leading-none">{count}</div>
        <div className="mt-1 text-[11px] text-muted-foreground">{hint}</div>
      </Tile>
    </button>
  );
}

export default function AdminCatalogue() {
  const { data: entries = [], isLoading, error } = useCatalogueEntries();
  const { data: categories = [] } = useCatalogueCategories();

  const [filters, setFilters] = useState<CatalogueFilterState>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<AddMode | null>(null);

  const today = useMemo(() => todayIso(), []);
  const counts = useMemo(() => countByTab(entries), [entries]);
  const tiles = useMemo(() => computeTiles(entries, today), [entries, today]);
  const regions = useMemo(() => distinctPlaces(entries, (e) => e.display_region), [entries]);
  const cities = useMemo(() => distinctPlaces(entries, (e) => e.display_city), [entries]);
  // La liste suit les filtres avec un léger décalage : la saisie dans la recherche reste fluide
  const deferredFilters = useDeferredValue(filters);
  const visible = useMemo(() => applyFilters(entries, deferredFilters, today), [entries, deferredFilters, today]);
  const selected = useMemo(() => entries.find((e) => e.id === selectedId) ?? null, [entries, selectedId]);

  const toggleQuick = (quick: Exclude<QuickFilter, null>) =>
    setFilters((f) => ({ ...f, quick: f.quick === quick ? null : quick }));
  const toggleToSort = () =>
    setFilters((f) => ({ ...f, tab: f.tab === "a_trier" ? "all" : "a_trier" }));

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catalogue</h1>
          <p className="text-sm text-muted-foreground">
            Tous les lieux : ceux du site, tes partenaires en cours et tes idées. Ta base pour les itinéraires.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={() => setAddMode("link")}>
            <Link2 className="mr-1.5 h-4 w-4" />
            Coller un lien
          </Button>
          <Button type="button" variant="outline" onClick={() => setAddMode("place")}>
            <Plus className="mr-1.5 h-4 w-4" />
            Ajouter un lieu
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CounterTile
          label="À trier"
          count={tiles.toSort}
          hint="Liens et idées qui attendent"
          active={filters.tab === "a_trier"}
          onClick={toggleToSort}
        />
        <CounterTile
          label="À relancer"
          count={tiles.followup}
          hint="Date de relance arrivée"
          active={filters.quick === "followup"}
          onClick={() => toggleQuick("followup")}
        />
        <CounterTile
          label="À visiter"
          count={tiles.toVisit}
          hint="Partenaires et discussions, pas encore visités"
          active={filters.quick === "to_visit"}
          onClick={() => toggleQuick("to_visit")}
        />
      </div>

      <Tabs value={filters.tab} onValueChange={(tab) => setFilters((f) => ({ ...f, tab: tab as TabKey }))}>
        <TabsList className="h-auto flex-wrap justify-start">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
              {tab.label}
              <span className="ml-1.5 text-muted-foreground">{counts[tab.value]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <CatalogueFilters filters={filters} onChange={setFilters} categories={categories} regions={regions} cities={cities} />

      {isLoading ? (
        <div className="space-y-2" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Impossible de charger le catalogue : {errorMessage(error)}
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Le catalogue est vide pour l'instant. Colle un lien ou ajoute un lieu pour commencer.
        </div>
      ) : visible.length === 0 ? (
        <div className="space-y-3 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          <p>Aucun lieu ne correspond à ces filtres.</p>
          {hasActiveFilters(filters) && (
            <Button type="button" variant="outline" size="sm" onClick={() => setFilters({ ...DEFAULT_FILTERS, tab: filters.tab })}>
              Réinitialiser les filtres
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {visible.length} lieu{visible.length > 1 ? "x" : ""} affiché{visible.length > 1 ? "s" : ""} sur {counts.all}
          </p>
          <CatalogueTable entries={visible} today={today} onSelect={setSelectedId} />
        </>
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

      <AddToCatalogueDialog
        mode={addMode}
        entries={entries}
        knownRegions={regions.map((r) => r.label)}
        onClose={() => setAddMode(null)}
        onCreated={(id, mode) => {
          // Un lien collé arrive en "À trier" : on bascule sur cet onglet pour que Shana le voie
          setFilters((f) => ({ ...DEFAULT_FILTERS, sort: f.sort, tab: mode === "link" ? "a_trier" : "all" }));
          setSelectedId(id);
        }}
      />
    </div>
  );
}
