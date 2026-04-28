import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Check, Save, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

type TicketStatus = "pending" | "in_progress" | "done" | "failed";
type Provider = { name: string; type: string; contact?: string; url?: string; price_range?: string; notes?: string; is_backup?: boolean };
type Step = { order: number; label: string; action_type: string };

const TICKET_STATUS_CONFIG: Record<TicketStatus, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-amber-100 text-amber-700" },
  in_progress: { label: "En cours", className: "bg-blue-100 text-blue-700" },
  done: { label: "Traité", className: "bg-green-100 text-green-700" },
  failed: { label: "Échoué", className: "bg-red-100 text-red-700" },
};

export default function AdminReservationDetails() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [opsRef, setOpsRef] = useState("");
  const [opsFileUrl, setOpsFileUrl] = useState("");
  const [opsNotes, setOpsNotes] = useState("");
  const [opsProvider, setOpsProvider] = useState("__none__");

  const { data: booking, isLoading } = useQuery({
    queryKey: ["admin-booking-details", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          experiences(title),
          hotels(name),
          customers(first_name, last_name),
          booking_extras(*)
        `)
        .eq("id", bookingId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!bookingId,
  });

  const { data: opsTicket, isLoading: opsLoading } = useQuery({
    queryKey: ["booking-ops-ticket", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_ops_ticket" as any)
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; status: TicketStatus; steps_status: Record<string, boolean>; assigned_provider: Provider | null; confirmation_ref: string | null; confirmation_file_url: string | null; internal_notes: string | null } | null;
    },
    enabled: !!bookingId,
  });

  const { data: experienceOps } = useQuery({
    queryKey: ["experience-ops-for-booking", booking?.experience_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experience_ops" as any)
        .select("providers, fulfillment_steps")
        .eq("experience_id", booking!.experience_id)
        .maybeSingle();
      if (error) throw error;
      return data as { providers: Provider[]; fulfillment_steps: Step[] } | null;
    },
    enabled: !!booking?.experience_id,
  });

  const createTicketMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("booking_ops_ticket" as any).insert({
        booking_id: bookingId,
        experience_id: booking?.experience_id ?? null,
        status: "pending",
        steps_status: {},
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-ops-ticket", bookingId] });
      toast.success("Ticket Ops créé");
    },
    onError: () => toast.error("Erreur lors de la création du ticket"),
  });

  const updateTicketMutation = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const { error } = await supabase
        .from("booking_ops_ticket" as any)
        .update(patch)
        .eq("id", opsTicket!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-ops-ticket", bookingId] });
      toast.success("Ticket mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const handleSaveOps = () => {
    const assigned = experienceOps?.providers.find((p) => p.name === opsProvider) ?? null;
    updateTicketMutation.mutate({
      confirmation_ref: opsRef || null,
      confirmation_file_url: opsFileUrl || null,
      internal_notes: opsNotes || null,
      assigned_provider: assigned,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "outline", label: "Pending" },
      confirmed: { variant: "default", label: "Confirmed" },
      cancelled: { variant: "destructive", label: "Cancelled" },
      paid: { variant: "default", label: "Paid" },
      hold: { variant: "secondary", label: "On Hold" },
      accepted: { variant: "default", label: "Accepted" },
      failed: { variant: "destructive", label: "Failed" },
    };

    const config = statusConfig[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getExtraStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "outline", label: "Pending" },
      done: { variant: "default", label: "Done" },
      unavailable: { variant: "secondary", label: "Unavailable" },
    };

    const config = statusConfig[status] || { variant: "outline" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Booking not found</p>
      </div>
    );
  }

  // Calculate extras progress
  const totalExtras = booking?.booking_extras?.length || 0;
  const doneExtras = booking?.booking_extras?.filter((e: any) => e.status === 'done').length || 0;
  const pendingExtras = booking?.booking_extras?.filter((e: any) => e.status === 'pending').length || 0;
  const unavailableExtras = booking?.booking_extras?.filter((e: any) => e.status === 'unavailable').length || 0;
  const progressPercentage = totalExtras > 0 ? (doneExtras / totalExtras) * 100 : 0;

  return (
    <div className="p-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/admin/reservations")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Reservations
      </Button>

      <h1 className="font-sans text-4xl font-bold mb-8">Reservation Details</h1>

      {/* Booking Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Booking Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Booking ID</p>
              <p className="font-mono text-xs">{booking.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              {getStatusBadge(booking.status || "pending")}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hotel</p>
              <p>{booking.hotels?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Experience</p>
              <p>{booking.experiences?.title}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p>{booking.customers?.first_name} {booking.customers?.last_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Party Size</p>
              <p>{booking.party_size} guests</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Check-in</p>
              <p>{new Date(booking.checkin).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Check-out</p>
              <p>{new Date(booking.checkout).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Price</p>
              <p className="font-semibold">${booking.total_price} {booking.currency}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="text-xs">{new Date(booking.created_at).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Price Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Experience</span>
            <span>${booking.experience_price_subtotal}</span>
          </div>
          {booking.room_price_subtotal > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Room</span>
              <span>${booking.room_price_subtotal}</span>
            </div>
          )}
          {booking.extras_subtotal > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Extras</span>
              <span>${booking.extras_subtotal}</span>
            </div>
          )}
          <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span>${booking.total_price} {booking.currency}</span>
          </div>
        </CardContent>
      </Card>

      {/* Extras / Tasks Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Extras / Tasks</CardTitle>
            {totalExtras > 0 && (
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {doneExtras} / {totalExtras} completed ({Math.round(progressPercentage)}%)
                </div>
                <div className="flex gap-2 text-xs">
                  {pendingExtras > 0 && <Badge variant="outline">{pendingExtras} pending</Badge>}
                  {unavailableExtras > 0 && <Badge variant="secondary">{unavailableExtras} unavailable</Badge>}
                </div>
              </div>
            )}
          </div>
          {totalExtras > 0 && (
            <Progress value={progressPercentage} className="mt-4" />
          )}
        </CardHeader>
        <CardContent>
          {!booking?.booking_extras || booking.booking_extras.length === 0 ? (
            <p className="text-muted-foreground">No extras for this booking.</p>
          ) : (
            <div className="space-y-4">
              {booking.booking_extras.map((extra: any) => (
                <Card key={extra.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{extra.extra_name}</h3>
                          {getExtraStatusBadge(extra.status)}
                        </div>
                        {extra.extra_type && (
                          <p className="text-sm text-muted-foreground mb-1">
                            Type: {extra.extra_type}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Quantity: {extra.quantity} × ${extra.unit_price} = ${extra.price}
                        </p>
                        {extra.updated_at && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Last updated: {new Date(extra.updated_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {extra.notes && (
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-1">Notes:</p>
                        <p className="text-sm text-muted-foreground">{extra.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fulfillment Ops */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Fulfillment Ops</CardTitle>
            {opsTicket && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${TICKET_STATUS_CONFIG[opsTicket.status]?.className ?? "bg-gray-100 text-gray-700"}`}>
                {TICKET_STATUS_CONFIG[opsTicket.status]?.label ?? opsTicket.status}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {opsLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : !opsTicket ? (
            <div className="flex flex-col items-start gap-2">
              <p className="text-sm text-muted-foreground">Aucun ticket Ops pour cette réservation.</p>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => createTicketMutation.mutate()}
                disabled={createTicketMutation.isPending}
              >
                <Plus className="h-3.5 w-3.5" />
                Créer ticket Ops
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Steps */}
              {experienceOps?.fulfillment_steps?.length ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Avancement ({Object.values(opsTicket.steps_status).filter(Boolean).length}/{experienceOps.fulfillment_steps.length})
                  </p>
                  {experienceOps.fulfillment_steps.map((s) => (
                    <label key={s.order} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!opsTicket.steps_status[s.order]}
                        onChange={(e) =>
                          updateTicketMutation.mutate({
                            steps_status: { ...opsTicket.steps_status, [s.order]: e.target.checked },
                          })
                        }
                        className="h-3.5 w-3.5 accent-[#1A1814]"
                      />
                      <span className={`text-sm ${opsTicket.steps_status[s.order] ? "line-through text-muted-foreground" : ""}`}>
                        {s.order}. {s.label}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.action_type === "auto" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                        {s.action_type === "auto" ? "Auto" : "Manuel"}
                      </span>
                    </label>
                  ))}
                </div>
              ) : null}

              {/* Assigned provider */}
              {experienceOps?.providers?.length ? (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prestataire</p>
                  <Select value={opsProvider} onValueChange={setOpsProvider}>
                    <SelectTrigger className="h-8 text-sm w-64">
                      <SelectValue placeholder="Choisir un prestataire" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Aucun</SelectItem>
                      {experienceOps.providers.map((p) => (
                        <SelectItem key={p.name} value={p.name}>
                          {p.name} {p.is_backup ? "(Backup)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {/* Confirmation ref */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Référence confirmation</p>
                <Input
                  placeholder="N° de confirmation, email, lien..."
                  value={opsRef || opsTicket.confirmation_ref || ""}
                  onChange={(e) => setOpsRef(e.target.value)}
                  className="h-8 text-sm w-full max-w-sm"
                />
              </div>

              {/* File URL */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fichier (URL)</p>
                <Input
                  placeholder="Colle ici l'URL du fichier"
                  value={opsFileUrl || opsTicket.confirmation_file_url || ""}
                  onChange={(e) => setOpsFileUrl(e.target.value)}
                  className="h-8 text-sm w-full max-w-sm"
                />
                {(opsFileUrl || opsTicket.confirmation_file_url) && (
                  <a
                    href={opsFileUrl || opsTicket.confirmation_file_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 underline"
                  >
                    Ouvrir le fichier
                  </a>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes internes</p>
                <Textarea
                  placeholder="Remarques, obstacles, contexte..."
                  value={opsNotes || opsTicket.internal_notes || ""}
                  onChange={(e) => setOpsNotes(e.target.value)}
                  rows={3}
                  className="text-sm resize-none max-w-sm"
                  style={{ background: "#FAF8F4", border: "1px solid #E8E0D4" }}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="gap-1.5 text-xs bg-[#1A1814] text-white hover:bg-[#1A1814]/90"
                  onClick={handleSaveOps}
                  disabled={updateTicketMutation.isPending}
                >
                  <Save className="h-3.5 w-3.5" />
                  Enregistrer
                </Button>
                {opsTicket.status !== "done" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs border-green-500 text-green-700 hover:bg-green-50"
                    onClick={() => updateTicketMutation.mutate({ status: "done" })}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Marquer traité
                  </Button>
                )}
                {opsTicket.status === "done" && (
                  <div className="flex items-center gap-1.5 text-sm text-green-700">
                    <Check className="h-4 w-4" />
                    Ticket traité
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
