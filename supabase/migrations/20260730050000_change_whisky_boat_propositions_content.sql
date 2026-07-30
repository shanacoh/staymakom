-- Shana remplace le contenu de deux propositions du dossier "NAS DAILY" (swipe) : nouveaux
-- titres/descriptions FR + EN plus évocateurs, traduction hébreu ajoutée pour rester cohérent
-- avec le reste du dossier (déjà trilingue), et tags renseignés (vides jusqu'ici).
-- Titres en majuscules pour respecter la règle du dossier (migration 20260729080000).

UPDATE public.propositions SET
  titre = 'WHISKY, ENTRE CONNAISSEURS',
  titre_en = 'WHISKY, FOR CONNOISSEURS',
  titre_he = 'ויסקי, ליודעי דבר',
  description = 'Un connaisseur, plusieurs verres, une conversation qui part loin. La dégustation qu''on garde pour les curieux.',
  description_en = 'A connoisseur, several glasses, a conversation that goes far. The tasting kept for the curious ones.',
  description_he = 'מומחה אחד, כמה כוסות, שיחה שנודדת למקומות רחוקים. הטעימה ששומרים לסקרנים.',
  tags = ARRAY['whisky', 'dégustation', 'expert']
WHERE id = '80e37f39-83a0-467a-ba31-387203344623';

UPDATE public.propositions SET
  titre = 'PERDUS EN MER',
  titre_en = 'LOST AT SEA',
  titre_he = 'אבודים בים',
  description = 'Un bateau rien qu''à vous, la mer ouverte, plus aucun repère. Un verre de vin au coucher du soleil, ou un petit-déjeuner au lever du jour.',
  description_en = 'A boat all to yourselves, open sea, no land in sight. A glass of wine at sunset, or breakfast at sunrise.',
  description_he = 'סירה כולה לעצמכם, ים פתוח, בלי שום נקודת ציון. כוס יין בשקיעה, או ארוחת בוקר עם הזריחה.',
  tags = ARRAY['bateau', 'coucher de soleil', 'mer']
WHERE id = '0a4ab081-c07b-4cac-af1d-d4b0a912402b';
