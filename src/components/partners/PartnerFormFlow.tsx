import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { t } from "@/lib/translations";
import { trackPartnerFormSubmitted } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const step1Schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  hotel_name: z.string().trim().min(1, "Hotel name is required").max(200),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

type Step1Data = z.infer<typeof step1Schema>;

const GOAL_OPTIONS = [
  { value: "increase_visibility", key: "partnersGoalVisibility" },
  { value: "low_season", key: "partnersGoalLowSeason" },
  { value: "midweek", key: "partnersGoalMidweek" },
  { value: "ancillary_revenue", key: "partnersGoalAncillary" },
  { value: "experiences", key: "partnersGoalExperiences" },
  { value: "other", key: "partnersGoalOther" },
] as const;

const FACILITY_OPTIONS = [
  { value: "spa", key: "partnersFacilitySpa" },
  { value: "restaurant", key: "partnersFacilityRestaurant" },
  { value: "pool", key: "partnersFacilityPool" },
  { value: "rooftop", key: "partnersFacilityRooftop" },
  { value: "experiences", key: "partnersFacilityExperiences" },
] as const;

interface PartnerFormFlowProps {
  lang: "en" | "he";
}

export const PartnerFormFlow = ({ lang }: PartnerFormFlowProps) => {
  const isRTL = lang === "he";
  const [step, setStep] = useState<1 | 2>(1);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 2 qualification state
  const [goals, setGoals] = useState<string[]>([]);
  const [pms, setPms] = useState("");
  const [numProperties, setNumProperties] = useState("");
  const [facilities, setFacilities] = useState<string[]>([]);
  const [isQualSaving, setIsQualSaving] = useState(false);
  const [qualDone, setQualDone] = useState(false);

  const form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    mode: "onSubmit",
    defaultValues: { name: "", hotel_name: "", email: "", phone: "", message: "" },
  });

  const toggleItem = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  };

  const onStep1Submit = async (data: Step1Data) => {
    setIsSubmitting(true);
    try {
      const { data: inserted, error } = await supabase
        .from("leads")
        .insert({
          source: "partners",
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          property_name: data.hotel_name,
          message: data.message || null,
          is_b2b: true,
        })
        .select("id")
        .single();

      if (error) throw error;
      setLeadId(inserted.id);

      await supabase.functions.invoke("send-partner-request", {
        body: {
          name: data.name,
          hotel_name: data.hotel_name,
          email: data.email,
          phone: data.phone,
          message: data.message,
          language: lang,
        },
      });

      trackPartnerFormSubmitted();
      form.reset();
      setStep(2);
    } catch {
      toast.error(lang === "he" ? "משהו השתבש. אנא נסו שוב." : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveQualification = async () => {
    if (!leadId) { setQualDone(true); return; }
    setIsQualSaving(true);
    try {
      const metadata: Record<string, unknown> = {};
      if (goals.length) metadata.partner_goals = goals;
      if (pms.trim()) metadata.pms = pms.trim();
      if (numProperties.trim()) metadata.num_rooms = parseInt(numProperties, 10) || numProperties.trim();
      if (facilities.length) metadata.facilities = facilities;

      const { error } = await supabase
        .from("leads")
        .update({ metadata })
        .eq("id", leadId);

      if (error) throw error;
      setQualDone(true);
    } catch {
      toast.error(lang === "he" ? "שגיאה בשמירה." : "Error saving. Please try again.");
    } finally {
      setIsQualSaving(false);
    }
  };

  // ─── STEP 1 ───────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div
        key="step1"
        className="animate-in fade-in slide-in-from-bottom-4 duration-500"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onStep1Submit)}
            className="space-y-5 bg-white rounded-2xl p-8 shadow-sm border border-border"
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {t(lang, "partnersName")} *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={lang === "he" ? "השם שלכם" : "Your full name"}
                        className="h-11 border-border focus:border-foreground rounded-xl bg-muted text-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hotel_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {t(lang, "partnersHotelName")} *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={lang === "he" ? "שם המלון שלכם" : "Your hotel name"}
                        className="h-11 border-border focus:border-foreground rounded-xl bg-muted text-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {t(lang, "partnersEmail")} *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      className="h-11 border-border focus:border-foreground rounded-xl bg-muted text-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {t(lang, "partnersPhone")}
                    <span className="ml-1 normal-case text-muted-foreground font-normal">
                      {lang === "he" ? "(אופציונלי)" : "(optional)"}
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+972 XX XXX XXXX"
                      className="h-11 border-border focus:border-foreground rounded-xl bg-muted text-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {lang === "he" ? "מידע נוסף" : "Message / Additional Information"}
                    <span className="ml-1 normal-case text-muted-foreground font-normal">
                      {lang === "he" ? "(אופציונלי)" : "(optional)"}
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t(lang, "partnersPropertyPlaceholder")}
                      className="min-h-[90px] border-border focus:border-foreground rounded-xl bg-muted text-foreground resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-foreground hover:bg-foreground/85 text-background rounded-xl text-sm font-medium tracking-wide transition-all duration-200"
            >
              {isSubmitting ? t(lang, "partnersSending") : t(lang, "partnersSendRequest")}
            </Button>
          </form>
        </Form>
      </div>
    );
  }

  // ─── STEP 2 ───────────────────────────────────────────────────────────────
  return (
    <div
      key="step2"
      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Confirmation banner */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted mb-5">
          <Check className="w-6 h-6 text-foreground" strokeWidth={2.5} />
        </div>
        <h3 className="font-serif text-2xl sm:text-3xl text-foreground mb-4 leading-snug">
          {t(lang, "partnersStep2Title")}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
          {t(lang, "partnersStep2Subtitle")}
        </p>
      </div>

      {/* Qualification form */}
      {qualDone ? (
        <div className="animate-in fade-in duration-300 text-center py-8 px-6 bg-muted rounded-2xl">
          <p className="text-sm font-medium text-foreground">
            {t(lang, "partnersStep2QualDone")}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border p-8 space-y-8">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t(lang, "partnersStep2QualTitle")}
          </p>

          {/* Goals */}
          <div className="space-y-3">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t(lang, "partnersStep2Goals")}
            </p>
            <div className="grid gap-2">
              {GOAL_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleItem(goals, setGoals, option.value)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 flex items-center gap-3 text-sm",
                    goals.includes(option.value)
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-muted text-foreground hover:border-foreground/40"
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-sm border-2 flex items-center justify-center shrink-0 transition-colors",
                      goals.includes(option.value) ? "border-white" : "border-[#C4BEB5]"
                    )}
                  >
                    {goals.includes(option.value) && (
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    )}
                  </div>
                  {t(lang, option.key)}
                </button>
              ))}
            </div>
          </div>

          {/* PMS */}
          <div className="space-y-2">
            <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase block">
              {t(lang, "partnersStep2PMS")}
            </label>
            <Input
              value={pms}
              onChange={e => setPms(e.target.value)}
              placeholder={t(lang, "partnersPMSPlaceholder")}
              className="h-11 border-border focus:border-foreground rounded-xl bg-muted text-foreground"
            />
          </div>

          {/* Num properties */}
          <div className="space-y-2">
            <label className="text-xs font-medium tracking-wide text-muted-foreground uppercase block">
              {t(lang, "partnersStep2NumProperties")}
            </label>
            <Input
              type="number"
              min="1"
              value={numProperties}
              onChange={e => setNumProperties(e.target.value)}
              placeholder="1"
              className="h-11 border-border focus:border-foreground rounded-xl bg-muted text-foreground w-32"
            />
          </div>

          {/* Facilities */}
          <div className="space-y-3">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {t(lang, "partnersStep2Facilities")}
            </p>
            <div className="flex flex-wrap gap-2">
              {FACILITY_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleItem(facilities, setFacilities, option.value)}
                  className={cn(
                    "px-4 py-2 rounded-full border text-sm transition-all duration-200 font-medium",
                    facilities.includes(option.value)
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-muted text-foreground hover:border-foreground/40"
                  )}
                >
                  {t(lang, option.key)}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              onClick={saveQualification}
              disabled={isQualSaving}
              className="flex-1 h-12 bg-foreground hover:bg-foreground/85 text-background rounded-xl text-sm font-medium tracking-wide"
            >
              {isQualSaving ? t(lang, "partnersStep2SubmitSending") : t(lang, "partnersStep2Submit")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setQualDone(true)}
              className="h-12 text-muted-foreground hover:text-muted-foreground text-sm rounded-xl"
            >
              {t(lang, "partnersStep2Skip")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
