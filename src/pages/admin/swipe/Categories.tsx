import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Pencil, Trash2, Check, X, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useSwipeCategories,
  useCreateSwipeCategory,
  useUpdateSwipeCategory,
  useDeleteSwipeCategory,
} from "@/lib/swipe/queries";

const AdminSwipeCategories = () => {
  const { data: categories, isLoading } = useSwipeCategories();
  const createMutation = useCreateSwipeCategory();
  const updateMutation = useUpdateSwipeCategory();
  const deleteMutation = useDeleteSwipeCategory();

  const [nouveauNom, setNouveauNom] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNom, setEditNom] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!nouveauNom.trim()) return;
    try {
      await createMutation.mutateAsync(nouveauNom.trim());
      setNouveauNom("");
      toast.success("Catégorie créée");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la création");
    }
  };

  const startEdit = (id: string, nom: string) => {
    setEditingId(id);
    setEditNom(nom);
  };

  const saveEdit = async () => {
    if (!editingId || !editNom.trim()) return;
    try {
      await updateMutation.mutateAsync({ id: editingId, nom: editNom.trim() });
      setEditingId(null);
      toast.success("Catégorie mise à jour");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la mise à jour");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Catégorie supprimée");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la suppression");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Catégories — Swipe Itinéraire</h1>
      <p className="text-muted-foreground mb-6">
        Ces catégories servent à classer les propositions de la bibliothèque swipe (hôtel, restaurant, activité...).
      </p>

      <div className="flex gap-2 mb-6">
        <Input
          placeholder="Nom de la nouvelle catégorie"
          value={nouveauNom}
          onChange={(e) => setNouveauNom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <Button onClick={handleCreate} disabled={createMutation.isPending}>
          <Plus className="w-4 h-4 mr-1" /> Ajouter
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={2}>Chargement...</TableCell>
            </TableRow>
          )}
          {!isLoading && categories?.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} className="text-muted-foreground">
                Aucune catégorie pour le moment.
              </TableCell>
            </TableRow>
          )}
          {categories?.map((cat) => (
            <TableRow key={cat.id}>
              <TableCell>
                {editingId === cat.id ? (
                  <Input
                    value={editNom}
                    onChange={(e) => setEditNom(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    autoFocus
                  />
                ) : (
                  cat.nom
                )}
              </TableCell>
              <TableCell className="text-right space-x-1">
                {editingId === cat.id ? (
                  <>
                    <Button size="icon" variant="ghost" onClick={saveEdit}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="icon" variant="ghost" onClick={() => startEdit(cat.id, cat.nom)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(cat.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette catégorie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les propositions déjà classées dans cette catégorie perdront simplement leur catégorie ; elles ne
              seront pas supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminSwipeCategories;
