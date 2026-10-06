/**
 * Onglet Itinéraire, au-dessus des dossiers payés : les demandes de voyage sur mesure reçues
 * par le site (formulaire « Design my stay », table `itinerary_requests`). Ce ne sont pas
 * encore des réservations : on suit ici où en est chaque demande, jusqu'à ce qu'elle devienne
 * un dossier dans l'espace Dossiers.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildWhatsAppLink } from "@/lib/reservations/whatsapp";
import type { Database } from "@/integrations/supabase/types";

type ItineraryRequest = Database["public"]["Tables"]["itinerary_requests"]["Row"];

const QUERY_KEY = ["admin-itinerary-requests"];

const WORKFLOW_OPTIONS = [
  { value: "non_traite", label: "Non traitée" },
  { value: "message_envoye", label: "Message envoyé" },
  { value: "en_cours_creation", label: "En cours de création" },
  { value: "cree_envoye", label: "Créée et envoyée" },
];
// Une demande « créée et envoyée » est terminée : elle vit ensuite dans l'espace Dossiers.
const DONE_STATUS = "cree_envoye";

function summary(request: ItineraryRequest): string {
  return [
    request.occasion,
    request.party_size ? `${request.party_size} pers.` : null,
    request.requested_dates || request.timing,
    request.region,
    request.budget_hint,
  ]
    .filter(Boolean)
    .join(" · ");
}

const ItineraryRequestsSection = () => {
  const queryClient = useQueryClient();
  const [showDone, setShowDone] = useState(false);

  const { data: requests } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from("itinerary_requests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as ItineraryRequest[];
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ItineraryRequest> }) => {
      const { error } = await supabase.from("itinerary_requests").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
    onError: (error: Error) => toast.error("Erreur de sauvegarde", { description: error.message }),
  });

  if (!requests || requests.length === 0) return null;
  const open = requests.filter((r) => r.workflow_status !== DONE_STATUS);
  const doneCount = requests.length - open.length;
  const visible = showDone ? requests : open;

  return (
    <section className="space-y-2">
      <h2 className="flex flex-wrap items-baseline gap-2 text-xs">
        <span className="font-semibold uppercase tracking-wider text-foreground">Demandes de voyage</span>
        <span className="tabular-nums text-muted-foreground">{open.length}</span>
        <span className="text-muted-foreground">· reçues par le site, pas encore des réservations</span>
        {doneCount > 0 && (
          <button type="button" onClick={() => setShowDone((v) => !v)} className="text-muted-foreground underline underline-offset-2 hover:text-foreground">
            {showDone ? "Masquer les demandes terminées" : `Voir les ${doneCount} terminée${doneCount > 1 ? "s" : ""}`}
          </button>
        )}
      </h2>
      {visible.length === 0 ? (
        <div className="rounded-lg border bg-card py-6 text-center text-sm text-muted-foreground">
          Toutes les demandes de voyage ont été traitées.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow>
                <TableHead>Reçue le</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Demande</TableHead>
                <TableHead>Suivi</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((request) => (
                <TableRow key={request.id} className="bg-muted/40">
                  <TableCell className="whitespace-nowrap tabular-nums">{format(parseISO(request.created_at), "dd/MM")}</TableCell>
                  <TableCell>
                    <div className="font-medium">{request.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{request.customer_email}</div>
                  </TableCell>
                  <TableCell className="max-w-[320px]">
                    <div className="truncate text-sm">{summary(request) || "Sans précision"}</div>
                    {request.description && (
                      <div className="truncate text-xs text-muted-foreground" title={request.description}>
                        {request.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={request.workflow_status}
                      onValueChange={(workflow_status) => update.mutate({ id: request.id, patch: { workflow_status } })}
                    >
                      <SelectTrigger className="h-8 w-[190px] text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WORKFLOW_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      key={request.internal_notes ?? ""}
                      defaultValue={request.internal_notes ?? ""}
                      placeholder="Note de suivi"
                      aria-label={`Note de suivi, ${request.customer_name}`}
                      className="h-8 min-w-[180px] text-sm"
                      onBlur={(e) => {
                        const notes = e.target.value.trim() || null;
                        if (notes !== (request.internal_notes ?? null)) update.mutate({ id: request.id, patch: { internal_notes: notes } });
                      }}
                    />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {request.customer_phone ? (
                      <Button asChild size="sm" variant={request.workflow_status === "non_traite" ? "default" : "outline"}>
                        <a
                          href={buildWhatsAppLink(
                            request.customer_phone,
                            `Bonjour ${request.customer_name}, ici Shana de Staymakom. J'ai bien reçu votre demande de voyage sur mesure et je reviens vers vous pour en parler.`,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Contacter sur WhatsApp
                        </a>
                      </Button>
                    ) : (
                      <a href={`mailto:${request.customer_email}`} className="text-xs underline underline-offset-2">
                        Écrire par email
                      </a>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
};

export default ItineraryRequestsSection;
