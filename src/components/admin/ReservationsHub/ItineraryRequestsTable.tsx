/**
 * Onglet "Itinéraires" du hub de réservations : suivi des demandes
 * d'itinéraire complet reçues via le CTA "Design my stay" du site (et
 * enrichies par le questionnaire de suivi envoyé par email). Une demande
 * n'est pas encore une réservation — elle est traitée manuellement, avec un
 * statut de suivi dédié et un montant renseigné une fois le devis fixé.
 * Première version volontairement simple (liste + statuts) : à faire évoluer
 * une fois l'usage réel connu.
 */

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { Mail, Phone, StickyNote, Info } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import FiltersPopoverButton from "./FiltersPopoverButton";

type ItineraryRequestRow = Database["public"]["Tables"]["itinerary_requests"]["Row"];

const QUERY_KEY = ["admin-itinerary-requests"];

const WORKFLOW_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  non_traite: { label: "Non traité", variant: "destructive" },
  message_envoye: { label: "Message envoyé", variant: "secondary" },
  en_cours_creation: { label: "En cours de création", variant: "default" },
  cree_envoye: { label: "Créé et envoyé", variant: "outline" },
};

const PAYMENT_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  non_paye: { label: "Pas payé", variant: "outline" },
  paye: { label: "Payé", variant: "default" },
};

function formatCurrency(amount: number | null, currency: string) {
  if (amount === null || amount === undefined) return "—";
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₪";
  return `${symbol}${amount.toLocaleString("fr-FR")}`;
}

