/**
 * Ouvre la fenêtre de modification d'une demande (client, date, personnes, message, notes)
 * depuis une ligne « Demande » de la page Réservations.
 */

import { useQuery } from "@tanstack/react-query";
import EditStandaloneRequestDialog from "@/components/admin/EditStandaloneRequestDialog";
import { fetchRequestForAction } from "@/lib/reservations/actions";

interface Props {
  requestId: string | null;
  onClose: () => void;
}

const EditRequestDialog = ({ requestId, onClose }: Props) => {
  const { data: request } = useQuery({
    queryKey: ["admin-reservation-request", requestId],
    queryFn: () => fetchRequestForAction(requestId as string),
    enabled: !!requestId,
    // Toujours la dernière version : la demande peut avoir été modifiée depuis la grille.
    staleTime: 0,
  });
  if (!requestId || !request) return null;
  return <EditStandaloneRequestDialog open onOpenChange={(open) => !open && onClose()} request={request} />;
};

export default EditRequestDialog;
