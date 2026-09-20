import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { detectPlatform, isHttpUrl, sourceFromPlatform } from "@/lib/catalogue/embed";
import { errorMessage, useCreateCatalogueItem } from "@/lib/catalogue/queries";
import {
  NATURE_OPTIONS,
  PLACE_TYPE_OPTIONS,
  PLATFORM_LABELS,
  STATUS_OPTIONS,
  type CommercialStatus,
  type Nature,
  type PlaceType,
} from "@/lib/catalogue/types";

export type AddMode = "place" | "link";

interface AddToCatalogueDialogProps {
  mode: AddMode | null; // null = fermé
  onClose: () => void;
  onCreated: (id: string, mode: AddMode) => void;
}

interface FormState {
  name: string;
  url: string;
  caption: string;
  nature: Nature;
  placeType: PlaceType;
  status: CommercialStatus;
  city: string;
  region: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  url: "",
  caption: "",
  nature: "inspiration",
  placeType: "autre",
  status: "idee",
  city: "",
  region: "",
  notes: "",
};

/**
 * Deux entrées vers le même formulaire :
 * - "Coller un lien" : juste le lien (et si on veut un nom). Le lieu arrive en "À trier".
 * - "Ajouter un lieu" : un lieu décrit à la main, avec un lien en option.
 */
export function AddToCatalogueDialog({ mode, onClose, onCreated }: AddToCatalogueDialogProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [urlError, setUrlError] = useState<string | null>(null);
  const create = useCreateCatalogueItem();

  const isLinkMode = mode === "link";
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const close = () => {
    setForm(EMPTY_FORM);
    setUrlError(null);
    onClose();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const url = form.url.trim();

    if (url && !isHttpUrl(url)) {
      setUrlError("Colle un lien complet, qui commence par https://");
      return;
    }
    if (isLinkMode && !url) {
      setUrlError("Colle le lien de la vidéo ou de la page");
      return;
    }
    if (!isLinkMode && !form.name.trim()) {
      toast.error("Donne au moins un nom au lieu");
      return;
    }
    setUrlError(null);

    const platform = url ? detectPlatform(url) : null;
    const name = form.name.trim() || (platform ? `À identifier (${PLATFORM_LABELS[platform]})` : "");

    try {
      const id = await create.mutateAsync({
        item: isLinkMode
          ? {
              name,
              commercial_status: "a_trier",
              source: platform ? sourceFromPlatform(platform) : "manuel",
            }
          : {
              name,
              nature: form.nature,
              place_type: form.placeType,
              commercial_status: form.status,
              city: form.city.trim() || null,
              region: form.region.trim() || null,
              notes: form.notes.trim() || null,
              source: platform ? sourceFromPlatform(platform) : "manuel",
            },
        link: url && platform ? { url, platform, caption: form.caption.trim() || null } : null,
      });
      toast.success(isLinkMode ? "Lien ajouté, à trier" : "Lieu ajouté au catalogue");
      close();
      if (mode) onCreated(id, mode);
    } catch (error) {
      // Cas typique : "Ce lien est déjà dans le catalogue (fiche : ...)"
      toast.error(errorMessage(error));
    }
  };

  return (
    <Dialog open={mode !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isLinkMode ? "Coller un lien" : "Ajouter un lieu"}</DialogTitle>
          <DialogDescription>
            {isLinkMode
              ? "Colle le lien d'une vidéo TikTok, d'un reel Instagram ou d'une page. Le lieu arrive dans « À trier », tu pourras le nommer et le classer ensuite."
              : "Décris un lieu à la main. Tu pourras compléter sa fiche après."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          {isLinkMode && (
            <div className="space-y-1.5">
              <Label htmlFor="catalogue-url">Lien</Label>
              <Input
                id="catalogue-url"
                autoFocus
                value={form.url}
                onChange={(e) => update("url", e.target.value)}
                placeholder="https://www.tiktok.com/..."
                inputMode="url"
              />
              {urlError && <p className="text-xs text-destructive">{urlError}</p>}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="catalogue-name">{isLinkMode ? "Nom du lieu (facultatif)" : "Nom du lieu"}</Label>
            <Input
              id="catalogue-name"
              autoFocus={!isLinkMode}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder={isLinkMode ? "Si tu le connais déjà" : "Ex : Vignoble des Collines"}
            />
          </div>

          {!isLinkMode && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Nature</Label>
                  <Select value={form.nature} onValueChange={(v) => update("nature", v as Nature)}>
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
                  <Select value={form.placeType} onValueChange={(v) => update("placeType", v as PlaceType)}>
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
                <Select value={form.status} onValueChange={(v) => update("status", v as CommercialStatus)}>
                  <SelectTrigger>
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
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="catalogue-city">Ville</Label>
                  <Input id="catalogue-city" value={form.city} onChange={(e) => update("city", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="catalogue-region">Région</Label>
                  <Input id="catalogue-region" value={form.region} onChange={(e) => update("region", e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="catalogue-notes">Notes</Label>
                <Textarea
                  id="catalogue-notes"
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Pourquoi ce lieu est intéressant"
                  rows={3}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="catalogue-url-optional">Lien de la vidéo ou de la page (facultatif)</Label>
                <Input
                  id="catalogue-url-optional"
                  value={form.url}
                  onChange={(e) => update("url", e.target.value)}
                  placeholder="https://..."
                  inputMode="url"
                />
                {urlError && <p className="text-xs text-destructive">{urlError}</p>}
              </div>
            </>
          )}

          {(isLinkMode || form.url.trim() !== "") && (
            <div className="space-y-1.5">
              <Label htmlFor="catalogue-caption">Légende ou note sur ce lien (facultatif)</Label>
              <Textarea
                id="catalogue-caption"
                value={form.caption}
                onChange={(e) => update("caption", e.target.value)}
                placeholder="Colle ici le texte de la vidéo pour t'en souvenir si elle disparaît"
                rows={2}
              />
            </div>
          )}

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
