import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { setListingArchived } from "./actions";
import { isArchived, ARCHIVED_STATUS, UNARCHIVED_STATUS, type ListingKind } from "./status";

/**
 * Bouton Archiver / Désarchiver d'un formulaire d'édition.
 * Le statut est suivi localement : recharger la fiche depuis la base effacerait les
 * modifications en cours du formulaire. Seules les listes du back-office sont rafraîchies.
 */
export function useFormArchiveToggle(kind: ListingKind, id: string | undefined, savedStatus: string | null | undefined, listQueryKey: string[]) {
  const queryClient = useQueryClient();
  const [statusOverride, setStatusOverride] = useState<string | null>(null);
  const status = statusOverride ?? savedStatus ?? null;

  const toggle = async () => {
    if (!id) return;
    const archive = !isArchived(status);
    try {
      await setListingArchived(kind, id, archive);
      setStatusOverride(archive ? ARCHIVED_STATUS : UNARCHIVED_STATUS);
      queryClient.invalidateQueries({ queryKey: listQueryKey });
      toast.success(archive ? "Fiche archivée" : "Fiche désarchivée (repassée en brouillon)");
    } catch {
      toast.error("Erreur lors de l'archivage");
    }
  };

  return {
    status,
    /** À passer à FormHeaderBar ; absent pour une fiche pas encore enregistrée. */
    archive: id ? { archived: isArchived(status), onToggle: toggle } : undefined,
  };
}
