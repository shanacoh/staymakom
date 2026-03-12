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
import { Plus, Edit, Trash2, Eye, EyeOff, ExternalLink, Archive } from "lucide-react";
import { toast } from "sonner";
import { Link, useParams, useNavigate } from "react-router-dom";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HotelEditor } from "./HotelEditor";
import { formatDistanceToNow } from "date-fns";

const AdminHotels = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const queryClient = useQueryClient();
  
  const isFormView = window.location.pathname.includes("/new") || window.location.pathname.includes("/edit");

  const { data: hotels, isLoading } = useQuery({
    queryKey: ["admin-hotels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotels")
        .select(`
          *,
          hotel_admins(user_id)
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles for hotel admins
      if (data && data.length > 0) {
        const userIds = data
          .flatMap((hotel: any) => hotel.hotel_admins || [])
          .map((admin: any) => admin.user_id)
          .filter(Boolean);

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("user_profiles")
            .select("user_id, display_name")
            .in("user_id", userIds);

          // Map profiles to hotels
          return data.map((hotel: any) => ({
            ...hotel,
            hotel_admins: hotel.hotel_admins?.map((admin: any) => ({
              ...admin,
              user_profiles: profiles?.find((p) => p.user_id === admin.user_id),
            })),
          }));
        }
      }

      return data as any[];
    },
  });

  const { data: experienceStats } = useQuery({
    queryKey: ["hotel-experience-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
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
      // Check for bookings first
      const { count } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("hotel_id", id);
      
      if (count && count > 0) {
        throw new Error(`BOOKINGS_EXIST:${count}`);
      }
      
      // No bookings, proceed with deletion
      const { error } = await supabase.from("hotels" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hotels"] });
      toast.success("Hotel deleted successfully");
      setDeleteId(null);
    },
    onError: (error: Error) => {
      if (error.message.startsWith("BOOKINGS_EXIST:")) {
        const count = error.message.split(":")[1];
        toast.error(
          `Cannot delete: This hotel has ${count} existing booking(s). Archive it instead.`,
          { duration: 5000 }
        );
      } else {
        toast.error("Failed to delete hotel");
      }
    }
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("hotels" as any)
        .update({ status: 'archived' })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hotels"] });
      toast.success("Hotel archived successfully");
      setArchiveId(null);
    },
    onError: () => {
      toast.error("Failed to archive hotel");
    }
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === "published" ? "draft" : "published";
      const { error } = await supabase
        .from("hotels" as any)
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-hotels"] });
      toast.success("Hotel status updated");
    },
  });

  if (isFormView) {
    return (
      <HotelEditor
        hotelId={hotelId}
        onClose={() => navigate("/admin/hotels")}
      />
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Hotels</h2>
            <p className="text-sm text-muted-foreground">Manage hotel properties</p>
          </div>
          <Button size="sm" onClick={() => navigate("/admin/hotels/new")}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Hotel
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
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
            <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Hotel</TableHead>
                <TableHead className="text-center">Experiences Live</TableHead>
                <TableHead className="text-center">Experiences Draft / Pending</TableHead>
                <TableHead>Hotel Admin</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHotels.map((hotel) => {
                const stats = experienceStats?.[hotel.id] || { published: 0, draft: 0 };
                const draftPending = stats.draft;
                
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
                    <TableCell className="text-center">
                      <span className="font-semibold text-lg">{stats.published}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-semibold text-lg text-muted-foreground">{draftPending}</span>
                    </TableCell>
                    <TableCell>
                      {hotel.hotel_admins?.[0]?.user_profiles?.display_name || (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          hotel.status === "published"
                            ? "default"
                            : hotel.status === "archived"
                            ? "destructive"
                            : hotel.status === "pending"
                            ? "outline"
                            : "secondary"
                        }
                        className={
                          hotel.status === "published"
                            ? "bg-green-500 hover:bg-green-600"
                            : hotel.status === "archived"
                            ? "bg-gray-500 hover:bg-gray-600"
                            : hotel.status === "pending"
                            ? "border-orange-500 text-orange-500"
                            : ""
                        }
                      >
                        {hotel.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {hotel.updated_at
                        ? formatDistanceToNow(new Date(hotel.updated_at), { addSuffix: true })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/admin/hotels/edit/${hotel.id}`)}
                          title="Edit Hotel"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Link to={`/admin/experiences?hotel=${hotel.id}`}>
                          <Button variant="ghost" size="sm" title="Edit Experiences">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link to={`/hotel/${hotel.slug}`} target="_blank">
                          <Button variant="ghost" size="sm" title="Preview">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            togglePublishMutation.mutate({
                              id: hotel.id,
                              currentStatus: hotel.status,
                            })
                          }
                          title={hotel.status === "published" ? "Unpublish" : "Publish"}
                        >
                          {hotel.status === "published" ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4 text-green-600" />
                          )}
                        </Button>
                        {hotel.status !== 'archived' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setArchiveId(hotel.id)}
                            title="Archive Hotel"
                          >
                            <Archive className="w-4 h-4 text-orange-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(hotel.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
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
          <Button onClick={() => navigate("/admin/hotels/new")}>
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

      <AlertDialog open={!!archiveId} onOpenChange={() => setArchiveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Hotel</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide the hotel from public view and prevent new bookings.
              Existing bookings will remain intact. You can unarchive it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => archiveId && archiveMutation.mutate(archiveId)}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminHotels;
