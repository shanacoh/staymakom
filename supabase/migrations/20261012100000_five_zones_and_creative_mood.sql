-- Chantier Offre, étape 5 : aligner le référentiel.
-- Uniquement des données : une zone de plus, une région qui change de zone, un mood en brouillon.
-- Aucune table ni colonne n'est créée, modifiée ou supprimée.
-- Pour revenir en arrière : remettre la région `tel-aviv` dans `coast-center`, supprimer la zone
-- `tel-aviv-jaffa`, remettre l'ancien ordre (north 1, coast-center 2, jerusalem 3, south 4) et
-- supprimer le mood `creative`.

-- 1. Cinq zones au lieu de quatre ------------------------------------------------------------------
-- Tel Aviv-Jaffa devient une zone à part. « Autour de Tel Aviv » reste dans Côte & Centre.
insert into public.region_zones (slug, name, name_fr, name_he, display_order)
values ('tel-aviv-jaffa', 'Tel Aviv-Jaffa', 'Tel Aviv-Jaffa', 'תל אביב-יפו', 1)
on conflict (slug) do nothing;

-- Ordre d'affichage : Tel Aviv-Jaffa, Jérusalem, Nord, Côte & Centre, Sud.
update public.region_zones
set display_order = case slug
  when 'tel-aviv-jaffa' then 1
  when 'jerusalem' then 2
  when 'north' then 3
  when 'coast-center' then 4
  when 'south' then 5
  else display_order
end;

update public.regions set zone_slug = 'tel-aviv-jaffa' where slug = 'tel-aviv';

comment on table public.region_zones is
  'Les 5 grandes zones qui regroupent les régions (Tel Aviv-Jaffa, Jérusalem, Nord, Côte & Centre, Sud).';

-- 2. Nouveau mood « Creative Spirit » --------------------------------------------------------------
-- En brouillon : invisible sur le site, mais proposé dans le formulaire du back-office et à l'IA.
-- Noms FR et HE, introduction et image volontairement vides : Shana les remplira.
insert into public.categories (slug, name, status, display_order)
select 'creative', 'Creative Spirit', 'draft', 10
where not exists (select 1 from public.categories where slug = 'creative');
