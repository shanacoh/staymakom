import { useState, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Eye, EyeOff, Copy, Trash2, ExternalLink, MoreHorizontal, GripVertical } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UnifiedExperience2Form } from "@/components/forms/UnifiedExperience2Form";
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
import { StatusBadge } from "@/components/admin/StatusBadge";
import { OpsSlidePanel } from "@/components/admin/OpsSlidePanel";

const AdminExperiences2 = () => {
  const navigate = useNavigate();
  const { experienceId } = useParams();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [hotelFilter, setHotelFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"romantic" | "adventure">("adventure");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [experienceToDelete, setExperienceToDelete] = useState<string | null>(null);
  const [opsPanel, setOpsPanel] = useState<{ id: string; title: string } | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const isFormView = window.location.pathname.includes("/new") || window.location.pathname.includes("/edit");

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
      const { data, error } = await supabase.from("categories").select("id, name").order("name");
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
          *,
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

  // Étape 1 — filtrer par onglet actif (catégorie)
  const tabExperiences = experiences?.filter((exp) => {
    const isRomantic = (exp as any).categories?.slug === "romantic";
    return activeTab === "romantic" ? isRomantic : !isRomantic;
  });

  // Étape 2 — appliquer les autres filtres (search, statut, hôtel)
  const displayedExperiences = tabExperiences?.filter((exp) => {
    const matchesSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || exp.status === statusFilter;
    let matchesHotel = true;
    if (hotelFilter !== "all") {
      const ids = ((exp as any).experience2_hotels || []).map((eh: any) => eh.hotels2?.id);
      matchesHotel = exp.hotel_id === hotelFilter || ids.includes(hotelFilter);
    }
    return matchesSearch && matchesStatus && matchesHotel;
  });

  const romanticCount = experiences?.filter((e) => (e as any).categories?.slug === "romantic").length ?? 0;
  const adventureCount = experiences?.filter((e) => (e as any).categories?.slug !== "romantic").length ?? 0;

  const handleCreateNew = () => navigate("/admin/experiences2/new");
  const handleCloseForm = () => {
    navigate("/admin/experiences2");
    queryClient.invalidateQueries({ queryKey: ["admin-experiences2"] });
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

  const handleDeleteClick = (expId: string) => {
    setExperienceToDelete(expId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (experienceToDelete) deleteMutation.mutate(experienceToDelete);
  };

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: { id: string; display_order: number }[]) => {
      for (const item of orderedIds) {
        const { error } = await supabase
          .from("experiences2")
          .update({ display_order: item.display_order } as any)
          .eq("id", item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-experiences2"] });
      queryClient.invalidateQueries({ queryKey: ["launch-experiences2-listing"] });
      queryClient.invalidateQueries({ queryKey: ["all-experiences2-page"] });
      toast.success("Ordre mis à jour");
    },
    onError: () => toast.error("Erreur lors de la sauvegarde de l'ordre"),
  });

  // Le filtre catégorie est autorisé avec le drag-and-drop (pour ordonner chaque catégorie indépendamment)
  const hasActiveFilters =
    searchQuery !== "" ||
    statusFilter !== "all" ||
    hotelFilter !== "all";

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
    // Romantic reçoit un décalage de 1000 pour éviter les conflits avec Adventure (0-999)
    const offset = activeTab === "romantic" ? 1000 : 0;
    const updates = reordered.map((e, i) => ({ id: e.id, display_order: offset + i }));
    reorderMutation.mutate(updates);
    setDraggedIdx(null);
    setDragOverIdx(null);
  }, [draggedIdx, displayedExperiences, activeTab, reorderMutation]);

  const handleDragEnd = useCallback(() => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  }, []);

  if (isFormView) {
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
            Create Experience
          </Button>
        </div>

        {/* Toggle Romantic / Adventure */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("adventure")}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              activeTab === "adventure"
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:border-foreground/40"
            }`}
          >
            Feeling Adventurous ({adventureCount})
          </button>
          <button
            onClick={() => setActiveTab("romantic")}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              activeTab === "romantic"
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:border-foreground/40"
            }`}
          >
            Romantic Escape ({romanticCount})
          </button>
        </div>

        {/* Filters */}
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
            </div>
          </CardContent>
        </Card>

        {/* Bandeau filtres actifs */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            <span>⚠</span>
            <span>Désactivez les filtres pour réordonner les expériences par glisser-déposer.</span>
          </div>
        )}

        {/* Experiences List */}
        {isLoading ? (
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
                    {/* Drag handle */}
                    <div className={`shrink-0 ${hasActiveFilters ? "opacity-0 pointer-events-none" : "cursor-grab active:cursor-grabbing"}`}>
                      <GripVertical className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                    </div>

                    {/* Thumbnail */}
                    <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-muted border border-border/50">
                      {thumb ? (
                        <img src={thumb} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs">—</div>
                      )}
                    </div>

                    {/* Main info */}
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

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
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

        {/* Delete Confirmation Dialog */}
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
