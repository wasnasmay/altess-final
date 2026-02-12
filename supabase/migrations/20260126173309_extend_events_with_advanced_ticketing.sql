/*
  # Extension Système de Billetterie Avancée - Place de Marché Événementielle

  ## Vue d'ensemble
  Extension de la table public_events pour supporter une billetterie multi-catégories
  avec gestion des quotas, prix par catégorie, et politique d'annulation.

  ## 1. Extensions à public_events
  
  ### Nouveaux champs:
  - `ticket_categories` (jsonb) - Catégories de billets avec quotas et prix
    Structure: [{ name, price, quota, sold }]
  - `total_quota` (integer) - Quota total de billets
  - `tickets_sold` (integer) - Nombre total de billets vendus
  - `rules` (jsonb) - Conditions de réservation personnalisées
  - `cancellation_policy` (text) - Politique d'annulation
  - `is_auto_accept` (boolean) - Acceptation automatique des réservations
  - `booking_deadline` (timestamptz) - Date limite de réservation
  - `min_tickets_per_order` (integer) - Minimum de billets par commande
  - `max_tickets_per_order` (integer) - Maximum de billets par commande
  - `stripe_price_id` (text) - ID du prix Stripe (si applicable)
  
  ## 2. Nouvelles Tables
  
  ### `event_bookings`
  Réservations de billets pour les événements
  - `id` (uuid, PK)
  - `event_id` (uuid, FK)
  - `customer_id` (uuid, FK auth.users)
  - `customer_email` (text)
  - `customer_name` (text)
  - `customer_phone` (text)
  - `tickets` (jsonb) - Détails des billets achetés par catégorie
  - `total_tickets` (integer) - Nombre total de billets
  - `total_amount` (numeric) - Montant total payé
  - `status` (text) - pending, confirmed, cancelled, refunded
  - `payment_status` (text) - pending, succeeded, failed
  - `stripe_session_id` (text)
  - `stripe_payment_intent_id` (text)
  - `booking_reference` (text) - Référence unique de réservation
  - `notes` (text) - Notes du client
  
  ### `event_notifications`
  Notifications envoyées aux organisateurs
  - `id` (uuid, PK)
  - `event_id` (uuid, FK)
  - `booking_id` (uuid, FK)
  - `recipient_id` (uuid, FK auth.users)
  - `notification_type` (text) - new_booking, cancellation, reminder
  - `is_read` (boolean)
  - `email_sent` (boolean)
  
  ## 3. Sécurité RLS
  - Annonceurs peuvent gérer leurs événements
  - Clients peuvent voir leurs propres réservations
  - Public peut voir les événements actifs
  
  ## 4. Indexes de Performance
  - Recherche par événement
  - Recherche par client
  - Référence de réservation
*/

-- =====================================================
-- EXTENSION: public_events
-- =====================================================

-- Ajouter les nouveaux champs à public_events
DO $$
BEGIN
  -- ticket_categories: structure JSON pour les catégories de billets
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'public_events' AND column_name = 'ticket_categories'
  ) THEN
    ALTER TABLE public_events ADD COLUMN ticket_categories jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- total_quota: quota total de billets
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'public_events' AND column_name = 'total_quota'
  ) THEN
    ALTER TABLE public_events ADD COLUMN total_quota integer DEFAULT 0;
  END IF;

  -- tickets_sold: nombre de billets vendus
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'public_events' AND column_name = 'tickets_sold'
  ) THEN
    ALTER TABLE public_events ADD COLUMN tickets_sold integer DEFAULT 0;
  END IF;

  -- rules: conditions personnalisées
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'public_events' AND column_name = 'rules'
  ) THEN
    ALTER TABLE public_events ADD COLUMN rules jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- cancellation_policy: politique d'annulation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'public_events' AND column_name = 'cancellation_policy'
  ) THEN
    ALTER TABLE public_events ADD COLUMN cancellation_policy text;
  END IF;

  -- is_auto_accept: acceptation auto des réservations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'public_events' AND column_name = 'is_auto_accept'
  ) THEN
    ALTER TABLE public_events ADD COLUMN is_auto_accept boolean DEFAULT true;
  END IF;

  -- booking_deadline: date limite de réservation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'public_events' AND column_name = 'booking_deadline'
  ) THEN
    ALTER TABLE public_events ADD COLUMN booking_deadline timestamptz;
  END IF;

  -- min_tickets_per_order
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'public_events' AND column_name = 'min_tickets_per_order'
  ) THEN
    ALTER TABLE public_events ADD COLUMN min_tickets_per_order integer DEFAULT 1;
  END IF;

  -- max_tickets_per_order
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'public_events' AND column_name = 'max_tickets_per_order'
  ) THEN
    ALTER TABLE public_events ADD COLUMN max_tickets_per_order integer DEFAULT 10;
  END IF;

  -- stripe_price_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'public_events' AND column_name = 'stripe_price_id'
  ) THEN
    ALTER TABLE public_events ADD COLUMN stripe_price_id text;
  END IF;

  -- organizer_id: lien vers le profil de l'organisateur
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'public_events' AND column_name = 'organizer_id'
  ) THEN
    ALTER TABLE public_events ADD COLUMN organizer_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- =====================================================
