import { forwardRef, useEffect, useRef, useState } from "react";
import { TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type NavDirection = "up" | "down" | "left" | "right";

interface GridCellProps {
  value: string | number | null;
  type: "text" | "number" | "date";
  align?: "left" | "right";
  placeholder?: string;
  displayValue?: string;
  onCommit: (rawValue: string) => Promise<boolean>;
  onNavigate: (direction: NavDirection) => void;
  className?: string;
}

/**
 * Une cellule de la grille : affichage statique par défaut, passe en édition
 * au clic (ou en tapant directement dessus). Entrée/clic ailleurs valide,
 * Échap annule. La tabulation et les flèches s'appuient sur l'ordre naturel
 * du DOM/tabIndex plutôt que sur une navigation reconstruite à la main.
 */
const GridCell = forwardRef<HTMLTableCellElement, GridCellProps>(function GridCell(
  { value, type, align = "left", placeholder, displayValue, onCommit, onNavigate, className },
  ref,
) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value == null ? "" : String(value));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) setDraft(value == null ? "" : String(value));
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const startEditing = (initial?: string) => {
    setDraft(initial ?? (value == null ? "" : String(value)));
    setIsEditing(true);
  };

  const save = async (afterSave?: () => void) => {
    setIsEditing(false);
    const original = value == null ? "" : String(value);
    if (draft === original) {
      afterSave?.();
      return;
    }
    setSaveState("saving");
    const ok = await onCommit(draft);
    if (ok) {
      setSaveState("saved");
      setTimeout(() => setSaveState((s) => (s === "saved" ? "idle" : s)), 1000);
    } else {
      setSaveState("error");
      setDraft(original);
      setTimeout(() => setSaveState((s) => (s === "error" ? "idle" : s)), 2000);
    }
    afterSave?.();
  };

  const cancel = () => {
    setDraft(value == null ? "" : String(value));
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const dir: NavDirection = e.shiftKey ? "up" : "down";
      save(() => onNavigate(dir));
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  const handleCellKeyDown = (e: React.KeyboardEvent<HTMLTableCellElement>) => {
    if (isEditing) return;
    if (e.key === "Enter") {
      e.preventDefault();
      startEditing();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onNavigate("up");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      onNavigate("down");
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      onNavigate("left");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onNavigate("right");
    } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      startEditing(e.key);
    }
  };

  const shown = displayValue ?? (value === null || value === undefined || value === "" ? "—" : String(value));

  return (
    <TableCell
      ref={ref}
      tabIndex={isEditing ? -1 : 0}
      onClick={() => !isEditing && startEditing()}
      onKeyDown={handleCellKeyDown}
      className={cn(
        "relative cursor-text text-sm focus:outline focus:outline-2 focus:outline-primary focus:-outline-offset-2",
        align === "right" && "text-right",
        className,
      )}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type={type}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => save()}
          onKeyDown={handleInputKeyDown}
          className={cn(
            "w-full bg-transparent outline-none border-b border-primary text-sm",
            align === "right" && "text-right",
          )}
        />
      ) : (
        <span className={cn(shown === "—" && "text-muted-foreground")}>{shown}</span>
      )}
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

export default GridCell;
