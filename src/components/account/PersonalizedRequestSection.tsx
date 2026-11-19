import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
import { tPage, uiGroup } from "@/lib/translations";

interface PersonalizedRequestSectionProps {
  userName?: string;
  userEmail?: string;
  contactEmail?: string;
}


export default function PersonalizedRequestSection({
  userName,
  userEmail,
  contactEmail = "shana@staymakom.com",
}: PersonalizedRequestSectionProps) {
  const { lang } = useLanguage();
  const copy = uiGroup("personalizedRequest");
  
  const [requestType, setRequestType] = useState<string>("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!requestType || !message.trim()) {
      toast.error(tPage("giftCardPleaseFillInAllRequired"));
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

          <div className="flex justify-center">
            <div className="relative inline-block">
              <span
                aria-hidden
                className="absolute inset-x-2 bottom-1.5 h-3 rounded-[60%_40%_70%_30%/40%_60%_30%_70%] -rotate-1 bg-[#ad1414]/40"
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !requestType || !message.trim()}
                className="group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-foreground transition-all duration-200 ease-out hover:opacity-80 disabled:opacity-50 disabled:pointer-events-none"
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
              </button>
            </div>
          </div>

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
