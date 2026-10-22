/**
 * Affichage « Saisie » de la page Réservations : une grille façon Excel, commune à tous les
 * onglets. Mêmes lignes et mêmes filtres que l'affichage « Vue ». Chaque cellule s'enregistre
 * seule dès qu'elle est validée. Les cellules venant de Revolut sont verrouillées, la marge
 * et l'encaissé sont calculés.
 *
 * Faite pour saisir vite, donc sobre : colonne « État » en petite pastille, pastilles de
 * paiement, lignes regroupées par mois avec sous-totaux, en-tête et colonne Client figés, coût
 * manquant hachuré, marge en valeur et en %. Les couleurs de ligne sont dans l'affichage « Vue ».
 * Un clic droit marque une ligne « à vérifier » (bordure rouge), avec une note.
 */

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { AlertTriangle, Eye, Lock, Trash2 } from "lucide-react";
import { TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import GridCell, { type NavDirection } from "@/components/admin/BookingsGrid/GridCell";
import GridSelectCell from "@/components/admin/BookingsGrid/GridSelectCell";
import { formatCurrency } from "@/components/admin/BookingsGrid/columnTypes";
import {
  ENTRY_COLUMNS,
  cellMode,
  cellValue,
  computeTotals,
  selectOptions,
  type EntryColumn,
  type EntryColumnKey,
} from "@/lib/reservations/entryGrid";
import { formatMoneyByCurrency, isRequest } from "@/lib/reservations/rules";
import {
  ROW_STATE_LABELS,
  STATE_TONES,
  amountsStruck,
  clientPaymentLook,
  groupByMonth,
  marginWithPercent,
  rowState,
  supplierCostMissing,
  supplierPaymentLook,
} from "@/lib/reservations/entryLook";
import type { DossierLine, NextAction, ReservationRow } from "@/lib/reservations/types";
import { LineCostInput, NatureTag } from "./DossierLineCells";
import ReservationRowMenu from "./ReservationRowMenu";
import GridComboCell, { type ComboOption } from "./GridComboCell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { productChoicePatch, partnerChoicePatch, type CatalogueExperience, type CatalogueHotel, type ChoiceUpdate } from "@/lib/reservations/productChoice";
import type { NewRowType } from "@/lib/reservations/actions";
import { FilledPill } from "./ReservationPills";

const HEAD_CLASS = "sticky top-0 z-20 h-8 bg-muted px-3 text-[10px] uppercase tracking-wider";
// Lignes compactes (32 px), chiffres en police tabulaire.
const CELL_CLASS = "h-8 py-1 px-3 text-sm tabular-nums";
// La colonne Actions reste collée au bord droit : la grille est plus large que l'écran, et
// sans ça la corbeille n'apparaît qu'après avoir fait défiler toute la ligne.
const ACTIONS_CLASS = "sticky right-0 z-10 border-l bg-card";
// Même principe à gauche : case à cocher, État puis Client restent visibles.
const SELECT_CLASS = "sticky left-0 z-10 w-10 min-w-10 border-r bg-card px-3";
const STATE_CLASS = "sticky left-10 z-10 w-[120px] min-w-[120px] bg-card px-2";
const CLIENT_STICKY_CLASS = "sticky left-[160px] z-10 border-r";
// Coût fournisseur attendu mais pas saisi : hachures ambre.
const MISSING_COST_CLASS =
  "bg-[repeating-linear-gradient(135deg,theme(colors.amber.100),theme(colors.amber.100)_4px,theme(colors.amber.50)_4px,theme(colors.amber.50)_8px)] text-amber-900";

// Bordure rouge de 3 px à gauche d'une ligne « à vérifier ».
const FLAG_EDGE_CLASS = "shadow-[inset_3px_0_0_hsl(var(--destructive))]";

interface Props {
  rows: ReservationRow[];
  // Faux sur les onglets où une ligne ne se crée pas en tapant (hôtel, itinéraire).
  allowNewRow: boolean;
  isCreatingRow: boolean;
  onCellCommit: (row: ReservationRow, key: EntryColumnKey, rawValue: string) => Promise<boolean>;
  onNewRowCommit: (customerName: string, type: NewRowType) => Promise<boolean>;
  // Type proposé d'office pour la ligne vide du bas (hôtel sur l'onglet Hôtel).
  defaultNewRowType: NewRowType;
  // Catalogue (expériences, hôtels) et prestataires, pour les cellules Produit et Prestataire.
  experiences: CatalogueExperience[];
  hotels: CatalogueHotel[];
  providers: { id: string; name: string }[];
  // Écrit le choix fait dans une cellule Produit ou Prestataire.
  onChoiceCommit: (row: ReservationRow, update: ChoiceUpdate) => Promise<boolean>;
  // Clic droit « Dupliquer la ligne ».
  onDuplicate: (row: ReservationRow) => void;
  onOpen: (row: ReservationRow) => void;
  // Actions du menu « … » (convertir, archiver, annuler) : les fenêtres sont gérées par la page.
  onAction: (row: ReservationRow, action: NextAction) => void;
  // Demande de suppression d'une ligne : la confirmation est gérée par la page.
  onDelete: (row: ReservationRow) => void;
  // Lignes cochées (par leur clé), pour la suppression groupée. La sélection est tenue par la page.
  selectedKeys: Set<string>;
  onToggleRow: (row: ReservationRow, selected: boolean) => void;
  onToggleAll: (selected: boolean) => void;
  // Lignes de réservation des dossiers de voyage, affichées indentées sous leur dossier.
  linesByDossier: Map<string, DossierLine[]>;
  onLineCost: (line: DossierLine, cost: number | null) => void;
  onLinePaid: (line: DossierLine, paid: boolean) => void;
  // Clic droit : marquer « à vérifier » (ou changer la note), retirer la marque.
  onFlag: (row: ReservationRow) => void;
  onUnflag: (row: ReservationRow) => void;
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

function MarginText({ row }: { row: ReservationRow }) {
  if (isRequest(row)) return <span className="text-muted-foreground">estimée</span>;
  const margin = marginWithPercent(row);
  if (!margin) return <span className="text-muted-foreground">-</span>;
  return (
    <span className={cn(margin.value < 0 && "font-medium text-destructive")}>
      {formatCurrency(margin.value, row.currency)}
      {margin.percent !== null && <span className="ml-1 text-xs opacity-70">· {margin.percent} %</span>}
    </span>
  );
}

function PaymentPill({ row, column }: { row: ReservationRow; column: "clientPayment" | "supplierPayment" }) {
  const look = column === "clientPayment" ? clientPaymentLook(row) : supplierPaymentLook(row);
  return look ? <FilledPill tone={look.tone}>{look.label}</FilledPill> : <span className="text-muted-foreground">-</span>;
}

const NEW_ROW_TYPES: { value: NewRowType; label: string }[] = [
  { value: "experience", label: "Expérience" },
  { value: "boat", label: "Bateau" },
  { value: "hotel", label: "Hôtel" },
];

const ReservationsEntryGrid = ({
  rows,
  allowNewRow,
  isCreatingRow,
  onCellCommit,
  onNewRowCommit,
  defaultNewRowType,
  experiences,
  hotels,
  providers,
  onChoiceCommit,
  onDuplicate,
  onOpen,
  onAction,
  onDelete,
  selectedKeys,
  onToggleRow,
  onToggleAll,
  linesByDossier,
  onLineCost,
  onLinePaid,
  onFlag,
  onUnflag,
}: Props) => {
  const [newRowType, setNewRowType] = useState<NewRowType>(defaultNewRowType);
  useEffect(() => setNewRowType(defaultNewRowType), [defaultNewRowType]);
  const experienceOptions: ComboOption[] = useMemo(
    () => experiences.map((e) => ({ value: e.id, label: e.title, hint: e.isBoat ? "Bateau" : undefined })),
    [experiences],
  );
  const hotelOptions: ComboOption[] = useMemo(() => hotels.map((h) => ({ value: h.id, label: h.name })), [hotels]);
  const providerOptions: ComboOption[] = useMemo(() => providers.map((p) => ({ value: p.id, label: p.name })), [providers]);

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
        // Case de choix : le focus va sur son bouton, pour qu'Entrée ouvre la liste.
        (target.querySelector<HTMLElement>("button") ?? target).focus();
        return;
      }
      r += stepRow;
      c += stepCol;
    }
  };

  const renderCell = (row: ReservationRow, rowIndex: number, column: EntryColumn, colIndex: number, tint: string) => {
    const mode = cellMode(row, column.key);
    const alignClass = column.align === "right" && "text-right";
    const struck = (column.key === "amount" || column.key === "collected") && amountsStruck(row);
    const extraClass = cn(
      column.key === "client" && cn(CLIENT_STICKY_CLASS, tint),
      column.key === "supplierCost" && supplierCostMissing(row) && MISSING_COST_CLASS,
      struck && "line-through",
    );
    const isPayment = column.key === "clientPayment" || column.key === "supplierPayment";

    if (column.key === "margin") {
      return (
        <TableCell key={column.key} className={cn(CELL_CLASS, "text-right", column.widthClass)}>
          <MarginText row={row} />
        </TableCell>
      );
    }

    if (mode === "locked") {
      return (
        <Tooltip key={column.key}>
          <TooltipTrigger asChild>
            <TableCell className={cn(CELL_CLASS, "cursor-not-allowed text-muted-foreground", alignClass, column.widthClass, extraClass)}>
              <span className="inline-flex items-center gap-1">
                {isPayment ? <PaymentPill row={row} column={column.key as "clientPayment" | "supplierPayment"} /> : displayText(row, column)}
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
          className={cn(CELL_CLASS, "text-muted-foreground", column.key === "ref" && "font-mono text-xs", alignClass, column.widthClass, extraClass)}
        >
          {isPayment ? <PaymentPill row={row} column={column.key as "clientPayment" | "supplierPayment"} /> : displayText(row, column)}
        </TableCell>
      );
    }

    const commit = (rawValue: string) => onCellCommit(row, column.key, rawValue);
    const value = cellValue(row, column.key);

    if (column.kind === "combo") {
      const isProduct = column.key === "product";
      const isHotel = row.source === "hotel";
      const options = isProduct ? (isHotel ? hotelOptions : experienceOptions) : providerOptions;
      return (
        <GridComboCell
          key={column.key}
          ref={registerRef(rowIndex, colIndex)}
          display={displayText(row, column) === "-" ? "" : displayText(row, column)}
          options={options}
          placeholder={isProduct ? (isHotel ? "Choisir un hôtel" : "Choisir un produit") : "Choisir"}
          allowFreeText={isProduct}
          noneLabel={isProduct ? undefined : "Aucun (prestataire de la fiche)"}
          onPick={(choice) => {
            if (!isProduct) return onChoiceCommit(row, partnerChoicePatch(row, "value" in choice ? choice.value : null));
            if ("text" in choice) return onChoiceCommit(row, productChoicePatch(row, { kind: "free", text: choice.text }));
            const experience = experiences.find((e) => e.id === choice.value);
            const hotel = hotels.find((h) => h.id === choice.value);
            if (experience) return onChoiceCommit(row, productChoicePatch(row, { kind: "experience", experience }));
            if (hotel) return onChoiceCommit(row, productChoicePatch(row, { kind: "hotel", hotel }));
            return Promise.resolve(false);
          }}
          onNavigate={makeNavigate(rowIndex, colIndex)}
          className={cn(column.widthClass, extraClass)}
        />
      );
    }

    if (column.kind === "select") {
      return (
        <GridSelectCell
          key={column.key}
          ref={registerRef(rowIndex, colIndex)}
          onNavigate={makeNavigate(rowIndex, colIndex)}
          value={value === null ? null : String(value)}
          options={selectOptions(row, column.key)}
          onCommit={commit}
          className={cn("py-0", column.widthClass, extraClass)}
          triggerClassName="h-7"
          renderValue={isPayment ? <PaymentPill row={row} column={column.key as "clientPayment" | "supplierPayment"} /> : undefined}
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
        displayValue={
          column.key === "supplierCost" && supplierCostMissing(row)
            ? "?"
            : column.kind === "money" || column.kind === "date"
              ? displayText(row, column)
              : undefined
        }
        onCommit={commit}
        onNavigate={makeNavigate(rowIndex, colIndex)}
        className={cn("py-1", column.align === "right" && "tabular-nums", column.widthClass, extraClass)}
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
  const totalFor = (t: typeof totals): Partial<Record<EntryColumnKey, string>> => ({
    amount: formatMoneyByCurrency(t.amount),
    collected: formatMoneyByCurrency(t.collected),
    supplierCost: formatMoneyByCurrency(t.costs),
    margin: formatMoneyByCurrency(t.knownMargin),
  });
  const grandTotals = totalFor(totals);
  const clientColIndex = ENTRY_COLUMNS.findIndex((c) => c.key === "client");
  const selectedCount = rows.filter((row) => selectedKeys.has(row.key)).length;
  const allSelected = rows.length > 0 && selectedCount === rows.length;
  // Position de chaque ligne dans la grille entière, pour la navigation au clavier d'un mois à l'autre.
  const indexOf = new Map(rows.map((row, index) => [row.key, index]));
  const months = groupByMonth(rows);
  const columnCount = ENTRY_COLUMNS.length + 3;

  const renderRow = (row: ReservationRow, zebra: boolean) => {
    const rowIndex = indexOf.get(row.key) ?? 0;
    const state = rowState(row);
    // Saisie sobre : pas de teinte de ligne (elle est dans la Vue), seulement un zébrage léger.
    // Fond opaque : les cellules figées le reprennent, et rien ne transparaît dessous au défilement.
    const tint = zebra ? "bg-neutral-50" : "bg-card";
    return (
      <Fragment key={row.key}>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <TableRow className={cn("h-8", tint)}>
              <TableCell className={cn(SELECT_CLASS, "py-1", tint, row.flagged && FLAG_EDGE_CLASS)}>
                <Checkbox
                  checked={selectedKeys.has(row.key)}
                  onCheckedChange={(checked) => onToggleRow(row, checked === true)}
                  aria-label={`Cocher la ligne ${row.client}`}
                />
              </TableCell>
              <TableCell className={cn(STATE_CLASS, "py-1", tint)}>
                <span className="inline-flex items-center gap-1">
                  <FilledPill tone={STATE_TONES[state]}>{ROW_STATE_LABELS[state]}</FilledPill>
                  {row.flagged && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" aria-label="À vérifier" />
                      </TooltipTrigger>
                      <TooltipContent>À vérifier{row.checkNote ? ` : ${row.checkNote}` : ""}</TooltipContent>
                    </Tooltip>
                  )}
                </span>
              </TableCell>
              {ENTRY_COLUMNS.map((column, colIndex) =>
                renderCell(row, rowIndex, column, colIndex, tint),
              )}
              <TableCell className={cn(ACTIONS_CLASS, "whitespace-nowrap px-3 py-1 text-right", tint)}>
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
                <ReservationRowMenu row={row} onAction={onAction} />
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
              </TableCell>
            </TableRow>
          </ContextMenuTrigger>
          <ContextMenuContent>
            {(row.source === "booking" || row.source === "hotel") && (
              <ContextMenuItem onSelect={() => onDuplicate(row)}>Dupliquer la ligne</ContextMenuItem>
            )}
            <ContextMenuItem onSelect={() => onFlag(row)}>
              {row.flagged ? "Modifier la note « à vérifier »" : "Marquer à vérifier"}
            </ContextMenuItem>
            {row.flagged && <ContextMenuItem onSelect={() => onUnflag(row)}>Retirer « à vérifier »</ContextMenuItem>}
          </ContextMenuContent>
        </ContextMenu>
        {row.source === "dossier" &&
          (linesByDossier.get(row.id) ?? []).map((line) => (
            <TableRow key={line.id} className="h-8 bg-muted/20">
              <TableCell className={SELECT_CLASS} />
              <TableCell className={STATE_CLASS} />
              {ENTRY_COLUMNS.map((column) => renderLineCell(line, column))}
              <TableCell className={ACTIONS_CLASS} />
            </TableRow>
          ))}
      </Fragment>
    );
  };

  return (
    // Un seul cadre de défilement, dans les deux sens : l'en-tête reste en haut, les colonnes
    // case à cocher, État et Client restent à gauche.
    <div className="max-h-[calc(100vh-260px)] overflow-auto rounded-lg border bg-card">
      <table className="w-full min-w-[2150px] caption-bottom text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className={cn(HEAD_CLASS, SELECT_CLASS, "z-30 bg-muted")}>
              <Checkbox
                checked={allSelected ? true : selectedCount > 0 ? "indeterminate" : false}
                onCheckedChange={(checked) => onToggleAll(checked === true)}
                disabled={rows.length === 0}
                aria-label="Cocher toutes les lignes affichées"
              />
            </TableHead>
            <TableHead className={cn(HEAD_CLASS, STATE_CLASS, "z-30 bg-muted")}>État</TableHead>
            {ENTRY_COLUMNS.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  HEAD_CLASS,
                  column.widthClass,
                  column.align === "right" && "text-right",
                  column.key === "client" && cn(CLIENT_STICKY_CLASS, "z-30 bg-muted"),
                )}
              >
                {column.label}
              </TableHead>
            ))}
            <TableHead className={cn(HEAD_CLASS, ACTIONS_CLASS, "z-30 bg-muted text-right")}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {months.map((month) => {
            const monthTotals = totalFor(computeTotals(month.rows));
            return (
              <Fragment key={month.key}>
                <TableRow className="h-8 border-t-2 bg-muted/60 hover:bg-muted/60">
                  <TableCell colSpan={columnCount} className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-foreground">
                    <span className="sticky left-3">
                      {month.label} · {month.rows.length} résa{month.rows.length > 1 ? "s" : ""}
                    </span>
                  </TableCell>
                </TableRow>
                {month.rows.map((row, index) => renderRow(row, index % 2 === 1))}
                <TableRow className="h-8 border-b-2 bg-muted/30 hover:bg-muted/30">
                  <TableCell className={cn(SELECT_CLASS, "bg-muted")} />
                  <TableCell className={cn(STATE_CLASS, "bg-muted")} />
                  {ENTRY_COLUMNS.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        CELL_CLASS,
                        "text-xs font-semibold",
                        column.align === "right" && "text-right",
                        column.key === "client" && cn(CLIENT_STICKY_CLASS, "bg-muted"),
                      )}
                    >
                      {column.key === "client" ? `Sous-total ${month.label.toLowerCase()}` : (monthTotals[column.key] ?? "")}
                    </TableCell>
                  ))}
                  <TableCell className={cn(ACTIONS_CLASS, "bg-muted")} />
                </TableRow>
              </Fragment>
            );
          })}

          {/* Ligne vide toujours en bas : dès qu'on tape un nom, la réservation est créée. */}
          {allowNewRow && (
            <TableRow className={cn("h-8", isCreatingRow && "pointer-events-none opacity-50")}>
              <TableCell className={SELECT_CLASS} />
              <TableCell className={STATE_CLASS} />
              {ENTRY_COLUMNS.map((column, colIndex) =>
                column.key === "client" ? (
                  <GridCell
                    key={column.key}
                    ref={registerRef(rows.length, colIndex)}
                    value={null}
                    type="text"
                    displayValue="Nouvelle ligne : tape un nom…"
                    onCommit={(rawValue) => (rawValue.trim() ? onNewRowCommit(rawValue.trim(), newRowType) : Promise.resolve(true))}
                    onNavigate={makeNavigate(rows.length, clientColIndex)}
                    className={cn("py-1", column.widthClass, CLIENT_STICKY_CLASS, "bg-card text-muted-foreground")}
                  />
                ) : column.key === "type" ? (
                  <TableCell key={column.key} className={cn("p-1", column.widthClass)}>
                    <Select value={newRowType} onValueChange={(v) => setNewRowType(v as NewRowType)}>
                      <SelectTrigger className="h-7 text-sm" aria-label="Type de la nouvelle ligne">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NEW_ROW_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                ) : (
                  <TableCell key={column.key} className={cn(CELL_CLASS, "text-muted-foreground", column.widthClass)}>
                    {column.key === "ref" ? "+" : ""}
                  </TableCell>
                ),
              )}
              <TableCell className={ACTIONS_CLASS} />
            </TableRow>
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className={cn(SELECT_CLASS, "bg-muted")} />
            <TableCell className={cn(STATE_CLASS, "bg-muted")} />
            {ENTRY_COLUMNS.map((column) => (
              <TableCell
                key={column.key}
                className={cn(
                  CELL_CLASS,
                  "font-semibold",
                  column.align === "right" && "text-right",
                  column.key === "client" && cn(CLIENT_STICKY_CLASS, "bg-muted"),
                )}
              >
                {column.key === "client" ? "Totaux (hors demandes)" : (grandTotals[column.key] ?? "")}
              </TableCell>
            ))}
            <TableCell className={cn(ACTIONS_CLASS, "bg-muted")} />
          </TableRow>
        </TableFooter>
      </table>
    </div>
  );
};

export default ReservationsEntryGrid;
