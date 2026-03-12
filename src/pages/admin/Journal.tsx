import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Link } from "react-router-dom";
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

const AdminJournal = () => {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-journal-posts", categoryFilter, statusFilter],
    queryFn: async () => {
      let query = supabase.from("journal_posts" as any).select("*").order("created_at", { ascending: false });

      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter as any);
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("journal_posts" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-journal-posts"] });
      toast.success("Article deleted successfully");
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error("Failed to delete article");
      console.error(error);
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === "published" ? "draft" : "published";
      const publishedAt = newStatus === "published" ? new Date().toISOString() : null;

      const { error } = await supabase
        .from("journal_posts" as any)
        .update({ status: newStatus, published_at: publishedAt })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-journal-posts"] });
      toast.success("Article status updated");
    },
    onError: (error) => {
      toast.error("Failed to update status");
      console.error(error);
    },
  });

  const getCategoryColor = (category: string) => {
    const colors = {
      Stories: "bg-[#D72638]",
      Places: "bg-amber-500",
      Guides: "bg-blue-500",
      People: "bg-green-500",
    };
    return colors[category as keyof typeof colors] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Journal</h1>
            <p className="text-sm text-muted-foreground">Manage your blog articles</p>
          </div>
          <Link to="/admin/journal/new">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              New Article
            </Button>
          </Link>
        </div>

        <div className="flex flex-wrap gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Stories">Stories</SelectItem>
            <SelectItem value="Places">Places</SelectItem>
            <SelectItem value="Guides">Guides</SelectItem>
            <SelectItem value="People">People</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading...</div>
      ) : posts && posts.length > 0 ? (
          <div className="border rounded-lg overflow-x-auto">
            <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title_en || post.title}</TableCell>
                  <TableCell>
                    <Badge className={`${getCategoryColor(post.category)} text-white`}>
                      {post.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={post.status === "published" ? "default" : "secondary"}>
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {post.published_at
                      ? format(new Date(post.published_at), "MMM d, yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell>{format(new Date(post.updated_at), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          togglePublishMutation.mutate({
                            id: post.id,
                            currentStatus: post.status,
                          })
                        }
                      >
                        {post.status === "published" ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Link to={`/admin/journal/edit/${post.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(post.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground mb-4">No articles yet</p>
          <Link to="/admin/journal/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create your first article
            </Button>
          </Link>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this article? This action cannot be undone.
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
  );
};

export default AdminJournal;
