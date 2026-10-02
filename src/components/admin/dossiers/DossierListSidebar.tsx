import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Mail, MessageCircle, Monitor, Pencil, Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  errorMessage,
  useCreateDossierVoyage,
  useDossiersVoyage,
  type NouvelleDemandeInput,
} from "@/lib/dossiersVoyage/queries";
import {
  CANAL_ORIGINE_OPTIONS,
  DESTINATAIRE_TYPE_OPTIONS,
  statutActionnable,
  STATUT_OPTIONS,
  type CanalOrigine,
  type DestinataireType,
  type DossierVoyage,
  type Objectif,
  type PointDepart,
} from "@/lib/dossiersVoyage/types";

type Filtre = "tous" | "demandes" | "a_traiter" | "vente" | "collab" | "modeles" | "archives";

const FILTRES: { value: Filtre; label: string }[] = [
  { value: "tous", label: "Tous" },
  { value: "demandes", label: "Demandes" },
  { value: "a_traiter", label: "À traiter" },
  { value: "vente", label: "Vente" },
  { value: "collab", label: "Collab" },
  { value: "modeles", label: "Modèles" },
  { value: "archives", label: "Archivés" },
];

function correspondAuFiltre(d: DossierVoyage, filtre: Filtre): boolean {
  switch (filtre) {
    case "tous":
      return !d.archive;
    case "demandes":
      return d.statut === "nouvelle_demande";
    case "a_traiter":
      return d.statut === "brief" || d.statut === "en_preparation";
    case "vente":
      return !d.archive && d.objectif === "vente";
    case "collab":
      return !d.archive && d.objectif === "collab";
    case "modeles":
      return d.est_modele;
    case "archives":
      return d.archive && !d.est_modele;
    default:
      return true;
  }
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

export function DossierListSidebar({ selectedId }: { selectedId: string | undefined }) {
  const { data: dossiers, isLoading } = useDossiersVoyage();
  const createMutation = useCreateDossierVoyage();
  const navigate = useNavigate();

  const [filtre, setFiltre] = useState<Filtre>("tous");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NouvelleDemandeInput>(vide);

  const visibles = useMemo(() => (dossiers ?? []).filter((d) => correspondAuFiltre(d, filtre)), [dossiers, filtre]);

  const creer = async () => {
    if (!form.nom_destinataire.trim()) {
      toast.error("Le nom du destinataire est obligatoire");
      return;
    }
    try {
      const nouveau = await createMutation.mutateAsync(form);
      toast.success("Dossier créé");
      setOpen(false);
      setForm(vide);
      navigate(`/admin/dossiers/${nouveau.id}`);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="flex h-full w-[420px] shrink-0 flex-col border-r">
      <div className="space-y-3 border-b p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Dossiers</h1>
          <Button size="sm" className="bg-[#ad1414] hover:bg-[#8f1010]" onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Coller une demande
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FILTRES.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFiltre(f.value)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs transition-colors",
                filtre === f.value ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md bg-muted/60 p-2">
            <div className="flex items-center gap-1.5 font-medium">
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </div>
            <p className="text-muted-foreground">transféré au numéro dédié</p>
          </div>
          <div className="rounded-md bg-muted/60 p-2">
            <div className="flex items-center gap-1.5 font-medium">
              <Mail className="h-3.5 w-3.5" /> Email
            </div>
            <p className="text-muted-foreground">transféré à demandes@</p>
          </div>
          <div className="rounded-md bg-muted/60 p-2">
            <div className="flex items-center gap-1.5 font-medium">
              <Monitor className="h-3.5 w-3.5" /> Site
            </div>
            <p className="text-muted-foreground">formulaire "Créer mon voyage"</p>
          </div>
          <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-muted/60 p-2 text-left hover:bg-muted">
            <div className="flex items-center gap-1.5 font-medium">
              <Pencil className="h-3.5 w-3.5" /> À la main
            </div>
            <p className="text-muted-foreground">coller un message</p>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && <p className="p-4 text-sm text-muted-foreground">Chargement...</p>}
        {!isLoading && visibles.length === 0 && <p className="p-4 text-sm text-muted-foreground">Aucun dossier dans cet onglet.</p>}
        {visibles.map((d) => {
          const statutOption = STATUT_OPTIONS.find((o) => o.value === d.statut);
          const action = statutActionnable(d);
          const selectionne = d.id === selectedId;
          return (
            <Link
              key={d.id}
              to={`/admin/dossiers/${d.id}`}
              className={cn(
                "block border-b border-l-2 px-4 py-3 text-sm hover:bg-muted/40",
                selectionne ? "border-l-[#ad1414] bg-muted/40" : "border-l-transparent"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-semibold">{d.nom_destinataire}</span>
                {statutOption && (
                  <Badge variant="outline" className={cn("shrink-0 text-[10px]", statutOption.className)}>
                    {statutOption.label}
                  </Badge>
                )}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                {d.dates_arrivee && (
                  <span>
                    {format(new Date(d.dates_arrivee), "d MMM", { locale: fr })}
                    {d.dates_depart ? ` → ${format(new Date(d.dates_depart), "d MMM yyyy", { locale: fr })}` : ""}
                  </span>
                )}
                <Badge variant="outline" className="text-[10px]">
                  {labelCanal(d.canal_origine)}
                </Badge>
              </div>
              {action && <p className={cn("mt-1 text-xs font-medium", action.classe)}>{action.texte}</p>}
            </Link>
          );
        })}
      </div>

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
                <Input id="nd-nom" value={form.nom_destinataire} onChange={(e) => setForm((f) => ({ ...f, nom_destinataire: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.destinataire_type} onValueChange={(v) => setForm((f) => ({ ...f, destinataire_type: v as DestinataireType }))}>
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
                <Input id="nd-email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} inputMode="email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nd-tel">Téléphone</Label>
                <Input id="nd-tel" value={form.telephone} onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))} inputMode="tel" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Canal d'arrivée</Label>
                <Select value={form.canal_origine} onValueChange={(v) => setForm((f) => ({ ...f, canal_origine: v as CanalOrigine }))}>
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
                    <SelectItem value="vente">Vente</SelectItem>
                    <SelectItem value="collab">Collab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Point de départ</Label>
                <Select value={form.point_depart} onValueChange={(v) => setForm((f) => ({ ...f, point_depart: v as PointDepart }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="explorer">Explorer</SelectItem>
                    <SelectItem value="proposition">Proposition directe</SelectItem>
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
    </div>
  );
}

function labelCanal(canal: string): string {
  return CANAL_ORIGINE_OPTIONS.find((o) => o.value === canal)?.label.replace(" transféré", "") ?? canal;
}
