import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Calendar, DollarSign, Package, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

export default function HotelExperiences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [openExtras, setOpenExtras] = useState<Record<string, boolean>>({});

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

  const { data: experiences, isLoading } = useQuery({
    queryKey: ["hotel-experiences", hotelAdmin?.hotel_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select(`
          *,
          categories(name)
        `)
        .eq("hotel_id", hotelAdmin?.hotel_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!hotelAdmin?.hotel_id,
  });

  const { data: experienceExtras } = useQuery({
    queryKey: ["experience-extras-links", hotelAdmin?.hotel_id],
    queryFn: async () => {
      if (!experiences) return [];
      
      const experienceIds = experiences.map(e => e.id);
      
      const { data, error } = await supabase
        .from("experience_extras")
        .select(`
          experience_id,
          extra_id,
          extras (*)
        `)
        .in("experience_id", experienceIds);
      
      if (error) throw error;
      return data;
    },
    enabled: !!experiences && experiences.length > 0,
  });

  const { data: bookingStats } = useQuery({
    queryKey: ["experience-booking-stats", hotelAdmin?.hotel_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("experience_id, total_price, status, created_at")
        .eq("hotel_id", hotelAdmin?.hotel_id);
      
      if (error) throw error;

      const stats = data.reduce((acc: Record<string, any>, booking) => {
        if (!acc[booking.experience_id]) {
          acc[booking.experience_id] = {
            totalBookings: 0,
            confirmedBookings: 0,
            totalRevenue: 0,
          };
        }
        acc[booking.experience_id].totalBookings += 1;
        if (booking.status === "confirmed") {
          acc[booking.experience_id].confirmedBookings += 1;
        }
        acc[booking.experience_id].totalRevenue += Number(booking.total_price);
        
        return acc;
      }, {});

      return stats;
    },
    enabled: !!hotelAdmin?.hotel_id,
  });

  const toggleExtraMutation = useMutation({
    mutationFn: async ({ extraId, isAvailable }: { extraId: string; isAvailable: boolean }) => {
      const { error } = await supabase
        .from("extras")
        .update({ is_available: isAvailable })
        .eq("id", extraId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Extra availability updated");
      queryClient.invalidateQueries({ queryKey: ["experience-extras-links", hotelAdmin?.hotel_id] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update extra");
    },
  });

  const handleToggleExtra = (extraId: string, currentAvailability: boolean) => {
    toggleExtraMutation.mutate({ extraId, isAvailable: !currentAvailability });
  };

  const toggleExtrasOpen = (expId: string) => {
    setOpenExtras(prev => ({ ...prev, [expId]: !prev[expId] }));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-sans text-3xl font-bold">Experiences</h1>
        <p className="text-muted-foreground text-sm mt-1">
          View experiences and manage extras availability
        </p>
      </div>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Experience content is managed by STAYMAKOM Admin. You can activate or deactivate extras here.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !experiences || experiences.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-muted-foreground text-center text-sm">
              No experiences available yet. Contact STAYMAKOM Admin to create experiences.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {experiences.map((exp) => {
            const stats = bookingStats?.[exp.id] || {
              totalBookings: 0,
              confirmedBookings: 0,
              totalRevenue: 0,
            };

            const expExtras = experienceExtras?.filter(link => link.experience_id === exp.id).map(link => link.extras) || [];
            const isExtrasOpen = openExtras[exp.id] || false;

            return (
              <Card key={exp.id} className="overflow-hidden flex flex-col">
                {/* Compact Hero */}
                <div className="relative h-32 bg-muted">
                  {exp.hero_image ? (
                    <img
                      src={exp.hero_image}
                      alt={exp.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <Badge
                    variant={exp.status === "published" ? "default" : "secondary"}
                    className="absolute top-2 right-2 text-xs capitalize"
                  >
                    {exp.status}
                  </Badge>
                </div>

                {/* Compact Content */}
                <CardContent className="p-4 flex-1 flex flex-col">
                  {/* Title & Category */}
                  <div className="mb-3">
                    <h3 className="font-semibold text-base line-clamp-1">{exp.title}</h3>
                    <p className="text-xs text-muted-foreground capitalize">
                      {exp.categories?.name || 'No category'}
                    </p>
                  </div>

                  {/* Compact Stats - 2x2 grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-lg font-bold leading-none">{stats.totalBookings}</p>
                        <p className="text-[10px] text-muted-foreground">Bookings</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-lg font-bold leading-none">${Math.round(stats.totalRevenue)}</p>
                        <p className="text-[10px] text-muted-foreground">Revenue</p>
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Extras */}
                  {expExtras.length > 0 && (
                    <Collapsible open={isExtrasOpen} onOpenChange={() => toggleExtrasOpen(exp.id)} className="mt-auto">
                      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 border-t text-sm">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span className="font-medium">Extras</span>
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">{expExtras.length}</Badge>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isExtrasOpen ? 'rotate-180' : ''}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2 space-y-2">
                        {expExtras.map((extra) => (
                          <div
                            key={extra.id}
                            className="flex items-center justify-between p-2 border rounded bg-muted/30"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{extra.name}</p>
                              <p className="text-xs text-muted-foreground">
                                ${extra.price}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                              <Label htmlFor={`extra-${extra.id}`} className="text-xs">
                                {extra.is_available ? "On" : "Off"}
                              </Label>
                              <Switch
                                id={`extra-${extra.id}`}
                                checked={extra.is_available || false}
                                onCheckedChange={() => handleToggleExtra(extra.id, extra.is_available || false)}
                                disabled={toggleExtraMutation.isPending}
                                className="scale-90"
                              />
                            </div>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
