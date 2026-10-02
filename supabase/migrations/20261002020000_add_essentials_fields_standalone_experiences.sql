-- Sprint 4 : bloc "L'essentiel" sur les fiches expérience standalone.
-- Tous les champs sont optionnels (nullable) : une fiche déjà publiée doit
-- continuer à s'afficher normalement même si rien n'est rempli ici.

ALTER TABLE public.standalone_experiences
  ADD COLUMN IF NOT EXISTS accessibility_info_fr text,
  ADD COLUMN IF NOT EXISTS languages text[],
  ADD COLUMN IF NOT EXISTS schedule_note text,
  ADD COLUMN IF NOT EXISTS schedule_note_fr text,
  ADD COLUMN IF NOT EXISTS schedule_note_he text,
  ADD COLUMN IF NOT EXISTS access_note text,
  ADD COLUMN IF NOT EXISTS access_note_fr text,
  ADD COLUMN IF NOT EXISTS access_note_he text,
  ADD COLUMN IF NOT EXISTS hide_exact_address boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS session_labels jsonb,
  ADD COLUMN IF NOT EXISTS essentials_private_on_request boolean DEFAULT false;
