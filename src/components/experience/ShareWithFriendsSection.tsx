import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ShareDialog from "./ShareDialog";
import { trackShareThisEscapeClicked } from "@/lib/analytics";

interface ShareWithFriendsSectionProps {
  title: string;
  lang: 'en' | 'he' | 'fr';
}

const ShareWithFriendsSection = ({ title, lang }: ShareWithFriendsSectionProps) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const getText = (key: string) => {
    const texts: { [key: string]: { en: string; fr: string; he: string } } = {
      prompt: {
        en: "Know someone who'd love this?",
        fr: "Quelqu'un aimerait cette expérience ?",
        he: "מכירים מישהו שיאהב?"
      },
      shareBtn: {
        en: "Share this escape",
        fr: "Partager cette escapade",
        he: "שתפו את הבריחה"
      }
    };
    return texts[key]?.[lang] || texts[key]?.en || key;
  };

  const handleShare = async () => {
    trackShareThisEscapeClicked(window.location.pathname.split('/').pop() || '');
    const url = window.location.href;
    if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
      try {
        await navigator.share({ title, url });
        return;
      } catch { /* fall through */ }
    }
    try { await navigator.clipboard.writeText(url); } catch {}
    setShareDialogOpen(true);
  };

  return (
    <>
      <section className="py-6">
        <div className="border border-border/60 rounded-xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {getText('prompt')}
          </p>
          <Button 
            variant="outline"
            onClick={handleShare}
            className="gap-2 rounded-full border-foreground/20 hover:bg-foreground hover:text-background transition-all"
          >
            <Share2 className="h-4 w-4" />
            {getText('shareBtn')}
          </Button>
        </div>
      </section>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        url={window.location.href}
        title={title}
        lang={lang}
      />
    </>
  );
};

export default ShareWithFriendsSection;
