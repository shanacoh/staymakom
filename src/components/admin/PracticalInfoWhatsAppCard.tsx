import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STANDALONE_EXPERIENCE_INTERNAL, fetchInternalFields } from "@/lib/internalFields";
import { buildWhatsAppLink, FOLLOW_UP_LANGUAGES, type FollowUpLanguage } from "@/lib/reservations/whatsapp";
import { buildClientWhatsAppMessage, buildPracticalInfo, PRACTICAL_INFO_COLUMNS, type PracticalInfoSource } from "@/lib/practicalInfo";

interface Props {
  booking: {
    customer_name: string | null;
    customer_phone: string | null;
    booking_date: string;
    time_slot: string | null;
    preferred_lang: string | null;
    standalone_experience_id: string | null;
    custom_experience_title: string | null;
    reminder_email_sent_at?: string | null;
  };
}

type ExperienceForMessage = PracticalInfoSource & { title: string | null; title_fr: string | null; title_he: string | null };

// Message WhatsApp prêt à envoyer au client : les mêmes infos pratiques que dans l'email, en texte court.
// Rien ne part tout seul : Shana copie le message ou ouvre WhatsApp et appuie elle-même sur Envoyer.
export default function PracticalInfoWhatsAppCard({ booking }: Props) {
  const clientLanguage = (["fr", "en", "he"] as const).find((l) => l === booking.preferred_lang);
  const [language, setLanguage] = useState<FollowUpLanguage>(clientLanguage ?? "fr");
  const experienceId = booking.standalone_experience_id;

  const { data, isLoading } = useQuery({
    queryKey: ["admin-practical-info", experienceId],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: experience, error } = await (supabase as any)
        .from("standalone_experiences")
        .select(`title, title_fr, title_he, ${PRACTICAL_INFO_COLUMNS}`)
        .eq("id", experienceId!)
        .maybeSingle();
      if (error) throw error;
      // Le contact du jour J est rangé à part, réservé aux admins.
      const contact = await fetchInternalFields(STANDALONE_EXPERIENCE_INTERNAL, experienceId!);
      return { experience: experience as ExperienceForMessage | null, contact };
    },
    enabled: !!experienceId,
  });

  const practicalInfo = useMemo(() => buildPracticalInfo(data?.experience, data?.contact, language), [data, language]);

  const message = useMemo(() => {
    const experience = data?.experience;
    const localizedTitle = language === "fr" ? experience?.title_fr : language === "he" ? experience?.title_he : experience?.title;
    return buildClientWhatsAppMessage(
      {
        customerName: booking.customer_name ?? "",
        experienceTitle: localizedTitle || experience?.title || booking.custom_experience_title || "",
        bookingDate: booking.booking_date,
        timeSlot: booking.time_slot,
      },
      practicalInfo,
      language,
    );
  }, [data, booking, practicalInfo, language]);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Message copié");
    } catch {
      toast.error("Impossible de copier le message");
    }
  };

  const ready = !experienceId || !isLoading;

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Infos pratiques pour le client</p>
          <p className="text-xs text-muted-foreground">
            {booking.reminder_email_sent_at
              ? `Rappel de la veille envoyé le ${format(parseISO(booking.reminder_email_sent_at), "dd MMM yyyy à HH:mm")}`
              : "Rappel de la veille pas encore envoyé (il part seul la veille vers 10 h)"}
          </p>
        </div>
        <Select value={language} onValueChange={(next) => setLanguage(next as FollowUpLanguage)}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FOLLOW_UP_LANGUAGES.map((l) => (
              <SelectItem key={l.value} value={l.value}>
                {l.label}
                {l.value === clientLanguage ? " (client)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {ready && !practicalInfo && (
        <p className="text-xs text-muted-foreground">
          {experienceId
            ? "La fiche n'a aucune info pratique (section « Après la réservation ») : le message ne contient que la date et l'heure."
            : "Réservation hors catalogue : le message ne contient que la date et l'heure."}
        </p>
      )}

      <pre dir={language === "he" ? "rtl" : "ltr"} className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-xs font-sans">
        {ready ? message : "Chargement…"}
      </pre>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={copyMessage} disabled={!ready}>
          <Copy className="h-4 w-4 mr-2" />
          Copier le message WhatsApp
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!ready || !booking.customer_phone}
          onClick={() => window.open(buildWhatsAppLink(booking.customer_phone!, message), "_blank")}
          title={booking.customer_phone ? undefined : "Pas de numéro de téléphone pour ce client"}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Ouvrir WhatsApp avec ce message
        </Button>
      </div>
    </div>
  );
}
