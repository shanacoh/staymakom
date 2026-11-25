// Onglet « Articles » du Journal : tous les articles (anciens bilingues et nouveaux du blog
// automatique), filtrables par langue et statut, avec la date de publication prévue.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Eye, EyeOff, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { LANG_LABELS, PIPELINE_LABELS, formatIsrael, startGeneration, waitForRun } from "./journalAdmin";

const isGenerated = (p: any) => !!p.title && Array.isArray(p.body);

export function ArticlesTab() {
  const [langFilter, setLangFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-journal-posts", langFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("journal_posts" as any)
        .select("id,slug,lang,title,title_en,body,category,status,pipeline_status,scheduled_at,published_at,updated_at,block_reason,to_verify")
        .order("created_at", { ascending: false });
      if (langFilter !== "all") query = query.eq("lang", langFilter);
      if (statusFilter !== "all") query = query.eq("pipeline_status", statusFilter);
      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-journal-posts"] });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("journal_posts" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      refresh();
      toast.success("Article supprimé");
      setDeleteId(null);
    },
    onError: () => toast.error("Suppression impossible"),
  });

  // Anciens articles : publier / dépublier comme avant (le statut éditorial suit tout seul).
  const toggleLegacy = useMutation({
    mutationFn: async (post: any) => {
      const publish = post.status !== "published";
      const { error } = await supabase
        .from("journal_posts" as any)
        .update({ status: publish ? "published" : "draft", published_at: publish ? new Date().toISOString() : null })
        .eq("id", post.id);
      if (error) throw error;
    },
    onSuccess: () => {
      refresh();
      toast.success("Statut mis à jour");
    },
    onError: () => toast.error("Mise à jour impossible"),
  });

  const generateNow = async () => {
    setGenerating(true);
    try {
      const runId = await startGeneration({});
      toast.info("Rédaction en cours (1 à 3 minutes)...");
      const run = await waitForRun(runId);
      refresh();
      if (run.status === "failed" || run.status === "skipped") toast.error(run.error || "La génération n'a pas abouti");
      else if (run.post_id) navigate(`/admin/journal/article/${run.post_id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={langFilter} onValueChange={setLangFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes langues</SelectItem>
            <SelectItem value="en">Anglais</SelectItem>
            <SelectItem value="he">Hébreu</SelectItem>
            <SelectItem value="fr">Français</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(PIPELINE_LABELS).map(([value, { label }]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2 sm:ml-auto">
          <Button size="sm" variant="outline" onClick={generateNow} disabled={generating}>
            {generating ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
            Générer l'article du jour
          </Button>
          <Link to="/admin/journal/new">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Article à la main
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : posts && posts.length > 0 ? (
        <div className="border rounded-lg overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Langue</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Prévu le</TableHead>
                <TableHead>Publié le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((post) => {
                const generated = isGenerated(post);
                const status = PIPELINE_LABELS[post.pipeline_status] || PIPELINE_LABELS.draft;
                const editUrl = generated ? `/admin/journal/article/${post.id}` : `/admin/journal/edit/${post.id}`;
                return (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium max-w-[360px]">
                      <Link to={editUrl} className="hover:underline" dir={post.lang === "he" ? "rtl" : undefined}>
                        {post.title || post.title_en}
                      </Link>
                      {post.pipeline_status === "blocked" && post.block_reason && (
                        <p className="text-xs text-red-700 mt-1 line-clamp-2">{post.block_reason}</p>
                      )}
                      {!generated && <p className="text-xs text-muted-foreground mt-0.5">Ancien article (EN + HE)</p>}
                    </TableCell>
                    <TableCell>{LANG_LABELS[post.lang] || post.lang}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border-0 ${status.className}`}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{post.pipeline_status === "scheduled" ? formatIsrael(post.scheduled_at) : "-"}</TableCell>
                    <TableCell className="whitespace-nowrap">{post.published_at && post.pipeline_status === "published" ? formatIsrael(post.published_at) : "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!generated && (
                          <Button variant="ghost" size="sm" onClick={() => toggleLegacy.mutate(post)} title="Publier / dépublier">
                            {post.status === "published" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        )}
                        <Link to={editUrl}>
                          <Button variant="ghost" size="sm" title="Ouvrir">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteId(post.id)} title="Supprimer">
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
        <div className="text-center py-12 border rounded-lg text-muted-foreground">Aucun article avec ces filtres</div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'article ?</AlertDialogTitle>
            <AlertDialogDescription>
              La suppression est définitive. Pour simplement le retirer du site, utilise plutôt « Rejeter » ou « Dépublier ».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
