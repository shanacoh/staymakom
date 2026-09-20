import { useMutation } from "@tanstack/react-query";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { LookupResponse } from "./lookup";

async function functionErrorMessage(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (typeof body?.error === "string") return body.error;
    } catch {
      // Réponse illisible : on retombe sur le message générique ci-dessous
    }
    return "La recherche a échoué, réessaie dans un instant.";
  }
  return "Impossible de joindre le serveur de recherche. Vérifie ta connexion et réessaie.";
}

/** Lance la recherche côté serveur (fonction `catalogue-lookup`, réservée aux administrateurs). */
export function useCatalogueLookup() {
  return useMutation({
    mutationFn: async ({ query, knownRegions }: { query: string; knownRegions: string[] }): Promise<LookupResponse> => {
      const { data, error } = await supabase.functions.invoke("catalogue-lookup", {
        body: { query, known_regions: knownRegions },
      });
      if (error) throw new Error(await functionErrorMessage(error));
      if (!data || data.error) throw new Error(data?.error ?? "La recherche a échoué, réessaie dans un instant.");
      return data as LookupResponse;
    },
  });
}
