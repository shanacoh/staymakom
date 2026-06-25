import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
  Save, Rocket, X, Upload, Loader2, ArrowLeft, Plus, Star, Clock,
  MapPin, DollarSign, Check, Tag, Car, Utensils, Dumbbell, Waves, Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { generateSlug } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  type PracticalBadgesInfo,
  type TriState,
  defaultPracticalBadgesInfo,
  normalizeLegacyPracticalInfo,
  getAutoBadgesFromPracticalInfo,
  getPracticalInfoCompleteness,
} from "@/lib/standaloneBadges";
import { HighlightTagsSelectorStandalone, type LocalTagEntry } from "@/components/admin/HighlightTagsSelectorStandalone";
import IncludesManagerStandalone, { type LocalIncludeEntry } from "@/components/admin/IncludesManagerStandalone";
import StandaloneExtrasManager, { type LocalExtraEntry } from "@/components/admin/StandaloneExtrasManager";

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

const TABS = [
  { id: "medias", label: "Médias" },
  { id: "contenu", label: "Contenu" },
  { id: "pratique", label: "Infos pratiques" },
  { id: "tarif_dispo", label: "Tarif & Dispo" },
  { id: "seo", label: "SEO" },
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
  // Tarification
  supplier_price_adult: z.number().min(0).default(0),
  supplier_price_child: z.number().min(0).default(0),
  has_child_price: z.boolean().default(false),
  markup_percent: z.number().min(0).max(100).default(0),
  supplier_booking_url: z.string().optional(),
  base_price_type: z.enum(["per_person", "fixed", "per_person_per_night"]).default("per_person"),
  currency: z.enum(["USD", "EUR", "ILS"]).default("ILS"),
  lead_time_days: optNum(0),
  has_time_slots: z.boolean().default(false),
  // Localisation
  address: z.string().optional(),
  address_he: z.string().optional(),
  address_fr: z.string().optional(),
  google_maps_link: z.string().optional(),
  city: z.string().optional(),
  city_he: z.string().optional(),
  city_fr: z.string().optional(),
  region: z.string().optional(),
  region_he: z.string().optional(),
  region_fr: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
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
// Types
// ---------------------------------------------------------------------------

interface SimpleListItem {
  id: string;
  text: string;
}

// Jours de semaine pour la disponibilité (1=Lundi … 7=Dimanche)
const WEEKDAYS = [
  { id: 1, label: "L", full: "Lundi" },
  { id: 2, label: "M", full: "Mardi" },
  { id: 3, label: "M", full: "Mercredi" },
  { id: 4, label: "J", full: "Jeudi" },
  { id: 5, label: "V", full: "Vendredi" },
  { id: 6, label: "S", full: "Samedi" },
  { id: 7, label: "D", full: "Dimanche" },
];

const ALL_DAYS = WEEKDAYS.map((d) => d.id);

function CompletionPill() {
  return (
    <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
      à compléter
    </span>
  );
}

function PracticalTriStateField({
  id,
  icon: Icon,
  label,
  value,
  onChange,
}: {
  id: string;
  icon: LucideIcon;
  label: string;
  value: TriState;
  onChange: (v: TriState) => void;
}) {
  return (
    <div className="p-3 rounded-lg border space-y-2">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm flex-1">{label}</span>
        {value === null && <CompletionPill />}
      </div>
      <RadioGroup
        value={value ?? undefined}
        onValueChange={(v) => onChange(v as TriState)}
        className="flex gap-4 ml-7"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="yes" id={`${id}-yes`} />
          <Label htmlFor={`${id}-yes`} className="text-sm font-normal cursor-pointer">Oui</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="no" id={`${id}-no`} />
          <Label htmlFor={`${id}-no`} className="text-sm font-normal cursor-pointer">Non</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="not_relevant" id={`${id}-nr`} />
          <Label htmlFor={`${id}-nr`} className="text-sm font-normal cursor-pointer">Non pertinent</Label>
        </div>
      </RadioGroup>
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState<TabId>("medias");
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Auto-save
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSaveFnRef = useRef<() => void>(() => {});

  // Time slots state
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [newSlot, setNewSlot] = useState<string>("");

  // Featured on home
  const [featuredOnHome, setFeaturedOnHome] = useState(false);
  const [homeDisplayOrder, setHomeDisplayOrder] = useState(0);

  // Includes lists
  const [includes, setIncludes] = useState<SimpleListItem[]>([]);
  const [notIncludes, setNotIncludes] = useState<SimpleListItem[]>([]);
  const [goodToKnow, setGoodToKnow] = useState<SimpleListItem[]>([]);
  const [newInclude, setNewInclude] = useState("");
  const [newNotInclude, setNewNotInclude] = useState("");
  const [newGoodToKnow, setNewGoodToKnow] = useState("");

  // Highlight tags (badges)
  const [highlightTags, setHighlightTags] = useState<SimpleListItem[]>([]);
  const [newHighlightTag, setNewHighlightTag] = useState("");

  // Multi-categories
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Informations clés → badges (kosher, enfants, parking, fitness, spa)
  const [practicalInfo, setPracticalInfo] = useState<PracticalBadgesInfo>(defaultPracticalBadgesInfo);

  // Disponibilités
  const [availableDays, setAvailableDays] = useState<number[]>(ALL_DAYS);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [availabilityEndDate, setAvailabilityEndDate] = useState<string | null>(null);
  const [availabilityMode, setAvailabilityMode] = useState<"blacklist" | "whitelist">("blacklist");
  const [whitelistedDates, setWhitelistedDates] = useState<Date[]>([]);

  const defaultEndDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split("T")[0];
  }, []);
  const effectiveEndDate = availabilityEndDate ?? defaultEndDate;

  const toLocalIso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const lastAvailableDate = useMemo(() => {
    if (availabilityMode === "whitelist") {
      if (whitelistedDates.length === 0) return null;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const future = whitelistedDates
        .filter((d) => d >= today)
        .sort((a, b) => b.getTime() - a.getTime());
      return future.length > 0 ? toLocalIso(future[0]) : null;
    }
    const end = new Date(effectiveEndDate + "T00:00:00");
    const blockedSet = new Set(blockedDates.map((d) => toLocalIso(d)));
    const jsDays = availableDays.map((d) => (d === 7 ? 0 : d));
    const cursor = new Date(end);
    for (let i = 0; i < 365; i++) {
      const iso = toLocalIso(cursor);
      if (jsDays.includes(cursor.getDay()) && !blockedSet.has(iso)) return iso;
      cursor.setDate(cursor.getDate() - 1);
    }
    return null;
  }, [effectiveEndDate, availableDays, blockedDates, availabilityMode, whitelistedDates]);

  const daysRemaining = lastAvailableDate
    ? Math.ceil((new Date(lastAvailableDate + "T12:00:00").getTime() - Date.now()) / 86400000)
    : 0;

  const remainingDatesCount = useMemo(() => {
    if (availabilityMode === "whitelist") {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return whitelistedDates.filter((d) => d >= today).length;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(effectiveEndDate + "T00:00:00");
    const blockedSet = new Set(blockedDates.map((d) => toLocalIso(d)));
    const jsDays = availableDays.map((d) => (d === 7 ? 0 : d));
    let count = 0;
    const cursor = new Date(today);
    while (cursor <= end) {
      const iso = toLocalIso(cursor);
      if (jsDays.includes(cursor.getDay()) && !blockedSet.has(iso)) count++;
      cursor.setDate(cursor.getDate() + 1);
    }
    return count;
  }, [effectiveEndDate, availableDays, blockedDates, availabilityMode, whitelistedDates]);

  // Local mode — badges / inclus / extras (actifs avant le premier save, puis le composant bascule en mode DB)
  const [localTags, setLocalTags] = useState<LocalTagEntry[]>([]);
  const [localStandaloneIncludes, setLocalStandaloneIncludes] = useState<LocalIncludeEntry[]>([]);
  const [localStandaloneExtras, setLocalStandaloneExtras] = useState<LocalExtraEntry[]>([]);

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
      supplier_price_adult: 0,
      supplier_price_child: 0,
      has_child_price: false,
      markup_percent: 0,
      supplier_booking_url: "",
      base_price_type: "per_person",
      currency: "ILS",
      lead_time_days: 0,
      has_time_slots: false,
      address: "",
      address_he: "",
      address_fr: "",
      google_maps_link: "",
      city: "",
      city_he: "",
      city_fr: "",
      region: "",
      region_he: "",
      region_fr: "",
      latitude: undefined,
      longitude: undefined,
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
  const hasTimeSlots = watch("has_time_slots");
  const currency = watch("currency");
  const supplierPriceAdult = watch("supplier_price_adult") ?? 0;
  const supplierPriceChild = watch("supplier_price_child") ?? 0;
  const hasChildPrice = watch("has_child_price");
  const markupPercent = watch("markup_percent") ?? 0;

  // Derived computed prices
  const computedAdultPrice = Math.round(supplierPriceAdult * (1 + markupPercent / 100));
  const computedChildPrice = Math.round(supplierPriceChild * (1 + markupPercent / 100));
  const margeUnitaireAdult = Math.round(supplierPriceAdult * markupPercent / 100);

  const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : "₪";

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
        highlightTags,
        selectedCategoryIds,
        practicalInfo,
        availableDays,
        blockedDates: blockedDates.map((d) => d.toISOString().split("T")[0]),
        featuredOnHome,
        homeDisplayOrder,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(autoSaveKey, JSON.stringify(payload));
      setLastAutoSave(new Date());
    } catch {
      // silent fail
    }
  }, [getValues, heroImagePreview, galleryPreviews, timeSlots, includes, notIncludes, goodToKnow, highlightTags, selectedCategoryIds, practicalInfo, availableDays, blockedDates, featuredOnHome, homeDisplayOrder, autoSaveKey]);

  autoSaveFnRef.current = doAutoSave;

  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => autoSaveFnRef.current(), 30000);
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, []);

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
    // Pricing — fallback to base_price for existing records without supplier_price_adult
    setValue("supplier_price_adult", exp.supplier_price_adult ?? exp.base_price ?? 0);
    setValue("supplier_price_child", exp.supplier_price_child ?? 0);
    setValue("has_child_price", exp.has_child_price ?? false);
    setValue("markup_percent", exp.markup_percent ?? 0);
    setValue("supplier_booking_url", exp.supplier_booking_url || "");
    setValue("base_price_type", exp.base_price_type || "per_person");
    setValue("currency", exp.currency || "ILS");
    setValue("lead_time_days", exp.lead_time_days ?? 0);
    setValue("has_time_slots", exp.has_time_slots ?? false);
    setValue("address", exp.address || "");
    setValue("address_he", exp.address_he || "");
    setValue("address_fr", exp.address_fr || "");
    setValue("google_maps_link", exp.google_maps_link || "");
    setValue("city", exp.city || "");
    setValue("city_he", exp.city_he || "");
    setValue("city_fr", exp.city_fr || "");
    setValue("region", exp.region || exp.region_type || "");
    setValue("region_he", exp.region_he || "");
    setValue("region_fr", exp.region_fr || "");
    setValue("latitude", exp.latitude ?? undefined);
    setValue("longitude", exp.longitude ?? undefined);
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

    if (Array.isArray(exp.includes)) {
      setIncludes(exp.includes.map((t: string, i: number) => ({ id: `inc-${i}`, text: t })));
    }
    if (Array.isArray(exp.not_includes)) {
      setNotIncludes(exp.not_includes.map((t: string, i: number) => ({ id: `ninc-${i}`, text: t })));
    }
    if (Array.isArray(exp.good_to_know)) {
      setGoodToKnow(exp.good_to_know.map((t: string, i: number) => ({ id: `gtk-${i}`, text: t })));
    }
    if (Array.isArray(exp.highlight_tags)) {
      setHighlightTags(exp.highlight_tags.map((t: string, i: number) => ({ id: `ht-${i}`, text: t })));
    }
    // Multi-categories: restore from category_ids, fallback to category_id
    if (Array.isArray(exp.category_ids) && exp.category_ids.length > 0) {
      setSelectedCategoryIds(exp.category_ids);
    } else if (exp.category_id) {
      setSelectedCategoryIds([exp.category_id]);
    }
    if (exp.practical_info && typeof exp.practical_info === "object") {
      setPracticalInfo(normalizeLegacyPracticalInfo(exp.practical_info));
    }
    if (Array.isArray(exp.available_days) && exp.available_days.length > 0) {
      setAvailableDays(exp.available_days);
    }
    if (Array.isArray(exp.blocked_dates)) {
      setBlockedDates(exp.blocked_dates.map((s: string) => new Date(s + "T12:00:00")));
    }
    if (exp.availability_end_date) {
      setAvailabilityEndDate(exp.availability_end_date);
    }
    if (exp.availability_mode === "whitelist") {
      setAvailabilityMode("whitelist");
    }
    if (Array.isArray(exp.whitelisted_dates)) {
      setWhitelistedDates(exp.whitelisted_dates.map((s: string) => new Date(s + "T12:00:00")));
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
  // Géocodage (même fonction Supabase que les hôtels, générique)
  // -------------------------------------------------------------------------

  const handleGeocode = async () => {
    const address = getValues("address");
    const city = getValues("city");
    const region = getValues("region");
    const addressToGeocode = address || [city, region].filter(Boolean).join(", ");
    if (!addressToGeocode.trim()) {
      toast.error("Renseignez une adresse, une ville ou une région d'abord");
      return;
    }
    setIsGeocoding(true);
    try {
      const { data, error } = await supabase.functions.invoke("geocode-hotel", {
        body: { address: addressToGeocode },
      });
      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }
      setValue("latitude", data.latitude);
      setValue("longitude", data.longitude);
      toast.success(`Position trouvée : ${data.displayName}`);
    } catch (err) {
      console.error("Geocoding error:", err);
      toast.error("Impossible de trouver la position. Essayez une adresse plus précise.");
    } finally {
      setIsGeocoding(false);
    }
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
  // Category multi-select helper
  // -------------------------------------------------------------------------

  const toggleCategory = (catId: string) => {
    setSelectedCategoryIds((prev) => {
      const updated = prev.includes(catId)
        ? prev.filter((id) => id !== catId)
        : [...prev, catId];
      setValue("category_id", updated[0] || "", { shouldValidate: true });
      return updated;
    });
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

    // base_price = prix client calculé depuis fournisseur + markup
    const computedBasePrice =
      Math.round(data.supplier_price_adult * (1 + data.markup_percent / 100) * 100) / 100;

    return {
      title: data.title,
      title_fr: data.title_fr || null,
      title_he: data.title_he || null,
      subtitle: data.subtitle || null,
      subtitle_fr: data.subtitle_fr || null,
      subtitle_he: data.subtitle_he || null,
      category_id: selectedCategoryIds[0] || data.category_id || null,
      category_ids: selectedCategoryIds,
      long_copy: data.long_copy || null,
      long_copy_fr: data.long_copy_fr || null,
      long_copy_he: data.long_copy_he || null,
      min_party: data.min_party,
      max_party: data.max_party,
      cancellation_policy: data.cancellation_policy || null,
      cancellation_policy_fr: data.cancellation_policy_fr || null,
      cancellation_policy_he: data.cancellation_policy_he || null,
      supplier_price_adult: data.supplier_price_adult,
      supplier_price_child: data.has_child_price ? data.supplier_price_child : null,
      has_child_price: data.has_child_price,
      markup_percent: data.markup_percent,
      supplier_booking_url: data.supplier_booking_url || null,
      base_price: computedBasePrice,
      base_price_type: data.base_price_type,
      currency: data.currency,
      lead_time_days: data.lead_time_days ?? 0,
      has_time_slots: data.has_time_slots,
      time_slots: data.has_time_slots ? timeSlots : [],
      address: data.address || null,
      address_he: data.address_he || null,
      address_fr: data.address_fr || null,
      google_maps_link: data.google_maps_link || null,
      city: data.city || null,
      city_he: data.city_he || null,
      city_fr: data.city_fr || null,
      region: data.region || null,
      region_he: data.region_he || null,
      region_fr: data.region_fr || null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
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
      includes: includes.map((i) => i.text),
      not_includes: notIncludes.map((i) => i.text),
      good_to_know: goodToKnow.map((i) => i.text),
      highlight_tags: highlightTags.map((t) => t.text),
      practical_info: practicalInfo,
      available_days: availableDays,
      blocked_dates: blockedDates.map((d) => d.toISOString().split("T")[0]),
      availability_end_date: effectiveEndDate,
      availability_mode: availabilityMode,
      whitelisted_dates: whitelistedDates.map((d) => d.toISOString().split("T")[0]),
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
        if (localTags.length > 0) {
          await (supabase as any)
            .from("standalone_experience_highlight_tags")
            .insert(localTags.map((t, i) => ({ experience_id: insertedData.id, tag_id: t.tag_id, position: i })));
        }
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
        if (localTags.length > 0) {
          await (supabase as any)
            .from("standalone_experience_highlight_tags")
            .insert(localTags.map((t, i) => ({ experience_id: insertedData.id, tag_id: t.tag_id, position: i })));
        }
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
      category_id: "Catégorie",
      long_copy: "Description (EN)",
      min_party: "Participants min",
      max_party: "Participants max",
      supplier_price_adult: "Prix adulte",
    };
    const errorFields = Object.keys(errs).map((field) => fieldNames[field] || field);
    if (errorFields.length > 0) toast.error(`Champs requis manquants : ${errorFields.join(", ")}`);

    const errorField = Object.keys(errs)[0];
    if (["title", "title_he", "subtitle", "category_id", "long_copy"].includes(errorField)) {
      setActiveTab("contenu");
    } else if (["min_party", "max_party", "supplier_price_adult"].includes(errorField)) {
      setActiveTab("tarif_dispo");
    }
  };

  const canPublish = !!title;

  // -------------------------------------------------------------------------
  // Tab completion indicators
  // -------------------------------------------------------------------------

  const getTabCompletion = (tabId: TabId): boolean => {
    switch (tabId) {
      case "medias":
        return !!(heroImagePreview || galleryPreviews.length > 0);
      case "contenu":
        return !!(title && selectedCategoryIds.length > 0 && (getValues("long_copy")?.length ?? 0) >= 100);
      case "pratique":
        return includes.length > 0;
      case "tarif_dispo":
        return supplierPriceAdult > 0;
      case "seo":
        return true;
    }
  };

  const getAutoSaveLabel = () => {
    if (!lastAutoSave) return null;
    const diff = Math.round((Date.now() - lastAutoSave.getTime()) / 60000);
    if (diff < 1) return "Auto-sauvegardé à l'instant";
    return `Auto-sauvegardé il y a ${diff} min`;
  };

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

  const practicalCompleteness = getPracticalInfoCompleteness(practicalInfo);
  const autoBadgesPreview = getAutoBadgesFromPracticalInfo(practicalInfo, "fr");

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
                    isComplete ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"
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
        {/* PAGE 1 : Médias */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "medias" && (
          <div className="space-y-6">
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
                  <p className="text-xs text-muted-foreground mb-2">Grande image affichée en haut de la fiche.</p>
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
                  <p className="text-xs text-muted-foreground mb-2">
                    Glisser les images pour les ajouter. 1600×900px recommandé, max 5MB par image.
                  </p>
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
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PAGE 2 : Contenu */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "contenu" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Titres & Description</CardTitle>
                <CardDescription>Contenu principal de la fiche expérience (EN + FR + HE)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="flex items-center gap-1.5">
                      <span>🇬🇧</span> Titre (EN) <span className="text-destructive">*</span>
                    </Label>
                    <Input id="title" {...register("title")} placeholder="Ex: Wine tasting in the Galilee" disabled={isSaving} />
                    {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title_fr" className="flex items-center gap-1.5">
                      <span>🇫🇷</span> Titre (FR)
                    </Label>
                    <Input id="title_fr" {...register("title_fr")} placeholder="Ex: Dégustation de vins en Galilée" disabled={isSaving} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title_he" className="flex items-center gap-1.5">
                      <span>🇮🇱</span> כותרת (HE)
                    </Label>
                    <Input id="title_he" {...register("title_he")} placeholder="כותרת בעברית" dir="rtl" className="bg-hebrew-input" disabled={isSaving} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="subtitle" className="flex items-center gap-1.5">
                      <span>🇬🇧</span> Sous-titre (EN)
                    </Label>
                    <Input id="subtitle" {...register("subtitle")} placeholder="Courte accroche" disabled={isSaving} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtitle_fr" className="flex items-center gap-1.5">
                      <span>🇫🇷</span> Sous-titre (FR)
                    </Label>
                    <Input id="subtitle_fr" {...register("subtitle_fr")} placeholder="Courte accroche en français" disabled={isSaving} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtitle_he" className="flex items-center gap-1.5">
                      <span>🇮🇱</span> תת-כותרת (HE)
                    </Label>
                    <Input id="subtitle_he" {...register("subtitle_he")} placeholder="תת-כותרת בעברית" dir="rtl" className="bg-hebrew-input" disabled={isSaving} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <span>🇬🇧</span> Description longue (EN) <span className="text-destructive">*</span>
                  </Label>
                  <Controller
                    name="long_copy"
                    control={control}
                    render={({ field }) => (
                      <RichTextEditor content={field.value || ""} onChange={field.onChange} placeholder="Description complète de l'expérience..." />
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
                      <RichTextEditor content={field.value || ""} onChange={field.onChange} placeholder="Description complète de l'expérience en français..." />
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
                      <RichTextEditor content={field.value || ""} onChange={field.onChange} placeholder="תיאור מלא של החוויה..." dir="rtl" />
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Catégories & Mise en avant */}
            <Card>
              <CardHeader>
                <CardTitle>Catégories & Mise en avant</CardTitle>
                <CardDescription>
                  Sélectionnez une ou plusieurs catégories — l'expérience apparaîtra dans chacune
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-3 block">
                    Catégories <span className="text-destructive">*</span>
                  </Label>
                  {selectedCategoryIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedCategoryIds.map((catId) => {
                        const cat = categories?.find((c) => c.id === catId);
                        return cat ? (
                          <Badge key={catId} variant="secondary" className="flex items-center gap-1 text-sm">
                            {cat.name}
                            <button
                              type="button"
                              onClick={() => toggleCategory(catId)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 rounded-lg border p-3 max-h-48 overflow-y-auto">
                    {categories?.map((cat) => (
                      <label
                        key={cat.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-2 py-1.5 rounded text-sm"
                      >
                        <Checkbox
                          checked={selectedCategoryIds.includes(cat.id)}
                          onCheckedChange={() => toggleCategory(cat.id)}
                        />
                        {cat.name}
                      </label>
                    ))}
                  </div>
                  {errors.category_id && (
                    <p className="text-destructive text-xs mt-1">{errors.category_id.message}</p>
                  )}
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
        {/* PAGE 3 : Infos pratiques */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "pratique" && (
          <div className="space-y-6">
            {/* Badges : points forts éditoriaux + informations clés (badges automatiques) */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Badges</CardTitle>
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    practicalCompleteness.answered === practicalCompleteness.total
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-amber-600 bg-amber-50"
                  )}>
                    {practicalCompleteness.answered}/{practicalCompleteness.total} informations clés répondues
                  </span>
                </div>
                <CardDescription>
                  Mettez en avant des points forts personnalisés, et répondez aux informations clés ci-dessous :
                  un badge apparaît automatiquement sur la fiche publique dès que la réponse le justifie.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <HighlightTagsSelectorStandalone
                  experienceId={currentExperienceId}
                  localTags={localTags}
                  onLocalTagsChange={setLocalTags}
                />

                <Separator />

                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Informations clés</p>

                  <PracticalTriStateField
                    id="kosher"
                    icon={Utensils}
                    label="Kosher"
                    value={practicalInfo.kosher}
                    onChange={(v) => setPracticalInfo((prev) => ({ ...prev, kosher: v }))}
                  />

                  {/* Enfants */}
                  <div className="p-3 rounded-lg border space-y-2">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm flex-1">Enfants</span>
                      {practicalInfo.kids.status === null && <CompletionPill />}
                    </div>
                    <RadioGroup
                      value={practicalInfo.kids.status ?? undefined}
                      onValueChange={(v) =>
                        setPracticalInfo((prev) => ({
                          ...prev,
                          kids: { status: v as "yes" | "no", from_age: v === "yes" ? prev.kids.from_age : null },
                        }))
                      }
                      className="flex gap-4 ml-7"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="yes" id="kids-yes" />
                        <Label htmlFor="kids-yes" className="text-sm font-normal cursor-pointer">Oui</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="no" id="kids-no" />
                        <Label htmlFor="kids-no" className="text-sm font-normal cursor-pointer">Non</Label>
                      </div>
                    </RadioGroup>
                    {practicalInfo.kids.status === "yes" && (
                      <div className="ml-7 flex items-center gap-2">
                        <Label className="text-sm text-muted-foreground shrink-0">À partir de :</Label>
                        <Input
                          type="number"
                          min={0}
                          value={practicalInfo.kids.from_age ?? ""}
                          onChange={(e) =>
                            setPracticalInfo((prev) => ({
                              ...prev,
                              kids: { ...prev.kids, from_age: e.target.value ? parseInt(e.target.value) : null },
                            }))
                          }
                          placeholder="Âge"
                          className="h-8 text-sm w-24"
                        />
                        <span className="text-sm text-muted-foreground">ans (badge "KIDS from X")</span>
                      </div>
                    )}
                  </div>

                  {/* Parking */}
                  <div className="p-3 rounded-lg border space-y-2">
                    <div className="flex items-center gap-3">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm flex-1">Parking</span>
                      {practicalInfo.parking.status === null && <CompletionPill />}
                    </div>
                    <RadioGroup
                      value={practicalInfo.parking.status ?? undefined}
                      onValueChange={(v) =>
                        setPracticalInfo((prev) => ({
                          ...prev,
                          parking: {
                            status: v as "yes" | "no",
                            price_type: v === "yes" ? prev.parking.price_type : null,
                            price_amount: v === "yes" ? prev.parking.price_amount : null,
                          },
                        }))
                      }
                      className="flex gap-4 ml-7"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="yes" id="parking-yes" />
                        <Label htmlFor="parking-yes" className="text-sm font-normal cursor-pointer">Oui</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="no" id="parking-no" />
                        <Label htmlFor="parking-no" className="text-sm font-normal cursor-pointer">Non</Label>
                      </div>
                    </RadioGroup>
                    {practicalInfo.parking.status === "yes" && (
                      <div className="ml-7 space-y-2">
                        <RadioGroup
                          value={practicalInfo.parking.price_type ?? undefined}
                          onValueChange={(v) =>
                            setPracticalInfo((prev) => ({ ...prev, parking: { ...prev.parking, price_type: v as "free" | "paid" } }))
                          }
                          className="flex gap-4"
                        >
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="free" id="parking-free" />
                            <Label htmlFor="parking-free" className="text-sm font-normal cursor-pointer">Gratuit</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="paid" id="parking-paid" />
                            <Label htmlFor="parking-paid" className="text-sm font-normal cursor-pointer">Payant</Label>
                          </div>
                        </RadioGroup>
                        {practicalInfo.parking.price_type === "paid" && (
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-muted-foreground shrink-0">Montant :</Label>
                            <Input
                              value={practicalInfo.parking.price_amount ?? ""}
                              onChange={(e) =>
                                setPracticalInfo((prev) => ({ ...prev, parking: { ...prev.parking, price_amount: e.target.value } }))
                              }
                              placeholder="Ex: 20₪ par jour"
                              className="h-8 text-sm"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <PracticalTriStateField
                    id="fitness"
                    icon={Dumbbell}
                    label="Centre fitness"
                    value={practicalInfo.fitness}
                    onChange={(v) => setPracticalInfo((prev) => ({ ...prev, fitness: v }))}
                  />

                  <PracticalTriStateField
                    id="spa"
                    icon={Waves}
                    label="Spa"
                    value={practicalInfo.spa}
                    onChange={(v) => setPracticalInfo((prev) => ({ ...prev, spa: v }))}
                  />
                </div>

                {autoBadgesPreview.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Aperçu des badges générés automatiquement sur la fiche publique :</p>
                    <div className="flex flex-wrap gap-2">
                      {autoBadgesPreview.map((b) => (
                        <Badge key={b.key} variant="secondary">{b.label}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ce qui est inclus */}
            <Card>
              <CardHeader>
                <CardTitle>Ce qui est inclus</CardTitle>
                <CardDescription>Listez tout ce qui est compris dans le prix (avec photo et traduction HE)</CardDescription>
              </CardHeader>
              <CardContent>
                <IncludesManagerStandalone
                  experienceId={currentExperienceId}
                  localIncludes={localStandaloneIncludes}
                  onLocalIncludesChange={setLocalStandaloneIncludes}
                />
              </CardContent>
            </Card>

            {/* Extras (options payantes) */}
            <Card>
              <CardHeader>
                <CardTitle>Extras (options payantes)</CardTitle>
                <CardDescription>Options supplémentaires que le client peut ajouter à sa réservation</CardDescription>
              </CardHeader>
              <CardContent>
                <StandaloneExtrasManager
                  experienceId={currentExperienceId}
                  localExtras={localStandaloneExtras}
                  onLocalExtrasChange={setLocalStandaloneExtras}
                />
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
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="flex items-center gap-1.5">
                      <span>🇬🇧</span> Ville (EN)
                    </Label>
                    <Input id="city" {...register("city")} placeholder="Ex: Tel Aviv" disabled={isSaving} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city_fr" className="flex items-center gap-1.5">
                      <span>🇫🇷</span> Ville (FR)
                    </Label>
                    <Input id="city_fr" {...register("city_fr")} placeholder="Ex: Tel Aviv" disabled={isSaving} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city_he" className="flex items-center gap-1.5">
                      <span>🇮🇱</span> עיר (HE)
                    </Label>
                    <Input id="city_he" {...register("city_he")} placeholder="תל אביב" dir="rtl" className="bg-hebrew-input" disabled={isSaving} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="region" className="flex items-center gap-1.5">
                      <span>🇬🇧</span> Région (EN)
                    </Label>
                    <Input id="region" {...register("region")} placeholder="Ex: Tel Aviv, Galilee, Dead Sea..." disabled={isSaving} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region_fr" className="flex items-center gap-1.5">
                      <span>🇫🇷</span> Région (FR)
                    </Label>
                    <Input id="region_fr" {...register("region_fr")} placeholder="Ex: Galilée, Mer Morte..." disabled={isSaving} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region_he" className="flex items-center gap-1.5">
                      <span>🇮🇱</span> אזור (HE)
                    </Label>
                    <Input id="region_he" {...register("region_he")} placeholder="אזור" dir="rtl" className="bg-hebrew-input" disabled={isSaving} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address" className="flex items-center gap-1.5">
                      <span>🇬🇧</span> Adresse (EN)
                    </Label>
                    <Input id="address" {...register("address")} placeholder="Ex: 12 Rothschild Blvd, Tel Aviv" disabled={isSaving} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_fr" className="flex items-center gap-1.5">
                      <span>🇫🇷</span> Adresse (FR)
                    </Label>
                    <Input id="address_fr" {...register("address_fr")} placeholder="Ex: 12 Rothschild Blvd, Tel Aviv" disabled={isSaving} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_he" className="flex items-center gap-1.5">
                      <span>🇮🇱</span> כתובת (HE)
                    </Label>
                    <Input id="address_he" {...register("address_he")} placeholder="כתובת בעברית" dir="rtl" className="bg-hebrew-input" disabled={isSaving} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="google_maps_link">Lien Google Maps</Label>
                  <Input id="google_maps_link" {...register("google_maps_link")} placeholder="https://maps.google.com/..." disabled={isSaving} />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Coordonnées GPS</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      {...register("latitude", { valueAsNumber: true })}
                      disabled={isSaving}
                    />
                    <Input
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      {...register("longitude", { valueAsNumber: true })}
                      disabled={isSaving}
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={handleGeocode} disabled={isGeocoding} className="w-full">
                    {isGeocoding ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Détection...
                      </>
                    ) : (
                      <>
                        <MapPin className="mr-2 h-4 w-4" />
                        Auto-détecter coordonnées
                      </>
                    )}
                  </Button>
                  {watch("latitude") && watch("longitude") && (
                    <p className="text-sm text-emerald-600">
                      ✓ Coordonnées : {Number(watch("latitude")).toFixed(4)}, {Number(watch("longitude")).toFixed(4)}
                    </p>
                  )}
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
                    <Input id="duration" {...register("duration")} placeholder="Ex: 3 hours" disabled={isSaving} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration_fr" className="flex items-center gap-1.5">
                      <span>🇫🇷</span> Durée (FR)
                    </Label>
                    <Input id="duration_fr" {...register("duration_fr")} placeholder="Ex: 3 heures" disabled={isSaving} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration_he" className="flex items-center gap-1.5">
                      <span>🇮🇱</span> משך (HE)
                    </Label>
                    <Input id="duration_he" {...register("duration_he")} placeholder="Ex: 3 שעות" dir="rtl" className="bg-hebrew-input" disabled={isSaving} />
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
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PAGE 4 : Tarif & Dispo */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "tarif_dispo" && (
          <div className="space-y-6">
            {/* Prix de l'expérience */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Prix de l'expérience
                </CardTitle>
                <CardDescription>Tarif fournisseur, markup STAYMAKOM, prix client affiché</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Paramètres de base */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Paramètres de base</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Type de tarification <span className="text-destructive">*</span></Label>
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
                              <SelectItem value="ILS">ILS ₪</SelectItem>
                              <SelectItem value="USD">USD $</SelectItem>
                              <SelectItem value="EUR">EUR €</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Participants min / max</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="number" min={1} max={100} {...register("min_party", { valueAsNumber: true })} placeholder="1" disabled={isSaving} />
                        <Input type="number" min={1} max={100} {...register("max_party", { valueAsNumber: true })} placeholder="10" disabled={isSaving} />
                      </div>
                      {(errors.min_party || errors.max_party) && (
                        <p className="text-destructive text-xs">Valeurs min/max invalides</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Tarif fournisseur */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Tarif fournisseur (Prix net achat)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supplier_price_adult">
                        Prix adulte <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="supplier_price_adult"
                          type="number"
                          min="0"
                          step="0.01"
                          {...register("supplier_price_adult", { valueAsNumber: true })}
                          placeholder="0"
                          disabled={isSaving}
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currencySymbol}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Prix que vous payez au prestataire</p>
                      {errors.supplier_price_adult && <p className="text-destructive text-xs">{errors.supplier_price_adult.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="supplier_price_child">Prix enfant</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Tarif différent</span>
                          <Controller
                            name="has_child_price"
                            control={control}
                            render={({ field }) => (
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            )}
                          />
                        </div>
                      </div>
                      <div className="relative">
                        <Input
                          id="supplier_price_child"
                          type="number"
                          min="0"
                          step="0.01"
                          {...register("supplier_price_child", { valueAsNumber: true })}
                          placeholder="100"
                          disabled={isSaving || !hasChildPrice}
                          className={cn("pr-8", !hasChildPrice && "opacity-40")}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currencySymbol}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {hasChildPrice ? "Prix enfant au prestataire" : "Activer pour saisir un prix enfant"}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Markup STAYMAKOM */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Markup STAYMAKOM</p>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground shrink-0 w-16">Marge %</span>
                      <Controller
                        name="markup_percent"
                        control={control}
                        render={({ field }) => (
                          <Slider
                            min={0}
                            max={100}
                            step={1}
                            value={[field.value ?? 0]}
                            onValueChange={([v]) => field.onChange(v)}
                            className="flex-1"
                          />
                        )}
                      />
                      <span className="text-sm font-semibold w-12 text-right">{markupPercent}%</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Lien de réservation fournisseur — usage interne uniquement */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                    Lien de réservation fournisseur (usage interne, jamais visible des clients)
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="supplier_booking_url">URL de réservation chez le prestataire</Label>
                    <Input
                      id="supplier_booking_url"
                      type="url"
                      {...register("supplier_booking_url")}
                      placeholder="https://..."
                      disabled={isSaving}
                    />
                    <p className="text-xs text-muted-foreground">
                      Pour les expériences que vous réservez vous-même chez le fournisseur : ce lien apparaîtra
                      uniquement dans le récapitulatif de vos réservations, jamais sur le site public.
                    </p>
                  </div>
                </div>

                {/* Preview cards */}
                {supplierPriceAdult > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border p-4 bg-background">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-2">
                        <Users className="h-3.5 w-3.5" /> Adulte
                      </div>
                      <p className="text-2xl font-bold">{computedAdultPrice} <span className="text-base font-normal">{currencySymbol}</span></p>
                      <p className="text-xs text-muted-foreground mt-1">{supplierPriceAdult} + {markupPercent}% = {computedAdultPrice}</p>
                    </div>
                    <div className={cn("rounded-lg border p-4", hasChildPrice ? "bg-background" : "bg-muted/30")}>
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-2">
                        <Users className="h-3.5 w-3.5" /> Enfant
                      </div>
                      {hasChildPrice ? (
                        <>
                          <p className="text-2xl font-bold">{computedChildPrice} <span className="text-base font-normal">{currencySymbol}</span></p>
                          <p className="text-xs text-muted-foreground mt-1">{supplierPriceChild} + {markupPercent}% = {computedChildPrice}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-2xl font-bold text-muted-foreground">—</p>
                          <p className="text-xs text-muted-foreground mt-1">Tarif enfant désactivé</p>
                        </>
                      )}
                    </div>
                    <div className="rounded-lg border p-4 bg-background">
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-2">
                        <span className="text-xs font-bold">%</span> Marge unitaire
                      </div>
                      <p className="text-2xl font-bold">{margeUnitaireAdult} <span className="text-base font-normal">{currencySymbol}</span></p>
                      <p className="text-xs text-muted-foreground mt-1">par adulte</p>
                    </div>
                  </div>
                )}

                <Separator />

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
                    <Input type="time" value={newSlot} onChange={(e) => setNewSlot(e.target.value)} className="w-40" />
                    <Button type="button" variant="outline" onClick={addTimeSlot} disabled={!newSlot}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  {timeSlots.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {timeSlots.map((slot) => (
                        <span key={slot} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                          {slot}
                          <button type="button" onClick={() => removeTimeSlot(slot)} className="hover:text-destructive transition-colors">
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

            {/* Disponibilités */}
            <Card>
              <CardHeader>
                <CardTitle>Disponibilités</CardTitle>
                <CardDescription>
                  Choisissez le mode qui correspond à votre situation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Toggle mode */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAvailabilityMode("blacklist")}
                    className={cn(
                      "flex flex-col items-start gap-0.5 rounded-lg border-2 px-4 py-3 text-left transition-colors",
                      availabilityMode === "blacklist"
                        ? "border-primary bg-primary/5"
                        : "border-muted bg-background hover:border-primary/30"
                    )}
                  >
                    <span className="text-sm font-semibold">Jours récurrents</span>
                    <span className="text-xs text-muted-foreground">Ouvert selon les jours de la semaine, avec des exceptions</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvailabilityMode("whitelist")}
                    className={cn(
                      "flex flex-col items-start gap-0.5 rounded-lg border-2 px-4 py-3 text-left transition-colors",
                      availabilityMode === "whitelist"
                        ? "border-primary bg-primary/5"
                        : "border-muted bg-background hover:border-primary/30"
                    )}
                  >
                    <span className="text-sm font-semibold">Dates spécifiques</span>
                    <span className="text-xs text-muted-foreground">Seulement 2-3 dates précises à ouvrir</span>
                  </button>
                </div>

                <Separator />

                {/* ── Mode Jours récurrents (blacklist) ── */}
                {availabilityMode === "blacklist" && (
                  <>
                    {/* Jours de la semaine */}
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                        Jours disponibles chaque semaine
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {WEEKDAYS.map((day) => {
                          const active = availableDays.includes(day.id);
                          return (
                            <button
                              key={day.id}
                              type="button"
                              title={day.full}
                              onClick={() =>
                                setAvailableDays((prev) =>
                                  prev.includes(day.id)
                                    ? prev.filter((d) => d !== day.id)
                                    : [...prev, day.id].sort((a, b) => a - b)
                                )
                              }
                              className={cn(
                                "w-10 h-10 rounded-full text-sm font-semibold border-2 transition-colors",
                                active
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background text-muted-foreground border-muted hover:border-primary/50"
                              )}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                      {availableDays.length === 0 && (
                        <p className="text-xs text-destructive mt-2">Aucun jour sélectionné — l'expérience sera indisponible.</p>
                      )}
                      {availableDays.length > 0 && availableDays.length < 7 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Disponible : {availableDays.map((id) => WEEKDAYS.find((d) => d.id === id)?.full).join(", ")}
                        </p>
                      )}
                      {availableDays.length === 7 && (
                        <p className="text-xs text-muted-foreground mt-2">Disponible tous les jours</p>
                      )}
                    </div>

                    <Separator />

                    {/* Dates bloquées */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Dates bloquées (exceptions)
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Cliquez sur une date pour la marquer comme indisponible — cliquez à nouveau pour la débloquer
                          </p>
                        </div>
                        {blockedDates.length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setBlockedDates([])}
                            className="text-destructive hover:text-destructive text-xs"
                          >
                            Tout débloquer
                          </Button>
                        )}
                      </div>
                      <div className="rounded-lg border bg-background overflow-hidden">
                        <Calendar
                          mode="multiple"
                          selected={blockedDates}
                          onSelect={(dates) => setBlockedDates(dates || [])}
                          month={calendarMonth}
                          onMonthChange={setCalendarMonth}
                          numberOfMonths={2}
                          fromDate={new Date()}
                          modifiers={{
                            weekdayUnavailable: (date: Date) => {
                              if (availableDays.length === 7) return false;
                              const availableJsDays = availableDays.map((d) => (d === 7 ? 0 : d));
                              return !availableJsDays.includes(date.getDay());
                            },
                          }}
                          modifiersClassNames={{ weekdayUnavailable: "opacity-30" }}
                          classNames={{
                            day_selected:
                              "bg-destructive text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground",
                          }}
                        />
                      </div>
                      {availableDays.length < 7 && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Les jours en fondu sont déjà indisponibles selon les restrictions ci-dessus.
                        </p>
                      )}
                      {blockedDates.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {blockedDates
                            .sort((a, b) => a.getTime() - b.getTime())
                            .map((date) => (
                              <span
                                key={date.toISOString()}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-destructive/10 text-destructive border border-destructive/20"
                              >
                                {date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                                <button
                                  type="button"
                                  onClick={() => setBlockedDates((prev) => prev.filter((d) => d.toDateString() !== date.toDateString()))}
                                  className="hover:opacity-70"
                                >
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </span>
                            ))}
                        </div>
                      )}
                      {blockedDates.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Aucune date bloquée — disponible tous les jours autorisés ci-dessus.
                        </p>
                      )}
                    </div>

                    <Separator />

                    {/* Date de fermeture */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Disponible jusqu'au
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Le calendrier se ferme automatiquement après cette date. Par défaut : 6 mois.
                      </p>
                      <Input
                        type="date"
                        value={availabilityEndDate ?? defaultEndDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setAvailabilityEndDate(e.target.value || null)}
                        className="w-48"
                      />
                    </div>
                  </>
                )}

                {/* ── Mode Dates spécifiques (whitelist) ── */}
                {availabilityMode === "whitelist" && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                            Dates disponibles
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Cliquez sur les dates pour les ouvrir — tout le reste sera fermé
                          </p>
                        </div>
                        {whitelistedDates.length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setWhitelistedDates([])}
                            className="text-destructive hover:text-destructive text-xs"
                          >
                            Tout effacer
                          </Button>
                        )}
                      </div>
                      <div className="rounded-lg border bg-background overflow-hidden">
                        <Calendar
                          mode="multiple"
                          selected={whitelistedDates}
                          onSelect={(dates) => setWhitelistedDates(dates || [])}
                          month={calendarMonth}
                          onMonthChange={setCalendarMonth}
                          numberOfMonths={2}
                          fromDate={new Date()}
                          classNames={{
                            day_selected:
                              "bg-green-600 text-white hover:bg-green-600 hover:text-white focus:bg-green-600 focus:text-white",
                          }}
                        />
                      </div>
                      {whitelistedDates.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {whitelistedDates
                            .sort((a, b) => a.getTime() - b.getTime())
                            .map((date) => (
                              <span
                                key={date.toISOString()}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 border border-green-200"
                              >
                                {date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                                <button
                                  type="button"
                                  onClick={() => setWhitelistedDates((prev) => prev.filter((d) => d.toDateString() !== date.toDateString()))}
                                  className="hover:opacity-70"
                                >
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </span>
                            ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Aucune date sélectionnée — l'expérience sera invisible dans le calendrier.
                        </p>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                {/* Indicateur dernière date disponible */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Dernière date disponible
                    </p>
                    <p className="text-sm font-medium mt-0.5">
                      {lastAvailableDate
                        ? new Date(lastAvailableDate + "T12:00:00").toLocaleDateString("fr-FR", {
                            day: "numeric", month: "long", year: "numeric",
                          })
                        : "Aucune date disponible"}
                    </p>
                    {remainingDatesCount > 0 && remainingDatesCount <= 10 && (
                      <p className="text-xs text-destructive mt-0.5 font-medium">
                        Il ne reste que {remainingDatesCount} créneau{remainingDatesCount > 1 ? "x" : ""} disponible{remainingDatesCount > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={daysRemaining > 30 ? "default" : daysRemaining > 10 ? "outline" : "destructive"}
                    className={daysRemaining > 10 && daysRemaining <= 30 ? "border-orange-400 text-orange-600 bg-orange-50" : ""}
                  >
                    {availabilityMode === "whitelist"
                      ? `${remainingDatesCount} date${remainingDatesCount > 1 ? "s" : ""}`
                      : daysRemaining > 0 ? `${daysRemaining}j restants` : "Expiré"}
                  </Badge>
                </div>

              </CardContent>
            </Card>

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
                      <span>🇬🇧</span> Politique (EN)
                    </Label>
                    <Input {...register("cancellation_policy")} disabled={isSaving} />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1.5 mb-1">
                      <span>🇫🇷</span> Politique (FR)
                    </Label>
                    <Input {...register("cancellation_policy_fr")} disabled={isSaving} />
                  </div>
                  <div>
                    <Label className="flex items-center gap-1.5 mb-1">
                      <span>🇮🇱</span> Politique (HE)
                    </Label>
                    <Input {...register("cancellation_policy_he")} dir="rtl" className="bg-hebrew-input" disabled={isSaving} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PAGE 5 : SEO */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "seo" && (
          <div className="space-y-6">
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
