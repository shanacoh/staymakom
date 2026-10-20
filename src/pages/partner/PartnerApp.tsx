// Point d'entrée de l'espace partenaire (/partner). Il décide quel écran montrer :
//  - pas connecté → la page de connexion par lien ;
//  - connecté mais pas partenaire → un message, sans aucune donnée ;
//  - conditions pas encore acceptées (ou nouvelle version) → uniquement l'écran des conditions ;
//  - sinon → l'espace et ses onglets.
// C'est un confort d'affichage : la vraie barrière est dans la base, qui refuse de répondre à
// quiconque n'est pas le bon partenaire ou n'a pas accepté les conditions.

import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useBackofficeTheme } from "@/hooks/useBackofficeTheme";
import { PageLoader, QuietButton } from "@/components/partner/ui";
import { PartnerShell } from "@/components/partner/PartnerShell";
import { fetchPartnerSession, partnerErrorCode, partnerKeys, updatePartnerProfile } from "@/lib/partner/api";
import { PARTNER_LANG_STORAGE_KEY, PartnerContext } from "@/lib/partner/context";
import { PARTNER_TEXTS } from "@/lib/partner/i18n";
import { initialPartnerLang, normalizePartnerLang } from "@/lib/partner/logic";
import type { PartnerLang, PartnerSession } from "@/lib/partner/types";
import PartnerLogin from "./PartnerLogin";
import PartnerOnboarding from "./PartnerOnboarding";

const PartnerHome = lazy(() => import("./PartnerHome"));
const PartnerExperiences = lazy(() => import("./PartnerExperiences"));
const PartnerExperienceDetail = lazy(() => import("./PartnerExperienceDetail"));
const PartnerNewExperience = lazy(() => import("./PartnerNewExperience"));
const PartnerBookings = lazy(() => import("./PartnerBookings"));
const PartnerRevenue = lazy(() => import("./PartnerRevenue"));
const PartnerReviews = lazy(() => import("./PartnerReviews"));
const PartnerProfile = lazy(() => import("./PartnerProfile"));

function storedLang(): PartnerLang | null {
  try {
    return normalizePartnerLang(localStorage.getItem(PARTNER_LANG_STORAGE_KEY));
  } catch {
    return null;
  }
}

export default function PartnerApp() {
  useBackofficeTheme();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user, loading, signOut } = useAuth();
  const onLoginPage = location.pathname === "/partner/login";

  const sessionQuery = useQuery({
    queryKey: partnerKeys.session(user?.id),
    queryFn: fetchPartnerSession,
    enabled: !!user,
    retry: false,
    staleTime: 60 * 1000,
  });
  const session = sessionQuery.data ?? null;

  // La langue : le choix fait sur cet appareil, sinon celle du prestataire, sinon celle du navigateur.
  // (Le paramètre ?lang= de l'adresse appartient au site public : on ne s'en sert pas ici.)
  const [chosenLang, setChosenLang] = useState<PartnerLang | null>(storedLang);
  const lang = chosenLang ?? initialPartnerLang(session?.provider.language, navigator.language);

  const setSession = useCallback(
    (next: PartnerSession) => queryClient.setQueryData(partnerKeys.session(user?.id), next),
    [queryClient, user?.id],
  );

  const setLang = useCallback(
    (next: PartnerLang) => {
      setChosenLang(next);
      try {
        localStorage.setItem(PARTNER_LANG_STORAGE_KEY, next);
      } catch {
        // Stockage indisponible (navigation privée) : la langue vaut pour cette visite.
      }
      // Sa langue est aussi celle de ses emails : on l'enregistre sur sa fiche.
      if (session && session.provider.language !== next) {
        updatePartnerProfile({ language: next }).then(setSession).catch(() => {});
      }
    },
    [session, setSession],
  );

  // Cet espace n'a pas à être trouvé par les moteurs de recherche.
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "STAYMAKOM · Partner space";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      document.title = previousTitle;
      meta.remove();
    };
  }, []);

  const context = useMemo(
    () => ({ lang, t: PARTNER_TEXTS[lang], setLang, session, setSession }),
    [lang, setLang, session, setSession],
  );
  const t = context.t;

  let content: JSX.Element;
  if (loading || (user && sessionQuery.isLoading)) {
    content = <PageLoader label={t.loading} />;
  } else if (!user) {
    content = onLoginPage ? <PartnerLogin /> : <Navigate to={`/partner/login${location.search}`} replace />;
  } else if (!session) {
    const notPartner = partnerErrorCode(sessionQuery.error).includes("not_partner");
    content = (
      <div className="mx-auto max-w-md space-y-4 px-5 py-16 text-center">
        <h1 className="text-base font-bold text-neutral-900">{notPartner ? t.notPartnerTitle : t.errorGeneric}</h1>
        {notPartner && <p className="text-sm leading-relaxed text-neutral-600">{t.notPartnerText}</p>}
        <QuietButton onClick={() => signOut()}>{t.logout}</QuietButton>
      </div>
    );
  } else if (onLoginPage) {
    content = <Navigate to="/partner" replace />;
  } else if (session.terms.must_accept) {
    content = <PartnerOnboarding />;
  } else {
    content = (
      <PartnerShell>
        <Suspense fallback={<PageLoader label={t.loading} />}>
          <Routes>
            <Route index element={<PartnerHome />} />
            <Route path="experiences" element={<PartnerExperiences />} />
            <Route path="experiences/:experienceId" element={<PartnerExperienceDetail />} />
            <Route path="new" element={<PartnerNewExperience />} />
            <Route path="bookings" element={<PartnerBookings />} />
            <Route path="revenue" element={<PartnerRevenue />} />
            <Route path="reviews" element={<PartnerReviews />} />
            <Route path="profile" element={<PartnerProfile />} />
            <Route path="*" element={<Navigate to="/partner" replace />} />
          </Routes>
        </Suspense>
      </PartnerShell>
    );
  }

  return (
    <PartnerContext.Provider value={context}>
      {/* Hébreu : tout l'espace se lit de droite à gauche. */}
      <div className="min-h-screen bg-[#FAF9F6] font-sans text-neutral-900" dir={lang === "he" ? "rtl" : "ltr"} lang={lang}>
        {content}
      </div>
    </PartnerContext.Provider>
  );
}
