import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { groupByZone } from "@/lib/regionList/labels";
import { useRegionList } from "@/lib/regionList/queries";

const NONE = "none";

interface RegionSelectProps {
  id?: string;
  /** L'identifiant de la région reliée, ou null. */
  value: string | null;
  onChange: (regionId: string | null) => void;
  /** L'ancien texte libre de la fiche : rappelé sous le sélecteur tant qu'aucune région n'est reliée. */
  legacyText?: string | null;
  disabled?: boolean;
}

/**
 * Sélecteur de région du back-office : les 21 régions de la liste de référence, groupées par zone.
 * Ne fait que proposer et remonter le choix ; l'enregistrement est fait par le formulaire.
 */
export function RegionSelect({ id, value, onChange, legacyText, disabled }: RegionSelectProps) {
  const list = useRegionList();
  // Une région désactivée reste visible sur la fiche qui la porte encore, pour ne pas la perdre à l'enregistrement.
  const groups = groupByZone(list, { includeInactive: true })
    .map(({ zone, regions }) => ({ zone, regions: regions.filter((r) => r.is_active || r.id === value) }))
    .filter(({ regions }) => regions.length > 0);

  return (
    <div className="space-y-1">
      <Select value={value ?? NONE} onValueChange={(next) => onChange(next === NONE ? null : next)} disabled={disabled}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Choisir une région" />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          <SelectItem value={NONE}>Aucune région</SelectItem>
          {groups.map(({ zone, regions }) => (
            <SelectGroup key={zone.slug}>
              <SelectLabel>{zone.name_fr}</SelectLabel>
              {regions.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name_fr}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      {!value && legacyText?.trim() && <p className="text-xs text-muted-foreground">Ancienne valeur : {legacyText.trim()}</p>}
    </div>
  );
}
