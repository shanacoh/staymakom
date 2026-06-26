import { useState, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Eye, EyeOff, Copy, Trash2, ExternalLink, MoreHorizontal, GripVertical, Building2, Zap } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UnifiedExperience2Form } from "@/components/forms/UnifiedExperience2Form";
import { StandaloneExperienceForm } from "@/components/forms/StandaloneExperienceForm";
import { toast } from "sonner";
import { generateSlug } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { OpsSlidePanel } from "@/components/admin/OpsSlidePanel";

function computeAvailabilityAlert(exp: any): { daysToEnd: number; remainingDates: number } | null {
  if (!exp.availability_end_date) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const end = new Date(exp.availability_end_date + "T00:00:00");
  const daysToEnd = Math.ceil((end.getTime() - today.getTime()) / 86400000);
  const blockedSet = new Set<string>(Array.isArray(exp.blocked_dates) ? exp.blocked_dates : []);
  const availDays: number[] = Array.isArray(exp.available_days) ? exp.available_days : [1, 2, 3, 4, 5, 6, 7];
  const jsDays = availDays.map((d: number) => (d === 7 ? 0 : d));
  let remainingDates = 0;
  const cursor = new Date(today);
  while (cursor <= end) {
    const iso = cursor.toISOString().split("T")[0];
    if (jsDays.includes(cursor.getDay()) && !blockedSet.has(iso)) remainingDates++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return { daysToEnd, remainingDates };
}

const AdminExperiences2 = () => {
  const navigate = useNavigate();
  const { experienceId } = useParams();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [mode, setMode] = useState<"hotel" | "standalone">(
    searchParams.get("tab") === "standalone" ? "standalone" : "hotel"
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [hotelFilter, setHotelFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [experienceToDelete, setExperienceToDelete] = useState<string | null>(null);
  const [opsPanel, setOpsPanel] = useState<{ id: string; title: string } | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const isStandaloneFormView = window.location.pathname.includes("/standalone/");
  const isHotelFormView =
    !isStandaloneFormView &&
    (window.location.pathname.includes("/new") || window.location.pathname.includes("/edit"));

  const { data: hotels } = useQuery({
    queryKey: ["admin-hotels2-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hotels2").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: experiences, isLoading } = useQuery({
    queryKey: ["admin-experiences2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences2")
        .select(
          `
          id, title, status, slug, hero_image, photos, thumbnail_image, hotel_id, display_order,
          pricing_model, room_net_rate, bar_rate_markup_value, bar_rate,
          experience_net_cost, commission_room_pct, commission_addons_pct, show_on_v3_only,
          hotels2 (id, name, hyperguest_property_id),
          categories (id, name, slug),
          experience2_addons (id, type, name, value, is_percentage, is_active),
          experience2_hotels (id, position, nights, hotels2 (id, name, hyperguest_property_id))
        `,
        )
        .order("display_order", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: standaloneExps, isLoading: isLoadingStandalone } = useQuery({
    queryKey: ["admin-standalone-exps-hub"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("standalone_experiences")
        .select("id, slug, title, status, hero_image, photos, base_price, currency, display_order, availability_end_date, available_days, blocked_dates, show_on_v3_only, categories(id, name, slug)")
        .order("display_order", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as any[];
    },
  });

  // Expériences avec hôtel filtrées
  const displayedExperiences = experiences?.filter((exp) => {
    const matchesCategory = !selectedCategory || (exp as any).categories?.slug === selectedCategory;
    const matchesSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || exp.status === statusFilter;
    let matchesHotel = true;
    if (hotelFilter !== "all") {
      const ids = ((exp as any).experience2_hotels || []).map((eh: any) => eh.hotels2?.id);
      matchesHotel = exp.hotel_id === hotelFilter || ids.includes(hotelFilter);
    }
    return matchesCategory && matchesSearch && matchesStatus && matchesHotel;
  });

  // Expériences standalone filtrées
  const displayedStandalone = (standaloneExps || []).filter((exp: any) => {
    const matchesCategory = !selectedCategory || exp.categories?.slug === selectedCategory;
    const matchesSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || exp.status === statusFilter;
    return matchesCategory && matchesSearch && matchesStatus;
  });

  const handleCreateNew = () => {
    if (mode === "hotel") {
      navigate("/admin/experiences2/new");
    } else {
      navigate("/admin/experiences2/standalone/new");
    }
  };

  const handleCloseForm = () => {
    navigate("/admin/experiences2");
    queryClient.invalidateQueries({ queryKey: ["admin-experiences2"] });
  };

  const handleCloseStandaloneForm = () => {
    navigate("/admin/experiences2?tab=standalone");
    queryClient.invalidateQueries({ queryKey: ["admin-standalone-exps-hub"] });
    queryClient.invalidateQueries({ queryKey: ["v3-standalone-experiences"] });
  };

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === "published" ? "draft" : "published";
      const { error } = await supabase.from("experiences2").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-experiences2"] });
      toast.success("Experience visibility updated");
    },
    onError: () => toast.error("Error updating visibility"),
  });

  const toggleStandaloneVisibilityMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === "published" ? "draft" : "published";
      const { error } = await supabase.from("standalone_experiences").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-standalone-exps-hub"] });
      toast.success("Visibilité mise à jour");
    },
    onError: () => toast.error("Erreur"),
  });

  const toggleStandaloneV3OnlyMutation = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: boolean }) => {
      const { error } = await supabase.from("standalone_experiences").update({ show_on_v3_only: !current }).eq("id", id);
      if (error) throw error;
      return !current;
    },
    onSuccess: (newValue) => {
      queryClient.invalidateQueries({ queryKey: ["admin-standalone-exps-hub"] });
      queryClient.invalidateQueries({ queryKey: ["v3-standalone-experiences"] });
      toast.success(newValue ? "Visible uniquement sur /v3" : "Visible sur la homepage");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const toggleV3OnlyMutation = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: boolean }) => {
      const { error } = await supabase.from("experiences2").update({ show_on_v3_only: !current } as any).eq("id", id);
      if (error) throw error;
      return !current;
    },
    onSuccess: (newValue) => {
      queryClient.invalidateQueries({ queryKey: ["admin-experiences2"] });
      queryClient.invalidateQueries({ queryKey: ["latest-experiences"] });
      queryClient.invalidateQueries({ queryKey: ["all-experiences"] });
      queryClient.invalidateQueries({ queryKey: ["v3-experiences2"] });
      toast.success(newValue ? "Visible uniquement sur /v3" : "Visible sur la homepage");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (expId: string) => {
      const { data: original, error: fetchError } = await supabase
        .from("experiences2")
        .select("*")
        .eq("id", expId)
        .single();
      if (fetchError) throw fetchError;

      const { id, created_at, updated_at, ...rest } = original;
      const newSlug = generateSlug(`${original.title}-copy-${Date.now()}`);
      const { data: inserted, error: insertError } = await supabase
        .from("experiences2")
        .insert([
          {
            ...rest,
            title: `${original.title} (Copy)`,
            title_he: original.title_he ? `${original.title_he} (עותק)` : null,
            slug: newSlug,
            status: "draft" as const,
          },
        ])
        .select("id")
        .single();
      if (insertError) throw insertError;

      const { data: junctionRows, error: jError } = await supabase
        .from("experience2_hotels")
        .select("*")
        .eq("experience_id", expId)
        .order("position");
      if (jError) throw jError;

      if (junctionRows && junctionRows.length > 0) {
        const newRows = junctionRows.map(({ id: _id, experience_id: _eid, ...row }) => ({
          ...row,
          experience_id: inserted.id,
        }));
        const { error: jInsertError } = await supabase.from("experience2_hotels").insert(newRows);
        if (jInsertError) throw jInsertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-experiences2"] });
      toast.success("Experience duplicated successfully");
    },
    onError: (error: any) => {
      console.error("Duplicate error:", error);
      toast.error(error.message || "Error duplicating experience");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (expId: string) => {
      const { error } = await supabase.from("experiences2").delete().eq("id", expId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-experiences2"] });
      toast.success("Experience deleted");
      setDeleteDialogOpen(false);
      setExperienceToDelete(null);
    },
    onError: () => toast.error("Error deleting experience"),
  });

  const deleteStandaloneMutation = useMutation({
    mutationFn: async (expId: string) => {
      const { error } = await supabase.from("standalone_experiences").delete().eq("id", expId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-standalone-exps-hub"] });
      toast.success("Expérience supprimée");
      setDeleteDialogOpen(false);
      setExperienceToDelete(null);
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const handleDeleteClick = (expId: string) => {
    setExperienceToDelete(expId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!experienceToDelete) return;
    if (mode === "standalone") {
      deleteStandaloneMutation.mutate(experienceToDelete);
    } else {
      deleteMutation.mutate(experienceToDelete);
    }
  };

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: { id: string; display_order: number }[]) => {
      const results = await Promise.all(
        orderedIds.map((item) =>
          supabase.from("experiences2").update({ display_order: item.display_order } as any).eq("id", item.id)
        )
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-experiences2"] });
      queryClient.invalidateQueries({ queryKey: ["launch-experiences2-listing"] });
      queryClient.invalidateQueries({ queryKey: ["all-experiences2-page"] });
      toast.success("Ordre mis à jour");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde de l'ordre"),
  });

  const reorderStandaloneMutation = useMutation({
    mutationFn: async (orderedIds: { id: string; display_order: number }[]) => {
      const results = await Promise.all(
        orderedIds.map((item) =>
          supabase.from("standalone_experiences").update({ display_order: item.display_order }).eq("id", item.id)
        )
      );
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-standalone-exps-hub"] });
      queryClient.invalidateQueries({ queryKey: ["v3-standalone-experiences"] });
      toast.success("Ordre mis à jour");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde de l'ordre"),
  });

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all" || hotelFilter !== "all";
  const hasActiveFiltersStandalone = searchQuery !== "" || statusFilter !== "all";

  const handleDragStart = useCallback((idx: number) => {
    setDraggedIdx(idx);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  }, []);

  const handleDrop = useCallback((dropIdx: number) => {
    if (draggedIdx === null || draggedIdx === dropIdx || !displayedExperiences) return;
    const reordered = [...displayedExperiences];
    const [moved] = reordered.splice(draggedIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    const offset = selectedCategory === "romantic" ? 1000 : 0;
    const updates = reordered
      .map((e, i) => ({ id: e.id, display_order: offset + i }))
      .filter((update, i) => update.display_order !== reordered[i].display_order);
    if (updates.length > 0) {
      reorderMutation.mutate(updates);
    }
    setDraggedIdx(null);
    setDragOverIdx(null);
  }, [draggedIdx, displayedExperiences, selectedCategory, reorderMutation]);

  const handleDragEnd = useCallback(() => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  }, []);

  const handleDropStandalone = useCallback((dropIdx: number) => {
    if (draggedIdx === null || draggedIdx === dropIdx || !displayedStandalone) return;
    const reordered = [...displayedStandalone];
    const [moved] = reordered.splice(draggedIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    // Réutilise les valeurs de display_order déjà occupées par les lignes affichées
    // (utile quand une catégorie est filtrée) pour ne jamais entrer en collision
    // avec l'ordre des expériences d'autres catégories non affichées ici.
    const slots = displayedStandalone
      .map((exp: any, i: number) => exp.display_order ?? i)
      .sort((a: number, b: number) => a - b);
    const updates = reordered
      .map((exp: any, i: number) => ({ id: exp.id, display_order: slots[i] }))
      .filter((update, i) => update.display_order !== reordered[i].display_order);
    if (updates.length > 0) {
      reorderStandaloneMutation.mutate(updates);
    }
    setDraggedIdx(null);
    setDragOverIdx(null);
  }, [draggedIdx, displayedStandalone, reorderStandaloneMutation]);

  if (isStandaloneFormView) {
    return (
      <div className="mx-auto p-2 sm:p-6">
        <StandaloneExperienceForm experienceId={experienceId} onClose={handleCloseStandaloneForm} />
      </div>
    );
  }

  if (isHotelFormView) {
    return (
      <div className="mx-auto p-2 sm:p-6">
        <UnifiedExperience2Form experienceId={experienceId} onClose={handleCloseForm} />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Experiences</h1>
            <p className="text-sm text-muted-foreground">Manage your curated experiences</p>
          </div>
          <Button onClick={handleCreateNew} size="sm" className="self-start sm:self-auto">
            <Plus className="w-4 h-4 mr-1.5" />
            {mode === "hotel" ? "Create Experience" : "Create Standalone"}
          </Button>
        </div>

        {/* Toggle With Hotel / Experience Only */}
        <div className="inline-flex items-center border border-[#1B2A4A]/20 rounded-full p-1 gap-0.5">
          <button
            onClick={() => setMode("hotel")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              mode === "hotel"
                ? "bg-[#1B2A4A] text-white"
                : "text-[#1B2A4A]/60 hover:bg-muted/50"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            With Hotel
          </button>
          <button
            onClick={() => setMode("standalone")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              mode === "standalone"
                ? "bg-[#1B2A4A] text-white"
                : "text-[#1B2A4A]/60 hover:bg-muted/50"
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            Experience Only
          </button>
        </div>

        {/* Pills catégories */}
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                !selectedCategory
                  ? "bg-[#1B2A4A] text-white border-[#1B2A4A]"
                  : "border-border text-muted-foreground hover:border-foreground/40"
              }`}
            >
              Toutes
            </button>
            {(categories as any[]).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug === selectedCategory ? null : cat.slug)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  selectedCategory === cat.slug
                    ? "bg-[#1B2A4A] text-white border-[#1B2A4A]"
                    : "border-border text-muted-foreground hover:border-foreground/40"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Filtres */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search experiences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
              {mode === "hotel" && (
                <Select value={hotelFilter} onValueChange={setHotelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All hotels" />
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
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bandeau filtres actifs (drag-and-drop) */}
        {hasActiveFilters && mode === "hotel" && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            <span>⚠</span>
            <span>Désactivez les filtres pour réordonner les expériences par glisser-déposer.</span>
          </div>
        )}

        {/* ── Liste des expériences avec hôtel ── */}
        {mode === "hotel" && (
          isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading experiences...</div>
          ) : !displayedExperiences?.length ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">No experiences found</CardContent>
            </Card>
          ) : (
            <Card>
              <div className="divide-y divide-border">
                {displayedExperiences.map((experience, idx) => {
                  const addons = (experience as any).experience2_addons || [];
                  const activeAddons = addons.filter((a: any) => a.is_active !== false);
                  const hasNoCategory = !(experience as any).categories?.name;
                  const hasNoPhoto = !experience.hero_image && (!experience.photos || experience.photos.length === 0);

                  const junctionHotels = (experience as any).experience2_hotels || [];
                  const primaryHotel = junctionHotels.length > 0
                    ? junctionHotels.sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))[0]?.hotels2
                    : (experience as any).hotels2;
                  const hasHyperguest = !!primaryHotel?.hyperguest_property_id;

                  const isBarRate = (experience as any).pricing_model === "bar_rate";

                  const hasNoPricing = isBarRate
                    ? !((experience as any).room_net_rate > 0)
                    : activeAddons.length === 0;

                  const hasExperienceFee = isBarRate
                    ? ((experience as any).experience_sell_fixed > 0 || (experience as any).experience_sell_per_person > 0)
                    : activeAddons.some((a: any) => a.type === "fixed");

                  const hasCommission = isBarRate
                    ? ((experience as any).bar_rate_markup_value > 0)
                    : activeAddons.some((a: any) =>
                        ["commission", "commission_room", "commission_experience", "commission_fixed"].includes(a.type)
                      );

                  const warnings: string[] = [];
                  if (hasNoCategory) warnings.push("No category");
                  if (hasNoPricing) warnings.push("No pricing");
                  if (hasNoPhoto) warnings.push("No photo");
                  if (experience.status === "published") {
                    if (!hasExperienceFee) warnings.push("No experience fee");
                    if (!hasCommission) warnings.push("No commission");
                    if (!hasHyperguest) warnings.push("No HG link");
                  }

                  const thumb = (experience as any).thumbnail_image || experience.hero_image || (experience.photos as any)?.[0];

                  return (
                    <div
                      key={experience.id}
                      draggable={!hasActiveFilters}
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={() => handleDrop(idx)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-2 px-4 py-3 transition-colors group ${
                        dragOverIdx === idx && draggedIdx !== idx
                          ? "bg-accent/40 border-t-2 border-primary"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <div className={`shrink-0 ${hasActiveFilters ? "opacity-0 pointer-events-none" : "cursor-grab active:cursor-grabbing"}`}>
                        <GripVertical className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                      </div>

                      <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-muted border border-border/50">
                        {thumb ? (
                          <img src={thumb} alt="" loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs">—</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground truncate">{experience.title}</span>
                          <StatusBadge status={experience.status || "draft"} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {(experience as any).categories?.name || <span className="italic">No category</span>}
                          </span>
                          {junctionHotels.length > 0 && (
                            <>
                              <span className="text-muted-foreground/30">·</span>
                              <span className="text-xs text-muted-foreground">
                                {junctionHotels
                                  .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
                                  .map((eh: any) => eh.hotels2?.name)
                                  .filter(Boolean)
                                  .join(" → ")}
                              </span>
                            </>
                          )}
                        </div>
                        {warnings.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {warnings.map((w) => (
                              <span key={w} className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                ⚠ {w}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <div className="flex items-center gap-1.5 mr-1">
                          <Switch
                            checked={(experience as any).show_on_v3_only ?? false}
                            onCheckedChange={() => toggleV3OnlyMutation.mutate({ id: experience.id, current: (experience as any).show_on_v3_only ?? false })}
                          />
                          <span className="text-[10px] text-muted-foreground font-medium">V3</span>
                        </div>
                        <button
                          onClick={() => setOpsPanel({ id: experience.id, title: experience.title })}
                          className="h-7 text-[11px] font-medium px-[10px] rounded-[6px]"
                          style={{ background: "#1A1814", color: "#FAF8F4" }}
                        >
                          Ops
                        </button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1.5"
                          onClick={() => navigate(`/admin/experiences2/edit/${experience.id}`)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {experience.slug && experience.status === "published" && (
                              <DropdownMenuItem asChild>
                                <a href={`/experience/${experience.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  View on site
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => toggleVisibilityMutation.mutate({ id: experience.id, currentStatus: experience.status || "draft" })}
                              className="flex items-center gap-2"
                            >
                              {experience.status === "published"
                                ? <><EyeOff className="h-3.5 w-3.5" /> Unpublish</>
                                : <><Eye className="h-3.5 w-3.5" /> Publish</>
                              }
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => duplicateMutation.mutate(experience.id)}
                              className="flex items-center gap-2"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(experience.id)}
                              className="flex items-center gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )
        )}

        {/* Bandeau filtres actifs (drag-and-drop standalone) */}
        {hasActiveFiltersStandalone && mode === "standalone" && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            <span>⚠</span>
            <span>Désactivez les filtres pour réordonner les expériences par glisser-déposer.</span>
          </div>
        )}

        {/* ── Liste des expériences standalone ── */}
        {mode === "standalone" && (
          isLoadingStandalone ? (
            <div className="text-center py-12 text-muted-foreground">Chargement...</div>
          ) : !displayedStandalone.length ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">Aucune expérience trouvée</CardContent>
            </Card>
          ) : (
            <Card>
              <div className="divide-y divide-border">
                {displayedStandalone.map((exp: any, idx: number) => {
                  const thumb = exp.hero_image || exp.photos?.[0];
                  const warnings: string[] = [];
                  if (!exp.hero_image && (!exp.photos || exp.photos.length === 0)) warnings.push("Pas de photo");
                  if (!exp.base_price) warnings.push("Pas de prix");
                  const availAlert = computeAvailabilityAlert(exp);
                  const availAlertLevel = availAlert
                    ? (availAlert.daysToEnd <= 10 || availAlert.remainingDates <= 5)
                      ? "red"
                      : (availAlert.daysToEnd <= 30 || availAlert.remainingDates <= 10)
                      ? "orange"
                      : "green"
                    : null;

                  return (
                    <div
                      key={exp.id}
                      draggable={!hasActiveFiltersStandalone}
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={() => handleDropStandalone(idx)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-2 px-4 py-3 transition-colors group ${
                        dragOverIdx === idx && draggedIdx !== idx
                          ? "bg-accent/40 border-t-2 border-primary"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <div className={`shrink-0 ${hasActiveFiltersStandalone ? "opacity-0 pointer-events-none" : "cursor-grab active:cursor-grabbing"}`}>
                        <GripVertical className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                      </div>

                      <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-muted border border-border/50">
                        {thumb ? (
                          <img src={thumb} alt="" loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs">—</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground truncate">{exp.title}</span>
                          <StatusBadge status={exp.status || "draft"} />
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {exp.categories?.name || <span className="italic">No category</span>}
                          </span>
                          {exp.base_price > 0 && (
                            <>
                              <span className="text-muted-foreground/30">·</span>
                              <span className="text-xs text-muted-foreground">
                                {exp.base_price} {exp.currency || "USD"}
                              </span>
                            </>
                          )}
                        </div>
                        {warnings.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {warnings.map((w) => (
                              <span key={w} className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                ⚠ {w}
                              </span>
                            ))}
                          </div>
                        )}
                        {availAlert && availAlertLevel && (
                          <div className="flex gap-1 mt-1">
                            <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                              availAlertLevel === "red"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : availAlertLevel === "orange"
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : "bg-green-50 text-green-700 border-green-200"
                            }`}>
                              {availAlertLevel === "red" ? "🔴" : availAlertLevel === "orange" ? "🟠" : "🟢"}{" "}
                              {availAlert.remainingDates} créneaux · {availAlert.daysToEnd}j restants
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <div className="flex items-center gap-1.5 mr-1">
                          <Switch
                            checked={exp.show_on_v3_only ?? false}
                            onCheckedChange={() => toggleStandaloneV3OnlyMutation.mutate({ id: exp.id, current: exp.show_on_v3_only ?? false })}
                          />
                          <span className="text-[10px] text-muted-foreground font-medium">V3</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1.5"
                          onClick={() => navigate(`/admin/experiences2/standalone/edit/${exp.id}`)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {exp.slug && exp.status === "published" && (
                              <DropdownMenuItem asChild>
                                <a href={`/standalone-experience/${exp.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  View on site
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => toggleStandaloneVisibilityMutation.mutate({ id: exp.id, currentStatus: exp.status || "draft" })}
                              className="flex items-center gap-2"
                            >
                              {exp.status === "published"
                                ? <><EyeOff className="h-3.5 w-3.5" /> Unpublish</>
                                : <><Eye className="h-3.5 w-3.5" /> Publish</>
                              }
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(exp.id)}
                              className="flex items-center gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )
        )}

        {/* Ops slide panel */}
        {opsPanel && (
          <OpsSlidePanel
            experienceId={opsPanel.id}
            experienceTitle={opsPanel.title}
            open={!!opsPanel}
            onClose={() => setOpsPanel(null)}
          />
        )}

        {/* Dialogue de confirmation de suppression */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Experience</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this experience? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default AdminExperiences2;
