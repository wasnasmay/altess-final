/*
  # Système Financier de Plateforme Centralisée ALTESS

  ## Vue d'ensemble
  Implémente un système de plateforme centralisée où ALTESS gère tous les paiements
  et reverse les fonds aux organisateurs après déduction de commissions.

  ## 1. Nouvelles Tables
    
    ### `platform_commission_settings`
    Configuration des commissions prélevées par ALTESS
    - `id` (uuid, primary key)
    - `commission_type` (text) - 'fixed' ou 'percentage'
    - `commission_value` (decimal) - Montant fixe ou pourcentage
    - `stripe_fee_percentage` (decimal) - Frais Stripe (défaut: 1.4%)
    - `stripe_fee_fixed` (decimal) - Frais Stripe fixe (défaut: 0.25€)
    - `is_active` (boolean)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

    ### `organizer_payouts`
    Gestion des virements aux organisateurs
    - `id` (uuid, primary key)
    - `organizer_id` (uuid, FK vers event_organizers)
    - `event_id` (uuid, FK vers public_events)
    - `total_sales_amount` (decimal) - Total des ventes
    - `platform_commission` (decimal) - Commission ALTESS
    - `stripe_fees` (decimal) - Frais Stripe
    - `net_amount` (decimal) - Montant net pour l'organisateur
    - `payout_status` (text) - 'pending', 'available', 'processing', 'completed', 'failed'
    - `available_date` (timestamptz) - Date de déblocage (48h après événement)
    - `payout_date` (timestamptz) - Date du virement effectué
    - `stripe_transfer_id` (text) - ID du transfert Stripe
    - `bank_details` (jsonb) - Coordonnées bancaires
    - `notes` (text)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## 2. Modifications de Tables Existantes
    
    ### `ticket_purchases`
    Ajout du détail des frais pour transparence
    - `organizer_amount` (decimal) - Part organisateur
    - `platform_commission` (decimal) - Commission ALTESS
    - `stripe_fee` (decimal) - Frais Stripe
    - `breakdown_details` (jsonb) - Détail complet du calcul

    ### `event_organizers`
    Ajout des informations financières
    - `bank_account_iban` (text)
    - `bank_account_bic` (text)
    - `bank_account_holder_name` (text)
    - `payout_enabled` (boolean)
    - `total_earnings` (decimal) - Total des gains
    - `pending_earnings` (decimal) - Gains en attente
    - `completed_payouts` (decimal) - Virements effectués

  ## 3. Sécurité
    - RLS activé sur toutes les tables
    - Seuls les admins peuvent modifier les commissions
    - Les organisateurs voient uniquement leurs propres virements
    - Historique complet des transactions

  ## 4. Fonctions
    - `calculate_ticket_breakdown()` - Calcul détaillé des frais
    - `check_payout_availability()` - Vérifie si virement disponible
    - `create_payout_request()` - Crée une demande de virement
*/

-- 1. Table de configuration des commissions
CREATE TABLE IF NOT EXISTS platform_commission_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_type text NOT NULL CHECK (commission_type IN ('fixed', 'percentage')),
  commission_value decimal(10, 2) NOT NULL CHECK (commission_value >= 0),
  stripe_fee_percentage decimal(5, 4) NOT NULL DEFAULT 0.014,
  stripe_fee_fixed decimal(10, 2) NOT NULL DEFAULT 0.25,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE platform_commission_settings ENABLE ROW LEVEL SECURITY;

-- Politiques pour commission_settings (admin uniquement)
CREATE POLICY "Admins can manage commission settings"
  ON platform_commission_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Public can view active commission settings"
  ON platform_commission_settings
  FOR SELECT
  TO public
  USING (is_active = true);

