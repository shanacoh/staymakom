-- Shana ne veut jamais de tiret cadratin (—) dans les textes. Corrige les deux descriptions du
-- dossier NAS DAILY qui en contenaient encore ("Après la marée" et "Silence dans les collines
-- de Judée"), en 3 langues, remplacé par une ponctuation classique.

UPDATE public.propositions SET
  description = 'À vous de choisir : coucher de soleil et verre de vin, ou lever du jour et petit-déjeuner à bord. Une traversée en yacht au départ du port d''Herzliya.',
  description_en = 'Your choice: sunset with a glass of wine, or sunrise with breakfast aboard. A yacht crossing departing from Herzliya marina.',
  description_he = 'לבחירתכם: שקיעה עם כוס יין, או זריחה עם ארוחת בוקר על הסירה. הפלגה שיוצאת ממרינת הרצליה.'
WHERE id = '0a4ab081-c07b-4cac-af1d-d4b0a912402b';

UPDATE public.propositions SET
  description = 'Une journée où on ne fait rien, exprès. Spa, piscine, silence dans les collines : c''est tout le programme.',
  description_en = 'A day where you do nothing on purpose. Spa, pool, silence in the hills: that''s the whole plan.',
  description_he = 'יום שבו לא עושים כלום, בכוונה. ספא, בריכה, שקט בהרים: זו כל התוכנית.'
WHERE id = 'e4d40a88-2d18-4745-a0f2-de349630c632';
