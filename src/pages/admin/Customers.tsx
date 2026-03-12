import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Plus, Download, ArrowUp, ArrowDown, ArrowUpDown, Mail, X } from "lucide-react";
import { format } from "date-fns";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CountrySelect } from "@/components/admin/CountrySelect";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/admin/StatusBadge";

// ─── Avatar Initials ───
const AvatarInitials = ({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) => {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const cls = size === "lg" 
    ? "w-14 h-14 text-lg" 
    : "w-8 h-8 text-xs";
  return (
    <div className={`${cls} rounded-full bg-[#F5F0EB] text-[#1A1814] font-semibold flex items-center justify-center shrink-0`}>
      {initials}
    </div>
  );
};

// ─── Role Badge (read-only) ───
const RoleBadge = ({ role }: { role: string }) => {
  const styles: Record<string, string> = {
    admin: "bg-blue-900 text-white border-blue-900",
    hotel_admin: "bg-amber-100 text-amber-900 border-amber-300",
    customer: "bg-[#DCFCE7] text-[#16A34A] border-[#DCFCE7]",
  };
  return (
    <Badge variant="outline" className={`rounded-md font-medium capitalize text-xs ${styles[role] || styles.customer}`}>
      {role === "hotel_admin" ? "Hotel Admin" : role}
    </Badge>
  );
};

// ─── Club tier config ───
const TIERS: Record<string, { label: string; color: string; next: number }> = {
  explorer: { label: "Explorer", color: "text-muted-foreground", next: 500 },
  traveler: { label: "Traveler", color: "text-blue-600", next: 1500 },
  insider: { label: "Insider", color: "text-purple-600", next: 3000 },
  circle: { label: "Circle", color: "text-amber-600", next: 999999 },
};

type SortKey = "name" | "email" | "phone" | "role" | "status" | "bookings" | "totalSpent";
type SortDir = "asc" | "desc" | null;

const AdminCustomers = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "hotel_admin" | "customer">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [clubFilter, setClubFilter] = useState<"all" | "explorer" | "traveler" | "insider" | "circle">("all");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ userId: string; email: string } | null>(null);
  const [slideoverNote, setSlideoverNote] = useState("");
  const [slideoverRole, setSlideoverRole] = useState("");
  const [slideoverHotelId, setSlideoverHotelId] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const [newUser, setNewUser] = useState({
    email: "", password: "", firstName: "", lastName: "",
    role: "customer" as "admin" | "hotel_admin" | "customer",
    country: "", hotelId: "",
  });

  // Fetch hotels
  const { data: hotels } = useQuery({
    queryKey: ["all-hotels"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hotels").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: customers, isLoading, refetch } = useQuery({
    queryKey: ["admin-customers", searchTerm, roleFilter, statusFilter, clubFilter],
    queryFn: async () => {
      const { data: customersWithEmails, error: emailError } = await supabase.rpc("get_customers_with_emails");
      if (emailError) throw emailError;
      if (!customersWithEmails) return [];

      const userIds = customersWithEmails.map((c) => c.user_id);

      const [{ data: profiles }, { data: roles }, { data: hotelAdmins }] = await Promise.all([
        supabase.from("user_profiles").select("*").in("user_id", userIds),
        supabase.from("user_roles").select("*").in("user_id", userIds),
        supabase.from("hotel_admins").select("user_id, hotel_id, hotels(name)").in("user_id", userIds),
      ]);

      let filtered = customersWithEmails;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        filtered = filtered.filter(c => {
          const profile = profiles?.find(p => p.user_id === c.user_id);
          return (
            c.first_name?.toLowerCase().includes(s) ||
            c.last_name?.toLowerCase().includes(s) ||
            c.user_email?.toLowerCase().includes(s) ||
            profile?.phone?.toLowerCase().includes(s)
          );
        });
      }

      if (roleFilter !== "all") {
        const filteredIds = roles?.filter(r => r.role === roleFilter).map(r => r.user_id) || [];
        filtered = filtered.filter(c => filteredIds.includes(c.user_id));
      }

      const customerIds = filtered.map(c => c.id);
      const { data: bookingStats } = await supabase
        .from("bookings")
        .select("customer_id, total_price")
        .in("customer_id", customerIds);

      const statsMap = (bookingStats || []).reduce((acc, b) => {
        const id = b.customer_id;
        if (!id) return acc;
        if (!acc[id]) acc[id] = { count: 0, total: 0 };
        acc[id].count += 1;
        acc[id].total += Number(b.total_price || 0);
        return acc;
      }, {} as Record<string, { count: number; total: number }>);

      const profilesMap = (profiles || []).reduce((acc, p) => { acc[p.user_id] = p; return acc; }, {} as Record<string, any>);
      const rolesMap = (roles || []).reduce((acc, r) => { acc[r.user_id] = r; return acc; }, {} as Record<string, any>);
      const haMap = (hotelAdmins || []).reduce((acc, ha) => { acc[ha.user_id] = ha; return acc; }, {} as Record<string, any>);

      const getClub = (mp: number) => mp >= 3000 ? "circle" : mp >= 1500 ? "insider" : mp >= 500 ? "traveler" : "explorer";

      let mapped = filtered.map((c: any) => {
        const profile = profilesMap[c.user_id];
        const mp = profile?.membership_progress || 0;
        return {
          ...c,
          user_profiles: profile || null,
          user_roles: rolesMap[c.user_id] || null,
          hotel_admin: haMap[c.user_id] || null,
          bookingsCount: statsMap[c.id]?.count || 0,
          totalSpent: statsMap[c.id]?.total || 0,
          isActive: true,
          membershipProgress: mp,
          clubStatus: getClub(mp),
        };
      });

      if (clubFilter !== "all") mapped = mapped.filter(c => c.clubStatus === clubFilter);
      return mapped;
    },
  });

  // ─── Sorting ───
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") { setSortKey(null); setSortDir(null); }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedCustomers = useMemo(() => {
    if (!customers || !sortKey || !sortDir) return customers || [];
    const sorted = [...customers];
    const dir = sortDir === "asc" ? 1 : -1;
    sorted.sort((a: any, b: any) => {
      switch (sortKey) {
        case "name": return (`${a.first_name} ${a.last_name}`).localeCompare(`${b.first_name} ${b.last_name}`) * dir;
        case "email": return (a.user_email || "").localeCompare(b.user_email || "") * dir;
        case "phone": return (a.user_profiles?.phone || "").localeCompare(b.user_profiles?.phone || "") * dir;
        case "role": return (a.user_roles?.role || "customer").localeCompare(b.user_roles?.role || "customer") * dir;
        case "status": return (a.isActive ? "active" : "inactive").localeCompare(b.isActive ? "active" : "inactive") * dir;
        case "bookings": return (a.bookingsCount - b.bookingsCount) * dir;
        case "totalSpent": return (a.totalSpent - b.totalSpent) * dir;
        default: return 0;
      }
    });
    return sorted;
  }, [customers, sortKey, sortDir]);

  // ─── Summary stats ───
  const summary = useMemo(() => {
    if (!customers) return { customers: 0, admins: 0, hotelAdmins: 0, revenue: 0 };
    let admins = 0, hotelAdmins = 0, custs = 0, revenue = 0;
    customers.forEach((c: any) => {
      const role = c.user_roles?.role || "customer";
      if (role === "admin") admins++;
      else if (role === "hotel_admin") hotelAdmins++;
      else custs++;
      revenue += c.totalSpent;
    });
    return { customers: custs, admins, hotelAdmins, revenue };
  }, [customers]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    return sortDir === "asc" 
      ? <ArrowUp className="w-3 h-3 ml-1 text-foreground" /> 
      : <ArrowDown className="w-3 h-3 ml-1 text-foreground" />;
  };

  const SortableHead = ({ col, children, className }: { col: SortKey; children: React.ReactNode; className?: string }) => (
    <TableHead className={className}>
      <button onClick={() => handleSort(col)} className="flex items-center gap-0 hover:text-foreground transition-colors">
        {children}
        <SortIcon col={col} />
      </button>
    </TableHead>
  );

  // ─── Mutations ───
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole, oldRoleId }: { userId: string; newRole: string; oldRoleId?: string }) => {
      if (oldRoleId) await supabase.from("user_roles").delete().eq("id", oldRoleId);
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole as any });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Role updated"); refetch(); },
    onError: () => { toast.error("Failed to update role"); },
  });

  const assignHotelMutation = useMutation({
    mutationFn: async ({ userId, hotelId }: { userId: string; hotelId: string }) => {
      const { data: existing } = await supabase.from("hotel_admins").select("*").eq("user_id", userId).single();
      if (existing) {
        const { error } = await supabase.from("hotel_admins").update({ hotel_id: hotelId }).eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("hotel_admins").insert({ user_id: userId, hotel_id: hotelId });
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Hotel assigned"); refetch(); },
    onError: () => { toast.error("Failed to assign hotel"); },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke('manage-users', { body: { action: 'delete', userId } });
      if (error) {
        if (error instanceof FunctionsHttpError) { const d = await error.context.json(); throw new Error(d.error || 'Failed'); }
        throw new Error(error.message || 'Failed');
      }
      if (!data?.success) throw new Error(data?.error || 'Failed');
    },
    onSuccess: () => { toast.success("User deleted"); setDeleteTarget(null); setDeleteConfirmEmail(""); refetch(); },
    onError: (e: Error) => { toast.error(e.message || "Failed to delete user"); },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'create', email: userData.email, password: userData.password, firstName: userData.firstName, lastName: userData.lastName, role: userData.role, country: userData.country, hotelId: userData.hotelId || null },
      });
      if (error) {
        if (error instanceof FunctionsHttpError) { const d = await error.context.json(); throw new Error(d.error || 'Failed'); }
        throw new Error(error.message || 'Failed');
      }
      if (data && !data.success) throw new Error(data.error || 'Failed');
      return data;
    },
    onSuccess: () => {
      toast.success("User created");
      setAddUserOpen(false);
      setNewUser({ email: "", password: "", firstName: "", lastName: "", role: "customer", country: "", hotelId: "" });
      refetch();
    },
    onError: (e: any) => { toast.error(e?.message || "Failed to create user"); },
  });

  // ─── Export CSV ───
  const exportToCSV = (single?: any) => {
    const rows = single ? [single] : customers;
    if (!rows || rows.length === 0) { toast.error("No data to export"); return; }
    const headers = ["Name","Email","Phone","Role","Bookings","Total Spent (₪)","Club Status","Joined"];
    const csvRows = rows.map((c: any) => [
      `${c.first_name} ${c.last_name}`, c.user_email || "", c.user_profiles?.phone || "",
      c.user_roles?.role || "customer", c.bookingsCount, c.totalSpent.toFixed(2),
      c.clubStatus || "explorer", format(new Date(c.created_at), "yyyy-MM-dd"),
    ]);
    const csv = [headers, ...csvRows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = single ? `customer-${single.first_name}-${format(new Date(), "yyyy-MM-dd")}.csv` : `customers-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // ─── Customer Detail (slide-over) ───
  const { data: customerDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["admin-customer-detail", selectedCustomerId],
    queryFn: async () => {
      if (!selectedCustomerId) return null;
      const { data: customer, error } = await supabase.from("customers").select("*").eq("user_id", selectedCustomerId).single();
      if (error) throw error;
      const [{ data: profile }, { data: role }, { data: hotelAdmin }] = await Promise.all([
        supabase.from("user_profiles").select("*").eq("user_id", selectedCustomerId).single(),
        supabase.from("user_roles").select("*").eq("user_id", selectedCustomerId).single(),
        supabase.from("hotel_admins").select("*, hotels(name)").eq("user_id", selectedCustomerId).single(),
      ]);
      const { data: bookings } = await supabase
        .from("bookings")
        .select("*, hotels(name), experiences(title)")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });
      const totalSpent = bookings?.reduce((s, b) => s + Number(b.total_price || 0), 0) || 0;
      // Get email from customer list cache
      const cachedCustomer = customers?.find((c: any) => c.user_id === selectedCustomerId);
      return {
        ...customer,
        user_email: cachedCustomer?.user_email || "",
        user_profiles: profile,
        user_roles: role,
        hotel_admin: hotelAdmin,
        bookings: bookings || [],
        totalSpent,
        clubStatus: cachedCustomer?.clubStatus || "explorer",
        membershipProgress: cachedCustomer?.membershipProgress || 0,
      };
    },
    enabled: !!selectedCustomerId,
  });

  // When slide-over opens, sync role state
  const openSlideover = (userId: string) => {
    const c = customers?.find((c: any) => c.user_id === userId);
    setSelectedCustomerId(userId);
    setSlideoverRole(c?.user_roles?.role || "customer");
    setSlideoverHotelId(c?.hotel_admin?.hotel_id || "");
    setSlideoverNote(c?.notes || "");
  };

  const saveSlideoverRole = async () => {
    if (!customerDetail) return;
    const currentRole = customerDetail.user_roles?.role;
    if (slideoverRole !== currentRole) {
      await updateRoleMutation.mutateAsync({
        userId: customerDetail.user_id,
        newRole: slideoverRole,
        oldRoleId: customerDetail.user_roles?.id,
      });
    }
    if (slideoverRole === "hotel_admin" && slideoverHotelId) {
      await assignHotelMutation.mutateAsync({ userId: customerDetail.user_id, hotelId: slideoverHotelId });
    }
    toast.success("Role saved");
  };

  const saveNote = async () => {
    if (!customerDetail) return;
    const { error } = await supabase.from("customers").update({ notes: slideoverNote }).eq("id", customerDetail.id);
    if (error) toast.error("Failed to save note");
    else toast.success("Note saved");
  };

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">User Management</h2>
          <p className="text-sm text-muted-foreground">Manage all user accounts, roles, and permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportToCSV()}>
            <Download className="w-4 h-4 mr-1.5" />Export
          </Button>
          <Button size="sm" onClick={() => setAddUserOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />Add User
          </Button>
        </div>
      </div>

      {/* ─── Summary Bar ─── */}
      {customers && customers.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {summary.customers} customers · {summary.admins} admins · {summary.hotelAdmins} hotel admins · ₪{summary.revenue.toLocaleString("en-IL", { maximumFractionDigits: 0 })} total revenue
        </div>
      )}

      {/* ─── Filters: Search + All Roles + All Status + All Club Status ─── */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="hotel_admin">Hotel Admin</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={clubFilter} onValueChange={(v) => setClubFilter(v as any)}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Club Status</SelectItem>
            <SelectItem value="explorer">Explorer</SelectItem>
            <SelectItem value="traveler">Traveler</SelectItem>
            <SelectItem value="insider">Insider</SelectItem>
            <SelectItem value="circle">Circle</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ─── Table ─── */}
      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : sortedCustomers && sortedCustomers.length > 0 ? (
        <div className="border rounded-lg bg-white overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <SortableHead col="name">Name</SortableHead>
                <SortableHead col="email">Email</SortableHead>
                <SortableHead col="phone">Phone</SortableHead>
                <SortableHead col="role">Role</SortableHead>
                <SortableHead col="status">Status</SortableHead>
                <SortableHead col="bookings" className="text-right">Bookings</SortableHead>
                <SortableHead col="totalSpent" className="text-right">Total Spent</SortableHead>
                <TableHead>Club</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCustomers.map((customer: any) => {
                const currentRole = customer.user_roles?.role || "customer";
                const fullName = `${customer.first_name} ${customer.last_name}`;
                return (
                  <TableRow
                    key={customer.user_id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openSlideover(customer.user_id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <AvatarInitials name={fullName} />
                        <span className="font-medium">{fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{customer.user_email || "-"}</TableCell>
                    <TableCell className="text-sm">{customer.user_profiles?.phone || "-"}</TableCell>
                    <TableCell><RoleBadge role={currentRole} /></TableCell>
                    <TableCell>
                      <StatusBadge status={customer.isActive ? "published" : "archived"} className="text-xs" />
                    </TableCell>
                    <TableCell className="text-right">{customer.bookingsCount}</TableCell>
                    <TableCell className="text-right font-medium">
                      ₪{customer.totalSpent.toLocaleString("en-IL", { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium capitalize ${TIERS[customer.clubStatus]?.color || ""}`}>
                        {TIERS[customer.clubStatus]?.label || customer.clubStatus}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-white space-y-3">
          <p className="text-muted-foreground">
            {searchTerm ? `No customers found for "${searchTerm}"` : "No customers yet"}
          </p>
          {searchTerm && (
            <Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>
              Clear search
            </Button>
          )}
        </div>
      )}

      {/* ─── Customer Profile Slide-over ─── */}
      <Sheet open={!!selectedCustomerId} onOpenChange={() => setSelectedCustomerId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {isLoadingDetail ? (
            <div className="py-8 text-center">Loading...</div>
          ) : customerDetail ? (() => {
            const fullName = `${customerDetail.first_name} ${customerDetail.last_name}`;
            const tier = TIERS[customerDetail.clubStatus] || TIERS.explorer;
            const progress = tier.next < 999999
              ? Math.min(100, (customerDetail.membershipProgress / tier.next) * 100)
              : 100;

            return (
              <div className="space-y-6 mt-2">
                {/* ─── Header ─── */}
                <div className="flex items-center gap-4">
                  <AvatarInitials name={fullName} size="lg" />
                  <div>
                    <h3 className="text-lg font-bold">{fullName}</h3>
                    <p className="text-sm text-muted-foreground">{customerDetail.user_email}</p>
                    <p className="text-xs text-muted-foreground">Member since {format(new Date(customerDetail.created_at), "MMM yyyy")}</p>
                  </div>
                </div>

                {/* ─── Club Status Card ─── */}
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`font-semibold capitalize ${tier.color}`}>{tier.label}</span>
                    <span className="text-xs text-muted-foreground">{customerDetail.membershipProgress} pts</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  {tier.next < 999999 && (
                    <p className="text-xs text-muted-foreground">{tier.next - customerDetail.membershipProgress} pts to next tier</p>
                  )}
                </div>

                {/* ─── Role Management ─── */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm">Role & Access</h4>
                  <div className="space-y-2">
                    <Label className="text-xs">Role</Label>
                    <Select value={slideoverRole} onValueChange={setSlideoverRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="hotel_admin">Hotel Admin</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {slideoverRole === "hotel_admin" && (
                    <div className="space-y-2">
                      <Label className="text-xs">Assigned Hotel</Label>
                      <Select value={slideoverHotelId} onValueChange={setSlideoverHotelId}>
                        <SelectTrigger><SelectValue placeholder="Select hotel" /></SelectTrigger>
                        <SelectContent>
                          {hotels?.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button size="sm" onClick={saveSlideoverRole}>Save role</Button>
                </div>

                {/* ─── Booking History ─── */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm">Booking History</h4>
                  {customerDetail.bookings.length > 0 ? (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {customerDetail.bookings.map((b: any) => (
                        <div key={b.id} className="border rounded-md p-3 bg-muted/30 space-y-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium">{b.experiences?.title || "Experience"}</p>
                              <p className="text-xs text-muted-foreground">{b.hotels?.name}</p>
                            </div>
                            <StatusBadge status={b.status || "pending"} />
                          </div>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            <span>{format(new Date(b.checkin), "MMM d")} - {format(new Date(b.checkout), "MMM d, yyyy")}</span>
                            <span className="font-medium text-foreground">₪{Number(b.total_price).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No bookings yet</p>
                  )}
                </div>

                {/* ─── Notes ─── */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm">Internal Notes</h4>
                  <Textarea
                    value={slideoverNote}
                    onChange={(e) => setSlideoverNote(e.target.value)}
                    placeholder="Add notes about this customer..."
                    rows={3}
                  />
                  <Button size="sm" variant="outline" onClick={saveNote}>Save note</Button>
                </div>

                {/* ─── Actions ─── */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm">Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <a href={`mailto:${customerDetail.user_email}`}>
                        <Mail className="w-4 h-4 mr-1.5" />Send email
                      </a>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      const c = customers?.find((x: any) => x.user_id === selectedCustomerId);
                      if (c) exportToCSV(c);
                    }}>
                      <Download className="w-4 h-4 mr-1.5" />Export data
                    </Button>
                  </div>
                  <button
                    className="text-sm text-destructive hover:underline mt-2"
                    onClick={() => {
                      setDeleteTarget({ userId: customerDetail.user_id, email: customerDetail.user_email });
                      setDeleteConfirmEmail("");
                    }}
                  >
                    Delete account
                  </button>
                </div>
              </div>
            );
          })() : null}
        </SheetContent>
      </Sheet>

      {/* ─── Delete Confirmation (type email) ─── */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Type <strong>{deleteTarget?.email}</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={deleteConfirmEmail}
            onChange={(e) => setDeleteConfirmEmail(e.target.value)}
            placeholder="Type email to confirm..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmEmail !== deleteTarget?.email}
              onClick={() => deleteTarget && deleteUserMutation.mutate(deleteTarget.userId)}
            >
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Add User Dialog ─── */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account with role and permissions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={newUser.firstName} onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })} placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={newUser.lastName} onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })} placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newUser.role} onValueChange={(v: any) => setNewUser({ ...newUser, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="hotel_admin">Hotel Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newUser.role === "hotel_admin" && (
              <div className="space-y-2">
                <Label>Assigned Hotel</Label>
                <Select value={newUser.hotelId} onValueChange={(v) => setNewUser({ ...newUser, hotelId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select hotel" /></SelectTrigger>
                  <SelectContent>
                    {hotels?.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Country</Label>
              <CountrySelect value={newUser.country} onChange={(v) => setNewUser({ ...newUser, country: v })} placeholder="Select country" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddUserOpen(false)}>Cancel</Button>
            <Button onClick={() => createUserMutation.mutate(newUser)} disabled={!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName}>
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCustomers;
