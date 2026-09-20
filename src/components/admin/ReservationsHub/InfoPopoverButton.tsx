/**
 * Petit "i" cliquable qui remplace un paragraphe d'explication toujours
 * affiché — l'info reste disponible mais ne prend de la place que si on la
 * demande.
 */

import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  children: React.ReactNode;
}

const InfoPopoverButton = ({ children }: Props) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground">
        <Info className="h-4 w-4" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" className="w-72 text-sm text-muted-foreground">
      {children}
    </PopoverContent>
  </Popover>
);

export default InfoPopoverButton;
