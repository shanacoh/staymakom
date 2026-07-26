-- Les "expériences seules" (sans hôtel, table public.standalone_experiences) sont un type de
-- fiche distinct des expériences liées à un hôtel (public.experiences2) : elles ont besoin de leur
-- propre colonne de liaison, une FK ne pouvant pas pointer vers "l'une ou l'autre" de deux tables.

ALTER TABLE public.propositions
  ADD COLUMN standalone_experience_id UUID REFERENCES public.standalone_experiences(id) ON DELETE SET NULL;

CREATE INDEX idx_propositions_standalone_experience_id ON public.propositions(standalone_experience_id);

-- Remplace la contrainte "au plus un des deux" par "au plus un des trois".
ALTER TABLE public.propositions DROP CONSTRAINT proposition_source_unique;
ALTER TABLE public.propositions ADD CONSTRAINT proposition_source_unique CHECK (
  (
    (CASE WHEN hotel_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN experience_id IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN standalone_experience_id IS NOT NULL THEN 1 ELSE 0 END)
  ) <= 1
);
