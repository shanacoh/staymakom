import { Badge } from "@/components/ui/badge";

/**
 * Badge affiché partout où un prestataire apparaît dans le back-office
 * (fiches expérience, réservations, tableau de rentabilité...) tant qu'il
 * n'a pas validé notre politique annulation/météo.
 */
export function ProviderPolicyBadge({ policyValidated }: { policyValidated: boolean }) {
  if (policyValidated) return null;
  return (
    <Badge variant="destructive" className="text-[10px] font-semibold whitespace-nowrap">
      Politique non validée
    </Badge>
  );
}
