/**
 * Table des demandes de dates reçues pour les expériences "Experience Only"
 * marquées "sur demande" (is_bookable = false). Une demande n'est pas une
 * réservation : elle doit être traitée manuellement (contact du prestataire,
 * confirmation du prix), puis éventuellement convertie en réservation via
 * CreateManualStandaloneBookingDialog.
 */
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import CreateManualStandaloneBookingDialog from "@/components/admin/CreateManualStandaloneBookingDialog";

const REQUESTS_QUERY_KEY = ["admin-standalone-experience-requests"];

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  new: { label: "Nouveau", variant: "default" },
  contacted: { label: "Contacté", variant: "secondary" },
  converted: { label: "Converti", variant: "outline" },
  closed: { label: "Sans suite", variant: "destructive" },
};

const StandaloneRequestsTable = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [convertRequest, setConvertRequest] = useState<any | null>(null);

  const { data: requests, isLoading } = useQuery({
    queryKey: REQUESTS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("standalone_experience_requests")
        .select("id, experience_id, customer_name, customer_email, customer_phone, requested_date, adults, children, message, status, created_at, standalone_experiences(title, currency)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = useMemo(() => {
    if (!requests) return [];
    if (statusFilter === "all") return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  const newCount = requests?.filter((r) => r.status === "new").length ?? 0;

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any)
        .from("standalone_experience_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: REQUESTS_QUERY_KEY }),
    onError: () => toast.error("Impossible de mettre à jour le statut"),
  });

  const handleBookingCreated = (requestId: string) => {
    updateStatusMutation.mutate({ id: requestId, status: "converted" });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les demandes</SelectItem>
            <SelectItem value="new">Nouveau{newCount > 0 ? ` (${newCount})` : ""}</SelectItem>
            <SelectItem value="contacted">Contacté</SelectItem>
            <SelectItem value="converted">Converti</SelectItem>
            <SelectItem value="closed">Sans suite</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : filtered.length > 0 ? (
        <div className="border rounded-lg bg-card overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Expérience</TableHead>
                <TableHead>Date souhaitée</TableHead>
                <TableHead>Pers.</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Reçu le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="font-medium text-sm">{request.customer_name}</div>
                    <a href={`mailto:${request.customer_email}`} className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
                      <Mail className="h-3 w-3" />{request.customer_email}
                    </a>
                    {request.customer_phone && (
                      <a href={`tel:${request.customer_phone}`} className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
                        <Phone className="h-3 w-3" />{request.customer_phone}
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{request.standalone_experiences?.title || "—"}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {request.requested_date ? format(parseISO(request.requested_date), "dd MMM yyyy") : "Non précisée"}
                  </TableCell>
                  <TableCell>{request.adults + request.children}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[220px] truncate" title={request.message || undefined}>
                    {request.message || "—"}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={request.status}
                      onValueChange={(status) => updateStatusMutation.mutate({ id: request.id, status })}
                    >
                      <SelectTrigger className="w-[130px] h-8">
                        <SelectValue>
                          <Badge variant={STATUS_LABELS[request.status]?.variant ?? "outline"}>
                            {STATUS_LABELS[request.status]?.label ?? request.status}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([value, { label }]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(parseISO(request.created_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={request.status === "converted"}
                      onClick={() => setConvertRequest(request)}
                    >
                      Convertir en réservation
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-card">
          <p className="text-muted-foreground">Aucune demande pour le moment</p>
        </div>
      )}

      <CreateManualStandaloneBookingDialog
        open={!!convertRequest}
        onOpenChange={(open) => { if (!open) setConvertRequest(null); }}
        duplicateFrom={convertRequest ? {
          standalone_experience_id: convertRequest.experience_id,
          booking_date: convertRequest.requested_date || "",
          adults_count: convertRequest.adults,
          children_count: convertRequest.children,
          customer_name: convertRequest.customer_name,
          customer_email: convertRequest.customer_email,
          customer_phone: convertRequest.customer_phone,
          internal_notes: convertRequest.message ? `Demande initiale : ${convertRequest.message}` : undefined,
        } : null}
        onBookingCreated={() => {
          if (convertRequest) handleBookingCreated(convertRequest.id);
          setConvertRequest(null);
        }}
      />
    </div>
  );
};

export default StandaloneRequestsTable;
