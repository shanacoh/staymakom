-- Titres SEO / partage qui répètent la ville (« Titre, Ville | Ville ») : le format voulu est
-- « Titre | Ville » (décision de Shana du 19/11/2026). Doit renvoyer 0 ligne.
select 'standalone_experiences' as fiche, id, seo_title_en as titre from standalone_experiences where seo_title_en ~ ', ([^,|]+) \| \1$'
union all select 'experiences2', id, seo_title_en from experiences2 where seo_title_en ~ ', ([^,|]+) \| \1$'
union all select 'traduction ' || locale, entity_id, text from content_translations
  where field in ('seo_title_en', 'og_title_en') and text ~ ', ([^,|]+) \| \1$';
