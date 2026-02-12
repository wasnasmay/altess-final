/*
  # Système White Label pour Organisateurs - ALTESS Prestige
  
  1. Nouvelles Tables
    - `event_organizers` : Profil complet organisateur avec branding
    - `promo_codes` : Codes promotionnels par organisateur
    - `ticket_purchases` : Achats de billets détaillés
    - `organizer_sales_stats` : Statistiques de ventes quotidiennes
    
  2. Modifications
    - Ajout de `organizer_id` dans `public_events`
    - Configuration white label et réseaux sociaux
    
  3. Sécurité
    - RLS activé sur toutes les tables
*/

-- Table des organisateurs avec système white label
CREATE TABLE IF NOT EXISTS event_organizers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identité & Branding
  company_name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  brand_color text DEFAULT '#F59E0B',
  
  -- Contact & Réseaux Sociaux
  email text NOT NULL,
  phone text,
  website text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  twitter_url text,
  linkedin_url text,
  
  -- Tracking & Analytics
  facebook_pixel_id text,
  google_analytics_id text,
  google_ads_conversion_id text,
  
  -- Configuration Mini-Site
  custom_domain text,
  show_altess_branding boolean DEFAULT true,
  allow_ticket_transfer boolean DEFAULT true,
  enable_waitlist boolean DEFAULT true,
  
  -- Commission & Paiement
  commission_rate decimal DEFAULT 5.0,
  stripe_account_id text,
  bank_details jsonb,
  
  -- Statistiques
  total_events integer DEFAULT 0,
  total_tickets_sold integer DEFAULT 0,
  total_revenue decimal DEFAULT 0,
  
  -- Statut
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  verified boolean DEFAULT false,
  premium_tier text DEFAULT 'standard' CHECK (premium_tier IN ('standard', 'premium', 'enterprise')),
  
  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login_at timestamptz
);

-- Table des codes promo
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid REFERENCES event_organizers(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public_events(id) ON DELETE CASCADE,
  
  -- Code
  code text NOT NULL,
  description text,
  
  -- Type de réduction
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value decimal NOT NULL,
  
  -- Limites
  max_uses integer,
  current_uses integer DEFAULT 0,
  max_uses_per_customer integer DEFAULT 1,
  minimum_purchase_amount decimal DEFAULT 0,
  
  -- Validité
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  
  -- Statut
  is_active boolean DEFAULT true,
  
  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(organizer_id, code, event_id)
);

-- Table des achats de billets
CREATE TABLE IF NOT EXISTS ticket_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relations
  event_id uuid REFERENCES public_events(id) ON DELETE CASCADE,
  organizer_id uuid REFERENCES event_organizers(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  promo_code_id uuid REFERENCES promo_codes(id) ON DELETE SET NULL,
  
  -- Informations client (OBLIGATOIRES)
  customer_email text NOT NULL,
  customer_first_name text NOT NULL,
  customer_last_name text NOT NULL,
  customer_phone text,
  
  -- Détails du billet
  ticket_type text NOT NULL,
  ticket_tier_name text,
  quantity integer NOT NULL DEFAULT 1,
  
  -- Tarification
  unit_price decimal NOT NULL,
  discount_amount decimal DEFAULT 0,
  total_price decimal NOT NULL,
  service_fee decimal DEFAULT 0,
  final_amount decimal NOT NULL,
  
  -- Code unique du billet
  ticket_number text UNIQUE NOT NULL,
  qr_code_data text,
  
  -- Statut
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'cancelled')),
  ticket_status text DEFAULT 'valid' CHECK (ticket_status IN ('valid', 'used', 'cancelled', 'transferred')),
  
  -- Tracking
  used_at timestamptz,
  scanned_by uuid REFERENCES auth.users(id),
  
  -- Paiement Stripe
  stripe_payment_intent_id text,
  stripe_charge_id text,
  
  -- Tracking pixels
  conversion_tracked boolean DEFAULT false,
  conversion_value decimal,
  
  -- Métadonnées
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des statistiques de ventes
CREATE TABLE IF NOT EXISTS organizer_sales_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid REFERENCES event_organizers(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public_events(id) ON DELETE CASCADE,
  
  -- Période
  stat_date date NOT NULL,
  
  -- Ventes
  tickets_sold integer DEFAULT 0,
  revenue decimal DEFAULT 0,
  service_fees decimal DEFAULT 0,
  net_revenue decimal DEFAULT 0,
  
  -- Par type de billet
  standard_tickets_sold integer DEFAULT 0,
  vip_tickets_sold integer DEFAULT 0,
  invitation_tickets_used integer DEFAULT 0,
  
  -- Codes promo
  promo_discount_total decimal DEFAULT 0,
  promo_codes_used integer DEFAULT 0,
  
  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(organizer_id, event_id, stat_date)
);

-- Ajouter colonnes à public_events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'public_events' AND column_name = 'organizer_id'
  ) THEN
    ALTER TABLE public_events ADD COLUMN organizer_id uuid REFERENCES event_organizers(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'public_events' AND column_name = 'show_in_public_feed'
  ) THEN
    ALTER TABLE public_events ADD COLUMN show_in_public_feed boolean DEFAULT true;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'public_events' AND column_name = 'allow_public_discovery'
  ) THEN
    ALTER TABLE public_events ADD COLUMN allow_public_discovery boolean DEFAULT true;
  END IF;
