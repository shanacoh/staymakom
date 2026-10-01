import { cn } from "@/lib/utils";
import type { EtapeDossier } from "@/lib/dossiersVoyage/types";

const ETAPES: { value: EtapeDossier; label: string }[] = [
  { value: "demande_recue", label: "Demande reçue" },
  { value: "brief", label: "Brief" },
  { value: "composer", label: "Composer" },
  { value: "lien_client", label: "Lien client" },
];

export function DossierStepper({ etapeActive }: { etapeActive: EtapeDossier }) {
  const indexActif = ETAPES.findIndex((e) => e.value === etapeActive);
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium uppercase tracking-wide">
      {ETAPES.map((e, i) => (
        <div key={e.value} className="flex items-center gap-1.5">
          <span
            className={cn(
              "rounded-full border px-3 py-1",
              i === indexActif
                ? "border-[#ad1414] bg-[#ad1414] text-white"
                : i < indexActif
                  ? "border-border bg-muted text-muted-foreground"
                  : "border-border text-muted-foreground"
            )}
          >
            {e.label}
          </span>
          {i < ETAPES.length - 1 && <span className="text-muted-foreground">→</span>}
        </div>
      ))}
    </div>
  );
}
