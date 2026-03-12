import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, DollarSign, FileText, Building2, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

export default function HotelAdminDashboard() {
  const { user } = useAuth();

  const { data: hotelAdmin, isLoading } = useQuery({
    queryKey: ["hotel-admin", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotel_admins")
        .select("*, hotels(*)")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ["hotel-stats", hotelAdmin?.hotel_id],
    queryFn: async () => {
      const [experiencesRes, bookingsRes] = await Promise.all([
        supabase.from("experiences").select("id", { count: "exact" }).eq("hotel_id", hotelAdmin?.hotel_id),
        supabase.from("bookings").select("*").eq("hotel_id", hotelAdmin?.hotel_id),
      ]);

      const bookings = bookingsRes.data || [];
      const pending = bookings.filter(b => b.status === "pending").length;
      const confirmed = bookings.filter(b => b.status === "confirmed").length;
      const revenue = bookings.reduce((sum, b) => sum + Number(b.total_price || 0), 0);

      return {
        experiences: experiencesRes.count || 0,
        totalBookings: bookings.length,
        pending,
        confirmed,
        revenue,
      };
    },
    enabled: !!hotelAdmin?.hotel_id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hotelAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">No hotel assigned to this account.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Hotel Info Card */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center">
              {hotelAdmin.hotels?.hero_image ? (
                <img src={hotelAdmin.hotels.hero_image} alt={hotelAdmin.hotels.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <Building2 className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="font-sans text-3xl font-bold mb-1">{hotelAdmin.hotels?.name}</h1>
                  <p className="text-muted-foreground">{hotelAdmin.hotels?.city}, {hotelAdmin.hotels?.region}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    hotelAdmin.hotels?.status === 'published' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {hotelAdmin.hotels?.status === 'published' ? '✅ Publié' : 'Non publié'}
                  </span>
                  <Button variant="outline" asChild size="sm">
                    <Link to="/hotel-admin/property">Edit</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-8">
        <h2 className="font-sans text-2xl font-bold mb-2">Vue d'ensemble</h2>
        <p className="text-muted-foreground">Aperçu de votre activité</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold">{stats?.pending || 0}</p>
              <Button variant="link" size="sm" asChild>
                <Link to="/hotel-admin/bookings">View</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold">{stats?.confirmed || 0}</p>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expériences actives</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.experiences || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenus générés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${stats?.revenue.toFixed(2) || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Net après commission</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild>
            <Link to="/hotel-admin/experiences">
              <Plus className="mr-2 h-4 w-4" />
              Create Experience
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/hotel-admin/calendar">
              <DollarSign className="mr-2 h-4 w-4" />
              Gérer disponibilités & prix
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/hotel-admin/bookings">
              <FileText className="mr-2 h-4 w-4" />
              View Bookings
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Aucune activité récente à afficher.</p>
        </CardContent>
      </Card>
    </div>
  );
}
