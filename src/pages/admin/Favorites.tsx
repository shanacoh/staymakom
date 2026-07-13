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
import { Heart, User, Sparkles, Building2, Mail, Phone, Copy, Download, CheckCircle2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";

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
}

const AdminFavorites = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [hotelFilter, setHotelFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserStat | null>(null);

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
          ? supabase.from("experiences2").select("id, title, slug, hotel_id, hotels2(id, name)").in("id", experiences2Ids)
          : Promise.resolve({ data: [] as any[] }),
        experiencesIds.length
          ? supabase.from("experiences").select("id, title, slug, hotel_id, hotels(id, name)").in("id", experiencesIds)
          : Promise.resolve({ data: [] as any[] }),
        standaloneIds.length
          ? (supabase as any).from("standalone_experiences").select("id, title, slug").in("id", standaloneIds)
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

  // Define types for stats
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

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success("Email copié !");
  };

  const exportCSV = () => {
    const headers = ["Email", "Nom", "Téléphone", "Marketing OK", "Nb Favoris", "Expériences Favorites"];
    const rows = userStatsList.map((stat) => [
      stat.email,
      stat.displayName || "",
      stat.phone || "",
      stat.marketingOptIn ? "Oui" : "Non",
      stat.experiences.length.toString(),
      stat.experiences.map((e) => e.experience?.title || "").join("; "),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `favorites_users_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("Export CSV téléchargé !");
  };

  const totalFavorites = wishlistItems?.length || 0;
  const uniqueUsers = new Set(wishlistItems?.map((w) => w.user_id)).size;
  const uniqueExperiences = new Set(wishlistItems?.map((w) => `${w.experienceType}:${w.experience_id}`)).size;
  const marketingOptInCount = userStatsList.filter((u) => u.marketingOptIn).length;

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
      <div className="grid gap-4 md:grid-cols-4">
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
      <Tabs defaultValue="by-experience" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="by-experience">By Experience</TabsTrigger>
            <TabsTrigger value="by-user">By User</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="by-experience">
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
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
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
                <Card
                  key={stat.userId}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setSelectedUser(stat)}
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
                            copyEmail(stat.email);
                          }}
                          title="Copier l'email"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail dialog: full list of a user's favorited items */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Favoris de {selectedUser?.displayName || selectedUser?.email || "cet utilisateur"}
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
