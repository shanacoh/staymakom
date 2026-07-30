-- "Après la marée" : Shana confirme que la sortie existe en deux formules (coucher de soleil +
-- vin, OU lever du jour + petit-déjeuner) — la description doit présenter clairement ce choix,
-- plutôt qu'une seule des deux options.

UPDATE public.propositions SET
  description = 'À vous de choisir : coucher de soleil et verre de vin, ou lever du jour et petit-déjeuner à bord — une traversée en yacht au départ du port d''Herzliya.',
  description_en = 'Your choice: sunset with a glass of wine, or sunrise with breakfast aboard — a yacht crossing departing from Herzliya marina.',
  description_he = 'לבחירתכם: שקיעה עם כוס יין, או זריחה עם ארוחת בוקר על הסירה — הפלגה שיוצאת ממרינת הרצליה.'
WHERE id = '0a4ab081-c07b-4cac-af1d-d4b0a912402b';
