import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Upload, X, Eye, Sparkles, RotateCcw } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { generateSlug, buildImageFileName } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/StatusBadge";

// Hand-drawn pictograms shown to customers on the public site (see V3_CATEGORIES in
// src/pages/IndexV3.tsx) — matched by slug, same logic as the categories grid page.
const CATEGORY_ICON_IMAGES: { slugHints: string[]; img: string }[] = [
  { slugHints: ["romantic"], img: "/icons/icon-romantic.png" },
  { slugHints: ["family"], img: "/icons/icon-family.png" },
  { slugHints: ["taste", "food", "culinar"], img: "/icons/icon-foody.png" },
  { slugHints: ["land", "stories"], img: "/icons/icon-stories.png" },
  { slugHints: ["nature", "beyond", "outdoor"], img: "/icons/icon-nature.png" },
  { slugHints: ["bateaux"], img: "/icons/icon-boats.svg" },
];

const getDefaultIconImage = (slug?: string | null) => {
  if (!slug) return null;
  return CATEGORY_ICON_IMAGES.find((entry) => entry.slugHints.some((hint) => slug.includes(hint)))?.img ?? null;
};

// Fallback for categories with no pictogram at all: their legacy `icon` value is a
// kebab-case Lucide name (e.g. "tree-pine") set long ago, kept but no longer editable here.
const getLegacyIcon = (iconName?: string | null) => {
  if (!iconName) return Sparkles;
  const pascalName = iconName
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return (LucideIcons as any)[pascalName] || Sparkles;
};

const emptyFormData = {
  name: "",
  name_he: "",
  name_fr: "",
  hero_image: "",
  icon_image: "",
  presentation_title: "",
  presentation_title_he: "",
  presentation_title_fr: "",
  intro_rich_text: "",
  intro_rich_text_he: "",
  intro_rich_text_fr: "",
  show_on_home: true,
  show_on_launch: true,
  launch_description: "",
  launch_description_he: "",
  launch_description_fr: "",
  status: "draft" as "draft" | "published",
  seo_title_en: "",
  seo_title_he: "",
  seo_title_fr: "",
  meta_description_en: "",
  meta_description_he: "",
  meta_description_fr: "",
  og_title_en: "",
  og_title_he: "",
  og_title_fr: "",
  og_description_en: "",
  og_description_he: "",
  og_description_fr: "",
  og_image: "",
};

const CategoryEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = id && id !== "new";
  const hasLoadedRef = useRef(false);

  const [formData, setFormData] = useState(emptyFormData);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [heroPreview, setHeroPreview] = useState<string>("");

  const { data: category } = useQuery({
    queryKey: ["category", id],
    queryFn: async () => {
      if (!isEditing) return null;
      const { data, error } = await supabase
        .from("categories" as any)
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (category && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      setFormData({
        name: category.name || "",
        name_he: category.name_he || "",
        name_fr: category.name_fr || "",
        hero_image: category.hero_image || "",
        icon_image: category.icon_image || "",
        presentation_title: category.presentation_title || "",
        presentation_title_he: category.presentation_title_he || "",
        presentation_title_fr: category.presentation_title_fr || "",
        intro_rich_text: category.intro_rich_text || "",
        intro_rich_text_he: category.intro_rich_text_he || "",
        intro_rich_text_fr: category.intro_rich_text_fr || "",
        show_on_home: category.show_on_home ?? true,
        show_on_launch: category.show_on_launch ?? true,
        launch_description: category.launch_description || "",
        launch_description_he: category.launch_description_he || "",
        launch_description_fr: category.launch_description_fr || "",
        status: category.status || "draft",
        seo_title_en: category.seo_title_en || "",
        seo_title_he: category.seo_title_he || "",
        seo_title_fr: category.seo_title_fr || "",
        meta_description_en: category.meta_description_en || "",
        meta_description_he: category.meta_description_he || "",
        meta_description_fr: category.meta_description_fr || "",
        og_title_en: category.og_title_en || "",
        og_title_he: category.og_title_he || "",
        og_title_fr: category.og_title_fr || "",
        og_description_en: category.og_description_en || "",
        og_description_he: category.og_description_he || "",
        og_description_fr: category.og_description_fr || "",
        og_image: category.og_image || "",
      });
      setHeroPreview(category.hero_image || "");
    }
  }, [category]);

  const uploadToStorage = async (file: File, folder: string) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return null;
    }
    const fileExt = file.name.split(".").pop();
    const fileName = buildImageFileName(formData.name, fileExt);
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from("category-images").upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from("category-images").getPublicUrl(filePath);
    return publicUrl;
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHero(true);
    try {
      const publicUrl = await uploadToStorage(file, "hero");
      if (!publicUrl) return;
      setFormData((prev) => ({ ...prev, hero_image: publicUrl }));
      setHeroPreview(publicUrl);
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploadingHero(false);
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIcon(true);
    try {
      const publicUrl = await uploadToStorage(file, "icons");
      if (!publicUrl) return;
      setFormData((prev) => ({ ...prev, icon_image: publicUrl }));
      toast.success("Icône chargée");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploadingIcon(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (isEditing) {
        const { error } = await supabase.from("categories" as any).update(data).eq("id", id);
        if (error) throw error;
      } else {
        const { count } = await supabase.from("categories" as any).select("id", { count: "exact", head: true });
        const { error } = await supabase
          .from("categories" as any)
          .insert([{ ...data, slug: generateSlug(data.name), display_order: count ?? 0 }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" &&
          query.queryKey[0].includes("categor"),
      });
      toast.success(`Category ${isEditing ? "updated" : "created"} successfully`);
      navigate("/admin/categories");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const publishData = { ...data, status: "published" as const };
      if (isEditing) {
        const { error } = await supabase.from("categories" as any).update(publishData).eq("id", id);
        if (error) throw error;
      } else {
        const { count } = await supabase.from("categories" as any).select("id", { count: "exact", head: true });
        const { error } = await supabase
          .from("categories" as any)
          .insert([{ ...publishData, slug: generateSlug(data.name), display_order: count ?? 0 }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === "string" &&
          query.queryKey[0].includes("categor"),
      });
      toast.success("Category published successfully");
      navigate("/admin/categories");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const defaultIconImage = getDefaultIconImage(category?.slug);
  const LegacyIcon = getLegacyIcon(category?.icon);
  const iconPreview = formData.icon_image || defaultIconImage;

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-background/95 backdrop-blur border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/categories")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h2 className="text-xl font-bold text-[#1A1814]">{isEditing ? category?.name || "…" : "Nouvelle catégorie"}</h2>
          {isEditing && category?.status && <StatusBadge status={category.status} />}
        </div>
        <div className="flex gap-2">
          {isEditing && category?.slug && (
            <Button type="button" variant="outline" size="sm" onClick={() => window.open(`/category/${category.slug}`, "_blank")}>
              <Eye className="w-4 h-4 mr-2" />
              Aperçu
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleSubmit} disabled={saveMutation.isPending}>
            Enregistrer le brouillon
          </Button>
          <Button
            size="sm"
            className="bg-[#1A1814] text-white hover:bg-[#1A1814]/90"
            onClick={() => publishMutation.mutate(formData)}
            disabled={publishMutation.isPending}
          >
            Publier
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nom & visibilité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom (EN) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Desert Escapes"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_he">שם (עברית)</Label>
                <Input
                  id="name_he"
                  value={formData.name_he}
                  onChange={(e) => setFormData({ ...formData, name_he: e.target.value })}
                  dir="rtl"
                  className="bg-hebrew-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name_fr">Nom (FR)</Label>
                <Input
                  id="name_fr"
                  value={formData.name_fr}
                  onChange={(e) => setFormData({ ...formData, name_fr: e.target.value })}
                  placeholder="ex. Escapade Romantique"
                />
              </div>
            </div>

            <div className="flex gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.show_on_home}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_on_home: !!checked })}
                />
                <span className="text-sm font-medium">Page d'accueil</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={formData.show_on_launch}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_on_launch: !!checked })}
                />
                <span className="text-sm font-medium">Page Lancement</span>
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Icône</CardTitle>
            <p className="text-sm text-muted-foreground">
              Celle actuellement affichée sur le site. Charge une image pour la remplacer.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center shrink-0">
                {iconPreview ? (
                  <img src={iconPreview} alt={formData.name} className="w-12 h-12 object-contain" />
                ) : (
                  <LegacyIcon className="w-7 h-7 text-stone-500" strokeWidth={1.5} />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Input
                    type="file"
                    id="icon_image"
                    accept="image/*"
                    onChange={handleIconUpload}
                    disabled={uploadingIcon}
                    className="max-w-[220px]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingIcon}
                    onClick={() => document.getElementById("icon_image")?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingIcon ? "Chargement..." : "Charger"}
                  </Button>
                  {formData.icon_image && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, icon_image: "" })}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Réinitialiser
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">PNG/SVG avec fond transparent recommandé, max 5MB.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Image hero</CardTitle>
            <p className="text-sm text-muted-foreground">
              Peu utilisée aujourd'hui — sert uniquement d'image de secours au partage sur les réseaux sociaux.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-24 h-16 rounded-md bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                {heroPreview ? (
                  <img src={heroPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-muted-foreground">Aucune</span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  type="file"
                  id="hero_image"
                  accept="image/*"
                  onChange={handleHeroUpload}
                  disabled={uploadingHero}
                  className="max-w-[220px]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingHero}
                  onClick={() => document.getElementById("hero_image")?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingHero ? "Chargement..." : "Charger"}
                </Button>
                {heroPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setFormData({ ...formData, hero_image: "" });
                      setHeroPreview("");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sous-titre — page Lancement</CardTitle>
            <p className="text-sm text-muted-foreground">
              Texte court affiché sur la page de recherche filtrée (/launch/experiences).
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="en" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="he">עברית</TabsTrigger>
                <TabsTrigger value="fr">Français</TabsTrigger>
              </TabsList>
              <TabsContent value="en" className="mt-0">
                <Textarea
                  value={formData.launch_description}
                  onChange={(e) => setFormData({ ...formData, launch_description: e.target.value })}
                  placeholder="e.g. Discover unique romantic getaways..."
                  rows={2}
                />
              </TabsContent>
              <TabsContent value="he" className="mt-0">
                <Textarea
                  value={formData.launch_description_he}
                  onChange={(e) => setFormData({ ...formData, launch_description_he: e.target.value })}
                  placeholder="תיאור בעברית..."
                  rows={2}
                  dir="rtl"
                  className="bg-hebrew-input"
                />
              </TabsContent>
              <TabsContent value="fr" className="mt-0">
                <Textarea
                  value={formData.launch_description_fr}
                  onChange={(e) => setFormData({ ...formData, launch_description_fr: e.target.value })}
                  placeholder="ex. Découvrez des escapades romantiques uniques..."
                  rows={2}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Titre et texte — page Catégorie dédiée</CardTitle>
            <p className="text-sm text-muted-foreground">
              Affichés sur la page catégorie autonome (/category/:slug), reliée depuis le pied de page du site.
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="en" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="he">עברית</TabsTrigger>
                <TabsTrigger value="fr">Français</TabsTrigger>
              </TabsList>
              <TabsContent value="en" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="presentation_title">Titre de présentation *</Label>
                  <Input
                    id="presentation_title"
                    value={formData.presentation_title}
                    onChange={(e) => setFormData({ ...formData, presentation_title: e.target.value })}
                    placeholder="e.g., Your Perfect Romantic Escape Awaits"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intro">Texte d'introduction *</Label>
                  <Textarea
                    id="intro"
                    value={formData.intro_rich_text}
                    onChange={(e) => setFormData({ ...formData, intro_rich_text: e.target.value })}
                    placeholder="A captivating description of this category..."
                    rows={4}
                    required
                  />
                </div>
              </TabsContent>
              <TabsContent value="he" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="presentation_title_he">כותרת גדולה</Label>
                  <Input
                    id="presentation_title_he"
                    value={formData.presentation_title_he}
                    onChange={(e) => setFormData({ ...formData, presentation_title_he: e.target.value })}
                    dir="rtl"
                    className="bg-hebrew-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intro_he">טקסט הקדמה</Label>
                  <Textarea
                    id="intro_he"
                    value={formData.intro_rich_text_he}
                    onChange={(e) => setFormData({ ...formData, intro_rich_text_he: e.target.value })}
                    rows={4}
                    dir="rtl"
                    className="bg-hebrew-input"
                  />
                </div>
              </TabsContent>
              <TabsContent value="fr" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="presentation_title_fr">Titre de présentation</Label>
                  <Input
                    id="presentation_title_fr"
                    value={formData.presentation_title_fr}
                    onChange={(e) => setFormData({ ...formData, presentation_title_fr: e.target.value })}
                    placeholder="ex. Votre escapade romantique idéale vous attend"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intro_fr">Texte d'introduction</Label>
                  <Textarea
                    id="intro_fr"
                    value={formData.intro_rich_text_fr}
                    onChange={(e) => setFormData({ ...formData, intro_rich_text_fr: e.target.value })}
                    placeholder="Une description captivante de cette catégorie..."
                    rows={4}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-base">SEO</CardTitle>
            <p className="text-sm text-muted-foreground">
              Métadonnées pour les moteurs de recherche et le partage sur les réseaux sociaux (page Catégorie dédiée).
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="en" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="he">עברית</TabsTrigger>
                <TabsTrigger value="fr">Français</TabsTrigger>
              </TabsList>
              <TabsContent value="en" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seo_title_en">Titre SEO</Label>
                  <Input
                    id="seo_title_en"
                    value={formData.seo_title_en}
                    onChange={(e) => setFormData({ ...formData, seo_title_en: e.target.value })}
                    placeholder="Displayed in browser tab and Google results"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_description_en">Meta description</Label>
                  <Textarea
                    id="meta_description_en"
                    value={formData.meta_description_en}
                    onChange={(e) => setFormData({ ...formData, meta_description_en: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="og_title_en">Titre Open Graph</Label>
                  <Input
                    id="og_title_en"
                    value={formData.og_title_en}
                    onChange={(e) => setFormData({ ...formData, og_title_en: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="og_description_en">Description Open Graph</Label>
                  <Textarea
                    id="og_description_en"
                    value={formData.og_description_en}
                    onChange={(e) => setFormData({ ...formData, og_description_en: e.target.value })}
                    rows={3}
                  />
                </div>
              </TabsContent>
              <TabsContent value="he" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seo_title_he">כותרת SEO</Label>
                  <Input
                    id="seo_title_he"
                    value={formData.seo_title_he}
                    onChange={(e) => setFormData({ ...formData, seo_title_he: e.target.value })}
                    dir="rtl"
                    className="bg-hebrew-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_description_he">תיאור Meta</Label>
                  <Textarea
                    id="meta_description_he"
                    value={formData.meta_description_he}
                    onChange={(e) => setFormData({ ...formData, meta_description_he: e.target.value })}
                    rows={3}
                    dir="rtl"
                    className="bg-hebrew-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="og_title_he">כותרת Open Graph</Label>
                  <Input
                    id="og_title_he"
                    value={formData.og_title_he}
                    onChange={(e) => setFormData({ ...formData, og_title_he: e.target.value })}
                    dir="rtl"
                    className="bg-hebrew-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="og_description_he">תיאור Open Graph</Label>
                  <Textarea
                    id="og_description_he"
                    value={formData.og_description_he}
                    onChange={(e) => setFormData({ ...formData, og_description_he: e.target.value })}
                    rows={3}
                    dir="rtl"
                    className="bg-hebrew-input"
                  />
                </div>
              </TabsContent>
              <TabsContent value="fr" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seo_title_fr">Titre SEO</Label>
                  <Input
                    id="seo_title_fr"
                    value={formData.seo_title_fr}
                    onChange={(e) => setFormData({ ...formData, seo_title_fr: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_description_fr">Description Meta</Label>
                  <Textarea
                    id="meta_description_fr"
                    value={formData.meta_description_fr}
                    onChange={(e) => setFormData({ ...formData, meta_description_fr: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="og_title_fr">Titre Open Graph</Label>
                  <Input
                    id="og_title_fr"
                    value={formData.og_title_fr}
                    onChange={(e) => setFormData({ ...formData, og_title_fr: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="og_description_fr">Description Open Graph</Label>
                  <Textarea
                    id="og_description_fr"
                    value={formData.og_description_fr}
                    onChange={(e) => setFormData({ ...formData, og_description_fr: e.target.value })}
                    rows={3}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <Label htmlFor="og_image">Image Open Graph</Label>
              <Input
                id="og_image"
                value={formData.og_image}
                onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                placeholder="Image URL for social media sharing"
              />
              <p className="text-xs text-muted-foreground">
                Recommandé : 1200x630px. Laisser vide pour utiliser l'image hero.
              </p>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default CategoryEditor;
