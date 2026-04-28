-- Suivi de l'utilisation partielle des gift cards
ALTER TABLE gift_cards
  ADD COLUMN IF NOT EXISTS amount_used NUMERIC DEFAULT 0 NOT NULL;

COMMENT ON COLUMN gift_cards.amount_used IS 'Montant déjà utilisé ; solde restant = amount - amount_used';

-- Fonction de validation d'un code gift card (SECURITY DEFINER = bypass RLS, utilisé au checkout)
CREATE OR REPLACE FUNCTION validate_gift_card(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_card RECORD;
  v_available NUMERIC;
BEGIN
  SELECT id, code, amount, COALESCE(amount_used, 0) AS amount_used, currency, status, expires_at
  INTO v_card
  FROM gift_cards
  WHERE code = UPPER(TRIM(p_code));

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'not_found');
  END IF;

  IF v_card.status NOT IN ('sent', 'active') THEN
    RETURN json_build_object('valid', false, 'error', 'invalid_status', 'status', v_card.status);
  END IF;

  IF v_card.expires_at < NOW() THEN
    RETURN json_build_object('valid', false, 'error', 'expired');
  END IF;

  v_available := v_card.amount - v_card.amount_used;

  IF v_available <= 0 THEN
    RETURN json_build_object('valid', false, 'error', 'no_balance');
  END IF;

  RETURN json_build_object(
    'valid', true,
    'id', v_card.id,
    'code', v_card.code,
    'amount', v_card.amount,
    'amount_used', v_card.amount_used,
    'available_balance', v_available,
    'currency', COALESCE(v_card.currency, 'ILS')
  );
END;
$$;

-- Accessible depuis le frontend (utilisateur connecté ou non)
GRANT EXECUTE ON FUNCTION validate_gift_card(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_gift_card(TEXT) TO anon;

-- RLS : autoriser les admins à mettre à jour amount_used après une réservation
-- (la politique admin existante couvre déjà UPDATE pour les admins)
