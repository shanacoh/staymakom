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
import { Plus, Edit, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HotelEditor2 } from "./HotelEditor2";
import { formatDistanceToNow } from "date-fns";
import { StatusBadge, WarningBadge } from "@/components/admin/StatusBadge";

const AdminHotels2 = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const queryClient = useQueryClient();
  
  const isFormView = window.location.pathname.includes("/new") || window.location.pathname.includes("/edit");

  const { data: hotels, isLoading } = useQuery({
    queryKey: ["admin-hotels2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotels2")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  const { data: experienceStats } = useQuery({
    queryKey: ["hotel2-experience-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences2")
        .select("hotel_id, status");

      if (error) throw error;

      const stats: Record<string, { published: number; draft: number }> = {};
      data.forEach((exp) => {
        if (!stats[exp.hotel_id]) {
          stats[exp.hotel_id] = { published: 0, draft: 0 };
        }
        if (exp.status === "published") stats[exp.hotel_id].published += 1;
        else stats[exp.hotel_id].draft += 1;
      });

      return stats;
    },
  });

  const filteredHotels = useMemo(() => {
    if (!hotels) return [];
    
    return hotels.filter((hotel) => {
      const matchesStatus = statusFilter === "all" || hotel.status === statusFilter;
      const matchesRegion = regionFilter === "all" || hotel.region === regionFilter;

      // Special filter for missing HyperGuest ID
      if (statusFilter === "missing_hg") {
        return !hotel.hyperguest_property_id && (regionFilter === "all" || hotel.region === regionFilter);
      }

      return matchesStatus && matchesRegion;
    });
  }, [hotels, statusFilter, regionFilter]);

  const regions = useMemo(() => {
    if (!hotels) return [];
    const uniqueRegions = [...new Set(hotels.map((h) => h.region).filter(Boolean))];
    return uniqueRegions;
  }, [hotels]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { count } = await supabase
        .from("experiences2")
        .select("*", { count: "exact", head: true })
        .eq("hotel_id", id);
      
      if (count && count > 0) {
        throw new Error(`EXPERIENCES_EXIST:${count}`);
      }
      
      const { error } = await supabase.from("hotels2").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hotels2"] });
      toast.success("Hotel deleted successfully");
      setDeleteId(null);
    },
    onError: (error: Error) => {
      if (error.message.startsWith("EXPERIENCES_EXIST:")) {
        const count = error.message.split(":")[1];
        toast.error(
          `Cannot delete: This hotel has ${count} linked experience(s). Delete them first.`,
          { duration: 5000 }
        );
      } else {
        toast.error("Failed to delete hotel");
      }
    }
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === "published" ? "draft" : "published";
      const { error } = await supabase
        .from("hotels2")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hotels2"] });
      toast.success("Hotel status updated");
    },
  });

  if (isFormView) {
    return (
      <HotelEditor2
        hotelId={hotelId}
        onClose={() => navigate("/admin/hotels2")}
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Hotels</h2>
            <p className="text-sm text-muted-foreground">Manage your hotel properties</p>
          </div>
          <Button onClick={() => navigate("/admin/hotels2/new")} size="sm" className="self-start sm:self-auto">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Hotel
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="missing_hg">⚠ Missing HyperGuest ID</SelectItem>
            </SelectContent>
          </Select>

          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : filteredHotels && filteredHotels.length > 0 ? (
          <div className="border rounded-lg bg-card overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Hotel</TableHead>
                  <TableHead>HyperGuest ID</TableHead>
                  <TableHead className="text-center">Experiences</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHotels.map((hotel) => {
                  const stats = experienceStats?.[hotel.id] || { published: 0, draft: 0 };
                  
                  return (
                    <TableRow key={hotel.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {hotel.hero_image ? (
                            <img
                              src={hotel.hero_image}
                              alt={hotel.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted" />
                          )}
                          <div>
                            <p className="font-medium">{hotel.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {hotel.region && hotel.city ? `${hotel.city}, ${hotel.region}` : hotel.region || hotel.city || "-"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {hotel.hyperguest_property_id ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {hotel.hyperguest_property_id}
                          </Badge>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <WarningBadge label="Missing ID" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              HyperGuest ID is required for booking integration
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold">{stats.published}</span>
                        {stats.draft > 0 && (
                          <span className="text-muted-foreground text-sm"> / {stats.draft} draft</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={hotel.status || "draft"} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {hotel.updated_at
                          ? formatDistanceToNow(new Date(hotel.updated_at), { addSuffix: true })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* 1. Edit */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/admin/hotels2/edit/${hotel.id}`)}
                                className="text-[#6B7280] hover:text-[#1A1814]"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                          {/* 2. Preview */}
                          {hotel.slug && hotel.status === "published" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                  className="text-[#6B7280] hover:text-[#1A1814]"
                                >
                                  <a href={`/hotel/${hotel.slug}`} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Preview on site</TooltipContent>
                            </Tooltip>
                          )}
                          {/* 3. Hide/Show */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  togglePublishMutation.mutate({
                                    id: hotel.id,
                                    currentStatus: hotel.status,
                                  })
                                }
                                className="text-[#6B7280] hover:text-[#1A1814]"
                              >
                                {hotel.status === "published" ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{hotel.status === "published" ? "Unpublish" : "Publish"}</TooltipContent>
                          </Tooltip>
                          {/* 4. Delete */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteId(hotel.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg bg-card">
            <p className="text-muted-foreground mb-4">
              {statusFilter !== "all" || regionFilter !== "all"
                ? "No hotels match the selected filters"
                : "No hotels yet"}
            </p>
            <Button onClick={() => navigate("/admin/hotels2/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Add your first hotel
            </Button>
          </div>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Hotel</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure? This will permanently delete the hotel and all related data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
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

export default AdminHotels2;
