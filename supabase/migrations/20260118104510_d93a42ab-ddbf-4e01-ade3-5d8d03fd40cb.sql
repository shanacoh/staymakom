-- Supprimer l'ancienne contrainte
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_source_check;

-- Ajouter la nouvelle contrainte avec les sources manquantes
ALTER TABLE public.leads ADD CONSTRAINT leads_source_check 
CHECK (source = ANY (ARRAY[
  'newsletter'::text, 
  'contact'::text, 
  'partners'::text, 
  'corporate'::text, 
  'win_trip'::text, 
  'landing_page'::text,
  'coming_soon'::text,
  'ai_assistant_save'::text
]));