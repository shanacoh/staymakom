/**
 * Affichage « Saisie » de la page Réservations : une grille façon Excel, commune à tous les
 * onglets. Mêmes lignes et mêmes filtres que l'affichage « Vue ». Chaque cellule s'enregistre
 * seule dès qu'elle est validée. Les cellules venant de Revolut sont verrouillées, la marge
 * et l'encaissé sont calculés.
 */

import { Fragment, useRef } from "react";
import { format, parseISO } from "date-fns";
import { Eye, Lock, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import GridCell, { type NavDirection } from "@/components/admin/BookingsGrid/GridCell";
import GridSelectCell from "@/components/admin/BookingsGrid/GridSelectCell";
import { formatCurrency } from "@/components/admin/BookingsGrid/columnTypes";
import {
  ENTRY_COLUMNS,
  canDeleteRow,
  cellMode,
  cellValue,
  computeTotals,
  selectOptions,
  type EntryColumn,
  type EntryColumnKey,
} from "@/lib/reservations/entryGrid";
import { formatMoneyByCurrency, isRequest } from "@/lib/reservations/rules";
import type { DossierLine, ReservationRow } from "@/lib/reservations/types";
import { LineCostInput, NatureTag } from "./DossierLineCells";

const HEAD_CLASS = "h-8 px-3 text-[10px] uppercase tracking-wider";
const CELL_CLASS = "py-2 px-3 text-sm";

interface Props {
  rows: ReservationRow[];
  // Faux sur les onglets où une ligne ne se crée pas en tapant (hôtel, itinéraire).
  allowNewRow: boolean;
  isCreatingRow: boolean;
  onCellCommit: (row: ReservationRow, key: EntryColumnKey, rawValue: string) => Promise<boolean>;
  onNewRowCommit: (customerName: string) => Promise<boolean>;
  onOpen: (row: ReservationRow) => void;
  // Demande de suppression d'une ligne : la confirmation est gérée par la page.
  onDelete: (row: ReservationRow) => void;
  // Lignes de réservation des dossiers de voyage, affichées indentées sous leur dossier.
  linesByDossier: Map<string, DossierLine[]>;
  onLineCost: (line: DossierLine, cost: number | null) => void;
  onLinePaid: (line: DossierLine, paid: boolean) => void;
}

const LINE_PAYMENT_OPTIONS = [
  { value: "todo", label: "À payer" },
  { value: "paid", label: "Payé" },
];

function displayText(row: ReservationRow, column: EntryColumn): string {
  const value = cellValue(row, column.key);
  if (value === null || value === "") {
    if (isRequest(row) && column.key === "margin") return "estimée";
    return "-";
  }
  if (column.kind === "money") return formatCurrency(Number(value), row.currency);
  if (column.kind === "date") return format(parseISO(String(value)), "dd/MM/yyyy");
  if (column.kind === "select") {
    if (column.key === "channel") return row.channelLabel;
    return selectOptions(row, column.key).find((o) => o.value === value)?.label ?? String(value);
  }
  return String(value);
}

const ReservationsEntryGrid = ({ rows, allowNewRow, isCreatingRow, onCellCommit, onNewRowCommit, onOpen, onDelete, linesByDossier, onLineCost, onLinePaid }: Props) => {
  // Cellules de texte modifiables, repérées par « ligne:colonne », pour les flèches du clavier.
  const cellRefs = useRef(new Map<string, HTMLTableCellElement>());
  const lastRowIndex = allowNewRow ? rows.length : rows.length - 1;

  const registerRef = (rowIndex: number, colIndex: number) => (el: HTMLTableCellElement | null) => {
    const key = `${rowIndex}:${colIndex}`;
    if (el) cellRefs.current.set(key, el);
    else cellRefs.current.delete(key);
  };

  // Avance dans la direction demandée jusqu'à la prochaine cellule modifiable.
  const makeNavigate = (rowIndex: number, colIndex: number) => (direction: NavDirection) => {
    const stepRow = direction === "up" ? -1 : direction === "down" ? 1 : 0;
    const stepCol = direction === "left" ? -1 : direction === "right" ? 1 : 0;
    let r = rowIndex + stepRow;
    let c = colIndex + stepCol;
    while (r >= 0 && r <= lastRowIndex && c >= 0 && c < ENTRY_COLUMNS.length) {
      const target = cellRefs.current.get(`${r}:${c}`);
      if (target) {
        target.focus();
        return;
      }
      r += stepRow;
      c += stepCol;
    }
  };

  const renderCell = (row: ReservationRow, rowIndex: number, column: EntryColumn, colIndex: number) => {
    const mode = cellMode(row, column.key);
    const alignClass = column.align === "right" && "text-right";

    if (mode === "locked") {
      return (
        <Tooltip key={column.key}>
          <TooltipTrigger asChild>
            <TableCell className={cn(CELL_CLASS, "cursor-not-allowed bg-muted/40 text-muted-foreground", alignClass, column.widthClass)}>
              <span className="inline-flex items-center gap-1">
                {displayText(row, column)}
                <Lock className="h-3 w-3 opacity-60" />
              </span>
            </TableCell>
          </TooltipTrigger>
          <TooltipContent>Vient de Revolut, non modifiable ici</TooltipContent>
        </Tooltip>
      );
    }

    if (mode === "readonly") {
      return (
        <TableCell
          key={column.key}
          className={cn(CELL_CLASS, "text-muted-foreground", column.key === "ref" && "font-mono text-xs", alignClass, column.widthClass)}
        >
          {displayText(row, column)}
        </TableCell>
      );
    }

    const commit = (rawValue: string) => onCellCommit(row, column.key, rawValue);
    const value = cellValue(row, column.key);

    if (column.kind === "select") {
      return (
        <GridSelectCell
          key={column.key}
          value={value === null ? null : String(value)}
          options={selectOptions(row, column.key)}
          onCommit={commit}
          className={column.widthClass}
        />
      );
    }

    return (
      <GridCell
        key={column.key}
        ref={registerRef(rowIndex, colIndex)}
        value={value}
        type={column.kind === "money" ? "number" : column.kind}
        align={column.align}
        displayValue={column.kind === "money" || column.kind === "date" ? displayText(row, column) : undefined}
        onCommit={commit}
        onNavigate={makeNavigate(rowIndex, colIndex)}
        className={column.widthClass}
      />
    );
  };

  // Ligne enfant d'un dossier : seuls son coût réel et le paiement du fournisseur se saisissent.
  const renderLineCell = (line: DossierLine, column: EntryColumn) => {
    const base = cn(CELL_CLASS, "text-muted-foreground", column.align === "right" && "text-right", column.widthClass);
    switch (column.key) {
      case "type":
        return (
          <TableCell key={column.key} className={base}>
            <NatureTag nature={line.nature} />
          </TableCell>
        );
      case "product":
        return (
          <TableCell key={column.key} className={cn(base, "text-foreground")}>
            ↳ {line.product}
          </TableCell>
        );
      case "date":
        return (
          <TableCell key={column.key} className={base}>
            {line.date ? format(parseISO(line.date), "dd/MM/yyyy") : "-"}
          </TableCell>
        );
      case "pax":
        return (
          <TableCell key={column.key} className={base}>
            {line.pax || "-"}
          </TableCell>
        );
      case "amount":
        return (
          <TableCell key={column.key} className={cn(base, "text-xs")}>
            inclus
          </TableCell>
        );
      case "supplierCost":
        return (
          <TableCell key={column.key} className={cn("px-1 py-1", column.widthClass)}>
            <LineCostInput line={line} onCommit={(cost) => onLineCost(line, cost)} className="w-full" />
          </TableCell>
        );
      case "supplierPayment":
        return (
          <GridSelectCell
            key={column.key}
            value={line.supplierPaid ? "paid" : "todo"}
            options={LINE_PAYMENT_OPTIONS}
            onCommit={async (value) => {
              onLinePaid(line, value === "paid");
              return true;
            }}
            className={column.widthClass}
          />
        );
      case "notes":
        return (
          <TableCell key={column.key} className={base}>
            {line.cost === null ? "coût à saisir" : ""}
          </TableCell>
        );
      default:
        return <TableCell key={column.key} className={base} />;
    }
  };

  const totals = computeTotals(rows);
  const totalFor: Partial<Record<EntryColumnKey, string>> = {
    amount: formatMoneyByCurrency(totals.amount),
    collected: formatMoneyByCurrency(totals.collected),
    supplierCost: formatMoneyByCurrency(totals.costs),
    margin: formatMoneyByCurrency(totals.knownMargin),
  };
  const clientColIndex = ENTRY_COLUMNS.findIndex((c) => c.key === "client");

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table className="min-w-[2000px]">
        <TableHeader>
          <TableRow className="bg-muted/50">
            {ENTRY_COLUMNS.map((column) => (
              <TableHead key={column.key} className={cn(HEAD_CLASS, column.widthClass, column.align === "right" && "text-right")}>
                {column.label}
              </TableHead>
            ))}
            <TableHead className={cn(HEAD_CLASS, "text-right")}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <Fragment key={row.key}>
            <TableRow className={cn(isRequest(row) && "bg-muted/40", row.status === "annulee" && "opacity-60")}>
              {ENTRY_COLUMNS.map((column, colIndex) => renderCell(row, rowIndex, column, colIndex))}
              <TableCell className="whitespace-nowrap px-3 py-1 text-right">
                {(row.detailPath || row.source === "request") && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Ouvrir la fiche" onClick={() => onOpen(row)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{row.source === "request" ? "Modifier la demande" : "Ouvrir la fiche (lien de paiement, email de confirmation)"}</TooltipContent>
                  </Tooltip>
                )}
                {canDeleteRow(row) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        aria-label="Supprimer la ligne"
                        onClick={() => onDelete(row)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Supprimer la ligne</TooltipContent>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
            {row.source === "dossier" &&
              (linesByDossier.get(row.id) ?? []).map((line) => (
                <TableRow key={line.id} className="bg-muted/20">
                  {ENTRY_COLUMNS.map((column) => renderLineCell(line, column))}
                  <TableCell />
                </TableRow>
              ))}
            </Fragment>
          ))}

          {/* Ligne vide toujours en bas : dès qu'on tape un nom, la réservation est créée. */}
          {allowNewRow && (
            <TableRow className={cn(isCreatingRow && "pointer-events-none opacity-50")}>
              {ENTRY_COLUMNS.map((column, colIndex) =>
                column.key === "client" ? (
                  <GridCell
                    key={column.key}
                    ref={registerRef(rows.length, colIndex)}
                    value={null}
                    type="text"
                    displayValue="Nouvelle ligne : tape un nom…"
                    onCommit={(rawValue) => (rawValue.trim() ? onNewRowCommit(rawValue.trim()) : Promise.resolve(true))}
                    onNavigate={makeNavigate(rows.length, clientColIndex)}
                    className={cn(column.widthClass, "text-muted-foreground")}
                  />
                ) : (
                  <TableCell key={column.key} className={cn(CELL_CLASS, "text-muted-foreground", column.widthClass)}>
                    {column.key === "ref" ? "+" : ""}
                  </TableCell>
                ),
              )}
              <TableCell />
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            {ENTRY_COLUMNS.map((column) => (
              <TableCell key={column.key} className={cn(CELL_CLASS, "font-semibold tabular-nums", column.align === "right" && "text-right")}>
                {column.key === "client" ? "Totaux (hors demandes)" : (totalFor[column.key] ?? "")}
              </TableCell>
            ))}
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};

export default ReservationsEntryGrid;
