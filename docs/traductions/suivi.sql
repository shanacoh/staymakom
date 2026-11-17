-- SUIVI DE LA TRADUCTION AUTOMATIQUE
-- À coller dans Supabase > SQL Editor, puis « Run ». Lecture seule, ne change rien.

-- 1. Les 10 derniers passages : combien de textes traduits, en erreur, combien il en reste,
--    et ce que chaque passage a réellement coûté (en dollars). « arrete_par_plafond » = oui si le
--    passage s'est arrêté seul en atteignant le plafond de 2 $ (un email a alors été envoyé).
--    La tâche de nuit se relance d'elle-même : « cout_cumule_dollars » est le total de la chaîne.
select
  to_char(started_at at time zone 'Asia/Jerusalem', 'DD/MM HH24:MI') as debut_heure_israel,
  case when finished_at is null then 'en cours' else 'terminé' end as etat,
  trigger as lance_par,
  translated as traduits,
  errors as erreurs,
  remaining as restants,
  cost_usd as cout_dollars,
  chain_cost_usd as cout_cumule_dollars,
  case when cost_capped then 'oui' else '' end as arrete_par_plafond
from content_translation_runs
order by started_at desc
limit 10;

-- 2. Nombre de textes traduits par langue.
select locale as langue, count(*) as textes, count(*) filter (where status = 'reviewed') as verifies,
       count(*) filter (where stale) as sources_modifiees
from content_translations
group by locale
order by locale;

-- 3. Coût total de la traduction automatique, par mois (passages depuis le 17/11/2026).
select to_char(started_at at time zone 'Asia/Jerusalem', 'YYYY-MM') as mois,
       count(*) as passages,
       round(sum(cost_usd), 2) as cout_total_dollars,
       count(*) filter (where cost_capped) as arretes_par_plafond
from content_translation_runs
where cost_usd is not null
group by 1
order by 1 desc;
