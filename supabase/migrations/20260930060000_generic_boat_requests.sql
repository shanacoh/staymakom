-- Permet une demande "sans bateau précis" : le visiteur choisit port/personnes/
-- durée/date dans un seul pop-up, sans avoir dû cliquer sur une fiche bateau
-- avant. On assouplit experience_id (nullable) plutôt que d'inventer une
-- deuxième table de demandes, et on ajoute les 2 champs qui remplacent alors
-- l'info normalement déduite de la fiche (port préféré, durée souhaitée).
-- Aucune ligne existante n'est affectée (une contrainte assouplie, deux colonnes nullable).

alter table public.standalone_experience_requests alter column experience_id drop not null;
alter table public.standalone_experience_requests add column if not exists preferred_city text;
alter table public.standalone_experience_requests add column if not exists requested_duration_minutes integer;

comment on column public.standalone_experience_requests.preferred_city is 'Utilisé seulement quand experience_id est NULL (demande générique, pas encore liée à un bateau précis).';
comment on column public.standalone_experience_requests.requested_duration_minutes is 'Durée souhaitée en minutes (60/90/120/180/240). Utilisé pour une demande générique, ou pour mémoriser la durée choisie même quand un bateau précis est sélectionné.';
