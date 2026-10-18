// Gabarit de l'espace partenaire : en-tête (marque, langue, déconnexion) et onglets.
// Sur téléphone, les onglets défilent horizontalement sous l'en-tête, qui reste collé en haut.

import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { usePartner, usePartnerSession } from "@/lib/partner/context";
import { PARTNER_LANGS } from "@/lib/partner/logic";
import type { PartnerLang } from "@/lib/partner/types";

export function LanguageSwitch() {
  const { lang, setLang, t } = usePartner();
  return (
    <select
      aria-label={t.language}
      value={lang}
      onChange={(e) => setLang(e.target.value as PartnerLang)}
      className="h-9 rounded-full border border-neutral-300 bg-white px-3 text-[13px] font-medium text-neutral-900 focus:border-neutral-900 focus:outline-none"
    >
      {PARTNER_LANGS.map((code) => (
        <option key={code} value={code}>
          {t.langNames[code]}
        </option>
      ))}
    </select>
  );
}

export function PartnerBrand() {
  const { t } = usePartner();
  return (
    <div className="leading-tight">
      <div className="text-[15px] font-extrabold tracking-tight text-neutral-900">STAYMAKOM</div>
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">{t.brandSub}</div>
    </div>
  );
}

export function PartnerShell({ children }: { children: ReactNode }) {
  const { t } = usePartner();
  const session = usePartnerSession();
  const { signOut } = useAuth();

  const tabs = [
    { to: "/partner", label: t.tabHome, end: true },
    { to: "/partner/experiences", label: t.tabExperiences },
    { to: "/partner/bookings", label: t.tabBookings },
    { to: "/partner/revenue", label: t.tabRevenue },
    { to: "/partner/reviews", label: t.tabReviews },
    { to: "/partner/profile", label: t.tabProfile },
    // En dernier : proposer une nouvelle expérience est occasionnel, le quotidien passe avant.
    { to: "/partner/new", label: t.tabNew },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <PartnerBrand />
            <span className="hidden truncate border-s border-neutral-200 ps-3 text-[13px] text-neutral-600 sm:block">
              {session.provider.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitch />
            <button
              type="button"
              onClick={() => signOut()}
              aria-label={t.logout}
              title={t.logout}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
            >
              <LogOut className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
            </button>
          </div>
        </div>
        <nav className="mx-auto max-w-3xl overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex min-w-max gap-1 px-2">
            {tabs.map((tab) => (
              <li key={tab.to}>
                <NavLink
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    cn(
                      "block whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-semibold transition-colors",
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
      </header>
      <main className="mx-auto max-w-3xl space-y-4 px-4 pb-16 pt-5">{children}</main>
    </>
  );
}