-- TABLE: event_bookings
-- =====================================================

CREATE TABLE IF NOT EXISTS event_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Événement et client
  event_id uuid REFERENCES public_events(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES auth.users(id),
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text,
  
  -- Détails des billets
  tickets jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_tickets integer NOT NULL DEFAULT 0,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  
  -- Statut
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'succeeded', 'failed', 'refunded')),
  
  -- Stripe
  stripe_session_id text,
  stripe_payment_intent_id text,
  
  -- Référence unique
  booking_reference text UNIQUE NOT NULL,
  
  -- Notes
  notes text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_bookings_event ON event_bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_event_bookings_customer ON event_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_event_bookings_reference ON event_bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_event_bookings_stripe_session ON event_bookings(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_event_bookings_status ON event_bookings(status, payment_status);

-- =====================================================
-- TABLE: event_notifications
-- =====================================================

CREATE TABLE IF NOT EXISTS event_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Références
  event_id uuid REFERENCES public_events(id) ON DELETE CASCADE NOT NULL,
  booking_id uuid REFERENCES event_bookings(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES auth.users(id) NOT NULL,
  
  -- Type et contenu
  notification_type text NOT NULL CHECK (notification_type IN ('new_booking', 'cancellation', 'reminder', 'update')),
  title text NOT NULL,
  message text NOT NULL,
  
  -- Statut
  is_read boolean DEFAULT false,
  email_sent boolean DEFAULT false,
  email_sent_at timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_notifications_recipient ON event_notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_event_notifications_event ON event_notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_event_notifications_booking ON event_notifications(booking_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES: event_bookings
-- =====================================================

-- Clients peuvent voir leurs propres réservations
CREATE POLICY "Users can read own bookings"
  ON event_bookings FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- Organisateurs peuvent voir les réservations de leurs événements
CREATE POLICY "Organizers can read event bookings"
  ON event_bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public_events 
      WHERE id = event_bookings.event_id 
      AND (organizer_id = auth.uid() OR created_by = auth.uid())
    )
  );

-- Admins peuvent voir toutes les réservations
CREATE POLICY "Admins can read all bookings"
  ON event_bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Utilisateurs authentifiés peuvent créer des réservations
CREATE POLICY "Authenticated users can create bookings"
  ON event_bookings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Organisateurs et admins peuvent mettre à jour les réservations
CREATE POLICY "Organizers can update bookings"
  ON event_bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public_events 
      WHERE id = event_bookings.event_id 
      AND (organizer_id = auth.uid() OR created_by = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- =====================================================
-- POLICIES: event_notifications
-- =====================================================

-- Utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can read own notifications"
  ON event_notifications FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

-- Système peut créer des notifications
CREATE POLICY "Authenticated users can create notifications"
  ON event_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Utilisateurs peuvent marquer leurs notifications comme lues
CREATE POLICY "Users can update own notifications"
  ON event_notifications FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Fonction pour générer une référence de réservation unique
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS text AS $$
DECLARE
  ref text;
  exists boolean;
BEGIN
  LOOP
    ref := 'BK-' || upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM event_bookings WHERE booking_reference = ref) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN ref;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour le compteur de billets vendus
CREATE OR REPLACE FUNCTION update_tickets_sold()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.payment_status = 'succeeded') OR 
     (TG_OP = 'UPDATE' AND NEW.payment_status = 'succeeded' AND OLD.payment_status != 'succeeded') THEN
    -- Incrémenter le compteur
    UPDATE public_events
    SET tickets_sold = tickets_sold + NEW.total_tickets
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Décrémenter le compteur en cas d'annulation
    UPDATE public_events
    SET tickets_sold = GREATEST(0, tickets_sold - NEW.total_tickets)
    WHERE id = NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour le compteur de billets
DROP TRIGGER IF EXISTS update_tickets_sold_trigger ON event_bookings;
CREATE TRIGGER update_tickets_sold_trigger
AFTER INSERT OR UPDATE ON event_bookings
FOR EACH ROW
EXECUTE FUNCTION update_tickets_sold();

-- Trigger updated_at pour event_bookings
DROP TRIGGER IF EXISTS set_updated_at_event_bookings ON event_bookings;
CREATE TRIGGER set_updated_at_event_bookings
BEFORE UPDATE ON event_bookings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON TABLE event_bookings IS 'Réservations de billets pour les événements publics';
COMMENT ON TABLE event_notifications IS 'Notifications pour les organisateurs d''événements';

COMMENT ON COLUMN public_events.ticket_categories IS 'Catégories de billets avec quotas et prix: [{ name, price, quota, sold }]';
COMMENT ON COLUMN public_events.rules IS 'Conditions de réservation personnalisées';
COMMENT ON COLUMN public_events.cancellation_policy IS 'Politique d''annulation de l''événement';
COMMENT ON COLUMN public_events.is_auto_accept IS 'Acceptation automatique des réservations sans validation manuelle';
COMMENT ON COLUMN event_bookings.booking_reference IS 'Référence unique de la réservation (ex: BK-ABC12345)';
COMMENT ON COLUMN event_bookings.tickets IS 'Détails des billets par catégorie: [{ category, quantity, price }]';
