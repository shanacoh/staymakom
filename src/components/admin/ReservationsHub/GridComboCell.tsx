/**
 * Cellule de la grille de Saisie où l'on choisit dans une liste avec recherche (produit du
 * catalogue, prestataire). Entrée, clic ou une lettre tapée ouvre la recherche ; les flèches et
 * Tab passent à la cellule voisine comme ailleurs dans la grille. Quand c'est permis, le texte
 * tapé peut aussi être gardé tel quel (« Utiliser … »).
 */

import { forwardRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { TableCell } from "@/components/ui/table";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { NavDirection } from "@/components/admin/BookingsGrid/GridCell";

export interface ComboOption {
  value: string;
  label: string;
  hint?: string;
}

interface Props {
  // Texte affiché dans la cellule.
  display: string;
  selectedValue?: string | null;
  options: ComboOption[];
  placeholder: string;
  // Accepte le texte tapé comme valeur libre (produit hors catalogue, hôtel en clair).
  allowFreeText?: boolean;
  // Option « aucun » en tête de liste (ex. retirer le prestataire).
  noneLabel?: string;
  onPick: (choice: { value: string | null } | { text: string }) => Promise<boolean>;
  onNavigate: (direction: NavDirection) => void;
  className?: string;
}

const NAV_KEYS: Record<string, NavDirection> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };

const GridComboCell = forwardRef<HTMLTableCellElement, Props>(function GridComboCell(
  { display, selectedValue, options, placeholder, allowFreeText, noneLabel, onPick, onNavigate, className },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const openWith = (initial: string) => {
    setSearch(initial);
    setOpen(true);
  };

  const pick = async (choice: { value: string | null } | { text: string }) => {
    setOpen(false);
    setSaving(true);
    await onPick(choice);
    setSaving(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableCellElement>) => {
    if (open) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openWith("");
    } else if (NAV_KEYS[e.key]) {
      e.preventDefault();
      onNavigate(NAV_KEYS[e.key]);
    } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      openWith(e.key);
    }
  };

  const typed = search.trim();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <TableCell
          ref={ref}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className={cn(
            "relative h-8 cursor-pointer truncate px-3 py-1 text-sm focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-primary",
            saving && "opacity-60",
            className,
          )}
        >
          {display ? <span className="truncate">{display}</span> : <span className="text-muted-foreground">{placeholder}</span>}
        </TableCell>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher…" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>{allowFreeText ? "Rien dans la liste : Entrée garde ce texte." : "Aucun résultat."}</CommandEmpty>
            {noneLabel && (
              <CommandGroup>
                <CommandItem value={`__aucun__ ${noneLabel}`} onSelect={() => pick({ value: null })} className="text-muted-foreground">
                  {noneLabel}
                </CommandItem>
              </CommandGroup>
            )}
            <CommandGroup>
              {options.map((option) => (
                <CommandItem key={option.value} value={`${option.label} ${option.value}`} onSelect={() => pick({ value: option.value })} className="gap-2">
                  <Check className={cn("h-3.5 w-3.5 shrink-0", option.value === selectedValue ? "opacity-100" : "opacity-0")} />
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.hint && <span className="shrink-0 text-[11px] text-muted-foreground">{option.hint}</span>}
                </CommandItem>
              ))}
            </CommandGroup>
            {allowFreeText && typed && (
              <CommandGroup forceMount>
                <CommandItem forceMount value={`__libre__ ${typed}`} onSelect={() => pick({ text: typed })} className="gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  Utiliser « {typed} »
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

export default GridComboCell;
