import { useState } from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { describeFacts, EMPTY_LOOKUP_SUGGESTION } from "@/lib/catalogue/lookup";
import { errorMessage, useCatalogueLinksFor, useUpdateCatalogueItem } from "@/lib/catalogue/queries";
import {
  NATURE_OPTIONS,
  PLACE_TYPE_OPTIONS,
  SOURCE_OPTIONS,
  STATUS_OPTIONS,
  labelOf,
  type CatalogueEntry,
  type CatalogueLink,
  type CommercialStatus,
  type Nature,
  type PlaceType,
} from "@/lib/catalogue/types";
import { LinkPlayer } from "./LinkPlayer";

const PAGE = 20;
const PLACEHOLDER_NAME = /^À identifier/;

interface InboxListProps {
  entries: CatalogueEntry[];
  onOpen: (id: string) => void;
}

/** Statuts proposés à la validation : on sort de "À trier", donc pas ce statut-là. */
const VALIDATION_STATUSES = STATUS_OPTIONS.filter((s) => s.value !== "a_trier" && s.value !== "refuse");

function ValidateForm({ entry, onDone }: { entry: CatalogueEntry; onDone: () => void }) {
  const update = useUpdateCatalogueItem();
  const [name, setName] = useState(PLACEHOLDER_NAME.test(entry.name) ? "" : entry.name);
  const [nature, setNature] = useState<Nature>(entry.nature);
  const [placeType, setPlaceType] = useState<PlaceType>(entry.place_type);
  const [status, setStatus] = useState<CommercialStatus>("idee");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Donne un nom au lieu pour le valider");
      return;
    }
    try {
      await update.mutateAsync({
        id: entry.id,
        patch: { name: name.trim(), nature, place_type: placeType, commercial_status: status },
      });
      toast.success(`Validé : ${name.trim()}`);
      onDone();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="space-y-1.5">
        <Label htmlFor={`inbox-name-${entry.id}`} className="text-xs">
          Nom du lieu
        </Label>
        <Input
          id={`inbox-name-${entry.id}`}
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Comment s'appelle ce lieu ?"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Nature</Label>
          <Select value={nature} onValueChange={(v) => setNature(v as Nature)}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NATURE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.singular}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Type</Label>
          <Select value={placeType} onValueChange={(v) => setPlaceType(v as PlaceType)}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLACE_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Statut</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as CommercialStatus)}>
            <SelectTrigger className="text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VALIDATION_STATUSES.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Annuler
        </Button>
        <Button type="submit" size="sm" disabled={update.isPending}>
          {update.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
          Confirmer
        </Button>
      </div>
    </form>
  );
}

function InboxCard({
  entry,
  links,
  onOpen,
}: {
  entry: CatalogueEntry;
  links: CatalogueLink[];
  onOpen: (id: string) => void;
}) {
  const update = useUpdateCatalogueItem();
  const [validating, setValidating] = useState(false);

  const facts = describeFacts({
    ...EMPTY_LOOKUP_SUGGESTION,
    address: entry.address,
    phone: entry.contact_phone,
    email: entry.contact_email,
    instagram: entry.contact_instagram,
    website: entry.contact_website,
    latitude: entry.latitude,
    longitude: entry.longitude,
  });
  const where = [entry.city, entry.region].filter(Boolean).join(", ");
  const identified = !PLACEHOLDER_NAME.test(entry.name);

  const discard = async () => {
    try {
      await update.mutateAsync({ id: entry.id, patch: { commercial_status: "refuse" } });
      toast.success("Écarté (retrouvable dans « Tous », statut « Refusé ou abandonné »)");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{entry.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            <Badge variant="outline" className="text-[10px] font-medium">
              {labelOf(SOURCE_OPTIONS, entry.source)}
            </Badge>
            {identified && <span>{labelOf(PLACE_TYPE_OPTIONS, entry.place_type)}</span>}
            {where && <span>{where}</span>}
            {!identified && <span className="text-amber-700">Lieu à identifier</span>}
          </div>
        </div>
      </div>

      {entry.notes && <p className="mt-2 line-clamp-3 text-xs text-foreground">{entry.notes}</p>}
      {facts.length > 0 && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          {facts.map((f) => `${f.label} : ${f.value}`).join(" · ")}
        </p>
      )}

      {links.length > 0 && (
        <div className="mt-3 space-y-2">
          {links.map((link) => (
            <LinkPlayer key={link.id} link={link} />
          ))}
        </div>
      )}

      {validating ? (
        <ValidateForm entry={entry} onDone={() => setValidating(false)} />
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => setValidating(true)}>
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Valider
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => onOpen(entry.id)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Modifier
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-muted-foreground"
            onClick={discard}
            disabled={update.isPending}
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Écarter
          </Button>
        </div>
      )}
    </article>
  );
}

/**
 * La boîte "À trier" : chaque lien envoyé (depuis l'iPhone ou collé ici) est une carte avec sa vidéo
 * et la proposition de la recherche. Valider range le lieu, Écarter l'abandonne, Modifier ouvre la fiche.
 */
export function InboxList({ entries, onOpen }: InboxListProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE);
  const shown = entries.slice(0, visibleCount);
  const { data: linksByItem } = useCatalogueLinksFor(shown.map((e) => e.id));

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {entries.length} lien{entries.length > 1 ? "s" : ""} à trier. Les plus récents en premier.
      </p>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {shown.map((entry) => (
          <InboxCard key={entry.id} entry={entry} links={linksByItem?.get(entry.id) ?? []} onOpen={onOpen} />
        ))}
      </div>
      {entries.length > visibleCount && (
        <div className="flex justify-center">
          <Button type="button" variant="outline" size="sm" onClick={() => setVisibleCount((n) => n + PAGE)}>
            Afficher la suite ({entries.length - visibleCount} de plus)
          </Button>
        </div>
      )}
    </div>
  );
}
