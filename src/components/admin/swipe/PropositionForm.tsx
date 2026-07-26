import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "sonner";
import { Search, X } from "lucide-react";
import {
  useSwipeCategories,
  useHotelsPourLiaison,
  useExperiencesPourLiaison,
  useCreateProposition,
  useUpdateProposition,
} from "@/lib/swipe/queries";
import type { PropositionAvecRelations } from "@/lib/swipe/types";

const schema = z.object({
  titre: z.string().min(1, "Le titre est obligatoire"),
  description: z.string().optional(),
  photo_url: z.string().optional(),
  categorie_id: z.string().optional(),
  region: z.string().optional(),
  ville: z.string().optional(),
  adresse: z.string().optional(),
  lien_reservation: z.string().optional(),
  prix_achat: z.union([z.coerce.number(), z.literal("")]).optional(),
  commission_pourcentage: z.union([z.coerce.number(), z.literal("")]).optional(),
  prix_client: z.union([z.coerce.number(), z.literal("")]).optional(),
  tags: z.string().optional(),
  mode_reservation: z.enum(["reservable_en_ligne", "demande_necessaire"]),
  statut: z.enum(["actif", "archive"]),
});

type FormValues = z.infer<typeof schema>;

interface PropositionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposition?: PropositionAvecRelations | null;
  onSaved?: (propositionId: string) => void;
}

