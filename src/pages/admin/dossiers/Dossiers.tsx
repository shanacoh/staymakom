import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Copy, Eye, FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  copierLienDossierVoyage,
  errorMessage,
  useCreateDossierVoyage,
  useDossiersVoyage,
  useDupliquerDossierVoyage,
  type NouvelleDemandeInput,
} from "@/lib/dossiersVoyage/queries";
import {
  CANAL_ORIGINE_OPTIONS,
  DESTINATAIRE_TYPE_OPTIONS,
  labelOf,
  OBJECTIF_OPTIONS,
  POINT_DEPART_OPTIONS,
  STATUT_OPTIONS,
  type CanalOrigine,
  type DestinataireType,
  type Objectif,
  type PointDepart,
} from "@/lib/dossiersVoyage/types";

type Onglet = "actifs" | "modeles" | "archives";

function StatutBadge({ statut }: { statut: string }) {
  const option = STATUT_OPTIONS.find((o) => o.value === statut);
  if (!option) return <Badge variant="outline">{statut}</Badge>;
  return <Badge variant="outline" className={option.className}>{option.label}</Badge>;
}

const vide: NouvelleDemandeInput = {
  nom_destinataire: "",
  email: "",
  telephone: "",
  destinataire_type: "client",
  objectif: "vente",
  point_depart: "proposition",
  canal_origine: "saisie_manuelle",
  contenu_brut_recu: "",
};

export default function Dossiers() {
  const { data: dossiers, isLoading } = useDossiersVoyage();
  const createMutation = useCreateDossierVoyage();
  const dupliquerMutation = useDupliquerDossierVoyage();

  const [onglet, setOnglet] = useState<Onglet>("actifs");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NouvelleDemandeInput>(vide);

  const [dupliquerDe, setDupliquerDe] = useState<{ id: string; nom: string } | null>(null);
  const [nomDuplication, setNomDuplication] = useState("");

  const visibles = useMemo(() => {
    if (!dossiers) return [];
    if (onglet === "modeles") return dossiers.filter((d) => d.est_modele);
    if (onglet === "archives") return dossiers.filter((d) => d.archive && !d.est_modele);
    return dossiers.filter((d) => !d.archive && !d.est_modele);
  }, [dossiers, onglet]);

  const copierLien = async (token: string) => {
    await navigator.clipboard.writeText(copierLienDossierVoyage(token));
    toast.success("Lien copié dans le presse-papiers");
  };

  const creer = async () => {
    if (!form.nom_destinataire.trim()) {
      toast.error("Le nom du destinataire est obligatoire");
      return;
    }
    try {
      await createMutation.mutateAsync(form);
      toast.success("Dossier créé");
      setOpen(false);
      setForm(vide);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const dupliquer = async () => {
    if (!dupliquerDe || !nomDuplication.trim()) return;
    try {
      await dupliquerMutation.mutateAsync({ modeleId: dupliquerDe.id, nom_destinataire: nomDuplication });
      toast.success("Dossier créé à partir du modèle");
      setDupliquerDe(null);
      setNomDuplication("");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Dossiers</h1>
          <p className="text-sm text-muted-foreground">
            Dossiers de voyage : Explorer, Proposition et Carnet, sur un seul lien par client.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nouvelle demande
        </Button>
      </div>

      <Tabs value={onglet} onValueChange={(v) => setOnglet(v as Onglet)}>
        <TabsList>
          <TabsTrigger value="actifs">En cours</TabsTrigger>
          <TabsTrigger value="modeles">Modèles</TabsTrigger>
          <TabsTrigger value="archives">Archivés</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Destinataire</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Objectif</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead>Ouvertures</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                  Chargement...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && visibles.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                  Aucun dossier dans cet onglet.
                </TableCell>
              </TableRow>
            )}
            {visibles.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.nom_destinataire}</TableCell>
                <TableCell>
                  <StatutBadge statut={d.statut} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {labelOf(CANAL_ORIGINE_OPTIONS, d.canal_origine as CanalOrigine)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {labelOf(OBJECTIF_OPTIONS, d.objectif as Objectif)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(d.created_at), "d MMM yyyy", { locale: fr })}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{d.nb_ouvertures}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {d.est_modele && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDupliquerDe({ id: d.id, nom: d.nom_destinataire });
                          setNomDuplication("");
                        }}
                      >
                        Dupliquer
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => copierLien(d.token_public)} title="Copier le lien client">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" asChild title="Voir le dossier">
                      <Link to={`/admin/dossiers/${d.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Nouvelle demande : saisie manuelle (message WhatsApp/email transféré, ou formulaire collé à la main) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle demande</DialogTitle>
            <DialogDescription>
              Pour une demande arrivée par WhatsApp ou email : colle le message reçu ci-dessous, le texte d'origine
              reste consultable dans le dossier.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nd-nom">Nom du destinataire *</Label>
                <Input
                  id="nd-nom"
                  value={form.nom_destinataire}
                  onChange={(e) => setForm((f) => ({ ...f, nom_destinataire: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={form.destinataire_type}
                  onValueChange={(v) => setForm((f) => ({ ...f, destinataire_type: v as DestinataireType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DESTINATAIRE_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nd-email">Email</Label>
                <Input
                  id="nd-email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  inputMode="email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nd-tel">Téléphone</Label>
                <Input
                  id="nd-tel"
                  value={form.telephone}
                  onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
                  inputMode="tel"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Canal d'arrivée</Label>
                <Select
                  value={form.canal_origine}
                  onValueChange={(v) => setForm((f) => ({ ...f, canal_origine: v as CanalOrigine }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CANAL_ORIGINE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Objectif</Label>
                <Select value={form.objectif} onValueChange={(v) => setForm((f) => ({ ...f, objectif: v as Objectif }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OBJECTIF_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Point de départ</Label>
                <Select
                  value={form.point_depart}
                  onValueChange={(v) => setForm((f) => ({ ...f, point_depart: v as PointDepart }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POINT_DEPART_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nd-brut">Message reçu (collé tel quel)</Label>
              <Textarea
                id="nd-brut"
                rows={5}
                value={form.contenu_brut_recu}
                onChange={(e) => setForm((f) => ({ ...f, contenu_brut_recu: e.target.value }))}
                placeholder="Colle ici le message WhatsApp ou l'email reçu..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={creer} disabled={createMutation.isPending}>
              Créer le dossier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplication d'un modèle */}
      <Dialog open={!!dupliquerDe} onOpenChange={(o) => !o && setDupliquerDe(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Dupliquer "{dupliquerDe?.nom}"</DialogTitle>
            <DialogDescription>
              Le programme et les lieux imposés du modèle sont copiés. Donne un nom au nouveau destinataire.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="dup-nom">Nom du destinataire</Label>
            <Input id="dup-nom" value={nomDuplication} onChange={(e) => setNomDuplication(e.target.value)} autoFocus />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDupliquerDe(null)}>
              Annuler
            </Button>
            <Button onClick={dupliquer} disabled={!nomDuplication.trim() || dupliquerMutation.isPending}>
              <FileText className="mr-1.5 h-4 w-4" />
              Créer à partir du modèle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
