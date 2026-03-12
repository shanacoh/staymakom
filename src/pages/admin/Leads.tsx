import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow, differenceInDays, subDays, isAfter, isBefore, startOfDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Download, Mail, ArrowUp, ArrowDown, ArrowUpDown, X, CalendarIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  created_at: string;
  updated_at: string;
  source: string;
  email: string;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  status: string | null;
  is_b2b: boolean | null;
  property_name: string | null;
  property_type: string | null;
  interests: string[] | null;
  message: string | null;
  marketing_opt_in: boolean | null;
  metadata: any;
  notes: string | null;
}

// ─── Status Badge Colors (consistent) ───
const statusStyles: Record<string, string> = {
  new: "bg-[#FEF9C3] text-[#CA8A04] border-[#FEF9C3]",
  contacted: "bg-slate-100 text-slate-600 border-slate-200",
  converted: "bg-[#DCFCE7] text-[#16A34A] border-[#DCFCE7]",
  lost: "bg-[#F3F4F6] text-[#6B7280] border-[#F3F4F6]",
  ignored: "bg-[#F3F4F6] text-[#6B7280] border-[#F3F4F6]",
};

const sourceColors: Record<string, string> = {
  coming_soon: "bg-purple-100 text-purple-800",
  newsletter: "bg-blue-100 text-blue-800",
  contact: "bg-green-100 text-green-800",
  partners: "bg-orange-100 text-orange-800",
  corporate: "bg-red-100 text-red-800",
  ai_assistant_save: "bg-cyan-100 text-cyan-800",
  landing_page: "bg-indigo-100 text-indigo-800",
  tailored_request: "bg-amber-100 text-amber-800",
  category_waitlist: "bg-pink-100 text-pink-800",
};

// ─── Status Badge Component ───
const LeadStatusBadge = ({ status }: { status: string }) => (
  <Badge variant="outline" className={`rounded-md font-medium capitalize text-xs ${statusStyles[status] || statusStyles.new}`}>
    {status}
  </Badge>
);

// ─── Avatar Initials ───
const AvatarInitials = ({ name }: { name: string }) => {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className="w-7 h-7 rounded-full bg-[#F5F0EB] text-[#1A1814] text-xs font-semibold flex items-center justify-center shrink-0">
      {initials}
    </div>
  );
};

// ─── Last Contact Badge ───
const LastContactBadge = ({ date }: { date: string }) => {
  const days = differenceInDays(new Date(), new Date(date));
  let color = "text-green-600";
  if (days > 14) color = "text-red-500";
  else if (days >= 3) color = "text-amber-600";

  const label = days === 0 ? "Today" : formatDistanceToNow(new Date(date), { addSuffix: true });
  return <span className={`text-xs font-medium ${color}`}>{label}</span>;
};

type SortKey = "date" | "email" | "name" | "source" | "status";
type SortDir = "asc" | "desc" | null;

