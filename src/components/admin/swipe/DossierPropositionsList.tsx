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
import { Badge } from "@/components/ui/badge";
import { GripVertical, X } from "lucide-react";
import type { DossierPropositionAvecDetail } from "@/lib/swipe/types";

interface DossierPropositionsListProps {
  items: DossierPropositionAvecDetail[];
  onReorder: (ordres: { id: string; ordre: number }[]) => void;
  onRemove: (id: string) => void;
}

const SortableRow = ({
  item,
  onRemove,
}: {
  item: DossierPropositionAvecDetail;
  onRemove: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const proposition = item.propositions;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 border rounded-md p-3 bg-background"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground touch-none"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {proposition.photo_url ? (
        <img src={proposition.photo_url} alt="" className="w-14 h-14 object-cover rounded-md flex-shrink-0" />
      ) : (
        <div className="w-14 h-14 bg-muted rounded-md flex-shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{proposition.titre}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {proposition.swipe_categories?.nom && <Badge variant="outline">{proposition.swipe_categories.nom}</Badge>}
          {proposition.ville && <span>{proposition.ville}</span>}
        </div>
      </div>

      <Button size="icon" variant="ghost" onClick={() => onRemove(item.id)} title="Retirer du dossier">
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

export const DossierPropositionsList = ({ items, onReorder, onRemove }: DossierPropositionsListProps) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    onReorder(reordered.map((item, index) => ({ id: item.id, ordre: index })));
  };

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-6 text-center border rounded-md">
        Aucune proposition dans ce dossier pour le moment.
      </p>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item) => (
            <SortableRow key={item.id} item={item} onRemove={onRemove} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};
