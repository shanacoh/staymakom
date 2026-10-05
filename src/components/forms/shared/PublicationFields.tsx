import { Switch } from "@/components/ui/switch";
import { Input, Label } from "@/components/forms/styled";

interface Props {
  slug: string;
  slugHelp?: string;
  featuredOnHome: boolean;
  onFeaturedOnHomeChange: (v: boolean) => void;
  homeDisplayOrder: number;
  onHomeDisplayOrderChange: (v: number) => void;
}

// Slug (lecture seule) + mise en avant sur l'accueil et son ordre.
export function PublicationFields({
  slug,
  slugHelp = "Généré automatiquement depuis le titre EN",
  featuredOnHome,
  onFeaturedOnHomeChange,
  homeDisplayOrder,
  onHomeDisplayOrderChange,
}: Props) {
  return (
    <>
      <div className="space-y-2">
        <Label>Slug (URL)</Label>
        <Input value={slug} readOnly className="bg-muted text-muted-foreground text-sm" />
        <p className="text-xs text-muted-foreground">{slugHelp}</p>
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg border">
        <div>
          <p className="font-medium text-sm">Mise en avant sur l'accueil</p>
          <p className="text-xs text-muted-foreground">Afficher cette expérience dans la section vedette de la page d'accueil</p>
        </div>
        <div className="flex items-center gap-3">
          {featuredOnHome && (
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">Ordre</Label>
              <Input
                type="number"
                min={0}
                value={homeDisplayOrder}
                onChange={(e) => onHomeDisplayOrderChange(parseInt(e.target.value) || 0)}
                className="w-16 h-7 text-sm"
              />
            </div>
          )}
          <Switch checked={featuredOnHome} onCheckedChange={onFeaturedOnHomeChange} />
        </div>
      </div>
    </>
  );
}
