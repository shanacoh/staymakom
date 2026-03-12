import { useState, useCallback } from "react";
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
import { Plus, Edit, Trash2, Eye, EyeOff, FolderOpen, Image, GripVertical, Columns } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusBadge, WarningBadge } from "@/components/admin/StatusBadge";

const AdminCategories = () => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSlug, setShowSlug] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*, experiences(id)")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Category deleted successfully");
      setDeleteId(null);
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === "published" ? "draft" : "published";
      const { error } = await supabase
        .from("categories")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Category status updated");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: { id: string; display_order: number }[]) => {
      for (const item of orderedIds) {
        const { error } = await supabase
          .from("categories")
          .update({ display_order: item.display_order })
          .eq("id", item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Order updated");
    },
  });

  const handleDragStart = useCallback((idx: number) => {
    setDraggedIdx(idx);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  }, []);

  const handleDrop = useCallback((dropIdx: number) => {
    if (draggedIdx === null || draggedIdx === dropIdx || !categories) return;
    const reordered = [...categories];
    const [moved] = reordered.splice(draggedIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    const updates = reordered.map((c, i) => ({ id: c.id, display_order: i }));
    reorderMutation.mutate(updates);
    setDraggedIdx(null);
    setDragOverIdx(null);
  }, [draggedIdx, categories, reorderMutation]);

  const handleDragEnd = useCallback(() => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  }, []);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Categories</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage experience categories and their visibility
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSlug(!showSlug)}
              className="gap-1.5"
            >
              <Columns className="w-3.5 h-3.5" />
              {showSlug ? "Hide Slug" : "Show Slug"}
            </Button>
            <Link to="/admin/categories/new">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Add Category
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        {categories && categories.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Total Categories</div>
              <div className="text-2xl font-bold">{categories.length}</div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Published</div>
              <div className="text-2xl font-bold text-[#16A34A]">
                {categories.filter(c => c.status === "published").length}
              </div>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Total Experiences</div>
              <div className="text-2xl font-bold text-primary">
                {categories.reduce((acc, c) => acc + (c.experiences?.length || 0), 0)}
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12 border rounded-lg bg-card">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="border rounded-lg bg-card overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  {showSlug && <TableHead>Slug</TableHead>}
                  <TableHead className="text-center">Experiences</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category, idx) => {
                  const expCount = category.experiences?.length || 0;
                  const isEmptyPublished = category.status === "published" && expCount === 0;

                  return (
                    <TableRow
                      key={category.id}
                      className={`group ${dragOverIdx === idx ? "bg-accent/40" : ""}`}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={() => handleDrop(idx)}
                      onDragEnd={handleDragEnd}
                    >
                      <TableCell className="cursor-grab active:cursor-grabbing px-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell>
                        {category.hero_image ? (
                          <img
                            src={category.hero_image}
                            alt={category.name}
                            className="w-12 h-12 rounded-md object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                            <Image className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{category.name}</div>
                        {category.name_he && (
                          <div className="text-sm text-muted-foreground" dir="rtl">
                            {category.name_he}
                          </div>
                        )}
                      </TableCell>
                      {showSlug && (
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {category.slug}
                          </code>
                        </TableCell>
                      )}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Badge variant="secondary" className="font-mono">
                            {expCount}
                          </Badge>
                          {isEmptyPublished && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <WarningBadge label="Empty" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Published category with 0 experiences</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={category.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {category.updated_at
                          ? format(new Date(category.updated_at), "MMM d, yyyy")
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          {/* 1. Edit */}
                          <Link to={`/admin/categories/edit/${category.id}`}>
                            <Button variant="ghost" size="icon" className="text-[#6B7280] hover:text-[#1A1814]">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          {/* 2. Hide/Show */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              togglePublishMutation.mutate({
                                id: category.id,
                                currentStatus: category.status,
                              })
                            }
                            className="text-[#6B7280] hover:text-[#1A1814]"
                          >
                            {category.status === "published" ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          {/* 3. Delete */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(category.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
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
          <div className="text-center py-16 border rounded-lg bg-card">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No categories yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first category to organize experiences
            </p>
            <Link to="/admin/categories/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create your first category
              </Button>
            </Link>
          </div>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure? This will also affect all related experiences.
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

export default AdminCategories;
