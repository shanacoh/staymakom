/**
 * AiDraftPanel, Sprint 5A.
 * Panneau « Générer avec l'IA » : à partir de notes, d'un lien et/ou d'un PDF, appelle la fonction
 * serveur generate-experience-draft et applique le brouillon reçu aux champs du formulaire.
 * Composant autonome : il ne connaît rien du formulaire au-delà des callbacks qu'on lui passe,
 * pour pouvoir être réutilisé tel quel sur le formulaire hôtel (sprint 5C).
 *
 * Règles strictes (voir docs/claude/sprint5a-generer-avec-ia.md) : ne remplit jamais prix,
 * disponibilités, prestataire ; ne publie rien, ne touche à aucune donnée tant que Shana n'enregistre
 * pas elle-même le formulaire comme d'habitude.
 */

import { forwardRef, useImperativeHandle, useRef, useState, type Ref } from "react";
import { Button, Input, Label, Textarea } from "@/components/forms/styled";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Sparkles, Loader2, Upload, X, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { safeTrack } from "@/lib/amplitude";
import { cn } from "@/lib/utils";

export interface AiIncludeDraft {
  title: string;
  title_fr: string;
  title_he: string;
}

export interface AiExtraDraft extends AiIncludeDraft {
  description: string;
}

export interface AiPracticalInfoDraft {
  kids: { status: "yes" | "no" | null; from_age: number | null };
  kosher: "yes" | "no" | "not_relevant" | null;
  parking: { status: "yes" | "no" | null };
}

interface AiDraftFields {
  [key: string]: unknown;
}

export interface AiBadgeDraft {
  id: string;
  label: string;
}

/** Un texte hors des champs simples (ex. un onglet de mood) que « Traduire tout » doit aussi traduire. */
export interface AiTranslationItem {
  key: string;
  fr: string;
  en: string;
  he: string;
}

export type AiTranslationResult = Record<string, { en?: string; he?: string }>;

export interface AiExperienceDraft extends AiDraftFields {
  title: string;
  category_id: string | null;
  category_ids: string[];
  category_slugs: string[];
  /** Expérience seule : région de la liste, badges existants et photo de couverture proposés par l'IA. */
  region_id?: string | null;
  badges?: AiBadgeDraft[];
  cover_image?: string | null;
  includes: AiIncludeDraft[];
  extras: AiExtraDraft[];
  practical_info: AiPracticalInfoDraft;
}

// Champs texte/numériques simples, appliqués directement sur le formulaire par leur nom.
// Les listes (includes/extras) et les structures (catégories, infos pratiques) sont gérées à part.
const SIMPLE_FIELDS = [
  "title", "title_fr", "title_he",
  "subtitle", "subtitle_fr", "subtitle_he",
  "long_copy", "long_copy_fr", "long_copy_he",
  "duration", "duration_fr", "duration_he",
  "city", "city_fr", "city_he",
  "region", "region_fr", "region_he",
  "address", "address_fr", "address_he",
  "google_maps_link",
  "accessibility_info", "accessibility_info_fr", "accessibility_info_he",
  "cancellation_policy", "cancellation_policy_fr", "cancellation_policy_he",
  "meeting_point", "meeting_point_fr", "meeting_point_he",
  "know_before_you_go", "know_before_you_go_fr", "know_before_you_go_he",
  "contingency_note", "contingency_note_fr", "contingency_note_he",
  "seo_title_en", "seo_title_fr", "seo_title_he",
  "meta_description_en", "meta_description_fr", "meta_description_he",
  "og_title_en", "og_title_fr", "og_title_he",
  "og_description_en", "og_description_fr", "og_description_he",
] as const;

// Champs d'après-réservation, ajoutés pour l'expérience seule. Un formulaire qui n'a pas cette section
// (bateaux) passe AI_TEXT_FIELDS_WITHOUT_AFTER_BOOKING dans allowedFields.
const AFTER_BOOKING_FIELDS: readonly string[] = [
  "meeting_point", "meeting_point_fr", "meeting_point_he",
  "know_before_you_go", "know_before_you_go_fr", "know_before_you_go_he",
  "contingency_note", "contingency_note_fr", "contingency_note_he",
];
export const AI_TEXT_FIELDS_WITHOUT_AFTER_BOOKING: readonly string[] = SIMPLE_FIELDS.filter((f) => !AFTER_BOOKING_FIELDS.includes(f));

