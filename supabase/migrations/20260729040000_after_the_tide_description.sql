-- Ajuste la description de "Après la marée" (Golden Horizon, dossier NAS DAILY) : Shana ne veut plus
-- mentionner la durée (3 heures), ni l'aspect "dîner" — juste la traversée romantique au coucher du soleil.

UPDATE public.propositions SET
  description = 'En mer, à deux, le temps d''un coucher de soleil — une traversée en yacht au départ du port d''Herzliya.',
  description_en = 'At sea, just the two of you, chasing the sunset — a yacht crossing departing from Herzliya marina.',
  description_he = 'בלב ים, רק שניכם, עם השקיעה — הפלגה זוגית שיוצאת ממרינת הרצליה.'
WHERE id = '0a4ab081-c07b-4cac-af1d-d4b0a912402b';
