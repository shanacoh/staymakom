/**
 * Page unique « Réservations » du back-office. Quatre onglets (Tous, Hôtel, Expérience,
 * Itinéraire) partagent la même barre d'outils et deux affichages des mêmes données :
 * « Vue » (résumé avec la prochaine action de chaque ligne) et « Saisie » (grille façon Excel).
 * Une demande de bateau ou d'expérience est une ligne comme les autres, au statut « Demande ».
 * Une demande de voyage sur mesure aussi, au statut « Demande sur-mesure » (onglet Itinéraire).
 */

import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Check, LayoutList, Lock, Plus, Table2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import LinkPaidDossierDialog from "@/components/admin/ReservationsHub/LinkPaidDossierDialog";
import EditRequestDialog from "@/components/admin/ReservationsHub/EditRequestDialog";
import DeleteReservationDialog from "@/components/admin/ReservationsHub/DeleteReservationDialog";
import DeletedReservationsTable from "@/components/admin/ReservationsHub/DeletedReservationsTable";
import UnfinishedPaymentsTable from "@/components/admin/ReservationsHub/UnfinishedPaymentsTable";
import ReservationsEntryGrid from "@/components/admin/ReservationsHub/ReservationsEntryGrid";
import CreateManualHotelBookingDialog from "@/components/admin/ReservationsHub/CreateManualHotelBookingDialog";
import CreateManualStandaloneBookingDialog from "@/components/admin/CreateManualStandaloneBookingDialog";
import ReservationActionDialogs, { type PendingAction } from "@/components/admin/ReservationsHub/ReservationActionDialogs";
import ReservationsToolbar from "@/components/admin/ReservationsHub/ReservationsToolbar";
import ReservationsKpis from "@/components/admin/ReservationsHub/ReservationsKpis";
import ReservationsSummaryTable from "@/components/admin/ReservationsHub/ReservationsSummaryTable";
import {
  DELETED_RESERVATIONS_QUERY_KEY,
  DOSSIER_LINES_QUERY_KEY,
  RESERVATIONS_QUERY_KEY,
  UNPAID_DOSSIERS_QUERY_KEY,
  useDeletedReservations,
  useDossierLines,
  useReservationRows,
  useUnfinishedPayments,
} from "@/lib/reservations/queries";
import {
  createBookingFromGrid,
  saveCellUpdate,
  saveDossierLineCost,
  setDossierLineSupplierPaid,
} from "@/lib/reservations/actions";
import { buildCellUpdate, type EntryColumnKey } from "@/lib/reservations/entryGrid";
import { applyToolbarFilters, computeKpis, groupRows, matchesTab } from "@/lib/reservations/rules";
import type {
  DossierLine,
  NextAction,
  PaymentFilter,
  PeriodFilter,
  ReservationRow,
  ReservationTab,
  StatusChip,
} from "@/lib/reservations/types";

type DisplayMode = "vue" | "saisie";

const DISPLAY_MODE_STORAGE_KEY = "admin-reservations-display";

const TAB_TRIGGER_CLASS =
  "rounded-full px-4 py-1.5 data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive data-[state=active]:shadow-none";

const TABS: { value: ReservationTab; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "hotels", label: "Hôtel" },
  { value: "experiences", label: "Expérience" },
  { value: "itineraries", label: "Itinéraire" },
];

const ADD_LABELS: Record<ReservationTab, string> = {
  all: "Ajouter",
  hotels: "Réservation hôtel",
  experiences: "Réservation ou demande",
  itineraries: "Lier un dossier payé",
};

function readDisplayMode(): DisplayMode {
  try {
    return localStorage.getItem(DISPLAY_MODE_STORAGE_KEY) === "saisie" ? "saisie" : "vue";
  } catch {
    return "vue";
  }
}

function parseTab(value: string | null): ReservationTab {
  return value === "hotels" || value === "experiences" || value === "itineraries" ? value : "all";
}

