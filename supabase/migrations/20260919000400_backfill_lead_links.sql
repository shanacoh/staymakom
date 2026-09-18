-- Remise à niveau ponctuelle des données existantes, pour que les comptes et
-- réservations créés AVANT la mise en place du lien automatique en profitent
-- aussi. Chaque étape est idempotente (peut être rejouée sans créer de
-- doublon ni écraser un lien déjà posé).

-- Étape 1 : comptes déjà créés -> lead existant du même email.
UPDATE public.leads l
SET converted_user_id = au.id,
    linked_at = now(),
    status = CASE WHEN l.status IN ('new', 'contacted', 'qualified') THEN 'converted' ELSE l.status END
FROM auth.users au
WHERE l.converted_user_id IS NULL
  AND l.email_normalized = lower(btrim(au.email))
  AND l.id = (
    SELECT l2.id FROM public.leads l2
    WHERE l2.email_normalized = lower(btrim(au.email))
    ORDER BY l2.created_at DESC
    LIMIT 1
  );

-- Étape 2 : crée un lead "reservation" pour chaque email de réservation
-- (bookings_hg + standalone_bookings) qui n'a encore aucun lead correspondant.
-- DISTINCT ON regroupe par email normalisé pour ne créer qu'un seul lead même
-- si la même personne a réservé plusieurs fois sans compte.
INSERT INTO public.leads (source, email, name, phone, status, created_at)
SELECT DISTINCT ON (lower(btrim(x.customer_email)))
  'reservation', x.customer_email, x.customer_name, x.customer_phone, 'converted', x.created_at
FROM (
  SELECT customer_email, customer_name, NULL::text AS customer_phone, created_at
  FROM public.bookings_hg
  WHERE customer_email IS NOT NULL AND customer_email <> ''
  UNION ALL
  SELECT customer_email, customer_name, customer_phone, created_at
  FROM public.standalone_bookings
  WHERE customer_email IS NOT NULL AND customer_email <> ''
) x
WHERE NOT EXISTS (
  SELECT 1 FROM public.leads l
  WHERE l.email_normalized = lower(btrim(x.customer_email))
)
ORDER BY lower(btrim(x.customer_email)), x.created_at ASC;

-- Étape 3 : relie chaque réservation existante (sans lead_id) au lead le plus
-- récent partageant le même email.
UPDATE public.bookings_hg b
SET lead_id = l.id
FROM public.leads l
WHERE b.lead_id IS NULL
  AND b.customer_email IS NOT NULL AND b.customer_email <> ''
  AND l.email_normalized = lower(btrim(b.customer_email))
  AND l.id = (
    SELECT l2.id FROM public.leads l2
    WHERE l2.email_normalized = lower(btrim(b.customer_email))
    ORDER BY l2.created_at DESC
    LIMIT 1
  );

UPDATE public.standalone_bookings b
SET lead_id = l.id
FROM public.leads l
WHERE b.lead_id IS NULL
  AND b.customer_email IS NOT NULL AND b.customer_email <> ''
  AND l.email_normalized = lower(btrim(b.customer_email))
  AND l.id = (
    SELECT l2.id FROM public.leads l2
    WHERE l2.email_normalized = lower(btrim(b.customer_email))
    ORDER BY l2.created_at DESC
    LIMIT 1
  );

-- Étape 4 : on rejoue l'étape 1 pour rattraper le cas où un lead venant
-- d'être créé à l'étape 2 (à partir d'une réservation) correspond en fait à
-- un compte déjà existant.
UPDATE public.leads l
SET converted_user_id = au.id,
    linked_at = now(),
    status = CASE WHEN l.status IN ('new', 'contacted', 'qualified') THEN 'converted' ELSE l.status END
FROM auth.users au
WHERE l.converted_user_id IS NULL
  AND l.email_normalized = lower(btrim(au.email))
  AND l.id = (
    SELECT l2.id FROM public.leads l2
    WHERE l2.email_normalized = lower(btrim(au.email))
    ORDER BY l2.created_at DESC
    LIMIT 1
  );