// Champs numériques sans valeur par défaut : remplis s'ils sont vides, comme un champ texte.
const EMPTYABLE_NUMERIC_FIELDS = ["arrive_minutes_before"] as const;

// Champs numériques que certains formulaires acceptent (voir la prop numericFields).
const isValidNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

const isFilled = (v: unknown): boolean => typeof v === "string" && v.trim().length > 0;

// Champs traduits par "Traduire tout" (étape 4) : la source est le champ FR, les cibles EN et HE.
const TRANSLATE_FIELD_MAP = [
  { fr: "title_fr", en: "title", he: "title_he" },
  { fr: "subtitle_fr", en: "subtitle", he: "subtitle_he" },
  { fr: "long_copy_fr", en: "long_copy", he: "long_copy_he" },
  { fr: "duration_fr", en: "duration", he: "duration_he" },
  { fr: "city_fr", en: "city", he: "city_he" },
  { fr: "region_fr", en: "region", he: "region_he" },
  { fr: "address_fr", en: "address", he: "address_he" },
  { fr: "cancellation_policy_fr", en: "cancellation_policy", he: "cancellation_policy_he" },
  { fr: "accessibility_info_fr", en: "accessibility_info", he: "accessibility_info_he" },
  { fr: "meeting_point_fr", en: "meeting_point", he: "meeting_point_he" },
  { fr: "know_before_you_go_fr", en: "know_before_you_go", he: "know_before_you_go_he" },
  { fr: "contingency_note_fr", en: "contingency_note", he: "contingency_note_he" },
] as const;

const emptyDraft = (overrides: Partial<AiExperienceDraft>): AiExperienceDraft => ({
  title: "",
  category_id: null,
  category_ids: [],
  category_slugs: [],
  includes: [],
  extras: [],
  practical_info: { kids: { status: null, from_age: null }, kosher: null, parking: { status: null } },
  ...overrides,
});

export interface AiDraftPanelHandle {
  /** Traduit les champs texte simples déjà remplis en français vers EN/HE (bouton "Traduire tout" du header). */
  translateAll: () => Promise<void>;
  /** Nombre d'éléments "À vérifier" renvoyés par la dernière génération IA, pas encore cochés (sprint 5B, checklist). */
  getUnreviewedAiCount: () => number;
  /** Une autre action IA du formulaire (ex. « Réécrire pour ce mood ») vient de remplir des champs : affiche le bandeau et ajoute ses lignes « À vérifier ». */
  notifyAiFilled: (toVerifyLines?: string[]) => void;
}

/** Ce que le panneau transmet pour faire écrire la version des autres moods proposés. */
export interface AiMoodVersionsRequest {
  /** Les moods cochés après application du brouillon, le principal en premier. */
  selectedIds: string[];
  /** Les moods proposés par l'IA. */
  proposedIds: string[];
  /** true = « Remplacer » : une version déjà personnalisée est réécrite. */
  replace: boolean;
  draft: AiExperienceDraft;
}

interface Props {
  /** Type de fiche : choisit les consignes de rédaction côté serveur (expérience seule par défaut). */
  experienceType?: "standalone" | "hotel";
  /**
   * Champs texte que ce formulaire possède vraiment. Omis = tous (expérience seule). Le formulaire
   * hôtel n'a ni ville, ni adresse, ni durée : l'IA ne doit pas y poser de valeur fantôme.
   */
  allowedFields?: readonly string[];
  /** Champs numériques à appliquer (ex. participants, nuits) : uniquement quand rien n'est en conflit ou sur « Remplacer ». */
  numericFields?: readonly string[];
  /** Lignes ajoutées à « À vérifier » pour ce que l'IA a trouvé mais que le formulaire ne peut pas recevoir. */
  getExtraToVerify?: (draft: AiExperienceDraft) => string[];
  getValues: (name: string) => unknown;
  setValue: (name: string, value: unknown, options?: { shouldDirty?: boolean; shouldValidate?: boolean }) => void;
  selectedCategoryIds: string[];
  /** Coche les moods proposés. Peut renvoyer la liste finale (principal en premier) si elle diffère de celle reçue. */
  onApplyCategoryIds: (ids: string[]) => string[] | void;
  onApplyPracticalInfo: (info: AiPracticalInfoDraft) => void;
  isPracticalInfoEmpty: () => boolean;
  /** Mode création : les inclus/extras sont ajoutés tout de suite (listes locales, rien en base). */
  isEditMode: boolean;
  onAddIncludes: (items: AiIncludeDraft[]) => void;
  onAddExtras: (items: AiExtraDraft[]) => void;

