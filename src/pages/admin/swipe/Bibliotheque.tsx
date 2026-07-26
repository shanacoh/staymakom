import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Pencil, Trash2, Copy, Search, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  useSwipePropositions,
  useSwipeCategories,
  useDeleteProposition,
  useDuplicateProposition,
  useUpdateProposition,
  useFichesNonReferencees,
  type PropositionFilters,
} from "@/lib/swipe/queries";
import type { PropositionAvecRelations } from "@/lib/swipe/types";
import { PropositionForm } from "@/components/admin/swipe/PropositionForm";

const AdminSwipeBibliotheque = () => {
  const [filters, setFilters] = useState<PropositionFilters>({ statut: "actif" });
  const [rechercheInput, setRechercheInput] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PropositionAvecRelations | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [afficherFichesManquantes, setAfficherFichesManquantes] = useState(false);
  const [editingCommissionId, setEditingCommissionId] = useState<string | null>(null);
  const [editingCommissionValue, setEditingCommissionValue] = useState("");

  const { data: categories } = useSwipeCategories();
  const { data: propositions, isLoading } = useSwipePropositions(filters);
  const { data: fichesManquantes } = useFichesNonReferencees();
  const deleteMutation = useDeleteProposition();
  const duplicateMutation = useDuplicateProposition();
  const updateMutation = useUpdateProposition();

  const lancerRecherche = () => setFilters((f) => ({ ...f, recherche: rechercheInput }));

  const ouvrirCreation = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const ouvrirEdition = (p: PropositionAvecRelations) => {
    setEditing(p);
    setFormOpen(true);
  };

  const confirmerSuppression = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Proposition supprimée (et retirée de tous les dossiers)");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la suppression");
    } finally {
      setDeleteId(null);
    }
  };

  const dupliquer = async (p: PropositionAvecRelations) => {
    try {
      await duplicateMutation.mutateAsync(p);
      toast.success("Proposition dupliquée");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la duplication");
    }
  };

  const startEditCommission = (p: PropositionAvecRelations) => {
    setEditingCommissionId(p.id);
    setEditingCommissionValue(p.commission_pourcentage?.toString() ?? "");
  };

  const saveCommission = async (id: string) => {
    try {
      await updateMutation.mutateAsync({
        id,
        commission_pourcentage: editingCommissionValue === "" ? null : Number(editingCommissionValue),
      });
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la mise à jour de la commission");
    } finally {
      setEditingCommissionId(null);
    }
  };

  const nbFichesManquantes =
    (fichesManquantes?.hotels.length ?? 0) +
    (fichesManquantes?.experiences.length ?? 0) +
    (fichesManquantes?.standalone.length ?? 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bibliothèque de propositions</h1>
          <p className="text-muted-foreground">Toutes les propositions swipe, réutilisables entre dossiers.</p>
        </div>
        <Button onClick={ouvrirCreation}>
          <Plus className="w-4 h-4 mr-1" /> Nouvelle proposition
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-8 w-56"
            placeholder="Rechercher un titre..."
            value={rechercheInput}
            onChange={(e) => setRechercheInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && lancerRecherche()}
            onBlur={lancerRecherche}
          />
        </div>
        <Select
          value={filters.categorieId ?? "toutes"}
          onValueChange={(v) => setFilters((f) => ({ ...f, categorieId: v === "toutes" ? undefined : v }))}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="toutes">Toutes les catégories</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.statut ?? "actif"}
          onValueChange={(v) => setFilters((f) => ({ ...f, statut: v as PropositionFilters["statut"] }))}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="actif">Actives</SelectItem>
            <SelectItem value="archive">Archivées</SelectItem>
            <SelectItem value="tous">Toutes</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={afficherFichesManquantes ? "default" : "outline"}
          onClick={() => setAfficherFichesManquantes((v) => !v)}
        >
          Fiches du site pas encore ajoutées {nbFichesManquantes > 0 && `(${nbFichesManquantes})`}
        </Button>
      </div>

      {afficherFichesManquantes && (
        <div className="border rounded-md p-4 mb-6 bg-muted/30">
          <p className="text-sm text-muted-foreground mb-3">
            Hôtels, expériences et expériences seules du site (brouillons inclus) qui n'ont pas encore de proposition
            dans la bibliothèque swipe. Aucune action automatique — cette liste sert uniquement de repère.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h3 className="font-medium mb-2">Hôtels ({fichesManquantes?.hotels.length ?? 0})</h3>
              <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                {fichesManquantes?.hotels.map((h) => (
                  <li key={h.id}>
                    {h.name} {h.city ? `— ${h.city}` : ""}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Expériences ({fichesManquantes?.experiences.length ?? 0})</h3>
              <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                {fichesManquantes?.experiences.map((e) => (
                  <li key={e.id}>{e.title}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">Expériences seules ({fichesManquantes?.standalone.length ?? 0})</h3>
              <ul className="text-sm space-y-1 max-h-40 overflow-y-auto">
                {fichesManquantes?.standalone.map((s) => (
                  <li key={s.id}>{s.title}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titre</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Ville</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Prix client</TableHead>
            <TableHead>Commission %</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={8}>Chargement...</TableCell>
            </TableRow>
          )}
          {!isLoading && propositions?.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-muted-foreground">
                Aucune proposition ne correspond à ces filtres.
              </TableCell>
            </TableRow>
          )}
          {propositions?.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.titre}</TableCell>
              <TableCell>{p.swipe_categories?.nom ?? "—"}</TableCell>
              <TableCell>{p.ville ?? "—"}</TableCell>
              <TableCell>
                {p.hotels2 ? (
                  <Badge variant="secondary">Hôtel lié</Badge>
                ) : p.experiences2 ? (
                  <Badge variant="secondary">Expérience liée</Badge>
                ) : (
                  <Badge variant="outline">Indépendante</Badge>
                )}
              </TableCell>
              <TableCell>{p.prix_client != null ? `${p.prix_client} €` : "—"}</TableCell>
              <TableCell>
                {editingCommissionId === p.id ? (
                  <Input
                    autoFocus
                    type="number"
                    step="0.01"
                    className="w-20 h-8"
                    value={editingCommissionValue}
                    onChange={(e) => setEditingCommissionValue(e.target.value)}
                    onBlur={() => saveCommission(p.id)}
                    onKeyDown={(e) => e.key === "Enter" && saveCommission(p.id)}
                  />
                ) : (
                  <button
                    className="hover:underline text-left"
                    onClick={() => startEditCommission(p)}
                    title="Cliquer pour modifier"
                  >
                    {p.commission_pourcentage != null ? `${p.commission_pourcentage}%` : "—"}
                  </button>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={p.statut === "actif" ? "default" : "outline"}>
                  {p.statut === "actif" ? "Actif" : "Archivé"}
                </Badge>
              </TableCell>
              <TableCell className="text-right space-x-1">
                {p.lien_reservation && (
                  <Button size="icon" variant="ghost" asChild>
                    <a href={p.lien_reservation} target="_blank" rel="noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                )}
                <Button size="icon" variant="ghost" onClick={() => dupliquer(p)} title="Dupliquer">
                  <Copy className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => ouvrirEdition(p)} title="Modifier">
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setDeleteId(p.id)} title="Supprimer">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <PropositionForm open={formOpen} onOpenChange={setFormOpen} proposition={editing} />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette proposition ?</AlertDialogTitle>
            <AlertDialogDescription>
              Elle sera retirée de tous les dossiers qui la contiennent. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmerSuppression}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminSwipeBibliotheque;
