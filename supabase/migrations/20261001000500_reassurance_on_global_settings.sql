-- Correction : une table de réglages généraux existait déjà (global_settings, ligne "site_config"),
-- utilisée par la page /admin/settings. La phrase de réassurance y a donc sa place plutôt que dans
-- une nouvelle table générique créée par erreur (app_settings, abandonnée ci-dessous).

ALTER TABLE public.global_settings
  ADD COLUMN IF NOT EXISTS reassurance_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS reassurance_text_fr TEXT,
  ADD COLUMN IF NOT EXISTS reassurance_text_en TEXT,
  ADD COLUMN IF NOT EXISTS reassurance_text_he TEXT;

UPDATE public.global_settings
SET
  reassurance_text_fr = COALESCE(reassurance_text_fr, 'Réponse de notre équipe sur WhatsApp en moins de 2h'),
  reassurance_text_en = COALESCE(reassurance_text_en, 'Our team replies on WhatsApp in under 2 hours'),
  reassurance_text_he = COALESCE(reassurance_text_he, 'הצוות שלנו מגיב בוואטסאפ תוך פחות משעתיים')
WHERE key = 'site_config';

DROP TABLE IF EXISTS public.app_settings;
