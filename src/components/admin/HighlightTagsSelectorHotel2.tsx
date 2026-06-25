/**
 * HighlightTagsSelectorHotel2
 * Même UI que HighlightTagsSelectorStandalone, mais branché sur hotel2_highlight_tags.
 * Gère les tags éditoriaux d'un hôtel (hotels2). Pas de mode local — un hôtel existe
 * toujours au moment où on édite ses badges.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Loader2, Tag, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface TagObject {
  id: string;
  label_en: string;
  label_he?: string | null;
  is_common: boolean;
  slug: string;
  display_order: number;
}

interface Props {
  hotelId: string;
}

export function HighlightTagsSelectorHotel2({ hotelId }: Props) {
  const queryClient = useQueryClient();
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customLabelEn, setCustomLabelEn] = useState("");
  const [customLabelHe, setCustomLabelHe] = useState("");
  const [sessionCustomTags, setSessionCustomTags] = useState<TagObject[]>([]);

  const { data: commonTags, isLoading: isLoadingTags } = useQuery({
    queryKey: ["highlight-tags-common"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("highlight_tags")
        .select("*")
        .eq("is_common", true)
        .order("display_order");
      if (error) throw error;
      return data as TagObject[];
    },
  });

  const { data: hotelTagLinks, isLoading: isLoadingHotelTags } = useQuery({
    queryKey: ["hotel2-highlight-tags", hotelId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("hotel2_highlight_tags")
        .select("tag_id, position")
        .eq("hotel_id", hotelId);
      if (error) throw error;
      return (data || []) as Array<{ tag_id: string; position: number }>;
    },
  });

  const { data: customTagsFromDB } = useQuery({
    queryKey: ["hotel2-highlight-tags-custom", hotelId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("hotel2_highlight_tags")
        .select("tag_id, highlight_tags(*)")
        .eq("hotel_id", hotelId);
      if (error) throw error;
      return data
        .map((r: any) => r.highlight_tags)
        .filter((t: any): t is TagObject => t !== null && !t.is_common);
    },
    select: (data: TagObject[]) => {
      const dbIds = new Set(data.map((t) => t.id));
      return [...data, ...sessionCustomTags.filter((t) => !dbIds.has(t.id))];
    },
  });

  const customTags: TagObject[] = customTagsFromDB || [];
  const selectedTagIds: string[] = hotelTagLinks?.map((l) => l.tag_id) || [];
  const allAvailableTags: TagObject[] = [...(commonTags || []), ...customTags];

  // ── Mutations ──────────────────────────────────────────────────────────────

  const addTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const maxPos = hotelTagLinks?.length
        ? Math.max(...hotelTagLinks.map((l) => l.position)) + 1
        : 0;
      const { error } = await (supabase as any)
        .from("hotel2_highlight_tags")
        .insert({ hotel_id: hotelId, tag_id: tagId, position: maxPos });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hotel2-highlight-tags", hotelId] }),
    onError: (e: any) => toast.error(e.message),
  });

  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await (supabase as any)
        .from("hotel2_highlight_tags")
        .delete()
        .eq("hotel_id", hotelId)
        .eq("tag_id", tagId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hotel2-highlight-tags", hotelId] }),
    onError: (e: any) => toast.error(e.message),
  });

  const reorderTagMutation = useMutation({
    mutationFn: async ({ tagId, direction }: { tagId: string; direction: "up" | "down" }) => {
      const sorted = [...(hotelTagLinks || [])].sort((a, b) => a.position - b.position);
      const idx = sorted.findIndex((l) => l.tag_id === tagId);
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return;
      [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
      await Promise.all(
        sorted.map((link, i) =>
          (supabase as any)
            .from("hotel2_highlight_tags")
            .update({ position: i })
            .eq("hotel_id", hotelId)
            .eq("tag_id", link.tag_id)
        )
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hotel2-highlight-tags", hotelId] }),
    onError: () => toast.error("Réorganisation échouée"),
  });

  const createCustomTagMutation = useMutation({
    mutationFn: async ({ labelEn, labelHe }: { labelEn: string; labelHe: string }) => {
      const slug = `custom-${labelEn.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}-${Date.now()}`;
      const { data: newTag, error: tagError } = await supabase
        .from("highlight_tags")
        .insert({ slug, label_en: labelEn, label_he: labelHe || null, is_common: false, display_order: 100 })
        .select()
        .single();
      if (tagError) throw tagError;
      if (newTag) {
        const { error: linkError } = await (supabase as any)
          .from("hotel2_highlight_tags")
          .insert({ hotel_id: hotelId, tag_id: newTag.id });
        if (linkError) throw linkError;
      }
      return newTag as TagObject;
    },
    onSuccess: (newTag) => {
      setSessionCustomTags((prev) => (prev.some((t) => t.id === newTag.id) ? prev : [...prev, newTag]));
      queryClient.invalidateQueries({ queryKey: ["hotel2-highlight-tags-custom", hotelId] });
      queryClient.invalidateQueries({ queryKey: ["hotel2-highlight-tags", hotelId] });
      setShowCustomDialog(false);
      setCustomLabelEn("");
      setCustomLabelHe("");
      toast.success("Tag personnalisé créé !");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleTagToggle = (tagId: string, checked: boolean) => {
    if (checked) addTagMutation.mutate(tagId);
    else removeTagMutation.mutate(tagId);
  };

  if (isLoadingTags || isLoadingHotelTags) {
    return (
      <Card>
        <CardHeader><CardTitle>Tags éditoriaux (badges)</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const selectedTagsDetails = [...(hotelTagLinks || [])]
    .sort((a, b) => a.position - b.position)
    .map((l) => allAvailableTags.find((t) => t.id === l.tag_id))
    .filter(Boolean) as TagObject[];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Tags éditoriaux (badges)</CardTitle>
          <CardDescription>
            Sélectionnez les tags qui apparaîtront comme badges sur toutes les expériences de cet hôtel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tags sélectionnés — réordonnables */}
          {selectedTagsDetails.length > 0 && (
            <div className="flex flex-col gap-1 p-3 bg-muted/50 rounded-lg">
              {selectedTagsDetails.map((tag, idx) => (
                <div key={tag.id} className="flex items-center gap-2">
                  <div className="flex flex-col gap-0">
                    <button
                      type="button"
                      onClick={() => reorderTagMutation.mutate({ tagId: tag.id, direction: "up" })}
                      disabled={idx === 0 || reorderTagMutation.isPending}
                      className="h-4 w-4 flex items-center justify-center rounded hover:bg-muted disabled:opacity-20"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => reorderTagMutation.mutate({ tagId: tag.id, direction: "down" })}
                      disabled={idx === selectedTagsDetails.length - 1 || reorderTagMutation.isPending}
                      className="h-4 w-4 flex items-center justify-center rounded hover:bg-muted disabled:opacity-20"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
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
                </div>
              ))}
            </div>
          )}

          {/* Grille des tags communs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {commonTags?.map((tag) => (
              <label
                key={tag.id}
                className="flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={selectedTagIds.includes(tag.id)}
                  onCheckedChange={(checked) => handleTagToggle(tag.id, checked as boolean)}
                  disabled={addTagMutation.isPending || removeTagMutation.isPending}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">{tag.label_en}</span>
                  {tag.label_he && (
                    <span className="text-xs text-muted-foreground truncate" dir="rtl">{tag.label_he}</span>
                  )}
                </div>
              </label>
            ))}
            {customTags.map((tag) => (
              <label
                key={tag.id}
                className="flex items-center gap-2 p-2 rounded-md border border-accent/40 bg-accent/5 cursor-pointer hover:bg-accent/10 transition-colors"
              >
                <Checkbox
                  checked={selectedTagIds.includes(tag.id)}
                  onCheckedChange={(checked) => handleTagToggle(tag.id, checked as boolean)}
                  disabled={addTagMutation.isPending || removeTagMutation.isPending}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">{tag.label_en}</span>
                  {tag.label_he && (
                    <span className="text-xs text-muted-foreground truncate" dir="rtl">{tag.label_he}</span>
                  )}
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
            <DialogDescription>Ce tag sera propre à cet hôtel</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Label (Anglais) *</Label>
              <Input
                value={customLabelEn}
                onChange={(e) => setCustomLabelEn(e.target.value)}
                placeholder="ex : Private Pool"
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  createCustomTagMutation.mutate({ labelEn: customLabelEn.trim(), labelHe: customLabelHe.trim() })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Label (Hébreu)</Label>
              <Input
                value={customLabelHe}
                onChange={(e) => setCustomLabelHe(e.target.value)}
                placeholder="בריכה פרטית"
                dir="rtl"
                className="bg-hebrew-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowCustomDialog(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() =>
                createCustomTagMutation.mutate({ labelEn: customLabelEn.trim(), labelHe: customLabelHe.trim() })
              }
              disabled={createCustomTagMutation.isPending || !customLabelEn.trim()}
            >
              {createCustomTagMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer le tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
