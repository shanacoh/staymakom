import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import { Plus, Link as LinkIcon, BarChart3, Pencil, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useDossiers, useCreateDossier, useDupliquerDossier, useDeleteDossier } from "@/lib/swipe/queries";

const STATUT_LECTURE_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  envoye: { label: "Envoyé", variant: "outline" },
  vu: { label: "Vu", variant: "secondary" },
  termine: { label: "Terminé", variant: "default" },
};

const AdminSwipeDossiers = () => {
  const navigate = useNavigate();
  const { data: dossiers, isLoading } = useDossiers();
  const createMutation = useCreateDossier();
  const dupliquerMutation = useDupliquerDossier();
  const deleteMutation = useDeleteDossier();
  const [createOpen, setCreateOpen] = useState(false);
  const [nomClient, setNomClient] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const creerDossier = async () => {
    if (!nomClient.trim()) return;
    try {
      await createMutation.mutateAsync({ nom_client: nomClient.trim() });
      toast.success("Dossier créé");
      setCreateOpen(false);
      setNomClient("");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la création du dossier");
    }
  };

  const copierLien = (token: string) => {
    const url = `${window.location.origin}/swipe/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Lien copié dans le presse-papiers");
  };

  const dupliquer = async (id: string) => {
    try {
      const nouveau = await dupliquerMutation.mutateAsync(id);
      toast.success("Dossier dupliqué — pense à renommer le client");
      navigate(`/admin/swipe/dossiers/${nouveau.id}`);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la duplication du dossier");
    }
  };

  const confirmerSuppression = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("Dossier supprimé");
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la suppression du dossier");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dossiers — Swipe Itinéraire</h1>
          <p className="text-muted-foreground">Propositions de voyage à faire swiper par vos clients.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Nouveau dossier
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Statut lecture</TableHead>
            <TableHead>Propositions</TableHead>
            <TableHead>Participants</TableHead>
            <TableHead>Créé le</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={6}>Chargement...</TableCell>
            </TableRow>
          )}
          {!isLoading && dossiers?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground">
                Aucun dossier pour le moment.
              </TableCell>
            </TableRow>
          )}
          {dossiers?.map((d) => {
            const lecture = STATUT_LECTURE_LABELS[d.statut_lecture] ?? STATUT_LECTURE_LABELS.envoye;
            return (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.nom_client}</TableCell>
                <TableCell>
                  <Badge variant={lecture.variant}>{lecture.label}</Badge>
                  {d.premiere_ouverture_at && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Ouvert le {format(new Date(d.premiere_ouverture_at), "d MMM yyyy à HH:mm", { locale: fr })}
                    </div>
                  )}
                </TableCell>
                <TableCell>{d.nbPropositions}</TableCell>
                <TableCell>{d.nbParticipants}</TableCell>
                <TableCell>{format(new Date(d.created_at), "d MMM yyyy", { locale: fr })}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="icon" variant="ghost" onClick={() => copierLien(d.token_public)} title="Copier le lien">
                    <LinkIcon className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" asChild title="Résultats">
                    <Link to={`/admin/swipe/dossiers/${d.id}/resultats`}>
                      <BarChart3 className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button size="icon" variant="ghost" asChild title="Modifier">
                    <Link to={`/admin/swipe/dossiers/${d.id}`}>
                      <Pencil className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => dupliquer(d.id)}
                    disabled={dupliquerMutation.isPending}
                    title="Dupliquer le dossier"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setDeleteId(d.id)}
                    title="Supprimer le dossier"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau dossier</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nom du client</Label>
            <Input
              value={nomClient}
              onChange={(e) => setNomClient(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && creerDossier()}
              placeholder="Ex : Famille Cohen"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button onClick={creerDossier} disabled={createMutation.isPending}>
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce dossier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le lien envoyé au client ne fonctionnera plus. Cette action est irréversible.
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

export default AdminSwipeDossiers;
