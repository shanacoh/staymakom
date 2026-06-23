import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Search, X, Mail, Clock, ExternalLink } from "lucide-react";

const AdminStandaloneBookings = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-standalone-bookings", statusFilter, paymentFilter],
    queryFn: async () => {
      let query = supabase
        .from("standalone_bookings")
        .select(
          "id, customer_name, customer_email, booking_date, time_slot, party_size, sell_price, currency, status, is_cancelled, payment_status, refund_amount, created_at, standalone_experiences(title, supplier_booking_url)"
        )
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
  });

  const filtered = useMemo(() => {
    if (!bookings) return [];
    if (!searchQuery.trim()) return bookings;
    const q = searchQuery.toLowerCase();
    return bookings.filter((b: any) =>
      (b.customer_name || "").toLowerCase().includes(q) ||
      (b.customer_email || "").toLowerCase().includes(q) ||
      (b.standalone_experiences?.title || "").toLowerCase().includes(q)
    );
  }, [bookings, searchQuery]);

  const getStatusBadge = (booking: any) => {
    if (booking.is_cancelled) return <Badge variant="destructive">Annulé</Badge>;
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      confirmed: { variant: "default",     label: "Confirmé" },
      pending:   { variant: "outline",     label: "En attente" },
      cancelled: { variant: "destructive", label: "Annulé" },
    };
    const c = map[booking.status?.toLowerCase()] || { variant: "outline" as const, label: booking.status || "—" };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getPaymentBadge = (booking: any) => {
    const map: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      paid:           { variant: "default",     label: "Payé" },
      refund_pending: { variant: "destructive", label: "Remb. dû" },
      refunded:       { variant: "secondary",   label: "Remboursé" },
      pending:        { variant: "outline",     label: "Impayé" },
      failed:         { variant: "destructive", label: "Échoué" },
    };
    const c = map[booking.payment_status] || { variant: "outline" as const, label: booking.payment_status || "—" };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">Réservations Experience Only</h2>
        <p className="text-sm text-muted-foreground">Toutes les réservations standalone — sans hôtel</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px] max-w-[360px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Nom, email, expérience..."
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
            <SelectItem value="confirmed">Confirmé</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="cancelled">Annulé</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Paiement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les paiements</SelectItem>
            <SelectItem value="paid">Payé</SelectItem>
            <SelectItem value="refund_pending">Remb. dû</SelectItem>
            <SelectItem value="refunded">Remboursé</SelectItem>
            <SelectItem value="pending">Impayé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : filtered.length > 0 ? (
        <div className="border rounded-lg bg-card overflow-x-auto">
          <Table className="min-w-[800px]">
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
                <TableHead>Lien résa</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((booking: any) => (
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
                  <TableCell className="text-sm">{booking.standalone_experiences?.title || "—"}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {booking.booking_date ? format(parseISO(booking.booking_date), "dd MMM yyyy") : "—"}
                  </TableCell>
                  <TableCell>
                    {booking.time_slot ? (
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3" />
                        {booking.time_slot}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>{booking.party_size}</TableCell>
                  <TableCell>
                    <div className="font-medium">{booking.sell_price} {booking.currency}</div>
                  </TableCell>
                  <TableCell>{getStatusBadge(booking)}</TableCell>
                  <TableCell>{getPaymentBadge(booking)}</TableCell>
                  <TableCell>
                    {booking.standalone_experiences?.supplier_booking_url ? (
                      <a
                        href={booking.standalone_experiences.supplier_booking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Réserver
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(parseISO(booking.created_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/standalone-bookings/${booking.id}`)}
                    >
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
            {searchQuery ? "Aucune réservation ne correspond à la recherche" : "Aucune réservation encore"}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminStandaloneBookings;
