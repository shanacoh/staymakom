-- Correction de catégorie : Shana préfère "Nature & Outdoor" à "Sporty Break" pour la fiche yacht groupe

UPDATE public.standalone_experiences
SET category_id = '40ba7f5d-f9ea-4449-bbcb-96ff556985ed',
    category_ids = '["40ba7f5d-f9ea-4449-bbcb-96ff556985ed"]'::jsonb
WHERE slug = 'yacht-day-herzliya-marina';
