/**
 * Booking Confirmation Page — Accessible via /booking/confirmation/:token
 * Public access (no auth required) — secured by unguessable UUID token
 */

import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage, getLocalizedField } from "@/hooks/useLanguage";
import { Check, CalendarDays, Hotel, Users, Copy, Clock, Info, MessageSquare, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DualPrice } from "@/components/ui/DualPrice";
import { getBoardTypeLabel } from "@/services/hyperguest";
import { analyzeCancellationPolicies } from "@/utils/cancellationPolicy";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

const t = {
  en: {
    title: "Your experience is booked!",
    cancelledTitle: "Booking cancelled",
    cancelledSub: (email: string) => `A cancellation confirmation has been sent to ${email}`,
    cancelledOn: "Cancelled on",
    emailSent: (email: string) => `A confirmation email has been sent to ${email}`,
    notFound: "Booking not found",
    notFoundDesc: "This confirmation link is invalid or has expired.",
    backHome: "Back to Home",
    myBookings: "My bookings",
    ref: "StayMakom Reference",
    hgRef: "Confirmation #",
    hotel: "Hotel",
    room: "Room",
    board: "Board",
    dates: "Dates",
    guests: "Guests",
    nights: "nights",
    totalPaid: "Total paid online",
    taxesAtHotel: "taxes & fees at hotel",
    specialRequests: "Your special requests",
    remarks: "Important information",
    onRequest: "Your booking is pending hotel confirmation. You will be notified by email.",
    freeCancelLong: (date: string) => `You can cancel for free until ${date}. After that date, fees may apply.`,
    nonRefundableLong: "This booking is non-refundable.",
    loading: "Loading...",
  },
  he: {
    title: "!החוויה שלך הוזמנה",
    cancelledTitle: "ההזמנה בוטלה",
    cancelledSub: (email: string) => `אישור ביטול נשלח אל ${email}`,
    cancelledOn: "בוטלה בתאריך",
    emailSent: (email: string) => `מייל אישור נשלח אל ${email}`,
    notFound: "הזמנה לא נמצאה",
    notFoundDesc: "קישור אישור זה אינו תקין או שפג תוקפו.",
    backHome: "חזרה לדף הבית",
    myBookings: "ההזמנות שלי",
    ref: "מספר הפניה StayMakom",
    hgRef: "מספר אישור",
    hotel: "מלון",
    room: "חדר",
    board: "ארוחות",
    dates: "תאריכים",
    guests: "אורחים",
    nights: "לילות",
    totalPaid: "סה\"כ שולם אונליין",
    taxesAtHotel: "מסים ועמלות במלון",
    specialRequests: "הבקשות המיוחדות שלך",
    remarks: "מידע חשוב",
    onRequest: "הזמנתך ממתינה לאישור המלון. תקבל/י עדכון במייל.",
    freeCancelLong: (date: string) => `ניתן לבטל בחינם עד ${date}. לאחר מכן עלולים לחול דמי ביטול.`,
    nonRefundableLong: "הזמנה זו אינה ניתנת להחזר.",
    loading: "...טוען",
  },
  fr: {
    title: "Votre expérience est réservée !",
    cancelledTitle: "Réservation annulée",
    cancelledSub: (email: string) => `Une confirmation d'annulation a été envoyée à ${email}`,
    cancelledOn: "Annulée le",
    emailSent: (email: string) => `Un email de confirmation a été envoyé à ${email}`,
    notFound: "Réservation introuvable",
    notFoundDesc: "Ce lien de confirmation est invalide ou a expiré.",
    backHome: "Retour à l'accueil",
    myBookings: "Mes réservations",
    ref: "Référence StayMakom",
    hgRef: "N° de confirmation",
    hotel: "Hôtel",
    room: "Chambre",
    board: "Pension",
    dates: "Dates",
    guests: "Voyageurs",
    nights: "nuits",
    totalPaid: "Total payé en ligne",
    taxesAtHotel: "taxes et frais à l'hôtel",
    specialRequests: "Vos demandes spéciales",
    remarks: "Informations importantes",
    onRequest: "Votre réservation est en attente de confirmation par l'hôtel. Vous serez notifié par email.",
    freeCancelLong: (date: string) => `Vous pouvez annuler gratuitement jusqu'au ${date}. Après cette date, des frais s'appliquent.`,
    nonRefundableLong: "Cette réservation n'est pas remboursable.",
    loading: "Chargement...",
  },
};

function fmt(amount: number, _currency: string): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string, lang: string): string {
  const date = new Date(dateStr);
  const locale = lang === "he" ? "he-IL" : lang === "fr" ? "fr-FR" : "en-US";
  return date.toLocaleDateString(locale, { weekday: "short", year: "numeric", month: "long", day: "numeric" });
}

