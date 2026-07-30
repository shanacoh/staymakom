-- "Après la marée" (Golden Horizon) : la sortie a lieu en fin de journée pour la traversée
-- coucher de soleil (donc pas de "petit-déjeuner au lever du soleil", qui ne correspond pas à
-- l'horaire réel) — on garde l'angle "verre de vin au coucher du soleil" demandé par Shana.

UPDATE public.propositions SET
  description = 'Un verre de vin à la main, cap sur le coucher du soleil, à bord d''un yacht au départ du port d''Herzliya.',
  description_en = 'Glass of wine in hand, sailing straight into the sunset, aboard a yacht departing from Herzliya marina.',
  description_he = 'כוס יין ביד, מפליגים ישר אל השקיעה, על סירה שיוצאת ממרינת הרצליה.'
WHERE id = '0a4ab081-c07b-4cac-af1d-d4b0a912402b';