const AdminLeads = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  // For undo delete
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);

  // Slide-over state
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [newNote, setNewNote] = useState("");

  const { data: leads, isLoading, refetch } = useQuery({
    queryKey: ["admin-leads", sourceFilter, statusFilter],
    queryFn: async () => {
      let query = supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (sourceFilter !== "all") query = query.eq("source", sourceFilter);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data as Lead[];
    },
  });

  // Filter by search + date range
  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    let result = leads;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(l =>
        l.email?.toLowerCase().includes(s) ||
        l.name?.toLowerCase().includes(s) ||
        l.first_name?.toLowerCase().includes(s) ||
        l.last_name?.toLowerCase().includes(s)
      );
    }

    if (dateFrom) {
      result = result.filter(l => isAfter(new Date(l.created_at), startOfDay(dateFrom)));
    }
    if (dateTo) {
      result = result.filter(l => isBefore(new Date(l.created_at), startOfDay(subDays(dateTo, -1))));
    }

    // Exclude pending deletes
    if (pendingDelete) {
      result = result.filter(l => !pendingDelete.includes(l.id));
    }

    return result;
  }, [leads, search, dateFrom, dateTo, pendingDelete]);

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

  const sortedLeads = useMemo(() => {
    if (!sortKey || !sortDir) return filteredLeads;
    const sorted = [...filteredLeads];
    const dir = sortDir === "asc" ? 1 : -1;
    sorted.sort((a, b) => {
      switch (sortKey) {
        case "date": return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
        case "email": return (a.email || "").localeCompare(b.email || "") * dir;
        case "name": return getDisplayName(a).localeCompare(getDisplayName(b)) * dir;
        case "source": return (a.source || "").localeCompare(b.source || "") * dir;
        case "status": return (a.status || "new").localeCompare(b.status || "new") * dir;
        default: return 0;
      }
    });
    return sorted;
  }, [filteredLeads, sortKey, sortDir]);

  // ─── Summary Stats ───
  const summary = useMemo(() => {
    if (!leads) return { total: 0, newCount: 0, converted: 0, toFollowUp: 0 };
    const sevenDaysAgo = subDays(new Date(), 7);
    let newCount = 0, converted = 0, toFollowUp = 0;
    leads.forEach(l => {
      if (l.status === "new" || !l.status) {
        newCount++;
        if (isBefore(new Date(l.created_at), sevenDaysAgo)) toFollowUp++;
      }
      if (l.status === "converted") converted++;
    });
    return { total: leads.length, newCount, converted, toFollowUp };
  }, [leads]);

  const getDisplayName = (lead: Lead) => {
    if (lead.name) return lead.name;
    if (lead.first_name || lead.last_name) return `${lead.first_name || ""} ${lead.last_name || ""}`.trim();
    return "";
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const SortableHead = ({ col, children, className }: { col: SortKey; children: React.ReactNode; className?: string }) => (
    <TableHead className={className}>
      <button onClick={() => handleSort(col)} className="flex items-center hover:text-foreground transition-colors">
        {children}<SortIcon col={col} />
      </button>
    </TableHead>
  );

  // ─── Mutations ───
  const updateLeadMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Lead> }) => {
      const { error } = await supabase.from("leads").update(data.updates).eq("id", data.id);
      if (error) throw error;
    },
    onSuccess: () => refetch(),
  });

  const deleteLeadsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("leads").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      setSelectedIds(new Set());
    },
  });

  // ─── Undo delete logic ───
  const softDelete = (ids: string[]) => {
    setPendingDelete(ids);
    setSelectedLeadId(null);
    setDeleteConfirmOpen(false);
    setBulkDeleteOpen(false);
    setSelectedIds(new Set());

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      deleteLeadsMutation.mutate(ids);
      setPendingDelete(null);
    }, 5000);

    toast("Lead deleted", {
      action: {
        label: "Undo",
        onClick: () => {
          if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
          setPendingDelete(null);
          toast.success("Deletion cancelled");
        },
      },
    });
  };

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  // ─── Selected lead detail ───
  const selectedLead = leads?.find(l => l.id === selectedLeadId) || null;

  const openSlideover = (lead: Lead) => {
    setSelectedLeadId(lead.id);
    setEditName(getDisplayName(lead));
    setEditPhone(lead.phone || "");
    setEditStatus(lead.status || "new");
    setNewNote("");
  };

  const saveLeadChanges = async () => {
    if (!selectedLead) return;
    const nameParts = editName.trim().split(" ");
    const first = nameParts[0] || "";
    const last = nameParts.slice(1).join(" ") || "";
    await updateLeadMutation.mutateAsync({
      id: selectedLead.id,
      updates: {
        name: editName.trim() || null,
        first_name: first || null,
        last_name: last || null,
        phone: editPhone || null,
        status: editStatus,
      },
    });
    toast.success("Lead updated");
  };

  const addNote = async () => {
    if (!selectedLead || !newNote.trim()) return;
    const existingNotes = selectedLead.notes || "";
    const timestamp = format(new Date(), "dd/MM/yy HH:mm");
    const entry = `[${timestamp}] ${newNote.trim()}`;
    const updated = existingNotes ? `${entry}\n${existingNotes}` : entry;
    await updateLeadMutation.mutateAsync({ id: selectedLead.id, updates: { notes: updated } });
    setNewNote("");
    toast.success("Note added");
  };

  const markConverted = async () => {
    if (!selectedLead) return;
    const timestamp = format(new Date(), "dd/MM/yy HH:mm");
    const entry = `[${timestamp}] Marked as converted`;
    const updated = selectedLead.notes ? `${entry}\n${selectedLead.notes}` : entry;
    await updateLeadMutation.mutateAsync({ id: selectedLead.id, updates: { status: "converted", notes: updated } });
    setEditStatus("converted");
    toast.success("Lead converted");
  };

  // ─── Bulk selection ───
  const toggleSelect = (id: string) => {
    const s = new Set(selectedIds);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    setSelectedIds(s);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedLeads.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(sortedLeads.map(l => l.id)));
  };

  const clearFilters = () => {
    setSearch("");
    setSourceFilter("all");
    setStatusFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  // ─── Export ───
  const exportToCSV = (subset?: Lead[]) => {
    const rows = subset || sortedLeads;
    if (!rows.length) { toast.error("No leads to export"); return; }
    const headers = ["Date","Email","Name","Phone","Source","Status","Country","B2B","Property"];
    const csvRows = rows.map(l => [
      format(new Date(l.created_at), "yyyy-MM-dd HH:mm"),
      l.email,
      getDisplayName(l) || "-",
      l.phone || "-",
      l.source,
      l.status || "new",
      l.country || "-",
      l.is_b2b ? "Yes" : "No",
      l.property_name || "-",
    ]);
    const csv = [headers, ...csvRows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export complete");
  };

  const uniqueSources = leads ? [...new Set(leads.map(l => l.source))] : [];

  // Parse activity from notes
  const parseActivity = (notes: string | null, createdAt: string) => {
    const events: { date: string; text: string }[] = [
      { date: format(new Date(createdAt), "dd/MM/yy"), text: "Lead created" },
    ];
    if (notes) {
      const lines = notes.split("\n").filter(Boolean);
      lines.forEach(line => {
        const match = line.match(/^\[([^\]]+)\]\s*(.+)$/);
        if (match) events.unshift({ date: match[1], text: match[2] });
      });
    }
    return events;
  };

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">
            {summary.total} total · {summary.newCount} new · {summary.converted} converted · {summary.toFollowUp} to follow up
          </p>
        </div>
        <Button onClick={() => exportToCSV()} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />Export CSV
        </Button>
      </div>

      {/* ─── Filters ─── */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by email, name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {uniqueSources.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>

        {/* Date range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn("w-full sm:w-[200px] justify-start text-left font-normal", (!dateFrom && !dateTo) && "text-muted-foreground")}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? (dateTo ? `${format(dateFrom, "dd/MM")} - ${format(dateTo, "dd/MM")}` : format(dateFrom, "dd/MM/yy")) : "Date range"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="range" selected={{ from: dateFrom, to: dateTo }} onSelect={(range) => { setDateFrom(range?.from); setDateTo(range?.to); }} initialFocus />
          </PopoverContent>
        </Popover>

        {(search || sourceFilter !== "all" || statusFilter !== "all" || dateFrom || dateTo) && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>
        )}
      </div>

      {/* ─── Table ─── */}
      <div className="border rounded-lg bg-white overflow-x-auto">
        <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={selectedIds.size === sortedLeads.length && sortedLeads.length > 0} onCheckedChange={toggleSelectAll} />
              </TableHead>
              <SortableHead col="date">Date</SortableHead>
              <SortableHead col="email">Email</SortableHead>
              <SortableHead col="name">Name</SortableHead>
              <SortableHead col="source">Source</SortableHead>
              <SortableHead col="status">Status</SortableHead>
              <TableHead>Last contact</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : sortedLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 space-y-3">
                  <p className="text-muted-foreground">No leads found</p>
                  {(search || sourceFilter !== "all" || statusFilter !== "all" || dateFrom || dateTo) && (
                    <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              sortedLeads.map(lead => {
                const name = getDisplayName(lead);
                const notesPreview = lead.notes?.split("\n")[0]?.slice(0, 40) || "";
                return (
                  <TableRow key={lead.id} className="group cursor-pointer hover:bg-muted/50" onClick={() => openSlideover(lead)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedIds.has(lead.id)} onCheckedChange={() => toggleSelect(lead.id)} className="opacity-0 group-hover:opacity-100 data-[state=checked]:opacity-100 transition-opacity" />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(lead.created_at), "dd/MM/yy")}
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{lead.email}</TableCell>
                    <TableCell>
                      {name ? (
                        <div className="flex items-center gap-2">
                          <AvatarInitials name={name} />
                          <span className="text-sm font-medium">{name}</span>
                          {lead.is_b2b && <Badge variant="outline" className="text-[10px] px-1.5">B2B</Badge>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-xs ${sourceColors[lead.source] || "bg-gray-100 text-gray-800"}`}>
                        {lead.source.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell><LeadStatusBadge status={lead.status || "new"} /></TableCell>
                    <TableCell><LastContactBadge date={lead.updated_at || lead.created_at} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{notesPreview}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ─── Bulk Action Bar ─── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-6 py-3 rounded-full shadow-xl flex items-center gap-4 z-50">
          <span className="text-sm font-medium">{selectedIds.size} lead{selectedIds.size > 1 ? "s" : ""} selected</span>
          <Select onValueChange={(v) => {
            selectedIds.forEach(id => updateLeadMutation.mutate({ id, updates: { status: v } }));
            toast.success(`Status updated to ${v}`);
          }}>
            <SelectTrigger className="w-[130px] h-8 bg-background text-foreground"><SelectValue placeholder="Change status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="secondary" onClick={() => exportToCSV(sortedLeads.filter(l => selectedIds.has(l.id)))}>
            Export selected
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="w-4 h-4 mr-1" />Delete
          </Button>
          <button onClick={() => setSelectedIds(new Set())} className="ml-2 text-background/70 hover:text-background">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Lead Detail Slide-over ─── */}
      <Sheet open={!!selectedLeadId} onOpenChange={() => setSelectedLeadId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedLead && (
            <div className="space-y-6 mt-2">
              {/* Header */}
              <div>
                <h3 className="text-lg font-bold">{selectedLead.email}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className={sourceColors[selectedLead.source] || "bg-gray-100"}>
                    {selectedLead.source.replace(/_/g, " ")}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Added {format(new Date(selectedLead.created_at), "MMM d, yyyy")}</span>
                </div>
              </div>

              {/* Identity */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm">Identity</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="—" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Phone</Label>
                    <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="—" />
                  </div>
                </div>
                {selectedLead.country && (
                  <p className="text-sm text-muted-foreground">
                    {[selectedLead.city, selectedLead.country].filter(Boolean).join(", ")}
                  </p>
                )}
                <Button size="sm" onClick={saveLeadChanges}>Save changes</Button>
              </div>

              {/* Status */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm">Status</h4>
                <Select value={editStatus} onValueChange={(v) => {
                  setEditStatus(v);
                  const timestamp = format(new Date(), "dd/MM/yy HH:mm");
                  const entry = `[${timestamp}] Status changed to ${v}`;
                  const updated = selectedLead.notes ? `${entry}\n${selectedLead.notes}` : entry;
                  updateLeadMutation.mutate({ id: selectedLead.id, updates: { status: v, notes: updated } });
                  toast.success("Status updated");
                }}>
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Activity Timeline */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm">Activity Timeline</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {parseActivity(selectedLead.notes, selectedLead.created_at).map((ev, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <span className="text-muted-foreground text-xs w-20 shrink-0">{ev.date}</span>
                      <span>{ev.text}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 space-y-2">
                  <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note..." rows={2} />
                  <Button size="sm" variant="outline" onClick={addNote} disabled={!newNote.trim()}>Add note</Button>
                </div>
              </div>

              {/* Message if present */}
              {selectedLead.message && (
                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-sm">Original Message</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{selectedLead.message}</p>
                </div>
              )}

              {/* Actions */}
              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-sm">Actions</h4>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <a href={`mailto:${selectedLead.email}`}><Mail className="w-4 h-4 mr-1.5" />Send email</a>
                  </Button>
                  <Button size="sm" variant="outline" onClick={markConverted} disabled={editStatus === "converted"}>
                    Mark as converted
                  </Button>
                </div>
                <button className="text-sm text-destructive hover:underline mt-2" onClick={() => setDeleteConfirmOpen(true)}>
                  Delete lead
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ─── Delete Confirmation (single) ─── */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Lead</DialogTitle>
            <DialogDescription>Are you sure you want to delete this lead? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => selectedLeadId && softDelete([selectedLeadId])}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Bulk Delete Confirmation ─── */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} Lead{selectedIds.size > 1 ? "s" : ""}</DialogTitle>
            <DialogDescription>Are you sure you want to delete the selected leads? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => softDelete([...selectedIds])}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLeads;