-- 2. Table des virements organisateurs
CREATE TABLE IF NOT EXISTS organizer_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid REFERENCES event_organizers(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public_events(id) ON DELETE SET NULL,
  total_sales_amount decimal(10, 2) NOT NULL DEFAULT 0,
  platform_commission decimal(10, 2) NOT NULL DEFAULT 0,
  stripe_fees decimal(10, 2) NOT NULL DEFAULT 0,
  net_amount decimal(10, 2) NOT NULL DEFAULT 0,
  payout_status text NOT NULL DEFAULT 'pending' CHECK (
    payout_status IN ('pending', 'available', 'processing', 'completed', 'failed')
  ),
  available_date timestamptz,
  payout_date timestamptz,
  stripe_transfer_id text,
  bank_details jsonb DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE organizer_payouts ENABLE ROW LEVEL SECURITY;

-- Politiques pour payouts
CREATE POLICY "Organizers can view own payouts"
  ON organizer_payouts
  FOR SELECT
  TO authenticated
  USING (
    organizer_id IN (
      SELECT id FROM event_organizers
      WHERE event_organizers.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can request payouts"
  ON organizer_payouts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organizer_id IN (
      SELECT id FROM event_organizers
      WHERE event_organizers.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all payouts"
  ON organizer_payouts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 3. Ajout des colonnes financières à ticket_purchases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_purchases' AND column_name = 'organizer_amount'
  ) THEN
    ALTER TABLE ticket_purchases ADD COLUMN organizer_amount decimal(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_purchases' AND column_name = 'platform_commission'
  ) THEN
    ALTER TABLE ticket_purchases ADD COLUMN platform_commission decimal(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_purchases' AND column_name = 'stripe_fee'
  ) THEN
    ALTER TABLE ticket_purchases ADD COLUMN stripe_fee decimal(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_purchases' AND column_name = 'breakdown_details'
  ) THEN
    ALTER TABLE ticket_purchases ADD COLUMN breakdown_details jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- 4. Ajout des informations bancaires à event_organizers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_organizers' AND column_name = 'bank_account_iban'
  ) THEN
    ALTER TABLE event_organizers ADD COLUMN bank_account_iban text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_organizers' AND column_name = 'bank_account_bic'
  ) THEN
    ALTER TABLE event_organizers ADD COLUMN bank_account_bic text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_organizers' AND column_name = 'bank_account_holder_name'
  ) THEN
    ALTER TABLE event_organizers ADD COLUMN bank_account_holder_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_organizers' AND column_name = 'payout_enabled'
  ) THEN
    ALTER TABLE event_organizers ADD COLUMN payout_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_organizers' AND column_name = 'total_earnings'
  ) THEN
    ALTER TABLE event_organizers ADD COLUMN total_earnings decimal(10, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_organizers' AND column_name = 'pending_earnings'
  ) THEN
    ALTER TABLE event_organizers ADD COLUMN pending_earnings decimal(10, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_organizers' AND column_name = 'completed_payouts'
  ) THEN
    ALTER TABLE event_organizers ADD COLUMN completed_payouts decimal(10, 2) DEFAULT 0;
  END IF;
END $$;

