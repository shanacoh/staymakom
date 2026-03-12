import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Users, MapPin, ChevronRight, Clock, Plane, X, AlertTriangle, Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { differenceInDays, format, parseISO, isPast, isBefore, addDays } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/hooks/useLanguage";

interface MyStaymakomSectionProps {
  userId?: string;
}

export default function MyStaymakomSection({ userId }: MyStaymakomSectionProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { lang } = useLanguage();
  const isHebrew = lang === "he";
  const isFrench = lang === "fr";
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  // ✅ #4: Cancel simulation state
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState(false);

  // Fetch V2 bookings (bookings_hg) for the logged-in user
  const { data: bookingsHg, isLoading: loadingHg } = useQuery({
    queryKey: ["my-bookings-hg", userId, timeFilter],
    queryFn: async () => {
      if (!userId) return [];

      let query = supabase
        .from("bookings_hg")
        .select(`
          *,
          experiences2 (title, title_he, slug, hero_image, thumbnail_image),
          hotels2 (name, name_he, city, city_he)
        `)
        .eq("user_id", userId)
        .order("checkin", { ascending: true });

      const today = new Date().toISOString().split("T")[0];
      if (timeFilter === "upcoming") {
        query = query.gte("checkin", today);
      } else if (timeFilter === "past") {
        query = query.lt("checkin", today);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  // Also fetch V1 bookings (legacy)
  const { data: customer } = useQuery({
    queryKey: ["customer", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: bookingsV1, isLoading: loadingV1 } = useQuery({
    queryKey: ["my-bookings-v1", customer?.id, timeFilter],
    queryFn: async () => {
      if (!customer?.id) return [];

      let query = supabase
        .from("bookings")
        .select(`
          *,
          hotels (name, city),
          experiences (title, slug)
        `)
        .eq("customer_id", customer.id)
        .order("checkin", { ascending: true });

      const today = new Date().toISOString().split("T")[0];
      if (timeFilter === "upcoming") {
        query = query.gte("checkin", today);
      } else if (timeFilter === "past") {
        query = query.lt("checkin", today);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!customer?.id,
  });

  // ✅ #4: Simulate cancellation before showing dialog
  const handleCancelClick = async (bookingId: string) => {
    const booking = bookingsHg?.find((b: any) => b.id === bookingId);
    if (!booking) return;

    setIsSimulating(true);
    setSimulationResult(null);
    setSimulationError(false);
    setCancellingBookingId(bookingId);

    try {
      const { simulateCancellation } = await import("@/services/hyperguest");
      const result = await simulateCancellation(booking.hg_booking_id);
      setSimulationResult(result);
    } catch (err: any) {
      
      setSimulationError(true);
    } finally {
      setIsSimulating(false);
    }
  };

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const booking = bookingsHg?.find((b: any) => b.id === bookingId);
      if (!booking) throw new Error("Booking not found");

      
      const { cancelBooking } = await import("@/services/hyperguest");
      
      let hgCancelSuccess = false;
      try {
        await cancelBooking(booking.hg_booking_id);
        hgCancelSuccess = true;
      } catch (err: any) {
        const msg = err?.message || "";
        if (msg.includes("booking cannot be found") || msg.includes("BN.500")) {
          
          hgCancelSuccess = true;
        } else {
          throw err;
        }
      }

      if (hgCancelSuccess) {
        await supabase
          .from("bookings_hg")
          .update({
            is_cancelled: true,
            cancelled_at: new Date().toISOString(),
            status: "cancelled",
          } as any)
          .eq("id", bookingId);

        // ✅ #9: Send cancellation email
        try {
          await supabase.functions.invoke('send-booking-confirmation', {
            body: {
              type: 'cancellation',
              to: booking.customer_email,
              guestName: booking.customer_name,
              experienceTitle: booking.experiences2?.title || 'Experience',
              hotelName: booking.hotels2?.name || 'Hotel',
              checkIn: booking.checkin,
              checkOut: booking.checkout,
              nights: booking.nights,
              partySize: booking.party_size,
              totalPrice: booking.sell_price,
              currency: booking.currency,
              bookingRef: booking.hg_booking_id,
              hgBookingId: booking.hg_booking_id,
              lang: lang,
              cancellationPenalty: simulationResult?.penalty || null,
            },
          });
        } catch (emailErr) {
          // Error handled silently
        }
      }

      return true;
    },
    onSuccess: () => {
      toast.success(isHebrew ? "ההזמנה בוטלה בהצלחה" : isFrench ? "Réservation annulée avec succès" : "Booking cancelled successfully");
      queryClient.invalidateQueries({ queryKey: ["my-bookings-hg"] });
      setCancellingBookingId(null);
      setSimulationResult(null);
    },
    onError: (error: any) => {
      toast.error(isHebrew ? "שגיאה בביטול ההזמנה" : isFrench ? `Échec de l'annulation: ${error.message}` : `Cancellation failed: ${error.message}`);
      setCancellingBookingId(null);
      setSimulationResult(null);
    },
  });

  const canCancel = (booking: any) => {
    if (booking.is_cancelled || booking.status === "cancelled") return false;
    const checkin = parseISO(booking.checkin);
    return isBefore(new Date(), addDays(checkin, -2));
  };

  const getStatusBadge = (status: string, isCancelled: boolean) => {
    if (isCancelled) {
      return <Badge variant="destructive">{isHebrew ? "בוטל" : isFrench ? "Annulé" : "Cancelled"}</Badge>;
    }
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; labelHe: string; labelFr: string }> = {
      pending: { variant: "outline", label: "Pending", labelHe: "ממתין", labelFr: "En attente" },
      confirmed: { variant: "default", label: "Confirmed", labelHe: "מאושר", labelFr: "Confirmé" },
      cancelled: { variant: "destructive", label: "Cancelled", labelHe: "בוטל", labelFr: "Annulé" },
      pendingreview: { variant: "secondary", label: "Under Review", labelHe: "בבדיקה", labelFr: "En cours d'examen" },
    };
    const config = statusConfig[status?.toLowerCase()] || { variant: "outline" as const, label: status, labelHe: status, labelFr: status };
    return <Badge variant={config.variant}>{isHebrew ? config.labelHe : isFrench ? config.labelFr : config.label}</Badge>;
  };

  const getTimeBadge = (checkinDate: string) => {
    const checkin = parseISO(checkinDate);
    const today = new Date();

    if (isPast(checkin)) {
      return (
        <Badge variant="secondary" className="bg-muted text-muted-foreground">
          {isHebrew ? "הסתיים" : isFrench ? "Terminé" : "Completed"}
        </Badge>
      );
    }

    const daysUntil = differenceInDays(checkin, today);

    if (daysUntil === 0) {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          <Plane className="h-3 w-3 mr-1" />
          {isHebrew ? "היום!" : isFrench ? "Aujourd'hui !" : "Today!"}
        </Badge>
      );
    }

    if (daysUntil <= 7) {
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
          <Clock className="h-3 w-3 mr-1" />
          {isHebrew ? `בעוד ${daysUntil} ימים` : isFrench ? `Dans ${daysUntil} jour${daysUntil > 1 ? "s" : ""}` : `In ${daysUntil} day${daysUntil > 1 ? "s" : ""}`}
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="text-muted-foreground">
        <Clock className="h-3 w-3 mr-1" />
        {isHebrew ? `בעוד ${daysUntil} ימים` : isFrench ? `Dans ${daysUntil} jours` : `In ${daysUntil} days`}
      </Badge>
    );
  };

  const isLoading = loadingHg || loadingV1;

  // Merge both V1 and V2 bookings into a unified list
  const allBookings = [
    ...(bookingsHg || []).map((b: any) => ({
      id: b.id,
      type: "v2" as const,
      title: isHebrew ? b.experiences2?.title_he || b.experiences2?.title : b.experiences2?.title || "Experience",
      hotelName: isHebrew ? b.hotels2?.name_he || b.hotels2?.name : b.hotels2?.name || "",
      hotelCity: isHebrew ? b.hotels2?.city_he || b.hotels2?.city : b.hotels2?.city || "",
      checkin: b.checkin,
      checkout: b.checkout,
      nights: b.nights,
      partySize: b.party_size,
      totalPrice: b.sell_price,
      currency: b.currency,
      status: b.status,
      isCancelled: b.is_cancelled,
      roomName: b.room_name,
      hgBookingId: b.hg_booking_id,
      slug: b.experiences2?.slug,
      heroImage: b.experiences2?.thumbnail_image || b.experiences2?.hero_image,
      raw: b,
    })),
    ...(bookingsV1 || []).map((b: any) => ({
      id: b.id,
      type: "v1" as const,
      title: b.experiences?.title || "Experience",
      hotelName: b.hotels?.name || "",
      hotelCity: b.hotels?.city || "",
      checkin: b.checkin,
      checkout: b.checkout,
      nights: differenceInDays(parseISO(b.checkout), parseISO(b.checkin)),
      partySize: b.party_size,
      totalPrice: b.total_price,
      currency: b.currency || "USD",
      status: b.status || "pending",
      isCancelled: b.status === "cancelled",
      roomName: b.selected_room_name,
      hgBookingId: null,
      slug: b.experiences?.slug,
      heroImage: null,
      raw: b,
    })),
  ].sort((a, b) => new Date(a.checkin).getTime() - new Date(b.checkin).getTime());

  // ✅ #4: Get simulation display info
  const getCancelSimulationDisplay = () => {
    if (isSimulating) {
      return {
        loading: true,
        message: isHebrew ? "מחשב עמלות ביטול..." : isFrench ? "Calcul des frais d'annulation..." : "Calculating cancellation fees...",
      };
    }

    if (simulationError) {
      return {
        loading: false,
        message: isHebrew
          ? "לא ניתן לחשב את עמלות הביטול. ייתכנו עמלות ביטול בהתאם למדיניות המלון."
          : isFrench
          ? "Impossible de calculer les frais d'annulation. Des frais peuvent s'appliquer selon la politique de l'hôtel."
          : "Could not calculate cancellation fees. Cancellation fees may apply depending on the hotel's policy.",
        isWarning: true,
      };
    }

    if (simulationResult) {
      // Try to extract penalty info from simulation result
      const penalty = simulationResult.cancellationFee || simulationResult.penalty || simulationResult.amount || 0;
      const refund = simulationResult.refund || simulationResult.refundAmount || 0;

      if (penalty === 0 || simulationResult.freeCancellation) {
        return {
          loading: false,
          message: isHebrew ? "ביטול חינם — ללא עמלות" : isFrench ? "Annulation gratuite — aucun frais" : "Free cancellation — no fees",
          isFree: true,
        };
      }

      const booking = bookingsHg?.find((b: any) => b.id === cancellingBookingId);
      const curr = booking?.currency || "USD";
      const symbol = "$";

      return {
        loading: false,
        message: isHebrew
          ? `עמלת ביטול: ${symbol}${Number(penalty).toLocaleString()}`
          : isFrench
          ? `Frais d'annulation : ${symbol}${Number(penalty).toLocaleString()}`
          : `Cancellation fee: ${symbol}${Number(penalty).toLocaleString()}`,
        hasPenalty: true,
        penalty,
        refund,
      };
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters — pill buttons on mobile, dropdown on desktop */}
      <div className="md:hidden flex gap-2">
        {["upcoming", "past"].map((filter) => (
          <button
            key={filter}
            onClick={() => setTimeFilter(timeFilter === filter ? "all" : filter)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              timeFilter === filter
                ? "bg-[#1A1A1A] text-white"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {filter === "upcoming"
              ? isHebrew ? "עתידיות" : isFrench ? "À venir" : "Upcoming"
              : isHebrew ? "עברו" : isFrench ? "Passées" : "Past"}
          </button>
        ))}
      </div>

      {/* Desktop filter — simplified */}
      <div className="hidden md:flex items-center gap-2 text-muted-foreground text-[13px]" style={{ fontFamily: "Inter, sans-serif" }}>
        <span>Show:</span>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-auto border-0 shadow-none px-0 h-auto font-normal">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isHebrew ? "כל ההזמנות" : isFrench ? "Toutes les réservations" : "All Bookings"}</SelectItem>
            <SelectItem value="upcoming">{isHebrew ? "עתידיות" : isFrench ? "À venir" : "Upcoming"}</SelectItem>
            <SelectItem value="past">{isHebrew ? "עברו" : isFrench ? "Passées" : "Past"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bookings List */}
      {allBookings.length === 0 ? (
        <>
          {/* Mobile empty state — clean, minimal */}
          <div className="md:hidden flex flex-col items-center justify-center pt-20 text-center px-6">
            <Calendar className="h-10 w-10 text-muted-foreground/40 mb-4" />
            <p className="text-[15px] text-foreground mb-1">
              {isHebrew ? "אין הזמנות עדיין." : isFrench ? "Aucune réservation." : "No escapes booked yet."}
            </p>
            <button
              onClick={() => navigate("/launch")}
              className="text-sm text-muted-foreground underline underline-offset-2"
            >
              {isHebrew ? "גלו חוויות" : isFrench ? "Explorer" : "Explore experiences"}
            </button>
          </div>
          {/* Desktop empty state */}
          <Card className="border-dashed hidden md:block">
            <CardContent className="py-16">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-2">
                  <Calendar className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-xl mb-2">{isHebrew ? "אין הזמנות" : isFrench ? "Aucune réservation" : "No bookings found"}</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    {isHebrew
                      ? "גלו את החוויות המיוחדות שלנו והזמינו את ההרפתקה הבאה שלכם!"
                      : isFrench
                      ? "Découvrez nos expériences uniques et réservez votre prochaine aventure !"
                      : "Start exploring our curated experiences and book your next adventure!"}
                  </p>
                </div>
                <Button onClick={() => navigate("/")} variant="cta">
                  {isHebrew ? "גלו חוויות" : isFrench ? "Découvrir les expériences" : "Explore Experiences"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="grid gap-4">
          {allBookings.map((booking) => {
            const _isUpcoming = !isPast(parseISO(booking.checkin));
            const showCancel = booking.type === "v2" && canCancel(booking.raw);
            // ✅ #8: Modify button — same conditions as cancel
            const showModify = showCancel;

            const statusAccentColor = booking.isCancelled || booking.status === "cancelled"
              ? "#C0392B" // red
              : isPast(parseISO(booking.checkin))
              ? "#2D6A4F" // green (completed)
              : "#B8935A"; // gold (pending/upcoming)

            // Determine primary badge to show
            const primaryBadge = booking.isCancelled || booking.status === "cancelled"
              ? getStatusBadge(booking.status, booking.isCancelled)
              : !isPast(parseISO(booking.checkin))
              ? getTimeBadge(booking.checkin)
              : getStatusBadge(booking.status, booking.isCancelled);

            return (
              <Card 
                key={booking.id} 
                className={`hover:shadow-lg transition-shadow overflow-hidden ${booking.isCancelled ? "opacity-60" : ""}`}
                style={{ borderLeft: `3px solid ${statusAccentColor}` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-1">{booking.title}</CardTitle>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="text-sm truncate">
                          {booking.hotelName}{booking.hotelCity ? ` · ${booking.hotelCity}` : ""}
                        </span>
                      </div>
                      {booking.roomName && (
                        <p className="text-xs text-muted-foreground">{booking.roomName}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                      {primaryBadge}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="text-sm min-w-0">
                        <p className="text-muted-foreground text-xs">{isHebrew ? "צ'ק-אין" : isFrench ? "Arrivée" : "Check-in"}</p>
                        <p className="font-medium truncate">{format(parseISO(booking.checkin), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="text-sm min-w-0">
                        <p className="text-muted-foreground text-xs">{isHebrew ? "צ'ק-אאוט" : isFrench ? "Départ" : "Check-out"}</p>
                        <p className="font-medium truncate">{format(parseISO(booking.checkout), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="text-sm">
                        <p className="text-muted-foreground text-xs">{isHebrew ? "אורחים" : isFrench ? "Voyageurs" : "Guests"}</p>
                        <p className="font-medium">{booking.partySize}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">{isHebrew ? "סה\"כ" : "Total"}</p>
                      <p className="text-xl font-bold">
                        ${Number(booking.totalPrice).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {/* ✅ #8: Modify button — simple redirect message */}
                      {showModify && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            toast.info(
                              isHebrew
                                ? "כדי לשנות את ההזמנה, בטל את ההזמנה הנוכחית וצור חדשה."
                                : isFrench
                                ? "Pour modifier votre réservation, annulez-la et créez-en une nouvelle."
                                : "To modify your booking, cancel the current one and create a new one.",
                              { duration: 6000 }
                            );
                            if ((booking as any).slug) {
                              navigate(booking.type === "v2" ? `/experience2/${(booking as any).slug}` : `/experience/${(booking as any).slug}`);
                            }
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          {isHebrew ? "שינוי" : isFrench ? "Modifier" : "Modify"}
                        </Button>
                      )}
                      {showCancel && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => handleCancelClick(booking.id)}
                          disabled={cancelMutation.isPending || isSimulating}
                        >
                          {isSimulating && cancellingBookingId === booking.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <X className="h-4 w-4 mr-1" />
                          )}
                          {isHebrew ? "ביטול" : isFrench ? "Annuler" : "Cancel"}
                        </Button>
                      )}
                      {booking.slug && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(booking.type === "v2" ? `/experience2/${booking.slug}` : `/experience/${booking.slug}`)}
                        >
                          {isHebrew ? "צפה" : isFrench ? "Voir" : "View"}
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {booking.hgBookingId && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {isHebrew ? "מספר הזמנה:" : "Ref:"} {booking.hgBookingId}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ✅ #4: Cancel Confirmation Dialog with simulation result */}
      <AlertDialog open={!!cancellingBookingId && !isSimulating} onOpenChange={(open) => {
        if (!open) {
          setCancellingBookingId(null);
          setSimulationResult(null);
          setSimulationError(false);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {isHebrew ? "ביטול הזמנה" : isFrench ? "Annuler la réservation" : "Cancel Booking"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {isHebrew
                    ? "האם אתה בטוח שברצונך לבטל הזמנה זו? פעולה זו אינה ניתנת לביטול."
                    : isFrench
                    ? "Êtes-vous sûr de vouloir annuler cette réservation ? Cette action est irréversible."
                    : "Are you sure you want to cancel this booking? This action cannot be undone."}
                </p>
                {/* ✅ #4: Simulation result display */}
                {(() => {
                  const simInfo = getCancelSimulationDisplay();
                  if (!simInfo) return null;

                  if (simInfo.isFree) {
                    return (
                      <div className="p-3 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
                        ✓ {simInfo.message}
                      </div>
                    );
                  }

                  if (simInfo.hasPenalty) {
                    return (
                      <div className="p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium">
                        ⚠ {simInfo.message}
                      </div>
                    );
                  }

                  if (simInfo.isWarning) {
                    return (
                      <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                        ⚠ {simInfo.message}
                      </div>
                    );
                  }

                  return null;
                })()}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>
              {isHebrew ? "שמור את ההזמנה" : isFrench ? "Garder ma réservation" : "Keep my booking"}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelMutation.isPending}
              onClick={() => {
                if (cancellingBookingId) {
                  cancelMutation.mutate(cancellingBookingId);
                }
              }}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isHebrew ? "כן, בטל הזמנה" : isFrench ? "Oui, annuler" : "Yes, Cancel Booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
