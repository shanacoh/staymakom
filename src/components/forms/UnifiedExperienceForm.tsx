import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Save, Rocket, Plus, X, Upload, Loader2, Trash2, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ui/image-upload";
import RichTextEditor from "@/components/ui/rich-text-editor";
import NightsRangeSelector from "@/components/experience/NightsRangeSelector";
import IncludesManager from "@/components/admin/IncludesManager";
import ExperienceExtrasSelector from "@/components/admin/ExperienceExtrasSelector";
import ReviewsManager from "@/components/admin/ReviewsManager";
import { HighlightTagsSelector } from "@/components/admin/HighlightTagsSelector";
import { generateSlug } from "@/lib/utils";

const experienceSchema = z.object({
  title: z.string().min(1, "English title is required"),
  title_he: z.string().optional(),
  subtitle: z.string().optional(),
  subtitle_he: z.string().optional(),
  category_id: z.string().min(1, "Category is required"),
  long_copy: z.string().min(100, "English description must be at least 100 characters"),
  long_copy_he: z.string().optional(),
  min_nights: z.number().min(1).max(8).optional(),
  max_nights: z.number().min(1).max(8).optional(),
  min_party: z.number().min(1).max(100),
  max_party: z.number().min(1).max(100),
  cancellation_policy: z.string().optional(),
  cancellation_policy_he: z.string().optional(),
  base_price: z.number().min(0.01, "Price must be greater than 0"),
  currency: z.string(),
  base_price_type: z.enum(["fixed", "per_booking", "per_person"]),
  hotel_id: z.string().min(1, "Hotel is required"),
  internal_notes: z.string().optional(),
  seo_title_en: z.string().optional(),
  seo_title_he: z.string().optional(),
  seo_title_fr: z.string().optional(),
  meta_description_en: z.string().optional(),
  meta_description_he: z.string().optional(),
  meta_description_fr: z.string().optional(),
  og_title_en: z.string().optional(),
  og_title_he: z.string().optional(),
  og_title_fr: z.string().optional(),
  og_description_en: z.string().optional(),
  og_description_he: z.string().optional(),
  og_description_fr: z.string().optional(),
  og_image: z.string().optional(),
});

type ExperienceFormData = z.infer<typeof experienceSchema>;

interface UnifiedExperienceFormProps {
  hotelId?: string;
  hotelName?: string;
  onClose?: () => void;
  experienceId?: string;
  mode: "admin" | "hotel_admin";
}

