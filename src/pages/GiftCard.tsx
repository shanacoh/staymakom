import { useState, useEffect } from "react";
import { trackGiftCardPageViewed } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Check } from "lucide-react";
import { format, addYears } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import LaunchHeader from "@/components/LaunchHeader";
import LaunchFooter from "@/components/LaunchFooter";
import giftCardHero from "@/assets/gift-card-hero.jpg";
import cardBg1 from "@/assets/desert-journey.jpg";
import cardBg2 from "@/assets/desert-kiosk-hero.png";
import cardBg3 from "@/assets/coming-soon-road.png";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/lib/translations";
import { useLocalizedNavigation } from "@/hooks/useLocalizedNavigation";
import { useAuth } from "@/contexts/AuthContext";

type Currency = "USD" | "ILS";

const AMOUNTS_USD = [150, 300, 500, 750];
const AMOUNTS_ILS = [500, 1000, 1800, 2500];
const MAX_MESSAGE = 150;

const CARD_BACKGROUNDS = [
  { id: "desert", src: cardBg1, label: "Desert" },
  { id: "pool", src: cardBg2, label: "Pool" },
  { id: "road", src: cardBg3, label: "Road" },
];

const CURRENCY_SYMBOLS: Record<Currency, string> = { USD: "$", ILS: "₪" };

function generateGiftCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 4; i++) {
    part1 += chars.charAt(Math.floor(Math.random() * chars.length));
    part2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MK-${part1}-${part2}`;
}

/* ─── Live Gift Card Preview ─── */
function GiftCardPreview({
  amount,
  currency,
  recipientName,
  bgSrc,
}: {
  amount: number | null;
  currency: Currency;
  recipientName: string;
  bgSrc: string;
}) {
  const sym = CURRENCY_SYMBOLS[currency];
  return (
    <div className="aspect-video w-full max-w-[480px] mx-auto rounded-2xl overflow-hidden relative select-none">
      {/* Background image */}
      <img src={bgSrc} alt="" className="absolute inset-0 w-full h-full object-cover" />
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-5 sm:p-6">
        {/* Top: Logo */}
        <div>
          <span className="text-white/90 font-bold text-sm sm:text-base tracking-[0.25em] uppercase">
            STAYMAKOM
          </span>
        </div>

        {/* Center: Amount */}
        <div className="text-center space-y-1">
          <p className="text-white text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight drop-shadow-lg">
            {amount ? `${sym}${amount}` : `${sym}—`}
          </p>
          <p className="text-white/60 text-xs sm:text-sm italic font-light">
            Gift of Escape
          </p>
        </div>

        {/* Bottom: Recipient */}
        <div className="flex justify-between items-end">
          <p className="text-white/70 text-xs sm:text-sm truncate max-w-[60%]">
            {recipientName ? `For ${recipientName}` : ""}
          </p>
          <p className="text-white/30 text-[10px] sm:text-xs">
            GIFT CARD
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Divider ─── */
function SectionDivider() {
  return <div className="h-px bg-border my-6" />;
}

export default function GiftCard() {
  const { navigateLocalized, getLocalizedPath } = useLocalizedNavigation();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const isRTL = lang === "he";

  useEffect(() => { trackGiftCardPageViewed(); }, []);
  const [currency, setCurrency] = useState<Currency>("USD");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [deliveryType, setDeliveryType] = useState<"now" | "scheduled">("now");
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBg, setSelectedBg] = useState(CARD_BACKGROUNDS[0].id);

  const amounts = currency === "USD" ? AMOUNTS_USD : AMOUNTS_ILS;
  const sym = CURRENCY_SYMBOLS[currency];
  const bgSrc = CARD_BACKGROUNDS.find((b) => b.id === selectedBg)?.src ?? CARD_BACKGROUNDS[0].src;

  // Reset selected amount when switching currency
  useEffect(() => {
    setSelectedAmount(null);
    setCustomAmount("");
  }, [currency]);

  // Auto-fill from logged-in user
  const isLoggedIn = !!user;
  useEffect(() => {
    if (user) {
      const meta = user.user_metadata;
      const name = meta?.full_name || meta?.name || user.email?.split("@")[0] || "";
      setSenderName(name);
      setSenderEmail(user.email || "");
    }
  }, [user]);

  const effectiveAmount = selectedAmount || (customAmount ? parseFloat(customAmount) : null);

  const handleSubmit = async () => {
    const amount = effectiveAmount;

    if (!amount || amount <= 0) {
      toast.error(
        lang === "he"
          ? "אנא בחרו או הזינו סכום תקין"
          : "Please select or enter a valid amount"
      );
      return;
    }

    if (!senderName || !senderEmail) {
      toast.error(
        lang === "he"
          ? "אנא מלאו את כל השדות הנדרשים"
          : "Please fill in all required fields"
      );
      return;
    }

    if (deliveryType === "scheduled" && !scheduledDate) {
      toast.error(
        lang === "he"
          ? "אנא בחרו תאריך משלוח"
          : "Please select a delivery date"
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(senderEmail)) {
      toast.error(
        lang === "he"
          ? "אנא הזינו אימייל שולח תקין"
          : "Please enter a valid email"
      );
      return;
    }
    if (recipientEmail && !emailRegex.test(recipientEmail)) {
      toast.error(
        lang === "he"
          ? "אנא הזינו אימייל נמען תקין"
          : "Please enter a valid recipient email"
      );
      return;
    }

    setIsSubmitting(true);
    const code = generateGiftCode();
    const now = new Date();
    const validUntil = addYears(now, 1);
    const targetEmail = recipientEmail || senderEmail;

    try {
      const { error } = await supabase.from("gift_cards").insert({
        code,
        type: "amount",
        amount,
        currency,
        sender_name: senderName,
        sender_email: senderEmail,
        recipient_name: recipientName || null,
        recipient_email: targetEmail,
        message: message || null,
        delivery_type: deliveryType,
        delivery_date:
          deliveryType === "scheduled" && scheduledDate
            ? scheduledDate.toISOString()
            : now.toISOString(),
        status: deliveryType === "now" ? "sent" : "scheduled",
        language: lang,
        sent_at: deliveryType === "now" ? now.toISOString() : null,
        expires_at: validUntil.toISOString(),
      });

      if (error) throw error;

      if (deliveryType === "now") {
        await supabase.functions
          .invoke("send-gift-card", {
            body: {
              code,
              amount,
              currency,
              sender_name: senderName,
              recipient_name: recipientName || "Friend",
              recipient_email: targetEmail,
              message: message || null,
              valid_until: validUntil.toISOString(),
              language: lang,
            },
          })
          .catch(() => {});
      }

      navigate(
        getLocalizedPath(`/gift-card/confirmation?code=${code}&type=amount`)
      );
      toast.success(
        lang === "he"
          ? "כרטיס המתנה נוצר בהצלחה!"
          : "Gift card created successfully!"
      );
    } catch (error) {
      
      toast.error(
        lang === "he"
          ? "יצירת כרטיס המתנה נכשלה. אנא נסו שוב."
          : "Failed to create gift card. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "h-[52px] text-base rounded-[10px] px-4 border-border bg-transparent focus-visible:ring-foreground/20";
  const labelClass = "text-[13px] font-bold text-foreground";

  return (
    <div className="min-h-screen bg-background">
      <LaunchHeader forceScrolled={true} />

      {/* Hero Section */}
      <section className="relative h-[35vh] min-h-[260px] sm:min-h-[300px] overflow-hidden">
        <img
          src={giftCardHero}
          alt={t(lang, "giftCardHeroTitle")}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div className="max-w-3xl space-y-3" dir={isRTL ? "rtl" : "ltr"}>
            <h1 className="font-sans text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
              {t(lang, "giftCardHeroTitle")}
            </h1>
            <p className="text-sm sm:text-base text-white/90 font-light max-w-md mx-auto">
              {t(lang, "giftCardHeroSubtitle")}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div
        className="max-w-5xl mx-auto px-4 py-8 md:py-12"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="md:grid md:grid-cols-[1fr_1.1fr] md:gap-12 md:items-start">
          {/* LEFT: Gift Card Preview (sticky on desktop) */}
          <div className="mb-8 md:mb-0 md:sticky md:top-24 space-y-4">
            <GiftCardPreview
              amount={effectiveAmount}
              currency={currency}
              recipientName={recipientName}
              bgSrc={bgSrc}
            />

            {/* Background chooser */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center">
                {lang === "he" ? "בחרו עיצוב" : "Choose a design"}
              </p>
              <div className="flex justify-center gap-2">
                {CARD_BACKGROUNDS.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => setSelectedBg(bg.id)}
                    className={cn(
                      "w-16 h-10 sm:w-20 sm:h-12 rounded-lg overflow-hidden border-2 transition-all relative",
                      selectedBg === bg.id
                        ? "border-foreground ring-1 ring-foreground/20"
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={bg.src} alt={bg.label} className="w-full h-full object-cover" />
                    {selectedBg === bg.id && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              {lang === "he"
                ? "תצוגה מקדימה — מתעדכנת בזמן אמת"
                : "Preview, updates as you go !"}
            </p>
          </div>

          {/* RIGHT: Form */}
          <div className="space-y-0">
            {/* ── Currency toggle ── */}
            <div className="mb-4">
              <Label className={labelClass}>
                {lang === "he" ? "מטבע" : "Currency"}
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(["USD", "ILS"] as Currency[]).map((cur) => (
                  <button
                    key={cur}
                    onClick={() => setCurrency(cur)}
                    className={cn(
                      "h-11 rounded-[10px] text-sm font-medium border-[1.5px] transition-all",
                      currency === cur
                        ? "bg-foreground text-background border-foreground"
                        : "bg-secondary/40 text-foreground border-border hover:border-foreground/30"
                    )}
                  >
                    {cur === "USD" ? "$ USD" : "₪ NIS"}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Section 1: Amount ── */}
            <div>
              <Label className={labelClass}>
                {lang === "he" ? "בחרו סכום" : "Select amount"}
              </Label>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {amounts.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      setSelectedAmount(amt);
                      setCustomAmount("");
                    }}
                    className={cn(
                      "h-14 rounded-[10px] text-base font-semibold border-[1.5px] transition-all duration-150",
                      selectedAmount === amt
                        ? "bg-foreground text-background border-foreground"
                        : "bg-secondary/40 text-foreground border-border hover:border-foreground/30"
                    )}
                  >
                    {sym}{amt}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div className="mt-4 space-y-1.5">
                <Label htmlFor="custom-amount" className={labelClass}>
                  {lang === "he" ? "סכום אחר" : "Another amount"}
                </Label>
                <div className="relative">
                  <span
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 text-muted-foreground text-base",
                      isRTL ? "right-4" : "left-4"
                    )}
                  >
                    {sym}
                  </span>
                  <Input
                    id="custom-amount"
                    type="number"
                    placeholder={
                      lang === "he"
                        ? `למשל ${sym}400`
                        : `e.g. ${sym}400`
                    }
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount(null);
                    }}
                    className={cn(inputClass, isRTL ? "pr-10" : "pl-10")}
                  />
                </div>
              </div>
            </div>

            <SectionDivider />

            {/* ── Section 2: Recipient Name ── */}
            <div className="space-y-1.5">
              <Label htmlFor="recipient-name" className={labelClass}>
                {lang === "he" ? "למי זה?" : "Who is this for?"}
              </Label>
              <Input
                id="recipient-name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder={
                  lang === "he" ? "שם הנמען (אופציונלי)" : "Recipient name (optional)"
                }
                className={inputClass}
              />
            </div>

            <SectionDivider />

            {/* ── Section 3: Recipient Email (optional) ── */}
            <div className="space-y-1.5">
              <Label htmlFor="recipient-email" className={labelClass}>
                {lang === "he" ? "שליחה למייל" : "Send to email"}
              </Label>
              <Input
                id="recipient-email"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder={
                  lang === "he"
                    ? "אימייל הנמען (אופציונלי)"
                    : "Recipient email (optional)"
                }
                className={inputClass}
              />
              <p className="text-xs text-muted-foreground">
                {lang === "he"
                  ? "השאירו ריק כדי לשתף בעצמכם דרך קישור"
                  : "Leave empty to share via link yourself"}
              </p>
            </div>

            <SectionDivider />

            {/* ── Section 4: Message ── */}
            <div className="space-y-1.5">
              <Label htmlFor="message" className={labelClass}>
                {lang === "he" ? "הודעה אישית" : "Personal message"}
              </Label>
              <Textarea
                id="message"
                placeholder={
                  lang === "he"
                    ? "כתבו הודעה אישית (אופציונלי)"
                    : "Write a personal message (optional)"
                }
                maxLength={MAX_MESSAGE}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[72px] max-h-[100px] text-base rounded-[10px] px-4 py-3 border-border bg-transparent resize-y focus-visible:ring-foreground/20"
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">
                {message.length}/{MAX_MESSAGE}
              </p>
            </div>

            <SectionDivider />

            {/* ── Section 5: Delivery ── */}
            <div className="space-y-3">
              <Label className={labelClass}>
                {lang === "he" ? "מועד שליחה" : "Delivery"}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDeliveryType("now")}
                  className={cn(
                    "h-12 rounded-[10px] text-sm font-medium border-[1.5px] transition-all",
                    deliveryType === "now"
                      ? "bg-foreground text-background border-foreground"
                      : "bg-secondary/40 text-foreground border-border hover:border-foreground/30"
                  )}
                >
                  {lang === "he" ? "שלח עכשיו" : "Send now"}
                </button>
                <button
                  onClick={() => setDeliveryType("scheduled")}
                  className={cn(
                    "h-12 rounded-[10px] text-sm font-medium border-[1.5px] transition-all",
                    deliveryType === "scheduled"
                      ? "bg-foreground text-background border-foreground"
                      : "bg-secondary/40 text-foreground border-border hover:border-foreground/30"
                  )}
                >
                  {lang === "he" ? "תזמן לאחר כך" : "Schedule for later"}
                </button>
              </div>

              {deliveryType === "scheduled" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        inputClass,
                        !scheduledDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate
                        ? format(scheduledDate, "PPP")
                        : lang === "he"
                          ? "בחרו תאריך"
                          : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto p-3"
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <SectionDivider />

            {/* ── Section 6: Sender info ── */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label htmlFor="sender-name" className={labelClass}>
                    {lang === "he" ? "השם שלך" : "Your name"} *
                  </Label>
                  {isLoggedIn && (
                    <span className="text-[11px] text-muted-foreground">
                      {lang === "he" ? "מהחשבון שלך" : "From your account"}
                    </span>
                  )}
                </div>
                <Input
                  id="sender-name"
                  required
                  value={senderName}
                  onChange={(e) => !isLoggedIn && setSenderName(e.target.value)}
                  readOnly={isLoggedIn}
                  className={cn(
                    inputClass,
                    isLoggedIn && "bg-muted/50 text-muted-foreground cursor-default"
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label htmlFor="sender-email" className={labelClass}>
                    {lang === "he" ? "האימייל שלך" : "Your email"} *
                  </Label>
                  {isLoggedIn && (
                    <span className="text-[11px] text-muted-foreground">
                      {lang === "he" ? "מהחשבון שלך" : "From your account"}
                    </span>
                  )}
                </div>
                <Input
                  id="sender-email"
                  type="email"
                  required
                  value={senderEmail}
                  onChange={(e) => !isLoggedIn && setSenderEmail(e.target.value)}
                  readOnly={isLoggedIn}
                  className={cn(
                    inputClass,
                    isLoggedIn && "bg-muted/50 text-muted-foreground cursor-default"
                  )}
                />
              </div>
            </div>

            {/* ── Desktop CTA ── */}
            <div className="hidden md:block pt-8">
              <Button
                className="w-full h-14 text-base font-semibold uppercase tracking-wide bg-foreground text-background hover:bg-foreground/90"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? lang === "he"
                    ? "מעבד..."
                    : "Processing..."
                  : lang === "he"
                    ? "שלח כרטיס מתנה"
                    : "Send Gift Card"}
              </Button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="max-w-2xl mx-auto mt-16 mb-8">
          <h2 className="font-sans text-xl font-bold text-center mb-6">
            {t(lang, "giftCardFaqTitle")}
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left text-sm">
                {t(lang, "giftCardFaq1Q")}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm">
                {t(lang, "giftCardFaq1A")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left text-sm">
                {t(lang, "giftCardFaq2Q")}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm">
                {t(lang, "giftCardFaq2A")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left text-sm">
                {t(lang, "giftCardFaq3Q")}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm">
                {t(lang, "giftCardFaq3A")}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>

      {/* Mobile sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <div className="h-6 bg-gradient-to-t from-background to-transparent" />
        <div className="bg-background px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-2">
          <Button
            className="w-full h-14 text-base font-semibold uppercase tracking-wide bg-foreground text-background hover:bg-foreground/90"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? lang === "he"
                ? "מעבד..."
                : "Processing..."
              : lang === "he"
                ? "שלח כרטיס מתנה"
                : "Send Gift Card"}
          </Button>
        </div>
      </div>

      {/* Bottom padding for mobile sticky CTA */}
      <div className="md:hidden h-24" />

      <LaunchFooter />
    </div>
  );
}
