-- Permettre aux favoris (wishlist) de pointer vers n'importe laquelle des
-- trois tables d'expériences (experiences v1, experiences2 v2, standalone_experiences).
-- Une seule clé étrangère ne peut pas cibler conditionnellement plusieurs tables ;
-- on retire donc la contrainte stricte qui ne pointait que vers experiences2
-- (elle bloquait silencieusement tout favori sur une expérience "seule"),
-- et on ajoute une colonne qui indique de quelle table vient l'identifiant.

ALTER TABLE public.wishlist
  ADD COLUMN IF NOT EXISTS experience_type TEXT NOT NULL DEFAULT 'experiences2'
  CHECK (experience_type IN ('experiences', 'experiences2', 'standalone'));

-- Toutes les lignes existantes ont été créées avant que les expériences
-- "standalone" ne puissent être mises en favori, et la contrainte en place
-- depuis le 1er mai 2026 garantissait qu'elles venaient de experiences2.
UPDATE public.wishlist SET experience_type = 'experiences2';

ALTER TABLE public.wishlist DROP CONSTRAINT IF EXISTS wishlist_experience_id_fkey;

ALTER TABLE public.wishlist DROP CONSTRAINT IF EXISTS unique_user_experience;
ALTER TABLE public.wishlist
  ADD CONSTRAINT unique_user_experience_type UNIQUE (user_id, experience_type, experience_id);

CREATE INDEX IF NOT EXISTS idx_wishlist_experience_type ON public.wishlist(experience_type);
