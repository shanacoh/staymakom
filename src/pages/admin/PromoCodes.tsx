import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isPast } from "date-fns";
import { Pause, Play, Plus, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PromoCode = {
  id: string;
  code: string;
  discount_type: string;
  discount_pct: number | null;
  discount_amount: number | null;
  valid_from: string;
  valid_until: string;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
};

type PromoStatus = "active" | "expired" | "exhausted" | "disabled";

function getStatus(code: PromoCode): PromoStatus {
  if (!code.is_active) return "disabled";
  if (isPast(new Date(code.valid_until))) return "expired";
  if (code.max_uses !== null && code.used_count >= code.max_uses) return "exhausted";
  return "active";
}

const statusLabels: Record<PromoStatus, string> = {
  active: "Actif",
  expired: "Expiré",
  exhausted: "Épuisé",
  disabled: "Désactivé",
};

const statusColors: Record<PromoStatus, string> = {
  active: "bg-green-100 text-green-700",
  expired: "bg-orange-100 text-orange-700",
  exhausted: "bg-gray-200 text-gray-700",
  disabled: "bg-gray-100 text-gray-500",
};

function formatDiscount(code: PromoCode): string {
  return code.discount_type === "fixed_amount"
    ? `₪${Math.round(code.discount_amount ?? 0).toLocaleString()}`
    : `${code.discount_pct}%`;
}

function generateRandomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans caractères ambigus (0/O, 1/I)
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

const emptyForm = {
  code: "",
  discountType: "percentage" as "percentage" | "fixed_amount",
  value: "",
  validFrom: format(new Date(), "yyyy-MM-dd"),
  validUntil: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
  maxUses: "",
};

export default function PromoCodes() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: promoCodes, isLoading } = useQuery({
    queryKey: ["admin-promo-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PromoCode[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const code = form.code.trim().toUpperCase();
      const value = Number(form.value);
      if (!code) throw new Error("Le code est obligatoire.");
      if (!value || value <= 0) throw new Error("La valeur de la réduction doit être supérieure à 0.");
      if (form.discountType === "percentage" && value > 100) {
        throw new Error("Un pourcentage ne peut pas dépasser 100.");
      }
      if (!form.validUntil) throw new Error("La date de fin de validité est obligatoire.");

      const { error } = await supabase.from("promo_codes").insert({
        code,
        discount_type: form.discountType,
        discount_pct: form.discountType === "percentage" ? value : null,
        discount_amount: form.discountType === "fixed_amount" ? value : null,
        valid_from: new Date(form.validFrom).toISOString(),
        valid_until: new Date(form.validUntil).toISOString(),
        max_uses: form.maxUses.trim() ? Number(form.maxUses) : null,
        is_active: true,
      });
      if (error) {
        if (error.code === "23505") throw new Error("Ce code existe déjà.");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      toast.success("Code promo créé");
      setDialogOpen(false);
      setForm(emptyForm);
      setFormError(null);
    },
    onError: (error: Error) => {
      setFormError(error.message || "Erreur lors de la création du code.");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from("promo_codes").update({ is_active: isActive }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      toast.success("Statut mis à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour du statut");
    },
  });

  const kpis = useMemo(() => {
    const codes = promoCodes ?? [];
    const activeCount = codes.filter((c) => getStatus(c) === "active").length;
    const totalUses = codes.reduce((sum, c) => sum + c.used_count, 0);
    const mostUsed = codes.reduce<PromoCode | null>((best, c) => {
      if (c.used_count === 0) return best;
      if (!best || c.used_count > best.used_count) return c;
      return best;
    }, null);
    return { activeCount, totalUses, mostUsed };
  }, [promoCodes]);

  const promoCodesList = promoCodes ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Codes promo</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Créer et suivre les codes promotionnels du site.
          </p>
        </div>
        <Button
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={() => {
            setForm(emptyForm);
            setFormError(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Créer un code
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Codes actifs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="font-mono text-xl font-bold">{kpis.activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Utilisations totales
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="font-mono text-xl font-bold">{kpis.totalUses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Code le plus utilisé
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="font-mono text-xl font-bold truncate">
              {kpis.mostUsed ? kpis.mostUsed.code : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table className="min-w-[680px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="h-8 text-[10px] uppercase tracking-wider">Code</TableHead>
              <TableHead className="h-8 text-[10px] uppercase tracking-wider">Réduction</TableHead>
              <TableHead className="h-8 text-[10px] uppercase tracking-wider">Utilisations</TableHead>
              <TableHead className="h-8 text-[10px] uppercase tracking-wider">Validité</TableHead>
              <TableHead className="h-8 text-[10px] uppercase tracking-wider">Statut</TableHead>
              <TableHead className="h-8 w-[110px] text-[10px] uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-sm">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : promoCodesList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-sm text-muted-foreground">
                  Aucun code promo
                </TableCell>
              </TableRow>
            ) : (
              promoCodesList.map((code) => {
                const status = getStatus(code);
                return (
                  <TableRow key={code.id}>
                    <TableCell className="py-2 font-mono text-xs font-bold tracking-wide">{code.code}</TableCell>
                    <TableCell className="py-2 text-sm font-medium">{formatDiscount(code)}</TableCell>
                    <TableCell className="py-2 font-mono text-xs text-muted-foreground">
                      {code.used_count} / {code.max_uses ?? "∞"}
                    </TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">
                      {format(new Date(code.valid_from), "d MMM")} → {format(new Date(code.valid_until), "d MMM yyyy")}
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge variant="secondary" className={cn("text-[10px] font-semibold", statusColors[status])}>
                        {statusLabels[status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        disabled={toggleActiveMutation.isPending}
                        onClick={() =>
                          toggleActiveMutation.mutate({ id: code.id, isActive: !code.is_active })
                        }
                      >
                        {code.is_active ? (
                          <>
                            <Pause className="h-3 w-3 mr-1" /> Désactiver
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 mr-1" /> Réactiver
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un code promo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="promo-code">Code</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="promo-code"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="EX. BLACKFRIDAY10"
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Générer un code aléatoire"
                  onClick={() => setForm((f) => ({ ...f, code: generateRandomCode() }))}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type de réduction</Label>
                <Select
                  value={form.discountType}
                  onValueChange={(v) => setForm((f) => ({ ...f, discountType: v as typeof f.discountType, value: "" }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Pourcentage</SelectItem>
                    <SelectItem value="fixed_amount">Montant fixe (₪)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="promo-value">
                  Valeur {form.discountType === "percentage" ? "(%)" : "(₪)"}
                </Label>
                <Input
                  id="promo-value"
                  type="number"
                  min={0}
                  max={form.discountType === "percentage" ? 100 : undefined}
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="promo-from">Valide du</Label>
                <Input
                  id="promo-from"
                  type="date"
                  value={form.validFrom}
                  onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="promo-until">Valide jusqu'au</Label>
                <Input
                  id="promo-until"
                  type="date"
                  value={form.validUntil}
                  onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="promo-max-uses">Nombre d'utilisations maximum</Label>
              <Input
                id="promo-max-uses"
                type="number"
                min={1}
                value={form.maxUses}
                onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                placeholder="Laisser vide = illimité (ex. 1 pour un usage unique)"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Chaque client ne peut de toute façon utiliser un même code qu'une seule fois (par email).
              </p>
            </div>

            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Création..." : "Créer le code"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
