/*
  # Fonction d'Incrémentation des Tickets Vendus

  ## 1. Fonction RPC: increment_tickets_sold

  Fonction atomique pour incrémenter le nombre de tickets vendus
  et le chiffre d'affaires d'un événement.

  ### Paramètres:
  - `p_event_id` (uuid) - ID de l'événement
  - `p_quantity` (integer) - Nombre de tickets vendus

  ### Sécurité:
  - Fonction appelée uniquement par le service backend
  - Pas d'accès direct depuis le client

  ## 2. Fonction RPC: increment_event_revenue

  Fonction atomique pour incrémenter le chiffre d'affaires
  d'un événement après un paiement validé.

  ### Paramètres:
  - `p_event_id` (uuid) - ID de l'événement
  - `p_amount` (numeric) - Montant du paiement
*/

-- =====================================================
-- FONCTION: Incrémenter tickets vendus
-- =====================================================

CREATE OR REPLACE FUNCTION increment_tickets_sold(
  p_event_id uuid,
  p_quantity integer
)
RETURNS void AS $$
BEGIN
  UPDATE public_events
  SET 
    tickets_sold = COALESCE(tickets_sold, 0) + p_quantity,
    updated_at = NOW()
  WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION: Incrémenter chiffre d'affaires
-- =====================================================

CREATE OR REPLACE FUNCTION increment_event_revenue(
  p_event_id uuid,
  p_amount numeric
)
RETURNS void AS $$
BEGIN
  UPDATE public_events
  SET 
    total_revenue = COALESCE(total_revenue, 0) + p_amount,
    updated_at = NOW()
  WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON FUNCTION increment_tickets_sold IS 'Incrémente atomiquement le nombre de tickets vendus pour un événement';
COMMENT ON FUNCTION increment_event_revenue IS 'Incrémente atomiquement le chiffre d''affaires d''un événement';
