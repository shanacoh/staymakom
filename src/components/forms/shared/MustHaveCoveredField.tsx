import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Label } from "@/components/forms/styled";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { linkedExperienceKey, mustHavesForMoods } from "@/lib/offerPlan/compute";
import { statusLabel } from "@/lib/offerPlan/types";
import type { MustHaveLink } from "@/lib/offerPlan/useMustHaveLink";
import { cn } from "@/lib/utils";

interface MustHaveCoveredFieldProps {
  link: MustHaveLink;
  /** Les moods cochés sur la fiche : seuls leurs must-haves sont proposés. */
  moodIds: string[];
  moods?: { id: string; name: string }[];
  disabled?: boolean;
}

const NONE = "none";

/**
 * « Must-have couvert » : relie l'expérience à un must-have du Plan de l'offre.
 * Vide = opportunité hors plan. Ne fait que proposer ; le lien est posé à l'enregistrement de la fiche.
 */
export function MustHaveCoveredField({ link, moodIds, moods = [], disabled }: MustHaveCoveredFieldProps) {
  const [open, setOpen] = useState(false);
  const options = useMemo(() => mustHavesForMoods(link.mustHaves, moodIds, link.value), [link.mustHaves, moodIds, link.value]);
  const current = link.mustHaves.find((m) => m.id === link.value) ?? null;
  const moodName = (id: string) => moods.find((m) => m.id === id)?.name;

  const choose = (id: string | null) => {
    link.setValue(id);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="must-have-covered">Must-have couvert</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          id="must-have-covered"
          disabled={disabled}
          className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-left text-sm disabled:opacity-50"
        >
          <span className={cn("truncate", !current && "text-muted-foreground")}>
            {current ? current.name : "Aucun : opportunité hors plan"}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[--radix-popover-trigger-width] min-w-72 p-0">
          <Command>
            <CommandInput placeholder="Chercher un must-have…" />
            <CommandList>
              <CommandEmpty>
                {moodIds.length === 0 ? "Coche d'abord un mood." : "Aucun must-have pour les moods cochés."}
              </CommandEmpty>
              <CommandGroup>
                <CommandItem value={NONE} keywords={["aucun", "hors plan"]} onSelect={() => choose(null)}>
                  <Check className={cn("mr-2 h-4 w-4", link.value ? "opacity-0" : "opacity-100")} />
                  Aucun : opportunité hors plan
                </CommandItem>
                {options.map((m) => {
                  const takenByAnother = m.id !== link.value && !!linkedExperienceKey(m);
                  return (
                    <CommandItem
                      key={m.id}
                      value={m.id}
                      keywords={[m.name, m.pillar ?? "", moodName(m.category_id) ?? ""]}
                      onSelect={() => choose(m.id)}
                    >
                      <Check className={cn("mr-2 h-4 w-4 shrink-0", link.value === m.id ? "opacity-100" : "opacity-0")} />
                      <span className="min-w-0">
                        <span className="block truncate">{m.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {[moodName(m.category_id), statusLabel(m.status), takenByAnother && "déjà couvert par une autre expérience"]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <p className="text-[10px] text-[#6f6a63]">
        {link.mustHaves.length === 0
          ? "Le Plan de l'offre ne contient pas encore de must-have."
          : "Vide = opportunité hors plan. Le lien est posé à l'enregistrement de la fiche."}
      </p>
    </div>
  );
}
