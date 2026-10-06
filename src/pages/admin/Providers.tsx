import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Star, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { toast } from "sonner";
import { ProviderPolicyBadge } from "@/components/admin/ProviderPolicyBadge";

type Provider = {
  id: string;
  name: string;
  whatsapp: string | null;
  email: string | null;
  language: string | null;
  conditions: string | null;
  cancellation_weather_policy: string | null;
  policy_validated: boolean;
  internal_notes: string | null;
  is_active: boolean;
};

type ProviderFormState = {
  name: string;
  whatsapp: string;
  email: string;
  language: string;
  conditions: string;
  cancellation_weather_policy: string;
  policy_validated: boolean;
  internal_notes: string;
};

const emptyForm: ProviderFormState = {
  name: "",
  whatsapp: "",
  email: "",
  language: "",
  conditions: "",
  cancellation_weather_policy: "",
  policy_validated: false,
  internal_notes: "",
};

function toFormState(provider: Provider): ProviderFormState {
  return {
    name: provider.name,
    whatsapp: provider.whatsapp ?? "",
    email: provider.email ?? "",
    language: provider.language ?? "",
    conditions: provider.conditions ?? "",
    cancellation_weather_policy: provider.cancellation_weather_policy ?? "",
    policy_validated: provider.policy_validated,
    internal_notes: provider.internal_notes ?? "",
  };
}

export default function AdminProviders() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ProviderFormState>(emptyForm);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { data: providers, isLoading } = useQuery({
    queryKey: ["admin-providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("providers")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Provider[];
    },
  });

  // Note moyenne et nombre d'avis publiés par prestataire, pour repérer une note qui baisse.
  const { data: reviewStatsByProvider } = useQuery({
    queryKey: ["admin-providers-review-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("provider_id, rating")
        .eq("moderation_status", "published")
        .not("provider_id", "is", null);
      if (error) throw error;
      const stats: Record<string, { sum: number; count: number }> = {};
      (data || []).forEach((r: { provider_id: string; rating: number | null }) => {
        if (r.rating == null) return;
        if (!stats[r.provider_id]) stats[r.provider_id] = { sum: 0, count: 0 };
        stats[r.provider_id].sum += r.rating;
        stats[r.provider_id].count += 1;
      });
      return stats;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        whatsapp: form.whatsapp.trim() || null,
        email: form.email.trim() || null,
        language: form.language.trim() || null,
        conditions: form.conditions.trim() || null,
        cancellation_weather_policy: form.cancellation_weather_policy.trim() || null,
        policy_validated: form.policy_validated,
        internal_notes: form.internal_notes.trim() || null,
      };
      if (editingId) {
        const { error } = await supabase.from("providers").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("providers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      toast.success(editingId ? "Prestataire mis à jour" : "Prestataire créé");
      setFormOpen(false);
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("providers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-providers"] });
      toast.success("Prestataire supprimé");
      setPendingDeleteId(null);
    },
    onError: () => {
      toast.error("Impossible de supprimer : ce prestataire est probablement lié à une fiche expérience ou une réservation.");
      setPendingDeleteId(null);
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (provider: Provider) => {
    setEditingId(provider.id);
    setForm(toFormState(provider));
    setFormOpen(true);
  };

  const list = providers ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Prestataires</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Contact, langue, conditions et politique annulation/météo. Tant que la politique n'est pas
            validée, le badge rouge apparaît partout où le prestataire est utilisé.
          </p>
        </div>
        <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un prestataire
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Nom</TableHead>
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">WhatsApp</TableHead>
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Email</TableHead>
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Langue</TableHead>
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Politique</TableHead>
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Avis</TableHead>
              <TableHead className="h-8 w-[90px] px-3 text-[10px] uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-sm">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-sm text-muted-foreground">
                  Aucun prestataire pour l'instant
                </TableCell>
              </TableRow>
            ) : (
              list.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="py-2 px-3 text-sm font-medium">{provider.name}</TableCell>
                  <TableCell className="py-2 px-3 text-xs">{provider.whatsapp || "-"}</TableCell>
                  <TableCell className="py-2 px-3 text-xs">{provider.email || "-"}</TableCell>
                  <TableCell className="py-2 px-3 text-xs">{provider.language || "-"}</TableCell>
                  <TableCell className="py-2 px-3">
                    {provider.policy_validated ? (
                      <span className="text-xs text-muted-foreground">Validée</span>
                    ) : (
                      <ProviderPolicyBadge policyValidated={false} />
                    )}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-xs">
                    {(() => {
                      const stats = reviewStatsByProvider?.[provider.id];
                      if (!stats || stats.count === 0) return <span className="text-muted-foreground">-</span>;
                      const avg = stats.sum / stats.count;
                      return (
                        <span className={`flex items-center gap-1 ${avg < 4 ? "text-destructive" : ""}`}>
                          {avg < 4 && <AlertTriangle className="h-3 w-3" />}
                          <Star className="h-3 w-3 fill-current" /> {avg.toFixed(1)} ({stats.count})
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(provider)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setPendingDeleteId(provider.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier le prestataire" : "Nouveau prestataire"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="provider-name">Nom</Label>
              <Input
                id="provider-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex : Seamona"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="provider-whatsapp">WhatsApp</Label>
                <Input
                  id="provider-whatsapp"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="+972..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="provider-email">Email</Label>
                <Input
                  id="provider-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="provider-language">Langue de communication</Label>
              <Input
                id="provider-language"
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                placeholder="Hébreu, anglais..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="provider-conditions">Conditions</Label>
              <Textarea
                id="provider-conditions"
                value={form.conditions}
                onChange={(e) => setForm({ ...form, conditions: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="provider-policy">Politique annulation / météo</Label>
              <Textarea
                id="provider-policy"
                value={form.cancellation_weather_policy}
                onChange={(e) => setForm({ ...form, cancellation_weather_policy: e.target.value })}
                rows={3}
                placeholder="Annulation gratuite jusqu'à 72h avant, ensuite non remboursable. Mer agitée : le skipper décide, client choisit report ou remboursement intégral."
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="provider-policy-validated">Politique validée par le prestataire</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tant que ce n'est pas coché, le badge rouge s'affiche partout où ce prestataire apparaît.
                </p>
              </div>
              <Switch
                id="provider-policy-validated"
                checked={form.policy_validated}
                onCheckedChange={(checked) => setForm({ ...form, policy_validated: checked })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="provider-notes">Notes internes</Label>
              <Textarea
                id="provider-notes"
                value={form.internal_notes}
                onChange={(e) => setForm({ ...form, internal_notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!form.name.trim() || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce prestataire ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Si ce prestataire est encore lié à une fiche expérience ou
              une réservation, la suppression sera refusée : il faut d'abord le détacher.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => pendingDeleteId && deleteMutation.mutate(pendingDeleteId)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