const AdminReservations = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));

  const [displayMode, setDisplayMode] = useState<DisplayMode>(readDisplayMode);
  const [search, setSearch] = useState("");
  // Les anciens liens « Demandes bateaux » arrivent avec ?boats=1&requests=1.
  const [boatsOnly, setBoatsOnly] = useState(searchParams.get("boats") === "1");
  const [statusChip, setStatusChip] = useState<StatusChip>(searchParams.get("requests") === "1" ? "requests" : "all");
  const [payment, setPayment] = useState<PaymentFilter>("all");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [channel, setChannel] = useState("all");
  const [hotelCreateOpen, setHotelCreateOpen] = useState(false);
  const [experienceCreateOpen, setExperienceCreateOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [unfinishedOpen, setUnfinishedOpen] = useState(false);
  const [linkDossierOpen, setLinkDossierOpen] = useState(false);
  const [editRequestId, setEditRequestId] = useState<string | null>(null);
  const [expandedDossiers, setExpandedDossiers] = useState<Set<string>>(new Set());
  const [isCreatingRow, setIsCreatingRow] = useState(false);
  // Lignes en attente de confirmation de suppression (une seule, ou toute la sélection).
  const [rowsToDelete, setRowsToDelete] = useState<ReservationRow[]>([]);
  // Lignes cochées dans la grille de Saisie, par leur clé.
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [trashOpen, setTrashOpen] = useState(false);
  const [savedVisible, setSavedVisible] = useState(false);
  const savedTimer = useRef<number>();

  const { data: rows, isLoading, error } = useReservationRows();
  const { data: unfinishedPayments } = useUnfinishedPayments();
  const { data: deletedReservations } = useDeletedReservations();
  const { data: dossierLines } = useDossierLines();
  const linesByDossier = useMemo(() => {
    const map = new Map<string, DossierLine[]>();
    for (const line of dossierLines ?? []) map.set(line.dossierId, [...(map.get(line.dossierId) ?? []), line]);
    return map;
  }, [dossierLines]);
  // Le compteur de la puce ne compte que ce qui reste à relancer.
  const unfinishedToFollowUp = (unfinishedPayments ?? []).filter((p) => !p.converted).length;

  const showBoatsChip = tab === "all" || tab === "experiences";
  const effectiveBoatsOnly = showBoatsChip && boatsOnly;

  const filteredRows = useMemo(
    () => applyToolbarFilters(rows ?? [], { search, boatsOnly: effectiveBoatsOnly, payment, period, channel }),
    [rows, search, effectiveBoatsOnly, payment, period, channel],
  );

  const tabCounts = useMemo(
    () =>
      Object.fromEntries(TABS.map((t) => [t.value, filteredRows.filter((row) => matchesTab(row, t.value)).length])) as Record<
        ReservationTab,
        number
      >,
    [filteredRows],
  );

  const tabRows = useMemo(() => filteredRows.filter((row) => matchesTab(row, tab)), [filteredRows, tab]);
  const groups = useMemo(() => groupRows(tabRows), [tabRows]);
  const kpis = useMemo(() => computeKpis(tabRows), [tabRows]);

  const visibleGroups = useMemo(() => {
    if (statusChip === "requests") return { requests: groups.requests, todo: [], settled: [] };
    if (statusChip === "todo") return { requests: [], todo: groups.todo, settled: [] };
    return groups;
  }, [groups, statusChip]);
  // Même sélection que les groupes, mais dans l'ordre des dates : en Saisie, une ligne ne doit
  // pas changer de place parce qu'on vient de modifier une de ses cellules.
  const visibleRows = useMemo(() => {
    const visible = new Set([...visibleGroups.requests, ...visibleGroups.todo, ...visibleGroups.settled]);
    return tabRows.filter((row) => visible.has(row));
  }, [tabRows, visibleGroups]);

  // Seules les lignes encore affichées comptent : une ligne cochée puis masquée par un filtre
  // ne doit pas être supprimée sans être vue.
  const selectedRows = useMemo(() => visibleRows.filter((row) => selectedKeys.has(row.key)), [visibleRows, selectedKeys]);

  // Une ligne ne se crée en tapant que là où c'est une réservation d'expérience ou de bateau.
  const allowNewRow = tab === "all" || tab === "experiences";

  const refreshRows = () => queryClient.invalidateQueries({ queryKey: RESERVATIONS_QUERY_KEY });

  // Une suppression ou une restauration peut toucher un dossier : tout ce que la page lit est relu.
  const refreshAfterTrashChange = async () => {
    setSelectedKeys(new Set());
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: DELETED_RESERVATIONS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: DOSSIER_LINES_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: UNPAID_DOSSIERS_QUERY_KEY }),
      refreshRows(),
    ]);
  };

  const toggleRowSelection = (row: ReservationRow, selected: boolean) =>
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (selected) next.add(row.key);
      else next.delete(row.key);
      return next;
    });
  const toggleAllSelection = (selected: boolean) => setSelectedKeys(selected ? new Set(visibleRows.map((row) => row.key)) : new Set());

  // Une demande n'a pas de fiche : on ouvre sa fenêtre de modification.
  const openRow = (row: ReservationRow) => {
    if (row.source === "request") setEditRequestId(row.id);
    else if (row.detailPath) navigate(row.detailPath);
  };

  const flashSaved = () => {
    setSavedVisible(true);
    window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => setSavedVisible(false), 2000);
  };

  const commitCell = async (row: ReservationRow, key: EntryColumnKey, rawValue: string): Promise<boolean> => {
    const update = buildCellUpdate(row, key, rawValue);
    if ("message" in update) {
      toast.error("Valeur refusée", { description: update.message });
      return false;
    }
    try {
      await saveCellUpdate(update.table, row.id, update.patch);
    } catch (e) {
      toast.error("Erreur de sauvegarde", { description: (e as Error).message });
      return false;
    }
    flashSaved();
    await refreshRows();
    return true;
  };

  const commitNewRow = async (customerName: string): Promise<boolean> => {
    if (isCreatingRow) return false;
    setIsCreatingRow(true);
    try {
      await createBookingFromGrid(customerName, format(new Date(), "yyyy-MM-dd"));
    } catch (e) {
      toast.error("Impossible de créer la réservation", { description: (e as Error).message });
      return false;
    } finally {
      setIsCreatingRow(false);
    }
    flashSaved();
    await refreshRows();
    return true;
  };

  const handleTabChange = (value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", value);
        return next;
      },
      { replace: true },
    );
  };

  const handleDisplayModeChange = (value: string) => {
    if (value !== "vue" && value !== "saisie") return;
    setDisplayMode(value);
    refreshRows();
    try {
      localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, value);
    } catch {
      // Stockage du navigateur indisponible : le choix vaut pour cette visite seulement.
    }
  };

  // Les actions directes existent pour les demandes et les réservations d'expérience saisies
  // à la main. Pour le reste (hôtel, dossier, réservation payée en ligne à encaisser), le
  // bouton ouvre la fiche, où se trouvent les outils propres à ce type de réservation.
  const handleAction = (row: ReservationRow, action: NextAction) => {
    if (action.kind === "open_request") {
      if (row.detailPath) navigate(row.detailPath);
      return;
    }
    if (row.source === "dossier") {
      // Les coûts et paiements fournisseur d'un dossier se règlent ligne par ligne : on le déplie.
      if (action.kind === "confirm_collection") setPendingAction({ row, action });
      else setExpandedDossiers((current) => new Set(current).add(row.id));
      return;
    }
    const handledHere =
      row.source === "request" ||
      (row.source === "booking" && !(action.kind === "confirm_collection" && row.isOnline));
    if (handledHere) setPendingAction({ row, action });
    else if (row.detailPath) navigate(row.detailPath);
  };

  const toggleDossier = (dossierId: string) =>
    setExpandedDossiers((current) => {
      const next = new Set(current);
      if (next.has(dossierId)) next.delete(dossierId);
      else next.add(dossierId);
      return next;
    });

  const refreshDossiers = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: DOSSIER_LINES_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: UNPAID_DOSSIERS_QUERY_KEY }),
      refreshRows(),
    ]);
  };

  const saveLine = async (write: () => Promise<void>) => {
    try {
      await write();
    } catch (e) {
      toast.error("Erreur de sauvegarde", { description: (e as Error).message });
      return;
    }
    flashSaved();
    await refreshDossiers();
  };
  const handleLineCost = (line: DossierLine, cost: number | null) => saveLine(() => saveDossierLineCost(line.id, cost));
  const handleLinePaid = (line: DossierLine, paid: boolean) => saveLine(() => setDossierLineSupplierPaid(line.id, paid));

  const dossierLinesProps = {
    linesByDossier,
    expandedDossiers,
    onToggleDossier: toggleDossier,
    onLineCost: handleLineCost,
    onLinePaid: handleLinePaid,
  };

  const addButton =
    tab === "all" ? (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <Plus className="h-4 w-4" />
            {ADD_LABELS.all}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setExperienceCreateOpen(true)}>Réservation d'expérience ou de bateau</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setHotelCreateOpen(true)}>Réservation d'hôtel</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setLinkDossierOpen(true)}>Lier un dossier payé</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ) : (
      <Button
        onClick={() =>
          tab === "hotels" ? setHotelCreateOpen(true) : tab === "itineraries" ? setLinkDossierOpen(true) : setExperienceCreateOpen(true)
        }
      >
        <Plus className="h-4 w-4" />
        {ADD_LABELS[tab]}
      </Button>
    );

  const emptyState = (
    <div className="rounded-lg border bg-card py-12 text-center">
      <p className="text-sm font-medium text-foreground">
        {tab === "hotels" && tabCounts.hotels === 0
          ? "Aucune réservation d'hôtel pour l'instant"
          : tab === "itineraries" && tabCounts.itineraries === 0
            ? "Aucun dossier de voyage payé pour l'instant"
            : "Aucune ligne ne correspond à ces filtres"}
      </p>
      {tab === "hotels" && tabCounts.hotels === 0 && (
        <p className="mt-1 text-xs text-muted-foreground">Les réservations en ligne arriveront ici automatiquement.</p>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Réservations</h1>
          <p className="mt-0.5 max-w-2xl text-xs text-muted-foreground">
            Une ligne commence en « Demande » (bateau, expérience sur demande) ou directement « Confirmée » (paiement en
            ligne, saisie manuelle).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup type="single" value={displayMode} onValueChange={handleDisplayModeChange} variant="outline" size="sm">
            <ToggleGroupItem value="vue" aria-label="Affichage Vue" className="gap-1.5">
              <LayoutList className="h-3.5 w-3.5" />
              Vue
            </ToggleGroupItem>
            <ToggleGroupItem value="saisie" aria-label="Affichage Saisie" className="gap-1.5">
              <Table2 className="h-3.5 w-3.5" />
              Saisie
            </ToggleGroupItem>
          </ToggleGroup>
          {addButton}
        </div>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList className="h-auto rounded-full bg-muted p-1">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className={TAB_TRIGGER_CLASS}>
              {t.label}
              <span className="ml-1.5 tabular-nums opacity-70">{tabCounts[t.value]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <ReservationsToolbar
        search={search}
        onSearchChange={setSearch}
        statusChip={statusChip}
        onStatusChipChange={setStatusChip}
        requestsCount={groups.requests.length}
        todoCount={groups.todo.length}
        showBoatsChip={showBoatsChip}
        boatsOnly={boatsOnly}
        onBoatsOnlyChange={setBoatsOnly}
        payment={payment}
        onPaymentChange={setPayment}
        period={period}
        onPeriodChange={setPeriod}
        channel={channel}
        onChannelChange={setChannel}
        unfinishedCount={unfinishedToFollowUp}
        unfinishedOpen={unfinishedOpen}
        onUnfinishedOpenChange={(open) => {
          setUnfinishedOpen(open);
          if (open) setTrashOpen(false);
        }}
        trashCount={deletedReservations?.length ?? 0}
        trashOpen={trashOpen}
        onTrashOpenChange={(open) => {
          setTrashOpen(open);
          if (open) setUnfinishedOpen(false);
        }}
      />

      {trashOpen ? (
        <DeletedReservationsTable items={deletedReservations ?? []} onRestored={refreshAfterTrashChange} />
      ) : unfinishedOpen ? (
        <UnfinishedPaymentsTable payments={unfinishedPayments ?? []} />
      ) : isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Chargement...</div>
      ) : error ? (
        <div className="rounded-lg border bg-card py-12 text-center text-sm text-destructive">
          Impossible de charger les réservations. Recharge la page, et si le problème continue, préviens le développeur.
        </div>
      ) : displayMode === "vue" ? (
        <>
          <ReservationsKpis kpis={kpis} />
          {visibleRows.length > 0 ? (
            <ReservationsSummaryTable groups={visibleGroups} onAction={handleAction} onOpen={openRow} {...dossierLinesProps} />
          ) : (
            emptyState
          )}
        </>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Clic = éditer · Entrée = valider · Échap = annuler · Tab / flèches = naviguer</span>
            <span className="inline-flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Verrouillé (vient de Revolut)
            </span>
            <span>Texte gris = calculé ou géré dans la fiche</span>
            <span
              aria-live="polite"
              className={cn("ml-auto inline-flex items-center gap-1 text-foreground transition-opacity", savedVisible ? "opacity-100" : "opacity-0")}
            >
              <Check className="h-3 w-3" />
              Enregistré
            </span>
          </div>
          {selectedRows.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
              <span className="font-medium tabular-nums text-foreground">
                {selectedRows.length} ligne{selectedRows.length > 1 ? "s" : ""} sélectionnée{selectedRows.length > 1 ? "s" : ""}
              </span>
              <Button size="sm" variant="destructive" onClick={() => setRowsToDelete(selectedRows)}>
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedKeys(new Set())}>
                Tout décocher
              </Button>
            </div>
          )}
          {visibleRows.length > 0 || allowNewRow ? (
            <ReservationsEntryGrid
              rows={visibleRows}
              allowNewRow={allowNewRow}
              isCreatingRow={isCreatingRow}
              onCellCommit={commitCell}
              onNewRowCommit={commitNewRow}
              onOpen={openRow}
              onDelete={(row) => setRowsToDelete([row])}
              selectedKeys={selectedKeys}
              onToggleRow={toggleRowSelection}
              onToggleAll={toggleAllSelection}
              linesByDossier={linesByDossier}
              onLineCost={handleLineCost}
              onLinePaid={handleLinePaid}
            />
          ) : (
            emptyState
          )}
        </div>
      )}

      {tab === "itineraries" && (
        <p className="text-xs text-muted-foreground">
          Dossiers pas encore payés : ils vivent dans{" "}
          <Link to="/admin/dossiers" className="font-medium text-foreground underline underline-offset-2">
            Itinéraires
          </Link>{" "}
          et arrivent ici au paiement.
        </p>
      )}

      <CreateManualHotelBookingDialog
        open={hotelCreateOpen}
        onOpenChange={(open) => {
          setHotelCreateOpen(open);
          if (!open) refreshRows();
        }}
      />
      <CreateManualStandaloneBookingDialog
        open={experienceCreateOpen}
        onOpenChange={(open) => {
          setExperienceCreateOpen(open);
          if (!open) refreshRows();
        }}
      />

      <LinkPaidDossierDialog open={linkDossierOpen} onOpenChange={setLinkDossierOpen} onLinked={refreshDossiers} />
      <EditRequestDialog
        requestId={editRequestId}
        onClose={() => {
          setEditRequestId(null);
          refreshRows();
        }}
      />
      <DeleteReservationDialog rows={rowsToDelete} onClose={() => setRowsToDelete([])} onDeleted={refreshAfterTrashChange} />
      <ReservationActionDialogs pending={pendingAction} onClose={() => setPendingAction(null)} onDone={refreshRows} />
    </div>
  );
};

export default AdminReservations;
