import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { Cookie } from "lucide-react";

interface CookieConsentProps {
  onAccept: () => void;
  onDecline: () => void;
}

const texts = {
  en: {
    message: "We use cookies to improve your experience and analyze site traffic.",
    learnMore: "Learn more",
    accept: "Accept",
    decline: "Decline",
  },
  fr: {
    message: "Nous utilisons des cookies pour améliorer votre expérience et analyser le trafic.",
    learnMore: "En savoir plus",
    accept: "Accepter",
    decline: "Refuser",
  },
  he: {
    message: "אנו משתמשים בעוגיות כדי לשפר את החוויה שלכם ולנתח את התנועה באתר.",
    learnMore: "למידע נוסף",
    accept: "אישור",
    decline: "סירוב",
  },
};

const CookieConsent = ({ onAccept, onDecline }: CookieConsentProps) => {
  let lang: "en" | "fr" | "he" = "en";
  try {
    const { lang: currentLang } = useLanguage();
    lang = currentLang;
  } catch {
    // fallback to en if outside router
  }

  const t = texts[lang] || texts.en;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50"
      style={{ animation: "cookieSlideUp 300ms ease-out forwards" }}
    >
      <style>{`
        @keyframes cookieSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div className="mx-auto max-w-4xl px-4 pb-4 sm:px-6">
        <div
          className="rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-lg p-4 sm:p-5"
          dir={lang === "he" ? "rtl" : "ltr"}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Cookie className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/85 leading-relaxed">
                {t.message}{" "}
                <Link
                  to="/privacy"
                  className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                >
                  {t.learnMore}
                </Link>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={onDecline}
                className="flex-1 sm:flex-none text-sm"
              >
                {t.decline}
              </Button>
              <Button
                variant="cta"
                size="sm"
                onClick={onAccept}
                className="flex-1 sm:flex-none text-sm"
              >
                {t.accept}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
