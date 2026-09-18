-- Permet d'uploader une icône personnalisée par catégorie depuis le back office,
-- au lieu de dépendre uniquement des dessins codés en dur dans le site (V3_CATEGORIES).
-- Quand elle est renseignée, le site l'affiche en priorité sur le dessin codé en dur.
ALTER TABLE public.categories
ADD COLUMN icon_image text;
