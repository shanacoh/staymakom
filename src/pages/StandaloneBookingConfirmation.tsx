/**
 * Page de confirmation pour une réservation "Experience Only".
 * Adaptée de BookingConfirmationPage — sans les sections hôtel, HyperGuest, chambre.
 * Accessible via /standalone-booking/confirmation/:token
 */
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { Check, Clock, MapPin, Users, Calendar, Copy, Loader2, XCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import V3Header from "@/components/V3Header";
import LaunchFooter from "@/components/LaunchFooter";
import { SEOHead } from "@/components/SEOHead";

// ─── Translations ─────────────────────────────────────────────────────────────

const T = {
  en: {
    confirmed: "Your experience is booked!",
    cancelled: "Booking cancelled",
    notFound: "Booking not found",
    notFoundDesc: "This confirmation link is invalid or has expired.",
    emailSent: (email: string) => `A confirmation email has been sent to ${email}`,
    experience: "Experience",
    date: "Date",
    time: "Time",
    guests: "Guests",
    totalPaid: "Total paid",
    meetingPoint: "Meeting point",
    ref: "Reference",
    backHome: "Back to Home",
    copyRef: "Copy reference",
    copied: "Copied!",
    loading: "Loading...",
    person: "person",
    persons: "persons",
  },
  he: {
    confirmed: "!החוויה שלך הוזמנה",
    cancelled: "ההזמנה בוטלה",
    notFound: "הזמנה לא נמצאה",
    notFoundDesc: "קישור אישור זה אינו תקין או שפג תוקפו.",
    emailSent: (email: string) => `מייל אישור נשלח אל ${email}`,
    experience: "חוויה",
    date: "תאריך",
    time: "שעה",
    guests: "משתתפים",
    totalPaid: "שולם",
    meetingPoint: "נקודת מפגש",
    ref: "מספר הפניה",
    backHome: "חזרה לדף הבית",
    copyRef: "העתק מספר הפניה",
    copied: "הועתק!",
    loading: "טוען...",
    person: "משתתף",
    persons: "משתתפים",
  },
  fr: {
    confirmed: "Votre expérience est réservée !",
    cancelled: "Réservation annulée",
    notFound: "Réservation introuvable",
    notFoundDesc: "Ce lien de confirmation est invalide ou a expiré.",
    emailSent: (email: string) => `Un email de confirmation a été envoyé à ${email}`,
    experience: "Expérience",
    date: "Date",
    time: "Créneau",
    guests: "Participants",
    totalPaid: "Montant payé",
    meetingPoint: "Point de rendez-vous",
    ref: "Référence",
    backHome: "Retour à l'accueil",
    copyRef: "Copier la référence",
    copied: "Copié !",
    loading: "Chargement...",
    person: "personne",
    persons: "personnes",
  },
};

function formatDateDisplay(dateStr: string, lang: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === "he" ? "he-IL" : lang === "fr" ? "fr-FR" : "en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StandaloneBookingConfirmation() {
  const { token } = useParams<{ token: string }>();
  const { lang } = useLanguage();
  const t = T[lang as "en" | "he" | "fr"] || T.en;
  const isRTL = lang === "he";

  const { data: booking, isLoading } = useQuery({
    queryKey: ["standalone-booking-confirmation", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("standalone_bookings")
        .select("*, standalone_experiences(title, title_he, title_fr, address, has_time_slots)")
        .eq("confirmation_token", token!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!token,
  });

  const copyRef = () => {
    if (booking?.id) {
      navigator.clipboard.writeText(booking.id);
      toast.success(t.copied);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
        <V3Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <XCircle className="h-12 w-12 text-muted-foreground" />
          <h1 className="text-2xl font-bold">{t.notFound}</h1>
          <p className="text-muted-foreground text-center max-w-sm">{t.notFoundDesc}</p>
          <Button asChild variant="outline">
            <Link to="/">{t.backHome}</Link>
          </Button>
        </main>
        <LaunchFooter />
      </div>
    );
  }

  const expTitle = lang === "he"
    ? booking.standalone_experiences?.title_he || booking.standalone_experiences?.title
    : lang === "fr"
      ? booking.standalone_experiences?.title_fr || booking.standalone_experiences?.title
      : booking.standalone_experiences?.title;

  const isCancelled = booking.is_cancelled || booking.status === "cancelled";
  const address = booking.standalone_experiences?.address;

  const currencySymbols: Record<string, string> = { USD: "$", EUR: "€", ILS: "₪" };
  const priceDisplay = `${currencySymbols[booking.currency] || booking.currency}${booking.sell_price?.toLocaleString()}`;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4]" dir={isRTL ? "rtl" : "ltr"}>
      <SEOHead
        titleEn="Booking Confirmed — StayMakom"
        titleHe="ההזמנה אושרה — StayMakom"
        descriptionEn="Your experience has been booked."
        descriptionHe="החוויה שלך הוזמנה."
      />

      <V3Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-lg mx-auto space-y-6">

          {/* Status banner */}
          <div className={`rounded-2xl p-8 text-center ${isCancelled ? "bg-destructive/10 border border-destructive" : "bg-white border border-green-200"}`}>
            {isCancelled ? (
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <Check className="h-7 w-7 text-green-600" />
              </div>
            )}
            <h1 className={`text-2xl font-bold ${isCancelled ? "text-destructive" : "text-foreground"}`}>
              {isCancelled ? t.cancelled : t.confirmed}
            </h1>
            {!isCancelled && booking.customer_email && (
              <p className="text-sm text-muted-foreground mt-2 flex items-center justify-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {t.emailSent(booking.customer_email)}
              </p>
            )}
          </div>

          {/* Booking summary */}
          <Card>
            <CardContent className="p-6 space-y-4">

              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{t.experience}</p>
                <p className="font-bold text-lg leading-tight">{expTitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {t.date}
                  </p>
                  <p className="font-semibold text-sm">
                    {booking.booking_date ? formatDateDisplay(booking.booking_date, lang) : "—"}
                  </p>
                </div>

                {booking.time_slot && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {t.time}
                    </p>
                    <p className="font-semibold text-sm">{booking.time_slot}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                    <Users className="h-3 w-3" /> {t.guests}
                  </p>
                  <p className="font-semibold text-sm">
                    {booking.party_size} {booking.party_size > 1 ? t.persons : t.person}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{t.totalPaid}</p>
                  <p className="font-bold text-base text-green-700">{priceDisplay}</p>
                </div>
              </div>

              {/* Meeting point */}
              {address && (
                <div className="pt-3 border-t">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {t.meetingPoint}
                  </p>
                  <p className="text-sm text-muted-foreground">{address}</p>
                </div>
              )}

              {/* Reference */}
              <div className="pt-3 border-t">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{t.ref}</p>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                    {booking.id}
                  </code>
                  <button
                    onClick={copyRef}
                    className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title={t.copyRef}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Status badge */}
              <div className="flex justify-end">
                {isCancelled ? (
                  <Badge variant="destructive">Cancelled</Badge>
                ) : booking.payment_status === "paid" ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200">Paid</Badge>
                ) : (
                  <Badge variant="outline">{booking.payment_status || booking.status}</Badge>
                )}
              </div>

            </CardContent>
          </Card>

          {/* CTA */}
          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link to="/">{t.backHome}</Link>
            </Button>
          </div>

        </div>
      </main>

      <LaunchFooter />
    </div>
  );
}
