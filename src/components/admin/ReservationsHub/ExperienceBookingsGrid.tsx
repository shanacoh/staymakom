/**
 * Onglet "Expériences & bateaux" du hub de réservations : vue tableur
 * éditable en ligne (façon Excel) sur standalone_bookings — remplace les 3
 * anciennes pages (Reservations.tsx en mode "Experience Only",
 * StandaloneBookings.tsx, StandaloneBookingsGrid.tsx).
 */

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, Mail } from "lucide-react";
import BookingsGridTable from "@/components/admin/BookingsGrid/BookingsGridTable";
import {
  EXPERIENCE_COLUMNS,
  EXPERIENCE_INTERACTIVE_COLUMNS,
  NEW_ROW_DEFAULTS,
  formatCurrency,
  type BookingRow,
  type NewBookingDraft,
} from "@/components/admin/BookingsGrid/experienceColumns";
import type { ColumnKey } from "@/components/admin/BookingsGrid/columnTypes";
import RowActionsCell from "./RowActionsCell";
import FiltersPopoverButton from "./FiltersPopoverButton";
import InfoPopoverButton from "./InfoPopoverButton";
import CreateManualStandaloneBookingDialog from "@/components/admin/CreateManualStandaloneBookingDialog";
import StandaloneRequestsTable from "@/components/admin/StandaloneRequestsTable";

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

interface Props {
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}

const ExperienceBookingsGrid = ({ createOpen, onCreateOpenChange }: Props) => {
  const queryClient = useQueryClient();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [supplierPaymentFilter, setSupplierPaymentFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newRowDraft, setNewRowDraft] = useState<NewBookingDraft>({});
  const [isCreatingRow, setIsCreatingRow] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);

  const activeFilterCount = [dateFrom, dateTo, supplierPaymentFilter !== "all"].filter(Boolean).length;
  const resetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSupplierPaymentFilter("all");
  };

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

  const { data: newRequestsCount } = useQuery({
    queryKey: ["admin-standalone-requests-new-count"],
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("standalone_experience_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "new");
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 60_000,
  });

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(
      (r) =>
        (r.customer_name || "").toLowerCase().includes(q) ||
        (r.customer_email || "").toLowerCase().includes(q) ||
        (r.custom_experience_title || "").toLowerCase().includes(q),
    );
  }, [rows, searchQuery]);

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Nom, email, expérience..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setRequestsOpen(true)} className="gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            Demandes
            {(newRequestsCount ?? 0) > 0 && (
              <Badge variant="destructive" className="ml-0.5 h-4 min-w-4 px-1 text-[10px]">
                {newRequestsCount}
              </Badge>
            )}
          </Button>
          <FiltersPopoverButton activeCount={activeFilterCount} onReset={resetFilters}>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Du</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Au</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Paiement fournisseur</Label>
              <Select value={supplierPaymentFilter} onValueChange={setSupplierPaymentFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="pending">Impayé</SelectItem>
                  <SelectItem value="paid">Payé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </FiltersPopoverButton>
          <InfoPopoverButton>
            Saisie rapide façon Excel : cliquez une cellule pour la modifier, Entrée ou clic ailleurs pour valider,
            Échap pour annuler. La sauvegarde se fait automatiquement.
          </InfoPopoverButton>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : (
        <BookingsGridTable
          columns={EXPERIENCE_COLUMNS}
          interactiveColumns={EXPERIENCE_INTERACTIVE_COLUMNS}
          rows={filteredRows}
          newRowDraft={newRowDraft}
          isCreatingRow={isCreatingRow}
          onCellCommit={updateCell}
          onNewRowCommit={newRowCommit}
          isRowLocked={(row) => row.source !== "manual_admin"}
          isRowCancelled={(row) => row.status === "cancelled" || !!row.is_cancelled}
          renderReadonlyCell={(row, col) => {
            if (col.key !== "commission") return "—";
            const commission =
              row.supplier_cost === null || row.supplier_cost === undefined ? null : row.sell_price - row.supplier_cost;
            return formatCurrency(commission, row.currency);
          }}
          renderRowActions={() => <RowActionsCell />}
        />
      )}

      <CreateManualStandaloneBookingDialog open={createOpen} onOpenChange={onCreateOpenChange} />

      <Sheet open={requestsOpen} onOpenChange={setRequestsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Demandes à traiter</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <StandaloneRequestsTable />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ExperienceBookingsGrid;
