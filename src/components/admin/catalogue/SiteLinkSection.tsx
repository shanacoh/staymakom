import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronsUpDown, ExternalLink, Loader2, Pencil, Unlink } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { errorMessage, useSiteItemsForLinking, useUpdateCatalogueItem, type SiteItemOption } from "@/lib/catalogue/queries";
import { formatPosition, positionOf, siteHasBadPosition } from "@/lib/catalogue/geo";
import {
  LIVE_KIND_LABELS,
  siteEditPath,
  sitePublicPath,
  type CatalogueEntry,
} from "@/lib/catalogue/types";

interface SiteLinkSectionProps {
  entry: CatalogueEntry;
  allEntries: CatalogueEntry[];
}

const NO_SITE_LINK = { hotel_id: null, experience_id: null, standalone_experience_id: null } as const;

function linkPatch(option: SiteItemOption) {
  return {
    ...NO_SITE_LINK,
    ...(option.kind === "hotel" && { hotel_id: option.id }),
    ...(option.kind === "experience" && { experience_id: option.id }),
    ...(option.kind === "standalone" && { standalone_experience_id: option.id }),
  };
}

/**
 * Lien entre un lieu du catalogue et une fiche du site. Relié : les infos viennent de la fiche
 * (lecture seule ici, modification depuis la fiche elle-même). Pas relié : on peut choisir la fiche.
 */
export function SiteLinkSection({ entry, allEntries }: SiteLinkSectionProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const update = useUpdateCatalogueItem();
  const { data: options = [], isLoading } = useSiteItemsForLinking(pickerOpen);

  // Une fiche du site ne peut être reliée qu'à un seul lieu du catalogue
  const alreadyLinked = useMemo(
    () =>
      new Set(
        allEntries.flatMap((e) => [e.hotel_id, e.experience_id, e.standalone_experience_id]).filter(Boolean)
      ),
    [allEntries]
  );
  const available = options.filter((o) => !alreadyLinked.has(o.id));

  const link = async (option: SiteItemOption) => {
    try {
      await update.mutateAsync({
        id: entry.id,
        // Une fiche du site est par définition un partenaire : on aligne la nature et le statut
        patch: { ...linkPatch(option), nature: "partenaire", commercial_status: "partenaire" },
      });
      setPickerOpen(false);
      toast.success("Relié à la fiche du site (nature et statut passés à Partenaire)");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const unlink = async () => {
    if (!window.confirm("Délier ce lieu de sa fiche du site ? Le lieu reste dans le catalogue avec son dernier nom connu.")) {
      return;
    }
    try {
      await update.mutateAsync({ id: entry.id, patch: { ...NO_SITE_LINK } });
      toast.success("Lieu délié de la fiche du site");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  if (entry.live_kind) {
    const editPath = siteEditPath(entry);
    const publicPath = sitePublicPath(entry);
    return (
      <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {LIVE_KIND_LABELS[entry.live_kind]}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {entry.live_status === "published" ? "Publié sur le site" : "Pas publié (brouillon)"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Le nom, la photo, la région, la ville et la position viennent de la fiche du site. Pour les changer,
          modifie la fiche elle-même.
        </p>
        {siteHasBadPosition(entry) && (
          <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
            La fiche du site contient une position hors d'Israël
            {(() => {
              const position = positionOf(entry.live_latitude, entry.live_longitude);
              return position ? ` (${formatPosition(position.lat, position.lng)})` : "";
            })()}
            : les clients voient une mauvaise carte sur la page. Corrige-la sur la fiche du site.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {editPath && (
            <Button asChild size="sm" variant="outline">
              <Link to={editPath}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Modifier la fiche sur le site
              </Link>
            </Button>
          )}
          {publicPath && (
            <Button asChild size="sm" variant="ghost">
              <a href={publicPath} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Voir sur le site
              </a>
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={unlink}
            disabled={update.isPending}
          >
            <Unlink className="mr-1.5 h-3.5 w-3.5" />
            Délier
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Ce lieu est-il devenu une fiche du site ? Relie-le pour que son nom, sa photo et sa position soient lus
        directement depuis la fiche.
      </p>
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="justify-between" disabled={update.isPending}>
            {update.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Relier à une fiche du site
            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(92vw,26rem)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Chercher une fiche..." />
            <CommandList>
              {isLoading ? (
                <div className="p-4 text-center text-xs text-muted-foreground">Chargement...</div>
              ) : (
                <>
                  <CommandEmpty>Aucune fiche disponible.</CommandEmpty>
                  <CommandGroup>
                    {available.map((option) => (
                      <CommandItem
                        key={`${option.kind}-${option.id}`}
                        value={`${option.label} ${LIVE_KIND_LABELS[option.kind]}`}
                        onSelect={() => link(option)}
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm">{option.label}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {LIVE_KIND_LABELS[option.kind]}
                            {option.published ? "" : " · brouillon"}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
