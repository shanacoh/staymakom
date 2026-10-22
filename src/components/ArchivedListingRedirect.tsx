import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { useLocalizedNavigation } from "@/hooks/useLocalizedNavigation";
import { fetchArchivedRedirect } from "@/lib/archive/redirect";
import type { ListingKind } from "@/lib/archive/status";

interface ArchivedListingRedirectProps {
  kind: ListingKind;
  slug: string | undefined;
  /** Page « fiche introuvable », affichée si la fiche n'est pas une fiche archivée. */
  children: React.ReactNode;
}

/**
 * À placer là où une page de fiche affiche « introuvable » : si la fiche a été archivée,
 * le visiteur est renvoyé vers son mood ou sa région au lieu de tomber sur une page vide.
 */
export function ArchivedListingRedirect({ kind, slug, children }: ArchivedListingRedirectProps) {
  const { getLocalizedPath } = useLocalizedNavigation();
  const { data: path, isLoading } = useQuery({
    queryKey: ["archived-listing-redirect", kind, slug],
    queryFn: () => fetchArchivedRedirect(kind, slug!),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) return null;
  if (path) return <Navigate to={getLocalizedPath(path)} replace />;
  return <>{children}</>;
}
