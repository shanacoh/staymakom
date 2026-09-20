import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Link2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddToCatalogueDialog, type AddMode } from "@/components/admin/catalogue/AddToCatalogueDialog";
import { CatalogueItemPanel } from "@/components/admin/catalogue/CatalogueItemPanel";
import { CatalogueTable } from "@/components/admin/catalogue/CatalogueTable";
import { CatalogueTabs } from "@/components/admin/catalogue/CatalogueTabs";
import { CatalogueToolbar } from "@/components/admin/catalogue/CatalogueToolbar";
import { InboxList } from "@/components/admin/catalogue/InboxList";
import {
  DEFAULT_FILTERS,
  applyFilters,
  clearFilters,
  countByTab,
  distinctPlaces,
  hasActiveFilters,
  searchTerms,
  todayIso,
  type CatalogueFilterState,
} from "@/lib/catalogue/filters";
import { hasSuspectPosition, siteHasBadPosition } from "@/lib/catalogue/geo";
import { errorMessage, useCatalogueCategories, useCatalogueEntries } from "@/lib/catalogue/queries";
import { STATUS_OPTIONS } from "@/lib/catalogue/types";

const ALL_STATUSES = STATUS_OPTIONS.map((s) => s.value);

export default function AdminCatalogue() {
  const { data: entries = [], isLoading, error } = useCatalogueEntries();
  const { data: categories = [] } = useCatalogueCategories();

  const [filters, setFilters] = useState<CatalogueFilterState>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<AddMode | null>(null);

  const today = useMemo(() => todayIso(), []);
  const counts = useMemo(() => countByTab(entries), [entries]);
  const regions = useMemo(() => distinctPlaces(entries, (e) => e.display_region), [entries]);
  // La liste suit les filtres avec un léger décalage : la saisie dans la recherche reste fluide
  const deferredFilters = useDeferredValue(filters);
  const visible = useMemo(() => applyFilters(entries, deferredFilters, today), [entries, deferredFilters, today]);
  const terms = useMemo(() => searchTerms(deferredFilters.search), [deferredFilters.search]);
  const selected = useMemo(() => entries.find((e) => e.id === selectedId) ?? null, [entries, selectedId]);
  // Tous les lieux sont en Israël : une position ailleurs est une erreur de données à signaler
  const badPositions = useMemo(
    () =>
      entries.filter(
        (e) => e.commercial_status !== "a_trier" && e.commercial_status !== "refuse" && (hasSuspectPosition(e) || siteHasBadPosition(e))
      ).length,
    [entries]
  );

  const inbox = filters.tab === "a_trier";

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

      {badPositions > 0 && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <span className="flex items-start gap-2 text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              {badPositions} lieu{badPositions > 1 ? "x ont" : " a"} une position hors d'Israël : c'est une erreur de données à corriger.
            </span>
          </span>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/carte">Voir sur la carte</Link>
          </Button>
        </div>
      )}

      <CatalogueTabs
        value={filters.tab}
        counts={counts}
        withInbox
        onChange={(tab) => setFilters((f) => ({ ...f, tab }))}
      />

      <CatalogueToolbar
        entries={entries}
        filters={filters}
        onChange={setFilters}
        categories={categories}
        today={today}
        statusChoices={ALL_STATUSES}
        resultCount={visible.length}
        showSort
        hideProgress={inbox}
      />

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
      ) : visible.length === 0 && inbox && !hasActiveFilters(filters) ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Rien à trier pour l'instant. Les liens envoyés depuis ton iPhone, ou collés avec « Coller un lien », arrivent ici.
        </div>
      ) : visible.length === 0 ? (
        <div className="space-y-3 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          <p>Aucun lieu ne correspond à ces filtres.</p>
          {hasActiveFilters(filters) && (
            <Button type="button" variant="outline" size="sm" onClick={() => setFilters(clearFilters(filters))}>
              Tout effacer
            </Button>
          )}
        </div>
      ) : inbox ? (
        <InboxList entries={visible} onOpen={setSelectedId} />
      ) : (
        <CatalogueTable entries={visible} today={today} onSelect={setSelectedId} terms={terms} />
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
