import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Eye, EyeOff, Star } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ReviewsManagerProps {
  experienceId: string;
}

const ReviewsManager = ({ experienceId }: ReviewsManagerProps) => {
  const queryClient = useQueryClient();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-reviews", experienceId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("experience_reviews")
        .select("*")
        .eq("experience_id", experienceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("experience_reviews")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews", experienceId] });
      toast.success("Review deleted");
    },
  });

  const togglePublishedMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await (supabase as any)
        .from("experience_reviews")
        .update({ published })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews", experienceId] });
      toast.success("Review updated");
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reviews</CardTitle>
      </CardHeader>
      <CardContent>
        {!reviews || reviews.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No reviews yet</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review: any) => (
              <div
                key={review.id}
                className="flex gap-3 p-4 border border-border rounded-lg"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(review.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  <p className="text-sm">{review.text}</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => togglePublishedMutation.mutate({
                      id: review.id,
                      published: !review.published
                    })}
                  >
                    {review.published ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(review.id)}
                  >
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

export default ReviewsManager;
