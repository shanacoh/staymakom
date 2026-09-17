/**
 * Vue tableur des réservations standalone : grille éditable en ligne (façon
 * Excel) pour la saisie rapide, à côté de la page Bookings existante qui
 * reste le mode liste/détail habituel. Mêmes données que StandaloneBookings,
 * juste une autre façon de les modifier.
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BookingsGridTable from "@/components/admin/BookingsGrid/BookingsGridTable";
import {
  NEW_ROW_DEFAULTS,
  type BookingRow,
  type ColumnKey,
  type NewBookingDraft,
} from "@/components/admin/BookingsGrid/columns";

function parseColumnValue(key: ColumnKey, raw: string): { ok: boolean; value?: string | number | null } {
  const trimmed = raw.trim();
  switch (key) {
    case "customer_name":
    case "customer_email":
      return { ok: true, value: trimmed };
    case "customer_phone":
    case "custom_experience_title":
    case "supplier_name":
    case "time_slot":
    case "internal_notes":
      return { ok: true, value: trimmed === "" ? null : trimmed };
    case "party_size": {
      if (trimmed === "") return { ok: false };
      const n = parseInt(trimmed, 10);
      if (Number.isNaN(n) || n < 1) return { ok: false };
      return { ok: true, value: n };
    }
    case "sell_price": {
      if (trimmed === "") return { ok: false };
      const n = parseFloat(trimmed);
      if (Number.isNaN(n) || n < 0) return { ok: false };
      return { ok: true, value: n };
    }
    case "supplier_cost": {
      if (trimmed === "") return { ok: true, value: null };
      const n = parseFloat(trimmed);
      if (Number.isNaN(n) || n < 0) return { ok: false };
      return { ok: true, value: n };
    }
    case "booking_date":
      if (trimmed === "") return { ok: false };
      return { ok: true, value: trimmed };
    default:
      return { ok: true, value: trimmed };
  }
}

const AdminStandaloneBookingsGrid = () => {
  const queryClient = useQueryClient();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [supplierPaymentFilter, setSupplierPaymentFilter] = useState<string>("all");
  const [newRowDraft, setNewRowDraft] = useState<NewBookingDraft>({});
  const [isCreatingRow, setIsCreatingRow] = useState(false);

  const queryKey = ["admin-standalone-bookings-grid", dateFrom, dateTo, supplierPaymentFilter] as const;

  const { data: rows, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("standalone_bookings")
        .select("*")
        .order("booking_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (dateFrom) query = query.gte("booking_date", dateFrom);
      if (dateTo) query = query.lte("booking_date", dateTo);
      if (supplierPaymentFilter !== "all") query = query.eq("supplier_payment_status", supplierPaymentFilter);

      const { data, error } = await query;
      if (error) throw error;
      return data as BookingRow[];
    },
  });

  const updateCell = async (rowId: string, key: ColumnKey, rawValue: string): Promise<boolean> => {
    const parsed = parseColumnValue(key, rawValue);
    if (!parsed.ok) {
      toast.error("Valeur invalide");
      return false;
    }
    const { error } = await supabase
      .from("standalone_bookings")
      .update({ [key]: parsed.value } as never)
      .eq("id", rowId);
    if (error) {
      toast.error("Erreur de sauvegarde", { description: error.message });
      return false;
    }
    queryClient.setQueryData<BookingRow[]>(queryKey, (old) =>
      old ? old.map((r) => (r.id === rowId ? { ...r, [key]: parsed.value } : r)) : old,
    );
    return true;
  };

  const newRowCommit = async (key: ColumnKey, rawValue: string): Promise<boolean> => {
    if (isCreatingRow) return false;
    const parsed = parseColumnValue(key, rawValue);
    if (!parsed.ok) {
      toast.error("Valeur invalide");
      return false;
    }
    setIsCreatingRow(true);
    const payload = {
      ...NEW_ROW_DEFAULTS,
      customer_name: "",
      customer_email: "",
      booking_date: format(new Date(), "yyyy-MM-dd"),
      source: "manual_admin",
      [key]: parsed.value,
    };
    const { data, error } = await supabase
      .from("standalone_bookings")
      .insert(payload as never)
      .select()
      .single();
    setIsCreatingRow(false);
    if (error || !data) {
      toast.error("Impossible de créer la réservation", { description: error?.message });
      return false;
    }
    queryClient.setQueryData<BookingRow[]>(queryKey, (old) =>
      old ? [data as BookingRow, ...old] : [data as BookingRow],
    );
    setNewRowDraft({});
    toast.success("Réservation créée");
    return true;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">Réservations (vue tableur)</h2>
        <p className="text-sm text-muted-foreground">
          Saisie rapide façon Excel — mêmes réservations que la page Bookings, éditables cellule par cellule.
          Cliquez une cellule pour la modifier, Entrée ou clic ailleurs pour valider, Échap pour annuler.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Du</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[160px]" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Au</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[160px]" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Paiement fournisseur</Label>
          <Select value={supplierPaymentFilter} onValueChange={setSupplierPaymentFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="pending">Impayé</SelectItem>
              <SelectItem value="paid">Payé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(dateFrom || dateTo || supplierPaymentFilter !== "all") && (
          <button
            type="button"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setSupplierPaymentFilter("all");
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : (
        <BookingsGridTable
          rows={rows || []}
          newRowDraft={newRowDraft}
          isCreatingRow={isCreatingRow}
          onCellCommit={updateCell}
          onNewRowCommit={newRowCommit}
        />
      )}
    </div>
  );
};

export default AdminStandaloneBookingsGrid;
