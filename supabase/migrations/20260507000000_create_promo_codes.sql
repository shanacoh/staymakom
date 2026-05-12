-- ============================================================================
-- PROMO CODES — système de codes promo génériques avec 1 usage par email
-- Validé par Shana 2026-05-07 :
--   - cumulable avec gift card,
--   - 1 utilisation par email (un code peut servir à beaucoup d'emails distincts),
--   - codes génériques (ex. WELCOME10, BLACKFRIDAY10, …),
--   - dates valid_from / valid_until pour campagnes timées.
-- Cette migration a été appliquée le 2026-05-07 manuellement via Supabase Studio.
-- Le fichier est versionné ici pour traçabilité.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_pct NUMERIC NOT NULL CHECK (discount_pct > 0 AND discount_pct <= 100),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  max_uses INTEGER, -- NULL = illimité
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON public.promo_codes(is_active) WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS public.promo_code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  booking_id UUID,
  amount_discounted NUMERIC NOT NULL DEFAULT 0,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (promo_code_id, email)
);

CREATE INDEX IF NOT EXISTS idx_promo_redemptions_email ON public.promo_code_redemptions(email);

-- RPC de validation côté front (anon + authenticated)
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

  SELECT id, code, discount_pct, valid_from, valid_until, max_uses, used_count, is_active
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
    'discount_pct', v_code.discount_pct
  );
END;
$$;

GRANT EXECUTE ON FUNCTION validate_promo_code(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_promo_code(TEXT, TEXT) TO anon;

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage promo_codes" ON public.promo_codes;
CREATE POLICY "Admins can manage promo_codes" ON public.promo_codes
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can read redemptions" ON public.promo_code_redemptions;
CREATE POLICY "Admins can read redemptions" ON public.promo_code_redemptions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Code initial seedé manuellement : WELCOME10 = 10 % de réduction, valable 1 an.
INSERT INTO public.promo_codes (code, discount_pct, valid_from, valid_until, max_uses, is_active)
VALUES ('WELCOME10', 10, NOW(), NOW() + INTERVAL '1 year', NULL, TRUE)
ON CONFLICT (code) DO NOTHING;
