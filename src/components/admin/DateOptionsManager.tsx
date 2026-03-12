import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { Plus, Trash2, Loader2, CalendarDays, Star } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface DateOption {
  id: string;
  experience_id: string;
  checkin: string;
  checkout: string;
  label: string | null;
  label_he: string | null;
  price_override: number | null;
  original_price: number | null;
  discount_percent: number | null;
  featured: boolean;
  is_active: boolean;
  order_index: number;
}

interface DateOptionsManagerProps {
  experienceId: string | null | undefined;
  disabled?: boolean;
}

export default function DateOptionsManager({ experienceId, disabled = false }: DateOptionsManagerProps) {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // New entry form state
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [label, setLabel] = useState("");
  const [labelHe, setLabelHe] = useState("");
  const [priceOverride, setPriceOverride] = useState<string>("");
  const [originalPrice, setOriginalPrice] = useState<string>("");
  const [discountPercent, setDiscountPercent] = useState<string>("");
  const [featured, setFeatured] = useState(false);

  const { data: dateOptions, isLoading } = useQuery({
    queryKey: ["experience2-date-options", experienceId],
    queryFn: async () => {
      if (!experienceId) return [];
      const { data, error } = await supabase
        .from("experience2_date_options" as any)
        .select("*")
        .eq("experience_id", experienceId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as DateOption[];
    },
    enabled: !!experienceId,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!experienceId || !checkin || !checkout) throw new Error("Missing fields");
      const { error } = await supabase.from("experience2_date_options" as any).insert({
        experience_id: experienceId,
        checkin,
        checkout,
        label: label.trim() || null,
        label_he: labelHe.trim() || null,
        price_override: priceOverride ? parseFloat(priceOverride) : null,
        original_price: originalPrice ? parseFloat(originalPrice) : null,
        discount_percent: discountPercent ? parseInt(discountPercent) : null,
        featured,
        is_active: true,
        order_index: (dateOptions?.length ?? 0),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Date option added");
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["experience2-date-options", experienceId] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("experience2_date_options" as any)
        .update({ is_active: isActive } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["experience2-date-options", experienceId] }),
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("experience2_date_options" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Date option deleted");
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["experience2-date-options", experienceId] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  function resetForm() {
    setCheckin("");
    setCheckout("");
    setLabel("");
    setLabelHe("");
    setPriceOverride("");
    setOriginalPrice("");
    setDiscountPercent("");
    setFeatured(false);
  }

  if (!experienceId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Predefined Date Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Save this experience as a draft first to manage date options.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Predefined Date Options
          </CardTitle>
          <CardDescription>
            Add suggested check-in/check-out dates that customers can select quickly. If none are set, only the free calendar is shown.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing date options */}
          {(dateOptions ?? []).length > 0 && (
            <div className="space-y-2">
              {(dateOptions ?? []).map((opt) => (
                <div
                  key={opt.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-md border bg-muted/30"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Switch
                      checked={opt.is_active}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: opt.id, isActive: checked })}
                      disabled={disabled}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {format(new Date(opt.checkin), "EEE dd MMM")} → {format(new Date(opt.checkout), "EEE dd MMM yyyy")}
                      </p>
                      {opt.label && <p className="text-xs text-muted-foreground">{opt.label}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {opt.featured && <Badge variant="secondary"><Star className="h-3 w-3 mr-1" />Featured</Badge>}
                    {opt.price_override != null && (
                      <Badge variant="default">₪{opt.price_override}</Badge>
                    )}
                    {opt.original_price != null && (
                      <Badge variant="outline" className="line-through text-muted-foreground">₪{opt.original_price}</Badge>
                    )}
                    {opt.discount_percent != null && (
                      <Badge variant="destructive">-{opt.discount_percent}%</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleteId(opt.id)}
                      disabled={disabled}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(dateOptions ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground italic">No predefined dates. Only the free calendar will be shown.</p>
          )}

          {/* Add new date option form */}
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Check-in *</Label>
              <Input type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} disabled={disabled} />
            </div>
            <div>
              <Label className="text-xs">Check-out *</Label>
              <Input type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} disabled={disabled} />
            </div>
            <div>
              <Label className="text-xs">Label (EN)</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Weekend Special" disabled={disabled} />
            </div>
            <div>
              <Label className="text-xs">Label (HE)</Label>
              <Input value={labelHe} onChange={(e) => setLabelHe(e.target.value)} placeholder="תווית" dir="rtl" disabled={disabled} />
            </div>
            <div>
              <Label className="text-xs">Display Price (₪)</Label>
              <Input type="number" min="0" step="0.01" value={priceOverride} onChange={(e) => setPriceOverride(e.target.value)} placeholder="Optional" disabled={disabled} />
            </div>
            <div>
              <Label className="text-xs">Original Price (₪)</Label>
              <Input type="number" min="0" step="0.01" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="Strikethrough" disabled={disabled} />
            </div>
            <div>
              <Label className="text-xs">Discount %</Label>
              <Input type="number" min="0" max="100" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} placeholder="e.g. 20" disabled={disabled} />
            </div>
            <div className="flex items-end gap-3">
              <div className="flex items-center gap-2 pb-2">
                <Switch checked={featured} onCheckedChange={setFeatured} disabled={disabled} />
                <Label className="text-xs">Featured</Label>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => addMutation.mutate()}
                disabled={disabled || !checkin || !checkout || addMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this date option?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
