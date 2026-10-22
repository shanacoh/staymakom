-- Règle Staymakom : un client réserve une expérience au moins 3 jours à l'avance.
-- Valeur par défaut des nouvelles fiches (avant : 1 jour). Les fiches existantes ne changent pas.
ALTER TABLE public.standalone_experiences ALTER COLUMN lead_time_days SET DEFAULT 3;
