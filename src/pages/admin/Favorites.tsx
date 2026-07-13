import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WarningBadge } from "@/components/admin/StatusBadge";
import {
  Heart, User, Sparkles, Building2, Mail, Phone, Copy, Download, CheckCircle2, ExternalLink, AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface WishlistUser {
  user_id: string;
  user_email: string;
  display_name: string | null;
  phone: string | null;
  marketing_opt_in: boolean;
  created_at: string;
}

type ExperienceType = "experiences" | "experiences2" | "standalone";

const TYPE_LABELS: Record<ExperienceType, string> = {
  experiences: "Expérience (legacy)",
  experiences2: "Hôtel-liée",
  standalone: "Expérience seule",
};

const TYPE_LINK_PREFIX: Record<ExperienceType, string> = {
  experiences: "/experience",
  experiences2: "/experience",
  standalone: "/standalone-experience",
};

interface ResolvedExperience {
  key: string;
  id: string;
  type: ExperienceType;
  title: string;
  slug: string | null;
  hotelId: string | null;
  hotelName: string | null;
  categoryId: string | null;
  city: string | null;
}

interface ExperienceStat {
  experience: ResolvedExperience | null;
  count: number;
  lastAdded: string;
}

interface FavoriteItem {
  experience: ResolvedExperience | null;
  addedAt: string;
}

interface UserStat {
  userId: string;
  email: string;
  displayName: string | null;
  phone: string | null;
  marketingOptIn: boolean;
  experiences: FavoriteItem[];
  lastAdded: string;
}

function UserFavoriteCard({
  stat,
  neverBooked,
  onSelect,
  onCopyEmail,
}: {
  stat: UserStat;
  neverBooked: boolean;
  onSelect: (stat: UserStat) => void;
  onCopyEmail: (email: string) => void;
}) {
  return (
    <Card
      className="cursor-pointer hover:bg-muted/30 transition-colors"
      onClick={() => onSelect(stat)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge
                variant="secondary"
                className="bg-red-100 text-red-700 flex items-center gap-1"
              >
                <Heart className="h-3 w-3" />
                {stat.experiences.length}
              </Badge>
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                {stat.displayName || "Unknown User"}
              </h3>
              {stat.marketingOptIn && (
                <Badge className="bg-green-100 text-green-700 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Marketing OK
                </Badge>
              )}
              {neverBooked && (
                <WarningBadge label="Never booked" tooltip="A des favoris mais aucune réservation" />
              )}
            </div>

            {/* Contact info */}
            <div className="flex items-center gap-4 mt-2 text-sm">
              {stat.email && (
                <a
                  href={`mailto:${stat.email}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Mail className="h-3 w-3" />
                  {stat.email}
                </a>
              )}
              {stat.phone && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {stat.phone}
                </span>
              )}
            </div>

            {/* Favorited experiences */}
            <div className="mt-3 flex flex-wrap gap-1">
              {stat.experiences.slice(0, 5).map((item, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {item.experience?.title || "Unknown"}
                </Badge>
              ))}
              {stat.experiences.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{stat.experiences.length - 5} more
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Last activity:{" "}
              {format(new Date(stat.lastAdded), "MMM d, yyyy")}
            </p>
          </div>

          {/* Copy email button */}
          {stat.email && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onCopyEmail(stat.email);
              }}
              title="Copier l'email"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const AdminFavorites = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [hotelFilter, setHotelFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserStat | null>(null);
  const [activeTab, setActiveTab] = useState("by-experience");

  // Fetch all wishlist items then enrich with experience data from the
  // three possible source tables (hôtel-liée, standalone, legacy)
  const { data: wishlistItems, isLoading } = useQuery({
    queryKey: ["admin-wishlist"],
    queryFn: async () => {
      const { data: rawItems, error } = await supabase
        .from("wishlist")
        .select("id, user_id, experience_id, experience_type, created_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!rawItems || rawItems.length === 0) return [];

      const idsByType = (type: ExperienceType) =>
        [...new Set(
          rawItems
            .filter((w) => (w.experience_type as ExperienceType) === type)
            .map((w) => w.experience_id)
            .filter(Boolean)
        )];

      const experiences2Ids = idsByType("experiences2");
      const experiencesIds = idsByType("experiences");
      const standaloneIds = idsByType("standalone");

      const [experiences2Res, experiencesRes, standaloneRes] = await Promise.all([
        experiences2Ids.length
          ? supabase.from("experiences2").select("id, title, slug, hotel_id, category_id, hotels2(id, name, city, city_fr)").in("id", experiences2Ids)
          : Promise.resolve({ data: [] as any[] }),
        experiencesIds.length
          ? supabase.from("experiences").select("id, title, slug, hotel_id, category_id, hotels(id, name, city, city_fr)").in("id", experiencesIds)
          : Promise.resolve({ data: [] as any[] }),
        standaloneIds.length
          ? (supabase as any).from("standalone_experiences").select("id, title, slug, category_id").in("id", standaloneIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const expMap = new Map<string, ResolvedExperience>();

      (experiences2Res.data || []).forEach((e: any) => {
        expMap.set(`experiences2:${e.id}`, {
          key: `experiences2:${e.id}`,
          id: e.id,
          type: "experiences2",
          title: e.title || "Titre inconnu",
          slug: e.slug,
          hotelId: e.hotel_id || null,
          hotelName: e.hotels2?.name || null,
          categoryId: e.category_id || null,
          city: e.hotels2?.city || e.hotels2?.city_fr || null,
        });
      });
      (experiencesRes.data || []).forEach((e: any) => {
        expMap.set(`experiences:${e.id}`, {
          key: `experiences:${e.id}`,
          id: e.id,
          type: "experiences",
          title: e.title || "Titre inconnu",
          slug: e.slug,
          hotelId: e.hotel_id || null,
          hotelName: e.hotels?.name || null,
          categoryId: e.category_id || null,
          city: e.hotels?.city || e.hotels?.city_fr || null,
        });
      });
      (standaloneRes.data || []).forEach((e: any) => {
        expMap.set(`standalone:${e.id}`, {
          key: `standalone:${e.id}`,
          id: e.id,
          type: "standalone",
          title: e.title || "Titre inconnu",
          slug: e.slug,
          hotelId: null,
          hotelName: null,
          categoryId: e.category_id || null,
          city: null,
        });
      });

      return rawItems.map((item) => ({
        ...item,
        experienceType: item.experience_type as ExperienceType,
        experience: expMap.get(`${item.experience_type}:${item.experience_id}`) || null,
      }));
    },
  });

  // Fetch user profiles with emails using the secure RPC function
  const { data: wishlistUsers } = useQuery({
    queryKey: ["admin-wishlist-users-with-emails"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_wishlist_users_with_emails");
      if (error) throw error;
      return data as WishlistUser[];
    },
  });

  // Fetch hotels for filter
  const { data: hotels } = useQuery({
    queryKey: ["admin-hotels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotels2")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch categories, to label the "tendances produit" breakdown
  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const categoryMap = new Map((categories || []).map((c) => [c.id, c.name]));

  // Which wishlist users have never made a valid (non-cancelled) booking,
  // across the three booking sources that mirror the three experience tables.
  const uniqueUserIds = [...new Set((wishlistItems || []).map((w) => w.user_id))];

  const { data: conversionMap, isLoading: conversionsLoading } = useQuery({
    queryKey: ["admin-wishlist-conversions", uniqueUserIds.slice().sort().join(",")],
    enabled: uniqueUserIds.length > 0,
    queryFn: async () => {
      const [hgRes, standaloneRes, customersRes] = await Promise.all([
        supabase.from("bookings_hg").select("user_id, is_cancelled").in("user_id", uniqueUserIds),
        (supabase as any).from("standalone_bookings").select("user_id, status, is_cancelled").in("user_id", uniqueUserIds),
        supabase.from("customers").select("id, user_id").in("user_id", uniqueUserIds),
      ]);

      const hasBooking = new Set<string>();

      (hgRes.data || []).forEach((b: any) => {
        if (b.user_id && !b.is_cancelled) hasBooking.add(b.user_id);
      });
      (standaloneRes.data || []).forEach((b: any) => {
        if (b.user_id && !b.is_cancelled && b.status !== "cancelled") hasBooking.add(b.user_id);
      });

      const customerToUser = new Map((customersRes.data || []).map((c: any) => [c.id, c.user_id]));
      const customerIds = [...customerToUser.keys()];
      if (customerIds.length) {
        const { data: legacyBookings } = await supabase
          .from("bookings_safe")
          .select("customer_id, status")
          .in("customer_id", customerIds);
        (legacyBookings || []).forEach((b: any) => {
          if (b.customer_id && b.status && !["cancelled", "failed"].includes(b.status)) {
            const uid = customerToUser.get(b.customer_id);
            if (uid) hasBooking.add(uid);
          }
        });
      }

      return hasBooking;
    },
  });

  // Group by experience for the "By Experience" view
  const experienceStats = wishlistItems?.reduce((acc, item) => {
    const key = `${item.experienceType}:${item.experience_id}`;
    if (!acc[key]) {
      acc[key] = {
        experience: item.experience,
        count: 0,
        lastAdded: item.created_at,
      };
    }
    acc[key].count++;
    if (new Date(item.created_at) > new Date(acc[key].lastAdded)) {
      acc[key].lastAdded = item.created_at;
    }
    return acc;
  }, {} as Record<string, ExperienceStat>);

  const experienceStatsList: ExperienceStat[] = (Object.values(experienceStats || {}) as ExperienceStat[]).sort(
    (a, b) => b.count - a.count
  );

  // Group by user for the "By User" view - now with enriched data across all 3 tables
  const userStats = wishlistItems?.reduce((acc, item) => {
    const userId = item.user_id;
    const userProfile = wishlistUsers?.find((u) => u.user_id === userId);

    if (!acc[userId]) {
      acc[userId] = {
        userId,
        email: userProfile?.user_email || "",
        displayName: userProfile?.display_name || null,
        phone: userProfile?.phone || null,
        marketingOptIn: userProfile?.marketing_opt_in || false,
        experiences: [],
        lastAdded: item.created_at,
      };
    }
    acc[userId].experiences.push({ experience: item.experience, addedAt: item.created_at });
    if (new Date(item.created_at) > new Date(acc[userId].lastAdded)) {
      acc[userId].lastAdded = item.created_at;
    }
    return acc;
  }, {} as Record<string, UserStat>);

  const userStatsList: UserStat[] = (Object.values(userStats || {}) as UserStat[]).sort(
    (a, b) => b.experiences.length - a.experiences.length
  );

  // Filter logic
  const filteredExperienceStats = experienceStatsList.filter((stat) => {
    const matchesSearch = stat.experience?.title
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesHotel =
      hotelFilter === "all" || stat.experience?.hotelId === hotelFilter;
    return matchesSearch && matchesHotel;
  });

  const filteredUserStats = userStatsList.filter((stat) => {
    const matchesSearch =
      stat.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stat.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const relanceUserStats = [...filteredUserStats]
    .filter((stat) => conversionMap && !conversionMap.has(stat.userId))
    .sort((a, b) => {
      if (b.experiences.length !== a.experiences.length) return b.experiences.length - a.experiences.length;
      return new Date(b.lastAdded).getTime() - new Date(a.lastAdded).getTime();
    });

  // "Tendances produit" — favoris regroupés par catégorie et par ville
  const categoryCounts = new Map<string, number>();
  const cityCounts = new Map<string, number>();
  (wishlistItems || []).forEach((item) => {
    const catId = item.experience?.categoryId;
    if (catId) categoryCounts.set(catId, (categoryCounts.get(catId) || 0) + 1);
    if (item.experience?.type !== "standalone" && item.experience?.city) {
      cityCounts.set(item.experience.city, (cityCounts.get(item.experience.city) || 0) + 1);
    }
  });

  const favoritesByCategoryData = [...categoryCounts.entries()]
    .map(([id, count]) => ({ name: categoryMap.get(id) || "Autre", count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const favoritesByCityData = [...cityCounts.entries()]
    .map(([city, count]) => ({ name: city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success("Email copié !");
  };

  const exportCSV = (list: UserStat[] = userStatsList, filenamePrefix = "favorites_users") => {
    const headers = ["Email", "Nom", "Téléphone", "Marketing OK", "Nb Favoris", "Jamais réservé", "Expériences Favorites"];
    const rows = list.map((stat) => [
      stat.email,
      stat.displayName || "",
      stat.phone || "",
      stat.marketingOptIn ? "Oui" : "Non",
      stat.experiences.length.toString(),
      conversionMap && !conversionMap.has(stat.userId) ? "Oui" : "Non",
      stat.experiences.map((e) => e.experience?.title || "").join("; "),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filenamePrefix}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("Export CSV téléchargé !");
  };

  const totalFavorites = wishlistItems?.length || 0;
  const uniqueUsers = new Set(wishlistItems?.map((w) => w.user_id)).size;
  const uniqueExperiences = new Set(wishlistItems?.map((w) => `${w.experienceType}:${w.experience_id}`)).size;
  const marketingOptInCount = userStatsList.filter((u) => u.marketingOptIn).length;
  const neverBookedCount = conversionMap
    ? userStatsList.filter((u) => !conversionMap.has(u.userId)).length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Heart className="h-8 w-8 text-red-500" />
          Favorites Analytics
        </h2>
        <p className="text-muted-foreground">
          See which experiences are most loved by users
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Favorites</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFavorites}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Favorited Experiences
            </CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueExperiences}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Marketing Opt-in</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{marketingOptInCount}</div>
            <p className="text-xs text-muted-foreground">
              {uniqueUsers > 0 ? Math.round((marketingOptInCount / uniqueUsers) * 100) : 0}% des utilisateurs
            </p>
          </CardContent>
        </Card>

        <Card
          className="bg-red-50/50 border-red-200 cursor-pointer hover:bg-red-50 transition-colors"
          onClick={() => setActiveTab("relance")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients à relancer</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{neverBookedCount}</div>
            <p className="text-xs text-muted-foreground">
              {uniqueUsers > 0 ? Math.round((neverBookedCount / uniqueUsers) * 100) : 0}% des utilisateurs favoris
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Search experiences or users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select value={hotelFilter} onValueChange={setHotelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All hotels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All hotels</SelectItem>
                {hotels?.map((hotel) => (
                  <SelectItem key={hotel.id} value={hotel.id}>
                    {hotel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="by-experience">By Experience</TabsTrigger>
            <TabsTrigger value="by-user">By User</TabsTrigger>
            <TabsTrigger value="relance" className="gap-1">
              Clients à relancer
              {neverBookedCount > 0 && (
                <Badge variant="secondary" className="bg-red-100 text-red-700 ml-1">
                  {neverBookedCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="by-experience">
          {/* Tendances produit : favoris par catégorie et par ville */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Favoris par catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  {favoritesByCategoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={favoritesByCategoryData} layout="vertical">
                        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="count" name="Favoris" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-center py-8 text-sm">Aucune donnée</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Favoris par ville</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[220px]">
                  {favoritesByCityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={favoritesByCityData} layout="vertical">
                        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="count" name="Favoris" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-center py-8 text-sm">Aucune donnée</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Hors expériences sans hôtel</p>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <div className="text-center py-12">Loading favorites...</div>
          ) : !filteredExperienceStats?.length ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No favorites found
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredExperienceStats.map((stat, index) => (
                <Card key={stat.experience?.key || index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant="secondary"
                            className="bg-red-100 text-red-700 flex items-center gap-1"
                          >
                            <Heart className="h-3 w-3 fill-current" />
                            {stat.count}
                          </Badge>
                          <h3 className="font-semibold">
                            {stat.experience?.title || "Unknown Experience"}
                          </h3>
                          {stat.experience?.type === "standalone" && (
                            <Badge variant="outline" className="text-xs">Expérience seule</Badge>
                          )}
                          {stat.experience?.categoryId && categoryMap.get(stat.experience.categoryId) && (
                            <Badge variant="outline" className="text-xs">
                              {categoryMap.get(stat.experience.categoryId)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {stat.experience?.type === "standalone"
                              ? "Sans hôtel"
                              : stat.experience?.hotelName || "Unknown Hotel"}
                          </span>
                          <span>
                            Last favorited:{" "}
                            {format(new Date(stat.lastAdded), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="by-user">
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" onClick={() => exportCSV()} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">Loading favorites...</div>
          ) : !filteredUserStats?.length ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No favorites found
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredUserStats.map((stat) => (
                <UserFavoriteCard
                  key={stat.userId}
                  stat={stat}
                  neverBooked={!!conversionMap && !conversionMap.has(stat.userId)}
                  onSelect={setSelectedUser}
                  onCopyEmail={copyEmail}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="relance">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-3">
              Clients ayant mis des expériences en favori mais n'ayant jamais réservé — à recontacter en priorité.
            </p>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportCSV(relanceUserStats, "clients_a_relancer")}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {isLoading || conversionsLoading ? (
            <div className="text-center py-12">Loading favorites...</div>
          ) : !relanceUserStats.length ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Aucun client à relancer pour le moment
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {relanceUserStats.map((stat) => (
                <UserFavoriteCard
                  key={stat.userId}
                  stat={stat}
                  neverBooked
                  onSelect={setSelectedUser}
                  onCopyEmail={copyEmail}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail dialog: full list of a user's favorited items */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              <Heart className="h-5 w-5 text-red-500" />
              Favoris de {selectedUser?.displayName || selectedUser?.email || "cet utilisateur"}
              {selectedUser && conversionMap && !conversionMap.has(selectedUser.userId) && (
                <WarningBadge label="Never booked" tooltip="A des favoris mais aucune réservation" />
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {selectedUser?.experiences.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">
                      {item.experience?.title || "Expérience introuvable"}
                    </span>
                    {item.experience && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {TYPE_LABELS[item.experience.type]}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {item.experience?.hotelName && <span>{item.experience.hotelName} · </span>}
                    Ajouté le {format(new Date(item.addedAt), "d MMM yyyy")}
                  </div>
                </div>
                {item.experience?.slug && (
                  <Link
                    to={`${TYPE_LINK_PREFIX[item.experience.type]}/${item.experience.slug}`}
                    target="_blank"
                    className="shrink-0 text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFavorites;
