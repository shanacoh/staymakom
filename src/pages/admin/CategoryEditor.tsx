import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Upload, X, Eye, Heart, Users, Sparkles, Leaf, Wine, Zap, Laptop, Brain, Mountain, Utensils, Plane, Camera, Music, Book, Coffee, Sun, Moon, Star, Compass, Map, Globe, Briefcase, Award, Gift, Gem, Crown, Shield, Flame, Droplet, Wind, Cloud, TreePine, Flower2, type LucideIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { generateSlug } from "@/lib/utils";

// Available icons for categories
const availableIcons: { name: string; icon: LucideIcon }[] = [
  { name: "heart", icon: Heart },
  { name: "users", icon: Users },
  { name: "sparkles", icon: Sparkles },
  { name: "leaf", icon: Leaf },
  { name: "wine", icon: Wine },
  { name: "zap", icon: Zap },
  { name: "laptop", icon: Laptop },
  { name: "brain", icon: Brain },
  { name: "mountain", icon: Mountain },
  { name: "utensils", icon: Utensils },
  { name: "plane", icon: Plane },
  { name: "camera", icon: Camera },
  { name: "music", icon: Music },
  { name: "book", icon: Book },
  { name: "coffee", icon: Coffee },
  { name: "sun", icon: Sun },
  { name: "moon", icon: Moon },
  { name: "star", icon: Star },
  { name: "compass", icon: Compass },
  { name: "map", icon: Map },
  { name: "globe", icon: Globe },
  { name: "briefcase", icon: Briefcase },
  { name: "award", icon: Award },
  { name: "gift", icon: Gift },
  { name: "gem", icon: Gem },
  { name: "crown", icon: Crown },
  { name: "shield", icon: Shield },
  { name: "flame", icon: Flame },
  { name: "droplet", icon: Droplet },
  { name: "wind", icon: Wind },
  { name: "cloud", icon: Cloud },
  { name: "tree-pine", icon: TreePine },
  { name: "flower", icon: Flower2 },
];

const CategoryEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = id && id !== "new";

  const [formData, setFormData] = useState({
    name: "",
    name_he: "",
    hero_image: "",
    icon: "",
    presentation_title: "",
    presentation_title_he: "",
    intro_rich_text: "",
    intro_rich_text_he: "",
    bullets: ["", "", ""],
    bullets_he: ["", "", ""],
    display_order: 0,
    show_on_home: true,
    show_on_launch: true,
    launch_description: "",
    launch_description_he: "",
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
  });
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");

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
    if (category) {
      setFormData({
        name: category.name || "",
        name_he: category.name_he || "",
        hero_image: category.hero_image || "",
        icon: category.icon || "",
        presentation_title: category.presentation_title || "",
        presentation_title_he: category.presentation_title_he || "",
        intro_rich_text: category.intro_rich_text || "",
        intro_rich_text_he: category.intro_rich_text_he || "",
        bullets: category.bullets || ["", "", ""],
        bullets_he: category.bullets_he || ["", "", ""],
        display_order: category.display_order || 0,
        show_on_home: category.show_on_home ?? true,
        show_on_launch: category.show_on_launch ?? true,
        launch_description: category.launch_description || "",
        launch_description_he: category.launch_description_he || "",
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
      setImagePreview(category.hero_image || "");
    }
  }, [category]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from("category-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("category-images")
        .getPublicUrl(filePath);

      setFormData({ ...formData, hero_image: publicUrl });
      setImagePreview(publicUrl);
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, hero_image: "" });
    setImagePreview("");
  };

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const dataWithSlug = {
        ...data,
        slug: isEditing ? category?.slug : generateSlug(data.name),
      };
      
      if (isEditing) {
        const { error } = await supabase
          .from("categories" as any)
          .update(dataWithSlug)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories" as any).insert([dataWithSlug]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(`Category ${isEditing ? "updated" : "created"} successfully`);
      navigate("/admin/categories");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const publishData = { 
        ...data, 
        status: "published" as const,
        slug: isEditing ? category?.slug : generateSlug(data.name),
      };
      if (isEditing) {
        const { error } = await supabase
          .from("categories" as any)
          .update(publishData)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories" as any).insert([publishData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/admin/categories")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Categories
          </Button>
          <div>
            <h2 className="text-3xl font-bold">
              {isEditing ? "Edit Category" : "New Category"}
            </h2>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing && category?.slug && (
            <Button
              type="button"
              variant="outline"
              onClick={() => window.open(`/category/${category.slug}`, '_blank')}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          )}
          <Button variant="outline" onClick={handleSubmit} disabled={saveMutation.isPending}>
            Save Draft
          </Button>
          <Button
            onClick={() => publishMutation.mutate(formData)}
            disabled={publishMutation.isPending}
          >
            Publish
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hero_image">Hero Image</Label>
              <div className="space-y-4">
                {imagePreview && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    type="file"
                    id="hero_image"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => document.getElementById("hero_image")?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Recommended: 1920x1080px, max 5MB
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-sm text-muted-foreground">
                Lower numbers appear first
              </p>
            </div>

            <div className="space-y-2">
              <Label>Category Icon *</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select an icon to represent this category on the homepage
              </p>
              <div className="grid grid-cols-8 gap-2 p-4 border rounded-lg bg-muted/30">
                {availableIcons.map(({ name, icon: Icon }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: name })}
                    className={`p-3 rounded-lg transition-all flex items-center justify-center ${
                      formData.icon === name
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary'
                        : 'bg-background hover:bg-muted border'
                    }`}
                    title={name}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                ))}
              </div>
              {formData.icon && (
                <p className="text-sm text-muted-foreground">
                  Selected: <span className="font-medium">{formData.icon}</span>
                </p>
              )}
            </div>
            <div className="space-y-2 pt-2">
              <Label>Launch Page Description</Label>
              <p className="text-sm text-muted-foreground mb-1">
                Short description shown on hover (launch page)
              </p>
              <Textarea
                value={formData.launch_description}
                onChange={(e) => setFormData({ ...formData, launch_description: e.target.value })}
                placeholder="e.g. Discover unique romantic getaways..."
                rows={2}
              />
              <Textarea
                value={formData.launch_description_he}
                onChange={(e) => setFormData({ ...formData, launch_description_he: e.target.value })}
                placeholder="תיאור בעברית..."
                rows={2}
                dir="rtl"
              />
            </div>
            <div className="space-y-2 pt-2">
              <Label>Page Visibility</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Choose where this category appears
              </p>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.show_on_home}
                    onCheckedChange={(checked) => setFormData({ ...formData, show_on_home: !!checked })}
                  />
                  <span className="text-sm font-medium">Homepage</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={formData.show_on_launch}
                    onCheckedChange={(checked) => setFormData({ ...formData, show_on_launch: !!checked })}
                  />
                  <span className="text-sm font-medium">Launch Page</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bilingual Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              {/* English Column */}
              <div className="space-y-4">
                <div className="bg-muted/30 p-2 rounded">
                  <h4 className="font-medium text-sm">English Version</h4>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Desert Escapes"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="presentation_title">Presentation Title *</Label>
                  <Input
                    id="presentation_title"
                    value={formData.presentation_title}
                    onChange={(e) => setFormData({ ...formData, presentation_title: e.target.value })}
                    placeholder="e.g., Your Perfect Romantic Escape Awaits"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Large title displayed on the category page
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="intro">Introduction Text *</Label>
                  <Textarea
                    id="intro"
                    value={formData.intro_rich_text}
                    onChange={(e) => setFormData({ ...formData, intro_rich_text: e.target.value })}
                    placeholder="A captivating description of this category..."
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Key Features</Label>
                  {formData.bullets.map((bullet, index) => (
                    <Input
                      key={index}
                      value={bullet}
                      onChange={(e) => {
                        const newBullets = [...formData.bullets];
                        newBullets[index] = e.target.value;
                        setFormData({ ...formData, bullets: newBullets });
                      }}
                      placeholder={`Feature ${index + 1}`}
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, bullets: [...formData.bullets, ""] })}
                  >
                    Add Feature
                  </Button>
                </div>
              </div>

              {/* Hebrew Column */}
              <div className="space-y-4">
                <div className="bg-muted/30 p-2 rounded">
                  <h4 className="font-medium text-sm">Hebrew Version (עברית)</h4>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name_he">שם הקטגוריה</Label>
                  <Input
                    id="name_he"
                    value={formData.name_he}
                    onChange={(e) => setFormData({ ...formData, name_he: e.target.value })}
                    placeholder="שם הקטגוריה בעברית"
                    dir="rtl"
                    className="bg-hebrew-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="presentation_title_he">כותרת גדולה</Label>
                  <Input
                    id="presentation_title_he"
                    value={formData.presentation_title_he}
                    onChange={(e) => setFormData({ ...formData, presentation_title_he: e.target.value })}
                    placeholder="כותרת גדולה של הקטגוריה"
                    dir="rtl"
                    className="bg-hebrew-input"
                  />
                  <p className="text-sm text-muted-foreground">
                    Large title for Hebrew version
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="intro_he">טקסט הקדמה</Label>
                  <Textarea
                    id="intro_he"
                    value={formData.intro_rich_text_he}
                    onChange={(e) => setFormData({ ...formData, intro_rich_text_he: e.target.value })}
                    placeholder="תיאור מרתק של הקטגוריה..."
                    rows={4}
                    dir="rtl"
                    className="bg-hebrew-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>תכונות מרכזיות</Label>
                  {formData.bullets_he.map((bullet, index) => (
                    <Input
                      key={index}
                      value={bullet}
                      onChange={(e) => {
                        const newBullets = [...formData.bullets_he];
                        newBullets[index] = e.target.value;
                        setFormData({ ...formData, bullets_he: newBullets });
                      }}
                      placeholder={`תכונה ${index + 1}`}
                      dir="rtl"
                      className="bg-hebrew-input"
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, bullets_he: [...formData.bullets_he, ""] })}
                  >
                    הוסף תכונה
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO Section */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle>SEO Configuration</CardTitle>
            <p className="text-sm text-muted-foreground">
              Configure SEO metadata for search engines and social media sharing
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              {/* English Column */}
              <div className="space-y-4">
                <div className="bg-background p-2 rounded">
                  <h4 className="font-medium text-sm">English SEO</h4>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seo_title_en">SEO Title</Label>
                  <Input
                    id="seo_title_en"
                    value={formData.seo_title_en}
                    onChange={(e) => setFormData({ ...formData, seo_title_en: e.target.value })}
                    placeholder="Displayed in browser tab and Google results"
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: Max ~60 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_description_en">Meta Description</Label>
                  <Textarea
                    id="meta_description_en"
                    value={formData.meta_description_en}
                    onChange={(e) => setFormData({ ...formData, meta_description_en: e.target.value })}
                    placeholder="Shown in Google search results"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: Max ~155 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="og_title_en">Open Graph Title</Label>
                  <Input
                    id="og_title_en"
                    value={formData.og_title_en}
                    onChange={(e) => setFormData({ ...formData, og_title_en: e.target.value })}
                    placeholder="Title when shared on social media"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="og_description_en">Open Graph Description</Label>
                  <Textarea
                    id="og_description_en"
                    value={formData.og_description_en}
                    onChange={(e) => setFormData({ ...formData, og_description_en: e.target.value })}
                    placeholder="Description when shared on social media"
                    rows={3}
                  />
                </div>
              </div>

              {/* Hebrew Column */}
              <div className="space-y-4">
                <div className="bg-background p-2 rounded">
                  <h4 className="font-medium text-sm">Hebrew SEO (עברית)</h4>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seo_title_he">כותרת SEO</Label>
                  <Input
                    id="seo_title_he"
                    value={formData.seo_title_he}
                    onChange={(e) => setFormData({ ...formData, seo_title_he: e.target.value })}
                    placeholder="כותרת עבור גוגל וכרטיסייה"
                    dir="rtl"
                    className="bg-hebrew-input"
                  />
                  <p className="text-xs text-muted-foreground">
                    Max ~60 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_description_he">תיאור Meta</Label>
                  <Textarea
                    id="meta_description_he"
                    value={formData.meta_description_he}
                    onChange={(e) => setFormData({ ...formData, meta_description_he: e.target.value })}
                    placeholder="תיאור עבור תוצאות גוגל"
                    rows={3}
                    dir="rtl"
                    className="bg-hebrew-input"
                  />
                  <p className="text-xs text-muted-foreground">
                    Max ~155 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="og_title_he">כותרת Open Graph</Label>
                  <Input
                    id="og_title_he"
                    value={formData.og_title_he}
                    onChange={(e) => setFormData({ ...formData, og_title_he: e.target.value })}
                    placeholder="כותרת עבור שיתוף ברשתות חברתיות"
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
                    placeholder="תיאור עבור שיתוף ברשתות חברתיות"
                    rows={3}
                    dir="rtl"
                    className="bg-hebrew-input"
                  />
                </div>
              </div>

              {/* French Column */}
              <div className="space-y-4">
                <div className="bg-background p-2 rounded">
                  <h4 className="font-medium text-sm">French SEO (Français)</h4>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seo_title_fr">Titre SEO</Label>
                  <Input
                    id="seo_title_fr"
                    value={formData.seo_title_fr}
                    onChange={(e) => setFormData({ ...formData, seo_title_fr: e.target.value })}
                    placeholder="Titre pour Google et l'onglet"
                  />
                  <p className="text-xs text-muted-foreground">
                    Max ~60 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta_description_fr">Description Meta</Label>
                  <Textarea
                    id="meta_description_fr"
                    value={formData.meta_description_fr}
                    onChange={(e) => setFormData({ ...formData, meta_description_fr: e.target.value })}
                    placeholder="Description pour les résultats Google"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Max ~155 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="og_title_fr">Titre Open Graph</Label>
                  <Input
                    id="og_title_fr"
                    value={formData.og_title_fr}
                    onChange={(e) => setFormData({ ...formData, og_title_fr: e.target.value })}
                    placeholder="Titre pour les réseaux sociaux"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="og_description_fr">Description Open Graph</Label>
                  <Textarea
                    id="og_description_fr"
                    value={formData.og_description_fr}
                    onChange={(e) => setFormData({ ...formData, og_description_fr: e.target.value })}
                    placeholder="Description pour les réseaux sociaux"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* OG Image - Shared */}
            <div className="mt-6 space-y-2">
              <Label htmlFor="og_image">Open Graph Image</Label>
              <Input
                id="og_image"
                value={formData.og_image}
                onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                placeholder="Image URL for social media sharing"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 1200x630px. Leave empty to use hero image.
              </p>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default CategoryEditor;