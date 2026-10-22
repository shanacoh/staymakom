/**
 * Où envoyer un visiteur qui arrive par un lien direct sur une fiche archivée :
 * la page du mood de la fiche, sinon sa région (accueil filtré), sinon l'accueil.
 */
import { supabase } from "@/integrations/supabase/client";
import type { ListingKind } from "./status";

export interface ArchivedRedirectTarget {
  category_slug: string | null;
  region_slug: string | null;
}

const BOATS_CATEGORY_SLUG = "bateaux";

export function archivedRedirectPath(kind: ListingKind, target: ArchivedRedirectTarget): string {
  if (target.category_slug === BOATS_CATEGORY_SLUG) return "/boat";
  if (target.category_slug) return `/category/${target.category_slug}`;
  if (target.region_slug) {
    // Les hôtels sont présentés dans l'onglet « séjour » de l'accueil.
    const mode = kind === "standalone" ? "" : "&mode=stay";
    return `/?region=${encodeURIComponent(target.region_slug)}${mode}`;
  }
  return "/";
}

/** Chemin de redirection si la fiche est archivée, null sinon (fiche inexistante ou brouillon). */
export async function fetchArchivedRedirect(kind: ListingKind, slug: string): Promise<string | null> {
  const { data, error } = await (supabase as any).rpc("archived_listing_redirect", { p_kind: kind, p_slug: slug });
  if (error || !data) return null;
  return archivedRedirectPath(kind, data as ArchivedRedirectTarget);
}
