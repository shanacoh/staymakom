/**
 * Affichage « Vue » de la page Réservations : voir d'un coup d'œil ce qui demande une action ou
 * de l'attention. Les lignes sont rangées par urgence (À faire maintenant, À surveiller, À venir,
 * Soldées repliées), puis par mois avec un sous-total. Chaque ligne est teintée selon son état
 * (pastille « État » pleine), porte ses icônes d'alerte et le bouton de sa prochaine action.
 */

import { Fragment, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  AlertTriangle,
  ArrowDownLeft,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  MapPin,
  Ticket,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/components/admin/BookingsGrid/columnTypes";
import { cancellationMargin, isCancellation, keptByStaymakom } from "@/lib/reservations/cancellation";
import { dateHint, formatMoneyByCurrency, isRequest, isTailorMadeRequest, nextAction } from "@/lib/reservations/rules";
import { URGENCY_GROUPS, SIGNAL_LABELS, attentionSignals, type AttentionSignal, type UrgencyGroup } from "@/lib/reservations/attention";
import { ROW_STATE_LABELS, STATE_TONES, groupByMonth, rowState, rowTone } from "@/lib/reservations/entryLook";
import { computeTotals } from "@/lib/reservations/entryGrid";
import type { DossierLine, NextAction, ReservationRow } from "@/lib/reservations/types";
import { LineCostInput, NatureTag } from "./DossierLineCells";
import { FilledPill, SupplierPaymentPill, TypeTag } from "./ReservationPills";
import ReservationRowMenu from "./ReservationRowMenu";
import { ROW_TINT } from "./rowTint";

export interface DossierLinesProps {
  linesByDossier: Map<string, DossierLine[]>;
  expandedDossiers: Set<string>;
  onToggleDossier: (dossierId: string) => void;
  onLineCost: (line: DossierLine, cost: number | null) => void;
  onLinePaid: (line: DossierLine, paid: boolean) => void;
}

interface Props extends DossierLinesProps {
  groups: Record<UrgencyGroup, ReservationRow[]>;
  onAction: (row: ReservationRow, action: NextAction) => void;
  onOpen: (row: ReservationRow) => void;
  /** Réservations des 7 prochains jours dont la fiche n'a pas de point de rendez-vous. */
  incompletePracticalInfo?: Set<string>;
}

const COLUMN_COUNT = 10;

// Repère de couleur de chaque groupe, à gauche de son titre.
const GROUP_ACCENT: Record<UrgencyGroup, string> = {
  now: "bg-destructive",
  watch: "bg-amber-400",
  upcoming: "bg-sky-400",
  settled: "bg-muted-foreground/40",
};

const SIGNAL_ICONS: Record<AttentionSignal, { icon: LucideIcon; className: string }> = {
  refund_todo: { icon: Undo2, className: "text-violet-600" },
  to_recover: { icon: ArrowDownLeft, className: "text-violet-600" },
  credit_open: { icon: Ticket, className: "text-yellow-600" },
  missing_cost: { icon: CircleHelp, className: "text-amber-600" },
  practical_info: { icon: MapPin, className: "text-destructive" },
  to_check: { icon: AlertTriangle, className: "text-destructive" },
};

function collectedLabel(row: ReservationRow): string {
  if (isRequest(row)) return "estimé";
  if (row.refundStatus === "todo") return `${formatCurrency(row.refundAmount, row.currency)} à rembourser`;
  if (isCancellation(row)) {
    const kept = keptByStaymakom(row);
    return kept > 0 ? `${formatCurrency(kept, row.currency)} gardé` : "remboursé";
  }
  if (row.amount !== null && row.collected >= row.amount) return "payé";
  if (row.collected > 0) return `${formatCurrency(row.collected, row.currency)} encaissé`;
  return "non encaissé";
}

function MarginCell({ row }: { row: ReservationRow }) {
  if (isRequest(row)) return <span className="text-muted-foreground">estimée</span>;
  if (isCancellation(row)) {
    const margin = cancellationMargin(row);
    if (margin === null) return <span className="text-amber-800">coût ?</span>;
    return (
      <>
        <div className={cn(margin < 0 && "text-destructive")}>{formatCurrency(margin, row.currency)}</div>
        <div className="text-xs text-muted-foreground">annulation</div>
      </>
    );
  }
  if (row.amount === null || row.supplierCost === null) return <span className="text-amber-800">coût ?</span>;
  const margin = row.amount - row.supplierCost;
  return <span className={cn(margin < 0 && "text-destructive")}>{formatCurrency(margin, row.currency)}</span>;
}

function Signals({ signals, checkNote }: { signals: AttentionSignal[]; checkNote: string | null }) {
  if (signals.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5">
      {signals.map((signal) => {
        const { icon: Icon, className } = SIGNAL_ICONS[signal];
        const label = signal === "to_check" && checkNote ? `${SIGNAL_LABELS[signal]} : ${checkNote}` : SIGNAL_LABELS[signal];
        return (
          <Tooltip key={signal}>
            <TooltipTrigger asChild>
              <Icon className={cn("h-4 w-4 shrink-0", className)} aria-label={label} />
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

// Une ligne de réservation d'un dossier, sous sa ligne dossier. Son prix est inclus dans le dossier.
function DossierLineRow({ line, onLineCost, onLinePaid }: { line: DossierLine } & Pick<DossierLinesProps, "onLineCost" | "onLinePaid">) {
  return (
    <TableRow className="bg-muted/20 text-sm">
      <TableCell />
      <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
        {line.date ? format(parseISO(line.date), "dd/MM") : ""}
      </TableCell>
      <TableCell className="max-w-[320px]">
        <div className="flex items-center gap-2 pl-5">
          <NatureTag nature={line.nature} />
          <span className="truncate">{line.product}</span>
        </div>
      </TableCell>
      <TableCell className="tabular-nums text-muted-foreground">{line.pax || "—"}</TableCell>
      <TableCell className="text-right text-xs text-muted-foreground">inclus</TableCell>
      <TableCell>
        <SupplierPaymentPill payment={line.supplierPaid ? "paid" : "todo"} />
      </TableCell>
      <TableCell className="text-right">
        <LineCostInput line={line} onCommit={(cost) => onLineCost(line, cost)} />
      </TableCell>
      <TableCell />
      <TableCell colSpan={2} className="whitespace-nowrap">
        {line.supplierPaid ? (
          <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => onLinePaid(line, false)}>
            Annuler « payé »
          </Button>
        ) : line.cost !== null ? (
          <Button size="sm" variant="outline" onClick={() => onLinePaid(line, true)}>
            Fournisseur payé
          </Button>
        ) : (
          <span className="text-xs text-amber-800">coût à saisir</span>
        )}
      </TableCell>
    </TableRow>
  );
}

function SummaryRow({
  row,
  onAction,
  onOpen,
  linesByDossier,
  expandedDossiers,
  onToggleDossier,
  onLineCost,
  onLinePaid,
  incompletePracticalInfo,
}: { row: ReservationRow } & Omit<Props, "groups">) {
  const lines = row.source === "dossier" ? (linesByDossier.get(row.id) ?? []) : [];
  const expanded = expandedDossiers.has(row.id);
  const hint = dateHint(row);
  const action = nextAction(row);
  const state = rowState(row);
  const cancelled = isCancellation(row);
  const signals = attentionSignals(row, row.source === "booking" && !!incompletePracticalInfo?.has(row.id));
  return (
    <>
      <TableRow className={cn(ROW_TINT[rowTone(state)], row.flagged && "shadow-[inset_3px_0_0_hsl(var(--destructive))]")}>
        <TableCell className="whitespace-nowrap">
          <FilledPill tone={STATE_TONES[state]}>{ROW_STATE_LABELS[state]}</FilledPill>
        </TableCell>
        <TableCell className="whitespace-nowrap">
          <div className="font-medium tabular-nums">{row.date ? format(parseISO(row.date), "dd/MM") : "À préciser"}</div>
          {hint.text && (
            <div className={cn("text-xs", hint.soon ? "font-medium text-destructive" : "text-muted-foreground")}>{hint.text}</div>
          )}
        </TableCell>
        <TableCell className="max-w-[320px]">
          <div className="flex items-center gap-2">
            <TypeTag type={row.type} />
            {row.detailPath || row.source === "request" ? (
              <button
                type="button"
                onClick={() => onOpen(row)}
                className={cn("truncate text-left font-medium hover:underline", row.status === "annulee" && "line-through")}
              >
                {row.client}
              </button>
            ) : (
              <span className="truncate font-medium">{row.client}</span>
            )}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {row.product} · {row.channelLabel}
          </div>
          {row.source === "dossier" && !isTailorMadeRequest(row) && (
            <button
              type="button"
              onClick={() => onToggleDossier(row.id)}
              aria-expanded={expanded}
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-foreground hover:underline"
            >
              {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {lines.length} ligne{lines.length > 1 ? "s" : ""} de réservation
            </button>
          )}
        </TableCell>
        <TableCell className="tabular-nums">{row.pax || "—"}</TableCell>
        <TableCell className="whitespace-nowrap text-right">
          <div className={cn("font-medium tabular-nums", cancelled && keptByStaymakom(row) === 0 && "line-through")}>
            {formatCurrency(row.amount, row.currency)}
          </div>
          <div className="text-xs text-muted-foreground">{collectedLabel(row)}</div>
        </TableCell>
        <TableCell>{!cancelled && <SupplierPaymentPill payment={row.supplierPayment} />}</TableCell>
        <TableCell className="whitespace-nowrap text-right tabular-nums">
          <MarginCell row={row} />
        </TableCell>
        <TableCell>
          <Signals signals={signals} checkNote={row.checkNote} />
        </TableCell>
        <TableCell className="whitespace-nowrap" colSpan={2}>
          <div className="flex items-center gap-1">
            {action ? (
              <Button size="sm" variant={action.urgent ? "default" : "outline"} onClick={() => onAction(row, action)}>
                {action.label}
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">Rien à faire</span>
            )}
            <ReservationRowMenu row={row} onAction={onAction} />
          </div>
        </TableCell>
      </TableRow>
      {expanded && lines.map((line) => <DossierLineRow key={line.id} line={line} onLineCost={onLineCost} onLinePaid={onLinePaid} />)}
    </>
  );
}

const ReservationsSummaryTable = ({ groups, ...rowProps }: Props) => {
  // Les soldées sont repliées par défaut : elles ne demandent rien.
  const [settledOpen, setSettledOpen] = useState(false);

  return (
    <div className="space-y-6">
      {URGENCY_GROUPS.filter((group) => groups[group.key].length > 0).map((group) => {
        const rows = groups[group.key];
        const collapsible = group.key === "settled";
        const open = !collapsible || settledOpen;
        return (
          <section key={group.key} className="space-y-2">
            <h2 className="flex items-center gap-2 text-xs">
              <span className={cn("h-3.5 w-1 rounded-full", GROUP_ACCENT[group.key])} aria-hidden="true" />
              {collapsible ? (
                <button
                  type="button"
                  onClick={() => setSettledOpen(!settledOpen)}
                  aria-expanded={settledOpen}
                  className="inline-flex items-center gap-1 font-semibold uppercase tracking-wider text-foreground hover:underline"
                >
                  {settledOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  {group.label}
                </button>
              ) : (
                <span className="font-semibold uppercase tracking-wider text-foreground">{group.label}</span>
              )}
              <span className="tabular-nums text-muted-foreground">{rows.length}</span>
              <span className="text-muted-foreground">· {group.hint}</span>
            </h2>
            {open && (
              <div className="overflow-x-auto rounded-lg border bg-card">
                <Table className="min-w-[1120px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>État</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Client · produit</TableHead>
                      <TableHead>Pers.</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead className="text-right">Marge</TableHead>
                      <TableHead>Alertes</TableHead>
                      <TableHead colSpan={2}>Prochaine action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupByMonth(rows).map((month) => {
                      const totals = computeTotals(month.rows);
                      return (
                        <Fragment key={month.key}>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableCell colSpan={COLUMN_COUNT} className="py-1.5 text-xs">
                              <span className="font-semibold text-foreground">{month.label}</span>
                              <span className="text-muted-foreground">
                                {" "}
                                · {month.rows.length} résa{month.rows.length > 1 ? "s" : ""}
                                {Object.keys(totals.amount).length > 0 && ` · montant ${formatMoneyByCurrency(totals.amount)}`}
                                {Object.keys(totals.knownMargin).length > 0 && ` · marge ${formatMoneyByCurrency(totals.knownMargin)}`}
                              </span>
                            </TableCell>
                          </TableRow>
                          {month.rows.map((row) => (
                            <SummaryRow key={row.key} row={row} {...rowProps} />
                          ))}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default ReservationsSummaryTable;
