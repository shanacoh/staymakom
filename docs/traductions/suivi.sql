-- SUIVI DE LA TRADUCTION AUTOMATIQUE
-- À coller dans Supabase > SQL Editor, puis « Run ». Lecture seule, ne change rien.

-- 1. Les 10 derniers passages : combien de textes traduits, en erreur, et combien il en reste.
select
  to_char(started_at at time zone 'Asia/Jerusalem', 'DD/MM HH24:MI') as debut_heure_israel,
  case when finished_at is null then 'en cours' else 'terminé' end as etat,
  trigger as lance_par,
  translated as traduits,
  errors as erreurs,
  remaining as restants
from content_translation_runs
order by started_at desc
limit 10;

-- 2. Nombre de textes traduits par langue.
select locale as langue, count(*) as textes, count(*) filter (where status = 'reviewed') as verifies,
       count(*) filter (where stale) as sources_modifiees
from content_translations
group by locale
order by locale;
