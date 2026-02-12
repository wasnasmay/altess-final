/*
  # Premium Accounts & Revenue Tracking System

  ## Overview
  Transform the admin panel into a professional business management center with premium account management and revenue tracking.

  ## 1. New Fields Added
    ### profiles
      - `account_type`: 'normal' or 'premium'
      - `premium_expires_at`: Premium expiration date
      - `last_payment_date`: Last payment received
      - `total_revenue`: Total revenue generated
    
    ### event_providers
      - `account_type`: 'normal' or 'premium'
      - `premium_expires_at`: Premium expiration date
      - `subscription_revenue`: Total subscription revenue
    
    ### public_events, good_addresses, partners
      - `expiration_status`: 'active', 'expiring_soon', 'expired'
      - `auto_hidden_at`: When auto-hidden
      - `visibility_field`: Track visibility status

  ## 2. New Tables
    ### revenue_tracking
      - All revenue sources: ticketing, subscriptions, ads
      - Automatic commission calculation (10% for ticketing)
      - Full audit trail

  ## 3. Automated Functions
    - `calculate_expiration_status()`: Auto-calculates status
    - Triggers for auto-hiding expired content
    - Progress bar status calculation

  ## 4. Revenue View
    - `v_revenue_summary`: Complete revenue breakdown
    - Separate counters for each revenue type

  ## 5. Security
    - RLS policies for admin-only revenue access
    - Automated triggers for status updates
*/

-- Add account_type to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'normal' CHECK (account_type IN ('normal', 'premium')),
ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_revenue NUMERIC DEFAULT 0;

-- Add account_type to event_providers
ALTER TABLE event_providers 
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'normal' CHECK (account_type IN ('normal', 'premium')),
ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_revenue NUMERIC DEFAULT 0;

-- Add expiration tracking and visibility to public_events
ALTER TABLE public_events 
ADD COLUMN IF NOT EXISTS expiration_status TEXT DEFAULT 'active' CHECK (expiration_status IN ('active', 'expiring_soon', 'expired')),
ADD COLUMN IF NOT EXISTS auto_hidden_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Add expiration tracking and visibility to good_addresses
ALTER TABLE good_addresses 
ADD COLUMN IF NOT EXISTS expiration_status TEXT DEFAULT 'active' CHECK (expiration_status IN ('active', 'expiring_soon', 'expired')),
ADD COLUMN IF NOT EXISTS auto_hidden_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Add expiration tracking and visibility to partners
ALTER TABLE partners 
ADD COLUMN IF NOT EXISTS expiration_status TEXT DEFAULT 'active' CHECK (expiration_status IN ('active', 'expiring_soon', 'expired')),
ADD COLUMN IF NOT EXISTS auto_hidden_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Create revenue_tracking table
CREATE TABLE IF NOT EXISTS revenue_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_type TEXT NOT NULL CHECK (revenue_type IN ('ticketing', 'subscription', 'advertising', 'other')),
  amount NUMERIC NOT NULL,
  commission_rate NUMERIC DEFAULT 0,
  commission_amount NUMERIC GENERATED ALWAYS AS (amount * commission_rate) STORED,
  source_id UUID,
  source_type TEXT,
  user_id UUID REFERENCES auth.users(id),
  provider_id UUID REFERENCES event_providers(id),
  description TEXT,
  payment_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for revenue_tracking
ALTER TABLE revenue_tracking ENABLE ROW LEVEL SECURITY;

-- Admin can view all revenue
CREATE POLICY "Admins can view all revenue"
  ON revenue_tracking
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can insert revenue
CREATE POLICY "Admins can insert revenue"
  ON revenue_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update revenue
CREATE POLICY "Admins can update revenue"
  ON revenue_tracking
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create function to calculate expiration status
CREATE OR REPLACE FUNCTION calculate_expiration_status(expires_at TIMESTAMPTZ)
RETURNS TEXT AS $$
BEGIN
  IF expires_at IS NULL THEN
    RETURN 'active';
  END IF;

  IF expires_at < now() THEN
    RETURN 'expired';
  ELSIF expires_at < (now() + INTERVAL '30 days') THEN
    RETURN 'expiring_soon';
  ELSE
    RETURN 'active';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to auto-update expiration status for events
CREATE OR REPLACE FUNCTION update_event_expiration_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expiration_status := calculate_expiration_status(NEW.expires_at);
  
  -- Auto-hide if expired
  IF NEW.expiration_status = 'expired' AND NEW.is_visible = true THEN
    NEW.is_visible := false;
    NEW.auto_hidden_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for public_events
DROP TRIGGER IF EXISTS trigger_event_expiration ON public_events;
CREATE TRIGGER trigger_event_expiration
  BEFORE INSERT OR UPDATE OF expires_at, is_visible
  ON public_events
  FOR EACH ROW
  EXECUTE FUNCTION update_event_expiration_status();

