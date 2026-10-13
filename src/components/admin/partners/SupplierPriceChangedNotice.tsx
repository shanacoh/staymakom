import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/catalogue/queries";
import { clearSupplierPriceSignal, fetchSupplierPriceSignal, partnerAdminKeys } from "@/lib/partnerAdmin/queries";

// Signal posé sur une fiche quand une proposition de prix d'un prestataire a été acceptée : le prix
// fournisseur a changé, le prix client non (il n'est jamais modifié automatiquement). Il reste
// affiché jusqu'à ce qu'on confirme avoir vérifié le prix client.
export function SupplierPriceChangedNotice({ experienceId }: { experienceId: string }) {
  const queryClient = useQueryClient();
  const { data: changedAt } = useQuery({
    queryKey: partnerAdminKeys.priceSignal(experienceId),
    queryFn: () => fetchSupplierPriceSignal(experienceId),
  });
  const clear = useMutation({
    mutationFn: () => clearSupplierPriceSignal(experienceId),
    onSuccess: () => {
      queryClient.setQueryData(partnerAdminKeys.priceSignal(experienceId), null);
      toast.success("Signal retiré");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (!changedAt) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3">
      <p className="text-sm text-foreground">
        <span className="font-semibold text-destructive">Prix fournisseur modifié, vérifier le prix client.</span>{" "}
        <span className="text-muted-foreground">
          Proposition du prestataire acceptée le {format(parseISO(changedAt), "d MMM yyyy", { locale: fr })}. Le prix affiché au client n'a pas
          bougé : ajuste-le dans « Prix » si besoin.
        </span>
      </p>
      <Button type="button" variant="outline" size="sm" disabled={clear.isPending} onClick={() => clear.mutate()}>
        Prix client vérifié
      </Button>
    </div>
  );
}
