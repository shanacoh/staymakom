import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Search, X, AlertTriangle, CheckCircle, Mail, Building2, Zap, Clock } from "lucide-react";

const AdminBookings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"hotel" | "standalone">("hotel");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [hotelFilter, setHotelFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refundDialog, setRefundDialog] = useState<{ open: boolean; bookingId: string | null; revolut: string }>({
    open: false,
    bookingId: null,
    revolut: "",
  });

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-bookings-hg", statusFilter, hotelFilter, paymentFilter],
    queryFn: async () => {
      let query = supabase
        .from("bookings_hg")
        .select("id, hg_booking_id, customer_name, customer_email, checkin, checkout, nights, party_size, sell_price, currency, status, is_cancelled, payment_status, refund_amount, revolut_order_id, revolut_refund_id, refunded_at, cancelled_at, created_at, experiences2(title), hotels2(name, id)")
        .order("created_at", { ascending: false });

      if (statusFilter === "cancelled") {
        query = query.eq("is_cancelled", true);
      } else if (statusFilter !== "all") {
        query = query.eq("status", statusFilter).eq("is_cancelled", false);
      }

      if (hotelFilter !== "all") {
        query = query.eq("hotel_id", hotelFilter);
      }

      if (paymentFilter !== "all") {
        query = query.eq("payment_status", paymentFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: hotels } = useQuery({
    queryKey: ["hotels2-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotels2")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: standaloneBookings, isLoading: isLoadingStandalone } = useQuery({
    queryKey: ["admin-standalone-bookings-hub", statusFilter, paymentFilter],
    queryFn: async () => {
      let query = supabase
        .from("standalone_bookings")
        .select("id, customer_name, customer_email, booking_date, time_slot, party_size, sell_price, currency, status, is_cancelled, payment_status, refund_amount, created_at, standalone_experiences(title)")
        .order("created_at", { ascending: false });
      if (statusFilter === "cancelled") {
        query = query.eq("is_cancelled", true);
      } else if (statusFilter !== "all") {
        query = query.eq("status", statusFilter).eq("is_cancelled", false);
      }
      if (paymentFilter !== "all") {
        query = query.eq("payment_status", paymentFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
    enabled: mode === "standalone",
  });

  const filteredStandaloneBookings = useMemo(() => {
    if (!standaloneBookings) return [];
    if (!searchQuery.trim()) return standaloneBookings;
    const q = searchQuery.toLowerCase();
    return standaloneBookings.filter((b: any) =>
      (b.customer_name || "").toLowerCase().includes(q) ||
      (b.customer_email || "").toLowerCase().includes(q) ||
      ((b.standalone_experiences as any)?.title || "").toLowerCase().includes(q)
    );
  }, [standaloneBookings, searchQuery]);

  const markRefundDoneMutation = useMutation({
    mutationFn: async ({ bookingId, revolut_refund_id }: { bookingId: string; revolut_refund_id: string }) => {
      const { error } = await supabase
        .from("bookings_hg")
        .update({
          payment_status: "refunded",
          revolut_refund_id: revolut_refund_id || null,
          refunded_at: new Date().toISOString(),
        } as any)
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-hg"] });
      setRefundDialog({ open: false, bookingId: null, revolut: "" });
      toast.success("Remboursement confirmé et enregistré");
    },
    onError: (error: any) => {
      toast.error("Erreur", { description: error.message });
    },
  });

  const openRefundDialog = (bookingId: string) => {
    setRefundDialog({ open: true, bookingId, revolut: "" });
  };

  const confirmRefund = () => {
    if (!refundDialog.bookingId) return;
    markRefundDoneMutation.mutate({
      bookingId: refundDialog.bookingId,
      revolut_refund_id: refundDialog.revolut,
    });
  };

  const refundsPending = useMemo(
    () => (bookings || []).filter((b: any) => b.payment_status === "refund_pending"),
    [bookings]
  );

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    if (!searchQuery.trim()) return bookings;
    const q = searchQuery.toLowerCase();
    return bookings.filter((b: any) => {
      return (
        (b.customer_name || "").toLowerCase().includes(q) ||
        (b.customer_email || "").toLowerCase().includes(q) ||
        (b.hotels2?.name || "").toLowerCase().includes(q) ||
        (b.experiences2?.title || "").toLowerCase().includes(q) ||
        (b.hg_booking_id || "").toLowerCase().includes(q)
      );
    });
  }, [bookings, searchQuery]);

  const getStatusBadge = (booking: any) => {
    if (booking.is_cancelled) return <Badge variant="destructive">Cancelled</Badge>;
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      confirmed:     { variant: "default",     label: "Confirmed" },
      pending:       { variant: "outline",      label: "Pending" },
      pendingreview: { variant: "secondary",    label: "Under Review" },
      failed:        { variant: "destructive",  label: "Failed" },
    };
    const c = map[booking.status?.toLowerCase()] || { variant: "outline" as const, label: booking.status || "—" };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getPaymentBadge = (booking: any) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      paid:          { variant: "default",     label: "Paid" },
      refund_pending:{ variant: "destructive", label: "Refund Due" },
      refunded:      { variant: "secondary",   label: "Refunded" },
      unpaid:        { variant: "outline",     label: "Unpaid" },
      no_refund_due: { variant: "outline",     label: "No Refund" },
    };
    const c = map[booking.payment_status] || { variant: "outline" as const, label: booking.payment_status || "—" };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">Bookings</h2>
        <p className="text-sm text-muted-foreground">All reservations</p>
      </div>

      {/* Toggle With Hotel / Experience Only */}
      <div className="inline-flex items-center border border-[#1B2A4A]/20 rounded-full p-1 gap-0.5">
        <button
          onClick={() => setMode("hotel")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            mode === "hotel" ? "bg-[#1B2A4A] text-white" : "text-[#1B2A4A]/60 hover:bg-muted/50"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          With Hotel
        </button>
        <button
          onClick={() => setMode("standalone")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            mode === "standalone" ? "bg-[#1B2A4A] text-white" : "text-[#1B2A4A]/60 hover:bg-muted/50"
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          Experience Only
        </button>
      </div>

      {refundsPending.length > 0 && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 space-y-3">
          <div className="flex items-center gap-2 text-destructive font-semibold">
            <AlertTriangle className="h-5 w-5" />
            {refundsPending.length} réservation{refundsPending.length > 1 ? "s" : ""} nécessite{refundsPending.length > 1 ? "nt" : ""} un remboursement
          </div>
          <div className="space-y-2">
            {refundsPending.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between rounded bg-background p-3 text-sm border">
                <div className="space-y-0.5">
                  <p className="font-medium">{b.customer_name}</p>
                  <a href={`mailto:${b.customer_email}`} className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
                    <Mail className="h-3 w-3" />{b.customer_email}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {b.experiences2?.title || "—"} · Annulé le {b.cancelled_at ? format(parseISO(b.cancelled_at), "dd MMM yyyy") : "—"}
                  </p>
                  {b.refund_amount > 0 ? (
                    <p className="text-sm font-semibold text-destructive">
                      Montant à rembourser : {b.refund_amount} {b.currency}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Montant à vérifier directement avec le client</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => openRefundDialog(b.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Confirmer le remboursement
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px] max-w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Nom, email, hôtel, expérience, ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Paiement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les paiements</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="refund_pending">Refund Due</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>

        {mode === "hotel" && (
          <Select value={hotelFilter} onValueChange={setHotelFilter}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Hôtel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les hôtels</SelectItem>
              {hotels?.map((hotel) => (
                <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* ── Table With Hotel ── */}
      {mode === "hotel" && (isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : filteredBookings.length > 0 ? (
        <div className="border rounded-lg bg-card overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Réf</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Hôtel</TableHead>
                <TableHead>Expérience</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Personnes</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Paiement</TableHead>
                <TableHead>Réservé le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking: any) => (
                <TableRow key={booking.id} className={booking.is_cancelled ? "opacity-60" : ""}>
                  <TableCell className="font-mono text-xs">
                    {(booking.hg_booking_id || booking.id).slice(0, 10)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{booking.customer_name || "—"}</div>
                    {booking.customer_email && (
                      <a href={`mailto:${booking.customer_email}`} className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
                        <Mail className="h-3 w-3" />{booking.customer_email}
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{booking.hotels2?.name || "—"}</TableCell>
                  <TableCell className="text-sm">{booking.experiences2?.title || "—"}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {format(parseISO(booking.checkin), "dd MMM")} → {format(parseISO(booking.checkout), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>{booking.party_size}</TableCell>
                  <TableCell>
                    <div className="font-medium">{booking.sell_price} {booking.currency}</div>
                    {booking.payment_status === "refund_pending" && booking.refund_amount > 0 && (
                      <div className="text-xs text-destructive font-semibold">⚠ Remb. dû : {booking.refund_amount} {booking.currency}</div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(booking)}</TableCell>
                  <TableCell>
                    {getPaymentBadge(booking)}
                    {booking.payment_status === "refunded" && booking.revolut_refund_id && (
                      <div className="text-xs text-muted-foreground mt-1 font-mono">Revolut : {booking.revolut_refund_id}</div>
                    )}
                    {booking.payment_status === "refunded" && booking.refunded_at && (
                      <div className="text-xs text-muted-foreground">le {format(parseISO(booking.refunded_at), "dd MMM yyyy")}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(parseISO(booking.created_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      {booking.payment_status === "refund_pending" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openRefundDialog(booking.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Remb. fait
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/reservations/${booking.id}`)}
                      >
                        Voir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-card">
          <p className="text-muted-foreground">
            {searchQuery ? "Aucune réservation ne correspond à la recherche" : "Aucune réservation trouvée"}
          </p>
        </div>
      ))}

      {/* ── Table Experience Only ── */}
      {mode === "standalone" && (isLoadingStandalone ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : filteredStandaloneBookings.length > 0 ? (
        <div className="border rounded-lg bg-card overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow>
                <TableHead>Réf</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Expérience</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Créneau</TableHead>
                <TableHead>Pers.</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Paiement</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStandaloneBookings.map((booking: any) => (
                <TableRow key={booking.id} className={booking.is_cancelled ? "opacity-60" : ""}>
                  <TableCell className="font-mono text-xs">{booking.id.slice(0, 8)}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{booking.customer_name || "—"}</div>
                    {booking.customer_email && (
                      <a href={`mailto:${booking.customer_email}`} className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
                        <Mail className="h-3 w-3" />{booking.customer_email}
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{(booking.standalone_experiences as any)?.title || "—"}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {booking.booking_date ? format(parseISO(booking.booking_date), "dd MMM yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {booking.time_slot ? (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />{booking.time_slot}
                      </span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>{booking.party_size}</TableCell>
                  <TableCell>
                    <div className="font-medium">{booking.sell_price} {booking.currency}</div>
                    {booking.payment_status === "refund_pending" && booking.refund_amount > 0 && (
                      <div className="text-xs text-destructive font-semibold">⚠ Remb. dû : {booking.refund_amount} {booking.currency}</div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(booking)}</TableCell>
                  <TableCell>{getPaymentBadge(booking)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(parseISO(booking.created_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/standalone-bookings/${booking.id}`)}>
                      Voir
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-card">
          <p className="text-muted-foreground">
            {searchQuery ? "Aucune réservation ne correspond à la recherche" : "Aucune réservation standalone trouvée"}
          </p>
        </div>
      ))}

      <Dialog
        open={refundDialog.open}
        onOpenChange={(open) => !open && setRefundDialog({ open: false, bookingId: null, revolut: "" })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <CheckCircle className="h-5 w-5" />
              Confirmer le remboursement
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Entrez la référence du virement Revolut pour garder une trace de ce remboursement.
            </p>
            <div className="space-y-2">
              <Label htmlFor="revolut-ref">Référence Revolut <span className="text-muted-foreground">(optionnel)</span></Label>
              <Input
                id="revolut-ref"
                placeholder="ex. REV-2026-XXXXXX"
                value={refundDialog.revolut}
                onChange={(e) => setRefundDialog((prev) => ({ ...prev, revolut: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && confirmRefund()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRefundDialog({ open: false, bookingId: null, revolut: "" })}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRefund}
              disabled={markRefundDoneMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Confirmer le remboursement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBookings;
