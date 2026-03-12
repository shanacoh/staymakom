import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Heart, User, Sparkles, Building2, Mail, Phone, Copy, Download, CheckCircle2 } from "lucide-react";
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

const AdminFavorites = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [hotelFilter, setHotelFilter] = useState<string>("all");

  // Fetch all wishlist items with user and experience details
  const { data: wishlistItems, isLoading } = useQuery({
    queryKey: ["admin-wishlist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlist")
        .select(`
          id,
          user_id,
          experience_id,
          created_at,
          deleted_at,
          experiences (
            id,
            title,
            slug,
            hotel_id,
            hotels (id, name)
          )
        `)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
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
        .from("hotels")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Define types for stats
  interface ExperienceStat {
    experience: any;
    count: number;
    lastAdded: string;
  }

  interface UserStat {
    userId: string;
    email: string;
    displayName: string | null;
    phone: string | null;
    marketingOptIn: boolean;
    experiences: any[];
    lastAdded: string;
  }

  // Group by experience for the "By Experience" view
  const experienceStats = wishlistItems?.reduce((acc, item) => {
    const expId = item.experience_id;
    if (!acc[expId]) {
      acc[expId] = {
        experience: item.experiences,
        count: 0,
        lastAdded: item.created_at,
      };
    }
    acc[expId].count++;
    if (new Date(item.created_at) > new Date(acc[expId].lastAdded)) {
      acc[expId].lastAdded = item.created_at;
    }
    return acc;
  }, {} as Record<string, ExperienceStat>);

  const experienceStatsList: ExperienceStat[] = (Object.values(experienceStats || {}) as ExperienceStat[]).sort(
    (a, b) => b.count - a.count
  );

  // Group by user for the "By User" view - now with enriched data
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
    acc[userId].experiences.push(item.experiences);
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
      hotelFilter === "all" || stat.experience?.hotel_id === hotelFilter;
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
      stat.experiences.map((e) => e?.title || "").join("; "),
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
  const uniqueExperiences = new Set(wishlistItems?.map((w) => w.experience_id)).size;
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
                <Card key={stat.experience?.id || index}>
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
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {stat.experience?.hotels?.name || "Unknown Hotel"}
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
                <Card key={stat.userId}>
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
                          {stat.experiences.slice(0, 5).map((exp, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {exp?.title || "Unknown"}
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
                          onClick={() => copyEmail(stat.email)}
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
    </div>
  );
};

export default AdminFavorites;