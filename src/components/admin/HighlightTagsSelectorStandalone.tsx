/**
 * HighlightTagsSelectorStandalone
 * Même UI que HighlightTagsSelector2, mais branché sur standalone_experience_highlight_tags.
 */

import { forwardRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card as UiCard,
  CardContent as UiCardContent,
  CardDescription as UiCardDescription,
  CardHeader as UiCardHeader,
  CardTitle as UiCardTitle,
} from "@/components/ui/card";
import { Button as UiButton, type ButtonProps } from "@/components/ui/button";
import { Input as UiInput } from "@/components/ui/input";
import { Label as UiLabel } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Style maquette (sprint 5B) — surcharge visuelle locale, voir
// StandaloneExperienceForm.tsx pour le détail des valeurs reprises.
const Label = forwardRef<HTMLLabelElement, React.ComponentProps<typeof UiLabel>>(({ className, ...props }, ref) => (
  <UiLabel ref={ref} className={cn("text-[11px] uppercase tracking-[0.05em] text-[#6f6a63] font-medium", className)} {...props} />
));
Label.displayName = "Label";

const Input = forwardRef<HTMLInputElement, React.ComponentProps<typeof UiInput>>(({ className, ...props }, ref) => (
  <UiInput ref={ref} className={cn("h-9 rounded-[9px] border-[#e9e6e1] px-2.5 py-2 text-[13px]", className)} {...props} />
));
Input.displayName = "Input";

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, ...props }, ref) => (
  <UiButton ref={ref} className={cn("h-[34px] rounded-[10px] text-[13px] normal-case tracking-normal", className)} {...props} />
));
Button.displayName = "Button";

