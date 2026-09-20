/**
 * Onglet "Hôtels" du hub de réservations : vue tableur éditable en ligne sur
 * bookings_hg. Les réservations synchronisées automatiquement par
 * HyperGuest (source = hyperguest_sync) restent visibles et partiellement
 * verrouillées ; la création manuelle passe par l'edge function
 * create-hotel-manual-booking (voir CreateManualHotelBookingDialog).
 */

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, Mail, Search } from "lucide-react";
import BookingsGridTable from "@/components/admin/BookingsGrid/BookingsGridTable";
import {
  HOTEL_COLUMNS,
  HOTEL_INTERACTIVE_COLUMNS,
  type HotelBookingRow,
  type NewHotelBookingDraft,
} from "@/components/admin/BookingsGrid/hotelColumns";
import { formatCurrency } from "@/components/admin/BookingsGrid/columnTypes";
import type { ColumnKey } from "@/components/admin/BookingsGrid/columnTypes";
import RowActionsCell from "./RowActionsCell";
import HotelPartnerCell from "./HotelPartnerCell";
import FiltersPopoverButton from "./FiltersPopoverButton";
import InfoPopoverButton from "./InfoPopoverButton";
import CreateManualHotelBookingDialog from "./CreateManualHotelBookingDialog";

function parseColumnValue(key: ColumnKey, raw: string): { ok: boolean; value?: string | number | null } {
  const trimmed = raw.trim();
  switch (key) {
    case "customer_name":
    case "customer_email":
      return { ok: true, value: trimmed };
    case "internal_notes":
      return { ok: true, value: trimmed === "" ? null : trimmed };
    case "party_size": {
      if (trimmed === "") return { ok: false };
      const n = parseInt(trimmed, 10);
      if (Number.isNaN(n) || n < 1) return { ok: false };
      return { ok: true, value: n };
    }
    case "sell_price":
    case "net_price": {
      if (trimmed === "") return { ok: false };
      const n = parseFloat(trimmed);
      if (Number.isNaN(n) || n < 0) return { ok: false };
      return { ok: true, value: n };
    }
    case "checkin":
    case "checkout":
      if (trimmed === "") return { ok: false };
      return { ok: true, value: trimmed };
    default:
      return { ok: true, value: trimmed };
  }
}

interface Props {
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}

