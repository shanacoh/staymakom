import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, CreditCard, Percent, Loader2, Download } from "lucide-react";

export default function HotelBilling() {
  const { user } = useAuth();

  const { data: hotelAdmin } = useQuery({
    queryKey: ["hotel-admin", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotel_admins")
        .select("hotel_id")
        .eq("user_id", user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: hotel } = useQuery({
    queryKey: ["hotel", hotelAdmin?.hotel_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hotels")
        .select("commission_rate")
        .eq("id", hotelAdmin?.hotel_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!hotelAdmin?.hotel_id,
  });

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["billing-bookings", hotelAdmin?.hotel_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("hotel_id", hotelAdmin?.hotel_id)
        .in("status", ["confirmed", "paid"]);
      
      if (error) throw error;
      return data;
    },
    enabled: !!hotelAdmin?.hotel_id,
  });

  // Calculate stats
  const totalRevenue = bookings?.reduce((sum, b) => sum + Number(b.total_price), 0) || 0;
  const commissionRate = Number(hotel?.commission_rate || 18);
  const totalCommission = (totalRevenue * commissionRate) / 100;
  const netRevenue = totalRevenue - totalCommission;
  
  // This month stats
  const thisMonth = bookings?.filter((b) => {
    const bookingDate = new Date(b.created_at!);
    const now = new Date();
    return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
  }) || [];
  
  const monthRevenue = thisMonth.reduce((sum, b) => sum + Number(b.total_price), 0);
  const monthCommission = (monthRevenue * commissionRate) / 100;
  const monthNet = monthRevenue - monthCommission;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-sans text-4xl font-bold">Facturation & Commissions</h1>
          <p className="text-muted-foreground mt-2">
            Vue d'ensemble de vos revenus et commissions
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {bookings?.length || 0} bookings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Commission Plateforme</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalCommission.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {commissionRate}% de commission
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Revenu Net</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${netRevenue.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  After commission
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${monthNet.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {thisMonth.length} bookings
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Détails des Revenus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">Total Gross Revenue</p>
                    <p className="text-sm text-muted-foreground">
                      Total from all confirmed bookings
                    </p>
                  </div>
                  <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div>
                    <p className="font-semibold">Commission Plateforme ({commissionRate}%)</p>
                    <p className="text-sm text-muted-foreground">
                      Frais de service de la plateforme
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    -${totalCommission.toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 border-2 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <div>
                    <p className="font-bold text-lg">Net Revenue to Receive</p>
                    <p className="text-sm text-muted-foreground">
                      Total amount after commission
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-green-600">
                    ${netRevenue.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
