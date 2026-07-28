import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Pencil, Trash2, Check, X, Plus, GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  useSwipeCategories,
  useCreateSwipeCategory,
  useUpdateSwipeCategory,
  useDeleteSwipeCategory,
  useReordonnerSwipeCategories,
} from "@/lib/swipe/queries";
import type { SwipeCategory } from "@/lib/swipe/types";

const SortableRow = ({
  categorie,
  editingId,
  editNom,
  setEditNom,
  startEdit,
  saveEdit,
  cancelEdit,
  onDelete,
}: {
  categorie: SwipeCategory;
  editingId: string | null;
  editNom: string;
  setEditNom: (v: string) => void;
  startEdit: (id: string, nom: string) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
  onDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: categorie.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 border rounded-md p-2 bg-background">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground touch-none"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      <div className="flex-1">
        {editingId === categorie.id ? (
          <Input
            value={editNom}
            onChange={(e) => setEditNom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveEdit()}
            autoFocus
          />
        ) : (
          categorie.nom
        )}
      </div>

      <div className="space-x-1">
        {editingId === categorie.id ? (
          <>
            <Button size="icon" variant="ghost" onClick={saveEdit}>
              <Check className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={cancelEdit}>
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <Button size="icon" variant="ghost" onClick={() => startEdit(categorie.id, categorie.nom)}>
              <Pencil className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => onDelete(categorie.id)}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

const AdminSwipeCategories = () => {
  const { data: categories, isLoading } = useSwipeCategories();
  const createMutation = useCreateSwipeCategory();
  const updateMutation = useUpdateSwipeCategory();
  const deleteMutation = useDeleteSwipeCategory();
  const reordonnerMutation = useReordonnerSwipeCategories();

  const [nouveauNom, setNouveauNom] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNom, setEditNom] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !categories) return;
    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);
    reordonnerMutation.mutate(reordered.map((c, index) => ({ id: c.id, ordre: index })));
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">Catégories — Swipe Itinéraire</h1>
      <p className="text-muted-foreground mb-6">
        Ces catégories servent à classer les propositions de la bibliothèque swipe (hôtel, restaurant, activité...).
        Glisse-les pour choisir leur ordre — c'est cet ordre qui sera utilisé pour les dossiers avec l'option
        "Trier par catégorie" activée.
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

      {isLoading && <p className="text-muted-foreground text-sm">Chargement...</p>}
      {!isLoading && categories?.length === 0 && (
        <p className="text-muted-foreground text-sm py-6 text-center border rounded-md">
          Aucune catégorie pour le moment.
        </p>
      )}

      {categories && categories.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {categories.map((cat) => (
                <SortableRow
                  key={cat.id}
                  categorie={cat}
                  editingId={editingId}
                  editNom={editNom}
                  setEditNom={setEditNom}
                  startEdit={startEdit}
                  saveEdit={saveEdit}
                  cancelEdit={() => setEditingId(null)}
                  onDelete={setDeleteId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

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
