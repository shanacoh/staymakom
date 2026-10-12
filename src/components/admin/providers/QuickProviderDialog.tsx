import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { errorMessage } from "@/lib/catalogue/queries";
import { createProvider, useProviderMutation } from "@/lib/providers/queries";
import {
  EMPTY_PROVIDER_DRAFT,
  PROVIDER_STATUS_OPTIONS,
  PROVIDER_TYPE_OPTIONS,
  type Provider,
  type ProviderDraft,
  type ProviderStatus,
  type ProviderType,
} from "@/lib/providers/types";
import { RegionSelect } from "@/components/forms/shared/RegionSelect";

interface QuickProviderDialogProps {
  defaultName?: string;
  defaultType?: ProviderType;
  onCreated: (provider: Provider) => void;
  onClose: () => void;
}

/** La fenêtre « Créer un prestataire » : l'essentiel seulement, le reste se complète sur sa fiche. */
export function QuickProviderDialog({ defaultName = "", defaultType = "experience", onCreated, onClose }: QuickProviderDialogProps) {
  const [draft, setDraft] = useState<ProviderDraft>({ ...EMPTY_PROVIDER_DRAFT, name: defaultName, provider_type: defaultType });
  const mutation = useProviderMutation(createProvider);
  const canSave = draft.name.trim() !== "" && !mutation.isPending;

  const save = () => {
    if (!canSave) return;
    mutation.mutate(
      { ...draft, name: draft.name.trim() },
      {
        onSuccess: (provider) => {
          toast.success(`Prestataire « ${provider.name} » créé`);
          onCreated(provider);
        },
        onError: (error) => toast.error(`Création impossible : ${errorMessage(error)}`),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un prestataire</DialogTitle>
          <DialogDescription>L'essentiel pour commencer. Contacts, commission et conditions se complètent sur sa fiche.</DialogDescription>
        </DialogHeader>

        {/* Pas de <form> : cette fenêtre s'ouvre depuis d'autres formulaires, qu'elle ne doit pas envoyer. */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="quick-provider-name">Nom *</Label>
            <Input
              id="quick-provider-name"
              value={draft.name}
              autoFocus
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  save();
                }
              }}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="quick-provider-type">Type</Label>
              <Select value={draft.provider_type} onValueChange={(v) => setDraft((d) => ({ ...d, provider_type: v as ProviderType }))}>
                <SelectTrigger id="quick-provider-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quick-provider-status">Statut</Label>
              <Select value={draft.status} onValueChange={(v) => setDraft((d) => ({ ...d, status: v as ProviderStatus }))}>
                <SelectTrigger id="quick-provider-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quick-provider-region">Région</Label>
            <RegionSelect id="quick-provider-region" value={draft.region_id} onChange={(region_id) => setDraft((d) => ({ ...d, region_id }))} />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="button" disabled={!canSave} onClick={save}>
            {mutation.isPending ? "Création…" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
