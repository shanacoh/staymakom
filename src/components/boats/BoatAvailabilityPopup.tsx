/**
 * Pop-up unique "Vérifier une disponibilité" — remplace les 3 endroits qui
 * redemandaient chacun une partie des mêmes critères (barre de filtres,
 * calendrier de la fiche détail, formulaire final). Un seul jeu de critères
 * choisi une fois, un seul envoi.
 *
 * Deux modes :
 * - `boat` fourni : la demande porte sur ce bateau précis, les puces de durée
 *   affichent le prix de chaque variante (upsell "+1h pour X ₪" inclus ici).
 * - `boat` absent : demande générique, le visiteur choisit un port préféré
 *   (ou peu importe) ; on matchera le bon bateau côté back-office.
 */
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import { CalendarIcon, Minus, Plus, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { isLastMinuteDate, toLocalDateStr } from "@/lib/boatAvailability";
import { WHATSAPP_NUMBER } from "@/constants/whatsapp";
import { PhoneInput } from "@/components/PhoneInput";
import { trackRequestClicked, type ProductLike } from "@/lib/analytics";
import { tPage, uiRecord, pageLocale } from "@/lib/translations";
import { dateFnsLocale } from "@/lib/dateFnsLocale";
import { tPlace } from "@/lib/placeNames";

type PriceVariant = {
  id: string;
  duration_minutes: number | null;
  max_capacity: number;
  sale_price: number;
  currency: string;
};

export interface BoatForPopup {
  id: string;
  title: string;
  city: string | null;
  slug: string;
  price_variants: PriceVariant[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boat?: BoatForPopup | null;
}

const DURATION_OPTIONS = [
  { minutes: 60, label: uiRecord("boatAvailabilityPopup1h") },
  { minutes: 90, label: uiRecord("boatAvailabilityPopup1h30") },
  { minutes: 120, label: uiRecord("boatAvailabilityPopup2h") },
  { minutes: 180, label: uiRecord("boatAvailabilityPopup3h") },
  { minutes: 240, label: uiRecord("boatAvailabilityPopup4h") },
];

const TIME_PERIODS = [
  { value: "morning", label: uiRecord("boatAvailabilityPopupMorning") },
  { value: "afternoon", label: uiRecord("boatAvailabilityPopupAfternoon") },
  { value: "sunset", label: uiRecord("boatAvailabilityPopupSunset") },
  { value: "precise", label: uiRecord("boatAvailabilityPopupPreciseTime") },
] as const;

export default function BoatAvailabilityPopup({ open, onOpenChange, boat }: Props) {
  const { lang } = useLanguage();
  const l = pageLocale();

  const availableDurations = boat
    ? DURATION_OPTIONS.filter((opt) => boat.price_variants.some((v) => v.duration_minutes === opt.minutes))
    : DURATION_OPTIONS;
  const cheapestDuration = boat
    ? boat.price_variants.reduce((a, b) => (a.sale_price <= b.sale_price ? a : b), boat.price_variants[0])?.duration_minutes
    : 120;

  const [preferredCity, setPreferredCity] = useState<string>("any");
  const [persons, setPersons] = useState(2);
  const [durationMinutes, setDurationMinutes] = useState<number>(cheapestDuration ?? 120);
  const [date, setDate] = useState<string>("");
  const [timePeriod, setTimePeriod] = useState<(typeof TIME_PERIODS)[number]["value"]>("morning");
  const [preciseTime, setPreciseTime] = useState("");
  const [firstName, setFirstName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ requestId: string } | null>(null);

  const selectedVariant = boat?.price_variants.find((v) => v.duration_minutes === durationMinutes) ?? null;
  const cheapestPrice = boat ? Math.min(...boat.price_variants.map((v) => v.sale_price)) : null;

  const reset = () => {
    setPreferredCity("any");
    setPersons(2);
    setDurationMinutes(cheapestDuration ?? 120);
    setDate("");
    setTimePeriod("morning");
    setPreciseTime("");
    setFirstName("");
    setWhatsapp("");
    setEmail("");
    setError("");
    setResult(null);
  };

  const t = {
    title: tPage("boatAvailabilityPopupCheckAvailability"),
    departure: tPage("boatAvailabilityPopupDeparture"),
    any: tPage("boatAvailabilityPopupNoPreference"),
    persons: tPage("boatAvailabilityPopupNumberOfPeople"),
    duration: tPage("boatAvailabilityPopupDuration"),
    date: tPage("boatAvailabilityPopupDateOptional"),
    time: tPage("boatAvailabilityPopupPreferredTime"),
    preciseTimePlaceholder: tPage("boatAvailabilityPopupEG230pm"),
    firstName: tPage("boatAvailabilityPopupFirstName"),
    whatsapp: "WhatsApp",
    email: tPage("boatAvailabilityPopupEmailOptional"),
    disclaimer:
      tPage("boatAvailabilityPopupNothingToPayNowWe"),
    submit: tPage("boatAvailabilityPopupSendMyRequest"),
    sending: tPage("boatAvailabilityPopupSending"),
    missing: tPage("boatAvailabilityPopupPleaseFillInYourFirst"),
    genericError: tPage("boatAvailabilityPopupSomethingWentWrongPleaseTry"),
    lastMinuteBanner:
      tPage("boatAvailabilityPopupLastMinuteWeLlCheck"),
    successTitle: tPage("boatAvailabilityPopupRequestSent"),
    successBody:
      tPage("boatAvailabilityPopupWeLlGetBackTo"),
    continueWhatsapp: tPage("boatAvailabilityPopupContinueOnWhatsapp"),
    ref: tPage("boatAvailabilityPopupReference"),
  };

  const isUrgent = date ? isLastMinuteDate(date) : false;

  const durationLabel = (minutes: number) => DURATION_OPTIONS.find((o) => o.minutes === minutes)?.label[l] ?? `${minutes}min`;

  const handleSubmit = async () => {
    if (!firstName.trim() || !whatsapp.trim()) {
      setError(t.missing);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const requestId = crypto.randomUUID();
      const payload: Record<string, unknown> = {
        id: requestId,
        experience_id: boat?.id ?? null,
        preferred_city: boat ? null : (preferredCity === "any" ? null : preferredCity),
        requested_duration_minutes: durationMinutes,
        price_variant_id: selectedVariant?.id ?? null,
        customer_name: firstName.trim(),
        customer_phone: whatsapp.trim(),
        customer_email: email.trim() || null,
        adults: persons,
        children: 0,
        party_max: persons,
        requested_date: date || null,
        desired_time_period: timePeriod,
        desired_time_value: timePeriod === "precise" ? preciseTime.trim() || null : null,
        is_urgent: isUrgent,
        language: lang,
        status: "new",
      };

      const { error: insertError } = await (supabase as any).from("standalone_experience_requests").insert(payload);
      if (insertError) throw insertError;

      supabase.functions.invoke("notify-standalone-experience-request", { body: { request_id: requestId } }).catch(() => {});
      supabase.functions
        .invoke("collect-lead", {
          body: {
            source: "boat_request",
            name: firstName.trim(),
            phone: whatsapp.trim(),
            email: email.trim() || undefined,
            metadata: {
              experience_id: boat?.id ?? null,
              experience_title: boat?.title ?? null,
              preferred_city: boat ? boat.city : preferredCity === "any" ? null : preferredCity,
              requested_duration_minutes: durationMinutes,
              adults: persons,
              requested_date: date || null,
              standalone_request_id: requestId,
            },
          },
        })
        .catch(() => {});

      if (boat?.slug) {
        trackRequestClicked({ slug: boat.slug, title: boat.title, city: boat.city } as ProductLike, "boat", "availability_popup");
      }

      setResult({ requestId });
    } catch {
      setError(t.genericError);
    } finally {
      setSubmitting(false);
    }
  };

  const whatsappMessage = (() => {
    if (!result) return "";
    const ref = result.requestId.slice(0, 8).toUpperCase();
    const boatPart = boat ? boat.title : `${preferredCity === "any" ? (tPage("boatAvailabilityPopupTelAvivOrHerzliya")) : preferredCity}`;
    const dateLabel = date || (lang === "fr" ? "date à définir" : "date to confirm");
    if (lang === "fr") {
      return `Bonjour, je viens de faire une demande sur STAYMAKOM (réf. ${ref}) : ${boatPart}, ${durationLabel(durationMinutes)}, ${persons} personnes, ${dateLabel}.`;
    }
    return `Hi, I just sent a request on STAYMAKOM (ref. ${ref}): ${boatPart}, ${durationLabel(durationMinutes)}, ${persons} people, ${dateLabel}.`;
  })();

  return (
    <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (!next) reset(); }}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{result ? t.successTitle : t.title}</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 text-center py-2">
            <CheckCircle2 className="h-10 w-10 text-[#ad1414] mx-auto" />
            <p className="text-sm text-muted-foreground">{t.successBody}</p>
            <p className="text-xs text-muted-foreground">{t.ref} : {result.requestId.slice(0, 8).toUpperCase()}</p>
            <Button asChild className="w-full rounded-full bg-[#25D366] hover:bg-[#1ebe57] text-white">
              <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noopener noreferrer">
                {t.continueWhatsapp}
              </a>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {boat && (
              <p className="text-sm font-medium">{boat.title}{boat.city ? ` · ${tPlace(boat.city)}` : ""}</p>
            )}

            {!boat && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{t.departure}</label>
                <div className="flex flex-wrap gap-1.5">
                  {[{ value: "any", label: t.any }, { value: "Tel Aviv", label: "Tel Aviv" }, { value: "Herzliya", label: "Herzliya" }].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPreferredCity(opt.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm border transition-all",
                        preferredCity === opt.value ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/40"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t.persons}</label>
              <div className="flex items-center gap-2 border rounded-full px-2 py-1 w-fit">
                <button type="button" onClick={() => setPersons((p) => Math.max(1, p - 1))} className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-[2ch] text-center text-sm font-semibold">{persons}</span>
                <button type="button" onClick={() => setPersons((p) => p + 1)} className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t.duration}</label>
              <div className="flex flex-wrap gap-1.5">
                {availableDurations.map((opt) => {
                  const variant = boat?.price_variants.find((v) => v.duration_minutes === opt.minutes);
                  const delta = variant && cheapestPrice != null ? variant.sale_price - cheapestPrice : null;
                  return (
                    <button
                      key={opt.minutes}
                      type="button"
                      onClick={() => setDurationMinutes(opt.minutes)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm border transition-all flex flex-col items-center leading-tight",
                        durationMinutes === opt.minutes ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/40"
                      )}
                    >
                      <span>{opt.label[l]}</span>
                      {variant && (
                        <span className="text-[10px] opacity-80">
                          {delta && delta > 0 ? `+${Math.round(delta)}₪` : `${Math.round(variant.sale_price)}₪`}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t.date}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="rounded-full h-9 gap-2 w-fit">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {date ? format(new Date(date + "T12:00:00"), "d MMM", { locale: dateFnsLocale(l) }) : "-"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarPicker
                    mode="single"
                    selected={date ? new Date(date + "T12:00:00") : undefined}
                    onSelect={(d) => setDate(d ? toLocalDateStr(d) : "")}
                    locale={dateFnsLocale(l)}
                  />
                </PopoverContent>
              </Popover>
              {isUrgent && <p className="text-xs font-medium text-[#ad1414]">{t.lastMinuteBanner}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{t.time}</label>
              <div className="flex flex-wrap gap-1.5">
                {TIME_PERIODS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTimePeriod(opt.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm border transition-all",
                      timePeriod === opt.value ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/40"
                    )}
                  >
                    {opt.label[l]}
                  </button>
                ))}
              </div>
              {timePeriod === "precise" && (
                <Input
                  type="time"
                  value={preciseTime}
                  onChange={(e) => setPreciseTime(e.target.value)}
                  placeholder={t.preciseTimePlaceholder}
                  className="w-32 mt-1.5"
                />
              )}
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="space-y-1">
                <label className="text-xs font-medium">{t.firstName} *</label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={submitting} />
              </div>
              {/* Sur sa propre ligne : l'indicatif pays prend de la place à côté du numéro. */}
              <div className="space-y-1">
                <label className="text-xs font-medium">{t.whatsapp} *</label>
                <PhoneInput value={whatsapp} onChange={setWhatsapp} disabled={submitting} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">{t.email}</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={submitting} />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{t.disclaimer}</p>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="button"
              className="w-full rounded-full h-11 font-semibold bg-[#ad1414] hover:bg-[#9a1212] text-white"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? t.sending : t.submit}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
