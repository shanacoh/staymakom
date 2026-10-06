/**
 * Page unique « Réservations » du back-office. Quatre onglets (Tous, Hôtel, Expérience,
 * Itinéraire) partagent la même barre d'outils et deux affichages des mêmes données :
 * « Vue » (résumé avec la prochaine action de chaque ligne) et « Saisie » (grille façon Excel).
 * Une demande de bateau ou d'expérience est une ligne comme les autres, au statut « Demande ».
 */

import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutList, Plus, Table2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ExperienceBookingsGrid from "@/components/admin/ReservationsHub/ExperienceBookingsGrid";
import HotelBookingsGrid from "@/components/admin/ReservationsHub/HotelBookingsGrid";
import CreateManualHotelBookingDialog from "@/components/admin/ReservationsHub/CreateManualHotelBookingDialog";
import CreateManualStandaloneBookingDialog from "@/components/admin/CreateManualStandaloneBookingDialog";
import ReservationActionDialogs, { type PendingAction } from "@/components/admin/ReservationsHub/ReservationActionDialogs";
import ReservationsToolbar from "@/components/admin/ReservationsHub/ReservationsToolbar";
import ReservationsKpis from "@/components/admin/ReservationsHub/ReservationsKpis";
import ReservationsSummaryTable from "@/components/admin/ReservationsHub/ReservationsSummaryTable";
import { RESERVATIONS_QUERY_KEY, useReservationRows } from "@/lib/reservations/queries";
import { applyToolbarFilters, computeKpis, groupRows, matchesTab } from "@/lib/reservations/rules";
import type {
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

  const { data: rows, isLoading, error } = useReservationRows();

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
  const visibleCount = visibleGroups.requests.length + visibleGroups.todo.length + visibleGroups.settled.length;

  const refreshRows = () => queryClient.invalidateQueries({ queryKey: RESERVATIONS_QUERY_KEY });

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
    const handledHere =
      row.source === "request" ||
      (row.source === "booking" && !(action.kind === "confirm_collection" && row.isOnline));
    if (handledHere) setPendingAction({ row, action });
    else if (row.detailPath) navigate(row.detailPath);
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
        </DropdownMenuContent>
      </DropdownMenu>
    ) : (
      <Button
        disabled={tab === "itineraries"}
        title={tab === "itineraries" ? "Disponible avec le lot Itinéraire" : undefined}
        onClick={() => (tab === "hotels" ? setHotelCreateOpen(true) : setExperienceCreateOpen(true))}
      >
        <Plus className="h-4 w-4" />
        {ADD_LABELS[tab]}
      </Button>
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

      {displayMode === "vue" ? (
        <>
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
          />

          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Chargement...</div>
          ) : error ? (
            <div className="rounded-lg border bg-card py-12 text-center text-sm text-destructive">
              Impossible de charger les réservations. Recharge la page, et si le problème continue, préviens le développeur.
            </div>
          ) : (
            <>
              <ReservationsKpis kpis={kpis} />
              {visibleCount > 0 ? (
                <ReservationsSummaryTable groups={visibleGroups} onAction={handleAction} onOpen={(row) => row.detailPath && navigate(row.detailPath)} />
              ) : (
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
              )}
            </>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Grille actuelle, en attendant la grille de saisie commune à tous les onglets (lot 3).
          </p>
          {tab === "hotels" ? (
            <HotelBookingsGrid createOpen={false} onCreateOpenChange={() => undefined} />
          ) : tab === "itineraries" ? (
            <div className="rounded-lg border bg-card py-12 text-center text-sm text-muted-foreground">
              La saisie des dossiers de voyage arrive avec le lot Itinéraire.
            </div>
          ) : (
            <ExperienceBookingsGrid createOpen={false} onCreateOpenChange={() => undefined} />
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

      <ReservationActionDialogs pending={pendingAction} onClose={() => setPendingAction(null)} onDone={refreshRows} />
    </div>
  );
};

export default AdminReservations;
