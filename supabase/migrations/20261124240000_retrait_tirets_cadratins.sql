-- 24/11/2026 (demandé par Shana) : appliquée le 24/11/2026.
-- Retire tous les tirets cadratins (—) des textes du site. Sauvegarde : backup_20261124.emdash_*.
-- Titres : « — » devient « | » ; dates et listes : deux-points ; ailleurs : virgule.
update hotels2 set seo_title_en = replace(seo_title_en, ' — ', ' | '), seo_title_he = replace(seo_title_he, ' — ', ' | ') where concat(seo_title_en, seo_title_he) like '%—%';
update experiences2 set seo_title_en = replace(seo_title_en, ' — ', ' | '), seo_title_fr = replace(seo_title_fr, ' — ', ' | '), seo_title_he = replace(seo_title_he, ' — ', ' | ') where concat(seo_title_en, seo_title_fr, seo_title_he) like '%—%';
update catalogue_items set name = replace(name, ' — ', ', ') where name like '%—%';
update experiences2 set long_copy = replace(long_copy, ' — ', ': '), long_copy_he = replace(long_copy_he, ' — ', ': ') where slug = 'candlelight-concert-coldplay-imagine-dragons-tel-aviv';
update hotels2 set story = replace(story, 'varying sizes — ', 'varying sizes: ') where slug = 'timna-park-camping';
update hotels2 set story = replace(replace(story, ' — ', ', '), '—', ', '), story_he = replace(replace(story_he, ' — ', ', '), '—', ', '), meta_description_en = replace(meta_description_en, ' — ', ', ') where concat(story, story_he, meta_description_en) like '%—%';
update experiences2 set long_copy = replace(replace(long_copy, ' — ', ', '), '—', ', ') where long_copy like '%—%';
update standalone_experiences set long_copy = replace(long_copy, ' — ', ', ') where long_copy like '%—%';
update categories set launch_description_fr = replace(launch_description_fr, ' — ', ', ') where launch_description_fr like '%—%';
update standalone_extras set description = replace(description, ' — ', ', ') where description like '%—%';
update experiences set long_copy = replace(replace(long_copy, ' — ', ', '), '—', ', ') where long_copy like '%—%';
