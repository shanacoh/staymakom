/**
 * Règle d'acompte d'une expérience (aucun / montant fixe / pourcentage).
 * Lit et écrit directement standalone_experiences.deposit_type/deposit_amount,
 * indépendamment du gros formulaire. Les bateaux sont préréglés à 500₪ fixe ;
 * réglable ici pour toute expérience "sur demande".
 */
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  experienceId?: string;
}

type DepositType = "none" | "fixed" | "percentage";

export default function DepositRuleEditor({ experienceId }: Props) {
  const queryClient = useQueryClient();
  const queryKey = ["standalone-experience-deposit-rule", experienceId];
  const [type, setType] = useState<DepositType>("none");
  const [amount, setAmount] = useState<string>("");

  const { data } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("standalone_experiences")
        .select("deposit_type, deposit_amount")
        .eq("id", experienceId as string)
        .single();
      if (error) throw error;
      return data as { deposit_type: string; deposit_amount: number | null };
    },
    enabled: !!experienceId,
  });

  useEffect(() => {
    if (data) {
      setType((data.deposit_type as DepositType) || "none");
      setAmount(data.deposit_amount != null ? String(data.deposit_amount) : "");
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("standalone_experiences")
        .update({
          deposit_type: type,
          deposit_amount: type === "none" ? null : (parseFloat(amount) || null),
        })
        .eq("id", experienceId as string);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Règle d'acompte mise à jour");
    },
    onError: () => toast.error("Impossible de mettre à jour"),
  });

  if (!experienceId) {
    return (
      <p className="text-muted-foreground text-sm italic">
        Sauvegardez d'abord la fiche (brouillon) pour pouvoir régler l'acompte.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Type d'acompte</Label>
          <Select value={type} onValueChange={(v) => setType(v as DepositType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun</SelectItem>
              <SelectItem value="fixed">Montant fixe (₪)</SelectItem>
              <SelectItem value="percentage">Pourcentage du prix</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {type !== "none" && (
          <div className="space-y-1.5">
            <Label>{type === "fixed" ? "Montant (₪)" : "Pourcentage (%)"}</Label>
            <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        )}
      </div>
      <Button size="sm" variant="outline" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
        Enregistrer la règle d'acompte
      </Button>
    </div>
  );
}