-- 5. Fonction de calcul détaillé des frais
CREATE OR REPLACE FUNCTION calculate_ticket_breakdown(
  p_ticket_price decimal,
  p_quantity int DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_commission_settings record;
  v_subtotal decimal;
  v_stripe_fee decimal;
  v_platform_commission decimal;
  v_organizer_amount decimal;
  v_breakdown jsonb;
BEGIN
  -- Récupérer la configuration active
  SELECT * INTO v_commission_settings
  FROM platform_commission_settings
  WHERE is_active = true
  LIMIT 1;

  -- Si pas de configuration, utiliser des valeurs par défaut
  IF v_commission_settings IS NULL THEN
    v_commission_settings.commission_type := 'percentage';
    v_commission_settings.commission_value := 5.00; -- 5% par défaut
    v_commission_settings.stripe_fee_percentage := 0.014; -- 1.4%
    v_commission_settings.stripe_fee_fixed := 0.25; -- 0.25€
  END IF;

  -- Calcul du sous-total
  v_subtotal := p_ticket_price * p_quantity;

  -- Calcul des frais Stripe (sur le total TTC)
  v_stripe_fee := (v_subtotal * v_commission_settings.stripe_fee_percentage) + v_commission_settings.stripe_fee_fixed;

  -- Calcul de la commission plateforme
  IF v_commission_settings.commission_type = 'fixed' THEN
    v_platform_commission := v_commission_settings.commission_value * p_quantity;
  ELSE
    v_platform_commission := v_subtotal * (v_commission_settings.commission_value / 100);
  END IF;

  -- Calcul du montant pour l'organisateur
  v_organizer_amount := v_subtotal - v_stripe_fee - v_platform_commission;

  -- Construction du détail
  v_breakdown := jsonb_build_object(
    'subtotal', v_subtotal,
    'stripe_fee', v_stripe_fee,
    'platform_commission', v_platform_commission,
    'organizer_amount', v_organizer_amount,
    'commission_type', v_commission_settings.commission_type,
    'commission_value', v_commission_settings.commission_value
  );

  RETURN v_breakdown;
END;
$$;

-- 6. Fonction pour vérifier la disponibilité d'un virement
CREATE OR REPLACE FUNCTION check_payout_availability(p_event_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_event_date timestamptz;
  v_available_date timestamptz;
BEGIN
  -- Récupérer la date de l'événement
  SELECT event_date INTO v_event_date
  FROM public_events
  WHERE id = p_event_id;

  IF v_event_date IS NULL THEN
    RETURN false;
  END IF;

  -- Calculer la date de disponibilité (48h après)
  v_available_date := v_event_date + interval '48 hours';

  -- Vérifier si on est après cette date
  RETURN now() >= v_available_date;
END;
$$;

-- 7. Fonction pour créer une demande de virement
CREATE OR REPLACE FUNCTION create_payout_request(
  p_organizer_id uuid,
  p_event_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payout_id uuid;
  v_total_sales decimal;
  v_breakdown jsonb;
  v_event_date timestamptz;
  v_available_date timestamptz;
  v_organizer record;
BEGIN
  -- Vérifier que l'organisateur existe et a les infos bancaires
  SELECT * INTO v_organizer
  FROM event_organizers
  WHERE id = p_organizer_id;

  IF v_organizer IS NULL THEN
    RAISE EXCEPTION 'Organisateur non trouvé';
  END IF;

  IF v_organizer.bank_account_iban IS NULL THEN
    RAISE EXCEPTION 'Coordonnées bancaires manquantes';
  END IF;

  -- Récupérer la date de l'événement
  SELECT event_date INTO v_event_date
  FROM public_events
  WHERE id = p_event_id;

  -- Calculer la date de disponibilité
  v_available_date := v_event_date + interval '48 hours';

  -- Calculer le total des ventes pour cet événement
  SELECT 
    COALESCE(SUM(final_amount), 0),
    COALESCE(SUM(platform_commission), 0),
    COALESCE(SUM(stripe_fee), 0),
    COALESCE(SUM(organizer_amount), 0)
  INTO v_total_sales, v_breakdown
  FROM ticket_purchases
  WHERE event_id = p_event_id
    AND payment_status = 'paid';

  -- Créer la demande de virement
  INSERT INTO organizer_payouts (
    organizer_id,
    event_id,
    total_sales_amount,
    platform_commission,
    stripe_fees,
    net_amount,
    payout_status,
    available_date,
    bank_details
  ) VALUES (
    p_organizer_id,
    p_event_id,
    v_total_sales,
    COALESCE((SELECT SUM(platform_commission) FROM ticket_purchases WHERE event_id = p_event_id AND payment_status = 'paid'), 0),
    COALESCE((SELECT SUM(stripe_fee) FROM ticket_purchases WHERE event_id = p_event_id AND payment_status = 'paid'), 0),
    COALESCE((SELECT SUM(organizer_amount) FROM ticket_purchases WHERE event_id = p_event_id AND payment_status = 'paid'), 0),
    CASE 
      WHEN now() >= v_available_date THEN 'available'
      ELSE 'pending'
    END,
    v_available_date,
    jsonb_build_object(
      'iban', v_organizer.bank_account_iban,
      'bic', v_organizer.bank_account_bic,
      'holder_name', v_organizer.bank_account_holder_name
    )
  )
  RETURNING id INTO v_payout_id;

  RETURN v_payout_id;
END;
$$;

-- 8. Insérer une configuration par défaut
INSERT INTO platform_commission_settings (
  commission_type,
  commission_value,
  stripe_fee_percentage,
  stripe_fee_fixed,
  is_active
) VALUES (
  'percentage',
  5.00,
  0.014,
  0.25,
  true
)
ON CONFLICT DO NOTHING;

-- 9. Index pour optimisation
CREATE INDEX IF NOT EXISTS idx_organizer_payouts_organizer ON organizer_payouts(organizer_id);
CREATE INDEX IF NOT EXISTS idx_organizer_payouts_event ON organizer_payouts(event_id);
CREATE INDEX IF NOT EXISTS idx_organizer_payouts_status ON organizer_payouts(payout_status);
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_event_payment ON ticket_purchases(event_id, payment_status);

COMMENT ON TABLE platform_commission_settings IS 'Configuration des commissions prélevées par la plateforme ALTESS';
COMMENT ON TABLE organizer_payouts IS 'Historique et gestion des virements aux organisateurs';
COMMENT ON FUNCTION calculate_ticket_breakdown IS 'Calcule la répartition détaillée du prix d''un billet';
COMMENT ON FUNCTION check_payout_availability IS 'Vérifie si un virement est disponible (48h après événement)';
COMMENT ON FUNCTION create_payout_request IS 'Crée une demande de virement pour un organisateur';
