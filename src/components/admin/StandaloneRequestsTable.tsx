/**
 * Table des demandes de dates reçues pour les expériences "Experience Only"
 * marquées "sur demande" (is_bookable = false). Une demande n'est pas une
 * réservation : elle doit être traitée manuellement (contact du prestataire,
 * confirmation du prix), puis éventuellement convertie en réservation via
 * CreateManualStandaloneBookingDialog.
 *
 * Suivi par étapes (bateaux et au-delà) : Nouvelle → Envoyée au prestataire →
 * Dispo OK (ouvre directement la conversion en réservation, pour fixer le
 * prix avant de générer un lien de paiement) ou Refusée/annulée. Badge urgent
 * (sortie demandée aujourd'hui/demain) et alertes de délai (15 min avant envoi
 * au prestataire, 1h sans réponse) — colonnes génériques, utiles dès qu'une
 * demande a ces informations, pas seulement les bateaux.
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
import { format, parseISO, differenceInMinutes } from "date-fns";
import { Mail, Phone, MessageCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import CreateManualStandaloneBookingDialog from "@/components/admin/CreateManualStandaloneBookingDialog";
import EditStandaloneRequestDialog from "@/components/admin/EditStandaloneRequestDialog";
import { buildProviderMessage, buildWhatsAppLink, durationLabel } from "@/lib/reservations/whatsapp";

const REQUESTS_QUERY_KEY = ["admin-standalone-experience-requests"];

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  new: { label: "Nouvelle", variant: "default" },
  sent_to_provider: { label: "Envoyée au prestataire", variant: "secondary" },
  availability_confirmed: { label: "Dispo OK", variant: "outline" },
  contacted: { label: "Contacté", variant: "secondary" },
  converted: { label: "Convertie", variant: "outline" },
  closed: { label: "Refusée / annulée", variant: "destructive" },
};

// Alerte de délai : pas envoyée au prestataire après 15 min, ou pas de réponse après 1h.
function getSlaAlert(request: any): string | null {
  const now = new Date();
  if (request.status === "new" && !request.sent_to_provider_at) {
    const minutesSinceCreated = differenceInMinutes(now, new Date(request.created_at));
    if (minutesSinceCreated > 15) return `Pas encore envoyée au prestataire (${minutesSinceCreated} min)`;
  }
  if (request.status === "sent_to_provider" && !request.provider_responded_at) {
    const minutesSinceSent = differenceInMinutes(now, new Date(request.sent_to_provider_at));
    if (minutesSinceSent > 60) return `Prestataire n'a pas répondu (${Math.round(minutesSinceSent / 60)}h)`;
  }
  return null;
}

interface StandaloneRequestsTableProps {
  // Ne montre que les demandes dont l'expérience liée appartient à cette catégorie.
  categoryId?: string;
  // Ajoute une colonne avec un lien WhatsApp pré-rempli pour recontacter le client.
  showWhatsAppLink?: boolean;
}

const StandaloneRequestsTable = ({ categoryId, showWhatsAppLink }: StandaloneRequestsTableProps) => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [convertRequest, setConvertRequest] = useState<any | null>(null);
  const [editRequest, setEditRequest] = useState<any | null>(null);

  const queryKey = categoryId ? [...REQUESTS_QUERY_KEY, categoryId] : REQUESTS_QUERY_KEY;

  const { data: requests, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const experienceJoin = categoryId ? "standalone_experiences!inner" : "standalone_experiences";
      let query = (supabase as any)
        .from("standalone_experience_requests")
        .select(`
          id, experience_id, customer_name, customer_email, customer_phone, requested_date, adults, children,
          party_max, message, internal_notes, status, created_at, is_urgent, source,
          desired_time_period, desired_time_value, requested_duration_minutes, preferred_city,
          sent_to_provider_at, provider_responded_at,
          ${experienceJoin}(title, supplier_boat_name, currency, category_id, provider_id, providers(name, whatsapp))
        `)
        .order("created_at", { ascending: false });
      if (categoryId) {
        query = query.eq("standalone_experiences.category_id", categoryId);
      }
      const { data, error } = await query;
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await (supabase as any).from("standalone_experience_requests").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: () => toast.error("Impossible de mettre à jour la demande"),
  });

  // Rattache la demande à sa réservation et la passe en "convertie" en une seule opération
  // côté base (tout ou rien) : la demande disparaît de la liste, seule la réservation reste.
  const handleBookingCreated = async (requestId: string, bookingId: string) => {
    const { error } = await (supabase as any).rpc("link_request_to_booking", {
      p_request_id: requestId,
      p_booking_id: bookingId,
    });
    if (error) {
      toast.error("Réservation créée, mais la demande n'a pas pu être marquée convertie", { description: error.message });
      return;
    }
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ["admin-reservations-unified"] });
  };

  const sendToProvider = (request: any) => {
    const provider = request.standalone_experiences?.providers;
    if (!provider?.whatsapp) return;
    window.open(buildWhatsAppLink(provider.whatsapp, buildProviderMessage(request)), "_blank");
    if (!request.sent_to_provider_at) {
      updateMutation.mutate({ id: request.id, updates: { status: request.status === "new" ? "sent_to_provider" : request.status, sent_to_provider_at: new Date().toISOString() } });
    }
  };

  const markAvailabilityConfirmed = (request: any) => {
    updateMutation.mutate({
      id: request.id,
      updates: { status: "availability_confirmed", provider_responded_at: request.provider_responded_at ?? new Date().toISOString() },
    });
    // Ouvre directement la conversion en réservation : le prix doit être confirmé
    // par l'admin avant de pouvoir générer un lien de paiement (jamais automatique).
    setConvertRequest(request);
  };

  const markNotAvailable = (request: any) => {
    updateMutation.mutate({
      id: request.id,
      updates: { status: "closed", provider_responded_at: request.provider_responded_at ?? new Date().toISOString() },
    });
  };

  const notifyClientNotAvailable = (request: any) => {
    if (!request.customer_phone) return;
    const city = request.standalone_experiences?.city || request.preferred_city || "";
    const boatLink = `https://staymakom.com/boat${city ? `?city=${encodeURIComponent(city)}` : ""}`;
    const text = request.customer_email
      ? `Bonjour ${request.customer_name || ""}, ce créneau n'est finalement pas disponible. Voici d'autres bateaux qui pourraient vous convenir : ${boatLink}`
      : `Hi, this slot isn't available after all. Here are other boats that might work: ${boatLink}`;
    window.open(buildWhatsAppLink(request.customer_phone, text), "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les demandes</SelectItem>
            <SelectItem value="new">Nouvelle{newCount > 0 ? ` (${newCount})` : ""}</SelectItem>
            <SelectItem value="sent_to_provider">Envoyée au prestataire</SelectItem>
            <SelectItem value="availability_confirmed">Dispo OK</SelectItem>
            <SelectItem value="converted">Convertie</SelectItem>
            <SelectItem value="closed">Refusée / annulée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : filtered.length > 0 ? (
        <div className="border rounded-lg bg-card overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Expérience</TableHead>
                <TableHead>Date / durée</TableHead>
                <TableHead>Pers.</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Alerte</TableHead>
                <TableHead>Reçu le</TableHead>
                <TableHead>Actions rapides</TableHead>
                {showWhatsAppLink && <TableHead>Client</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((request) => {
                const slaAlert = getSlaAlert(request);
                const provider = request.standalone_experiences?.providers;
                return (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="font-medium text-sm flex items-center gap-1.5">
                        {request.customer_name || <span className="text-muted-foreground italic">Non renseigné</span>}
                        {request.is_urgent && <Badge variant="destructive" className="text-[10px]">Urgent</Badge>}
                      </div>
                      {request.customer_email && (
                        <a href={`mailto:${request.customer_email}`} className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
                          <Mail className="h-3 w-3" />{request.customer_email}
                        </a>
                      )}
                      {request.customer_phone && (
                        <a href={`tel:${request.customer_phone}`} className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
                          <Phone className="h-3 w-3" />{request.customer_phone}
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{request.standalone_experiences?.title || request.preferred_city || "-"}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {request.requested_date ? format(parseISO(request.requested_date), "dd MMM yyyy") : "Non précisée"}
                      {request.requested_duration_minutes && <span className="text-muted-foreground"> · {durationLabel(request.requested_duration_minutes)}</span>}
                    </TableCell>
                    <TableCell>
                      {request.party_max ? `${request.adults}-${request.party_max}` : request.adults + request.children}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={request.status}
                        onValueChange={(status) => updateMutation.mutate({ id: request.id, updates: { status } })}
                      >
                        <SelectTrigger className="w-[150px] h-8">
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
                    <TableCell>
                      {slaAlert && (
                        <span className="inline-flex items-center gap-1 text-xs text-destructive font-medium">
                          <AlertTriangle className="h-3.5 w-3.5" /> {slaAlert}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(parseISO(request.created_at), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        {(request.status === "new" || request.status === "sent_to_provider") && provider?.whatsapp && (
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => sendToProvider(request)}>
                            <MessageCircle className="h-3 w-3 mr-1 text-green-700" /> Envoyer au prestataire
                          </Button>
                        )}
                        {request.status === "sent_to_provider" && (
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => markAvailabilityConfirmed(request)}>
                              Dispo confirmée
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => markNotAvailable(request)}>
                              Pas dispo
                            </Button>
                          </div>
                        )}
                        {request.status === "closed" && request.customer_phone && (
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => notifyClientNotAvailable(request)}>
                            <MessageCircle className="h-3 w-3 mr-1 text-green-700" /> Prévenir client
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    {showWhatsAppLink && (
                      <TableCell>
                        {request.customer_phone ? (
                          <a
                            href={buildWhatsAppLink(request.customer_phone, `Bonjour ${request.customer_name || ""}, je vous recontacte au sujet de votre demande sur STAYMAKOM.`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-green-700 hover:underline"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Contacter
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditRequest(request)}
                      >
                        Modifier
                      </Button>
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
                );
              })}
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
          internal_notes: [
            convertRequest.party_max ? `Fourchette demandée : ${convertRequest.adults}-${convertRequest.party_max} personnes` : null,
            convertRequest.message ? `Demande initiale : ${convertRequest.message}` : null,
          ].filter(Boolean).join(" · ") || undefined,
        } : null}
        onBookingCreated={(bookingId) => {
          if (convertRequest) handleBookingCreated(convertRequest.id, bookingId);
          setConvertRequest(null);
        }}
      />

      <EditStandaloneRequestDialog
        open={!!editRequest}
        onOpenChange={(open) => { if (!open) setEditRequest(null); }}
        request={editRequest}
      />
    </div>
  );
};

export default StandaloneRequestsTable;
