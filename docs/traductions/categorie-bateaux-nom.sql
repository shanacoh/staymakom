-- Nom de la catégorie Bateaux (« On the Water ») en espagnol, russe et allemand, saisi à la main.
-- Le champ « name » des catégories est marqué « manual » dans catalog.ts : la traduction
-- automatique ne le touche jamais (les noms des moods restent en anglais partout).
-- Français et hébreu : colonnes name_fr (« Prendre le Large ») et name_he (« יוצאים לים »).
-- Rejouable sans risque. Si le nom anglais change, ces lignes ne s'affichent plus (empreinte
-- différente) : les réécrire avec ce fichier.
insert into public.content_translations (entity_type, entity_id, field, locale, text, source_hash, status, stale)
select 'category', c.id, 'name', v.locale, v.text,
       encode(sha256(convert_to(c.name, 'UTF8')), 'hex'), 'reviewed', false
from public.categories c
cross join (values ('es', 'Mar adentro'), ('ru', 'В открытое море'), ('de', 'Ab aufs Wasser')) as v(locale, text)
where c.slug = 'bateaux'
on conflict (entity_type, entity_id, field, locale)
do update set text = excluded.text, source_hash = excluded.source_hash, status = 'reviewed', stale = false, updated_at = now();
