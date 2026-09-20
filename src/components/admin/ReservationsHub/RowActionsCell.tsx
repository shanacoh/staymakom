/**
 * Les 3 actions par ligne de la maquette de Shana : générer un lien de
 * paiement, ouvrir une facture, déclencher la réservation réelle chez le
 * partenaire. Aucune des 3 n'existe encore côté logique (pas de facturation,
 * pas de déclenchement automatisé partenaire) — affichées désactivées avec un
 * tooltip, à construire une par une dans de prochaines sessions.
 */

import { CreditCard, FileText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TableCell } from "@/components/ui/table";

const RowActionsCell = () => {
  return (
    <TableCell className="py-2 px-3 text-right whitespace-nowrap">
      <div className="inline-flex gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
                <CreditCard className="h-3.5 w-3.5" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Lien de paiement — bientôt disponible</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled>
                <FileText className="h-3.5 w-3.5" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Facture — bientôt disponible</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled>
                <Send className="h-3 w-3 mr-1" />
                Réserver
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Déclenchement partenaire — bientôt disponible</TooltipContent>
        </Tooltip>
      </div>
    </TableCell>
  );
};

export default RowActionsCell;