const HotelBookingsGrid = ({ createOpen, onCreateOpenChange }: Props) => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [hotelFilter, setHotelFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newRowDraft] = useState<NewHotelBookingDraft>({});
  const [isCreatingRow] = useState(false);
  const [refundDialog, setRefundDialog] = useState<{ open: boolean; bookingId: string | null; revolut: string }>({
    open: false,
    bookingId: null,
    revolut: "",
  });

  const activeFilterCount = [statusFilter !== "all", hotelFilter !== "all"].filter(Boolean).length;
  const resetFilters = () => {
    setStatusFilter("all");
    setHotelFilter("all");
  };

  const queryKey = ["admin-bookings-hg-grid", statusFilter, hotelFilter] as const;

  const { data: rows, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("bookings_hg")
        .select("*, hotels2(id, name), experiences2(title)")
        .order("created_at", { ascending: false });

      if (statusFilter === "cancelled") {
        query = query.eq("is_cancelled", true);
      } else if (statusFilter !== "all") {
        query = query.eq("status", statusFilter).eq("is_cancelled", false);
      }
      if (hotelFilter !== "all") {
        query = query.eq("hotel_id", hotelFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as HotelBookingRow[];
    },
  });

  const { data: hotels } = useQuery({
    queryKey: ["hotels2-filter"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hotels2").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(
      (r) =>
        (r.customer_name || "").toLowerCase().includes(q) ||
        (r.customer_email || "").toLowerCase().includes(q) ||
        (r.hotels2?.name || "").toLowerCase().includes(q) ||
        (r.hg_booking_id || "").toLowerCase().includes(q),
    );
  }, [rows, searchQuery]);

  const refundsPending = useMemo(() => (rows || []).filter((b) => b.payment_status === "refund_pending"), [rows]);

  const markRefundDoneMutation = useMutation({
    mutationFn: async ({ bookingId, revolut_refund_id }: { bookingId: string; revolut_refund_id: string }) => {
      const { error } = await supabase
        .from("bookings_hg")
        .update({
          payment_status: "refunded",
          revolut_refund_id: revolut_refund_id || null,
          refunded_at: new Date().toISOString(),
        } as never)
        .eq("id", bookingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings-hg-grid"] });
      setRefundDialog({ open: false, bookingId: null, revolut: "" });
      toast.success("Remboursement confirmé et enregistré");
    },
    onError: (error: any) => toast.error("Erreur", { description: error.message }),
  });

  const updateCell = async (rowId: string, key: ColumnKey, rawValue: string): Promise<boolean> => {
    const parsed = parseColumnValue(key, rawValue);
    if (!parsed.ok) {
      toast.error("Valeur invalide");
      return false;
    }
    const { error } = await supabase
      .from("bookings_hg")
      .update({ [key]: parsed.value } as never)
      .eq("id", rowId);
    if (error) {
      toast.error("Erreur de sauvegarde", { description: error.message });
      return false;
    }
    queryClient.setQueryData<HotelBookingRow[]>(queryKey, (old) =>
      old ? old.map((r) => (r.id === rowId ? { ...r, [key]: parsed.value } : r)) : old,
    );
    return true;
  };

  // La création d'une réservation hôtel nécessite plusieurs champs obligatoires
  // à la fois (hôtel, dates, prix) — inadapté à la saisie cellule par cellule.
  // La ligne blanche invite donc à ouvrir le dialog de création manuelle.
  const newRowCommit = async (): Promise<boolean> => {
    onCreateOpenChange(true);
    return false;
  };

  return (
    <div className="space-y-4">
      {refundsPending.length > 0 && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 space-y-3">
          <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
            <AlertTriangle className="h-4 w-4" />
            {refundsPending.length} réservation{refundsPending.length > 1 ? "s" : ""} nécessite
            {refundsPending.length > 1 ? "nt" : ""} un remboursement
          </div>
          <div className="space-y-2">
            {refundsPending.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded bg-background p-3 text-sm border">
                <div className="space-y-0.5">
                  <p className="font-medium">{b.customer_name}</p>
                  {b.customer_email && (
                    <a href={`mailto:${b.customer_email}`} className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
                      <Mail className="h-3 w-3" />{b.customer_email}
                    </a>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {b.hotels2?.name || "—"} · Annulé le {b.cancelled_at ? format(parseISO(b.cancelled_at), "dd MMM yyyy") : "—"}
                  </p>
                  {b.refund_amount > 0 ? (
                    <p className="text-sm font-semibold text-destructive">
                      Montant à rembourser : {formatCurrency(b.refund_amount, b.currency)}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Montant à vérifier directement avec le client</p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setRefundDialog({ open: true, bookingId: b.id, revolut: "" })}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Confirmer le remboursement
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Nom, email, hôtel, ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <FiltersPopoverButton activeCount={activeFilterCount} onReset={resetFilters}>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="confirmed">Confirmé</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Hôtel</Label>
              <Select value={hotelFilter} onValueChange={setHotelFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les hôtels</SelectItem>
                  {hotels?.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FiltersPopoverButton>
          <InfoPopoverButton>
            Les réservations synchronisées automatiquement par HyperGuest sont visibles ici avec leurs champs de
            paiement verrouillés (icône cadenas). Utilisez « Nouvelle réservation » pour une réservation saisie à la main.
          </InfoPopoverButton>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : (
        <BookingsGridTable
          columns={HOTEL_COLUMNS}
          interactiveColumns={HOTEL_INTERACTIVE_COLUMNS}
          rows={filteredRows}
          newRowDraft={newRowDraft}
          isCreatingRow={isCreatingRow}
          onCellCommit={updateCell}
          onNewRowCommit={newRowCommit}
          isRowLocked={(row) => row.source !== "manual_admin"}
          isRowCancelled={(row) => !!row.is_cancelled}
          minWidthClass="min-w-[1500px]"
          lockedDisplayValue={(row, col) => (col.key === "hotel_id" ? row.hotels2?.name || "—" : undefined)}
          customCellRenderers={{
            hotel_id: ({ value, onCommit, className, refCallback }) => (
              <HotelPartnerCell
                key="hotel_id"
                ref={refCallback}
                value={value as string | null}
                displayName={hotels?.find((h) => h.id === value)?.name}
                onCommit={onCommit}
                className={className}
              />
            ),
          }}
          renderReadonlyCell={(row, col) => {
            if (col.key !== "commission") return "—";
            return formatCurrency(row.sell_price - row.net_price, row.currency);
          }}
          renderRowActions={() => <RowActionsCell />}
        />
      )}

      <CreateManualHotelBookingDialog open={createOpen} onOpenChange={onCreateOpenChange} />

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
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialog({ open: false, bookingId: null, revolut: "" })}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                refundDialog.bookingId &&
                markRefundDoneMutation.mutate({ bookingId: refundDialog.bookingId, revolut_refund_id: refundDialog.revolut })
              }
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

export default HotelBookingsGrid;
