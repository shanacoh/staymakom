import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Eye, EyeOff, Copy, Trash2, ExternalLink } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatAddonValue, getAddonTypeLabelEn, type AddonType } from "@/types/experience2_addons";
import { StatusBadge, WarningBadge } from "@/components/admin/StatusBadge";

const AdminExperiences2 = () => {
  const navigate = useNavigate();
  const { experienceId } = useParams();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [hotelFilter, setHotelFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [experienceToDelete, setExperienceToDelete] = useState<string | null>(null);

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
          categories (id, name),
          experience2_addons (id, type, name, value, is_percentage, is_active),
          experience2_hotels (id, position, nights, hotels2 (id, name, hyperguest_property_id))
        `,
        )
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredExperiences = experiences?.filter((exp) => {
    const matchesSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || exp.status === statusFilter;

    let matchesHotel = true;
    if (hotelFilter !== "all") {
      const junctionHotelIds = ((exp as any).experience2_hotels || []).map((eh: any) => eh.hotels2?.id);
      matchesHotel = exp.hotel_id === hotelFilter || junctionHotelIds.includes(hotelFilter);
    }

    const matchesCategory = categoryFilter === "all" || exp.category_id === categoryFilter;
    return matchesSearch && matchesStatus && matchesHotel && matchesCategory;
  });

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

  const buildParcoursLabel = (experience: any) => {
    const junctionHotels = (experience.experience2_hotels || [])
      .slice()
      .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0));

    if (junctionHotels.length > 0) {
      return junctionHotels.map((eh: any, idx: number) => (
        <span key={eh.id} className="inline-flex items-center gap-1">
          {idx > 0 && <span className="text-muted-foreground mx-1">→</span>}
          <Badge variant="secondary" className="text-xs font-normal">
            {eh.hotels2?.name ?? "?"} ({eh.nights ?? 1}N)
          </Badge>
        </span>
      ));
    }

    if (experience.hotels2?.name) {
      return (
        <Badge variant="secondary" className="text-xs font-normal">
          {experience.hotels2.name}
        </Badge>
      );
    }

    return <span className="text-muted-foreground/60">No hotel</span>;
  };

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

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Experiences List */}
        {isLoading ? (
          <div className="text-center py-12">Loading experiences...</div>
        ) : !filteredExperiences?.length ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">No experiences found</CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredExperiences.map((experience) => {
              const addons = (experience as any).experience2_addons || [];
              const activeAddons = addons.filter((a: any) => a.is_active !== false);
              const hasNoCategory = !(experience as any).categories?.name;
              const hasNoPhoto = !experience.hero_image;

              // Pricing audit checks
              const hasFixedAddon = activeAddons.some((a: any) => a.type === "fixed");
              const hasCommission = activeAddons.some((a: any) =>
                ["commission", "commission_room", "commission_experience", "commission_fixed"].includes(a.type)
              );
              const junctionHotels = (experience as any).experience2_hotels || [];
              const primaryHotel = junctionHotels.length > 0
                ? junctionHotels.sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))[0]?.hotels2
                : (experience as any).hotels2;
              const hasHyperguest = !!primaryHotel?.hyperguest_property_id;

              const hasNoPricing = activeAddons.length === 0;
              const pricingWarnings: string[] = [];
              if (!hasFixedAddon) pricingWarnings.push("No experience fee");
              if (!hasCommission) pricingWarnings.push("No commission");
              if (!hasHyperguest) pricingWarnings.push("No HG link");

              return (
                <Card key={experience.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-xl font-semibold">{experience.title}</h3>
                          <StatusBadge status={experience.status || "draft"} />
                          {hasNoCategory && <WarningBadge label="No category" />}
                          {hasNoPricing && <WarningBadge label="No pricing" />}
                          {hasNoPhoto && <WarningBadge label="No photo" />}
                          {experience.status === "published" && pricingWarnings.length > 0 && (
                            <WarningBadge label={`⚠ ${pricingWarnings.join(" · ")}`} />
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1 flex-wrap">
                            <strong>Parcours:</strong> {buildParcoursLabel(experience)}
                          </div>
                          <p>
                            <strong>Category:</strong> {(experience as any).categories?.name || <span className="text-muted-foreground/60">None</span>}
                          </p>
                          <div>
                            <strong>Pricing:</strong>{" "}
                            {(experience as any).experience2_addons?.length > 0 ? (
                              <span className="inline-flex flex-wrap gap-1 ml-1">
                                {(experience as any).experience2_addons.map((addon: any) => (
                                  <Badge key={addon.id} variant="outline" className="text-xs">
                                    {getAddonTypeLabelEn(addon.type as AddonType)}: {formatAddonValue(addon)}
                                  </Badge>
                                ))}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/60">Not configured</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* 1. Edit */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/admin/experiences2/edit/${experience.id}`)}
                              className="text-[#6B7280] hover:text-[#1A1814]"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>
                        {/* 2. Preview */}
                        {experience.slug && experience.status === "published" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                className="text-[#6B7280] hover:text-[#1A1814]"
                              >
                                <a href={`/experience/${experience.slug}`} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Preview on site</TooltipContent>
                          </Tooltip>
                        )}
                        {/* 3. Duplicate */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => duplicateMutation.mutate(experience.id)}
                              className="text-[#6B7280] hover:text-[#1A1814]"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Duplicate</TooltipContent>
                        </Tooltip>
                        {/* 4. Hide/Show */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                toggleVisibilityMutation.mutate({
                                  id: experience.id,
                                  currentStatus: experience.status || "draft",
                                })
                              }
                              className="text-[#6B7280] hover:text-[#1A1814]"
                            >
                              {experience.status === "published" ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{experience.status === "published" ? "Unpublish" : "Publish"}</TooltipContent>
                        </Tooltip>
                        {/* 5. Delete */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(experience.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
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
