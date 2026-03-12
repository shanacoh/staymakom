import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Loader2, Bookmark, Trash2, Calendar, Users, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";

interface SavedCartsSectionProps {
  userId: string;
}

export default function SavedCartsSection({ userId }: SavedCartsSectionProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { data: savedCarts, isLoading } = useQuery({
    queryKey: ["saved-carts", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_carts" as any)
        .select(`
          *,
          experiences2 (id, title, title_he, slug, hero_image, thumbnail_image, base_price, currency)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (cartId: string) => {
      const { error } = await supabase
        .from("saved_carts" as any)
        .delete()
        .eq("id", cartId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed from saved");
      queryClient.invalidateQueries({ queryKey: ["saved-carts", userId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!savedCarts || savedCarts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <Bookmark className="h-10 w-10 text-muted-foreground/40 mb-4" />
        <p className="text-[15px] text-foreground mb-1">No saved stays yet.</p>
        <button
          onClick={() => navigate("/launch")}
          className="text-sm text-muted-foreground underline underline-offset-2"
        >
          Browse experiences →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {savedCarts.map((cart: any, i: number) => {
        const exp = cart.experiences2;
        if (!exp) return null;

        const heroImg = exp.thumbnail_image || exp.hero_image;

        return (
          <div key={cart.id}>
            {i > 0 && <Separator />}
            <div className="flex gap-4 py-4">
              {/* Thumbnail */}
              {heroImg && (
                <button
                  onClick={() => navigate(`/experience/${exp.slug}`)}
                  className="flex-shrink-0"
                >
                  <img
                    src={heroImg}
                    alt={exp.title}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                </button>
              )}

              {/* Details */}
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => navigate(`/experience/${exp.slug}`)}
                  className="text-left"
                >
                  <h3 className="text-[15px] font-semibold text-foreground line-clamp-1">
                    {exp.title}
                  </h3>
                </button>

                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  {cart.checkin && cart.checkout && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(parseISO(cart.checkin), "MMM d")} – {format(parseISO(cart.checkout), "MMM d")}
                    </span>
                  )}
                  {cart.party_size && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {cart.party_size}
                    </span>
                  )}
                </div>

                {cart.room_name && (
                  <p className="text-xs text-muted-foreground mt-0.5">{cart.room_name}</p>
                )}

                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  Saved {format(parseISO(cart.created_at), "MMM d, yyyy")}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-end justify-between flex-shrink-0">
                <button
                  onClick={() => deleteMutation.mutate(cart.id)}
                  className="p-1.5 text-muted-foreground/50 hover:text-destructive transition-colors"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (cart.checkin) params.set("checkin", cart.checkin);
                    if (cart.checkout) params.set("checkout", cart.checkout);
                    if (cart.party_size) params.set("guests", String(cart.party_size));
                    navigate(`/experience/${exp.slug}?${params.toString()}`);
                  }}
                  className="text-xs font-medium text-foreground flex items-center gap-0.5"
                >
                  Continue
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
