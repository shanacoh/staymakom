import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MustHaveDialog } from "@/components/admin/offerPlan/MustHaveDialog";
import { MustHaveList } from "@/components/admin/offerPlan/MustHaveList";
import { OfferCellPanel } from "@/components/admin/offerPlan/OfferCellPanel";
import { OfferCounters } from "@/components/admin/offerPlan/OfferCounters";
import { OfferGrid, OfferGridLegend, type SelectedCell } from "@/components/admin/offerPlan/OfferGrid";
import { errorMessage } from "@/lib/catalogue/queries";
import { buildGrid, cellDetail, countMustHaves, prospectionCsv, sortMoods } from "@/lib/offerPlan/compute";
import {
  createMustHave,
  saveMustHaveRegions,
  saveTarget,
  updateMustHave,
  useOfferPlan,
  useOfferPlanMutation,
} from "@/lib/offerPlan/queries";
import type { MustHaveDraft, MustHavePatch } from "@/lib/offerPlan/types";
import { groupByZone } from "@/lib/regionList/labels";
import { useRegionList } from "@/lib/regionList/queries";

function downloadCsv(content: string, filename: string) {
  // Le marqueur en tête fait reconnaître les accents par les tableurs.
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

const notifyError = (error: unknown) => toast.error(`Enregistrement impossible : ${errorMessage(error)}`);

export default function AdminOfferPlan() {
  const { plan, isLoading, error } = useOfferPlan();
  const regionList = useRegionList();

  const [selected, setSelected] = useState<SelectedCell | null>(null);
  // null = fenêtre fermée ; sinon le mood proposé d'office (ou "" s'il n'y en a pas).
  const [addingForMood, setAddingForMood] = useState<string | null>(null);

  const zones = useMemo(() => groupByZone(regionList), [regionList]);
  const regions = useMemo(() => zones.flatMap((z) => z.regions), [zones]);
  const moods = useMemo(() => sortMoods(plan.moods), [plan.moods]);
  const grid = useMemo(() => buildGrid(regions, plan.targets, plan.experiences), [regions, plan.targets, plan.experiences]);
  const counters = useMemo(() => countMustHaves(plan), [plan]);

  const targetMutation = useOfferPlanMutation((a: SelectedCell & { target: number }) => saveTarget(a.moodId, a.regionId, a.target));
  const updateMutation = useOfferPlanMutation((a: { id: string; patch: MustHavePatch }) => updateMustHave(a.id, a.patch));
  const regionsMutation = useOfferPlanMutation((a: { id: string; regionIds: string[] }) => saveMustHaveRegions(a.id, a.regionIds));
  const createMutation = useOfferPlanMutation((draft: MustHaveDraft) => createMustHave(draft));

  const selectedMood = selected && moods.find((m) => m.id === selected.moodId);
  const selectedRegion = selected && regions.find((r) => r.id === selected.regionId);

  const exportProspection = () => {
    const csv = prospectionCsv(plan.mustHaves, plan.moods, regionList.regions);
    const lines = csv.split("\n").length - 1;
    if (lines === 0) {
      toast.info("Rien à prospecter : aucun must-have « à trouver » ou « en prospection ».");
      return;
    }
    downloadCsv(csv, `staymakom-a-prospecter-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(`${lines} must-have${lines > 1 ? "s" : ""} exporté${lines > 1 ? "s" : ""}`);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Plan de l'offre</h1>
          <p className="text-sm text-muted-foreground">
            Ce qu'il faut avoir, mood par mood et région par région, comparé à ce qui est en ligne.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={exportProspection} disabled={isLoading || !!error}>
          <Download className="mr-1.5 h-4 w-4" />
          Exporter la liste à prospecter
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2" aria-busy="true">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Impossible de charger le plan de l'offre : {errorMessage(error)}
        </div>
      ) : (
        <>
          <OfferCounters counters={counters} />

          <Tabs defaultValue="grid" className="space-y-4">
            <TabsList>
              <TabsTrigger value="grid" className="text-xs">
                Grille
              </TabsTrigger>
              <TabsTrigger value="list" className="text-xs">
                Liste
                <span className="ml-1.5 text-muted-foreground">{plan.mustHaves.length}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="grid" className="space-y-3">
              <OfferGridLegend />
              <OfferGrid moods={moods} zones={zones} grid={grid} selected={selected} onSelect={setSelected} />
              {grid.withoutRegion > 0 && (
                <p className="text-xs text-muted-foreground">
                  {grid.withoutRegion} expérience{grid.withoutRegion > 1 ? "s" : ""} en ligne{" "}
                  {grid.withoutRegion > 1 ? "n'apparaissent" : "n'apparaît"} dans aucune case : leur fiche (ou leur hôtel) n'a pas encore
                  de région choisie dans la liste.
                </p>
              )}
              {selected && selectedMood && selectedRegion ? (
                <OfferCellPanel
                  key={`${selected.moodId}|${selected.regionId}`}
                  moodName={selectedMood.name}
                  regionName={selectedRegion.name_fr}
                  cell={grid.cell(selected.moodId, selected.regionId)}
                  detail={cellDetail(selected.moodId, selected.regionId, plan)}
                  experiences={plan.experiences}
                  onTargetChange={(target) => targetMutation.mutate({ ...selected, target }, { onError: notifyError })}
                  onClose={() => setSelected(null)}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Clique sur une case pour voir son objectif et ses must-haves.</p>
              )}
            </TabsContent>

            <TabsContent value="list">
              <MustHaveList
                mustHaves={plan.mustHaves}
                moods={moods}
                zones={zones}
                experiences={plan.experiences}
                onUpdate={(id, patch) => updateMutation.mutate({ id, patch }, { onError: notifyError })}
                onRegionsChange={(id, regionIds) => regionsMutation.mutate({ id, regionIds }, { onError: notifyError })}
                onAdd={(moodId) => setAddingForMood(moodId ?? "")}
              />
            </TabsContent>
          </Tabs>
        </>
      )}

      {addingForMood !== null && (
        <MustHaveDialog
          moods={moods}
          defaultMoodId={addingForMood || null}
          saving={createMutation.isPending}
          onClose={() => setAddingForMood(null)}
          onCreate={(draft) =>
            createMutation.mutate(draft, {
              onSuccess: () => {
                toast.success("Must-have ajouté");
                setAddingForMood(null);
              },
              onError: notifyError,
            })
          }
        />
      )}
    </div>
  );
}
