-- Seed de test : copie 4 expériences existantes en mode "Experience Only"
-- pour comparer l'affichage avec la grille hôtel+expérience.
-- L'hôtel est retiré : on ne copie que le contenu (titre, image, sous-titre, prix).
-- Les slugs reçoivent le suffixe "-live" pour éviter tout conflit.

DO $$
DECLARE
  rec         RECORD;
  new_id      UUID;
  counter     INTEGER := 1;
BEGIN

  FOR rec IN (
    SELECT
      slug,
      title,
      title_he,
      title_fr,
      subtitle,
      subtitle_he,
      hero_image,
      to_jsonb(photos)                              AS photos_jsonb,
      COALESCE(base_price, 150)                     AS base_price,
      COALESCE(NULLIF(currency, ''), 'USD')         AS currency
    FROM public.experiences2
    WHERE status = 'published'
      AND hero_image IS NOT NULL
    ORDER BY display_order NULLS LAST, created_at
    LIMIT 4
  ) LOOP

    new_id := gen_random_uuid();

    INSERT INTO public.standalone_experiences (
      id,
      slug,
      title,
      title_he,
      title_fr,
      subtitle,
      subtitle_he,
      hero_image,
      photos,
      base_price,
      base_price_type,
      currency,
      min_party,
      max_party,
      status,
      display_order
    ) VALUES (
      new_id,
      rec.slug || '-live',
      rec.title,
      rec.title_he,
      rec.title_fr,
      rec.subtitle,
      rec.subtitle_he,
      rec.hero_image,
      COALESCE(rec.photos_jsonb, '[]'::jsonb),
      rec.base_price,
      'per_person',
      rec.currency,
      1,
      10,
      'published',
      counter
    )
    ON CONFLICT (slug) DO NOTHING;

    counter := counter + 1;

  END LOOP;

END $$;
