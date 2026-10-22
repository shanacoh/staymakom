-- Règle Staymakom validée par Shana (22/10/2026) : toutes les fiches en ligne passent à 3 jours
-- minimum de délai de réservation. 37 fiches étaient à 1 ou 2 jours.
-- Anciennes valeurs sauvegardées dans backup_20261022.standalone_lead_time (id, slug, lead_time_days).
-- Appliqué en production via l'outil Supabase (décalage d'historique des migrations).
UPDATE public.standalone_experiences
SET lead_time_days = 3
WHERE status = 'published' AND coalesce(lead_time_days, 0) < 3;
