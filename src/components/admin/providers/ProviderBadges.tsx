import { PROVIDER_STATUS_CLASS, providerStatusLabel, type ProviderStatus } from "@/lib/providers/types";
import { cn } from "@/lib/utils";

// Petits repères d'affichage des prestataires, partagés par la liste, la fiche et les formulaires.

export function ProviderStatusBadge({ status }: { status: ProviderStatus }) {
  return (
    <span className={cn("inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium", PROVIDER_STATUS_CLASS[status])}>
      {providerStatusLabel(status)}
    </span>
  );
}

/** Signal posé sur une fiche (expérience, hôtel) qui n'a pas encore de prestataire. */
export function MissingProviderBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-full border border-dashed border-red-500 px-2 py-0.5 text-[11px] font-medium text-red-600",
        className,
      )}
    >
      Prestataire à renseigner
    </span>
  );
}
