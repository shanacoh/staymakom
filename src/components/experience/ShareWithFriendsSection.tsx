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
      sub: {
        en: "Share this escape & make their day!",
        fr: "Partagez cette escapade & faites-leur plaisir !",
        he: "שתפו את הבריחה הזו & תשמחו אותם!"
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
        <div
          className="group border border-border/60 rounded-2xl px-8 py-7 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.01] hover:border-foreground/20 cursor-default"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-xl shrink-0 transition-transform duration-300 group-hover:scale-110">
              💌
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-foreground">
                {getText('prompt')}
              </p>
              <p className="text-xs text-muted-foreground">
                {getText('sub')}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleShare}
            className="gap-2 rounded-full border-foreground/30 hover:bg-foreground hover:text-background transition-all duration-200 shrink-0"
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
