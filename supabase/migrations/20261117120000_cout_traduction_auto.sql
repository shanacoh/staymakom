-- Coût réel de chaque passage de la traduction automatique, et trace du plafond de sécurité.
-- cost_usd       : dépensé par ce passage (appels à l'IA, en dollars)
-- chain_cost_usd : total de la chaîne (la tâche de nuit se relance d'elle-même ; le plafond compte le tout)
-- cost_capped    : le passage a été arrêté par le plafond (email envoyé à Shana)
-- Les passages antérieurs au 17/11/2026 n'ont pas de coût enregistré (vide).
-- À appliquer AVANT de déployer translate-content (la fonction écrit dans ces colonnes).
begin;
alter table public.content_translation_runs
  add column if not exists cost_usd numeric(10, 4),
  add column if not exists chain_cost_usd numeric(10, 4),
  add column if not exists cost_capped boolean not null default false;
commit;
