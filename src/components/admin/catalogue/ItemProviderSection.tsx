import { toast } from "sonner";
import { ProviderPicker } from "@/components/admin/providers/ProviderPicker";
import { errorMessage } from "@/lib/catalogue/queries";
import type { PlaceType } from "@/lib/catalogue/types";
import { useCatalogueItemProvider } from "@/lib/providers/queries";
import type { ProviderType } from "@/lib/providers/types";

const CREATE_TYPE: Partial<Record<PlaceType, ProviderType>> = { hebergement: "hotel", bateau: "boat", activite: "experience" };

/** Le prestataire derrière un lieu du catalogue. Enregistré dès qu'on le choisit. */
export function ItemProviderSection({ itemId, placeType }: { itemId: string; placeType: PlaceType }) {
  const { providerId, isLoading, save } = useCatalogueItemProvider(itemId);

  return (
    <div className="space-y-1">
      <ProviderPicker
        value={providerId}
        disabled={isLoading || save.isPending}
        createType={CREATE_TYPE[placeType] ?? "other"}
        onChange={(id) =>
          save.mutate(id, {
            onSuccess: () => toast.success(id ? "Prestataire relié" : "Prestataire retiré"),
            onError: (error) => toast.error(`Enregistrement impossible : ${errorMessage(error)}`),
          })
        }
      />
      <p className="text-xs text-muted-foreground">Un prospect ou un prestataire en discussion peut être choisi.</p>
    </div>
  );
}
