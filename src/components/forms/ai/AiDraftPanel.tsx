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
  [key: string]: string | number | null | undefined;
}

export interface AiExperienceDraft extends AiDraftFields {
  title: string;
  category_id: string | null;
  category_ids: string[];
  category_slugs: string[];
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
  "seo_title_en", "seo_title_fr", "seo_title_he",
  "meta_description_en", "meta_description_fr", "meta_description_he",
  "og_title_en", "og_title_fr", "og_title_he",
  "og_description_en", "og_description_fr", "og_description_he",
] as const;

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
}

interface Props {
  getValues: (name: string) => unknown;
  setValue: (name: string, value: unknown, options?: { shouldDirty?: boolean; shouldValidate?: boolean }) => void;
  selectedCategoryIds: string[];
  onApplyCategoryIds: (ids: string[]) => void;
  onApplyPracticalInfo: (info: AiPracticalInfoDraft) => void;
  isPracticalInfoEmpty: () => boolean;
  /** Mode création : les inclus/extras sont ajoutés tout de suite (listes locales, rien en base). */
  isEditMode: boolean;
  onAddIncludes: (items: AiIncludeDraft[]) => void;
  onAddExtras: (items: AiExtraDraft[]) => void;
}

type MergeChoice = "replace" | "empty_only" | "cancel";

function AiDraftPanelImpl(
  {
    getValues,
    setValue,
    selectedCategoryIds,
    onApplyCategoryIds,
    onApplyPracticalInfo,
    isPracticalInfoEmpty,
    isEditMode,
    onAddIncludes,
    onAddExtras,
  }: Props,
  ref: Ref<AiDraftPanelHandle>
) {
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

  const applyDraft = (draft: AiExperienceDraft, choice: MergeChoice) => {
    if (choice === "cancel") return;

    let appliedCount = 0;
    for (const field of SIMPLE_FIELDS) {
      const value = draft[field];
      if (!isFilled(value)) continue;
      const current = getValues(field);
      if (choice === "empty_only" && isFilled(current)) continue;
      setValue(field, value, { shouldDirty: true });
      appliedCount++;
    }

    if (draft.category_ids.length > 0 && (choice === "replace" || selectedCategoryIds.length === 0)) {
      onApplyCategoryIds(draft.category_ids);
      appliedCount++;
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

    setAiActive(appliedCount > 0 || draft.includes.length > 0 || draft.extras.length > 0);
    toast.success("Brouillon appliqué. Relis avant d'enregistrer.");
  };

  const handleAddPendingIncludesExtras = () => {
    if (pendingIncludes.length > 0) onAddIncludes(pendingIncludes);
    if (pendingExtras.length > 0) onAddExtras(pendingExtras);
    setPendingIncludes([]);
    setPendingExtras([]);
    toast.success("Inclus et extras ajoutés.");
  };

  const translateAll = async () => {
    const texts: Record<string, string> = {};
    for (const { fr } of TRANSLATE_FIELD_MAP) {
      const value = getValues(fr);
      if (isFilled(value)) texts[fr] = value as string;
    }
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
        body: { type: "standalone", mode: "translate", texts },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || "Erreur inconnue");

      const translations = (data.translations || {}) as Record<string, { en: string; he: string }>;
      const overrides: Record<string, string> = {};
      for (const { fr, en, he } of TRANSLATE_FIELD_MAP) {
        const t = translations[fr];
        if (!t) continue;
        if (isFilled(t.en)) overrides[en] = t.en;
        if (isFilled(t.he)) overrides[he] = t.he;
      }
      if (Object.keys(overrides).length === 0) {
        toast.error("L'IA n'a renvoyé aucune traduction exploitable.");
        return;
      }

      const translatedDraft = emptyDraft(overrides);
      const conflicts = countConflicts(translatedDraft);
      if (conflicts === 0) {
        applyDraft(translatedDraft, "replace");
      } else {
        setConflictCount(conflicts);
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
  }));

  const countConflicts = (draft: AiExperienceDraft): number => {
    let count = 0;
    for (const field of SIMPLE_FIELDS) {
      if (isFilled(draft[field]) && isFilled(getValues(field))) count++;
    }
    if (draft.category_ids.length > 0 && selectedCategoryIds.length > 0) count++;
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
    const startedAt = Date.now();
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Session expirée, reconnecte-toi.");

      const pdf_base64 = pdfFile ? await fileToBase64(pdfFile) : undefined;

      const { data, error } = await supabase.functions.invoke("generate-experience-draft", {
        headers: { Authorization: `Bearer ${token}` },
        body: {
          type: "standalone",
          notes: notes.trim() || undefined,
          url: url.trim() || undefined,
          pdf_base64,
          pdf_name: pdfFile?.name,
        },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || "Erreur inconnue");
      }

      const draft = data.draft as AiExperienceDraft;
      const warnings: string[] = data.warnings || [];
      warnings.forEach((w) => toast.warning(w));

      setToVerify(data.to_verify || []);
      setCheckedVerify(new Set());

      const conflicts = countConflicts(draft);
      if (conflicts === 0) {
        applyDraft(draft, "replace");
      } else {
        setConflictCount(conflicts);
        setPendingDraft(draft);
      }

      safeTrack("ai_draft_generated", {
        experience_type: "standalone",
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
        experience_type: "standalone",
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
          <span>✦ Brouillon généré par l'IA. Relis avant d'enregistrer.</span>
          <Button type="button" size="sm" variant="outline" onClick={() => setAiActive(false)}>
            Tout valider
          </Button>
        </div>
      )}

      {(toVerify.length > 0 || pendingIncludes.length > 0 || pendingExtras.length > 0) && (
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

          {(pendingIncludes.length > 0 || pendingExtras.length > 0) && (
            <div className="space-y-2 border-t border-amber-200 pt-3">
              <p className="text-sm font-medium text-[#8a6100]">Inclus et extras proposés par l'IA</p>
              <ul className="space-y-1 text-sm text-[#8a6100]">
                {pendingIncludes.map((item, idx) => (
                  <li key={`inc-${idx}`}>Inclus : {item.title}</li>
                ))}
                {pendingExtras.map((item, idx) => (
                  <li key={`ext-${idx}`}>Extra : {item.title}</li>
                ))}
              </ul>
              <Button type="button" size="sm" onClick={handleAddPendingIncludesExtras}>
                Ajouter ces inclus et extras
              </Button>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={pendingDraft !== null} onOpenChange={(open) => { if (!open) setPendingDraft(null); }}>
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
                if (pendingDraft) applyDraft(pendingDraft, "empty_only");
                setPendingDraft(null);
              }}
            >
              Ne remplir que les champs vides
            </AlertDialogAction>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                if (pendingDraft) applyDraft(pendingDraft, "replace");
                setPendingDraft(null);
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