export default function BookingConfirmationPage() {
  const { token } = useParams<{ token: string }>();
  const { lang } = useLanguage();
  const labels = t[lang] || t.en;

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ["booking-confirmation", token],
    queryFn: async () => {
      if (!token) throw new Error("No token");
      const { data, error } = await supabase
        .from("bookings_hg")
        .select("id, hg_booking_id, experience_id, hotel_id, checkin, checkout, nights, party_size, sell_price, currency, status, hg_status, board_type, room_code, room_name, rate_plan, customer_email, hg_raw_data, confirmation_token, is_cancelled, cancelled_at")
        .eq("confirmation_token", token)
        .maybeSingle();
      if (error || !data) throw new Error("Not found");
      return data as any;
    },
    enabled: !!token,
  });

  // Fetch experience data for thumbnail
  const { data: experience } = useQuery({
    queryKey: ["experience2-for-confirmation", booking?.experience_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("experiences2")
        .select("title, title_he, thumbnail_image, hero_image, slug")
        .eq("id", booking!.experience_id!)
        .single();
      return data;
    },
    enabled: !!booking?.experience_id,
  });

  // Fetch hotel data
  const { data: hotel } = useQuery({
    queryKey: ["hotel2-for-confirmation", booking?.hotel_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("hotels2")
        .select("name, name_he, star_rating")
        .eq("id", booking!.hotel_id!)
        .single();
      return data;
    },
    enabled: !!booking?.hotel_id,
  });

  const copyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    toast.success(lang === "he" ? "הועתק!" : lang === "fr" ? "Copié !" : "Copied!");
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">{labels.loading}</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !booking) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <h1 className="text-xl font-semibold">{labels.notFound}</h1>
          <p className="text-muted-foreground text-center">{labels.notFoundDesc}</p>
          <Button asChild>
            <Link to="/">{labels.backHome}</Link>
          </Button>
        </div>
        <Footer />
      </>
    );
  }

  const isCancelled = booking.is_cancelled || booking.status === "cancelled";
  const isConfirmed = !isCancelled && booking.status?.toLowerCase() === "confirmed";
  const isOnRequest = !isCancelled && !isConfirmed && booking.hg_status?.toLowerCase() !== "confirmed";
  const hgRaw = booking.hg_raw_data as any;
  const experienceTitle = experience ? (getLocalizedField(experience, "title", lang) as string || experience.title) : "";
  const hotelName = hotel ? (getLocalizedField(hotel, "name", lang) as string || hotel.name) : "";
  const starRating = hotel?.star_rating;
  const thumbnail = experience?.thumbnail_image || experience?.hero_image;

  // Parse cancellation from hg_raw_data
  const cancellationPolicies = hgRaw?.rooms?.[0]?.ratePlans?.[0]?.cancellationPolicies 
    || hgRaw?.cancellationPolicies 
    || null;
  const cancellation = analyzeCancellationPolicies(cancellationPolicies, booking.checkin, lang);

  // Extract display taxes from raw data
  const displayTaxes = hgRaw?.rooms?.[0]?.ratePlans?.[0]?.prices?.display?.taxes 
    || hgRaw?.displayTaxesTotal 
    || 0;

  // Build staymakom ref from raw data or derive
  const staymakomRef = hgRaw?.reference?.agency || `SM-${(booking.experience_id || "").substring(0, 8).toUpperCase()}`;

  // Remarks
  const remarks: string[] = [];
  if (hgRaw?.remarks) remarks.push(...(hgRaw.remarks as string[]).filter((r: string) => !/general message/i.test(r)));
  if (hgRaw?.rooms?.[0]?.ratePlans?.[0]?.remarks) {
    remarks.push(...(hgRaw.rooms[0].ratePlans[0].remarks as string[]).filter((r: string) => !/general message/i.test(r)));
  }

  // Special requests
  const specialRequests = hgRaw?.rooms?.[0]?.specialRequests || "";

  return (
    <>
      <SEOHead
        title={labels.title}
        description={labels.title}
      />
      <Header />
      <main className="min-h-screen bg-background py-8 md:py-16 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Animated check icon */}
          <div className="flex flex-col items-center text-center gap-3">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-500 ${
              isCancelled ? "bg-destructive/10" : isConfirmed ? "bg-emerald-100" : "bg-blue-100"
            }`}>
              {isCancelled ? (
                <XCircle className="h-8 w-8 text-destructive" />
              ) : isConfirmed ? (
                <Check className="h-8 w-8 text-emerald-600" />
              ) : (
                <Clock className="h-8 w-8 text-blue-600" />
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold">
              {isCancelled ? labels.cancelledTitle : labels.title}
            </h1>
            {booking.customer_email && (
              <p className="text-muted-foreground text-sm">
                {isCancelled ? labels.cancelledSub(booking.customer_email) : labels.emailSent(booking.customer_email)}
              </p>
            )}
            {isCancelled && booking.cancelled_at && (
              <p className="text-xs text-muted-foreground">
                {labels.cancelledOn}: {formatDate(booking.cancelled_at, lang)}
              </p>
            )}
          </div>

          {/* On-request warning — hide if cancelled */}
          {isOnRequest && !isCancelled && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
              <Clock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">{labels.onRequest}</p>
            </div>
          )}

          {/* Experience + Hotel card */}
          <Card>
            <CardContent className="p-5 space-y-4">
              {/* Experience header with thumbnail */}
              <div className="flex gap-4 items-start">
                {thumbnail && (
                  <img
                    src={thumbnail}
                    alt={experienceTitle}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <h2 className="font-semibold text-lg leading-tight">{experienceTitle}</h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Hotel className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{hotelName}</span>
                    {starRating && starRating > 0 && (
                      <span className="text-xs text-muted-foreground">{"★".repeat(starRating)}</span>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium">{formatDate(booking.checkin, lang)}</p>
                    <p className="text-muted-foreground">→ {formatDate(booking.checkout, lang)} ({booking.nights} {labels.nights})</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{booking.party_size} {labels.guests}</span>
                </div>
              </div>

              {/* Room info */}
              {booking.room_name && (
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">{labels.room}:</span> {booking.room_name}</p>
                  {booking.board_type && (
                    <p><span className="text-muted-foreground">{labels.board}:</span> {getBoardTypeLabel(booking.board_type)}</p>
                  )}
                </div>
              )}

              <Separator />

              {/* Price breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{labels.totalPaid}</span>
                  <DualPrice amount={booking.sell_price} currency={booking.currency} className="text-primary text-xl font-bold items-end" />
                </div>
                {displayTaxes > 0 && (
                  <p className="text-xs text-muted-foreground text-right">
                    + {fmt(Number(displayTaxes), booking.currency)} {labels.taxesAtHotel}
                  </p>
                )}
              </div>

              {/* Cancellation policy */}
              {!isCancelled && cancellation.badgeText && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    {cancellation.isFreeCancellation ? (
                      <>
                        <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                          <Check className="h-4 w-4" />
                          {cancellation.badgeText}
                        </span>
                        {cancellation.effectiveDeadline && (
                          <p className="text-xs text-muted-foreground pl-5">
                            {labels.freeCancelLong(cancellation.effectiveDeadline.toLocaleDateString(
                              lang === "he" ? "he-IL" : lang === "fr" ? "fr-FR" : "en-US",
                              { year: "numeric", month: "long", day: "numeric" }
                            ))}
                          </p>
                        )}
                      </>
                    ) : cancellation.isNonRefundable ? (
                      <>
                        <span className="text-sm text-muted-foreground">{cancellation.badgeText}</span>
                        <p className="text-xs text-muted-foreground">{labels.nonRefundableLong}</p>
                      </>
                    ) : (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Info className="h-4 w-4 shrink-0" />
                        <span>{cancellation.badgeText}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* References */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{labels.ref}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-medium text-xs">{staymakomRef}</span>
                  <button onClick={() => copyRef(staymakomRef)} className="text-muted-foreground hover:text-foreground">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {booking.hg_booking_id && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{labels.hgRef}</span>
                  <span className="font-mono text-xs">{booking.hg_booking_id}</span>
                </div>
              )}
              <Badge variant={isCancelled ? "destructive" : isConfirmed ? "default" : "secondary"} className="text-xs">
                {isCancelled ? (
                  <><XCircle className="h-3 w-3 mr-1" />{lang === "he" ? "בוטל" : lang === "fr" ? "Annulé" : "Cancelled"}</>
                ) : isConfirmed ? (
                  <><Check className="h-3 w-3 mr-1" />{booking.hg_status}</>
                ) : (
                  <><Clock className="h-3 w-3 mr-1" />{booking.hg_status}</>
                )}
              </Badge>
            </CardContent>
          </Card>

          {/* Remarks */}
          {remarks.length > 0 && (
            <Card>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  {labels.remarks}
                </div>
                <div className="space-y-1.5 p-3 rounded-md bg-muted/50">
                  {remarks.map((remark, idx) => (
                    <p key={idx} className="text-xs text-muted-foreground">• {remark}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Special requests */}
          {specialRequests && (
            <Card>
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  {labels.specialRequests}
                </div>
                <p className="text-sm text-muted-foreground pl-6">{specialRequests}</p>
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button asChild className="flex-1">
              <Link to="/account">{labels.myBookings}</Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link to="/">{labels.backHome}</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
