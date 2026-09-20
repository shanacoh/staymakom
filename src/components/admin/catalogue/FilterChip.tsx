import { cn } from "@/lib/utils";

interface FilterChipProps {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  title?: string;
}

/** Une puce cliquable qui se coche et se décoche, avec le nombre de lieux qu'elle donnerait. */
export function FilterChip({ label, count, active, onClick, title }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground",
        active ? "border-foreground bg-foreground text-background" : "border-border bg-background text-foreground hover:bg-muted",
        count === 0 && !active && "opacity-45"
      )}
    >
      {label}
      {count !== undefined && (
        <span className={cn("tabular-nums", active ? "text-background/70" : "text-muted-foreground")}>{count}</span>
      )}
    </button>
  );
}
