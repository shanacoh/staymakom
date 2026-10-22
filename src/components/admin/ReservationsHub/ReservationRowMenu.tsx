/**
 * Menu « … » d'une ligne (Vue et Saisie). Demande : la convertir en réservation à tout moment,
 * sans attendre la dispo, ou l'archiver avec un motif. Réservation d'expérience ou d'hôtel :
 * l'annuler ou noter son remboursement.
 */

import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { isCancellation } from "@/lib/reservations/cancellation";
import type { NextAction, ReservationRow } from "@/lib/reservations/types";

const CONVERT: NextAction = { kind: "convert_request", label: "Convertir en réservation", urgent: false };
const ARCHIVE: NextAction = { kind: "archive_request", label: "Archiver", urgent: false };
const CANCEL: NextAction = { kind: "cancel_refund", label: "Annuler / Rembourser", urgent: false };
const EDIT_CANCELLATION: NextAction = { kind: "cancel_refund", label: "Annulation et remboursement", urgent: false };

/** Les actions du menu d'une ligne ; aucune pour un dossier de voyage (il a son onglet). */
function rowMenuActions(row: ReservationRow): NextAction[] {
  if (row.source === "request") return [CONVERT, ARCHIVE];
  if (row.source === "booking" || row.source === "hotel") return [isCancellation(row) ? EDIT_CANCELLATION : CANCEL];
  return [];
}

interface Props {
  row: ReservationRow;
  onAction: (row: ReservationRow, action: NextAction) => void;
}

const ReservationRowMenu = ({ row, onAction }: Props) => {
  const actions = rowMenuActions(row);
  if (actions.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Autres actions pour ${row.client}`}>
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <DropdownMenuItem key={action.label} onSelect={() => onAction(row, action)}>
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ReservationRowMenu;
