-- Reprise des avis de experience2_reviews vers la nouvelle table reviews.
-- IMPORTANT : ces 28 avis sont des contenus de remplissage mis en place avant l'existence
-- d'un vrai système de collecte (28/28 à 5 étoiles, noms génériques type "La famille Fontaine",
-- texte rédigé/traduit à la création plutôt que collecté auprès d'un client réel).
-- Conformément à la règle "jamais d'avis inventé", ils sont repris en base pour ne rien perdre,
-- mais en statut masqué, donc invisibles sur le site tant qu'ils ne sont pas remplacés par de
-- vrais avis clients.

INSERT INTO public.reviews (
  scope,
  experience2_id,
  customer_first_name,
  customer_last_initial,
  rating,
  comment,
  lang,
  consent_to_publish,
  moderation_status,
  hidden_reason,
  source,
  review_date,
  created_at
)
SELECT
  'experience2',
  experience_id,
  user_name,
  NULL,
  rating,
  comment,
  'fr',
  FALSE,
  'hidden',
  'Avis de remplissage mis en place avant le vrai système de collecte : contenu non vérifiable, probablement fictif. Ne pas publier sans confirmation de Shana.',
  'legacy_placeholder',
  created_at::date,
  created_at
FROM public.experience2_reviews;
