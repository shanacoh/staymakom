// Gabarit de l'espace partenaire : l'en-tête du site (logo STAYMAKOM), « Espace partenaire »,
// le choix de la langue, puis les onglets. Sur téléphone, les onglets défilent horizontalement sous
// l'en-tête, qui reste collé en haut. Avant signature des conditions, réservations, revenus, avis et
// profil ne sont pas proposés (la base les refuse de toute façon). Ouvert par le lien partenaire :
// ni onglets ni déconnexion.

import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { BrandWordmark } from "@/components/BrandWordmark";
import { cn } from "@/lib/utils";
import { usePartner, usePartnerSession } from "@/lib/partner/context";
import { PARTNER_LANGS } from "@/lib/partner/logic";

const SHORT_LANG = { en: "EN", fr: "FR", he: "עב" } as const;

/** Les langues de l'espace en pastilles (EN · FR · עב), la langue active en noir. */
export function LanguageSwitch() {
  const { lang, setLang, t } = usePartner();
  return (
    <div role="group" aria-label={t.language} className="flex overflow-hidden rounded-full border border-[#E8E0D4] bg-white text-[12px]" dir="ltr">
      {(["en", "fr", "he"] as const).filter((code) => PARTNER_LANGS.includes(code)).map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={lang === code}
          title={t.langNames[code]}
          onClick={() => setLang(code)}
          className={cn(
            "min-h-[32px] px-3 font-medium transition-colors",
            lang === code ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100",
          )}
        >
          {SHORT_LANG[code]}
        </button>
      ))}
    </div>
  );
}

export function PartnerBrand() {
  const { t } = usePartner();
  return (
    <div className="flex min-w-0 items-baseline gap-2.5">
      <BrandWordmark compactOnMobile={false} />
      <span className="truncate text-[12px] text-neutral-500">{t.brandSub}</span>
    </div>
  );
}

export function PartnerShell({ children, linkMode = false }: { children: ReactNode; linkMode?: boolean }) {
  const { t } = usePartner();
  const session = usePartnerSession();
  const { signOut } = useAuth();
  const signed = !session.terms.must_accept;

  const allTabs = [
    { to: "/partner", label: t.tabHome, end: true },
    { to: "/partner/experiences", label: t.tabExperiences },
    { to: "/partner/bookings", label: t.tabBookings },
    { to: "/partner/revenue", label: t.tabRevenue },
    { to: "/partner/reviews", label: t.tabReviews },
    { to: "/partner/profile", label: t.tabProfile },
    // En dernier : proposer une nouvelle expérience est occasionnel, le quotidien passe avant.
    { to: "/partner/new", label: t.tabNew },
  ];
  const preSignTabs = new Set(["/partner", "/partner/experiences"]);
  const tabs = linkMode ? [] : signed ? allTabs : allTabs.filter((tab) => preSignTabs.has(tab.to));

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#E8E0D4] bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <PartnerBrand />
          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitch />
            {!linkMode && (
              <button
                type="button"
                onClick={() => signOut()}
                aria-label={t.logout}
                title={t.logout}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8E0D4] text-neutral-700 hover:bg-neutral-100"
              >
                <LogOut className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
              </button>
            )}
          </div>
        </div>
        {tabs.length > 0 && (
          <nav className="mx-auto max-w-3xl overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ul className="flex min-w-max gap-1 px-2">
              {tabs.map((tab) => (
                <li key={tab.to}>
                  <NavLink
                    to={tab.to}
                    end={tab.end}
                    className={({ isActive }) =>
                      cn(
                        "block whitespace-nowrap border-b-2 px-2.5 py-2 text-[12px] font-medium transition-colors",
                        isActive ? "border-neutral-900 text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-900",
                      )
                    }
                  >
                    {tab.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-3xl space-y-3.5 px-4 pb-16 pt-4">{children}</main>
    </>
  );
}
