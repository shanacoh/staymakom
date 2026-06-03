import { useState, useEffect, useCallback, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Save, Rocket, X, Upload, Loader2, ArrowLeft, Plus, Star, Clock, MapPin, DollarSign, Check } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { generateSlug } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

const TABS = [
  { id: "photos_slots", label: "Photos & Créneaux" },
  { id: "description", label: "Description" },
  { id: "inclus", label: "Inclus" },
  { id: "tarification", label: "Tarification" },
  { id: "things", label: "Things to Know" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const optNum = (min = 0) =>
  z.preprocess((v) => (typeof v === "number" && isNaN(v) ? undefined : v), z.number().min(min).optional());

const standaloneExperienceSchema = z.object({
  title: z.string().min(1, "English title is required"),
  title_fr: z.string().optional(),
  title_he: z.string().optional(),
  subtitle: z.string().optional(),
  subtitle_fr: z.string().optional(),
  subtitle_he: z.string().optional(),
  category_id: z.string().min(1, "Category is required"),
  long_copy: z.string().min(100, "English description must be at least 100 characters"),
  long_copy_fr: z.string().optional(),
  long_copy_he: z.string().optional(),
  min_party: z.number().min(1).max(100),
  max_party: z.number().min(1).max(100),
  cancellation_policy: z.string().optional(),
  cancellation_policy_fr: z.string().optional(),
  cancellation_policy_he: z.string().optional(),
  // Tarification standalone
  base_price: z.number().min(0).default(0),
  base_price_type: z.enum(["per_person", "fixed", "per_person_per_night"]).default("per_person"),
  currency: z.enum(["USD", "EUR", "ILS"]).default("ILS"),
  lead_time_days: optNum(0),
  has_time_slots: z.boolean().default(false),
  // Localisation
  address: z.string().optional(),
  address_he: z.string().optional(),
  google_maps_link: z.string().optional(),
  region_type: z.string().optional(),
  // Durée
  duration: z.string().optional(),
  duration_fr: z.string().optional(),
  duration_he: z.string().optional(),
  // Accessibilité
  accessibility_info: z.string().optional(),
  // SEO
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

type StandaloneFormData = z.infer<typeof standaloneExperienceSchema>;

// ---------------------------------------------------------------------------
// Simple list types for includes/not_includes/good_to_know
// ---------------------------------------------------------------------------

interface SimpleListItem {
  id: string;
  text: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface StandaloneExperienceFormProps {
  experienceId?: string;
  onClose?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StandaloneExperienceForm({ experienceId, onClose }: StandaloneExperienceFormProps) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // Image state
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  const [heroImageUploading, setHeroImageUploading] = useState(false);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [createdExperienceId, setCreatedExperienceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("photos_slots");

  // Auto-save
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Time slots state
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [newSlot, setNewSlot] = useState<string>("");

  // Featured on home
  const [featuredOnHome, setFeaturedOnHome] = useState(false);
  const [homeDisplayOrder, setHomeDisplayOrder] = useState(0);

  // Includes lists (stored as JSONB in standalone_experiences)
  const [includes, setIncludes] = useState<SimpleListItem[]>([]);
  const [notIncludes, setNotIncludes] = useState<SimpleListItem[]>([]);
  const [goodToKnow, setGoodToKnow] = useState<SimpleListItem[]>([]);
  const [newInclude, setNewInclude] = useState("");
  const [newNotInclude, setNewNotInclude] = useState("");
  const [newGoodToKnow, setNewGoodToKnow] = useState("");

  const currentExperienceId = experienceId || createdExperienceId;

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

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

  const { data: existingExperience, isLoading: isLoadingExperience } = useQuery({
    queryKey: ["standalone-experience", experienceId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("standalone_experiences")
        .select("*")
        .eq("id", experienceId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!experienceId,
  });

  // -------------------------------------------------------------------------
  // Form setup
  // -------------------------------------------------------------------------

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm<StandaloneFormData>({
    resolver: zodResolver(standaloneExperienceSchema),
    defaultValues: {
      title: "",
      title_fr: "",
      title_he: "",
      subtitle: "",
      subtitle_fr: "",
      subtitle_he: "",
      category_id: "",
      long_copy: "",
      long_copy_fr: "",
      long_copy_he: "",
      min_party: 1,
      max_party: 10,
      cancellation_policy: "",
      cancellation_policy_fr: "",
      cancellation_policy_he: "",
      base_price: 0,
      base_price_type: "per_person",
      currency: "ILS",
      lead_time_days: 0,
      has_time_slots: false,
      address: "",
      address_he: "",
      google_maps_link: "",
      region_type: "",
      duration: "",
      duration_fr: "",
      duration_he: "",
      accessibility_info: "",
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

  const title = watch("title");
  const longCopy = watch("long_copy");
  const hasTimeSlots = watch("has_time_slots");
  const basePrice = watch("base_price");
  const basePriceType = watch("base_price_type");
  const currency = watch("currency");
  const minParty = watch("min_party");
  const maxParty = watch("max_party");

  // -------------------------------------------------------------------------
  // Auto-save to localStorage
  // -------------------------------------------------------------------------

  const autoSaveKey = `standalone-exp-autosave-${experienceId || "new"}`;

  const doAutoSave = useCallback(() => {
    try {
      const payload = {
        formData: getValues(),
        heroImagePreview,
        galleryPreviews: galleryPreviews.filter((u) => u.startsWith("http")),
        timeSlots,
        includes,
        notIncludes,
        goodToKnow,
        featuredOnHome,
        homeDisplayOrder,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(autoSaveKey, JSON.stringify(payload));
      setLastAutoSave(new Date());
    } catch {
      // silent fail
    }
  }, [getValues, heroImagePreview, galleryPreviews, timeSlots, includes, notIncludes, goodToKnow, featuredOnHome, homeDisplayOrder, autoSaveKey]);

  useEffect(() => {
    autoSaveTimerRef.current = setInterval(doAutoSave, 30000);
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [doAutoSave]);

  // -------------------------------------------------------------------------
  // Pre-fill form when editing
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!existingExperience) return;
    const exp = existingExperience as any;

    setValue("title", exp.title || "");
    setValue("title_fr", exp.title_fr || "");
    setValue("title_he", exp.title_he || "");
    setValue("subtitle", exp.subtitle || "");
    setValue("subtitle_fr", exp.subtitle_fr || "");
    setValue("subtitle_he", exp.subtitle_he || "");
    setValue("category_id", exp.category_id || "", { shouldValidate: true });
    setValue("long_copy", exp.long_copy || "");
    setValue("long_copy_fr", exp.long_copy_fr || "");
    setValue("long_copy_he", exp.long_copy_he || "");
    setValue("min_party", exp.min_party || 1);
    setValue("max_party", exp.max_party || 10);
    setValue("cancellation_policy", exp.cancellation_policy || "");
    setValue("cancellation_policy_fr", exp.cancellation_policy_fr || "");
    setValue("cancellation_policy_he", exp.cancellation_policy_he || "");
    setValue("base_price", exp.base_price ?? 0);
    setValue("base_price_type", exp.base_price_type || "per_person");
    setValue("currency", exp.currency || "ILS");
    setValue("lead_time_days", exp.lead_time_days ?? 0);
    setValue("has_time_slots", exp.has_time_slots ?? false);
    setValue("address", exp.address || "");
    setValue("address_he", exp.address_he || "");
    setValue("google_maps_link", exp.google_maps_link || "");
    setValue("region_type", exp.region_type || "");
    setValue("duration", exp.duration || "");
    setValue("duration_fr", exp.duration_fr || "");
    setValue("duration_he", exp.duration_he || "");
    setValue("accessibility_info", exp.accessibility_info || "");
    setValue("seo_title_en", exp.seo_title_en || "");
    setValue("seo_title_he", exp.seo_title_he || "");
    setValue("seo_title_fr", exp.seo_title_fr || "");
    setValue("meta_description_en", exp.meta_description_en || "");
    setValue("meta_description_he", exp.meta_description_he || "");
    setValue("meta_description_fr", exp.meta_description_fr || "");
    setValue("og_title_en", exp.og_title_en || "");
    setValue("og_title_he", exp.og_title_he || "");
    setValue("og_title_fr", exp.og_title_fr || "");
    setValue("og_description_en", exp.og_description_en || "");
    setValue("og_description_he", exp.og_description_he || "");
    setValue("og_description_fr", exp.og_description_fr || "");
    setValue("og_image", exp.og_image || "");

    if (exp.hero_image) setHeroImagePreview(exp.hero_image);
    if (Array.isArray(exp.photos)) setGalleryPreviews(exp.photos);
    if (Array.isArray(exp.time_slots)) setTimeSlots(exp.time_slots);
    setFeaturedOnHome(exp.featured_on_home ?? false);
    setHomeDisplayOrder(exp.home_display_order ?? 0);

    // Restore lists from JSONB (noms de colonnes réels dans la table)
    if (Array.isArray(exp.includes)) {
      setIncludes(exp.includes.map((t: string, i: number) => ({ id: `inc-${i}`, text: t })));
    }
    if (Array.isArray(exp.not_includes)) {
      setNotIncludes(exp.not_includes.map((t: string, i: number) => ({ id: `ninc-${i}`, text: t })));
    }
    if (Array.isArray(exp.good_to_know)) {
      setGoodToKnow(exp.good_to_know.map((t: string, i: number) => ({ id: `gtk-${i}`, text: t })));
    }
  }, [existingExperience, setValue]);

  // -------------------------------------------------------------------------
  // Image handlers
  // -------------------------------------------------------------------------

  const uploadImage = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;
    const { error: uploadError } = await supabase.storage.from("experience-images").upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("experience-images").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleHeroImageChange = async (file: File | null) => {
    if (isSaving) return;
    if (!file) { setHeroImagePreview(null); return; }
    setHeroImageUploading(true);
    try {
      const url = await uploadImage(file, "hero");
      setHeroImagePreview(url);
    } catch {
      toast.error("Impossible d'uploader la couverture");
    } finally {
      setHeroImageUploading(false);
    }
  };

  const handleGalleryImagesChange = (files: FileList | null) => {
    if (!files || isSaving) return;
    const newFiles = Array.from(files).slice(0, 8 - galleryImages.length);
    setGalleryImages((prev) => [...prev, ...newFiles]);
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setGalleryPreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryImage = (index: number) => {
    if (isSaving) return;
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleHeroDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleHeroImageChange(file);
  };

  const handleGalleryDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleGalleryImagesChange(e.dataTransfer.files);
  };

  // -------------------------------------------------------------------------
  // Time slots helpers
  // -------------------------------------------------------------------------

  const addTimeSlot = () => {
    if (!newSlot || timeSlots.includes(newSlot)) return;
    setTimeSlots((prev) => [...prev, newSlot].sort());
    setNewSlot("");
  };

  const removeTimeSlot = (slot: string) => {
    setTimeSlots((prev) => prev.filter((s) => s !== slot));
  };

  // -------------------------------------------------------------------------
  // Simple list helpers
  // -------------------------------------------------------------------------

  const addToList = (
    setter: React.Dispatch<React.SetStateAction<SimpleListItem[]>>,
    text: string,
    clearInput: () => void,
    prefix: string,
  ) => {
    if (!text.trim()) return;
    setter((prev) => [...prev, { id: `${prefix}-${Date.now()}`, text: text.trim() }]);
    clearInput();
  };

  const removeFromList = (
    setter: React.Dispatch<React.SetStateAction<SimpleListItem[]>>,
    id: string,
  ) => {
    setter((prev) => prev.filter((item) => item.id !== id));
  };

  const updateListItem = (
    setter: React.Dispatch<React.SetStateAction<SimpleListItem[]>>,
    id: string,
    text: string,
  ) => {
    setter((prev) => prev.map((item) => item.id === id ? { ...item, text } : item));
  };

  // -------------------------------------------------------------------------
  // Build experience data object
  // -------------------------------------------------------------------------

  const buildExperienceData = async (data: StandaloneFormData, status: "draft" | "published") => {
    const heroImageUrl = heroImagePreview || (existingExperience as any)?.hero_image || "";

    const galleryImagesSnapshot = [...galleryImages];
    const galleryPreviewsSnapshot = [...galleryPreviews];

    const photoUrls = galleryPreviewsSnapshot.filter((url) => url.startsWith("http"));
    for (const img of galleryImagesSnapshot) {
      try {
        const url = await uploadImage(img, "gallery");
        photoUrls.push(url);
      } catch {
        toast.error("Une image n'a pas pu être uploadée");
      }
    }

    return {
      title: data.title,
      title_fr: data.title_fr || null,
      title_he: data.title_he || null,
      subtitle: data.subtitle || null,
      subtitle_fr: data.subtitle_fr || null,
      subtitle_he: data.subtitle_he || null,
      category_id: data.category_id,
      long_copy: data.long_copy || null,
      long_copy_fr: data.long_copy_fr || null,
      long_copy_he: data.long_copy_he || null,
      min_party: data.min_party,
      max_party: data.max_party,
      cancellation_policy: data.cancellation_policy || null,
      cancellation_policy_fr: data.cancellation_policy_fr || null,
      cancellation_policy_he: data.cancellation_policy_he || null,
      base_price: data.base_price,
      base_price_type: data.base_price_type,
      currency: data.currency,
      lead_time_days: data.lead_time_days ?? 0,
      has_time_slots: data.has_time_slots,
      time_slots: data.has_time_slots ? timeSlots : [],
      address: data.address || null,
      address_he: data.address_he || null,
      google_maps_link: data.google_maps_link || null,
      region_type: data.region_type || null,
      duration: data.duration || null,
      duration_fr: data.duration_fr || null,
      duration_he: data.duration_he || null,
      accessibility_info: data.accessibility_info || null,
      hero_image: heroImageUrl || null,
      thumbnail_image: heroImageUrl || null,
      photos: photoUrls,
      status,
      slug: currentExperienceId ? (existingExperience as any)?.slug : generateSlug(data.title),
      seo_title_en: data.seo_title_en || null,
      seo_title_he: data.seo_title_he || null,
      seo_title_fr: data.seo_title_fr || null,
      meta_description_en: data.meta_description_en || null,
      meta_description_he: data.meta_description_he || null,
      meta_description_fr: data.meta_description_fr || null,
      og_title_en: data.og_title_en || null,
      og_title_he: data.og_title_he || null,
      og_title_fr: data.og_title_fr || null,
      og_description_en: data.og_description_en || null,
      og_description_he: data.og_description_he || null,
      og_description_fr: data.og_description_fr || null,
      og_image: data.og_image || null,
      featured_on_home: featuredOnHome,
      home_display_order: homeDisplayOrder,
      // Lists stored as JSONB (noms de colonnes réels dans la table)
      includes: includes.map((i) => i.text),
      not_includes: notIncludes.map((i) => i.text),
      good_to_know: goodToKnow.map((i) => i.text),
    };
  };

  // -------------------------------------------------------------------------
  // Save Draft
  // -------------------------------------------------------------------------

  const handleSaveDraft = async (data: StandaloneFormData) => {
    setIsSaving(true);
    try {
      const experienceData = await buildExperienceData(data, "draft");
      if (currentExperienceId) {
        const { error } = await (supabase as any)
          .from("standalone_experiences")
          .update(experienceData)
          .eq("id", currentExperienceId);
        if (error) throw error;
        toast.success("Brouillon sauvegardé");
      } else {
        const { data: insertedData, error } = await (supabase as any)
          .from("standalone_experiences")
          .insert([experienceData])
          .select("id")
          .single();
        if (error) throw error;
        setCreatedExperienceId(insertedData.id);
        toast.success("Brouillon créé !");
      }
      setGalleryImages([]);
      localStorage.removeItem(autoSaveKey);
      queryClient.invalidateQueries({ queryKey: ["admin-standalone-experiences"] });
      if (currentExperienceId) queryClient.invalidateQueries({ queryKey: ["standalone-experience", currentExperienceId] });
    } catch (error: any) {
      toast.error(error.message || "Impossible de sauvegarder");
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Publish
  // -------------------------------------------------------------------------

  const handlePublish = async (data: StandaloneFormData) => {
    setIsSaving(true);
    try {
      const experienceData = await buildExperienceData(data, "published");
      if (currentExperienceId) {
        const { error } = await (supabase as any)
          .from("standalone_experiences")
          .update(experienceData)
          .eq("id", currentExperienceId);
        if (error) throw error;
        toast.success("Expérience publiée !");
      } else {
        const { data: insertedData, error } = await (supabase as any)
          .from("standalone_experiences")
          .insert([experienceData])
          .select("id")
          .single();
        if (error) throw error;
        setCreatedExperienceId(insertedData.id);
        toast.success("Expérience publiée !");
      }
      setGalleryImages([]);
      localStorage.removeItem(autoSaveKey);
      queryClient.invalidateQueries({ queryKey: ["admin-standalone-experiences"] });
      if (currentExperienceId) queryClient.invalidateQueries({ queryKey: ["standalone-experience", currentExperienceId] });
      onClose?.();
    } catch (error: any) {
      toast.error(error.message || "Impossible de publier");
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!experienceId) throw new Error("No experience ID");
      const { error } = await (supabase as any).from("standalone_experiences").delete().eq("id", experienceId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Expérience supprimée");
      localStorage.removeItem(autoSaveKey);
      queryClient.invalidateQueries({ queryKey: ["admin-standalone-experiences"] });
      onClose?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Impossible de supprimer");
    },
  });

  const handleDelete = () => {
    setDeleteConfirmText("");
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
    setShowDeleteDialog(false);
  };

  // -------------------------------------------------------------------------
  // Validation helper
  // -------------------------------------------------------------------------

  const onInvalidSubmit = (errs: Record<string, any>) => {
    const fieldNames: Record<string, string> = {
      title: "Title (EN)",
      category_id: "Category",
      long_copy: "Description (EN)",
      min_party: "Min Party Size",
      max_party: "Max Party Size",
      base_price: "Base Price",
    };
    const errorFields = Object.keys(errs).map((field) => fieldNames[field] || field);
    if (errorFields.length > 0) toast.error(`Champs requis manquants : ${errorFields.join(", ")}`);

    const errorField = Object.keys(errs)[0];
    if (["title", "title_he", "subtitle", "category_id", "long_copy"].includes(errorField)) {
      setActiveTab("description");
    } else if (["min_party", "max_party"].includes(errorField)) {
      setActiveTab("things");
    } else if (["base_price"].includes(errorField)) {
      setActiveTab("tarification");
    }
  };

  const canPublish = !!(title && longCopy && longCopy.length >= 100);

  // -------------------------------------------------------------------------
  // Tab completion indicators
  // -------------------------------------------------------------------------

  const getTabCompletion = (tabId: TabId): boolean => {
    switch (tabId) {
      case "photos_slots":
        return !!(heroImagePreview || galleryPreviews.length > 0);
      case "description":
        return !!(title && longCopy && longCopy.length >= 100 && watch("category_id"));
      case "inclus":
        return includes.length > 0;
      case "tarification":
        return (basePrice ?? 0) > 0;
      case "things":
        return true;
    }
  };

  const getAutoSaveLabel = () => {
    if (!lastAutoSave) return null;
    const diff = Math.round((Date.now() - lastAutoSave.getTime()) / 60000);
    if (diff < 1) return "Auto-sauvegardé à l'instant";
    return `Auto-sauvegardé il y a ${diff} min`;
  };

  // Currency symbol helper
  const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₪";

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (isLoadingExperience) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6 pb-24">
      <form onSubmit={handleSubmit(handlePublish, onInvalidSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            {onClose && (
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold">
                {experienceId ? "Modifier l'expérience" : "Nouvelle expérience standalone"}
              </h1>
              {lastAutoSave && (
                <p className="text-xs text-muted-foreground">{getAutoSaveLabel()}</p>
              )}
            </div>
          </div>
          {/* Desktop save buttons */}
          <div className="hidden md:flex gap-2">
            {experienceId && (
              <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={isSaving}>
                Supprimer
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={handleSubmit(handleSaveDraft, onInvalidSubmit)}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              Brouillon
            </Button>
            <Button type="submit" disabled={!canPublish || isSaving}>
              <Rocket className="h-4 w-4 mr-2" />
              Publier
            </Button>
          </div>
        </div>

        {/* Sticky Tab Navigation */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b -mx-6 px-6 py-0">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map((tab, index) => {
              const isComplete = getTabCompletion(tab.id);
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2",
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                  )}
                >
                  <span className={cn(
                    "flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold",
                    isComplete
                      ? "bg-green-600 text-white"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {isComplete ? <Check className="h-3 w-3" /> : index + 1}
                  </span>
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: Photos & Créneaux */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "photos_slots" && (
          <div className="space-y-6">
            {/* Photos */}
            <Card>
              <CardHeader>
                <CardTitle>Photos</CardTitle>
                <CardDescription>Images de l'expérience pour les listings et la page détail</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Hero Image */}
                <div>
                  <Label className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Photo de couverture
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Grande image affichée en haut de la fiche.
                  </p>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleHeroDrop}
                    className="border-2 border-dashed rounded-lg p-4 transition-colors hover:border-primary/50"
                  >
                    <div className="grid grid-cols-2 gap-4 items-center">
                      <div className="relative rounded-lg overflow-hidden bg-muted h-40">
                        {heroImageUploading ? (
                          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin mb-1 opacity-50" />
                            <p className="text-xs">Upload en cours…</p>
                          </div>
                        ) : heroImagePreview ? (
                          <>
                            <img src={heroImagePreview} alt="Hero" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setHeroImagePreview(null)}
                              className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground rounded-full p-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </>
                        ) : (
                          <div className="h-full flex items-center justify-center text-muted-foreground/40 text-xs">Aucune photo</div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md border bg-background hover:bg-muted transition-colors w-full justify-center">
                          <Upload className="h-4 w-4" />
                          {heroImagePreview ? "Changer la photo" : "Choisir une photo"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleHeroImageChange(e.target.files?.[0] || null)}
                          />
                        </label>
                        <p className="text-xs text-muted-foreground text-center">ou glisser-déposer ici</p>
                        <p className="text-xs text-muted-foreground text-center">1600×900px min · max 5MB</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gallery */}
                <div>
                  <Label>Galerie (max. 8)</Label>
                  <p className="text-xs text-muted-foreground mb-2">Glisser les images pour les ajouter. 1600×900px recommandé, max 5MB par image.</p>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleGalleryDrop}
                    className="grid grid-cols-4 gap-4"
                  >
                    {galleryPreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img src={preview} alt={`Gallery ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                        <span className="absolute top-1 left-1 bg-foreground/80 text-background text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                          {index + 1}
                        </span>
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setHeroImagePreview(preview)}
                            className="bg-secondary text-secondary-foreground rounded-full p-1"
                            title="Définir comme couverture"
                          >
                            <Star className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(index)}
                            className="bg-destructive text-destructive-foreground rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        {heroImagePreview === preview && (
                          <span className="absolute bottom-1 right-1 text-[9px] bg-accent text-accent-foreground px-1 rounded">COUV.</span>
                        )}
                      </div>
                    ))}
                    {galleryPreviews.length < 8 && (
                      <label className="border-2 border-dashed rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors text-muted-foreground">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleGalleryImagesChange(e.target.files)}
                        />
                        <Upload className="h-8 w-8 mb-1 opacity-40" />
                        <span className="text-xs">Ajouter</span>
                      </label>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Créneaux horaires */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Créneaux horaires
                    </CardTitle>
                    <CardDescription>Activez si l'expérience se déroule à des horaires précis</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{hasTimeSlots ? "Activés" : "Désactivés"}</span>
                    <Controller
                      name="has_time_slots"
                      control={control}
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                  </div>
                </div>
              </CardHeader>
              {hasTimeSlots && (
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={newSlot}
                      onChange={(e) => setNewSlot(e.target.value)}
                      className="w-40"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTimeSlot}
                      disabled={!newSlot}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  {timeSlots.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {timeSlots.map((slot) => (
                        <span
                          key={slot}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
                        >
                          {slot}
                          <button
                            type="button"
                            onClick={() => removeTimeSlot(slot)}
                            className="hover:text-destructive transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Aucun créneau ajouté.</p>
                  )}
                </CardContent>
              )}
            </Card>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: Description */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "description" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Titres & Description</CardTitle>
                <CardDescription>Contenu principal de la fiche expérience (EN + FR + HE)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Titres */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="flex items-center gap-1.5">
                      <span>🇬🇧</span> Titre (EN) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      {...register("title")}
                      placeholder="Ex: Wine tasting in the Galilee"
                      disabled={isSaving}
                    />
                    {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title_fr" className="flex items-center gap-1.5">
                      <span>🇫🇷</span> Titre (FR)
                    </Label>
                    <Input
                      id="title_fr"
                      {...register("title_fr")}
                      placeholder="Ex: Dégustation de vins en Galilée"
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title_he" className="flex items-center gap-1.5">
                      <span>🇮🇱</span> כותרת (HE)
                    </Label>
                    <Input
                      id="title_he"
                      {...register("title_he")}
                      placeholder="כותרת בעברית"
                      dir="rtl"
                      className="bg-hebrew-input"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                {/* Sous-titres */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="subtitle" className="flex items-center gap-1.5">
                      <span>🇬🇧</span> Sous-titre (EN)
                    </Label>
                    <Input
                      id="subtitle"
                      {...register("subtitle")}
                      placeholder="Courte accroche"
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtitle_fr" className="flex items-center gap-1.5">
                      <span>🇫🇷</span> Sous-titre (FR)
                    </Label>
                    <Input
                      id="subtitle_fr"
                      {...register("subtitle_fr")}
                      placeholder="Courte accroche en français"
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtitle_he" className="flex items-center gap-1.5">
                      <span>🇮🇱</span> תת-כותרת (HE)
                    </Label>
                    <Input
                      id="subtitle_he"
                      {...register("subtitle_he")}
                      placeholder="תת-כותרת בעברית"
                      dir="rtl"
                      className="bg-hebrew-input"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                {/* Descriptions longues */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <span>🇬🇧</span> Description longue (EN) <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="long_copy"
                    control={control}
                    render={({ field }) => (
                      <RichTextEditor
                        content={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Description complète de l'expérience..."
                      />
                    )}
                  />
                  {errors.long_copy && <p className="text-destructive text-xs">{errors.long_copy.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <span>🇫🇷</span> Description longue (FR)
                  </Label>
                  <Controller
                    name="long_copy_fr"
                    control={control}
                    render={({ field }) => (
                      <RichTextEditor
                        content={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Description complète de l'expérience en français..."
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <span>🇮🇱</span> תיאור ארוך (HE)
                  </Label>
                  <Controller
                    name="long_copy_he"
                    control={control}
                    render={({ field }) => (
                      <RichTextEditor
                        content={field.value || ""}
                        onChange={field.onChange}
                        placeholder="תיאור מלא של החוויה..."
                        dir="rtl"
                      />
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Catégorie & mise en avant */}
            <Card>
              <CardHeader>
                <CardTitle>Catégorie & Mise en avant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category_id">
                      Catégorie <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="category_id"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value || ""} onValueChange={field.onChange} disabled={isSaving}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une catégorie" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.category_id && <p className="text-destructive text-xs">{errors.category_id.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Slug (URL)</Label>
                    <Input
                      value={generateSlug(watch("title") || "")}
                      readOnly
                      className="bg-muted text-muted-foreground text-sm"
                    />
                    <p className="text-xs text-muted-foreground">Généré automatiquement depuis le titre EN</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">Mise en avant sur l'accueil</p>
                    <p className="text-xs text-muted-foreground">Afficher cette expérience dans la section vedette de la page d'accueil</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {featuredOnHome && (
                      <div className="flex items-center gap-1.5">
                        <Label className="text-xs text-muted-foreground">Ordre</Label>
                        <Input
                          type="number"
                          min={0}
                          value={homeDisplayOrder}
                          onChange={(e) => setHomeDisplayOrder(parseInt(e.target.value) || 0)}
                          className="w-16 h-7 text-sm"
                        />
                      </div>
                    )}
                    <Switch checked={featuredOnHome} onCheckedChange={setFeaturedOnHome} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: Inclus */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "inclus" && (
          <div className="space-y-6">
            {/* Ce qui est inclus */}
            <Card>
              <CardHeader>
                <CardTitle>Ce qui est inclus</CardTitle>
                <CardDescription>Listez tout ce qui est compris dans le prix</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newInclude}
                    onChange={(e) => setNewInclude(e.target.value)}
                    placeholder="Ex: Transport aller-retour depuis Tel Aviv"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addToList(setIncludes, newInclude, () => setNewInclude(""), "inc");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addToList(setIncludes, newInclude, () => setNewInclude(""), "inc")}
                    disabled={!newInclude.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {includes.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className="text-green-600 shrink-0">✓</span>
                      <Input
                        value={item.text}
                        onChange={(e) => updateListItem(setIncludes, item.id, e.target.value)}
                        className="flex-1 h-8 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeFromList(setIncludes, item.id)}
                        className="text-destructive hover:text-destructive/80 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {includes.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">Aucun élément. Ajoutez ce qui est inclus dans le prix.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ce qui n'est pas inclus */}
            <Card>
              <CardHeader>
                <CardTitle>Ce qui n'est pas inclus</CardTitle>
                <CardDescription>Listez ce qui est à la charge du participant</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newNotInclude}
                    onChange={(e) => setNewNotInclude(e.target.value)}
                    placeholder="Ex: Repas du midi"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addToList(setNotIncludes, newNotInclude, () => setNewNotInclude(""), "ninc");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addToList(setNotIncludes, newNotInclude, () => setNewNotInclude(""), "ninc")}
                    disabled={!newNotInclude.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {notIncludes.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className="text-destructive shrink-0">✗</span>
                      <Input
                        value={item.text}
                        onChange={(e) => updateListItem(setNotIncludes, item.id, e.target.value)}
                        className="flex-1 h-8 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeFromList(setNotIncludes, item.id)}
                        className="text-destructive hover:text-destructive/80 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {notIncludes.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">Aucun élément.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bon à savoir */}
            <Card>
              <CardHeader>
                <CardTitle>Bon à savoir</CardTitle>
                <CardDescription>Informations utiles pour les participants</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={newGoodToKnow}
                    onChange={(e) => setNewGoodToKnow(e.target.value)}
                    placeholder="Ex: Prévoir des chaussures confortables"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addToList(setGoodToKnow, newGoodToKnow, () => setNewGoodToKnow(""), "gtk");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addToList(setGoodToKnow, newGoodToKnow, () => setNewGoodToKnow(""), "gtk")}
                    disabled={!newGoodToKnow.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {goodToKnow.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className="text-blue-500 shrink-0">ℹ</span>
                      <Input
                        value={item.text}
                        onChange={(e) => updateListItem(setGoodToKnow, item.id, e.target.value)}
                        className="flex-1 h-8 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeFromList(setGoodToKnow, item.id)}
                        className="text-destructive hover:text-destructive/80 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {goodToKnow.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">Aucun élément.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: Tarification */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "tarification" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Prix de l'expérience
                </CardTitle>
                <CardDescription>Définissez le tarif de base et la devise</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Prix & devise */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="base_price">
                      Prix de base <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="base_price"
                        type="number"
                        min="0"
                        step="0.01"
                        {...register("base_price", { valueAsNumber: true })}
                        placeholder="0"
                        disabled={isSaving}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {currencySymbol}
                      </span>
                    </div>
                    {errors.base_price && <p className="text-destructive text-xs">{errors.base_price.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Type de tarification</Label>
                    <Controller
                      name="base_price_type"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="per_person">Par personne</SelectItem>
                            <SelectItem value="fixed">Forfait (prix fixe)</SelectItem>
                            <SelectItem value="per_person_per_night">Par personne / nuit</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Devise</Label>
                    <Controller
                      name="currency"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange} disabled={isSaving}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ILS">₪ Shekel (ILS)</SelectItem>
                            <SelectItem value="USD">$ Dollar (USD)</SelectItem>
                            <SelectItem value="EUR">€ Euro (EUR)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {/* Simulation rapide */}
                {(basePrice ?? 0) > 0 && (
                  <div className="rounded-lg bg-muted/40 border p-4 space-y-2">
                    <p className="text-sm font-medium">Aperçu du prix</p>
                    {basePriceType === "per_person" && (
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Pour {minParty} personne{minParty > 1 ? "s" : ""} (min)</span>
                          <span className="font-medium text-foreground">{currencySymbol}{((basePrice ?? 0) * minParty).toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pour {maxParty} personne{maxParty > 1 ? "s" : ""} (max)</span>
                          <span className="font-medium text-foreground">{currencySymbol}{((basePrice ?? 0) * maxParty).toFixed(0)}</span>
                        </div>
                      </div>
                    )}
                    {basePriceType === "fixed" && (
                      <p className="text-sm">
                        Prix forfaitaire : <span className="font-semibold">{currencySymbol}{(basePrice ?? 0).toFixed(0)}</span> (quel que soit le groupe)
                      </p>
                    )}
                    {basePriceType === "per_person_per_night" && (
                      <p className="text-sm">
                        <span className="font-semibold">{currencySymbol}{(basePrice ?? 0).toFixed(0)}</span> / personne / nuit
                      </p>
                    )}
                  </div>
                )}

                <Separator />

                {/* Participants */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="min_party">Participants min</Label>
                    <Input
                      id="min_party"
                      type="number"
                      min={1}
                      max={100}
                      {...register("min_party", { valueAsNumber: true })}
                      disabled={isSaving}
                    />
                    {errors.min_party && <p className="text-destructive text-xs">{errors.min_party.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_party">Participants max</Label>
                    <Input
                      id="max_party"
                      type="number"
                      min={1}
                      max={100}
                      {...register("max_party", { valueAsNumber: true })}
                      disabled={isSaving}
                    />
                    {errors.max_party && <p className="text-destructive text-xs">{errors.max_party.message}</p>}
                  </div>
                </div>

                {/* Délai de réservation */}
                <div className="space-y-2">
                  <Label htmlFor="lead_time_days">Délai minimum avant réservation (jours)</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="lead_time_days"
                      type="number"
                      min={0}
                      max={365}
                      {...register("lead_time_days", { valueAsNumber: true })}
                      disabled={isSaving}
                      className="w-32"
                    />
                    <p className="text-sm text-muted-foreground">
                      Les clients devront réserver au moins {watch("lead_time_days") ?? 0} jour{(watch("lead_time_days") ?? 0) > 1 ? "s" : ""} à l'avance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: Things to Know */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "things" && (
          <div className="space-y-6">
            {/* Conditions d'annulation */}
            <Card>
              <CardHeader>
                <CardTitle>Conditions d'annulation</CardTitle>
                <CardDescription>Politique d'annulation de l'expérience (3 langues)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <Label className="flex items-center gap-1.5 mb-1">
                      <span>🇬🇧</span> Politique d'annulation (EN)
                    </Label>
                    <Input {...register("cancellation_policy")} disabled={isSaving} />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1.5 mb-1">
                      <span>🇫🇷</span> Politique d'annulation (FR)
                    </Label>
                    <Input {...register("cancellation_policy_fr")} disabled={isSaving} />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1.5 mb-1">
                      <span>🇮🇱</span> Politique d'annulation (HE)
                    </Label>
                    <Input {...register("cancellation_policy_he")} dir="rtl" className="bg-hebrew-input" disabled={isSaving} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Localisation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Localisation
                </CardTitle>
                <CardDescription>Adresse et informations géographiques de l'expérience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-1.5">
                      <span>🇬🇧</span> Adresse (EN)
                    </Label>
                    <Input
                      id="address"
                      {...register("address")}
                      placeholder="Ex: 12 Rothschild Blvd, Tel Aviv"
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_he" className="flex items-center gap-1.5">
                      <span>🇮🇱</span> כתובת (HE)
                    </Label>
                    <Input
                      id="address_he"
                      {...register("address_he")}
                      placeholder="כתובת בעברית"
                      dir="rtl"
                      className="bg-hebrew-input"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="google_maps_link">Lien Google Maps</Label>
                  <Input
                    id="google_maps_link"
                    {...register("google_maps_link")}
                    placeholder="https://maps.google.com/..."
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region_type">Région / Zone</Label>
                  <Input
                    id="region_type"
                    {...register("region_type")}
                    placeholder="Ex: Tel Aviv, Galilee, Dead Sea..."
                    disabled={isSaving}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Durée */}
            <Card>
              <CardHeader>
                <CardTitle>Durée de l'expérience</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="flex items-center gap-1.5">
                      <span>🇬🇧</span> Duration (EN)
                    </Label>
                    <Input
                      id="duration"
                      {...register("duration")}
                      placeholder="Ex: 3 hours"
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration_fr" className="flex items-center gap-1.5">
                      <span>🇫🇷</span> Durée (FR)
                    </Label>
                    <Input
                      id="duration_fr"
                      {...register("duration_fr")}
                      placeholder="Ex: 3 heures"
                      disabled={isSaving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration_he" className="flex items-center gap-1.5">
                      <span>🇮🇱</span> משך (HE)
                    </Label>
                    <Input
                      id="duration_he"
                      {...register("duration_he")}
                      placeholder="Ex: 3 שעות"
                      dir="rtl"
                      className="bg-hebrew-input"
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accessibilité */}
            <Card>
              <CardHeader>
                <CardTitle>Accessibilité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="accessibility_info">Informations d'accessibilité</Label>
                  <Textarea
                    id="accessibility_info"
                    {...register("accessibility_info")}
                    placeholder="Ex: Accessible en fauteuil roulant. Terrain plat."
                    rows={3}
                    disabled={isSaving}
                  />
                </div>
              </CardContent>
            </Card>

            {/* SEO */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle>SEO Configuration</CardTitle>
                <CardDescription>Configure SEO metadata for search engines and social media</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  {/* EN */}
                  <div className="space-y-4">
                    <div className="bg-background p-2 rounded flex items-center gap-1.5">
                      <span>🇬🇧</span>
                      <h4 className="font-medium text-sm">English SEO</h4>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seo_title_en">SEO Title</Label>
                      <Input id="seo_title_en" {...register("seo_title_en")} placeholder="Browser tab & Google" />
                      <p className="text-xs text-muted-foreground">Max ~60 chars</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meta_description_en">Meta Description</Label>
                      <Textarea id="meta_description_en" {...register("meta_description_en")} placeholder="Google results" rows={3} />
                      <p className="text-xs text-muted-foreground">Max ~155 chars</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="og_title_en">OG Title</Label>
                      <Input id="og_title_en" {...register("og_title_en")} placeholder="Social media title" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="og_description_en">OG Description</Label>
                      <Textarea id="og_description_en" {...register("og_description_en")} placeholder="Social media description" rows={3} />
                    </div>
                  </div>

                  {/* HE */}
                  <div className="space-y-4">
                    <div className="bg-background p-2 rounded flex items-center gap-1.5">
                      <span>🇮🇱</span>
                      <h4 className="font-medium text-sm">Hebrew SEO (עברית)</h4>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seo_title_he">כותרת SEO</Label>
                      <Input id="seo_title_he" {...register("seo_title_he")} placeholder="כותרת עבור גוגל" dir="rtl" className="bg-hebrew-input" />
                      <p className="text-xs text-muted-foreground">Max ~60 chars</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meta_description_he">תיאור Meta</Label>
                      <Textarea id="meta_description_he" {...register("meta_description_he")} placeholder="תיאור עבור גוגל" rows={3} dir="rtl" className="bg-hebrew-input" />
                      <p className="text-xs text-muted-foreground">Max ~155 chars</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="og_title_he">כותרת OG</Label>
                      <Input id="og_title_he" {...register("og_title_he")} placeholder="כותרת עבור רשתות חברתיות" dir="rtl" className="bg-hebrew-input" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="og_description_he">תיאור OG</Label>
                      <Textarea id="og_description_he" {...register("og_description_he")} placeholder="תיאור עבור רשתות חברתיות" rows={3} dir="rtl" className="bg-hebrew-input" />
                    </div>
                  </div>

                  {/* FR */}
                  <div className="space-y-4">
                    <div className="bg-background p-2 rounded flex items-center gap-1.5">
                      <span>🇫🇷</span>
                      <h4 className="font-medium text-sm">French SEO</h4>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seo_title_fr">Titre SEO</Label>
                      <Input id="seo_title_fr" {...register("seo_title_fr")} placeholder="Titre pour Google" />
                      <p className="text-xs text-muted-foreground">Max ~60 chars</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="meta_description_fr">Description Meta</Label>
                      <Textarea id="meta_description_fr" {...register("meta_description_fr")} placeholder="Description Google" rows={3} />
                      <p className="text-xs text-muted-foreground">Max ~155 chars</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="og_title_fr">Titre OG</Label>
                      <Input id="og_title_fr" {...register("og_title_fr")} placeholder="Réseaux sociaux" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="og_description_fr">Description OG</Label>
                      <Textarea id="og_description_fr" {...register("og_description_fr")} placeholder="Description réseaux sociaux" rows={3} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="og_image">Open Graph Image</Label>
                  <Input id="og_image" {...register("og_image")} placeholder="Image URL for social media sharing" />
                  <p className="text-xs text-muted-foreground">Recommended: 1200x630px. Leave empty to use hero image.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </form>

      {/* Sticky bottom save bar (mobile) */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t p-3 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleSubmit(handleSaveDraft, onInvalidSubmit)}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            Brouillon
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={handleSubmit(handlePublish, onInvalidSubmit)}
            disabled={!canPublish || isSaving}
          >
            <Rocket className="h-4 w-4 mr-2" />
            Publier
          </Button>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette expérience ?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Cette action est irréversible. Tapez le nom de l'expérience pour confirmer :</p>
              <p className="font-mono text-sm font-bold text-foreground">{title}</p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Tapez le nom ici..."
                className="mt-2"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteConfirmText !== title}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
