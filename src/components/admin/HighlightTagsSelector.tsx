import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HighlightTagsSelectorProps {
  experienceId?: string;
}

export function HighlightTagsSelector({ experienceId }: HighlightTagsSelectorProps) {
  const queryClient = useQueryClient();
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customLabelEn, setCustomLabelEn] = useState("");
  const [customLabelHe, setCustomLabelHe] = useState("");

  // Fetch all common tags
  const { data: commonTags, isLoading: isLoadingTags } = useQuery({
    queryKey: ["highlight-tags-common"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("highlight_tags")
        .select("*")
        .eq("is_common", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing experience tags (tag IDs)
  const { data: experienceTags, isLoading: isLoadingExpTags } = useQuery({
    queryKey: ["experience-highlight-tags", experienceId],
    queryFn: async () => {
      if (!experienceId) return [];
      const { data, error } = await supabase
        .from("experience_highlight_tags")
        .select("tag_id")
        .eq("experience_id", experienceId);
      if (error) throw error;
      return data.map(et => et.tag_id);
    },
    enabled: !!experienceId,
  });

  // Fetch custom tags linked to this experience (is_common = false)
  const { data: customTags, isLoading: isLoadingCustomTags } = useQuery({
    queryKey: ["highlight-tags-custom", experienceId],
    queryFn: async () => {
      if (!experienceId) return [];
      const { data, error } = await supabase
        .from("experience_highlight_tags")
        .select("tag_id, highlight_tags(*)")
        .eq("experience_id", experienceId);
      if (error) throw error;
      // Filter to only custom tags (is_common = false)
      return data
        .map(eht => eht.highlight_tags)
        .filter((tag): tag is NonNullable<typeof tag> => tag !== null && !tag.is_common);
    },
    enabled: !!experienceId,
  });

  const selectedTagIds = experienceTags || [];
  
  // Combine common + custom tags for display
  const allAvailableTags = [...(commonTags || []), ...(customTags || [])];

  // Add tag mutation
  const addTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      if (!experienceId) throw new Error("No experience ID");
      const { error } = await supabase
        .from("experience_highlight_tags")
        .insert({ experience_id: experienceId, tag_id: tagId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experience-highlight-tags", experienceId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add tag");
    },
  });

  // Remove tag mutation
  const removeTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      if (!experienceId) throw new Error("No experience ID");
      const { error } = await supabase
        .from("experience_highlight_tags")
        .delete()
        .eq("experience_id", experienceId)
        .eq("tag_id", tagId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experience-highlight-tags", experienceId] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove tag");
    },
  });

  // Create custom tag mutation
  const createCustomTagMutation = useMutation({
    mutationFn: async ({ labelEn, labelHe }: { labelEn: string; labelHe: string }) => {
      const slug = labelEn.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const { data, error } = await supabase
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
      if (error) throw error;
      return data;
    },
    onSuccess: (newTag) => {
      queryClient.invalidateQueries({ queryKey: ["highlight-tags-custom", experienceId] });
      // Also add it to the experience
      if (experienceId) {
        addTagMutation.mutate(newTag.id);
      }
      setShowCustomDialog(false);
      setCustomLabelEn("");
      setCustomLabelHe("");
      toast.success("Custom tag created");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create tag");
    },
  });

  const handleTagToggle = (tagId: string, checked: boolean) => {
    if (checked) {
      addTagMutation.mutate(tagId);
    } else {
      removeTagMutation.mutate(tagId);
    }
  };

  const handleCreateCustomTag = () => {
    if (!customLabelEn.trim()) {
      toast.error("English label is required");
      return;
    }
    createCustomTagMutation.mutate({
      labelEn: customLabelEn.trim(),
      labelHe: customLabelHe.trim(),
    });
  };

  if (!experienceId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Highlight Tags</CardTitle>
          <CardDescription>
            Select tags that will appear as badges on the experience card (e.g., NIGHT, BREAKFAST, SPA)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Save this experience as a draft first to manage highlight tags.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingTags || isLoadingExpTags || isLoadingCustomTags) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Highlight Tags</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Get selected tags details for preview (from both common and custom)
  const selectedTagsDetails = allAvailableTags.filter(t => selectedTagIds.includes(t.id));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Highlight Tags</CardTitle>
          <CardDescription>
            Select tags that will appear as badges on the experience card (e.g., NIGHT, BREAKFAST, SPA)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected tags preview */}
          {selectedTagsDetails.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
              {selectedTagsDetails.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-1"
                >
                  {tag.label_en}
                  <button
                    type="button"
                    onClick={() => handleTagToggle(tag.id, false)}
                    className="hover:text-destructive"
                    disabled={removeTagMutation.isPending}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Common tags grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {commonTags?.map((tag) => (
              <label
                key={tag.id}
                className="flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={selectedTagIds.includes(tag.id)}
                  onCheckedChange={(checked) =>
                    handleTagToggle(tag.id, checked as boolean)
                  }
                  disabled={addTagMutation.isPending || removeTagMutation.isPending}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{tag.label_en}</span>
                  {tag.label_he && (
                    <span className="text-xs text-muted-foreground" dir="rtl">
                      {tag.label_he}
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>

          {/* Add custom tag button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCustomDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Tag
          </Button>
        </CardContent>
      </Card>

      {/* Custom tag dialog */}
      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Tag</DialogTitle>
            <DialogDescription>
              Add a unique tag for this experience (e.g., "Private Beach", "Horseback Riding")
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom-label-en">Label (English) *</Label>
              <Input
                id="custom-label-en"
                value={customLabelEn}
                onChange={(e) => setCustomLabelEn(e.target.value)}
                placeholder="e.g., Private Beach"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom-label-he">Label (Hebrew)</Label>
              <Input
                id="custom-label-he"
                value={customLabelHe}
                onChange={(e) => setCustomLabelHe(e.target.value)}
                placeholder="חוף פרטי"
                dir="rtl"
                className="bg-hebrew-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCustomDialog(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateCustomTag}
              disabled={createCustomTagMutation.isPending}
            >
              {createCustomTagMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
