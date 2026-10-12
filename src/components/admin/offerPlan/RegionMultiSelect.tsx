import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { groupByZone } from "@/lib/regionList/labels";
import { useRegionList } from "@/lib/regionList/queries";
import { cn } from "@/lib/utils";

interface RegionMultiSelectProps {
  value: string[];
  /** Appelé une seule fois, à la fermeture, si la sélection a changé. */
  onChange: (regionIds: string[]) => void;
  disabled?: boolean;
  className?: string;
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((id) => b.includes(id));

/** Régions candidates d'un must-have : plusieurs régions de la liste, ou aucune = « à chercher ». */
export function RegionMultiSelect({ value, onChange, disabled, className }: RegionMultiSelectProps) {
  const list = useRegionList();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(value);

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(value);
    else if (!sameSet(draft, value)) onChange(draft);
    setOpen(next);
  };

  const shown = open ? draft : value;
  const names = list.regions.filter((r) => shown.includes(r.id)).map((r) => r.name_fr);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex min-h-8 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-2 py-1 text-left text-xs disabled:opacity-50",
          className
        )}
      >
        <span className={cn("line-clamp-2", names.length === 0 && "text-muted-foreground")}>
          {names.length === 0 ? "À chercher" : names.join(", ")}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-80 w-64 overflow-y-auto p-2">
        {groupByZone(list).map(({ zone, regions }) => (
          <div key={zone.slug} className="mb-2 last:mb-0">
            <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{zone.name_fr}</div>
            {regions.map((r) => (
              <label key={r.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-xs hover:bg-muted">
                <Checkbox
                  checked={draft.includes(r.id)}
                  onCheckedChange={(checked) =>
                    setDraft((d) => (checked ? [...d, r.id] : d.filter((id) => id !== r.id)))
                  }
                />
                {r.name_fr}
              </label>
            ))}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
