import { forwardRef, useState, type ReactNode } from "react";
import { TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { SelectOption } from "./columnTypes";
import type { NavDirection } from "./GridCell";

const NAV_KEYS: Record<string, NavDirection> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };

interface GridSelectCellProps {
  value: string | null;
  options: SelectOption[];
  onCommit: (rawValue: string) => Promise<boolean>;
  className?: string;
  // Affichage de la valeur choisie à la place du libellé (ex. une pastille de couleur).
  renderValue?: ReactNode;
  triggerClassName?: string;
  // Navigation au clavier dans une grille : les flèches passent à la cellule voisine (la liste
  // s'ouvre avec Entrée ou Espace, une lettre tapée choisit directement).
  onNavigate?: (direction: NavDirection) => void;
}

/**
 * Cellule "select" (statut, paiement) : la sauvegarde se fait dès qu'une
 * option est choisie, pas besoin d'un mode édition séparé.
 */
const GridSelectCell = forwardRef<HTMLTableCellElement, GridSelectCellProps>(function GridSelectCell(
  { value, options, onCommit, className, renderValue, triggerClassName, onNavigate },
  ref,
) {
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [open, setOpen] = useState(false);

  // Capturé avant la liste, qui ouvrirait sinon sur les flèches haut et bas.
  const handleKeyDownCapture = (e: React.KeyboardEvent<HTMLTableCellElement>) => {
    if (!onNavigate || open || !NAV_KEYS[e.key]) return;
    e.preventDefault();
    e.stopPropagation();
    onNavigate(NAV_KEYS[e.key]);
  };

  const handleChange = async (next: string) => {
    if (next === value) return;
    setSaveState("saving");
    const ok = await onCommit(next);
    setSaveState(ok ? "saved" : "error");
    setTimeout(() => setSaveState((s) => (s === "idle" ? s : "idle")), ok ? 1000 : 2000);
  };

  return (
    <TableCell ref={ref} className={cn("relative p-1", className)} onKeyDownCapture={handleKeyDownCapture}>
      <Select value={value ?? undefined} onValueChange={handleChange} open={open} onOpenChange={setOpen}>
        <SelectTrigger className={cn("h-8 border-transparent hover:border-input focus:border-input text-sm", triggerClassName)}>
          {renderValue ?? <SelectValue placeholder="-" />}
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
        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-foreground" />
      )}
      {saveState === "error" && (
        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-destructive" />
      )}
    </TableCell>
  );
});

export default GridSelectCell;