  // ── Expérience seule (chantier Offre, prompt 3). Sans ces props, le panneau se comporte comme avant. ──
  /** Photos de la fiche à montrer à l'IA pour proposer une couverture. Vide si la fiche en a déjà une. */
  getCoverCandidates?: () => string[];
  onApplyCoverImage?: (url: string) => void;
  /** Région déjà reliée à la fiche, ou null. */
  regionId?: string | null;
  onApplyRegionId?: (regionId: string) => void;
  /** En création : la fiche a déjà des badges cochés. */
  hasBadges?: boolean;
  /** Les badges sont enregistrés dès qu'ils sont cochés : demander confirmation avant de les ajouter (défaut : en édition). */
  confirmBadges?: boolean;
  /** "replace" = les badges proposés remplacent ceux cochés, "add" = ils s'y ajoutent. */
  onApplyBadges?: (badges: AiBadgeDraft[], mode: "replace" | "add") => void | Promise<void>;
  /** Moods non principaux qui ont déjà leur propre présentation. */
  customizedMoodIds?: string[];
  /** Fait écrire la présentation des autres moods proposés. Renvoie les lignes « À vérifier ». */
  onWriteMoodVersions?: (request: AiMoodVersionsRequest) => Promise<string[]>;
  /** Textes supplémentaires à traduire avec « Traduire tout » (onglets de mood). */
  getExtraTranslationItems?: () => AiTranslationItem[];
  onApplyExtraTranslations?: (translations: AiTranslationResult) => void;
  /** Noms des champs que l'IA vient de remplir, pour le marqueur violet « IA ». */
  onAiFilled?: (keys: string[]) => void;
  /** « Tout valider » : retirer tous les marqueurs « IA ». */
  onValidateAll?: () => void;
}

interface PendingTranslations {
  items: AiTranslationItem[];
  translations: AiTranslationResult;
}

type MergeChoice = "replace" | "empty_only" | "cancel";