END $$;

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_organizers_slug ON event_organizers(slug);
CREATE INDEX IF NOT EXISTS idx_organizers_status ON event_organizers(status);
CREATE INDEX IF NOT EXISTS idx_promo_codes_organizer ON promo_codes(organizer_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_event ON promo_codes(event_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON ticket_purchases(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_organizer ON ticket_purchases(organizer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_customer_email ON ticket_purchases(customer_email);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON ticket_purchases(payment_status, ticket_status);
CREATE INDEX IF NOT EXISTS idx_sales_stats_organizer_date ON organizer_sales_stats(organizer_id, stat_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON public_events(organizer_id);

-- RLS Policies

-- event_organizers
ALTER TABLE event_organizers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active organizers"
  ON event_organizers FOR SELECT
  TO public
  USING (status = 'active');

CREATE POLICY "Organizers can view own profile"
  ON event_organizers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Organizers can update own profile"
  ON event_organizers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- promo_codes
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can manage own promo codes"
  ON promo_codes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_organizers 
      WHERE id = promo_codes.organizer_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active promo codes"
  ON promo_codes FOR SELECT
  TO public
  USING (is_active = true AND valid_until > now());

-- ticket_purchases
ALTER TABLE ticket_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own tickets"
  ON ticket_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR customer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Organizers can view their event tickets"
  ON ticket_purchases FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_organizers 
      WHERE id = ticket_purchases.organizer_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Public can create ticket purchases"
  ON ticket_purchases FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Organizers can update ticket status"
  ON ticket_purchases FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_organizers 
      WHERE id = ticket_purchases.organizer_id 
      AND user_id = auth.uid()
    )
  );

-- organizer_sales_stats
ALTER TABLE organizer_sales_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizers can view own stats"
  ON organizer_sales_stats FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM event_organizers 
      WHERE id = organizer_sales_stats.organizer_id 
      AND user_id = auth.uid()
    )
  );

-- Fonction pour générer un numéro de billet unique
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text AS $$
DECLARE
  new_ticket_number text;
  exists_check boolean;
BEGIN
  LOOP
    new_ticket_number := 'ALTESS-' || upper(substring(md5(random()::text) from 1 for 12));
    
    SELECT EXISTS(SELECT 1 FROM ticket_purchases WHERE ticket_number = new_ticket_number) INTO exists_check;
    
    EXIT WHEN NOT exists_check;
  END LOOP;
  
  RETURN new_ticket_number;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour les statistiques
CREATE OR REPLACE FUNCTION update_organizer_stats()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.payment_status = 'paid') THEN
    UPDATE event_organizers
    SET 
      total_tickets_sold = total_tickets_sold + NEW.quantity,
      total_revenue = total_revenue + NEW.final_amount,
      updated_at = now()
    WHERE id = NEW.organizer_id;
    
    INSERT INTO organizer_sales_stats (
      organizer_id,
      event_id,
      stat_date,
      tickets_sold,
      revenue,
      service_fees,
      net_revenue
    ) VALUES (
      NEW.organizer_id,
      NEW.event_id,
      CURRENT_DATE,
      NEW.quantity,
      NEW.total_price,
      NEW.service_fee,
      NEW.final_amount
    )
    ON CONFLICT (organizer_id, event_id, stat_date)
    DO UPDATE SET
      tickets_sold = organizer_sales_stats.tickets_sold + NEW.quantity,
      revenue = organizer_sales_stats.revenue + NEW.total_price,
      service_fees = organizer_sales_stats.service_fees + NEW.service_fee,
      net_revenue = organizer_sales_stats.net_revenue + NEW.final_amount;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS update_organizer_stats_trigger ON ticket_purchases;
CREATE TRIGGER update_organizer_stats_trigger
AFTER INSERT OR UPDATE ON ticket_purchases
FOR EACH ROW
EXECUTE FUNCTION update_organizer_stats();

-- Données de test
INSERT INTO event_organizers (
  user_id,
  company_name,
  slug,
  email,
  phone,
  instagram_url,
  facebook_url,
  verified,
  premium_tier
) 
SELECT
  id,
  'Oriental Prestige Events',
  'oriental-prestige',
  'contact@orientalprestige.com',
  '+33612345678',
  'https://instagram.com/orientalprestige',
  'https://facebook.com/orientalprestige',
  true,
  'premium'
FROM auth.users 
WHERE email LIKE '%@%'
ORDER BY created_at DESC
LIMIT 1
ON CONFLICT (slug) DO NOTHING;

INSERT INTO event_organizers (
  user_id,
  company_name,
  slug,
  email,
  phone,
  instagram_url,
  facebook_url,
  verified,
  premium_tier
) 
SELECT
  id,
  'Maghreb Events VIP',
  'maghreb-events-vip',
  'info@maghrebevents.com',
  '+33698765432',
  'https://instagram.com/maghrebevents',
  'https://facebook.com/maghrebevents',
  true,
  'standard'
FROM auth.users 
WHERE email LIKE '%@%'
ORDER BY created_at DESC
LIMIT 1
ON CONFLICT (slug) DO NOTHING;
