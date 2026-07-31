/**
 * Back office dédié à la catégorie Bateaux : liste + création/édition.
 * Réutilise StandaloneExperienceForm (même éditeur que le reste des
 * expériences standalone) via defaultCategoryId, pas de formulaire dédié.
 * Bascule liste/formulaire selon la route, même pattern que Experiences2.tsx.
 */
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
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
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, GripVertical } from "lucide-react";
import { format } from "date-fns";
import { StandaloneExperienceForm } from "@/components/forms/StandaloneExperienceForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { BOATS_CATEGORY_ID } from "@/lib/boatsCategory";

const BOATS_QUERY_KEY = ["admin-boat-experiences"];

function useReorderBoats() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ordres: { id: string; display_order: number }[]) => {
      await Promise.all(
        ordres.map(({ id, display_order }) =>
          supabase.from("standalone_experiences").update({ display_order }).eq("id", id)
        )
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BOATS_QUERY_KEY }),
  });
}

function SortableBoatRow({ boat, onEdit }: { boat: any; onEdit: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: boat.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className="border-b last:border-0">
      <td className="p-3 w-8">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground touch-none"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="p-3 font-medium">{boat.title}</td>
      <td className="p-3"><StatusBadge status={boat.status} /></td>
      <td className="p-3">
        <Badge variant={boat.is_bookable === false ? "outline" : "secondary"}>
          {boat.is_bookable === false ? "Sur demande" : "Réservable en ligne"}
        </Badge>
      </td>
      <td className="p-3">
        {boat.base_price != null ? `${boat.base_price} ${boat.currency}` : "—"}
      </td>
      <td className="p-3 text-muted-foreground">
        {boat.updated_at ? format(new Date(boat.updated_at), "dd MMM yyyy") : "—"}
      </td>
      <td className="p-3 text-right">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </td>
    </tr>
  );
}

export default function BoatExperiences() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { experienceId } = useParams();
  const isFormView = window.location.pathname.includes("/boats/new") || window.location.pathname.includes("/boats/edit/");
  const reorderMutation = useReorderBoats();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const { data: boats, isLoading } = useQuery({
    queryKey: BOATS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("standalone_experiences")
        .select("id, title, status, is_bookable, base_price, base_price_type, currency, updated_at, display_order")
        .eq("category_id", BOATS_CATEGORY_ID)
        .order("display_order", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !isFormView,
  });

  const sortedBoats = useMemo(() => boats ?? [], [boats]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !boats) return;
    const oldIndex = boats.findIndex((b) => b.id === active.id);
    const newIndex = boats.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(boats, oldIndex, newIndex);
    queryClient.setQueryData(BOATS_QUERY_KEY, reordered);
    reorderMutation.mutate(reordered.map((b, index) => ({ id: b.id, display_order: index })));
  };

  const handleClose = () => {
    navigate("/admin/boats");
    queryClient.invalidateQueries({ queryKey: BOATS_QUERY_KEY });
  };

  if (isFormView) {
    return (
      <div className="mx-auto p-2 sm:p-6">
        <StandaloneExperienceForm
          experienceId={experienceId}
          defaultCategoryId={BOATS_CATEGORY_ID}
          onClose={handleClose}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Mes bateaux</h2>
          <p className="text-sm text-muted-foreground">Fiches de la catégorie Bateaux, affichées sur /boat</p>
        </div>
        <Button onClick={() => navigate("/admin/boats/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau bateau
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : sortedBoats.length > 0 ? (
        <div className="border rounded-lg bg-card overflow-x-auto">
          <p className="text-xs text-muted-foreground p-3 border-b">
            Glisse les lignes avec l'icône ⠿ pour changer l'ordre d'affichage des bateaux sur le site (/boat).
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-3 font-medium w-8" />
                <th className="p-3 font-medium">Titre</th>
                <th className="p-3 font-medium">Statut</th>
                <th className="p-3 font-medium">Réservation</th>
                <th className="p-3 font-medium">Prix</th>
                <th className="p-3 font-medium">Mis à jour</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sortedBoats.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {sortedBoats.map((boat) => (
                    <SortableBoatRow
                      key={boat.id}
                      boat={boat}
                      onEdit={() => navigate(`/admin/boats/edit/${boat.id}`)}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </DndContext>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-card">
          <p className="text-muted-foreground">Aucun bateau pour le moment</p>
        </div>
      )}
    </div>
  );
}
