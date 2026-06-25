-- Ajout de la colonne practical_info sur hotels2
-- Stocke les infos pratiques de l'hôtel (casher, parking, spa, fitness, enfants)
-- sous forme de JSONB, même structure que standalone_experiences.practical_info
ALTER TABLE hotels2 ADD COLUMN IF NOT EXISTS practical_info jsonb;
