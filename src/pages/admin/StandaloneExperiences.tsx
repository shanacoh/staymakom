import { useState, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Eye, EyeOff, Trash2, MoreHorizontal, ExternalLink } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { StandaloneExperienceForm } from "@/components/forms/StandaloneExperienceForm";
import { toast } from "sonner";

const AdminStandaloneExperiences = () => {
  const navigate = useNavigate();
  const { experienceId } = useParams();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expToDelete, setExpToDelete] = useState<string | null>(null);

  const isFormView = window.location.pathname.includes("/new") || window.location.pathname.includes("/edit");

  const { data: experiences, isLoading } = useQuery({
    queryKey: ["admin-standalone-experiences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("standalone_experiences")
        .select("id, slug, title, status, hero_image, photos, base_price, currency, has_time_slots, display_order, category_id, categories(name)")
        .order("display_order", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const displayed = experiences?.filter((exp) => {
    const matchesSearch = (exp.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || exp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCloseForm = () => {
    navigate("/admin/standalone-experiences");
    queryClient.invalidateQueries({ queryKey: ["admin-standalone-experiences"] });
  };

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === "published" ? "draft" : "published";
      const { error } = await supabase.from("standalone_experiences").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-standalone-experiences"] });
      toast.success("Visibilité mise à jour");
    },
    onError: () => toast.error("Erreur mise à jour"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("standalone_experiences").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-standalone-experiences"] });
      toast.success("Expérience supprimée");
      setDeleteDialogOpen(false);
      setExpToDelete(null);
    },
    onError: () => toast.error("Erreur suppression"),
  });

  if (isFormView) {
    return (
      <div className="mx-auto p-2 sm:p-6">
        <StandaloneExperienceForm experienceId={experienceId} onClose={handleCloseForm} />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Standalone Experiences</h1>
            <p className="text-sm text-muted-foreground">Expériences "Experience Only" — sans hôtel</p>
          </div>
          <Button onClick={() => navigate("/admin/standalone-experiences/new")} size="sm" className="self-start sm:self-auto">
            <Plus className="w-4 h-4 mr-1.5" />
            Créer une expérience
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Rechercher une expérience..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Chargement...</div>
        ) : !displayed?.length ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {searchQuery || statusFilter !== "all"
                ? "Aucune expérience ne correspond aux filtres"
                : "Aucune expérience standalone créée pour l'instant"}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="divide-y divide-border">
              {displayed.map((exp) => {
                const thumb = exp.hero_image || exp.photos?.[0];
                const warnings: string[] = [];
                if (!exp.hero_image) warnings.push("Pas de photo");
                if (!exp.base_price || exp.base_price === 0) warnings.push("Pas de prix");

                return (
                  <div key={exp.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group">
                    {/* Thumbnail */}
                    <div className="shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-muted border border-border/50">
                      {thumb ? (
                        <img src={thumb} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-xs">—</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground truncate">{exp.title}</span>
                        <StatusBadge status={exp.status || "draft"} />
                        {exp.has_time_slots && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            Créneaux
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {exp.categories?.name || <span className="italic">Sans catégorie</span>}
                        {exp.base_price > 0 && (
                          <> · {exp.base_price} {exp.currency}</>
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
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => navigate(`/admin/standalone-experiences/edit/${exp.id}`)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Éditer
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
                                Voir sur le site
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => toggleVisibilityMutation.mutate({ id: exp.id, currentStatus: exp.status })}
                            className="flex items-center gap-2"
                          >
                            {exp.status === "published"
                              ? <><EyeOff className="h-3.5 w-3.5" /> Dépublier</>
                              : <><Eye className="h-3.5 w-3.5" /> Publier</>
                            }
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => { setExpToDelete(exp.id); setDeleteDialogOpen(true); }}
                            className="flex items-center gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Supprimer
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

        {/* Delete dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer l'expérience ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Les réservations existantes ne seront pas supprimées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => expToDelete && deleteMutation.mutate(expToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default AdminStandaloneExperiences;
