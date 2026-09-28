/**
 * Actions par ligne : ouvrir la fiche détaillée de la réservation (envoi/
 * renvoi de l'email de confirmation, historique) puis les 3 actions de la
 * maquette de Shana — générer un lien de paiement, ouvrir une facture,
 * déclencher la réservation réelle chez le partenaire. Aucune des 3 n'existe
 * encore côté logique (pas de facturation, pas de déclenchement automatisé
 * partenaire) — affichées désactivées avec un tooltip, à construire une par
 * une dans de prochaines sessions.
 */

import { CreditCard, Eye, FileText, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TableCell } from "@/components/ui/table";

interface Props {
  // Chemin vers la fiche détaillée de la réservation (ex.
  // /admin/standalone-bookings/:id ou /admin/reservations/:id). Absent sur la
  // ligne "nouvelle réservation", qui n'a pas encore d'id.
  detailPath?: string;
}

const RowActionsCell = ({ detailPath }: Props) => {
  const navigate = useNavigate();
  return (
    <TableCell className="py-2 px-3 text-right whitespace-nowrap">
      <div className="inline-flex gap-1">
        {detailPath && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => navigate(detailPath)}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ouvrir la fiche (détails, envoi de confirmation)</TooltipContent>
          </Tooltip>
        )}
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
