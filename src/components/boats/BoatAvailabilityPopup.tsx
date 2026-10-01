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
import { fr as frLocale, he as heLocale } from "date-fns/locale";
import { isLastMinuteDate, toLocalDateStr } from "@/lib/boatAvailability";
import { WHATSAPP_NUMBER } from "@/constants/whatsapp";
import { trackRequestClicked, type ProductLike } from "@/lib/analytics";

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
  { minutes: 60, label: { en: "1h", fr: "1h", he: "שעה" } },
  { minutes: 90, label: { en: "1h30", fr: "1h30", he: "שעה וחצי" } },
  { minutes: 120, label: { en: "2h", fr: "2h", he: "שעתיים" } },
  { minutes: 180, label: { en: "3h", fr: "3h", he: "3 שעות" } },
  { minutes: 240, label: { en: "4h", fr: "4h", he: "4 שעות" } },
];

const TIME_PERIODS = [
  { value: "morning", label: { en: "Morning", fr: "Matin", he: "בוקר" } },
  { value: "afternoon", label: { en: "Afternoon", fr: "Après-midi", he: "צהריים" } },
  { value: "sunset", label: { en: "Sunset", fr: "Coucher de soleil", he: "שקיעה" } },
  { value: "precise", label: { en: "Precise time", fr: "Heure précise", he: "שעה מדויקת" } },
] as const;

export default function BoatAvailabilityPopup({ open, onOpenChange, boat }: Props) {
  const { lang } = useLanguage();
  const l = lang as "en" | "fr" | "he";

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
    title: lang === "he" ? "בדיקת זמינות" : lang === "fr" ? "Vérifier une disponibilité" : "Check availability",
    departure: lang === "he" ? "יציאה מ" : lang === "fr" ? "Départ" : "Departure",
    any: lang === "he" ? "לא משנה" : lang === "fr" ? "Peu importe" : "No preference",
    persons: lang === "he" ? "מספר אנשים" : lang === "fr" ? "Nombre de personnes" : "Number of people",
    duration: lang === "he" ? "משך" : lang === "fr" ? "Durée" : "Duration",
    date: lang === "he" ? "תאריך (אופציונלי)" : lang === "fr" ? "Date (facultatif)" : "Date (optional)",
    time: lang === "he" ? "שעה מועדפת" : lang === "fr" ? "Heure souhaitée" : "Preferred time",
    preciseTimePlaceholder: lang === "he" ? "לדוגמה 14:30" : lang === "fr" ? "Ex : 14h30" : "E.g. 2:30pm",
    firstName: lang === "he" ? "שם פרטי" : lang === "fr" ? "Prénom" : "First name",
    whatsapp: "WhatsApp",
    email: lang === "he" ? "אימייל (אופציונלי)" : lang === "fr" ? "Email (facultatif)" : "Email (optional)",
    disclaimer:
      lang === "he"
        ? "אין צורך לשלם עכשיו. נבדוק זמינות מול הסקיפר, ולאחר מכן מקדמה של 500 ₪ תבטיח את היציאה שלכם."
        : lang === "fr"
        ? "Rien à payer maintenant. On confirme la dispo avec le skipper, puis un acompte de 500 ₪ bloque votre sortie."
        : "Nothing to pay now. We confirm availability with the skipper, then a 500 ₪ deposit locks in your outing.",
    submit: lang === "he" ? "שליחת הבקשה" : lang === "fr" ? "Envoyer ma demande" : "Send my request",
    sending: lang === "he" ? "שולח…" : lang === "fr" ? "Envoi…" : "Sending…",
    missing: lang === "he" ? "יש למלא שם פרטי ומספר וואטסאפ" : lang === "fr" ? "Merci de renseigner votre prénom et votre WhatsApp" : "Please fill in your first name and WhatsApp number",
    genericError: lang === "he" ? "שגיאה, נסו שוב" : lang === "fr" ? "Une erreur est survenue, merci de réessayer" : "Something went wrong, please try again",
    lastMinuteBanner:
      lang === "he"
        ? "רגע אחרון: נבדוק ישירות מול הסקיפר."
        : lang === "fr"
        ? "Dernière minute : on vérifie en direct avec le skipper."
        : "Last minute: we'll check directly with the skipper.",
    successTitle: lang === "he" ? "הבקשה נשלחה!" : lang === "fr" ? "Demande envoyée !" : "Request sent!",
    successBody:
      lang === "he"
        ? "נחזור אליכם עם התשובה מהסקיפר בהקדם."
        : lang === "fr"
        ? "On revient vers vous avec la réponse du skipper au plus vite."
        : "We'll get back to you with the skipper's answer as soon as possible.",
    continueWhatsapp: lang === "he" ? "המשך בוואטסאפ" : lang === "fr" ? "Continuer sur WhatsApp" : "Continue on WhatsApp",
    ref: lang === "he" ? "מספר בקשה" : lang === "fr" ? "Référence" : "Reference",
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
    const boatPart = boat ? boat.title : `${preferredCity === "any" ? (lang === "fr" ? "Tel Aviv ou Herzliya" : "Tel Aviv or Herzliya") : preferredCity}`;
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
              <p className="text-sm font-medium">{boat.title}{boat.city ? ` · ${boat.city}` : ""}</p>
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
                    {date ? format(new Date(date + "T12:00:00"), "d MMM", { locale: lang === "fr" ? frLocale : lang === "he" ? heLocale : undefined }) : "—"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarPicker
                    mode="single"
                    selected={date ? new Date(date + "T12:00:00") : undefined}
                    onSelect={(d) => setDate(d ? toLocalDateStr(d) : "")}
                    locale={lang === "fr" ? frLocale : lang === "he" ? heLocale : undefined}
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
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">{t.firstName} *</label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={submitting} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">{t.whatsapp} *</label>
                  <Input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} disabled={submitting} placeholder="+972..." />
                </div>
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