export function UnifiedExperienceForm({
  hotelId: propHotelId,
  hotelName,
  onClose,
  experienceId,
  mode,
}: UnifiedExperienceFormProps) {
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const [heroImage, setHeroImage] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [status, setStatus] = useState<"draft" | "pending" | "published">("draft");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showExtrasDialog, setShowExtrasDialog] = useState(false);
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);

  // Fetch hotels (for admin only)
  const { data: hotels } = useQuery({
    queryKey: ["admin-hotels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotels")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: mode === "admin",
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("status", "published")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing experience
  const { data: existingExperience, isLoading: isLoadingExperience } = useQuery({
    queryKey: ["experience", experienceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .eq("id", experienceId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!experienceId,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      title: "",
      title_he: "",
      subtitle: "",
      subtitle_he: "",
      category_id: "",
      long_copy: "",
      long_copy_he: "",
      hotel_id: propHotelId || "",
      min_nights: 1,
      max_nights: 4,
      min_party: 2,
      max_party: 4,
      base_price: 0,
      currency: "ILS",
      base_price_type: "per_person",
      cancellation_policy: "",
      cancellation_policy_he: "",
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
    },
  });

  const longCopy = watch("long_copy");
  const longCopyHe = watch("long_copy_he");
  const minNights = watch("min_nights");
  const maxNights = watch("max_nights");
  const basePrice = watch("base_price");
  const title = watch("title");

  // Pre-fill form when editing
  useEffect(() => {
    if (existingExperience) {
      setValue("title", existingExperience.title || "");
      setValue("title_he", existingExperience.title_he || "");
      setValue("subtitle", existingExperience.subtitle || "");
      setValue("subtitle_he", existingExperience.subtitle_he || "");
      setValue("category_id", existingExperience.category_id || "", { shouldValidate: true });
      setValue("long_copy", existingExperience.long_copy || "");
      setValue("long_copy_he", existingExperience.long_copy_he || "");
      setValue("min_nights", existingExperience.min_nights || 1);
      setValue("max_nights", existingExperience.max_nights || 4);
      setValue("min_party", existingExperience.min_party || 2);
      setValue("max_party", existingExperience.max_party || 4);
      setValue("base_price", Number(existingExperience.base_price) || 0);
      setValue("currency", existingExperience.currency || "ILS");
      setValue("base_price_type", existingExperience.base_price_type || "per_person");
      setValue("hotel_id", existingExperience.hotel_id || propHotelId || "");
      setValue("cancellation_policy", existingExperience.cancellation_policy || "");
      setValue("cancellation_policy_he", existingExperience.cancellation_policy_he || "");
      setValue("seo_title_en", existingExperience.seo_title_en || "");
      setValue("seo_title_he", existingExperience.seo_title_he || "");
      setValue("seo_title_fr", existingExperience.seo_title_fr || "");
      setValue("meta_description_en", existingExperience.meta_description_en || "");
      setValue("meta_description_he", existingExperience.meta_description_he || "");
      setValue("meta_description_fr", existingExperience.meta_description_fr || "");
      setValue("og_title_en", existingExperience.og_title_en || "");
      setValue("og_title_he", existingExperience.og_title_he || "");
      setValue("og_title_fr", existingExperience.og_title_fr || "");
      setValue("og_description_en", existingExperience.og_description_en || "");
      setValue("og_description_he", existingExperience.og_description_he || "");
      setValue("og_description_fr", existingExperience.og_description_fr || "");
      setValue("og_image", existingExperience.og_image || "");
      
      if (existingExperience.hero_image) {
        setHeroImagePreview(existingExperience.hero_image);
      }
      if (existingExperience.photos && Array.isArray(existingExperience.photos)) {
        setGalleryPreviews(existingExperience.photos);
      }
      const expStatus = existingExperience.status as "draft" | "pending" | "published";
      if (expStatus === "draft" || expStatus === "pending" || expStatus === "published") {
        setStatus(expStatus);
      }
    }
  }, [existingExperience, setValue, propHotelId]);

  // Image upload handlers
  const handleHeroImageChange = (file: File | null) => {
    setHeroImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setHeroImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setHeroImagePreview(null);
    }
  };

  const handleGalleryImagesChange = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files).slice(0, 8 - galleryImages.length);
    setGalleryImages((prev) => [...prev, ...newFiles]);

    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGalleryPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImage = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("experience-images")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("experience-images").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSaveDraft = async (data: ExperienceFormData) => {
    setIsSaving(true);
    try {
      let heroImageUrl = existingExperience?.hero_image || "";
      if (heroImage) {
        heroImageUrl = await uploadImage(heroImage, "hero");
      }

      // Start with current gallery previews (reflects deletions), filter out data URLs (new uploads not yet saved)
      const photoUrls = galleryPreviews.filter(url => url.startsWith('http'));
      for (const img of galleryImages) {
        const url = await uploadImage(img, "gallery");
        photoUrls.push(url);
      }

      const experienceData: any = {
        title: data.title,
        title_he: data.title_he,
        subtitle: data.subtitle,
        subtitle_he: data.subtitle_he,
        category_id: data.category_id,
        long_copy: data.long_copy,
        long_copy_he: data.long_copy_he,
        min_nights: data.min_nights,
        max_nights: data.max_nights,
        min_party: data.min_party,
        max_party: data.max_party,
        base_price: data.base_price,
        currency: data.currency,
        base_price_type: data.base_price_type,
        hotel_id: data.hotel_id,
        cancellation_policy: data.cancellation_policy,
        cancellation_policy_he: data.cancellation_policy_he,
        hero_image: heroImageUrl,
        photos: photoUrls,
        status: "draft" as const,
        slug: experienceId ? existingExperience?.slug : generateSlug(title),
        seo_title_en: data.seo_title_en,
        seo_title_he: data.seo_title_he,
        meta_description_en: data.meta_description_en,
        meta_description_he: data.meta_description_he,
        og_title_en: data.og_title_en,
        og_title_he: data.og_title_he,
        og_description_en: data.og_description_en,
        og_description_he: data.og_description_he,
        og_image: data.og_image,
      };

      if (experienceId) {
        const { error } = await supabase
          .from("experiences")
          .update(experienceData)
          .eq("id", experienceId);
        if (error) throw error;
        toast.success("Draft saved successfully");
      } else {
        const { error } = await supabase
          .from("experiences")
          .insert([experienceData]);
        if (error) throw error;
        toast.success("Draft created successfully");
      }

      queryClient.invalidateQueries({ queryKey: ["experiences"] });
      queryClient.invalidateQueries({ queryKey: ["hotel-experiences"] });
      onClose?.();
    } catch (error: any) {
      
      toast.error(error.message || "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async (data: ExperienceFormData) => {
    setIsSaving(true);
    try {
      let heroImageUrl = existingExperience?.hero_image || "";
      if (heroImage) {
        heroImageUrl = await uploadImage(heroImage, "hero");
      }

      // Start with current gallery previews (reflects deletions), filter out data URLs (new uploads not yet saved)
      const photoUrls = galleryPreviews.filter(url => url.startsWith('http'));
      for (const img of galleryImages) {
        const url = await uploadImage(img, "gallery");
        photoUrls.push(url);
      }

      const publishStatus = mode === "hotel_admin" ? ("pending" as const) : ("published" as const);

      const experienceData: any = {
        title: data.title,
        title_he: data.title_he,
        subtitle: data.subtitle,
        subtitle_he: data.subtitle_he,
        category_id: data.category_id,
        long_copy: data.long_copy,
        long_copy_he: data.long_copy_he,
        min_nights: data.min_nights,
        max_nights: data.max_nights,
        min_party: data.min_party,
        max_party: data.max_party,
        base_price: data.base_price,
        currency: data.currency,
        base_price_type: data.base_price_type,
        hotel_id: data.hotel_id,
        cancellation_policy: data.cancellation_policy,
        cancellation_policy_he: data.cancellation_policy_he,
        hero_image: heroImageUrl,
        photos: photoUrls,
        status: publishStatus,
        slug: experienceId ? existingExperience?.slug : generateSlug(title),
        seo_title_en: data.seo_title_en,
        seo_title_he: data.seo_title_he,
        meta_description_en: data.meta_description_en,
        meta_description_he: data.meta_description_he,
        og_title_en: data.og_title_en,
        og_title_he: data.og_title_he,
        og_description_en: data.og_description_en,
        og_description_he: data.og_description_he,
        og_image: data.og_image,
      };

      if (experienceId) {
        const { error } = await supabase
          .from("experiences")
          .update(experienceData)
          .eq("id", experienceId);
        if (error) throw error;
        toast.success(mode === "hotel_admin" ? "Sent for approval" : "Published successfully");
      } else {
        const { error } = await supabase
          .from("experiences")
          .insert([experienceData]);
        if (error) throw error;
        toast.success(mode === "hotel_admin" ? "Sent for approval" : "Published successfully");
      }

      queryClient.invalidateQueries({ queryKey: ["experiences"] });
      queryClient.invalidateQueries({ queryKey: ["hotel-experiences"] });
      onClose?.();
    } catch (error: any) {
      
      toast.error(error.message || "Failed to publish");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!experienceId) throw new Error("No experience ID");
      const { error } = await supabase
        .from("experiences")
        .delete()
        .eq("id", experienceId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Experience deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["experiences"] });
      queryClient.invalidateQueries({ queryKey: ["hotel-experiences"] });
      onClose?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete experience");
    },
  });

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
    setShowDeleteDialog(false);
  };

  // Handler for validation errors - shows toast and scrolls to first error
  const onInvalidSubmit = (errors: Record<string, any>) => {
    
    
    // Create readable field names
    const fieldNames: Record<string, string> = {
      title: "Title (EN)",
      category_id: "Category",
      long_copy: "Description (EN)",
      base_price: "Base Price",
      hotel_id: "Hotel",
      min_party: "Min Party Size",
      max_party: "Max Party Size",
    };
    
    // Get all error messages
    const errorFields = Object.keys(errors).map(field => fieldNames[field] || field);
    
    if (errorFields.length > 0) {
      toast.error(`Please fill required fields: ${errorFields.join(", ")}`);
    }
    
    // Scroll to first error field
    const firstErrorField = Object.keys(errors)[0];
    const element = document.querySelector(`[name="${firstErrorField}"]`) || 
                    document.getElementById(firstErrorField);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const canPublish = title && longCopy && basePrice > 0 && longCopy.length >= 100;

  if (isLoadingExperience) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(handlePublish, onInvalidSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onClose && (
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Experiences
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold">
                {experienceId ? "Edit Experience" : "Create New Experience"}
              </h1>
              {hotelName && <p className="text-sm text-muted-foreground">Hotel: {hotelName}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleSubmit(handleSaveDraft, onInvalidSubmit)} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button type="submit" disabled={!canPublish || isSaving}>
              <Rocket className="h-4 w-4 mr-2" />
              {mode === "hotel_admin" ? "Submit for Approval" : "Publish"}
            </Button>
            {experienceId && (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Core details in English and Hebrew</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* English Column */}
              <div className="space-y-4">
                <div className="font-medium text-sm text-muted-foreground">English Version</div>
                
                <div>
                  <Label htmlFor="title">Title (EN) *</Label>
                  <Input id="title" {...register("title")} />
                  {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <Label htmlFor="subtitle">Subtitle (EN)</Label>
                  <Input id="subtitle" {...register("subtitle")} />
                </div>

                <div>
                  <Label htmlFor="long_copy">Description (EN) * (min 100 characters)</Label>
                  <Controller
                    name="long_copy"
                    control={control}
                    render={({ field }) => (
                      <RichTextEditor
                        content={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Describe the experience in English..."
                      />
                    )}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.long_copy && (
                      <p className="text-sm text-destructive">{errors.long_copy.message}</p>
                    )}
                    <p className="text-sm text-muted-foreground ml-auto">
                      {longCopy?.length || 0} / 100 characters minimum
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="cancellation_policy">Cancellation Policy (EN)</Label>
                  <Input id="cancellation_policy" {...register("cancellation_policy")} />
                </div>
              </div>

              {/* Hebrew Column */}
              <div className="space-y-4">
                <div className="font-medium text-sm text-muted-foreground">Hebrew Version (עברית)</div>
                
                <div>
                  <Label htmlFor="title_he">Title (HE)</Label>
                  <Input id="title_he" {...register("title_he")} dir="rtl" className="bg-hebrew-input" />
                </div>

                <div>
                  <Label htmlFor="subtitle_he">Subtitle (HE)</Label>
                  <Input id="subtitle_he" {...register("subtitle_he")} dir="rtl" className="bg-hebrew-input" />
                </div>

                <div>
                  <Label htmlFor="long_copy_he">Description (HE)</Label>
                  <Controller
                    name="long_copy_he"
                    control={control}
                    render={({ field }) => (
                      <RichTextEditor
                        content={field.value || ''}
                        onChange={field.onChange}
                        placeholder="תאר את החוויה בעברית..."
                        dir="rtl"
                      />
                    )}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {longCopyHe?.length || 0} characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="cancellation_policy_he">Cancellation Policy (HE)</Label>
                  <Input id="cancellation_policy_he" {...register("cancellation_policy_he")} dir="rtl" className="bg-hebrew-input" />
                </div>
              </div>
            </div>

            {/* Hotel & Category */}
            <div className="grid grid-cols-2 gap-4">
              {mode === "admin" ? (
                <div>
                  <Label htmlFor="hotel_id">Hotel *</Label>
                  <Select
                    value={watch("hotel_id") || ""}
                    onValueChange={(value) => setValue("hotel_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hotel" />
                    </SelectTrigger>
                    <SelectContent>
                      {hotels?.map((hotel) => (
                        <SelectItem key={hotel.id} value={hotel.id}>
                          {hotel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.hotel_id && (
                    <p className="text-sm text-destructive mt-1">{errors.hotel_id.message}</p>
                  )}
                </div>
              ) : (
                <div>
                  <Label>Linked Hotel</Label>
                  <Input value={hotelName} disabled />
                </div>
              )}

              <div>
                <Label htmlFor="category_id">Category *</Label>
                <Controller
                  name="category_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category_id && (
                  <p className="text-sm text-destructive mt-1">{errors.category_id.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Images & Media</CardTitle>
            <CardDescription>Upload hero image and gallery photos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Hero Image</Label>
              <div className="border-2 border-dashed rounded-lg p-4">
                {heroImagePreview && (
                  <img src={heroImagePreview} alt="Hero preview" className="w-full h-64 object-cover rounded-lg mb-2" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleHeroImageChange(e.target.files?.[0] || null)}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <Label>Gallery Images (up to 8)</Label>
              <div className="grid grid-cols-4 gap-4">
                {galleryPreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {galleryPreviews.length < 8 && (
                  <label className="border-2 border-dashed rounded-lg h-32 flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleGalleryImagesChange(e.target.files)}
                    />
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </label>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="base_price">Base Price *</Label>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  {...register("base_price", { valueAsNumber: true })}
                />
                {errors.base_price && (
                  <p className="text-sm text-destructive mt-1">{errors.base_price.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={watch("currency")} onValueChange={(value) => setValue("currency", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ILS">ILS</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="base_price_type">Pricing Type</Label>
                <Select
                  value={watch("base_price_type")}
                  onValueChange={(value: any) => setValue("base_price_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_person">Per Person</SelectItem>
                    <SelectItem value="per_booking">Per Booking</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Capacity */}
        <Card>
          <CardHeader>
            <CardTitle>Capacity & Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <NightsRangeSelector
                minValue={minNights}
                maxValue={maxNights}
                onMinChange={(value) => setValue("min_nights", value)}
                onMaxChange={(value) => setValue("max_nights", value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="min_party">Min Participants *</Label>
                <Input
                  id="min_party"
                  type="number"
                  min="1"
                  {...register("min_party", { valueAsNumber: true })}
                />
              </div>

              <div>
                <Label htmlFor="max_party">Max Participants *</Label>
                <Input
                  id="max_party"
                  type="number"
                  min="1"
                  {...register("max_party", { valueAsNumber: true })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's Included */}
        <Card>
          <CardHeader>
            <CardTitle>What's Included</CardTitle>
            <CardDescription>Manage the items included in this experience</CardDescription>
          </CardHeader>
          <CardContent>
            {experienceId ? (
              <IncludesManager experienceId={experienceId} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Save this experience as a draft first to manage What's Included items.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Highlight Tags (badges on cards) */}
        <HighlightTagsSelector experienceId={experienceId} />

        {/* Spice It Up (Extras) */}
        <Card>
          <CardHeader>
            <CardTitle>Spice It Up (Extras)</CardTitle>
            <CardDescription>Select extras from your hotel that guests can add to this experience</CardDescription>
          </CardHeader>
          <CardContent>
            {experienceId && watch("hotel_id") ? (
              <ExperienceExtrasSelector 
                experienceId={experienceId} 
                hotelId={watch("hotel_id")}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Save this experience as a draft first to manage extras.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviews */}
        {experienceId && (
          <Card>
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
              <CardDescription>Manage customer reviews</CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewsManager experienceId={experienceId} />
            </CardContent>
          </Card>
        )}

        {/* Internal Notes */}
        {mode === "admin" && (
          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
              <CardDescription>Private notes for admin use only</CardDescription>
            </CardHeader>
            <CardContent>
              <Input {...register("internal_notes")} placeholder="Add internal notes..." />
            </CardContent>
          </Card>
        )}

        {/* SEO Section */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle>SEO Configuration</CardTitle>
            <CardDescription>
              Configure SEO metadata for search engines and social media sharing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                    {...register("seo_title_en")}
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
                    {...register("meta_description_en")}
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
                    {...register("og_title_en")}
                    placeholder="Title when shared on social media"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="og_description_en">Open Graph Description</Label>
                  <Textarea
                    id="og_description_en"
                    {...register("og_description_en")}
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
                    {...register("seo_title_he")}
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
                    {...register("meta_description_he")}
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
                    {...register("og_title_he")}
                    placeholder="כותרת עבור שיתוף ברשתות חברתיות"
                    dir="rtl"
                    className="bg-hebrew-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="og_description_he">תיאור Open Graph</Label>
                  <Textarea
                    id="og_description_he"
                    {...register("og_description_he")}
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
                    {...register("seo_title_fr")}
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
                    {...register("meta_description_fr")}
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
                    {...register("og_title_fr")}
                    placeholder="Titre pour les réseaux sociaux"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="og_description_fr">Description Open Graph</Label>
                  <Textarea
                    id="og_description_fr"
                    {...register("og_description_fr")}
                    placeholder="Description pour les réseaux sociaux"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* OG Image - Shared */}
            <div className="space-y-2">
              <Label htmlFor="og_image">Open Graph Image</Label>
              <Input
                id="og_image"
                {...register("og_image")}
                placeholder="Image URL for social media sharing"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 1200x630px. Leave empty to use hero image.
              </p>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the experience.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
