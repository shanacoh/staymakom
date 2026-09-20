/**
 * Bouton "Filtres" compact avec pastille de compte, qui ouvre un popover
 * contenant les champs de filtre — remplace la rangée de sélecteurs toujours
 * visible (jugée trop chargée) par quelque chose qui ne prend de la place
 * que si on en a besoin.
 */

import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SlidersHorizontal } from "lucide-react";

interface Props {
  activeCount: number;
  onReset?: () => void;
  children: ReactNode;
}

const FiltersPopoverButton = ({ activeCount, onReset, children }: Props) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtres
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-4 min-w-4 px-1 text-[10px]">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3">
        {children}
        {activeCount > 0 && onReset && (
          <button type="button" onClick={onReset} className="text-xs text-muted-foreground hover:text-foreground underline">
            Réinitialiser les filtres
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default FiltersPopoverButton;
