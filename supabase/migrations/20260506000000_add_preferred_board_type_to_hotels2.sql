-- Ajoute la colonne preferred_board_type sur hotels2
-- Permet à l'admin de choisir, hôtel par hôtel, quelle pension afficher en priorité
-- au lieu de prendre systématiquement le moins cher.
--
-- Valeurs autorisées (codes HyperGuest standards) :
--   NULL = pas de préférence → afficher le moins cher (comportement par défaut, historique)
--   RO   = Room Only (chambre seule)
--   BB   = Bed & Breakfast (petit-déjeuner inclus)
--   HB   = Half Board (demi-pension)
--   FB   = Full Board (pension complète)
--   AI   = All Inclusive (tout inclus)
--
-- Comportement strict (option B validée par Shana 2026-05-06) :
--   Si preferred_board_type est défini ET qu'aucun tarif de ce type n'est dispo
--   pour les dates choisies, l'hôtel apparaît comme "indisponible aux dates choisies"
--   plutôt que de retomber silencieusement sur le moins cher.

ALTER TABLE public.hotels2
  ADD COLUMN IF NOT EXISTS preferred_board_type TEXT NULL;

ALTER TABLE public.hotels2
  DROP CONSTRAINT IF EXISTS hotels2_preferred_board_type_check;

ALTER TABLE public.hotels2
  ADD CONSTRAINT hotels2_preferred_board_type_check
  CHECK (preferred_board_type IS NULL OR preferred_board_type IN ('RO', 'BB', 'HB', 'FB', 'AI'));

COMMENT ON COLUMN public.hotels2.preferred_board_type IS
  'Pension à afficher en priorité pour cet hôtel. NULL = afficher le moins cher (défaut).
   Valeurs : RO (chambre seule), BB (petit-déj), HB (demi-pension), FB (pension complète), AI (tout inclus).
   Si défini et indisponible pour des dates, l''hôtel apparaît "indisponible aux dates choisies".';
