import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Eye, EyeOff, FolderOpen, GripVertical, Columns, Sparkles } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
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

// Hand-drawn pictograms shown to customers on the public homepage (see V3_CATEGORIES
// in src/pages/IndexV3.tsx) — matched by slug so the back office shows the same icon.
const CATEGORY_ICON_IMAGES: { slugHints: string[]; img: string }[] = [
  { slugHints: ["romantic"], img: "/icons/icon-romantic.png" },
  { slugHints: ["family"], img: "/icons/icon-family.png" },
  { slugHints: ["taste", "food", "culinar"], img: "/icons/icon-foody.png" },
  { slugHints: ["land", "stories"], img: "/icons/icon-stories.png" },
  { slugHints: ["nature", "beyond", "outdoor"], img: "/icons/icon-nature.png" },
  { slugHints: ["bateaux"], img: "/icons/icon-boats.svg" },
];

const getCategoryIconImage = (slug?: string | null) => {
  if (!slug) return null;
  return CATEGORY_ICON_IMAGES.find((entry) => entry.slugHints.some((hint) => slug.includes(hint)))?.img ?? null;
};

// Fallback for categories without a dedicated pictogram yet: their icon is stored as a
// kebab-case name (e.g. "tree-pine"), the same one shown to customers — convert to the
// PascalCase Lucide export name.
const getCategoryIcon = (iconName?: string | null) => {
  if (!iconName) return Sparkles;
  const pascalName = iconName
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return (LucideIcons as any)[pascalName] || Sparkles;
};

const AdminCategories = () => {
  const navigate = useNavigate();
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
        .select("*, experiences2(id)")
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
      const { data, error } = await supabase
        .from("categories")
        .update({ status: newStatus })
        .eq("id", id)
        .select("id");

      if (error) throw error;
      // Une mise à jour refusée par les droits d'accès ne renvoie pas d'erreur mais 0 ligne.
      if (!data || data.length === 0) throw new Error("Aucune catégorie modifiée");
    },
    onSuccess: () => {
      // Rafraîchit aussi les listes de catégories du site public (accueil, page catégorie),
      // gardées en mémoire 5 minutes : sinon une puce dépubliée resterait visible.
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" && query.queryKey[0].includes("categor"),
      });
      toast.success("Category status updated");
    },
    onError: (error: Error) => {
      toast.error("Impossible de changer le statut", { description: error.message });
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
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1814]">Categories</h2>
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
              <Button size="sm" className="bg-[#1A1814] text-white hover:bg-[#1A1814]/90">
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
                {categories.reduce((acc, c) => acc + (c.experiences2?.length || 0), 0)}
              </div>
            </div>
          </div>
        )}

        {/* Grid of category cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12 border rounded-lg bg-card">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {categories.map((category, idx) => {
              const expCount = category.experiences2?.length || 0;
              const isEmptyPublished = category.status === "published" && expCount === 0;
              const iconImage = category.icon_image || getCategoryIconImage(category.slug);
              const CategoryIcon = getCategoryIcon(category.icon);

              return (
                <div
                  key={category.id}
                  className={`group relative bg-card border rounded-lg p-4 pt-8 flex flex-col items-center text-center cursor-pointer transition-colors hover:border-foreground/25 ${
                    dragOverIdx === idx ? "bg-accent/40" : ""
                  }`}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={handleDragEnd}
                  onClick={() => navigate(`/admin/categories/edit/${category.id}`)}
                >
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab active:cursor-grabbing shrink-0" />
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[#6B7280] hover:text-[#1A1814]"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/categories/edit/${category.id}`);
                        }}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-[#6B7280] hover:text-[#1A1814]"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePublishMutation.mutate({
                            id: category.id,
                            currentStatus: category.status,
                          });
                        }}
                      >
                        {category.status === "published" ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(category.id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="w-12 h-12 flex items-center justify-center">
                    {iconImage ? (
                      <img src={iconImage} alt={category.name} className="w-11 h-11 object-contain" />
                    ) : (
                      <CategoryIcon className="w-6 h-6 text-stone-500" strokeWidth={1.5} />
                    )}
                  </div>

                  <div className="mt-2 font-bold text-sm uppercase tracking-wide leading-tight">
                    {category.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {expCount} expérience{expCount !== 1 ? "s" : ""}
                  </div>
                  {showSlug && (
                    <code className="text-xs bg-muted px-2 py-1 rounded mt-2 inline-block">
                      {category.slug}
                    </code>
                  )}

                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <StatusBadge status={category.status} />
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
                </div>
              );
            })}

            {/* Add category tile */}
            <Link
              to="/admin/categories/new"
              className="border border-dashed rounded-lg flex flex-col items-center justify-center gap-2 min-h-[152px] text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            >
              <div className="w-11 h-11 rounded-full border border-dashed flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">Ajouter</span>
            </Link>
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
