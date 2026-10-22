/**
 * Menu « … » d'une ligne de demande (Vue et Saisie) : la convertir en réservation à tout moment,
 * sans attendre la dispo, ou l'archiver avec un motif.
 */

import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { NextAction, ReservationRow } from "@/lib/reservations/types";

const CONVERT: NextAction = { kind: "convert_request", label: "Convertir en réservation", urgent: false };
const ARCHIVE: NextAction = { kind: "archive_request", label: "Archiver", urgent: false };

interface Props {
  row: ReservationRow;
  onAction: (row: ReservationRow, action: NextAction) => void;
}

const RequestRowMenu = ({ row, onAction }: Props) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Autres actions pour ${row.client}`}>
        <MoreHorizontal className="h-3.5 w-3.5" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {[CONVERT, ARCHIVE].map((action) => (
        <DropdownMenuItem key={action.kind} onSelect={() => onAction(row, action)}>
          {action.label}
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

export default RequestRowMenu;
