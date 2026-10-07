/**
 * Fenêtre « Tailor-made request » : le formulaire de voyage sur mesure en 3 étapes (Le séjour,
 * Vos envies, Vous), puis l'écran de confirmation avec le bouton WhatsApp. La demande n'est
 * envoyée qu'à la fin de l'étape 3, en une seule fois.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, Loader2, MessageCircle, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WHATSAPP_NUMBER } from "@/constants/whatsapp";
import {
  identifyLead,
  trackTailorMadeStarted,
  trackTailorMadeStepCompleted,
  trackTailorMadeSubmitted,
} from "@/lib/analytics";
import { readVisitSource, visitSourceLabel } from "@/lib/tailorMade/visitSource";
import {
  BUDGETS,
  CONSTRAINTS,
  DIAL_CODES,
  LANGUAGES,
  MAX_ADULTS,
  MAX_CHILDREN,
  MAX_NIGHTS,
  MOODS,
  REGIONS,
  STAY_TYPES,
  emptyForm,
  isStepComplete,
  toPayload,
  upcomingMonths,
  type FormStep,
  type TailorMadeForm,
} from "@/lib/tailorMade/form";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fieldLabel = "block text-xs uppercase tracking-[0.12em] text-foreground/60 mb-2 font-medium";
const cardInput =
  "rounded-xl border-border/40 bg-card shadow-soft focus-within:shadow-medium focus-within:ring-1 focus-within:ring-accent/40 transition-all duration-300";

const Bubble = ({ label, active, disabled, onClick }: { label: string; active: boolean; disabled?: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={active}
    className={cn(
      "px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none",
      active
        ? "bg-foreground text-background border-foreground"
        : "bg-card border-border/40 text-foreground/70 hover:border-foreground/30 hover:text-foreground shadow-soft",
    )}
  >
    {label}
  </button>
);

const Counter = ({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-card px-3 py-2 shadow-soft">
    <span className="text-sm text-foreground/80">{label}</span>
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label={`${label} -`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-border/60 text-foreground/70 hover:border-foreground/40 disabled:opacity-30"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-6 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        aria-label={`${label} +`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-border/60 text-foreground/70 hover:border-foreground/40 disabled:opacity-30"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
);

const TailorMadeDialog = ({ open, onOpenChange }: Props) => {
  const { lang } = useLanguage();
  const isRTL = lang === "he";
  const t = (en: string, he: string, fr: string) => (lang === "he" ? he : lang === "fr" ? fr : en);

  const [form, setForm] = useState<TailorMadeForm>(() => emptyForm(lang));
  const [step, setStep] = useState<FormStep>(1);
  const [submitting, setSubmitting] = useState(false);
  // Référence de la demande une fois enregistrée : affiche l'écran de confirmation.
  const [reference, setReference] = useState<string | null>(null);

  // Chaque ouverture repart d'un formulaire vide.
  useEffect(() => {
    if (!open) return;
    setForm(emptyForm(lang));
    setStep(1);
    setReference(null);
    trackTailorMadeStarted();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const months = useMemo(() => upcomingMonths(lang), [lang]);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const set = (patch: Partial<TailorMadeForm>) => setForm((prev) => ({ ...prev, ...patch }));
  const toggle = <T extends string>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const setChildren = (children: number) =>
    set({ children, childrenAges: Array.from({ length: children }, (_, i) => form.childrenAges[i] ?? "") });

  const steps = [t("The stay", "השהייה", "Le séjour"), t("Your wishes", "הרצונות שלכם", "Vos envies"), t("You", "אתם", "Vous")];
  const complete = isStepComplete(step, form);

  const submit = async () => {
    setSubmitting(true);
    try {
      const source = readVisitSource();
      const { data, error } = await supabase.functions.invoke("submit-tailor-made-request", {
        body: toPayload(form, source),
      });
      if (error || !data?.success) throw error ?? new Error("submit failed");
      trackTailorMadeStepCompleted(3);
      trackTailorMadeSubmitted({
        stayType: form.stayType === "autre" ? "autre" : form.stayType,
        budget: form.budget,
        source: visitSourceLabel(source),
      });
      if (form.email.trim()) identifyLead(form.email.trim());
      setReference(data.reference);
    } catch {
      toast.error(t("Something went wrong. Please try again.", "שגיאה, נסו שנית.", "Une erreur s'est produite. Veuillez réessayer."));
    } finally {
      setSubmitting(false);
    }
  };

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complete || submitting) return;
    if (step === 3) {
      void submit();
      return;
    }
    trackTailorMadeStepCompleted(step);
    setStep((step + 1) as FormStep);
  };

  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    t(
      `Hello Staymakom, I just sent my tailor-made request (ref. ${reference}).`,
      `שלום Staymakom, שלחתי עכשיו בקשה לטיול בהתאמה אישית (מספר ${reference}).`,
      `Bonjour Staymakom, je viens d'envoyer ma demande de voyage sur mesure (réf. ${reference}).`,
    ),
  )}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
        {reference ? (
          <div className="text-center py-8 space-y-5 animate-in fade-in duration-500">
            <CheckCircle className="h-12 w-12 text-foreground mx-auto" />
            <DialogTitle className="font-sans text-2xl font-bold tracking-[-0.02em]">
              {t(
                "Our team will write to you on WhatsApp within 24h",
                "הצוות שלנו יכתוב לכם בוואטסאפ תוך 24 שעות",
                "Notre équipe vous écrit sur WhatsApp sous 24h",
              )}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {t("Your request reference:", "מספר הבקשה שלכם:", "Référence de votre demande :")}{" "}
              <span className="font-semibold text-foreground" dir="ltr">{reference}</span>
            </p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-background transition-opacity hover:opacity-85"
            >
              <MessageCircle className="h-4 w-4" />
              {t("Write to us on WhatsApp", "כתבו לנו בוואטסאפ", "Nous écrire sur WhatsApp")}
            </a>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-sans text-xl font-bold tracking-[-0.02em]">
                {t("Tell us about your dream stay", "ספרו לנו על השהייה החלומית שלכם", "Parlez-nous de votre séjour idéal")}
              </DialogTitle>
            </DialogHeader>

            {/* Barre de progression */}
            <ol className="grid grid-cols-3 gap-2 pt-1" aria-label={t("Progress", "התקדמות", "Progression")}>
              {steps.map((label, i) => (
                <li key={label} aria-current={step === i + 1 ? "step" : undefined}>
                  <div className={cn("h-1 rounded-full transition-colors", i + 1 <= step ? "bg-foreground" : "bg-border")} />
                  <p className={cn("mt-1.5 text-[11px] uppercase tracking-[0.12em]", i + 1 === step ? "font-semibold text-foreground" : "text-foreground/50")}>
                    {i + 1}. {label}
                  </p>
                </li>
              ))}
            </ol>

            <form onSubmit={next} className="space-y-6 pt-2">
              {step === 1 && (
                <>
                  <div>
                    <label className={fieldLabel}>{t("What kind of stay?", "איזה סוג שהייה?", "Quel type de séjour ?")} *</label>
                    <div className="flex flex-wrap gap-2">
                      {STAY_TYPES.map((o) => (
                        <Bubble key={o.value} label={o.label[lang]} active={form.stayType === o.value} onClick={() => set({ stayType: o.value })} />
                      ))}
                    </div>
                    {form.stayType === "autre" ? (
                      <Input
                        autoFocus
                        value={form.stayTypeOther}
                        onChange={(e) => set({ stayTypeOther: e.target.value })}
                        placeholder={t("Tell us more…", "ספרו לנו עוד…", "Dites-nous en plus…")}
                        className={cn("mt-3", cardInput)}
                        maxLength={200}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => set({ stayType: "autre" })}
                        className="mt-3 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                      >
                        {t("Other", "אחר", "Autre")}
                      </button>
                    )}
                  </div>

                  <div>
                    <label className={fieldLabel}>{t("When?", "מתי?", "Quand ?")} *</label>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <Bubble label={t("Exact dates", "תאריכים מדויקים", "Dates précises")} active={form.datesMode === "precises"} onClick={() => set({ datesMode: "precises" })} />
                      <Bubble label={t("Flexible dates", "תאריכים גמישים", "Dates flexibles")} active={form.datesMode === "flexibles"} onClick={() => set({ datesMode: "flexibles" })} />
                    </div>
                    {form.datesMode === "precises" ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="mb-1 block text-xs text-muted-foreground">{t("From", "מ", "Du")}</span>
                          <Input
                            type="date"
                            min={today}
                            value={form.dateStart}
                            onChange={(e) => set({ dateStart: e.target.value, dateEnd: form.dateEnd && form.dateEnd < e.target.value ? "" : form.dateEnd })}
                            className={cardInput}
                          />
                        </div>
                        <div>
                          <span className="mb-1 block text-xs text-muted-foreground">{t("To", "עד", "Au")}</span>
                          <Input type="date" min={form.dateStart || today} value={form.dateEnd} onChange={(e) => set({ dateEnd: e.target.value })} className={cardInput} />
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Select value={form.month} onValueChange={(month) => set({ month })}>
                          <SelectTrigger className={cardInput}>
                            <SelectValue placeholder={t("Which month?", "איזה חודש?", "Quel mois ?")} />
                          </SelectTrigger>
                          <SelectContent>
                            {months.map((m) => (
                              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Counter label={t("Nights", "לילות", "Nuits")} value={form.nights} min={1} max={MAX_NIGHTS} onChange={(nights) => set({ nights })} />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={fieldLabel}>{t("Who is travelling?", "מי נוסע?", "Qui voyage ?")} *</label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Counter label={t("Adults", "מבוגרים", "Adultes")} value={form.adults} min={1} max={MAX_ADULTS} onChange={(adults) => set({ adults })} />
                      <Counter label={t("Children", "ילדים", "Enfants")} value={form.children} min={0} max={MAX_CHILDREN} onChange={setChildren} />
                    </div>
                    {form.children > 0 && (
                      <div className="mt-3">
                        <span className="mb-1 block text-xs text-muted-foreground">{t("Children's ages", "גילאי הילדים", "Âges des enfants")}</span>
                        <div className="flex flex-wrap gap-2">
                          {form.childrenAges.map((age, i) => (
                            <Select
                              key={i}
                              value={age}
                              onValueChange={(value) => set({ childrenAges: form.childrenAges.map((a, j) => (j === i ? value : a)) })}
                            >
                              <SelectTrigger className={cn("w-[92px]", cardInput)} aria-label={`${t("Child", "ילד", "Enfant")} ${i + 1}`}>
                                <SelectValue placeholder={t("Age", "גיל", "Âge")} />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 18 }, (_, n) => (
                                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <label className={fieldLabel}>{t("Total budget, flights excluded", "תקציב כולל, ללא טיסות", "Budget total, hors vols")} *</label>
                    <div className="flex flex-wrap gap-2">
                      {BUDGETS.map((o) => (
                        <Bubble key={o.value} label={o.label[lang]} active={form.budget === o.value} onClick={() => set({ budget: o.value })} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={fieldLabel}>
                      {t("Your moods", "האווירה שלכם", "Vos envies")}
                      <span className="ms-1 normal-case tracking-normal font-normal text-muted-foreground/60">
                        ({t("optional", "אופציונלי", "facultatif")})
                      </span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {MOODS.map((o) => (
                        <Bubble key={o.value} label={o.label[lang]} active={form.moods.includes(o.value)} onClick={() => set({ moods: toggle(form.moods, o.value) })} />
                      ))}
                    </div>
                    {form.moods.includes("autre") && (
                      <Input
                        value={form.moodOther}
                        onChange={(e) => set({ moodOther: e.target.value })}
                        placeholder={t("Tell us more…", "ספרו לנו עוד…", "Dites-nous en plus…")}
                        className={cn("mt-3", cardInput)}
                        maxLength={200}
                      />
                    )}
                  </div>

                  <div>
                    <label className={fieldLabel}>{t("Which regions?", "אילו אזורים?", "Quelles régions ?")} *</label>
                    <div className="flex flex-wrap gap-2">
                      {REGIONS.map((o) => (
                        <Bubble
                          key={o.value}
                          label={o.label[lang]}
                          active={!form.surpriseMe && form.regions.includes(o.value)}
                          onClick={() => set({ surpriseMe: false, regions: toggle(form.surpriseMe ? [] : form.regions, o.value) })}
                        />
                      ))}
                      <Bubble
                        label={t("Surprise me", "תפתיעו אותי", "Surprenez-moi")}
                        active={form.surpriseMe}
                        onClick={() => set({ surpriseMe: !form.surpriseMe, regions: [] })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={fieldLabel}>{t("Anything we should plan for?", "משהו שכדאי שנדע?", "Des contraintes à prévoir ?")}</label>
                    <div className="flex flex-wrap gap-2">
                      {CONSTRAINTS.map((o) => (
                        <Bubble
                          key={o.value}
                          label={o.label[lang]}
                          active={form.constraints.includes(o.value)}
                          onClick={() => set({ constraints: toggle(form.constraints, o.value) })}
                        />
                      ))}
                    </div>
                    <Input
                      value={form.constraintOther}
                      onChange={(e) => set({ constraintOther: e.target.value })}
                      placeholder={t("Other (allergies, mobility…)", "אחר (אלרגיות, ניידות…)", "Autre (allergies, mobilité…)")}
                      className={cn("mt-3", cardInput)}
                      maxLength={300}
                    />
                  </div>

                  <div>
                    <label className={fieldLabel}>{t("First trip to Israel?", "טיול ראשון בישראל?", "Premier voyage en Israël ?")} *</label>
                    <div className="flex flex-wrap gap-2">
                      <Bubble label={t("Yes", "כן", "Oui")} active={form.firstTrip === true} onClick={() => set({ firstTrip: true })} />
                      <Bubble label={t("No", "לא", "Non")} active={form.firstTrip === false} onClick={() => set({ firstTrip: false })} />
                    </div>
                  </div>

                  <div>
                    <label className={fieldLabel}>
                      {t("Tell us more", "ספרו לנו עוד", "Dites-nous en plus")}
                      <span className="ms-1 normal-case tracking-normal font-normal text-muted-foreground/60">
                        ({t("optional", "אופציונלי", "facultatif")})
                      </span>
                    </label>
                    <Textarea
                      value={form.message}
                      onChange={(e) => set({ message: e.target.value })}
                      rows={3}
                      maxLength={2000}
                      className={cardInput}
                    />
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div>
                    <label className={fieldLabel}>{t("First name", "שם פרטי", "Prénom")} *</label>
                    <Input value={form.firstName} onChange={(e) => set({ firstName: e.target.value })} autoComplete="given-name" className={cardInput} maxLength={80} />
                  </div>

                  <div>
                    <label className={fieldLabel}>WhatsApp *</label>
                    {/* Un numéro se lit toujours de gauche à droite, même en hébreu. */}
                    <div className="flex gap-2" dir="ltr">
                      <Select value={form.dialCode} onValueChange={(dialCode) => set({ dialCode })}>
                        <SelectTrigger className={cn("w-[120px] shrink-0", cardInput)} aria-label={t("Country code", "קידומת מדינה", "Indicatif pays")}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DIAL_CODES.map((d) => (
                            <SelectItem key={d.code} value={d.code}>{d.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel-national"
                        value={form.phone}
                        onChange={(e) => set({ phone: e.target.value })}
                        className={cardInput}
                        maxLength={20}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={fieldLabel}>
                      Email
                      <span className="ms-1 normal-case tracking-normal font-normal text-muted-foreground/60">
                        ({t("optional", "אופציונלי", "facultatif")})
                      </span>
                    </label>
                    <Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} autoComplete="email" className={cardInput} maxLength={255} />
                  </div>

                  <div>
                    <label className={fieldLabel}>{t("Preferred language", "שפה מועדפת", "Langue préférée")}</label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES.map((o) => (
                        <Bubble key={o.value} label={o.label[lang]} active={form.language === o.value} onClick={() => set({ language: o.value })} />
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between gap-3 pt-1">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((step - 1) as FormStep)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className={cn("h-3.5 w-3.5", isRTL && "rotate-180")} />
                    {t("Back", "חזרה", "Retour")}
                  </button>
                ) : (
                  <span />
                )}
                <div className="relative inline-block">
                  <span aria-hidden className="absolute inset-x-2 bottom-1.5 h-3 rounded-[60%_40%_70%_30%/40%_60%_30%_70%] -rotate-1 bg-[#ad1414]/40" />
                  <button
                    type="submit"
                    disabled={!complete || submitting}
                    className="group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-foreground transition-all duration-200 ease-out hover:opacity-80 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : step === 3 ? (
                      t("Send my request", "שלחו את הבקשה שלי", "Envoyer ma demande")
                    ) : (
                      t("Continue", "המשך", "Continuer")
                    )}
                  </button>
                </div>
              </div>

              {step === 3 && (
                <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
                  {t(
                    "By sending this form you agree to be contacted by Staymakom, to receive our travel ideas from time to time, and accept our ",
                    "בשליחת טופס זה אתם מסכימים ש-Staymakom תיצור איתכם קשר ותשלח לכם מדי פעם רעיונות לחופשות, ומקבלים את ",
                    "En envoyant ce formulaire, vous acceptez d'être contacté par Staymakom, de recevoir de temps en temps nos idées de séjours, ainsi que nos ",
                  )}
                  <Link to="/terms" className="underline underline-offset-2 hover:text-foreground/60">
                    {t("Terms", "התנאים", "Conditions d'utilisation")}
                  </Link>
                  {t(" and ", " ו", " et notre ")}
                  <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground/60">
                    {t("Privacy Policy", "מדיניות הפרטיות", "Politique de confidentialité")}
                  </Link>
                  .
                </p>
              )}
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TailorMadeDialog;
