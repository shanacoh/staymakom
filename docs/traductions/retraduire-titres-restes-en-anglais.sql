-- Retraduction des textes ES / RU / DE restés identiques à l'anglais par erreur (17/11/2026).
--
-- À lancer APRÈS le redéploiement de translate-content (nouvelle consigne : un titre en
-- majuscules n'est pas un nom propre). Commande : supabase db query --linked -f ce_fichier
--
-- Repérage : une traduction dont l'empreinte du texte est égale à l'empreinte de l'anglais
-- est mot pour mot identique à l'anglais. Sur les 318 cas trouvés le 17/11, seuls ceux-ci
-- sont de vrais oublis (35 textes, 17 fiches) : titres, titres de partage et titres Google
-- des expériences, et la ligne « Paddleboard (x2) ». Les autres sont légitimes : noms d'hôtels,
-- noms des moods, villes et régions au nom identique (Eilat, Jerusalem en allemand...),
-- étiquettes de test.
--
-- Méthode : copie de sauvegarde, suppression de ces traductions, puis relance de la
-- traduction des 17 fiches concernées (mode « changed » : seuls les textes manquants sont
-- traduits, les autres traductions de ces fiches ne bougent pas).

begin;

create schema if not exists backup_20261117;

create table backup_20261117.content_translations_identiques as
select ct.*
from public.content_translations ct
where encode(sha256(convert_to(ct.text, 'UTF8')), 'hex') = ct.source_hash
  and ct.status = 'auto'
  and (
    (ct.entity_type in ('experience2', 'standalone_experience') and ct.field in ('title', 'og_title_en', 'seo_title_en'))
    or (ct.entity_type = 'standalone_experience_include' and ct.text like 'Paddleboard%')
  );

delete from public.content_translations ct
using backup_20261117.content_translations_identiques b
where ct.id = b.id;

-- Relance de la traduction, fiche par fiche, avec le secret interne (il ne sort pas de la base).
select net.http_post(
  url := 'https://uqeipzfdhyjkjzvqbkeu.supabase.co/functions/v1/translate-content',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'internal_cron_secret')
  ),
  body := jsonb_build_object(
    'mode', 'changed',
    'entity_type', f.entity_type,
    'entity_id', f.entity_id,
    'locales', f.locales,
    'trigger', 'script'
  ),
  timeout_milliseconds := 400000
)
from (
  select
    case when b.entity_type = 'standalone_experience_include' then 'standalone_experience' else b.entity_type end as entity_type,
    coalesce(i.experience_id, b.entity_id) as entity_id,
    jsonb_agg(distinct b.locale) as locales
  from backup_20261117.content_translations_identiques b
  left join public.standalone_experience_includes i on i.id = b.entity_id
  group by 1, 2
) f;

commit;
