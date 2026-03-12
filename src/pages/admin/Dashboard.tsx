import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  DollarSign,
  Building2,
  TrendingUp,
  Percent,
  XCircle,
  BedDouble,
  BarChart3,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

type PeriodFilter = "7d" | "30d" | "90d" | "all";
type ChartGranularity = "day" | "week" | "month";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#10b981",
  pending: "#f59e0b",
  cancelled: "#ef4444",
  completed: "hsl(var(--primary))",
  "no-show": "#6b7280",
};

const AdminDashboard = () => {
  const [period, setPeriod] = useState<PeriodFilter>("30d");
  const [granularity, setGranularity] = useState<ChartGranularity>("day");

  const dateFrom = useMemo(() => {
    if (period === "all") return null;
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    return startOfDay(subDays(new Date(), days));
  }, [period]);

  // ─── Fetch bookings_hg ───
  const { data: bookings, isLoading } = useQuery({
    queryKey: ["dashboard-bookings-hg", period],
    queryFn: async () => {
      let query = supabase
        .from("bookings_hg" as any)
        .select("*");
      if (dateFrom) {
        query = query.gte("created_at", dateFrom.toISOString());
      }
      const { data, error } = await query as any;
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // ─── Fetch hotels2 for name mapping ───
  const { data: hotels } = useQuery({
    queryKey: ["dashboard-hotels2"],
    queryFn: async () => {
      const { data } = await supabase
        .from("hotels2")
        .select("id, name, number_of_rooms");
      return data || [];
    },
  });

  // ─── "Actions requises" data ───
  const { data: pendingBookingsCount } = useQuery({
    queryKey: ["dashboard-pending-bookings"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("bookings" as any)
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) return 0;
      return count || 0;
    },
  });

  const { data: experiencesNoCover } = useQuery({
    queryKey: ["dashboard-experiences-no-cover"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences2")
        .select("id, hero_image")
        .eq("status", "published");
      if (error) return 0;
      return data?.filter((e) => !e.hero_image).length || 0;
    },
  });

  const { data: emptyPublishedCategories } = useQuery({
    queryKey: ["dashboard-empty-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, experiences(id)")
        .eq("status", "published");
      if (error) return 0;
      return data?.filter((c) => !c.experiences || c.experiences.length === 0).length || 0;
    },
  });

  const hotelMap = useMemo(() => {
    const map: Record<string, { name: string; rooms: number }> = {};
    hotels?.forEach((h) => {
      map[h.id] = { name: h.name, rooms: h.number_of_rooms || 0 };
    });
    return map;
  }, [hotels]);

  // ─── KPI calculations ───
  const kpis = useMemo(() => {
    if (!bookings) return null;

    const active = bookings.filter((b: any) => !b.is_cancelled);
    const cancelled = bookings.filter((b: any) => b.is_cancelled);

    const totalRevenue = active.reduce((s: number, b: any) => s + parseFloat(b.sell_price || "0"), 0);
    const totalCommission = active.reduce((s: number, b: any) => s + parseFloat(b.commission_amount || "0"), 0);
    const totalNights = active.reduce((s: number, b: any) => s + (b.nights || 0), 0);
    const adr = totalNights > 0 ? totalRevenue / totalNights : 0;

    const totalRooms = hotels?.reduce((s, h) => s + (h.number_of_rooms || 0), 0) || 0;
    const daysInPeriod = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
    const availableRoomNights = totalRooms * daysInPeriod;
    const revpar = availableRoomNights > 0 ? totalRevenue / availableRoomNights : 0;
    const occupancy = availableRoomNights > 0 ? (totalNights / availableRoomNights) * 100 : 0;

    return {
      bookingsCount: active.length,
      cancelledCount: cancelled.length,
      totalRevenue,
      totalCommission,
      adr,
      revpar,
      occupancy: Math.min(occupancy, 100),
    };
  }, [bookings, hotels, period]);

  // ─── Revenue over time chart data ───
  const revenueChartData = useMemo(() => {
    if (!bookings) return [];
    const active = bookings.filter((b: any) => !b.is_cancelled);
    const now = new Date();
    const start = dateFrom || subDays(now, 365);

    let intervals: Date[];
    let formatStr: string;

    if (granularity === "day") {
      intervals = eachDayOfInterval({ start, end: now });
      formatStr = "dd/MM";
    } else if (granularity === "week") {
      intervals = eachWeekOfInterval({ start, end: now }, { weekStartsOn: 1 });
      formatStr = "dd/MM";
    } else {
      intervals = eachMonthOfInterval({ start, end: now });
      formatStr = "MMM yy";
    }

    return intervals.map((d) => {
      const nextD = granularity === "day"
        ? new Date(d.getTime() + 86400000)
        : granularity === "week"
        ? new Date(d.getTime() + 7 * 86400000)
        : new Date(d.getFullYear(), d.getMonth() + 1, 1);

      const periodBookings = active.filter((b: any) => {
        const bDate = new Date(b.created_at);
        return bDate >= d && bDate < nextD;
      });

      return {
        label: format(d, formatStr),
        revenue: periodBookings.reduce((s: number, b: any) => s + parseFloat(b.sell_price || "0"), 0),
        commission: periodBookings.reduce((s: number, b: any) => s + parseFloat(b.commission_amount || "0"), 0),
        count: periodBookings.length,
      };
    });
  }, [bookings, dateFrom, granularity]);

  // ─── Status distribution ───
  const statusData = useMemo(() => {
    if (!bookings) return [];
    const counts: Record<string, number> = {};
    bookings.forEach((b: any) => {
      const s = b.is_cancelled ? "cancelled" : (b.status || "confirmed");
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [bookings]);

  // ─── Top hotels ───
  const topHotelsData = useMemo(() => {
    if (!bookings) return [];
    const map: Record<string, { revenue: number; count: number }> = {};
    bookings
      .filter((b: any) => !b.is_cancelled)
      .forEach((b: any) => {
        const hid = b.hotel_id || "unknown";
        if (!map[hid]) map[hid] = { revenue: 0, count: 0 };
        map[hid].revenue += parseFloat(b.sell_price || "0");
        map[hid].count++;
      });

    return Object.entries(map)
      .map(([id, data]) => ({
        name: hotelMap[id]?.name || id.slice(0, 8),
        revenue: Math.round(data.revenue),
        count: data.count,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [bookings, hotelMap]);

  // ─── Board type distribution ───
  const boardTypeData = useMemo(() => {
    if (!bookings) return [];
    const counts: Record<string, number> = {};
    bookings
      .filter((b: any) => !b.is_cancelled)
      .forEach((b: any) => {
        const bt = b.board_type || "N/A";
        counts[bt] = (counts[bt] || 0) + 1;
      });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [bookings]);

  const currencySymbol = "$";

  const totalActions = (pendingBookingsCount || 0) + (experiencesNoCover || 0) + (emptyPublishedCategories || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">Vue d'ensemble – données réelles</p>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
          <TabsList>
            <TabsTrigger value="7d">7j</TabsTrigger>
            <TabsTrigger value="30d">30j</TabsTrigger>
            <TabsTrigger value="90d">90j</TabsTrigger>
            <TabsTrigger value="all">Tout</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Actions requises */}
      {totalActions > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Actions requises
              <Badge variant="outline" className="ml-2 border-orange-300 text-orange-700">
                {totalActions}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {(pendingBookingsCount || 0) > 0 && (
                <Link
                  to="/admin/reservations"
                  className="flex items-center justify-between p-2.5 rounded-md bg-background border hover:bg-accent/50 transition-colors group"
                >
                  <span className="text-sm">
                    <span className="font-semibold text-orange-600">{pendingBookingsCount}</span>{" "}
                    réservation{(pendingBookingsCount || 0) > 1 ? "s" : ""} en attente
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              )}
              {(experiencesNoCover || 0) > 0 && (
                <Link
                  to="/admin/experiences2"
                  className="flex items-center justify-between p-2.5 rounded-md bg-background border hover:bg-accent/50 transition-colors group"
                >
                  <span className="text-sm">
                    <span className="font-semibold text-orange-600">{experiencesNoCover}</span>{" "}
                    expérience{(experiencesNoCover || 0) > 1 ? "s" : ""} sans photo de couverture
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              )}
              {(emptyPublishedCategories || 0) > 0 && (
                <Link
                  to="/admin/categories"
                  className="flex items-center justify-between p-2.5 rounded-md bg-background border hover:bg-accent/50 transition-colors group"
                >
                  <span className="text-sm">
                    <span className="font-semibold text-orange-600">{emptyPublishedCategories}</span>{" "}
                    catégorie{(emptyPublishedCategories || 0) > 1 ? "s" : ""} publiée{(emptyPublishedCategories || 0) > 1 ? "s" : ""} sans expériences
                  </span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <KpiCard
          title="Réservations"
          value={kpis?.bookingsCount ?? 0}
          icon={<Calendar className="h-4 w-4" />}
          loading={isLoading}
        />
        <KpiCard
          title="CA (Sell)"
          value={`${currencySymbol}${(kpis?.totalRevenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={<DollarSign className="h-4 w-4" />}
          loading={isLoading}
        />
        <KpiCard
          title="Commission"
          value={`${currencySymbol}${(kpis?.totalCommission ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={<TrendingUp className="h-4 w-4" />}
          loading={isLoading}
          className="bg-green-50/50 border-green-200"
        />
        <KpiCard
          title="ADR"
          value={`${currencySymbol}${(kpis?.adr ?? 0).toFixed(0)}`}
          icon={<BedDouble className="h-4 w-4" />}
          loading={isLoading}
        />
        <KpiCard
          title="RevPAR"
          value={`${currencySymbol}${(kpis?.revpar ?? 0).toFixed(0)}`}
          icon={<BarChart3 className="h-4 w-4" />}
          loading={isLoading}
        />
        <KpiCard
          title="Occupation"
          value={`${(kpis?.occupancy ?? 0).toFixed(1)}%`}
          icon={<Percent className="h-4 w-4" />}
          loading={isLoading}
        />
        <KpiCard
          title="Annulations"
          value={kpis?.cancelledCount ?? 0}
          icon={<XCircle className="h-4 w-4" />}
          loading={isLoading}
          className="bg-red-50/50 border-red-200"
        />
        <KpiCard
          title="Hôtels actifs"
          value={hotels?.length ?? 0}
          icon={<Building2 className="h-4 w-4" />}
          loading={isLoading}
        />
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Chiffre d'affaires & Commission</CardTitle>
          <Tabs value={granularity} onValueChange={(v) => setGranularity(v as ChartGranularity)}>
            <TabsList className="h-8">
              <TabsTrigger value="day" className="text-xs px-2 h-6">Jour</TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-2 h-6">Semaine</TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-2 h-6">Mois</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number) => `${currencySymbol}${value.toLocaleString()}`}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="CA"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="commission"
                  name="Commission"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bottom row */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Réservations par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {statusData.map((entry, i) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name] || COLORS[i % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top hôtels (CA)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {topHotelsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topHotelsData} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      formatter={(value: number) => `${currencySymbol}${value.toLocaleString()}`}
                    />
                    <Bar dataKey="revenue" name="CA" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">Aucune donnée</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Répartition board type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {boardTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={boardTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value }) => `${name} (${value})`}
                    >
                      {boardTypeData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">Aucune donnée</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function KpiCard({
  title,
  value,
  icon,
  loading,
  className = "",
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  loading: boolean;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3">
        <CardTitle className="text-xs font-medium">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {loading ? (
          <div className="h-7 w-16 bg-muted animate-pulse rounded" />
        ) : (
          <div className="text-xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

export default AdminDashboard;
