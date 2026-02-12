/*
  # Système de messagerie et notifications client

  1. Nouvelles Tables
    - `client_messages`
      - Messages entre clients et administrateurs/prestataires
      - Conversations groupées
      - Statut lu/non lu
      - Support des pièces jointes
    
    - `client_notifications`
      - Notifications système pour les clients
      - Types: booking, payment, message, system
      - Priorités et statuts
    
    - `client_activity_log`
      - Journal d'activité du client
      - Suivi des actions importantes

  2. Sécurité
    - RLS activé sur toutes les tables
    - Clients ne voient que leurs données
    - Admins ont accès complet
*/

-- Table des messages clients
CREATE TABLE IF NOT EXISTS client_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject text,
  message text NOT NULL,
  attachment_url text,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  message_type text DEFAULT 'general' CHECK (message_type IN ('general', 'booking', 'support', 'system')),
  related_booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des notifications clients
CREATE TABLE IF NOT EXISTS client_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text DEFAULT 'system' CHECK (notification_type IN ('booking', 'payment', 'message', 'system', 'promo')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read boolean DEFAULT false,
  read_at timestamptz,
  action_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Table du journal d'activité client
CREATE TABLE IF NOT EXISTS client_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Activer RLS
ALTER TABLE client_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_activity_log ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour client_messages
CREATE POLICY "Users can view their own messages"
  ON client_messages
  FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() OR 
    recipient_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can send messages"
  ON client_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Admins can send messages to anyone"
  ON client_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can mark their messages as read"
  ON client_messages
  FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Politiques RLS pour client_notifications
CREATE POLICY "Users can view their own notifications"
  ON client_notifications
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can create notifications"
  ON client_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can mark their notifications as read"
  ON client_notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Politiques RLS pour client_activity_log
CREATE POLICY "Users can view their own activity"
  ON client_activity_log
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can log activity"
  ON client_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_client_messages_sender ON client_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_recipient ON client_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_conversation ON client_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_read ON client_messages(is_read);

CREATE INDEX IF NOT EXISTS idx_client_notifications_user ON client_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_client_notifications_read ON client_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_client_notifications_type ON client_notifications(notification_type);

CREATE INDEX IF NOT EXISTS idx_client_activity_user ON client_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_client_activity_type ON client_activity_log(activity_type);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_client_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_client_messages_updated_at
  BEFORE UPDATE ON client_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_client_messages_updated_at();

-- Données de test
DO $$
DECLARE
  admin_id uuid;
  client_id uuid;
BEGIN
  -- Récupérer l'admin
  SELECT id INTO admin_id FROM profiles WHERE role = 'admin' LIMIT 1;
  
  -- Récupérer un client
  SELECT id INTO client_id FROM profiles WHERE role = 'client' LIMIT 1;
  
  IF admin_id IS NOT NULL AND client_id IS NOT NULL THEN
    -- Créer des notifications de bienvenue
    INSERT INTO client_notifications (user_id, title, message, notification_type, priority)
    VALUES
      (client_id, 'Bienvenue sur ALTESS', 'Merci d''avoir rejoint notre plateforme. Explorez nos services !', 'system', 'normal'),
      (client_id, 'Promotion Spéciale', 'Profitez de -15% sur votre première réservation avec le code ALTESS15', 'promo', 'high');
  END IF;
END $$;
