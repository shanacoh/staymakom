import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Eye, EyeOff, Star, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";

export interface LocalReviewEntry {
  _localId: string;
  user_name: string;
  rating: number;
  comment: string;
  is_visible: boolean;
}

interface ReviewsManager2Props {
  experienceId?: string;
  localReviews?: LocalReviewEntry[];
  onLocalReviewsChange?: (reviews: LocalReviewEntry[]) => void;
}

const ReviewsManager2 = ({ experienceId, localReviews, onLocalReviewsChange }: ReviewsManager2Props) => {
  const queryClient = useQueryClient();
  const isLocalMode = !experienceId;
  const [showAdd, setShowAdd] = useState(false);
  const [newReview, setNewReview] = useState({ user_name: "", rating: 5, comment: "" });

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-reviews2", experienceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experience2_reviews")
        .select("*")
        .eq("experience_id", experienceId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!experienceId,
  });

  const displayItems: any[] = isLocalMode
    ? (localReviews || []).map(r => ({ ...r, id: r._localId, created_at: new Date().toISOString() }))
    : (reviews || []);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newReview.user_name.trim()) throw new Error("Name is required");
      const { error } = await supabase.from("experience2_reviews").insert({
        experience_id: experienceId!,
        user_name: newReview.user_name,
        rating: newReview.rating,
        comment: newReview.comment || null,
        is_visible: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews2", experienceId] });
      setNewReview({ user_name: "", rating: 5, comment: "" });
      setShowAdd(false);
      toast.success("Review added");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("experience2_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews2", experienceId] });
      toast.success("Review deleted");
    },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
      const { error } = await supabase.from("experience2_reviews").update({ is_visible }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews2", experienceId] });
      toast.success("Review updated");
    },
  });

  const handleAdd = () => {
    if (!newReview.user_name.trim()) { toast.error("Name is required"); return; }
    if (isLocalMode) {
      const entry: LocalReviewEntry = {
        _localId: `local-${Date.now()}`,
        user_name: newReview.user_name,
        rating: newReview.rating,
        comment: newReview.comment,
        is_visible: true,
      };
      onLocalReviewsChange?.([...(localReviews || []), entry]);
      setNewReview({ user_name: "", rating: 5, comment: "" });
      setShowAdd(false);
      toast.success("Review added");
    } else {
      createMutation.mutate();
    }
  };

  const handleDelete = (id: string) => {
    if (isLocalMode) {
      onLocalReviewsChange?.((localReviews || []).filter(r => r._localId !== id));
      toast.success("Review removed");
    } else {
      deleteMutation.mutate(id);
    }
  };

  if (!isLocalMode && isLoading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Reviews</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Review
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAdd && (
          <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name *</Label>
                <Input value={newReview.user_name} onChange={(e) => setNewReview({ ...newReview, user_name: e.target.value })} placeholder="Reviewer name" />
              </div>
              <div>
                <Label>Rating (1-5)</Label>
                <Input type="number" min={1} max={5} value={newReview.rating} onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) || 5 })} />
              </div>
            </div>
            <div>
              <Label>Comment</Label>
              <Textarea value={newReview.comment} onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })} placeholder="Review text..." rows={3} />
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={handleAdd} disabled={createMutation.isPending}>Add</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {displayItems.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No reviews yet</p>
        ) : (
          <div className="space-y-3">
            {displayItems.map((review) => (
              <div key={review.id} className="flex gap-3 p-4 border border-border rounded-lg">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{review.user_name}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-4 h-4 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                      ))}
                    </div>
                    {!isLocalMode && review.created_at && (
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(review.created_at), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                  {review.comment && <p className="text-sm">{review.comment}</p>}
                </div>
                <div className="flex gap-1">
                  {!isLocalMode && (
                    <Button size="icon" variant="ghost" onClick={() => toggleVisibilityMutation.mutate({ id: review.id, is_visible: !review.is_visible })}>
                      {review.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(review.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewsManager2;