/*
  # Ajout de la Gestion de Validité et Tracking des Paiements

  ## Modifications

  ### Tables modifiées:
  1. `public_events`
     - `expires_at` (timestamptz) - Date d'expiration de l'annonce
     - `payment_transferred` (boolean) - Virement effectué à l'organisateur
     - `renewal_stripe_link` (text) - Lien Stripe pour renouvellement

  2. `good_addresses`
     - `expires_at` (timestamptz) - Date d'expiration de l'annonce
     - `renewal_stripe_link` (text) - Lien Stripe pour renouvellement
     - `status` (text) - Statut de modération (pending, approved, rejected, expired)

  3. `partners`
     - `expires_at` (timestamptz) - Date d'expiration de l'annonce
     - `renewal_stripe_link` (text) - Lien Stripe pour renouvellement
     - `status` (text) - Statut de modération (pending, approved, rejected, expired)

  4. Nouvelle table: `renewal_reminders`
     - Suivi des emails de relance envoyés

  ## Fonctionnalités
  - Système de validité avec compte à rebours
  - Tracking des virements effectués
  - Préparation pour système de relances automatiques
  - Statuts de modération unifiés
*/

-- =====================================================
-- EXTENSIONS: public_events
-- =====================================================

DO $$
BEGIN
  -- expires_at: date d'expiration de l'annonce
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'public_events' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE public_events ADD COLUMN expires_at timestamptz DEFAULT (NOW() + INTERVAL '12 months');
  END IF;

  -- payment_transferred: virement effectué
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'public_events' AND column_name = 'payment_transferred'
  ) THEN
    ALTER TABLE public_events ADD COLUMN payment_transferred boolean DEFAULT false;
  END IF;

  -- renewal_stripe_link: lien de renouvellement
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'public_events' AND column_name = 'renewal_stripe_link'
  ) THEN
    ALTER TABLE public_events ADD COLUMN renewal_stripe_link text;
  END IF;
END $$;

-- =====================================================
-- EXTENSIONS: good_addresses
-- =====================================================

DO $$
BEGIN
  -- expires_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'good_addresses' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE good_addresses ADD COLUMN expires_at timestamptz DEFAULT (NOW() + INTERVAL '12 months');
  END IF;

  -- renewal_stripe_link
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'good_addresses' AND column_name = 'renewal_stripe_link'
  ) THEN
    ALTER TABLE good_addresses ADD COLUMN renewal_stripe_link text;
  END IF;

  -- status (pour modération)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'good_addresses' AND column_name = 'status'
  ) THEN
    ALTER TABLE good_addresses ADD COLUMN status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired'));
  END IF;
END $$;

-- =====================================================
-- EXTENSIONS: partners
-- =====================================================

DO $$
BEGIN
  -- expires_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE partners ADD COLUMN expires_at timestamptz DEFAULT (NOW() + INTERVAL '12 months');
  END IF;

  -- renewal_stripe_link
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' AND column_name = 'renewal_stripe_link'
  ) THEN
    ALTER TABLE partners ADD COLUMN renewal_stripe_link text;
  END IF;

  -- status (pour modération)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' AND column_name = 'status'
  ) THEN
    ALTER TABLE partners ADD COLUMN status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired'));
  END IF;
END $$;

-- =====================================================
-- TABLE: renewal_reminders
-- =====================================================

CREATE TABLE IF NOT EXISTS renewal_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Référence à l'entité
  entity_type text NOT NULL CHECK (entity_type IN ('event', 'address', 'partner')),
  entity_id uuid NOT NULL,
  
  -- Type de relance
  reminder_type text NOT NULL CHECK (reminder_type IN ('30_days', '7_days', '1_day')),
  
  -- Email
  recipient_email text NOT NULL,
  email_sent boolean DEFAULT false,
  email_sent_at timestamptz,
  
  -- Stripe
  stripe_link text,
  payment_received boolean DEFAULT false,
  payment_received_at timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_renewal_reminders_entity ON renewal_reminders(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_renewal_reminders_sent ON renewal_reminders(email_sent, reminder_type);

-- RLS
ALTER TABLE renewal_reminders ENABLE ROW LEVEL SECURITY;

-- Admins peuvent tout voir
CREATE POLICY "Admins can read all renewal reminders"
  ON renewal_reminders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Système peut créer des reminders
CREATE POLICY "System can create renewal reminders"
  ON renewal_reminders FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Système peut mettre à jour les reminders
CREATE POLICY "System can update renewal reminders"
  ON renewal_reminders FOR UPDATE
  TO authenticated
  USING (true);

-- =====================================================
-- FUNCTION: Auto-archivage des événements terminés
-- =====================================================

CREATE OR REPLACE FUNCTION auto_archive_past_events()
RETURNS void AS $$
BEGIN
  -- Archive les événements dont la date est passée de plus de 24h
  UPDATE public_events
  SET 
    status = 'completed',
    is_active = false
  WHERE 
    event_date < (NOW() - INTERVAL '1 day')
    AND status = 'upcoming';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Prolonger la validité après paiement
-- =====================================================

CREATE OR REPLACE FUNCTION extend_validity_after_payment(
  p_entity_type text,
  p_entity_id uuid,
  p_months integer DEFAULT 12
)
RETURNS void AS $$
BEGIN
  IF p_entity_type = 'event' THEN
    UPDATE public_events
    SET expires_at = COALESCE(expires_at, NOW()) + (p_months || ' months')::INTERVAL
    WHERE id = p_entity_id;
  ELSIF p_entity_type = 'address' THEN
    UPDATE good_addresses
    SET expires_at = COALESCE(expires_at, NOW()) + (p_months || ' months')::INTERVAL
    WHERE id = p_entity_id;
  ELSIF p_entity_type = 'partner' THEN
    UPDATE partners
    SET expires_at = COALESCE(expires_at, NOW()) + (p_months || ' months')::INTERVAL
    WHERE id = p_entity_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON TABLE renewal_reminders IS 'Suivi des emails de relance pour renouvellement des annonces';
COMMENT ON COLUMN public_events.expires_at IS 'Date d''expiration de l''annonce (12 mois par défaut)';
COMMENT ON COLUMN public_events.payment_transferred IS 'Indique si le virement a été effectué à l''organisateur';
COMMENT ON COLUMN public_events.renewal_stripe_link IS 'Lien Stripe pour renouveler l''annonce';

COMMENT ON FUNCTION auto_archive_past_events IS 'Archive automatiquement les événements passés de plus de 24h';
COMMENT ON FUNCTION extend_validity_after_payment IS 'Prolonge la validité d''une annonce de X mois après paiement';
