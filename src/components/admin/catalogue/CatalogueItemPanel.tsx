import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { buildPatch, draftFromEntry, hasChanges, type CatalogueDraft } from "@/lib/catalogue/draft";
import { isHttpUrl } from "@/lib/catalogue/embed";
import { outsideIsraelWarning } from "@/lib/catalogue/geo";
import { todayIso } from "@/lib/catalogue/filters";
import { errorMessage, useDeleteCatalogueItem, useUpdateCatalogueItem } from "@/lib/catalogue/queries";
import {
  NATURE_OPTIONS,
  PLACE_TYPE_OPTIONS,
  STATUS_OPTIONS,
  type CatalogueCategory,
  type CatalogueEntry,
  type CommercialStatus,
  type Nature,
  type PlaceType,
} from "@/lib/catalogue/types";
import { SiteBadge } from "./CatalogueBadges";
import { ItemLinksSection } from "./ItemLinksSection";
import { SiteLinkSection } from "./SiteLinkSection";

interface CatalogueItemPanelProps {
  entry: CatalogueEntry;
  allEntries: CatalogueEntry[];
  categories: CatalogueCategory[];
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs">
        {label}
      </Label>
      {children}
    </div>
  );
}

const inDays = (days: number) => format(addDays(new Date(), days), "yyyy-MM-dd");

/**
 * Fiche complète d'un lieu, dans un panneau latéral. Les modifications se font dans un brouillon
 * et ne sont envoyées qu'au clic sur "Enregistrer". Le parent lui donne `key={entry.id}` : changer
 * de lieu repart d'un brouillon neuf.
 */
