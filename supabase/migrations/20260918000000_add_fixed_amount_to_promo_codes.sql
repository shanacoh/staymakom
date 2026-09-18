-- ============================================================================
-- PROMO CODES — ajout du montant fixe en complément du pourcentage
-- Demandé par Shana 2026-09-18 : pouvoir créer un code promo à montant fixe
-- (ex. 50 ₪ de réduction) en plus du pourcentage déjà existant. WELCOME10 et
-- toute la logique déjà en prod (1 usage/email, cumul avec gift card, etc.)
-- restent inchangés : les codes existants passent automatiquement en type
-- "percentage" via la valeur par défaut.
-- ============================================================================

ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS discount_type TEXT NOT NULL DEFAULT 'percentage'
    CHECK (discount_type IN ('percentage', 'fixed_amount')),
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC
    CHECK (discount_amount IS NULL OR discount_amount > 0);

-- discount_pct devient optionnel : obligatoire seulement pour les codes "pourcentage"
ALTER TABLE public.promo_codes
  ALTER COLUMN discount_pct DROP NOT NULL;

ALTER TABLE public.promo_codes
  DROP CONSTRAINT IF EXISTS promo_codes_discount_value_matches_type;

ALTER TABLE public.promo_codes
  ADD CONSTRAINT promo_codes_discount_value_matches_type CHECK (
    (discount_type = 'percentage' AND discount_pct IS NOT NULL AND discount_amount IS NULL)
    OR
    (discount_type = 'fixed_amount' AND discount_amount IS NOT NULL AND discount_pct IS NULL)
  );

-- La RPC de validation renvoie maintenant aussi discount_type / discount_amount
CREATE OR REPLACE FUNCTION validate_promo_code(p_code TEXT, p_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code RECORD;
  v_already_used INTEGER;
BEGIN
  IF p_code IS NULL OR TRIM(p_code) = '' OR p_email IS NULL OR TRIM(p_email) = '' THEN
    RETURN json_build_object('valid', false, 'error', 'invalid_input');
  END IF;

  SELECT id, code, discount_type, discount_pct, discount_amount, valid_from, valid_until, max_uses, used_count, is_active
  INTO v_code
  FROM promo_codes
  WHERE code = UPPER(TRIM(p_code));

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'not_found');
  END IF;

  IF NOT v_code.is_active THEN
    RETURN json_build_object('valid', false, 'error', 'inactive');
  END IF;

  IF v_code.valid_from > NOW() THEN
    RETURN json_build_object('valid', false, 'error', 'not_yet_valid');
  END IF;

  IF v_code.valid_until < NOW() THEN
    RETURN json_build_object('valid', false, 'error', 'expired');
  END IF;

  IF v_code.max_uses IS NOT NULL AND v_code.used_count >= v_code.max_uses THEN
    RETURN json_build_object('valid', false, 'error', 'max_uses_reached');
  END IF;

  SELECT COUNT(*) INTO v_already_used
  FROM promo_code_redemptions
  WHERE promo_code_id = v_code.id
    AND LOWER(email) = LOWER(TRIM(p_email));

  IF v_already_used > 0 THEN
    RETURN json_build_object('valid', false, 'error', 'already_used_by_email');
  END IF;

  RETURN json_build_object(
    'valid', true,
    'id', v_code.id,
    'code', v_code.code,
    'discount_type', v_code.discount_type,
    'discount_pct', v_code.discount_pct,
    'discount_amount', v_code.discount_amount
  );
END;
$$;
