import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  CAR_FREE_OPTIONS,
  FORMAT_OPTIONS,
  STATUS_OPTIONS,
  type CarFree,
  type MustHaveDraft,
  type MustHaveFormat,
  type MustHaveStatus,
  type OfferMood,
} from "@/lib/offerPlan/types";
import { ProviderPicker } from "@/components/admin/providers/ProviderPicker";
import { RegionMultiSelect } from "./RegionMultiSelect";

interface MustHaveDialogProps {
  moods: OfferMood[];
  /** Mood proposé d'office (celui du filtre en cours, s'il y en a un). */
  defaultMoodId: string | null;
  saving: boolean;
  onCreate: (draft: MustHaveDraft) => void;
  onClose: () => void;
}

const NO_FORMAT = "none";
// « En ligne » ne se choisit pas à la main : il vient de la publication de l'expérience liée.
const MANUAL_STATUSES = STATUS_OPTIONS.filter((s) => s.value !== "en_ligne");

/** La fenêtre « + Must-have » : tous les champs d'un nouveau must-have. */
export function MustHaveDialog({ moods, defaultMoodId, saving, onCreate, onClose }: MustHaveDialogProps) {
  const [draft, setDraft] = useState<MustHaveDraft>({
    category_id: defaultMoodId ?? "",
    pillar: null,
    name: "",
    format: null,
    season: null,
    car_free: "a_voir",
    is_core: false,
    status: "a_trouver",
    partner: null,
    provider_id: null,
    notes: null,
    region_ids: [],
  });
  const set = <K extends keyof MustHaveDraft>(key: K, value: MustHaveDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const text = (value: string) => value.trim() || null;
  const canSave = !!draft.category_id && draft.name.trim() !== "" && !saving;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau must-have</DialogTitle>
          <DialogDescription>Ce qu'il faut avoir au catalogue. Le partenaire se cherche ensuite.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSave) onCreate({ ...draft, name: draft.name.trim() });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="mh-mood">Mood *</Label>
              <Select value={draft.category_id} onValueChange={(v) => set("category_id", v)}>
                <SelectTrigger id="mh-mood">
                  <SelectValue placeholder="Choisir un mood" />
                </SelectTrigger>
                <SelectContent>
                  {moods.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                      {m.status !== "published" && " · brouillon"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mh-pillar">Pilier</Label>
              <Input id="mh-pillar" placeholder="Ex : Judaïsme, Archéologie" onChange={(e) => set("pillar", text(e.target.value))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mh-name">Nom *</Label>
            <Input id="mh-name" value={draft.name} onChange={(e) => set("name", e.target.value)} autoFocus />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="mh-format">Format</Label>
              <Select
                value={draft.format ?? NO_FORMAT}
                onValueChange={(v) => set("format", v === NO_FORMAT ? null : (v as MustHaveFormat))}
              >
                <SelectTrigger id="mh-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_FORMAT}>Non précisé</SelectItem>
                  {FORMAT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mh-season">Saison</Label>
              <Input id="mh-season" placeholder="Ex : toute l'année, printemps" onChange={(e) => set("season", text(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mh-car">Faisable sans voiture</Label>
              <Select value={draft.car_free} onValueChange={(v) => set("car_free", v as CarFree)}>
                <SelectTrigger id="mh-car">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAR_FREE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mh-status">Statut</Label>
              <Select value={draft.status} onValueChange={(v) => set("status", v as MustHaveStatus)}>
                <SelectTrigger id="mh-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MANUAL_STATUSES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="mh-core" checked={draft.is_core} onCheckedChange={(v) => set("is_core", v)} />
            <Label htmlFor="mh-core">Socle (fait partie du minimum à avoir)</Label>
          </div>

          <div className="space-y-1.5">
            <Label>Régions candidates</Label>
            <RegionMultiSelect value={draft.region_ids} onChange={(ids) => set("region_ids", ids)} className="min-h-10 text-sm" />
            <p className="text-xs text-muted-foreground">Aucune région cochée = « à chercher ».</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Prestataire</Label>
              <ProviderPicker value={draft.provider_id} onChange={(id) => set("provider_id", id)} showLink={false} />
              <p className="text-xs text-muted-foreground">Facultatif. Un prospect peut être choisi.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mh-partner">Partenaire envisagé (texte libre)</Label>
              <Input id="mh-partner" onChange={(e) => set("partner", text(e.target.value))} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mh-notes">Notes</Label>
            <Textarea id="mh-notes" rows={3} onChange={(e) => set("notes", text(e.target.value))} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={!canSave}>
              {saving ? "Enregistrement…" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
