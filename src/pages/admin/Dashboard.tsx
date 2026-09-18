import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { subDays, isAfter } from "date-fns";
import { AlertTriangle, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Lead = {
  created_at: string;
};

type BookingIssue = {
  title: string;
  description: string;
  link: string;
  created_at: string;
};

// Une réservation "confirmée" côté back-office mais sans confirmation de paiement reçue
// est le signal de bug le plus fréquent (webhook de paiement en échec, désynchro Revolut) :
// c'est le seul cas remonté ici, pas de todo métier générale (celles-ci vivent dans "Actions à faire").
function useUnpaidConfirmedBookings() {
  const { data: hotelIssues } = useQuery({
    queryKey: ["dashboard-issues-bookings-hg"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("bookings_hg" as any)
        .select("id, customer_name, hg_booking_id, status, payment_status, is_cancelled, created_at")
        .eq("status", "confirmed")
        .eq("is_cancelled", false)
        .neq("payment_status", "paid")
        .order("created_at", { ascending: true })
        .limit(20) as any);
      if (error) return [];
      return (data || []) as any[];
    },
  });

  const { data: standaloneIssues } = useQuery({
    queryKey: ["dashboard-issues-standalone-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("standalone_bookings")
        .select("id, customer_name, status, payment_status, is_cancelled, created_at")
        .eq("status", "confirmed")
        .eq("is_cancelled", false)
        .neq("payment_status", "paid")
        .order("created_at", { ascending: true })
        .limit(20);
      if (error) return [];
      return data || [];
    },
  });

  return useMemo<BookingIssue[]>(() => {
    const issues: BookingIssue[] = [];
    (hotelIssues || []).forEach((b: any) => {
      issues.push({
        title: "Webhook de paiement en échec",
        description: `La réservation ${b.hg_booking_id || b.id.slice(0, 8)} (${b.customer_name || "client inconnu"}) est passée en « Confirmé » côté back-office sans confirmation de paiement reçue. Vérifie qu'elle est réellement encaissée avant de la traiter comme telle.`,
        link: "/admin/bookings",
        created_at: b.created_at,
      });
    });
    (standaloneIssues || []).forEach((b: any) => {
      issues.push({
        title: "Webhook de paiement en échec",
        description: `La réservation standalone ${b.id.slice(0, 8)} (${b.customer_name || "client inconnu"}) est passée en « Confirmé » côté back-office sans confirmation de paiement reçue. Vérifie qu'elle est réellement encaissée avant de la traiter comme telle.`,
        link: "/admin/standalone-bookings",
        created_at: b.created_at,
      });
    });
    return issues.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [hotelIssues, standaloneIssues]);
}

function TrendArrow({ current, previous }: { current: number; previous: number }) {
  if (current === previous) return null;
  return current > previous ? (
    <ArrowUp className="h-4 w-4 text-green-600" />
  ) : (
    <ArrowDown className="h-4 w-4 text-red-500" />
  );
}

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">{children}</CardContent>
    </Card>
  );
}

// Réservations / Encaissé / Commission dépendent d'une logique de réservation encore éparpillée
// entre bookings_hg (hôtels, quasi vide) et standalone_bookings (expériences) : tant que Shana n'a
// pas nettoyé/lié cette logique, on affiche un état "à lier" plutôt qu'un chiffre potentiellement faux.
function PendingTile({ label }: { label: string }) {
  return (
    <Tile label={label}>
      <div className="font-mono text-xl font-bold text-muted-foreground">—</div>
      <div className="text-[10px] font-semibold text-destructive mt-1">
        À lier une fois résa finalisée
      </div>
    </Tile>
  );
}

function LeadsTile({
  count,
  previousCount,
  previousLabel,
}: {
  count: number;
  previousCount: number;
  previousLabel: string;
}) {
  return (
    <Tile label="Leads inscrits">
      <div className="flex items-center gap-1.5">
        <div className="font-mono text-xl font-bold">{count}</div>
        <TrendArrow current={count} previous={previousCount} />
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">
        vs {previousCount} {previousLabel}
      </div>
    </Tile>
  );
}

const AdminDashboard = () => {
  const issues = useUnpaidConfirmedBookings();

  const { data: leads } = useQuery({
    queryKey: ["dashboard-leads-pulse"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("created_at")
        .limit(10000);
      if (error) throw error;
      return data as Lead[];
    },
  });

  const pulse = useMemo(() => {
    const list = leads || [];
    const now = new Date();

    const sevenDaysAgo = subDays(now, 7);
    const fourteenDaysAgo = subDays(now, 14);
    const weekCount = list.filter((l) => isAfter(new Date(l.created_at), sevenDaysAgo)).length;
    const previousWeekCount = list.filter(
      (l) => isAfter(new Date(l.created_at), fourteenDaysAgo) && !isAfter(new Date(l.created_at), sevenDaysAgo)
    ).length;

    const thirtyDaysAgo = subDays(now, 30);
    const sixtyDaysAgo = subDays(now, 60);
    const monthCount = list.filter((l) => isAfter(new Date(l.created_at), thirtyDaysAgo)).length;
    const previousMonthCount = list.filter(
      (l) => isAfter(new Date(l.created_at), sixtyDaysAgo) && !isAfter(new Date(l.created_at), thirtyDaysAgo)
    ).length;

    return { weekCount, previousWeekCount, monthCount, previousMonthCount };
  }, [leads]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground text-xs mt-0.5 max-w-2xl">
          L'urgence d'abord, la tendance business ensuite. Le détail chiffré du mois reste dans Réservations et
          Leads : ici, seulement ce qui doit changer ta journée.
        </p>
      </div>

      {issues.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-destructive text-sm">{issues[0].title}</div>
                <p className="text-sm text-muted-foreground mt-1">{issues[0].description}</p>
                {issues.length > 1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    + {issues.length - 1} autre{issues.length - 1 > 1 ? "s" : ""} réservation
                    {issues.length - 1 > 1 ? "s" : ""} dans le même cas.
                  </p>
                )}
              </div>
            </div>
            <Button
              asChild
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 shrink-0"
            >
              <Link to={issues[0].link}>Vérifier la réservation</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
          Pouls des 7 derniers jours <span className="normal-case font-normal">vs 7 jours précédents</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <PendingTile label="Réservations" />
          <PendingTile label="Encaissé" />
          <PendingTile label="Commission" />
          <LeadsTile
            count={pulse.weekCount}
            previousCount={pulse.previousWeekCount}
            previousLabel="7 j précédents"
          />
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
          Pouls des 30 derniers jours <span className="normal-case font-normal">vs 30 jours précédents</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <PendingTile label="Réservations" />
          <PendingTile label="Encaissé" />
          <PendingTile label="Commission" />
          <LeadsTile
            count={pulse.monthCount}
            previousCount={pulse.previousMonthCount}
            previousLabel="30 j précédents"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="p-3 pb-1">
          <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
            Actions à faire
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
          Liste de tâches à créer et à lier aux actions.
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
