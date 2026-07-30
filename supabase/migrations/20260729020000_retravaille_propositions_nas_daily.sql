-- Réécriture du contenu des propositions du dossier swipe "NAS DAILY" (token b89b39d676a2ead0172c978893955178) :
-- titres plus évocateurs, descriptions qui racontent l'expérience vécue, et nom_hotel renseigné
-- partout où un hôtel est lié (il ne l'était nulle part avant, alors que hotel_id l'était souvent).
-- Migration de données, pas de changement de structure — voir mémoire "drift" pour le contexte
-- (appliquée directement via l'outil MCP en attendant la réparation de l'historique des migrations).

UPDATE public.propositions SET
  titre = 'Envol au lever du soleil',
  description = 'Vol en montgolfière au lever du soleil, petit-déjeuner et champagne inclus.'
WHERE id = 'd3847eb0-e407-496f-a8d8-52c18da9436d';

UPDATE public.propositions SET
  titre = 'Dégustation whisky & fromages',
  description = 'Six whiskies rencontrent quatre fromages choisis pour s''accorder avec chacun, au cœur d''une distillerie de Tel Aviv-Jaffa.'
WHERE id = '80e37f39-83a0-467a-ba31-387203344623';

UPDATE public.propositions SET
  titre = 'Après la marée',
  description = 'Trois heures en mer à deux : une traversée au coucher du soleil, puis un dîner privé à bord d''un yacht, au départ du port d''Herzliya.'
WHERE id = '0a4ab081-c07b-4cac-af1d-d4b0a912402b';

UPDATE public.propositions SET
  titre = 'Ciné sous les étoiles',
  description = 'Un film culte projeté en plein air sur un toit, pop-corn et boissons compris.',
  ville = 'Tel Aviv-Yafo'
WHERE id = 'eb00b542-f09d-4755-9b29-d2b284886767';

UPDATE public.propositions SET
  titre = 'Vin au bord du cratère',
  description = 'Dégustation de vin privée parmi les vignes du désert, suivie d''un séjour à Beresheet, au bord du cratère de Ramon.',
  ville = 'Mitspe Ramon',
  nom_hotel = 'Beresheet by Isrotel Exclusive'
WHERE id = 'd102b47c-c892-4770-81e7-06a44722e4f3';

UPDATE public.propositions SET
  titre = 'Atelier chocolat à deux',
  description = 'À deux, on tempère le chocolat et on façonne ses propres pralines, dans un petit atelier artisanal à Barkan.',
  ville = 'Barkan'
WHERE id = '85d2c4ea-e213-456e-af4f-8d850088e530';

UPDATE public.propositions SET
  titre = 'Spa en duo, à la lueur des bougies',
  description = 'Un soin spa à deux, à la lumière des bougies, pour une parenthèse intime.'
WHERE id = 'dde99b43-f5bd-4c15-9c03-65e096687744';

UPDATE public.propositions SET
  titre = 'Dîner sous les étoiles',
  description = 'Un dîner privé sous un ciel dégagé, télescope à portée de main, loin de toute lumière de ville.'
WHERE id = 'ac64d264-c752-4d23-89c1-ae2a138f46f7';

UPDATE public.propositions SET
  titre = 'Silence dans les collines de Judée',
  description = 'Une journée où on ne fait rien, exprès. Spa, piscine, silence dans les collines — c''est tout le programme.',
  nom_hotel = 'Gordonia Maale Hahamisha'
WHERE id = 'e4d40a88-2d18-4745-a0f2-de349630c632';

UPDATE public.propositions SET
  titre = 'Apéro & pinceaux au coucher du soleil',
  description = 'Un chevalet planté dans le sable, un verre de vin à la main, et la mer qui vire à l''orange devant vous.'
WHERE id = '73ec5d79-be9f-4ff2-9e87-e139043b5731';

UPDATE public.propositions SET
  titre = 'La mer depuis le lit',
  description = 'La mer, vue depuis le lit. Un verre de vin quand le soleil plonge dans la Méditerranée. Des soirées lentes, tout près des vignes.',
  nom_hotel = 'Gordonia Zikhron Yaakov'
WHERE id = '63d971a5-62da-4ebe-b3f5-a9bc5db05a9f';

UPDATE public.propositions SET
  titre = 'Silence dans le désert de l''Arava',
  description = 'Yoga au lever du soleil, silence toute la journée, rituel du feu à la tombée de la nuit. L''endroit où le temps cesse de compter.',
  nom_hotel = 'Moa Living'
WHERE id = '11834415-8cef-40d5-b5bc-93e55ca5092d';

UPDATE public.propositions SET
  titre = 'La Toscane du Néguev',
  description = 'Un verre de vin à la main, on regarde le ciel du désert se remplir d''étoiles. Calme, chaleureux, un peu magique.'
WHERE id = 'e8998679-49ed-4c9e-a87c-5ead530d4e58';

UPDATE public.propositions SET
  titre = 'Oasis nabatéenne à Sde Boker',
  description = 'Jeep dans les dunes, balade à dos de chameau, photos au coucher du soleil. Puis retour au calme du désert pour la nuit, à deux pas de la maison de Ben Gourion.',
  nom_hotel = 'Kedma by Isrotel Design'
WHERE id = '835347e8-89c6-4dfa-97d5-dc3e7fdbd0a7';

UPDATE public.propositions SET
  titre = 'Au bord du cratère de Ramon',
  description = 'Jeep dans les dunes, balade à dos de chameau, photos au coucher du soleil. Puis une nuit suspendue au bord du cratère de Ramon.',
  nom_hotel = 'Beresheet by Isrotel Exclusive'
WHERE id = 'acd85ed2-3758-4720-98c1-d7161e1a2793';
