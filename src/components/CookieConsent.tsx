import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

interface CookieConsentProps {
  onAccept: () => void;
  onDecline: () => void;
}

const texts = {
  en: {
    kicker: "Your privacy",
    message: "We use cookies to improve your experience and analyze site traffic.",
    learnMore: "Learn more",
    accept: "Accept",
    decline: "Decline",
  },
  fr: {
    kicker: "Votre confidentialité",
    message: "Nous utilisons des cookies pour améliorer votre expérience et analyser le trafic.",
    learnMore: "En savoir plus",
    accept: "Accepter",
    decline: "Refuser",
  },
  he: {
    kicker: "הפרטיות שלך",
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
  const isRTL = lang === "he";

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 pb-20 md:pb-4"
      style={{ animation: "cookieSlideUp 300ms ease-out forwards" }}
    >
      <style>{`
        @keyframes cookieSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div className="mx-auto max-w-xl px-4 sm:px-6">
        <div
          className="rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.10)] px-5 py-4"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">

            {/* Texte */}
            <div className="flex-1 min-w-0 space-y-0.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ad1414]/70">
                {t.kicker}
              </p>
              <p className="text-xs text-black/60 leading-relaxed">
                {t.message}{" "}
                <Link
                  to="/privacy"
                  className="text-black/50 underline underline-offset-2 hover:text-black/70 transition-colors"
                >
                  {t.learnMore}
                </Link>
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={onDecline}
                className="text-xs text-black/30 hover:text-black/50 transition-colors"
              >
                {t.decline}
              </button>

              {/* Accept avec trait rouge organique */}
              <div className="relative inline-block">
                <span
                  aria-hidden
                  className="absolute inset-x-1 bottom-1 h-2.5 rounded-[60%_40%_70%_30%/40%_60%_30%_70%] -rotate-1 bg-[#ad1414]/35"
                />
                <button
                  onClick={onAccept}
                  className="relative rounded-full bg-foreground text-background text-xs font-bold uppercase tracking-widest px-5 py-2 hover:bg-foreground/90 transition-colors"
                >
                  {t.accept}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
