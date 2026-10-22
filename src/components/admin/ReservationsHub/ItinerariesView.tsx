/**
 * Onglet Itinéraire, affichage « Vue » : tous les dossiers de voyage, payés ou non, rangés en
 * Convertis / En cours / Collab / Modèles / Non convertis, avec les chiffres clés de conversion.
 * Les pages-itinéraire écrites dans le code du site y figurent aussi, leur lien mène à la page.
 */

import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ChevronDown, ChevronRight, ExternalLink, FolderOpen, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tile } from "@/components/admin/DashboardTiles";
import { formatCurrency } from "@/components/admin/BookingsGrid/columnTypes";
import { reactivateDossier, setDossierObjective } from "@/lib/reservations/actions";
import {
  ITINERARY_GROUPS,
  clientLinkPath,
  computeItineraryKpis,
  groupItineraries,
  itineraryStatusLabel,
} from "@/lib/reservations/itineraries";
import { formatMoneyByCurrency } from "@/lib/reservations/rules";
import type { DossierLine, ItineraryDossier } from "@/lib/reservations/types";
import LinkPaidDossierDialog from "./LinkPaidDossierDialog";
import LostDossierDialog from "./LostDossierDialog";
import { LineCostInput, NatureTag } from "./DossierLineCells";
import { SupplierPaymentPill } from "./ReservationPills";

interface Props {
  dossiers: ItineraryDossier[];
  // Recherche de la barre d'outils, appliquée au nom, au client et à la référence.
  search: string;
  linesByDossier: Map<string, DossierLine[]>;
  onLineCost: (line: DossierLine, cost: number | null) => void;
  onLinePaid: (line: DossierLine, paid: boolean) => void;
  // Appelé après chaque modification d'un dossier, pour relire la page.
  onChanged: () => void;
}

type PendingDialog = { kind: "paid" | "lost"; dossier: ItineraryDossier } | null;

const VALUE_CLASS = "text-xl font-semibold tabular-nums";
const COLUMN_COUNT = 12;

const day = (value: string | null) => (value ? format(parseISO(value), "dd/MM/yy") : "");

function travelDates(d: ItineraryDossier): string {
  if (!d.arrival) return "-";
  if (!d.departure || d.departure === d.arrival) return day(d.arrival);
  return `${day(d.arrival)} → ${day(d.departure)}`;
}

function matchesSearch(d: ItineraryDossier, search: string): boolean {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  return [d.name, d.client, d.ref].some((value) => value?.toLowerCase().includes(needle));
}

// Lignes de réservation d'un dossier payé (hôtel, activité...), sous sa ligne.
function DossierLinesPanel({ lines, onLineCost, onLinePaid }: { lines: DossierLine[] } & Pick<Props, "onLineCost" | "onLinePaid">) {
  if (lines.length === 0) return <p className="text-xs text-muted-foreground">Aucune ligne de réservation dans ce dossier.</p>;
  return (
    <div className="space-y-1.5">
      {lines.map((line) => (
        <div key={line.id} className="flex flex-wrap items-center gap-3 text-sm">
          <span className="w-12 tabular-nums text-muted-foreground">{line.date ? format(parseISO(line.date), "dd/MM") : ""}</span>
          <NatureTag nature={line.nature} />
          <span className="min-w-[180px] flex-1 truncate">{line.product}</span>
          <LineCostInput line={line} onCommit={(cost) => onLineCost(line, cost)} />
          <SupplierPaymentPill payment={line.supplierPaid ? "paid" : "todo"} />
          {line.supplierPaid ? (
            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => onLinePaid(line, false)}>
              Annuler « payé »
            </Button>
          ) : (
            line.cost !== null && (
              <Button size="sm" variant="outline" onClick={() => onLinePaid(line, true)}>
                Fournisseur payé
              </Button>
            )
          )}
        </div>
      ))}
    </div>
  );
}

