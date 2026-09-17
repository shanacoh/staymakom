import { useRef } from "react";
import { format, parseISO } from "date-fns";
import { Table, TableBody, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import GridCell, { type NavDirection } from "./GridCell";
import GridSelectCell from "./GridSelectCell";
import {
  COLUMNS,
  INTERACTIVE_COLUMNS,
  formatCurrency,
  type BookingRow,
  type ColumnKey,
  type NewBookingDraft,
} from "./columns";

interface Props {
  rows: BookingRow[];
  newRowDraft: NewBookingDraft;
  isCreatingRow: boolean;
  onCellCommit: (rowId: string, key: ColumnKey, rawValue: string) => Promise<boolean>;
  onNewRowCommit: (key: ColumnKey, rawValue: string) => Promise<boolean>;
}

function formatDateDisplay(value: string | null) {
  if (!value) return "—";
  try {
    return format(parseISO(value), "dd MMM yyyy");
  } catch {
    return value;
  }
}

const BookingsGridTable = ({ rows, newRowDraft, isCreatingRow, onCellCommit, onNewRowCommit }: Props) => {
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
    if (targetCol < 0 || targetCol >= INTERACTIVE_COLUMNS.length) return;
    focusCell(targetRow, targetCol);
  };

  const renderCell = (
    rowIndex: number,
    colIndex: number,
    row: BookingRow | null,
    draft: NewBookingDraft | null,
  ) => {
    const column = INTERACTIVE_COLUMNS[colIndex];
    const isNewRow = row === null;
    const key = column.key as keyof BookingRow & keyof NewBookingDraft;
    const raw = isNewRow ? draft?.[key] : row?.[key];
    const currency = isNewRow ? draft?.currency || "ILS" : row?.currency || "ILS";

    const commit = async (rawValue: string) => {
      if (isNewRow) return onNewRowCommit(column.key, rawValue);
      return onCellCommit(row!.id, column.key, rawValue);
    };

    if (column.type === "select") {
      return (
        <GridSelectCell
          key={column.key}
          ref={registerRef(rowIndex, colIndex)}
          value={raw ?? null}
          options={column.options || []}
          onCommit={commit}
          className={column.widthClass}
        />
      );
    }

    let displayValue: string | undefined;
    if (column.key === "sell_price" || column.key === "supplier_cost") {
      displayValue = raw === null || raw === undefined || raw === "" ? "—" : formatCurrency(Number(raw), currency);
    } else if (column.key === "booking_date") {
      displayValue = formatDateDisplay(raw || null);
    } else if (isNewRow && column.key === "customer_name" && !raw) {
      displayValue = "+ Ajouter une réservation";
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
      <Table className="min-w-[1700px]">
        <TableHeader>
          <TableRow>
            {COLUMNS.map((col) => (
              <TableHead key={col.key} className={cn(col.widthClass, col.align === "right" && "text-right")}>
                {col.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={row.id} className={row.status === "cancelled" ? "opacity-60" : ""}>
              {COLUMNS.map((col) => {
                if (col.type === "readonly") {
                  const commission =
                    row.supplier_cost === null || row.supplier_cost === undefined
                      ? null
                      : row.sell_price - row.supplier_cost;
                  return (
                    <TableCell key={col.key} className={cn("text-sm text-right text-muted-foreground", col.widthClass)}>
                      {formatCurrency(commission, row.currency)}
                    </TableCell>
                  );
                }
                const colIndex = INTERACTIVE_COLUMNS.findIndex((c) => c.key === col.key);
                return renderCell(rowIndex, colIndex, row, null);
              })}
            </TableRow>
          ))}

          {/* Ligne vide toujours en bas : dès qu'on y tape quelque chose, la réservation est créée */}
          <TableRow className={isCreatingRow ? "opacity-50 pointer-events-none" : ""}>
            {COLUMNS.map((col) => {
              if (col.type === "readonly") {
                return (
                  <TableCell key={col.key} className={cn("text-sm text-right text-muted-foreground", col.widthClass)}>
                    —
                  </TableCell>
                );
              }
              const colIndex = INTERACTIVE_COLUMNS.findIndex((c) => c.key === col.key);
              return renderCell(rows.length, colIndex, null, newRowDraft);
            })}
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default BookingsGridTable;