const ItineraryRequestsTable = () => {
  const queryClient = useQueryClient();
  const [workflowFilter, setWorkflowFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const [amountDraft, setAmountDraft] = useState<Record<string, string>>({});

  const activeFilterCount = [workflowFilter !== "all", paymentFilter !== "all"].filter(Boolean).length;

  const { data: requests, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("itinerary_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ItineraryRequestRow[];
    },
  });

  const filtered = useMemo(() => {
    if (!requests) return [];
    return requests.filter((r) => {
      if (workflowFilter !== "all" && r.workflow_status !== workflowFilter) return false;
      if (paymentFilter !== "all" && r.payment_status !== paymentFilter) return false;
      return true;
    });
  }, [requests, workflowFilter, paymentFilter]);

  const nonTraiteCount = requests?.filter((r) => r.workflow_status === "non_traite").length ?? 0;

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ItineraryRequestRow> }) => {
      const { error } = await supabase.from("itinerary_requests").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    onError: (error: any) => toast.error("Erreur de sauvegarde", { description: error.message }),
  });

  const commitAmount = (id: string, raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === "") {
      updateMutation.mutate({ id, patch: { amount: null } });
      return;
    }
    const n = parseFloat(trimmed);
    if (Number.isNaN(n) || n < 0) {
      toast.error("Montant invalide");
      return;
    }
    updateMutation.mutate({ id, patch: { amount: n } });
  };

  const commitNotes = (id: string, notes: string) => {
    updateMutation.mutate({ id, patch: { internal_notes: notes.trim() || null } });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {nonTraiteCount > 0
            ? `${nonTraiteCount} demande${nonTraiteCount > 1 ? "s" : ""} non traitée${nonTraiteCount > 1 ? "s" : ""}`
            : "Toutes les demandes ont été prises en charge"}
        </p>
        <div className="flex items-center gap-2">
          <FiltersPopoverButton
            activeCount={activeFilterCount}
            onReset={() => {
              setWorkflowFilter("all");
              setPaymentFilter("all");
            }}
          >
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Statut</Label>
              <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {Object.entries(WORKFLOW_LABELS).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Paiement</Label>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {Object.entries(PAYMENT_LABELS).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FiltersPopoverButton>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : filtered.length > 0 ? (
        <div className="border rounded-lg bg-card overflow-x-auto">
          <Table className="min-w-[1200px]">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Client</TableHead>
                <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Occasion / Pers.</TableHead>
                <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Dates / Région</TableHead>
                <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Envie</TableHead>
                <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Statut</TableHead>
                <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Paiement</TableHead>
                <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider text-right">Montant</TableHead>
                <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Reçu le</TableHead>
                <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider text-right">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="py-2 px-3">
                    <div className="font-medium text-sm">{r.customer_name}</div>
                    <a href={`mailto:${r.customer_email}`} className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
                      <Mail className="h-3 w-3" />{r.customer_email}
                    </a>
                    {r.customer_phone && (
                      <a href={`tel:${r.customer_phone}`} className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
                        <Phone className="h-3 w-3" />{r.customer_phone}
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-xs">
                    <div>{r.occasion || "—"}</div>
                    {r.party_size && <div className="text-muted-foreground">{r.party_size} pers.</div>}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-xs">
                    <div>{r.requested_dates || "—"}</div>
                    {r.region && <div className="text-muted-foreground">{r.region}</div>}
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    {(r.budget_hint || r.timing || (r.moods && r.moods.length > 0) || r.description) ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                            <Info className="h-3.5 w-3.5" />
                            Détails
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-80 space-y-2 text-sm">
                          {r.budget_hint && <p><span className="text-muted-foreground">Budget : </span>{r.budget_hint}</p>}
                          {r.timing && <p><span className="text-muted-foreground">Période : </span>{r.timing}</p>}
                          {r.moods && r.moods.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {r.moods.map((m) => (
                                <Badge key={m} variant="secondary" className="text-[10px]">{m}</Badge>
                              ))}
                            </div>
                          )}
                          {r.description && <p className="text-muted-foreground">{r.description}</p>}
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <Select
                      value={r.workflow_status}
                      onValueChange={(v) => updateMutation.mutate({ id: r.id, patch: { workflow_status: v } })}
                    >
                      <SelectTrigger className="w-[170px] h-8">
                        <SelectValue>
                          <Badge variant={WORKFLOW_LABELS[r.workflow_status]?.variant ?? "outline"}>
                            {WORKFLOW_LABELS[r.workflow_status]?.label ?? r.workflow_status}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(WORKFLOW_LABELS).map(([value, { label }]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <Select
                      value={r.payment_status}
                      onValueChange={(v) => updateMutation.mutate({ id: r.id, patch: { payment_status: v } })}
                    >
                      <SelectTrigger className="w-[110px] h-8">
                        <SelectValue>
                          <Badge variant={PAYMENT_LABELS[r.payment_status]?.variant ?? "outline"}>
                            {PAYMENT_LABELS[r.payment_status]?.label ?? r.payment_status}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PAYMENT_LABELS).map(([value, { label }]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="py-2 px-3 text-right">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="—"
                      className="h-8 w-[100px] text-right ml-auto"
                      value={amountDraft[r.id] ?? (r.amount != null ? String(r.amount) : "")}
                      onChange={(e) => setAmountDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                      onBlur={(e) => commitAmount(r.id, e.target.value)}
                    />
                    {r.amount != null && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">{formatCurrency(r.amount, r.currency)}</div>
                    )}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-xs text-muted-foreground whitespace-nowrap">
                    {format(parseISO(r.created_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-right">
                    <Popover onOpenChange={(open) => { if (open) setNotesDraft((d) => ({ ...d, [r.id]: r.internal_notes || "" })); }}>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <StickyNote className={r.internal_notes ? "h-3.5 w-3.5 text-foreground" : "h-3.5 w-3.5 text-muted-foreground"} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-72 space-y-2">
                        <Label className="text-xs text-muted-foreground">Notes internes</Label>
                        <Textarea
                          rows={3}
                          value={notesDraft[r.id] ?? r.internal_notes ?? ""}
                          onChange={(e) => setNotesDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                          onBlur={(e) => commitNotes(r.id, e.target.value)}
                        />
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-card">
          <p className="text-muted-foreground">Aucune demande d'itinéraire pour le moment</p>
        </div>
      )}
    </div>
  );
};

export default ItineraryRequestsTable;
