import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Check } from "lucide-react";
import { ShareNetwork, EnvelopeSimple, MessengerLogo, WhatsappLogo } from "@phosphor-icons/react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { trackShareClicked } from "@/lib/analytics";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title: string;
  lang: 'en' | 'he' | 'fr';
}

const ShareDialog = ({ open, onOpenChange, url, title, lang }: ShareDialogProps) => {
  const isRTL = lang === 'he';
  // Extract slug from url for analytics
  const slug = url.split('/experience/')[1]?.split('?')[0] || '';
  
  const translations = {
    en: {
      shareTitle: "Share this experience",
      shareDescription: "Share via WhatsApp, Messenger, or Email",
      copied: "Copied",
      email: "Email",
      messenger: "Messenger",
      whatsapp: "WhatsApp",
    },
    he: {
      shareTitle: "שתפו את החוויה",
      shareDescription: "שתפו דרך וואטסאפ, מסנג'ר או אימייל",
      copied: "הועתק",
      email: "אימייל",
      messenger: "מסנג'ר",
      whatsapp: "וואטסאפ",
    },
    fr: {
      shareTitle: "Partager cette expérience",
      shareDescription: "Partager via WhatsApp, Messenger ou Email",
      copied: "Copié",
      email: "Email",
      messenger: "Messenger",
      whatsapp: "WhatsApp",
    },
  };

  const t = translations[lang];

  const truncatedUrl = url.length > 30 ? url.substring(0, 30) + '...' : url;

  const handleEmailShare = () => {
    trackShareClicked(slug, 'email');
    const subject = encodeURIComponent(title);
    const body = encodeURIComponent(`${title}\n\n${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleMessengerShare = () => {
    trackShareClicked(slug, 'native');
    const encodedUrl = encodeURIComponent(url);
    const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `fb-messenger://share/?link=${encodedUrl}`;
    } else {
      window.open(`https://www.facebook.com/dialog/send?link=${encodedUrl}&redirect_uri=${encodeURIComponent(window.location.href)}`, '_blank', 'width=600,height=400');
    }
  };

  const handleWhatsAppShare = () => {
    trackShareClicked(slug, 'whatsapp');
    const text = encodeURIComponent(`${title} ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[min(320px,calc(100vw-2rem))] max-w-none rounded-2xl p-0 overflow-hidden border-0 shadow-2xl"
        dir={isRTL ? 'rtl' : 'ltr'}
        hideCloseButton
      >
        {/* Accessibility: Hidden title and description for screen readers */}
        <VisuallyHidden.Root>
          <DialogTitle>{t.shareTitle}</DialogTitle>
          <DialogDescription>{t.shareDescription}</DialogDescription>
        </VisuallyHidden.Root>

        {/* Header with decorative icon */}
        <div className="pt-6 pb-3 px-4 text-center bg-gradient-to-b from-muted/50 to-transparent">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/5 via-muted/30 to-primary/10 mb-3">
            <ShareNetwork size={24} weight="duotone" className="text-primary/70" />
          </div>
          <h2 className="font-serif text-xl text-foreground" aria-hidden="true">
            {t.shareTitle}
          </h2>
        </div>
        
        <div className="px-4 pb-5 space-y-3">
          {/* URL Field with Copied indicator */}
          <div className="flex items-center gap-2 p-2 bg-muted/60 rounded-lg border border-border/50 min-w-0">
            <span className="flex-1 text-xs text-muted-foreground truncate min-w-0">
              {truncatedUrl}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium whitespace-nowrap bg-green-50 px-1.5 py-0.5 rounded-full shrink-0">
              <Check className="h-2.5 w-2.5" />
              {t.copied}
            </span>
          </div>

          {/* Share Buttons - Grid layout */}
          <div className="grid grid-cols-3 gap-1.5">
            {/* Email */}
            <button
              onClick={handleEmailShare}
              className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-200 hover:scale-[1.02] group min-w-0"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/5 via-muted/30 to-primary/10 flex items-center justify-center group-hover:from-primary/10 group-hover:to-primary/20 transition-all shrink-0">
                <EnvelopeSimple size={20} weight="duotone" className="text-primary/60" />
              </div>
              <span className="text-[10px] font-medium text-foreground/70 truncate w-full text-center">
                {t.email}
              </span>
            </button>

            {/* Messenger */}
            <button
              onClick={handleMessengerShare}
              className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-200 hover:scale-[1.02] group min-w-0"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/5 via-muted/30 to-primary/10 flex items-center justify-center group-hover:from-primary/10 group-hover:to-primary/20 transition-all shrink-0">
                <MessengerLogo size={20} weight="duotone" className="text-primary/60" />
              </div>
              <span className="text-[10px] font-medium text-foreground/70 truncate w-full text-center">
                {t.messenger}
              </span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={handleWhatsAppShare}
              className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-200 hover:scale-[1.02] group min-w-0"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/5 via-muted/30 to-primary/10 flex items-center justify-center group-hover:from-primary/10 group-hover:to-primary/20 transition-all shrink-0">
                <WhatsappLogo size={20} weight="duotone" className="text-primary/60" />
              </div>
              <span className="text-[10px] font-medium text-foreground/70 truncate w-full text-center">
                {t.whatsapp}
              </span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;