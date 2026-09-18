import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { format, formatDistanceToNow, differenceInDays, subDays, isAfter, isBefore, startOfDay, startOfMonth, endOfMonth, subMonths, getDate, getDaysInMonth } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Search, Download, Mail, ArrowUp, ArrowDown, ArrowUpDown, X, CalendarIcon, Trash2, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  converted_user_id: string | null;
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
  experience_only: "bg-teal-100 text-teal-800",
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

const PAGE_SIZE = 200;

// ─── Lead Link Badges (compte / réservation) ───
const LeadLinkBadges = ({ hasAccount, hasReservation, onAccountClick }: { hasAccount: boolean; hasReservation: boolean; onAccountClick?: () => void }) => {
  if (!hasAccount && !hasReservation) return null;
  return (
    <div className="flex items-center gap-1">
      {hasAccount && (
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 cursor-pointer hover:bg-muted"
          onClick={(e) => { e.stopPropagation(); onAccountClick?.(); }}
        >
          Compte
        </Badge>
      )}
      {hasReservation && (
        <Badge variant="outline" className="text-[10px] px-1.5">
          Réservation
        </Badge>
      )}
    </div>
  );
};

type CrmType = "all" | "newsletter" | "no_newsletter" | "partenaire" | "equipe";

const AdminLeads = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<CrmType>("all");
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
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isExportingAll, setIsExportingAll] = useState(false);

  // For undo delete
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);

  // Slide-over state
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [newNote, setNewNote] = useState("");
  const [sendingQuestionnaire, setSendingQuestionnaire] = useState(false);

  const { data: leads, isLoading, refetch } = useQuery({
    queryKey: ["admin-leads", sourceFilter, statusFilter, limit],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("id, created_at, updated_at, source, email, name, first_name, last_name, phone, country, city, status, is_b2b, property_name, property_type, interests, message, marketing_opt_in, metadata, notes, converted_user_id")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (sourceFilter !== "all") query = query.eq("source", sourceFilter);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data as Lead[];
    },
    staleTime: 2 * 60_000,
    gcTime: 5 * 60_000,
  });

  // Reset the loaded page size whenever the filters change, so we don't
  // keep fetching a huge batch that no longer matches what's being viewed.
  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [sourceFilter, statusFilter]);

  // Lightweight query for accurate counts across ALL matching leads (not
  // just the currently loaded page), used for the header stats and the
  // "load more" affordance.
  const { data: fullStats } = useQuery({
    queryKey: ["admin-leads-stats", sourceFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("status, created_at, source");
      if (sourceFilter !== "all") query = query.eq("source", sourceFilter);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data as { status: string | null; created_at: string; source: string }[];
    },
    staleTime: 2 * 60_000,
    gcTime: 5 * 60_000,
  });

  // Leads qui ont au moins une réservation (bookings_hg ou standalone_bookings)
  // liée. Requête légère (un seul champ), agrégée côté client, sur le même
  // principe que le rapprochement bookings <-> client dans Customers.tsx.
  const { data: leadIdsWithReservation } = useQuery({
    queryKey: ["admin-leads-reservation-links"],
    queryFn: async () => {
      const [{ data: hg }, { data: standalone }] = await Promise.all([
        supabase.from("bookings_hg" as any).select("lead_id").not("lead_id", "is", null) as any,
        supabase.from("standalone_bookings").select("lead_id").not("lead_id", "is", null),
      ]);
      const ids = new Set<string>();
      (hg || []).forEach((b: any) => b.lead_id && ids.add(b.lead_id));
      (standalone || []).forEach((b: any) => b.lead_id && ids.add(b.lead_id));
      return ids;
    },
    staleTime: 2 * 60_000,
    gcTime: 5 * 60_000,
  });

  // Infos live sur les comptes liés, pour classer chaque fiche en Newsletter /
  // Client sans newsletter / Partenaire / Équipe : le rôle (admin, gestionnaire
  // d'hôtel) et l'opt-in marketing réel viennent du compte, pas d'une valeur
  // figée au moment de la création de la fiche.
  const { data: accountMeta } = useQuery({
    queryKey: ["admin-leads-account-meta"],
    queryFn: async () => {
      const [{ data: roles }, { data: profiles }] = await Promise.all([
        supabase.from("user_roles").select("user_id, role").in("role", ["admin", "hotel_admin"]),
        supabase.from("user_profiles").select("user_id, marketing_opt_in"),
      ]);
      return {
        roleMap: new Map((roles || []).map((r) => [r.user_id, r.role])),
        optInMap: new Map((profiles || []).map((p) => [p.user_id, p.marketing_opt_in])),
      };
    },
    staleTime: 2 * 60_000,
    gcTime: 5 * 60_000,
  });

  const getCrmType = (lead: Lead): Exclude<CrmType, "all"> => {
    const role = lead.converted_user_id ? accountMeta?.roleMap.get(lead.converted_user_id) : undefined;
    if (role === "admin" || role === "hotel_admin") return "equipe";
    if (lead.is_b2b || lead.source === "partners" || lead.source === "corporate") return "partenaire";
    const accountOptIn = lead.converted_user_id ? accountMeta?.optInMap.get(lead.converted_user_id) : undefined;
    const isNewsletter =
      accountOptIn === true ||
      lead.marketing_opt_in === true ||
      lead.source === "newsletter" ||
      lead.source === "newsletter_popup";
    return isNewsletter ? "newsletter" : "no_newsletter";
  };

  const totalMatchingCount = fullStats?.length ?? 0;
  const hasMoreToLoad = !isLoading && (leads?.length ?? 0) < totalMatchingCount;

  const loadMore = () => {
    setIsLoadingMore(true);
    setLimit(l => l + PAGE_SIZE);
  };

  useEffect(() => {
    if (!isLoading) setIsLoadingMore(false);
  }, [isLoading]);

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

    if (typeFilter !== "all") {
      result = result.filter(l => getCrmType(l) === typeFilter);
    }

    return result;
  }, [leads, search, dateFrom, dateTo, pendingDelete, typeFilter, accountMeta]);

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

  // ─── Summary Stats (computed across ALL matching leads, not just the loaded page) ───
  const summary = useMemo(() => {
    if (!fullStats) return { total: 0, last7Days: 0, avgPerDayThisMonth: 0, avgPerDayLastMonth: 0 };
    const now = new Date();

    const sevenDaysAgo = subDays(now, 7);
    const last7Days = fullStats.filter(l => isAfter(new Date(l.created_at), sevenDaysAgo)).length;

    // Rythme d'acquisition ce mois-ci : nombre de leads depuis le 1er du mois,
    // divisé par le nombre de jours écoulés (le mois n'est pas terminé).
    const startThisMonth = startOfMonth(now);
    const daysElapsedThisMonth = getDate(now);
    const countThisMonth = fullStats.filter(l => !isBefore(new Date(l.created_at), startThisMonth)).length;
    const avgPerDayThisMonth = daysElapsedThisMonth > 0 ? countThisMonth / daysElapsedThisMonth : 0;

    // Même rythme sur le mois précédent (complet), pour comparer.
    const lastMonthRef = subMonths(now, 1);
    const startLastMonth = startOfMonth(lastMonthRef);
    const endLastMonth = endOfMonth(lastMonthRef);
    const daysInLastMonth = getDaysInMonth(lastMonthRef);
    const countLastMonth = fullStats.filter(l => {
      const d = new Date(l.created_at);
      return !isBefore(d, startLastMonth) && !isAfter(d, endLastMonth);
    }).length;
    const avgPerDayLastMonth = countLastMonth / daysInLastMonth;

    return { total: fullStats.length, last7Days, avgPerDayThisMonth, avgPerDayLastMonth };
  }, [fullStats]);

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
    <TableHead className={cn("h-8 text-[10px] uppercase tracking-wider", className)}>
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

  // Supprime le compte associé à un lead (via l'outil déjà utilisé pour
  // l'équipe dans "Comptes"). Refuse si la personne a de vraies réservations,
  // pour ne jamais perdre l'historique d'un client actif.
  const deleteLinkedAccount = async (userId: string): Promise<{ ok: true } | { ok: false; error: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "delete", userId },
      });
      if (error) {
        if (error instanceof FunctionsHttpError) {
          const d = await error.context.json();
          return { ok: false, error: d.error || "Erreur lors de la suppression du compte." };
        }
        return { ok: false, error: error.message || "Erreur lors de la suppression du compte." };
      }
      if (!data?.success) return { ok: false, error: data?.error || "Erreur lors de la suppression du compte." };
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || "Erreur lors de la suppression du compte." };
    }
  };

  const deleteLeadsMutation = useMutation({
    mutationFn: async (targets: Lead[]) => {
      const blocked: string[] = [];
      const idsToDelete: string[] = [];

      for (const lead of targets) {
        if (lead.converted_user_id) {
          const result = await deleteLinkedAccount(lead.converted_user_id);
          if (!result.ok) {
            blocked.push(lead.email);
            continue;
          }
        }
        idsToDelete.push(lead.id);
      }

      if (idsToDelete.length > 0) {
        const { error } = await supabase.from("leads").delete().in("id", idsToDelete);
        if (error) throw error;
      }

      return { blocked };
    },
    onSuccess: ({ blocked }) => {
      refetch();
      setSelectedIds(new Set());
      if (blocked.length > 0) {
        toast.error(
          `Compte non supprimé (réservation(s) existante(s)), fiche conservée : ${blocked.join(", ")}`
        );
      }
    },
  });

  // ─── Undo delete logic ───
  const softDelete = (targets: Lead[]) => {
    const ids = targets.map(t => t.id);
    setPendingDelete(ids);
    setSelectedLeadId(null);
    setDeleteConfirmOpen(false);
    setBulkDeleteOpen(false);
    setSelectedIds(new Set());

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      deleteLeadsMutation.mutate(targets);
      setPendingDelete(null);
    }, 5000);

    const hasAccount = targets.some(t => t.converted_user_id);
    toast(hasAccount ? "Fiche(s) et compte(s) associé(s) supprimés" : "Lead deleted", {
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

  const sendQuestionnaire = async () => {
    if (!selectedLead || sendingQuestionnaire) return;
    setSendingQuestionnaire(true);
    try {
      const { error } = await supabase.functions.invoke("send-tailor-questionnaire", {
        body: { leadId: selectedLead.id },
      });
      if (error) throw error;
      await refetch();
      toast.success("Questionnaire envoyé !");
    } catch {
      toast.error("Erreur lors de l'envoi du questionnaire");
    } finally {
      setSendingQuestionnaire(false);
    }
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
  const downloadCsv = (rows: Lead[]) => {
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

  // Exports EVERY lead matching the current source/status filters, fetched
  // fresh from the database (not just the page currently loaded on screen).
  const exportAllToCSV = async () => {
    setIsExportingAll(true);
    try {
      let query = supabase
        .from("leads")
        .select("id, created_at, updated_at, source, email, name, first_name, last_name, phone, country, city, status, is_b2b, property_name, property_type, interests, message, marketing_opt_in, metadata, notes, converted_user_id")
        .order("created_at", { ascending: false });
      if (sourceFilter !== "all") query = query.eq("source", sourceFilter);
      if (statusFilter !== "all") query = query.eq("status", statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      let rows = data as Lead[];

      if (search) {
        const s = search.toLowerCase();
        rows = rows.filter(l =>
          l.email?.toLowerCase().includes(s) ||
          l.name?.toLowerCase().includes(s) ||
          l.first_name?.toLowerCase().includes(s) ||
          l.last_name?.toLowerCase().includes(s)
        );
      }
      if (dateFrom) rows = rows.filter(l => isAfter(new Date(l.created_at), startOfDay(dateFrom)));
      if (dateTo) rows = rows.filter(l => isBefore(new Date(l.created_at), startOfDay(subDays(dateTo, -1))));
      if (typeFilter !== "all") rows = rows.filter(l => getCrmType(l) === typeFilter);

      downloadCsv(rows);
    } catch {
      toast.error("Erreur lors de l'export");
    } finally {
      setIsExportingAll(false);
    }
  };

  const uniqueSources = fullStats ? [...new Set(fullStats.map(l => l.source))] : [];

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
          <h1 className="text-2xl font-bold text-foreground">CRM</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Tous vos contacts : newsletter, clients, partenaires et équipe.
          </p>
        </div>
        <Button onClick={exportAllToCSV} variant="outline" className="gap-2" disabled={isExportingAll}>
          {isExportingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export CSV
        </Button>
      </div>

      {/* ─── Type de contact ─── */}
      <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as CrmType)}>
        <TabsList className="rounded-full bg-muted p-1 h-auto flex-wrap">
          <TabsTrigger value="all" className="rounded-full px-4 py-1.5 data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive data-[state=active]:shadow-none">
            Tous
          </TabsTrigger>
          <TabsTrigger value="newsletter" className="rounded-full px-4 py-1.5 data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive data-[state=active]:shadow-none">
            Newsletter
          </TabsTrigger>
          <TabsTrigger value="no_newsletter" className="rounded-full px-4 py-1.5 data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive data-[state=active]:shadow-none">
            Clients sans newsletter
          </TabsTrigger>
          <TabsTrigger value="partenaire" className="rounded-full px-4 py-1.5 data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive data-[state=active]:shadow-none">
            Partenaires
          </TabsTrigger>
          <TabsTrigger value="equipe" className="rounded-full px-4 py-1.5 data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive data-[state=active]:shadow-none">
            Équipe
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ─── KPIs ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="font-mono text-xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              7 derniers jours
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="font-mono text-xl font-bold">{summary.last7Days}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Acquisition moy./jour (M)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 flex items-center gap-1.5">
            <div className="font-mono text-xl font-bold">{summary.avgPerDayThisMonth.toFixed(1)}</div>
            {summary.avgPerDayThisMonth !== summary.avgPerDayLastMonth && (
              summary.avgPerDayThisMonth > summary.avgPerDayLastMonth ? (
                <ArrowUp className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDown className="h-4 w-4 text-red-500" />
              )
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Acquisition moy./jour (M-1)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="font-mono text-xl font-bold">{summary.avgPerDayLastMonth.toFixed(1)}</div>
          </CardContent>
        </Card>
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
            <TableRow className="bg-muted/50">
              <TableHead className="h-8 w-10">
                <Checkbox checked={selectedIds.size === sortedLeads.length && sortedLeads.length > 0} onCheckedChange={toggleSelectAll} />
              </TableHead>
              <SortableHead col="date">Date</SortableHead>
              <SortableHead col="email">Email</SortableHead>
              <SortableHead col="name">Name</SortableHead>
              <SortableHead col="source">Source</SortableHead>
              <SortableHead col="status">Status</SortableHead>
              <TableHead className="h-8 text-[10px] uppercase tracking-wider">Last contact</TableHead>
              <TableHead className="h-8 text-[10px] uppercase tracking-wider">Notes</TableHead>
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
                      <div className="flex flex-col gap-0.5">
                        <Badge variant="secondary" className={`text-xs ${sourceColors[lead.source] || "bg-gray-100 text-gray-800"}`}>
                          {lead.source.replace(/_/g, " ")}
                        </Badge>
                        {lead.source === "category_waitlist" && lead.metadata?.category_name && (
                          <span className="text-xs text-muted-foreground">{lead.metadata.category_name}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <LeadStatusBadge status={lead.status || "new"} />
                        <LeadLinkBadges
                          hasAccount={!!lead.converted_user_id}
                          hasReservation={leadIdsWithReservation?.has(lead.id) ?? false}
                          onAccountClick={() => lead.converted_user_id && navigate(`/admin/customers?user_id=${lead.converted_user_id}`)}
                        />
                      </div>
                    </TableCell>
                    <TableCell><LastContactBadge date={lead.updated_at || lead.created_at} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{notesPreview}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ─── Load More ─── */}
      {hasMoreToLoad && (
        <div className="flex flex-col items-center gap-1 py-2">
          <Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Charger plus de leads
          </Button>
          <p className="text-xs text-muted-foreground">
            {sortedLeads.length} sur {totalMatchingCount} affichés
          </p>
        </div>
      )}

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
          <Button size="sm" variant="secondary" onClick={() => downloadCsv(sortedLeads.filter(l => selectedIds.has(l.id)))}>
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
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className={sourceColors[selectedLead.source] || "bg-gray-100"}>
                    {selectedLead.source.replace(/_/g, " ")}
                  </Badge>
                  {selectedLead.source === "category_waitlist" && selectedLead.metadata?.category_name && (
                    <Badge variant="outline" className="text-xs">
                      {selectedLead.metadata.category_name}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">Added {format(new Date(selectedLead.created_at), "MMM d, yyyy")}</span>
                  <LeadLinkBadges
                    hasAccount={!!selectedLead.converted_user_id}
                    hasReservation={leadIdsWithReservation?.has(selectedLead.id) ?? false}
                    onAccountClick={() => selectedLead.converted_user_id && navigate(`/admin/customers?user_id=${selectedLead.converted_user_id}`)}
                  />
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

              {/* Dream Stay Details — tailored_request leads */}
              {selectedLead.source === "tailored_request" && selectedLead.metadata && Object.keys(selectedLead.metadata).length > 0 && (
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm">✨ Dream Stay Details</h4>
                  <dl className="space-y-2.5">
                    {selectedLead.metadata.occasion && (
                      <div className="flex gap-3 items-start">
                        <dt className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">Occasion</dt>
                        <dd className="text-sm font-medium">{selectedLead.metadata.occasion}</dd>
                      </div>
                    )}
                    {selectedLead.metadata.people && (
                      <div className="flex gap-3 items-start">
                        <dt className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">People</dt>
                        <dd className="text-sm">{selectedLead.metadata.people}</dd>
                      </div>
                    )}
                    {selectedLead.metadata.moods && selectedLead.metadata.moods.length > 0 && (
                      <div className="flex gap-3 items-start">
                        <dt className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">Mood(s)</dt>
                        <dd className="text-sm flex flex-wrap gap-1">
                          {(selectedLead.metadata.moods as string[]).map((m: string) => (
                            <Badge key={m} variant="secondary" className="text-xs">{m}</Badge>
                          ))}
                          {selectedLead.metadata.otherMood && (
                            <Badge variant="secondary" className="text-xs">{selectedLead.metadata.otherMood}</Badge>
                          )}
                        </dd>
                      </div>
                    )}
                    {selectedLead.metadata.timing && (
                      <div className="flex gap-3 items-start">
                        <dt className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">Timing</dt>
                        <dd className="text-sm">{selectedLead.metadata.timing}</dd>
                      </div>
                    )}
                    {selectedLead.metadata.budget && (
                      <div className="flex gap-3 items-start">
                        <dt className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">Budget</dt>
                        <dd className="text-sm font-medium text-primary">{selectedLead.metadata.budget}</dd>
                      </div>
                    )}
                    {selectedLead.metadata.description && (
                      <div className="flex gap-3 items-start">
                        <dt className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">Wishes</dt>
                        <dd className="text-sm text-muted-foreground bg-muted p-2 rounded flex-1">{selectedLead.metadata.description}</dd>
                      </div>
                    )}
                    {selectedLead.metadata.questionnaire_filled_at ? (
                      <>
                        <div className="border-t pt-2.5 mt-1">
                          <p className="text-xs text-emerald-600 font-medium mb-2">
                            ✅ Questionnaire rempli le {format(new Date(selectedLead.metadata.questionnaire_filled_at), "dd/MM/yy")}
                          </p>
                          {selectedLead.metadata.questionnaire_data?.dates && (
                            <div className="flex gap-3 items-start">
                              <dt className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">Dates</dt>
                              <dd className="text-sm font-medium">{selectedLead.metadata.questionnaire_data.dates}</dd>
                            </div>
                          )}
                          {selectedLead.metadata.questionnaire_data?.region && (
                            <div className="flex gap-3 items-start mt-2">
                              <dt className="text-xs text-muted-foreground w-20 shrink-0 pt-0.5">Région</dt>
                              <dd className="text-sm font-medium">
                                {selectedLead.metadata.questionnaire_data.region}
                                {selectedLead.metadata.questionnaire_data.otherRegion && ` — ${selectedLead.metadata.questionnaire_data.otherRegion}`}
                              </dd>
                            </div>
                          )}
                        </div>
                      </>
                    ) : selectedLead.metadata.questionnaire_sent_at ? (
                      <div className="border-t pt-2.5 mt-1">
                        <p className="text-xs text-muted-foreground italic">
                          Questionnaire envoyé le {format(new Date(selectedLead.metadata.questionnaire_sent_at), "dd/MM/yy")} — en attente de réponse
                        </p>
                      </div>
                    ) : null}
                  </dl>
                </div>
              )}

              {/* Experience Request Details — experience_only leads (dont demandes bateaux) */}
              {selectedLead.source === "experience_only" && selectedLead.metadata && (
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm">🚤 Demande d'expérience</h4>
                  <dl className="space-y-2.5">
                    {selectedLead.metadata.experience_title && (
                      <div className="flex gap-3 items-start">
                        <dt className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5">Expérience</dt>
                        <dd className="text-sm font-medium">{selectedLead.metadata.experience_title}</dd>
                      </div>
                    )}
                    {selectedLead.metadata.requested_date && (
                      <div className="flex gap-3 items-start">
                        <dt className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5">Date souhaitée</dt>
                        <dd className="text-sm">{format(new Date(selectedLead.metadata.requested_date), "dd/MM/yyyy")}</dd>
                      </div>
                    )}
                    {selectedLead.metadata.adults != null && (
                      <div className="flex gap-3 items-start">
                        <dt className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5">Participants</dt>
                        <dd className="text-sm">
                          {selectedLead.metadata.party_max
                            ? `${selectedLead.metadata.adults}-${selectedLead.metadata.party_max}`
                            : selectedLead.metadata.adults + (selectedLead.metadata.children || 0)}
                        </dd>
                      </div>
                    )}
                    {selectedLead.metadata.message && (
                      <div className="flex gap-3 items-start">
                        <dt className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5">Message</dt>
                        <dd className="text-sm text-muted-foreground bg-muted p-2 rounded flex-1">{selectedLead.metadata.message}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Partner Qualification — partners leads */}
              {selectedLead.source === "partners" && selectedLead.metadata && (
                selectedLead.metadata.partner_goals?.length ||
                selectedLead.metadata.pms ||
                selectedLead.metadata.num_rooms ||
                selectedLead.metadata.facilities?.length
              ) && (
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm">🏨 Partner Qualification</h4>
                  <dl className="space-y-2.5">
                    {selectedLead.metadata.partner_goals?.length > 0 && (
                      <div className="flex gap-3 items-start">
                        <dt className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5">Goals</dt>
                        <dd className="text-sm flex flex-wrap gap-1">
                          {(selectedLead.metadata.partner_goals as string[]).map((g: string) => (
                            <Badge key={g} variant="secondary" className="text-xs capitalize">
                              {g.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </dd>
                      </div>
                    )}
                    {selectedLead.metadata.pms && (
                      <div className="flex gap-3 items-start">
                        <dt className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5">PMS</dt>
                        <dd className="text-sm font-medium">{selectedLead.metadata.pms}</dd>
                      </div>
                    )}
                    {selectedLead.metadata.num_rooms && (
                      <div className="flex gap-3 items-start">
                        <dt className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5">Rooms</dt>
                        <dd className="text-sm font-medium">{selectedLead.metadata.num_rooms}</dd>
                      </div>
                    )}
                    {selectedLead.metadata.facilities?.length > 0 && (
                      <div className="flex gap-3 items-start">
                        <dt className="text-xs text-muted-foreground w-24 shrink-0 pt-0.5">Facilities</dt>
                        <dd className="text-sm flex flex-wrap gap-1">
                          {(selectedLead.metadata.facilities as string[]).map((f: string) => (
                            <Badge key={f} variant="outline" className="text-xs capitalize">
                              {f.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

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
                  {selectedLead.source === "tailored_request" && (
                    selectedLead.metadata?.questionnaire_sent_at ? (
                      <span className="inline-flex items-center text-xs text-muted-foreground px-2">
                        {selectedLead.metadata?.questionnaire_filled_at
                          ? `✅ Questionnaire rempli le ${format(new Date(selectedLead.metadata.questionnaire_filled_at), "dd/MM/yy")}`
                          : `Questionnaire envoyé le ${format(new Date(selectedLead.metadata.questionnaire_sent_at), "dd/MM/yy")}`}
                      </span>
                    ) : (
                      <Button size="sm" variant="outline" onClick={sendQuestionnaire} disabled={sendingQuestionnaire}>
                        {sendingQuestionnaire
                          ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          : <Send className="w-4 h-4 mr-1.5" />}
                        Send questionnaire
                      </Button>
                    )
                  )}
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
            <DialogDescription>
              {selectedLead?.converted_user_id
                ? "Cette fiche a un compte associé : le compte sera aussi supprimé, sauf s'il a déjà des réservations (dans ce cas, rien ne sera supprimé). Cette action est irréversible."
                : "Are you sure you want to delete this lead? This cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => selectedLead && softDelete([selectedLead])}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Bulk Delete Confirmation ─── */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} Lead{selectedIds.size > 1 ? "s" : ""}</DialogTitle>
            <DialogDescription>
              {sortedLeads.some(l => selectedIds.has(l.id) && l.converted_user_id)
                ? "Certaines fiches ont un compte associé : ces comptes seront aussi supprimés, sauf s'ils ont déjà des réservations (dans ce cas, rien ne sera supprimé pour cette fiche). Cette action est irréversible."
                : "Are you sure you want to delete the selected leads? This cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => softDelete(sortedLeads.filter(l => selectedIds.has(l.id)))}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLeads;
