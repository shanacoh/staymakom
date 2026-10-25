-- Expériences seules : plus de date de fin de disponibilité par défaut.
-- Les dates existantes avaient été posées automatiquement à « aujourd'hui + 6 mois »
-- (migration 20260625000000) : on les retire pour que le calendrier reste ouvert sans limite.
-- Les bateaux (catégorie saisonnière) gardent leur date de fin.
-- Sauvegarde préalable : backup_20261025.standalone_experiences_end_dates.

create schema if not exists backup_20261025;

create table if not exists backup_20261025.standalone_experiences_end_dates as
select id, category_id, availability_mode, availability_end_date
from public.standalone_experiences
where availability_end_date is not null;

revoke all on schema backup_20261025 from anon, authenticated;
revoke all on all tables in schema backup_20261025 from anon, authenticated;

update public.standalone_experiences
set availability_end_date = null
where availability_end_date is not null
  and category_id is distinct from (select id from public.categories where slug = 'bateaux');
