/**
 * EditStandaloneRequestDialog
 * Permet de corriger les champs d'une demande de dates ("sur demande") déjà
 * reçue — coordonnées client, date souhaitée, nombre de personnes, message,
 * notes internes — sans passer par la conversion en réservation. Modifie la
 * ligne standalone_experience_requests en place (UPDATE), contrairement à
 * CreateManualStandaloneBookingDialog qui crée toujours une nouvelle entité.
 */

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "new", label: "Nouveau" },
  { value: "contacted", label: "Contacté" },
  { value: "converted", label: "Converti" },
  { value: "closed", label: "Sans suite" },
];

const REQUESTS_QUERY_KEY = ["admin-standalone-experience-requests"];

const EMPTY_FORM = {
  customer_name: "",
  customer_email: "",
  customer_phone: "",
  requested_date: "",
  adults: 1,
  children: 0,
  message: "",
  internal_notes: "",
  status: "new",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: any | null;
}

const EditStandaloneRequestDialog = ({ open, onOpenChange, request }: Props) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open || !request) return;
    setForm({
      customer_name: request.customer_name || "",
      customer_email: request.customer_email || "",
      customer_phone: request.customer_phone || "",
      requested_date: request.requested_date || "",
      adults: request.adults ?? 1,
      children: request.children ?? 0,
      message: request.message || "",
      internal_notes: request.internal_notes || "",
      status: request.status || "new",
    });
  }, [open, request]);

  const updateRequestMutation = useMutation({
    mutationFn: async () => {
      if (!request) throw new Error("Demande introuvable");
      const { error } = await (supabase as any)
        .from("standalone_experience_requests")
        .update({
          customer_name: form.customer_name,
          customer_email: form.customer_email,
          customer_phone: form.customer_phone || null,
          requested_date: form.requested_date || null,
          adults: form.adults,
          children: form.children,
          message: form.message || null,
          internal_notes: form.internal_notes || null,
          status: form.status,
        })
        .eq("id", request.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REQUESTS_QUERY_KEY });
      toast.success("Demande mise à jour");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error("Erreur", { description: e.message }),
  });

  const canSubmit = !!form.customer_name.trim() && !!form.customer_email.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier la demande</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {request?.standalone_experiences?.title && (
            <p className="text-sm text-muted-foreground">
              Expérience : <span className="font-medium text-foreground">{request.standalone_experiences.title}</span>
            </p>
          )}

          <div className="space-y-1.5">
            <Label>Nom du client *</Label>
            <Input
              value={form.customer_name}
              onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email du client *</Label>
              <Input
                type="email"
                value={form.customer_email}
                onChange={(e) => setForm((f) => ({ ...f, customer_email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Téléphone</Label>
              <Input
                value={form.customer_phone}
                onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Date souhaitée</Label>
            <Input
              type="date"
              value={form.requested_date}
              onChange={(e) => setForm((f) => ({ ...f, requested_date: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Adultes *</Label>
              <Input
                type="number"
                min={1}
                value={form.adults}
                onChange={(e) => setForm((f) => ({ ...f, adults: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Enfants</Label>
              <Input
                type="number"
                min={0}
                value={form.children}
                onChange={(e) => setForm((f) => ({ ...f, children: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Statut</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Message du client</Label>
            <Textarea
              rows={3}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Notes internes <span className="text-muted-foreground font-normal">(non visibles du client)</span></Label>
            <Textarea
              rows={2}
              placeholder="ex: contacté le..., prestataire indisponible..."
              value={form.internal_notes}
              onChange={(e) => setForm((f) => ({ ...f, internal_notes: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => updateRequestMutation.mutate()}
            disabled={!canSubmit || updateRequestMutation.isPending}
          >
            {updateRequestMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditStandaloneRequestDialog;
