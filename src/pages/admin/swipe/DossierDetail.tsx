import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Link as LinkIcon, BarChart3, Pencil, Check, X, GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  useDossier,
  useDossierPropositions,
  useUpdateDossier,
  useAjouterPropositionAuDossier,
  useRetirerPropositionDuDossier,
  useReordonnerPropositionsDossier,
} from "@/lib/swipe/queries";
import { DossierPropositionsList } from "@/components/admin/swipe/DossierPropositionsList";
import { PropositionPicker } from "@/components/admin/swipe/PropositionPicker";

const SortableCategorieRow = ({ id, nom }: { id: string; nom: string }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
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
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="text-sm">{nom}</span>
    </div>
  );
};

const AdminSwipeDossierDetail = () => {
  const { dossierId } = useParams<{ dossierId: string }>();
  const { data: dossier } = useDossier(dossierId);
  const { data: propositions } = useDossierPropositions(dossierId);
  const updateDossier = useUpdateDossier();
  const ajouterProposition = useAjouterPropositionAuDossier();
  const retirerProposition = useRetirerPropositionDuDossier();
  const reordonner = useReordonnerPropositionsDossier();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editionNom, setEditionNom] = useState(false);
  const [nomEnCours, setNomEnCours] = useState("");
  const [editionMessage, setEditionMessage] = useState(false);
  const [messageEnCours, setMessageEnCours] = useState({ fr: "", en: "", he: "" });
  const [editionNoms, setEditionNoms] = useState(false);
  const [nomsEnCours, setNomsEnCours] = useState("");
  const categorySensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const categoriesDuDossier = useMemo(() => {
    const parId = new Map<string, { id: string; nom: string }>();
    for (const item of propositions ?? []) {
      const cat = item.propositions.swipe_categories;
      if (cat && !parId.has(cat.id)) parId.set(cat.id, cat);
    }
    const toutes = Array.from(parId.values());
    const ordre = dossier?.ordre_categories ?? [];
    return toutes.sort((a, b) => {
      const posA = ordre.indexOf(a.id);
      const posB = ordre.indexOf(b.id);
      if (posA !== -1 && posB !== -1) return posA - posB;
      if (posA !== -1) return -1;
      if (posB !== -1) return 1;
      return 0;
    });
  }, [propositions, dossier?.ordre_categories]);

  if (!dossier || !dossierId) return <div className="p-6">Chargement...</div>;

  const demarrerEditionNom = () => {
    setNomEnCours(dossier.nom_client);
    setEditionNom(true);
  };

  const enregistrerNom = async () => {
    if (!nomEnCours.trim()) return;
    try {
      await updateDossier.mutateAsync({ id: dossierId, nom_client: nomEnCours.trim() });
      setEditionNom(false);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors du renommage");
    }
  };

  const toggleAfficherPrix = async (checked: boolean) => {
    try {
      await updateDossier.mutateAsync({ id: dossierId, afficher_prix: checked });
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la mise à jour");
    }
  };

  const toggleTrierParCategorie = async (checked: boolean) => {
    try {
      await updateDossier.mutateAsync({ id: dossierId, trier_par_categorie: checked });
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la mise à jour");
    }
  };

  const handleDragEndCategories = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categoriesDuDossier.findIndex((c) => c.id === active.id);
    const newIndex = categoriesDuDossier.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categoriesDuDossier, oldIndex, newIndex);
    updateDossier.mutate({ id: dossierId, ordre_categories: reordered.map((c) => c.id) });
  };

  const demarrerEditionMessage = () => {
    setMessageEnCours({
      fr: dossier.message_intro ?? "",
      en: dossier.message_intro_en ?? "",
      he: dossier.message_intro_he ?? "",
    });
    setEditionMessage(true);
  };

  const enregistrerMessage = async () => {
    try {
      await updateDossier.mutateAsync({
        id: dossierId,
        message_intro: messageEnCours.fr || null,
        message_intro_en: messageEnCours.en || null,
        message_intro_he: messageEnCours.he || null,
      });
      setEditionMessage(false);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la mise à jour");
    }
  };

  const demarrerEditionNoms = () => {
    setNomsEnCours((dossier.noms_participants ?? []).join("\n"));
    setEditionNoms(true);
  };

  const enregistrerNoms = async () => {
    const noms = nomsEnCours
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);
    try {
      await updateDossier.mutateAsync({ id: dossierId, noms_participants: noms.length > 0 ? noms : null });
      setEditionNoms(false);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la mise à jour");
    }
  };

  const ajouter = async (propositionId: string) => {
    try {
      await ajouterProposition.mutateAsync({
        dossierId,
        propositionId,
        ordre: propositions?.length ?? 0,
      });
      toast.success("Proposition ajoutée au dossier");
    } catch (e: any) {
      toast.error(e.message || "Cette proposition est déjà dans le dossier");
    }
  };

  const retirer = async (id: string) => {
    try {
      await retirerProposition.mutateAsync({ id, dossierId });
    } catch (e: any) {
      toast.error(e.message || "Erreur lors du retrait");
    }
  };

  const reorder = async (ordres: { id: string; ordre: number }[]) => {
    try {
      await reordonner.mutateAsync({ dossierId, ordres });
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la réorganisation");
    }
  };

  const copierLien = () => {
    const url = `${window.location.origin}/swipe/${dossier.token_public}`;
    navigator.clipboard.writeText(url);
    toast.success("Lien copié dans le presse-papiers");
  };

  const dejaAjoutees = new Set((propositions ?? []).map((p) => p.proposition_id));

  return (
    <div className="p-6 max-w-3xl">
      <Link to="/admin/swipe/dossiers" className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Retour aux dossiers
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          {editionNom ? (
            <div className="flex items-center gap-2">
              <Input
                value={nomEnCours}
                onChange={(e) => setNomEnCours(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && enregistrerNom()}
                className="text-2xl font-bold h-auto py-1"
                autoFocus
              />
              <Button size="icon" variant="ghost" onClick={enregistrerNom}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setEditionNom(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{dossier.nom_client}</h1>
              <Button size="icon" variant="ghost" onClick={demarrerEditionNom} title="Renommer">
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          )}
          <Badge variant="outline" className="mt-1">
            {dossier.statut_lecture === "termine" ? "Terminé" : dossier.statut_lecture === "vu" ? "Vu" : "Envoyé"}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copierLien}>
            <LinkIcon className="w-4 h-4 mr-1" /> Copier le lien
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/admin/swipe/dossiers/${dossierId}/resultats`}>
              <BarChart3 className="w-4 h-4 mr-1" /> Résultats
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3 border rounded-md p-3">
        <Switch checked={dossier.afficher_prix} onCheckedChange={toggleAfficherPrix} id="afficher-prix" />
        <Label htmlFor="afficher-prix">Afficher les prix au client dans le deck de swipe</Label>
      </div>

      <div className="flex items-center gap-3 mb-6 border rounded-md p-3">
        <Switch
          checked={dossier.trier_par_categorie}
          onCheckedChange={toggleTrierParCategorie}
          id="trier-par-categorie"
        />
        <Label htmlFor="trier-par-categorie">
          Trier les propositions par catégorie (le client verra une pancarte de catégorie entre chaque groupe)
        </Label>
      </div>

      {dossier.trier_par_categorie && categoriesDuDossier.length > 1 && (
        <div className="mb-6 border rounded-md p-3 space-y-2">
          <Label>
            Ordre des catégories pour ce dossier (facultatif) — sinon, l'ordre global de la page
            Catégories est utilisé
          </Label>
          <DndContext sensors={categorySensors} collisionDetection={closestCenter} onDragEnd={handleDragEndCategories}>
            <SortableContext items={categoriesDuDossier.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5">
                {categoriesDuDossier.map((cat) => (
                  <SortableCategorieRow key={cat.id} id={cat.id} nom={cat.nom} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      <div className="mb-6 border rounded-md p-3 space-y-3">
        <div className="flex items-center justify-between">
          <Label>Message d'accueil (facultatif, affiché juste avant le prénom du client)</Label>
          {!editionMessage && (
            <Button size="icon" variant="ghost" onClick={demarrerEditionMessage} title="Modifier">
              <Pencil className="w-4 h-4" />
            </Button>
          )}
        </div>

        {editionMessage ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">🇫🇷 FR</span>
                <Textarea
                  rows={4}
                  value={messageEnCours.fr}
                  onChange={(e) => setMessageEnCours({ ...messageEnCours, fr: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">🇬🇧 EN</span>
                <Textarea
                  rows={4}
                  value={messageEnCours.en}
                  onChange={(e) => setMessageEnCours({ ...messageEnCours, en: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">🇮🇱 HE</span>
                <Textarea
                  rows={4}
                  value={messageEnCours.he}
                  onChange={(e) => setMessageEnCours({ ...messageEnCours, he: e.target.value })}
                  dir="rtl"
                  className="bg-hebrew-input"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={enregistrerMessage}>
                <Check className="w-4 h-4 mr-1" /> Enregistrer
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditionMessage(false)}>
                <X className="w-4 h-4 mr-1" /> Annuler
              </Button>
            </div>
          </>
        ) : dossier.message_intro ? (
          <p className="text-sm text-muted-foreground whitespace-pre-line">{dossier.message_intro}</p>
        ) : (
          <p className="text-sm text-muted-foreground/60 italic">Aucun message défini.</p>
        )}
      </div>

      <div className="mb-6 border rounded-md p-3 space-y-3">
        <div className="flex items-center justify-between">
          <Label>
            Prénoms proposés (facultatif) — si renseigné, le client choisit son prénom dans cette
            liste au lieu de le taper
          </Label>
          {!editionNoms && (
            <Button size="icon" variant="ghost" onClick={demarrerEditionNoms} title="Modifier">
              <Pencil className="w-4 h-4" />
            </Button>
          )}
        </div>

        {editionNoms ? (
          <>
            <Textarea
              rows={4}
              value={nomsEnCours}
              onChange={(e) => setNomsEnCours(e.target.value)}
              placeholder={"Un prénom par ligne, ex.\nAija\nNusrein"}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={enregistrerNoms}>
                <Check className="w-4 h-4 mr-1" /> Enregistrer
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditionNoms(false)}>
                <X className="w-4 h-4 mr-1" /> Annuler
              </Button>
            </div>
          </>
        ) : dossier.noms_participants && dossier.noms_participants.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {dossier.noms_participants.map((nom) => (
              <Badge key={nom} variant="outline">
                {nom}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/60 italic">
            Aucune liste définie : le client tape librement son prénom.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Propositions du dossier</h2>
        <Button onClick={() => setPickerOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Ajouter une proposition
        </Button>
      </div>

      <DossierPropositionsList items={propositions ?? []} onReorder={reorder} onRemove={retirer} />

      <PropositionPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        dejaAjoutees={dejaAjoutees}
        onAjouter={ajouter}
      />
    </div>
  );
};

export default AdminSwipeDossierDetail;
