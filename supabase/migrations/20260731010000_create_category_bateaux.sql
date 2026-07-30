-- Catégorie interne "Bateaux" : sert uniquement à regrouper les fiches
-- standalone_experiences du module Bateaux (page dédiée /boat).
-- status = 'draft' volontairement : cette catégorie ne doit apparaître
-- dans aucun menu/chip du site, la page /boat n'est accessible que par lien direct.

INSERT INTO public.categories (slug, name, name_fr, name_he, status)
VALUES ('bateaux', 'Boats', 'Bateaux', 'סירות', 'draft')
ON CONFLICT (slug) DO NOTHING;
