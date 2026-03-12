import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Send, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";

interface PersonalizedRequestSectionProps {
  userName?: string;
  userEmail?: string;
  contactEmail?: string;
}

const getCopy = (lang: string) => {
  if (lang === "he") {
    return {
      title: "יש לך בקשה מיוחדת?",
      subtitle: "הצוות שלנו כאן כדי לארגן את החוויה המושלמת שלך",
      requestType: "סוג הבקשה",
      message: "ההודעה שלך",
      messagePlaceholder: "ספר/י לנו על הבקשה המיוחדת שלך...",
      send: "שלח בקשה",
      sending: "שולח...",
      orContact: "או צור קשר:",
      success: "הבקשה נשלחה בהצלחה! ניצור איתך קשר בקרוב.",
      error: "לא ניתן לשלוח את הבקשה. נסה שוב.",
      types: {
        dietary: "צרכים תזונתיים",
        accessibility: "נגישות",
        celebration: "אירוע מיוחד",
        custom: "חוויה מותאמת אישית",
        group: "הזמנה קבוצתית",
        other: "אחר",
      },
    };
  }
  return {
    title: "Have a special request?",
    subtitle: "Our team is here to arrange your perfect experience",
    requestType: "Request type",
    message: "Your message",
    messagePlaceholder: "Tell us about your special request...",
    send: "Send request",
    sending: "Sending...",
    orContact: "Or contact us:",
    success: "Request sent successfully! We'll be in touch soon.",
    error: "Unable to send request. Please try again.",
    types: {
      dietary: "Dietary requirements",
      accessibility: "Accessibility needs",
      celebration: "Special celebration",
      custom: "Custom experience",
      group: "Group booking",
      other: "Other",
    },
  };
};

export default function PersonalizedRequestSection({
  userName,
  userEmail,
  contactEmail = "hello@staymakom.com",
}: PersonalizedRequestSectionProps) {
  const { lang } = useLanguage();
  const copy = getCopy(lang);
  
  const [requestType, setRequestType] = useState<string>("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!requestType || !message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("send-contact-request", {
        body: {
          name: userName || "Account User",
          email: userEmail,
          subject: `[Account Request] ${requestType}`,
          message: message,
          language: lang,
        },
      });

      if (error) throw error;

      toast.success(copy.success);
      setRequestType("");
      setMessage("");
    } catch (error) {
      
      toast.error(copy.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mt-8 border-dashed border-2 border-accent/30 bg-accent/5">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h3 className="font-serif text-xl text-foreground">{copy.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{copy.subtitle}</p>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {copy.requestType}
            </label>
            <Select value={requestType} onValueChange={setRequestType}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={copy.requestType} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dietary">{copy.types.dietary}</SelectItem>
                <SelectItem value="accessibility">{copy.types.accessibility}</SelectItem>
                <SelectItem value="celebration">{copy.types.celebration}</SelectItem>
                <SelectItem value="custom">{copy.types.custom}</SelectItem>
                <SelectItem value="group">{copy.types.group}</SelectItem>
                <SelectItem value="other">{copy.types.other}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              {copy.message}
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={copy.messagePlaceholder}
              className="min-h-[100px] bg-background resize-none"
            />
          </div>

          <Button
            variant="cta"
            onClick={handleSubmit}
            disabled={isSubmitting || !requestType || !message.trim()}
            className="w-full gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {copy.sending}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {copy.send}
              </>
            )}
          </Button>

          {/* Contact alternative */}
          <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{copy.orContact}</span>
            <a
              href={`mailto:${contactEmail}`}
              className="text-accent hover:underline font-medium"
            >
              {contactEmail}
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
