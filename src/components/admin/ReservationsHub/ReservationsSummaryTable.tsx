/**
 * Affichage « Vue » de la page Réservations : les lignes rangées en trois groupes
 * (Demandes, À traiter, Soldées), avec pour chacune le bouton de sa prochaine action.
 */

import { format, parseISO } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/components/admin/BookingsGrid/columnTypes";
import { dateHint, isRequest, isTailorMadeRequest, nextAction, type ReservationGroups } from "@/lib/reservations/rules";
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import type { DossierLine, NextAction, ReservationRow } from "@/lib/reservations/types";
import { LineCostInput, NatureTag } from "./DossierLineCells";
import { StatusPill, SupplierPaymentPill, TypeTag } from "./ReservationPills";

export interface DossierLinesProps {
  linesByDossier: Map<string, DossierLine[]>;
  expandedDossiers: Set<string>;
  onToggleDossier: (dossierId: string) => void;
  onLineCost: (line: DossierLine, cost: number | null) => void;
  onLinePaid: (line: DossierLine, paid: boolean) => void;
}

interface Props extends DossierLinesProps {
  groups: ReservationGroups;
  onAction: (row: ReservationRow, action: NextAction) => void;
  onOpen: (row: ReservationRow) => void;
  /** Réservations des 7 prochains jours dont la fiche n'a ni point de rendez-vous ni contact jour J. */
  incompletePracticalInfo?: Set<string>;
}

function collectedLabel(row: ReservationRow): string {
  if (isRequest(row)) return "estimé";
  if (row.clientPayment === "refunded") return "remboursé";
  if (row.amount !== null && row.collected >= row.amount) return "payé";
  if (row.collected > 0) return `${formatCurrency(row.collected, row.currency)} encaissé`;
  return "non encaissé";
}

function MarginCell({ row }: { row: ReservationRow }) {
  if (isRequest(row)) return <span className="text-muted-foreground">estimée</span>;
  if (row.amount === null || row.supplierCost === null) return <span className="text-amber-800">coût ?</span>;
  return <>{formatCurrency(row.amount - row.supplierCost, row.currency)}</>;
}

// Une ligne de réservation d'un dossier, sous sa ligne dossier. Son prix est inclus dans le dossier.
function DossierLineRow({ line, onLineCost, onLinePaid }: { line: DossierLine } & Pick<DossierLinesProps, "onLineCost" | "onLinePaid">) {
  return (
    <TableRow className="bg-muted/20 text-sm">
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
      <TableCell />
      <TableCell>
        <SupplierPaymentPill payment={line.supplierPaid ? "paid" : "todo"} />
      </TableCell>
      <TableCell className="text-right">
        <LineCostInput line={line} onCommit={(cost) => onLineCost(line, cost)} />
      </TableCell>
      <TableCell className="whitespace-nowrap">
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
  const cancelled = row.status === "annulee";
  return (
    <>
    <TableRow className={cn(isRequest(row) && "bg-muted/40", cancelled && "text-muted-foreground")}>
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
              className={cn("truncate text-left font-medium hover:underline", cancelled && "line-through")}
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
        {row.source === "booking" && incompletePracticalInfo?.has(row.id) && (
          <div
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-destructive"
            title="La fiche n'a ni point de rendez-vous ni contact jour J (section « Après la réservation »)"
          >
            <AlertTriangle className="h-3 w-3" />
            Infos pratiques incomplètes
          </div>
        )}
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
        <div className="font-medium tabular-nums">{formatCurrency(row.amount, row.currency)}</div>
        <div className="text-xs text-muted-foreground">{collectedLabel(row)}</div>
      </TableCell>
      <TableCell>
        <StatusPill status={row.status} />
      </TableCell>
      <TableCell>
        <SupplierPaymentPill payment={row.supplierPayment} />
      </TableCell>
      <TableCell className="whitespace-nowrap text-right tabular-nums">
        <MarginCell row={row} />
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {action ? (
          <Button size="sm" variant={action.urgent ? "default" : "outline"} onClick={() => onAction(row, action)}>
            {action.label}
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">Rien à faire</span>
        )}
      </TableCell>
    </TableRow>
    {expanded && lines.map((line) => <DossierLineRow key={line.id} line={line} onLineCost={onLineCost} onLinePaid={onLinePaid} />)}
    </>
  );
}

const GROUPS: { key: keyof ReservationGroups; label: string; hint?: string }[] = [
  { key: "requests", label: "Demandes", hint: "pas encore payées, passent en « Confirmée » à l'acompte" },
  { key: "todo", label: "À traiter" },
  { key: "settled", label: "Soldées" },
];

const ReservationsSummaryTable = ({ groups, ...rowProps }: Props) => (
  <div className="space-y-6">
    {GROUPS.filter((group) => groups[group.key].length > 0).map((group) => (
      <section key={group.key} className="space-y-2">
        <h2 className="flex items-baseline gap-2 text-xs">
          <span className="font-semibold uppercase tracking-wider text-foreground">{group.label}</span>
          <span className="tabular-nums text-muted-foreground">{groups[group.key].length}</span>
          {group.hint && <span className="text-muted-foreground">· {group.hint}</span>}
        </h2>
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client · produit</TableHead>
                <TableHead>Pers.</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead className="text-right">Marge</TableHead>
                <TableHead>Prochaine action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups[group.key].map((row) => (
                <SummaryRow key={row.key} row={row} {...rowProps} />
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    ))}
  </div>
);

export default ReservationsSummaryTable;
