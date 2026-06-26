import { Link } from "react-router-dom";
import { Instagram, Gift } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { openNewsletterPopup } from "@/components/NewsletterPopup";

const LaunchFooter = () => {
  const { lang } = useLanguage();
  const isRTL = lang === "he";

  return (
    <footer className="bg-[#1a1a1a] text-white border-t border-white/10" dir={isRTL ? "rtl" : "ltr"}>
      <div className="container py-6 space-y-4">
        {/* Bandeau newsletter — toujours accessible pour récupérer le code WELCOME10 */}
        <div className="flex items-center justify-center">
          <div className="relative inline-block">
            <span
              aria-hidden
              className="absolute inset-x-2 bottom-1.5 h-3 sm:h-3.5 rounded-[60%_40%_70%_30%/40%_60%_30%_70%] -rotate-1 bg-[#ad1414]/40"
            />
            <button
              type="button"
              onClick={openNewsletterPopup}
              className="group relative inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.12em] text-white/85 transition-all duration-200 ease-out hover:text-white"
            >
              <Gift className="h-3.5 w-3.5" />
              {lang === "he"
                ? "הירשם/י לניוזלטר ותקבל/י 10% הנחה"
                : lang === "fr"
                  ? "S'inscrire à la newsletter — 10 % offerts"
                  : "Subscribe & get 10% off"}
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Logo */}
          <Link to="/launch" className="flex items-center">
            <span className="font-sans font-bold tracking-[-0.04em] uppercase text-lg text-white">
              STAYMAKOM
            </span>
          </Link>

          {/* Center: Links */}
          <div className="flex items-center gap-4 text-xs text-white/80">
            <Link to="/partners" className="hover:text-white transition-colors">
              {lang === "he" ? "הפוך לשותף" : "I'm a hotel"}
            </Link>
            <span className="text-white/30">·</span>
            <Link to="/privacy" className="hover:text-white transition-colors">
              {lang === "he" ? "פרטיות" : "Privacy"}
            </Link>
            <span className="text-white/30">·</span>
            <Link to="/terms" className="hover:text-white transition-colors">
              {lang === "he" ? "תנאים" : "Terms"}
            </Link>
          </div>

          {/* Right: Social Icons */}
          <div className="flex items-center gap-4">
            <a 
              href="https://www.instagram.com/staymakom/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white hover:text-[#d45a5a] transition-colors"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a 
              href="https://tiktok.com/@staymakom" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-white hover:text-[#d45a5a] transition-colors"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LaunchFooter;