export const PropositionForm = ({ open, onOpenChange, proposition, onSaved }: PropositionFormProps) => {
  const isEdit = !!proposition;
  const { data: categories } = useSwipeCategories();
  const createMutation = useCreateProposition();
  const updateMutation = useUpdateProposition();

  const [source, setSource] = useState<"hotel" | "experience" | "libre">("libre");
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [experienceId, setExperienceId] = useState<string | null>(null);
  const [rechercheFiche, setRechercheFiche] = useState("");

  const { data: hotelsResultats } = useHotelsPourLiaison(source === "hotel" ? rechercheFiche : "");
  const { data: experiencesResultats } = useExperiencesPourLiaison(source === "experience" ? rechercheFiche : "");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      titre: "",
      description: "",
      photo_url: "",
      categorie_id: "",
      region: "",
      ville: "",
      adresse: "",
      lien_reservation: "",
      prix_achat: "",
      commission_pourcentage: "",
      prix_client: "",
      tags: "",
      mode_reservation: "demande_necessaire",
      statut: "actif",
    },
  });

  useEffect(() => {
    if (open && proposition) {
      setSource(proposition.hotel_id ? "hotel" : proposition.experience_id ? "experience" : "libre");
      setHotelId(proposition.hotel_id);
      setExperienceId(proposition.experience_id);
      form.reset({
        titre: proposition.titre,
        description: proposition.description ?? "",
        photo_url: proposition.photo_url ?? "",
        categorie_id: proposition.categorie_id ?? "",
        region: proposition.region ?? "",
        ville: proposition.ville ?? "",
        adresse: proposition.adresse ?? "",
        lien_reservation: proposition.lien_reservation ?? "",
        prix_achat: proposition.prix_achat ?? "",
        commission_pourcentage: proposition.commission_pourcentage ?? "",
        prix_client: proposition.prix_client ?? "",
        tags: (proposition.tags ?? []).join(", "),
        mode_reservation: proposition.mode_reservation as FormValues["mode_reservation"],
        statut: proposition.statut as FormValues["statut"],
      });
    } else if (open && !proposition) {
      setSource("libre");
      setHotelId(null);
      setExperienceId(null);
      setRechercheFiche("");
      form.reset({
        titre: "",
        description: "",
        photo_url: "",
        categorie_id: "",
        region: "",
        ville: "",
        adresse: "",
        lien_reservation: "",
        prix_achat: "",
        commission_pourcentage: "",
        prix_client: "",
        tags: "",
        mode_reservation: "demande_necessaire",
        statut: "actif",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, proposition]);

  const selectionnerHotel = (hotel: NonNullable<typeof hotelsResultats>[number]) => {
    setHotelId(hotel.id);
    setExperienceId(null);
    form.setValue("titre", hotel.name);
    form.setValue("photo_url", hotel.hero_image ?? "");
    form.setValue("ville", hotel.city ?? "");
    form.setValue("region", hotel.region ?? "");
    form.setValue("adresse", hotel.address ?? "");
  };

  const selectionnerExperience = (experience: NonNullable<typeof experiencesResultats>[number]) => {
    setExperienceId(experience.id);
    setHotelId(null);
    form.setValue("titre", experience.title);
    form.setValue("photo_url", experience.hero_image ?? "");
    form.setValue("adresse", experience.address ?? "");
    form.setValue("ville", experience.hotels2?.city ?? "");
    form.setValue("region", experience.hotels2?.region ?? "");
  };

  const retirerLiaison = () => {
    setHotelId(null);
    setExperienceId(null);
    setSource("libre");
  };

  const onSubmit = async (values: FormValues) => {
    const tags = values.tags
      ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const payload = {
      titre: values.titre,
      description: values.description || null,
      photo_url: values.photo_url || null,
      categorie_id: values.categorie_id || null,
      hotel_id: source === "hotel" ? hotelId : null,
      experience_id: source === "experience" ? experienceId : null,
      region: values.region || null,
      ville: values.ville || null,
      adresse: values.adresse || null,
      lien_reservation: values.lien_reservation || null,
      prix_achat: values.prix_achat === "" ? null : Number(values.prix_achat),
      commission_pourcentage: values.commission_pourcentage === "" ? null : Number(values.commission_pourcentage),
      prix_client: values.prix_client === "" ? null : Number(values.prix_client),
      tags,
      mode_reservation: values.mode_reservation,
      statut: values.statut,
    };

    try {
      if (isEdit && proposition) {
        await updateMutation.mutateAsync({ id: proposition.id, ...payload });
        toast.success("Proposition mise à jour");
        onSaved?.(proposition.id);
      } else {
        const created = await createMutation.mutateAsync(payload);
        toast.success("Proposition créée");
        onSaved?.(created.id);
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'enregistrement");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la proposition" : "Nouvelle proposition"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {!isEdit && (
            <div className="space-y-3">
              <Tabs value={source} onValueChange={(v) => setSource(v as typeof source)}>
                <TabsList>
                  <TabsTrigger value="libre">Fiche indépendante</TabsTrigger>
                  <TabsTrigger value="hotel">Lier un hôtel</TabsTrigger>
                  <TabsTrigger value="experience">Lier une expérience</TabsTrigger>
                </TabsList>
              </Tabs>

              {(source === "hotel" || source === "experience") && !hotelId && !experienceId && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                    <Input
                      className="pl-8"
                      placeholder={source === "hotel" ? "Rechercher un hôtel publié..." : "Rechercher une expérience publiée..."}
                      value={rechercheFiche}
                      onChange={(e) => setRechercheFiche(e.target.value)}
                    />
                  </div>
                  {source === "hotel" && hotelsResultats && hotelsResultats.length > 0 && (
                    <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                      {hotelsResultats.map((h) => (
                        <button
                          type="button"
                          key={h.id}
                          onClick={() => selectionnerHotel(h)}
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                        >
                          {h.name} {h.city ? `— ${h.city}` : ""}
                        </button>
                      ))}
                    </div>
                  )}
                  {source === "experience" && experiencesResultats && experiencesResultats.length > 0 && (
                    <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                      {experiencesResultats.map((exp) => (
                        <button
                          type="button"
                          key={exp.id}
                          onClick={() => selectionnerExperience(exp)}
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                        >
                          {exp.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(hotelId || experienceId) && (
                <div className="flex items-center justify-between bg-muted/50 rounded-md px-3 py-2 text-sm">
                  <span>
                    Lié à : <strong>{form.watch("titre")}</strong>
                  </span>
                  <Button type="button" size="sm" variant="ghost" onClick={retirerLiaison}>
                    <X className="w-4 h-4 mr-1" /> Retirer la liaison
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Titre</Label>
              <Input {...form.register("titre")} />
              {form.formState.errors.titre && (
                <p className="text-sm text-destructive">{form.formState.errors.titre.message}</p>
              )}
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} {...form.register("description")} />
            </div>

            <div className="col-span-2">
              <ImageUpload
                label="Photo"
                bucket="swipe-images"
                value={form.watch("photo_url") || ""}
                onChange={(url) => form.setValue("photo_url", url)}
                namePrefix={form.watch("titre")}
              />
            </div>

            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={form.watch("categorie_id")} onValueChange={(v) => form.setValue("categorie_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={form.watch("statut")} onValueChange={(v) => form.setValue("statut", v as FormValues["statut"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="actif">Actif</SelectItem>
                  <SelectItem value="archive">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Région</Label>
              <Input {...form.register("region")} />
            </div>
            <div className="space-y-2">
              <Label>Ville</Label>
              <Input {...form.register("ville")} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Adresse</Label>
              <Input {...form.register("adresse")} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Lien de réservation</Label>
              <Input {...form.register("lien_reservation")} placeholder="https://..." />
            </div>

            <div className="space-y-2">
              <Label>Prix d'achat (interne)</Label>
              <Input type="number" step="0.01" {...form.register("prix_achat")} />
            </div>
            <div className="space-y-2">
              <Label>Commission (%)</Label>
              <Input type="number" step="0.01" {...form.register("commission_pourcentage")} />
            </div>
            <div className="space-y-2">
              <Label>Prix client</Label>
              <Input type="number" step="0.01" {...form.register("prix_client")} />
            </div>
            <div className="space-y-2">
              <Label>Mode de réservation (interne)</Label>
              <Select
                value={form.watch("mode_reservation")}
                onValueChange={(v) => form.setValue("mode_reservation", v as FormValues["mode_reservation"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reservable_en_ligne">Réservable en ligne</SelectItem>
                  <SelectItem value="demande_necessaire">Demande nécessaire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Tags (séparés par des virgules)</Label>
              <Input {...form.register("tags")} placeholder="vue mer, familial, romantique" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {isEdit ? "Enregistrer" : "Créer la proposition"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
