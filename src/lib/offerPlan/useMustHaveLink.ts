import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { OFFER_PLAN_QUERY_KEY, fetchMustHaves, linkExperienceToMustHave } from "./queries";
import type { ExperienceKind, MustHave } from "./types";

const MUST_HAVES_QUERY_KEY = ["admin-offer-must-haves"] as const;

export interface MustHaveLink {
  mustHaves: MustHave[];
  /** Le must-have couvert par l'expérience, ou null = opportunité hors plan. */
  value: string | null;
  setValue: (mustHaveId: string | null) => void;
  /** À appeler une fois la fiche enregistrée. Répond true si le lien a été modifié. */
  save: (experienceId: string) => Promise<boolean>;
}

/**
 * Le champ « Must-have couvert » d'un formulaire d'expérience : il retient le choix tant que la
 * fiche n'est pas enregistrée, puis pose le lien. Tant que rien n'est choisi, rien n'est écrit.
 */
export function useMustHaveLink(kind: ExperienceKind, experienceId: string | null | undefined): MustHaveLink {
  const queryClient = useQueryClient();
  const { data: mustHaves = [] } = useQuery({ queryKey: MUST_HAVES_QUERY_KEY, queryFn: fetchMustHaves, retry: false });

  const savedId = useMemo(() => {
    if (!experienceId) return null;
    const field = kind === "standalone" ? "standalone_experience_id" : "experience2_id";
    return mustHaves.find((m) => m[field] === experienceId)?.id ?? null;
  }, [mustHaves, kind, experienceId]);

  // undefined = le champ n'a pas été touché : on montre ce qui est enregistré.
  const [choice, setChoice] = useState<string | null | undefined>(undefined);

  const save = useCallback(
    async (targetId: string) => {
      if (choice === undefined || choice === savedId) return false;
      await linkExperienceToMustHave(kind, targetId, choice);
      queryClient.invalidateQueries({ queryKey: MUST_HAVES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: OFFER_PLAN_QUERY_KEY });
      return true;
    },
    [choice, savedId, kind, queryClient]
  );

  return { mustHaves, value: choice === undefined ? savedId : choice, setValue: setChoice, save };
}
