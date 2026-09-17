import { forwardRef, useState } from "react";
import { TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { SelectOption } from "./columns";

interface GridSelectCellProps {
  value: string | null;
  options: SelectOption[];
  onCommit: (rawValue: string) => Promise<boolean>;
  className?: string;
}

/**
 * Cellule "select" (statut, paiement) : la sauvegarde se fait dès qu'une
 * option est choisie, pas besoin d'un mode édition séparé.
 */
const GridSelectCell = forwardRef<HTMLTableCellElement, GridSelectCellProps>(function GridSelectCell(
  { value, options, onCommit, className },
  ref,
) {
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const handleChange = async (next: string) => {
    if (next === value) return;
    setSaveState("saving");
    const ok = await onCommit(next);
    setSaveState(ok ? "saved" : "error");
    setTimeout(() => setSaveState((s) => (s === "idle" ? s : "idle")), ok ? 1000 : 2000);
  };

  return (
    <TableCell ref={ref} className={cn("relative p-1", className)}>
      <Select value={value ?? undefined} onValueChange={handleChange}>
        <SelectTrigger className="h-8 border-transparent hover:border-input focus:border-input text-sm">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {saveState === "saving" && (
        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse" />
      )}
      {saveState === "saved" && (
        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-green-500" />
      )}
      {saveState === "error" && (
        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-destructive" />
      )}
    </TableCell>
  );
});

export default GridSelectCell;
