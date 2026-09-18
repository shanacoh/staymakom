import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { format, isPast, isThisMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { useState } from "react";
import { Eye, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type GiftCard = {
  id: string;
  code: string;
  amount: number | null;
  amount_used: number;
  currency: string | null;
  recipient_name: string | null;
  recipient_email: string;
  sender_name: string;
  sender_email: string;
  delivery_type: string | null;
  delivery_date: string;
  status: string;
  created_at: string;
  expires_at: string;
  redeemed_at: string | null;
};

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  scheduled: "Planifiée",
  sent: "Active",
  failed: "Échec",
  redeemed: "Utilisée",
  expired: "Expirée",
};

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-500",
  scheduled: "bg-blue-100 text-blue-700",
  sent: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  redeemed: "bg-gray-200 text-gray-700",
  expired: "bg-orange-100 text-orange-700",
};

export default function GiftCards() {
  const queryClient = useQueryClient();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gift_cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-gift-cards"] });
      toast.success("Gift card supprimée");
      setPendingDeleteId(null);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
      setPendingDeleteId(null);
    },
  });

  const { data: giftCards, isLoading } = useQuery({
    queryKey: ["admin-gift-cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gift_cards")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      return data as GiftCard[];
    },
  });

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (amount === null) return "-";
    const symbol = currency === "USD" ? "$" : "₪";
    return `${symbol}${Math.round(amount).toLocaleString()}`;
  };

  const kpis = useMemo(() => {
    const cards = giftCards ?? [];
    const activeCards = cards.filter(
      (gc) => gc.status !== "redeemed" && gc.status !== "failed" && !isPast(new Date(gc.expires_at))
    );
    const activeBalance = activeCards.reduce(
      (sum, gc) => sum + Math.max((gc.amount ?? 0) - gc.amount_used, 0),
      0
    );

    const issuedThisMonth = cards.filter((gc) => isThisMonth(new Date(gc.created_at)));
    const issuedAmount = issuedThisMonth.reduce((sum, gc) => sum + (gc.amount ?? 0), 0);

    const usedThisMonth = cards.filter((gc) => gc.redeemed_at && isThisMonth(new Date(gc.redeemed_at)));
    const usedAmount = usedThisMonth.reduce((sum, gc) => sum + gc.amount_used, 0);

    return {
      activeCount: activeCards.length,
      activeBalance,
      issuedCount: issuedThisMonth.length,
      issuedAmount,
      usedCount: usedThisMonth.length,
      usedAmount,
    };
  }, [giftCards]);

  const monthLabel = format(new Date(), "MMM", { locale: fr }).toUpperCase();
  const cardsList = giftCards ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gift cards</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Suivre les cartes cadeaux émises et leur utilisation.
          </p>
        </div>
        <Button asChild className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          <Link to="/gift-card">
            <Plus className="h-4 w-4 mr-2" />
            Émettre une carte cadeau
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Cartes actives
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="font-mono text-xl font-bold">{kpis.activeCount}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {formatCurrency(kpis.activeBalance, "ILS")} de solde cumulé
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Émises · {monthLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="font-mono text-xl font-bold">{kpis.issuedCount}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {formatCurrency(kpis.issuedAmount, "ILS")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Utilisées · {monthLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="font-mono text-xl font-bold">{kpis.usedCount}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {formatCurrency(kpis.usedAmount, "ILS")} consommés
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Code</TableHead>
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Valeur initiale</TableHead>
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Solde restant</TableHead>
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Acheteur</TableHead>
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Émise le</TableHead>
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Expire le</TableHead>
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Statut</TableHead>
              <TableHead className="h-8 w-[80px] px-3 text-[10px] uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-sm">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : cardsList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-sm text-muted-foreground">
                  Aucune gift card
                </TableCell>
              </TableRow>
            ) : (
              cardsList.map((gc) => {
                const balance = Math.max((gc.amount ?? 0) - gc.amount_used, 0);
                return (
                  <TableRow key={gc.id}>
                    <TableCell className="py-2 px-3 font-mono text-xs font-bold tracking-wide">{gc.code}</TableCell>
                    <TableCell className="py-2 px-3 text-sm font-medium">
                      {formatCurrency(gc.amount, gc.currency)}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-sm font-medium">
                      {formatCurrency(balance, gc.currency)}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-xs">{gc.sender_name}</TableCell>
                    <TableCell className="py-2 px-3 text-xs text-muted-foreground">
                      {format(new Date(gc.created_at), "d MMM yy")}
                    </TableCell>
                    <TableCell className="py-2 px-3 text-xs text-muted-foreground">
                      {format(new Date(gc.expires_at), "d MMM yy")}
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <Badge variant="secondary" className={cn("text-[10px] font-semibold", statusColors[gc.status] || "bg-gray-100")}>
                        {statusLabels[gc.status] || gc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                          <Link to={`/admin/gift-cards/${gc.id}`}>
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setPendingDeleteId(gc.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette gift card ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La gift card sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => pendingDeleteId && deleteMutation.mutate(pendingDeleteId)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
