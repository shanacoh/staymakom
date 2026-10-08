import { useState, useEffect, useCallback, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EXPERIENCE2_INTERNAL, fetchInternalFields, saveInternalFields, splitInternalFields } from "@/lib/internalFields";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/forms/styled";
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
import { Save, Rocket, X, Upload, Loader2, ArrowLeft, Plus, ChevronUp, ChevronDown, Star, Image as ImageIcon, HelpCircle, Check, DollarSign, TrendingUp, Receipt, Percent, Building2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { generateSlug, buildImageFileName } from "@/lib/utils";
import { Experience2AddonsManager, type LocalAddonEntry } from "@/components/admin/Experience2AddonsManager";
import { EXPERIENCE_PRICING_TYPES, COMMISSION_TYPES, TAX_TYPES } from "@/types/experience2_addons";
import { useFromPrice } from "@/hooks/useExperience2Price";
import { useQuickDateAvailability } from "@/hooks/useQuickDateAvailability";
import { ExperienceAvailabilityPreview } from "@/components/experience/ExperienceAvailabilityPreview";
import { Separator } from "@/components/ui/separator";
import { Tag } from "lucide-react";
import IncludesManager2, { type LocalIncludeEntry } from "@/components/admin/IncludesManager2";
import { HighlightTagsSelector2, type LocalTagEntry } from "@/components/admin/HighlightTagsSelector2";
import ReviewsManager2, { type LocalReviewEntry } from "@/components/admin/ReviewsManager2";
import DateOptionsManager from "@/components/admin/DateOptionsManager";
import ExperienceExtrasSelector2 from "@/components/admin/ExperienceExtrasSelector2";
import PracticalInfoManager from "@/components/admin/PracticalInfoManager";
import AvailabilityRulesManager from "@/components/admin/AvailabilityRulesManager";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import AiDraftPanel, { type AiIncludeDraft, type AiExtraDraft, type AiDraftPanelHandle } from "@/components/forms/ai/AiDraftPanel";
import { CANCELLATION_TEMPLATES, matchCancellationTemplate, type CancellationTemplateId } from "@/constants/cancellationTemplates";
import { FormSection } from "@/components/forms/shared/FormSection";
import { FormHeaderBar, FormMobileSaveBar, type FormLanguage } from "@/components/forms/shared/FormHeaderBar";
import {
  FormSummaryNav,
  FormPreviewAside,
  PublishChecklist,
  scrollToSection,
  type SummarySection,
  type ChecklistItem,
} from "@/components/forms/shared/FormSummaryNav";
import { InternalOnlyBox } from "@/components/forms/shared/InternalOnlyBox";
import { CancellationPolicyFields } from "@/components/forms/shared/CancellationPolicyFields";
import { SeoFields } from "@/components/forms/shared/SeoFields";
import { PublicationFields } from "@/components/forms/shared/PublicationFields";
import { useGenerateSeo } from "@/components/forms/shared/useGenerateSeo";
import { Moon, Utensils, Users } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExperienceHotelEntry {
  hotel_id: string;
  position: number;
  nights: number;
  notes: string;
  notes_he: string;
}

// Libellés de pension pour l'aperçu en direct (mêmes intitulés que le menu
// « Pension affichée en priorité »).
const BOARD_LABELS: Record<string, string> = {
  BB: "Petit-déjeuner inclus",
  RO: "Chambre seule",
  HB: "Demi-pension",
  FB: "Pension complète",
  AI: "Tout inclus",
};

// Champs que « Générer avec l'IA » et « Traduire tout » ont le droit de remplir
// sur ce formulaire. Volontairement absents : hôtel, prix, BAR rate, net rate,
// coûts, commissions, taxes, promo et dates.
const AI_TEXT_FIELDS = [
  "title", "title_fr", "title_he",
  "subtitle", "subtitle_fr", "subtitle_he",
  "long_copy", "long_copy_fr", "long_copy_he",
  "cancellation_policy", "cancellation_policy_fr", "cancellation_policy_he",
  "seo_title_en", "seo_title_fr", "seo_title_he",
  "meta_description_en", "meta_description_fr", "meta_description_he",
  "og_title_en", "og_title_fr", "og_title_he",
  "og_description_en", "og_description_fr", "og_description_he",
] as const;
const AI_NUMERIC_FIELDS = ["min_party", "max_party", "min_nights", "max_nights"] as const;

// Identifiant de la section « Prix & dispo » : sert au sommaire et au
// déclenchement du chargement HyperGuest quand la section arrive à l'écran.
const PRICING_SECTION_ID = "sec-prix";


// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const optNum = (min = 0) =>
  z.preprocess((v) => (typeof v === "number" && isNaN(v) ? undefined : v), z.number().min(min).optional());

const experience2Schema = z.object({
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
  min_nights: optNum(1),
  max_nights: optNum(1),
  min_party: z.number().min(1).max(100),
  max_party: z.number().min(1).max(100),
  cancellation_policy: z.string().optional(),
  cancellation_policy_fr: z.string().optional(),
  cancellation_policy_he: z.string().optional(),
  hotel_id: z.string().optional(),
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
  commission_room_pct: optNum(),
  commission_addons_pct: optNum(),
  tax_pct: optNum(),
  promo_type: z.string().optional(),
  promo_value: optNum(),
  promo_is_percentage: z.boolean().optional(),
  // Modèle BAR RATE
  pricing_model: z.enum(["standard", "bar_rate"]).default("bar_rate"),
  bar_rate: optNum(),
  bar_rate_markup_value: optNum(),
  bar_rate_markup_is_pct: z.boolean().default(true),
  experience_net_cost: optNum(),
  room_net_rate: optNum(),
  // Tarification expérience (nouveaux champs)
  experience_cost_fixed: optNum(),
  experience_cost_per_person: optNum(),
  experience_sell_fixed: optNum(),
  experience_sell_per_person: optNum(),
  // Pension préférée (filtre les rate plans HyperGuest affichés/réservables)
  preferred_board_type: z.enum(["RO", "BB", "HB", "FB", "AI"]).nullable().optional(),
});

type Experience2FormData = z.infer<typeof experience2Schema>;

interface UnifiedExperience2FormProps {
  hotelId?: string;
  hotelName?: string;
  onClose?: () => void;
  experienceId?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UnifiedExperience2Form({
  hotelId: propHotelId,
  hotelName,
  onClose,
  experienceId,
}: UnifiedExperience2FormProps) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  const [heroImageUploading, setHeroImageUploading] = useState(false);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [createdExperienceId, setCreatedExperienceId] = useState<string | null>(null);
  const aiDraftPanelRef = useRef<AiDraftPanelHandle>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  // Langue affichée dans la barre du haut.
  const [activeLanguage, setActiveLanguage] = useState<FormLanguage>("fr");
  // Annulation par modèles : "custom" affiche le champ texte libre ; les autres
  // valeurs remplissent les 3 langues d'un coup.
  const [cancellationTemplate, setCancellationTemplate] = useState<CancellationTemplateId>("custom");

  // Auto-save
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Multi-hotel parcours state
  const [experienceHotels, setExperienceHotels] = useState<ExperienceHotelEntry[]>([]);
  const [hotelToAdd, setHotelToAdd] = useState<string>("");
  const [hotelRoomPrices, setHotelRoomPrices] = useState<Record<string, number | null>>({});
  const [localAddons, setLocalAddons] = useState<LocalAddonEntry[]>([]);
  const [localIncludes, setLocalIncludes] = useState<LocalIncludeEntry[]>([]);
  const [localTags, setLocalTags] = useState<LocalTagEntry[]>([]);
  const [localReviews, setLocalReviews] = useState<LocalReviewEntry[]>([]);
  const [showExtras, setShowExtras] = useState(false);
  const [featuredOnHome, setFeaturedOnHome] = useState(false);
  const [homeDisplayOrder, setHomeDisplayOrder] = useState(0);
  const [showOnV3Only, setShowOnV3Only] = useState(false);
  const [barRateRefreshEnabled, setBarRateRefreshEnabled] = useState(false);
  const [simulatorNights, setSimulatorNights] = useState(1);
  const [simulatorGuests, setSimulatorGuests] = useState(2);
  const [taxesOpen, setTaxesOpen] = useState(false);

  const currentExperienceId = experienceId || createdExperienceId;

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  const { data: hotels } = useQuery({
    queryKey: ["admin-hotels2-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotels2")
        .select("id, name, hero_image, photos, hyperguest_property_id")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

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
    queryKey: ["experience2", experienceId],
    queryFn: async () => {
      const { data, error } = await supabase.from("experiences2").select("*").eq("id", experienceId).single();
      if (error) throw error;
      // Les coûts de l'activité sont rangés à part, réservés aux admins.
      return { ...data, ...(await fetchInternalFields(EXPERIENCE2_INTERNAL, experienceId!)) };
    },
    enabled: !!experienceId,
  });

  // Check if this experience already has linked extras (to restore showExtras toggle)
  const { data: existingExtrasCount } = useQuery({
    queryKey: ["experience2-extras-count", experienceId],
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("experience2_extras")
        .select("id", { count: "exact", head: true })
        .eq("experience_id", experienceId);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!experienceId,
  });

  const { data: existingExperienceHotels } = useQuery({
    queryKey: ["experience2-hotels", experienceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experience2_hotels")
        .select("*")
        .eq("experience_id", experienceId)
        .order("position");
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
  } = useForm<Experience2FormData>({
    resolver: zodResolver(experience2Schema),
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
      hotel_id: propHotelId || "",
      min_nights: 1,
      max_nights: 4,
      min_party: 2,
      max_party: 4,
      cancellation_policy: "",
      cancellation_policy_fr: "",
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
      commission_room_pct: 0,
      commission_addons_pct: 0,
      tax_pct: 0,
      promo_type: "none",
      promo_value: 0,
      promo_is_percentage: true,
      pricing_model: "standard",
      bar_rate: undefined,
      bar_rate_markup_value: undefined,
      bar_rate_markup_is_pct: true,
      experience_net_cost: undefined,
      room_net_rate: undefined,
      // Par défaut, les nouvelles expériences sont en BB (validé par Shana 2026-05-07)
      preferred_board_type: "BB",
    },
  });

  const longCopy = watch("long_copy");
  const longCopyHe = watch("long_copy_he");
  const minNights = watch("min_nights");
  const maxNights = watch("max_nights");
  const title = watch("title");
  // Pension préférée — pilote le filtre HyperGuest pour cette expérience.
  // Watchée pour que le changement dans le menu déroulant rafraîchisse instantanément
  // les aperçus (Données HyperGuest, Aperçu Prix & Disponibilités).
  const preferredBoardType = watch("preferred_board_type") ?? null;

  const firstHotel = experienceHotels.length > 0 ? hotels?.find((h) => h.id === experienceHotels[0].hotel_id) : null;

  // Primary hotel HyperGuest ID (for pricing hooks)
  const primaryHyperguestId = firstHotel?.hyperguest_property_id ?? null;
  const primaryPropertyId = primaryHyperguestId ? parseInt(primaryHyperguestId) : null;

  // Modèle A — Prix de référence HyperGuest (meilleur tarif 30 jours, sans dates)
  const { fromPriceILS, isLoading: isLoadingFromPrice } = useFromPrice(
    currentExperienceId ?? null,
    primaryHyperguestId,
    [],
    preferredBoardType,
  );

  // Modèle B — BAR RATE sur 30 jours (déclenché manuellement)
  const { data: quickDatesBarRate, isLoading: isLoadingBarRate } = useQuickDateAvailability({
    propertyId: primaryPropertyId,
    nights: 1,
    adults: 2,
    currency: "ILS",
    preferredBoardType,
    enabled: barRateRefreshEnabled,
  });

  // Net Rate (tarif WHOLESALE = ce que Staymakom paie réellement à HyperGuest).
  // Confirmé par Reshma (HG account manager) le 2026-05-04 : NET = la vraie facture HG.
  // Auparavant on affichait `cheapestPrice` (= sell price) qui est le prix de revente
  // suggéré par HG, pas le coût réel — corrigé pour pointer sur cheapestNetPrice.
  const netRatePrices = quickDatesBarRate
    ?.map((d: any) => d.cheapestNetPrice ?? d.cheapestPrice) // fallback sur sell si net absent
    .filter((p: any): p is number => p !== null && p > 0) ?? [];
  const minNetRate = netRatePrices.length > 0 ? Math.min(...netRatePrices) : null;
  const maxNetRate = netRatePrices.length > 0 ? Math.max(...netRatePrices) : null;

  // BAR Rate public (tarif public hôtel = bar price HyperGuest).
  // Source : prices.bar.price. Sert de référence de parité tarifaire — le prix
  // public ne devrait jamais descendre en-dessous (règle contractuelle HG).
  const barRatePublicPrices = quickDatesBarRate
    ?.map((d: any) => d.cheapestBarPrice)
    .filter((p: any): p is number => p !== null && p > 0) ?? [];
  const minBarRatePublic = barRatePublicPrices.length > 0 ? Math.min(...barRatePublicPrices) : null;
  const maxBarRatePublic = barRatePublicPrices.length > 0 ? Math.max(...barRatePublicPrices) : null;

  // Auto-déclenche le fetch HyperGuest dès que la section « Prix & dispo » arrive
  // à l'écran (équivalent de l'arrivée sur l'ancien onglet Tarification) avec un
  // hôtel HG associé, pour que le Net Rate soit pré-rempli sans clic manuel.
  // Tant que la section n'a pas été affichée, rien n'est chargé ni modifié.
  useEffect(() => {
    if (!primaryHyperguestId || barRateRefreshEnabled) return;
    const section = document.getElementById(PRICING_SECTION_ID);
    if (!section) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setBarRateRefreshEnabled(true);
      },
      // La section doit atteindre la moitié haute de l'écran : un simple
      // affichage en bas de page au chargement ne suffit pas.
      { rootMargin: "0px 0px -50% 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [primaryHyperguestId, barRateRefreshEnabled, isLoadingExperience]);

  // Pré-remplir room_net_rate avec le min Net Rate quand les données arrivent.
  // shouldDirty + shouldTouch forcent react-hook-form à propager la valeur au DOM
  // (sinon le champ peut rester visuellement vide alors que l'état interne est correct).
  useEffect(() => {
    if (minNetRate !== null && barRateRefreshEnabled && !isLoadingBarRate) {
      setValue("room_net_rate", minNetRate, { shouldDirty: true, shouldTouch: true });
    }
  }, [minNetRate, barRateRefreshEnabled, isLoadingBarRate, setValue]);

  const allParcoursImages: string[] = [];
  for (const eh of experienceHotels) {
    const h = hotels?.find((x) => x.id === eh.hotel_id);
    if (h) {
      if (h.hero_image) allParcoursImages.push(h.hero_image);
      if (Array.isArray(h.photos)) {
        for (const p of h.photos) {
          if (p && !allParcoursImages.includes(p as string)) allParcoursImages.push(p as string);
        }
      }
    }
  }

  const availableHotels = hotels?.filter((h) => !experienceHotels.some((eh) => eh.hotel_id === h.id));
  const totalNights = experienceHotels.reduce((sum, h) => sum + (h.nights || 0), 0);

  // -------------------------------------------------------------------------
  // Auto-save to localStorage every 30s
  // -------------------------------------------------------------------------

  const autoSaveKey = `exp2-autosave-${experienceId || "new"}`;

  const doAutoSave = useCallback(() => {
    try {
      const formData = getValues();
      const payload = {
        formData,
        experienceHotels,
        heroImagePreview,
        galleryPreviews: galleryPreviews.filter((u) => u.startsWith("http")),
        localAddons,
        localIncludes,
        localTags,
        localReviews,
        featuredOnHome,
        homeDisplayOrder,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(autoSaveKey, JSON.stringify(payload));
      setLastAutoSave(new Date());
    } catch (e) {
      // silent fail
    }
  }, [getValues, experienceHotels, heroImagePreview, galleryPreviews, localAddons, localIncludes, localTags, localReviews, featuredOnHome, homeDisplayOrder, autoSaveKey]);

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
    if (existingExperience) {
      setValue("title", existingExperience.title || "");
      setValue("title_fr", existingExperience.title_fr || "");
      setValue("title_he", existingExperience.title_he || "");
      setValue("subtitle", existingExperience.subtitle || "");
      setValue("subtitle_fr", existingExperience.subtitle_fr || "");
      setValue("subtitle_he", existingExperience.subtitle_he || "");
      setValue("category_id", existingExperience.category_id || "", { shouldValidate: true });
      setValue("long_copy", existingExperience.long_copy || "");
      setValue("long_copy_fr", existingExperience.long_copy_fr || "");
      setValue("long_copy_he", existingExperience.long_copy_he || "");
      setValue("min_nights", existingExperience.min_nights || 1);
      setValue("max_nights", existingExperience.max_nights || 4);
      setValue("min_party", existingExperience.min_party || 2);
      setValue("max_party", existingExperience.max_party || 4);
      setValue("hotel_id", existingExperience.hotel_id || propHotelId || "");
      setValue("cancellation_policy", existingExperience.cancellation_policy || "");
      setValue("cancellation_policy_fr", existingExperience.cancellation_policy_fr || "");
      setValue("cancellation_policy_he", existingExperience.cancellation_policy_he || "");
      setCancellationTemplate(
        matchCancellationTemplate(
          existingExperience.cancellation_policy,
          existingExperience.cancellation_policy_fr,
          existingExperience.cancellation_policy_he,
        ),
      );
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
      setValue("commission_room_pct", (existingExperience as any).commission_room_pct ?? 0);
      setValue("commission_addons_pct", (existingExperience as any).commission_addons_pct ?? 0);
      setValue("tax_pct", (existingExperience as any).tax_pct ?? 0);
      setValue("promo_type", (existingExperience as any).promo_type ?? "none");
      setValue("promo_value", (existingExperience as any).promo_value ?? 0);
      setValue("promo_is_percentage", (existingExperience as any).promo_is_percentage ?? true);
      setValue("pricing_model", "bar_rate");
      // Ne pas écraser bar_rate / room_net_rate si la base est null :
      // ces champs peuvent être pré-remplis par l'auto-fill HyperGuest avant
      // qu'un refetch d'`existingExperience` ne déclenche à nouveau cet effet.
      const existingBarRate = (existingExperience as any).bar_rate;
      if (existingBarRate != null) setValue("bar_rate", existingBarRate);
      setValue("bar_rate_markup_value", (existingExperience as any).bar_rate_markup_value ?? undefined);
      setValue("bar_rate_markup_is_pct", (existingExperience as any).bar_rate_markup_is_pct ?? true);
      setValue("experience_net_cost", (existingExperience as any).experience_net_cost ?? undefined);
      const existingRoomNetRate = (existingExperience as any).room_net_rate;
      if (existingRoomNetRate != null) setValue("room_net_rate", existingRoomNetRate);
      setValue("experience_cost_fixed", (existingExperience as any).experience_cost_fixed ?? undefined);
      setValue("experience_cost_per_person", (existingExperience as any).experience_cost_per_person ?? undefined);
      setValue("experience_sell_fixed", (existingExperience as any).experience_sell_fixed ?? undefined);
      setValue("experience_sell_per_person", (existingExperience as any).experience_sell_per_person ?? undefined);
      setValue(
        "preferred_board_type",
        ((existingExperience as any).preferred_board_type as
          | "RO"
          | "BB"
          | "HB"
          | "FB"
          | "AI"
          | null) ?? null,
      );

      if (existingExperience.hero_image) setHeroImagePreview(existingExperience.hero_image);
      if (existingExperience.photos && Array.isArray(existingExperience.photos)) setGalleryPreviews(existingExperience.photos);
      
      // Featured on home
      setFeaturedOnHome((existingExperience as any).featured_on_home ?? false);
      setHomeDisplayOrder((existingExperience as any).home_display_order ?? 0);
      setShowOnV3Only((existingExperience as any).show_on_v3_only ?? false);
    }
  }, [existingExperience, setValue, propHotelId]);

  // Restore showExtras toggle when experience has linked extras
  useEffect(() => {
    if (typeof existingExtrasCount === "number" && existingExtrasCount > 0) {
      setShowExtras(true);
    }
  }, [existingExtrasCount]);

  useEffect(() => {
    if (existingExperienceHotels && existingExperienceHotels.length > 0) {
      setExperienceHotels(
        existingExperienceHotels.map((eh) => ({
          hotel_id: eh.hotel_id,
          position: eh.position,
          nights: eh.nights ?? 1,
          notes: eh.notes ?? "",
          notes_he: eh.notes_he ?? "",
        })),
      );
    }
  }, [existingExperienceHotels]);

  useEffect(() => {
    if (propHotelId && !experienceId && experienceHotels.length === 0 && hotels?.some((h) => h.id === propHotelId)) {
      setExperienceHotels([{ hotel_id: propHotelId, position: 1, nights: 1, notes: "", notes_he: "" }]);
    }
  }, [propHotelId, experienceId, experienceHotels.length, hotels]);

  // -------------------------------------------------------------------------
  // Multi-hotel parcours helpers
  // -------------------------------------------------------------------------

  const addHotelToParcours = () => {
    if (!hotelToAdd || experienceHotels.some((h) => h.hotel_id === hotelToAdd)) return;
    setExperienceHotels((prev) => [
      ...prev,
      { hotel_id: hotelToAdd, position: prev.length + 1, nights: 1, notes: "", notes_he: "" },
    ]);
    setHotelToAdd("");
  };

  const removeHotelFromParcours = (index: number) => {
    setExperienceHotels((prev) => prev.filter((_, i) => i !== index).map((h, i) => ({ ...h, position: i + 1 })));
  };

  const moveHotel = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= experienceHotels.length) return;
    const newList = [...experienceHotels];
    [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
    setExperienceHotels(newList.map((h, i) => ({ ...h, position: i + 1 })));
  };

  const updateHotelNights = (index: number, nights: number) => {
    setExperienceHotels((prev) => prev.map((h, i) => (i === index ? { ...h, nights: Math.max(1, nights) } : h)));
  };

  const updateHotelNotes = (index: number, notes: string) => {
    setExperienceHotels((prev) => prev.map((h, i) => (i === index ? { ...h, notes } : h)));
  };

  // -------------------------------------------------------------------------
  // Image handlers
  // -------------------------------------------------------------------------

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

  const uploadImage = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = buildImageFileName(title, fileExt);
    const filePath = `${path}/${fileName}`;
    const { error: uploadError } = await supabase.storage.from("experience-images").upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("experience-images").getPublicUrl(filePath);
    return data.publicUrl;
  };

  // Hero drop zone handler
  const handleHeroDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleHeroImageChange(file);
  };

  // Gallery drop zone handler
  const handleGalleryDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleGalleryImagesChange(e.dataTransfer.files);
  };

  // -------------------------------------------------------------------------
  // Save experience hotels to junction table
  // -------------------------------------------------------------------------

  const saveExperienceHotels = async (expId: string) => {
    await supabase.from("experience2_hotels").delete().eq("experience_id", expId);
    if (experienceHotels.length > 0) {
      const { error } = await supabase.from("experience2_hotels").insert(
        experienceHotels.map((h) => ({
          experience_id: expId,
          hotel_id: h.hotel_id,
          position: h.position,
          nights: h.nights,
          notes: h.notes || null,
          notes_he: h.notes_he || null,
        })),
      );
      if (error) throw error;
    }
  };

  // -------------------------------------------------------------------------
  // Build experience data object
  // -------------------------------------------------------------------------

  const buildExperienceData = async (data: Experience2FormData, status: "draft" | "published") => {
    // hero is already uploaded immediately on selection — just use the URL
    const heroImageUrl = heroImagePreview || existingExperience?.hero_image || "";

    const galleryImagesSnapshot = [...galleryImages];
    const galleryPreviewsSnapshot = [...galleryPreviews];

    const photoUrls = galleryPreviewsSnapshot.filter((url) => url.startsWith("http"));
    for (const img of galleryImagesSnapshot) {
      try {
        const url = await uploadImage(img, "gallery");
        photoUrls.push(url);
      } catch (e) {
        console.error("Failed to upload gallery image, skipping:", e);
        toast.error("Une image n'a pas pu être uploadée");
      }
    }

    const primaryHotelId = experienceHotels.length > 0 ? experienceHotels[0].hotel_id : null;

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
      min_nights: data.min_nights,
      max_nights: data.max_nights,
      min_party: data.min_party,
      max_party: data.max_party,
      base_price: 0,
      currency: "ILS",
      base_price_type: "per_person" as const,
      hotel_id: primaryHotelId,
      cancellation_policy: data.cancellation_policy || null,
      cancellation_policy_fr: data.cancellation_policy_fr || null,
      cancellation_policy_he: data.cancellation_policy_he || null,
      hero_image: heroImageUrl || null,
      thumbnail_image: heroImageUrl || null,
      photos: photoUrls,
      status,
      slug: currentExperienceId ? existingExperience?.slug : generateSlug(title),
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
      commission_room_pct: data.commission_room_pct ?? 0,
      commission_addons_pct: data.commission_addons_pct ?? 0,
      tax_pct: data.tax_pct ?? 0,
      promo_type: data.promo_type === "none" || !data.promo_type ? null : data.promo_type,
      promo_value: data.promo_type === "none" || !data.promo_type ? null : (data.promo_value ?? null),
      promo_is_percentage: data.promo_is_percentage ?? true,
      featured_on_home: featuredOnHome,
      home_display_order: homeDisplayOrder,
      show_on_v3_only: showOnV3Only,
      // Modèle BAR RATE (toujours actif)
      pricing_model: "bar_rate",
      bar_rate: data.bar_rate ?? null,
      bar_rate_markup_value: data.bar_rate_markup_value ?? null,
      bar_rate_markup_is_pct: data.bar_rate_markup_is_pct ?? true,
      experience_net_cost: data.experience_net_cost ?? null,
      room_net_rate: data.room_net_rate ?? null,
      experience_cost_fixed: data.experience_cost_fixed ?? null,
      experience_cost_per_person: data.experience_cost_per_person ?? null,
      experience_sell_fixed: data.experience_sell_fixed ?? null,
      experience_sell_per_person: data.experience_sell_per_person ?? null,
      preferred_board_type: data.preferred_board_type ?? null,
    };
  };

  // -------------------------------------------------------------------------
  // Save local addons/includes/tags/reviews
  // -------------------------------------------------------------------------

  const saveLocalAddons = async (expId: string) => {
    if (localAddons.length === 0) return;
    const rows = localAddons.map((addon, index) => ({
      experience_id: expId,
      type: addon.type as string,
      name: addon.name,
      name_he: addon.name_he || null,
      value: addon.value,
      is_percentage: addon.is_percentage ?? false,
      calculation_order: index + 1,
      is_active: addon.is_active,
    }));
    const { error } = await supabase.from("experience2_addons").insert(rows as any);
    if (error) {
      toast.error("Addons saved partially");
    }
  };

  const saveLocalIncludes = async (expId: string) => {
    if (localIncludes.length === 0) return;
    const rows = localIncludes.map((inc, index) => ({
      experience_id: expId,
      title: inc.title,
      title_fr: inc.title_fr || null,
      title_he: inc.title_he || null,
      icon_url: inc.icon_url || null,
      order_index: index,
      published: inc.published,
    }));
    const { error } = await (supabase as any).from("experience2_includes").insert(rows);
    
  };

  const saveLocalTags = async (expId: string) => {
    if (localTags.length === 0) return;
    const rows = localTags.map((t) => ({ experience_id: expId, tag_id: t.tag_id }));
    const { error } = await (supabase as any).from("experience2_highlight_tags").insert(rows);
    
  };

  const saveLocalReviews = async (expId: string) => {
    if (localReviews.length === 0) return;
    const rows = localReviews.map((r) => ({
      experience_id: expId,
      user_name: r.user_name,
      rating: r.rating,
      comment: r.comment || null,
      is_visible: r.is_visible,
    }));
    const { error } = await supabase.from("experience2_reviews").insert(rows);
    
  };

  // -------------------------------------------------------------------------
  // Save Draft
  // -------------------------------------------------------------------------

  const handleSaveDraft = async (data: Experience2FormData) => {
    setIsSaving(true);
    try {
      const { publicFields, internalFields } = splitInternalFields(EXPERIENCE2_INTERNAL, await buildExperienceData(data, "draft"));
      const experienceData = publicFields as Awaited<ReturnType<typeof buildExperienceData>>;
      if (currentExperienceId) {
        const { error } = await supabase.from("experiences2").update(experienceData).eq("id", currentExperienceId);
        if (error) throw error;
        await saveInternalFields(EXPERIENCE2_INTERNAL, currentExperienceId, internalFields);
        await saveExperienceHotels(currentExperienceId);
        toast.success("Draft saved successfully");
      } else {
        const { data: insertedData, error } = await supabase
          .from("experiences2")
          .insert([experienceData])
          .select("id")
          .single();
        if (error) throw error;
        setCreatedExperienceId(insertedData.id);
        await saveInternalFields(EXPERIENCE2_INTERNAL, insertedData.id, internalFields);
        await saveExperienceHotels(insertedData.id);
        await saveLocalAddons(insertedData.id);
        await saveLocalIncludes(insertedData.id);
        await saveLocalTags(insertedData.id);
        await saveLocalReviews(insertedData.id);
        toast.success("Draft saved!");
      }
      // Clear auto-save and reset local image state (already uploaded)
      setGalleryImages([]);
      localStorage.removeItem(autoSaveKey);
      queryClient.invalidateQueries({ queryKey: ["admin-experiences2"] });
      if (currentExperienceId) queryClient.invalidateQueries({ queryKey: ["experience2", currentExperienceId] });
    } catch (error: any) {

      toast.error(error.message || "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------------------------------------------------------
  // Publish
  // -------------------------------------------------------------------------

  const handlePublish = async (data: Experience2FormData) => {
    if (experienceHotels.length === 0) {
      toast.error("Ajoutez au moins un hôtel au parcours");
      return;
    }
    setIsSaving(true);
    try {
      const { publicFields, internalFields } = splitInternalFields(EXPERIENCE2_INTERNAL, await buildExperienceData(data, "published"));
      const experienceData = publicFields as Awaited<ReturnType<typeof buildExperienceData>>;
      if (currentExperienceId) {
        const { error } = await supabase.from("experiences2").update(experienceData).eq("id", currentExperienceId);
        if (error) throw error;
        await saveInternalFields(EXPERIENCE2_INTERNAL, currentExperienceId, internalFields);
        await saveExperienceHotels(currentExperienceId);
        toast.success("Published successfully");
      } else {
        const { data: insertedData, error } = await supabase
          .from("experiences2")
          .insert([experienceData])
          .select("id")
          .single();
        if (error) throw error;
        setCreatedExperienceId(insertedData.id);
        await saveInternalFields(EXPERIENCE2_INTERNAL, insertedData.id, internalFields);
        await saveExperienceHotels(insertedData.id);
        await saveLocalAddons(insertedData.id);
        await saveLocalIncludes(insertedData.id);
        await saveLocalTags(insertedData.id);
        await saveLocalReviews(insertedData.id);
        toast.success("Published successfully");
      }
      setGalleryImages([]);
      localStorage.removeItem(autoSaveKey);
      queryClient.invalidateQueries({ queryKey: ["admin-experiences2"] });
      if (currentExperienceId) queryClient.invalidateQueries({ queryKey: ["experience2", currentExperienceId] });
      onClose?.();
    } catch (error: any) {
      
      toast.error(error.message || "Failed to publish");
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
      const { error } = await supabase.from("experiences2").delete().eq("id", experienceId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Experience deleted successfully");
      localStorage.removeItem(autoSaveKey);
      queryClient.invalidateQueries({ queryKey: ["admin-experiences2"] });
      onClose?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete experience");
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

  const onInvalidSubmit = (errors: Record<string, any>) => {
    
    const fieldNames: Record<string, string> = {
      title: "Title (EN)",
      category_id: "Category",
      long_copy: "Description (EN)",
      min_party: "Min Party Size",
      max_party: "Max Party Size",
    };
    const errorFields = Object.keys(errors).map((field) => fieldNames[field] || field);
    if (errorFields.length > 0) toast.error(`Please fill required fields: ${errorFields.join(", ")}`);

    // Défile jusqu'à la section qui contient la première erreur, et affiche
    // la langue du champ concerné (sinon il resterait masqué).
    const errorField = Object.keys(errors)[0];
    if (["title", "long_copy"].includes(errorField)) setActiveLanguage("en");
    if (errorField === "category_id") {
      scrollToSection("sec-demarrer");
    } else if (["long_copy", "long_copy_he"].includes(errorField)) {
      scrollToSection("sec-recit");
    } else if (["title", "title_he", "subtitle", "subtitle_he", "min_party", "max_party", "min_nights", "max_nights"].includes(errorField)) {
      scrollToSection("sec-essentiel");
    }

    const element = document.querySelector(`[name="${errorField}"]`) || document.getElementById(errorField);
    if (element) element.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const canPublish = title && longCopy && longCopy.length >= 100 && experienceHotels.length > 0;

  // -------------------------------------------------------------------------
  // Auto-save time display
  // -------------------------------------------------------------------------

  const getAutoSaveLabel = () => {
    if (!lastAutoSave) return null;
    const diff = Math.round((Date.now() - lastAutoSave.getTime()) / 60000);
    if (diff < 1) return "Auto-sauvegardé à l'instant";
    return `Auto-sauvegardé il y a ${diff} min`;
  };

  // -------------------------------------------------------------------------
  // Générer avec l'IA / Traduire tout / Générer le SEO
  // L'IA ne touche jamais à l'hôtel, aux prix, aux coûts, aux commissions,
  // aux taxes, à la promo ni aux dates, et n'enregistre rien elle-même.
  // -------------------------------------------------------------------------

  const categoryId = watch("category_id");

  const applyAiCategoryIds = (ids: string[]) => {
    setValue("category_id", ids[0] || "", { shouldValidate: true, shouldDirty: true });
  };

  // Un texte d'annulation posé par l'IA (ou par Traduire tout) doit rester
  // visible : on repasse sur « Personnalisée » au lieu de le cacher derrière un modèle.
  const setValueFromAi = (name: string, value: unknown, options?: { shouldDirty?: boolean; shouldValidate?: boolean }) => {
    if (name.startsWith("cancellation_policy")) setCancellationTemplate("custom");
    setValue(name as keyof Experience2FormData, value as never, options);
  };

  // La durée n'est pas un champ de ce formulaire (elle se règle dans « Things
  // to Know ») : si l'IA en trouve une, on la signale au lieu de la perdre.
  const getAiExtraToVerify = (draft: Record<string, unknown>) => {
    const duration = draft.duration_fr || draft.duration;
    return typeof duration === "string" && duration.trim()
      ? [`Durée trouvée par l'IA : ${duration.trim()}. À reporter dans « Things to Know » si besoin.`]
      : [];
  };

  const handleAiIncludes = async (items: AiIncludeDraft[]) => {
    if (!currentExperienceId) {
      setLocalIncludes((prev) => [
        ...prev,
        ...items.map((item, idx) => ({
          _localId: `ai-${Date.now()}-${idx}`,
          title: item.title,
          title_fr: item.title_fr,
          title_he: item.title_he,
          icon_url: "",
          published: true,
          order_index: prev.length + idx,
        })),
      ]);
      return;
    }
    const { error } = await (supabase as any).from("experience2_includes").insert(
      items.map((item, idx) => ({
        experience_id: currentExperienceId,
        title: item.title,
        title_fr: item.title_fr || null,
        title_he: item.title_he || null,
        order_index: 1000 + idx,
        published: true,
      })),
    );
    if (error) {
      toast.error("Les inclus générés par l'IA n'ont pas pu être ajoutés.");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["experience2-includes", currentExperienceId] });
  };

  // Les extras d'une expérience hôtel sont choisis parmi ceux de la fiche hôtel
  // (avec leur prix) : l'IA ne peut donc que les suggérer, jamais les créer.
  const handleAiExtras = (items: AiExtraDraft[]) => {
    if (items.length === 0) return;
    toast.info(`Extras suggérés par l'IA : ${items.map((i) => i.title).join(", ")}. À créer sur la fiche de l'hôtel pour pouvoir les proposer ici.`, {
      duration: 15000,
    });
  };

  // Traduire tout, côté inclus : traduit vers EN/HE les inclus dont le titre FR
  // est rempli, uniquement là où EN ou HE est encore vide (rien n'est écrasé).
  const handleTranslateIncludes = async () => {
    type Row = { key: string; id?: string; title_fr: string; title: string; title_he: string };
    let rows: Row[] = [];
    if (!currentExperienceId) {
      rows = localIncludes.map((item, idx) => ({
        key: `inc_${idx}`, title_fr: item.title_fr || "", title: item.title || "", title_he: item.title_he || "",
      }));
    } else {
      const { data } = await (supabase as any)
        .from("experience2_includes")
        .select("id, title, title_fr, title_he")
        .eq("experience_id", currentExperienceId);
      rows = (data || []).map((item: any, idx: number) => ({
        key: `inc_${idx}`, id: item.id, title_fr: item.title_fr || "", title: item.title || "", title_he: item.title_he || "",
      }));
    }

    const translatable = rows.filter((r) => r.title_fr.trim() && (!r.title.trim() || !r.title_he.trim()));
    if (translatable.length === 0) return;

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return;

    const { data, error } = await supabase.functions.invoke("generate-experience-draft", {
      headers: { Authorization: `Bearer ${token}` },
      body: { type: "hotel", mode: "translate", texts: Object.fromEntries(translatable.map((r) => [r.key, r.title_fr])) },
    });
    if (error || data?.error) {
      toast.error("La traduction des inclus a échoué.");
      return;
    }
    const translations = (data.translations || {}) as Record<string, { en: string; he: string }>;

    if (!currentExperienceId) {
      setLocalIncludes((prev) =>
        prev.map((item, idx) => {
          const t = translations[`inc_${idx}`];
          if (!t) return item;
          return { ...item, title: item.title.trim() || t.en || item.title, title_he: item.title_he.trim() || t.he || item.title_he };
        }),
      );
      return;
    }

    const updates: Promise<unknown>[] = [];
    for (const row of rows) {
      const t = translations[row.key];
      if (!t || !row.id) continue;
      const patch: Record<string, string> = {};
      if (!row.title.trim() && t.en) patch.title = t.en;
      if (!row.title_he.trim() && t.he) patch.title_he = t.he;
      if (Object.keys(patch).length > 0) updates.push((supabase as any).from("experience2_includes").update(patch).eq("id", row.id));
    }
    await Promise.all(updates);
    queryClient.invalidateQueries({ queryKey: ["experience2-includes", currentExperienceId] });
  };

  const handleTranslateAll = async () => {
    setIsTranslating(true);
    try {
      await Promise.all([aiDraftPanelRef.current?.translateAll(), handleTranslateIncludes()]);
    } finally {
      setIsTranslating(false);
    }
  };

  const { isGeneratingSeo, handleGenerateSeo } = useGenerateSeo(
    "hotel",
    (name) => getValues(name as keyof Experience2FormData),
    (name, value) => setValue(name as keyof Experience2FormData, value as never),
  );

  // Choisir un modèle d'annulation remplit les 3 langues d'un coup avec le
  // texte déjà rédigé ; on ne touche jamais au texte sans clic explicite.
  const selectCancellationTemplate = (id: CancellationTemplateId) => {
    setCancellationTemplate(id);
    if (id === "custom") return;
    const template = CANCELLATION_TEMPLATES.find((t) => t.id === id);
    if (!template) return;
    setValue("cancellation_policy", template.en);
    setValue("cancellation_policy_fr", template.fr);
    setValue("cancellation_policy_he", template.he);
  };

  // Même clé de cache que IncludesManager2 : sert à la checklist et à l'aperçu.
  const { data: savedIncludes } = useQuery({
    queryKey: ["experience2-includes", currentExperienceId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("experience2_includes")
        .select("*")
        .eq("experience_id", currentExperienceId)
        .order("order_index");
      if (error) throw error;
      return data;
    },
    enabled: !!currentExperienceId,
  });

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
  // Sommaire, aperçu, checklist
  // -------------------------------------------------------------------------

  // Une langue à la fois : seuls les champs de la langue choisie dans la barre
  // du haut sont affichés (les autres restent remplis, simplement masqués).
  const langHidden = (lang: FormLanguage) => activeLanguage !== lang;

  // Complétude par langue — champs principaux : titre, accroche, description.
  const subtitleEn = watch("subtitle");
  const titleFr = watch("title_fr");
  const titleHe = watch("title_he");
  const subtitleFr = watch("subtitle_fr");
  const subtitleHe = watch("subtitle_he");
  const longCopyFr = watch("long_copy_fr");
  const getLanguageMissingCount = (lang: FormLanguage) => {
    const values =
      lang === "fr"
        ? [titleFr, subtitleFr, longCopyFr]
        : lang === "en"
        ? [title, subtitleEn, longCopy]
        : [titleHe, subtitleHe, longCopyHe];
    return values.filter((v) => !v || !v.trim()).length;
  };
  const seoTitleEn = watch("seo_title_en");
  const totalPhotosCount = (heroImagePreview ? 1 : 0) + galleryPreviews.length;
  const unreviewedAi = aiDraftPanelRef.current?.getUnreviewedAiCount() ?? 0;
  const currentStatus = existingExperience?.status === "published" ? "Publiée" : "Brouillon";

  const includesForPreview: { title: string; icon_url?: string | null }[] = currentExperienceId
    ? ((savedIncludes as any[] | undefined) ?? []).filter((i) => i.published)
    : localIncludes;
  const includesWithPhotoCount = includesForPreview.filter((i) => i.icon_url).length;

  const hasPricing =
    (watch("room_net_rate") || 0) > 0 ||
    (watch("experience_sell_fixed") || 0) > 0 ||
    (watch("experience_sell_per_person") || 0) > 0;

  const SUMMARY_SECTIONS: SummarySection[] = [
    { id: "sec-demarrer", label: "Démarrer", status: categoryId ? "ok" : "empty" },
    {
      id: "sec-essentiel",
      label: "1. L'essentiel",
      status: unreviewedAi > 0 ? "ai" : !title ? "empty" : subtitleEn && experienceHotels.length > 0 ? "ok" : "warning",
    },
    {
      id: "sec-recit",
      label: "2. Le récit",
      status: (longCopy?.length ?? 0) === 0 ? "empty" : (longCopy?.length ?? 0) >= 100 ? "ok" : "warning",
    },
    { id: "sec-photos", label: "3. Photos", status: totalPhotosCount === 0 ? "empty" : totalPhotosCount >= 5 ? "ok" : "warning" },
    { id: PRICING_SECTION_ID, label: "4. Prix & dispo", status: hasPricing ? "ok" : "empty" },
    {
      id: "sec-conditions",
      label: "5. Conditions",
      status: cancellationTemplate !== "custom" || watch("cancellation_policy") ? "ok" : "empty",
    },
    { id: "sec-publication", label: "6. Publication", status: seoTitleEn ? "ok" : "empty" },
  ];

  const checklistItems: ChecklistItem[] = [
    { id: "titre", label: "Titre et accroche", done: !!title && !!subtitleEn },
    { id: "hotel", label: "Au moins un hôtel dans le parcours", done: experienceHotels.length > 0 },
    { id: "description", label: "Description", done: (longCopy?.length ?? 0) >= 100 },
    { id: "inclus", label: "4 inclus avec photo", done: includesWithPhotoCount >= 4 },
    { id: "photos", label: "Au moins 5 photos", done: totalPhotosCount >= 5 },
    {
      id: "langues",
      label: "Versions EN et HE remplies",
      done: getLanguageMissingCount("en") === 0 && getLanguageMissingCount("he") === 0,
    },
    { id: "ia", label: "Aucun champ IA non relu", done: unreviewedAi === 0 },
  ];

  const nightsLabel =
    minNights && maxNights && minNights !== maxNights
      ? `${minNights} à ${maxNights} nuits`
      : `${minNights || maxNights || 1} nuit${(minNights || maxNights || 1) > 1 ? "s" : ""}`;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6 pb-24">
      <form onSubmit={handleSubmit(handlePublish, onInvalidSubmit)} className="space-y-6">
        {/* Barre du haut, collante */}
        <FormHeaderBar
          onClose={onClose}
          heading={title || (experienceId ? "Modifier l'expérience" : "Nouvelle expérience hôtel")}
          meta={
            <>
              Hôtel + expérience{hotelName && <> · {hotelName}</>} · {currentStatus}
              {lastAutoSave && <> · {getAutoSaveLabel()}</>}
            </>
          }
          activeLanguage={activeLanguage}
          onLanguageChange={setActiveLanguage}
          getLanguageMissingCount={getLanguageMissingCount}
          onTranslateAll={handleTranslateAll}
          isTranslating={isTranslating}
          onSaveDraft={handleSubmit(handleSaveDraft, onInvalidSubmit)}
          canPublish={!!canPublish}
          busy={isSaving || heroImageUploading}
        />

        {/* Générer avec l'IA */}
        <AiDraftPanel
          ref={aiDraftPanelRef}
          experienceType="hotel"
          allowedFields={AI_TEXT_FIELDS}
          numericFields={AI_NUMERIC_FIELDS}
          getExtraToVerify={getAiExtraToVerify}
          getValues={(name) => getValues(name as keyof Experience2FormData)}
          setValue={setValueFromAi}
          selectedCategoryIds={categoryId ? [categoryId] : []}
          onApplyCategoryIds={applyAiCategoryIds}
          onApplyPracticalInfo={() => {}}
          isPracticalInfoEmpty={() => false}
          isEditMode={!!experienceId}
          onAddIncludes={handleAiIncludes}
          onAddExtras={handleAiExtras}
        />

        <div className="min-[1100px]:grid min-[1100px]:grid-cols-[170px_1fr_230px] min-[1100px]:gap-4 min-[1100px]:items-start">
          <FormSummaryNav sections={SUMMARY_SECTIONS} checklistItems={checklistItems} />

          <div className="space-y-2.5 min-w-0">
            {/* ═══════════════ Démarrer ═══════════════ */}
            <FormSection id="sec-demarrer" title="Démarrer" description="Type et catégorie">
              <div>
                <Label className="mb-3 block">
                  Catégorie <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {categories?.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      disabled={isSaving}
                      onClick={() => setValue("category_id", cat.id, { shouldValidate: true, shouldDirty: true })}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] border transition-colors",
                        categoryId === cat.id
                          ? "bg-[#1a1814] text-white border-[#1a1814]"
                          : "bg-white text-[#1a1814] border-[#e9e6e1] hover:border-[#1a1814]/40"
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
                {errors.category_id && <p className="text-destructive text-xs mt-2">{errors.category_id.message}</p>}
              </div>
            </FormSection>

            {/* ═══════════════ 1. L'essentiel ═══════════════ */}
            <FormSection id="sec-essentiel" title="1. L'essentiel" description="Ce qui s'affiche en haut de la fiche">
              <div className="space-y-4">
                <div className={cn("space-y-2", langHidden("en") && "hidden")}>
                  <Label htmlFor="title" className="flex items-center gap-1.5">
                    <span>🇬🇧</span> Titre (EN) <span className="text-destructive">*</span>
                  </Label>
                  <Input id="title" {...register("title")} placeholder="Ex: Weekend at the Sea" disabled={isSaving} />
                  {errors.title && <p className="text-destructive text-xs">{errors.title.message}</p>}
                </div>
                <div className={cn("space-y-2", langHidden("fr") && "hidden")}>
                  <Label htmlFor="title_fr" className="flex items-center gap-1.5">
                    <span>🇫🇷</span> Titre (FR)
                  </Label>
                  <Input id="title_fr" {...register("title_fr")} placeholder="Ex: Week-end au bord de la mer" disabled={isSaving} />
                </div>
                <div className={cn("space-y-2", langHidden("he") && "hidden")}>
                  <Label htmlFor="title_he" className="flex items-center gap-1.5">
                    <span>🇮🇱</span> כותרת (HE)
                  </Label>
                  <Input id="title_he" {...register("title_he")} placeholder="כותרת בעברית" dir="rtl" className="bg-hebrew-input" disabled={isSaving} />
                </div>
              </div>

              <div className="space-y-4">
                <div className={cn("space-y-2", langHidden("en") && "hidden")}>
                  <Label htmlFor="subtitle" className="flex items-center gap-1.5">
                    <span>🇬🇧</span> Sous-titre (EN)
                  </Label>
                  <Input id="subtitle" {...register("subtitle")} placeholder="Courte accroche" disabled={isSaving} />
                </div>
                <div className={cn("space-y-2", langHidden("fr") && "hidden")}>
                  <Label htmlFor="subtitle_fr" className="flex items-center gap-1.5">
                    <span>🇫🇷</span> Sous-titre (FR)
                  </Label>
                  <Input id="subtitle_fr" {...register("subtitle_fr")} placeholder="Courte accroche en français" disabled={isSaving} />
                </div>
                <div className={cn("space-y-2", langHidden("he") && "hidden")}>
                  <Label htmlFor="subtitle_he" className="flex items-center gap-1.5">
                    <span>🇮🇱</span> תת-כותרת (HE)
                  </Label>
                  <Input id="subtitle_he" {...register("subtitle_he")} placeholder="תת-כותרת בעברית" dir="rtl" className="bg-hebrew-input" disabled={isSaving} />
                </div>
              </div>

              <Separator />

              {/* Parcours & hôtels (bloc existant) */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium block">Parcours & hôtels</Label>
                  <p className="text-xs text-muted-foreground">
                    Multi-hôtel : ordonnez les étapes du séjour.{" "}
                    {experienceHotels.length > 0 && (
                      <span className="font-medium text-foreground">
                        {experienceHotels.length} hôtel(s) — Total {totalNights} nuit(s)
                      </span>
                    )}
                  </p>
                </div>
                {experienceHotels.length === 0 && (
                  <p className="text-[11px] text-muted-foreground italic py-2 text-center">
                    Aucun hôtel dans le parcours. Ajoutez-en au moins un ci-dessous.
                  </p>
                )}

                {experienceHotels.map((eh, index) => {
                  const hotel = hotels?.find((h) => h.id === eh.hotel_id);
                  return (
                    <div key={eh.hotel_id} className="flex items-center gap-2.5 p-2 rounded-[9px] border border-[#e9e6e1] bg-card">
                      <div className="flex flex-col items-center gap-1">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#1a1814] text-white text-[11px] font-bold">
                          {index + 1}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <button type="button" disabled={index === 0} onClick={() => moveHotel(index, "up")} className="p-0.5 rounded hover:bg-muted disabled:opacity-30">
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button type="button" disabled={index === experienceHotels.length - 1} onClick={() => moveHotel(index, "down")} className="p-0.5 rounded hover:bg-muted disabled:opacity-30">
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      {hotel?.hero_image && (
                        <img src={hotel.hero_image} alt={hotel.name || "Hotel"} className="w-11 h-11 rounded-md object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium truncate">{hotel?.name || "Unknown hotel"}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1">
                            <Label className="whitespace-nowrap">Nuits :</Label>
                            <Input
                              type="number"
                              min={1}
                              value={eh.nights}
                              onChange={(e) => updateHotelNights(index, parseInt(e.target.value) || 1)}
                              className="w-14"
                            />
                          </div>
                          <div className="flex items-center gap-1 flex-1">
                            <Label className="whitespace-nowrap">Notes :</Label>
                            <Input
                              value={eh.notes}
                              onChange={(e) => updateHotelNotes(index, e.target.value)}
                              placeholder="Ex: Arrivée, détente..."
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeHotelFromParcours(index)}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}

                <div className="flex gap-2 pt-2 border-t">
                  <Select value={hotelToAdd} onValueChange={setHotelToAdd}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Sélectionner un hôtel à ajouter..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableHotels?.map((hotel) => (
                        <SelectItem key={hotel.id} value={hotel.id}>{hotel.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" onClick={addHotelToParcours} disabled={!hotelToAdd}>
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter
                  </Button>
                </div>

                {experienceHotels.length === 0 && (
                  <p className="text-sm text-destructive">Au moins un hôtel est requis dans le parcours.</p>
                )}
              </div>

              <Separator />

              <div>
                <div className="grid grid-cols-2 gap-4 max-w-2xl">
                  <div>
                    <Label className="mb-2 block">Nuits min / max</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input id="min_nights" type="number" min={1} max={8} {...register("min_nights", { valueAsNumber: true })} placeholder="1" disabled={isSaving} />
                      <Input id="max_nights" type="number" min={1} max={8} {...register("max_nights", { valueAsNumber: true })} placeholder="4" disabled={isSaving} />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block">Participants min / max</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input id="min_party" type="number" min={1} max={100} {...register("min_party", { valueAsNumber: true })} placeholder="2" disabled={isSaving} />
                      <Input id="max_party" type="number" min={1} max={100} {...register("max_party", { valueAsNumber: true })} placeholder="4" disabled={isSaving} />
                    </div>
                    {(errors.min_party || errors.max_party) && (
                      <p className="text-destructive text-xs mt-1">Valeurs min/max invalides</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Points forts (badges) — par expérience */}
            <HighlightTagsSelector2
              experienceId={currentExperienceId || undefined}
              localTags={!currentExperienceId ? localTags : undefined}
              onLocalTagsChange={!currentExperienceId ? setLocalTags : undefined}
            />

              {/* Things to Know : durée, adresse, horaires, délai… */}
              {experienceId && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium block">Things to Know</Label>
                    <p className="text-xs text-muted-foreground mb-3">Durée, adresse, horaires et infos pratiques affichées aux voyageurs.</p>
                  <PracticalInfoManager
                    experienceId={experienceId}
                    experience={{
                      min_party: existingExperience?.min_party ?? watch("min_party"),
                      max_party: existingExperience?.max_party ?? watch("max_party"),
                      cancellation_policy: existingExperience?.cancellation_policy || watch("cancellation_policy") || undefined,
                      cancellation_policy_he: existingExperience?.cancellation_policy_he || watch("cancellation_policy_he") || undefined,
                      duration: existingExperience?.duration || undefined,
                      duration_he: existingExperience?.duration_he || undefined,
                      checkin_time: existingExperience?.checkin_time || undefined,
                      checkout_time: existingExperience?.checkout_time || undefined,
                      address: existingExperience?.address || undefined,
                      address_he: existingExperience?.address_he || undefined,
                      lead_time_days: existingExperience?.lead_time_days || undefined,
                    }}
                    hotelId={experienceHotels.length > 0 ? experienceHotels[0].hotel_id : undefined}
                  />
                  </div>
                </>
              )}
            </FormSection>

            {/* ═══════════════ 2. Le récit ═══════════════ */}
            <FormSection id="sec-recit" title="2. Le récit" description="Description, inclus, extras">
              <div className={cn("space-y-2", langHidden("en") && "hidden")}>
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

              <div className={cn("space-y-2", langHidden("fr") && "hidden")}>
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

              <div className={cn("space-y-2", langHidden("he") && "hidden")}>
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

              <Separator />

              <div>
                <Label className="text-sm font-medium mb-3 block">Le séjour comprend</Label>
                <p className="text-xs text-muted-foreground mb-3">Les éléments inclus dans cette expérience</p>
                <IncludesManager2
                  experienceId={currentExperienceId || undefined}
                  hotelIds={experienceHotels.map((h) => h.hotel_id)}
                  localIncludes={!currentExperienceId ? localIncludes : undefined}
                  onLocalIncludesChange={!currentExperienceId ? setLocalIncludes : undefined}
                />
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <Label className="text-sm font-medium block">Options & extras</Label>
                    <p className="text-xs text-muted-foreground">Extras que les voyageurs peuvent ajouter</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">{showExtras ? "Activés" : "Désactivés"}</span>
                    <Switch checked={showExtras} onCheckedChange={setShowExtras} />
                  </div>
                </div>
                {showExtras && (
                  <>
                  {currentExperienceId && experienceHotels.length > 0 ? (
                    <ExperienceExtrasSelector2
                      experienceId={currentExperienceId}
                      hotelIds={experienceHotels.map((h) => h.hotel_id)}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground italic text-center py-4">
                      {experienceHotels.length === 0 ? "Ajoutez au moins un hôtel au parcours." : "Disponible après la première sauvegarde."}
                    </p>
                  )}
                  </>
                )}
              </div>
            </FormSection>

            {/* ═══════════════ 3. Photos ═══════════════ */}
            <FormSection
              id="sec-photos"
              title="3. Photos"
              description={`${totalPhotosCount} photo${totalPhotosCount > 1 ? "s" : ""}${totalPhotosCount < 5 ? " · il en faut au moins 5" : ""}`}
            >
              {totalPhotosCount < 5 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#fff4d6] text-[#8a6100] text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Les fiches avec plusieurs photos convertissent mieux.
                </div>
              )}
                {/* Reload HyperGuest photos for hotels with HG link but no photos */}
                {(() => {
                  const hotelsWithHGNoPhotos = experienceHotels
                    .map((eh) => hotels?.find((x) => x.id === eh.hotel_id))
                    .filter((h) => h && h.hyperguest_property_id && (!h.photos || h.photos.length === 0) && !h.hero_image);
                  if (hotelsWithHGNoPhotos.length === 0) return null;
                  return (
                    <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800 flex-1">
                        {hotelsWithHGNoPhotos.length} hôtel(s) du parcours ont un lien HyperGuest mais aucune photo importée.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          for (const hotel of hotelsWithHGNoPhotos) {
                            if (!hotel) continue;
                            try {
                              const { data, error } = await supabase.functions.invoke("hyperguest", {
                                body: { action: "get-property", propertyId: Number(hotel.hyperguest_property_id) },
                              });
                              if (error) throw error;
                              const propertyData = data?.data || data;
                              const images = propertyData?.images || [];
                              if (images.length === 0) continue;
                              const photoUrls: string[] = [];
                              let heroUrl = "";
                              for (let i = 0; i < Math.min(images.length, 8); i++) {
                                const img = images[i];
                                const url = img.large || img.uri;
                                const fileName = buildImageFileName(hotel.name, "jpg");
                                const { data: dlData } = await supabase.functions.invoke("download-image", {
                                  body: { imageUrl: url, bucket: "hotel-images", path: fileName },
                                });
                                if (dlData?.publicUrl) {
                                  if (i === 0) heroUrl = dlData.publicUrl;
                                  else photoUrls.push(dlData.publicUrl);
                                }
                              }
                              await supabase.from("hotels2").update({
                                hero_image: heroUrl || undefined,
                                photos: photoUrls,
                              }).eq("id", hotel.id);
                            } catch (err) {
                              console.error(`Failed to import photos for hotel ${hotel.name}:`, err);
                            }
                          }
                          queryClient.invalidateQueries({ queryKey: ["admin-hotels2-list"] });
                          toast.success("Photos HyperGuest importées !");
                        }}
                      >
                        Importer les photos HyperGuest
                      </Button>
                    </div>
                  );
                })()}

                {/* Hotel Images from parcours */}
                {allParcoursImages.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Images depuis les hôtels (cliquer pour ajouter) — {allParcoursImages.length} image(s)
                    </Label>
                    <div className="grid grid-cols-6 gap-2 p-3 bg-muted/30 rounded-lg border">
                      {allParcoursImages.map((img, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            if (!heroImagePreview) {
                              setHeroImagePreview(img);
                            } else if (!galleryPreviews.includes(img) && galleryPreviews.length < 8) {
                              setGalleryPreviews((prev) => [...prev, img]);
                            }
                          }}
                          className={cn(
                            "relative aspect-square rounded-md overflow-hidden border-2 transition-all hover:border-primary",
                            heroImagePreview === img || galleryPreviews.includes(img)
                              ? "border-primary opacity-50"
                              : "border-transparent"
                          )}
                        >
                          <img src={img} alt={`Hotel image ${index + 1}`} className="w-full h-full object-cover" />
                          {(heroImagePreview === img || galleryPreviews.includes(img)) && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <span className="text-xs font-medium text-primary-foreground bg-primary px-1.5 py-0.5 rounded">Ajouté</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Hero Image – styled drop zone */}
                <div>
                  <Label className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Photo de couverture de l'expérience
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Grande image affichée en haut de la fiche. Si vide, la photo de l'hôtel sera utilisée automatiquement.
                  </p>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleHeroDrop}
                    className="border-2 border-dashed rounded-lg p-4 transition-colors hover:border-primary/50"
                  >
                    <div className="grid grid-cols-2 gap-4 items-center">
                      {/* Colonne gauche : aperçu */}
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
                        ) : firstHotel?.hero_image ? (
                          <>
                            <img src={firstHotel.hero_image} alt="Photo hôtel (défaut)" className="w-full h-full object-cover opacity-50" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-medium bg-background/80 px-2 py-1 rounded-full">Photo de l'hôtel</span>
                            </div>
                          </>
                        ) : (
                          <div className="h-full flex items-center justify-center text-muted-foreground/40 text-xs">Aucune photo</div>
                        )}
                      </div>

                      {/* Colonne droite : actions */}
                      <div className="space-y-3">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 text-sm rounded-md border bg-background hover:bg-muted transition-colors w-full justify-center">
                          <Upload className="h-4 w-4" />
                          {heroImagePreview ? "Changer la photo" : "Choisir une photo"}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleHeroImageChange(e.target.files?.[0] || null)} />
                        </label>
                        <p className="text-xs text-muted-foreground text-center">ou glisser-déposer ici</p>
                        <p className="text-xs text-muted-foreground text-center">1600×900px min · max 5MB</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gallery – styled drop zone with position numbers */}
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
                        {/* Position number */}
                        <span className="absolute top-1 left-1 bg-foreground/80 text-background text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                          {index + 1}
                        </span>
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => { setHeroImagePreview(preview); }}
                            className="bg-secondary text-secondary-foreground rounded-full p-1"
                            title="Définir comme couverture"
                          >
                            <Star className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(index)}
                            className="bg-destructive text-destructive-foreground rounded-full p-1"
                            title="Supprimer"
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
            </FormSection>

            {/* ═══════════════ 4. Prix & dispo ═══════════════ */}
            <FormSection id={PRICING_SECTION_ID} title="4. Prix & dispo" description="Tarification, promo et disponibilités">
              {/* Tarification : blocs existants, inchangés, seulement déplacés */}
              <Card>
                <CardHeader>
                  <CardTitle>Tarification</CardTitle>
                  <CardDescription>Paramétrez les tarifs chambre et expérience, puis simulez votre commission</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                {/* ── Bloc tête : Pension préférée — pilote tous les filtres HyperGuest ── */}
                <div className="rounded-[9px] border border-[#e9e6e1] bg-[#faf8f6] p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <Label htmlFor="preferred_board_type" className="text-sm font-semibold">
                      Pension affichée en priorité
                    </Label>
                  </div>
                  <Controller
                    name="preferred_board_type"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? "none"}
                        onValueChange={(val) =>
                          field.onChange(
                            val === "none"
                              ? null
                              : (val as "RO" | "BB" | "HB" | "FB" | "AI"),
                          )
                        }
                        disabled={isSaving}
                      >
                        <SelectTrigger id="preferred_board_type">
                          <SelectValue placeholder="Le moins cher (par défaut)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Le moins cher (par défaut)</SelectItem>
                          <SelectItem value="BB">Petit-déjeuner inclus (BB)</SelectItem>
                          <SelectItem value="RO">Chambre seule (RO)</SelectItem>
                          <SelectItem value="HB">Demi-pension (HB)</SelectItem>
                          <SelectItem value="FB">Pension complète (FB)</SelectItem>
                          <SelectItem value="AI">Tout inclus (AI)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Pilote toute la tarification : les chiffres HyperGuest affichés ci-dessous,
                    les aperçus de prix, et les chambres réservables côté client.
                    Si la pension choisie n'est pas dispo pour des dates → l'expérience
                    apparaît "indisponible aux dates choisies".
                  </p>
                </div>

                  <InternalOnlyBox>
                {/* ── Bloc 0 : Indicatif HyperGuest ── */}
                <div className="rounded-[9px] bg-white border border-[#dbe3ea] p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium text-sm">Données HyperGuest — indicatif 30 jours</p>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs gap-1.5 h-7"
                            disabled={!primaryHyperguestId || isLoadingBarRate || isSaving}
                            onClick={() => setBarRateRefreshEnabled(true)}
                          >
                            {isLoadingBarRate ? (
                              <><Loader2 className="h-3 w-3 animate-spin" />Chargement...</>
                            ) : (
                              <><TrendingUp className="h-3 w-3" />Charger HyperGuest</>
                            )}
                          </Button>
                        </TooltipTrigger>
                        {!primaryHyperguestId && (
                          <TooltipContent>
                            <p>Aucun hôtel HyperGuest associé au parcours</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {minBarRatePublic !== null && minNetRate !== null ? (
                    <div className="rounded bg-background border px-3 py-2 space-y-1 text-xs">
                      {(() => {
                        const minDiffILS = minBarRatePublic - minNetRate;
                        const minDiffPct = minBarRatePublic > 0 ? (minDiffILS / minBarRatePublic) * 100 : null;
                        const maxDiffILS = maxBarRatePublic !== null && maxNetRate !== null ? maxBarRatePublic - maxNetRate : null;
                        const maxDiffPct = maxDiffILS !== null && maxBarRatePublic !== null && maxBarRatePublic > 0 ? (maxDiffILS / maxBarRatePublic) * 100 : null;
                        return (
                          <>
                            <div className="grid grid-cols-5 gap-2 text-muted-foreground font-medium pb-1 border-b">
                              <span></span>
                              <span className="text-center">BAR Rate</span>
                              <span className="text-center">Net Rate</span>
                              <span className="text-center">Diff ₪</span>
                              <span className="text-center">Diff %</span>
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                              <span className="text-muted-foreground">Min</span>
                              <span className="text-center font-medium">{minBarRatePublic.toFixed(0)} ₪</span>
                              <span className="text-center font-medium">{minNetRate.toFixed(0)} ₪</span>
                              <span className="text-center font-medium">{minDiffILS.toFixed(0)} ₪</span>
                              <span className="text-center font-medium">{minDiffPct !== null ? `${minDiffPct.toFixed(1)} %` : "—"}</span>
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                              <span className="text-muted-foreground">Max</span>
                              <span className="text-center font-medium">{maxBarRatePublic !== null ? maxBarRatePublic.toFixed(0) : "—"} ₪</span>
                              <span className="text-center font-medium">{maxNetRate !== null ? maxNetRate.toFixed(0) : "—"} ₪</span>
                              <span className="text-center font-medium">{maxDiffILS !== null ? `${maxDiffILS.toFixed(0)} ₪` : "—"}</span>
                              <span className="text-center font-medium">{maxDiffPct !== null ? `${maxDiffPct.toFixed(1)} %` : "—"}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    !isLoadingBarRate && (
                      <p className="text-xs text-muted-foreground italic">
                        Clique sur « Charger HyperGuest » pour voir les tarifs indicatifs.
                      </p>
                    )
                  )}

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Tarifs indicatifs sur les 30 prochains jours. Le Net Rate réel dépend de la date choisie par le client au moment de la réservation.
                  </p>
                </div>

                {/* ── MODÈLE STANDARD ── */}
                {/* ── Bloc 1 : Chambre ── */}
                <div className="rounded-[9px] border border-[#dbe3ea] bg-white p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-sm">Chambre</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label htmlFor="room_net_rate" className="text-xs font-medium">Net Rate par nuit (ce que je paie)</Label>
                      <div className="relative">
                        <Input
                          id="room_net_rate"
                          type="number"
                          min="0"
                          step="0.01"
                          {...register("room_net_rate", { valueAsNumber: true })}
                          placeholder="0"
                          disabled={isSaving}
                          className="pr-10"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₪</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Chargé depuis HyperGuest ou saisi manuellement</p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Markup chambre</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...register("bar_rate_markup_value", { valueAsNumber: true })}
                            placeholder="0"
                            disabled={isSaving}
                          />
                        </div>
                        <Controller
                          name="bar_rate_markup_is_pct"
                          control={control}
                          render={({ field }) => (
                            <Select
                              value={field.value ? "pct" : "fixed"}
                              onValueChange={(val) => field.onChange(val === "pct")}
                              disabled={isSaving}
                            >
                              <SelectTrigger className="w-[90px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pct">%</SelectItem>
                                <SelectItem value="fixed">₪ fixe</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Bloc 2 : Expérience ── */}
                <div className="rounded-[9px] border border-[#dbe3ea] bg-white p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-sm">Expérience <span className="text-xs font-normal text-muted-foreground ml-1">— remplis l'un ou l'autre</span></p>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-start">

                    {/* Mode A : Par séjour */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Par séjour</p>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label htmlFor="experience_cost_fixed" className="text-xs">Coût (ce que je paie)</Label>
                          <div className="relative">
                            <Input
                              id="experience_cost_fixed"
                              type="number"
                              min="0"
                              step="0.01"
                              {...register("experience_cost_fixed", { valueAsNumber: true })}
                              placeholder="0"
                              disabled={isSaving}
                              className="pr-8"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₪</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="experience_sell_fixed" className="text-xs">Prix vendu</Label>
                          <div className="relative">
                            <Input
                              id="experience_sell_fixed"
                              type="number"
                              min="0"
                              step="0.01"
                              {...register("experience_sell_fixed", { valueAsNumber: true })}
                              placeholder="0"
                              disabled={isSaving}
                              className="pr-8"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₪</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Séparateur OU vertical */}
                    <div className="flex flex-col items-center self-stretch pt-5 gap-1">
                      <div className="flex-1 border-l border-dashed" />
                      <span className="text-[11px] font-bold text-muted-foreground py-1">OU</span>
                      <div className="flex-1 border-l border-dashed" />
                    </div>

                    {/* Mode B : Par personne */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Par personne</p>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label htmlFor="experience_cost_per_person" className="text-xs">Coût (ce que je paie)</Label>
                          <div className="relative">
                            <Input
                              id="experience_cost_per_person"
                              type="number"
                              min="0"
                              step="0.01"
                              {...register("experience_cost_per_person", { valueAsNumber: true })}
                              placeholder="0"
                              disabled={isSaving}
                              className="pr-8"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₪</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="experience_sell_per_person" className="text-xs">Prix vendu</Label>
                          <div className="relative">
                            <Input
                              id="experience_sell_per_person"
                              type="number"
                              min="0"
                              step="0.01"
                              {...register("experience_sell_per_person", { valueAsNumber: true })}
                              placeholder="0"
                              disabled={isSaving}
                              className="pr-8"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₪</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* ── Taxes (repliable) ── */}
                <div className="rounded-[9px] bg-white border border-[#dbe3ea] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setTaxesOpen((o) => !o)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium text-sm">Taxes</p>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", taxesOpen && "rotate-180")} />
                  </button>
                  {taxesOpen && (
                    <div className="px-4 pb-4">
                      <Experience2AddonsManager
                        experienceId={currentExperienceId}
                        disabled={isSaving}
                        localAddons={localAddons}
                        onLocalAddonsChange={setLocalAddons}
                        addonTypes={TAX_TYPES}
                        sectionTitle="Taxes"
                        sectionDescription="VAT and applicable taxes (default 18%)"
                      />
                    </div>
                  )}
                </div>

                {/* ── Bloc 3 : Simulateur ── */}
                {(() => {
                  const roomNetRate = watch("room_net_rate") || 0;
                  const markupValue = watch("bar_rate_markup_value") || 0;
                  const markupIsPct = watch("bar_rate_markup_is_pct") ?? true;
                  const costFixed = watch("experience_cost_fixed") || 0;
                  const costPerPerson = watch("experience_cost_per_person") || 0;
                  const sellFixed = watch("experience_sell_fixed") || 0;
                  const sellPerPerson = watch("experience_sell_per_person") || 0;
                  const maxParty = watch("max_party") || 10;

                  const markupAmount = markupIsPct ? roomNetRate * markupValue / 100 : markupValue;
                  const netChambre = roomNetRate * simulatorNights;
                  const markupChambre = markupAmount * simulatorNights;
                  const coutExperience = costFixed + costPerPerson * simulatorGuests;
                  const prixVenduExp = sellFixed + sellPerPerson * simulatorGuests;
                  const prixClientTotal = (roomNetRate + markupAmount) * simulatorNights + sellFixed + sellPerPerson * simulatorGuests;
                  const commission = prixClientTotal - netChambre - coutExperience;
                  const margePercent = prixClientTotal > 0 ? (commission / prixClientTotal) * 100 : 0;
                  const hasData = roomNetRate > 0 || costFixed > 0 || costPerPerson > 0 || sellFixed > 0 || sellPerPerson > 0;

                  // ── Prix plancher (parité tarifaire HyperGuest) ──
                  // Règle contractuelle : le prix chambre facturé au client ne doit
                  // jamais descendre sous le prix public de l'hôtel (BAR). Back-office
                  // uniquement — jamais exposé côté client.
                  const barFloorRoom = minBarRatePublic !== null ? minBarRatePublic * simulatorNights : null;
                  const clientRoomPrice = (roomNetRate + markupAmount) * simulatorNights;
                  const belowParity = barFloorRoom !== null && clientRoomPrice < barFloorRoom - 0.5;

                  return (
                    <div className="rounded-[9px] border border-[#dbe3ea] bg-white p-3 space-y-3">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-primary" />
                        <p className="font-semibold text-sm">Simulateur</p>
                      </div>

                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs font-medium">Nb de nuits</Label>
                            <span className="text-sm font-bold">{simulatorNights}</span>
                          </div>
                          <Slider
                            min={1}
                            max={7}
                            step={1}
                            value={[simulatorNights]}
                            onValueChange={([v]) => setSimulatorNights(v)}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs font-medium">Nb de guests</Label>
                            <span className="text-sm font-bold">{simulatorGuests}</span>
                          </div>
                          <Slider
                            min={1}
                            max={Math.max(maxParty, 1)}
                            step={1}
                            value={[simulatorGuests]}
                            onValueChange={([v]) => setSimulatorGuests(v)}
                          />
                        </div>
                      </div>

                      {hasData ? (
                        <div className="rounded-lg bg-muted/40 p-4 space-y-1.5 text-sm border-t">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Net Rate chambre × {simulatorNights} nuit{simulatorNights > 1 ? "s" : ""}</span>
                            <span className="font-medium text-foreground">{netChambre.toFixed(0)} ₪</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Markup chambre × {simulatorNights} nuit{simulatorNights > 1 ? "s" : ""}</span>
                            <span className="font-medium text-foreground">{markupChambre.toFixed(0)} ₪</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Prix vendu expérience × {simulatorGuests} guest{simulatorGuests > 1 ? "s" : ""}</span>
                            <span className="font-medium text-foreground">{prixVenduExp.toFixed(0)} ₪</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-semibold">
                            <span>Prix client total</span>
                            <span className="text-primary text-base">{prixClientTotal.toFixed(0)} ₪</span>
                          </div>
                          <div className="flex justify-between font-semibold">
                            <span>Ma commission nette</span>
                            <span className={cn("text-base font-bold", commission >= 0 ? "text-green-600" : "text-destructive")}>
                              {commission.toFixed(0)} ₪
                            </span>
                          </div>
                          <div className="flex justify-between text-muted-foreground text-xs">
                            <span>Marge</span>
                            <span className={cn("font-medium", commission >= 0 ? "text-green-600" : "text-destructive")}>
                              {margePercent.toFixed(1)} %
                            </span>
                          </div>

                          {/* ── Indicateur prix minimum (parité BAR) — back-office uniquement ── */}
                          <Separator />
                          {barFloorRoom !== null ? (
                            <div className={cn(
                              "rounded-md border p-3 space-y-1.5",
                              belowParity ? "border-destructive/40 bg-destructive/5" : "border-green-600/30 bg-green-600/5",
                            )}>
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-medium flex items-center gap-1.5">
                                  {belowParity
                                    ? <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                                    : <Check className="h-3.5 w-3.5 text-green-600" />}
                                  Prix chambre minimum (parité hôtel)
                                </span>
                                <span className="text-sm font-bold">{barFloorRoom.toFixed(0)} ₪</span>
                              </div>
                              <div className="flex justify-between items-center text-xs text-muted-foreground">
                                <span>Ton prix chambre actuel</span>
                                <span className={cn("font-medium", belowParity ? "text-destructive" : "text-green-600")}>
                                  {clientRoomPrice.toFixed(0)} ₪
                                </span>
                              </div>
                              <p className={cn("text-[11px] leading-snug", belowParity ? "text-destructive" : "text-muted-foreground")}>
                                {belowParity
                                  ? "⚠ Tu vends la chambre sous le prix public de l'hôtel. La parité tarifaire HyperGuest est enfreinte : augmente ton markup."
                                  : "Prix public de l'hôtel sur les 30 prochains jours. Tu dois toujours rester au-dessus de ce plancher."}
                              </p>
                            </div>
                          ) : (
                            <p className="text-[11px] text-muted-foreground italic">
                              Prix plancher indisponible — charge les tarifs HyperGuest pour connaître le prix public minimum.
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic text-center py-2">
                          Remplis les champs Chambre et Expérience pour voir la simulation.
                        </p>
                      )}
                    </div>
                  );
                })()}
                  </InternalOnlyBox>
                </CardContent>
              </Card>

              {/* Promo & dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Promo & dates
                  </CardTitle>
                  <CardDescription>Réductions promotionnelles et dates disponibles prédéfinies</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                <div>
                  <p className="font-medium text-sm mb-3">Type de promo</p>
                  {/* « Faux prix barré » n'est plus proposé. Une fiche qui l'aurait encore
                      garde sa valeur (rien n'est modifié tant qu'on ne choisit pas autre chose). */}
                  {watch("promo_type") === "fake_markup" && (
                    <div className="flex items-center gap-2 p-3 mb-3 rounded-lg bg-[#fff4d6] text-[#8a6100] text-sm">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      Type de promo non conforme, choisissez une remise réelle.
                    </div>
                  )}
                  <div className="flex items-end gap-3">
                    <div className="w-[200px] shrink-0">
                      <Label className="text-xs">Type</Label>
                      <Controller
                        name="promo_type"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value || "none"} onValueChange={field.onChange} disabled={isSaving}>
                            <SelectTrigger>
                              <SelectValue placeholder="Aucune" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Aucune promo</SelectItem>
                              <SelectItem value="real_discount">Remise réelle</SelectItem>
                              {field.value === "fake_markup" && (
                                <SelectItem value="fake_markup" disabled>Faux prix barré (non conforme)</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>

                    {watch("promo_type") && watch("promo_type") !== "none" && (
                      <>
                        <div className="w-[120px] shrink-0">
                          <Label htmlFor="promo_value" className="text-xs">Valeur</Label>
                          <Input
                            id="promo_value"
                            type="number"
                            min="0"
                            step="0.1"
                            {...register("promo_value", { valueAsNumber: true })}
                            placeholder={watch("promo_type") === "real_discount" ? "10" : "20"}
                            disabled={isSaving}
                          />
                        </div>
                        {watch("promo_type") === "real_discount" && (
                          <div className="w-[180px] shrink-0">
                            <Label className="text-xs">Mode</Label>
                            <Controller
                              name="promo_is_percentage"
                              control={control}
                              render={({ field }) => (
                                <Select
                                  value={field.value ? "percentage" : "fixed"}
                                  onValueChange={(val) => field.onChange(val === "percentage")}
                                  disabled={isSaving}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                                    <SelectItem value="fixed">Montant fixe (₪)</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                  <div className="border-t pt-6">
                    <p className="font-medium text-sm mb-3">Dates disponibles</p>
                    <DateOptionsManager experienceId={currentExperienceId} disabled={isSaving} />
                  </div>
                </CardContent>
              </Card>

              {/* Disponibilité */}
              {experienceId && (
                <Card>
                  <CardHeader>
                    <CardTitle>Disponibilité</CardTitle>
                    <CardDescription>
                      Définissez les contraintes temporelles de cette expérience (jours, périodes, dates ponctuelles ou bloquées).
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AvailabilityRulesManager experienceId={experienceId} />
                  </CardContent>
                </Card>
              )}

              {/* Aperçu Prix & Disponibilités */}
              {experienceHotels.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Aperçu Prix & Disponibilités</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                  {experienceHotels.map((eh, index) => {
                    const hotel = hotels?.find((h) => h.id === eh.hotel_id);
                    if (!hotel) return null;
                    return (
                      <div key={eh.hotel_id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">{index + 1}</span>
                          <span className="font-medium">{hotel.name}</span>
                          <span className="text-sm text-muted-foreground">— {eh.nights} nuit{eh.nights > 1 ? "s" : ""}</span>
                        </div>
                        <ExperienceAvailabilityPreview
                          hyperguestPropertyId={hotel.hyperguest_property_id != null ? String(hotel.hyperguest_property_id) : null}
                          hotelName={hotel.name}
                          experienceId={currentExperienceId ?? null}
                          currency="ILS"
                          lang="en"
                          nights={eh.nights}
                          minParty={watch("min_party") || 1}
                          maxParty={watch("max_party") || 20}
                          preferredBoardType={preferredBoardType}
                          onPriceChange={(price) => setHotelRoomPrices((prev) => ({ ...prev, [eh.hotel_id]: price }))}
                        />
                      </div>
                    );
                  })}

                  {(() => {
                    const pricesArr = experienceHotels.map((eh) => hotelRoomPrices[eh.hotel_id]);
                    const validPrices = pricesArr.filter((p): p is number => p != null && p > 0);
                    if (validPrices.length === 0) return null;
                    const combinedTotal = validPrices.reduce((s, p) => s + p, 0);
                    return (
                      <Card className="border-primary/30 bg-primary/5">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Prix Total du Parcours</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {experienceHotels.map((eh) => {
                            const hotel = hotels?.find((h) => h.id === eh.hotel_id);
                            const price = hotelRoomPrices[eh.hotel_id];
                            return (
                              <div key={eh.hotel_id} className="flex justify-between items-center text-sm">
                                <span>{hotel?.name ?? "Hôtel"} ({eh.nights} nuit{eh.nights > 1 ? "s" : ""})</span>
                                <span className="font-medium">
                                  {price != null && price > 0
                                    ? `₪${price.toLocaleString("en-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : "—"}
                                </span>
                              </div>
                            );
                          })}
                          <div className="border-t pt-2 flex justify-between items-center font-bold text-base">
                            <span>Total Parcours</span>
                            <span>₪{combinedTotal.toLocaleString("en-IL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}
                  </CardContent>
                </Card>
              )}
            </FormSection>

            {/* ═══════════════ 5. Conditions ═══════════════ */}
            <FormSection id="sec-conditions" title="5. Conditions" description="Politique d'annulation de l'expérience (3 langues)">
              <CancellationPolicyFields
                template={cancellationTemplate}
                onSelectTemplate={selectCancellationTemplate}
                registerField={register}
                langHidden={langHidden}
                disabled={isSaving}
              />
            </FormSection>

            {/* ═══════════════ 6. Publication ═══════════════ */}
            <FormSection id="sec-publication" title="6. Publication" description="Slug, mise en avant, SEO" defaultOpen={false}>
              <PublicationFields
                slug={(currentExperienceId && existingExperience?.slug) || generateSlug(title || "")}
                slugHelp={
                  currentExperienceId && existingExperience?.slug
                    ? "Défini à la création de l'expérience, il ne change plus ensuite"
                    : undefined
                }
                featuredOnHome={featuredOnHome}
                onFeaturedOnHomeChange={setFeaturedOnHome}
                homeDisplayOrder={homeDisplayOrder}
                onHomeDisplayOrderChange={setHomeDisplayOrder}
              />

              <Separator />

              <SeoFields
                registerField={register}
                values={{
                  seo_title_en: seoTitleEn,
                  seo_title_fr: watch("seo_title_fr"),
                  seo_title_he: watch("seo_title_he"),
                  meta_description_en: watch("meta_description_en"),
                  meta_description_fr: watch("meta_description_fr"),
                  meta_description_he: watch("meta_description_he"),
                }}
                langHidden={langHidden}
                onGenerateSeo={handleGenerateSeo}
                isGeneratingSeo={isGeneratingSeo}
                disabled={isSaving}
              />

              <Separator />

              {/* Avis */}
            <ReviewsManager2
              experienceId={currentExperienceId || undefined}
              localReviews={!currentExperienceId ? localReviews : undefined}
              onLocalReviewsChange={!currentExperienceId ? setLocalReviews : undefined}
            />

              {experienceId && (
                <>
                  <Separator />
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSaving}
                    className="text-[11px] text-[#6f6a63] underline hover:text-destructive"
                  >
                    Supprimer l'expérience
                  </button>
                </>
              )}
            </FormSection>
          </div>

          {/* Aperçu en direct */}
          <FormPreviewAside
            heroImage={heroImagePreview || firstHotel?.hero_image || null}
            title={title || ""}
            subtitle={subtitleEn || ""}
            checklistItems={checklistItems}
          >
            <ul className="space-y-1 text-xs text-[#1a1814]">
              <li className="flex items-center gap-1.5">
                <Moon className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> {nightsLabel}
              </li>
              <li className="flex items-center gap-1.5">
                <Utensils className="h-3.5 w-3.5 text-muted-foreground shrink-0" />{" "}
                {preferredBoardType ? BOARD_LABELS[preferredBoardType] : "Pension la moins chère"}
              </li>
              <li className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> {watch("min_party")} à {watch("max_party")} pers.
              </li>
            </ul>
            {includesForPreview.length > 0 && (
              <div className="border-t border-[#e9e6e1] pt-2">
                <p className="text-[10px] uppercase tracking-[0.04em] text-[#6f6a63] font-medium mb-1">Le séjour comprend</p>
                <ul className="space-y-0.5 text-xs text-[#1a1814]">
                  {includesForPreview.map((inc, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <Check className="h-3 w-3 mt-0.5 text-[#1f7a4d] shrink-0" /> {inc.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </FormPreviewAside>
        </div>

        {/* Checklist "Avant de publier" — visible sous le formulaire sur écran étroit */}
        <PublishChecklist items={checklistItems} variant="top" />
      </form>

      {/* ── Sticky bottom save bar (mobile) ── */}
      {isMobile && (
        <FormMobileSaveBar
          onSaveDraft={handleSubmit(handleSaveDraft, onInvalidSubmit)}
          onPublish={handleSubmit(handlePublish, onInvalidSubmit)}
          canPublish={!!canPublish}
          busy={isSaving || heroImageUploading}
        />
      )}

      {/* Delete Confirmation – requires typing experience name */}
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
