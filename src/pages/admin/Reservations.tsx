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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Search, Columns, X } from "lucide-react";

const AdminBookings = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [hotelFilter, setHotelFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPackageCol, setShowPackageCol] = useState(true);
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-bookings", statusFilter, hotelFilter],
    queryFn: async () => {
      let query = supabase
        .from("bookings" as any)
        .select(`
          *,
          hotels:hotel_id(name),
          experiences:experience_id(title),
          customers:customer_id(first_name, last_name),
          packages:package_id(name),
          booking_extras(*)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (hotelFilter !== "all") {
        query = query.eq("hotel_id", hotelFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: hotels } = useQuery({
    queryKey: ["hotels-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotels" as any)
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as any[];
    },
  });

  // Auto-hide package column if always empty
  const hasAnyPackage = useMemo(() => {
    return bookings?.some((b) => b.packages?.name) ?? false;
  }, [bookings]);

  const effectiveShowPackage = showPackageCol && hasAnyPackage;

  // Search filtering
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    if (!searchQuery.trim()) return bookings;
    const q = searchQuery.toLowerCase();
    return bookings.filter((b) => {
      const customer = `${b.customers?.first_name || ""} ${b.customers?.last_name || ""}`.toLowerCase();
      const hotel = (b.hotels?.name || "").toLowerCase();
      const experience = (b.experiences?.title || "").toLowerCase();
      return customer.includes(q) || hotel.includes(q) || experience.includes(q);
    });
  }, [bookings, searchQuery]);

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

  const getExtrasProgress = (bookingExtras: any[]) => {
    if (!bookingExtras || bookingExtras.length === 0) {
      return <Badge variant="outline" className="text-xs">No extras</Badge>;
    }

    const total = bookingExtras.length;
    const pending = bookingExtras.filter((e: any) => e.status === 'pending').length;
    const done = bookingExtras.filter((e: any) => e.status === 'done').length;
    const notDone = bookingExtras.filter((e: any) => e.status !== 'done');

    let variant: "default" | "destructive" | "secondary" = "secondary";
    if (total > 0 && pending === 0 && done > 0) {
      variant = "default";
    } else if (total > 0 && done === 0 && pending > 0) {
      variant = "destructive";
    }

    const tooltipContent = notDone.length > 0
      ? notDone.map((e: any) => e.extra_name || e.extra_id).join(", ")
      : "All completed";

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className="text-xs cursor-help">
            {done}/{total} completed
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-[250px]">
          <p className="text-xs">
            {notDone.length > 0 ? (
              <>
                <span className="font-semibold">Not completed:</span>{" "}
                {tooltipContent}
              </>
            ) : (
              "All extras completed ✓"
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Bookings</h2>
          <p className="text-sm text-muted-foreground">Manage all bookings</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[220px] max-w-[360px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search customer, hotel, experience..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={hotelFilter} onValueChange={setHotelFilter}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Filter by hotel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All hotels</SelectItem>
              {hotels?.map((hotel) => (
                <SelectItem key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Column visibility toggle */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowColumnsMenu(!showColumnsMenu)}
            >
              <Columns className="w-3.5 h-3.5" />
              Columns
            </Button>
            {showColumnsMenu && (
              <div className="absolute right-0 top-full mt-1 bg-popover border rounded-md shadow-md p-2 z-50 min-w-[160px]">
                <label className="flex items-center gap-2 text-sm px-2 py-1.5 cursor-pointer hover:bg-accent rounded">
                  <input
                    type="checkbox"
                    checked={showPackageCol}
                    onChange={(e) => setShowPackageCol(e.target.checked)}
                    className="rounded"
                  />
                  Package
                </label>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : filteredBookings.length > 0 ? (
          <div className="border rounded-lg bg-card overflow-x-auto">
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Experience</TableHead>
                  {effectiveShowPackage && <TableHead>Package</TableHead>}
                  <TableHead>Dates</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Extras</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-xs">
                      {booking.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      {booking.customers?.first_name} {booking.customers?.last_name}
                    </TableCell>
                    <TableCell>{booking.hotels?.name}</TableCell>
                    <TableCell>{booking.experiences?.title}</TableCell>
                    {effectiveShowPackage && (
                      <TableCell className="text-sm text-muted-foreground">
                        {booking.packages?.name || "—"}
                      </TableCell>
                    )}
                    <TableCell className="text-sm">
                      {format(new Date(booking.checkin), "MMM d")} -{" "}
                      {format(new Date(booking.checkout), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{booking.party_size}</TableCell>
                    <TableCell className="font-medium">
                      ₪{booking.total_price}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(booking.status)}
                    </TableCell>
                    <TableCell>
                      {getExtrasProgress(booking.booking_extras)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(booking.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/admin/reservations/${booking.id}`)}
                      >
                        View Details
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
              {searchQuery ? "No bookings matching your search" : "No reservations found"}
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default AdminBookings;
