// L'espace partenaire ouvert par le lien personnel (/partner/link/<jeton>), sans compte.
// Il permet de voir son go live et l'aperçu de son annonce, de confirmer ou proposer une
// modification, de remplir ses infos pratiques, ses règles et ses dates. Signer, voir ses
// réservations et ses revenus demandent la connexion par lien magique (la base le garantit : le lien
// n'ouvre aucune de ces fonctions).

import { lazy, Suspense, useEffect, useMemo } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageLoader } from "@/components/partner/ui";
import { PartnerShell } from "@/components/partner/PartnerShell";
import { GoLiveSection } from "@/components/partner/golive/GoLiveSection";
import { goliveKeys, linkAccess, PartnerAccessContext } from "@/lib/partner/access";
import { usePartner, usePartnerSession } from "@/lib/partner/context";
import { GOLIVE_TEXTS } from "@/lib/partner/i18n-golive";
import type { PartnerSession } from "@/lib/partner/types";

const PartnerListingPage = lazy(() => import("./golive/PartnerListingPage"));
const PartnerRulesPage = lazy(() => import("./golive/PartnerRulesPage"));
const PartnerPracticalPage = lazy(() => import("./golive/PartnerPracticalPage"));
const PartnerAvailabilityPage = lazy(() => import("./golive/PartnerAvailabilityPage"));

/** L'accueil du lien : la page partenaire (bandeau photo, go live, présentation). */
function LinkHome() {
  const session = usePartnerSession();
  return <GoLiveSection session={session} />;
}

/**
 * `onSession` remonte la session du lien au parent (langue, contexte), qui la fournit ensuite aux
 * écrans comme pour un compte.
 */
export default function PartnerLinkApp({ onSession }: { onSession: (session: PartnerSession | null) => void }) {
  const { token = "" } = useParams();
  const access = useMemo(() => linkAccess(token), [token]);
  const { t, lang, session } = usePartner();
  const query = useQuery({
    queryKey: goliveKeys.session(access.scope),
    queryFn: access.session,
    retry: false,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    onSession(query.data ?? null);
  }, [query.data, onSession]);

  if (query.isLoading || (query.data && !session)) return <PageLoader label={t.loading} />;
  if (query.error || !query.data) {
    const g = GOLIVE_TEXTS[lang];
    return (
      <div className="mx-auto max-w-md space-y-3 px-5 py-16 text-center">
        <h1 className="text-base font-bold text-neutral-900">{g.linkInvalidTitle}</h1>
        <p className="text-sm leading-relaxed text-neutral-600">{g.linkInvalidText}</p>
      </div>
    );
  }

  return (
    <PartnerAccessContext.Provider value={access}>
      <PartnerShell linkMode>
        <Suspense fallback={<PageLoader label={t.loading} />}>
          <Routes>
            <Route index element={<LinkHome />} />
            <Route path="listing/:kind/:id" element={<PartnerListingPage />} />
            <Route path="rules/:id" element={<PartnerRulesPage />} />
            <Route path="practical/:id" element={<PartnerPracticalPage />} />
            <Route path="availability/:id" element={<PartnerAvailabilityPage />} />
            <Route path="*" element={<Navigate to={access.base} replace />} />
          </Routes>
        </Suspense>
      </PartnerShell>
    </PartnerAccessContext.Provider>
  );
}
