/**
 * Éléments partagés pour afficher les lignes de réservation d'un dossier de voyage
 * (dans « Vue » et dans « Saisie ») : étiquette de nature et champ de coût réel.
 */

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/components/admin/BookingsGrid/columnTypes";
import type { DossierLine } from "@/lib/reservations/types";

const NATURE_LABELS: Record<string, string> = {
  hebergement: "Hôtel",
  activite: "Expérience",
  transport: "Transport",
  restaurant: "Restaurant",
  lieu_a_visiter: "Visite",
  autre: "Autre",
};

export const NatureTag = ({ nature }: { nature: string }) => (
  <Badge variant="outline" className="rounded-md px-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
    {NATURE_LABELS[nature] ?? nature}
  </Badge>
);

/** Coût réel d'une ligne : s'enregistre en quittant le champ ou avec Entrée, Échap annule. */
export function LineCostInput({
  line,
  onCommit,
  className = "w-32",
}: {
  line: DossierLine;
  onCommit: (cost: number | null) => void;
  className?: string;
}) {
  const initial = line.cost === null ? "" : String(line.cost);
  const [value, setValue] = useState(initial);
  useEffect(() => setValue(initial), [initial]);

  const commit = () => {
    const trimmed = value.trim().replace(/\s/g, "").replace(",", ".");
    if (trimmed === initial) return;
    if (trimmed === "") return onCommit(null);
    const cost = Number(trimmed);
    if (Number.isNaN(cost) || cost < 0) {
      setValue(initial);
      return;
    }
    onCommit(cost);
  };

  return (
    <Input
      inputMode="decimal"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") setValue(initial);
      }}
      placeholder={line.estimatedCost === null ? "coût" : `estimé ${formatCurrency(line.estimatedCost, line.currency)}`}
      aria-label={`Coût fournisseur réel, ${line.product}`}
      className={cn("ml-auto h-7 text-right text-sm tabular-nums", className)}
    />
  );
}
