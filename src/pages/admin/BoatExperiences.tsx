/**
 * Back office dédié à la catégorie Bateaux : liste + création/édition.
 * La liste est affichée dans l'onglet "Bateaux" de la page Expériences
 * (/admin/experiences2?tab=boats) ; le formulaire vit sur /admin/boats/new et
 * /admin/boats/edit/:id. Réutilise StandaloneExperienceForm (même éditeur que
 * le reste des expériences standalone) via defaultCategoryId, pas de formulaire dédié.
 * Bascule liste/formulaire selon la route, même pattern que Experiences2.tsx.
 */
import { useMemo, useState } from "react";
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
import { Plus, Edit, GripVertical, Archive, ArchiveRestore } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { StandaloneExperienceForm } from "@/components/forms/StandaloneExperienceForm";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { BOATS_CATEGORY_ID } from "@/lib/boatsCategory";
import { STANDALONE_EXPERIENCE_INTERNAL, withInternalFields } from "@/lib/internalFields";
import { ArchivedToggle } from "@/components/admin/ArchivedToggle";
import { isArchived, splitArchived } from "@/lib/archive/status";
import { setListingArchived } from "@/lib/archive/actions";

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

function SortableBoatRow({ boat, onEdit, onToggleArchive }: { boat: any; onEdit: () => void; onToggleArchive: () => void }) {
  // Une fiche archivée reste affichée (archives dépliées) mais ne compte pas dans l'ordre du site.
  const archived = isArchived(boat.status);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: boat.id, disabled: archived });
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
          className={archived ? "invisible" : "cursor-grab active:cursor-grabbing text-muted-foreground touch-none"}
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
        {boat.base_price != null ? `${boat.base_price} ${boat.currency}` : "-"}
      </td>
      <td className="p-3">
        {boat.base_price != null && boat.supplier_price_adult != null
          ? (() => {
              const margeNis = boat.base_price - boat.supplier_price_adult;
              const margePercent = boat.supplier_price_adult > 0
                ? (margeNis / boat.supplier_price_adult) * 100
                : null;
              return (
                <span>
                  {margePercent != null ? `${margePercent.toFixed(0)}%` : "-"}
                  {" · "}
                  {margeNis.toFixed(0)} {boat.currency}
                </span>
              );
            })()
          : "-"}
      </td>
      <td className="p-3 text-muted-foreground">
        {boat.updated_at ? format(new Date(boat.updated_at), "dd MMM yyyy") : "-"}
      </td>
      <td className="p-3 text-right">
        <Button variant="ghost" size="sm" onClick={onToggleArchive}>
          {archived ? <ArchiveRestore className="h-4 w-4 mr-2" /> : <Archive className="h-4 w-4 mr-2" />}
          {archived ? "Désarchiver" : "Archiver"}
        </Button>
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
      // Le prix fournisseur (colonne "Marge") est rangé à part, réservé aux admins.
      return withInternalFields(STANDALONE_EXPERIENCE_INTERNAL, (data ?? []) as any[]);
    },
    enabled: !isFormView,
  });

  const [showArchived, setShowArchived] = useState(false);
  const { active: activeBoats, archived: archivedBoats } = useMemo(() => splitArchived(boats ?? []), [boats]);

  // Archiver ne supprime rien : la fiche quitte /boat, ses réservations restent. Désarchiver = retour en brouillon.
  const archiveMutation = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) => setListingArchived("standalone", id, archived),
    onSuccess: (_data, { archived }) => {
      queryClient.invalidateQueries({ queryKey: BOATS_QUERY_KEY });
      toast.success(archived ? "Bateau archivé" : "Bateau désarchivé (repassé en brouillon)");
    },
    onError: () => toast.error("Erreur lors de l'archivage"),
  });

  // Seules les fiches actives se réordonnent ; les archivées gardent leur place en fin de liste.
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = activeBoats.findIndex((b) => b.id === active.id);
    const newIndex = activeBoats.findIndex((b) => b.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(activeBoats, oldIndex, newIndex);
    queryClient.setQueryData(BOATS_QUERY_KEY, [...reordered, ...archivedBoats]);
    reorderMutation.mutate(reordered.map((b, index) => ({ id: b.id, display_order: index })));
  };

  const renderRow = (boat: any) => (
    <SortableBoatRow
      key={boat.id}
      boat={boat}
      onEdit={() => navigate(`/admin/boats/edit/${boat.id}`)}
      onToggleArchive={() => archiveMutation.mutate({ id: boat.id, archived: !isArchived(boat.status) })}
    />
  );

  const handleClose = () => {
    navigate("/admin/experiences2?tab=boats");
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
          <h1 className="text-xl font-bold tracking-tight text-foreground">Mes bateaux</h1>
          <p className="text-sm text-muted-foreground">Fiches de la catégorie Bateaux, affichées sur /boat</p>
        </div>
        <Button onClick={() => navigate("/admin/boats/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau bateau
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : activeBoats.length > 0 || showArchived ? (
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
                <th className="p-3 font-medium">Marge</th>
                <th className="p-3 font-medium">Mis à jour</th>
                <th className="p-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={activeBoats.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                <tbody>{activeBoats.map(renderRow)}</tbody>
              </SortableContext>
              {showArchived && (
                <SortableContext items={archivedBoats.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  <tbody className="border-t">{archivedBoats.map(renderRow)}</tbody>
                </SortableContext>
              )}
            </DndContext>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-card">
          <p className="text-muted-foreground">Aucun bateau pour le moment</p>
        </div>
      )}
      {!isLoading && (
        <ArchivedToggle count={archivedBoats.length} open={showArchived} onToggle={() => setShowArchived((v) => !v)} />
      )}
    </div>
  );
}
