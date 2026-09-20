import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { describeFacts, findSimilarEntries, toUrl, type AppliedLookup } from "@/lib/catalogue/lookup";
import {
  applyLookupToForm,
  buildCreatePayload,
  emptyForm,
  markEdited,
  type AddFormState,
  type AddMode,
} from "@/lib/catalogue/lookupForm";
import { errorMessage, useCreateCatalogueItem } from "@/lib/catalogue/queries";
import {
  NATURE_OPTIONS,
  PLACE_TYPE_OPTIONS,
  STATUS_OPTIONS,
  labelOf,
  type CatalogueEntry,
  type CommercialStatus,
  type Nature,
  type PlaceType,
} from "@/lib/catalogue/types";
import { LookupBox } from "./LookupBox";

export type { AddMode };

interface AddToCatalogueDialogProps {
  mode: AddMode | null; // null = fermé
  entries: CatalogueEntry[];
  knownRegions: string[];
  onClose: () => void;
  onCreated: (id: string, mode: AddMode) => void;
}

/**
 * Deux entrées vers la même fenêtre :
 * - "Coller un lien" : un lien ou un nom, la recherche préremplit, le lieu arrive dans "À trier".
 * - "Ajouter un lieu" : un lieu décrit à la main, avec la même recherche en aide pour préremplir.
 */
export function AddToCatalogueDialog({ mode, entries, knownRegions, onClose, onCreated }: AddToCatalogueDialogProps) {
  const [form, setForm] = useState<AddFormState>(emptyForm);
  const [query, setQuery] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const create = useCreateCatalogueItem();

  const isLinkMode = mode === "link";
  const hasLookup = form.linkInfo !== null || form.sources.length > 0;
  // En mode lien, les champs détaillés n'apparaissent qu'une fois la recherche faite
  const showFullForm = !isLinkMode || hasLookup;
  const status = form.statusTouched ? form.status : isLinkMode ? "a_trier" : "idee";
  const facts = describeFacts({ ...form.extras, name: null, place_type: null, city: null, region: null, description: null });
  // Lieu déjà dans le catalogue ? On compare le nom saisi (ou le nom écrit dans la recherche, jamais un lien)
  const similar = findSimilarEntries(entries, form.name || (toUrl(query) ? "" : query));

  const edit = <K extends keyof AddFormState>(key: K, value: AddFormState[K]) =>
    setForm((f) => markEdited({ ...f, [key]: value }, key));
  const applyLookup = (applied: AppliedLookup) => setForm((f) => applyLookupToForm(f, applied));

  const close = () => {
    setForm(emptyForm());
    setQuery("");
    setFormError(null);
    onClose();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!mode) return;
    const built = buildCreatePayload(form, mode, query);
    if (built.error || !built.payload) {
      setFormError(built.error ?? "Impossible de préparer ce lieu");
      return;
    }
    setFormError(null);

    try {
      const id = await create.mutateAsync(built.payload);
      toast.success(isLinkMode ? "Ajouté, à trier" : "Lieu ajouté au catalogue");
      close();
      onCreated(id, mode);
    } catch (error) {
      // Cas typique : "Ce lien est déjà dans le catalogue (fiche : ...)"
      toast.error(errorMessage(error));
    }
  };

  return (
    <Dialog open={mode !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isLinkMode ? "Coller un lien ou un nom" : "Ajouter un lieu"}</DialogTitle>
          <DialogDescription>
            {isLinkMode
              ? "Colle un site, une vidéo TikTok, un reel Instagram, ou écris le nom d'un lieu. La recherche préremplit la fiche, tu vérifies avant d'ajouter."
              : "Décris un lieu à la main, ou lance une recherche pour préremplir la fiche."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <LookupBox
            query={query}
            onQueryChange={setQuery}
            label={isLinkMode ? "Lien ou nom du lieu" : "Rechercher pour préremplir (facultatif)"}
            placeholder="https://... ou Vignoble Tishbi"
            autoFocus
            knownRegions={knownRegions}
            onApply={applyLookup}
          />

          {hasLookup && (
            <div className="rounded-lg border border-green-200 bg-green-50/60 p-3 text-xs">
              <p className="font-medium text-green-800">
                Trouvé{form.sources.length > 0 ? ` (${form.sources.join(", ")})` : ""}
              </p>
              {facts.length > 0 ? (
                <ul className="mt-1.5 space-y-0.5 text-green-900">
                  {facts.map((fact) => (
                    <li key={fact.label}>
                      <span className="text-green-700">{fact.label} :</span> {fact.value}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-green-800">Pas de coordonnées trouvées, complète à la main si besoin.</p>
              )}
              <p className="mt-1.5 text-[11px] text-green-800/80">
                Ces infos sont enregistrées avec le lieu. Vérifie-les : la recherche peut se tromper.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="catalogue-name">
              {isLinkMode ? "Nom du lieu (facultatif)" : "Nom du lieu"}
            </Label>
            <Input
              id="catalogue-name"
              value={form.name}
              onChange={(e) => edit("name", e.target.value)}
              placeholder={isLinkMode ? "Si tu le connais déjà" : "Ex : Vignoble des Collines"}
            />
            {similar.length > 0 && (
              <p className="text-xs text-amber-700">
                Ça ressemble à un lieu déjà dans le catalogue : {similar.map((e) => e.display_name).join(", ")}.
              </p>
            )}
          </div>

          {showFullForm && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Nature</Label>
                  <Select value={form.nature} onValueChange={(v) => edit("nature", v as Nature)}>
                    <SelectTrigger>
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
                  <Label>Type</Label>
                  <Select value={form.placeType} onValueChange={(v) => edit("placeType", v as PlaceType)}>
                    <SelectTrigger>
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
              </div>

              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as CommercialStatus, statusTouched: true }))}
                >
                  <SelectTrigger>
                    <SelectValue>{labelOf(STATUS_OPTIONS, status)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="catalogue-city">Ville</Label>
                  <Input id="catalogue-city" value={form.city} onChange={(e) => edit("city", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="catalogue-region">Région</Label>
                  <Input id="catalogue-region" value={form.region} onChange={(e) => edit("region", e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="catalogue-notes">Notes</Label>
                <Textarea
                  id="catalogue-notes"
                  value={form.notes}
                  onChange={(e) => edit("notes", e.target.value)}
                  placeholder="Pourquoi ce lieu est intéressant"
                  rows={3}
                />
              </div>
            </>
          )}

          {!isLinkMode && (
            <div className="space-y-1.5">
              <Label htmlFor="catalogue-url-optional">Lien de la vidéo ou de la page (facultatif)</Label>
              <Input
                id="catalogue-url-optional"
                value={form.url}
                onChange={(e) => edit("url", e.target.value)}
                placeholder="https://..."
                inputMode="url"
              />
            </div>
          )}

          {(form.url.trim() !== "" || (isLinkMode && query.trim() !== "")) && (
            <div className="space-y-1.5">
              <Label htmlFor="catalogue-caption">Légende ou note sur ce lien (facultatif)</Label>
              <Textarea
                id="catalogue-caption"
                value={form.caption}
                onChange={(e) => edit("caption", e.target.value)}
                placeholder={
                  form.linkInfo?.caption
                    ? "Une légende a été copiée automatiquement, écris ici pour la remplacer"
                    : "Colle ici le texte de la vidéo pour t'en souvenir si elle disparaît"
                }
                rows={2}
              />
            </div>
          )}

          {formError && <p className="text-xs text-destructive">{formError}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={close}>
              Annuler
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLinkMode ? "Ajouter à trier" : "Ajouter au catalogue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