const Card = forwardRef<HTMLDivElement, React.ComponentProps<typeof UiCard>>(({ className, ...props }, ref) => (
  <UiCard ref={ref} className={cn("rounded-[14px] border-[#e9e6e1] shadow-none", className)} {...props} />
));
Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, React.ComponentProps<typeof UiCardHeader>>(({ className, ...props }, ref) => (
  <UiCardHeader ref={ref} className={cn("space-y-1 p-3", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

const CardContent = forwardRef<HTMLDivElement, React.ComponentProps<typeof UiCardContent>>(({ className, ...props }, ref) => (
  <UiCardContent ref={ref} className={cn("space-y-2.5 p-3 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardTitle = forwardRef<HTMLParagraphElement, React.ComponentProps<typeof UiCardTitle>>(({ className, ...props }, ref) => (
  <UiCardTitle ref={ref} className={cn("text-[14px] font-bold leading-tight tracking-normal text-[#1a1814]", className)} {...props} />
));
CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef<HTMLParagraphElement, React.ComponentProps<typeof UiCardDescription>>(({ className, ...props }, ref) => (
  <UiCardDescription ref={ref} className={cn("text-xs text-[#6f6a63]", className)} {...props} />
));
CardDescription.displayName = "CardDescription";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export interface LocalTagEntry {
  tag_id: string;
}

interface TagObject {
  id: string;
  label_en: string;
  label_fr?: string | null;
  label_he?: string | null;
  is_common: boolean;
  slug: string;
  display_order: number;
}

interface Props {
  experienceId?: string;
  localTags?: LocalTagEntry[];
  onLocalTagsChange?: (tags: LocalTagEntry[]) => void;
}

export function HighlightTagsSelectorStandalone({ experienceId, localTags, onLocalTagsChange }: Props) {
  const queryClient = useQueryClient();
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customLabelEn, setCustomLabelEn] = useState("");
  const [customLabelFr, setCustomLabelFr] = useState("");
  const [customLabelHe, setCustomLabelHe] = useState("");
  const [sessionCustomTags, setSessionCustomTags] = useState<TagObject[]>([]);

  const isLocalMode = !experienceId;

  const { data: commonTags, isLoading: isLoadingTags } = useQuery({
    queryKey: ["highlight-tags-common"],
    queryFn: async () => {
      const { data, error } = await supabase.from("highlight_tags").select("*").eq("is_common", true).order("display_order");
      if (error) throw error;
      return data as TagObject[];
    },
  });

  const { data: experienceTagLinks, isLoading: isLoadingExpTags } = useQuery({
    queryKey: ["standalone-highlight-tags", experienceId],
    queryFn: async () => {
      if (!experienceId) return [];
      const { data, error } = await (supabase as any)
        .from("standalone_experience_highlight_tags")
        .select("tag_id, position")
        .eq("experience_id", experienceId);
      if (error) throw error;
      return (data || []) as Array<{ tag_id: string; position: number }>;
    },
    enabled: !!experienceId,
  });

  const { data: customTagsFromDB } = useQuery({
    queryKey: ["standalone-highlight-tags-custom", experienceId],
    queryFn: async () => {
      if (!experienceId) return [];
      const { data, error } = await (supabase as any)
        .from("standalone_experience_highlight_tags")
        .select("tag_id, highlight_tags(*)")
        .eq("experience_id", experienceId);
      if (error) throw error;
      return data
        .map((r: any) => r.highlight_tags)
        .filter((t: any): t is TagObject => t !== null && !t.is_common);
    },
    enabled: !!experienceId,
    select: (data: TagObject[]) => {
      const dbIds = new Set(data.map((t) => t.id));
      return [...data, ...sessionCustomTags.filter((t) => !dbIds.has(t.id))];
    },
  });

  const customTags: TagObject[] = isLocalMode ? sessionCustomTags : (customTagsFromDB || []);
  const selectedTagIds: string[] = isLocalMode
    ? (localTags?.map((t) => t.tag_id) || [])
    : (experienceTagLinks?.map((l) => l.tag_id) || []);
  const allAvailableTags: TagObject[] = [...(commonTags || []), ...customTags];

  // ── Mutations ──────────────────────────────────────────────────────────────

  const addTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const maxPos = experienceTagLinks?.length
        ? Math.max(...experienceTagLinks.map((l) => l.position)) + 1
        : 0;
      const { error } = await (supabase as any)
        .from("standalone_experience_highlight_tags")
        .insert({ experience_id: experienceId, tag_id: tagId, position: maxPos });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["standalone-highlight-tags", experienceId] }),
    onError: (e: any) => toast.error(e.message),
  });

  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await (supabase as any)
        .from("standalone_experience_highlight_tags")
        .delete()
        .eq("experience_id", experienceId)
        .eq("tag_id", tagId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["standalone-highlight-tags", experienceId] }),
    onError: (e: any) => toast.error(e.message),
  });

  const reorderTagMutation = useMutation({
    mutationFn: async ({ tagId, direction }: { tagId: string; direction: "up" | "down" }) => {
      const sorted = [...(experienceTagLinks || [])].sort((a, b) => a.position - b.position);
      const idx = sorted.findIndex((l) => l.tag_id === tagId);
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return;
      [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
      await Promise.all(
        sorted.map((link, i) =>
          (supabase as any)
            .from("standalone_experience_highlight_tags")
            .update({ position: i })
            .eq("experience_id", experienceId)
            .eq("tag_id", link.tag_id)
        )
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["standalone-highlight-tags", experienceId] }),
    onError: () => toast.error("Réorganisation échouée"),
  });

  const createCustomTagMutation = useMutation({
    mutationFn: async ({ labelEn, labelFr, labelHe }: { labelEn: string; labelFr: string; labelHe: string }) => {
      const slug = `custom-${labelEn.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}-${Date.now()}`;
      const { data: newTag, error: tagError } = await supabase
        .from("highlight_tags")
        .insert({ slug, label_en: labelEn, label_fr: labelFr || null, label_he: labelHe || null, is_common: false, display_order: 100 })
        .select()
        .single();
      if (tagError) throw tagError;
      if (experienceId && newTag) {
        const { error: linkError } = await (supabase as any)
          .from("standalone_experience_highlight_tags")
          .insert({ experience_id: experienceId, tag_id: newTag.id });
        if (linkError) throw linkError;
      }
      return newTag as TagObject;
    },
    onSuccess: (newTag) => {
      setSessionCustomTags((prev) => (prev.some((t) => t.id === newTag.id) ? prev : [...prev, newTag]));
      if (isLocalMode) onLocalTagsChange?.([...(localTags || []), { tag_id: newTag.id }]);
      else {
        queryClient.invalidateQueries({ queryKey: ["standalone-highlight-tags-custom", experienceId] });
        queryClient.invalidateQueries({ queryKey: ["standalone-highlight-tags", experienceId] });
      }
      setShowCustomDialog(false);
      setCustomLabelEn("");
      setCustomLabelFr("");
      setCustomLabelHe("");
      toast.success("Tag personnalisé créé !");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleTagToggle = (tagId: string, checked: boolean) => {
    if (isLocalMode) {
      onLocalTagsChange?.(
        checked
          ? [...(localTags || []), { tag_id: tagId }]
          : (localTags || []).filter((t) => t.tag_id !== tagId)
      );
    } else {
      if (checked) addTagMutation.mutate(tagId);
      else removeTagMutation.mutate(tagId);
    }
  };

  if (isLoadingTags || (!isLocalMode && isLoadingExpTags)) {
    return (
      <Card>
        <CardHeader><CardTitle>Points forts (badges)</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></CardContent>
      </Card>
    );
  }

  const selectedTagsDetails = isLocalMode
    ? (localTags?.map((lt) => allAvailableTags.find((t) => t.id === lt.tag_id)).filter(Boolean) as TagObject[]) ?? []
    : [...(experienceTagLinks || [])]
        .sort((a, b) => a.position - b.position)
        .map((l) => allAvailableTags.find((t) => t.id === l.tag_id))
        .filter(Boolean) as TagObject[];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Points forts (badges)</CardTitle>
          <CardDescription>Sélectionnez les tags qui apparaîtront comme badges sur la fiche expérience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected tags — reorderable */}
          {selectedTagsDetails.length > 0 && (
            <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-lg">
              {selectedTagsDetails.map((tag, idx) => (
                <div key={tag.id} className="flex items-center gap-2">
                  {!isLocalMode && (
                    <div className="flex flex-col gap-0">
                      <button type="button" onClick={() => reorderTagMutation.mutate({ tagId: tag.id, direction: "up" })} disabled={idx === 0 || reorderTagMutation.isPending} className="h-4 w-4 flex items-center justify-center rounded hover:bg-muted disabled:opacity-20">
                        <ChevronUp className="h-3 w-3" />
                      </button>
                      <button type="button" onClick={() => reorderTagMutation.mutate({ tagId: tag.id, direction: "down" })} disabled={idx === selectedTagsDetails.length - 1 || reorderTagMutation.isPending} className="h-4 w-4 flex items-center justify-center rounded hover:bg-muted disabled:opacity-20">
                        <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
                    {tag.label_en}
                    <button type="button" onClick={() => handleTagToggle(tag.id, false)} className="hover:text-destructive ml-1" disabled={removeTagMutation.isPending}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Tags disponibles — pastilles compactes, libellé FR seulement */}
          <div className="flex flex-wrap gap-1.5">
            {commonTags?.map((tag) => {
              const selected = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag.id, !selected)}
                  disabled={!isLocalMode && (addTagMutation.isPending || removeTagMutation.isPending)}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] border transition-colors",
                    selected ? "bg-[#1a1814] text-white border-[#1a1814]" : "bg-white text-[#1a1814] border-[#e9e6e1] hover:border-[#1a1814]/40"
                  )}
                >
                  {tag.label_fr || tag.label_en}
                </button>
              );
            })}
            {customTags.map((tag) => {
              const selected = selectedTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag.id, !selected)}
                  disabled={!isLocalMode && (addTagMutation.isPending || removeTagMutation.isPending)}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] border transition-colors",
                    selected ? "bg-[#1a1814] text-white border-[#1a1814]" : "bg-white text-[#1a1814] border-dashed border-[#c9bfae] hover:border-[#1a1814]/40"
                  )}
                >
                  {tag.label_fr || tag.label_en}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowCustomDialog(true)}
            className="text-[11px] text-[#6f6a63] underline hover:text-[#1a1814]"
          >
            + Créer un tag personnalisé
          </button>
        </CardContent>
      </Card>

      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un tag personnalisé</DialogTitle>
            <DialogDescription>Ce tag sera unique à cette expérience</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="space-y-2">
              <Label>Label (Anglais) *</Label>
              <Input value={customLabelEn} onChange={(e) => setCustomLabelEn(e.target.value)} placeholder="ex : Private Beach" onKeyDown={(e) => e.key === "Enter" && createCustomTagMutation.mutate({ labelEn: customLabelEn.trim(), labelFr: customLabelFr.trim(), labelHe: customLabelHe.trim() })} />
            </div>
            <div className="space-y-2">
              <Label>Label (Français)</Label>
              <Input value={customLabelFr} onChange={(e) => setCustomLabelFr(e.target.value)} placeholder="ex : Plage privée" onKeyDown={(e) => e.key === "Enter" && createCustomTagMutation.mutate({ labelEn: customLabelEn.trim(), labelFr: customLabelFr.trim(), labelHe: customLabelHe.trim() })} />
            </div>
            <div className="space-y-2">
              <Label>Label (Hébreu)</Label>
              <Input value={customLabelHe} onChange={(e) => setCustomLabelHe(e.target.value)} placeholder="חוף פרטי" dir="rtl" className="bg-hebrew-input" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCustomDialog(false)}>Annuler</Button>
            <Button type="button" onClick={() => createCustomTagMutation.mutate({ labelEn: customLabelEn.trim(), labelFr: customLabelFr.trim(), labelHe: customLabelHe.trim() })} disabled={createCustomTagMutation.isPending || !customLabelEn.trim()}>
              {createCustomTagMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer le tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
