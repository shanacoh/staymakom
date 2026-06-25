-- Ajoute un flag pour les expériences visibles uniquement sur /v3
-- Ces expériences sont publiées mais n'apparaissent pas sur la homepage principale

ALTER TABLE experiences2
ADD COLUMN IF NOT EXISTS show_on_v3_only boolean NOT NULL DEFAULT false;
