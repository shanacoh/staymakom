-- Villes, régions et zones affichées sur le site (fiches publiées).
-- À comparer avec src/lib/placeNames.ts : un nom absent de la liste s'affiche en anglais
-- sur les pages en espagnol, russe et allemand. L'ajouter alors à PLACE_NAMES.
select distinct 'ville' as type, city as nom from standalone_experiences where status = 'published' and city is not null
union select 'région (texte libre)', region from standalone_experiences where status = 'published' and region is not null
union select 'ville', city from hotels2 where status = 'published' and city is not null
union select 'région (texte libre)', region from hotels2 where status = 'published' and region is not null
union select 'région (liste)', name from regions where is_active
union select 'zone', name from region_zones
order by 1, 2;
