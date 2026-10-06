/**
 * Panneau affiché à la place du bloc de réservation pour les expériences
 * marquées "sur demande" (is_bookable = false) : au lieu de payer en ligne,
 * le visiteur laisse ses coordonnées et ses dates souhaitées. La demande
 * atterrit dans standalone_experience_requests, à traiter manuellement
 * depuis le back office.
 *
 * Le formulaire ne s'affiche qu'après un clic sur le CTA (pas tout de suite
 * au chargement) — évite de montrer calendrier/champs avant que le visiteur
 * ait exprimé son intention.
 *
 * N'est plus utilisé par les bateaux (remplacé par BoatAvailabilityPopup,
 * un seul formulaire pour toute la fiche + la demande) : reste le formulaire
 * générique pour les autres expériences "sur demande".
 */
import { useState } from "react";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Users, Calendar, CheckCircle2 } from "lucide-react";
import { fr, he } from "date-fns/locale";
import { ReassuranceLine } from "@/components/reviews/ReassuranceLine";

interface StandaloneRequestPanelProps {
  experienceId: string;
  lang: "en" | "fr" | "he";
  minParty: number;
  maxParty: number;
  minDate: string;
  maxDate?: Date;
  isDateUnavailable: (date: Date) => boolean;
  // Titre de l'expérience — transmis uniquement pour enrichir le lead créé
  // dans collect-lead (affichage dans la fiche détail de /admin/leads).
  experienceTitle?: string;
  // Contrôle externe de l'étape "CTA vs formulaire" — utilisé par une pop-up
  // dont un autre élément sert elle-même de déclencheur. Quand ces props sont
  // fournies, le composant n'affiche plus son propre bouton CTA (évite un CTA
  // en double) : avant `started`, il ne rend rien du tout. Sans ces props, il
  // gère son état de départ tout seul avec son propre bouton.
  started?: boolean;
  onStartedChange?: (started: boolean) => void;
  // Texte formaté (ex: liste d'extras choisis) ajouté au message envoyé,
  // sans que le visiteur ait à le retaper.
  extraNotes?: string;
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function StandaloneRequestPanel({
  experienceId,
  lang,
  minParty,
  maxParty,
  minDate,
  maxDate,
  isDateUnavailable,
  experienceTitle,
  started: controlledStarted,
  onStartedChange,
  extraNotes,
}: StandaloneRequestPanelProps) {
  const isControlled = controlledStarted !== undefined;
  const [internalStarted, setInternalStarted] = useState(false);
  const started = controlledStarted ?? internalStarted;
  const setStarted = onStartedChange ?? setInternalStarted;
  const [adults, setAdults] = useState(minParty || 1);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const t = {
    title: lang === "he" ? "בקשת תאריכים" : lang === "fr" ? "Demande de dates" : "Request dates",
    intro:
      lang === "he"
        ? "החוויה הזו אינה זמינה להזמנה מיידית. השאירו פרטים ונחזור אליכם עם התאריכים הזמינים."
        : lang === "fr"
        ? "Cette expérience n'est pas réservable directement en ligne. Laissez-nous vos coordonnées, nous revenons vers vous avec les disponibilités."
        : "This experience can't be booked instantly. Leave your details and we'll get back to you with availability.",
    cta: lang === "he" ? "בקשת הזמנה" : lang === "fr" ? "Demander la réservation" : "Request availability",
    participants: lang === "he" ? "משתתפים" : lang === "fr" ? "Participants" : "Participants",
    date: lang === "he" ? "תאריך רצוי (אופציונלי)" : lang === "fr" ? "Date souhaitée (facultatif)" : "Preferred date (optional)",
    firstName: lang === "he" ? "שם פרטי" : lang === "fr" ? "Prénom" : "First name",
    lastName: lang === "he" ? "שם משפחה" : lang === "fr" ? "Nom" : "Last name",
    email: "Email",
    phone: lang === "he" ? "טלפון (אופציונלי)" : lang === "fr" ? "Téléphone (facultatif)" : "Phone (optional)",
    message: lang === "he" ? "הודעה (אופציונלי)" : lang === "fr" ? "Message (facultatif)" : "Message (optional)",
    submit: lang === "he" ? "שליחת הבקשה" : lang === "fr" ? "Envoyer ma demande" : "Send my request",
    sending: lang === "he" ? "שולח…" : lang === "fr" ? "Envoi…" : "Sending…",
    missingFields:
      lang === "he" ? "יש למלא שם ואימייל" : lang === "fr" ? "Merci de renseigner votre prénom, nom et email" : "Please fill in your first name, last name and email",
    error:
      lang === "he" ? "שגיאה בשליחת הבקשה, נסו שוב" : lang === "fr" ? "Une erreur est survenue, merci de réessayer" : "Something went wrong, please try again",
    successTitle: lang === "he" ? "הבקשה נשלחה!" : lang === "fr" ? "Demande envoyée !" : "Request sent!",
    successBody:
      lang === "he"
        ? "קיבלנו את בקשתכם ונחזור אליכם תוך 24 עד 48 שעות."
        : lang === "fr"
        ? "Nous avons bien reçu votre demande et revenons vers vous sous 24 à 48h."
        : "We've received your request and will get back to you within 24–48h.",
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setErrorMsg(t.missingFields);
      return;
    }
    setSubmitting(true);
    setErrorMsg("");
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const fullMessage = [message.trim(), extraNotes].filter(Boolean).join("\n\n") || null;
      // Id généré côté client : la policy RLS de la table n'autorise pas le
      // visiteur anonyme à relire sa propre ligne, donc un insert avec
      // `.select().single()` (RETURNING) échoue systématiquement pour lui.
      const requestId = crypto.randomUUID();
      const insertPayload: Record<string, unknown> = {
        id: requestId,
        experience_id: experienceId,
        customer_name: fullName,
        customer_email: email.trim(),
        customer_phone: phone.trim() || null,
        requested_date: selectedDate || null,
        adults,
        children: 0,
        message: fullMessage,
      };

      const { error } = await (supabase as any)
        .from("standalone_experience_requests")
        .insert(insertPayload);
      if (error) throw error;

      // Notification interne (best-effort) : ne bloque jamais la confirmation visiteur.
      (supabase as any).functions
        .invoke("notify-standalone-experience-request", { body: { request_id: requestId } })
        .catch(() => {});

      // Alimente aussi la page Leads (best-effort) : chaque demande devient un
      // lead source="experience_only", pour garder une vue unique de tous les
      // contacts commerciaux (pas seulement les demandes bateaux).
      (supabase as any).functions
        .invoke("collect-lead", {
          body: {
            source: "experience_only",
            email: email.trim(),
            name: fullName,
            phone: phone.trim() || undefined,
            metadata: {
              experience_id: experienceId,
              experience_title: experienceTitle,
              standalone_request_id: requestId,
              requested_date: selectedDate || null,
              adults,
              message: fullMessage,
            },
          },
        })
        .catch(() => {});

      setSubmitted(true);
    } catch {
      setErrorMsg(t.error);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border p-6 shadow-medium text-center space-y-3">
        <CheckCircle2 className="h-10 w-10 text-[#ad1414] mx-auto" />
        <p className="font-semibold text-lg">{t.successTitle}</p>
        <p className="text-sm text-muted-foreground">{t.successBody}</p>
      </div>
    );
  }

  if (!started) {
    // En mode contrôlé, le déclencheur vit chez le parent — pas de second bouton ici.
    if (isControlled) return null;
    return (
      <div className="rounded-2xl border p-5 space-y-4 shadow-medium text-center">
        <div>
          <p className="font-semibold text-lg">{t.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{t.intro}</p>
        </div>
        <Button
          type="button"
          className="w-full rounded-full text-sm font-semibold h-11 bg-[#ad1414] text-white hover:bg-[#9a1212] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_-4px_rgba(173,20,20,0.4)] transition-all duration-200 normal-case"
          onClick={() => setStarted(true)}
        >
          {t.cta}
        </Button>
        <ReassuranceLine lang={lang} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-5 space-y-5 shadow-medium">
      <div>
        <p className="font-semibold text-lg">{t.title}</p>
        <p className="text-sm text-muted-foreground mt-1">{t.intro}</p>
      </div>

      {/* Coordonnées — en premier */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t.firstName}</label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={submitting} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t.lastName}</label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={submitting} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t.email}</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={submitting} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t.phone}</label>
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={submitting} />
        </div>
      </div>

      {/* Participants */}
      <div className="space-y-3">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Users className="h-3.5 w-3.5 text-[#ad1414]" />
          {t.participants}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm">{t.participants}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAdults((a) => Math.max(minParty || 1, a - 1))}
              disabled={adults <= (minParty || 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border text-base hover:bg-[#FDF2F2] hover:border-[#ad1414]/40 disabled:opacity-40 transition-colors"
            >
              −
            </button>
            <span className="min-w-[2ch] text-center font-semibold">{adults}</span>
            <button
              type="button"
              onClick={() => setAdults((a) => Math.min(maxParty, a + 1))}
              disabled={adults >= maxParty}
              className="flex h-9 w-9 items-center justify-center rounded-full border text-base hover:bg-[#FDF2F2] hover:border-[#ad1414]/40 disabled:opacity-40 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Calendar className="h-3.5 w-3.5 text-[#ad1414]" />
          {t.date}
        </p>
        <div className="border rounded-lg overflow-hidden">
          <CalendarPicker
            mode="single"
            showOutsideDays
            className="w-full p-3"
            locale={lang === "fr" ? fr : lang === "he" ? he : undefined}
            selected={selectedDate ? new Date(selectedDate + "T12:00:00") : undefined}
            onSelect={(date) => setSelectedDate(date ? toLocalDateStr(date) : "")}
            disabled={isDateUnavailable}
            defaultMonth={new Date(minDate + "T12:00:00")}
            toDate={maxDate}
            classNames={{
              months: "w-full",
              month: "w-full space-y-4",
              table: "w-full border-collapse space-y-1",
              head_row: "flex w-full",
              head_cell: "flex-1 text-center text-muted-foreground font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "flex-1 h-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
              day_selected: "bg-[#ad1414] text-white hover:bg-[#ad1414] hover:text-white focus:bg-[#ad1414] focus:text-white",
              day_today: "bg-[#FDF0F0] text-[#ad1414] font-semibold rounded-lg",
              day_disabled: "text-muted-foreground/30 cursor-not-allowed",
              day_outside: "text-muted-foreground/30",
            }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t.message}</label>
        <Textarea value={message} onChange={(e) => setMessage(e.target.value)} disabled={submitting} rows={3} />
      </div>

      {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

      <Button
        type="button"
        className="w-full rounded-full text-sm font-semibold h-11 bg-[#ad1414] text-white hover:bg-[#9a1212] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_-4px_rgba(173,20,20,0.4)] transition-all duration-200 normal-case"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? t.sending : t.submit}
      </Button>
    </div>
  );
}