function AiDraftPanelImpl(
  {
    experienceType = "standalone",
    allowedFields,
    numericFields = [],
    getExtraToVerify,
    getValues,
    setValue,
    selectedCategoryIds,
    onApplyCategoryIds,
    onApplyPracticalInfo,
    isPracticalInfoEmpty,
    isEditMode,
    onAddIncludes,
    onAddExtras,
    getCoverCandidates,
    onApplyCoverImage,
    regionId = null,
    onApplyRegionId,
    hasBadges = false,
    confirmBadges,
    onApplyBadges,
    customizedMoodIds = [],
    onWriteMoodVersions,
    getExtraTranslationItems,
    onApplyExtraTranslations,
    onAiFilled,
    onValidateAll,
  }: Props,
  ref: Ref<AiDraftPanelHandle>
) {
  const simpleFields = allowedFields ? SIMPLE_FIELDS.filter((f) => allowedFields.includes(f)) : SIMPLE_FIELDS;
  const translateFieldMap = allowedFields ? TRANSLATE_FIELD_MAP.filter((m) => allowedFields.includes(m.fr)) : TRANSLATE_FIELD_MAP;
  const badgesNeedConfirm = confirmBadges ?? isEditMode;
  const emptyableNumericFields = EMPTYABLE_NUMERIC_FIELDS.filter((f) => !allowedFields || allowedFields.includes(f));

  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState("");
  const [url, setUrl] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [toVerify, setToVerify] = useState<string[]>([]);
  const [checkedVerify, setCheckedVerify] = useState<Set<number>>(new Set());
  const [aiActive, setAiActive] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<AiExperienceDraft | null>(null);
  const [conflictCount, setConflictCount] = useState(0);
  // En édition, les inclus/extras générés attendent une confirmation explicite avant d'être
  // enregistrés en base (en création, ils vont directement dans les listes locales du formulaire).
  const [pendingIncludes, setPendingIncludes] = useState<AiIncludeDraft[]>([]);
  const [pendingExtras, setPendingExtras] = useState<AiExtraDraft[]>([]);
  const [pendingBadges, setPendingBadges] = useState<AiBadgeDraft[]>([]);
  const [pendingTranslations, setPendingTranslations] = useState<PendingTranslations | null>(null);
  const [writingMoods, setWritingMoods] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetSources = () => {
    setNotes("");
    setUrl("");
    setPdfFile(null);
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1] ?? "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // Traductions hors champs simples (onglets de mood) : même règle, on ne remplace un texte déjà
  // rempli que sur « Remplacer ».
  const applyExtraTranslations = (extra: PendingTranslations, choice: MergeChoice): number => {
    const accepted: AiTranslationResult = {};
    for (const item of extra.items) {
      const t = extra.translations[item.key];
      if (!t) continue;
      const entry: { en?: string; he?: string } = {};
      if (isFilled(t.en) && (choice === "replace" || !isFilled(item.en))) entry.en = t.en;
      if (isFilled(t.he) && (choice === "replace" || !isFilled(item.he))) entry.he = t.he;
      if (entry.en || entry.he) accepted[item.key] = entry;
    }
    if (Object.keys(accepted).length > 0) onApplyExtraTranslations?.(accepted);
    return Object.keys(accepted).length;
  };

  const applyDraft = (draft: AiExperienceDraft, choice: MergeChoice, extraTranslations?: PendingTranslations | null) => {
    if (choice === "cancel") return;

    let appliedCount = 0;
    const filledKeys: string[] = [];
    for (const field of simpleFields) {
      const value = draft[field];
      if (!isFilled(value)) continue;
      const current = getValues(field);
      if (choice === "empty_only" && isFilled(current)) continue;
      setValue(field, value, { shouldDirty: true });
      filledKeys.push(field);
      appliedCount++;
    }

    for (const field of emptyableNumericFields) {
      const value = draft[field];
      if (!isValidNumber(value)) continue;
      if (choice === "empty_only" && isValidNumber(getValues(field))) continue;
      setValue(field, value, { shouldDirty: true, shouldValidate: true });
      filledKeys.push(field);
      appliedCount++;
    }

    // Les champs numériques ont toujours une valeur par défaut : on ne les touche pas en mode
    // « ne remplir que les champs vides ».
    if (choice === "replace") {
      for (const field of numericFields) {
        const value = draft[field];
        if (!isValidNumber(value)) continue;
        setValue(field, value, { shouldDirty: true, shouldValidate: true });
        appliedCount++;
      }
    }

    let finalCategoryIds = selectedCategoryIds;
    if (draft.category_ids.length > 0 && (choice === "replace" || selectedCategoryIds.length === 0)) {
      finalCategoryIds = (onApplyCategoryIds(draft.category_ids) as string[] | undefined) ?? draft.category_ids;
      filledKeys.push("moods");
      appliedCount++;
    }

    if (draft.region_id && onApplyRegionId && (choice === "replace" || !regionId)) {
      onApplyRegionId(draft.region_id);
      filledKeys.push("region_id");
      appliedCount++;
    }

    // La couverture n'est proposée que si la fiche n'en a pas : rien à écraser.
    if (draft.cover_image && onApplyCoverImage) {
      onApplyCoverImage(draft.cover_image);
      filledKeys.push("cover_image");
      appliedCount++;
    }

    const badges = draft.badges ?? [];
    if (badges.length > 0 && onApplyBadges) {
      if (badgesNeedConfirm) {
        // Sur une fiche déjà en base, un badge coché est enregistré tout de suite : Shana confirme depuis « À vérifier ».
        setPendingBadges(badges);
      } else if (choice === "replace" || !hasBadges) {
        void onApplyBadges(badges, "replace");
        filledKeys.push("badges");
        appliedCount++;
      }
    }

    const practicalProvided =
      draft.practical_info.kids.status !== null || draft.practical_info.kosher !== null || draft.practical_info.parking.status !== null;
    if (practicalProvided && (choice === "replace" || isPracticalInfoEmpty())) {
      onApplyPracticalInfo(draft.practical_info);
      appliedCount++;
    }

    if (isEditMode) {
      // En édition, rien n'est inséré en base tout de suite : Shana confirme depuis l'encadré « À vérifier ».
      if (draft.includes.length > 0) setPendingIncludes(draft.includes);
      if (draft.extras.length > 0) setPendingExtras(draft.extras);
    } else {
      if (draft.includes.length > 0) onAddIncludes(draft.includes);
      if (draft.extras.length > 0) onAddExtras(draft.extras);
    }

    if (extraTranslations) appliedCount += applyExtraTranslations(extraTranslations, choice);

    if (filledKeys.length > 0) onAiFilled?.(filledKeys);
    setAiActive(appliedCount > 0 || draft.includes.length > 0 || draft.extras.length > 0);
    toast.success("Brouillon appliqué. Relis avant d'enregistrer.");

    // Les autres moods proposés reçoivent leur propre présentation : mêmes faits, autre angle.
    if (onWriteMoodVersions && draft.category_ids.length > 1) {
      const targets = finalCategoryIds
        .slice(1)
        .filter((id) => draft.category_ids.includes(id) && (choice === "replace" || !customizedMoodIds.includes(id)));
      if (targets.length > 0) {
        setWritingMoods(true);
        onWriteMoodVersions({ selectedIds: finalCategoryIds, proposedIds: targets, replace: choice === "replace", draft })
          .then((lines) => {
            if (lines.length > 0) setToVerify((prev) => [...prev, ...lines]);
          })
          .catch(() => toast.error("Les présentations des autres moods n'ont pas pu être écrites. Utilise « Réécrire pour ce mood » dans leur onglet."))
          .finally(() => setWritingMoods(false));
      }
    }
  };

  const handleAddPendingItems = () => {
    if (pendingIncludes.length > 0) onAddIncludes(pendingIncludes);
    if (pendingExtras.length > 0) onAddExtras(pendingExtras);
    if (pendingBadges.length > 0) void onApplyBadges?.(pendingBadges, "add");
    setPendingIncludes([]);
    setPendingExtras([]);
    setPendingBadges([]);
    toast.success("Propositions de l'IA ajoutées.");
  };

  const translateAll = async () => {
    const texts: Record<string, string> = {};
    for (const { fr } of translateFieldMap) {
      const value = getValues(fr);
      if (isFilled(value)) texts[fr] = value as string;
    }
    const extraItems = (getExtraTranslationItems?.() ?? []).filter((item) => isFilled(item.fr));
    for (const item of extraItems) texts[item.key] = item.fr;
    if (Object.keys(texts).length === 0) {
      toast.error("Remplis au moins un champ en français avant de traduire.");
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Session expirée, reconnecte-toi.");

      const { data, error } = await supabase.functions.invoke("generate-experience-draft", {
        headers: { Authorization: `Bearer ${token}` },
        body: { type: experienceType, mode: "translate", texts },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || "Erreur inconnue");

      const translations = (data.translations || {}) as Record<string, { en: string; he: string }>;
      const overrides: Record<string, string> = {};
      for (const { fr, en, he } of translateFieldMap) {
        const t = translations[fr];
        if (!t) continue;
        if (isFilled(t.en)) overrides[en] = t.en;
        if (isFilled(t.he)) overrides[he] = t.he;
      }
      const extra: PendingTranslations = { items: extraItems.filter((item) => translations[item.key]), translations };
      if (Object.keys(overrides).length === 0 && extra.items.length === 0) {
        toast.error("L'IA n'a renvoyé aucune traduction exploitable.");
        return;
      }

      const translatedDraft = emptyDraft(overrides);
      const extraConflicts = extra.items.reduce((count, item) => {
        const t = translations[item.key];
        return count + (isFilled(t.en) && isFilled(item.en) ? 1 : 0) + (isFilled(t.he) && isFilled(item.he) ? 1 : 0);
      }, 0);
      const conflicts = countConflicts(translatedDraft) + extraConflicts;
      if (conflicts === 0) {
        applyDraft(translatedDraft, "replace", extra);
      } else {
        setConflictCount(conflicts);
        setPendingTranslations(extra);
        setPendingDraft(translatedDraft);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(`Traduction impossible : ${message}`);
    }
  };

  useImperativeHandle(ref, () => ({
    translateAll,
    getUnreviewedAiCount: () => toVerify.length - checkedVerify.size,
    notifyAiFilled: (toVerifyLines = []) => {
      setAiActive(true);
      if (toVerifyLines.length > 0) setToVerify((prev) => [...prev, ...toVerifyLines]);
    },
  }));

  const countConflicts = (draft: AiExperienceDraft): number => {
    let count = 0;
    for (const field of simpleFields) {
      if (isFilled(draft[field]) && isFilled(getValues(field))) count++;
    }
    for (const field of emptyableNumericFields) {
      if (isValidNumber(draft[field]) && isValidNumber(getValues(field))) count++;
    }
    if (draft.category_ids.length > 0 && selectedCategoryIds.length > 0) count++;
    if (draft.region_id && onApplyRegionId && regionId && regionId !== draft.region_id) count++;
    if (!badgesNeedConfirm && onApplyBadges && hasBadges && (draft.badges?.length ?? 0) > 0) count++;
    if (onWriteMoodVersions) count += draft.category_ids.filter((id) => customizedMoodIds.includes(id)).length;
    return count;
  };

  const handleGenerate = async () => {
    if (!notes.trim() && !url.trim() && !pdfFile) {
      toast.error("Donne au moins des notes, un lien ou un PDF.");
      return;
    }
    setLoading(true);
    setPendingIncludes([]);
    setPendingExtras([]);
    setPendingBadges([]);
    setPendingTranslations(null);
    const startedAt = Date.now();
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Session expirée, reconnecte-toi.");

      const pdf_base64 = pdfFile ? await fileToBase64(pdfFile) : undefined;

      const { data, error } = await supabase.functions.invoke("generate-experience-draft", {
        headers: { Authorization: `Bearer ${token}` },
        body: {
          type: experienceType,
          notes: notes.trim() || undefined,
          url: url.trim() || undefined,
          pdf_base64,
          pdf_name: pdfFile?.name,
          photo_urls: getCoverCandidates?.(),
        },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || "Erreur inconnue");
      }

      const draft = data.draft as AiExperienceDraft;
      const warnings: string[] = data.warnings || [];
      warnings.forEach((w) => toast.warning(w));

      setToVerify([...(data.to_verify || []), ...(getExtraToVerify?.(draft) ?? [])]);
      setCheckedVerify(new Set());

      const conflicts = countConflicts(draft);
      if (conflicts === 0) {
        applyDraft(draft, "replace");
      } else {
        setConflictCount(conflicts);
        setPendingDraft(draft);
      }

      safeTrack("ai_draft_generated", {
        experience_type: experienceType,
        used_notes: !!notes.trim(),
        used_url: !!url.trim(),
        used_pdf: !!pdfFile,
        duration_seconds: Math.round((Date.now() - startedAt) / 1000),
        success: true,
      });
      setExpanded(false);
      resetSources();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(`Génération impossible : ${message}`);
      safeTrack("ai_draft_generated", {
        experience_type: experienceType,
        used_notes: !!notes.trim(),
        used_url: !!url.trim(),
        used_pdf: !!pdfFile,
        duration_seconds: Math.round((Date.now() - startedAt) / 1000),
        success: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVerify = (index: number) => {
    setCheckedVerify((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-[14px] border border-dashed border-[#5b3fc4] bg-[#f3efff]">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-[13px] font-medium text-[#5b3fc4]"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Générer avec l'IA
          </span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {expanded && (
          <div className="px-4 pb-4 space-y-3 border-t pt-3">
            <div className="space-y-1.5">
              <Label htmlFor="ai-notes">Tes notes</Label>
              <Textarea
                id="ai-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex : cours de cuisine chez Citrus & Salt, Tel Aviv, 3h, chef pro, casher, 1-10 personnes, dès 12 ans"
                rows={5}
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ai-url">Lien du site</Label>
              <Input
                id="ai-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                disabled={loading}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Déposer un PDF</Label>
              {pdfFile ? (
                <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span className="truncate">{pdfFile.name}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPdfFile(null)} disabled={loading}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground hover:bg-muted/50"
                >
                  <Upload className="h-4 w-4" /> Choisir un PDF (10 Mo max)
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (file && file.size > 10 * 1024 * 1024) {
                    toast.error("Le PDF dépasse 10 Mo.");
                    return;
                  }
                  setPdfFile(file);
                }}
              />
            </div>

            <Button type="button" onClick={handleGenerate} disabled={loading} className="w-full bg-[#5b3fc4] text-white hover:bg-[#5b3fc4]/90">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rédaction en cours, environ 30 secondes
                </>
              ) : (
                "Générer le brouillon"
              )}
            </Button>
          </div>
        )}
      </div>

      {aiActive && (
        <div className="flex items-center justify-between rounded-lg border border-[#d9cffd] bg-[#f3efff] px-4 py-2.5 text-[13px] text-[#5b3fc4]">
          <span>
            ✦ Brouillon généré par l'IA. Relis avant d'enregistrer.
            {writingMoods && (
              <span className="ml-2 inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Rédaction des autres moods en cours
              </span>
            )}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setAiActive(false);
              onValidateAll?.();
            }}
          >
            Tout valider
          </Button>
        </div>
      )}

      {(toVerify.length > 0 || pendingIncludes.length > 0 || pendingExtras.length > 0 || pendingBadges.length > 0) && (
        <div className="rounded-lg border border-[#f0dca0] bg-[#fff4d6] px-4 py-3 space-y-3">
          {toVerify.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-[#8a6100]">À vérifier</p>
              <ul className="space-y-1.5">
                {toVerify.map((line, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Checkbox
                      id={`verify-${idx}`}
                      checked={checkedVerify.has(idx)}
                      onCheckedChange={() => toggleVerify(idx)}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor={`verify-${idx}`}
                      className={cn("text-sm font-normal text-[#8a6100] cursor-pointer", checkedVerify.has(idx) && "line-through opacity-60")}
                    >
                      {line}
                    </Label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(pendingIncludes.length > 0 || pendingExtras.length > 0 || pendingBadges.length > 0) && (
            <div className="space-y-2 border-t border-amber-200 pt-3">
              <p className="text-sm font-medium text-[#8a6100]">Inclus, extras et badges proposés par l'IA</p>
              <ul className="space-y-1 text-sm text-[#8a6100]">
                {pendingIncludes.map((item, idx) => (
                  <li key={`inc-${idx}`}>Inclus : {item.title}</li>
                ))}
                {pendingExtras.map((item, idx) => (
                  <li key={`ext-${idx}`}>Extra : {item.title}</li>
                ))}
                {pendingBadges.map((badge) => (
                  <li key={`badge-${badge.id}`}>Badge : {badge.label}</li>
                ))}
              </ul>
              <Button type="button" size="sm" onClick={handleAddPendingItems}>
                Ajouter à la fiche
              </Button>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={pendingDraft !== null} onOpenChange={(open) => { if (!open) { setPendingDraft(null); setPendingTranslations(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{conflictCount} champ{conflictCount > 1 ? "s sont" : " est"} déjà rempli{conflictCount > 1 ? "s" : ""}</AlertDialogTitle>
            <AlertDialogDescription>
              Le brouillon généré par l'IA touche des champs que tu as déjà remplis. Que veux-tu faire ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-col gap-2">
            <AlertDialogAction
              className="w-full"
              onClick={() => {
                if (pendingDraft) applyDraft(pendingDraft, "empty_only", pendingTranslations);
                setPendingDraft(null);
                setPendingTranslations(null);
              }}
            >
              Ne remplir que les champs vides
            </AlertDialogAction>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                if (pendingDraft) applyDraft(pendingDraft, "replace", pendingTranslations);
                setPendingDraft(null);
                setPendingTranslations(null);
              }}
            >
              Remplacer
            </Button>
            <AlertDialogCancel className="w-full mt-0" onClick={() => setPendingDraft(null)}>
              Annuler
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const AiDraftPanel = forwardRef(AiDraftPanelImpl);
export default AiDraftPanel;
