import { Link } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { InternalOnlyBox } from "@/components/forms/shared/InternalOnlyBox";
import { useProviderLinks, useProviders } from "@/lib/providers/queries";
import { providerUrl } from "@/lib/providers/types";
import { MissingProviderBadge } from "./ProviderBadges";
import { ProviderPicker } from "./ProviderPicker";

interface HotelExperienceProviderFieldProps {
  /** Prestataire propre à l'expérience. Vide = celui de son hôtel. */
  value: string | null;
  onChange: (providerId: string | null) => void;
  /** Le premier hôtel du parcours : c'est son prestataire qui sert par défaut. */
  hotelId: string | null;
  disabled?: boolean;
}

/** Le prestataire d'une expérience hôtel : par défaut celui de l'hôtel, sauf si on en choisit un autre. */
export function HotelExperienceProviderField({ value, onChange, hotelId, disabled }: HotelExperienceProviderFieldProps) {
  const { links, isSuccess } = useProviderLinks();
  const { providers } = useProviders();
  const hotelProviderId = links.hotels.find((h) => h.id === hotelId)?.providerId ?? null;
  const hotelProvider = providers.find((p) => p.id === hotelProviderId) ?? null;
  const missing = isSuccess && !value && !hotelProviderId;

  return (
    <InternalOnlyBox>
      <div className="max-w-md space-y-2">
        <Label className="flex flex-wrap items-center gap-2">
          Prestataire
          {missing && <MissingProviderBadge />}
        </Label>
        <ProviderPicker
          value={value}
          onChange={(id) => onChange(id)}
          createType="experience"
          placeholder={hotelProvider ? `Celui de l'hôtel : ${hotelProvider.name}` : "Choisir un autre prestataire que l'hôtel"}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          {value ? (
            "Cette expérience est réalisée par un autre prestataire que l'hôtel. Retire-le pour revenir à celui de l'hôtel."
          ) : hotelProvider ? (
            <>
              Par défaut, le prestataire de l'hôtel :{" "}
              <Link to={providerUrl(hotelProvider.id)} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
                {hotelProvider.name}
              </Link>
              . Choisis-en un autre seulement si l'activité est réalisée par quelqu'un d'autre.
            </>
          ) : (
            "Par défaut, c'est le prestataire de l'hôtel. Cet hôtel n'en a pas encore : renseigne-le sur la fiche de l'hôtel, ou choisis ici celui de l'activité."
          )}
        </p>
      </div>
    </InternalOnlyBox>
  );
}
