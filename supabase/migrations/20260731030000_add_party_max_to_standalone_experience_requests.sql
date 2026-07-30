-- Permet de stocker une fourchette de personnes ("2-3", "4-5"...) plutôt
-- qu'un nombre exact, pour les demandes où le client choisit une fourchette
-- proposée (ex: pop-up bateaux) plutôt qu'un compteur précis. `adults` reste
-- le bas de la fourchette ; `party_max` (nullable) en est le haut. NULL =
-- nombre exact classique (comportement inchangé pour les autres demandes).
ALTER TABLE public.standalone_experience_requests
  ADD COLUMN IF NOT EXISTS party_max INTEGER;
