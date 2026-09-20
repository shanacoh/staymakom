import { useRef } from "react";
import { format, parseISO } from "date-fns";
import { Table, TableBody, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import GridCell, { type NavDirection } from "./GridCell";
import GridSelectCell from "./GridSelectCell";
import { formatCurrency, type ColumnDef, type ColumnKey } from "./columnTypes";

const HEAD_CLASS = "h-8 px-3 text-[10px] uppercase tracking-wider";
const CELL_CLASS = "py-2 px-3 text-sm";

interface Props<Row extends { id: string; currency?: string | null }> {
  columns: ColumnDef[];
  interactiveColumns: ColumnDef[];
  rows: Row[];
  newRowDraft: Record<string, unknown>;
  isCreatingRow: boolean;
  onCellCommit: (rowId: string, key: ColumnKey, rawValue: string) => Promise<boolean>;
  onNewRowCommit: (key: ColumnKey, rawValue: string) => Promise<boolean>;
  // Calcule si une ligne est verrouillée (réservation automatique) — les colonnes
  // marquées `locksWhenAutomatic` deviennent alors en lecture seule pour cette ligne.
  isRowLocked?: (row: Row) => boolean;
  renderReadonlyCell?: (row: Row, column: ColumnDef) => React.ReactNode;
  // Statut d'une ligne annulée -> affichage grisé, comme le comportement historique.
  isRowCancelled?: (row: Row) => boolean;
  minWidthClass?: string;
  // Valeur affichée pour une cellule verrouillée quand la valeur brute (ex: un
  // id) n'est pas lisible telle quelle (ex: nom de l'hôtel au lieu de son id).
  lockedDisplayValue?: (row: Row, column: ColumnDef) => string | undefined;
  // Rendu personnalisé pour certaines colonnes (ex: sélecteur d'hôtel avec
  // création rapide) au lieu du GridCell/GridSelectCell générique.
  customCellRenderers?: Record<
    string,
    (ctx: {
      value: string | number | null;
      onCommit: (rawValue: string) => Promise<boolean>;
      className?: string;
      refCallback: (el: HTMLTableCellElement | null) => void;
    }) => React.ReactNode
  >;
  // Colonne finale "Actions" (facultative), une par ligne existante — absente
  // sur la ligne "nouvelle réservation".
  renderRowActions?: (row: Row) => React.ReactNode;
}

function formatDateDisplay(value: string | null) {
  if (!value) return "—";
  try {
    return format(parseISO(value), "dd MMM yyyy");
  } catch {
    return value;
  }
}

function BookingsGridTable<Row extends { id: string; currency?: string | null }>({
  columns,
  interactiveColumns,
  rows,
  newRowDraft,
  isCreatingRow,
  onCellCommit,
  onNewRowCommit,
  isRowLocked,
  renderReadonlyCell,
  isRowCancelled,
  minWidthClass = "min-w-[1700px]",
  lockedDisplayValue,
  customCellRenderers,
  renderRowActions,
}: Props<Row>) {
  // Grille de refs [ligne][colonne interactive] pour la navigation au clavier (flèches).
  const cellRefs = useRef<(HTMLTableCellElement | null)[][]>([]);
  const totalRows = rows.length + 1; // + la ligne "nouvelle réservation"

  const registerRef = (rowIndex: number, colIndex: number) => (el: HTMLTableCellElement | null) => {
    if (!cellRefs.current[rowIndex]) cellRefs.current[rowIndex] = [];
    cellRefs.current[rowIndex][colIndex] = el;
  };

  const focusCell = (rowIndex: number, colIndex: number) => {
    cellRefs.current[rowIndex]?.[colIndex]?.focus();
  };

  const makeNavigate = (rowIndex: number, colIndex: number) => (direction: NavDirection) => {
    let targetRow = rowIndex;
    let targetCol = colIndex;
    if (direction === "up") targetRow -= 1;
    else if (direction === "down") targetRow += 1;
    else if (direction === "left") targetCol -= 1;
    else if (direction === "right") targetCol += 1;
    if (targetRow < 0 || targetRow >= totalRows) return;
    if (targetCol < 0 || targetCol >= interactiveColumns.length) return;
    focusCell(targetRow, targetCol);
  };

  const renderCell = (
    rowIndex: number,
    colIndex: number,
    row: Row | null,
    draft: Record<string, unknown> | null,
    locked: boolean,
  ) => {
    const column = interactiveColumns[colIndex];
    const isNewRow = row === null;
    const raw = (isNewRow ? draft?.[column.key] : (row as any)?.[column.key]) as string | number | null | undefined;
    const currency = (isNewRow ? (draft?.currency as string) : row?.currency) || "ILS";

    if (locked && column.locksWhenAutomatic) {
      const override = !isNewRow && row ? lockedDisplayValue?.(row, column) : undefined;
      const displayValue =
        override ??
        (column.key === "sell_price" || column.key === "supplier_cost"
          ? raw === null || raw === undefined || raw === "" ? "—" : formatCurrency(Number(raw), currency)
          : column.type === "date"
          ? formatDateDisplay((raw as string) || null)
          : raw === null || raw === undefined || raw === "" ? "—" : String(raw));
      return (
        <Tooltip key={column.key}>
          <TooltipTrigger asChild>
            <TableCell
              className={cn(
                CELL_CLASS,
                "bg-muted/40 text-muted-foreground cursor-not-allowed",
                column.align === "right" && "text-right",
                column.widthClass,
              )}
            >
              <span className="inline-flex items-center gap-1">
                {displayValue}
                <Lock className="h-3 w-3 opacity-60" />
              </span>
            </TableCell>
          </TooltipTrigger>
          <TooltipContent>Vient du paiement réel, non modifiable ici</TooltipContent>
        </Tooltip>
      );
    }

    const commit = async (rawValue: string) => {
      if (isNewRow) return onNewRowCommit(column.key, rawValue);
      return onCellCommit((row as any).id, column.key, rawValue);
    };

    const customRenderer = customCellRenderers?.[column.key];
    if (customRenderer) {
      return customRenderer({
        value: raw === undefined ? null : raw,
        onCommit: commit,
        className: column.widthClass,
        refCallback: registerRef(rowIndex, colIndex),
      });
    }

    if (column.type === "select") {
      return (
        <GridSelectCell
          key={column.key}
          ref={registerRef(rowIndex, colIndex)}
          value={(raw as string) ?? null}
          options={column.options || []}
          onCommit={commit}
          className={column.widthClass}
        />
      );
    }

    let displayValue: string | undefined;
    if (column.key === "sell_price" || column.key === "supplier_cost") {
      displayValue = raw === null || raw === undefined || raw === "" ? "—" : formatCurrency(Number(raw), currency);
    } else if (column.type === "date") {
      displayValue = formatDateDisplay((raw as string) || null);
    } else if (isNewRow && column.newRowPlaceholder && !raw) {
      displayValue = column.newRowPlaceholder;
    }

    return (
      <GridCell
        key={column.key}
        ref={registerRef(rowIndex, colIndex)}
        value={raw === undefined ? null : raw}
        type={column.type as "text" | "number" | "date"}
        align={column.align}
        displayValue={displayValue}
        onCommit={commit}
        onNavigate={makeNavigate(rowIndex, colIndex)}
        className={column.widthClass}
      />
    );
  };

  return (
    <div className="border rounded-lg bg-card overflow-x-auto">
      <Table className={minWidthClass}>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {columns.map((col) => (
              <TableHead key={col.key} className={cn(HEAD_CLASS, col.widthClass, col.align === "right" && "text-right")}>
                {col.label}
              </TableHead>
            ))}
            {renderRowActions && <TableHead className={cn(HEAD_CLASS, "text-right")}>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => {
            const locked = isRowLocked?.(row) ?? false;
            const cancelled = isRowCancelled?.(row) ?? false;
            return (
              <TableRow key={row.id} className={cancelled ? "opacity-60" : ""}>
                {columns.map((col) => {
                  if (col.type === "readonly") {
                    return (
                      <TableCell key={col.key} className={cn(CELL_CLASS, "text-right text-muted-foreground", col.widthClass)}>
                        {renderReadonlyCell?.(row, col) ?? "—"}
                      </TableCell>
                    );
                  }
                  const colIndex = interactiveColumns.findIndex((c) => c.key === col.key);
                  return renderCell(rowIndex, colIndex, row, null, locked);
                })}
                {renderRowActions?.(row)}
              </TableRow>
            );
          })}

          {/* Ligne vide toujours en bas : dès qu'on y tape quelque chose, la réservation est créée */}
          <TableRow className={isCreatingRow ? "opacity-50 pointer-events-none" : ""}>
            {columns.map((col) => {
              if (col.type === "readonly") {
                return (
                  <TableCell key={col.key} className={cn(CELL_CLASS, "text-right text-muted-foreground", col.widthClass)}>
                    —
                  </TableCell>
                );
              }
              const colIndex = interactiveColumns.findIndex((c) => c.key === col.key);
              return renderCell(rows.length, colIndex, null, newRowDraft, false);
            })}
            {renderRowActions && <TableCell className={CELL_CLASS} />}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

export default BookingsGridTable;