const ItinerariesView = ({ dossiers, search, linesByDossier, onLineCost, onLinePaid, onChanged }: Props) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<PendingDialog>(null);

  const visible = useMemo(() => dossiers.filter((d) => matchesSearch(d, search)), [dossiers, search]);
  const groups = useMemo(() => groupItineraries(visible), [visible]);
  const kpis = useMemo(() => computeItineraryKpis(dossiers), [dossiers]);
  // Calculé une fois par dossier visé : la fenêtre repart de ces valeurs à chaque nouveau dossier.
  const paidPreset = useMemo(
    () =>
      pending?.kind === "paid"
        ? {
            id: pending.dossier.id,
            label: [pending.dossier.ref, pending.dossier.name, pending.dossier.client].filter(Boolean).join(" · "),
            currency: pending.dossier.currency,
            proposedTotal: pending.dossier.proposedPrice,
          }
        : null,
    [pending],
  );

  const quickAction = useMutation({
    mutationFn: ({ run }: { run: () => Promise<void>; success: string }) => run(),
    onSuccess: (_data, { success }) => {
      toast.success(success);
      onChanged();
    },
    onError: (error: Error) => toast.error("Action impossible", { description: error.message }),
  });

  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const menuItems = (d: ItineraryDossier) => {
    const items: { label: string; onSelect: () => void }[] = [];
    if (d.group === "converti" || d.group === "modele") return items;
    items.push({ label: "Marquer payé", onSelect: () => setPending({ kind: "paid", dossier: d }) });
    if (d.group !== "non_converti") items.push({ label: "Classer non converti", onSelect: () => setPending({ kind: "lost", dossier: d }) });
    if (d.objective === "vente") {
      items.push({
        label: "Passer en Collab",
        onSelect: () => quickAction.mutate({ run: () => setDossierObjective(d.id, "collab"), success: "Dossier passé en Collab" }),
      });
    } else {
      items.push({
        label: "Repasser en Vente",
        onSelect: () => quickAction.mutate({ run: () => setDossierObjective(d.id, "vente"), success: "Dossier repassé en Vente" }),
      });
    }
    if (d.group === "non_converti") {
      const wasSent = d.sentAt !== null || d.customPage !== null;
      items.push({
        label: "Réactiver",
        onSelect: () => quickAction.mutate({ run: () => reactivateDossier(d.id, wasSent), success: "Dossier réactivé" }),
      });
    }
    return items;
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <Tile label="Dossiers créés">
          <p className={VALUE_CLASS}>{kpis.created}</p>
        </Tile>
        <Tile label="Envoyés (vente)">
          <p className={VALUE_CLASS}>{kpis.sent}</p>
        </Tile>
        <Tile label="Convertis">
          <p className={VALUE_CLASS}>{kpis.converted}</p>
        </Tile>
        <Tile label="Taux de conversion">
          <p className={VALUE_CLASS}>{kpis.conversionRate === null ? "-" : `${kpis.conversionRate} %`}</p>
        </Tile>
        <Tile label="CA itinéraires">
          <p className={VALUE_CLASS}>{formatMoneyByCurrency(kpis.revenue)}</p>
        </Tile>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border bg-card py-12 text-center text-sm text-muted-foreground">
          Aucun dossier ne correspond à cette recherche.
        </div>
      ) : (
        ITINERARY_GROUPS.filter((group) => groups[group.key].length > 0).map((group) => (
          <section key={group.key} className="space-y-2">
            <h2 className="flex items-baseline gap-2 text-xs">
              <span className="font-semibold uppercase tracking-wider text-foreground">{group.label}</span>
              <span className="tabular-nums text-muted-foreground">{groups[group.key].length}</span>
              {group.hint && <span className="text-muted-foreground">· {group.hint}</span>}
            </h2>
            <div className="overflow-x-auto rounded-lg border bg-card">
              <Table className="min-w-[1180px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Réf</TableHead>
                    <TableHead>Nom du dossier</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead>Dates voyage</TableHead>
                    <TableHead>Voy.</TableHead>
                    <TableHead>Objectif</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Ouvertures</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Lien</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups[group.key].map((d) => {
                    const lines = linesByDossier.get(d.id) ?? [];
                    const isExpanded = expanded.has(d.id);
                    const items = menuItems(d);
                    return (
                      <Fragment key={d.id}>
                        <TableRow className={d.group === "non_converti" ? "text-muted-foreground" : undefined}>
                          <TableCell className="whitespace-nowrap tabular-nums text-xs text-muted-foreground">{d.ref}</TableCell>
                          <TableCell className="max-w-[260px]">
                            <div className="truncate font-medium text-foreground">{d.name}</div>
                            {d.customPage && (
                              <Badge variant="outline" className="mt-0.5 rounded-md px-1.5 text-[10px] font-normal text-muted-foreground">
                                Page sur mesure
                              </Badge>
                            )}
                            {d.group === "converti" && !d.customPage && (
                              <button
                                type="button"
                                onClick={() => toggle(d.id)}
                                aria-expanded={isExpanded}
                                className="mt-0.5 flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
                              >
                                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                {lines.length} ligne{lines.length > 1 ? "s" : ""} de réservation
                              </button>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[160px] truncate">{d.client || "-"}</TableCell>
                          <TableCell className="whitespace-nowrap tabular-nums">{day(d.createdAt)}</TableCell>
                          <TableCell className="whitespace-nowrap tabular-nums">{travelDates(d)}</TableCell>
                          <TableCell className="tabular-nums">{d.travelers ?? "-"}</TableCell>
                          <TableCell>{d.objective === "collab" ? "Collab" : "Vente"}</TableCell>
                          <TableCell className="max-w-[220px] truncate">{itineraryStatusLabel(d)}</TableCell>
                          <TableCell className="whitespace-nowrap tabular-nums">
                            {d.customPage ? (
                              <span className="text-xs text-muted-foreground">non suivies</span>
                            ) : (
                              <>
                                {d.opens}
                                {d.lastOpenedAt && <span className="text-xs text-muted-foreground"> · {day(d.lastOpenedAt)}</span>}
                              </>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right tabular-nums">
                            {d.amount !== null ? formatCurrency(d.amount, d.currency) : "-"}
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                  <a href={clientLinkPath(d)} target="_blank" rel="noopener noreferrer" aria-label={`Ouvrir la page client de ${d.name}`}>
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ouvrir la page que voit le client</TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1">
                              {!d.customPage && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                      <Link to={`/admin/dossiers/${d.id}`} aria-label={`Ouvrir ${d.name} dans Itinéraires`}>
                                        <FolderOpen className="h-3.5 w-3.5" />
                                      </Link>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Ouvrir dans Itinéraires</TooltipContent>
                                </Tooltip>
                              )}
                              {items.length > 0 && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Autres actions pour ${d.name}`}>
                                      <MoreHorizontal className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {items.map((item) => (
                                      <DropdownMenuItem key={item.label} onSelect={item.onSelect}>
                                        {item.label}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow className="bg-muted/20">
                            <TableCell colSpan={COLUMN_COUNT} className="pl-10">
                              <DossierLinesPanel lines={lines} onLineCost={onLineCost} onLinePaid={onLinePaid} />
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </section>
        ))
      )}

      <LinkPaidDossierDialog
        open={pending?.kind === "paid"}
        onOpenChange={(open) => !open && setPending(null)}
        onLinked={onChanged}
        preset={paidPreset}
      />
      {pending?.kind === "lost" && <LostDossierDialog dossier={pending.dossier} onClose={() => setPending(null)} onDone={onChanged} />}
    </div>
  );
};

export default ItinerariesView;
