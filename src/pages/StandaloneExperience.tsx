/**
 * Page publique pour afficher une expérience "standalone" (sans hôtel).
 * Source de données : standalone_experiences (pas useExperience2).
 * Réservation inline avec RevolutPaymentWidget.
 */
import { useRef, useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import HeroSection from "@/components/experience-test/HeroSection";
import LocationMap from "@/components/experience-test/LocationMap";
import LocationPopover from "@/components/experience/LocationPopover";
import PracticalInfo from "@/components/experience-test/PracticalInfo";
import WhatsIncludedPhotos2 from "@/components/experience-test/WhatsIncludedPhotos2";
import ShareWithFriendsSection from "@/components/experience/ShareWithFriendsSection";
import RevolutPaymentWidget from "@/components/experience/RevolutPaymentWidget";
import Header from "@/components/Header";
import LaunchHeader from "@/components/LaunchHeader";
import Footer from "@/components/Footer";
import LaunchFooter from "@/components/LaunchFooter";
import MobileFooterMinimal from "@/components/MobileFooterMinimal";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage, type Language } from "@/hooks/useLanguage";
import { Badge } from "@/components/ui/badge";
import { getAutoBadgesFromPracticalInfo, normalizeLegacyPracticalInfo } from "@/lib/standaloneBadges";
import { SEOHead } from "@/components/SEOHead";
import { trackExperiencePageViewed, trackTimeOnExperiencePage } from "@/lib/analytics";
import { useScrollDepth } from "@/hooks/useScrollDepth";
import { toast } from "sonner";
import { Loader2, Users, Calendar, Clock, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StandaloneExperienceData {
  id: string;
  slug: string;
  title: string;
  title_fr?: string | null;
  title_he?: string | null;
  subtitle?: string | null;
  subtitle_fr?: string | null;
  subtitle_he?: string | null;
  long_copy?: string | null;
  long_copy_fr?: string | null;
  long_copy_he?: string | null;
  hero_image?: string | null;
  photos?: string[] | null;
  base_price: number;
  base_price_type: "per_person" | "fixed" | "per_person_per_night";
  currency: "USD" | "EUR" | "ILS";
  min_party: number;
  max_party: number;
  lead_time_days?: number | null;
  has_time_slots?: boolean | null;
  time_slots?: string[] | null;
  cancellation_policy?: string | null;
  cancellation_policy_fr?: string | null;
  cancellation_policy_he?: string | null;
  duration?: string | null;
  duration_fr?: string | null;
  duration_he?: string | null;
  address?: string | null;
  address_he?: string | null;
  address_fr?: string | null;
  city?: string | null;
  city_he?: string | null;
  city_fr?: string | null;
  region?: string | null;
  region_he?: string | null;
  region_fr?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accessibility_info?: string | null;
  category_id?: string | null;
  status: string;
  available_days?: number[] | null;
  blocked_dates?: string[] | null;
  availability_end_date?: string | null;
  availability_mode?: string | null;
  whitelisted_dates?: string[] | null;
  practical_info?: unknown;
  standalone_experience_highlight_tags?: {
    tag_id: string;
    position: number;
    highlight_tags: { id: string; slug: string; label_en: string; label_he?: string | null };
  }[] | null;
}

// ---------------------------------------------------------------------------
// Booking states
// ---------------------------------------------------------------------------

type BookingStep = "form" | "payment" | "success";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCurrencySymbol(currency: string): string {
  if (currency === "USD") return "$";
  if (currency === "EUR") return "€";
  return "₪";
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const WEEKDAY_LABELS_BY_LANG: Record<string, Record<number, string>> = {
  fr: { 0: "dimanche", 1: "lundi", 2: "mardi", 3: "mercredi", 4: "jeudi", 5: "vendredi", 6: "samedi" },
  en: { 0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday" },
  he: { 0: "ראשון", 1: "שני", 2: "שלישי", 3: "רביעי", 4: "חמישי", 5: "שישי", 6: "שבת" },
};

function computeTotal(
  basePrice: number,
  priceType: string,
  partySize: number,
): number {
  if (priceType === "fixed") return basePrice;
  if (priceType === "per_person") return basePrice * partySize;
  // per_person_per_night — treated as per person on the public page (no night selector)
  return basePrice * partySize;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StandaloneExperience() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isLaunch = searchParams.get("context") === "launch";
  const { lang } = useLanguage();
  const footerRef = useRef<HTMLElement>(null);

  // Booking form state
  const [bookingStep, setBookingStep] = useState<BookingStep>("form");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [partySize, setPartySize] = useState<number>(1);
  const [guestName, setGuestName] = useState<string>("");
  const [guestEmail, setGuestEmail] = useState<string>("");
  const [guestPhone, setGuestPhone] = useState<string>("");
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [revolutPublicId, setRevolutPublicId] = useState<string | null>(null);
  const [revolutPublicKey, setRevolutPublicKey] = useState<string | undefined>(undefined);
  const [revolutEnvironment, setRevolutEnvironment] = useState<"production" | "dev">("dev");
  const [bookingToken, setBookingToken] = useState<string | null>(null);

  // Sticky top tracking
  const [stickyTop, setStickyTop] = useState(80);

  useEffect(() => {
    const updateTop = () => {
      const header = document.querySelector("header") as HTMLElement | null;
      if (header) setStickyTop(header.getBoundingClientRect().height + 8);
    };
    updateTop();
    window.addEventListener("resize", updateTop);
    const observer = new ResizeObserver(updateTop);
    const header = document.querySelector("header");
    if (header) observer.observe(header);
    return () => {
      window.removeEventListener("resize", updateTop);
      observer.disconnect();
    };
  }, []);

  // -------------------------------------------------------------------------
  // Data fetching
  // -------------------------------------------------------------------------

  const { data: experience, isLoading, error } = useQuery({
    queryKey: ["standalone-experience-public", slug],
    queryFn: async () => {
      // Liste explicite (jamais "*") : exclut volontairement les colonnes admin-only
      // (supplier_price_adult, supplier_price_child, markup_percent) qui ne doivent
      // jamais transiter vers le navigateur d'un visiteur.
      const PUBLIC_COLUMNS = [
        "id", "slug", "title", "title_fr", "title_he",
        "subtitle", "subtitle_fr", "subtitle_he",
        "long_copy", "long_copy_fr", "long_copy_he",
        "hero_image", "photos",
        "base_price", "base_price_type", "currency", "min_party", "max_party",
        "lead_time_days", "has_time_slots", "time_slots",
        "cancellation_policy", "cancellation_policy_fr", "cancellation_policy_he",
        "duration", "duration_fr", "duration_he",
        "address", "address_he", "address_fr",
        "city", "city_he", "city_fr",
        "region", "region_he", "region_fr",
        "latitude", "longitude",
        "accessibility_info", "category_id", "status",
        "available_days", "blocked_dates", "availability_end_date",
        "availability_mode", "whitelisted_dates", "practical_info",
      ].join(", ");

      const { data, error } = await (supabase as any)
        .from("standalone_experiences")
        .select(`${PUBLIC_COLUMNS}, standalone_experience_highlight_tags(tag_id, position, highlight_tags(id, slug, label_en, label_he))`)
        .eq("slug", slug!)
        .eq("status", "published")
        .single();
      if (error) throw error;
      return data as StandaloneExperienceData;
    },
    enabled: !!slug,
  });

  // -------------------------------------------------------------------------
  // Analytics
  // -------------------------------------------------------------------------

  useScrollDepth(`standalone/${slug}`);

  useEffect(() => {
    if (!experience?.slug) return;
    trackExperiencePageViewed(experience.slug, experience.title, experience.base_price);
    const start = Date.now();
    const handleVisChange = () => {
      if (document.visibilityState === "hidden") {
        trackTimeOnExperiencePage(experience.slug, (Date.now() - start) / 1000);
      }
    };
    document.addEventListener("visibilitychange", handleVisChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisChange);
      trackTimeOnExperiencePage(experience.slug, (Date.now() - start) / 1000);
    };
  }, [experience?.slug]);

  // -------------------------------------------------------------------------
  // Derived data
  // -------------------------------------------------------------------------

  const editorialBadges = (experience?.standalone_experience_highlight_tags ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((link) => ({
      key: `tag-${link.tag_id}`,
      label: lang === "he" && link.highlight_tags.label_he ? link.highlight_tags.label_he : link.highlight_tags.label_en,
    }));

  const autoBadges = experience
    ? getAutoBadgesFromPracticalInfo(normalizeLegacyPracticalInfo(experience.practical_info), lang as Language)
    : [];

  const allBadges = [...editorialBadges, ...autoBadges];

  const locCity = lang === "he" ? experience?.city_he || experience?.city : lang === "fr" ? experience?.city_fr || experience?.city : experience?.city;
  const locRegion = lang === "he" ? experience?.region_he || experience?.region : lang === "fr" ? experience?.region_fr || experience?.region : experience?.region;

  const currencySymbol = experience ? getCurrencySymbol(experience.currency) : "₪";
  const leadTimeDays = experience?.lead_time_days ?? 0;
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + leadTimeDays);
    return d.toISOString().split("T")[0];
  })();
  const maxDate = experience?.availability_end_date
    ? new Date(experience.availability_end_date + "T23:59:59")
    : undefined;

  const totalPrice = experience
    ? computeTotal(experience.base_price, experience.base_price_type, partySize)
    : 0;

  const title =
    lang === "he"
      ? experience?.title_he || experience?.title || ""
      : lang === "fr"
      ? experience?.title_fr || experience?.title || ""
      : experience?.title || "";

  const subtitle =
    lang === "he"
      ? experience?.subtitle_he || experience?.subtitle || undefined
      : lang === "fr"
      ? experience?.subtitle_fr || experience?.subtitle || undefined
      : experience?.subtitle || undefined;

  const longCopy =
    lang === "he"
      ? experience?.long_copy_he || experience?.long_copy || undefined
      : lang === "fr"
      ? experience?.long_copy_fr || experience?.long_copy || undefined
      : experience?.long_copy || undefined;

  const photos: string[] = (() => {
    if (!experience) return [];
    const hero = experience.hero_image;
    const gallery = experience.photos ?? [];
    if (hero) return [hero, ...gallery.filter((p) => p !== hero)];
    return gallery;
  })();

  const canBook =
    !!selectedDate &&
    !!guestName.trim() &&
    !!guestEmail.trim() &&
    (!experience?.has_time_slots || !!selectedSlot);

  // -------------------------------------------------------------------------
  // Booking handlers
  // -------------------------------------------------------------------------

  const handleBook = useCallback(async () => {
    if (!experience || !canBook) return;
    setIsBookingLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-standalone-payment", {
        body: {
          experience_id: experience.id,
          booking_date: selectedDate,
          time_slot: selectedSlot || null,
          party_size: partySize,
          customer_name: guestName.trim(),
          customer_email: guestEmail.trim(),
          customer_phone: guestPhone.trim() || null,
        },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Impossible de créer la réservation.");
      setRevolutPublicId(data.revolut_public_id);
      setRevolutPublicKey(data.merchant_public_key);
      setRevolutEnvironment(data.environment ?? "dev");
      setBookingToken(data.confirmation_token);
      setBookingStep("payment");
    } catch (err: any) {
      toast.error(err.message || "Impossible de créer la réservation. Réessayez.");
    } finally {
      setIsBookingLoading(false);
    }
  }, [experience, canBook, selectedDate, selectedSlot, partySize, guestName, guestEmail, guestPhone, totalPrice]);

  const handlePaymentSuccess = useCallback(async () => {
    if (!bookingToken) return;
    try {
      await supabase.functions.invoke("send-standalone-booking-confirmation", {
        body: { confirmation_token: bookingToken },
      });
    } catch {
      // non-blocking — confirmation email failure should not block the UX
    }
    setBookingStep("success");
    navigate(`/standalone-booking/confirmation/${bookingToken}`);
  }, [bookingToken, navigate]);

  const handlePaymentError = useCallback((errorMessage: string) => {
    toast.error(errorMessage || "Le paiement a échoué. Veuillez réessayer.");
  }, []);

  const handlePaymentCancel = useCallback(() => {
    setBookingStep("form");
    toast.info("Paiement annulé.");
  }, []);

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {isLaunch ? <LaunchHeader forceScrolled /> : <Header />}
        <div className="pt-16 max-w-6xl mx-auto px-4 pb-16">
          <Skeleton className="h-[55vh] w-full mt-4 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-12 mt-10">
            <div className="space-y-5">
              <Skeleton className="h-9 w-3/4" />
              <Skeleton className="h-5 w-1/3" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-px w-full" />
              <div className="space-y-3 pt-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[92%]" />
                <Skeleton className="h-4 w-[97%]" />
                <Skeleton className="h-4 w-[85%]" />
                <Skeleton className="h-4 w-[60%]" />
              </div>
            </div>
            <div className="border rounded-2xl p-5 space-y-4 h-fit">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-11 w-full rounded-lg" />
              <div className="flex items-center justify-between pt-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-5 w-1/4" />
              </div>
              <Skeleton className="h-px w-full" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-6 w-1/3" />
              </div>
              <Skeleton className="h-12 w-full rounded-full" />
              <Skeleton className="h-3.5 w-2/3 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Error / not found
  // -------------------------------------------------------------------------

  if (error || !experience) {
    const notFoundMsg =
      lang === "he"
        ? { title: "החוויה לא נמצאה", desc: "החוויה שחיפשת אינה קיימת או שאינה זמינה יותר." }
        : lang === "fr"
        ? { title: "Expérience non trouvée", desc: "L'expérience que vous recherchez n'existe pas ou n'est plus disponible." }
        : { title: "Experience not found", desc: "The experience you are looking for does not exist or is no longer available." };

    return (
      <div className="min-h-screen bg-background">
        {isLaunch ? <LaunchHeader forceScrolled /> : <Header />}
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-semibold">{notFoundMsg.title}</h1>
            <p className="text-muted-foreground">{notFoundMsg.desc}</p>
          </div>
        </div>
        {isLaunch ? <LaunchFooter /> : <Footer />}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Booking panel render
  // -------------------------------------------------------------------------

  const renderBookingPanel = () => {
    const availableDays: number[] = experience.available_days ?? [1, 2, 3, 4, 5, 6, 7];
    const blockedDateStrings: string[] = (experience.blocked_dates as string[] | null) ?? [];
    const hasWeekdayRestriction = availableDays.length < 7;
    const isWhitelistMode = experience.availability_mode === "whitelist";
    const whitelistedSet = new Set<string>(
      isWhitelistMode ? (experience.whitelisted_dates as string[] | null) ?? [] : []
    );

    const isDateUnavailable = (date: Date): boolean => {
      const minDateObj = new Date(minDate + "T00:00:00");
      const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      if (d < minDateObj) return true;
      if (isWhitelistMode) {
        return !whitelistedSet.has(toLocalDateStr(date));
      }
      if (maxDate && d > maxDate) return true;
      if (hasWeekdayRestriction) {
        const availableJsDays = availableDays.map((n) => (n === 7 ? 0 : n));
        if (!availableJsDays.includes(date.getDay())) return true;
      }
      return blockedDateStrings.includes(toLocalDateStr(date));
    };

    const labelLang = lang === "he" ? "he" : lang === "fr" ? "fr" : "en";
    const availabilityHint = hasWeekdayRestriction
      ? availableDays.map((n) => WEEKDAY_LABELS_BY_LANG[labelLang][n === 7 ? 0 : n]).join(", ")
      : null;

    // ── Payment step ──
    if (bookingStep === "payment" && revolutPublicId) {
      return (
        <div className="rounded-2xl border p-5 space-y-4">
          <div className="space-y-1">
            <p className="font-semibold text-base">
              {lang === "he" ? "תשלום" : lang === "fr" ? "Paiement" : "Payment"}
            </p>
            <p className="text-sm text-muted-foreground">
              {lang === "he"
                ? `סה"כ לתשלום: ${currencySymbol}${totalPrice.toFixed(0)}`
                : lang === "fr"
                ? `Total à payer : ${currencySymbol}${totalPrice.toFixed(0)}`
                : `Total due: ${currencySymbol}${totalPrice.toFixed(0)}`}
            </p>
          </div>
          <RevolutPaymentWidget
            publicId={revolutPublicId}
            merchantPublicKey={revolutPublicKey}
            currency={experience.currency}
            lang={lang as "en" | "he" | "fr"}
            environment={revolutEnvironment}
            customerEmail={guestEmail}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            onPaymentCancel={handlePaymentCancel}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => setBookingStep("form")}
          >
            {lang === "he" ? "חזרה לטופס" : lang === "fr" ? "Retour au formulaire" : "Back to form"}
          </Button>
        </div>
      );
    }

    // ── Booking form ──
    const priceLabel =
      experience.base_price_type === "fixed"
        ? lang === "he" ? "מחיר קבוע" : lang === "fr" ? "Prix forfaitaire" : "Fixed price"
        : lang === "he" ? "לאדם" : lang === "fr" ? "/ personne" : "/ person";

    return (
      <div className="rounded-2xl border p-5 space-y-5">
        {/* Price display */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">
            {currencySymbol}{experience.base_price.toFixed(0)}
          </span>
          <span className="text-sm text-muted-foreground">{priceLabel}</span>
        </div>

        {/* Date picker */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-sm">
            <Calendar className="h-3.5 w-3.5" />
            {lang === "he" ? "תאריך" : lang === "fr" ? "Date" : "Date"}
          </Label>
          {availabilityHint && (
            <p className="text-xs text-muted-foreground">
              {lang === "he"
                ? `זמין: ${availabilityHint}`
                : lang === "fr"
                ? `Disponible : ${availabilityHint}`
                : `Available: ${availabilityHint}`}
            </p>
          )}
          <div className="border rounded-lg overflow-hidden">
            <CalendarPicker
              mode="single"
              selected={selectedDate ? new Date(selectedDate + "T12:00:00") : undefined}
              onSelect={(date) => setSelectedDate(date ? toLocalDateStr(date) : "")}
              disabled={isDateUnavailable}
              toDate={maxDate}
              classNames={{
                day_selected:
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_disabled: "text-muted-foreground/30 line-through cursor-not-allowed",
              }}
            />
          </div>
          {selectedDate && (
            <p className="text-xs font-medium text-foreground">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString(
                lang === "he" ? "he-IL" : lang === "fr" ? "fr-FR" : "en-US",
                { weekday: "long", day: "numeric", month: "long", year: "numeric" },
              )}
            </p>
          )}
        </div>

        {/* Time slots */}
        {experience.has_time_slots && (experience.time_slots?.length ?? 0) > 0 && (
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm">
              <Clock className="h-3.5 w-3.5" />
              {lang === "he" ? "שעה" : lang === "fr" ? "Créneau" : "Time slot"}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {experience.time_slots!.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={cn(
                    "rounded-lg border py-2 text-sm font-medium transition-colors",
                    selectedSlot === slot
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-primary/50 hover:bg-muted"
                  )}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Party size */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-sm">
            <Users className="h-3.5 w-3.5" />
            {lang === "he" ? "מספר משתתפים" : lang === "fr" ? "Nombre de participants" : "Participants"}
          </Label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPartySize((p) => Math.max(experience.min_party, p - 1))}
              disabled={partySize <= experience.min_party}
              className="flex h-9 w-9 items-center justify-center rounded-full border hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <span className="min-w-[2ch] text-center font-semibold text-lg">{partySize}</span>
            <button
              type="button"
              onClick={() => setPartySize((p) => Math.min(experience.max_party, p + 1))}
              disabled={partySize >= experience.max_party}
              className="flex h-9 w-9 items-center justify-center rounded-full border hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <span className="text-sm text-muted-foreground">
              {lang === "he" ? `(מינ׳ ${experience.min_party} — מקס׳ ${experience.max_party})` : lang === "fr" ? `(min ${experience.min_party} – max ${experience.max_party})` : `(min ${experience.min_party} – max ${experience.max_party})`}
            </span>
          </div>
        </div>

        {/* Divider + total */}
        <div className="border-t pt-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {lang === "he" ? "סה\"כ" : lang === "fr" ? "Total" : "Total"}
          </span>
          <span className="font-bold text-lg">
            {currencySymbol}{totalPrice.toFixed(0)}
          </span>
        </div>

        {/* Guest info */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm">
              {lang === "he" ? "שם מלא *" : lang === "fr" ? "Nom complet *" : "Full name *"}
            </Label>
            <Input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder={lang === "he" ? "ישראל ישראלי" : lang === "fr" ? "Jean Dupont" : "John Smith"}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">
              {lang === "he" ? "אימייל *" : lang === "fr" ? "Email *" : "Email *"}
            </Label>
            <Input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">
              {lang === "he" ? "טלפון (אופציונלי)" : lang === "fr" ? "Téléphone (optionnel)" : "Phone (optional)"}
            </Label>
            <Input
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="+972 50 000 0000"
            />
          </div>
        </div>

        {/* CTA */}
        <Button
          className="w-full rounded-full text-base font-semibold h-12"
          onClick={handleBook}
          disabled={!canBook || isBookingLoading}
        >
          {isBookingLoading ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />
              {lang === "he" ? "מעבד..." : lang === "fr" ? "Traitement..." : "Processing..."}
            </>
          ) : (
            lang === "he" ? "הזמן ושלם" : lang === "fr" ? "Réserver & Payer" : "Book & Pay"
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          {lang === "he"
            ? "תשלום מאובטח באמצעות Revolut"
            : lang === "fr"
            ? "Paiement sécurisé via Revolut"
            : "Secured payment via Revolut"}
        </p>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ overflowX: "clip" }}
      dir={lang === "he" ? "rtl" : "ltr"}
    >
      <SEOHead
        title={title}
        description={subtitle}
        ogImage={experience.hero_image || undefined}
      />

      {isLaunch ? <LaunchHeader forceScrolled /> : <Header />}

      <main className="flex-1">
        {/* Hero Section */}
        <section>
          <HeroSection
            photos={photos.filter(Boolean)}
            title={title}
            subtitle={subtitle}
            hotelName={undefined}
            hotelImage={undefined}
            city={undefined}
            region={undefined}
            latitude={undefined}
            longitude={undefined}
            lang={lang as "en" | "he" | "fr"}
            experienceId={experience.id}
            hotelId={undefined}
            categoryName={undefined}
            categorySlug={undefined}
            minParty={experience.min_party}
            maxParty={experience.max_party}
            averageRating={null}
            reviewsCount={0}
            onScrollToReviews={() => {}}
            slug={experience.slug}
          />
        </section>

        {/* Main content */}
        <div className="max-w-6xl mx-auto pb-28 md:pb-16 px-4 sm:px-6 lg:px-12 xl:px-16 my-8">
          <div className="grid md:grid-cols-[65%_35%] gap-6 lg:gap-10">
            {/* Left Column */}
            <div className="space-y-10 md:space-y-12 min-w-0 overflow-x-hidden">
              {/* Badges */}
              {allBadges.length > 0 && (
                <div className="flex flex-wrap gap-2 -mb-6 md:-mb-8">
                  {allBadges.map((b) => (
                    <Badge key={b.key} variant="secondary" className="font-normal">
                      {b.label}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Localisation */}
              {(locCity || locRegion) && (
                <LocationPopover
                  city={locCity ?? undefined}
                  region={locRegion ?? undefined}
                  hotelName={title}
                  latitude={experience.latitude ?? undefined}
                  longitude={experience.longitude ?? undefined}
                  lang={lang as "en" | "he" | "fr"}
                />
              )}
              {experience.latitude && experience.longitude && (
                <LocationMap
                  latitude={experience.latitude}
                  longitude={experience.longitude}
                  hotelName={title}
                  lang={lang as "en" | "he" | "fr"}
                />
              )}

              {/* What's on the program */}
              <WhatsIncludedPhotos2
                experienceId={experience.id}
                lang={lang}
                longCopy={longCopy}
                source="standalone"
              />

              {/* Share with Friends */}
              <ShareWithFriendsSection
                title={title}
                lang={lang as "en" | "he" | "fr"}
              />

              {/* Practical Info */}
              <PracticalInfo
                experience={experience as any}
                lang={lang as "en" | "he" | "fr"}
              />
            </div>

            {/* Right Column — Sticky Booking Panel (Desktop) */}
            <div className="hidden md:block pr-1 md:-mt-10">
              <div
                className="sticky flex flex-col gap-3 will-change-transform"
                style={{
                  top: `${stickyTop}px`,
                  maxHeight: `calc(100vh - ${stickyTop}px - 16px)`,
                }}
              >
                <div id="standalone-booking-panel" className="flex-1 min-h-0 flex flex-col overflow-y-auto">
                  {renderBookingPanel()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Booking Panel — fixed bottom sheet trigger */}
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-sm border-t px-4 py-3">
          {bookingStep === "form" ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-lg">
                  {currencySymbol}{experience.base_price.toFixed(0)}
                </span>
                <span className="text-sm text-muted-foreground ml-1.5">
                  {experience.base_price_type === "fixed"
                    ? (lang === "fr" ? "forfait" : "fixed")
                    : (lang === "he" ? "לאדם" : lang === "fr" ? "/ pers." : "/ person")}
                </span>
              </div>
              <Button
                className="rounded-full px-6"
                onClick={() => {
                  const panel = document.getElementById("standalone-booking-panel-mobile");
                  panel?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {lang === "he" ? "הזמן" : lang === "fr" ? "Réserver" : "Book"}
              </Button>
            </div>
          ) : null}
        </div>

        {/* Mobile full booking panel (scrolled to) */}
        <div id="standalone-booking-panel-mobile" className="md:hidden px-4 pb-32 pt-4">
          {renderBookingPanel()}
        </div>
      </main>

      <footer ref={footerRef as React.RefObject<HTMLElement>}>
        <div className="hidden md:block">
          {isLaunch ? <LaunchFooter /> : <Footer />}
        </div>
        <MobileFooterMinimal />
      </footer>
    </div>
  );
}
