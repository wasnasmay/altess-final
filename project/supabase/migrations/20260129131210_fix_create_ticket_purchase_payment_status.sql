/*
  # Correction du Statut de Paiement dans create_ticket_purchase

  ## Problème
  La fonction create_ticket_purchase utilisait 'completed' comme valeur par défaut
  pour payment_status, mais la contrainte CHECK n'accepte que:
  - 'pending'
  - 'paid'
  - 'refunded'
  - 'cancelled'

  ## Solution
  Changer la valeur par défaut de 'completed' à 'paid'
*/

-- Recréer la fonction avec la bonne valeur par défaut
CREATE OR REPLACE FUNCTION create_ticket_purchase(
  p_event_id uuid,
  p_organizer_id uuid,
  p_customer_email text,
  p_customer_first_name text,
  p_customer_last_name text,
  p_customer_phone text DEFAULT NULL,
  p_ticket_type text DEFAULT 'standard',
  p_ticket_tier_name text DEFAULT NULL,
  p_quantity integer DEFAULT 1,
  p_unit_price numeric DEFAULT 0,
  p_total_price numeric DEFAULT 0,
  p_discount_amount numeric DEFAULT 0,
  p_service_fee numeric DEFAULT 0,
  p_final_amount numeric DEFAULT 0,
  p_ticket_number text DEFAULT NULL,
  p_qr_code_data text DEFAULT NULL,
  p_payment_status text DEFAULT 'paid',  -- Changed from 'completed' to 'paid'
  p_ticket_status text DEFAULT 'valid',
  p_promo_code_used text DEFAULT NULL,
  p_custom_field_responses jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket_id uuid;
  v_ticket_number text;
BEGIN
  -- Générer un numéro de billet si non fourni
  IF p_ticket_number IS NULL THEN
    v_ticket_number := 'ALTESS-' || EXTRACT(EPOCH FROM NOW())::bigint || '-' || substring(md5(random()::text) from 1 for 8);
  ELSE
    v_ticket_number := p_ticket_number;
  END IF;

  -- Insérer le billet
  INSERT INTO ticket_purchases (
    event_id,
    organizer_id,
    customer_email,
    customer_first_name,
    customer_last_name,
    customer_phone,
    ticket_type,
    ticket_tier_name,
    quantity,
    unit_price,
    total_price,
    discount_amount,
    service_fee,
    final_amount,
    ticket_number,
    qr_code_data,
    payment_status,
    ticket_status,
    promo_code_used,
    custom_field_responses
  ) VALUES (
    p_event_id,
    p_organizer_id,
    p_customer_email,
    p_customer_first_name,
    p_customer_last_name,
    p_customer_phone,
    p_ticket_type,
    p_ticket_tier_name,
    p_quantity,
    p_unit_price,
    p_total_price,
    p_discount_amount,
    p_service_fee,
    p_final_amount,
    v_ticket_number,
    COALESCE(p_qr_code_data, v_ticket_number),
    p_payment_status,
    p_ticket_status,
    p_promo_code_used,
    p_custom_field_responses
  )
  RETURNING id INTO v_ticket_id;

  RETURN v_ticket_id;
END;
$$;

-- S'assurer que les permissions sont toujours en place
GRANT EXECUTE ON FUNCTION create_ticket_purchase TO public, anon, authenticated;

-- Commentaire
COMMENT ON FUNCTION create_ticket_purchase IS 'Fonction publique pour créer un achat de billet de manière sécurisée. Statut de paiement valides: pending, paid, refunded, cancelled';
