import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { WarningBadge } from "@/components/admin/StatusBadge";
import { Tile } from "@/components/admin/DashboardTiles";
import { RankedList, RankedItem } from "@/components/admin/RankedList";
import {
  Heart, User, Mail, Phone, Copy, Download, CheckCircle2, ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";

const heartBadgeClass = "bg-red-50 text-red-600 border-red-200";
const marketingBadgeClass = "bg-[#DCFCE7] text-[#16A34A] border-[#DCFCE7]";

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
                className={`${heartBadgeClass} flex items-center gap-1`}
              >
                <Heart className="h-3 w-3" />
                {stat.experiences.length}
              </Badge>
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                {stat.displayName || "Unknown User"}
              </h3>
              {stat.marketingOptIn && (
                <Badge className={`${marketingBadgeClass} text-xs`}>
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
  const [selectedUser, setSelectedUser] = useState<UserStat | null>(null);
  const [activeTab, setActiveTab] = useState("by-experience");
  const [showAllExperiences, setShowAllExperiences] = useState(false);

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

  const relanceUserStats = [...userStatsList]
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

  const topCategories: RankedItem[] = [...categoryCounts.entries()]
    .map(([id, count]) => ({ key: id, label: categoryMap.get(id) || "Autre", count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const topCities: RankedItem[] = [...cityCounts.entries()]
    .map(([city, count]) => ({ key: city, label: city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Deux catégories qui reflètent la réalité du site client : les expériences liées à
  // un hôtel ("Hôtel + Expérience") et les expériences vendues seules ("Expérience seule").
  const topHotelExperiences: RankedItem[] = experienceStatsList
    .filter((stat) => stat.experience?.type !== "standalone")
    .map((stat) => ({
      key: stat.experience?.key || `unknown-${stat.lastAdded}`,
      label: stat.experience?.title || "Expérience inconnue",
      sublabel: stat.experience?.hotelName || undefined,
      count: stat.count,
    }));

  const topStandaloneExperiences: RankedItem[] = experienceStatsList
    .filter((stat) => stat.experience?.type === "standalone")
    .map((stat) => ({
      key: stat.experience?.key || `unknown-${stat.lastAdded}`,
      label: stat.experience?.title || "Expérience inconnue",
      sublabel: stat.experience?.categoryId ? categoryMap.get(stat.experience.categoryId) : undefined,
      count: stat.count,
    }));

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
        <h1 className="text-2xl font-bold text-foreground">Favoris</h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          Qui aime quoi, et qui n'a jamais réservé malgré ses favoris.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Tile label="Total favoris">
          <div className="font-mono text-xl font-bold">{totalFavorites}</div>
        </Tile>

        <Tile label="Utilisateurs uniques">
          <div className="font-mono text-xl font-bold">{uniqueUsers}</div>
        </Tile>

        <Tile label="Expériences favorites">
          <div className="font-mono text-xl font-bold">{uniqueExperiences}</div>
        </Tile>

        <Tile label="Marketing opt-in">
          <div className="font-mono text-xl font-bold">{marketingOptInCount}</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {uniqueUsers > 0 ? Math.round((marketingOptInCount / uniqueUsers) * 100) : 0}% des utilisateurs
          </p>
        </Tile>

        <Card
          className="border-destructive/30 bg-destructive/5 cursor-pointer hover:bg-destructive/10 transition-colors"
          onClick={() => setActiveTab("relance")}
        >
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-[10px] uppercase tracking-wider font-semibold text-destructive">
              Clients à relancer
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="font-mono text-xl font-bold text-destructive">{neverBookedCount}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {uniqueUsers > 0 ? Math.round((neverBookedCount / uniqueUsers) * 100) : 0}% des utilisateurs favoris
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="by-experience">By Experience</TabsTrigger>
            <TabsTrigger value="by-user">By User</TabsTrigger>
            <TabsTrigger value="relance" className="gap-1">
              Clients à relancer
              {neverBookedCount > 0 && (
                <Badge variant="secondary" className={`${heartBadgeClass} ml-1`}>
                  {neverBookedCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="by-experience" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">Chargement des favoris...</div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <RankedList
                  title="Hôtel + Expérience"
                  items={topHotelExperiences}
                  emptyLabel="Aucun favori sur ce type"
                  maxRows={showAllExperiences ? topHotelExperiences.length : 10}
                />
                <RankedList
                  title="Expérience seule"
                  items={topStandaloneExperiences}
                  emptyLabel="Aucun favori sur ce type"
                  maxRows={showAllExperiences ? topStandaloneExperiences.length : 10}
                />
              </div>
              {!showAllExperiences && (topHotelExperiences.length > 10 || topStandaloneExperiences.length > 10) && (
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={() => setShowAllExperiences(true)}
                >
                  Voir toutes les expériences
                </button>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <RankedList title="Top catégories" items={topCategories} icon={null} emptyLabel="Aucune donnée" />
                <RankedList title="Top villes" items={topCities} icon={null} emptyLabel="Aucune donnée" />
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="by-user">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Utilisateurs avec favoris
            </div>
            <Button variant="outline" size="sm" onClick={() => exportCSV()} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">Loading favorites...</div>
          ) : !userStatsList?.length ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No favorites found
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {userStatsList.map((stat) => (
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
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
              À relancer en priorité
            </div>
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