export function CatalogueItemPanel({ entry, allEntries, categories, onClose }: CatalogueItemPanelProps) {
  const [draft, setDraft] = useState<CatalogueDraft>(() => draftFromEntry(entry));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const update = useUpdateCatalogueItem();
  const remove = useDeleteCatalogueItem();

  const linked = entry.live_kind !== null;
  const canDelete = !(linked && entry.live_status === "published"); // un lieu publié serait recréé à l'ouverture suivante
  const patchResult = useMemo(() => buildPatch(draft, entry), [draft, entry]);
  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(draftFromEntry(entry)),
    [draft, entry]
  );

  const set = <K extends keyof CatalogueDraft>(key: K, value: CatalogueDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // Cocher "envoyé" ou "visité" pose la date du jour si aucune n'est indiquée
  const toggleDone = (flag: "content_sent" | "visited", dateKey: "content_sent_at" | "visited_at", on: boolean) =>
    setDraft((d) => ({ ...d, [flag]: on, [dateKey]: on && !d[dateKey] ? todayIso() : d[dateKey] }));

  const toggleCategory = (id: string) =>
    setDraft((d) => ({
      ...d,
      category_ids: d.category_ids.includes(id) ? d.category_ids.filter((c) => c !== id) : [...d.category_ids, id],
    }));

  const handleOpenChange = (open: boolean) => {
    if (open) return;
    if (dirty && !window.confirm("Fermer sans enregistrer tes modifications ?")) return;
    onClose();
  };

  const save = async () => {
    if (patchResult.error || !hasChanges(patchResult)) return;
    try {
      await update.mutateAsync({ id: entry.id, patch: patchResult.patch });
      toast.success("Enregistré");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const doDelete = async () => {
    try {
      await remove.mutateAsync(entry.id);
      toast.success("Lieu supprimé du catalogue");
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const siteCategoryNames = entry.site_category_ids
    .map((id) => categories.find((c) => c.id === id)?.name)
    .filter((name): name is string => !!name);

  return (
    <>
      <Sheet open onOpenChange={handleOpenChange}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
          <SheetHeader className="space-y-1 border-b border-border p-5 pr-12 text-left">
            <SheetTitle className="text-base">{entry.display_name}</SheetTitle>
            <SheetDescription asChild>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <SiteBadge entry={entry} />
                <span>
                  {[entry.display_city, entry.display_region].filter(Boolean).join(", ") || "Lieu non renseigné"}
                </span>
              </div>
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-7 overflow-y-auto p-5">
            <Section title="Lien avec le site">
              <SiteLinkSection entry={entry} allEntries={allEntries} />
            </Section>

            <Section title="Classement">
              {!linked && (
                <Field label="Nom du lieu" htmlFor="panel-name">
                  <Input id="panel-name" value={draft.name} onChange={(e) => set("name", e.target.value)} />
                </Field>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Nature">
                  <Select value={draft.nature} onValueChange={(v) => set("nature", v as Nature)}>
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
                </Field>
                <Field label="Type">
                  <Select value={draft.place_type} onValueChange={(v) => set("place_type", v as PlaceType)}>
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
                </Field>
                <Field label="Statut commercial">
                  <Select value={draft.commercial_status} onValueChange={(v) => set("commercial_status", v as CommercialStatus)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="Catégories Staymakom">
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((category) => {
                    const active = draft.category_ids.includes(category.id);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleCategory(category.id)}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs transition-colors",
                          active
                            ? "border-foreground bg-foreground text-background"
                            : "border-border text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {category.name}
                      </button>
                    );
                  })}
                </div>
                {siteCategoryNames.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Catégories de la fiche du site (lecture seule) : {siteCategoryNames.join(", ")}
                  </p>
                )}
              </Field>

              <Field label="Étiquettes (séparées par des virgules)" htmlFor="panel-tags">
                <Input
                  id="panel-tags"
                  value={draft.tags}
                  onChange={(e) => set("tags", e.target.value)}
                  placeholder="vue mer, casher, enfants"
                />
              </Field>
            </Section>

            <Section title="Suivi du contenu">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Switch
                    id="panel-content-sent"
                    checked={draft.content_sent}
                    onCheckedChange={(on) => toggleDone("content_sent", "content_sent_at", on)}
                  />
                  <Label htmlFor="panel-content-sent" className="text-sm">
                    Contenu envoyé
                  </Label>
                  {draft.content_sent && (
                    <Input
                      type="date"
                      value={draft.content_sent_at}
                      onChange={(e) => set("content_sent_at", e.target.value)}
                      className="h-8 w-40 text-xs"
                      aria-label="Date d'envoi du contenu"
                    />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Switch
                    id="panel-visited"
                    checked={draft.visited}
                    onCheckedChange={(on) => toggleDone("visited", "visited_at", on)}
                  />
                  <Label htmlFor="panel-visited" className="text-sm">
                    Lieu visité
                  </Label>
                  {draft.visited && (
                    <Input
                      type="date"
                      value={draft.visited_at}
                      onChange={(e) => set("visited_at", e.target.value)}
                      className="h-8 w-40 text-xs"
                      aria-label="Date de la visite"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="panel-video"
                      checked={draft.video_done}
                      onCheckedChange={(on) => set("video_done", on)}
                    />
                    <Label htmlFor="panel-video" className="text-sm">
                      Vidéo faite
                    </Label>
                  </div>
                  {draft.video_done && (
                    <div className="flex items-center gap-2">
                      <Input
                        value={draft.video_url}
                        onChange={(e) => set("video_url", e.target.value)}
                        placeholder="Lien de ta vidéo (facultatif)"
                        inputMode="url"
                        className="h-8 text-xs"
                        aria-label="Lien de ta vidéo"
                      />
                      {isHttpUrl(draft.video_url) && (
                        <Button asChild size="sm" variant="ghost">
                          <a href={draft.video_url} target="_blank" rel="noopener noreferrer" aria-label="Ouvrir ta vidéo">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Section>

            <Section title="Suivi commercial">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Dernier contact" htmlFor="panel-last-contact">
                  <Input
                    id="panel-last-contact"
                    type="date"
                    value={draft.last_contact_date}
                    onChange={(e) => set("last_contact_date", e.target.value)}
                  />
                </Field>
                <Field label="Prochaine relance" htmlFor="panel-followup">
                  <Input
                    id="panel-followup"
                    type="date"
                    value={draft.next_followup_date}
                    onChange={(e) => set("next_followup_date", e.target.value)}
                  />
                </Field>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Dans 3 jours", days: 3 },
                  { label: "Dans 1 semaine", days: 7 },
                  { label: "Dans 2 semaines", days: 14 },
                ].map((quick) => (
                  <Button
                    key={quick.days}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => set("next_followup_date", inDays(quick.days))}
                  >
                    {quick.label}
                  </Button>
                ))}
                {draft.next_followup_date && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => set("next_followup_date", "")}
                  >
                    Effacer la relance
                  </Button>
                )}
              </div>
            </Section>

            <Section title="Contact">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Nom du contact" htmlFor="panel-contact-name">
                  <Input id="panel-contact-name" value={draft.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
                </Field>
                <Field label="Téléphone ou WhatsApp" htmlFor="panel-contact-phone">
                  <Input id="panel-contact-phone" value={draft.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} inputMode="tel" />
                </Field>
                <Field label="Email" htmlFor="panel-contact-email">
                  <Input id="panel-contact-email" value={draft.contact_email} onChange={(e) => set("contact_email", e.target.value)} inputMode="email" />
                </Field>
                <Field label="Instagram" htmlFor="panel-contact-instagram">
                  <Input id="panel-contact-instagram" value={draft.contact_instagram} onChange={(e) => set("contact_instagram", e.target.value)} placeholder="@compte" />
                </Field>
              </div>
              <Field label="Site web" htmlFor="panel-contact-website">
                <Input id="panel-contact-website" value={draft.contact_website} onChange={(e) => set("contact_website", e.target.value)} />
              </Field>
            </Section>

            {!linked && (
              <Section title="Lieu">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Ville" htmlFor="panel-city">
                    <Input id="panel-city" value={draft.city} onChange={(e) => set("city", e.target.value)} />
                  </Field>
                  <Field label="Région" htmlFor="panel-region">
                    <Input id="panel-region" value={draft.region} onChange={(e) => set("region", e.target.value)} />
                  </Field>
                </div>
                <Field label="Adresse" htmlFor="panel-address">
                  <Input id="panel-address" value={draft.address} onChange={(e) => set("address", e.target.value)} />
                </Field>
                <Field label="Lien Google Maps" htmlFor="panel-maps">
                  <Input id="panel-maps" value={draft.google_maps_link} onChange={(e) => set("google_maps_link", e.target.value)} inputMode="url" />
                </Field>
                {outsideIsraelWarning(draft.latitude, draft.longitude) && (
                  <p role="alert" className="text-xs text-destructive">
                    {outsideIsraelWarning(draft.latitude, draft.longitude)}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Latitude" htmlFor="panel-lat">
                    <Input id="panel-lat" value={draft.latitude} onChange={(e) => set("latitude", e.target.value)} inputMode="decimal" placeholder="32.0853" />
                  </Field>
                  <Field label="Longitude" htmlFor="panel-lng">
                    <Input id="panel-lng" value={draft.longitude} onChange={(e) => set("longitude", e.target.value)} inputMode="decimal" placeholder="34.7818" />
                  </Field>
                </div>
              </Section>
            )}

            <Section title="Notes">
              <Textarea
                value={draft.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Pourquoi ce lieu est intéressant, ce qu'on s'est dit, idées d'itinéraire..."
                rows={4}
                aria-label="Notes"
              />
            </Section>

            <Section title="Liens et vidéos">
              <ItemLinksSection itemId={entry.id} />
            </Section>

            {canDelete && (
              <Section title="Zone sensible">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Supprimer ce lieu du catalogue
                </Button>
              </Section>
            )}
          </div>

          <SheetFooter className="flex-col gap-2 border-t border-border p-4 sm:flex-col sm:space-x-0">
            {patchResult.error && <p className="text-xs text-destructive">{patchResult.error}</p>}
            <div className="flex w-full items-center justify-end gap-2">
              {dirty && (
                <Button type="button" variant="ghost" onClick={() => setDraft(draftFromEntry(entry))}>
                  Annuler les modifications
                </Button>
              )}
              <Button
                type="button"
                onClick={save}
                disabled={update.isPending || !!patchResult.error || !hasChanges(patchResult)}
              >
                {update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce lieu ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le lieu et ses liens seront supprimés du catalogue. Si une fiche du site lui est reliée, elle n'est pas
              touchée. Cette action est définitive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} disabled={remove.isPending}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
