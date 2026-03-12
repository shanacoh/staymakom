import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

// A local tag entry stores the tag_id selected locally before the experience exists in DB
export interface LocalTagEntry {
  tag_id: string;
}

interface TagObject {
  id: string;
  label_en: string;
  label_he?: string | null;
  is_common: boolean;
  slug: string;
  icon?: string | null;
  display_order: number;
}

interface HighlightTagsSelector2Props {
  experienceId?: string;
  /** Local mode: selected tag IDs stored in parent state (used when no experienceId yet) */
  localTags?: LocalTagEntry[];
  onLocalTagsChange?: (tags: LocalTagEntry[]) => void;
}

export function HighlightTagsSelector2({ experienceId, localTags, onLocalTagsChange }: HighlightTagsSelector2Props) {
  const queryClient = useQueryClient();
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customLabelEn, setCustomLabelEn] = useState("");
  const [customLabelHe, setCustomLabelHe] = useState("");
  // Local custom tags created during this session (for both local and edit mode, before refetch)
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

  const { data: experienceTags, isLoading: isLoadingExpTags } = useQuery({
    queryKey: ["experience2-highlight-tags", experienceId],
    queryFn: async () => {
      if (!experienceId) return [];
      const { data, error } = await (supabase as any).from("experience2_highlight_tags").select("tag_id").eq("experience_id", experienceId);
      if (error) throw error;
      return data.map((et: any) => et.tag_id) as string[];
    },
    enabled: !!experienceId,
  });

  const { data: customTagsFromDB, isLoading: isLoadingCustomTags } = useQuery({
    queryKey: ["highlight-tags-custom2", experienceId],
    queryFn: async () => {
      if (!experienceId) return [];
      const { data, error } = await (supabase as any)
        .from("experience2_highlight_tags")
        .select("tag_id, highlight_tags(*)")
        .eq("experience_id", experienceId);
      if (error) throw error;
      return data
        .map((eht: any) => eht.highlight_tags)
        .filter((tag: any): tag is TagObject => tag !== null && !tag.is_common);
    },
    enabled: !!experienceId,
    // Merge session custom tags once DB refreshes
    select: (data) => {
      // Remove session tags that are now in DB to avoid duplicates
      const dbIds = new Set(data.map((t: TagObject) => t.id));
      const remaining = sessionCustomTags.filter((t) => !dbIds.has(t.id));
      return [...data, ...remaining];
    },
  });

  // In local mode, use sessionCustomTags directly (not from DB)
  const customTags: TagObject[] = isLocalMode ? sessionCustomTags : (customTagsFromDB || []);

  // Selected tag IDs
  const selectedTagIds: string[] = isLocalMode
    ? (localTags?.map((t) => t.tag_id) || [])
    : (experienceTags || []);

  // All tags available for selection (common + custom)
  const allAvailableTags: TagObject[] = [...(commonTags || []), ...customTags];

  // --- DB mutations ---

  const addTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      if (!experienceId) throw new Error("No experience ID");
      const { error } = await (supabase as any)
        .from("experience2_highlight_tags")
        .insert({ experience_id: experienceId, tag_id: tagId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["experience2-highlight-tags", experienceId] }),
    onError: (error: any) => toast.error(error.message || "Failed to add tag"),
  });

  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      if (!experienceId) throw new Error("No experience ID");
      const { error } = await (supabase as any)
        .from("experience2_highlight_tags")
        .delete()
        .eq("experience_id", experienceId)
        .eq("tag_id", tagId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["experience2-highlight-tags", experienceId] }),
    onError: (error: any) => toast.error(error.message || "Failed to remove tag"),
  });

  const createCustomTagMutation = useMutation({
    mutationFn: async ({ labelEn, labelHe }: { labelEn: string; labelHe: string }) => {
      const slug = labelEn.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      // 1. Create tag in highlight_tags
      const { data: newTag, error: tagError } = await supabase
        .from("highlight_tags")
        .insert({
          slug: `custom-${slug}-${Date.now()}`,
          label_en: labelEn,
          label_he: labelHe || null,
          is_common: false,
          display_order: 100,
        })
        .select()
        .single();
      if (tagError) throw tagError;

      // 2. Link to experience if editing
      if (experienceId && newTag) {
        const { error: linkError } = await (supabase as any)
          .from("experience2_highlight_tags")
          .insert({ experience_id: experienceId, tag_id: newTag.id });
        if (linkError) throw linkError;
      }

      return newTag as TagObject;
    },
    onSuccess: (newTag) => {
      // 1. Add to session custom tags immediately (visible in UI right away)
      setSessionCustomTags((prev) => {
        if (prev.some((t) => t.id === newTag.id)) return prev;
        return [...prev, newTag];
      });

      // 2. Auto-select the new tag
      if (isLocalMode) {
        onLocalTagsChange?.([...(localTags || []), { tag_id: newTag.id }]);
      } else if (experienceId) {
        // Already linked in DB, just invalidate to sync
        queryClient.invalidateQueries({ queryKey: ["highlight-tags-custom2", experienceId] });
        queryClient.invalidateQueries({ queryKey: ["experience2-highlight-tags", experienceId] });
      }

      setShowCustomDialog(false);
      setCustomLabelEn("");
      setCustomLabelHe("");
      toast.success("Tag personnalisé créé et sélectionné !");
    },
    onError: (error: any) => toast.error(error.message || "Failed to create tag"),
  });

  const handleTagToggle = (tagId: string, checked: boolean) => {
    if (isLocalMode) {
      if (checked) {
        onLocalTagsChange?.([...(localTags || []), { tag_id: tagId }]);
      } else {
        onLocalTagsChange?.((localTags || []).filter((t) => t.tag_id !== tagId));
      }
    } else {
      if (checked) addTagMutation.mutate(tagId);
      else removeTagMutation.mutate(tagId);
    }
  };

  const handleCreateCustomTag = () => {
    if (!customLabelEn.trim()) { toast.error("Le label en anglais est requis"); return; }
    createCustomTagMutation.mutate({ labelEn: customLabelEn.trim(), labelHe: customLabelHe.trim() });
  };

  if (isLoadingTags || (!isLocalMode && (isLoadingExpTags || isLoadingCustomTags))) {
    return (
      <Card>
        <CardHeader><CardTitle>Points forts (badges)</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></CardContent>
      </Card>
    );
  }

  const selectedTagsDetails = allAvailableTags.filter((t) => selectedTagIds.includes(t.id));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Points forts (badges)</CardTitle>
          <CardDescription>Sélectionnez les tags qui apparaîtront comme badges sur la fiche expérience (ex : Petit-déjeuner, SPA, Nuit...)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected tags preview */}
          {selectedTagsDetails.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
              {selectedTagsDetails.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                  {tag.label_en}
                  <button
                    type="button"
                    onClick={() => handleTagToggle(tag.id, false)}
                    className="hover:text-destructive ml-1"
                    disabled={removeTagMutation.isPending}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Common tags grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {commonTags?.map((tag) => (
              <label
                key={tag.id}
                className="flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={selectedTagIds.includes(tag.id)}
                  onCheckedChange={(checked) => handleTagToggle(tag.id, checked as boolean)}
                  disabled={!isLocalMode && (addTagMutation.isPending || removeTagMutation.isPending)}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">{tag.label_en}</span>
                  {tag.label_he && <span className="text-xs text-muted-foreground truncate" dir="rtl">{tag.label_he}</span>}
                </div>
              </label>
            ))}

            {/* Custom tags (session or DB) */}
            {customTags.map((tag) => (
              <label
                key={tag.id}
                className="flex items-center gap-2 p-2 rounded-md border border-accent/40 bg-accent/5 cursor-pointer hover:bg-accent/10 transition-colors"
              >
                <Checkbox
                  checked={selectedTagIds.includes(tag.id)}
                  onCheckedChange={(checked) => handleTagToggle(tag.id, checked as boolean)}
                  disabled={!isLocalMode && (addTagMutation.isPending || removeTagMutation.isPending)}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">{tag.label_en}</span>
                  {tag.label_he && <span className="text-xs text-muted-foreground truncate" dir="rtl">{tag.label_he}</span>}
                  <span className="text-[10px] text-accent font-medium">Custom</span>
                </div>
              </label>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={() => setShowCustomDialog(true)}>
            <Tag className="h-4 w-4 mr-2" />
            Créer un tag personnalisé
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un tag personnalisé</DialogTitle>
            <DialogDescription>Ce tag sera unique à cette expérience</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom-label-en2">Label (Anglais) *</Label>
              <Input
                id="custom-label-en2"
                value={customLabelEn}
                onChange={(e) => setCustomLabelEn(e.target.value)}
                placeholder="ex : Private Beach"
                onKeyDown={(e) => e.key === "Enter" && handleCreateCustomTag()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-label-he2">Label (Hébreu)</Label>
              <Input
                id="custom-label-he2"
                value={customLabelHe}
                onChange={(e) => setCustomLabelHe(e.target.value)}
                placeholder="חוף פרטי"
                dir="rtl"
                className="bg-hebrew-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCustomDialog(false)}>Annuler</Button>
            <Button type="button" onClick={handleCreateCustomTag} disabled={createCustomTagMutation.isPending}>
              {createCustomTagMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer le tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
