import { useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { PartnerFormFlow } from "@/components/partners/PartnerFormFlow";
import { trackPartnersPageViewed } from "@/lib/analytics";

const PartnerForm = () => {
  const { lang } = useLanguage();

  useEffect(() => { trackPartnersPageViewed(); }, []);

  return (
    <div className="min-h-screen bg-[#F5F2EC] flex flex-col">
      {/* Minimal header */}
      <header className="py-8 text-center">
        <span className="font-sans font-bold tracking-[-0.04em] uppercase text-xl text-[#1A1814]">
          STAYMAKOM
        </span>
        <p className="text-xs text-[#9E9890] tracking-widest uppercase mt-1">
          {lang === "he" ? "יותר משהייה, זו חוויה" : "More than a stay, it's an experience"}
        </p>
      </header>

      {/* Form */}
      <main className="flex-1 flex items-start justify-center px-4 pb-16 pt-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8" dir={lang === "he" ? "rtl" : "ltr"}>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#1A1814] mb-3">
              {lang === "he" ? "הפכו לשותפים" : "Become a Partner"}
            </h1>
            <p className="text-sm text-[#6B6560] leading-relaxed max-w-sm mx-auto">
              {lang === "he"
                ? "הצטרפו לרשת המובחרת שלנו של מלונות ייחודיים בישראל."
                : "Join our curated network of Israel's most inspiring hotels."}
            </p>
          </div>
          <PartnerFormFlow lang={lang} />
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="py-6 text-center">
        <p className="text-xs text-[#C4BEB5]">
          © {new Date().getFullYear()} STAYMAKOM
        </p>
      </footer>
    </div>
  );
};

export default PartnerForm;
