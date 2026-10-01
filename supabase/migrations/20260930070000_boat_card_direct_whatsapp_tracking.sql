-- Le bouton "Demander sur WhatsApp" des cartes ouvre WhatsApp directement,
-- sans rien demander au client (pas de prénom, pas de contact) : on ne connaît
-- donc pas encore son nom au moment du clic. On assouplit customer_name
-- (nullable) plutôt que d'y mettre un faux nom, et on ajoute `source` pour
-- distinguer ce chemin rapide d'une demande passée par le pop-up complet,
-- utile pour le suivi des demandes (étape 8). Aucune ligne existante affectée.

alter table public.standalone_experience_requests alter column customer_name drop not null;
alter table public.standalone_experience_requests add column if not exists source text;

comment on column public.standalone_experience_requests.source is 'card_whatsapp = clic direct depuis la carte bateau (pas de coordonnées connues). NULL = passé par le pop-up complet (formulaire rempli).';
