import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye, CheckCircle2, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ErrorStatus = "new" | "seen" | "fixed" | "ignored";

type ErrorGroup = {
  id: string;
  fingerprint: string;
  message: string;
  stack: string | null;
  page_url: string | null;
  occurrences: number;
  first_seen_at: string;
  last_seen_at: string;
  status: ErrorStatus;
};

const statusLabels: Record<ErrorStatus, string> = {
  new: "Nouvelle",
  seen: "Vue",
  fixed: "Corrigée",
  ignored: "Ignorée",
};

const statusColors: Record<ErrorStatus, string> = {
  new: "bg-red-100 text-red-700",
  seen: "bg-blue-100 text-blue-700",
  fixed: "bg-green-100 text-green-700",
  ignored: "bg-gray-100 text-gray-500",
};

export default function AdminErrors() {
  const queryClient = useQueryClient();

  const { data: errorGroups, isLoading } = useQuery({
    queryKey: ["admin-error-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("error_groups")
        .select("*")
        .order("last_seen_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as ErrorGroup[];
    },
    refetchInterval: 30000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ErrorStatus }) => {
      const { error } = await supabase
        .from("error_groups")
        .update({ status, status_updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-error-groups"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-new-errors-count"] });
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour du statut");
    },
  });

  const kpis = useMemo(() => {
    const groups = errorGroups ?? [];
    const newCount = groups.filter((g) => g.status === "new").length;
    const totalOccurrences = groups.reduce((sum, g) => sum + g.occurrences, 0);
    const mostFrequent = groups.reduce<ErrorGroup | null>((best, g) => {
      if (!best || g.occurrences > best.occurrences) return g;
      return best;
    }, null);
    return { newCount, totalOccurrences, mostFrequent };
  }, [errorGroups]);

  const groupsList = errorGroups ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Erreurs</h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          Erreurs rencontrées par les visiteurs sur le site, regroupées par type. Reste en rouge tant
          qu'aucun statut n'est choisi.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Non traitées
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className={cn("font-mono text-xl font-bold", kpis.newCount > 0 && "text-destructive")}>
              {kpis.newCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Occurrences totales
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="font-mono text-xl font-bold">{kpis.totalOccurrences}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Erreur la plus fréquente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-xs font-medium truncate">
              {kpis.mostFrequent ? `${kpis.mostFrequent.message} (×${kpis.mostFrequent.occurrences})` : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Erreur</TableHead>
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Page</TableHead>
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Occurrences</TableHead>
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Vue la dernière fois</TableHead>
              <TableHead className="h-8 px-3 text-[10px] uppercase tracking-wider">Statut</TableHead>
              <TableHead className="h-8 w-[220px] px-3 text-[10px] uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-sm">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : groupsList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-sm text-muted-foreground">
                  Aucune erreur signalée. C'est bon signe.
                </TableCell>
              </TableRow>
            ) : (
              groupsList.map((group) => (
                <TableRow key={group.id} className={cn(group.status === "new" && "bg-destructive/5")}>
                  <TableCell className="py-2 px-3 text-xs font-medium max-w-[320px] truncate" title={group.message}>
                    {group.message}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-xs text-muted-foreground max-w-[160px] truncate" title={group.page_url ?? ""}>
                    {group.page_url || "—"}
                  </TableCell>
                  <TableCell className="py-2 px-3 font-mono text-xs">×{group.occurrences}</TableCell>
                  <TableCell className="py-2 px-3 text-xs text-muted-foreground" title={format(new Date(group.last_seen_at), "d MMM yyyy à HH:mm")}>
                    {formatDistanceToNow(new Date(group.last_seen_at), { addSuffix: true, locale: fr })}
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <Badge variant="secondary" className={cn("text-[10px] font-semibold", statusColors[group.status])}>
                      {statusLabels[group.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 px-3">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("h-7 px-2 text-[11px]", group.status === "seen" && "bg-blue-100 text-blue-700")}
                        disabled={updateStatusMutation.isPending}
                        onClick={() => updateStatusMutation.mutate({ id: group.id, status: "seen" })}
                      >
                        <Eye className="h-3 w-3 mr-1" /> Vu
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("h-7 px-2 text-[11px]", group.status === "fixed" && "bg-green-100 text-green-700")}
                        disabled={updateStatusMutation.isPending}
                        onClick={() => updateStatusMutation.mutate({ id: group.id, status: "fixed" })}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Fixed
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("h-7 px-2 text-[11px]", group.status === "ignored" && "bg-gray-200 text-gray-700")}
                        disabled={updateStatusMutation.isPending}
                        onClick={() => updateStatusMutation.mutate({ id: group.id, status: "ignored" })}
                      >
                        <EyeOff className="h-3 w-3 mr-1" /> Ignorer
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