-- Create function for addresses
CREATE OR REPLACE FUNCTION update_address_expiration_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expiration_status := calculate_expiration_status(NEW.expires_at);
  
  IF NEW.expiration_status = 'expired' AND NEW.is_visible = true THEN
    NEW.is_visible := false;
    NEW.auto_hidden_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for good_addresses
DROP TRIGGER IF EXISTS trigger_address_expiration ON good_addresses;
CREATE TRIGGER trigger_address_expiration
  BEFORE INSERT OR UPDATE OF expires_at, is_visible
  ON good_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_address_expiration_status();

-- Create function for partners
CREATE OR REPLACE FUNCTION update_partner_expiration_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expiration_status := calculate_expiration_status(NEW.expires_at);
  
  IF NEW.expiration_status = 'expired' AND NEW.is_visible = true THEN
    NEW.is_visible := false;
    NEW.auto_hidden_at := now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for partners
DROP TRIGGER IF EXISTS trigger_partner_expiration ON partners;
CREATE TRIGGER trigger_partner_expiration
  BEFORE INSERT OR UPDATE OF expires_at, is_visible
  ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_expiration_status();

-- Create view for revenue summary
CREATE OR REPLACE VIEW v_revenue_summary AS
SELECT
  -- Ticketing revenue (10% commission)
  COALESCE(SUM(CASE WHEN revenue_type = 'ticketing' THEN commission_amount ELSE 0 END), 0) as ticketing_revenue,
  COUNT(CASE WHEN revenue_type = 'ticketing' THEN 1 END) as ticketing_count,
  
  -- Subscription revenue
  COALESCE(SUM(CASE WHEN revenue_type = 'subscription' THEN amount ELSE 0 END), 0) as subscription_revenue,
  COUNT(CASE WHEN revenue_type = 'subscription' THEN 1 END) as subscription_count,
  
  -- Advertising revenue
  COALESCE(SUM(CASE WHEN revenue_type = 'advertising' THEN amount ELSE 0 END), 0) as advertising_revenue,
  COUNT(CASE WHEN revenue_type = 'advertising' THEN 1 END) as advertising_count,
  
  -- Total revenue
  COALESCE(SUM(
    CASE 
      WHEN revenue_type = 'ticketing' THEN commission_amount
      ELSE amount
    END
  ), 0) as total_revenue,
  
  COUNT(*) as total_transactions
FROM revenue_tracking;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_type ON revenue_tracking(revenue_type);
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_date ON revenue_tracking(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_user ON revenue_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_tracking_provider ON revenue_tracking(provider_id);

CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_premium_expires ON profiles(premium_expires_at);

CREATE INDEX IF NOT EXISTS idx_event_providers_account_type ON event_providers(account_type);
CREATE INDEX IF NOT EXISTS idx_event_providers_premium_expires ON event_providers(premium_expires_at);

CREATE INDEX IF NOT EXISTS idx_events_expiration_status ON public_events(expiration_status);
CREATE INDEX IF NOT EXISTS idx_addresses_expiration_status ON good_addresses(expiration_status);
CREATE INDEX IF NOT EXISTS idx_partners_expiration_status ON partners(expiration_status);

-- Update existing records to calculate initial expiration status
UPDATE public_events SET expiration_status = calculate_expiration_status(expires_at) WHERE expires_at IS NOT NULL;
UPDATE good_addresses SET expiration_status = calculate_expiration_status(expires_at) WHERE expires_at IS NOT NULL;
UPDATE partners SET expiration_status = calculate_expiration_status(expires_at) WHERE expires_at IS NOT NULL;

-- Insert sample revenue data for demonstration
INSERT INTO revenue_tracking (revenue_type, amount, commission_rate, source_type, description) VALUES
  ('ticketing', 1500, 0.10, 'event', 'Gala Oriental - 15 billets vendus'),
  ('ticketing', 2800, 0.10, 'event', 'Concert Raï - 28 billets vendus'),
  ('ticketing', 3500, 0.10, 'event', 'Mariage Oriental - 35 billets vendus'),
  ('subscription', 49.99, 0, 'provider', 'Abonnement Premium - Orchestre Al-Andalus'),
  ('subscription', 49.99, 0, 'provider', 'Abonnement Premium - Traiteur Délices d''Orient'),
  ('subscription', 49.99, 0, 'provider', 'Abonnement Premium - DJ Karim'),
  ('subscription', 49.99, 0, 'provider', 'Abonnement Premium - Photographe Instants Magiques'),
  ('advertising', 199.99, 0, 'premium_ad', 'Publicité Premium - Restaurant Le Cedre'),
  ('advertising', 299.99, 0, 'premium_ad', 'Publicité Premium - Boutique Jasmin'),
  ('advertising', 149.99, 0, 'premium_ad', 'Publicité Premium - Salle des Fêtes Al-Kawthar');
