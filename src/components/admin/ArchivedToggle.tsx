import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArchivedToggleProps {
  count: number;
  open: boolean;
  onToggle: () => void;
}

/** Lien discret sous une liste : déplie / replie les fiches archivées. Rien si aucune archive. */
export function ArchivedToggle({ count, open, onToggle }: ArchivedToggleProps) {
  if (count === 0) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      Archivés ({count})
    </button>
  );
}
