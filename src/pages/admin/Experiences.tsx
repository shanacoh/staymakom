import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Eye, EyeOff, Copy, Trash2, Heart } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UnifiedExperienceForm } from "@/components/forms/UnifiedExperienceForm";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AdminExperiences = () => {
  const navigate = useNavigate();
  const { experienceId } = useParams();
  const queryClient = useQueryClient();
  const [selectedHotelId, setSelectedHotelId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [hotelFilter, setHotelFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [experienceToDelete, setExperienceToDelete] = useState<string | null>(null);
  
  const isFormView = window.location.pathname.includes("/new") || window.location.pathname.includes("/edit");

  // Fetch all hotels for dropdown
  const { data: hotels } = useQuery({
    queryKey: ["admin-hotels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotels")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch all categories for filter
  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch all experiences with hotel and category info
  const { data: experiences, isLoading } = useQuery({
    queryKey: ["admin-experiences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select(`
          *,
          hotels (id, name),
          categories (id, name)
        `)
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch wishlist counts per experience
  const { data: wishlistCounts } = useQuery({
    queryKey: ["admin-wishlist-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlist")
        .select("experience_id")
        .is("deleted_at", null);
      
      if (error) throw error;
      
      // Count per experience
      const counts: Record<string, number> = {};
      data?.forEach((item) => {
        counts[item.experience_id] = (counts[item.experience_id] || 0) + 1;
      });
      return counts;
    },
  });

  // Filter experiences
  const filteredExperiences = experiences?.filter((exp) => {
    const matchesSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || exp.status === statusFilter;
    const matchesHotel = hotelFilter === "all" || exp.hotel_id === hotelFilter;
    const matchesCategory = categoryFilter === "all" || exp.category_id === categoryFilter;
    return matchesSearch && matchesStatus && matchesHotel && matchesCategory;
  });

  const handleCreateNew = () => {
    navigate("/admin/experiences/new");
  };

  const handleCloseForm = () => {
    navigate("/admin/experiences");
    queryClient.invalidateQueries({ queryKey: ["admin-experiences"] });
  };

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === "published" ? "draft" : "published";
      const { error } = await supabase
        .from("experiences")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-experiences"] });
      toast.success("Experience visibility updated");
    },
    onError: () => {
      toast.error("Error updating visibility");
    },
  });

  // Duplicate mutation
  const duplicateMutation = useMutation({
    mutationFn: async (experienceId: string) => {
      // Fetch original experience with all fields
      const { data: original, error: fetchError } = await supabase
        .from("experiences")
        .select("*")
        .eq("id", experienceId)
        .single();
      
      if (fetchError) throw fetchError;

      // Create new experience with all fields explicitly copied
      const newExperience = {
        title: `${original.title} (Copy)`,
        title_he: original.title_he ? `${original.title_he} (עותק)` : null,
        subtitle: original.subtitle,
        subtitle_he: original.subtitle_he,
        category_id: original.category_id,
        long_copy: original.long_copy,
        long_copy_he: original.long_copy_he,
        min_nights: original.min_nights,
        max_nights: original.max_nights,
        min_party: original.min_party,
        max_party: original.max_party,
        base_price: original.base_price,
        currency: original.currency,
        base_price_type: original.base_price_type,
        hotel_id: original.hotel_id,
        cancellation_policy: original.cancellation_policy,
        cancellation_policy_he: original.cancellation_policy_he,
        hero_image: original.hero_image,
        photos: original.photos,
        duration: original.duration,
        duration_he: original.duration_he,
        includes: original.includes,
        includes_he: original.includes_he,
        not_includes: original.not_includes,
        not_includes_he: original.not_includes_he,
        good_to_know: original.good_to_know,
        good_to_know_he: original.good_to_know_he,
        services: original.services,
        services_he: original.services_he,
        checkin_time: original.checkin_time,
        checkout_time: original.checkout_time,
        address: original.address,
        address_he: original.address_he,
        google_maps_link: original.google_maps_link,
        accessibility_info: original.accessibility_info,
        accessibility_info_he: original.accessibility_info_he,
        region_type: original.region_type,
        lead_time_days: original.lead_time_days,
        seo_title_en: original.seo_title_en,
        seo_title_he: original.seo_title_he,
        seo_title_fr: original.seo_title_fr,
        meta_description_en: original.meta_description_en,
        meta_description_he: original.meta_description_he,
        meta_description_fr: original.meta_description_fr,
        og_title_en: original.og_title_en,
        og_title_he: original.og_title_he,
        og_title_fr: original.og_title_fr,
        og_description_en: original.og_description_en,
        og_description_he: original.og_description_he,
        og_description_fr: original.og_description_fr,
        og_image: original.og_image,
        slug: generateSlug(`${original.title}-copy-${Date.now()}`),
        status: "draft" as const,
      };

      // Insert new experience and get the new ID
      const { data: insertedExperience, error: insertError } = await supabase
        .from("experiences")
        .insert([newExperience])
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      const newExperienceId = insertedExperience.id;

      // Duplicate experience_includes (What's Included items)
      const { data: includes, error: includesError } = await supabase
        .from("experience_includes")
        .select("*")
        .eq("experience_id", experienceId);
      
      if (includesError) throw includesError;
      
      if (includes && includes.length > 0) {
        const newIncludes = includes.map(({ id, created_at, updated_at, experience_id, ...includeRest }) => ({
          ...includeRest,
          experience_id: newExperienceId,
        }));
        
        const { error: includesInsertError } = await supabase
          .from("experience_includes")
          .insert(newIncludes);
        
        if (includesInsertError) throw includesInsertError;
      }

      // Duplicate experience_extras (Linked extras)
      const { data: extras, error: extrasError } = await supabase
        .from("experience_extras")
        .select("*")
        .eq("experience_id", experienceId);
      
      if (extrasError) throw extrasError;
      
      if (extras && extras.length > 0) {
        const newExtras = extras.map(({ id, created_at, updated_at, experience_id, ...extraRest }) => ({
          ...extraRest,
          experience_id: newExperienceId,
        }));
        
        const { error: extrasInsertError } = await supabase
          .from("experience_extras")
          .insert(newExtras);
        
        if (extrasInsertError) throw extrasInsertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-experiences"] });
      toast.success("Experience duplicated successfully with all items");
    },
    onError: (error: any) => {
      console.error("Duplicate error:", error);
      toast.error(error.message || "Error duplicating experience");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (experienceId: string) => {
      const { error } = await supabase
        .from("experiences")
        .delete()
        .eq("id", experienceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-experiences"] });
      toast.success("Experience deleted");
      setDeleteDialogOpen(false);
      setExperienceToDelete(null);
    },
    onError: () => {
      toast.error("Error deleting experience");
    },
  });

  const handleDeleteClick = (experienceId: string) => {
    setExperienceToDelete(experienceId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (experienceToDelete) {
      deleteMutation.mutate(experienceToDelete);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline",
      pending: "secondary",
      published: "default",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };
  // Get experience data for form view
  const { data: experienceData } = useQuery({
    queryKey: ["experience", experienceId],
    queryFn: async () => {
      if (!experienceId) return null;
      const { data, error } = await supabase
        .from("experiences")
        .select("hotel_id")
        .eq("id", experienceId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!experienceId && isFormView,
  });

  // Hotel selector dialog for creating new experience
  if (isFormView && !selectedHotelId && !experienceId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Hotel for New Experience</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a hotel..." />
                </SelectTrigger>
                <SelectContent>
                  {hotels?.map((hotel) => (
                    <SelectItem key={hotel.id} value={hotel.id}>
                      {hotel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {}} 
                  disabled={!selectedHotelId}
                >
                  Continue
                </Button>
                <Button variant="outline" onClick={() => navigate("/admin/experiences")}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isFormView && (selectedHotelId || experienceData)) {
    const hotelIdToUse = selectedHotelId || experienceData?.hotel_id || "";
    const hotelName = hotels?.find(h => h.id === hotelIdToUse)?.name || "";
    return (
      <div className="container mx-auto p-6">
        <UnifiedExperienceForm
          hotelId={hotelIdToUse}
          hotelName={hotelName}
          experienceId={experienceId}
          onClose={handleCloseForm}
          mode="admin"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Experiences</h1>
          <p className="text-sm text-muted-foreground">Manage all hotel experiences</p>
        </div>
        <Button size="sm" onClick={handleCreateNew}>
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
          <CardContent className="py-12 text-center text-muted-foreground">
            No experiences found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredExperiences.map((experience) => (
            <Card key={experience.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{experience.title}</h3>
                      {getStatusBadge(experience.status || "draft")}
                      {wishlistCounts && wishlistCounts[experience.id] > 0 && (
                        <Badge variant="secondary" className="bg-red-100 text-red-700 flex items-center gap-1">
                          <Heart className="h-3 w-3 fill-current" />
                          {wishlistCounts[experience.id]}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        <strong>Hotel:</strong> {experience.hotels?.name || "Unknown"}
                      </p>
                      <p>
                        <strong>Category:</strong> {experience.categories?.name || "No category"}
                      </p>
                      <p>
                        <strong>Price:</strong> {experience.currency} {experience.base_price}
                      </p>
                      <p>
                        <strong>Last updated:</strong>{" "}
                        {new Date(experience.updated_at || "").toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <TooltipProvider>
                    <div className="flex gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => navigate(`/admin/experiences/edit/${experience.id}`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => navigate(`/experience/${experience.slug}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => toggleVisibilityMutation.mutate({
                              id: experience.id,
                              currentStatus: experience.status || "draft"
                            })}
                            disabled={toggleVisibilityMutation.isPending}
                          >
                            {experience.status === "published" ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {experience.status === "published" ? "Hide" : "Show"}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => duplicateMutation.mutate(experience.id)}
                            disabled={duplicateMutation.isPending}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Duplicate</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleDeleteClick(experience.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Experience</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this experience? This action cannot be undone.
              All associated data including bookings may be affected.
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
  );
};
export default AdminExperiences;