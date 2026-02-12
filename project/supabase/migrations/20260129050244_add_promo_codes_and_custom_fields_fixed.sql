/*
  # Add Promo Codes and Custom Fields System

  1. New Tables
    - `promo_codes` - Codes de réduction pour les organisateurs
    - `event_custom_fields` - Champs personnalisés pour les événements
    - `transaction_history` - Historique des transactions

  2. Changes to Existing Tables
    - Add custom fields support to ticket_purchases
    - Add financial tracking to event_organizers

  3. Security
    - Enable RLS on all new tables
    - Organizers can only access their own data
*/

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES event_organizers(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create event_custom_fields table
CREATE TABLE IF NOT EXISTS event_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public_events(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'email', 'phone', 'select', 'textarea')),
  is_required BOOLEAN DEFAULT false,
  options JSONB,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transaction_history table
CREATE TABLE IF NOT EXISTS transaction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES event_organizers(id) ON DELETE CASCADE,
  ticket_purchase_id UUID REFERENCES ticket_purchases(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'refund', 'payout')),
  amount NUMERIC NOT NULL,
  net_amount NUMERIC NOT NULL,
  stripe_fee NUMERIC DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('completed', 'pending', 'failed', 'cancelled')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns to ticket_purchases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_purchases' AND column_name = 'custom_field_responses'
  ) THEN
    ALTER TABLE ticket_purchases ADD COLUMN custom_field_responses JSONB DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ticket_purchases' AND column_name = 'promo_code_used'
  ) THEN
    ALTER TABLE ticket_purchases ADD COLUMN promo_code_used TEXT;
  END IF;
END $$;

-- Add new columns to event_organizers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_organizers' AND column_name = 'last_payout_date'
  ) THEN
    ALTER TABLE event_organizers ADD COLUMN last_payout_date TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_organizers' AND column_name = 'next_payout_amount'
  ) THEN
    ALTER TABLE event_organizers ADD COLUMN next_payout_amount NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_organizers' AND column_name = 'total_revenue'
  ) THEN
    ALTER TABLE event_organizers ADD COLUMN total_revenue NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'event_organizers' AND column_name = 'pending_balance'
  ) THEN
    ALTER TABLE event_organizers ADD COLUMN pending_balance NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for promo_codes
CREATE POLICY "Organizers can view own promo codes"
  ON promo_codes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_organizers
      WHERE event_organizers.id = promo_codes.organizer_id
      AND event_organizers.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can create promo codes"
  ON promo_codes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_organizers
      WHERE event_organizers.id = promo_codes.organizer_id
      AND event_organizers.user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can update own promo codes"
  ON promo_codes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_organizers
      WHERE event_organizers.id = promo_codes.organizer_id
      AND event_organizers.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active promo codes for validation"
  ON promo_codes FOR SELECT
  TO public
  USING (is_active = true);

-- RLS Policies for event_custom_fields
CREATE POLICY "Organizers can manage event custom fields"
  ON event_custom_fields FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public_events
      JOIN event_organizers ON public_events.organizer_id = event_organizers.user_id
      WHERE public_events.id = event_custom_fields.event_id
      AND event_organizers.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view custom fields for events"
  ON event_custom_fields FOR SELECT
  TO public
  USING (true);

-- RLS Policies for transaction_history
CREATE POLICY "Organizers can view own transactions"
  ON transaction_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_organizers
      WHERE event_organizers.id = transaction_history.organizer_id
      AND event_organizers.user_id = auth.uid()
    )
  );

CREATE POLICY "System can create transactions"
  ON transaction_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_promo_codes_organizer ON promo_codes(organizer_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_event_custom_fields_event ON event_custom_fields(event_id);
CREATE INDEX IF NOT EXISTS idx_transaction_history_organizer ON transaction_history(organizer_id);
CREATE INDEX IF NOT EXISTS idx_transaction_history_created ON transaction_history(created_at DESC);
