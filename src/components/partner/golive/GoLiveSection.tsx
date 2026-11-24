// La page partenaire tant que l'annonce n'est pas en ligne, comme une page du site : bandeau photo
// (photo de sa fiche, même en brouillon), contact de l'équipe, frise du go live, sa page, puis la
// présentation STAYMAKOM adaptée à son type. Partagée par le lien et le compte.

import { useQuery } from "@tanstack/react-query";
import { GoLiveCard } from "@/components/partner/golive/GoLiveCard";
import { PartnerHero } from "@/components/partner/golive/PartnerHero";
import { PitchBlocks } from "@/components/partner/golive/PitchBlocks";
import { TeamContactBand } from "@/components/partner/golive/TeamContactBand";
import { YourPageCard } from "@/components/partner/golive/YourPageCard";
import { Empty, PageLoader } from "@/components/partner/ui";
import { goliveKeys, usePartnerAccess } from "@/lib/partner/access";
import { usePartner } from "@/lib/partner/context";
import { heroPhaseOf, listingCoverPhoto, normalizeGoLive } from "@/lib/partner/golive";
import type { PartnerSession } from "@/lib/partner/types";

export function useGoLive() {
  const access = usePartnerAccess();
  return useQuery({ queryKey: goliveKeys.golive(access.scope), queryFn: access.golive, retry: false, select: normalizeGoLive });
}

export function GoLiveSection({ session, showPitch = true }: { session: PartnerSession; showPitch?: boolean }) {
  const { t: base } = usePartner();
  const access = usePartnerAccess();
  const golive = useGoLive();
  const target = golive.data?.target ?? null;
  // La photo de sa fiche (même en brouillon), lue avec l'aperçu de l'annonce (même cache).
  const listing = useQuery({
    queryKey: target ? goliveKeys.listing(access.scope, target.kind, target.id) : ["partner", access.scope, "listing", "none"],
    queryFn: () => access.listing(target!.kind, target!.id),
    enabled: !!target,
    retry: false,
  });

  if (golive.isLoading) return <PageLoader label={base.loading} />;
  if (!golive.data) return <Empty>{base.errorGeneric}</Empty>;
  const data = golive.data;
  const photo = listingCoverPhoto(listing.data?.content);
  const current = data.steps.find((step) => step.key === data.current_step);
  const signed = !session.terms.must_accept;
  const accountNeeded = signed || (data.my_turn && (current?.key === "terms" || current?.key === "contract"));

  return (
    <div className="space-y-7">
      <PartnerHero name={session.provider.name} photo={photo} kind={data.kind} phase={heroPhaseOf(data)} />
      <TeamContactBand providerName={session.provider.name} />
      <GoLiveCard golive={data} loginEmail={session.provider.email} />
      <YourPageCard golive={data} photo={photo} />
      {showPitch && <PitchBlocks providerName={session.provider.name} golive={data} loginEmail={session.provider.email} accountNeeded={accountNeeded} />}
    </div>
  );
}
