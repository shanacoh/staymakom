-- Corrige un bug : plusieurs pages frontend (Vitrine.tsx, IndexV3.tsx, Category.tsx,
-- LaunchIndex.tsx, LaunchExperiences.tsx, ExperienceCard.tsx, StandaloneExperienceCard.tsx,
-- OtherStandaloneExperiences.tsx, OtherExperiences2.tsx) lisent déjà highlight_tags.label_fr,
-- mais cette colonne n'a jamais été créée en base. Le back-office de création de badges
-- ne proposait que EN + HE, alors que tout le reste du formulaire suit un pattern à 3 langues.
ALTER TABLE public.highlight_tags
ADD COLUMN IF NOT EXISTS label_fr TEXT;

COMMENT ON COLUMN public.highlight_tags.label_fr IS 'French translation of the badge label (optional, like label_he)';
