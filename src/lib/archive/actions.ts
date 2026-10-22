import { supabase } from "@/integrations/supabase/client";
import { ARCHIVED_STATUS, LISTING_TABLE, UNARCHIVED_STATUS, type ListingKind } from "./status";

/** Archive la fiche (archived = true) ou la remet en brouillon. Ne touche à rien d'autre. */
export async function setListingArchived(kind: ListingKind, id: string, archived: boolean): Promise<void> {
  const status = archived ? ARCHIVED_STATUS : UNARCHIVED_STATUS;
  const { error } = await (supabase as any).from(LISTING_TABLE[kind]).update({ status }).eq("id", id);
  if (error) throw error;
}
