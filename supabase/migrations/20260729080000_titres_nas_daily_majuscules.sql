-- Remet les titres (FR + EN) des 15 propositions du dossier NAS DAILY tout en majuscules, à la
-- demande de Shana. L'hébreu n'a pas de casse (majuscule/minuscule n'existe pas dans cet alphabet),
-- donc titre_he n'est pas concerné.

UPDATE public.propositions
SET titre = upper(titre), titre_en = upper(titre_en)
WHERE id IN (
  'd3847eb0-e407-496f-a8d8-52c18da9436d',
  '80e37f39-83a0-467a-ba31-387203344623',
  '0a4ab081-c07b-4cac-af1d-d4b0a912402b',
  'eb00b542-f09d-4755-9b29-d2b284886767',
  'd102b47c-c892-4770-81e7-06a44722e4f3',
  '85d2c4ea-e213-456e-af4f-8d850088e530',
  'dde99b43-f5bd-4c15-9c03-65e096687744',
  'ac64d264-c752-4d23-89c1-ae2a138f46f7',
  'e4d40a88-2d18-4745-a0f2-de349630c632',
  '73ec5d79-be9f-4ff2-9e87-e139043b5731',
  '63d971a5-62da-4ebe-b3f5-a9bc5db05a9f',
  '11834415-8cef-40d5-b5bc-93e55ca5092d',
  'e8998679-49ed-4c9e-a87c-5ead530d4e58',
  '835347e8-89c6-4dfa-97d5-dc3e7fdbd0a7',
  'acd85ed2-3758-4720-98c1-d7161e1a2793'
);
